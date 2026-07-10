import { createClient } from "@/lib/supabase/server";
import ProjectsEditor from "./ProjectsEditor";
import type { StudioProject } from "./types";

export default async function StudioProjectsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("*").order("sort_order");

  return <ProjectsEditor initial={(data ?? []) as StudioProject[]} />;
}
