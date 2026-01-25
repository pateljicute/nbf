import { createClient } from '@supabase/supabase-js';
import { getUserProducts } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Tag, ArrowRight } from 'lucide-react';
import { notFound } from 'next/navigation';

// Initialize Supabase client for server-side fetching
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Force dynamic rendering since we rely on params
export const dynamic = 'force-dynamic';

export async function generateMetadata(props: { params: Promise<{ ownerId: string }> }) {
    const params = await props.params;
    const { ownerId } = params;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    let ownerName = 'Property Owner';
    let location = 'Mandsaur';
    let ogImage = 'https://www.nbfhomes.in/og-image.jpg';

    try {
        // 1. Fetch Owner Name
        let { data: userData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', ownerId)
            .single();

        if (!userData) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('first_name, last_name, username')
                .eq('id', ownerId)
                .single();

            if (profileData) {
                userData = {
                    full_name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || profileData.username || 'Property Owner'
                } as any;
            }
        }

        if (userData?.full_name) {
            ownerName = userData.full_name;
        }

        // 2. Fetch Location from First Active Property
        const { data: propertyData } = await supabase
            .from('properties')
            .select('city, locality, images')
            .eq('user_id', ownerId)
            .eq('available_for_sale', true)
            .limit(1)
            .single();

        if (propertyData) {
            if (propertyData.city) location = propertyData.city;
            else if (propertyData.locality) location = propertyData.locality;

            // Use property image for OG if available
            if (propertyData.images && propertyData.images.length > 0) {
                //@ts-ignore
                const img = propertyData.images[0];
                if (typeof img === 'string') ogImage = img;
                else if (img.url) ogImage = img.url;
            }
        }

    } catch (e) {
        console.error('Error generating metadata:', e);
    }

    const title = `${ownerName} - Property Catalog | nbfhomes.in`;
    const description = `View all rental properties listed by ${ownerName} in ${location}, Mandsaur. Find the best rooms and houses directly from the owner.`;

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            type: 'profile',
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: ownerName,
                },
            ],
        },
    };
}

export default async function OwnerCatalogPage(props: { params: Promise<{ ownerId: string }> }) {
    const params = await props.params;
    const { ownerId } = params;

    // 1. Fetch Owner Details (Name/Branding)
    let ownerName = 'Property Owner';
    try {
        // Try 'users' table
        let { data: userData, error: userError } = await supabase
            .from('users')
            .select('full_name, id, email')
            .eq('id', ownerId)
            .single();

        if (userError || !userData) {
            // Fallback to 'profiles' table if user not found in public.users
            const { data: profileData } = await supabase
                .from('profiles')
                .select('first_name, last_name, username')
                .eq('id', ownerId)
                .single();

            if (profileData) {
                userData = {
                    full_name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || profileData.username || 'Property Owner'
                } as any;
            }
        }

        if (userData) {
            ownerName = userData.full_name || 'Property Owner';
        }
    } catch (e) {
        console.error('Error fetching owner details:', e);
    }

    // 2. Fetch User Properties
    const properties = await getUserProducts(ownerId);

    // Sort to show active/verified first if needed, but getUserProducts returns raw list.
    // Ensure we only show available properties for a catalog view usually, but requested "All My Properties".
    // Typically a public catalog should show 'Available' ones.
    const displayProperties = properties.filter(p => p.availableForSale);

    if (!displayProperties || displayProperties.length === 0) {
        return (
            <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-2xl font-bold text-neutral-900 mb-2">{ownerName}</h1>
                <p className="text-neutral-500 mb-8">No active properties found in this catalog.</p>
                <Link href="/properties" className="px-6 py-3 bg-black text-white rounded-lg font-bold">
                    Explore NBF HOMES
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 pb-24">
            {/* 1. Header: Owner Branding */}
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">PROPERTY CATALOG</p>
                        <h1 className="text-xl md:text-2xl font-black text-neutral-900 leading-tight">
                            {ownerName}
                        </h1>
                    </div>
                </div>
            </header>

            {/* 2. Property Grid */}
            <main className="max-w-3xl mx-auto px-4 py-6">
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
                    {displayProperties.map((property) => (
                        <Link
                            key={property.id}
                            href={`/product/${property.handle}`}
                            className="group block bg-white rounded-xl overflow-hidden shadow-sm border border-neutral-200 hover:shadow-md transition-all active:scale-[0.98]"
                        >
                            {/* Image Container */}
                            <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                                {property.featuredImage?.url ? (
                                    <Image
                                        src={property.featuredImage.url}
                                        alt={property.featuredImage.altText || property.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                        <Building2 className="w-12 h-12" />
                                    </div>
                                )}

                                {/* Price Tag - Top Right Overlay */}
                                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-lg shadow-lg">
                                    <span className="text-sm font-bold">
                                        ₹{parseInt(property.priceRange.minVariantPrice.amount).toLocaleString('en-IN')}
                                    </span>
                                </div>

                                {/* Status Badge if needed */}
                                <div className="absolute top-3 left-3">
                                    <span className="bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded text-neutral-900 border border-white/20 shadow-sm">
                                        {property.availableForSale ? 'FOR RENT' : 'UNAVAILABLE'}
                                    </span>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="p-4">
                                <h3 className="text-lg font-bold text-neutral-900 leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                    {property.title}
                                </h3>

                                <div className="space-y-2">
                                    {/* Location */}
                                    <div className="flex items-start gap-2 text-neutral-500">
                                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span className="text-sm line-clamp-1">{(property.tags || []).find(t => t.length > 3) || 'Location Unavailable'}</span>
                                    </div>

                                    {/* Categories/Tags */}
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {(property.tags || []).slice(0, 2).map(tag => (
                                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-md font-medium">
                                                <Tag className="w-3 h-3" />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>

            {/* 3. Footer Button */}
            <div className="bg-white border-t border-neutral-200 fixed bottom-0 left-0 right-0 p-4 z-20 md:static md:bg-transparent md:border-t-0 md:p-0 md:pt-8 md:mb-12">
                <div className="max-w-3xl mx-auto md:px-4">
                    <Link
                        href="/properties"
                        className="flex items-center justify-center w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-transform"
                    >
                        <span>Explore All Properties on NBF HOMES</span>
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            {/* Add extra padding for mobile fixed footer */}
            <div className="h-24 md:hidden" />
        </div>
    );
}

function Building2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
        </svg>
    );
}
