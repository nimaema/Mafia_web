import type { MetadataRoute } from "next";
import { getConfiguredSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getConfiguredSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/game-guide"],
        disallow: ["/api/", "/auth/", "/dashboard/", "/game/", "/join", "/lobby/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
