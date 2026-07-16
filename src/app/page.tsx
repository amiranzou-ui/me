import "@/styles/landing.css";
import "@/styles/atmosphere.css";
import WorldEffects from "@/components/world/WorldEffects";
import LandingInteractions from "@/components/world/LandingInteractions";

/**
 * Split-screen landing page — ported from legacy/index.html.
 * Content (name, taglines, social links) is still hardcoded here; that
 * moves to Supabase-backed cv_meta once the Studio exists (Phase 1+).
 * Deferred from this pass: the GSAP cinematic entry sequence — GSAP isn't
 * part of this stack; see WorldEffects' doc comment.
 */
export default function Home() {
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
        <h1 className="sr-only">Ameer Al-Butaihi — Matrix and Human</h1>

        <div className="side" id="left">
          <div className="atm-wrap atm-matrix" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="atm-img"
              src="https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1920&q=85"
              alt=""
              loading="lazy"
              draggable={false}
              crossOrigin="anonymous"
            />
          </div>
          <div className="matrix-geo" aria-hidden="true" />
          <div className="side-inner">
            <span className="label">I</span>
            <h2 className="side-title">Matrix Side</h2>
            <p className="side-desc">
              Graphic Designer.
              <br />
              Social Media Manager.
              <br />
              Visual problem-solver.
            </p>
            <span className="enter">Enter →</span>
          </div>
        </div>

        <div className="divider" id="divider-el" />
        <canvas id="divider-canvas" aria-hidden="true" />

        <div className="profile-node" id="pn-toggle">
          <div className="pn-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/profile.JPG" alt="Ameer" className="pn-img" />
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
              <h2 className="pnp-name">Ameer Al-Butaihi</h2>
              <p className="pnp-tagline">Graphic Designer · Social Media Manager</p>
            </div>
            <div className="pnp-photo-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/profile.JPG" alt="Ameer" />
            </div>
          </div>

          <div className="pnp-sep" />

          <div className="pnp-body">
            <div className="pnp-col">
              <p className="pnp-col-label">Find me</p>
              <a
                href="https://www.linkedin.com/in/abdulameeralbutaihi"
                target="_blank"
                rel="noopener"
                className="pnp-soc"
              >
                LinkedIn
              </a>
              <a href="https://www.behance.net/amiranzou" target="_blank" rel="noopener" className="pnp-soc">
                Behance
              </a>
              <a href="https://github.com/amiranzou-ui" target="_blank" rel="noopener" className="pnp-soc">
                GitHub
              </a>
              <a href="https://www.instagram.com/ameer.is.off" target="_blank" rel="noopener" className="pnp-soc">
                Instagram
              </a>
            </div>

            <div className="pnp-col">
              <p className="pnp-col-label">Currently</p>
              <div className="pnp-status-item">
                <span className="pnp-s-key">Building</span>
                <span className="pnp-s-val">This website, apparently</span>
              </div>
            </div>
          </div>
        </div>

        <div className="side" id="right">
          <div className="atm-wrap atm-human" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="atm-img"
              src="https://images.unsplash.com/photo-1575209239550-322a4b125c6d?auto=format&fit=crop&w=1920&q=85"
              alt=""
              loading="lazy"
              draggable={false}
              crossOrigin="anonymous"
            />
          </div>
          <div className="human-warmth" aria-hidden="true" />
          <div className="side-inner">
            <span className="label">II</span>
            <h2 className="side-title">Human Side</h2>
            <p className="side-desc">
              Live music.
              <br />
              Curious mind.
              <br />
              Something else entirely.
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
