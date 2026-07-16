import Link from "next/link";
import { signOut } from "../actions";
import StudioNav from "@/components/studio/StudioNav";

export default function StudioDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream">
      <header className="flex items-center justify-between border-b border-tan px-5 py-4 sm:px-8">
        <Link href="/studio" className="font-serif text-xl italic text-ink">
          Studio
        </Link>
        <StudioNav signOutAction={signOut} />
      </header>
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">{children}</main>
    </div>
  );
}
