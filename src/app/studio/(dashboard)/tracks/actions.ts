"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function upsertTrack(data: {
  id?: string;
  title: string;
  artist: string | null;
  year: string | null;
  mood: string[];
  fragment: string | null;
  side: string | null;
  room: string | null;
  note: string | null;
  storage_path: string;
  sort_order: number;
  status: "draft" | "published" | "archived";
}): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { error } = data.id
    ? await supabase.from("tracks").update(data).eq("id", data.id)
    : await supabase.from("tracks").insert(data);
  if (error) return { error: error.message };
  revalidatePath("/human");
  return { ok: true };
}

export async function deleteTrack(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tracks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/human");
  return { ok: true };
}

export async function reorderTracks(items: { id: string; sort_order: number }[]) {
  const supabase = await createClient();
  for (const item of items) {
    const { error } = await supabase.from("tracks").update({ sort_order: item.sort_order }).eq("id", item.id);
    if (error) return { error: error.message };
  }
  revalidatePath("/human");
  return { ok: true };
}
