import { createClient } from "@/lib/supabase/server";
import TracksManager from "./TracksManager";
import type { Track } from "@/lib/human/types";

export default async function StudioTracksPage() {
  const supabase = await createClient();
  const { data: tracks } = await supabase.from("tracks").select("*").order("sort_order");

  return <TracksManager tracks={(tracks ?? []) as Track[]} />;
}
