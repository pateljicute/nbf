'use server';

import { Redis } from '@upstash/redis';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

// Helper to create context-aware Supabase client
async function getSupabaseClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // Handle cookie setting error
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        // Handle cookie removal error
                    }
                },
            },
        }
    );
}

// Global admin client for status checks (using service role or anon key if missing)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const globalSupabase = createSupabaseClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Helper to check ban status locally
async function checkUserBanned(userId: string) {
    const supabase = await getSupabaseClient();
    const { data } = await supabase.from('users').select('is_banned').eq('id', userId).single();
    return data?.is_banned || false;
}

export async function checkAdminStatus(userId: string): Promise<boolean> {
    // SERVER-SIDE SECURITY CHECK
    if (!userId) return false;

    const cacheKey = `auth:admin:${userId}`;

    // 1. Check Redis Cache
    if (redis) {
        try {
            const cachedStatus = await redis.get(cacheKey);
            if (cachedStatus !== null) {
                return Boolean(cachedStatus);
            }
        } catch (error) {
            console.warn('Redis cache error:', error);
        }
    }

    // 2. Check Supabase Database
    try {
        // Use global client for checking admin status (public table)
        const { data, error } = await globalSupabase
            .from("admin_users")
            .select("user_id")
            .eq("user_id", userId)
            .single();

        const isAdmin = !!data && !error;

        // 3. Cache the result
        if (redis) {
            try {
                await redis.set(cacheKey, isAdmin, { ex: 300 });
            } catch (error) {
                console.warn('Redis set error:', error);
            }
        }

        return isAdmin;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Admin action to update product status
export async function updateProductStatusAction(
    productId: string,
    availableForSale: boolean,
    adminUserId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await checkAdminStatus(adminUserId);
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        // Use context-aware client to leverage RLS policies
        const supabase = await getSupabaseClient();

        const newStatus = availableForSale ? 'approved' : 'inactive';

        const { data, error } = await supabase
            .from('properties')
            .update({
                available_for_sale: availableForSale,
                status: newStatus
            })
            .eq('id', productId)
            .select()
            .maybeSingle();

        if (error) {
            console.error('Error updating product status:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error in updateProductStatusAction:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

// Admin action to approve product
export async function approveProductAction(
    productId: string,
    adminUserId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await checkAdminStatus(adminUserId);
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        // Use context-aware client
        const supabase = await getSupabaseClient();

        // 1. Get current tags (legacy cleanup)
        const { data: product, error: fetchError } = await supabase
            .from('properties')
            .select('tags, handle')
            .eq('id', productId)
            .maybeSingle();

        if (fetchError || !product) {
            return { success: false, error: 'Property not found' };
        }

        // 2. Remove 'pending_approval' tag (legacy cleanup)
        const newTags = (product.tags || []).filter((t: string) => t !== 'pending_approval');

        // 3. Update property status
        const { error: updateError } = await supabase
            .from('properties')
            .update({
                tags: newTags,
                available_for_sale: true,
                status: 'approved'
            })
            .eq('id', productId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        // 4. Trigger SEO Content Generation (Background Task)
        // We do not await this to fail the approval, but we await it to ensure it runs in the serverless lifecycle
        // or we can use `waitUntil` if available in Next.js (newer versions), but simple await is safer here.
        try {
            await generateSEOContentAction(productId);
        } catch (seoError) {
            console.error('SEO Generation failed (Non-critical):', seoError);
        }

        // 5. Trigger Google Indexing (Automation)
        try {
            const { notifyGoogleIndexing } = await import('@/lib/google-indexing');
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nbfhomes.in';
            // Assuming handle is available or constructed. 
            // We need to fetch handle if not in hand. properties table has it.
            if (product.handle) { // If fetched above, waiting to verify if 'tags' select included 'handle'
                await notifyGoogleIndexing(`${siteUrl}/product/${product.handle}`, 'URL_UPDATED');
            } else {
                // Re-fetch handle if missing
                const { data: fullProp } = await supabase.from('properties').select('handle').eq('id', productId).single();
                if (fullProp?.handle) {
                    await notifyGoogleIndexing(`${siteUrl}/product/${fullProp.handle}`, 'URL_UPDATED');
                }
            }
        } catch (idxError) {
            console.warn('Indexing trigger failed (Non-critical):', idxError);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error in approveProductAction:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

export async function generateSEOContentAction(productId: string) {
    const GEN_AI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    if (!GEN_AI_API_KEY) {
        console.warn('Skipping SEO Generation: No API Key found.');
        return;
    }

    const supabase = await getSupabaseClient();
    const { data: property } = await supabase
        .from('properties')
        .select('title, city, locality, type, user_id, tags')
        .eq('id', productId)
        .single();

    if (!property) return;

    // construct prompt
    const location = property.locality || property.city || 'Mandsaur';
    const city = property.city || 'Mandsaur';
    const type = property.type || 'Property';

    const prompt = `
    You are a Local SEO Expert for NBF Homes.
    Write a unique "Local Area Guide" (150-200 words) for the location: ${location}, ${city}.
    Context: A user is looking for a ${type} (${property.title}).
    
    Requirements:
    1. Content must be unique, helpful, and written in a professional yet inviting tone.
    2. Naturally include these keywords: "Rent in ${location}", "Best PG in ${city}", "NBF Homes", "affordable housing", "student friendly".
    3. Also generate a "Meta Description" (max 150 chars) summarizing this.
    
    Output Format: JSON only.
    {
      "local_area_guide": "html content with <p> tags...",
      "seo_description": "plain text meta description..."
    }
    `;

    try {
        const payload = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        const response = await fetch(`${API_URL}?key=${GEN_AI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Gemini API Error');

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        // simple json cleanup
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (parsed.local_area_guide) {
            await supabase.from('properties').update({
                local_area_guide: parsed.local_area_guide,
                seo_description: parsed.seo_description
            }).eq('id', productId);
            console.log(`SEO Content Generated for ${productId}`);
        }

    } catch (error) {
        console.error('Error generating SEO content:', error);
    }
}

// Admin action to reject product
export async function rejectProductAction(
    productId: string,
    adminUserId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await checkAdminStatus(adminUserId);
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const supabase = await getSupabaseClient();

        // Update property status to rejected and inactive
        const { error } = await supabase
            .from('properties')
            .update({
                available_for_sale: false,
                status: 'rejected'
            })
            .eq('id', productId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error in rejectProductAction:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

// Admin action to delete product (Zero-Residual Delete)
export async function adminDeleteProductAction(
    productId: string,
    adminUserId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await checkAdminStatus(adminUserId);
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const supabase = await getSupabaseClient();

        // STEP 1: Image Retrieval & Storage Cleanup
        // We fetch the property first to get its images
        const { data: property, error: fetchError } = await supabase
            .from('properties')
            .select('images')
            .eq('id', productId)
            .single();

        if (fetchError) {
            // If property doesn't exist, we can't delete it, but it's effectively "gone" or already deleted.
            // We'll proceed to try delete anyway to be safe, or return error.
            if (fetchError.code !== 'PGRST116') { // PGRST116 is 'not found'
                console.error('Error fetching property for deletion:', fetchError);
            }
        }

        if (property && property.images && Array.isArray(property.images)) {
            const imagePaths: string[] = property.images
                .map((url: string) => {
                    // Extract path from Supabase URL if applicable
                    // Pattern: .../storage/v1/object/public/properties/folder/file.jpg
                    try {
                        if (url.includes('/properties/')) {
                            return url.split('/properties/')[1]; // Get path after bucket name
                        } else if (url.includes('cloudinary.com')) {
                            // Cloudinary URL - Server-side delete requires API Secret.
                            // Marking as SKIPPED unless secrets provided.
                            // console.warn('Skipping Cloudinary delete: No server credentials');
                            return null;
                        }
                        return null;
                    } catch (e) { return null; }
                })
                .filter((p): p is string => p !== null);

            if (imagePaths.length > 0) {
                console.log(`[Zero-Residual] Deleting ${imagePaths.length} files from storage...`);
                // STEP 2: Storage Cleanup
                const { error: storageError } = await supabase.storage
                    .from('properties')
                    .remove(imagePaths);

                if (storageError) {
                    console.error('[Zero-Residual] Storage cleanup warning:', storageError);
                    // We LOG but do not Halt. "Resilient Delete" means we proceed to DB delete guarantees no orphan rows.
                } else {
                    console.log('[Zero-Residual] Storage cleanup successful');
                }
            }
        }

        // STEP 3: Database Deletion (Row + Cascade)
        // With ON DELETE CASCADE enabled in DB, this single call removes views/leads/favorites.
        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', productId);

        if (error) {
            return { success: false, error: error.message };
        }

        console.log('[Zero-Residual] Property and related data deleted successfully.');
        return { success: true };
    } catch (error: any) {
        console.error('Error in adminDeleteProductAction:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

// User Actions
export async function updateUserRoleAction(userId: string, role: string, adminUserId: string) {
    const isAdmin = await checkAdminStatus(adminUserId);
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await getSupabaseClient();
    const { error } = await supabase.from('users').update({ role }).eq('id', userId);

    // Also sync with admin_users table for backward compatibility if role is admin
    if (role === 'admin') {
        const { error: adminError } = await globalSupabase.from('admin_users').upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });
        if (adminError) console.error("Error syncing admin user:", adminError);
    } else {
        // If downgrading, remove from admin_users
        const { error: deleteError } = await globalSupabase.from('admin_users').delete().eq('user_id', userId);
        if (deleteError) console.error("Error removing admin user:", deleteError);
    }

    return { success: !error, error: error?.message };
}

export async function toggleUserVerifiedAction(userId: string, isVerified: boolean, adminUserId: string) {
    const isAdmin = await checkAdminStatus(adminUserId);
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await getSupabaseClient();
    const { error } = await supabase.from('users').update({ is_verified: isVerified }).eq('id', userId);
    return { success: !error, error: error?.message };
}

export async function togglePropertyVerifiedAction(propertyId: string, isVerified: boolean, adminUserId: string) {
    const isAdmin = await checkAdminStatus(adminUserId);
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await getSupabaseClient();
    const { error } = await supabase.from('properties').update({ is_verified: isVerified }).eq('id', propertyId);
    return { success: !error, error: error?.message };
}

// ... existing ad actions ...

// Settings Actions
export async function updateSiteSettingsAction(settings: Record<string, string>, adminUserId: string) {
    const isAdmin = await checkAdminStatus(adminUserId);
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await getSupabaseClient();
    const upserts = Object.entries(settings).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from('site_settings').upsert(upserts);
    return { success: !error, error: error?.message };
}

export async function deleteAdAction(adminUserId: string) {
    const isAdmin = await checkAdminStatus(adminUserId);
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await getSupabaseClient();

    // We clear the ad fields but keep the row (or delete it, but clearing is safer for IDs)
    // Actually, SQL script used a fixed ID. Let's just update fields to empty/inactive.
    const { error } = await supabase
        .from('ads')
        .update({
            media_url: '',
            media_type: 'image', // reset to default
            cta_text: '',
            cta_link: '',
            is_active: false
        })
        .eq('id', '00000000-0000-0000-0000-000000000001');

    if (error) {
        console.error('Error deleting ad:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Ad Actions
export async function getAdSettingsAction() {
    try {
        const supabase = await getSupabaseClient(); // Public read access
        const { data, error } = await supabase.from('ads').select('*').limit(1).single();

        if (error) {
            if (error.code === 'PGRST116') {
                return { success: true, data: null };
            }
            console.error('Error fetching ad settings:', JSON.stringify(error, null, 2));
            return { success: false, error: error.message };
        }
        return { success: true, data };
    } catch (error: any) {
        // Handle fetch/network errors (ECONNRESET etc)
        console.error('Exception in getAdSettingsAction:', error);
        return { success: false, error: error.message || 'Network error' };
    }
}

export async function updateAdSettingsAction(adData: { media_url: string; media_type: 'image' | 'video'; cta_text: string; cta_link: string; is_active: boolean }, adminUserId: string) {
    const isAdmin = await checkAdminStatus(adminUserId);
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await getSupabaseClient();

    // We update the single row (assuming ID is known or we just update the first one)
    // Actually, best to fetch the ID first or just upsert with a fixed ID if we enforced it in SQL
    // In SQL we inserted '00000000-0000-0000-0000-000000000001'. Let's use that.

    const { error } = await supabase
        .from('ads')
        .update(adData)
        .eq('id', '00000000-0000-0000-0000-000000000001');

    if (error) {
        // Fallback if ID doesn't exist (though SQL script should have created it)
        const { error: insertError } = await supabase.from('ads').insert({
            id: '00000000-0000-0000-0000-000000000001',
            ...adData
        });
        if (insertError) return { success: false, error: insertError.message };
    }

    return { success: true };
}

export async function submitInquiryAction(data: {
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
    message: string;
    phoneNumber?: string;
    propertyId?: string;
}) {
    try {
        const supabase = await getSupabaseClient();

        // BAN CHECK
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const isBanned = await checkUserBanned(user.id);
            if (isBanned) {
                return { success: false, error: "Your account has been restricted. Contact the nbfhomes.in team for assistance." };
            }
        }

        const { error } = await supabase.from('inquiries').insert({
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            subject: data.subject,
            message: data.message,
            phone_number: data.phoneNumber,
            property_id: data.propertyId
        });

        if (error) {
            console.error('Error inserting inquiry:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error in submitInquiryAction:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

export async function updateLeadStatusAction(leadId: string, status: string) {
    try {
        const supabase = await getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Unauthorized' };

        const { error } = await supabase
            .from('leads_activity')
            .update({ status })
            .eq('id', leadId);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error updating lead status:', error);
        return { success: false, error: error.message };
    }
}

export async function trackLeadActivity(data: { propertyId: string, actionType: 'whatsapp' | 'contact', ownerId?: string | null }) {
    console.log(`[TrackLead] Starting for property ${data.propertyId} action ${data.actionType} owner ${data.ownerId}`);
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error('[TrackLead] No user found');
        return { success: false, error: 'Not authenticated' };
    }

    // BAN CHECK
    const isBanned = await checkUserBanned(user.id);
    if (isBanned) {
        return { success: false, error: "Your account has been restricted. Contact the nbfhomes.in team for assistance." };
    }

    try {
        const payload: any = {
            property_id: data.propertyId,
            user_id: user.id,
            action_type: data.actionType,
            status: 'new'
        };

        // Only add owner_id if it's a valid UUID
        if (data.ownerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.ownerId)) {
            payload.owner_id = data.ownerId;
        } else if (data.ownerId) {
            console.warn(`[TrackLead] Invalid owner UUID disregarded: ${data.ownerId}`);
        }

        console.log('[TrackLead] Inserting payload:', payload);

        const { data: result, error } = await supabase
            .from('leads_activity')
            .insert(payload)
            .select();

        if (error) {
            console.error('[TrackLead] Insert Error:', error);
            throw error;
        }

        console.log('[TrackLead] Insert Success:', result);
        return { success: true };
    } catch (error) {
        console.error('[TrackLead] Exception:', error);
        return { success: false, error: 'Failed to record activity' };
    }
}

export async function trackPropertyView(propertyId: string) {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    try {
        console.log(`[TrackView] Recording view for user ${user.id} property ${propertyId}`);
        const { error } = await supabase
            .from('property_views')
            .insert({
                property_id: propertyId,
                user_id: user.id
            });

        if (error) {
            console.error('[TrackView] Error:', error);
        } else {
            console.log('[TrackView] Success');
        }
    } catch (err) {
        console.error('[TrackView] Exception:', err);
    }
}

export async function saveAdminSubscription(subscription: string) {
    try {
        const supabase = await getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Not authenticated');

        const isAdmin = await checkAdminStatus(user.id);
        if (!isAdmin) throw new Error('Not authorized');

        const { error } = await supabase
            .from('admin_settings')
            .upsert({
                user_id: user.id,
                push_subscription: JSON.parse(subscription),
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error saving subscription:', error);
        return { success: false, error: error.message };
    }
}

export async function sendNewPropertyNotificationAction(propertyTitle: string, propertyLocation: string, propertyPrice: string) {
    try {
        const { sendAdminPushNotification } = await import('@/lib/notifications');
        await sendAdminPushNotification({
            title: `New Pending Property: ${propertyTitle}`,
            body: `Location: ${propertyLocation} | Price: ₹${propertyPrice}`,
            url: `/admin`
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to trigger admin notification:', error);
        return { success: false };
    }
}




export async function banUserAction(userId: string, reason: string, adminUserId: string) {
    try {
        const isAdmin = await checkAdminStatus(adminUserId);
        if (!isAdmin) return { success: false, error: 'Unauthorized' };

        // Reverting to authenticated client (Service Role Key missing in env)
        const supabase = await getSupabaseClient();

        // 1. Update User Status (Sync both users and profiles tables)
        const { error: banError } = await supabase
            .from('users')
            .update({
                is_banned: true,
                ban_reason: reason
            })
            .eq('id', userId);

        if (banError) throw banError;

        // Sync to profiles table as requested
        // Sync to profiles table remove as "users" is the source of truth
        // (Snippet removed to fix PGRST205 error)

        // 2. Hide all user properties (Optional: if we rely on filter, this isn't strictly needed, 
        // but setting them to inactive ensures they don't show up in direct queries bypassing filters)
        // However, user asked for visibility filter. Let's do both for safety.
        // We will set available_for_sale = false for all their properties.
        const { error: propError } = await supabase
            .from('properties')
            .update({ available_for_sale: false, status: 'inactive' })
            .eq('user_id', userId);

        if (propError) console.warn('Failed to auto-hide properties for banned user:', propError);

        revalidatePath('/admin');
        revalidatePath('/'); // Clear home cache if necessary
        return { success: true };
    } catch (error: any) {
        console.error('Error banning user:', error);
        return { success: false, error: error.message };
    }
}

export async function unbanUserAction(userId: string, adminUserId: string) {
    try {
        const isAdmin = await checkAdminStatus(adminUserId);
        if (!isAdmin) return { success: false, error: 'Unauthorized' };

        // Reverting to authenticated client
        const supabase = await getSupabaseClient();

        const { error } = await supabase
            .from('users')
            .update({
                is_banned: false,
                ban_reason: null
            })
            .eq('id', userId);

        if (error) throw error;

        // Sync to profiles table
        // Sync to profiles table removed
        // (Snippet removed to fix PGRST205 error)
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        console.error('Error unbanning user:', error);
        return { success: false, error: error.message };
    }
}

// Server Action for securely creating a property with Ban Checks
export async function createPropertyAction(data: any) {
    try {
        const supabase = await getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }

        // 1. STRICT BAN CHECK (Database Level via Helper)
        const isBanned = await checkUserBanned(user.id);
        if (isBanned) {
            // EXACT MESSAGE REQUIRED BY USER
            return {
                success: false,
                error: 'Your posting feature has been blocked for security reasons. Contact the nbfhomes.in team for assistance.'
            };
        }

        // 1.5 Rate Limit Check
        const { data: userData } = await supabase
            .from('users')
            .select('last_posted_at')
            .eq('id', user.id)
            .single();

        if (userData?.last_posted_at) {
            const lastPosted = new Date(userData.last_posted_at).getTime();
            const now = new Date().getTime();
            const diffMinutes = (now - lastPosted) / 1000 / 60;
            if (diffMinutes < 5) {
                return { success: false, error: `Please wait ${Math.ceil(5 - diffMinutes)} minutes before posting another property.` };
            }
        }

        // 2. Prepare Data
        const tags = [
            data.type || 'PG',
            data.location || '',
            data.address || '',
            ...(data.tags || [])
        ].filter(Boolean);

        const insertData = {
            title: data.title,
            description: data.description,
            price_range: {
                "minVariantPrice": { "amount": String(data.price || 0), "currencyCode": "INR" }
            },
            "price": String(data.price || 0),
            currency_code: 'INR',
            images: data.images?.map((url: string) => ({ url, altText: data.title })) || [],
            tags: tags,
            available_for_sale: false,
            status: 'pending',
            user_id: user.id,
            "userId": user.id,
            "contactNumber": data.contactNumber,
            "bathroomType": data.bathroom_type || data.bathroomType,
            "securityDeposit": data.securityDeposit?.toString() || '0',
            "electricityStatus": data.electricityStatus,
            "tenantPreference": data.tenantPreference,
            "location": data.location,
            "address": data.address,
            "type": data.type,
            latitude: data.latitude,
            longitude: data.longitude,
            "googleMapsLink": data.googleMapsLink,
            amenities: data.amenities,
            featured_image: data.images?.[0] ? { url: data.images[0], altText: data.title } : null
        };

        // 3. Insert Property
        const { data: insertedProperty, error } = await supabase
            .from('properties')
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;

        // 4. Update Rate Limit
        await supabase.from('users').update({ last_posted_at: new Date().toISOString() }).eq('id', user.id);

        // 5. Send Notification (fire and forget)
        try {
            await sendNewPropertyNotificationAction(
                insertedProperty.title,
                insertedProperty.location,
                insertedProperty.price?.toString() || '0'
            );
        } catch (e) {
            console.warn('Failed to send notification', e);
        }

        // Return the simplified object expected by the UI (or the full product)
        return { success: true, data: insertedProperty };

    } catch (error: any) {
        console.error('Error in createPropertyAction:', error);
        return { success: false, error: error.message || 'Failed to create property' };
    }
}
