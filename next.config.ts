import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serves media from Supabase Storage through Next's own image
    // optimizer (resize/WebP) rather than Supabase's paid transform API —
    // see ARCHITECTURE.md's media pipeline judgment call.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "illzrjmqllqxqnibzytu.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // 60: masonry/grid thumbnails, 75: Next's default, 80: lightbox/medium view.
    qualities: [60, 75, 80],
  },
};

export default nextConfig;
