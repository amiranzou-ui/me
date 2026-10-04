"use client";

import RowsEditor from "@/components/studio/RowsEditor";
import { deleteExperience, reorderExperience, saveExperience, type ExperienceRow } from "./actions";

export default function ExperienceEditor({ initial }: { initial: ExperienceRow[] }) {
  return (
    <RowsEditor<ExperienceRow>
      title="Experience"
      intro="Each job paints its name and dates on a roof beam in the Workshop, above the bays of its projects, and becomes an index tab in the Records Room. Projects find their job by its company name (or by the link set on the project)."
      rows={initial}
      blank={() => ({ role: "", company: "", date_label: "", points: [], sort_order: 0 })}
      rowTitle={(r) => [r.role, r.company].filter(Boolean).join(" — ")}
      fields={[
        { key: "role", label: "Role", kind: "text" },
        { key: "company", label: "Company", kind: "text" },
        { key: "date_label", label: "Dates", kind: "text", hint: "As shown, e.g. “Sep 2024 — Jan 2025” or “2025 — Present”. Years are read from it to place the job on the time strip." },
        { key: "points", label: "What the job involved", kind: "list", hint: "One point per line." },
      ]}
      save={saveExperience}
      remove={deleteExperience}
      reorder={reorderExperience}
      previewHref="/records"
    />
  );
}
