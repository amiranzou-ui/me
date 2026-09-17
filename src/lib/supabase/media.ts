const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/** Public URL for a path in the `media` Storage bucket. */
export function mediaUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}

/** Shared between the masonry grid and its image-preload path so a
 * preloaded derivative always matches what the grid actually requests —
 * see `src/lib/human/preload.ts`. Tracks human.css's `.masonry` breakpoints
 * (3 / 2 / 1 columns). */
export const GALLERY_GRID_SIZES = "(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw";
export const GALLERY_GRID_QUALITY = 60;
