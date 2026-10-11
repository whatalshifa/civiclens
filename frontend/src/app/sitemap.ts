import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/metadata";

// The landing page first, then the service's home (/services), its main pages and the eight laws in
// the library (app/data/laws). Seat and PIN code pages are reached from these; listing them would
// need the API at build time.
const PATHS = [
  "/",
  "/services",
  "/seats",
  "/laws",
  ...[
    "constitution",
    "rti-act-2005",
    "consumer-protection-act-2019",
    "bns-2023",
    "bnss-2023",
    "bsa-2023",
    "rte-act-2009",
    "dv-act-2005",
  ].map((act) => `/laws/${act}`),
  "/laws/old-to-new",
  "/assistant",
  "/accuracy",
  "/letters",
  "/rti",
  "/rti/appeal",
  "/letters/consumer",
  "/letters/police",
  "/data",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({ url: new URL(path, SITE_URL).toString(), priority: path === "/" ? 1 : 0.7 }));
}
