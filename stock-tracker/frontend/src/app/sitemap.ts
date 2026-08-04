import type { MetadataRoute } from "next";
import { siteConfig } from "@/app/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/login", "/signup", "/privacy", "/terms"];

  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
  }));
}
