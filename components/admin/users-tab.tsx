'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, CheckCircle, Ban, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAdminUsers, banUser, getUserActivityData, UserActivityData } from '@/lib/api'; // banUser might not be needed if using server action directly? original code used banUserAction
import { updateUserRoleAction, toggleUserVerifiedAction, banUserAction, unbanUserAction } from '@/app/actions';
import { UserPropertiesModal } from '@/components/admin/UserPropertiesModal';
// import UserInfoModal from '@/components/admin/UserInfoModal'; // Removed in favor of UserActivityModal
import UserActivityModal from '@/components/admin/UserActivityModal';
import { getUserPropertiesForAdmin } from '@/lib/api';

// Defined locally in original file
interface AdminUser {
    userId: string;
    name: string;
    email: string;
    contactNumber: string;
    role: string;
    isVerified: boolean;
    totalProperties: number;
    activeProperties: number;
    profession: string;
    status: string;
    is_banned?: boolean;
}

interface UsersTabProps {
    user: any; // Current admin user
}

export function UsersTab({ user }: UsersTabProps) {
    const router = useRouter();
    const [usersList, setUsersList] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [selectedUserForProperties, setSelectedUserForProperties] = useState<{ id: string, name: string } | null>(null);
    const [userProperties, setUserProperties] = useState<any[]>([]); // Product[]
    const [userPropertiesLoading, setUserPropertiesLoading] = useState(false);
    const [selectedUserForInfo, setSelectedUserForInfo] = useState<AdminUser | null>(null);
    const [userActivityData, setUserActivityData] = useState<UserActivityData | null>(null);
    const [activityLoading, setActivityLoading] = useState(false);

    const ITEMS_PER_PAGE = 10;

    const fetchUsers = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const data = await getAdminUsers(page, ITEMS_PER_PAGE, searchQuery);
            setUsersList(data.users);
            setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
            setCurrentPage(page);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchUsers]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchUsers(newPage);
        }
    };

    const handleToggleBan = async (userItem: AdminUser) => {
        const isBanning = !userItem.is_banned && userItem.status !== 'banned';
        let reason = '';

        if (isBanning) {
            reason = prompt("Enter ban reason (optional):") || "No reason provided";
            if (!confirm(`Are you sure you want to ban this user? Reason: "${reason}"`)) return;
        } else {
            if (!confirm('Unban this user? They will regain access immediately.')) return;
        }

        // Optimistic Update
        const previousList = [...usersList];
        setUsersList(usersList.map(u =>
            u.userId === userItem.userId ? {
                ...u,
                status: isBanning ? 'banned' : 'active',
                is_banned: isBanning
            } : u
        ));

        try {
            if (!user) return;
            const res = isBanning
                ? await banUserAction(userItem.userId, reason, user.id)
                : await unbanUserAction(userItem.userId, user.id);

            if (!res.success) {
                // Revert on failure
                setUsersList(previousList);
                alert(`Failed to ${isBanning ? 'ban' : 'unban'} user: ${res.error}`);
            } else {
                router.refresh();
            }
        } catch (error) {
            setUsersList(previousList);
            alert(`Error ${isBanning ? 'banning' : 'unbanning'} user`);
        }
    };

    const handleUserPropertiesClick = async (userId: string, userName: string) => {
        setSelectedUserForProperties({ id: userId, name: userName });
        setUserPropertiesLoading(true);
        try {
            const props = await getUserPropertiesForAdmin(userId);
            setUserProperties(props);
        } catch (err) {
            alert('Failed to load user properties');
        } finally {
            setUserPropertiesLoading(false);
        }
    };

    const handleUserInfoClick = async (userItem: AdminUser) => {
        setActivityLoading(true);
        setSelectedUserForInfo(userItem);
        try {
            const data = await getUserActivityData(userItem.userId);
            setUserActivityData(data);
        } catch (error) {
            console.error("Failed to load user activity", error);
        } finally {
            setActivityLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <UserPropertiesModal
                isOpen={!!selectedUserForProperties}
                onClose={() => { setSelectedUserForProperties(null); setUserProperties([]); }}
                userName={selectedUserForProperties?.name || 'User'}
                properties={userProperties}
                loading={userPropertiesLoading}
            />

            <UserActivityModal
                isOpen={!!selectedUserForInfo}
                onClose={() => { setSelectedUserForInfo(null); setUserActivityData(null); }}
                userData={userActivityData}
                loading={activityLoading}
            />

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-neutral-900">Registered Users</h2>
                    <span className="text-sm text-neutral-500">Page {currentPage} of {totalPages}</span>
                </div>

                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto w-full">
                            <table className="w-full table-auto min-w-full">
                                <thead className="bg-neutral-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Properties</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Action</th>
                                    </tr >
                                </thead >
                                <tbody className="bg-white divide-y divide-neutral-200">
                                    {usersList.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                                                No users found.
                                            </td>
                                        </tr>
                                    ) : (
                                        usersList.map((userItem) => (
                                            <tr key={userItem.userId} className="hover:bg-neutral-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900" title={userItem.userId}>
                                                    {userItem.userId.substring(0, 8)}...
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                                    <div className="flex items-center gap-2">
                                                        {userItem.name}
                                                        {(userItem.status === 'banned' || userItem.is_banned) && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                Banned
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                                    {userItem.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                                    <div className="flex items-center gap-2">
                                                        {userItem.contactNumber}
                                                        {userItem.contactNumber !== 'N/A' && (
                                                            <a
                                                                href={`https://wa.me/${userItem.contactNumber.replace(/\D/g, '')}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1 rounded-full transition-colors"
                                                                title="Chat on WhatsApp"
                                                            >
                                                                <MessageCircle className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                                    <button
                                                        onClick={() => handleUserPropertiesClick(userItem.userId, userItem.name)}
                                                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1"
                                                    >
                                                        {userItem.totalProperties} Properties
                                                        {/* Icon was Eye in original */}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleUserInfoClick(userItem)}
                                                            className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 p-1.5 rounded-lg transition-colors border border-transparent hover:border-neutral-200"
                                                            title="User Activity Dashboard"
                                                        >
                                                            <Info className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleBan(userItem)}
                                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors border flex items-center gap-1 ${(userItem.status === 'banned' || userItem.is_banned)
                                                                ? 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200'
                                                                : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200'
                                                                }`}
                                                        >
                                                            {(userItem.status === 'banned' || userItem.is_banned) ? (
                                                                <>
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    Unban
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Ban className="w-3 h-3" />
                                                                    Ban
                                                                </>
                                                            )}
                                                        </button>

                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table >
                        </div >

                        {/* Pagination Controls */}
                        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between" >
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
                        </div >
                    </>
                )}
            </div >
        </div >
    );
}
