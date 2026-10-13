import { createClient } from '@supabase/supabase-js';

/**
 * Browser-safe Supabase client.
 *
 * Only the project URL and publishable key belong in VITE_* variables.
 * Never expose a service_role key or database password to the browser.
 *
 * This client is intentionally optional during the staged migration so the
 * existing localStorage-based demo continues to run until data access and
 * authentication have been migrated and tested.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
