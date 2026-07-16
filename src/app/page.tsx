import "@/styles/landing.css";
import WorldEffects from "@/components/world/WorldEffects";
import LandingInteractions from "@/components/world/LandingInteractions";
import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/supabase/media";
import { SocialIcon } from "@/components/matrix/SocialIcon";
import type { CvMeta } from "@/lib/matrix/types";

export const revalidate = 60;

/**
 * Split-screen landing page — ported from legacy/index.html.
 * Name/tag/links/photo and both side taglines are Supabase-backed
 * (cv_meta), edited from the Studio's CV page — the same source the
 * Matrix page reads, so there's one place to update either.
 * Deferred from this pass: the GSAP cinematic entry sequence — GSAP isn't
 * part of this stack; see WorldEffects' doc comment.
 */
export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.from("cv_meta").select("*, assets(path)").eq("id", 1).single();
  const cv = data as CvMeta & { assets: { path: string } | null };
  const photoUrl = cv.assets ? mediaUrl(cv.assets.path) : "/images/profile.JPG";

  return (
    <div className="landing-root">
      <WorldEffects />
      <LandingInteractions />

      <canvas id="dust-canvas" aria-hidden="true" />

      <div id="ambient-a" aria-hidden="true" />
      <div id="ambient-b" aria-hidden="true" />

      <div id="cursor-aura" aria-hidden="true" />
      <div id="cursor-distort" aria-hidden="true" />

      <main id="container">
        <h1 className="sr-only">{cv.name} — Matrix and Human</h1>

        <div className="side" id="left">
          <div className="matrix-geo" aria-hidden="true" />
          <div className="side-inner">
            <span className="label">I</span>
            <h2 className="side-title">Matrix Side</h2>
            <p className="side-desc">
              {cv.matrix_side_desc.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < cv.matrix_side_desc.length - 1 && <br />}
                </span>
              ))}
            </p>
            <span className="enter">Enter →</span>
          </div>
        </div>

        <div className="divider" id="divider-el" />
        <canvas id="divider-canvas" aria-hidden="true" />

        <div className="profile-node" id="pn-toggle">
          <div className="pn-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt={cv.name} className="pn-img" draggable={false} />
          </div>
          <div className="pn-ring-wrap" aria-hidden="true">
            <div className="pn-ripple" />
            <div className="pn-ripple" />
          </div>
        </div>

        <div className="pn-backdrop" id="pn-backdrop" />
        <div className="pn-panel" id="pn-panel">
          <span className="pnp-c pnp-c-tl" />
          <span className="pnp-c pnp-c-tr" />
          <span className="pnp-c pnp-c-bl" />
          <span className="pnp-c pnp-c-br" />

          <div className="pnp-top">
            <div>
              <h2 className="pnp-name">{cv.name}</h2>
              <p className="pnp-tagline">{cv.tag}</p>
            </div>
            <div className="pnp-photo-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt={cv.name} />
            </div>
          </div>

          <div className="pnp-sep" />

          <div className="pnp-body">
            <div className="pnp-col">
              <p className="pnp-col-label">I. Elsewhere</p>
              {cv.links.map((link) => (
                <a key={link.label} href={link.url} target="_blank" rel="noopener" className="pnp-soc">
                  <SocialIcon name={link.icon} />
                  {link.label}
                </a>
              ))}
            </div>

            <div className="pnp-col">
              <p className="pnp-col-label">II. Right now</p>
              <div className="pnp-status-item">
                <span className="pnp-s-key">{cv.currently_label}</span>
                <span className="pnp-s-val">{cv.currently_value}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="side" id="right">
          <div className="human-warmth" aria-hidden="true" />
          <div className="side-inner">
            <span className="label">II</span>
            <h2 className="side-title">Human Side</h2>
            <p className="side-desc">
              {cv.human_side_desc.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < cv.human_side_desc.length - 1 && <br />}
                </span>
              ))}
            </p>
            <span className="enter">Feel →</span>
          </div>
        </div>

        <span className="corner corner-bl">Baghdad, IQ</span>
        <span className="corner corner-br">2026</span>
      </main>

      <div className="frame-corner fc-tl" />
      <div className="frame-corner fc-tr" />
      <div className="frame-corner fc-bl" />
      <div className="frame-corner fc-br" />
    </div>
  );
}
