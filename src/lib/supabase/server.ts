import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for Server Components/Actions/Route Handlers —
 * reads/writes the session via cookies so `auth.uid()` resolves correctly in
 * RLS policies. Still uses the publishable (anon) key; privilege comes from
 * the authenticated session, not an elevated key.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component without write access to cookies —
            // safe to ignore as long as middleware refreshes the session.
          }
        },
      },
    },
  );
}
