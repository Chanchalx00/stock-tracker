import type { MetadataRoute } from "next";
import { siteConfig } from "@/app/config/site";

// Almost everything past sign-in is user-specific (dashboard, watchlist,
// portfolio, alerts, charts, news) — nothing there is worth a crawler's
// time, and an anonymous request just bounces to /login anyway. Only the
// public entry points are worth indexing.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/login", "/signup", "/forgot-password", "/privacy", "/terms"],
      disallow: ["/dashboard", "/watchlist", "/portfolio", "/alerts", "/charts", "/news", "/reset-password"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
