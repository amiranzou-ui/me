import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWorldContent } from "@/lib/world/content";
import { buildWorld } from "@/world/stations";
import { StationDocument } from "@/world/docs/Documents";

export const revalidate = 60;

/**
 * One route for every station. The registry decides which URLs exist;
 * this page renders the station's document — the "Read as page" version,
 * the accessibility path and what search engines read. The world draws the
 * same station around it.
 */
async function resolve(path: string[] | undefined) {
  const content = await getWorldContent();
  const world = buildWorld(content);
  const key = "/" + (path ?? []).map(decodeURIComponent).join("/");
  return { content, world, station: world.byPath[key === "/" ? "/" : key.replace(/\/$/, "")] };
}

export async function generateStaticParams() {
  const content = await getWorldContent();
  const world = buildWorld(content);
  return world.stations.map((s) => ({ path: s.path === "/" ? [] : s.path.slice(1).split("/") }));
}

export async function generateMetadata({ params }: { params: Promise<{ path?: string[] }> }): Promise<Metadata> {
  const { path } = await params;
  const { station, content } = await resolve(path);
  if (!station) return { title: "Not in the building" };
  const title = station.id === "approach" ? content.cv.name : `${station.label} — ${content.cv.name}`;
  const description = station.description.slice(0, 200);
  return {
    title,
    description,
    openGraph: { title, description, type: station.projectSlug ? "article" : "website" },
    robots: station.access === "hidden" ? { index: false } : undefined,
  };
}

export default async function StationPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  const { station, world, content } = await resolve(path);
  if (!station) notFound();
  return <StationDocument station={station} world={world} content={content} />;
}
