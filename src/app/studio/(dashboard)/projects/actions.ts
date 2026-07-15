"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { StudioProject } from "./types";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function upsertProject(data: StudioProject): Promise<{ error: string } | { ok: true; id: string; slug: string }> {
  const supabase = await createClient();
  const slug = data.slug || slugify(data.title);

  const payload = {
    slug,
    title: data.title,
    role: data.role,
    description: data.description,
    impact: data.impact,
    stack: data.stack,
    behance_url: data.behance_url || null,
    external_url: data.external_url || null,
    status: data.status,
    sort_order: data.sort_order,
    published_at: data.status === "published" ? new Date().toISOString() : null,
  };

  const { data: row, error } = data.id
    ? await supabase.from("projects").update(payload).eq("id", data.id).select("id, slug").single()
    : await supabase.from("projects").insert(payload).select("id, slug").single();

  if (error) return { error: error.message };

  revalidatePath("/matrix");
  revalidatePath(`/project/${row.slug}`);
  return { ok: true, id: row.id as string, slug: row.slug as string };
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/matrix");
  return { ok: true };
}
