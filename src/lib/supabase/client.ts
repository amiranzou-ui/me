import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client, using the publishable (anon) key — safe to
 * expose, relies entirely on RLS policies for access control.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
