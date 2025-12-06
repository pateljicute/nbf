'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { getAdminProducts, getAdminStats, checkIsAdmin, adminDeleteProduct, updateProductStatus, getAdminUsers, approveProduct } from '@/lib/api';
import { Product } from '@/lib/types';
import { Trash2, Eye, Users, Building, TrendingUp, ChevronLeft, ChevronRight, Search, Filter, CheckCircle, XCircle, Download } from 'lucide-react';

interface AdminUser {
    userId: string;
    contactNumber: string;
    totalProperties: number;
    activeProperties: number;
}

export default function AdminPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [properties, setProperties] = useState<Product[]>([]);
    const [usersList, setUsersList] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [stats, setStats] = useState({ total: 0, users: 0, active: 0 });

    // Pagination & Filter state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'users' | 'approvals'>('overview');

    const ITEMS_PER_PAGE = 10;

    const fetchProducts = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const data = await getAdminProducts(page, ITEMS_PER_PAGE, searchQuery, statusFilter);
            setProperties(data.products);
            setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
            setCurrentPage(page);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter]);

    const fetchUsers = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const data = await getAdminUsers(page, ITEMS_PER_PAGE);
            setUsersList(data.users);
            setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
            setCurrentPage(page);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
        } else if (user) {
            checkAdmin();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isLoading, router]);

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

    const checkAdmin = useCallback(async () => {
        if (!user) return;

        const adminStatus = await checkIsAdmin(user.id);
        setIsAdmin(adminStatus);

        if (!adminStatus) {
            alert('Access Denied: Admin only');
            router.push('/');
        } else {
            fetchStats();
        }
    }, [user, router]);

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
            const success = await approveProduct(id, user.id);
            if (success) {
                // Remove from list
                setProperties(properties.filter(p => p.id !== id));
                fetchStats();
                alert('Property approved successfully');
            } else {
                alert('Failed to approve property');
            }
        } catch (error) {
            console.error('Error approving:', error);
            alert('Failed to approve property');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this property? This cannot be undone.')) return;
        if (!user) return;

        try {
            await adminDeleteProduct(id, user.id);
            fetchProducts(currentPage);
            fetchStats();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Failed to delete property');
        }
    };

    const handleStatusToggle = async (id: string, currentStatus: boolean) => {
        if (!user) return;
        try {
            await updateProductStatus(id, !currentStatus, user.id);
            // Optimistic update
            setProperties(properties.map(p =>
                p.id === id ? { ...p, availableForSale: !currentStatus } : p
            ));
            fetchStats();
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
                    p.priceRange.minVariantPrice.amount,
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

    if (isLoading) {
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
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
                        <p className="text-neutral-600 mt-1">Manage platform activity</p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex space-x-4">
                        <button
                            onClick={() => {
                                setActiveTab('overview');
                                fetchStats();
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview'
                                ? 'bg-neutral-900 text-white'
                                : 'bg-white text-neutral-600 hover:bg-neutral-100'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('properties');
                                fetchProducts(1);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'properties'
                                ? 'bg-neutral-900 text-white'
                                : 'bg-white text-neutral-600 hover:bg-neutral-100'
                                }`}
                        >
                            Properties
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('users');
                                fetchUsers(1);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users'
                                ? 'bg-neutral-900 text-white'
                                : 'bg-white text-neutral-600 hover:bg-neutral-100'
                                }`}
                        >
                            Users
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('approvals');
                                fetchApprovals(1);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'approvals'
                                ? 'bg-neutral-900 text-white'
                                : 'bg-white text-neutral-600 hover:bg-neutral-100'
                                }`}
                        >
                            Approvals
                        </button>
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
                                                                            src={`https://res.cloudinary.com/dla8a0y7n/image/upload/f_auto,q_auto,w_160/${property.featuredImage.url.replace(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//, '')}`}
                                                                            alt=""
                                                                            loading="lazy"
                                                                        />
                                                                    ) : (
                                                                        <div className="h-10 w-10 rounded bg-neutral-200" />
                                                                    )}
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-neutral-900 max-w-[200px] truncate">{property.title}</div>
                                                                    <div className="text-xs text-neutral-500">{property.tags?.[0]}</div>
                                                                </div>
                                                            </div>
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
                                                            ₹{Number(property.priceRange.minVariantPrice.amount).toLocaleString('en-IN')}
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
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Contact</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Properties</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Active Properties</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-neutral-200">
                                                {usersList.map((userItem) => (
                                                    <tr key={userItem.userId} className="hover:bg-neutral-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                                                            {userItem.userId}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                                            {userItem.contactNumber}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                                            {userItem.totalProperties}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                {userItem.activeProperties} Active
                                                            </span>
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
                {activeTab === 'approvals' && (
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
                                                                                src={`https://res.cloudinary.com/dla8a0y7n/image/upload/f_auto,q_auto,w_160/${property.featuredImage.url.replace(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//, '')}`}
                                                                                alt=""
                                                                                loading="lazy"
                                                                            />
                                                                        ) : (
                                                                            <div className="h-10 w-10 rounded bg-neutral-200" />
                                                                        )}
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <div className="text-sm font-medium text-neutral-900 max-w-[200px] truncate">{property.title}</div>
                                                                        <div className="text-xs text-neutral-500">{property.tags?.[0]}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-medium">
                                                                ₹{Number(property.priceRange.minVariantPrice.amount).toLocaleString('en-IN')}
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
                                                                    onClick={() => handleDelete(property.id)}
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
                )}
            </div>
        </div>
    );
}
