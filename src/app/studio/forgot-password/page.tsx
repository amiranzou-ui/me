"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/**
 * Must be the one to call resetPasswordForEmail — the PKCE code_verifier it
 * generates is stored in this browser, and /studio/reset-password later
 * needs it to exchange the emailed code for a session. A Dashboard-triggered
 * reset has no verifier and will always fail exchangeCodeForSession.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/studio/reset-password`,
    });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl italic text-ink text-center mb-1">Studio</h1>
        <p className="font-sans text-xs uppercase tracking-widest text-brown text-center mb-10">
          Reset your password
        </p>

        {sent ? (
          <p className="text-center text-sm text-brown">
            If that email has a Studio account, a reset link is on its way. Open it in this
            same browser.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="font-sans text-[11px] uppercase tracking-wider text-brown">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-tan bg-cream-alt px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </div>

            {error && <p className="text-xs text-accent">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 bg-ink py-2.5 text-xs uppercase tracking-widest text-cream transition-colors hover:bg-accent disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <Link href="/studio/login" className="mt-6 block text-center text-xs text-brown hover:text-accent">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
