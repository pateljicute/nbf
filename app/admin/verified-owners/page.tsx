'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { BadgeCheck, Search, ArrowLeft, ShieldOff, Shield, Home, ShoppingBag, RefreshCw, User } from 'lucide-react';
import { toast } from 'sonner';
import { toggleUserVerifiedAction } from '@/app/actions';
import { getAdminUsers } from '@/lib/api';
import Image from 'next/image';

interface AdminUser {
    userId: string;
    name: string;
    email: string;
    contactNumber: string;
    role: string;
    isVerified: boolean;
    totalProperties: number;
    activeProperties: number;
    status: string;
    createdAt: string;
    avatar?: string;
}

export default function VerifiedOwnersPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAdminUsers(1, 1000, ''); // get all users
            setUsers(data?.users || []);
        } catch (e) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isLoading && !user) router.push('/');
        if (user) fetchUsers();
    }, [user, isLoading]);

    const handleToggleVerified = async (userId: string, currentStatus: boolean) => {
        setUpdatingId(userId);
        try {
            await toggleUserVerifiedAction(userId, !currentStatus, user?.id || '');
            setUsers(prev => prev.map(u =>
                u.userId === userId ? { ...u, isVerified: !currentStatus } : u
            ));
            toast.success(currentStatus
                ? 'Verified badge removed'
                : '✅ Owner verified successfully! Badge will appear on all their properties.');
        } catch (e) {
            toast.error('Failed to update verification status');
        } finally {
            setUpdatingId(null);
        }
    };

    const filtered = users.filter(u => {
        const matchSearch =
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase()) ||
            u.contactNumber?.includes(search);
        const matchFilter =
            filter === 'all' ||
            (filter === 'verified' && u.isVerified) ||
            (filter === 'unverified' && !u.isVerified);
        return matchSearch && matchFilter;
    });

    const verifiedCount = users.filter(u => u.isVerified).length;
    const unverifiedCount = users.filter(u => !u.isVerified).length;

    if (isLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-[3px] border-neutral-100 border-t-black animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 pb-24">
            {/* Header */}
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()}
                            className="p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-neutral-900 flex items-center gap-2">
                                <BadgeCheck className="w-6 h-6 text-blue-600" />
                                Verified Owners
                            </h1>
                            <p className="text-xs text-neutral-500 font-medium">
                                Manage owner verification badges (Instagram-style ✓)
                            </p>
                        </div>
                    </div>
                    <button onClick={fetchUsers}
                        className="p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 transition-colors">
                        <RefreshCw className="w-4 h-4 text-neutral-500" />
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Users', value: users.length, color: 'bg-neutral-900 text-white' },
                        { label: 'Verified', value: verifiedCount, color: 'bg-blue-600 text-white' },
                        { label: 'Pending', value: unverifiedCount, color: 'bg-orange-500 text-white' },
                    ].map(stat => (
                        <div key={stat.label} className={`${stat.color} rounded-2xl p-4 text-center shadow-sm`}>
                            <div className="text-2xl font-black">{stat.value}</div>
                            <div className="text-xs font-bold opacity-80 uppercase tracking-widest">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 shadow-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'verified', 'unverified'] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                                    filter === f
                                        ? 'bg-black text-white'
                                        : 'bg-white border border-neutral-200 text-neutral-500 hover:border-neutral-400'
                                }`}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* How it works */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
                    <BadgeCheck className="w-8 h-8 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-black text-blue-800">How Verification Works</p>
                        <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                            When you verify an owner, a <strong>blue verified badge ✓</strong> automatically appears on:
                            all their property listings, on the contact button section, and on their owner profile.
                            Verification is instant — no page reload needed.
                        </p>
                    </div>
                </div>

                {/* Users List */}
                <div className="space-y-3">
                    {filtered.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200">
                            <User className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
                            <p className="text-neutral-400 font-bold">No users found</p>
                        </div>
                    ) : (
                        filtered.map(u => (
                            <div key={u.userId}
                                className={`bg-white rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all shadow-sm ${
                                    u.isVerified ? 'border-blue-200 bg-blue-50/30' : 'border-neutral-200'
                                }`}>

                                {/* Avatar */}
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg ${
                                    u.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-500'
                                }`}>
                                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-black text-neutral-900">{u.name || 'Unknown'}</span>
                                        {u.isVerified && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black">
                                                <BadgeCheck className="w-3 h-3" />
                                                VERIFIED
                                            </span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                            u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-neutral-100 text-neutral-500'
                                        }`}>{u.role}</span>
                                    </div>
                                    <p className="text-sm text-neutral-500 mt-0.5 truncate">{u.email}</p>
                                    <div className="flex items-center gap-4 mt-1.5">
                                        {u.contactNumber && (
                                            <span className="text-xs text-neutral-400 font-mono">{u.contactNumber}</span>
                                        )}
                                        <span className="flex items-center gap-1 text-xs text-neutral-400">
                                            <Home className="w-3 h-3" />
                                            {u.totalProperties || 0} properties
                                        </span>
                                    </div>
                                </div>

                                {/* Verify Toggle */}
                                <button
                                    onClick={() => handleToggleVerified(u.userId, u.isVerified)}
                                    disabled={updatingId === u.userId}
                                    className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                        u.isVerified
                                            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                                    }`}
                                >
                                    {updatingId === u.userId ? (
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : u.isVerified ? (
                                        <><ShieldOff className="w-4 h-4" /> Remove</>
                                    ) : (
                                        <><BadgeCheck className="w-4 h-4" /> Verify</>
                                    )}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
