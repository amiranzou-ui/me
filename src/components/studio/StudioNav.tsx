"use client";

import { useState } from "react";
import Link from "next/link";

const links = [
  { href: "/studio/cv", label: "CV" },
  { href: "/studio/projects", label: "Projects" },
  { href: "/studio/gallery", label: "Gallery" },
  { href: "/studio/tracks", label: "Tracks" },
];
const external = [
  { href: "/matrix", label: "Matrix ↗" },
  { href: "/human", label: "Human ↗" },
];

const linkCls = "transition-colors hover:text-accent";

/**
 * The Studio header's nav had no mobile handling at all — seven links in
 * one unwrapped flex row just overflowed and got clipped on narrow
 * screens. Collapses into a toggled dropdown below a small breakpoint;
 * unchanged on desktop.
 */
export default function StudioNav({ signOutAction }: { signOutAction: () => Promise<void> }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <nav className="hidden items-center gap-6 font-sans text-[11px] uppercase tracking-wider text-brown sm:flex">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={linkCls}>
            {l.label}
          </Link>
        ))}
        {external.map((l) => (
          <Link key={l.href} href={l.href} target="_blank" className={linkCls}>
            {l.label}
          </Link>
        ))}
        <form action={signOutAction}>
          <button type="submit" className={linkCls}>
            Sign out
          </button>
        </form>
      </nav>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex flex-col gap-1.5 p-1 sm:hidden"
      >
        <span className={`block h-px w-5 bg-ink transition-transform ${open ? "translate-y-[3px] rotate-45" : ""}`} />
        <span className={`block h-px w-5 bg-ink transition-opacity ${open ? "opacity-0" : ""}`} />
        <span
          className={`block h-px w-5 bg-ink transition-transform ${open ? "-translate-y-[3px] -rotate-45" : ""}`}
        />
      </button>

      {open && (
        <nav className="absolute right-0 top-full z-20 mt-3 flex w-48 flex-col gap-4 border border-tan bg-cream p-5 font-sans text-xs uppercase tracking-wider text-brown shadow-lg sm:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          {external.map((l) => (
            <Link key={l.href} href={l.href} target="_blank" className={linkCls} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <form action={signOutAction}>
            <button type="submit" className={linkCls}>
              Sign out
            </button>
          </form>
        </nav>
      )}
    </div>
  );
}
