"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CvMeta } from "@/lib/matrix/types";

export async function saveCvMeta(data: CvMeta) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cv_meta")
    .update({
      name: data.name,
      tag: data.tag,
      bio: data.bio,
      contact: data.contact,
      links: data.links,
      summary: data.summary,
      core_skills: data.core_skills,
      signals: data.signals,
      education: data.education,
      languages: data.languages,
    })
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/matrix");
  return { ok: true };
}
