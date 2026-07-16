import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/supabase/media";
import CvEditor from "./CvEditor";
import type { CvMeta } from "@/lib/matrix/types";

export default async function StudioCvPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("cv_meta").select("*, assets(path)").eq("id", 1).single();
  const asset = data?.assets as unknown as { path: string } | null;

  return <CvEditor initial={data as CvMeta} profileAssetUrl={asset ? mediaUrl(asset.path) : null} />;
}
