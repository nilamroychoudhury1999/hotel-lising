import { getStore } from "@netlify/blobs";
import { PUBLIC_HOMESTAY_LISTINGS } from "../../src/data/publicHomestays.mjs";
import { GENERATED_STATIC_SEO_GUIDES } from "../../src/data/staticSeoGuides.mjs";

const BASE_URL = "https://homavia.in";
const STORE_NAME = "seo-content";
const INDEX_KEY = "_index";

const staticPages = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
  { path: "/premium", changefreq: "weekly", priority: "0.8" },
  { path: "/india-travel", changefreq: "weekly", priority: "0.9" },
  { path: "/pool-homestays", changefreq: "weekly", priority: "0.9" },
  { path: "/travel-guides", changefreq: "weekly", priority: "0.8" },
  { path: "/bike-rental", changefreq: "weekly", priority: "0.8" },
  { path: "/car-rental", changefreq: "weekly", priority: "0.8" },
  { path: "/property-sale", changefreq: "weekly", priority: "0.8" }
];

const staticGuides = [
  {
    slug: "hotel-takeoff-heaven-near-guwahati-airport-stay-guide",
    updatedAt: "2026-06-08T00:00:00+05:30"
  },
  {
    slug: "takeoff-heaven-1bhk-guwahati-airport-family-couple-guide",
    updatedAt: "2026-06-08T00:00:00+05:30"
  },
  {
    slug: "guwahati-airport-hotel-booking-checklist-takeoff-heaven",
    updatedAt: "2026-06-08T00:00:00+05:30"
  }
];

const allStaticGuides = [
  ...staticGuides,
  ...GENERATED_STATIC_SEO_GUIDES.map((guide) => ({
    slug: guide.slug,
    updatedAt: guide.updatedAt || guide.publishedAt || guide.createdAt
  }))
];

const escapeXml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const formatDate = (value) => {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString().split("T")[0]
    : parsed.toISOString().split("T")[0];
};

const absoluteUrl = (path = "/") => (
  /^https?:\/\//i.test(path) ? path : `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
);

const loadGuides = async () => {
  try {
    const store = getStore(STORE_NAME);
    const items = await store.get(INDEX_KEY, { type: "json" });
    return Array.isArray(items)
      ? items.filter((guide) => guide.status === "published")
      : [];
  } catch {
    return [];
  }
};

const renderImage = (image) => `
    <image:image>
      <image:loc>${escapeXml(absoluteUrl(image.loc))}</image:loc>
      <image:caption>${escapeXml(image.caption || "Homavia verified homestay")}</image:caption>
    </image:image>`;

const renderUrl = ({ loc, lastmod, changefreq, priority, images = [] }) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${escapeXml(changefreq)}</changefreq>
    <priority>${escapeXml(priority)}</priority>${images.map(renderImage).join("")}
  </url>`;

export default async () => {
  const entries = staticPages.map((page) => ({
    loc: `${BASE_URL}${page.path}`,
    lastmod: formatDate(),
    changefreq: page.changefreq,
    priority: page.priority
  }));

  const guides = await loadGuides();

  PUBLIC_HOMESTAY_LISTINGS.forEach((homestay) => {
    const loc = `${BASE_URL}/homestays/${homestay.slug}`;
    if (entries.some((entry) => entry.loc === loc)) return;

    entries.push({
      loc,
      lastmod: formatDate(homestay.updatedAt || homestay.publishedAt || homestay.createdAt),
      changefreq: "weekly",
      priority: "0.9",
      images: (homestay.images || [homestay.imageUrl])
        .filter(Boolean)
        .slice(0, 5)
        .map((image) => ({
          loc: image,
          caption: `${homestay.name} - ${homestay.roomType || "Homavia homestay"} in ${homestay.city || "India"}`
        }))
    });
  });

  [...allStaticGuides, ...guides].forEach((guide) => {
    const loc = `${BASE_URL}/travel-guides/${guide.slug}`;
    if (entries.some((entry) => entry.loc === loc)) return;

    entries.push({
      loc,
      lastmod: formatDate(guide.updatedAt || guide.publishedAt || guide.createdAt),
      changefreq: "weekly",
      priority: "0.8"
    });
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.map(renderUrl).join("\n")}
</urlset>
`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600"
    }
  });
};
