import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client using the secret (service_role) key — bypasses
 * RLS entirely. Only for server-only code: migration/seed scripts and Studio
 * server actions that must write regardless of policy. The `server-only`
 * import makes any accidental client-component import a build error instead
 * of a leaked secret key in the browser bundle.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
