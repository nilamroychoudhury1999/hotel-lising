import { getStore } from "@netlify/blobs";
import { PUBLIC_HOMESTAY_LISTINGS } from "../../src/data/publicHomestays.mjs";
import { GENERATED_STATIC_SEO_GUIDES } from "../../src/data/staticSeoGuides.mjs";
import {
  CONFIRMED_OSM_POOL_STAY_COUNT,
  MAP_POOL_HOMESTAY_LEAD_COUNT,
  OSM_ATTRIBUTION,
  POOL_HOMESTAY_CANDIDATE_COUNT,
  POOL_HOMESTAY_CANDIDATES
} from "../../src/data/poolHomestayCandidates.mjs";

const BASE_URL = "https://homavia.in";
const STORE_NAME = "seo-content";
const INDEX_KEY = "_index";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION =
  "Find verified homestays, bike rentals, and car rentals across India with transparent pricing, direct host contact, and calendar-backed availability.";
const DEFAULT_KEYWORDS =
  "Homavia, verified homestays India, book homestay, homestay booking India, bike rental India, car rental India, couple friendly stays";

const STATIC_GUIDES = {
  "hotel-takeoff-heaven-near-guwahati-airport-stay-guide": {
    title:
      "Hotel Takeoff Heaven Near Guwahati Airport: Stay Guide for Early Flights and Short Trips",
    description:
      "Plan an airport-side stay at Hotel Takeoff Heaven near Guwahati Airport with 1BHK comfort, WiFi, parking, kitchen access, and host support.",
    keywords:
      "Hotel Takeoff Heaven near Guwahati Airport, Takeoff Heaven Homestay, hotel near Guwahati Airport, homestay near Guwahati Airport"
  },
  "takeoff-heaven-1bhk-guwahati-airport-family-couple-guide": {
    title:
      "Takeoff Heaven 1BHK Guwahati Airport Guide for Families, Couples, and Solo Travelers",
    description:
      "See why Takeoff Heaven 1BHK near Guwahati Airport suits families, couples, solo guests, work trips, and short private stays.",
    keywords:
      "Takeoff Heaven 1BHK Guwahati, Guwahati Airport homestay, private 1BHK near Guwahati Airport"
  },
  "guwahati-airport-hotel-booking-checklist-takeoff-heaven": {
    title: "Guwahati Airport Hotel Booking Checklist: When to Choose Takeoff Heaven",
    description:
      "Use this Guwahati Airport hotel checklist for early flights, late arrivals, family stays, 1BHK apartments, parking, WiFi, and Takeoff Heaven.",
    keywords:
      "Guwahati Airport hotel booking, Takeoff Heaven, airport stay Guwahati, hotel near Guwahati Airport"
  }
};
const GENERATED_GUIDE_MAP = Object.fromEntries(
  GENERATED_STATIC_SEO_GUIDES.map((guide) => [guide.slug, guide])
);
const ALL_STATIC_GUIDES = [
  ...Object.entries(STATIC_GUIDES).map(([slug, guide]) => ({
    slug,
    status: "published",
    title: guide.title,
    metaTitle: guide.title,
    metaDescription: guide.description,
    description: guide.description,
    keywords: guide.keywords,
    category: "Homavia guide",
    updatedAt: "2026-06-08T00:00:00+05:30",
    publishedAt: "2026-06-08T00:00:00+05:30"
  })),
  ...GENERATED_STATIC_SEO_GUIDES
];
const TOP_HOMESTAY_GUIDES = ALL_STATIC_GUIDES
  .filter((guide) => guide.source === "static-top-homestays-india")
  .sort((a, b) => String(a.city || a.title).localeCompare(String(b.city || b.title)));
const ONE_YEAR_BLOG_GUIDES = ALL_STATIC_GUIDES
  .filter((guide) => guide.source === "static-one-year-blog-plan")
  .sort((a, b) => String(a.title).localeCompare(String(b.title)));
const MAP_HOMESTAY_AREA_GUIDES = ALL_STATIC_GUIDES
  .filter((guide) => guide.source === "static-map-homestay-areas")
  .sort((a, b) => String(a.city || a.title).localeCompare(String(b.city || b.title)));

const STATIC_ROUTES = {
  "/": {
    title: "Homavia - Verified Homestays, Bike Rentals & Car Rentals in India",
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    type: "website"
  },
  "/about": {
    title: "About Homavia | Verified Homestays and Travel Rentals in India",
    description:
      "Learn how Homavia helps travelers discover verified homestays, local hosts, bike rentals, and car rentals across India.",
    keywords: "about Homavia, verified homestays India, local travel rentals India"
  },
  "/contact": {
    title: "Contact Homavia | Homestay Booking and Host Listing Help",
    description:
      "Contact Homavia for homestay booking help, host listing support, bike rentals, car rentals, and travel questions.",
    keywords: "contact Homavia, homestay booking help, list homestay India"
  },
  "/premium": {
    title: "Homavia Premium | Featured Homestay Listing Visibility",
    description:
      "Upgrade to Homavia Premium to improve homestay visibility, earn a featured listing badge, and reach more travelers.",
    keywords: "Homavia Premium, featured homestay listing, homestay visibility"
  },
  "/india-travel": {
    title: "India Travel Guide | Top Homestays, Rentals & Destination Stays | Homavia",
    description:
      "Explore Homavia's India travel hub for top homestay destinations, verified stay checks, bike rentals, car rentals, host contact, and local trip planning.",
    keywords:
      "India travel guide, top homestays in India, best homestay destinations India, verified homestays India, India trip planning, Homavia travel"
  },
  "/pool-homestays": {
    title: "Pool Homestays in India | 100+ Map Leads & Pool Stay Candidates | Homavia",
    description:
      "Explore 100+ Homavia pool homestay leads and map-sourced pool stay candidates across India. Verify pool access, host details, price, and availability before booking.",
    keywords:
      "pool homestays in India, private pool villa India, homestay with swimming pool India, pool stay near me, Homavia pool stays"
  },
  "/travel-guides": {
    title: "Homavia Travel & Host Guides | Homestay, CRM, Revenue & Rental SEO",
    description:
      "Read Homavia guides for verified homestays, host CRM, manual revenue tracking, calendar blocking, bike rentals, car rentals, and local travel planning.",
    keywords:
      "Homavia guides, homestay CRM India, homestay revenue calculator, verified homestays Guwahati, bike rental guide, car rental guide"
  },
  "/bike-rental": {
    title: "Bike Rental in India | Homavia Travel Rentals",
    description:
      "Find bike rentals for Homavia travelers with direct contact, city filters, pricing details, and local ride planning.",
    keywords: "bike rental India, bike rental Guwahati, travel bike rentals"
  },
  "/car-rental": {
    title: "Car Rental in India | Homavia Travel Rentals",
    description:
      "Find car rentals for Homavia travelers with local operators, direct contact, transparent pricing, and city-based options.",
    keywords: "car rental India, car rental Goa, car rental Guwahati"
  },
  "/property-sale": {
    title: "Residential Property Sale Leads | Homavia Project Directory",
    description:
      "Search residential property sale leads, apartments, villas, and township enquiries by city, area, developer, category, and status.",
    keywords: "property sale India, apartment project leads, residential project directory"
  }
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const safeJsonLd = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

const truncate = (value = "", maxLength = 155) => {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 1).trim()}…` : clean;
};

const normalizePath = (path = "/") => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return cleanPath.length > 1 ? cleanPath.replace(/\/+$/, "") : cleanPath;
};

const createHomestaySlug = (name = "", id = "", city = "") => {
  const baseSlug = String(name || id)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/\+/g, "plus")
    .replace(/@/g, "at")
    .replace(/'/g, "")
    .replace(/"/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50)
    .replace(/-+$/g, "");
  const citySlug = String(city || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return [baseSlug, citySlug, id].filter(Boolean).join("-");
};

const publicHomestayForPath = (path = "") => {
  const slug = path.split("/").filter(Boolean).at(-1) || "";

  return PUBLIC_HOMESTAY_LISTINGS.find((listing) => {
    const listingSlug = listing.slug || createHomestaySlug(listing.name, listing.id, listing.city);
    return slug === listingSlug || slug === listing.id || slug.endsWith(`-${listing.id}`);
  }) || null;
};

const loadScheduledGuide = async (slug) => {
  if (!slug) return null;

  try {
    const store = getStore(STORE_NAME);
    const directGuide = await store.get(slug, { type: "json" });
    if (directGuide?.status === "published") return directGuide;

    const items = await store.get(INDEX_KEY, { type: "json" });
    return Array.isArray(items)
      ? items.find((guide) => guide.slug === slug && guide.status === "published") || null
      : null;
  } catch {
    return null;
  }
};

const loadScheduledGuides = async () => {
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

const guideForSlug = async (slug) => (
  (await loadScheduledGuide(slug)) ||
  STATIC_GUIDES[slug] ||
  GENERATED_GUIDE_MAP[slug] ||
  null
);

const routeMetaFor = async (path) => {
  if (path.startsWith("/travel-guides/")) {
    const slug = path.split("/").filter(Boolean).at(-1);
    const guide = await guideForSlug(slug);

    if (guide) {
      return {
        title: `${guide.metaTitle || guide.title} | Homavia`,
        description: guide.metaDescription || guide.description || guide.introduction || DEFAULT_DESCRIPTION,
        keywords: Array.isArray(guide.keywords)
          ? guide.keywords.join(", ")
          : guide.keywords || DEFAULT_KEYWORDS,
        type: "article"
      };
    }
  }

  if (path.startsWith("/homestays/")) {
    const homestay = publicHomestayForPath(path);
    if (homestay) {
      return {
        title: `${homestay.name} in ${homestay.area || homestay.city} | Homavia`,
        description:
          `${homestay.description} Price from ₹${homestay.price}. View photos, amenities, guest capacity, location, and direct host contact on Homavia.`,
        keywords: [
          homestay.name,
          `${homestay.area} homestay`,
          `${homestay.city} homestay`,
          "verified Homavia listing",
          "direct host contact"
        ].filter(Boolean).join(", "),
        type: "product"
      };
    }

    return {
      title: "Verified Homestay Listing | Homavia",
      description:
        "View verified Homavia homestay details, photos, price, amenities, guest capacity, location, and direct host contact.",
      keywords:
        "verified homestay listing, Homavia homestay, book homestay India, direct host contact",
      type: "product"
    };
  }

  return STATIC_ROUTES[path] || STATIC_ROUTES["/"];
};

const setTag = (html, selectorPattern, replacement) => (
  selectorPattern.test(html)
    ? html.replace(selectorPattern, replacement)
    : html.replace("</head>", `${replacement}</head>`)
);

const applyMeta = (html, path, meta) => {
  const canonical = `${BASE_URL}${path === "/" ? "/" : path}`;
  const title = escapeHtml(meta.title);
  const description = escapeHtml(truncate(meta.description || DEFAULT_DESCRIPTION));
  const keywords = escapeHtml(meta.keywords || DEFAULT_KEYWORDS);
  const type = escapeHtml(meta.type || "website");

  let output = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);

  output = setTag(
    output,
    /<meta[^>]+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${description}" />`
  );
  output = setTag(
    output,
    /<meta[^>]+name=["']keywords["'][^>]*>/i,
    `<meta name="keywords" content="${keywords}" />`
  );
  output = setTag(
    output,
    /<link[^>]+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${canonical}" />`
  );
  output = setTag(
    output,
    /<meta[^>]+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${title}" />`
  );
  output = setTag(
    output,
    /<meta[^>]+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${description}" />`
  );
  output = setTag(
    output,
    /<meta[^>]+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${canonical}" />`
  );
  output = setTag(
    output,
    /<meta[^>]+property=["']og:type["'][^>]*>/i,
    `<meta property="og:type" content="${type}" />`
  );
  output = setTag(
    output,
    /<meta[^>]+property=["']og:image["'][^>]*>/i,
    `<meta property="og:image" content="${DEFAULT_IMAGE}" />`
  );
  output = setTag(
    output,
    /<meta[^>]+name=["']twitter:card["'][^>]*>/i,
    `<meta name="twitter:card" content="summary_large_image" />`
  );
  output = setTag(
    output,
    /<meta[^>]+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${title}" />`
  );
  output = setTag(
    output,
    /<meta[^>]+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${description}" />`
  );
  output = setTag(
    output,
    /<meta[^>]+name=["']twitter:image["'][^>]*>/i,
    `<meta name="twitter:image" content="${DEFAULT_IMAGE}" />`
  );

  return output;
};

const rootContentStyle =
  "font-family: Inter, Arial, sans-serif; max-width: 1120px; margin: 0 auto; padding: 32px 20px; color: #1f2937; line-height: 1.65;";

const replaceRootContent = (html, content) => (
  html.replace(
    /<div id="root">[\s\S]*<\/div>\s*<\/body>/i,
    `<div id="root">${content}</div>\n  </body>`
  )
);

const renderRelatedLinks = (links = []) => (
  links.length
    ? `<section><h2>Related Homavia Pages</h2><ul>${links.map((link) => {
      const path = link.path || "/";
      const href = /^https?:\/\//i.test(path) ? path : `${BASE_URL}${path}`;
      return `<li><a href="${escapeHtml(href)}">${escapeHtml(link.label || path)}</a></li>`;
    }).join("")}</ul></section>`
    : ""
);

const renderGuideFallback = (guide) => {
  const title = guide.title || guide.metaTitle || "Homavia Travel Guide";
  const intro = guide.introduction || guide.metaDescription || guide.description || DEFAULT_DESCRIPTION;
  const sections = Array.isArray(guide.sections) ? guide.sections : [];
  const faq = Array.isArray(guide.faq) ? guide.faq : [];

  return `<main style="${rootContentStyle}">
    <article>
      <p style="letter-spacing:.08em;text-transform:uppercase;color:#B42318;font-weight:700;">${escapeHtml(guide.category || "Homavia Guide")}</p>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(intro)}</p>
      ${sections.map((section) => `
        <section>
          <h2>${escapeHtml(section.heading)}</h2>
          <p>${escapeHtml(section.body)}</p>
        </section>
      `).join("")}
      ${faq.length ? `
        <section>
          <h2>Frequently Asked Questions</h2>
          ${faq.map((item) => `
            <h3>${escapeHtml(item.question)}</h3>
            <p>${escapeHtml(item.answer)}</p>
          `).join("")}
        </section>
      ` : ""}
      ${renderRelatedLinks(guide.relatedLinks)}
      <p><a href="${BASE_URL}/travel-guides">Back to Homavia travel guides</a></p>
    </article>
  </main>`;
};

const renderGuideIndexFallback = (guides = []) => `<main style="${rootContentStyle}">
  <header>
    <p style="letter-spacing:.08em;text-transform:uppercase;color:#B42318;font-weight:700;">Homavia Guides</p>
    <h1>Homavia travel, homestay, rental, CRM, and host revenue guides</h1>
    <p>Browse static Homavia SEO guides for verified homestays, couple-friendly stays, family workations, city travel planning, rentals, host CRM, calendar blocking, and revenue workflows.</p>
  </header>
  <section>
    <h2>Published Homavia Guides</h2>
    <ul>
      ${guides.map((guide) => `
        <li>
          <a href="${BASE_URL}/travel-guides/${escapeHtml(guide.slug)}">${escapeHtml(guide.title || guide.metaTitle || guide.slug)}</a>
          ${guide.metaDescription || guide.description ? `<p>${escapeHtml(guide.metaDescription || guide.description)}</p>` : ""}
        </li>
      `).join("")}
    </ul>
  </section>
</main>`;

const renderIndiaTravelFallback = (guides = TOP_HOMESTAY_GUIDES) => {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Top Homestay Destinations in India",
    "itemListElement": guides.slice(0, 100).map((guide, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": guide.city || guide.title,
      "url": `${BASE_URL}/travel-guides/${guide.slug}`
    }))
  };
  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Homavia India Travel Guide",
    "url": `${BASE_URL}/india-travel`,
    "description": "Homavia hub for India travel, top homestay destinations, rentals, verified stay checks, and destination planning.",
    "inLanguage": "en-IN"
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
      { "@type": "ListItem", "position": 2, "name": "India Travel", "item": `${BASE_URL}/india-travel` }
    ]
  };

  return `<main style="${rootContentStyle}">
    <script type="application/ld+json">${safeJsonLd([collectionPage, itemList, breadcrumb])}</script>
    <header>
      <p style="letter-spacing:.08em;text-transform:uppercase;color:#B42318;font-weight:700;">India Travel by Homavia</p>
      <h1>India travel guide for top homestays, rentals, and destination stays</h1>
      <p>Explore verified stay checks, best areas, family and couple questions, workation comfort, bike rentals, car rentals, and direct host contact for high-intent India travel searches.</p>
    </header>
    <section>
      <h2>Top Homestay Destination Pages</h2>
      <p>Homavia currently publishes ${guides.length} top-homestay destination pages across India, connected to travel guides, rentals, and listing discovery.</p>
      <ul>
        ${guides.map((guide) => `
          <li>
            <a href="${BASE_URL}/travel-guides/${escapeHtml(guide.slug)}">${escapeHtml(guide.title || guide.metaTitle || guide.slug)}</a>
            <p>${escapeHtml(guide.metaDescription || guide.description || guide.targetKeyword || "Homavia destination guide")}</p>
          </li>
        `).join("")}
      </ul>
    </section>
    <section>
      <h2>One-Year Blog Plan and Map-Area Discovery</h2>
      <p>Homavia also publishes ${ONE_YEAR_BLOG_GUIDES.length} one-year travel blog pages and ${MAP_HOMESTAY_AREA_GUIDES.length} map-area homestay discovery pages for landmark-led searches.</p>
      <ul>
        ${[...ONE_YEAR_BLOG_GUIDES.slice(0, 12), ...MAP_HOMESTAY_AREA_GUIDES.slice(0, 12)].map((guide) => `
          <li>
            <a href="${BASE_URL}/travel-guides/${escapeHtml(guide.slug)}">${escapeHtml(guide.title || guide.metaTitle || guide.slug)}</a>
            <p>${escapeHtml(guide.metaDescription || guide.description || guide.targetKeyword || "Homavia travel guide")}</p>
          </li>
        `).join("")}
      </ul>
    </section>
    <section>
      <h2>Travel Planning Links</h2>
      <ul>
        <li><a href="${BASE_URL}/">Browse verified Homavia stays</a></li>
        <li><a href="${BASE_URL}/pool-homestays">Browse pool homestay candidates</a></li>
        <li><a href="${BASE_URL}/travel-guides">Read Homavia travel guides</a></li>
        <li><a href="${BASE_URL}/bike-rental">Plan bike rentals</a></li>
        <li><a href="${BASE_URL}/car-rental">Plan car rentals</a></li>
      </ul>
    </section>
  </main>`;
};

const renderPoolHomestaysFallback = (items = POOL_HOMESTAY_CANDIDATES) => {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Pool Homestays and Pool Stay Candidates in India",
    "numberOfItems": items.length,
    "itemListElement": items.slice(0, 100).map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "url": `${BASE_URL}/pool-homestays`
    }))
  };

  return `<main style="${rootContentStyle}">
    <script type="application/ld+json">${safeJsonLd(itemList)}</script>
    <header>
      <p style="letter-spacing:.08em;text-transform:uppercase;color:#B42318;font-weight:700;">Pool Homestays</p>
      <h1>Pool homestays and map-sourced pool stay candidates in India</h1>
      <p>Browse ${POOL_HOMESTAY_CANDIDATE_COUNT} pool stay candidates across India, including ${CONFIRMED_OSM_POOL_STAY_COUNT} OpenStreetMap entries with pool-related map tags and ${MAP_POOL_HOMESTAY_LEAD_COUNT} Homavia map-area pool leads for outreach and verification.</p>
    </header>
    <section>
      <h2>Verify before booking</h2>
      <p>These entries are not automatically verified Homavia listings. Confirm pool access, property type, host identity, photos, pricing, guest rules, safety, and live availability before booking or moving a candidate into the main Homavia listing inventory.</p>
    </section>
    <section>
      <h2>Pool Stay Candidate List</h2>
      <ul>
        ${items.map((item) => `
          <li>
            <strong>${escapeHtml(item.name)}</strong>
            <p>${escapeHtml(item.area || "Pool stay area")}, ${escapeHtml(item.city || "India")}, ${escapeHtml(item.state || "India")} • ${escapeHtml(item.poolTag || "pool to verify")} • ${escapeHtml(item.verificationStatus || "Verify before booking.")}</p>
            <p>Map: ${escapeHtml(item.lat)}, ${escapeHtml(item.lon)}${item.sourceUrl ? ` • <a href="${escapeHtml(item.sourceUrl)}">Open map source</a>` : ""}</p>
          </li>
        `).join("")}
      </ul>
    </section>
    <section>
      <h2>Map Data Attribution</h2>
      <p>Confirmed map-tag entries use data from <a href="${OSM_ATTRIBUTION.url}">${OSM_ATTRIBUTION.label}</a> under ${OSM_ATTRIBUTION.license}. Homavia map-area leads are research leads for future verification, not final booking inventory.</p>
    </section>
  </main>`;
};

const renderHomestayFallback = (homestay) => {
  const image = homestay.imageUrl || DEFAULT_IMAGE;

  return `<main style="${rootContentStyle}">
    <article>
      <p style="letter-spacing:.08em;text-transform:uppercase;color:#B42318;font-weight:700;">Verified Homavia Stay</p>
      <h1>${escapeHtml(homestay.name)}</h1>
      <p>${escapeHtml(homestay.description || DEFAULT_DESCRIPTION)}</p>
      <img src="${escapeHtml(image)}" alt="${escapeHtml(`${homestay.name} in ${homestay.city}`)}" style="max-width:100%;height:auto;border-radius:8px;" />
      <section>
        <h2>Listing Details</h2>
        <ul>
          <li>City: ${escapeHtml(homestay.city || "India")}</li>
          <li>Area: ${escapeHtml(homestay.area || "Verified Homavia area")}</li>
          <li>Room type: ${escapeHtml(homestay.roomType || "Homestay")}</li>
          <li>Guests: ${escapeHtml(homestay.maxGuests || "Confirm with host")}</li>
          <li>Price from: ₹${escapeHtml(homestay.price || "Confirm with host")}</li>
        </ul>
      </section>
      <section>
        <h2>Amenities</h2>
        <p>${escapeHtml((homestay.amenities || []).join(", ") || "Confirm amenities with the host before booking.")}</p>
      </section>
      <p><a href="${BASE_URL}/">Browse more Homavia stays</a></p>
    </article>
  </main>`;
};

export default async (request) => {
  const url = new URL(request.url);
  const functionPath = url.pathname.replace(/^\/\.netlify\/functions\/seo-shell/, "");
  const path = normalizePath(
    url.searchParams.get("path") || decodeURIComponent(functionPath) || "/"
  );
  const origin = `${url.protocol}//${url.host}`;
  const shellResponse = await fetch(`${origin}/?seo-shell=1`, {
    headers: { Accept: "text/html" }
  });
  const shell = await shellResponse.text();
  const meta = await routeMetaFor(path);
  let output = applyMeta(shell, path, meta);

  if (path === "/india-travel") {
    output = replaceRootContent(output, renderIndiaTravelFallback(TOP_HOMESTAY_GUIDES));
  } else if (path === "/pool-homestays") {
    output = replaceRootContent(output, renderPoolHomestaysFallback(POOL_HOMESTAY_CANDIDATES));
  } else if (path === "/travel-guides") {
    const scheduledGuides = await loadScheduledGuides();
    const guides = [...scheduledGuides, ...ALL_STATIC_GUIDES].filter((guide, index, allGuides) => (
      guide?.slug && allGuides.findIndex((item) => item.slug === guide.slug) === index
    ));
    output = replaceRootContent(output, renderGuideIndexFallback(guides));
  } else if (path.startsWith("/travel-guides/")) {
    const slug = path.split("/").filter(Boolean).at(-1);
    const guide = await guideForSlug(slug);
    if (guide) output = replaceRootContent(output, renderGuideFallback(guide));
  } else if (path.startsWith("/homestays/")) {
    const homestay = publicHomestayForPath(path);
    if (homestay) output = replaceRootContent(output, renderHomestayFallback(homestay));
  }

  return new Response(output, {
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600"
    }
  });
};
