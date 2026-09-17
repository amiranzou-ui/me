"use server";

import { revalidatePath, updateTag } from "next/cache";
import sharp from "sharp";
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

const HEIC_PATTERN = /heic|heif/i;

/**
 * Most non-Safari browsers can't decode HEIC/HEIF in an <img>, so a HEIC
 * upload (which Safari itself can complete fine, since it can read the
 * dimensions client-side) would otherwise render as a broken image for
 * most public visitors. This converts it to a JPEG derivative server-side
 * and repoints the asset row at that — the original HEIC file stays in
 * Storage untouched at its original path, never deleted, just no longer
 * the one referenced for display.
 *
 * No-op (not an error) for any non-HEIC asset. On conversion failure, the
 * asset row is left exactly as it was — never partially updated — and the
 * caller is told so it can surface a "couldn't auto-convert" notice rather
 * than silently shipping a broken image.
 */
export async function convertHeicIfNeeded(
  assetId: string,
): Promise<{ converted: false } | { converted: true; path: string } | { converted: false; error: string }> {
  const supabase = await createClient();
  const { data: asset } = await supabase.from("assets").select("*").eq("id", assetId).single();
  if (!asset) return { converted: false, error: "Asset not found" };
  if (!HEIC_PATTERN.test(asset.mime ?? "") && !/\.hei[cf]$/i.test(asset.path)) {
    return { converted: false };
  }

  try {
    const { data: file, error: downloadError } = await supabase.storage.from(asset.bucket).download(asset.path);
    if (downloadError || !file) throw downloadError ?? new Error("download failed");

    const original = Buffer.from(await file.arrayBuffer());
    const converted = await sharp(original).rotate().jpeg({ quality: 85 }).toBuffer();
    const meta = await sharp(converted).metadata();

    const newPath = asset.path.replace(/\.[^./]+$/, "") + ".jpg";
    const { error: uploadError } = await supabase.storage.from(asset.bucket).upload(newPath, converted, {
      contentType: "image/jpeg",
      upsert: false,
      cacheControl: "31536000",
    });
    if (uploadError) throw uploadError;

    const { error: updateError } = await supabase
      .from("assets")
      .update({
        path: newPath,
        mime: "image/jpeg",
        width: meta.width ?? asset.width,
        height: meta.height ?? asset.height,
        size_bytes: converted.length,
      })
      .eq("id", assetId);
    if (updateError) throw updateError;

    revalidatePath("/human");
    updateTag("gallery-items");
    return { converted: true, path: newPath };
  } catch (err) {
    return { converted: false, error: err instanceof Error ? err.message : "Conversion failed" };
  }
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
  updateTag("gallery-items");
  return { ok: true };
}

export async function deleteGalleryItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("gallery_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/human");
  updateTag("gallery-items");
  return { ok: true };
}

export async function reorderGalleryItems(items: { id: string; sort_order: number }[]) {
  const supabase = await createClient();
  for (const item of items) {
    const { error } = await supabase.from("gallery_items").update({ sort_order: item.sort_order }).eq("id", item.id);
    if (error) return { error: error.message };
  }
  revalidatePath("/human");
  updateTag("gallery-items");
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
  updateTag("categories");
  return { ok: true };
}
