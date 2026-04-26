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
        destination: '/dashboard/admin?tab=users',
        permanent: true,
      },
      {
        source: '/dashboard/admin/management',
        destination: '/dashboard/admin?tab=users',
        permanent: true,
      },
      {
        source: '/dashboard/admin/users',
        destination: '/dashboard/admin?tab=users',
        permanent: true,
      }
    ];
  },
};

export default withSerwist(nextConfig);
