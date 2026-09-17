import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Category, GalleryItem, Track } from "@/lib/human/types";

/**
 * Cached public reads for the /human page. Wrapped in `unstable_cache`
 * (Next's "previous model" data cache — this app doesn't enable Cache
 * Components) so identical requests within the revalidation window are
 * served without a Postgres round-trip. Studio mutations invalidate these
 * via the matching `revalidateTag` calls in each action file.
 *
 * Gallery items are fetched per category, not all-at-once — this is what
 * lets a chapter's data be requested the moment it's chosen (see
 * `src/app/human/actions.ts`) instead of shipping every category's rows on
 * every /human load, and it's what keeps the payload bounded as the library
 * grows past today's ~40 items.
 */

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    return (data ?? []) as Category[];
  },
  ["human-categories"],
  { tags: ["categories"], revalidate: 60 },
);

export const getTracks = unstable_cache(
  async (): Promise<Track[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase.from("tracks").select("*").eq("status", "published").order("sort_order");
    return (data ?? []) as Track[];
  },
  ["human-tracks"],
  { tags: ["tracks"], revalidate: 60 },
);

/** `categorySlug` only shapes the cache tag name (for readable, targeted
 * invalidation) — the query itself filters by the real `categoryId`. */
export function getCategoryItems(categoryId: string, categorySlug: string): Promise<GalleryItem[]> {
  return unstable_cache(
    async (): Promise<GalleryItem[]> => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("gallery_items")
        .select("id, category_id, title, caption, alt_text, asset_id, sort_order, status, meta, assets(path, width, height)")
        .eq("category_id", categoryId)
        .eq("status", "published")
        .order("sort_order");
      return (data ?? []) as unknown as GalleryItem[];
    },
    ["human-category-items", categoryId],
    { tags: ["gallery-items", `gallery:${categorySlug}`], revalidate: 60 },
  )();
}
