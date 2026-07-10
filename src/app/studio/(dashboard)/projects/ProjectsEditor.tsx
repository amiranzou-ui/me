"use client";

import { useState, useTransition } from "react";
import { upsertProject, deleteProject } from "./actions";
import type { StudioProject } from "./types";

const inputCls =
  "border border-tan bg-cream-alt px-3 py-2 text-sm text-ink outline-none focus:border-accent w-full";
const labelCls = "font-sans text-[11px] uppercase tracking-wider text-brown mb-1.5 block";

const blankProject: StudioProject = {
  slug: "",
  title: "",
  role: "",
  description: "",
  impact: "",
  stack: [],
  behance_url: "",
  external_url: "",
  status: "draft",
  sort_order: 0,
};

export default function ProjectsEditor({ initial }: { initial: StudioProject[] }) {
  const [projects, setProjects] = useState(initial);
  const [openId, setOpenId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<StudioProject>(blankProject);

  function openExisting(p: StudioProject) {
    setDraft(p);
    setOpenId(p.id!);
  }

  function openNew() {
    setDraft({ ...blankProject, sort_order: projects.length });
    setOpenId("new");
  }

  return (
    <div className="flex flex-col gap-8 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl italic text-ink">Projects</h1>
        <button
          onClick={openNew}
          className="bg-ink px-5 py-2 text-xs uppercase tracking-widest text-cream transition-colors hover:bg-accent"
        >
          + Add project
        </button>
      </div>

      {openId === "new" && (
        <ProjectForm
          data={draft}
          onChange={setDraft}
          onSaved={(saved) => {
            setProjects((ps) => [...ps, saved]);
            setOpenId(null);
          }}
          onCancel={() => setOpenId(null)}
        />
      )}

      <div className="flex flex-col gap-2">
        {projects.map((p) => (
          <div key={p.id} className="border border-tan">
            <button
              onClick={() => (openId === p.id ? setOpenId(null) : openExisting(p))}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <div>
                <span className="font-serif text-lg italic text-ink mr-3">{p.title}</span>
                <span className="text-xs uppercase tracking-wider text-brown">{p.role}</span>
              </div>
              <span
                className={`text-[10px] uppercase tracking-wider px-2 py-1 border ${
                  p.status === "published"
                    ? "border-accent text-accent"
                    : "border-tan text-brown"
                }`}
              >
                {p.status}
              </span>
            </button>

            {openId === p.id && (
              <div className="border-t border-tan p-5">
                <ProjectForm
                  data={draft}
                  onChange={setDraft}
                  onSaved={(saved) => {
                    setProjects((ps) => ps.map((x) => (x.id === saved.id ? saved : x)));
                    setOpenId(null);
                  }}
                  onDeleted={() => {
                    setProjects((ps) => ps.filter((x) => x.id !== p.id));
                    setOpenId(null);
                  }}
                  onCancel={() => setOpenId(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectForm({
  data,
  onChange,
  onSaved,
  onDeleted,
  onCancel,
}: {
  data: StudioProject;
  onChange: (d: StudioProject) => void;
  onSaved: (d: StudioProject) => void;
  onDeleted?: () => void;
  onCancel: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await upsertProject(data);
      if (res?.error) setError(res.error);
      else onSaved(data);
    });
  }

  function remove() {
    if (!data.id) return;
    startTransition(async () => {
      const res = await deleteProject(data.id!);
      if (res?.error) setError(res.error);
      else onDeleted?.();
    });
  }

  return (
    <div className="flex flex-col gap-4 border border-tan p-5 bg-cream-alt">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Title</label>
          <input
            className={inputCls}
            value={data.title}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Role</label>
          <input
            className={inputCls}
            value={data.role}
            onChange={(e) => onChange({ ...data, role: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea
          className={inputCls}
          rows={2}
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
        />
      </div>

      <div>
        <label className={labelCls}>Impact</label>
        <textarea
          className={inputCls}
          rows={2}
          value={data.impact}
          onChange={(e) => onChange({ ...data, impact: e.target.value })}
        />
      </div>

      <div>
        <label className={labelCls}>Stack (comma-separated)</label>
        <input
          className={inputCls}
          value={data.stack.join(", ")}
          onChange={(e) =>
            onChange({ ...data, stack: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Behance URL</label>
          <input
            className={inputCls}
            value={data.behance_url ?? ""}
            onChange={(e) => onChange({ ...data, behance_url: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>External URL</label>
          <input
            className={inputCls}
            value={data.external_url ?? ""}
            onChange={(e) => onChange({ ...data, external_url: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Status</label>
        <select
          className={inputCls}
          value={data.status}
          onChange={(e) => onChange({ ...data, status: e.target.value as StudioProject["status"] })}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && <p className="text-xs text-accent">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={pending}
            className="bg-ink px-5 py-2 text-xs uppercase tracking-widest text-cream transition-colors hover:bg-accent disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2 text-xs uppercase tracking-widest text-brown hover:text-ink"
          >
            Cancel
          </button>
        </div>
        {data.id && (
          <button
            onClick={remove}
            disabled={pending}
            className="text-xs uppercase tracking-widest text-brown hover:text-accent"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
