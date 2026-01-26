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
                // Only refresh if not already establishing the initial session to avoid loops on load
                // But user asked for immediate hard refresh.
                // We'll trust the "SIGNED_IN" event usually implies a state change.
                // Check if we are already on home to prevent infinite reload on home? 
                // No, SIGNED_IN doesn't fire on every reload if session is just restored (INITIAL_SESSION does).
                window.location.href = '/';
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
