"use client";

import { useState, useTransition } from "react";
import { saveCvMeta } from "./actions";
import type { CvMeta } from "@/lib/matrix/types";
import MediaUpload from "@/components/studio/MediaUpload";

const ICON_OPTIONS = ["linkedin", "behance", "instagram", "github"] as const;

const inputCls =
  "border border-tan bg-cream-alt px-3 py-2 text-sm text-ink outline-none focus:border-accent w-full";
const labelCls = "font-sans text-[11px] uppercase tracking-wider text-brown mb-1.5 block";

export default function CvEditor({ initial, profileAssetUrl }: { initial: CvMeta; profileAssetUrl: string | null }) {
  const [data, setData] = useState<CvMeta>(initial);
  const [photoUrl, setPhotoUrl] = useState(profileAssetUrl);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof CvMeta>(key: K, value: CvMeta[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await saveCvMeta(data);
      if (res?.error) setError(res.error);
      else setSavedAt(Date.now());
    });
  }

  return (
    <div className="flex flex-col gap-10 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl italic text-ink">CV</h1>
        <div className="flex items-center gap-3">
          {savedAt && <span className="text-xs text-brown">Saved — live on /matrix now</span>}
          {error && <span className="text-xs text-accent">{error}</span>}
          <button
            onClick={save}
            disabled={pending}
            className="bg-ink px-5 py-2 text-xs uppercase tracking-widest text-cream transition-colors hover:bg-accent disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <label className={labelCls}>Profile photo</label>
          <div className="flex items-center gap-4">
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="h-16 w-16 rounded-full object-cover border border-tan" />
            )}
            <MediaUpload
              pathPrefix="cv"
              onUploaded={(assetId, previewUrl) => {
                update("profile_asset_id", assetId);
                setPhotoUrl(previewUrl);
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={data.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Tag</label>
            <input className={inputCls} value={data.tag} onChange={(e) => update("tag", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Bio</label>
          <textarea
            className={inputCls}
            rows={2}
            value={data.bio}
            onChange={(e) => update("bio", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Summary</label>
          <textarea
            className={inputCls}
            rows={4}
            value={data.summary}
            onChange={(e) => update("summary", e.target.value)}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-lg italic text-ink">Contact</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Email</label>
            <input
              className={inputCls}
              value={data.contact.email}
              onChange={(e) => update("contact", { ...data.contact, email: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input
              className={inputCls}
              value={data.contact.phone}
              onChange={(e) => update("contact", { ...data.contact, phone: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Location</label>
            <input
              className={inputCls}
              value={data.contact.location}
              onChange={(e) => update("contact", { ...data.contact, location: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-lg italic text-ink">Links</h2>
        {data.links.map((link, i) => (
          <div key={i} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className={labelCls}>Label</label>
              <input
                className={inputCls}
                value={link.label}
                onChange={(e) => {
                  const links = [...data.links];
                  links[i] = { ...link, label: e.target.value };
                  update("links", links);
                }}
              />
            </div>
            <div className="flex-[2]">
              <label className={labelCls}>URL</label>
              <input
                className={inputCls}
                value={link.url}
                onChange={(e) => {
                  const links = [...data.links];
                  links[i] = { ...link, url: e.target.value };
                  update("links", links);
                }}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Icon</label>
              <select
                className={inputCls}
                value={link.icon}
                onChange={(e) => {
                  const links = [...data.links];
                  links[i] = { ...link, icon: e.target.value };
                  update("links", links);
                }}
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => update("links", data.links.filter((_, j) => j !== i))}
              className="px-3 py-2 text-xs uppercase tracking-wider text-brown hover:text-accent"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={() => update("links", [...data.links, { label: "", url: "", icon: "linkedin" }])}
          className="self-start border border-tan px-4 py-2 text-xs uppercase tracking-wider text-brown hover:border-accent hover:text-accent"
        >
          + Add link
        </button>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-lg italic text-ink">Landing page</h2>
        <p className="text-xs text-brown">
          Feeds the split-screen home page — the profile card&apos;s &quot;currently&quot; line and each side&apos;s
          tagline.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Currently — label</label>
            <input
              className={inputCls}
              placeholder="Building"
              value={data.currently_label}
              onChange={(e) => update("currently_label", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Currently — value</label>
            <input
              className={inputCls}
              placeholder="This website, apparently"
              value={data.currently_value}
              onChange={(e) => update("currently_value", e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Matrix side tagline</label>
            <p className="text-xs text-brown mb-1">One line per row.</p>
            <textarea
              className={inputCls}
              rows={3}
              value={data.matrix_side_desc.join("\n")}
              onChange={(e) => update("matrix_side_desc", e.target.value.split("\n"))}
            />
          </div>
          <div>
            <label className={labelCls}>Human side tagline</label>
            <p className="text-xs text-brown mb-1">One line per row.</p>
            <textarea
              className={inputCls}
              rows={3}
              value={data.human_side_desc.join("\n")}
              onChange={(e) => update("human_side_desc", e.target.value.split("\n"))}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-lg italic text-ink">Core skills</h2>
        <p className="text-xs text-brown">One per line.</p>
        <textarea
          className={inputCls}
          rows={4}
          value={data.core_skills.join("\n")}
          onChange={(e) => update("core_skills", e.target.value.split("\n"))}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-lg italic text-ink">Signals</h2>
        <p className="text-xs text-brown">One per line.</p>
        <textarea
          className={inputCls}
          rows={5}
          value={data.signals.join("\n")}
          onChange={(e) => update("signals", e.target.value.split("\n"))}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-lg italic text-ink">Education</h2>
        {data.education.map((ed, i) => (
          <div key={i} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className={labelCls}>Degree</label>
              <input
                className={inputCls}
                value={ed.degree}
                onChange={(e) => {
                  const education = [...data.education];
                  education[i] = { ...ed, degree: e.target.value };
                  update("education", education);
                }}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>School</label>
              <input
                className={inputCls}
                value={ed.school}
                onChange={(e) => {
                  const education = [...data.education];
                  education[i] = { ...ed, school: e.target.value };
                  update("education", education);
                }}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Date</label>
              <input
                className={inputCls}
                value={ed.date}
                onChange={(e) => {
                  const education = [...data.education];
                  education[i] = { ...ed, date: e.target.value };
                  update("education", education);
                }}
              />
            </div>
            <button
              onClick={() => update("education", data.education.filter((_, j) => j !== i))}
              className="px-3 py-2 text-xs uppercase tracking-wider text-brown hover:text-accent"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={() => update("education", [...data.education, { degree: "", school: "", date: "" }])}
          className="self-start border border-tan px-4 py-2 text-xs uppercase tracking-wider text-brown hover:border-accent hover:text-accent"
        >
          + Add education
        </button>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-lg italic text-ink">Languages</h2>
        {data.languages.map((lang, i) => (
          <div key={i} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className={labelCls}>Language</label>
              <input
                className={inputCls}
                value={lang.lang}
                onChange={(e) => {
                  const languages = [...data.languages];
                  languages[i] = { ...lang, lang: e.target.value };
                  update("languages", languages);
                }}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Level</label>
              <input
                className={inputCls}
                value={lang.level}
                onChange={(e) => {
                  const languages = [...data.languages];
                  languages[i] = { ...lang, level: e.target.value };
                  update("languages", languages);
                }}
              />
            </div>
            <button
              onClick={() => update("languages", data.languages.filter((_, j) => j !== i))}
              className="px-3 py-2 text-xs uppercase tracking-wider text-brown hover:text-accent"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={() => update("languages", [...data.languages, { lang: "", level: "" }])}
          className="self-start border border-tan px-4 py-2 text-xs uppercase tracking-wider text-brown hover:border-accent hover:text-accent"
        >
          + Add language
        </button>
      </section>
    </div>
  );
}
