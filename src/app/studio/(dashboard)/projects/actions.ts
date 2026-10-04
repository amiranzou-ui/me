"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProjectMedia, StudioProject } from "./types";

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

  const payload: Record<string, unknown> = {
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
    cover_asset_id: data.cover_asset_id ?? null,
  };
  // The world's bay fields (migration 0006) are only sent when set, so
  // saving still works on a database the migration hasn't reached yet.
  for (const k of ["year_start", "year_end", "bay_size", "accent"] as const) {
    if (data[k] !== undefined) payload[k] = data[k] === "" ? null : data[k];
  }

  const { data: row, error } = data.id
    ? await supabase.from("projects").update(payload).eq("id", data.id).select("id, slug").single()
    : await supabase.from("projects").insert(payload).select("id, slug").single();

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  updateTag("projects");
  updateTag(`project:${row.slug}`);
  return { ok: true, id: row.id as string, slug: row.slug as string };
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  updateTag("projects");
  return { ok: true };
}

// ── The bay's pinboard: project media (migration 0006) ──────────────────
const NEEDS_MIGRATION = "The pinboard needs database migration 0006 (supabase/migrations/0006_world.sql).";

export async function listProjectMedia(projectId: string): Promise<{ error: string } | { ok: true; items: ProjectMedia[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_media")
    .select("id, asset_id, caption, weight, sort_order, assets(path)")
    .eq("project_id", projectId)
    .order("sort_order");
  if (error) return { error: error.code === "42P01" || /project_media/.test(error.message) ? NEEDS_MIGRATION : error.message };
  return {
    ok: true,
    items: (data ?? []).map((m) => ({
      id: m.id as string,
      asset_id: m.asset_id as string,
      caption: (m.caption as string) ?? null,
      weight: (m.weight as number) ?? 1,
      sort_order: (m.sort_order as number) ?? 0,
      path: ((m.assets as unknown as { path: string } | null)?.path ?? "") as string,
    })),
  };
}

export async function addProjectMedia(projectId: string, assetId: string, sortOrder: number): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_media").insert({ project_id: projectId, asset_id: assetId, sort_order: sortOrder });
  if (error) return { error: /project_media/.test(error.message) ? NEEDS_MIGRATION : error.message };
  updateTag("projects");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateProjectMedia(id: string, patch: { caption?: string | null; weight?: number; sort_order?: number }): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_media").update(patch).eq("id", id);
  if (error) return { error: error.message };
  updateTag("projects");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeProjectMedia(id: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_media").delete().eq("id", id);
  if (error) return { error: error.message };
  updateTag("projects");
  revalidatePath("/", "layout");
  return { ok: true };
}
