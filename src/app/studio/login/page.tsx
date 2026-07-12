"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "./actions";

/**
 * The Studio's own login screen — deliberately calm, matching the public
 * site's typography/color tokens rather than a generic admin-template look,
 * per ARCHITECTURE.md's Studio-as-product philosophy. Single owner account,
 * no signup surface.
 */
export default function StudioLoginPage() {
  const [state, formAction, pending] = useActionState(signIn, undefined);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl italic text-ink text-center mb-1">Studio</h1>
        <p className="font-sans text-xs uppercase tracking-widest text-brown text-center mb-10">
          Private — owner only
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="font-sans text-[11px] uppercase tracking-wider text-brown">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="border border-tan bg-cream-alt px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="font-sans text-[11px] uppercase tracking-wider text-brown">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="border border-tan bg-cream-alt px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          {state?.error && <p className="text-xs text-accent">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 bg-ink py-2.5 text-xs uppercase tracking-widest text-cream transition-colors hover:bg-accent disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <Link
          href="/studio/forgot-password"
          className="mt-6 block text-center text-xs text-brown hover:text-accent"
        >
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
