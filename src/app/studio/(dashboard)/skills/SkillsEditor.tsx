"use client";

import RowsEditor from "@/components/studio/RowsEditor";
import { deleteSkills, reorderSkills, saveSkills, type SkillsRow } from "./actions";

export default function SkillsEditor({ initial }: { initial: SkillsRow[] }) {
  return (
    <RowsEditor<SkillsRow>
      title="Skills"
      intro="Each group is a drawer in the Type Case; each skill is a block of metal type in it. Hovering a block draws brass threads to the bays whose tools mention it."
      rows={initial}
      blank={() => ({ group_name: "", tags: [], sort_order: 0 })}
      rowTitle={(r) => r.group_name}
      fields={[
        { key: "group_name", label: "Drawer (group)", kind: "text", wide: true },
        { key: "tags", label: "Skills", kind: "list", hint: "One skill per line." },
      ]}
      save={saveSkills}
      remove={deleteSkills}
      reorder={reorderSkills}
      previewHref="/skills"
    />
  );
}
