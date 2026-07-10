export type Category = {
  id: string;
  slug: string;
  label: string;
  roman: string;
  tagline: string;
  kind: "gallery" | "music" | "placeholder";
  is_locked: boolean;
  sort_order: number;
};

export type Asset = {
  id: string;
  bucket: string;
  path: string;
  width: number | null;
  height: number | null;
  mime: string | null;
};

export type GalleryItem = {
  id: string;
  category_id: string;
  title: string | null;
  caption: string | null;
  alt_text: string | null;
  asset_id: string | null;
  sort_order: number;
  meta: { hover_caption?: string; text?: string[] } | null;
  assets: Asset | null;
};

export type Track = {
  id: string;
  title: string;
  artist: string | null;
  year: string | null;
  mood: string[];
  fragment: string | null;
  side: string | null;
  room: string | null;
  note: string | null;
  storage_path: string;
  sort_order: number;
};
