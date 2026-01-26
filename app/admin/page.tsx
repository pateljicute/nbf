'use client';

// Force dynamic rendering to handle cookie-based auth checks
export const dynamic = 'force-dynamic';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { checkAdminStatus, saveAdminSubscription } from '@/app/actions';
import { getAdminStats, getUnreadInquiriesCount } from '@/lib/api';

import { OverviewTab } from '@/components/admin/overview-tab';
import { PropertiesTab } from '@/components/admin/properties-tab';
import { UsersTab } from '@/components/admin/users-tab';
import { ApprovalsTab } from '@/components/admin/approvals-tab';
import { InquiriesTab } from '@/components/admin/inquiries-tab';
import { LeadsTab } from '@/components/admin/leads-tab';
import { SettingsTab } from '@/components/admin/settings-tab';
import { AdManager } from '@/components/admin/ad-manager';

export default function AdminPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminChecked, setAdminChecked] = useState(false);
    const [stats, setStats] = useState({ total: 0, users: 0, active: 0 });
    const [unreadInquiries, setUnreadInquiries] = useState(0);
    const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'users' | 'approvals' | 'settings' | 'ads' | 'inquiries' | 'leads'>('overview');
    const [mounted, setMounted] = useState(false);

    // Hydration check
    useEffect(() => {
        setMounted(true);
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => registration.pushManager.getSubscription())
                .then(sub => setPushSubscription(sub))
                .catch(err => console.error('SW Error', err));
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const data = await getAdminStats();
            setStats(data);
            const unread = await getUnreadInquiriesCount();
            setUnreadInquiries(unread);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const checkAdmin = useCallback(async () => {
        if (!user) return;
        const adminStatus = await checkAdminStatus(user.id);
        setIsAdmin(adminStatus);
        setAdminChecked(true);
        if (adminStatus) {
            fetchStats();
        }
    }, [user, fetchStats]);

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

    const subscribeToPush = async () => {
        if (!('serviceWorker' in navigator)) return;
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            });
            setPushSubscription(sub);
            await saveAdminSubscription(JSON.stringify(sub));
            alert('Admin Alerts Enabled!');
        } catch (err) {
            console.error('Push subscription failed:', err);
            // alert('Failed to enable alerts. Check console.');
        }
    };

    const unsubscribeFromPush = async () => {
        if (!('serviceWorker' in navigator)) return;
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            if (sub) await sub.unsubscribe();
            setPushSubscription(null);
            alert('Admin Alerts Disabled.');
        } catch (err) {
            console.error('Unsubscribe failed:', err);
        }
    };

    if (!mounted || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r hidden md:block fixed h-full z-10 overflow-y-auto pt-24">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-serif font-bold text-neutral-900">NBF Admin</h1>
                </div>
                {/* Navigation Links could go here if we moved tabs to real links, but for now tabs are client-state */}
            </aside>
            <main className="flex-1 ml-0 md:ml-64 p-8 overflow-y-auto w-full pt-28">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <div className="mb-8 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
                            <p className="text-neutral-600 mt-1">Manage platform activity</p>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-4 xl:mt-0 items-center justify-start xl:justify-end">
                            <button onClick={() => { setActiveTab('overview'); fetchStats(); }} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-transparent hover:border-neutral-200'}`}>Overview</button>
                            <button onClick={() => { setActiveTab('properties'); }} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'properties' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-transparent hover:border-neutral-200'}`}>Properties</button>
                            <button onClick={() => { setActiveTab('users'); }} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-transparent hover:border-neutral-200'}`}>Users</button>
                            <button onClick={() => { setActiveTab('approvals'); }} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'approvals' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-transparent hover:border-neutral-200'}`}>Approvals</button>
                            <button onClick={() => { setActiveTab('inquiries'); }} className={`relative px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'inquiries' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-transparent hover:border-neutral-200'}`}>
                                Inquiries
                                {unreadInquiries > 0 && (
                                    <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white`}>
                                        {unreadInquiries}
                                    </span>
                                )}
                            </button>
                            <button onClick={() => { setActiveTab('ads'); }} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ads' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-transparent hover:border-neutral-200'}`}>Manage Ads</button>
                            <button onClick={() => { setActiveTab('settings'); }} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-transparent hover:border-neutral-200'}`}>Settings</button>
                        </div>
                    </div>

                    {activeTab === 'overview' && <OverviewTab stats={stats} />}
                    {activeTab === 'properties' && <PropertiesTab user={user} onStatsUpdate={fetchStats} />}
                    {activeTab === 'users' && <UsersTab user={user} />}
                    {activeTab === 'approvals' && <ApprovalsTab user={user} onStatsUpdate={fetchStats} />}
                    {activeTab === 'inquiries' && <InquiriesTab />}
                    {activeTab === 'leads' && <LeadsTab />}
                    {activeTab === 'ads' && <div className="max-w-4xl mx-auto"><AdManager /></div>}
                    {activeTab === 'settings' && (
                        <SettingsTab
                            user={user}
                            pushSubscription={pushSubscription}
                            subscribeToPush={subscribeToPush}
                            unsubscribeFromPush={unsubscribeFromPush}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
