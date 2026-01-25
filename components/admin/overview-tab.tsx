import { Building, TrendingUp, Users } from "lucide-react";

interface OverviewTabProps {
    stats: {
        total: number;
        users: number;
        active: number;
    };
}

export function OverviewTab({ stats }: OverviewTabProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-neutral-600">Total Properties</p>
                        <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.total}</p>
                    </div>
                    <Building className="w-12 h-12 text-blue-500 opacity-20" />
                </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-neutral-600">Total Users</p>
                        <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.users}</p>
                    </div>
                    <Users className="w-12 h-12 text-green-500 opacity-20" />
                </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-neutral-600">Active Listings</p>
                        <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.active}</p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-orange-500 opacity-20" />
                </div>
            </div>
        </div>
    );
}
