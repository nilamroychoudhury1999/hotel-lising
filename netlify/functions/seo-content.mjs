import { getStore } from "@netlify/blobs";
import { GENERATED_STATIC_SEO_GUIDES } from "../../src/data/staticSeoGuides.mjs";

const STORE_NAME = "seo-content";
const INDEX_KEY = "_index";
const STATIC_GUIDES = GENERATED_STATIC_SEO_GUIDES.filter((guide) => guide.status === "published");

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300"
    }
  });

const loadIndex = async (store) => {
  try {
    const items = await store.get(INDEX_KEY, { type: "json" });
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};

const mergeGuides = (guides = []) => {
  const merged = new Map();

  [...guides, ...STATIC_GUIDES].forEach((guide) => {
    if (guide?.slug && guide.status === "published" && !merged.has(guide.slug)) {
      merged.set(guide.slug, guide);
    }
  });

  return Array.from(merged.values());
};

export default async (request) => {
  const store = getStore(STORE_NAME);
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (slug) {
    try {
      const guide = await store.get(slug, { type: "json" });
      if (guide?.status === "published") return jsonResponse({ guide });
    } catch {
      // Fall back to the index below.
    }

    const guides = await loadIndex(store);
    return jsonResponse({
      guide:
        guides.find((guide) => guide.slug === slug && guide.status === "published") ||
        STATIC_GUIDES.find((guide) => guide.slug === slug) ||
        null
    });
  }

  const guides = await loadIndex(store);
  return jsonResponse({
    guides: mergeGuides(guides)
  });
};
