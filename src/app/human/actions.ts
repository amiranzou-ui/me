"use server";

import { getCategoryItems } from "@/lib/human/data";
import type { GalleryItem } from "@/lib/human/types";

/**
 * Called at "destination intent" time — when a visitor hovers/selects a
 * chapter in the ArchiveHall, not when the elevator animation finishes —
 * so the ~4-5s elevator ride is spent fetching data and warming images
 * instead of the visitor waiting for them after arrival. See
 * `useArchive.ts`'s `ensureCategoryData`.
 */
export async function fetchCategoryItems(categoryId: string, categorySlug: string): Promise<GalleryItem[]> {
  return getCategoryItems(categoryId, categorySlug);
}
