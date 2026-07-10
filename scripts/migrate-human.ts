/**
 * One-off migration: legacy Human-side content (categories, galleries,
 * cooking moments, music tracks) → Supabase, uploading real media files to
 * Storage. Idempotent-ish: re-running re-uploads (upsert) but will create
 * duplicate gallery_items/tracks rows if run twice — intended for one run
 * against a fresh project.
 *
 * Canonical category data taken from legacy/js/archive.js's CHAPTERS array,
 * cross-checked against human.html and human-memory.js's TAGLINES — all
 * three agreed, no reconciliation conflicts found.
 *
 * Run with: node --env-file=.env.local -r tsx/cjs scripts/migrate-human.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import sizeOf from "image-size";
import sharp from "sharp";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const LEGACY = join(__dirname, "..", "legacy");
const BUCKET = "media";

type CategorySeed = {
  slug: string;
  label: string;
  roman: string;
  tagline: string;
  kind: "gallery" | "music" | "placeholder";
  is_locked: boolean;
  sort_order: number;
};

const CATEGORIES: CategorySeed[] = [
  { slug: "photography", label: "Photography", roman: "I", tagline: "to remember. because some things are too beautiful to just walk past.", kind: "gallery", is_locked: true, sort_order: 0 },
  { slug: "posters", label: "Posters", roman: "II", tagline: "life taught me something. I made a poster about it.", kind: "gallery", is_locked: false, sort_order: 1 },
  { slug: "patterns", label: "Graphics", roman: "III", tagline: "this is what I do. grids, shapes, and making things feel right.", kind: "gallery", is_locked: false, sort_order: 2 },
  { slug: "music", label: "Music", roman: "IV", tagline: "what I had on repeat. the songs that stayed.", kind: "music", is_locked: false, sort_order: 3 },
  { slug: "cooking", label: "Food Decisions", roman: "V", tagline: "things i made. things i felt.", kind: "gallery", is_locked: true, sort_order: 4 },
  { slug: "3d", label: "3D", roman: "VI", tagline: "geometry and I are still figuring each other out.", kind: "placeholder", is_locked: false, sort_order: 5 },
];

const PHOTOGRAPHY = [
  { file: "photo1.jpg", caption: "the light was doing something. I stopped." },
  { file: "photo2.png", caption: "golden hour in baghdad — doesn't last long." },
  { file: "photo3.png", caption: "almost walked past this." },
  { file: "photo4.png", caption: "11:40 pm. still warm outside." },
];

const POSTERS = [
  { file: "poster1.jpg", caption: "made this at 2 am. stayed up for it." },
  { file: "poster2.png", caption: "life taught me this one specifically." },
  { file: "poster3.png", caption: "went through 14 versions. this one felt right." },
];

const PATTERNS = [{ file: "pattern1.jpg", caption: "spent a whole afternoon on the grid spacing." }];

const COOKING = [
  { file: "1.png", hover: "يمكن اول مره اسوي شي بالمطبخ وحدي", text: ["وهذا الكلاص حرفيا حبيته وكالعادة هيجي نهايات ويه الاشياء الأحبها "] },
  { file: "2.png", hover: "واهنا حسيت سويت ماعون بسعر $69", text: ["طبعا سويته واني عايد مادة مرتين ورسبت بيها (حسيت نفسي غبي بشكل مخيف)"] },
  { file: "3.png", hover: "الطعم يجنن صراحه ", text: ["بس عرفت ليش نحتاج female touch "] },
  { file: "4.png", hover: "واهنا عرفت لازم ابدي اصور اكثر ", text: ["..."] },
  { file: "5.png", hover: "the pic changes when ur friend is black and white", text: ["but i still feel like the same idiot who can only make 2 dishes and burns everything"] },
  { file: "6.png", hover: "and here i was really proud of myself for making something that looks like the original recipe", text: ["but it tasted like garbage and i had to throw it away after one bite"] },
  { file: "7.png", hover: "its not even that bad but it just looks so sad and pathetic and i cant even look at it without feeling like a failure", text: ["i just want to be good at something and cooking is supposed to be fun but it just makes me feel like a useless piece of trash who cant even boil water without burning it"] },
];

const TRACKS = [
  {
    file: "in-the-mood-to-love.m4a",
    title: "In the Mood to Love",
    artist: "Unknown Artist",
    year: "Archive 01",
    mood: ["arabic", "quiet", "jazz"],
    fragment: "your memory here",
    side: "Side A",
    room: "Listening Room",
    note: "A note kept warm in the dark. Needle down. Lamp low. Let the room remember before you do.",
  },
  {
    file: "what-falling-in-love-feels-like.m4a",
    title: "What Falling in Love Feels Like",
    artist: "Unknown Artist",
    year: "Archive 02",
    mood: ["quiet", "english"],
    fragment: "what falling in love feels like",
    side: "Side B",
    room: "Listening Room",
    note: "A softer room. A slower heartbeat. The kind of song that changes the air around it.",
  },
];

function mimeFor(file: string) {
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".m4a")) return "audio/mp4";
  return "application/octet-stream";
}

async function uploadAsset(storagePath: string, buffer: Buffer, mime: string) {
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: mime,
    upsert: true,
  });
  if (error) throw error;
}

async function insertImageAsset(storagePath: string, buffer: Buffer, mime: string) {
  const dims = sizeOf(buffer);
  const { data, error } = await supabase
    .from("assets")
    .insert({
      bucket: BUCKET,
      path: storagePath,
      width: dims.width,
      height: dims.height,
      mime,
      size_bytes: buffer.byteLength,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function main() {
  console.log("Upserting categories...");
  const categoryIds: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const { data, error } = await supabase
      .from("categories")
      .upsert(
        {
          slug: c.slug,
          label: c.label,
          roman: c.roman,
          tagline: c.tagline,
          kind: c.kind,
          is_locked: c.is_locked,
          sort_order: c.sort_order,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (error) throw error;
    categoryIds[c.slug] = data.id;
  }

  console.log("Uploading photography...");
  for (const [i, p] of PHOTOGRAPHY.entries()) {
    const buf = readFileSync(join(LEGACY, "images", p.file));
    const path = `gallery/photography/${p.file}`;
    await uploadAsset(path, buf, mimeFor(p.file));
    const assetId = await insertImageAsset(path, buf, mimeFor(p.file));
    const { error } = await supabase.from("gallery_items").insert({
      category_id: categoryIds.photography,
      caption: p.caption,
      asset_id: assetId,
      sort_order: i,
      status: "published",
    });
    if (error) throw error;
  }

  console.log("Uploading posters...");
  for (const [i, p] of POSTERS.entries()) {
    const buf = readFileSync(join(LEGACY, "images", p.file));
    const path = `gallery/posters/${p.file}`;
    await uploadAsset(path, buf, mimeFor(p.file));
    const assetId = await insertImageAsset(path, buf, mimeFor(p.file));
    const { error } = await supabase.from("gallery_items").insert({
      category_id: categoryIds.posters,
      caption: p.caption,
      asset_id: assetId,
      sort_order: i,
      status: "published",
    });
    if (error) throw error;
  }

  console.log("Uploading patterns...");
  for (const [i, p] of PATTERNS.entries()) {
    const buf = readFileSync(join(LEGACY, "images", p.file));
    const path = `gallery/patterns/${p.file}`;
    await uploadAsset(path, buf, mimeFor(p.file));
    const assetId = await insertImageAsset(path, buf, mimeFor(p.file));
    const { error } = await supabase.from("gallery_items").insert({
      category_id: categoryIds.patterns,
      caption: p.caption,
      asset_id: assetId,
      sort_order: i,
      status: "published",
    });
    if (error) throw error;
  }

  console.log("Recompressing + uploading cooking moments...");
  for (const [i, m] of COOKING.entries()) {
    const original = readFileSync(join(LEGACY, "images", "cooking", m.file));
    const recompressed = await sharp(original)
      .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    const path = `gallery/cooking/${m.file.replace(".png", ".jpg")}`;
    await uploadAsset(path, recompressed, "image/jpeg");
    const assetId = await insertImageAsset(path, recompressed, "image/jpeg");
    const { error } = await supabase.from("gallery_items").insert({
      category_id: categoryIds.cooking,
      caption: m.hover,
      asset_id: assetId,
      sort_order: i,
      status: "published",
      meta: { hover_caption: m.hover, text: m.text },
    });
    if (error) throw error;
    console.log(`  ${m.file}: ${(original.byteLength / 1e6).toFixed(1)}MB -> ${(recompressed.byteLength / 1e6).toFixed(1)}MB`);
  }

  console.log("Uploading tracks...");
  for (const [i, t] of TRACKS.entries()) {
    const buf = readFileSync(join(LEGACY, "music", t.file));
    const path = `music/${t.file}`;
    await uploadAsset(path, buf, mimeFor(t.file));
    const { error } = await supabase.from("tracks").insert({
      title: t.title,
      artist: t.artist,
      year: null,
      mood: t.mood,
      fragment: t.fragment,
      side: t.side,
      room: t.room,
      note: t.note,
      storage_path: path,
      sort_order: i,
      status: "published",
    });
    if (error) throw error;
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
