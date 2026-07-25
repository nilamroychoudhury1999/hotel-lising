const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const ADMIN_EMAIL = "nilamroychoudhury216@gmail.com";
const GEMINI_MODEL = "gemini-2.5-flash";

const assertAdmin = (request) => {
  const email = request.auth?.token?.email;
  if (email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Only Homavia admin can run the SEO agent.");
  }
};

const cleanText = (value = "", maxLength = 1200) => (
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
);

const getGeminiApiKey = () => {
  let secretValue = "";

  try {
    secretValue = GEMINI_API_KEY.value();
  } catch (error) {
    secretValue = "";
  }

  const apiKey = cleanText(secretValue || process.env.GEMINI_API_KEY, 220);

  if (!apiKey) {
    throw new HttpsError(
      "failed-precondition",
      "Gemini API key is missing. Set Firebase secret GEMINI_API_KEY or local functions/.env."
    );
  }

  return apiKey;
};

const cleanList = (items = [], maxItems = 12, maxLength = 220) => (
  (Array.isArray(items) ? items : [])
    .map(item => cleanText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
);

const cleanListingSnapshot = (items = []) => (
  (Array.isArray(items) ? items : [])
    .slice(0, 12)
    .map(item => ({
      name: cleanText(item?.name, 120),
      city: cleanText(item?.city, 80),
      area: cleanText(item?.area, 80),
      roomType: cleanText(item?.roomType, 80),
      price: cleanText(item?.price, 40),
      priceType: cleanText(item?.priceType, 40),
      coupleFriendly: !!item?.coupleFriendly,
      hourly: !!item?.hourly,
      premium: !!item?.premium
    }))
);

const extractGeminiText = (payload = {}) => (
  payload.candidates?.[0]?.content?.parts
    ?.map(part => part.text || "")
    .filter(Boolean)
    .join("\n") || ""
);

const parseGeminiJson = (text) => {
  const clean = String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch (error) {
    const jsonStart = clean.indexOf("{");
    const jsonEnd = clean.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      return JSON.parse(clean.slice(jsonStart, jsonEnd + 1));
    }
    throw error;
  }
};

const fallbackResult = (data) => ({
  summary: `SEO plan for ${data.topic} focused on ${data.targetKeyword}.`,
  seoDraft: {
    title: data.topic,
    metaTitle: `${data.topic} | Homavia`,
    metaDescription: `Learn how Homavia supports ${data.targetKeyword} with verified listings, CRM tools, revenue tracking, and calendar management.`,
    keywords: [data.targetKeyword, "Homavia", "homestay CRM", "verified homestays"],
    introduction: `Homavia helps travelers and hosts manage verified stays, listings, calendars, expenses, and revenue from one website.`,
    sections: [
      {
        heading: "Why this matters for Homavia",
        body: "Search visitors need clear pages that explain listings, host CRM, manual revenue calculation, room availability, and rental services in one connected experience."
      },
      {
        heading: "Recommended SEO direction",
        body: "Create practical pages around the target keyword, connect them with internal links, and add structured data so Google can understand each Homavia feature."
      }
    ],
    faq: [
      {
        question: "Can Homavia help hosts manage manual bookings?",
        answer: "Yes. Homavia can support manual booking records, room availability, expenses, platform-wise prices, and revenue calculation for hosts."
      }
    ],
    cta: "Open Homavia to explore listings or manage host CRM."
  },
  sitePlan: [
    "Publish one focused SEO page for the target keyword.",
    "Add internal links from listings, CRM, revenue, and rental pages.",
    "Track impressions and clicks in Google Search Console after indexing."
  ],
  landingPages: [
    "Host CRM software for homestays",
    "Manual revenue calculator for homestay hosts",
    "Calendar blocking and room availability for hosts"
  ],
  contentClusters: [
    "Homestay listing growth",
    "Host CRM workflows",
    "Manual revenue and expense tracking"
  ],
  internalLinks: [
    "Link from guide pages to /my-listings for host CRM",
    "Link from city guide pages to relevant homestay listings",
    "Link rental guides to /bike-rental and /car-rental"
  ],
  technicalSeoTasks: [
    "Add schema for guide pages and FAQs",
    "Include generated guides in sitemap.xml",
    "Use unique meta titles and descriptions for every published guide"
  ],
  schemaIdeas: [
    "Article",
    "FAQPage",
    "SoftwareApplication for CRM feature pages",
    "LocalBusiness for city landing pages"
  ],
  weeklyTasks: [
    "Publish one guide page",
    "Improve internal links from existing pages",
    "Check Search Console coverage"
  ],
  qualityChecklist: [
    "No copied internet text",
    "Clear target keyword in title and intro",
    "Useful sections for real guests or hosts",
    "FAQ answers are concise and factual"
  ],
  sourceLinks: []
});

const buildPrompt = (data) => `
You are Homavia's website SEO agent. Focus only on organic website SEO and indexable website content.
Do not create social media posts, WhatsApp promotions, ad copy, or influencer plans.

Homavia features:
- Verified homestay listings for guests.
- Host CRM for manual bookings, room availability, expenses, paid-by tracking, guest records, tasks, and manual revenue calculation.
- Calendar blocking and platform-wise price management for hosts.
- Bike rental and car rental pages.
- City and area pages for Guwahati, Shillong, Goa, and future locations.

Goal: ${data.goal}
Topic: ${data.topic}
City: ${data.city || "India"}
Category: ${data.category}
Target keyword: ${data.targetKeyword}
SEO focus areas: ${data.focusAreas.join(", ") || "Website SEO"}
Current listing sample: ${JSON.stringify(data.listingSnapshot)}

Return only valid JSON with this exact shape:
{
  "summary": "short executive summary",
  "seoDraft": {
    "title": "SEO page title",
    "metaTitle": "max 60 characters if possible",
    "metaDescription": "max 155 characters",
    "keywords": ["keyword"],
    "introduction": "original intro",
    "sections": [{"heading": "heading", "body": "useful original body"}],
    "faq": [{"question": "question", "answer": "answer"}],
    "cta": "clear website CTA"
  },
  "sitePlan": ["website SEO action"],
  "landingPages": ["new indexable page idea"],
  "contentClusters": ["topic cluster"],
  "internalLinks": ["internal link recommendation"],
  "technicalSeoTasks": ["technical SEO task"],
  "schemaIdeas": ["schema recommendation"],
  "weeklyTasks": ["weekly execution task"],
  "qualityChecklist": ["quality check"],
  "sourceLinks": [{"title": "optional public source title", "url": "https://example.com"}]
}

Rules:
- Write original content. Do not copy text from other websites.
- Make the page useful for Indian guests and Homavia hosts.
- Include CRM, listings, revenue, calendar, and rental features when relevant.
- Prefer practical, search-intent language over hype.
- Keep all arrays between 4 and 10 items except faq between 3 and 6.
`;

const normalizeAgentResult = (rawResult, data) => {
  const fallback = fallbackResult(data);
  const result = rawResult && typeof rawResult === "object" ? rawResult : {};
  const seoDraft = result.seoDraft || result.draft || {};

  return {
    summary: cleanText(result.summary || fallback.summary, 500),
    seoDraft: {
      title: cleanText(seoDraft.title || fallback.seoDraft.title, 120),
      metaTitle: cleanText(seoDraft.metaTitle || seoDraft.title || fallback.seoDraft.metaTitle, 80),
      metaDescription: cleanText(seoDraft.metaDescription || fallback.seoDraft.metaDescription, 170),
      keywords: cleanList(seoDraft.keywords || fallback.seoDraft.keywords, 12, 80),
      introduction: cleanText(seoDraft.introduction || fallback.seoDraft.introduction, 900),
      sections: (Array.isArray(seoDraft.sections) ? seoDraft.sections : fallback.seoDraft.sections)
        .map(section => ({
          heading: cleanText(section?.heading, 100),
          body: cleanText(section?.body || section?.content, 1200)
        }))
        .filter(section => section.heading && section.body)
        .slice(0, 8),
      faq: (Array.isArray(seoDraft.faq) ? seoDraft.faq : fallback.seoDraft.faq)
        .map(item => ({
          question: cleanText(item?.question, 160),
          answer: cleanText(item?.answer, 500)
        }))
        .filter(item => item.question && item.answer)
        .slice(0, 6),
      cta: cleanText(seoDraft.cta || fallback.seoDraft.cta, 220)
    },
    sitePlan: cleanList(result.sitePlan || result.plan || fallback.sitePlan, 10),
    landingPages: cleanList(result.landingPages || result.pages || fallback.landingPages, 12),
    contentClusters: cleanList(result.contentClusters || result.clusters || fallback.contentClusters, 12),
    internalLinks: cleanList(result.internalLinks || result.links || fallback.internalLinks, 12),
    technicalSeoTasks: cleanList(result.technicalSeoTasks || result.technicalTasks || fallback.technicalSeoTasks, 12),
    schemaIdeas: cleanList(result.schemaIdeas || result.schema || fallback.schemaIdeas, 8),
    weeklyTasks: cleanList(result.weeklyTasks || result.tasks || fallback.weeklyTasks, 12),
    qualityChecklist: cleanList(result.qualityChecklist || result.checklist || fallback.qualityChecklist, 12),
    sourceLinks: (Array.isArray(result.sourceLinks) ? result.sourceLinks : [])
      .map(source => ({
        title: cleanText(source?.title || source?.url, 120),
        url: cleanText(source?.url, 300)
      }))
      .filter(source => /^https?:\/\//i.test(source.url))
      .slice(0, 8)
  };
};

const generateMarketingResult = async (request) => {
  assertAdmin(request);

  const data = {
    goal: cleanText(request.data?.goal, 500) || "Grow organic website traffic for Homavia",
    topic: cleanText(request.data?.topic, 160),
    city: cleanText(request.data?.city, 80),
    category: cleanText(request.data?.category, 80) || "Homavia guide",
    targetKeyword: cleanText(request.data?.targetKeyword, 120),
    focusAreas: cleanList(request.data?.focusAreas || request.data?.channels, 10, 80),
    listingSnapshot: cleanListingSnapshot(request.data?.listingSnapshot)
  };

  if (!data.topic || !data.targetKeyword) {
    throw new HttpsError("invalid-argument", "Topic and target keyword are required.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(getGeminiApiKey())}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(data) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.45
        }
      })
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new HttpsError("internal", `Gemini request failed: ${details.slice(0, 500)}`);
  }

  const payload = await response.json();
  const text = extractGeminiText(payload);
  const parsed = parseGeminiJson(text);
  return normalizeAgentResult(parsed, data);
};

exports.runMarketingAgent = onCall(
  {
    secrets: [GEMINI_API_KEY],
    timeoutSeconds: 120,
    memory: "512MiB",
    cors: true
  },
  async (request) => {
    const result = await generateMarketingResult(request);
    return { result };
  }
);

exports.generateSeoContent = onCall(
  {
    secrets: [GEMINI_API_KEY],
    timeoutSeconds: 120,
    memory: "512MiB",
    cors: true
  },
  async (request) => {
    const result = await generateMarketingResult(request);
    return { draft: result.seoDraft, result };
  }
);
