import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const isNode = typeof process !== 'undefined' && process.env;
const envObj = isNode ? process.env : (import.meta as any).env;
const supabaseUrl = envObj?.VITE_SUPABASE_URL;
const supabaseAnonKey = envObj?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

