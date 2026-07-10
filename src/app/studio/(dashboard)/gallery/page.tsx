import { createClient } from "@/lib/supabase/server";
import GalleryManager from "./GalleryManager";
import type { Category, GalleryItem } from "@/lib/human/types";

export default async function StudioGalleryPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("gallery_items").select("*, assets(*)").order("sort_order"),
  ]);

  return (
    <GalleryManager categories={(categories ?? []) as Category[]} items={(items ?? []) as GalleryItem[]} />
  );
}
