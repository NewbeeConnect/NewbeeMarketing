import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dwwkcfunctykemwsrkkr.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
  outputFileTracingIncludes: {
    "/api/stories/[storyId]/stitch": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
};

export default nextConfig;
