"use client";

import { useState, useTransition } from "react";

/**
 * A small editor for ordered rows (experience, skill groups, thinking-path
 * nodes) — the tables the audit found had no Studio screen. Each row saves
 * on its own; order changes with ↑ ↓. Field kinds: a line of text, a
 * paragraph, a list (one item per line), a number, or a choice.
 */
export type Field<R> = {
  key: keyof R & string;
  label: string;
  kind: "text" | "textarea" | "list" | "number" | "select" | "json";
  options?: string[];
  hint?: string;
  wide?: boolean;
};

type Result = { error: string } | { ok: true; id?: string };

const inputCls = "border border-tan bg-cream-alt px-3 py-2 text-sm text-ink outline-none focus:border-accent w-full";
const labelCls = "font-sans text-[11px] uppercase tracking-wider text-brown mb-1.5 block";

export default function RowsEditor<R extends { id?: string; sort_order: number }>({
  title,
  intro,
  rows: initial,
  fields,
  blank,
  rowTitle,
  save,
  remove,
  reorder,
  previewHref,
}: {
  title: string;
  intro?: string;
  rows: R[];
  fields: Field<R>[];
  blank: () => R;
  rowTitle: (r: R) => string;
  save: (r: R) => Promise<Result>;
  remove: (id: string) => Promise<Result>;
  reorder: (items: { id: string; sort_order: number }[]) => Promise<Result>;
  previewHref?: string;
}) {
  const [rows, setRows] = useState<R[]>([...initial].sort((a, b) => a.sort_order - b.sort_order));
  const [open, setOpen] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<number | null>(null);

  const update = (i: number, patch: Partial<R>) => setRows((rs) => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    const renumbered = next.map((r, k) => ({ ...r, sort_order: k }));
    setRows(renumbered);
    start(async () => {
      const res = await reorder(renumbered.filter((r) => r.id).map((r) => ({ id: r.id!, sort_order: r.sort_order })));
      if ("error" in res) setError(res.error);
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl italic text-ink">{title}</h1>
        <div className="flex items-center gap-4">
          {previewHref && (
            <a href={previewHref} target="_blank" rel="noopener" className="text-xs uppercase tracking-wider text-brown hover:text-accent">
              View in the world ↗
            </a>
          )}
          <button
            onClick={() => {
              setRows((rs) => [...rs, { ...blank(), sort_order: rs.length }]);
              setOpen(rows.length);
            }}
            className="bg-ink px-5 py-2 text-xs uppercase tracking-widest text-cream transition-colors hover:bg-accent"
          >
            + Add
          </button>
        </div>
      </div>
      {intro && <p className="text-sm text-brown">{intro}</p>}
      {error && <p className="text-xs text-accent">{error}</p>}
      {rows.map((r, i) => (
        <div key={r.id ?? `new-${i}`} className="border border-tan">
          <div className="flex items-center justify-between px-5 py-3">
            <button className="text-left font-serif text-lg italic text-ink" onClick={() => setOpen(open === i ? null : i)}>
              {rowTitle(r) || "Untitled"}
            </button>
            <div className="flex items-center gap-3 text-xs text-brown">
              <button onClick={() => move(i, -1)} className="hover:text-accent" aria-label="Move up">
                ↑
              </button>
              <button onClick={() => move(i, 1)} className="hover:text-accent" aria-label="Move down">
                ↓
              </button>
              {saved === i && <span>Saved</span>}
            </div>
          </div>
          {open === i && (
            <div className="grid grid-cols-1 gap-4 border-t border-tan bg-cream-alt p-5 sm:grid-cols-2">
              {fields.map((f) => {
                const v = r[f.key] as unknown;
                return (
                  <div key={f.key} className={f.wide || f.kind === "textarea" || f.kind === "list" || f.kind === "json" ? "sm:col-span-2" : ""}>
                    <label className={labelCls}>{f.label}</label>
                    {f.kind === "textarea" ? (
                      <textarea className={inputCls} rows={3} value={(v as string) ?? ""} onChange={(e) => update(i, { [f.key]: e.target.value } as Partial<R>)} />
                    ) : f.kind === "list" ? (
                      <textarea
                        className={inputCls}
                        rows={4}
                        value={((v as string[]) ?? []).join("\n")}
                        onChange={(e) => update(i, { [f.key]: e.target.value.split("\n") } as Partial<R>)}
                      />
                    ) : f.kind === "json" ? (
                      <JsonField value={v} onChange={(val) => update(i, { [f.key]: val } as Partial<R>)} />
                    ) : f.kind === "select" ? (
                      <select className={inputCls} value={(v as string) ?? ""} onChange={(e) => update(i, { [f.key]: e.target.value } as Partial<R>)}>
                        {f.options?.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className={inputCls}
                        type={f.kind === "number" ? "number" : "text"}
                        value={(v as string | number | null) ?? ""}
                        onChange={(e) => update(i, { [f.key]: f.kind === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value } as Partial<R>)}
                      />
                    )}
                    {f.hint && <p className="mt-1 text-[11px] text-brown">{f.hint}</p>}
                  </div>
                );
              })}
              <div className="flex items-center justify-between sm:col-span-2">
                <button
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      setError(null);
                      const clean = Object.fromEntries(
                        Object.entries(r).map(([k, val]) => [k, Array.isArray(val) ? (val as unknown[]).filter((x) => typeof x !== "string" || x.trim()) : val]),
                      ) as R;
                      const res = await save(clean);
                      if ("error" in res) setError(res.error);
                      else {
                        if (res.id) update(i, { id: res.id } as Partial<R>);
                        setSaved(i);
                        setTimeout(() => setSaved(null), 2000);
                      }
                    })
                  }
                  className="bg-ink px-5 py-2 text-xs uppercase tracking-widest text-cream hover:bg-accent disabled:opacity-50"
                >
                  {pending ? "Saving…" : "Save"}
                </button>
                <button
                  disabled={pending}
                  onClick={() => {
                    if (!r.id) {
                      setRows((rs) => rs.filter((_, k) => k !== i));
                      return;
                    }
                    if (!window.confirm(`Delete “${rowTitle(r)}”?`)) return;
                    start(async () => {
                      const res = await remove(r.id!);
                      if ("error" in res) setError(res.error);
                      else setRows((rs) => rs.filter((_, k) => k !== i));
                    });
                  }}
                  className="text-xs uppercase tracking-widest text-brown hover:text-accent"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function JsonField({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const [text, setText] = useState(() => JSON.stringify(value ?? [], null, 2));
  const [bad, setBad] = useState(false);
  return (
    <>
      <textarea
        className={`${inputCls} font-mono text-xs`}
        rows={6}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setBad(false);
          } catch {
            setBad(true);
          }
        }}
      />
      {bad && <p className="mt-1 text-[11px] text-accent">Not valid yet — keep typing.</p>}
    </>
  );
}
