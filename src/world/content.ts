/**
 * The world's content model: everything the building displays, already
 * shaped for placement. Built on the server by `lib/world/content.ts` from
 * the same Supabase tables the Studio edits, and handed to the client once
 * per visit. Client-safe: no server imports here.
 */

export type Img = { path: string; width: number; height: number; alt?: string | null };

export type WorldProject = {
  id: string;
  slug: string;
  title: string;
  role: string;
  description: string;
  impact: string;
  stack: string[];
  behanceUrl: string | null;
  externalUrl: string | null;
  cover: Img | null;
  media: { id: string; img: Img; caption: string | null; weight: number; kind: string }[];
  yearStart: number | null;
  yearEnd: number | null;
  /** Employer name painted on the roof beam above the bay group. */
  employer: string | null;
  bay: "small" | "standard" | "large";
  accent: string | null;
  related: { type: "project" | "gallery_item" | "track"; id: string; label: string | null; title: string; slug?: string; category?: string }[];
};

export type WorldExperience = {
  id: string;
  role: string;
  company: string;
  dateLabel: string;
  points: string[];
  yearStart: number | null;
  yearEnd: number | null;
};

export type WorldNode = {
  key: string;
  type: "timeline" | "skill" | "project" | "thought";
  x: number;
  y: number;
  title: string;
  summary: string;
  connections: string[];
  thinking: { phase: string; text: string }[];
};

export type RoomKit = "gallery" | "stair" | "pattern" | "listening" | "kitchen" | "unfinished";

export type WorldCategory = {
  id: string;
  slug: string;
  label: string;
  roman: string;
  tagline: string;
  kind: "gallery" | "music" | "placeholder";
  locked: boolean;
  /** Tower floor number: 1 = floor I. */
  floor: number;
  room: RoomKit;
};

export type WorldItem = {
  id: string;
  title: string | null;
  caption: string | null;
  alt: string | null;
  img: Img | null;
  hover: string | null;
  text: string[];
  weight: number;
  createdAt: string | null;
  modelPath: string | null;
};

export type WorldTrack = {
  id: string;
  title: string;
  artist: string | null;
  year: string | null;
  mood: string[];
  fragment: string | null;
  room: string | null;
  note: string | null;
  path: string;
};

export type WorldCv = {
  name: string;
  tag: string;
  bio: string;
  summary: string;
  contact: { email: string; phone: string; location: string };
  links: { label: string; url: string; icon: string }[];
  signals: string[];
  education: { degree: string; school: string; date: string }[];
  languages: { lang: string; level: string }[];
  currentlyLabel: string;
  currentlyValue: string;
  matrixSideDesc: string[];
  humanSideDesc: string[];
  portrait: Img | null;
};

export type WorldContent = {
  cv: WorldCv;
  projects: WorldProject[];
  experience: WorldExperience[];
  skills: { group: string; tags: string[] }[];
  nodes: WorldNode[];
  categories: WorldCategory[];
  /** Public items per category slug. Locked categories are absent here. */
  items: Record<string, WorldItem[]>;
  tracks: WorldTrack[];
  nowYear: number;
};

export const SUPABASE_MEDIA_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/`;

export function mediaSrc(path: string) {
  return path.startsWith("/") || path.startsWith("http") ? path : SUPABASE_MEDIA_BASE + path;
}

/** A texture-sized derivative through Next's image optimizer (same origin,
 * so WebGL can use it without CORS). Widths must be in Next's allowed set. */
export function textureSrc(img: Img, width: 640 | 1080 | 2048, quality: 60 | 75 | 80 = 60) {
  const src = mediaSrc(img.path);
  if (src.startsWith("/world/")) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
