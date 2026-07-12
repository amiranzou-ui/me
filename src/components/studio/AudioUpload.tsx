"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Audio-specific counterpart to MediaUpload — tracks store a bare
 * storage_path (no assets/dimensions row), so this just uploads and hands
 * back the path + a preview URL for the staging step in TracksManager.
 */
export default function AudioUpload({
  pathPrefix,
  onUploaded,
}: {
  pathPrefix: string;
  onUploaded: (path: string, previewUrl: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const path = `${pathPrefix}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage.from("media").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(path);
      onUploaded(path, publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label className="cursor-pointer border border-tan px-4 py-2 text-xs uppercase tracking-wider text-brown hover:border-accent hover:text-accent">
        {uploading ? "Uploading…" : "Upload audio"}
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </label>
      {error && <span className="text-xs text-accent">{error}</span>}
    </div>
  );
}
