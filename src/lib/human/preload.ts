import { preload } from "react-dom";
import { getImageProps } from "next/image";
import { mediaUrl, GALLERY_GRID_SIZES, GALLERY_GRID_QUALITY } from "@/lib/supabase/media";
import type { GalleryItem } from "@/lib/human/types";

/**
 * Warms the browser + Next Image Optimizer caches for a chapter's first
 * visible images the moment it's chosen (see useArchive's `enterChapter`),
 * so they're already cached by the time the elevator arrives and the
 * masonry mounts. Uses `next/image`'s own `getImageProps` to compute the
 * exact srcset the real grid `<Image>` will request, so the preload can't
 * drift out of sync with it.
 *
 * Bounded by viewport width (mirrors the masonry's 3/2/1-column
 * breakpoints in human.css) — deliberately not the whole chapter. Never a
 * dependency: any failure here is swallowed and the grid simply lazy-loads
 * normally, exactly as if no preload had happened.
 */
export function preloadGalleryImages(items: GalleryItem[]) {
  if (typeof window === "undefined") return;

  const width = window.innerWidth;
  const count = width <= 600 ? 3 : width <= 900 ? 4 : 6;

  for (const item of items.slice(0, count)) {
    if (!item.assets) continue;
    try {
      const { props } = getImageProps({
        src: mediaUrl(item.assets.path),
        alt: "",
        width: item.assets.width ?? 1200,
        height: item.assets.height ?? 900,
        sizes: GALLERY_GRID_SIZES,
        quality: GALLERY_GRID_QUALITY,
      });
      preload(props.src, {
        as: "image",
        imageSrcSet: props.srcSet,
        imageSizes: props.sizes,
        fetchPriority: "low",
      });
    } catch {
      /* preloading is an optimization, never a dependency */
    }
  }
}
