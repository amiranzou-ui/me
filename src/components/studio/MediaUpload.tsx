"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createAsset, convertHeicIfNeeded } from "@/app/studio/(dashboard)/gallery/actions";

const HEIC_PATTERN = /heic|heif/i;

function readDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Uploads directly to Supabase Storage from the browser (as the
 * authenticated owner — see 0004_storage_policies.sql), then records the
 * asset row via a server action. Used by every "attach an image" field in
 * the Studio, per ARCHITECTURE.md's shared-media-widget design.
 */
export default function MediaUpload({
  pathPrefix,
  onUploaded,
}: {
  pathPrefix: string;
  onUploaded: (assetId: string, previewUrl: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const { width, height } = await readDimensions(file);
      const path = `${pathPrefix}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage.from("media").upload(path, file, {
        contentType: file.type,
        upsert: false,
        // Paths are timestamped and never overwritten, so it's safe to
        // cache aggressively — repeat gallery visits reuse the same bytes.
        cacheControl: "31536000",
      });
      if (uploadError) throw uploadError;

      const res = await createAsset({
        bucket: "media",
        path,
        width,
        height,
        mime: file.type,
        size_bytes: file.size,
      });
      if ("error" in res) throw new Error(res.error);

      let finalPath = path;
      if (HEIC_PATTERN.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
        const conv = await convertHeicIfNeeded(res.id!);
        if ("error" in conv && conv.error) {
          setError(`Uploaded, but couldn't auto-convert for web display: ${conv.error}`);
        } else if (conv.converted) {
          finalPath = conv.path;
        }
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(finalPath);
      onUploaded(res.id!, publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label className="cursor-pointer border border-tan px-4 py-2 text-xs uppercase tracking-wider text-brown hover:border-accent hover:text-accent">
        {uploading ? "Uploading…" : "Upload image"}
        <input
          type="file"
          accept="image/*"
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
