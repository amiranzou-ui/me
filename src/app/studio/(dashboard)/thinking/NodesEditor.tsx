"use client";

import RowsEditor from "@/components/studio/RowsEditor";
import { deleteNode, reorderNodes, saveNode, type NodeRow } from "./actions";

export default function NodesEditor({ initial }: { initial: NodeRow[] }) {
  return (
    <RowsEditor<NodeRow>
      title="Thinking path"
      intro="Each node is a place on the Plan Room's table, at x/y percent across and down it. Connections become brass paths you can walk; the steps are laid along the path that leads to the node, first step furthest out, last at the node."
      rows={initial}
      blank={() => ({ node_key: "", type: "thought", x: 50, y: 50, title: "", summary: "", connections: [], steps: [], sort_order: 0 })}
      rowTitle={(r) => (r.title ? `${r.title} (${r.type})` : r.node_key)}
      fields={[
        { key: "title", label: "Title", kind: "text" },
        { key: "node_key", label: "Key", kind: "text", hint: "Short and lowercase; its URL is /thinking/<key>." },
        { key: "type", label: "Type", kind: "select", options: ["timeline", "skill", "project", "thought"], hint: "Timeline: a stone in the ground. Skill: a plinth. Project: a miniature bay. Thought: glass hanging above." },
        { key: "summary", label: "Summary", kind: "text" },
        { key: "x", label: "Across the table (0–100)", kind: "number" },
        { key: "y", label: "Down the table (0–100)", kind: "number" },
        { key: "connections", label: "Connected to (keys)", kind: "list", hint: "One node key per line." },
        { key: "steps", label: "Thinking steps", kind: "list", hint: "One per line, in order: “origin — I was drawn to design because…”." },
      ]}
      save={saveNode}
      remove={deleteNode}
      reorder={reorderNodes}
      previewHref="/thinking"
    />
  );
}
