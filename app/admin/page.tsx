'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Trash2, Eye, Users, Building, TrendingUp, ChevronLeft, ChevronRight, Search, Filter, CheckCircle, XCircle, Download, Info } from 'lucide-react';
// ... imports
// ... imports
import { checkAdminStatus, updateProductStatusAction, approveProductAction, rejectProductAction, adminDeleteProductAction, updateUserRoleAction, toggleUserVerifiedAction, togglePropertyVerifiedAction, updateSiteSettingsAction } from '@/app/actions';
// ...



import { Product } from '@/lib/types';
import { QRPosterModal } from '@/components/unique/qr-poster-modal';
import { UserPropertiesModal } from '@/components/admin/UserPropertiesModal';
import UserInfoModal from '@/components/admin/UserInfoModal';
import { getAdminProducts, getAdminStats, getAdminUsers, getSiteSettings, getUserPropertiesForAdmin, banUser } from '@/lib/api';
import { getOptimizedImageUrl } from '@/lib/cloudinary-utils';
import { AdManager } from '@/components/admin/ad-manager';

// ... existing code ...

interface AdminUser {
    userId: string;
    name: string;
    email: string;
    contactNumber: string;
    role: string;
    isVerified: boolean;
    totalProperties: number;
    activeProperties: number;
    profession: string;
    status: string;
}

function timeAgo(dateString?: string) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Handle future dates or tiny differences
    if (seconds < 5) return 'Just now';

    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'week', seconds: 604800 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 }
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
        }
    }
    return 'Just now';
}

export default function AdminPage() {
    // ... states ...
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [properties, setProperties] = useState<Product[]>([]);
    const [usersList, setUsersList] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminChecked, setAdminChecked] = useState(false);
    const [stats, setStats] = useState({ total: 0, users: 0, active: 0 });
    const [qrPosterProperty, setQrPosterProperty] = useState<Product | null>(null);

    // User Properties Modal State
    const [selectedUserForProperties, setSelectedUserForProperties] = useState<{ id: string, name: string } | null>(null);
    const [userProperties, setUserProperties] = useState<Product[]>([]);
    const [userPropertiesLoading, setUserPropertiesLoading] = useState(false);

    // User Info Modal State
    const [selectedUserForInfo, setSelectedUserForInfo] = useState<AdminUser | null>(null);

    // New Filter States
    const [cityFilter, setCityFilter] = useState('');
    const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
    const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

    // Settings State
    const [settings, setSettings] = useState({
        homepage_title: '',
        homepage_description: '',
        whatsapp_number: ''
    });

    // Pagination & Filter state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'users' | 'approvals' | 'settings' | 'ads'>('overview');

    const ITEMS_PER_PAGE = 10;

    // Fetch Products with new filters
    const fetchProducts = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const data = await getAdminProducts(page, ITEMS_PER_PAGE, searchQuery, statusFilter, cityFilter, minPrice, maxPrice);
            setProperties(data.products);
            setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
            setCurrentPage(page);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter, cityFilter, minPrice, maxPrice]);

    // Fetch Users with search
    const fetchUsers = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const data = await getAdminUsers(page, ITEMS_PER_PAGE, searchQuery); // Pass search query
            setUsersList(data.users);
            setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
            setCurrentPage(page);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    // Fetch Settings
    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getSiteSettings();
            setSettings({
                homepage_title: data.homepage_title || '',
                homepage_description: data.homepage_description || '',
                whatsapp_number: data.whatsapp_number || ''
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // ... Check Admin Logic ...

    const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'vendor' | 'user') => {
        if (!user) return;
        if (!confirm(`Change user role to ${newRole}?`)) return;
        const res = await updateUserRoleAction(userId, newRole, user.id);
        if (res.success) fetchUsers(currentPage);
        else alert('Failed to update role');
    };

    const handleUserVerify = async (userId: string, status: boolean) => {
        if (!user) return;
        const res = await toggleUserVerifiedAction(userId, status, user.id);
        if (res.success) fetchUsers(currentPage);
        else alert('Failed to verify user');
    };

    const handlePropertyVerify = async (propertyId: string, status: boolean) => {
        if (!user) return;
        const res = await togglePropertyVerifiedAction(propertyId, status, user.id);
        if (res.success) fetchProducts(currentPage);
        else alert('Failed to verify property');
    };

    const handleSettingsSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        const res = await updateSiteSettingsAction(settings, user.id);
        if (res.success) alert('Settings saved successfully');
        else alert('Failed to save settings');
    };

    const handleUserPropertiesClick = async (userId: string, userName: string) => {
        setSelectedUserForProperties({ id: userId, name: userName });
        setUserPropertiesLoading(true);
        try {
            const props = await getUserPropertiesForAdmin(userId);
            setUserProperties(props);
        } catch (err) {
            console.error(err);
            alert('Failed to load user properties');
        } finally {
            setUserPropertiesLoading(false);
        }
    };

    const handleBanUser = async (userId: string) => {
        if (!confirm('Are you sure you want to ban this user? They will not be able to login.')) return;

        try {
            const res = await banUser(userId);
            if (res.success) {
                // Update local state
                setUsersList(usersList.map(u => u.userId === userId ? { ...u, status: 'banned' } : u));
                alert('User banned successfully');
            } else {
                alert('Failed to ban user');
            }
        } catch (error) {
            console.error(error);
            alert('Error banning user');
        }
    };

    // ... Render ...

    // (I will output the Full Render Logic in the next chunks, focusing on Tabs first)


    const checkAdmin = useCallback(async () => {
        if (!user) return;

        const adminStatus = await checkAdminStatus(user.id);
        setIsAdmin(adminStatus);
        setAdminChecked(true);

        if (adminStatus) {
            fetchStats();
        }
    }, [user, router]);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
        } else if (user) {
            checkAdmin();
        }
    }, [user, isLoading, router, checkAdmin]);

    useEffect(() => {
        if (adminChecked && !isAdmin) {
            alert('Access Denied: Admin only');
            router.push('/');
        }
    }, [adminChecked, isAdmin, router]);

    // Debounce search
    useEffect(() => {
        // Guard: only run for properties or users tab when admin
        if (!isAdmin || activeTab === 'overview') return;

        const timer = setTimeout(() => {
            if (activeTab === 'properties') {
                fetchProducts(1);
            } else if (activeTab === 'users') {
                fetchUsers(1);
            } else if (activeTab === 'approvals') {
                fetchApprovals(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, statusFilter, isAdmin, activeTab, fetchProducts, fetchUsers]);

    const fetchStats = async () => {
        const data = await getAdminStats();
        setStats(data);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            if (activeTab === 'properties') fetchProducts(newPage);
            if (activeTab === 'users') fetchUsers(newPage);
            if (activeTab === 'approvals') fetchApprovals(newPage);
        }
    };

    const fetchApprovals = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const data = await getAdminProducts(page, ITEMS_PER_PAGE, searchQuery, 'pending');
            setProperties(data.products);
            setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
            setCurrentPage(page);
        } catch (error) {
            console.error('Error fetching approvals:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    const handleApprove = async (id: string) => {
        if (!user) return;
        try {
            const result = await approveProductAction(id, user.id);
            if (result.success) {
                // Remove from list
                setProperties(properties.filter(p => p.id !== id));
                fetchStats();
                alert('Property approved successfully');
            } else {
                alert(`Failed to approve property: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error approving:', error);
            alert('Failed to approve property');
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Reject this property? It will be marked as rejected.')) return;
        if (!user) return;
        try {
            const result = await rejectProductAction(id, user.id);
            if (result.success) {
                // Remove from list
                setProperties(properties.filter(p => p.id !== id));
                fetchStats();
                alert('Property rejected successfully');
            } else {
                alert(`Failed to reject property: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error rejecting:', error);
            alert('Failed to reject property');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this property? This cannot be undone.')) return;
        if (!user) return;

        try {
            const result = await adminDeleteProductAction(id, user.id);
            if (result.success) {
                // Remove from list
                setProperties(properties.filter(p => p.id !== id));
                fetchStats();
                alert('Property deleted successfully');
            } else {
                alert(`Failed to delete property: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Failed to delete property');
        }
    };

    const handleStatusToggle = async (id: string, currentStatus: boolean) => {
        if (!user) return;
        try {
            const result = await updateProductStatusAction(id, !currentStatus, user.id);
            if (result.success) {
                // Optimistic update
                setProperties(properties.map(p =>
                    p.id === id ? { ...p, availableForSale: !currentStatus } : p
                ));
                fetchStats();
            } else {
                alert(`Failed to update status: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const handleExport = () => {
        if (activeTab === 'properties') {
            const headers = ['ID', 'Title', 'Price', 'Status', 'Contact', 'User ID'];
            const csvContent = [
                headers.join(','),
                ...properties.map(p => [
                    p.id,
                    `"${p.title.replace(/"/g, '""')}"`,
                    p.priceRange?.minVariantPrice?.amount || '0',
                    p.availableForSale ? 'Active' : 'Inactive',
                    p.contactNumber || '',
                    p.userId || ''
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `properties-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        }
    };

    // Hydration check
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
                    <p className="text-neutral-600">Admin access required</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {qrPosterProperty && (
                    <QRPosterModal
                        isOpen={!!qrPosterProperty}
                        onClose={() => setQrPosterProperty(null)}
                        property={qrPosterProperty}
                        user={user}
                    />
                )}

                <UserPropertiesModal
                    isOpen={!!selectedUserForProperties}
                    onClose={() => { setSelectedUserForProperties(null); setUserProperties([]); }}
                    userName={selectedUserForProperties?.name || 'User'}
                    properties={userProperties}
                    loading={userPropertiesLoading}
                />
                {selectedUserForInfo && (
                    <UserInfoModal
                        isOpen={!!selectedUserForInfo}
                        onClose={() => setSelectedUserForInfo(null)}
                        user={selectedUserForInfo}
                    />
                )}
                {selectedUserForInfo && (
                    <UserInfoModal
                        isOpen={!!selectedUserForInfo}
                        onClose={() => setSelectedUserForInfo(null)}
                        user={selectedUserForInfo}
                    />
                )}
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
                        <p className="text-neutral-600 mt-1">Manage platform activity</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
                        <button onClick={() => { setActiveTab('overview'); fetchStats(); }} className={`px-3 py-2 sm:px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'}`}>Overview</button>
                        <button onClick={() => { setActiveTab('properties'); fetchProducts(1); }} className={`px-3 py-2 sm:px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === 'properties' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'}`}>Properties</button>
                        <button onClick={() => { setActiveTab('users'); fetchUsers(1); }} className={`px-3 py-2 sm:px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'}`}>Users</button>
                        <button onClick={() => { setActiveTab('approvals'); fetchApprovals(1); }} className={`px-3 py-2 sm:px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === 'approvals' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'}`}>Approvals</button>
                        <button onClick={() => { setActiveTab('ads'); }} className={`px-3 py-2 sm:px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ads' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'}`}>Manage Ads</button>
                        <button onClick={() => { setActiveTab('settings'); fetchSettings(); }} className={`px-3 py-2 sm:px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'}`}>Settings</button>
                    </div>
                </div>
            </div>

            {activeTab === 'overview' && (
                /* Stats View */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600">Total Properties</p>
                                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.total}</p>
                            </div>
                            <Building className="w-12 h-12 text-blue-500 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600">Total Users</p>
                                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.users}</p>
                            </div>
                            <Users className="w-12 h-12 text-green-500 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600">Active Listings</p>
                                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.active}</p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-orange-500 opacity-20" />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'properties' && (
                /* Properties View */
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="flex flex-1 gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search properties..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="text-neutral-400 w-5 h-5" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="border border-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={handleExport}
                            className="flex items-center px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-neutral-900">Property Listings</h2>
                            <span className="text-sm text-neutral-500">Page {currentPage} of {totalPages}</span>
                        </div>

                        {loading ? (
                            <div className="p-12 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-neutral-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Property</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Posted</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Views</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Leads</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Price</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Contact</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-neutral-200">
                                            {properties.map((property) => (
                                                <tr key={property.id} className="hover:bg-neutral-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 flex-shrink-0">
                                                                {property.featuredImage && property.featuredImage.url ? (
                                                                    <img
                                                                        className="h-10 w-10 rounded object-cover"
                                                                        src={getOptimizedImageUrl(property.featuredImage.url, 160, 160, 'fill')}
                                                                        alt=""
                                                                        loading="lazy"
                                                                    />
                                                                ) : (<div className="h-10 w-10 rounded bg-neutral-200" />
                                                                )}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-neutral-900 max-w-[200px] truncate">{property.title}</div>
                                                                <div className="text-xs text-neutral-500">{property.tags?.[0]}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-neutral-500">
                                                        {timeAgo(property.createdAt)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-medium">
                                                        <div className="flex items-center gap-1">
                                                            <Eye className="w-3 h-3 text-neutral-400" />
                                                            {property.viewCount || 0}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-medium">
                                                        {property.leadsCount || 0}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => handleStatusToggle(property.id, property.availableForSale)}
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${property.availableForSale
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                                }`}
                                                        >
                                                            {property.availableForSale ? 'Active' : 'Inactive'}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-medium">
                                                        ₹{Number(property.priceRange?.minVariantPrice?.amount || property.price || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                                        {property.contactNumber || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => router.push(`/product/${property.handle}`)}
                                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                                            title="View"
                                                        >
                                                            <Eye className="w-4 h-4 inline" />
                                                        </button>
                                                        <button
                                                            onClick={() => setQrPosterProperty(property)}
                                                            className="text-purple-600 hover:text-purple-900 mr-4"
                                                            title="Generate QR Poster"
                                                        >
                                                            <Download className="w-4 h-4 inline" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusToggle(property.id, property.availableForSale)}
                                                            className={`mr-4 ${property.availableForSale ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                                                            title={property.availableForSale ? "Deactivate" : "Activate"}
                                                        >
                                                            {property.availableForSale ? <XCircle className="w-4 h-4 inline" /> : <CheckCircle className="w-4 h-4 inline" />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(property.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4 inline" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentPage === 1
                                            ? 'text-neutral-400 bg-neutral-100 cursor-not-allowed'
                                            : 'text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50'
                                            }`}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-2" />
                                        Previous
                                    </button>
                                    <div className="hidden sm:flex">
                                        <p className="text-sm text-neutral-700">
                                            Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentPage === totalPages
                                            ? 'text-neutral-400 bg-neutral-100 cursor-not-allowed'
                                            : 'text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50'
                                            }`}
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {activeTab === 'users' && (
                /* Users View */
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-neutral-900">Registered Users</h2>
                            <span className="text-sm text-neutral-500">Page {currentPage} of {totalPages}</span>
                        </div>

                        {loading ? (
                            <div className="p-12 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-neutral-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Contact</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Properties</th>
                                            </tr >
                                        </thead >
                                        <tbody className="bg-white divide-y divide-neutral-200">
                                            {usersList.map((userItem) => (
                                                <tr key={userItem.userId} className="hover:bg-neutral-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900" title={userItem.userId}>
                                                        {userItem.userId.substring(0, 8)}...
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                                        {userItem.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                                        {userItem.email}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                                        <div className="flex items-center gap-2">
                                                            {userItem.contactNumber}
                                                            {userItem.contactNumber !== 'N/A' && (
                                                                <a
                                                                    href={`https://wa.me/${userItem.contactNumber.replace(/\D/g, '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1 rounded-full transition-colors"
                                                                    title="Chat on WhatsApp"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                                        <button
                                                            onClick={() => handleUserPropertiesClick(userItem.userId, userItem.name)}
                                                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1"
                                                        >
                                                            {userItem.totalProperties} Properties
                                                            <Eye className="w-3 h-3" />
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => setSelectedUserForInfo(userItem)}
                                                                className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 p-1.5 rounded-lg transition-colors"
                                                                title="User Info"
                                                            >
                                                                <Info className="w-4 h-4" />
                                                            </button>
                                                            {userItem.status !== 'banned' ? (
                                                                <button
                                                                    onClick={() => handleBanUser(userItem.userId)}
                                                                    className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                                                                >
                                                                    Ban
                                                                </button>
                                                            ) : (
                                                                <span className="text-neutral-400 text-sm font-medium">Banned</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table >
                                </div >

                                {/* Pagination Controls */}
                                < div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between" >
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentPage === 1
                                            ? 'text-neutral-400 bg-neutral-100 cursor-not-allowed'
                                            : 'text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50'
                                            }`}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-2" />
                                        Previous
                                    </button>
                                    <div className="hidden sm:flex">
                                        <p className="text-sm text-neutral-700">
                                            Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentPage === totalPages
                                            ? 'text-neutral-400 bg-neutral-100 cursor-not-allowed'
                                            : 'text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50'
                                            }`}
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </button>
                                </div >
                            </>
                        )
                        }
                    </div >
                </div >
            )
            }
            {
                activeTab === 'approvals' && (
                    /* Approvals View */
                    <div className="space-y-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
                            <h2 className="text-lg font-semibold text-neutral-900 mb-2">Pending Approvals</h2>
                            <p className="text-sm text-neutral-500">Review and approve new property listings.</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-neutral-900">Pending Listings</h2>
                                <span className="text-sm text-neutral-500">Page {currentPage} of {totalPages}</span>
                            </div>

                            {loading ? (
                                <div className="p-12 flex justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-neutral-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Property</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Price</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Contact</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-neutral-200">
                                                {properties.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                                                            No pending approvals found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    properties.map((property) => (
                                                        <tr key={property.id} className="hover:bg-neutral-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="h-10 w-10 flex-shrink-0">
                                                                        {property.featuredImage && property.featuredImage.url ? (
                                                                            <img
                                                                                className="h-10 w-10 rounded object-cover"
                                                                                src={getOptimizedImageUrl(property.featuredImage.url, 160, 160, 'fill')}
                                                                                alt=""
                                                                                loading="lazy"
                                                                            />
                                                                        ) : (<div className="h-10 w-10 rounded bg-neutral-200" />
                                                                        )}
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <div className="text-sm font-medium text-neutral-900 max-w-[200px] truncate">{property.title}</div>
                                                                        <div className="text-xs text-neutral-500">{property.tags?.[0]}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-medium">
                                                                ₹{Number(property.priceRange?.minVariantPrice?.amount || property.price || 0).toLocaleString('en-IN')}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                                                {property.contactNumber || 'N/A'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                <button
                                                                    onClick={() => router.push(`/product/${property.handle}`)}
                                                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                                                    title="View"
                                                                >
                                                                    <Eye className="w-4 h-4 inline" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleApprove(property.id)}
                                                                    className="text-green-600 hover:text-green-900 mr-4"
                                                                    title="Approve"
                                                                >
                                                                    <CheckCircle className="w-4 h-4 inline" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReject(property.id)}
                                                                    className="text-red-600 hover:text-red-900"
                                                                    title="Reject"
                                                                >
                                                                    <XCircle className="w-4 h-4 inline" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination Controls */}
                                    <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentPage === 1
                                                ? 'text-neutral-400 bg-neutral-100 cursor-not-allowed'
                                                : 'text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50'
                                                }`}
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-2" />
                                            Previous
                                        </button>
                                        <div className="hidden sm:flex">
                                            <p className="text-sm text-neutral-700">
                                                Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentPage === totalPages
                                                ? 'text-neutral-400 bg-neutral-100 cursor-not-allowed'
                                                : 'text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50'
                                                }`}
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )
            }
            {
                activeTab === 'ads' && (
                    <div className="max-w-4xl mx-auto">
                        <AdManager />
                    </div>
                )
            }
            {
                activeTab === 'settings' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Website Settings</h2>
                            <form onSubmit={handleSettingsSave} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Homepage Title (SEO)</label>
                                    <input
                                        type="text"
                                        value={settings.homepage_title}
                                        onChange={(e) => setSettings({ ...settings, homepage_title: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                                        placeholder="e.g. Find Your Perfect Home"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Homepage Description (SEO)</label>
                                    <textarea
                                        value={settings.homepage_description}
                                        onChange={(e) => setSettings({ ...settings, homepage_description: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 h-24"
                                        placeholder="e.g. Discover verified rooms and flats..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Global WhatsApp Number</label>
                                    <input
                                        type="text"
                                        value={settings.whatsapp_number}
                                        onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                                        placeholder="e.g. 917470724553"
                                    />
                                    <p className="text-xs text-neutral-500 mt-1">Used for 'Contact Us' and Application buttons. Format: CountryCode+Number (no symbols).</p>
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="w-full px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
