import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {},
  async redirects() {
    return [
      {
        source: '/dashboard/admin/user-management',
        destination: '/dashboard/admin/users',
        permanent: true,
      },
      {
        source: '/dashboard/admin/managemnet',
        destination: '/dashboard/admin/users',
        permanent: true,
      }
    ];
  },
};

export default withSerwist(nextConfig);
