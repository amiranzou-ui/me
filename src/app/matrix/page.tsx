/**
 * Placeholder — the real Matrix (CV) page is built in Phase 1, backed by
 * cv_meta/projects/experience/skills_groups/matrix_nodes in Supabase.
 * This stub exists so the landing page's portal() navigation has a real
 * destination during the Phase 0 smoke test.
 */
export default function MatrixPlaceholder() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-cream-alt)",
        color: "var(--color-ink)",
        fontFamily: "var(--font-serif), serif",
        fontStyle: "italic",
        fontSize: "clamp(24px, 4vw, 40px)",
      }}
    >
      Matrix — coming in Phase 1
    </div>
  );
}
