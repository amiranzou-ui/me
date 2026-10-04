import type { MetadataRoute } from "next";
import { getWorldContent } from "@/lib/world/content";
import { buildWorld } from "@/world/stations";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ameerstudio.site";

/** Every public station from the registry — the same list that drives the
 * world's URLs. Reads through the cached public content (no cookies), so
 * the sitemap is static/ISR like the pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const world = buildWorld(await getWorldContent());
  return world.stations
    .filter((s) => s.access === "public")
    .map((s) => ({
      url: `${BASE_URL}${s.path === "/" ? "" : s.path}`,
      changeFrequency: s.projectSlug || s.categorySlug ? "monthly" : "weekly",
      priority: s.path === "/" ? 1 : s.projectSlug ? 0.8 : 0.6,
    }));
}
