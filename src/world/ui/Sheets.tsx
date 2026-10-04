"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { go, goPath } from "../actions";
import { useWorld } from "../store";
import { mediaSrc, type Img, type WorldContent } from "../content";
import type { SheetSpec, World } from "../stations";
import { ContactBlock, CvDocument, LogbookDocument, MAKING_OF, NodeDocument, ProjectDocument } from "../docs/Documents";
import { enterAsFriend } from "@/app/actions/friend";

/**
 * Reading layers (design doc §23): paper that slides up from the object it
 * belongs to. Everything long, selectable or printable is HTML here, styled
 * to the room's light. Focus is trapped while open and returned on close.
 */
export function SheetLayer({ world, content }: { world: World; content: WorldContent }) {
  const sheet = useWorld((s) => s.sheet);
  if (!sheet) return null;
  if (sheet.kind === "image") return <ImageViewer spec={sheet} content={content} />;
  if (sheet.kind === "threshold") return <Threshold then={sheet.then} />;
  return (
    <Sheet title={titleFor(sheet, content)}>
      <SheetBody sheet={sheet} world={world} content={content} />
    </Sheet>
  );
}

function titleFor(sheet: SheetSpec, content: WorldContent) {
  switch (sheet.kind) {
    case "project":
      return content.projects.find((p) => p.slug === sheet.slug)?.title ?? "Project";
    case "node":
      return content.nodes.find((n) => n.key === sheet.key)?.title ?? "Thought";
    case "cv":
      return "Curriculum vitae";
    case "contact":
      return "Write to me";
    case "education":
      return "Education";
    case "skills":
      return "Skills";
    case "cooking":
      return "Food Decisions";
    case "logbook":
      return "The building's past";
    case "making-of":
      return "How the building was made";
    case "about":
      return content.cv.name;
    default:
      return "";
  }
}

function useFocusTrap(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () =>
      [...el.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null);
    (focusables()[0] ?? el).focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [ref]);
}

function Sheet({ title, children, wide }: { title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref);
  const close = () => useWorld.setState({ sheet: null });
  return (
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
      <div ref={ref} className={`sheet${wide ? " sheet-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <button type="button" className="sheet-close" onClick={close} aria-label="Close">
          ×
        </button>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

function SheetBody({ sheet, world, content }: { sheet: SheetSpec; world: World; content: WorldContent }) {
  const stationId = useWorld((s) => s.stationId);
  const lockedItems = useWorld((s) => s.lockedItems);
  const discovered = useWorld((s) => s.discovered);
  switch (sheet.kind) {
    case "project": {
      const p = content.projects.find((x) => x.slug === sheet.slug);
      return p ? <ProjectDocument p={p} content={content} headingLevel={2} /> : null;
    }
    case "node": {
      const n = content.nodes.find((x) => x.key === sheet.key);
      if (!n) return null;
      return (
        <>
          <NodeDocument n={n} content={content} headingLevel={2} />
          {stationId !== `node-${n.key}` && (
            <button type="button" className="doc-button" onClick={() => go(`node-${n.key}`)}>
              Step in — walk to it
            </button>
          )}
        </>
      );
    }
    case "cv":
      return <CvDocument content={content} />;
    case "contact":
      return <Contact content={content} />;
    case "education":
      return (
        <div>
          <h2 className="doc-title">Education</h2>
          {content.cv.education.map((e) => (
            <p key={e.degree}>
              <strong>{e.degree}</strong> — {e.school} <span className="doc-muted">{e.date}</span>
            </p>
          ))}
        </div>
      );
    case "skills":
      return (
        <div>
          <h2 className="doc-title">Skills</h2>
          {content.skills.map((g) => (
            <p key={g.group}>
              <strong>{g.group}:</strong> {g.tags.join(", ")}
            </p>
          ))}
        </div>
      );
    case "cooking": {
      const cat = content.categories.find((c) => c.room === "kitchen");
      const items = (cat && (lockedItems[cat.slug] ?? content.items[cat.slug])) ?? [];
      return <CookingPrint items={items} start={sheet.index} />;
    }
    case "logbook":
      return (
        <div>
          <h2 className="doc-title">The building&apos;s past</h2>
          <LogbookDocument />
        </div>
      );
    case "making-of":
      return (
        <div>
          <h2 className="doc-title">How the building was made</h2>
          <p>{MAKING_OF}</p>
          {discovered.includes("below") && (
            <p>
              <Link href="/below" className="doc-link">
                Down to the Deep Archive →
              </Link>
            </p>
          )}
        </div>
      );
    case "about":
      return (
        <div>
          <h2 className="doc-title">{content.cv.name}</h2>
          <p className="doc-eyebrow">{content.cv.tag}</p>
          <p className="doc-lead">{content.cv.bio}</p>
          <h3 className="doc-h3">Card catalogue — every project</h3>
          <ul className="doc-list">
            {content.projects.map((p) => (
              <li key={p.slug}>
                <button type="button" className="doc-linkbtn" onClick={() => go(`project-${p.slug}`)}>
                  {p.title}
                </button>
                <span className="doc-muted"> — {p.role}{p.yearStart ? `, ${p.yearStart}` : ""}</span>
              </li>
            ))}
          </ul>
          <ContactBlock content={content} />
          <p className="doc-muted">
            {content.cv.currentlyLabel} — {content.cv.currentlyValue}
          </p>
          {void world}
        </div>
      );
    default:
      return null;
  }
}

/** The letter tray: email, phone (with copy), and a letter that opens in
 * the visitor's own mail app — there is no form backend to fail. */
function Contact({ content }: { content: WorldContent }) {
  const c = content.cv.contact;
  const [copied, setCopied] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const copy = async (v: string, what: string) => {
    try {
      await navigator.clipboard.writeText(v);
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <div>
      <h2 className="doc-title">Write to me</h2>
      <ul className="doc-list">
        {c.email && (
          <li>
            <a href={`mailto:${c.email}`}>{c.email}</a>{" "}
            <button type="button" className="doc-linkbtn" onClick={() => copy(c.email, "email")}>
              {copied === "email" ? "copied" : "copy"}
            </button>
          </li>
        )}
        {c.phone && (
          <li>
            <a href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a>{" "}
            <button type="button" className="doc-linkbtn" onClick={() => copy(c.phone, "phone")}>
              {copied === "phone" ? "copied" : "copy"}
            </button>
          </li>
        )}
        {c.location && <li className="doc-muted">{c.location}</li>}
      </ul>
      <form
        className="doc-letter"
        onSubmit={(e) => {
          e.preventDefault();
          const body = encodeURIComponent(`${msg}\n\n— ${name}`);
          window.location.href = `mailto:${c.email}?subject=${encodeURIComponent(`A letter from ${name || "a visitor"}`)}&body=${body}`;
        }}
      >
        <label>
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label>
          A letter
          <textarea rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} required />
        </label>
        <button type="submit" className="doc-button">
          Seal it — opens in your mail app
        </button>
      </form>
      <ul className="doc-list">
        {content.cv.links.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noopener">
              {l.label} ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CookingPrint({ items, start }: { items: WorldContent["items"][string]; start: number }) {
  const [i, setI] = useState(start);
  const [flipped, setFlipped] = useState(false);
  const it = items[i];
  if (!it) return <p className="doc-note">This floor is for friends.</p>;
  return (
    <div className="cooking">
      <button type="button" className={`cooking-card${flipped ? " flipped" : ""}`} onClick={() => setFlipped((f) => !f)} aria-label={flipped ? "Turn the print back over" : "Turn the print over to read its back"}>
        <span className="cooking-front">
          {it.img && <Image src={mediaSrc(it.img.path)} alt={it.hover ?? ""} width={it.img.width} height={it.img.height} sizes="(max-width: 700px) 90vw, 480px" quality={80} />}
          {it.hover && (
            <span className="cooking-tape" dir="auto">
              {it.hover}
            </span>
          )}
        </span>
        <span className="cooking-back" dir="auto">
          {it.text.length ? it.text.map((t, k) => <span key={k}>{t}</span>) : <span>…</span>}
        </span>
      </button>
      <p className="viewer-nav">
        <button type="button" className="doc-linkbtn" onClick={() => (setI((i - 1 + items.length) % items.length), setFlipped(false))}>
          ‹ previous
        </button>
        <span className="doc-muted">
          {i + 1} / {items.length}
        </span>
        <button type="button" className="doc-linkbtn" onClick={() => (setI((i + 1) % items.length), setFlipped(false))}>
          next ›
        </button>
      </p>
    </div>
  );
}

function ImageViewer({ spec, content }: { spec: Extract<SheetSpec, { kind: "image" }>; content: WorldContent }) {
  const locked = useWorld((s) => s.lockedItems);
  const [kind, key] = spec.set.split(":");
  let list: { img: Img | null; caption: string | null }[] = [];
  if (kind === "chapter") list = (content.items[key] ?? locked[key] ?? []).map((x) => ({ img: x.img, caption: x.caption ?? x.hover }));
  else if (kind === "project") list = (content.projects.find((p) => p.slug === key)?.media ?? []).map((m) => ({ img: m.img, caption: m.caption }));
  else if (kind === "cover") {
    const p = content.projects.find((x) => x.slug === key);
    list = p?.cover ? [{ img: p.cover, caption: p.title }] : [];
  } else if (kind === "darkroom") list = (locked.darkroom ?? []).map((x) => ({ img: x.img, caption: x.caption }));
  const [i, setI] = useState(spec.index);
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref);
  const touch = useRef<number | null>(null);
  const n = list.length;
  const step = (d: number) => setI((x) => (x + d + n) % n);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);
  const cur = list[i];
  const close = () => useWorld.setState({ sheet: null });
  return (
    <div
      ref={ref}
      className="viewer"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      tabIndex={-1}
      onClick={(e) => e.target === e.currentTarget && close()}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <button type="button" className="viewer-close" onClick={close} aria-label="Close">
        ×
      </button>
      {n > 1 && (
        <button type="button" className="viewer-prev" onClick={() => step(-1)} aria-label="Previous">
          ‹
        </button>
      )}
      {cur?.img && (
        <figure className="viewer-figure">
          <Image key={cur.img.path} src={mediaSrc(cur.img.path)} alt={cur.caption ?? ""} width={cur.img.width} height={cur.img.height} sizes="90vw" quality={80} priority />
          {cur.caption && <figcaption dir="auto">{cur.caption}</figcaption>}
        </figure>
      )}
      {n > 1 && (
        <button type="button" className="viewer-next" onClick={() => step(1)} aria-label="Next">
          ›
        </button>
      )}
      <span className="viewer-count">
        {i + 1} / {n}
      </span>
    </div>
  );
}

/** The tower door's question (design doc §11), the friend gate evolved. */
function Threshold({ then }: { then?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref);
  const [chose, setChose] = useState(false);
  const [word, setWord] = useState("");
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const finish = (level: "friend" | "visitor") => {
    try {
      sessionStorage.setItem("archive_access", level);
    } catch {
      /* per-visit only */
    }
    useWorld.setState({ access: level, sheet: null });
    if (then) setTimeout(() => goPath(then), 60);
  };
  return (
    <div className="threshold" role="dialog" aria-modal="true" aria-labelledby="threshold-q" ref={ref} tabIndex={-1}>
      <p className="threshold-eyebrow">Memory Archive</p>
      <p className="threshold-q" id="threshold-q">
        before you enter —
      </p>
      {!chose ? (
        <div className="threshold-choices">
          <button type="button" onClick={() => setChose(true)}>
            <span>I</span> we know each other
          </button>
          <button type="button" onClick={() => finish("visitor")}>
            <span>II</span> just visiting
          </button>
        </div>
      ) : (
        <form
          className="threshold-word"
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            const res = await enterAsFriend(word);
            setPending(false);
            if (res.ok) {
              useWorld.setState({ lockedItems: res.items ?? {} });
              finish("friend");
            } else {
              setError(true);
              setWord("");
            }
          }}
        >
          <label htmlFor="the-word">the word</label>
          <input id="the-word" type="password" value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" spellCheck={false} autoFocus />
          <button type="submit" disabled={pending} aria-label="Say it">
            →
          </button>
          {error && <p className="threshold-err">that&apos;s not it.</p>}
        </form>
      )}
      <button type="button" className="threshold-back" onClick={() => useWorld.setState({ sheet: null })}>
        not now
      </button>
    </div>
  );
}
