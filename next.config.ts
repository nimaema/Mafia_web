import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Render.com deployment
  output: "standalone",

  // Silence Turbopack webpack config warning
  turbopack: {},

  // Allow images from OAuth providers
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  poweredByHeader: false,
};

// Wrap with Serwist PWA — disabled in dev (not compatible with Turbopack)
const withSerwist =
  process.env.NODE_ENV === "production"
    ? require("@serwist/next").default({
        swSrc: "src/sw.ts",
        swDest: "public/sw.js",
        cacheOnNavigation: true,
        reloadOnOnline: true,
        disable: process.env.NODE_ENV !== "production",
      })
    : (config: NextConfig) => config;

export default withSerwist(nextConfig);
