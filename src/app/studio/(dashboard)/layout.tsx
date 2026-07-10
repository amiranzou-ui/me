import Link from "next/link";
import { signOut } from "../actions";

export default function StudioDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream">
      <header className="flex items-center justify-between border-b border-tan px-8 py-4">
        <Link href="/studio" className="font-serif text-xl italic text-ink">
          Studio
        </Link>
        <nav className="flex items-center gap-6 font-sans text-[11px] uppercase tracking-wider text-brown">
          <Link href="/studio/cv" className="transition-colors hover:text-accent">
            CV
          </Link>
          <Link href="/studio/projects" className="transition-colors hover:text-accent">
            Projects
          </Link>
          <Link href="/matrix" target="_blank" className="transition-colors hover:text-accent">
            View live ↗
          </Link>
          <form action={signOut}>
            <button type="submit" className="transition-colors hover:text-accent">
              Sign out
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-8 py-12">{children}</main>
    </div>
  );
}
