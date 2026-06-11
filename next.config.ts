import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["sharp"],
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
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

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
})(nextConfig);
