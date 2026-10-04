import { createClient } from "@/lib/supabase/server";
import NodesEditor from "./NodesEditor";
import type { NodeRow } from "./actions";

export default async function StudioThinkingPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("matrix_nodes").select("*").order("sort_order");
  const rows: NodeRow[] = (data ?? []).map((n) => ({
    id: n.id,
    node_key: n.node_key,
    type: n.type,
    x: Number(n.x),
    y: Number(n.y),
    title: n.title ?? "",
    summary: n.summary ?? "",
    connections: n.connections ?? [],
    steps: ((n.thinking ?? []) as { phase: string; text: string }[]).map((t) => `${t.phase} — ${t.text}`),
    sort_order: n.sort_order ?? 0,
  }));
  return <NodesEditor initial={rows} />;
}
