import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Mail, Phone, Briefcase, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

interface UserInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: AdminUser;
}

export default function UserInfoModal({ isOpen, onClose, user }: UserInfoModalProps) {
    if (!user) return null;

    // Parse profession if it contains "Other:"
    const isOther = user.profession?.startsWith('Other:');
    const mainProfession = isOther ? 'Other' : (user.profession || 'Not Specified');
    const otherDescription = isOther ? user.profession.replace('Other:', '').trim() : null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white text-neutral-900 border-neutral-200">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                        <Info className="w-5 h-5 text-neutral-500" />
                        User Details
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Header with Avatar placeholder */}
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 text-xl font-bold border border-neutral-200">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-neutral-900">{user.name}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.status === 'banned'
                                    ? 'bg-red-100 text-red-800 border-red-200'
                                    : 'bg-green-100 text-green-800 border-green-200'
                                }`}>
                                {user.status === 'banned' ? 'Banned' : 'Active'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <label className="text-xs text-neutral-500 block uppercase tracking-wide">Email Address</label>
                                <div className="text-neutral-900 font-medium">{user.email}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <label className="text-xs text-neutral-500 block uppercase tracking-wide">Mobile Number</label>
                                <div className="text-neutral-900 font-medium">{user.contactNumber}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <div>
                                <label className="text-xs text-neutral-500 block uppercase tracking-wide">Profession</label>
                                <div className="text-neutral-900 font-medium">{mainProfession}</div>
                                {otherDescription && (
                                    <div className="mt-2 text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-100 italic">
                                        "{otherDescription}"
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="w-full sm:w-auto"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
