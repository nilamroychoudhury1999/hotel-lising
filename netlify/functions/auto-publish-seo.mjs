import { getStore } from "@netlify/blobs";

const STORE_NAME = "seo-content";
const INDEX_KEY = "_index";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const TOPICS = [
  {
    id: "budget-homestays-guwahati",
    topic: "Budget homestays in Guwahati for guests comparing verified local stays",
    targetKeyword: "budget homestay in Guwahati",
    category: "Homestay guide",
    city: "Guwahati",
    focusAreas: ["Listings SEO", "City and area SEO"]
  },
  {
    id: "couple-friendly-homestays-guwahati",
    topic: "Couple friendly homestays in Guwahati with privacy, ID rules, and direct host checks",
    targetKeyword: "couple friendly homestay in Guwahati",
    category: "Couple friendly stays",
    city: "Guwahati",
    focusAreas: ["Listings SEO", "City and area SEO"]
  },
  {
    id: "kamakhya-temple-homestays-guwahati",
    topic: "Homestays near Kamakhya Temple in Guwahati for temple visits and family trips",
    targetKeyword: "homestay near Kamakhya Temple Guwahati",
    category: "Area guide",
    city: "Guwahati",
    focusAreas: ["Listings SEO", "City and area SEO"]
  },
  {
    id: "airport-homestays-guwahati",
    topic: "Homestays near Guwahati Airport for early flights, family arrivals, and short stays",
    targetKeyword: "homestay near Guwahati Airport",
    category: "Area guide",
    city: "Guwahati",
    focusAreas: ["Listings SEO", "City and area SEO", "Bike rental SEO", "Car rental SEO"]
  },
  {
    id: "takeoff-heaven-guwahati-airport",
    topic: "Hotel Takeoff Heaven near Guwahati Airport for early flights, late arrivals, and private airport-side stays",
    targetKeyword: "Hotel Takeoff Heaven near Guwahati Airport",
    category: "Area guide",
    city: "Guwahati",
    focusAreas: ["Listings SEO", "City and area SEO"]
  },
  {
    id: "takeoff-heaven-1bhk-guwahati",
    topic: "Takeoff Heaven 1BHK Guwahati for families, couples, solo travelers, and airport transit guests",
    targetKeyword: "Takeoff Heaven 1BHK Guwahati",
    category: "Homestay guide",
    city: "Guwahati",
    focusAreas: ["Listings SEO", "City and area SEO"]
  },
  {
    id: "guwahati-airport-hotel-checklist-takeoff-heaven",
    topic: "Guwahati Airport hotel booking checklist featuring Takeoff Heaven as an airport-side 1BHK option",
    targetKeyword: "Guwahati Airport hotel booking",
    category: "Area guide",
    city: "Guwahati",
    focusAreas: ["Listings SEO", "City and area SEO", "Car rental SEO"]
  },
  {
    id: "police-bazar-homestays-shillong",
    topic: "Homestays near Police Bazar Shillong for first-time visitors, families, and budget travelers",
    targetKeyword: "homestay near Police Bazar Shillong",
    category: "Area guide",
    city: "Shillong",
    focusAreas: ["Listings SEO", "City and area SEO"]
  },
  {
    id: "budget-homestays-shillong",
    topic: "Budget homestays in Shillong with hot water, WiFi, family comfort, and verified hosts",
    targetKeyword: "budget homestay in Shillong",
    category: "Homestay guide",
    city: "Shillong",
    focusAreas: ["Listings SEO", "City and area SEO"]
  },
  {
    id: "north-goa-beach-homestays",
    topic: "North Goa homestays near beaches for couples, families, groups, and rental access",
    targetKeyword: "North Goa homestay near beach",
    category: "Area guide",
    city: "Goa",
    focusAreas: ["Listings SEO", "City and area SEO", "Bike rental SEO"]
  },
  {
    id: "south-goa-family-homestays",
    topic: "South Goa family homestays and villas for quiet beach trips and longer stays",
    targetKeyword: "South Goa family homestay",
    category: "Area guide",
    city: "Goa",
    focusAreas: ["Listings SEO", "City and area SEO", "Car rental SEO"]
  },
  {
    id: "host-crm-guwahati",
    topic: "Homavia host CRM for manual homestay bookings in Guwahati",
    targetKeyword: "homestay booking CRM in Guwahati",
    category: "Host CRM guide",
    city: "Guwahati",
    focusAreas: ["Host CRM SEO", "Revenue management SEO", "Calendar blocking SEO"]
  },
  {
    id: "manual-revenue-calculator",
    topic: "Manual revenue calculator for homestay hosts",
    targetKeyword: "homestay revenue calculator India",
    category: "Revenue management guide",
    city: "India",
    focusAreas: ["Revenue management SEO", "Host CRM SEO"]
  },
  {
    id: "calendar-blocking-room-availability",
    topic: "Calendar blocking and room availability for homestay hosts",
    targetKeyword: "calendar blocking for homestays",
    category: "Calendar blocking guide",
    city: "India",
    focusAreas: ["Calendar blocking SEO", "Technical SEO"]
  },
  {
    id: "verified-homestays-guwahati",
    topic: "Verified homestays in Guwahati with direct host contact",
    targetKeyword: "verified homestays in Guwahati",
    category: "City travel guide",
    city: "Guwahati",
    focusAreas: ["Listings SEO", "City and area SEO"]
  },
  {
    id: "bike-rental-guwahati",
    topic: "Bike rental in Guwahati for Homavia travelers",
    targetKeyword: "bike rental in Guwahati",
    category: "Bike rental guide",
    city: "Guwahati",
    focusAreas: ["Bike rental SEO", "City and area SEO"]
  },
  {
    id: "car-rental-goa",
    topic: "Car rental in Goa for homestay travelers",
    targetKeyword: "car rental in Goa",
    category: "Car rental guide",
    city: "Goa",
    focusAreas: ["Car rental SEO", "City and area SEO"]
  }
];

const cleanText = (value = "", maxLength = 1200) =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const cleanList = (items = [], limit = 12, maxLength = 160) => (
  (Array.isArray(items) ? items : [])
    .map((item) => cleanText(item, maxLength))
    .filter(Boolean)
    .slice(0, limit)
);

const createSlug = (title = "") => {
  const slug = cleanText(title, 120)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\+/g, "plus")
    .replace(/@/g, "at")
    .replace(/'/g, "")
    .replace(/"/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 76)
    .replace(/-+$/g, "");

  return slug || `homavia-guide-${Date.now()}`;
};

const istDateKey = (date = new Date()) => (
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date)
);

const loadIndex = async (store) => {
  try {
    const items = await store.get(INDEX_KEY, { type: "json" });
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};

const parseGeminiJson = (text = "") => {
  const clean = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1));
    throw new Error("Gemini did not return valid JSON.");
  }
};

const extractGeminiText = (payload = {}) => (
  payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .filter(Boolean)
    .join("\n") || ""
);

const buildPrompt = (topic) => `
You are Homavia's website SEO publisher. Create one original, useful, indexable guide page.
Do not write social media posts, ad copy, or promotional spam.

Homavia features:
- Verified homestay listings for guests.
- Host CRM for manual bookings, guest records, expenses, paid-by tracking, room availability, tasks, and manual revenue calculation.
- Calendar blocking and platform-wise price management for hosts.
- Bike rental and car rental pages.
- City and area guides for Guwahati, Shillong, Goa, and future locations.

Topic: ${topic.topic}
City: ${topic.city}
Category: ${topic.category}
Target keyword: ${topic.targetKeyword}
SEO focus areas: ${topic.focusAreas.join(", ")}

Return only valid JSON with this shape:
{
  "title": "SEO title",
  "metaTitle": "max 60 characters if possible",
  "metaDescription": "max 155 characters",
  "keywords": ["keyword"],
  "introduction": "original introduction",
  "sections": [{"heading": "heading", "body": "useful body"}],
  "faq": [{"question": "question", "answer": "answer"}],
  "cta": "clear next step"
}

Rules:
- Write original content only.
- Make it useful for Indian guests or Homavia hosts.
- Include practical details about listings, CRM, revenue, calendars, or rentals where relevant.
- Use the target keyword naturally.
- Return 4 to 6 sections and 3 to 5 FAQs.
`;

const normalizeDraft = (draft = {}, topic) => {
  const title = cleanText(draft.title || topic.topic, 130);
  const introduction = cleanText(draft.introduction, 1000);

  return {
    title,
    metaTitle: cleanText(draft.metaTitle || title, 80),
    metaDescription: cleanText(
      draft.metaDescription ||
        introduction ||
        "Read Homavia guides for verified stays, host CRM, revenue tracking, calendar blocking, and rentals.",
      170
    ),
    keywords: cleanList(draft.keywords, 12, 80),
    introduction,
    sections: (Array.isArray(draft.sections) ? draft.sections : [])
      .map((section) => ({
        heading: cleanText(section?.heading, 120),
        body: cleanText(section?.body, 1500)
      }))
      .filter((section) => section.heading && section.body)
      .slice(0, 8),
    faq: (Array.isArray(draft.faq) ? draft.faq : [])
      .map((item) => ({
        question: cleanText(item?.question, 170),
        answer: cleanText(item?.answer, 600)
      }))
      .filter((item) => item.question && item.answer)
      .slice(0, 6),
    cta: cleanText(draft.cta, 240) || "Explore Homavia to manage stays, bookings, revenue, and rentals."
  };
};

const generateGuide = async (topic) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(topic) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.45
        }
      })
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini request failed: ${details.slice(0, 500)}`);
  }

  const payload = await response.json();
  return normalizeDraft(parseGeminiJson(extractGeminiText(payload)), topic);
};

export default async () => {
  const store = getStore(STORE_NAME);
  const items = await loadIndex(store);
  const today = istDateKey();

  if (items.some((item) => item.publishDateIst === today && item.source === "scheduled-gemini")) {
    console.log(`SEO auto-publish skipped. Already published for ${today}.`);
    return new Response(null, { status: 204 });
  }

  const topic =
    TOPICS.find((candidate) => !items.some((item) => item.topicId === candidate.id)) ||
    {
      ...TOPICS[new Date().getUTCDate() % TOPICS.length],
      id: `daily-${today}`
    };

  const draft = await generateGuide(topic);
  const baseSlug = createSlug(draft.title);
  const slug = items.some((item) => item.slug === baseSlug)
    ? `${baseSlug}-${Date.now().toString(36)}`
    : baseSlug;
  const now = new Date().toISOString();

  const guide = {
    id: slug,
    slug,
    status: "published",
    ...draft,
    category: topic.category,
    city: topic.city,
    targetKeyword: topic.targetKeyword,
    topicId: topic.id,
    source: "scheduled-gemini",
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    publishDateIst: today
  };

  const nextItems = [guide, ...items.filter((item) => item.slug !== guide.slug)].slice(0, 120);

  await store.setJSON(guide.slug, guide);
  await store.setJSON(INDEX_KEY, nextItems);

  console.log(`SEO guide auto-published: ${guide.slug}`);
  return new Response(null, { status: 204 });
};

export const config = {
  schedule: "8 12 * * *"
};
