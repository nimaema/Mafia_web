import type { MetadataRoute } from "next";
import { getConfiguredSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getConfiguredSiteUrl();
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/game-guide`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
