import { createClient } from "@/lib/supabase/server";
import SkillsEditor from "./SkillsEditor";
import type { SkillsRow } from "./actions";

export default async function StudioSkillsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("skills_groups").select("*").order("sort_order");
  return <SkillsEditor initial={(data ?? []) as SkillsRow[]} />;
}
