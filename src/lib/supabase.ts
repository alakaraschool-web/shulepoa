import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback to provided credentials if env vars are missing or invalid (like "your-supabase-url")
if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  supabaseUrl = 'https://fkluhkewaxdutcryetpn.supabase.co';
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-supabase-anon-key') {
  supabaseAnonKey = 'sb_publishable_dABXvo2LJ0zndT3a-qLeNg_afNMP0Mj';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
