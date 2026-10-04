"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Thinking-path nodes: the places on the Plan Room's table. */
export type NodeRow = {
  id?: string;
  node_key: string;
  type: "timeline" | "skill" | "project" | "thought";
  x: number;
  y: number;
  title: string;
  summary: string;
  connections: string[];
  /** One step per line, "phase — text". Stored as [{phase, text}]. */
  steps: string[];
  sort_order: number;
};

function refresh() {
  updateTag("matrix-nodes");
  revalidatePath("/", "layout");
}

export async function saveNode(r: NodeRow): Promise<{ error: string } | { ok: true; id?: string }> {
  const key = r.node_key.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  if (!key) return { error: "Give the node a key (used in its URL: /thinking/<key>)." };
  const thinking = r.steps
    .map((line) => {
      const [phase, ...rest] = line.split(/\s+[—–-]\s+/);
      return rest.length ? { phase: phase.trim(), text: rest.join(" — ").trim() } : { phase: "note", text: line.trim() };
    })
    .filter((s) => s.text);
  const row = {
    node_key: key,
    type: r.type,
    x: Math.max(0, Math.min(100, Number(r.x) || 50)),
    y: Math.max(0, Math.min(100, Number(r.y) || 50)),
    title: r.title,
    summary: r.summary,
    connections: r.connections.map((c) => c.trim()).filter(Boolean),
    thinking,
    sort_order: r.sort_order,
  };
  const supabase = await createClient();
  const { data, error } = r.id
    ? await supabase.from("matrix_nodes").update(row).eq("id", r.id).select("id").single()
    : await supabase.from("matrix_nodes").insert(row).select("id").single();
  if (error) return { error: error.message };
  refresh();
  return { ok: true, id: data.id as string };
}

export async function deleteNode(id: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { error } = await supabase.from("matrix_nodes").delete().eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { ok: true };
}

export async function reorderNodes(items: { id: string; sort_order: number }[]): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  for (const it of items) {
    const { error } = await supabase.from("matrix_nodes").update({ sort_order: it.sort_order }).eq("id", it.id);
    if (error) return { error: error.message };
  }
  refresh();
  return { ok: true };
}
