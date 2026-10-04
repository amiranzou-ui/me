import Image from "next/image";
import Link from "next/link";
import { mediaSrc, type Img, type WorldContent, type WorldProject, type WorldNode, type WorldItem } from "../content";
import { planDayWing } from "../layout";
import type { Station, World } from "../stations";
import { LOGBOOK, REJECTED, RETIRED } from "../history";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { TrackList } from "./TrackList";

/**
 * Station documents — every place in the world as a plain, well-structured
 * page (design doc §25). Server-rendered for each URL: it is the "Read as
 * page" version, what screen readers and crawlers read, and the reading
 * sheets inside the world reuse the same pieces. Pure components: no hooks.
 */

function Pic({ img, alt, sizes = "(max-width: 700px) 100vw, 640px" }: { img: Img; alt: string; sizes?: string }) {
  return <Image src={mediaSrc(img.path)} alt={alt} width={img.width} height={img.height} sizes={sizes} quality={75} className="doc-img" />;
}

function years(p: { yearStart: number | null; yearEnd: number | null }, now: number) {
  if (!p.yearStart) return null;
  if (!p.yearEnd || p.yearEnd === p.yearStart) return String(p.yearStart);
  return `${p.yearStart}–${p.yearEnd === now ? "now" : p.yearEnd}`;
}

export function ProjectDocument({ p, content, headingLevel = 1 }: { p: WorldProject; content: WorldContent; headingLevel?: 1 | 2 }) {
  const H = headingLevel === 1 ? "h1" : "h2";
  const y = years(p, content.nowYear);
  return (
    <article className="doc-project">
      <p className="doc-eyebrow">{[p.role, p.employer, y].filter(Boolean).join(" · ")}</p>
      <H className="doc-title">{p.title}</H>
      {p.description && <p className="doc-lead">{p.description}</p>}
      {p.impact && <p className="doc-impact">{p.impact}</p>}
      {p.stack.length > 0 && (
        <ul className="doc-tags" aria-label="Tools and skills">
          {p.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
      {p.cover && <Pic img={p.cover} alt={`${p.title} — cover`} />}
      {p.media.length > 0 ? (
        <div className="doc-gallery">
          {p.media.map((m) => (
            <figure key={m.id}>
              <Pic img={m.img} alt={m.caption ?? p.title} sizes="(max-width: 700px) 100vw, 320px" />
              {m.caption && <figcaption>{m.caption}</figcaption>}
            </figure>
          ))}
        </div>
      ) : (
        !p.cover && <p className="doc-note">Visuals for this project are still to be pinned up.</p>
      )}
      {(p.behanceUrl || p.externalUrl) && (
        <p>
          <a className="doc-link" href={(p.behanceUrl || p.externalUrl)!} target={p.externalUrl === "/" ? undefined : "_blank"} rel="noopener">
            {p.behanceUrl ? "View on Behance ↗" : p.externalUrl === "/" ? "You're standing in it" : "View project ↗"}
          </a>
        </p>
      )}
      {p.related.length > 0 && (
        <section>
          <h3 className="doc-h3">Related</h3>
          <ul className="doc-list">
            {p.related.map((r) => (
              <li key={r.id}>
                {r.type === "project" ? <Link href={`/work/${r.slug}`}>{r.title}</Link> : r.type === "track" ? <Link href="/archive/music">{r.title}</Link> : <Link href={`/archive/${r.category}`}>{r.title}</Link>}
                {r.label && <span className="doc-muted"> — {r.label}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

export function CvDocument({ content }: { content: WorldContent }) {
  const cv = content.cv;
  return (
    <article className="doc-cv">
      <h2 className="doc-title">{cv.name}</h2>
      <p className="doc-eyebrow">{cv.tag}</p>
      <section>
        <h3 className="doc-h3">Summary</h3>
        <p>{cv.summary}</p>
      </section>
      <section>
        <h3 className="doc-h3">Experience</h3>
        {content.experience.map((e) => (
          <div key={e.id} className="doc-entry">
            <p className="doc-entry-head">
              <strong>{e.role}</strong> — {e.company} <span className="doc-muted">{e.dateLabel}</span>
            </p>
            <ul>
              {e.points.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      <section>
        <h3 className="doc-h3">Skills</h3>
        {content.skills.map((g) => (
          <p key={g.group}>
            <strong>{g.group}:</strong> {g.tags.join(", ")}
          </p>
        ))}
      </section>
      <section>
        <h3 className="doc-h3">Education</h3>
        {cv.education.map((e) => (
          <p key={e.degree + e.school}>
            <strong>{e.degree}</strong> — {e.school} <span className="doc-muted">{e.date}</span>
          </p>
        ))}
      </section>
      <section>
        <h3 className="doc-h3">Languages</h3>
        <p>{cv.languages.map((l) => `${l.lang} (${l.level})`).join(" · ")}</p>
      </section>
      <section>
        <h3 className="doc-h3">Signals</h3>
        {cv.signals.map((s, i) => (
          <blockquote key={i} className="doc-quote">
            {s}
          </blockquote>
        ))}
      </section>
      <ContactBlock content={content} />
      <p className="doc-actions">
        <a className="doc-button" href="/Abdulameer_Albutaihi_CV.pdf" download>
          Download the CV (PDF)
        </a>
        <a className="doc-link" href="/Abdulameer_Albutaihi_CV.pdf" target="_blank" rel="noopener">
          View PDF ↗
        </a>
      </p>
    </article>
  );
}

export function ContactBlock({ content }: { content: WorldContent }) {
  const c = content.cv.contact;
  return (
    <section>
      <h3 className="doc-h3">Contact</h3>
      <ul className="doc-list">
        {c.email && (
          <li>
            Email: <a href={`mailto:${c.email}`}>{c.email}</a>
          </li>
        )}
        {c.phone && (
          <li>
            Phone: <a href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a>
          </li>
        )}
        {c.location && <li>{c.location}</li>}
        {content.cv.links.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noopener" className="doc-social">
              <SocialIcon name={l.icon} /> {l.label} ↗
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NodeDocument({ n, content, headingLevel = 1 }: { n: WorldNode; content: WorldContent; headingLevel?: 1 | 2 }) {
  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <article>
      <p className="doc-eyebrow">{n.type}</p>
      <H className="doc-title">{n.title}</H>
      <p className="doc-lead">{n.summary}</p>
      {n.thinking.length > 0 && (
        <section>
          <h3 className="doc-h3">Thinking path</h3>
          <ol className="doc-steps">
            {n.thinking.map((t, i) => (
              <li key={i}>
                <span className="doc-step-phase">{t.phase}</span> {t.text}
              </li>
            ))}
          </ol>
        </section>
      )}
      {n.connections.length > 0 && (
        <section>
          <h3 className="doc-h3">Paths from here</h3>
          <ul className="doc-list">
            {n.connections.map((k) => {
              const m = content.nodes.find((x) => x.key === k);
              return m ? (
                <li key={k}>
                  <Link href={`/thinking/${k}`}>{m.title}</Link>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      )}
    </article>
  );
}

function ItemFigures({ items }: { items: WorldItem[] }) {
  return (
    <div className="doc-gallery">
      {items.map((it, i) => (
        <figure key={it.id}>
          {it.img && <Pic img={it.img} alt={it.alt ?? it.caption ?? `Image ${i + 1}`} sizes="(max-width: 700px) 100vw, 320px" />}
          {(it.caption || it.hover) && <figcaption dir="auto">{it.hover ?? it.caption}</figcaption>}
          {it.text.length > 0 && (
            <p className="doc-muted" dir="auto">
              {it.text.join(" ")}
            </p>
          )}
        </figure>
      ))}
    </div>
  );
}

export function LogbookDocument() {
  return (
    <div>
      <h3 className="doc-h3">The logbook</h3>
      <ol className="doc-list">
        {LOGBOOK.map((l) => (
          <li key={l.date + l.text}>
            <span className="doc-muted">{l.date}</span> — {l.text}
          </li>
        ))}
      </ol>
      <h3 className="doc-h3">Rejected drafts</h3>
      <ul className="doc-list">
        {REJECTED.map((r) => (
          <li key={r.title}>
            {r.title} <span className="doc-muted">({r.date})</span> — no.
          </li>
        ))}
      </ul>
      <h3 className="doc-h3">Retired captions</h3>
      <ul className="doc-list">
        {RETIRED.map((r) => (
          <li key={r}>“{r}”</li>
        ))}
      </ul>
    </div>
  );
}

export const MAKING_OF =
  "The building is made from the site's own content. Every bay in the Workshop is a project from the Studio, every print in the tower a photograph from the archive, every record a track; add one in the Studio and the building grows by one. Built by Ameer with Next.js, React Three Fiber and three.js, Supabase, and the procedural Web Audio ambience the site has had since June 2026. The architecture is drawn in code from a modular kit; authored Blender models replace kit pieces as they are made.";

/** The station's whole page. */
export function StationDocument({ station, world, content }: { station: Station; world: World; content: WorldContent }) {
  const crumbs: Station[] = [];
  for (let s: Station | undefined = station; s; s = s.parent ? world.byId[s.parent] : undefined) crumbs.unshift(s);
  const goLinks = station.objects.filter((o) => o.action.type === "go" || o.action.type === "link");
  const cat = station.categorySlug ? content.categories.find((c) => c.slug === station.categorySlug) : null;
  const project = station.projectSlug ? content.projects.find((p) => p.slug === station.projectSlug) : null;
  const node = station.nodeKey ? content.nodes.find((n) => n.key === station.nodeKey) : null;
  const plan = planDayWing(content);

  return (
    <article className="world-doc-article" aria-labelledby="station-title">
      <nav aria-label="Where you are" className="doc-crumbs">
        <ol>
          {crumbs.map((c, i) => (
            <li key={c.id}>{i < crumbs.length - 1 ? <Link href={c.path}>{c.short}</Link> : <span aria-current="page">{c.short}</span>}</li>
          ))}
        </ol>
      </nav>

      {project ? (
        <ProjectDocument p={project} content={content} />
      ) : node ? (
        <NodeDocument n={node} content={content} />
      ) : (
        <>
          <h1 id="station-title" className="doc-title">
            {station.label}
          </h1>
          <p className="doc-lead">{station.description}</p>
        </>
      )}

      {station.id === "approach" && (
        <section className="doc-intro">
          <p className="doc-quiet">I don&apos;t chase things. They just keep being interesting.</p>
          <p className="doc-quiet doc-accent">I arrived here by curiosity. You probably did too.</p>
          <div className="doc-sides">
            <Link href="/desk" className="doc-side">
              <span className="doc-eyebrow">I</span>
              <strong>Matrix Side</strong>
              <span>{content.cv.matrixSideDesc.join(" ")}</span>
            </Link>
            <Link href="/archive" className="doc-side">
              <span className="doc-eyebrow">II</span>
              <strong>Human Side</strong>
              <span>{content.cv.humanSideDesc.join(" ")}</span>
            </Link>
          </div>
        </section>
      )}

      {station.id === "desk" && (
        <section>
          <p className="doc-eyebrow">{content.cv.tag}</p>
          <blockquote className="doc-quote">{content.cv.bio}</blockquote>
          <ContactBlock content={content} />
        </section>
      )}

      {station.id === "work" && (
        <section>
          {plan.groups.map((g) => (
            <div key={g.name + g.x0}>
              <h2 className="doc-h3">
                {g.name} <span className="doc-muted">{g.label}</span>
              </h2>
              <ul className="doc-list">
                {plan.bays
                  .filter((b) => (b.project.employer ?? b.project.title) === g.name)
                  .map((b) => (
                    <li key={b.project.slug}>
                      <Link href={`/work/${b.project.slug}`}>{b.project.title}</Link> — {b.project.role}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          <h2 className="doc-h3">Signals</h2>
          {content.cv.signals.map((s, i) => (
            <blockquote key={i} className="doc-quote">
              {s}
            </blockquote>
          ))}
        </section>
      )}

      {station.id === "skills" &&
        content.skills.map((g) => (
          <section key={g.group}>
            <h2 className="doc-h3">{g.group}</h2>
            <ul className="doc-tags">
              {g.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        ))}

      {station.id === "records" && <CvDocument content={content} />}

      {station.id === "origin" && (
        <section>
          {content.cv.education.map((e) => (
            <p key={e.degree}>
              <strong>{e.degree}</strong> — {e.school} <span className="doc-muted">{e.date}</span>
            </p>
          ))}
        </section>
      )}

      {station.id === "thinking" && (
        <ul className="doc-list">
          {content.nodes.map((n) => (
            <li key={n.key}>
              <Link href={`/thinking/${n.key}`}>{n.title}</Link> <span className="doc-muted">({n.type})</span> — {n.summary}
            </li>
          ))}
        </ul>
      )}

      {station.id === "hall" && (
        <ul className="doc-list">
          {content.categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/archive/${c.slug}`}>
                Chapter {c.roman} — {c.label}
              </Link>
              <span className="doc-muted"> {c.tagline}</span>
              {c.locked && <span className="doc-muted"> (friends only)</span>}
            </li>
          ))}
        </ul>
      )}

      {cat && cat.locked && (
        <p className="doc-note">This floor is for friends. Its door opens with the word, asked at the Tower door in the world.</p>
      )}
      {cat && !cat.locked && cat.room !== "listening" && cat.room !== "unfinished" && <ItemFigures items={content.items[cat.slug] ?? []} />}
      {cat && cat.room === "listening" && <TrackList tracks={content.tracks} />}
      {cat && cat.room === "unfinished" && (
        <section>
          <ul className="doc-list">
            <li>well... I&apos;m trying to do something here.</li>
            <li>the vertices are not cooperating.</li>
            <li>Blender crashed 4 times today. we move.</li>
            <li>my MacBook has no fan. it just silently judges me.</li>
            <li>— coming soon™ (probably)</li>
          </ul>
          <ItemFigures items={content.items[cat.slug] ?? []} />
          <p>{MAKING_OF}</p>
        </section>
      )}

      {station.id === "roof" && (
        <section>
          <p className="doc-eyebrow">II. Right now</p>
          <p className="doc-lead">
            {content.cv.currentlyLabel} — {content.cv.currentlyValue}
          </p>
          <ContactBlock content={content} />
        </section>
      )}

      {station.id === "below" && <LogbookDocument />}

      {goLinks.length > 0 && (
        <nav aria-label="From here" className="doc-from-here">
          <h2 className="doc-h3">From here</h2>
          <ul className="doc-list">
            {goLinks.map((o) => {
              const a = o.action;
              const href = a.type === "go" ? (world.byId[a.to]?.path ?? "/") : a.type === "link" ? a.href : "/";
              const external = a.type === "link" && !href.startsWith("/");
              return (
                <li key={o.id}>
                  {external ? (
                    <a href={href} target="_blank" rel="noopener">
                      {o.label}
                    </a>
                  ) : (
                    <Link href={href}>{o.label}</Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </article>
  );
}
