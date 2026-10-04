import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { getCvMeta, getPublishedProjects, getExperience, getSkillsGroups, getMatrixNodes } from "@/lib/matrix/data";
import { getCategories, getTracks } from "@/lib/human/data";
import type { CvMeta } from "@/lib/matrix/types";
import type {
  Img,
  RoomKit,
  WorldCategory,
  WorldContent,
  WorldExperience,
  WorldItem,
  WorldProject,
} from "@/world/content";

/**
 * Builds the world's content from the same tables the Studio edits. Every
 * read goes through the existing tag-cached getters (or new ones tagged the
 * same way), so a Studio save reaches the world exactly as it reaches the
 * current pages. Fields added by migration 0006 are optional: when the
 * migration hasn't run, values are derived instead (years from experience
 * date labels, room kits from slugs).
 */

type Row = Record<string, unknown>;

const ROOM_BY_SLUG: Record<string, RoomKit> = {
  photography: "gallery",
  posters: "stair",
  patterns: "pattern",
  graphics: "pattern",
  music: "listening",
  cooking: "kitchen",
  food: "kitchen",
  "3d": "unfinished",
};

function roomFor(slug: string, kind: string, explicit: unknown): RoomKit {
  if (typeof explicit === "string" && explicit) return explicit as RoomKit;
  if (ROOM_BY_SLUG[slug]) return ROOM_BY_SLUG[slug];
  if (kind === "music") return "listening";
  if (kind === "placeholder") return "unfinished";
  return "gallery";
}

function yearsFrom(label: string, nowYear: number): [number | null, number | null] {
  const years = (label.match(/\d{4}/g) ?? []).map(Number);
  const present = /present|now|current/i.test(label);
  const start = years[0] ?? null;
  const end = present ? nowYear : (years[years.length - 1] ?? start);
  return [start, end];
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const firstWord = (s: string) => norm(s.split(/[\s–—-]+/)[0] ?? "");

function toImg(a: unknown, alt?: string | null): Img | null {
  if (!a || typeof a !== "object") return null;
  const r = a as Row;
  if (typeof r.path !== "string") return null;
  return { path: r.path, width: Number(r.width) || 1200, height: Number(r.height) || 900, alt: alt ?? null };
}

const getProjectExtras = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data: projects } = await supabase
      .from("projects")
      .select("id, slug, cover_asset_id")
      .eq("status", "published");
    const coverIds = (projects ?? []).map((p) => p.cover_asset_id).filter(Boolean) as string[];
    const covers: Record<string, Img> = {};
    if (coverIds.length) {
      const { data } = await supabase.from("assets").select("id, path, width, height").in("id", coverIds);
      for (const a of data ?? []) {
        const img = toImg(a);
        if (img) covers[a.id as string] = img;
      }
    }
    // project_media only exists after migration 0006; absent table = no media.
    const { data: media, error: mediaErr } = await supabase
      .from("project_media")
      .select("id, project_id, kind, caption, weight, sort_order, assets(path, width, height)")
      .order("sort_order");
    const { data: relations } = await supabase
      .from("content_relations")
      .select("from_id, to_type, to_id, relation_label")
      .eq("from_type", "project")
      .order("sort_order");
    return {
      coverByProject: Object.fromEntries(
        (projects ?? []).map((p) => [p.id as string, p.cover_asset_id ? (covers[p.cover_asset_id as string] ?? null) : null]),
      ) as Record<string, Img | null>,
      media: mediaErr ? [] : ((media ?? []) as Row[]),
      relations: (relations ?? []) as Row[],
    };
  },
  ["world-project-extras"],
  { tags: ["projects"], revalidate: 60 },
);

/** Public items for one category: published, not friends-only. */
function getPublicItems(categoryId: string, slug: string) {
  return unstable_cache(
    async (): Promise<Row[]> => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("gallery_items")
        .select("*, assets(path, width, height)")
        .eq("category_id", categoryId)
        .eq("status", "published")
        .order("sort_order");
      return ((data ?? []) as Row[]).filter((r) => r.friends_only !== true);
    },
    ["world-items", categoryId],
    { tags: ["gallery-items", `gallery:${slug}`], revalidate: 60 },
  )();
}

export function toWorldItem(r: Row): WorldItem {
  const meta = (r.meta ?? {}) as Row;
  return {
    id: r.id as string,
    title: (r.title as string) ?? null,
    caption: (r.caption as string) ?? null,
    alt: (r.alt_text as string) ?? null,
    img: toImg(r.assets, r.alt_text as string),
    hover: (meta.hover_caption as string) ?? null,
    text: Array.isArray(meta.text) ? (meta.text as string[]) : [],
    weight: Number(r.weight) || 1,
    createdAt: (r.created_at as string) ?? null,
    modelPath: (meta.model_path as string) ?? null,
  };
}

export async function getWorldContent(): Promise<WorldContent> {
  const nowYear = new Date().getFullYear();
  const [cvRaw, projectsRaw, experienceRaw, skills, nodes, categoriesRaw, tracks, extras] = await Promise.all([
    getCvMeta(),
    getPublishedProjects(),
    getExperience(),
    getSkillsGroups(),
    getMatrixNodes(),
    getCategories(),
    getTracks(),
    getProjectExtras(),
  ]);

  const cv = cvRaw as (CvMeta & { assets: { path: string; width?: number; height?: number } | null }) | null;

  const experience: WorldExperience[] = (experienceRaw as unknown as Row[]).map((e, i) => {
    const [ys, ye] = yearsFrom(String(e.date_label ?? ""), nowYear);
    return {
      id: String(e.id ?? i),
      role: String(e.role ?? ""),
      company: String(e.company ?? ""),
      dateLabel: String(e.date_label ?? ""),
      points: (e.points as string[]) ?? [],
      yearStart: ys,
      yearEnd: ye,
    };
  });

  const projects: WorldProject[] = (projectsRaw as unknown as Row[]).map((p) => {
    const title = String(p.title ?? "");
    const job =
      experience.find((e) => e.id === p.experience_id) ??
      experience.find((e) => firstWord(e.company).length >= 3 && firstWord(e.company) === firstWord(title));
    const isThisSite = p.external_url === "/" || /portfolio|website/i.test(String(p.slug));
    const yearStart = (p.year_start as number) ?? job?.yearStart ?? (isThisSite ? nowYear : null);
    const yearEnd = (p.year_end as number) ?? job?.yearEnd ?? (isThisSite ? nowYear : yearStart);
    const relations = extras.relations.filter((r) => r.from_id === p.id);
    return {
      id: String(p.id),
      slug: String(p.slug),
      title,
      role: String(p.role ?? ""),
      description: String(p.description ?? ""),
      impact: String(p.impact ?? ""),
      stack: (p.stack as string[]) ?? [],
      behanceUrl: (p.behance_url as string) || null,
      externalUrl: (p.external_url as string) || null,
      cover: extras.coverByProject[String(p.id)] ?? null,
      media: extras.media
        .filter((m) => m.project_id === p.id)
        .map((m) => ({
          id: String(m.id),
          img: toImg(m.assets) as Img,
          caption: (m.caption as string) ?? null,
          weight: Number(m.weight) || 1,
          kind: String(m.kind ?? "image"),
        }))
        .filter((m) => m.img),
      yearStart,
      yearEnd,
      employer: job ? job.company : isThisSite ? "This website" : null,
      bay: ((p.bay_size as string) || "standard") as WorldProject["bay"],
      accent: (p.accent as string) || null,
      related: relations.map((r) => ({
        type: r.to_type as WorldProject["related"][number]["type"],
        id: String(r.to_id),
        label: (r.relation_label as string) ?? null,
        title: "",
      })),
    };
  });

  // Resolve relation titles from content we already hold.
  const categories: WorldCategory[] = (categoriesRaw as unknown as Row[]).map((c) => ({
    id: String(c.id),
    slug: String(c.slug),
    label: String(c.label),
    roman: String(c.roman ?? ""),
    tagline: String(c.tagline ?? ""),
    kind: c.kind as WorldCategory["kind"],
    locked: Boolean(c.is_locked),
    floor: Number(c.sort_order ?? 0) + 1,
    room: roomFor(String(c.slug), String(c.kind), c.room),
  }));

  const items: Record<string, WorldItem[]> = {};
  await Promise.all(
    categories
      .filter((c) => c.kind === "gallery" || c.kind === "placeholder")
      .filter((c) => !c.locked)
      .map(async (c) => {
        items[c.slug] = (await getPublicItems(c.id, c.slug)).map(toWorldItem);
      }),
  );

  for (const p of projects) {
    for (const r of p.related) {
      if (r.type === "project") {
        const q = projects.find((x) => x.id === r.id);
        if (q) Object.assign(r, { title: q.title, slug: q.slug });
      } else if (r.type === "track") {
        const t = tracks.find((x) => x.id === r.id);
        if (t) r.title = t.title;
      } else {
        for (const [slug, list] of Object.entries(items)) {
          const it = list.find((x) => x.id === r.id);
          if (it) Object.assign(r, { title: it.caption ?? "Untitled", category: slug });
        }
      }
    }
    p.related = p.related.filter((r) => r.title);
  }

  return {
    cv: {
      name: cv?.name ?? "Abdulameer Albutaihi",
      tag: cv?.tag ?? "",
      bio: cv?.bio ?? "",
      summary: cv?.summary ?? "",
      contact: cv?.contact ?? { email: "", phone: "", location: "" },
      links: cv?.links ?? [],
      signals: cv?.signals ?? [],
      education: cv?.education ?? [],
      languages: cv?.languages ?? [],
      currentlyLabel: cv?.currently_label ?? "",
      currentlyValue: cv?.currently_value ?? "",
      matrixSideDesc: cv?.matrix_side_desc ?? [],
      humanSideDesc: cv?.human_side_desc ?? [],
      portrait: cv?.assets
        ? { path: cv.assets.path, width: cv.assets.width ?? 1000, height: cv.assets.height ?? 1000 }
        : { path: "/images/profile.JPG", width: 1179, height: 2096 },
    },
    projects,
    experience,
    skills: skills.map((s) => ({ group: s.group_name, tags: s.tags })),
    nodes: nodes.map((n) => ({
      key: n.node_key,
      type: n.type,
      x: Number(n.x),
      y: Number(n.y),
      title: n.title,
      summary: n.summary,
      connections: n.connections ?? [],
      thinking: n.thinking ?? [],
    })),
    categories,
    items,
    tracks: tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      year: t.year,
      mood: t.mood ?? [],
      fragment: t.fragment,
      room: t.room,
      note: t.note,
      path: t.storage_path,
    })),
    nowYear,
  };
}
