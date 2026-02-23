import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// If the URL or Key is completely missing (e.g. Vercel deployment without Env Vars added),
// this prevents a fatal TypeError that crashes the whole Javascript runtime silently.
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: Platform.OS === 'web',
        },
    })
    : {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: new Error('Missing Supabase variables') }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signOut: () => Promise.resolve(),
            startAutoRefresh: () => { },
            stopAutoRefresh: () => { }
        }
    } as any;

AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth?.startAutoRefresh?.();
    } else {
        supabase.auth?.stopAutoRefresh?.();
    }
});
