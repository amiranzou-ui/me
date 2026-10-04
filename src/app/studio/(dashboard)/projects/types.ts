export type StudioProject = {
  id?: string;
  slug: string;
  title: string;
  role: string;
  description: string;
  impact: string;
  stack: string[];
  behance_url: string | null;
  external_url: string | null;
  status: "draft" | "published" | "archived";
  sort_order: number;
  cover_asset_id?: string | null;
  // added by migration 0006 — absent until it runs
  year_start?: number | null;
  year_end?: number | null;
  bay_size?: "small" | "standard" | "large";
  accent?: string | null;
};

export type ProjectMedia = { id: string; asset_id: string; caption: string | null; weight: number; sort_order: number; path: string };
