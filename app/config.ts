// config.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Prefer env vars; fall back to hardcoded strings for local dev.
export const SUPABASE_URL =
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://nwdvjnizzifwkkruyuvf.supabase.co';

export const SUPABASE_API_KEY =
    process.env.EXPO_PUBLIC_SUPABASE_API_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53dmRqbml6emlmd2trcnV5dXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NTAwMDQsImV4cCI6MjA3NTIyNjAwNH0.6qhN8vbUaCS4Hjh78jkXft4-jDdqh76IDaHMY3u5GUM';

// Create a client that PERSISTS the session on device storage.
export const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // RN apps don't use URL callbacks
        storage: AsyncStorage,     // <-- critical on React Native
    },
});