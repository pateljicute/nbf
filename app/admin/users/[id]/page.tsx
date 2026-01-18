'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUserDetailsForAdmin } from '@/lib/api';
import {
    User, Phone, Mail, Calendar, Eye, MessageCircle,
    ArrowLeft, Download, Ban, Edit, ExternalLink, TrendingUp, Building
} from 'lucide-react';
import { LeadActivityModal } from '@/components/admin/LeadActivityModal';

export default function UserDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'views' | 'leads' | 'inquiries'>('leads');
    const [selectedLeads, setSelectedLeads] = useState<any>(null); // This is a view tool call, no replacement content needed., or just table

    useEffect(() => {
        // Hydration check or just fetch
        const load = async () => {
            setLoading(true);
            const data = await getUserDetailsForAdmin(userId);
            if (data) {
                setUserData(data);
            } else {
                alert('User not found');
                router.back();
            }
            setLoading(false);
        };
        load();
    }, [userId, router]);

    const handleExport = () => {
        // Implement export logic here (reuse downloadCSV)
        // flattening data from userData
        const rows = [
            ['Type', 'Date', 'Property', 'Action/Details', 'Status'],
            ...(userData.leads || []).map((l: any) => ['Lead', new Date(l.created_at).toLocaleString(), l.property?.title, l.action_type, l.status]),
            ...(userData.views || []).map((v: any) => ['View', new Date(v.created_at).toLocaleString(), v.property?.title, 'Viewed', '-']),
            ...(userData.inquiries || []).map((i: any) => ['Inquiry', new Date(i.created_at).toLocaleString(), '-', i.message, '-'])
        ];

        const csvContent = rows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `user_activity_${userData.user.first_name}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-8">Loading user profile...</div>;
    if (!userData) return null;

    const { user, leads, views, inquiries } = userData;
    const conversionRate = views.length > 0 ? ((leads.length / views.length) * 100).toFixed(1) : 0;

    const unifiedHistory = [
        ...leads.map((l: any) => ({ ...l, interactionType: 'contact', date: new Date(l.created_at), label: l.action_type === 'whatsapp' ? 'WhatsApp' : 'Contact Form' })),
        ...views.map((v: any) => ({ ...v, interactionType: 'view', date: new Date(v.created_at), label: 'Viewed Property' }))
    ].sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

    return (
        <div className="min-h-screen bg-neutral-50 pb-12">
            {/* Header */}
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-neutral-100 rounded-full">
                            <ArrowLeft className="w-5 h-5 text-neutral-600" />
                        </button>
                        <h1 className="text-lg font-bold text-neutral-900">User Profile</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-50"
                        >
                            <Download className="w-4 h-4" />
                            Export Activity
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
                                <User className="w-10 h-10 text-neutral-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-neutral-900">
                                    {user.first_name} {user.last_name}
                                </h2>
                                <div className="flex items-center gap-2 text-neutral-500 mt-1">
                                    <span className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-purple-500' : 'bg-green-500'}`} />
                                    <span className="text-sm font-medium capitalize">{user.role || 'User'}</span>
                                    <span className="text-xs text-neutral-400">• Joined {new Date(user.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center gap-3 px-4 py-2 bg-neutral-50 rounded-lg border border-neutral-100">
                                <Mail className="w-4 h-4 text-neutral-500" />
                                <div className="text-sm font-medium text-neutral-900">{user.email}</div>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2 bg-neutral-50 rounded-lg border border-neutral-100">
                                <Phone className="w-4 h-4 text-neutral-500" />
                                <div className="text-sm font-medium text-neutral-900">{user.phone_number || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <MessageCircle className="w-24 h-24 text-purple-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-sm font-medium text-neutral-500 mb-1">Total Contacts Initiated</div>
                            <div className="text-3xl font-bold text-neutral-900">{leads.length}</div>
                            <div className="mt-2 text-xs text-purple-600 font-medium bg-purple-50 inline-block px-2 py-1 rounded-full">
                                Whatsapp / Call Clicks
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Eye className="w-24 h-24 text-blue-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-sm font-medium text-neutral-500 mb-1">Total Properties Viewed</div>
                            <div className="text-3xl font-bold text-neutral-900">{views.length}</div>
                            <div className="mt-2 text-xs text-blue-600 font-medium bg-blue-50 inline-block px-2 py-1 rounded-full">
                                Page Visits
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp className="w-24 h-24 text-green-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-sm font-medium text-neutral-500 mb-1">Conversion Rate</div>
                            <div className="text-3xl font-bold text-neutral-900">{conversionRate}%</div>
                            <div className="mt-2 text-xs text-green-600 font-medium bg-green-50 inline-block px-2 py-1 rounded-full">
                                Contacts / Views
                            </div>
                        </div>
                    </div>
                </div>

                {/* Property Interaction History (Unified) */}
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden mb-8 shadow-sm">
                    <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                        <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                            Activity Timeline
                            <span className="bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full text-xs">{unifiedHistory.length}</span>
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white text-neutral-500 font-medium border-b border-neutral-100">
                                <tr>
                                    <th className="px-6 py-4">Property</th>
                                    <th className="px-6 py-4">Interaction</th>
                                    <th className="px-6 py-4">Property Owner</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {unifiedHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-neutral-400">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                                                    <TrendingUp className="w-6 h-6 text-neutral-300" />
                                                </div>
                                                <p>No activity recorded yet</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    unifiedHistory.map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {item.property.images && item.property.images[0] ? (
                                                        <img
                                                            src={item.property.images[0]}
                                                            alt=""
                                                            className="w-12 h-12 rounded-lg object-cover border border-neutral-200"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center border border-neutral-200">
                                                            <Building className="w-6 h-6 text-neutral-300" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <a
                                                            href={`/product/${item.property.id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline block truncate max-w-[200px]"
                                                        >
                                                            {item.property.title || 'Unknown Property'}
                                                            <ExternalLink className="w-3 h-3 inline ml-1 opacity-50" />
                                                        </a>
                                                        <div className="text-xs text-neutral-500">{item.property.location}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${item.interactionType === 'contact'
                                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                                    }`}>
                                                    {item.interactionType === 'contact' ? (
                                                        <>
                                                            <MessageCircle className="w-3 h-3" />
                                                            {item.label}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye className="w-3 h-3" />
                                                            Viewed
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.property.owner ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-neutral-900">
                                                            {item.property.owner.first_name} {item.property.owner.last_name}
                                                        </span>
                                                        <span className="text-xs text-neutral-500">{item.property.owner.email}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-neutral-400 italic">Unknown Owner</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-neutral-500">
                                                {item.date.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-2 border-b border-neutral-200">
                    <button
                        onClick={() => setActiveTab('leads')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'leads' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
                    >
                        Leads Generated ({leads.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('views')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'views' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
                    >
                        Properties Viewed ({views.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('inquiries')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'inquiries' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
                    >
                        Inquiries ({inquiries.length})
                    </button>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden min-h-[400px]">
                    {activeTab === 'leads' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-100">
                                    <tr>
                                        <th className="px-6 py-4">Property</th>
                                        <th className="px-6 py-4">Action</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {leads.map((lead: any) => (
                                        <tr key={lead.id} className="hover:bg-neutral-50/50">
                                            <td className="px-6 py-4">
                                                <a
                                                    href={`/product/${lead.property.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline block mb-0.5"
                                                    title="View Property Page"
                                                >
                                                    {lead.property.title}
                                                    <ExternalLink className="w-3 h-3 inline-ml ml-1 opacity-50" />
                                                </a>
                                                <div className="text-xs text-neutral-500">{lead.property.location}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase ${lead.action_type === 'whatsapp' ? 'text-green-700 bg-green-50' : 'text-blue-700 bg-blue-50'
                                                    }`}>
                                                    {lead.action_type === 'whatsapp' ? <MessageCircle className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                                                    {lead.action_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs capitalize ${lead.status === 'closed' ? 'bg-neutral-100 text-neutral-500' :
                                                    lead.status === 'interested' ? 'bg-purple-50 text-purple-700' :
                                                        lead.status === 'contacted' ? 'bg-orange-50 text-orange-700' :
                                                            'bg-yellow-50 text-yellow-700'
                                                    }`}>
                                                    {lead.status || 'new'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500">
                                                {new Date(lead.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {leads.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-16 text-center text-neutral-400">
                                                <div className="flex flex-col items-center justify-center">
                                                    <MessageCircle className="w-12 h-12 text-neutral-200 mb-3" />
                                                    <p className="text-lg font-medium text-neutral-900">No leads generated yet</p>
                                                    <p className="text-sm max-w-xs mx-auto mt-1">This user hasn't contacted any property owners yet.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'views' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-100">
                                    <tr>
                                        <th className="px-6 py-4">Property</th>
                                        <th className="px-6 py-4">Count</th>
                                        <th className="px-6 py-4">Full URL</th>
                                        <th className="px-6 py-4">Last Viewed</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {(() => {
                                        // Group views by property
                                        const groupedViews = views.reduce((acc: any, view: any) => {
                                            const pid = view.property_id;
                                            if (!acc[pid]) {
                                                acc[pid] = { ...view, count: 0, latest: view.created_at };
                                            }
                                            acc[pid].count += 1;
                                            if (new Date(view.created_at) > new Date(acc[pid].latest)) {
                                                acc[pid].latest = view.created_at;
                                            }
                                            return acc;
                                        }, {});
                                        const uniqueViews = Object.values(groupedViews).sort((a: any, b: any) => new Date(b.latest).getTime() - new Date(a.latest).getTime());

                                        if (uniqueViews.length === 0) {
                                            return <tr><td colSpan={4} className="px-6 py-12 text-center text-neutral-400">No properties viewed yet</td></tr>;
                                        }

                                        return uniqueViews.map((view: any) => {
                                            const fullUrl = `${window.location.origin}/product/${view.property_id}`;
                                            return (
                                                <tr key={view.id} className="hover:bg-neutral-50/50">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-neutral-900">{view.property.title}</div>
                                                        <div className="text-xs text-neutral-500">{view.property.location}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">
                                                            <Eye className="w-3 h-3" />
                                                            Visited {view.count} times
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-neutral-500 font-mono text-xs select-all">
                                                        <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-blue-600 truncate max-w-[200px] block">
                                                            {fullUrl}
                                                        </a>
                                                    </td>
                                                    <td className="px-6 py-4 text-neutral-500">
                                                        {new Date(view.latest).toLocaleString()}
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'inquiries' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-100">
                                    <tr>
                                        <th className="px-6 py-4">Subject</th>
                                        <th className="px-6 py-4">Message</th>
                                        <th className="px-6 py-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {inquiries.map((inq: any) => (
                                        <tr key={inq.id} className="hover:bg-neutral-50/50">
                                            <td className="px-6 py-4 font-medium text-neutral-900">
                                                {inq.subject}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-600 max-w-md truncate">
                                                {inq.message}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500">
                                                {new Date(inq.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {inquiries.length === 0 && (
                                        <tr><td colSpan={3} className="px-6 py-12 text-center text-neutral-400">No inquiries sent</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
