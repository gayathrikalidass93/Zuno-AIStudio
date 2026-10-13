import { createClient } from '@supabase/supabase-js';

declare const __SUPABASE_URL__: string;
declare const __SUPABASE_PUBLISHABLE_KEY__: string;

/**
 * Browser-safe Supabase client.
 *
 * Only the project URL and publishable key are exposed to the browser.
 * Never expose a Supabase secret key, service_role key, or database password.
 *
 * This client is intentionally optional during the staged migration so the
 * existing localStorage-based demo continues to run until data access and
 * authentication have been migrated and tested.
 */
const supabaseUrl = __SUPABASE_URL__.trim();
const supabasePublishableKey = __SUPABASE_PUBLISHABLE_KEY__.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
