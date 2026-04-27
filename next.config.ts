import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/favicon.ico",
        destination: "/igon.png",
      },
    ];
  },
};

export default nextConfig;
