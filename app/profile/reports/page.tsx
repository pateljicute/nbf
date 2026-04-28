'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUserReportsAction } from '@/app/actions';
import { motion } from 'framer-motion';
import { ChevronLeft, Flag, HelpCircle, CheckCircle, AlertTriangle, MessageCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function UserReportsPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [supportRequests, setSupportRequests] = useState<any[]>([]);
    const [propertyReports, setPropertyReports] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'property' | 'support'>('property');

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const fetchReports = async () => {
            if (user) {
                setLoading(true);
                try {
                    const phone = user.user_metadata?.phone?.replace('+91', '') || '';
                    const res = await getUserReportsAction(user.id, user.email || '', phone);
                    setSupportRequests(res.supportRequests || []);
                    setPropertyReports(res.propertyReports || []);
                } catch (error) {
                    console.error("Failed to fetch reports:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        if (user) {
            fetchReports();
        }
    }, [user]);

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen bg-neutral-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8"
        >
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div>
                    <Link href="/profile" className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-black mb-4 transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">Your Reports</h1>
                            <p className="text-neutral-500 mt-1">Track the status of your property reports and support requests.</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                    
                    {/* Tabs */}
                    <div className="flex border-b border-neutral-200">
                        <button
                            onClick={() => setActiveTab('property')}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors ${
                                activeTab === 'property' 
                                ? 'bg-red-50 text-red-600 border-b-2 border-red-600' 
                                : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                            }`}
                        >
                            <Flag className="w-4 h-4" />
                            Property Reports
                            <span className="ml-1 bg-white text-xs px-2 py-0.5 rounded-full border border-neutral-200 text-neutral-600">{propertyReports.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('support')}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors ${
                                activeTab === 'support' 
                                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                                : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                            }`}
                        >
                            <HelpCircle className="w-4 h-4" />
                            Account Support
                            <span className="ml-1 bg-white text-xs px-2 py-0.5 rounded-full border border-neutral-200 text-neutral-600">{supportRequests.length}</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-8">
                        {loading ? (
                            <div className="py-20 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                            </div>
                        ) : activeTab === 'property' ? (
                            propertyReports.length > 0 ? (
                                <div className="space-y-4">
                                    {propertyReports.map((report) => {
                                        const propTitle = report.subject?.split('Property: "')[1]?.replace(/".*/, '') || report.subject?.replace('[FLAGGED PROPERTY] ', '') || 'Reported Property';
                                        return (
                                            <div key={report.id} className="border border-neutral-200 rounded-xl p-5 hover:bg-neutral-50 transition-colors">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                            report.status === 'new' || !report.status ? 'bg-orange-100 text-orange-700' :
                                                            report.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>
                                                            {report.status === 'new' || !report.status ? <Clock className="w-3.5 h-3.5" /> :
                                                             report.status === 'reviewed' ? <CheckCircle className="w-3.5 h-3.5" /> :
                                                             <CheckCircle className="w-3.5 h-3.5" />}
                                                            {(!report.status || report.status === 'new') ? 'Pending Review' : report.status === 'reviewed' ? 'Under Review' : 'Resolved'}
                                                        </span>
                                                        <span className="text-xs text-neutral-400 font-medium">
                                                            {new Date(report.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <h3 className="font-bold text-neutral-900 mb-1">{propTitle}</h3>
                                                
                                                <div className="bg-neutral-100 rounded-lg p-3 mt-3 text-sm text-neutral-700">
                                                    <p className="font-bold text-xs text-neutral-500 uppercase tracking-wider mb-1">Your Message</p>
                                                    <p className="line-clamp-2">{report.message?.split('Details from User:')[1]?.trim() || report.message}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                                    <Flag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                                    <h3 className="text-base font-bold text-neutral-900">No Property Reports</h3>
                                    <p className="text-sm text-neutral-500 mt-1">You haven't reported any properties yet.</p>
                                </div>
                            )
                        ) : (
                            supportRequests.length > 0 ? (
                                <div className="space-y-4">
                                    {supportRequests.map((req) => (
                                        <div key={req.id} className="border border-neutral-200 rounded-xl p-5 hover:bg-neutral-50 transition-colors">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                        req.status === 'new' || !req.status ? 'bg-orange-100 text-orange-700' :
                                                        req.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                        {req.status === 'new' || !req.status ? <Clock className="w-3.5 h-3.5" /> :
                                                         req.status === 'reviewed' ? <CheckCircle className="w-3.5 h-3.5" /> :
                                                         <CheckCircle className="w-3.5 h-3.5" />}
                                                        {(!req.status || req.status === 'new') ? 'Pending Review' : req.status === 'reviewed' ? 'Under Review' : 'Resolved'}
                                                    </span>
                                                    <span className="text-xs text-neutral-400 font-medium">
                                                        {new Date(req.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <h3 className="font-bold text-neutral-900 mb-1">{req.subject}</h3>
                                            
                                            <div className="bg-neutral-100 rounded-lg p-3 mt-3 text-sm text-neutral-700">
                                                <p className="font-bold text-xs text-neutral-500 uppercase tracking-wider mb-1">Your Message</p>
                                                <p className="line-clamp-2">{req.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                                    <HelpCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                                    <h3 className="text-base font-bold text-neutral-900">No Support Requests</h3>
                                    <p className="text-sm text-neutral-500 mt-1">You haven't submitted any account support requests.</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
