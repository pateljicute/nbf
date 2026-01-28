'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/db';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
    const router = useRouter();

    useEffect(() => {
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
            return false;
        };

        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted && session?.user) {
                    // Check ban status only if we have a session
                    const isBanned = await verifyBanStatus(session.user.id);
                    if (isBanned) return;

                    setSession(session);
                    setUser(session.user);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (process.env.NODE_ENV === 'development') {
                console.log('Auth State Change:', event, session?.user?.email);
            }

            if (event === 'SIGNED_IN') {
                router.refresh(); // Soft refresh to update server components
            } else if (event === 'SIGNED_OUT') {
                router.refresh();
                setUser(null);
                setSession(null);
            }

            if (mounted) {
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
    }, [router]);

    const loginWithGoogle = async () => {
        setIsLoading(true);
        // PWA Requirement: Explicit redirect URL to avoid popup issues
        const redirectUrl = `${window.location.origin}/auth/callback`;

        const attemptLogin = async (retryCount = 0) => {
            try {
                // Loading Guard: 15 seconds timeout
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('TIMEOUT')), 15000)
                );

                const loginPromise = supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: redirectUrl,
                        skipBrowserRedirect: false, // Ensure full redirect for PWA
                        flowType: 'pkce', // Force PKCE flow for better stability
                    },
                });

                const result: any = await Promise.race([loginPromise, timeoutPromise]);
                const { error } = result;

                if (error) throw error;

            } catch (error: any) {
                console.error('Login attempt failed:', error);

                // Timeout Error
                if (error.message === 'TIMEOUT') {
                    toast.error("Google Server busy, try again");
                    setIsLoading(false);
                    return;
                }

                // Retry Logic (one retry after 2 seconds)
                if (retryCount < 1) {
                    console.log('Retrying login in 2 seconds...');
                    setTimeout(() => attemptLogin(retryCount + 1), 2000);
                    return;
                }

                // Final Error Handling
                toast.error(error.message || "Failed to connect to Google");
                setIsLoading(false);
            }
        };

        attemptLogin();
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error logging out:', error);

        setUser(null);
        setSession(null);
        router.refresh();
        router.push('/');
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
