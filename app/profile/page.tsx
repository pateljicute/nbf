'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User, LogOut, MapPin, Phone, Mail, Building, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { getUserProducts, deleteProduct, updateProduct } from '@/lib/api';
import { Product } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
    const { user, logout, isLoading, session } = useAuth();
    const router = useRouter();
    const [properties, setProperties] = useState<Product[]>([]);
    const [loadingProperties, setLoadingProperties] = useState(true);
    const [editingProperty, setEditingProperty] = useState<Product | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
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

    if (isLoading) {
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
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Profile Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="h-32 bg-neutral-900"></div>
                    <div className="px-4 md:px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-12 mb-6">
                            <div className="flex items-end gap-4 md:gap-6">
                                <div className="relative w-24 h-24 rounded-full border-4 border-white bg-neutral-100 overflow-hidden shadow-md shrink-0">
                                    {user.user_metadata?.avatar_url ? (
                                        <img
                                            src={user.user_metadata.avatar_url}
                                            alt={user.user_metadata?.full_name || 'User'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                            <User className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>
                                <div className="mb-1">
                                    <h1 className="text-xl md:text-2xl font-serif font-medium text-neutral-900 line-clamp-1">
                                        {user.user_metadata?.full_name || user.user_metadata?.name || 'NBFHOMES User'}
                                    </h1>
                                    <p className="text-sm text-neutral-500 flex items-center gap-2">
                                        <Mail className="w-3 h-3 shrink-0" />
                                        <span className="truncate max-w-[150px] md:max-w-none">{user.email}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>

                        {/* Mobile Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="md:hidden w-full flex items-center justify-center gap-2 px-4 py-3 mb-6 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-neutral-100">
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Account Type</span>
                                <p className="text-sm font-medium text-neutral-900">Personal Account</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Member Since</span>
                                <p className="text-sm font-medium text-neutral-900">
                                    {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Sidebar - Navigation/Stats */}
                    <div className="space-y-6">
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
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-medium text-neutral-900">My Properties</h2>
                                <button
                                    onClick={() => router.push('/post-property')}
                                    className="text-sm font-medium text-black hover:underline"
                                >
                                    + Post New Property
                                </button>
                            </div>

                            {loadingProperties ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                                </div>
                            ) : properties.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {properties.map((property) => (
                                        <div key={property.id} className="group relative border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                            <div className="aspect-square w-full overflow-hidden bg-neutral-200 relative">
                                                {property.featuredImage && (
                                                    <img
                                                        src={property.featuredImage.url}
                                                        alt={property.featuredImage.altText}
                                                        className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                )}
                                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold">
                                                    ₹{Number(property.priceRange.minVariantPrice.amount).toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="text-sm font-medium text-neutral-900">
                                                    <a href={`/product/${property.handle}`}>
                                                        <span aria-hidden="true" className="absolute inset-0" />
                                                        {property.title}
                                                    </a>
                                                </h3>
                                                <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{property.description}</p>
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {property.tags?.slice(0, 2).map(tag => (
                                                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-3 flex gap-2 relative z-10">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            router.push(`/post-property?edit=${property.id}`);
                                                        }}
                                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setDeleteConfirm(property.id);
                                                        }}
                                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        Delete
                                                    </button>
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
