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
  },
};

export default nextConfig;
