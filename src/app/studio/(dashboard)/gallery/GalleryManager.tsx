"use client";

import { useState } from "react";
import { mediaUrl } from "@/lib/supabase/media";
import { createClient } from "@/lib/supabase/client";
import MediaUpload from "@/components/studio/MediaUpload";
import { upsertGalleryItem, deleteGalleryItem, reorderGalleryItems, upsertCategory } from "./actions";
import type { Category, GalleryItem } from "@/lib/human/types";

const inputCls =
  "border border-tan bg-cream-alt px-3 py-2 text-sm text-ink outline-none focus:border-accent w-full";
const labelCls = "font-sans text-[11px] uppercase tracking-wider text-brown mb-1.5 block";

export default function GalleryManager({ categories, items }: { categories: Category[]; items: GalleryItem[] }) {
  const [allItems, setAllItems] = useState(items);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6 pb-24">
      <h1 className="font-serif text-2xl italic text-ink">Gallery</h1>
      {categories.map((cat) => (
        <div key={cat.id} className="border border-tan">
          <button
            className="flex w-full items-center justify-between px-5 py-4 text-left"
            onClick={() => setOpenCategory(openCategory === cat.id ? null : cat.id)}
          >
            <div>
              <span className="font-serif text-lg italic text-ink mr-3">
                {cat.roman}. {cat.label}
              </span>
              <span className="text-xs text-brown">{cat.kind}</span>
              {cat.is_locked && <span className="ml-2 text-[10px] uppercase tracking-wider text-accent">locked</span>}
            </div>
            <span className="text-xs text-brown">
              {allItems.filter((i) => i.category_id === cat.id).length} items
            </span>
          </button>
          {openCategory === cat.id && (
            <div className="border-t border-tan p-5">
              <CategoryEditor category={cat} />
              {cat.kind === "gallery" && (
                <ItemsEditor
                  category={cat}
                  items={allItems.filter((i) => i.category_id === cat.id).sort((a, b) => a.sort_order - b.sort_order)}
                  onChange={(updated) => {
                    setAllItems((all) => [...all.filter((i) => i.category_id !== cat.id), ...updated]);
                  }}
                />
              )}
              {cat.kind !== "gallery" && <p className="text-xs text-brown mt-4">This category has no gallery (music uses the Tracks manager; placeholder categories have no editable content yet).</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CategoryEditor({ category }: { category: Category }) {
  const [tagline, setTagline] = useState(category.tagline);
  const [isLocked, setIsLocked] = useState(category.is_locked);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setPending(true);
    await upsertCategory({ ...category, tagline, is_locked: isLocked });
    setPending(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3 mb-6 pb-6 border-b border-tan">
      <div>
        <label className={labelCls}>Tagline</label>
        <input className={inputCls} value={tagline} onChange={(e) => setTagline(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-xs text-brown">
        <input type="checkbox" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} />
        Locked (friend-gate soft lock)
      </label>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending}
          className="self-start bg-ink px-4 py-2 text-xs uppercase tracking-widest text-cream hover:bg-accent disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save category"}
        </button>
        {saved && <span className="text-xs text-brown">Saved</span>}
      </div>
    </div>
  );
}

function ItemsEditor({
  category,
  items,
  onChange,
}: {
  category: Category;
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
}) {
  const [newCaption, setNewCaption] = useState("");
  const [newHover, setNewHover] = useState("");
  const [newText, setNewText] = useState("");

  async function move(item: GalleryItem, dir: -1 | 1) {
    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((i) => i.id === item.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    const updated = sorted.map((i) => {
      if (i.id === a.id) return { ...i, sort_order: b.sort_order };
      if (i.id === b.id) return { ...i, sort_order: a.sort_order };
      return i;
    });
    onChange(updated);
    await reorderGalleryItems([
      { id: a.id, sort_order: b.sort_order },
      { id: b.id, sort_order: a.sort_order },
    ]);
  }

  async function toggleStatus(item: GalleryItem) {
    const status = item.status === "published" ? "draft" : "published";
    onChange(items.map((i) => (i.id === item.id ? { ...i, status } : i)));
    await upsertGalleryItem({ ...item, status } as never);
  }

  async function remove(item: GalleryItem) {
    onChange(items.filter((i) => i.id !== item.id));
    await deleteGalleryItem(item.id);
  }

  async function updateCaption(item: GalleryItem, caption: string) {
    onChange(items.map((i) => (i.id === item.id ? { ...i, caption } : i)));
    await upsertGalleryItem({ ...item, caption } as never);
  }

  return (
    <div className="flex flex-col gap-4">
      {items
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => (
          <div key={item.id} className="flex gap-4 items-start border border-tan p-3">
            {item.assets && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(item.assets.path)} alt="" className="w-20 h-20 object-cover flex-shrink-0" />
            )}
            <div className="flex-1 flex flex-col gap-2">
              <input
                className={inputCls}
                defaultValue={item.caption ?? ""}
                onBlur={(e) => updateCaption(item, e.target.value)}
                placeholder="Caption"
              />
              <div className="flex items-center gap-3">
                <button onClick={() => move(item, -1)} className="text-xs text-brown hover:text-accent">
                  ↑
                </button>
                <button onClick={() => move(item, 1)} className="text-xs text-brown hover:text-accent">
                  ↓
                </button>
                <button onClick={() => toggleStatus(item)} className="text-xs uppercase tracking-wider text-brown hover:text-accent">
                  {item.status === "published" ? "Published — click to unpublish" : "Draft — click to publish"}
                </button>
                <button onClick={() => remove(item)} className="ml-auto text-xs uppercase tracking-wider text-brown hover:text-accent">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

      <div className="border border-dashed border-tan p-4 flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wider text-brown">Add to {category.label}</p>
        <input className={inputCls} placeholder="Caption" value={newCaption} onChange={(e) => setNewCaption(e.target.value)} />
        {category.slug === "cooking" && (
          <>
            <input
              className={inputCls}
              placeholder="Hover caption"
              value={newHover}
              onChange={(e) => setNewHover(e.target.value)}
            />
            <textarea
              className={inputCls}
              placeholder="Expanded text (one line per paragraph)"
              rows={2}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
          </>
        )}
        <MediaUpload
          pathPrefix={`gallery/${category.slug}`}
          onUploaded={async (assetId) => {
            const meta = category.slug === "cooking" ? { hover_caption: newHover, text: newText.split("\n").filter(Boolean) } : {};
            const res = await upsertGalleryItem({
              category_id: category.id,
              title: null,
              caption: newCaption || null,
              alt_text: null,
              asset_id: assetId,
              sort_order: items.length,
              status: "published",
              meta,
            });
            if (!("error" in res)) {
              setNewCaption("");
              setNewHover("");
              setNewText("");
              const supabase = createClient();
              const { data } = await supabase
                .from("gallery_items")
                .select("*, assets(*)")
                .eq("category_id", category.id)
                .order("sort_order");
              onChange((data ?? []) as GalleryItem[]);
            }
          }}
        />
      </div>
    </div>
  );
}
