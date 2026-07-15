"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RelatableType = "project" | "gallery_item" | "track";

export type RelationSearchResult = {
  type: RelatableType;
  id: string;
  title: string;
  subtitle: string;
};

export type Relation = {
  id: string;
  to_type: string;
  to_id: string;
  relation_label: string | null;
  title: string;
};

export async function searchRelatableContent(query: string): Promise<RelationSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const supabase = await createClient();
  const q = `%${trimmed}%`;

  const [{ data: projects }, { data: items }, { data: tracks }] = await Promise.all([
    supabase.from("projects").select("id, title, role").ilike("title", q).limit(8),
    supabase.from("gallery_items").select("id, caption").ilike("caption", q).limit(8),
    supabase.from("tracks").select("id, title, artist").ilike("title", q).limit(8),
  ]);

  const results: RelationSearchResult[] = [];
  for (const p of projects ?? []) {
    results.push({ type: "project", id: p.id, title: p.title, subtitle: p.role ?? "Project" });
  }
  for (const it of items ?? []) {
    results.push({ type: "gallery_item", id: it.id, title: it.caption ?? "(untitled photo)", subtitle: "Gallery" });
  }
  for (const t of tracks ?? []) {
    results.push({ type: "track", id: t.id, title: t.title, subtitle: t.artist ?? "Track" });
  }
  return results;
}

export async function listRelations(fromType: string, fromId: string): Promise<Relation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_relations")
    .select("id, to_type, to_id, relation_label")
    .eq("from_type", fromType)
    .eq("from_id", fromId)
    .order("sort_order");
  if (error || !data) return [];

  return Promise.all(
    data.map(async (r) => {
      let title = "(unknown)";
      if (r.to_type === "project") {
        const { data: row } = await supabase.from("projects").select("title").eq("id", r.to_id).single();
        title = row?.title ?? title;
      } else if (r.to_type === "gallery_item") {
        const { data: row } = await supabase.from("gallery_items").select("caption").eq("id", r.to_id).single();
        title = row?.caption ?? "(untitled photo)";
      } else if (r.to_type === "track") {
        const { data: row } = await supabase.from("tracks").select("title").eq("id", r.to_id).single();
        title = row?.title ?? title;
      }
      return { id: r.id, to_type: r.to_type, to_id: r.to_id, relation_label: r.relation_label, title };
    }),
  );
}

export async function addRelation(input: {
  from_type: string;
  from_id: string;
  to_type: string;
  to_id: string;
  relation_label: string | null;
  revalidatePagePath?: string;
}): Promise<{ error: string } | { ok: true; id: string }> {
  const supabase = await createClient();
  const { from_type, from_id, to_type, to_id, relation_label } = input;

  const { count } = await supabase
    .from("content_relations")
    .select("id", { count: "exact", head: true })
    .eq("from_type", from_type)
    .eq("from_id", from_id);

  const { data, error } = await supabase
    .from("content_relations")
    .insert({ from_type, from_id, to_type, to_id, relation_label, sort_order: count ?? 0 })
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (input.revalidatePagePath) revalidatePath(input.revalidatePagePath);
  return { ok: true, id: data.id as string };
}

export async function removeRelation(id: string, revalidatePagePath?: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { error } = await supabase.from("content_relations").delete().eq("id", id);
  if (error) return { error: error.message };
  if (revalidatePagePath) revalidatePath(revalidatePagePath);
  return { ok: true };
}
