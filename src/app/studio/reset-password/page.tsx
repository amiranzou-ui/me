"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Lands here from Supabase's password-recovery email link. The browser
 * client parses the recovery token from the URL on load and fires a
 * PASSWORD_RECOVERY auth event, which is the signal that updateUser({password})
 * is now allowed. Exempted from the owner-only gate in proxy.ts since the
 * visitor isn't authenticated as the owner yet when this page first loads.
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

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    const timeout = setTimeout(() => setChecking(false), 2000);

    return () => {
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
            This link is invalid or has expired. Send a new one from Supabase&apos;s dashboard
            (Authentication → Users → your account → Send password recovery).
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
