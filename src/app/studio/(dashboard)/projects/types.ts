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
};
