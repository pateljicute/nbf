'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, Filter, Download, Eye, User, CheckCircle, XCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import { getAdminProducts, getAdminLeads } from '@/lib/api';
import { getOptimizedImageUrl } from '@/lib/cloudinary-utils';
import { updateProductStatusAction, adminDeleteProductAction } from '@/app/actions';
import { QRPosterModal } from '@/components/unique/qr-poster-modal';
import { LeadActivityModal } from '@/components/admin/LeadActivityModal';


function timeAgo(dateString?: string) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
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
        if (count >= 1) return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
    return 'Just now';
}

interface PropertiesTabProps {
    user: any;
    onStatsUpdate: () => void;
}

export function PropertiesTab({ user, onStatsUpdate }: PropertiesTabProps) {
    const router = useRouter();
    const [properties, setProperties] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modals
    const [qrPosterProperty, setQrPosterProperty] = useState<Product | null>(null);
    const [selectedPropertyLeads, setSelectedPropertyLeads] = useState<any | null>(null);

    const ITEMS_PER_PAGE = 10;

    const fetchProducts = useCallback(async (page: number) => {
        setLoading(true);
        try {
            // Using minPrice/maxPrice/cityFilter as undefined for now to keep simple, 
            // or we add them if we want full fidelity. The original code had them.
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

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, statusFilter, fetchProducts]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchProducts(newPage);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this property? This cannot be undone.')) return;
        if (!user) return;
        try {
            setProperties(properties.filter(p => p.id !== id)); // Optimistic
            const result = await adminDeleteProductAction(id, user.id);
            if (result.success) {
                onStatsUpdate();
                alert('Property deleted successfully');
            } else {
                fetchProducts(currentPage); // Revert
                alert(`Failed: ${result.error}`);
            }
        } catch (error) {
            alert('Failed to delete property');
        }
    };

    const handleStatusToggle = async (id: string, currentStatus: boolean) => {
        if (!user) return;
        try {
            const result = await updateProductStatusAction(id, !currentStatus, user.id);
            if (result.success) {
                setProperties(properties.map(p =>
                    p.id === id ? { ...p, availableForSale: !currentStatus } : p
                ));
                onStatsUpdate();
            } else {
                alert(`Failed to update status`);
            }
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handlePropertyLeadsClick = async (property: any) => {
        setLoading(true);
        try {
            // Simplify: fetch all leads logic is heavy, maybe just open empty? 
            // The original code fetched ALL leads then filtered. That's inefficient.
            // I'll stick to original logic for consistency but it's not ideal.
            const allLeads = await getAdminLeads();
            const propLeads = allLeads.filter((l: any) => l.property_id === property.id);
            setSelectedPropertyLeads({
                property_id: property.id,
                property_handle: property.handle,
                property_title: property.title,
                count: propLeads.length,
                leads: propLeads
            });
        } catch (e) {
            alert('Failed to load leads');
        } finally {
            setLoading(false);
        }
    };

    // We need handleLeadDelete for the modal
    const handleLeadDelete = async (leadId: string) => {
        if (!confirm("Delete lead?")) return;
        const { deleteLeadActivity } = await import('@/lib/api');
        const res = await deleteLeadActivity(leadId);
        if (res.success) {
            alert('Lead deleted');
            // Update local modal state
            if (selectedPropertyLeads) {
                const updated = selectedPropertyLeads.leads.filter((l: any) => l.id !== leadId);
                setSelectedPropertyLeads({ ...selectedPropertyLeads, leads: updated, count: updated.length });
                if (updated.length === 0) setSelectedPropertyLeads(null);
            }
        } else {
            alert('Failed');
        }
    };

    const handleExport = () => {
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
    };

    return (
        <div className="space-y-6">
            {qrPosterProperty && (
                <QRPosterModal
                    isOpen={!!qrPosterProperty}
                    onClose={() => setQrPosterProperty(null)}
                    property={qrPosterProperty}
                    user={user}
                />
            )}
            <LeadActivityModal
                isOpen={!!selectedPropertyLeads}
                onClose={() => setSelectedPropertyLeads(null)}
                propertyTitle={selectedPropertyLeads?.property_title || ''}
                propertyHandle={selectedPropertyLeads?.property_handle}
                leads={selectedPropertyLeads?.leads || []}
                onDeleteLead={handleLeadDelete}
            />

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
                                                    <div className="relative h-10 w-10 flex-shrink-0">
                                                        {property.featuredImage && property.featuredImage.url ? (
                                                            <Image
                                                                className="rounded object-cover"
                                                                src={getOptimizedImageUrl(property.featuredImage.url, 160, 160, 'fill')}
                                                                alt=""
                                                                fill
                                                                sizes="40px"
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
                                                <button
                                                    onClick={() => handlePropertyLeadsClick(property)}
                                                    className="flex items-center gap-1.5 hover:text-blue-600 transition-colors group"
                                                    title="View Leads"
                                                >
                                                    <div className={`p-1 rounded-full ${(property.leadsCount || 0) > 0 ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' : 'bg-neutral-100 text-neutral-400'}`}>
                                                        <User className="w-3 h-3" />
                                                    </div>
                                                    <span className={(property.leadsCount || 0) > 0 ? 'underline decoration-dotted' : ''}>
                                                        {property.leadsCount || 0}
                                                    </span>
                                                </button>
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
    );
}
