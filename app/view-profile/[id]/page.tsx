import { createClient } from '@/lib/supabase/client';
import { getSupabaseClient } from '@/app/actions';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Mail, User, Home, ArrowRight } from 'lucide-react';

// Revalidate every minute
export const revalidate = 60;

async function getUserProfile(userId: string) {
    const supabase = await getSupabaseClient();

    // 1. Get User Details
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !user) return null;

    // 2. Get User Properties
    const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'approved') // Only show approved properties
        .order('created_at', { ascending: false });

    return { user, properties: properties || [] };
}

export default async function ViewProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const profile = await getUserProfile(id);

    if (!profile) {
        return notFound();
    }

    const { user, properties } = profile;

    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            {/* Header / Cover */}
            <div className="bg-black text-white py-12 px-4 shadow-md">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center text-4xl font-bold uppercase border-4 border-neutral-700">
                        {user.full_name ? user.full_name[0] : <User />}
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-bold">{user.full_name || 'NBF User'}</h1>
                        {/* Email removed for privacy as requested */}
                        {user.phone && (
                            <p className="text-neutral-400 mt-1 flex items-center justify-center md:justify-start gap-2">
                                <Phone className="w-4 h-4" /> {user.phone}
                            </p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                            <span className="px-3 py-1 bg-neutral-800 rounded-full text-xs font-bold text-green-400 border border-green-900">
                                Verified Agent
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Properties Grid */}
            <div className="max-w-4xl mx-auto px-4 mt-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Available Properties ({properties.length})
                </h2>

                {properties.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-neutral-300">
                        <p className="text-neutral-500">No active properties listed.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {properties.map((property: any) => (
                            <Link href={`/product/${property.handle}`} key={property.id} className="block group">
                                <div className="bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-sm hover:shadow-md transition-all">
                                    <div className="h-48 bg-neutral-200 relative">
                                        {property.featured_image && (
                                            <Image
                                                src={property.featured_image?.url || property.featured_image}
                                                alt={property.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        )}
                                        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                                            {property.listing_type === 'sell' ? (
                                                <span className="bg-[#e8202a] text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 w-max">
                                                    For Sale
                                                </span>
                                            ) : (
                                                <span className="bg-black text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 w-max">
                                                    For Rent
                                                </span>
                                            )}
                                        </div>
                                        <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
                                            <span className="bg-white/95 text-neutral-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm">
                                                ₹ {Number(property.price).toLocaleString('en-IN')}{property.listing_type !== 'sell' && '/month'}
                                            </span>
                                            {property.original_price && property.listing_type === 'sell' && (
                                                <span className="bg-white/80 text-neutral-500 px-2 py-0.5 rounded-full text-[10px] font-bold line-through backdrop-blur-sm">
                                                    ₹ {Number(property.original_price).toLocaleString('en-IN')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 relative">
                                        <h3 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                            {property.title}
                                        </h3>
                                        <p className="text-sm text-neutral-500 flex items-center gap-1 mb-2">
                                            <MapPin className="w-3 h-3" />
                                            {property.location || property.city || 'Location'}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {property.tags && property.tags.slice(0, 3).map((tag: string) => (
                                                <span key={tag} className="px-2 py-1 bg-neutral-100 rounded text-[10px] font-bold text-neutral-600 uppercase">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Sticky/Fixed Footer Button: NBF HOMES PROPERTY FORM VISIT */}
            <div className="bg-white border-t border-neutral-200 fixed bottom-0 left-0 right-0 p-4 z-20 md:static md:bg-transparent md:border-t-0 md:p-8 md:mt-8">
                <div className="max-w-4xl mx-auto">
                    <Link
                        href="/properties"
                        className="flex items-center justify-center w-full gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-lg py-5 rounded-2xl shadow-xl shadow-blue-600/30 hover:shadow-blue-600/40 active:scale-[0.98] transition-all transform"
                    >
                        <span>Explore All Properties on NBF HOMES</span>
                        <ArrowRight className="w-6 h-6" />
                    </Link>
                </div>
            </div>

            {/* Mobile Spacer */}
            <div className="h-24 md:hidden" />
        </div>
    );
}
