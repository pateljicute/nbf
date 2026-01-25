'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/lib/types';
import { getAdminProducts } from '@/lib/api';
import { approveProductAction, rejectProductAction } from '@/app/actions';
import { getOptimizedImageUrl } from '@/lib/cloudinary-utils';

interface ApprovalsTabProps {
    user: any;
    onStatsUpdate: () => void;
}

export function ApprovalsTab({ user, onStatsUpdate }: ApprovalsTabProps) {
    const router = useRouter();
    const [properties, setProperties] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    const ITEMS_PER_PAGE = 10;

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

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchApprovals(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchApprovals]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchApprovals(newPage);
        }
    };

    const handleApprove = async (id: string) => {
        if (!user) return;
        try {
            const result = await approveProductAction(id, user.id);
            if (result.success) {
                setProperties(properties.filter(p => p.id !== id));
                onStatsUpdate();
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
                setProperties(properties.filter(p => p.id !== id));
                onStatsUpdate();
                alert('Property rejected successfully');
            } else {
                alert(`Failed to reject property: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error rejecting:', error);
            alert('Failed to reject property');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">Pending Approvals</h2>
                <p className="text-sm text-neutral-500">Review and approve new property listings.</p>
                {/* Re-add search bar if needed, wasn't there in original excerpt but hook is there. 
                     The original had only searchQuery usage in fetchApprovals but no input in UI for Approvals tab explicitly shown in truncated view.
                     But fetchApprovals(1) is called on tab click. 
                     Wait, if I look at `admin/page.tsx` line 410, `fetchApprovals` uses `searchQuery`. 
                     The Search input was in the shared Header or Properties Tab? 
                     In `admin/page.tsx`, the search bar was INSIDE activeTab === 'properties' block (lines 800ish).
                     So Approvals tab didn't have a search bar in original code? 
                     Looking at lines 1359+, it has just title and description. 
                     So I should probably NOT include search bar here unless I add it.
                     I will omit it to match original, but keep the logic in case I want to add it later or if it was implicitly shared (it wasn't).
                 */}
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
    );
}
