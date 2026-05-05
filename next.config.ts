import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {},
  async redirects() {
    return [
      {
        source: '/dashboard/admin/user-management',
        destination: '/dashboard/admin/users',
        permanent: false,
      },
      {
        source: '/dashboard/admin/management',
        destination: '/dashboard/admin/users',
        permanent: false,
      }
    ];
  },
};

export default withSerwist(nextConfig);
