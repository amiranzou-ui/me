/**
 * The building's past, taken from the project's own git history. Shown in
 * the Deep Archive and on the Unfinished Floor's corkboard. Nothing here is
 * invented: every date and draft is a real commit.
 */
export const LOGBOOK: { date: string; text: string }[] = [
  { date: "25 Apr 2026", text: "First version: a static HTML site, split in two." },
  { date: "23 Jun 2026", text: "Placeholder CV replaced with the real one." },
  { date: "23–24 Jun 2026", text: "Four homepage redesigns tried; all reverted to the split." },
  { date: "24 Jun 2026", text: "The landing page becomes a living world: dust, divider, glitch." },
  { date: "25 Jun 2026", text: "The Memory Archive: the elevator, the friend gate." },
  { date: "10 Jul 2026", text: "Rebuilt on Next.js and Supabase. The Studio opens." },
  { date: "15 Jul 2026", text: "The Mind subsystem is cut before it is built." },
  { date: "16 Jul 2026", text: "Cutover to ameerstudio.site. The old site is removed." },
  { date: "16 Jul 2026", text: "The Studio's dark workshop identity, first pass." },
  { date: "Oct 2026", text: "The building: one world on the seam between day and night." },
];

export const REJECTED: { title: string; date: string }[] = [
  { title: "Art deco city skyline", date: "23 Jun 2026" },
  { title: "Archive editorial homepage", date: "24 Jun 2026" },
  { title: "Retro soul homepage", date: "24 Jun 2026" },
  { title: "Retro anime homepage", date: "24 Jun 2026" },
  { title: "Ghost imagery layer", date: "25 Jun 2026" },
  { title: "Atmosphere photo layers", date: "16 Jul 2026" },
];

export const RETIRED: string[] = [
  "your memory here",
  "Unknown Artist",
  "more — eventually",
  "4+  ·  3  ·  50+",
  "the Mind arrives in a later phase",
];
