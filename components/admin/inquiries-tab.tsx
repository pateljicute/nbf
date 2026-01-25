'use client';

import { useState, useCallback, useEffect } from 'react';
import { Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { getInquiries, getAllInquiries } from '@/lib/api';
import { InquiryModal } from '@/components/admin/InquiryModal';

interface InquiriesTabProps {
    unreadCount_: number; // Prop to potentially refresh parent, but parent fetches globally.
    // For now, this component handles its own display data.
    // Refreshing the parent 'unread' badge might be tricky unless we lift state, 
    // but the original code fetched unread count in parent separately.
}

export function InquiriesTab() {
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);

    const ITEMS_PER_PAGE = 10;

    const fetchInquiries = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const data = await getInquiries(page, ITEMS_PER_PAGE);
            setInquiries(data.inquiries);
            setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
            setCurrentPage(page);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInquiries(1);
    }, [fetchInquiries]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchInquiries(newPage);
        }
    };

    const handleExportInquiries = async () => {
        try {
            const allInquiries = await getAllInquiries();
            const headers = ['Date', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Status', 'Property ID'];
            const csvContent = [
                headers.join(','),
                ...allInquiries.map((inq: any) => [
                    `"${new Date(inq.created_at).toLocaleString()}"`,
                    `"${inq.first_name} ${inq.last_name}"`,
                    `"${inq.email}"`,
                    `"${inq.phone_number || ''}"`,
                    `"${inq.subject?.replace(/"/g, '""') || ''}"`,
                    `"${inq.message?.replace(/"/g, '""') || ''}"`,
                    inq.status,
                    `"${inq.property_id || ''}"`
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `inquiries-export-${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export inquiries');
        }
    };

    return (
        <div className="space-y-6">
            <InquiryModal
                isOpen={!!selectedInquiry}
                onClose={() => setSelectedInquiry(null)}
                inquiry={selectedInquiry}
            />

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-neutral-900">User Inquiries</h2>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleExportInquiries}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Download className="w-3 h-3" />
                            Export to Excel
                        </button>
                        <span className="text-sm text-neutral-500">Page {currentPage} of {totalPages}</span>
                    </div>
                </div>
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-neutral-200">
                                {inquiries.length > 0 ? inquiries.map((inq) => (
                                    <tr key={inq.id} className="hover:bg-neutral-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                            {new Date(inq.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                                            {inq.first_name} {inq.last_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                            {inq.subject}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${inq.status === 'unread' ? 'bg-blue-100 text-blue-800' : 'bg-neutral-100 text-neutral-800'}`}>
                                                {inq.status || 'unread'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => setSelectedInquiry(inq)}
                                                className="text-blue-600 hover:text-blue-900 flex items-center justify-end gap-1 ml-auto"
                                            >
                                                View <Eye className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                                            No inquiries found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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
                            <span className="text-sm text-neutral-700">Page {currentPage} of {totalPages}</span>
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
                    </div>
                )}
            </div>
        </div>
    );
}
