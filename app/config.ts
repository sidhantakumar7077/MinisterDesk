import { createClient } from '@supabase/supabase-js';
// Use environment variables if present (local dev)
// Otherwise keep placeholders for CI/CD replacement
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://nwvdjnizzifwkkruyuvf.supabase.co";
export const SUPABASE_API_KEY = process.env.EXPO_PUBLIC_SUPABASE_API_KEY || "SUPABASE_API_KEY_PLACEHOLDER";
export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_API_KEY
);