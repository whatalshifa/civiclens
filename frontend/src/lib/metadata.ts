import type { Metadata } from "next";

/**
 * The site's own address, for canonical links, the sitemap and link previews. Set SITE_URL in
 * production; on Vercel the project's production domain is used when it isn't set.
 */
export const SITE_URL =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const SITE_NAME = "CivicLens";

/** The link-preview card (public/og.png), in the brand: the bar, the notice strip and the statement. */
export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "CivicLens: 543 seats. One of them is yours. Find your MP and MLA, read the laws in plain words, and draft the letter to send.",
};

/**
 * A page's title and description, repeated for link previews (Open Graph and X), with its
 * canonical address. Next doesn't carry a page's own title into og:title, so every page goes
 * through here rather than sharing the home page's preview.
 */
export function pageMetadata({
  title,
  description,
  path,
  absolute = false,
  noindex = false,
}: {
  title: string;
  description?: string;
  /** The canonical path. Leave it out for pages that shouldn't name one (search results). */
  path?: string;
  /** Use the title as it is, without " · CivicLens". */
  absolute?: boolean;
  noindex?: boolean;
}): Metadata {
  const fullTitle = absolute ? title : `${title} · ${SITE_NAME}`;
  return {
    title: absolute ? { absolute: title } : title,
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_IN",
      title: fullTitle,
      description,
      ...(path ? { url: path } : {}),
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [OG_IMAGE.url] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
