import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    initialized: boolean;

    // Actions
    setSession: (session: Session | null) => void;
    initialize: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    session: null,
    user: null,
    isLoading: true,
    initialized: false,

    setSession: (session) => set({
        session,
        user: session?.user ?? null,
        isLoading: false
    }),

    initialize: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            set({
                session,
                user: session?.user ?? null,
                initialized: true,
                isLoading: false
            });

            // Listen for auth changes
            supabase.auth.onAuthStateChange((_event, session) => {
                set({
                    session,
                    user: session?.user ?? null
                });
            });
        } catch (error) {
            console.error('Auth initialization failed:', error);
            set({ isLoading: false, initialized: true });
        }
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null });
    },
}));
