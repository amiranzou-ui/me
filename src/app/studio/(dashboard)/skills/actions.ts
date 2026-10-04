"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Skill groups: the drawers of the Type Case. */
export type SkillsRow = { id?: string; group_name: string; tags: string[]; sort_order: number };

function refresh() {
  updateTag("skills-groups");
  revalidatePath("/", "layout");
}

export async function saveSkills(r: SkillsRow): Promise<{ error: string } | { ok: true; id?: string }> {
  const supabase = await createClient();
  const row = { group_name: r.group_name, tags: r.tags, sort_order: r.sort_order };
  const { data, error } = r.id
    ? await supabase.from("skills_groups").update(row).eq("id", r.id).select("id").single()
    : await supabase.from("skills_groups").insert(row).select("id").single();
  if (error) return { error: error.message };
  refresh();
  return { ok: true, id: data.id as string };
}

export async function deleteSkills(id: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { error } = await supabase.from("skills_groups").delete().eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { ok: true };
}

export async function reorderSkills(items: { id: string; sort_order: number }[]): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  for (const it of items) {
    const { error } = await supabase.from("skills_groups").update({ sort_order: it.sort_order }).eq("id", it.id);
    if (error) return { error: error.message };
  }
  refresh();
  return { ok: true };
}
