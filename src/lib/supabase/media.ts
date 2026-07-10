const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/** Public URL for a path in the `media` Storage bucket. */
export function mediaUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}
