import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your actual Supabase URL and Anon Key
const supabaseUrl = process.env.SUPABASE_URL || 'https://fake-project-id.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

if (supabaseUrl === 'https://fake-project-id.supabase.co' || supabaseAnonKey === 'your-anon-key') {
    console.warn("Supabase credentials are not set. Please update environment variables with your project's URL and Anon Key.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);