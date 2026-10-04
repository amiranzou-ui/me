"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Experience rows: the employers on the Workshop's roof beams and the
 * Records Room's index tabs. */
export type ExperienceRow = { id?: string; role: string; company: string; date_label: string; points: string[]; sort_order: number };

function refresh() {
  updateTag("experience");
  updateTag("projects");
  revalidatePath("/", "layout");
}

export async function saveExperience(r: ExperienceRow): Promise<{ error: string } | { ok: true; id?: string }> {
  const supabase = await createClient();
  const row = { role: r.role, company: r.company, date_label: r.date_label, points: r.points, sort_order: r.sort_order };
  const { data, error } = r.id
    ? await supabase.from("experience").update(row).eq("id", r.id).select("id").single()
    : await supabase.from("experience").insert(row).select("id").single();
  if (error) return { error: error.message };
  refresh();
  return { ok: true, id: data.id as string };
}

export async function deleteExperience(id: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { error } = await supabase.from("experience").delete().eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { ok: true };
}

export async function reorderExperience(items: { id: string; sort_order: number }[]): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  for (const it of items) {
    const { error } = await supabase.from("experience").update({ sort_order: it.sort_order }).eq("id", it.id);
    if (error) return { error: error.message };
  }
  refresh();
  return { ok: true };
}
