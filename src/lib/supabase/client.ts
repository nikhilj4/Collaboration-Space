import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // During build/SSR, if env vars are missing, return a stub to prevent build crash
    if (typeof window === 'undefined' && (!url || !key)) {
        return {} as any;
    }

    return createBrowserClient<Database>(url!, key!);
}
