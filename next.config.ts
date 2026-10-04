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
  // The flat site's URLs keep working: each now opens its station in the
  // world (design doc §16, §29).
  async redirects() {
    return [
      { source: "/matrix", destination: "/desk", permanent: true },
      { source: "/human", destination: "/archive", permanent: true },
      { source: "/project/:slug", destination: "/work/:slug", permanent: true },
      { source: "/intro", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
