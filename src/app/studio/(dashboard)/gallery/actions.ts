"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createAsset(data: {
  bucket: string;
  path: string;
  width: number;
  height: number;
  mime: string;
  size_bytes: number;
}) {
  const supabase = await createClient();
  const { data: row, error } = await supabase.from("assets").insert(data).select("id").single();
  if (error) return { error: error.message };
  return { id: row.id as string };
}

export async function upsertGalleryItem(data: {
  id?: string;
  category_id: string;
  title: string | null;
  caption: string | null;
  alt_text: string | null;
  asset_id: string | null;
  sort_order: number;
  status: "draft" | "published" | "archived";
  meta: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { error } = data.id
    ? await supabase.from("gallery_items").update(data).eq("id", data.id)
    : await supabase.from("gallery_items").insert(data);
  if (error) return { error: error.message };
  revalidatePath("/human");
  return { ok: true };
}

export async function deleteGalleryItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("gallery_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/human");
  return { ok: true };
}

export async function reorderGalleryItems(items: { id: string; sort_order: number }[]) {
  const supabase = await createClient();
  for (const item of items) {
    const { error } = await supabase.from("gallery_items").update({ sort_order: item.sort_order }).eq("id", item.id);
    if (error) return { error: error.message };
  }
  revalidatePath("/human");
  return { ok: true };
}

export async function upsertCategory(data: {
  id?: string;
  slug: string;
  label: string;
  roman: string;
  tagline: string;
  kind: "gallery" | "music" | "placeholder";
  is_locked: boolean;
  sort_order: number;
}) {
  const supabase = await createClient();
  const { error } = data.id
    ? await supabase.from("categories").update(data).eq("id", data.id)
    : await supabase.from("categories").insert(data);
  if (error) return { error: error.message };
  revalidatePath("/human");
  return { ok: true };
}
