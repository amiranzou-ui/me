"use client";

import { useEffect, useRef, useState } from "react";
import type { Category, GalleryItem } from "@/lib/human/types";
import { mediaUrl } from "@/lib/supabase/media";
import CategoryIcon from "./CategoryIcon";
import Cooking from "./Cooking";

/** Scroll-reveal for masonry cells — ported from human.js's IntersectionObserver. */
function useScrollReveal(containerRef: React.RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !containerRef.current) return;
    const cells = Array.from(containerRef.current.querySelectorAll(".cell"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    cells.forEach((cell) => {
      cell.classList.remove("visible");
      observer.observe(cell);
    });
    return () => observer.disconnect();
  }, [containerRef, active]);
}

function Masonry({
  id,
  items,
  active,
  onOpenLightbox,
}: {
  id: string;
  items: GalleryItem[];
  active: boolean;
  onOpenLightbox: (urls: string[], index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollReveal(ref, active);
  const urls = items.map((it) => (it.assets ? mediaUrl(it.assets.path) : ""));

  return (
    <div className={`masonry${active ? " active" : ""}`} id={id} ref={ref} style={{ display: active ? "block" : "none" }}>
      {items.map((item, i) => (
        <div className="cell" key={item.id}>
          <div className="cell-inner">
            {item.assets && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urls[i]} alt={item.alt_text ?? ""} loading="lazy" onClick={() => onOpenLightbox(urls, i)} />
            )}
            <span className="micro-story">{item.caption}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ThreeDPlaceholder({ active }: { active: boolean }) {
  return (
    <div className={`masonry soon-panel${active ? " active" : ""}`} id="3d" style={{ display: active ? "flex" : "none" }}>
      <div className="soon-inner">
        <div className="soon-cube">
          <svg width="110" height="110" viewBox="0 0 26 26" fill="none" stroke="#c4622d" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13,3 22,8 13,13 4,8 13,3" />
            <polyline points="4,8 4,17 13,22 13,13" />
            <polyline points="22,8 22,17 13,22" />
          </svg>
        </div>
        <p className="soon-line" style={{ "--i": 0 } as React.CSSProperties}>well... I&apos;m trying to do something here.</p>
        <p className="soon-line" style={{ "--i": 1 } as React.CSSProperties}>the vertices are not cooperating.</p>
        <p className="soon-line" style={{ "--i": 2 } as React.CSSProperties}>Blender crashed 4 times today. we move.</p>
        <p className="soon-line" style={{ "--i": 3 } as React.CSSProperties}>my MacBook has no fan. it just silently judges me.</p>
        <p className="soon-line soon-tag" style={{ "--i": 4 } as React.CSSProperties}>— coming soon™&nbsp; (probably)</p>
      </div>
    </div>
  );
}

export default function GalleryContent({
  categories,
  itemsByCategory,
  activeCategory,
  onSidebarClick,
}: {
  categories: Category[];
  itemsByCategory: Record<string, GalleryItem[]>;
  activeCategory: string | null;
  onSidebarClick: (c: Category) => void;
}) {
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!lightbox) return;
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") setLightbox((lb) => (lb ? { ...lb, index: (lb.index - 1 + lb.urls.length) % lb.urls.length } : lb));
      if (e.key === "ArrowRight") setLightbox((lb) => (lb ? { ...lb, index: (lb.index + 1) % lb.urls.length } : lb));
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  return (
    <div className="layout">
      <div className="sidebar">
        {categories.map((c, i) => (
          <button
            key={c.slug}
            className={`cat${c.slug === "music" ? " cat-music" : ""}${c.slug === "cooking" ? " cat-cooking" : ""}${activeCategory === c.slug ? " active" : ""}${c.is_locked ? " locked" : ""}`}
            data-cat={c.slug}
            data-roman={c.roman}
            style={{ "--cat-i": i } as React.CSSProperties}
            onClick={() => onSidebarClick(c)}
          >
            <span className="cat-icon">
              <CategoryIcon slug={c.slug} />
            </span>
            <span className="cat-label">{c.label}</span>
            {c.slug === "music" && (
              <span className="mc-cat-eq">
                <span />
                <span />
                <span />
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="sidebar-divider" />

      <div className="content">
        <div className="mem-tagline" aria-live="polite">
          <span className="mem-tagline-label" />
          <span className="mem-tagline-text" />
        </div>

        {categories
          .filter((c) => c.kind === "gallery" && c.slug !== "cooking")
          .map((c) => (
            <Masonry
              key={c.slug}
              id={c.slug}
              items={itemsByCategory[c.slug] ?? []}
              active={activeCategory === c.slug}
              onOpenLightbox={(urls, index) => setLightbox({ urls, index })}
            />
          ))}

        <Cooking items={itemsByCategory.cooking ?? []} active={activeCategory === "cooking"} />

        <ThreeDPlaceholder active={activeCategory === "3d"} />
      </div>

      <div id="lightbox" className={lightbox ? "open" : ""}>
        <button id="lb-close" onClick={() => setLightbox(null)}>
          ✕
        </button>
        <button
          id="lb-prev"
          onClick={() => setLightbox((lb) => (lb ? { ...lb, index: (lb.index - 1 + lb.urls.length) % lb.urls.length } : lb))}
        >
          ‹
        </button>
        {lightbox && (
          // eslint-disable-next-line @next/next/no-img-element
          <img id="lb-img" src={lightbox.urls[lightbox.index]} alt="" />
        )}
        <button
          id="lb-next"
          onClick={() => setLightbox((lb) => (lb ? { ...lb, index: (lb.index + 1) % lb.urls.length } : lb))}
        >
          ›
        </button>
      </div>
    </div>
  );
}
