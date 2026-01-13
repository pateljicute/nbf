'use client';

import { useAuth } from '@/lib/auth-context';
import { OnboardingModal } from './onboarding-modal';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/db';

export function UserOnboardingManager() {
    const { user, isLoading } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        async function checkContact() {
            if (isLoading || !user || hasChecked) return;

            try {
                // Double check database for latest status (User object might be stale on session)
                const { data, error } = await supabase
                    .from('users')
                    .select('profession')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    // PGRST116: JSON object requested, but no row found (New User).
                    if (error.code === 'PGRST116') {
                        setShowModal(true);
                        return;
                    }
                    console.error('Error checking user contact:', JSON.stringify(error, null, 2));
                    return;
                }

                if (!data.profession) {
                    setShowModal(true);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setHasChecked(true);
            }
        }

        checkContact();
    }, [user, isLoading, hasChecked]);

    if (!showModal) return null;

    return (
        <OnboardingModal
            isOpen={showModal}
            onClose={() => setShowModal(false)} // Optional: allow closing? User request says "Immediately after login...". Maybe force? But modal has close button usually. I'll keep it dismissible for UX but it will pop up next time.
            onComplete={() => setShowModal(false)}
        />
    );
}
