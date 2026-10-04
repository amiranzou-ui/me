"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { toWorldItem } from "@/lib/world/content";
import type { WorldItem } from "@/world/content";

/**
 * The friend word, checked on the server (design doc §11). It stays a soft
 * gate — no accounts — but the word is no longer shipped in the browser
 * bundle, and locked floors' content is only sent after it passes. Set
 * FRIEND_WORD in the environment to change it; the default is today's word.
 */

const COOKIE = "archive_friend";

function word() {
  return (process.env.FRIEND_WORD || "ameer.is.off").trim().toLowerCase();
}
function token() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "local";
  return createHash("sha256").update(`${word()}|${secret}`).digest("hex");
}

async function isFriend() {
  const c = (await cookies()).get(COOKIE)?.value;
  if (!c) return false;
  const a = Buffer.from(c);
  const b = Buffer.from(token());
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function enterAsFriend(attempt: string): Promise<{ ok: boolean; items?: Record<string, WorldItem[]> }> {
  if (attempt.trim().toLowerCase() !== word()) return { ok: false };
  (await cookies()).set(COOKIE, token(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return { ok: true, items: await lockedItems() };
}

export async function friendItems(): Promise<Record<string, WorldItem[]> | null> {
  if (!(await isFriend())) return null;
  return lockedItems();
}

async function lockedItems(): Promise<Record<string, WorldItem[]>> {
  const supabase = createAdminClient();
  const { data: cats } = await supabase.from("categories").select("id, slug, is_locked");
  const out: Record<string, WorldItem[]> = {};
  const locked = (cats ?? []).filter((c) => c.is_locked);
  for (const c of locked) {
    const { data } = await supabase
      .from("gallery_items")
      .select("*, assets(path, width, height)")
      .eq("category_id", c.id)
      .eq("status", "published")
      .order("sort_order");
    out[c.slug as string] = (data ?? []).map((r) => toWorldItem(r));
  }
  // friends-only prints (migration 0006) hang in the Darkroom
  const { data: dark, error } = await supabase
    .from("gallery_items")
    .select("*, assets(path, width, height)")
    .eq("friends_only", true)
    .eq("status", "published")
    .order("sort_order");
  out.darkroom = error ? [] : (dark ?? []).map((r) => toWorldItem(r));
  return out;
}
