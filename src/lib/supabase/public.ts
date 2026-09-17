import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Anonymous Supabase client for public, unauthenticated reads — no
 * `cookies()` access, unlike `./server.ts`'s session-aware client. Next.js
 * treats any `cookies()` read as a request-time API and forces the whole
 * render dynamic, which is what was silently defeating `revalidate = 60` on
 * every public page. Public pages (`/`, `/human`, `/matrix`,
 * `/project/[slug]`) only ever read rows their RLS `public_read`/
 * `public_read_published` policies already expose to anyone — no session is
 * needed, so this client is safe wherever `server.ts`'s is overkill.
 *
 * Studio pages/actions must keep using `server.ts` — this client can't
 * resolve `auth.uid()`, so `is_owner()` RLS checks would fail against it.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
