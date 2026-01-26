'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/db';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);



    useEffect(() => {
        // Smart Refresh: Check if we just logged in and are on the home page
        if (typeof window !== 'undefined') {
            const justLoggedIn = localStorage.getItem('just_logged_in');
            if (justLoggedIn && window.location.pathname === '/') {
                console.log('Smart Refresh: Triggering hard reload on Home Page to sync session...');
                localStorage.removeItem('just_logged_in');
                window.location.reload();
                return; // Stop execution to allow reload
            }
        }

        let mounted = true;

        const verifyBanStatus = async (uid: string) => {
            // Check public.users first (Primary Source)
            const { data: userData } = await supabase
                .from('users')
                .select('is_banned')
                .eq('id', uid)
                .single();

            if (userData?.is_banned) {
                if (mounted) {
                    await supabase.auth.signOut();
                    window.location.href = '/banned';
                }
                return true;
            }

            // Profiles check removed
            return false;
        };

        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted) {
                    if (session?.user) {
                        const isBanned = await verifyBanStatus(session.user.id);
                        if (isBanned) return;
                    }
                    setSession(session);
                    setUser(session?.user ?? null);
                    setIsLoading(false);
                }
            } catch (error) {
                if (mounted) setIsLoading(false);
            } finally {
                // Check complete
            }
        };

        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (process.env.NODE_ENV === 'development') {
                console.log('Auth State Change:', event, session?.user?.email);
            }

            // Force Hard Refresh on Sign In (PWA Fix as requested)
            if (event === 'SIGNED_IN') {
                console.log('Auth State Change: SIGNED_IN. Session User:', session?.user);

                // Set flag for Smart Refresh on next load (specifically for Home Page)
                localStorage.setItem('just_logged_in', 'true');

            } else if (event === 'SIGNED_OUT') {
                console.log('Auth State Change: SIGNED_OUT');
                localStorage.removeItem('just_logged_in');
            }

            if (mounted) {
                console.log('Updating Auth Context State. User found:', !!session?.user);
                if (session?.user) {
                    const isBanned = await verifyBanStatus(session.user.id);
                    if (isBanned) return;
                }
                setSession(session);
                setUser(session?.user ?? null);
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const loginWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) console.error('Error logging in with Google:', error);

        // Note: Actual redirection happens via Supabase, but if we needed to force state:
        // window.location.href = '/'; 
        // Logic handled by callback, but adding listener refresh:
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error logging out:', error);

        // Zero Lag Cleanup
        localStorage.clear();
        sessionStorage.clear(); // Good practice to clear session too

        // Hard Redirect to flush memory state
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, session, loginWithGoogle, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        // Fallback for SSR or if Provider is missing to prevent crash
        return {
            user: null,
            session: null,
            loginWithGoogle: async () => { },
            logout: async () => { },
            isLoading: true
        };
    }
    return context;
}
