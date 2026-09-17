import "@/styles/human.css";
import { getCategories, getTracks } from "@/lib/human/data";
import HumanApp from "@/components/human/HumanApp";

export const revalidate = 60;

export default async function HumanPage() {
  // Gallery items are intentionally NOT fetched here — each category's
  // items are fetched on demand (see human/actions.ts + useArchive's
  // ensureCategoryData) at the moment a chapter is chosen, not upfront for
  // every category on every /human load. Categories + tracks are cheap and
  // needed immediately for the ArchiveHall/sidebar/capsule shell.
  const [categories, tracks] = await Promise.all([getCategories(), getTracks()]);

  return <HumanApp categories={categories} tracks={tracks} />;
}
