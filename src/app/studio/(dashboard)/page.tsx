import Link from "next/link";
import "@/styles/studio.css";

const chapters = [
  { num: "I", href: "/studio/cv", title: "CV", desc: "Bio, contact, education, languages, signals, the Roof's Right now." },
  { num: "II", href: "/studio/projects", title: "Projects", desc: "The Workshop's bays: covers, pinboards, dates, size." },
  { num: "III", href: "/studio/experience", title: "Experience", desc: "The jobs on the roof beams and the Records Room's tabs." },
  { num: "IV", href: "/studio/skills", title: "Skills", desc: "The Type Case's drawers." },
  { num: "V", href: "/studio/thinking", title: "Thinking", desc: "The Plan Room's places and paths." },
  { num: "VI", href: "/studio/gallery", title: "Gallery", desc: "The tower's floors and their prints." },
  { num: "VII", href: "/studio/tracks", title: "Tracks", desc: "The Listening Room's records." },
];

/**
 * First pass of the Studio's new visual language (see the creative brief
 * in conversation history): a private workshop, not an admin panel —
 * warm dark palette, frame corners, film grain, and the Archive Hall's
 * chapter language instead of a SaaS card grid. This is a self-contained
 * overlay confined to this one page (fixed full-bleed backdrop escaping
 * the shared layout's light <main>) so CV/Projects/Gallery/Tracks/Login
 * are untouched until this direction is confirmed and rolled out to them.
 */
export default function StudioHomePage() {
  return (
    <div className="studio-dark">
      <div className="studio-dark-backdrop" aria-hidden="true" />
      <div className="studio-dark-grain" aria-hidden="true" />
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="studio-grain-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0" />
        </filter>
      </svg>

      <div className="studio-dark-fc studio-dark-fc-tl" aria-hidden="true" />
      <div className="studio-dark-fc studio-dark-fc-tr" aria-hidden="true" />
      <div className="studio-dark-fc studio-dark-fc-bl" aria-hidden="true" />
      <div className="studio-dark-fc studio-dark-fc-br" aria-hidden="true" />

      <div className="studio-dark-content">
        <p className="studio-eyebrow">Ameer Studio</p>
        <h1 className="studio-welcome">Welcome back.</h1>
        <p className="studio-lede">
          The workshop behind the building — everything published starts here, quietly, before anyone else sees it.
          Every change appears in the world on the next visit: a new project is a new bay, a new photograph a new print.
        </p>

        <nav className="studio-chapters">
          {chapters.map((c, i) => (
            <Link key={c.href} href={c.href} className="studio-chapter" style={{ "--sc-i": i } as React.CSSProperties}>
              <span className="studio-ch-num">Chapter {c.num}</span>
              <span className="studio-ch-title">{c.title}</span>
              <span className="studio-ch-arrow">Enter →</span>
              <span className="studio-ch-desc">{c.desc}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
