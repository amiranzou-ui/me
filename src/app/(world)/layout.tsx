import { getWorldContent } from "@/lib/world/content";
import { WorldShell } from "@/world/ui/WorldShell";

/**
 * Every public place shares this layout, so the world shell — and the one
 * WebGL canvas inside it — mounts once per visit. Navigating between
 * stations re-renders only the page below (the station's document); the
 * renderer never remounts. The Studio lives outside this group.
 */
export default async function WorldLayout({ children }: { children: React.ReactNode }) {
  const content = await getWorldContent();
  return <WorldShell content={content}>{children}</WorldShell>;
}
