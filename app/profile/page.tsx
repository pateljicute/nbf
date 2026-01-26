'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { User, LogOut, MapPin, Phone, Mail, Building, Edit, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { getUserProducts, deleteProduct, updateProduct } from '@/lib/api';
import { Product } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { QRPosterModal } from '@/components/unique/qr-poster-modal'; // New Import
import Image from 'next/image';

export default function ProfilePage() {
    const { user, logout, isLoading, session } = useAuth();
    const router = useRouter();
    const [properties, setProperties] = useState<Product[]>([]);
    const [loadingProperties, setLoadingProperties] = useState(true);
    const [editingProperty, setEditingProperty] = useState<Product | null>(null);
    const [qrPosterProperty, setQrPosterProperty] = useState<Product | null>(null); // New State
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [isLogoutLoading, setIsLogoutLoading] = useState(false);

    const [isMounted, setIsMounted] = useState(false);

    // Create client only once using useMemo to prevent multiple instances
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        setIsMounted(true);
        if (!isLoading && !user) {
            router.push('/');
        }

        // Anti-Crash: Force reload once to clear stale JS chunks if they exist
        if (typeof window !== 'undefined') {
            const hasReloaded = sessionStorage.getItem('nbf_cache_fix_reloaded_v2');
            if (!hasReloaded) {
                sessionStorage.setItem('nbf_cache_fix_reloaded_v2', 'true');
                window.location.reload();
            }
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const fetchUserProperties = async () => {
            if (user) {
                try {
                    const userProps = await getUserProducts(user.id);
                    setProperties(userProps);
                } catch (error) {
                    console.error('Error fetching properties:', error);
                } finally {
                    setLoadingProperties(false);
                }
            }
        };

        if (user) {
            fetchUserProperties();

            const channel = supabase
                .channel('profile-properties-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'properties',
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        console.log('Real-time update received:', payload);
                        fetchUserProperties();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user, supabase]);

    // Prevent hydration mismatch by showing loading state until mounted on client
    if (!isMounted || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

    if (!user) return null;

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteProduct(id, session?.access_token);
            setProperties(properties.filter(p => p.id !== id));
            setDeleteConfirm(null);
            toast.success('Property deleted successfully');
        } catch (error: any) {
            console.error('Error deleting property:', error);
            toast.error(error.message || 'Failed to delete property');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="min-h-screen bg-neutral-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8"
        >
            {qrPosterProperty && (
                <QRPosterModal
                    isOpen={!!qrPosterProperty}
                    onClose={() => setQrPosterProperty(null)}
                    property={qrPosterProperty}
                    user={user}
                />
            )}
            <div className="max-w-5xl mx-auto space-y-4 md:space-y-8">

                {/* Profile Header - Compact Mobile */}
                <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-neutral-200 overflow-hidden relative group">
                    <div className="h-20 md:h-32 bg-gradient-to-r from-neutral-200 to-neutral-100"></div>

                    {/* Mobile Sign Out (Absolute Top Right) */}
                    <button
                        onClick={handleLogout}
                        className="md:hidden absolute top-2 right-2 p-2.5 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors z-10 shadow-sm"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>

                    <div className="px-4 md:px-8 pb-4 md:pb-8">
                        <div className="relative flex flex-row items-end -mt-8 md:-mt-12 mb-4 md:mb-6 gap-3 md:gap-6">
                            <div className="relative w-16 h-16 md:w-32 md:h-32 rounded-full border-[3px] md:border-4 border-white bg-neutral-100 overflow-hidden shadow-md shrink-0">
                                {user.user_metadata?.avatar_url ? (
                                    <Image
                                        src={user.user_metadata.avatar_url || '/placeholder-avatar.png'}
                                        alt={user.user_metadata?.full_name || 'User'}
                                        width={128}
                                        height={128}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                        <User className="w-8 h-8 md:w-16 md:h-16" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 mb-1 md:mb-2">
                                <h1 className="text-lg md:text-2xl font-semibold text-neutral-700 line-clamp-1">
                                    {user.user_metadata?.full_name || user.user_metadata?.name || 'NBFHOMES User'}
                                </h1>
                                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                                    <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                                        Personal
                                    </span>
                                    <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100">
                                        Active
                                    </span>
                                </div>
                            </div>

                            {/* Desktop Sign Out */}
                            <button
                                onClick={async () => {
                                    try {
                                        setIsLogoutLoading(true);
                                        await handleLogout();
                                    } finally {
                                        // No need to set false as we redirect, but safe practice
                                        // setIsLogoutLoading(false); 
                                    }
                                }}
                                disabled={isLogoutLoading}
                                className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors mb-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLogoutLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <LogOut className="w-4 h-4" />
                                )}
                                {isLogoutLoading ? 'Signing Out...' : 'Sign Out'}
                            </button>
                        </div>

                        {/* Mobile Stats Grid (Re-added & Compact) */}
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-100 md:hidden">
                            <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-100">
                                <p className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">Listings</p>
                                <p className="text-lg font-black text-neutral-900 leading-none mt-1">{properties.length}</p>
                            </div>
                            {/* Views Removed */}
                        </div>

                        {/* Desktop Stats (Hidden on Mobile) */}
                        <div className="hidden md:grid grid-cols-3 gap-6 pt-6 border-t border-neutral-100">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Listings</p>
                                <p className="text-2xl font-bold text-neutral-900">{properties.length}</p>
                            </div>
                            {/* Views Removed as per request */}
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Member Since</p>
                                <p className="text-sm font-medium text-neutral-900">
                                    {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Sidebar - Navigation/Stats */}
                    <div className="space-y-6 hidden lg:block">
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                            <h3 className="font-medium text-neutral-900 mb-4">Dashboard</h3>
                            <nav className="space-y-1">
                                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-black bg-neutral-50 rounded-lg">
                                    <Building className="w-4 h-4" />
                                    My Properties
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-black rounded-lg transition-colors">
                                    <MapPin className="w-4 h-4" />
                                    Saved Locations
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-black rounded-lg transition-colors">
                                    <Phone className="w-4 h-4" />
                                    Contact Support
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content - My Properties */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 md:p-6">
                            <div className="flex items-center justify-between mb-4 md:mb-6">
                                <h2 className="text-base md:text-lg font-bold text-neutral-900">My Properties</h2>
                                <button
                                    onClick={() => router.push('/post-property')}
                                    className="text-xs md:text-sm font-medium text-black hover:underline bg-neutral-100 px-3 py-1.5 rounded-full"
                                >
                                    + Post New
                                </button>
                            </div>

                            {loadingProperties ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                                </div>
                            ) : properties.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {properties.map((property) => (
                                        <div key={property.id} className="group relative border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                            <div className="flex sm:block h-28 sm:h-auto">
                                                {/* Image (Left on Mobile, Top on Desktop) */}
                                                <div className="w-28 sm:w-full sm:aspect-square shrink-0 bg-neutral-200 relative">
                                                    {property.featuredImage && (
                                                        <Image
                                                            src={property.featuredImage.url}
                                                            alt={property.featuredImage.altText || property.title}
                                                            fill
                                                            className="object-cover object-center"
                                                            sizes="(max-width: 640px) 112px, 300px"
                                                        />
                                                    )}
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 hidden sm:block">
                                                        <span className="text-white text-xs font-bold">
                                                            ₹{Number(property.price || property.priceRange?.minVariantPrice?.amount || 0).toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Details (Right on Mobile, Bottom on Desktop) */}
                                                <div className="p-3 flex flex-col justify-between flex-1 min-w-0">
                                                    <div>
                                                        <h3 className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-1">
                                                            <a href={`/product/${property.handle}`}>
                                                                <span aria-hidden="true" className="absolute inset-0 sm:hidden" />
                                                                {property.title}
                                                            </a>
                                                        </h3>
                                                        <p className="mt-0.5 text-[10px] sm:text-xs text-neutral-500 line-clamp-1">
                                                            {property.address || property.location || 'Mandsaur, MP'}
                                                        </p>
                                                        <div className="mt-1 flex items-center gap-2 sm:hidden">
                                                            <span className="text-xs font-bold text-black">
                                                                ₹{Number(property.price || property.priceRange?.minVariantPrice?.amount || 0).toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="mt-2 flex gap-2 relative z-10 w-full">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                router.push(`/post-property?edit=${property.id}`);
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold uppercase text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setQrPosterProperty(property);
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold uppercase text-purple-700 bg-purple-50 hover:bg-purple-100 rounded transition-colors"
                                                        >
                                                            <Download className="w-3 h-3" />
                                                            Poster
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setDeleteConfirm(property.id);
                                                            }}
                                                            className="flex items-center justify-center px-2 py-1.5 text-red-700 bg-red-50 hover:bg-red-100 rounded transition-colors"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Empty State */
                                <div className="text-center py-12 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                                    <Building className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                                    <h3 className="text-sm font-medium text-neutral-900">No properties listed yet</h3>
                                    <p className="text-sm text-neutral-500 mt-1 mb-4">Start earning by listing your property today.</p>
                                    <button
                                        onClick={() => router.push('/post-property')}
                                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                                    >
                                        Post Property
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-medium text-neutral-900 mb-2">Delete Property?</h3>
                        <p className="text-sm text-neutral-600 mb-6">
                            Are you sure you want to delete this property? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
