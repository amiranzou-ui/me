import { createClient } from "@/lib/supabase/server";
import ExperienceEditor from "./ExperienceEditor";
import type { ExperienceRow } from "./actions";

export default async function StudioExperiencePage() {
  const supabase = await createClient();
  const { data } = await supabase.from("experience").select("*").order("sort_order");
  return <ExperienceEditor initial={(data ?? []) as ExperienceRow[]} />;
}
