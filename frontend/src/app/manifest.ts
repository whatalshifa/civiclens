import type { MetadataRoute } from "next";

/** Lets a phone add CivicLens to its home screen with the emblem, in the bar's dark teal. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CivicLens: know who represents you and what your rights are",
    short_name: "CivicLens",
    description:
      "Find your MP and MLA, read the laws that protect you in plain language, and draft the letter to send. Nonpartisan, with a source for every fact.",
    start_url: "/services",
    scope: "/",
    display: "standalone",
    background_color: "#f3f5f4",
    theme_color: "#0b3a36",
    lang: "en-IN",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/icon-192.png", type: "image/png", sizes: "192x192", purpose: "any" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512", purpose: "any" },
      { src: "/icon-maskable-512.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
    ],
  };
}
