import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { CvMeta, Experience, MatrixNode, Project, SkillsGroup } from "@/lib/matrix/types";

/**
 * Cached public reads shared by `/`, `/matrix`, and `/project/[slug]` — see
 * `src/lib/human/data.ts` for the caching rationale. `cv_meta` is fetched
 * once here (with its asset join) and reused by both `/` and `/matrix`
 * instead of two separate queries for the same singleton row.
 */

export const getCvMeta = unstable_cache(
  async (): Promise<(CvMeta & { assets: { path: string } | null }) | null> => {
    const supabase = createPublicClient();
    const { data } = await supabase.from("cv_meta").select("*, assets(path)").eq("id", 1).single();
    return data as (CvMeta & { assets: { path: string } | null }) | null;
  },
  ["matrix-cv-meta"],
  { tags: ["cv-meta"], revalidate: 60 },
);

export const getPublishedProjects = unstable_cache(
  async (): Promise<Project[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase.from("projects").select("*").eq("status", "published").order("sort_order");
    return (data ?? []) as Project[];
  },
  ["matrix-projects"],
  { tags: ["projects"], revalidate: 60 },
);

export const getExperience = unstable_cache(
  async (): Promise<Experience[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase.from("experience").select("*").order("sort_order");
    return (data ?? []) as Experience[];
  },
  ["matrix-experience"],
  { tags: ["experience"], revalidate: 60 },
);

export const getSkillsGroups = unstable_cache(
  async (): Promise<SkillsGroup[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase.from("skills_groups").select("*").order("sort_order");
    return (data ?? []) as SkillsGroup[];
  },
  ["matrix-skills-groups"],
  { tags: ["skills-groups"], revalidate: 60 },
);

export const getMatrixNodes = unstable_cache(
  async (): Promise<MatrixNode[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase.from("matrix_nodes").select("*").order("sort_order");
    return (data ?? []) as MatrixNode[];
  },
  ["matrix-nodes"],
  { tags: ["matrix-nodes"], revalidate: 60 },
);
