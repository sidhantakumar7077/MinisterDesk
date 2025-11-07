// config.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Prefer env vars; fall back to hardcoded strings for local dev.
export const SUPABASE_URL =
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://YOUR-PROJECT.supabase.co';

export const SUPABASE_API_KEY =
    process.env.EXPO_PUBLIC_SUPABASE_API_KEY ?? 'YOUR_ANON_PUBLIC_KEY';

// Create a client that PERSISTS the session on device storage.
export const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // RN apps don't use URL callbacks
        storage: AsyncStorage,     // <-- critical on React Native
    },
});