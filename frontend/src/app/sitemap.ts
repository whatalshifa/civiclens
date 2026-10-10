import type { MetadataRoute } from "next";

const SITE = process.env.SITE_URL ?? "http://localhost:3000";

// The landing page first, then the service's main pages. Seat, PIN code and law pages are reached
// from these.
const PATHS = [
  "/",
  "/services",
  "/seats",
  "/laws",
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
  return PATHS.map((path) => ({ url: new URL(path, SITE).toString(), priority: path === "/" ? 1 : 0.7 }));
}
