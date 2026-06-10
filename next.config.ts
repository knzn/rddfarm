import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tiknok-media.sgp1.cdn.digitaloceanspaces.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "sgp1.digitaloceanspaces.com",
        pathname: "/tiknok-media/**",
      },
    ],
  },
};

export default nextConfig;
