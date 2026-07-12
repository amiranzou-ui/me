"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Lands here from the password-recovery email link. The link's flow depends
 * on how the reset was initiated:
 *  - Initiated via /studio/forgot-password (this app, PKCE): link carries
 *    ?code=... which must be exchanged using the code_verifier this same
 *    browser stored when it called resetPasswordForEmail.
 *  - Legacy/implicit style: link carries #access_token=...&type=recovery in
 *    the hash, auto-detected by the client and surfaced as a
 *    PASSWORD_RECOVERY auth event.
 * Either way, once a session exists, updateUser({password}) is allowed.
 * Exempted from the owner-only gate in proxy.ts since there's no session yet
 * on first load.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && !cancelled) {
        setReady(true);
        setChecking(false);
      }
    });

    const code = new URL(window.location.href).searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (cancelled) return;
        if (!error) setReady(true);
        setChecking(false);
      });
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (!cancelled && data.session) setReady(true);
      });
    }

    const timeout = setTimeout(() => !cancelled && setChecking(false), 2500);

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/studio"), 1200);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl italic text-ink text-center mb-1">Studio</h1>
        <p className="font-sans text-xs uppercase tracking-widest text-brown text-center mb-10">
          Set a new password
        </p>

        {checking && !ready && (
          <p className="text-center text-sm text-brown">Verifying link…</p>
        )}

        {!checking && !ready && !done && (
          <p className="text-center text-sm text-brown">
            This link is invalid or has expired.{" "}
            <a href="/studio/forgot-password" className="text-accent hover:underline">
              Request a new one
            </a>
            .
          </p>
        )}

        {ready && !done && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="font-sans text-[11px] uppercase tracking-wider text-brown">
                New password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-tan bg-cream-alt px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm" className="font-sans text-[11px] uppercase tracking-wider text-brown">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="border border-tan bg-cream-alt px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </div>

            {error && <p className="text-xs text-accent">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 bg-ink py-2.5 text-xs uppercase tracking-widest text-cream transition-colors hover:bg-accent disabled:opacity-50"
            >
              {pending ? "Saving…" : "Set password"}
            </button>
          </form>
        )}

        {done && (
          <p className="text-center text-sm text-brown">Password updated — taking you to the Studio…</p>
        )}
      </div>
    </div>
  );
}
