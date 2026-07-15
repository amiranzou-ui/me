import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/supabase/media";

export const revalidate = 60;

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  role: string | null;
  description: string | null;
  impact: string | null;
  stack: string[];
  behance_url: string | null;
  external_url: string | null;
};

type RelatedGalleryItem = { type: "gallery_item"; label: string | null; caption: string | null; assetPath: string | null };
type RelatedTrack = { type: "track"; label: string | null; title: string; artist: string | null };
type RelatedProject = { type: "project"; label: string | null; slug: string; title: string; role: string | null };
type RelatedEntry = RelatedGalleryItem | RelatedTrack | RelatedProject;

async function getProject(slug: string): Promise<ProjectRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, slug, title, role, description, impact, stack, behance_url, external_url")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return (data as ProjectRow) ?? null;
}

async function getRelated(projectId: string): Promise<RelatedEntry[]> {
  const supabase = await createClient();
  const { data: relations } = await supabase
    .from("content_relations")
    .select("to_type, to_id, relation_label")
    .eq("from_type", "project")
    .eq("from_id", projectId)
    .order("sort_order");

  const resolved = await Promise.all(
    (relations ?? []).map(async (r): Promise<RelatedEntry | null> => {
      if (r.to_type === "gallery_item") {
        const { data } = await supabase
          .from("gallery_items")
          .select("caption, status, assets(path)")
          .eq("id", r.to_id)
          .eq("status", "published")
          .single();
        if (!data) return null;
        const asset = data.assets as unknown as { path: string } | null;
        return { type: "gallery_item", label: r.relation_label, caption: data.caption, assetPath: asset?.path ?? null };
      }
      if (r.to_type === "track") {
        const { data } = await supabase
          .from("tracks")
          .select("title, artist, status")
          .eq("id", r.to_id)
          .eq("status", "published")
          .single();
        if (!data) return null;
        return { type: "track", label: r.relation_label, title: data.title, artist: data.artist };
      }
      if (r.to_type === "project") {
        const { data } = await supabase
          .from("projects")
          .select("slug, title, role, status")
          .eq("id", r.to_id)
          .eq("status", "published")
          .single();
        if (!data) return null;
        return { type: "project", label: r.relation_label, slug: data.slug, title: data.title, role: data.role };
      }
      return null;
    }),
  );

  return resolved.filter((x): x is RelatedEntry => x !== null);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Project not found" };

  const description = project.description ?? project.role ?? undefined;
  return {
    title: `${project.title} — Ameer Al-Butaihi`,
    description,
    openGraph: {
      title: project.title,
      description,
      type: "article",
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const related = await getRelated(project.id);
  const externalHref = project.behance_url || project.external_url;

  return (
    <div className="min-h-dvh bg-cream px-6 py-16 md:px-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/matrix" className="font-sans text-xs uppercase tracking-widest text-brown hover:text-accent">
          ← Matrix
        </Link>

        {project.role && (
          <p className="mt-10 font-sans text-[11px] uppercase tracking-widest text-brown">{project.role}</p>
        )}
        <h1 className="mt-2 font-serif text-4xl italic text-ink md:text-5xl">{project.title}</h1>

        {project.description && (
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink">{project.description}</p>
        )}
        {project.impact && (
          <p className="mt-4 max-w-xl font-serif text-sm italic leading-relaxed text-brown">{project.impact}</p>
        )}

        {project.stack.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {project.stack.map((s) => (
              <span key={s} className="border border-tan px-2.5 py-1 font-sans text-[10px] uppercase tracking-wider text-brown">
                {s}
              </span>
            ))}
          </div>
        )}

        {externalHref && (
          <a
            href={externalHref}
            target="_blank"
            rel="noopener"
            className="mt-8 inline-block font-serif text-sm italic text-brown hover:text-accent"
          >
            {project.behance_url ? "View on Behance →" : "View project →"}
          </a>
        )}

        {related.length > 0 && (
          <div className="mt-16 border-t border-tan pt-10">
            <h2 className="font-serif text-xl italic text-ink mb-6">Related</h2>
            <div className="flex flex-col gap-3">
              {related.map((r, i) => (
                <div key={i} className="flex items-center gap-4 border border-tan p-3">
                  {r.type === "gallery_item" && r.assetPath && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(r.assetPath)} alt="" className="h-16 w-16 flex-shrink-0 object-cover" />
                  )}
                  <div className="flex-1">
                    <p className="font-sans text-[10px] uppercase tracking-wider text-brown">
                      {r.type === "project" ? "Project" : r.type === "track" ? "Track" : "Photo"}
                    </p>
                    <p className="text-sm text-ink">
                      {r.type === "project" ? r.title : r.type === "track" ? `${r.title}${r.artist ? ` — ${r.artist}` : ""}` : (r.caption ?? "Untitled")}
                    </p>
                    {r.label && <p className="font-serif text-xs italic text-brown">{r.label}</p>}
                  </div>
                  {r.type === "project" && (
                    <Link href={`/project/${r.slug}`} className="font-sans text-xs uppercase tracking-wider text-brown hover:text-accent">
                      View →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
