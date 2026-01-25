'use client';

import { useState, useCallback, useEffect } from 'react';
import { Download, ChevronRight } from 'lucide-react';
import { getAdminLeads } from '@/lib/api';
import { LeadActivityModal } from '@/components/admin/LeadActivityModal';

export function LeadsTab() {
    const [leads, setLeads] = useState<any[]>([]);
    const [groupedLeads, setGroupedLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPropertyLeads, setSelectedPropertyLeads] = useState<any | null>(null);

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const allLeads = await getAdminLeads();
            setLeads(allLeads);
            const grouped = allLeads.reduce((acc: any, lead: any) => {
                if (!acc[lead.property_id]) {
                    acc[lead.property_id] = {
                        property_id: lead.property_id,
                        property_title: lead.property_title,
                        property_location: lead.property_location,
                        count: 0,
                        leads: []
                    };
                }
                acc[lead.property_id].count++;
                acc[lead.property_id].leads.push(lead);
                return acc;
            }, {});
            setGroupedLeads(Object.values(grouped));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const handlePropertyLeadsClick = (group: any) => {
        setSelectedPropertyLeads({
            property_id: group.property_id,
            property_handle: null, // Not available in grouped view unless fetched? Original code had it?
            // In original handlePropertyLeadsClick(property), it came from property object.
            // Here 'group' acts as property proxy.
            property_title: group.property_title,
            count: group.count,
            leads: group.leads
        });
    };

    const handleLeadDelete = async (leadId: string) => {
        if (!confirm("Delete lead?")) return;
        const { deleteLeadActivity } = await import('@/lib/api');
        const res = await deleteLeadActivity(leadId);
        if (res.success) {
            alert('Lead deleted');
            fetchLeads();
            if (selectedPropertyLeads) {
                const updated = selectedPropertyLeads.leads.filter((l: any) => l.id !== leadId);
                setSelectedPropertyLeads({ ...selectedPropertyLeads, leads: updated, count: updated.length });
            }
        } else {
            alert('Failed');
        }
    };

    const handleExportLeads = () => {
        const leadsToExport = leads;

        if (!leadsToExport || leadsToExport.length === 0) {
            alert('No leads to export');
            return;
        }

        const headers = ['Date', 'User Name', 'User Email', 'User Phone', 'Action Type', 'Property Title', 'Property Location', 'Property ID'];
        const csvContent = [
            headers.join(','),
            ...leadsToExport.map((lead: any) => [
                `"${new Date(lead.created_at).toLocaleString()}"`,
                `"${lead.user_name || ''}"`,
                `"${lead.user_email || ''}"`,
                `"${lead.user_phone || ''}"`,
                `"${lead.action_type || ''}"`,
                `"${lead.property_title?.replace(/"/g, '""') || ''}"`,
                `"${lead.property_location?.replace(/"/g, '""') || ''}"`,
                `"${lead.property_id || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `leads-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="space-y-6">
            <LeadActivityModal
                isOpen={!!selectedPropertyLeads}
                onClose={() => setSelectedPropertyLeads(null)}
                propertyTitle={selectedPropertyLeads?.property_title || ''}
                propertyHandle={selectedPropertyLeads?.property_handle}
                leads={selectedPropertyLeads?.leads || []}
                onDeleteLead={handleLeadDelete}
            />

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-neutral-900">Lead Activity (Grouped by Property)</h2>
                    <button
                        onClick={handleExportLeads}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download className="w-3 h-3" />
                        Export All Leads
                    </button>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Property</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Leads</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-neutral-200">
                                {groupedLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                                            No leads found.
                                        </td>
                                    </tr>
                                ) : (
                                    groupedLeads.map((group: any) => (
                                        <tr key={group.property_id} className="hover:bg-neutral-50 cursor-pointer" onClick={() => handlePropertyLeadsClick(group)}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                                                {group.property_title}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                                {group.property_location}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {group.count} Leads
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <ChevronRight className="w-5 h-5 text-neutral-400 inline" />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
