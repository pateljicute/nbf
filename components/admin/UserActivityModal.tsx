'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, MessageCircle, Eye, TrendingUp, Calendar, Mail, Phone, ExternalLink } from 'lucide-react';
import { UserActivityData } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

interface UserActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData: UserActivityData | null;
    loading: boolean;
}

export default function UserActivityModal({ isOpen, onClose, userData, loading }: UserActivityModalProps) {
    const [activeTab, setActiveTab] = useState<'timeline' | 'leads' | 'views' | 'inquiries'>('timeline');

    if (!isOpen) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="absolute top-4 right-4">
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-neutral-500" />
                                    </button>
                                </div>

                                {loading || !userData ? (
                                    <div className="flex justify-center items-center h-64">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {/* 1. User Header */}
                                        <div className="flex items-center gap-6 border-b border-neutral-100 pb-6">
                                            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200">
                                                {userData.user.avatarUrl ? (
                                                    <Image
                                                        src={userData.user.avatarUrl}
                                                        alt={userData.user.fullName}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                                        <span className="text-2xl font-bold">{userData.user.fullName.charAt(0)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h2 className="text-2xl font-bold text-neutral-900">{userData.user.fullName}</h2>
                                                    <span className="w-2 h-2 rounded-full bg-green-500" title="Active"></span>
                                                    <span className="text-sm text-neutral-500 flex items-center gap-1">
                                                        User • Joined {new Date(userData.user.joinedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-3">
                                                    <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-sm font-medium flex items-center gap-2">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        {userData.user.email}
                                                    </span>
                                                    <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-sm font-medium flex items-center gap-2">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        {userData.user.phoneNumber}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Analytics Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="p-6 rounded-xl border border-neutral-200 bg-white shadow-sm flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-500">Total Contacts Initiated</p>
                                                    <p className="text-3xl font-bold text-neutral-900 mt-2">{userData.stats.totalContacts}</p>
                                                    <p className="text-xs text-purple-600 mt-1 font-medium bg-purple-50 px-2 py-0.5 rounded-full w-fit">Whatsapp / Call Clicks</p>
                                                </div>
                                                <div className="p-3 bg-purple-50 rounded-full">
                                                    <MessageCircle className="w-8 h-8 text-purple-200" />
                                                </div>
                                            </div>
                                            <div className="p-6 rounded-xl border border-neutral-200 bg-white shadow-sm flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-500">Total Properties Viewed</p>
                                                    <p className="text-3xl font-bold text-neutral-900 mt-2">{userData.stats.totalViews}</p>
                                                    <p className="text-xs text-blue-600 mt-1 font-medium bg-blue-50 px-2 py-0.5 rounded-full w-fit">Page Visits</p>
                                                </div>
                                                <div className="p-3 bg-blue-50 rounded-full">
                                                    <Eye className="w-8 h-8 text-blue-200" />
                                                </div>
                                            </div>
                                            <div className="p-6 rounded-xl border border-neutral-200 bg-white shadow-sm flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-500">Conversion Rate</p>
                                                    <p className="text-3xl font-bold text-neutral-900 mt-2">{userData.stats.conversionRate.toFixed(1)}%</p>
                                                    <p className="text-xs text-green-600 mt-1 font-medium bg-green-50 px-2 py-0.5 rounded-full w-fit">Contacts / Views</p>
                                                </div>
                                                <div className="p-3 bg-green-50 rounded-full">
                                                    <TrendingUp className="w-8 h-8 text-green-200" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. Tabs & Content */}
                                        <div>
                                            <div className="flex items-center gap-8 border-b border-neutral-200 mb-6">
                                                <button
                                                    onClick={() => setActiveTab('timeline')}
                                                    className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'timeline' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                                                >
                                                    Activity Timeline
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('leads')}
                                                    className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'leads' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                                                >
                                                    Leads Generated ({userData.stats.totalContacts})
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('views')}
                                                    className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'views' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                                                >
                                                    Properties Viewed ({userData.stats.totalViews})
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('inquiries')}
                                                    className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'inquiries' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                                                >
                                                    Inquiries ({userData.inquiries.length})
                                                </button>
                                            </div>

                                            <div className="overflow-x-auto min-h-[300px]">
                                                {/* TIMELINE TAB */}
                                                {activeTab === 'timeline' && (
                                                    <table className="w-full text-left">
                                                        <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase font-semibold">
                                                            <tr>
                                                                <th className="px-4 py-3 rounded-l-lg">Property</th>
                                                                <th className="px-4 py-3">Interaction</th>
                                                                <th className="px-4 py-3">Details</th>
                                                                <th className="px-4 py-3 rounded-r-lg">Date</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-neutral-100">
                                                            {userData.timeline.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">No activity recorded for this user.</td>
                                                                </tr>
                                                            ) : (
                                                                userData.timeline.map((item) => (
                                                                    <tr key={`${item.type}-${item.id}`} className="hover:bg-neutral-50/50 transition-colors">
                                                                        <td className="px-4 py-4">
                                                                            {item.propertyHandle ? (
                                                                                <Link href={`/product/${item.propertyHandle}`} target="_blank" className="font-medium text-blue-600 hover:underline flex items-center gap-1">
                                                                                    {item.propertyName} <ExternalLink className="w-3 h-3" />
                                                                                </Link>
                                                                            ) : (
                                                                                <span className="text-neutral-900">{item.propertyName}</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-4">
                                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${item.type === 'contact' ? 'bg-purple-100 text-purple-700' :
                                                                                    item.type === 'view' ? 'bg-blue-100 text-blue-700' :
                                                                                        'bg-orange-100 text-orange-700'
                                                                                }`}>
                                                                                {item.type === 'contact' && <MessageCircle className="w-3 h-3" />}
                                                                                {item.type === 'view' && <Eye className="w-3 h-3" />}
                                                                                {item.type === 'inquiry' && <Mail className="w-3 h-3" />}
                                                                                {item.type === 'contact' ? 'Contacted' : item.type === 'view' ? 'Viewed' : 'Inquiry'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-4 text-sm text-neutral-600 max-w-xs truncate" title={item.details}>
                                                                            {item.details}
                                                                        </td>
                                                                        <td className="px-4 py-4 text-sm text-neutral-500 whitespace-nowrap">
                                                                            {new Date(item.date).toLocaleString()}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                )}

                                                {/* LEADS TAB */}
                                                {activeTab === 'leads' && (
                                                    <table className="w-full text-left">
                                                        <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase font-semibold">
                                                            <tr>
                                                                <th className="px-4 py-3 rounded-l-lg">Property</th>
                                                                <th className="px-4 py-3">Type</th>
                                                                <th className="px-4 py-3 rounded-r-lg">Date</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-neutral-100">
                                                            {userData.leads.length === 0 ? (
                                                                <tr><td colSpan={3} className="px-4 py-8 text-center text-neutral-500">No leads generated.</td></tr>
                                                            ) : (
                                                                userData.leads.map((lead: any) => (
                                                                    <tr key={lead.id} className="hover:bg-neutral-50/50">
                                                                        <td className="px-4 py-4">
                                                                            <Link href={`/product/${lead.properties?.handle}`} target="_blank" className="font-medium text-blue-600 hover:underline">
                                                                                {lead.properties?.title || 'Unknown'}
                                                                            </Link>
                                                                        </td>
                                                                        <td className="px-4 py-4 text-sm text-neutral-600 capitalized">{lead.type}</td>
                                                                        <td className="px-4 py-4 text-sm text-neutral-500">{new Date(lead.created_at).toLocaleString()}</td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                )}

                                                {/* VIEWS TAB */}
                                                {activeTab === 'views' && (
                                                    <table className="w-full text-left">
                                                        <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase font-semibold">
                                                            <tr>
                                                                <th className="px-4 py-3 rounded-l-lg">Property</th>
                                                                <th className="px-4 py-3 rounded-r-lg"> viewed Date</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-neutral-100">
                                                            {userData.views.length === 0 ? (
                                                                <tr><td colSpan={2} className="px-4 py-8 text-center text-neutral-500">No views recorded.</td></tr>
                                                            ) : (
                                                                userData.views.map((view: any) => (
                                                                    <tr key={view.id} className="hover:bg-neutral-50/50">
                                                                        <td className="px-4 py-4">
                                                                            <Link href={`/product/${view.properties?.handle}`} target="_blank" className="font-medium text-blue-600 hover:underline">
                                                                                {view.properties?.title || 'Unknown'}
                                                                            </Link>
                                                                        </td>
                                                                        <td className="px-4 py-4 text-sm text-neutral-500">{new Date(view.viewed_at).toLocaleString()}</td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                )}

                                                {/* INQUIRIES TAB */}
                                                {activeTab === 'inquiries' && (
                                                    <table className="w-full text-left">
                                                        <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase font-semibold">
                                                            <tr>
                                                                <th className="px-4 py-3 rounded-l-lg">Subject</th>
                                                                <th className="px-4 py-3">Message</th>
                                                                <th className="px-4 py-3 rounded-r-lg">Date</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-neutral-100">
                                                            {userData.inquiries.length === 0 ? (
                                                                <tr><td colSpan={3} className="px-4 py-8 text-center text-neutral-500">No inquiries found.</td></tr>
                                                            ) : (
                                                                userData.inquiries.map((inq: any) => (
                                                                    <tr key={inq.id} className="hover:bg-neutral-50/50">
                                                                        <td className="px-4 py-4 font-medium text-neutral-900">{inq.subject}</td>
                                                                        <td className="px-4 py-4 text-sm text-neutral-600 max-w-md truncate">{inq.message}</td>
                                                                        <td className="px-4 py-4 text-sm text-neutral-500">{new Date(inq.created_at).toLocaleString()}</td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                )}

                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
