'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { updateUserProfile } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
    const { user } = useAuth();
    const [profession, setProfession] = useState<string>('');
    const [otherDescription, setOtherDescription] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!user) return;
        setError('');

        if (!contactNumber || contactNumber.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        if (!profession) {
            setError('Please select a profession');
            return;
        }

        let finalProfession = profession;
        if (profession === 'Other') {
            if (!otherDescription.trim()) {
                setError('Please provide a description.');
                return;
            }
            if (otherDescription.trim().length > 15) {
                setError('Description is too long (max 15 chars).');
                return;
            }
            finalProfession = `Other: ${otherDescription.trim()}`;
        }

        setLoading(true);
        try {
            const res = await updateUserProfile(user.id, finalProfession, contactNumber);
            if (res.success) {
                // Start WhatsApp Popup Timer
                if (typeof window !== 'undefined') {
                    localStorage.setItem('nbf_profile_saved_timestamp', Date.now().toString());
                }
                onComplete();
            } else {
                setError('Failed to save profile. Please try again.');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-white text-neutral-900 border-neutral-200" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Complete Your Profile</DialogTitle>
                    <DialogDescription>
                        Please tell us a bit about yourself to get the best experience.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                            type="tel"
                            placeholder="Enter your mobile number"
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>What do you do?</Label>
                        <Select value={profession} onValueChange={setProfession}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your profession" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-neutral-200">
                                <SelectItem value="Student">Student</SelectItem>
                                <SelectItem value="Working Professional">Working Professional</SelectItem>
                                <SelectItem value="Property Owner">Property Owner</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {profession === 'Other' && (
                        <div className="space-y-2">
                            <Label>Tell us more about what you do (max 15 chars)</Label>
                            <Textarea
                                value={otherDescription}
                                onChange={(e) => setOtherDescription(e.target.value)}
                                placeholder="e.g. Graphic Designer"
                                className="h-24 resize-none"
                                maxLength={15}
                            />
                            <p className="text-xs text-neutral-500 text-right">
                                {otherDescription.length} / 15 characters
                            </p>
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                    )}

                    <div className="flex justify-end pt-2">
                        <Button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto">
                            {loading ? 'Saving...' : 'Save & Continue'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
