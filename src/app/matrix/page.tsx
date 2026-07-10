import "@/styles/matrix.css";
import { createClient } from "@/lib/supabase/server";
import MatrixApp from "@/components/matrix/MatrixApp";
import type { CvMeta, Experience, MatrixNode, Project, SkillsGroup } from "@/lib/matrix/types";

export const revalidate = 60;

export default async function MatrixPage() {
  const supabase = await createClient();

  const [{ data: cvMeta }, { data: projects }, { data: experience }, { data: skillsGroups }, { data: nodes }] =
    await Promise.all([
      supabase.from("cv_meta").select("*").eq("id", 1).single(),
      supabase.from("projects").select("*").eq("status", "published").order("sort_order"),
      supabase.from("experience").select("*").order("sort_order"),
      supabase.from("skills_groups").select("*").order("sort_order"),
      supabase.from("matrix_nodes").select("*").order("sort_order"),
    ]);

  return (
    <MatrixApp
      cvMeta={cvMeta as CvMeta}
      projects={(projects ?? []) as Project[]}
      experience={(experience ?? []) as Experience[]}
      skillsGroups={(skillsGroups ?? []) as SkillsGroup[]}
      nodes={(nodes ?? []) as MatrixNode[]}
    />
  );
}
