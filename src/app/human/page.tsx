/**
 * Placeholder — the real Human gallery page is built in Phase 2, backed by
 * categories/gallery_items/assets in Supabase. This stub exists so the
 * landing page's portal() navigation has a real destination during the
 * Phase 0 smoke test.
 */
export default function HumanPlaceholder() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-void)",
        color: "var(--color-cream)",
        fontFamily: "var(--font-serif), serif",
        fontStyle: "italic",
        fontSize: "clamp(24px, 4vw, 40px)",
      }}
    >
      Human — coming in Phase 2
    </div>
  );
}
