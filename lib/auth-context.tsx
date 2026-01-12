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

    if (typeof window !== 'undefined') {
        console.log('[AuthContext] AuthProvider rendering');
    }

    // Use the global singleton client from lib/db.ts
    // const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        let mounted = true;

        // Check active session
        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);

                    if (session?.user) {
                        const { data } = await supabase
                            .from('users')
                            .select('*') // Select all available fields to be safe, or specify known ones if 'role' is missing
                            .eq('id', session.user.id)
                            .single();
                        if (mounted) {
                            // Assuming we had a profile state, but we removed it. 
                            // Wait, I see I removed profile state in Step 447/448? 
                            // The user diff showed removal of profile state. 
                            // So I should NOT try to set profile here.
                        }
                    }
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Auth check error:", error);
                if (mounted) setIsLoading(false);
            }
        };

        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (mounted) {
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
