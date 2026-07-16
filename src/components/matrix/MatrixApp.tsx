"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { portal } from "@/lib/world/core";
import { SocialIcon } from "./SocialIcon";
import type { CvMeta, Experience, MatrixNode, Project, SkillsGroup } from "@/lib/matrix/types";

/**
 * Ported from legacy/js/matrix.js. The original built all three levels via
 * imperative DOM manipulation (buildL1/buildL2/buildL3) driven by hardcoded
 * DATA/NODES literals; this is the same three-level structure and the same
 * node-graph interaction model (hover to highlight, click to open the side
 * panel, click a connected node to jump), now driven by props fetched from
 * Supabase and rendered declaratively.
 *
 * One simplification from the original: line coordinates for the node graph
 * are computed directly from each node's x/y percentage against the
 * container's measured size, rather than reading getBoundingClientRect() of
 * each rendered node — since every node is centered exactly on its (x%, y%)
 * point via `transform: translate(-50%,-50%)`, both approaches produce
 * identical lines.
 */

type Props = {
  cvMeta: CvMeta;
  projects: Project[];
  experience: Experience[];
  skillsGroups: SkillsGroup[];
  nodes: MatrixNode[];
};

const NODE_TYPE_LEGEND = [
  { label: "project", color: "var(--c-project)" },
  { label: "skill", color: "var(--c-skill)" },
  { label: "thought", color: "var(--c-thought)" },
  { label: "timeline", color: "var(--c-timeline)" },
] as const;

export default function MatrixApp({ cvMeta, projects, experience, skillsGroups, nodes }: Props) {
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [graphSize, setGraphSize] = useState({ width: 0, height: 0 });
  const graphWrapRef = useRef<HTMLDivElement>(null);

  const focusKey = hoverKey ?? activeKey;
  const nodesByKey = useMemo(() => Object.fromEntries(nodes.map((n) => [n.node_key, n])), [nodes]);
  const focusNode = focusKey ? nodesByKey[focusKey] : null;
  const related = focusNode ? new Set([focusNode.node_key, ...focusNode.connections]) : null;

  const panelNode = activeKey ? nodesByKey[activeKey] : null;

  function goLevel(n: 1 | 2 | 3) {
    setLevel(n);
    if (n !== 3) {
      setActiveKey(null);
      setHoverKey(null);
    }
  }

  // Measure the graph container so node % positions can convert to px for
  // the SVG connection lines.
  useEffect(() => {
    const el = graphWrapRef.current;
    if (!el) return;
    const measure = () => setGraphSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [level]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (activeKey) {
        setActiveKey(null);
        setHoverKey(null);
        return;
      }
      if (level === 3 || level === 2) goLevel(1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [level, activeKey]);

  const lines = useMemo(() => {
    if (!graphSize.width || !graphSize.height) return [];
    const drawn = new Set<string>();
    const out: { a: string; b: string; x1: number; y1: number; x2: number; y2: number }[] = [];
    nodes.forEach((node) => {
      node.connections.forEach((targetKey) => {
        const key = [node.node_key, targetKey].sort().join("|");
        if (drawn.has(key)) return;
        drawn.add(key);
        const b = nodesByKey[targetKey];
        if (!b) return;
        out.push({
          a: node.node_key,
          b: targetKey,
          x1: (node.x / 100) * graphSize.width,
          y1: (node.y / 100) * graphSize.height,
          x2: (b.x / 100) * graphSize.width,
          y2: (b.y / 100) * graphSize.height,
        });
      });
    });
    return out;
  }, [nodes, nodesByKey, graphSize]);

  function openPanel(key: string) {
    setActiveKey(key);
    setHoverKey(null);
  }

  const [firstName, ...lastNameParts] = cvMeta.name.split(" ");
  const lastName = lastNameParts.join(" ");
  const allSkillTags = skillsGroups.flatMap((g) => g.tags);
  const marqueeItems = allSkillTags.flatMap((s, i) => [
    <span key={`${s}-${i}`}>{s}</span>,
    <span key={`dot-${i}`} className="mx-marquee-dot">
      ·
    </span>,
  ]);

  return (
    <main className="matrix-page">
      <nav className={`mx-nav${level === 3 ? " dark" : ""}`} id="mx-nav">
        <button
          className="mx-nav-back"
          onClick={(e) => portal("/", "#f0ebe0", e.clientX, e.clientY)}
        >
          ← Home
        </button>
        <div className="mx-level-pills">
          <button className={`mx-pill${level === 1 ? " active" : ""}`} onClick={() => goLevel(1)}>
            Overview
          </button>
          <button className={`mx-pill${level === 2 ? " active" : ""}`} onClick={() => goLevel(2)}>
            Full CV
          </button>
          <button className={`mx-pill${level === 3 ? " active" : ""}`} onClick={() => goLevel(3)}>
            System
          </button>
        </div>
      </nav>

      {/* ── L1: Overview ── */}
      <div className="mx-layer" id="mx-l1">
        <div className="mx-l1-wrap">
          <div className="mx-l1-poster">
            <div className="mx-poster-grain" />
            <div className="mx-poster-reg mx-poster-reg-tl" />
            <div className="mx-poster-reg mx-poster-reg-tr" />
            <div className="mx-poster-ring mx-poster-ring-3" />
            <div className="mx-poster-ring mx-poster-ring-1">
              <div className="mx-poster-ring-dot" />
            </div>
            <div className="mx-poster-ring mx-poster-ring-2">
              <div className="mx-poster-ring-dot2" />
            </div>

            <div className="mx-poster-top">
              <span className="mx-poster-tag">{cvMeta.tag}</span>
              <span className="mx-poster-meta">
                {cvMeta.contact.location} · {new Date().getFullYear()}
              </span>
            </div>

            <div className="mx-poster-name-block">
              <span className="mx-poster-name-line">{firstName}</span>
              <span className="mx-poster-name-line">{lastName}</span>
            </div>

            <div className="mx-poster-stat-col" aria-hidden="true">
              <div className="mx-poster-stat">
                <span className="mx-stat-n">4+</span>
                <span className="mx-stat-l">
                  YRS
                  <br />
                  DESIGN
                </span>
              </div>
              <div className="mx-poster-stat">
                <span className="mx-stat-n">3</span>
                <span className="mx-stat-l">
                  BRANDS
                  <br />
                  BUILT
                </span>
              </div>
              <div className="mx-poster-stat">
                <span className="mx-stat-n">50+</span>
                <span className="mx-stat-l">
                  PROJECTS
                  <br />
                  DONE
                </span>
              </div>
            </div>

            <div className="mx-poster-rule" />

            <div className="mx-poster-bottom">
              <div className="mx-poster-quote">
                <span className="mx-quote-mark">&ldquo;</span>
                <p className="mx-poster-bio">{cvMeta.bio.split(".")[0]}.</p>
              </div>
              <div className="mx-poster-actions">
                <div className="mx-poster-btns">
                  <button className="mx-btn mx-btn-primary" onClick={() => goLevel(2)}>
                    Full CV
                  </button>
                  <button className="mx-btn mx-btn-ghost" onClick={() => goLevel(3)}>
                    System View
                  </button>
                </div>
                <div className="mx-social-links">
                  {cvMeta.links.map((l) => (
                    <a key={l.label} className="mx-social-link" href={l.url} target="_blank" rel="noopener">
                      <SocialIcon name={l.icon} />
                      <span>{l.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mx-marquee">
            <div className="mx-marquee-track">
              {marqueeItems}
              {marqueeItems}
              {marqueeItems}
              {marqueeItems}
            </div>
          </div>

          <div className="mx-l1-grid">
            {projects.map((p, i) => {
              const external = p.behance_url || p.external_url;
              const externalLabel = p.behance_url ? "Behance ↗" : "External ↗";
              return (
                <div
                  key={p.slug}
                  className="mx-l1-card"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => portal(`/project/${p.slug}`, "#f0ebe0", e.clientX, e.clientY)}
                >
                  <div className="mx-l1-card-num">0{i + 1}</div>
                  <div className="mx-l1-card-title">{p.title}</div>
                  <div className="mx-l1-card-role">{p.role}</div>
                  <div className="mx-l1-card-desc">{p.description}</div>
                  <span className="mx-l1-card-link">View project →</span>
                  {external && (
                    <a
                      href={external}
                      target="_blank"
                      rel="noopener"
                      className="mx-l1-card-external"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {externalLabel}
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mx-l1-bar">
            <p className="mx-l1-bar-text">More structure underneath — and a graph of how it all connects.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="mx-btn mx-btn-ghost" onClick={() => goLevel(2)}>
                Full CV
              </button>
              <button className="mx-btn mx-btn-ghost" onClick={() => goLevel(3)}>
                System →
              </button>
              <a className="mx-btn mx-btn-ghost" href="/Abdulameer_Albutaihi_CV.pdf" download>
                ↓ CV PDF
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── L2: Full CV drawer ── */}
      <div className={`mx-layer mx-drawer${level === 2 ? " open" : ""}`} id="mx-l2">
        <div className="mx-drawer-inner">
          <div className="mx-l2-layout">
            <div className="mx-l2-sb">
              <div className="mx-l2-sb-name">{cvMeta.name}</div>
              <div className="mx-l2-sb-role">
                {cvMeta.tag.split(" · ").map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
              </div>
              <div className="mx-l2-sb-block">
                <span>{cvMeta.contact.location}</span>
                <a href={`tel:${cvMeta.contact.phone}`}>{cvMeta.contact.phone}</a>
                <a href={`mailto:${cvMeta.contact.email}`}>{cvMeta.contact.email}</a>
              </div>
              <div className="mx-l2-sb-block mx-social-links" style={{ flexDirection: "column", gap: 14 }}>
                {cvMeta.links.map((l) => (
                  <a key={l.label} className="mx-social-link" href={l.url} target="_blank" rel="noopener">
                    <SocialIcon name={l.icon} />
                    <span>{l.label}</span>
                  </a>
                ))}
              </div>
              <div className="mx-l2-sb-dl">
                <a className="mx-btn mx-btn-primary" href="/Abdulameer_Albutaihi_CV.pdf" download>
                  Download CV
                </a>
                <a className="mx-btn mx-btn-ghost" href="/Abdulameer_Albutaihi_CV.pdf" target="_blank" rel="noopener">
                  View PDF
                </a>
              </div>
            </div>

            <div className="mx-l2-main">
              <Section num="00" title="Summary">
                <p className="mx-summary">{cvMeta.summary}</p>
              </Section>

              <Section num="01" title="Experience">
                {experience.map((e, i) => (
                  <div className="mx-exp-item" key={i}>
                    <div className="mx-exp-header">
                      <div>
                        <div className="mx-exp-role">{e.role}</div>
                        <div className="mx-exp-company">{e.company}</div>
                      </div>
                      <div className="mx-exp-date">{e.date_label}</div>
                    </div>
                    {e.points?.length ? (
                      <ul className="mx-exp-points">
                        {e.points.map((pt, j) => (
                          <li key={j}>{pt}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </Section>

              <Section num="02" title="Skills">
                <div className="mx-skills-grid">
                  {skillsGroups.map((g) => (
                    <div key={g.group_name}>
                      <div className="mx-skill-group-label">{g.group_name}</div>
                      <div className="mx-tags">
                        {g.tags.map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section num="03" title="Education">
                {cvMeta.education.map((e, i) => (
                  <div className="mx-exp-item" key={i}>
                    <div className="mx-exp-header">
                      <div>
                        <div className="mx-exp-role">{e.degree}</div>
                        <div className="mx-exp-company">{e.school}</div>
                      </div>
                      <div className="mx-exp-date">{e.date}</div>
                    </div>
                  </div>
                ))}
              </Section>

              <Section num="04" title="Languages">
                <div className="mx-lang-row">
                  {cvMeta.languages.map((l) => (
                    <div className="mx-lang-item" key={l.lang}>
                      <span className="mx-lang-name">{l.lang}</span>
                      <span className="mx-lang-level">{l.level}</span>
                    </div>
                  ))}
                </div>
              </Section>

              <Section num="05" title="Signals">
                <div className="mx-signals">
                  {cvMeta.signals.map((s, i) => (
                    <div className="mx-signal" key={i}>
                      {s}
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        </div>
      </div>

      {/* ── L3: Node graph ── */}
      <div className={`mx-layer mx-overlay${level === 3 ? " open" : ""}`} id="mx-l3">
        <div className="mx-graph-wrap" ref={graphWrapRef}>
          <svg className="mx-graph-svg">
            {lines.map((l) => (
              <line
                key={`${l.a}-${l.b}`}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                className={focusKey && (l.a === focusKey || l.b === focusKey) ? "active" : ""}
              />
            ))}
          </svg>
          <div className="mx-graph">
            {nodes.map((node) => {
              const isFocus = focusKey === node.node_key;
              const isConnected = !isFocus && related?.has(node.node_key);
              const isDimmed = related !== null && !related.has(node.node_key);
              const cls = [
                "mx-node",
                isFocus && "focus",
                isConnected && "connected",
                isDimmed && "dimmed",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <div
                  key={node.node_key}
                  className={cls}
                  data-type={node.type}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  onMouseEnter={() => setHoverKey(node.node_key)}
                  onMouseLeave={() => setHoverKey(null)}
                  onClick={() => openPanel(node.node_key)}
                >
                  <div className="mx-node-type">{node.type}</div>
                  <div className="mx-node-title">{node.title}</div>
                  <div className="mx-node-summary">{node.summary}</div>
                </div>
              );
            })}
          </div>
          <div className="mx-graph-legend">
            {NODE_TYPE_LEGEND.map((t) => (
              <div className="mx-legend-item" key={t.label}>
                <div className="mx-legend-dot" style={{ background: t.color }} />
                {t.label}
              </div>
            ))}
          </div>
        </div>

        <div className={`mx-node-panel${panelNode ? " open" : ""}`}>
          <button
            className="mx-panel-close"
            onClick={() => {
              setActiveKey(null);
              setHoverKey(null);
            }}
          >
            ×
          </button>
          {panelNode && (
            <div className="mx-panel-body">
              <div className={`mx-panel-type ${panelNode.type}`}>{panelNode.type}</div>
              <div className="mx-panel-title">{panelNode.title}</div>
              <div className="mx-panel-summary">{panelNode.summary}</div>

              {panelNode.thinking?.length > 0 && (
                <>
                  <div className="mx-thinking-label">Thinking Path</div>
                  <div className="mx-thinking-path">
                    {panelNode.thinking.map((step, i) => (
                      <div className="mx-thinking-step" key={i}>
                        <span className="mx-step-phase">{step.phase}</span>
                        <span className="mx-step-text">{step.text}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {panelNode.connections.length > 0 && (
                <div className="mx-panel-connections">
                  <div className="mx-panel-conn-label">Connected</div>
                  {panelNode.connections.map((cid) => {
                    const cn = nodesByKey[cid];
                    if (!cn) return null;
                    return (
                      <div className="mx-panel-conn-item" key={cid} onClick={() => openPanel(cid)}>
                        {cn.title}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-section">
      <div className="mx-section-hd">
        <span className="mx-section-num">{num}</span>
        <span className="mx-section-title">{title}</span>
      </div>
      {children}
    </div>
  );
}
