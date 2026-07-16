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
      profile_asset_id: data.profile_asset_id,
      currently_label: data.currently_label,
      currently_value: data.currently_value,
      matrix_side_desc: data.matrix_side_desc,
      human_side_desc: data.human_side_desc,
    })
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/matrix");
  revalidatePath("/");
  return { ok: true };
}
