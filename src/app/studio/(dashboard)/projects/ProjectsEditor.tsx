"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { upsertProject, deleteProject, listProjectMedia, addProjectMedia, updateProjectMedia, removeProjectMedia } from "./actions";
import RelatePicker from "@/components/studio/RelatePicker";
import MediaUpload from "@/components/studio/MediaUpload";
import { mediaUrl } from "@/lib/supabase/media";
import type { ProjectMedia, StudioProject } from "./types";

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
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await upsertProject(data);
      if ("error" in res) setError(res.error);
      else onSaved({ ...data, id: res.id, slug: res.slug });
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className={labelCls}>Year started</label>
          <input
            className={inputCls}
            type="number"
            value={data.year_start ?? ""}
            placeholder="from the job"
            onChange={(e) => onChange({ ...data, year_start: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
        <div>
          <label className={labelCls}>Year ended</label>
          <input
            className={inputCls}
            type="number"
            value={data.year_end ?? ""}
            placeholder="from the job"
            onChange={(e) => onChange({ ...data, year_end: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
        <div>
          <label className={labelCls}>Bay size</label>
          <select className={inputCls} value={data.bay_size ?? "standard"} onChange={(e) => onChange({ ...data, bay_size: e.target.value as StudioProject["bay_size"] })}>
            <option value="small">Small</option>
            <option value="standard">Standard</option>
            <option value="large">Large</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Accent (lamp, paper)</label>
          <input className={inputCls} value={data.accent ?? ""} placeholder="#c4622d" onChange={(e) => onChange({ ...data, accent: e.target.value || null })} />
        </div>
      </div>
      <p className="-mt-2 text-[11px] text-brown">
        Where the bay stands on the Workshop&apos;s time strip, how wide it is, and its lamp colour. Leave the years empty to take them from the matching job.
      </p>

      <div>
        <label className={labelCls}>Cover — the print on the bay&apos;s easel</label>
        <div className="flex items-center gap-4">
          {coverPreview && <Image src={coverPreview} alt="" width={96} height={72} quality={60} className="h-[72px] w-24 object-cover" />}
          <MediaUpload
            pathPrefix={`projects/${data.slug || "new"}`}
            onUploaded={(assetId, url) => {
              setCoverPreview(url);
              onChange({ ...data, cover_asset_id: assetId });
            }}
          />
          {data.cover_asset_id && (
            <button className="text-xs uppercase tracking-wider text-brown hover:text-accent" onClick={() => (onChange({ ...data, cover_asset_id: null }), setCoverPreview(null))}>
              Remove
            </button>
          )}
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

      {data.id && <Pinboard projectId={data.id} slug={data.slug} />}

      {data.id && (
        <div className="flex flex-col gap-2 pt-4 border-t border-tan">
          <label className={labelCls}>
            Related content — brass threads from the bay, and links on /work/{data.slug}
          </label>
          <RelatePicker fromType="project" fromId={data.id} revalidatePagePath={`/work/${data.slug}`} />
          <a href={`/work/${data.slug}`} target="_blank" rel="noopener" className="self-start text-xs uppercase tracking-wider text-brown hover:text-accent">
            View the bay in the world ↗
          </a>
        </div>
      )}
    </div>
  );
}

/** The bay's pinboard: the project's visuals, pinned in order. */
function Pinboard({ projectId, slug }: { projectId: string; slug: string }) {
  const [items, setItems] = useState<ProjectMedia[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = async () => {
    const res = await listProjectMedia(projectId);
    if ("error" in res) setError(res.error);
    else {
      setError(null);
      setItems(res.items);
    }
  };
  useEffect(() => {
    let alive = true;
    void listProjectMedia(projectId).then((res) => {
      if (!alive) return;
      if ("error" in res) setError(res.error);
      else setItems(res.items);
    });
    return () => {
      alive = false;
    };
  }, [projectId]);
  return (
    <div className="flex flex-col gap-3 border-t border-tan pt-4">
      <label className={labelCls}>Pinboard — the project&apos;s visuals in its Workshop bay</label>
      {error && <p className="text-xs text-accent">{error}</p>}
      <div className="flex flex-wrap gap-3">
        {(items ?? []).map((m, i) => (
          <div key={m.id} className="flex w-40 flex-col gap-1 border border-tan p-2">
            {m.path && <Image src={mediaUrl(m.path)} alt="" width={150} height={100} quality={60} className="h-24 w-full object-cover" />}
            <input
              className={inputCls}
              defaultValue={m.caption ?? ""}
              placeholder="Caption"
              onBlur={(e) => void updateProjectMedia(m.id, { caption: e.target.value || null })}
            />
            <select className={inputCls} defaultValue={String(m.weight)} onChange={(e) => void updateProjectMedia(m.id, { weight: Number(e.target.value) })}>
              <option value="1">Small pin</option>
              <option value="2">Medium</option>
              <option value="3">Large</option>
            </select>
            <div className="flex justify-between text-xs text-brown">
              <button
                onClick={async () => {
                  if (i === 0 || !items) return;
                  const a = items[i - 1];
                  await updateProjectMedia(m.id, { sort_order: a.sort_order });
                  await updateProjectMedia(a.id, { sort_order: m.sort_order });
                  void reload();
                }}
                className="hover:text-accent"
              >
                ←
              </button>
              <button
                onClick={async () => {
                  await removeProjectMedia(m.id);
                  void reload();
                }}
                className="uppercase tracking-wider hover:text-accent"
              >
                Unpin
              </button>
            </div>
          </div>
        ))}
      </div>
      {!error && (
        <MediaUpload
          pathPrefix={`projects/${slug}`}
          onUploaded={async (assetId) => {
            const res = await addProjectMedia(projectId, assetId, items?.length ?? 0);
            if ("error" in res) setError(res.error);
            void reload();
          }}
        />
      )}
    </div>
  );
}
