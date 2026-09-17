"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Category, GalleryItem } from "@/lib/human/types";
import { mediaUrl, GALLERY_GRID_SIZES, GALLERY_GRID_QUALITY } from "@/lib/supabase/media";
import CategoryIcon from "./CategoryIcon";
import Cooking from "./Cooking";

type LightboxImage = { path: string; width: number; height: number; alt: string };

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
  onOpenLightbox: (images: LightboxImage[], index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollReveal(ref, active);
  const images: LightboxImage[] = items.map((it) => ({
    path: it.assets?.path ?? "",
    width: it.assets?.width ?? 1200,
    height: it.assets?.height ?? 900,
    alt: it.alt_text ?? "",
  }));

  return (
    <div className={`masonry${active ? " active" : ""}`} id={id} ref={ref} style={{ display: active ? "block" : "none" }}>
      {items.map((item, i) => (
        <div className="cell" key={item.id}>
          <div className="cell-inner">
            {item.assets && (
              <Image
                src={mediaUrl(item.assets.path)}
                alt={item.alt_text ?? ""}
                width={item.assets.width ?? 1200}
                height={item.assets.height ?? 900}
                sizes={GALLERY_GRID_SIZES}
                quality={GALLERY_GRID_QUALITY}
                loading="lazy"
                decoding="async"
                onClick={() => onOpenLightbox(images, i)}
              />
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
  accessLevel,
  onSidebarClick,
}: {
  categories: Category[];
  itemsByCategory: Record<string, GalleryItem[]>;
  activeCategory: string | null;
  accessLevel: "friend" | "visitor" | null;
  onSidebarClick: (c: Category) => void;
}) {
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null);

  // Categories mount lazily on first visit, then stay mounted (same
  // display:none/block toggle as before) so switching back is instant —
  // this is what stops every category's images from being requested on
  // /human's initial load, before the user has even picked one.
  const [visitedCategories, setVisitedCategories] = useState<Set<string>>(
    () => new Set(activeCategory ? [activeCategory] : []),
  );
  useEffect(() => {
    if (activeCategory && !visitedCategories.has(activeCategory)) {
      setVisitedCategories((prev) => new Set(prev).add(activeCategory));
    }
  }, [activeCategory, visitedCategories]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!lightbox) return;
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") setLightbox((lb) => (lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : lb));
      if (e.key === "ArrowRight") setLightbox((lb) => (lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : lb));
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  return (
    <div className="layout">
      <div className="sidebar">
        {categories.map((c, i) => {
          // Matches ArchiveHall's fix: locked-for-visitors styling (and the
          // pointer-events:none it carries) must never apply to friends.
          const locked = c.is_locked && accessLevel === "visitor";
          return (
            <button
              key={c.slug}
              className={`cat${c.slug === "music" ? " cat-music" : ""}${c.slug === "cooking" ? " cat-cooking" : ""}${activeCategory === c.slug ? " active" : ""}${locked ? " locked" : ""}`}
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
          );
        })}
      </div>

      <div className="sidebar-divider" />

      <div className="content">
        <div className="mem-tagline" aria-live="polite">
          <span className="mem-tagline-label" />
          <span className="mem-tagline-text" />
        </div>

        {categories
          .filter((c) => c.kind === "gallery" && c.slug !== "cooking" && visitedCategories.has(c.slug))
          .map((c) => (
            <Masonry
              key={c.slug}
              id={c.slug}
              items={itemsByCategory[c.slug] ?? []}
              active={activeCategory === c.slug}
              onOpenLightbox={(images, index) => setLightbox({ images, index })}
            />
          ))}

        {visitedCategories.has("cooking") && (
          <Cooking items={itemsByCategory.cooking ?? []} active={activeCategory === "cooking"} />
        )}

        <ThreeDPlaceholder active={activeCategory === "3d"} />
      </div>

      <div id="lightbox" className={lightbox ? "open" : ""}>
        <button id="lb-close" onClick={() => setLightbox(null)}>
          ✕
        </button>
        <button
          id="lb-prev"
          onClick={() => setLightbox((lb) => (lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : lb))}
        >
          ‹
        </button>
        {lightbox && (
          <Image
            id="lb-img"
            src={mediaUrl(lightbox.images[lightbox.index].path)}
            alt={lightbox.images[lightbox.index].alt}
            width={lightbox.images[lightbox.index].width}
            height={lightbox.images[lightbox.index].height}
            sizes="88vw"
            quality={80}
          />
        )}
        <button
          id="lb-next"
          onClick={() => setLightbox((lb) => (lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : lb))}
        >
          ›
        </button>
      </div>
    </div>
  );
}
