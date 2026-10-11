import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/metadata";

/**
 * Everything is public. Search results are marked noindex on the page itself (crawlers must be
 * allowed in to read that), so only the assistant's streaming endpoint is off limits.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/assistant/ask" },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
