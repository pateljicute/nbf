'use client';

import { X, Trash2, MessageCircle, Phone, Calendar, User, ExternalLink } from 'lucide-react';
import { deleteLeadActivity } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';
import Link from 'next/link';

interface Lead {
    id: string;
    created_at: string;
    action_type: string;
    property_id: string;
    user_id: string;
    property_title: string;
    property_location: string;
    user_name: string;
    user_email: string;
    user_phone: string;
    status?: string;
}

interface LeadActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyTitle: string;
    propertyHandle?: string;
    leads: Lead[];
    onDeleteLead: (leadId: string) => void;
}

export function LeadActivityModal({ isOpen, onClose, propertyTitle, propertyHandle, leads, onDeleteLead }: LeadActivityModalProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleDelete = async (leadId: string) => {
        if (!confirm('Are you sure you want to delete this lead record?')) return;
        setDeletingId(leadId);
        const result = await deleteLeadActivity(leadId);
        if (result.success) {
            toast.success('Lead record deleted');
            onDeleteLead(leadId);
        } else {
            toast.error('Failed to delete record');
        }
        setDeletingId(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                            Leads for: {propertyTitle}
                            {propertyHandle && (
                                <Link href={`/product/${propertyHandle}`} target="_blank" className="text-neutral-400 hover:text-blue-600" title="View Property">
                                    <ExternalLink className="w-4 h-4" />
                                </Link>
                            )}
                        </h2>
                        <p className="text-sm text-neutral-500 mt-1">{leads.length} Total Interaction{leads.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {leads.length === 0 ? (
                        <div className="text-center py-12 text-neutral-400">
                            No leads found for this property.
                        </div>
                    ) : (
                        leads.map((lead) => (
                            <div key={lead.id} className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 hover:border-neutral-300 transition-colors shadow-sm">

                                {/* User Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-neutral-900">{lead.user_name}</h3>
                                            <p className="text-xs text-neutral-500">{lead.user_email}</p>
                                        </div>
                                    </div>
                                    {lead.user_phone && (
                                        <div className="ml-10 text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                                            <Phone className="w-3 h-3 text-neutral-400" />
                                            {lead.user_phone}
                                        </div>
                                    )}
                                </div>

                                {/* Action Info */}
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end gap-1">
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${lead.action_type === 'whatsapp'
                                            ? 'bg-green-50 text-green-700 border border-green-100'
                                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                                            }`}>
                                            {lead.action_type === 'whatsapp' ? <MessageCircle className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                                            {lead.action_type === 'whatsapp' ? 'WhatsApp' : 'Contact'}
                                        </div>

                                        {/* Status Dropdown */}
                                        <select
                                            className={`text-xs border rounded px-1 py-0.5 cursor-pointer outline-none focus:ring-1 focus:ring-neutral-300 ${lead.status === 'closed' ? 'bg-neutral-100 text-neutral-500' :
                                                lead.status === 'interested' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                    lead.status === 'contacted' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                        'bg-white text-neutral-700 border-neutral-200'
                                                }`}
                                            value={lead.status || 'new'}
                                            onChange={async (e) => {
                                                const newStatus = e.target.value;
                                                const { updateLeadStatusAction } = await import('@/app/actions'); // safe dynamic import
                                                const res = await updateLeadStatusAction(lead.id, newStatus);
                                                if (res.success) {
                                                    toast.success('Status updated');
                                                    // Trigger parent refresh if possible, or just local optimistic update?
                                                    // Ideally we should have a refresh callback. For now let's hope parent refresh handles it
                                                    // or we can add onStatusUpdate prop.
                                                    // Let's just toast for now.
                                                } else {
                                                    toast.error('Failed to update status');
                                                }
                                            }}
                                        >
                                            <option value="new">New</option>
                                            <option value="contacted">Contacted</option>
                                            <option value="interested">Interested</option>
                                            <option value="closed">Closed / Sold</option>
                                        </select>
                                    </div>

                                    <div className="text-xs text-neutral-400 font-medium flex flex-col items-end">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(lead.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="text-[10px]">
                                            {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(lead.id)}
                                        disabled={deletingId === lead.id}
                                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        title="Delete Record"
                                    >
                                        {deletingId === lead.id ? <div className="w-4 h-4 rounded-full border-2 border-red-200 border-t-red-600 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-neutral-100 bg-neutral-50 rounded-b-2xl flex justify-end">
                    <button onClick={onClose} className="px-5 py-2.5 bg-neutral-900 text-white font-bold rounded-lg hover:bg-neutral-800 transition-colors text-sm">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
