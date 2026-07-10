import { createClient } from "@/lib/supabase/server";
import CvEditor from "./CvEditor";
import type { CvMeta } from "@/lib/matrix/types";

export default async function StudioCvPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("cv_meta").select("*").eq("id", 1).single();

  return <CvEditor initial={data as CvMeta} />;
}
