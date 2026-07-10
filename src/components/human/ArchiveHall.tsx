"use client";

import Link from "next/link";
import type { Category } from "@/lib/human/types";

type Props = {
  categories: Category[];
  visible: boolean;
  bgNumeral: string;
  lockPulse: string | null;
  onChapterClick: (c: Category) => void;
  onChapterHover: (c: Category) => void;
};

const LockIcon = () => (
  <svg width="11" height="13" viewBox="0 0 11 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="0.65" y="5.5" width="9.7" height="7" rx="1.5" />
    <path d="M2.5 5.5V3.5a3 3 0 0 1 6 0v2" />
  </svg>
);

export default function ArchiveHall({ categories, visible, bgNumeral, lockPulse, onChapterClick, onChapterHover }: Props) {
  return (
    <div id="archive-hall" className={visible ? "visible" : ""}>
      <span className="ah-bg-numeral" aria-hidden="true">
        {bgNumeral}
      </span>
      <header className="ah-header">
        <span className="ah-label">Memory Archive</span>
        <span className="ah-year">2026</span>
      </header>
      <div className="ah-rule" />
      <nav className="ah-chapters">
        {categories.map((c, i) => (
          <div
            key={c.slug}
            className={`ah-chapter${c.is_locked ? " locked" : ""}${lockPulse === c.slug ? " lock-pulse" : ""}`}
            style={{ "--ch-i": i } as React.CSSProperties}
            role="button"
            tabIndex={0}
            onMouseEnter={() => onChapterHover(c)}
            onClick={() => onChapterClick(c)}
          >
            <span className="ah-ch-num">Chapter {c.roman}</span>
            <span className="ah-ch-title">{c.label}</span>
            <span className="ah-ch-enter">enter →</span>
            <span className="ah-ch-tagline">{c.tagline}</span>
            {c.is_locked && (
              <span className="ah-ch-lock">
                <LockIcon />
              </span>
            )}
          </div>
        ))}
      </nav>
      <div className="ah-rule" style={{ animationDelay: "0.95s" }} />
      <footer className="ah-footer">
        <Link href="/" className="ah-back">
          ← home
        </Link>
      </footer>
    </div>
  );
}
