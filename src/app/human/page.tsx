import "@/styles/human.css";
import { createClient } from "@/lib/supabase/server";
import HumanApp from "@/components/human/HumanApp";
import type { Category, GalleryItem, Track } from "@/lib/human/types";

export const revalidate = 60;

export default async function HumanPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: galleryItems }, { data: tracks }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("gallery_items")
      .select("*, assets(*)")
      .eq("status", "published")
      .order("sort_order"),
    supabase.from("tracks").select("*").eq("status", "published").order("sort_order"),
  ]);

  const itemsByCategory: Record<string, GalleryItem[]> = {};
  for (const item of (galleryItems ?? []) as GalleryItem[]) {
    const cat = (categories ?? []).find((c) => c.id === item.category_id);
    if (!cat) continue;
    (itemsByCategory[cat.slug] ??= []).push(item);
  }

  return (
    <HumanApp
      categories={(categories ?? []) as Category[]}
      itemsByCategory={itemsByCategory}
      tracks={(tracks ?? []) as Track[]}
    />
  );
}
