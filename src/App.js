import React, { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  deleteDoc,
  writeBatch,
  getDocs,
  Timestamp,
  limit
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
  useLocation
} from "react-router-dom";
import {
  FiUser, FiMapPin, FiHome, FiStar, FiWifi, FiTv, FiCoffee, FiDroplet, FiSearch,
  FiMail, FiPhone, FiInfo, FiCheck, FiMenu, FiX, FiCalendar, FiNavigation, FiMap, FiFilter, FiMessageCircle,
} from "react-icons/fi";
import { Helmet } from "react-helmet";
import ICAL from "ical.js";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import heroImage from "./prairie-haven-51f728.jpg";
import "./App.css";
import { PUBLIC_HOMESTAY_LISTINGS } from "./data/publicHomestays.mjs";
import { GENERATED_STATIC_SEO_GUIDES } from "./data/staticSeoGuides.mjs";
import {
  CONFIRMED_OSM_POOL_STAY_COUNT,
  MAP_POOL_HOMESTAY_LEAD_COUNT,
  OSM_ATTRIBUTION,
  POOL_HOMESTAY_CANDIDATE_COUNT,
  POOL_HOMESTAY_CANDIDATES
} from "./data/poolHomestayCandidates.mjs";

const logo = `${process.env.PUBLIC_URL || ""}/homavia-logo.jpg`;

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/* ------------------------------
   Firebase configuration
------------------------------ */
const firebaseConfig = {
  apiKey: "AIzaSyCQJ3dX_ZcxVKzlCD8H19JM3KYh7qf8wYk",
  authDomain: "form-ca7cc.firebaseapp.com",
  projectId: "form-ca7cc",
  storageBucket: "form-ca7cc.appspot.com",
  messagingSenderId: "1054208318782",
  appId: "1:1054208318782:web:f64f43412902afcd7aa06f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functionsClient = getFunctions(app);
const provider = new GoogleAuthProvider();

/* ------------------------------
   Cloudinary configuration
------------------------------ */
const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset_1";
const CLOUDINARY_CLOUD_NAME = "dyrmi2zkl";

/* ------------------------------
   Access control
------------------------------ */
const ADMIN_EMAIL = "nilamroychoudhury216@gmail.com";
const isAdminUser = (user) => !!user && user.email === ADMIN_EMAIL;

/* ------------------------------
   Analytics Tracking Functions
------------------------------ */
const ANALYTICS_COLLECTION = "analytics";
const PRIVATE_TRAFFIC_PATH_PREFIXES = [
  "/admin",
  "/my-listings",
  "/add-homestay",
  "/edit-homestay",
  "/login"
];

const getTrafficSessionId = () => {
  if (typeof window === "undefined") return "server";

  try {
    const storageKey = "homavia_traffic_session_id";
    const existing = window.localStorage.getItem(storageKey);
    if (existing) return existing;

    const nextId = `hv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(storageKey, nextId);
    return nextId;
  } catch {
    return `hv_${Date.now().toString(36)}`;
  }
};

const getDeviceType = () => {
  if (typeof window === "undefined") return "unknown";
  const width = window.innerWidth || 0;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
};

const getReferrerHost = () => {
  if (typeof document === "undefined" || !document.referrer) return "direct";

  try {
    const referrerUrl = new URL(document.referrer);
    return referrerUrl.hostname || "direct";
  } catch {
    return "direct";
  }
};

const shouldTrackTrafficPath = (path = "") => (
  !PRIVATE_TRAFFIC_PATH_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
);

const trackEvent = async (eventType, data = {}) => {
  try {
    const pagePath = data.pagePath || (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "");

    if (eventType === "page_view" && !shouldTrackTrafficPath(pagePath)) return;

    await addDoc(collection(db, ANALYTICS_COLLECTION), {
      eventType,
      sessionId: getTrafficSessionId(),
      pagePath,
      pageTitle: data.pageTitle || (typeof document !== "undefined" ? document.title : ""),
      referrerHost: data.referrerHost || getReferrerHost(),
      referrer: typeof document !== "undefined" ? document.referrer.slice(0, 300) : "",
      deviceType: getDeviceType(),
      viewportWidth: typeof window !== "undefined" ? window.innerWidth || null : null,
      language: typeof navigator !== "undefined" ? navigator.language || "" : "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      timestamp: serverTimestamp(),
      ...data
    });
  } catch (error) {
    console.error("Error tracking event:", error);
  }
};

const trackPageView = (pagePath, pageTitle) => {
  trackEvent('page_view', { pagePath, pageTitle, source: "route_tracker" });
};

const trackCallClick = (homestayId, homestayName) => {
  trackEvent('call_click', { homestayId, homestayName });
};

const trackWhatsAppClick = (homestayId, homestayName) => {
  trackEvent('whatsapp_click', { homestayId, homestayName });
};

/* ------------------------------
   Constants
------------------------------ */
const AREAS_BY_CITY = {
  Guwahati: [
    "Paltan Bazaar", "Fancy Bazaar", "Uzan Bazaar", "Pan Bazaar",
    "Lachit Nagar", "Dispur", "Beltola", "Ganeshguri", "Six Mile",
    "Kahilipara", "Zoo Road", "Maligaon", "Chandmari", "Silpukhuri",
    "Geetanagar", "Hengrabari", "Bhangagarh", "Ulubari", "Rehabari",
    "Birubari", "Noonmati", "Lokhra", "Bhetapara", "Bamunimaidan",
    "Jalukbari", "North Guwahati", "Amingaon", "Azara", "VIP Road",
    "GS Road", "RG Baruah Road", "AT Road", "Bharalumukh", "Lakhra",
    "Bamunimaidam", "Christian Basti", "Survey", "Binova Nagar",
    "Rajgarh", "Khanapara", "Jayanagar", "Tarun Nagar", "Anil Nagar",
    "Sarusajai", "Bora Service", "Gotanagar", "Nabin Nagar", "Kharguli", "Maligaon"
  ],
  Shillong: [
    "Police Bazaar", "Laitumkhrah", "Nongthymmai", "Dhankheti",
    "Mawkhar", "Laban", "Rynjah", "Malki", "Nongrim Hills",
    "Jail Road", "Happy Valley", "Umpling", "Mawprem", "Pynthorumkhrah",
    "Nongkseh", "Lawmali", "Risa Colony", "Cleve Colony", "Oakland",
    "Quinton Road", "Ward's Lake Area", "Golf Links", "Barapani", "Umiam"
  ],
  Goa: [
    "North Goa",
    "South Goa",
    "Panaji", "Mapusa", "Margao", "Vasco da Gama",
    "Calangute", "Baga", "Anjuna", "Vagator", "Candolim",
    "Sinquerim", "Arambol", "Morjim", "Ashwem", "Mandrem",
    "Colva", "Benaulim", "Varca", "Cavelossim", "Mobor",
    "Palolem", "Agonda", "Patnem", "Fontainhas", "Dona Paula",
    "Miramar", "Old Goa", "Ponda", "Quepem", "Sanguem"
  ]
};
const ALL_CITIES = Object.keys(AREAS_BY_CITY);

const AMENITIES = [
  { id: "wifi", name: "WiFi", icon: <FiWifi /> },
  { id: "tv", name: "TV", icon: <FiTv /> },
  { id: "kitchen", name: "Kitchen", icon: <FiCoffee /> },
  { id: "ac", name: "Air Conditioning", icon: <FiDroplet /> },
  { id: "parking", name: "Free Parking", icon: <FiDroplet /> },
  { id: "pool", name: "Swimming Pool" },
  { id: "breakfast", name: "Breakfast Included" },
  { id: "workspace", name: "Dedicated Workspace" },
  { id: "laundry", name: "Laundry Facilities" },
  { id: "security", name: "24/7 Security" }
];

const ROOM_TYPES = [
  "Entire Home", "Private Room", "Shared Room", "Studio", "Villa"
];

const PRICE_TYPES = [
  { id: "perNight", label: "Per Night", suffix: "night" },
  { id: "perHour", label: "Per Hour", suffix: "hour" },
  { id: "perDay", label: "Per Day", suffix: "day" },
  { id: "perWeek", label: "Per Week", suffix: "week" },
  { id: "perMonth", label: "Per Month", suffix: "month" }
];

const PUBLIC_GOOGLE_HOMESTAYS = PUBLIC_HOMESTAY_LISTINGS.map(homestay => {
  if (homestay.id !== "takeoff-heaven-1bhk-google") return homestay;

  return {
    ...homestay,
    imageUrl: heroImage,
    images: [heroImage]
  };
});

const getPublicHomestayById = (id) => (
  PUBLIC_GOOGLE_HOMESTAYS.find(homestay => homestay.id === id)
);

const HIDDEN_LISTING_STATUSES = new Set([
  "draft",
  "unpublished",
  "private",
  "inactive",
  "rejected",
  "archived",
  "hidden"
]);

const hasOwnField = (value, field) => (
  Object.prototype.hasOwnProperty.call(value || {}, field)
);

const isPublicHomestayListing = (homestay) => {
  const status = String(
    homestay?.status ||
    homestay?.listingStatus ||
    homestay?.approvalStatus ||
    homestay?.visibility ||
    ""
  ).trim().toLowerCase();

  if (HIDDEN_LISTING_STATUSES.has(status)) return false;

  return !["published", "isPublished", "active", "isActive", "approved"].some(
    field => hasOwnField(homestay, field) && homestay[field] === false
  );
};

const normalizeHomestaySnapshot = (snapshot) => {
  const liveHomestays = snapshot.docs
    .map(entry => ({ id: entry.id, ...entry.data() }))
    .filter(homestay => homestay.name && isPublicHomestayListing(homestay));

  if (liveHomestays.length === 0) return PUBLIC_GOOGLE_HOMESTAYS;

  const seenKeys = new Set(
    liveHomestays.map(homestay => `${homestay.id}|${homestay.name}`.toLowerCase())
  );
  const publicFallbacks = PUBLIC_GOOGLE_HOMESTAYS.filter(homestay => {
    const key = `${homestay.id}|${homestay.name}`.toLowerCase();
    return !seenKeys.has(key);
  });

  return [...liveHomestays, ...publicFallbacks];
};

const PLATFORM_PRICE_OPTIONS = [
  { id: 'homavia', name: 'Homavia / Direct' },
  { id: 'airbnb', name: 'Airbnb' },
  { id: 'bookingCom', name: 'Booking.com' },
  { id: 'makemytrip', name: 'MakeMyTrip' },
  { id: 'goibibo', name: 'Goibibo' },
  { id: 'agoda', name: 'Agoda' },
  { id: 'expedia', name: 'Expedia' },
  { id: 'googleCalendar', name: 'Google Calendar' },
  { id: 'external', name: 'Other / External' }
];

const MANUAL_BLOCK_SOURCE_OPTIONS = [
  ...PLATFORM_PRICE_OPTIONS.map(platform => ({
    ...platform,
    name: platform.id === 'homavia' ? 'Homavia / Direct booking' : platform.name
  })),
  { id: 'ownerBlock', name: 'Owner block / Maintenance', nonRevenue: true }
];

const CALENDAR_LINK_SOURCE_OPTIONS = PLATFORM_PRICE_OPTIONS.filter(platform => platform.id !== 'homavia');

const SITE_URL = "https://homavia.in";
const SITE_NAME = "Homavia";
const SITE_LOCALE = "en_IN";
const SITE_LANGUAGE = "en-IN";
const CONTACT_PHONE = "+91-8638572663";
const CONTACT_EMAIL = "takeoffheaven@gmail.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION =
  "Find and book verified homestays, bike rentals, and car rentals across India with transparent pricing, direct host contact, and calendar-backed availability.";
const DEFAULT_KEYWORDS =
  "Homavia, verified homestays India, book homestay, homestay booking India, bike rental India, car rental India, couple friendly stays";
const DEFAULT_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
const PRIVATE_ROBOTS = "noindex, nofollow, noarchive";
const HOST_MANUAL_BOOKINGS_COLLECTION = "hostManualBookings";
const HOST_MANUAL_EXPENSES_COLLECTION = "hostManualExpenses";
const HOST_MANUAL_TASKS_COLLECTION = "hostManualTasks";
const HOST_MANUAL_PLATFORMS = MANUAL_BLOCK_SOURCE_OPTIONS.map(option => option.name);
const HOST_MANUAL_FALLBACK_LISTING_ID = "manual-property";
const HOST_MANUAL_FALLBACK_LISTING_NAME = "Manual Property";
const HOST_DAILY_ENTRY_RECORD_TYPE = "dailyEntry";
const HOST_DAILY_ENTRY_STATUSES = [
  "Occupied",
  "Available",
  "Maintenance",
  "Owner block",
  "Cleaning",
  "Checkout",
  "No show"
];
const HOST_EXPENSE_CATEGORIES = [
  "Cleaning",
  "Maintenance",
  "Utilities",
  "Staff payout",
  "Supplies",
  "Platform fee",
  "Refund",
  "Transport",
  "Other"
];
const HOST_EXPENSE_PAID_BY_OPTIONS = [
  "Host",
  "Owner",
  "Manager",
  "Caretaker",
  "Staff",
  "Vendor",
  "Guest reimbursement"
];
const HOST_EXPENSE_PAYMENT_MODES = ["Cash", "UPI", "Bank transfer", "Card", "Wallet", "Other"];
const HOST_EXPENSE_CUSTOM_PAID_BY = "__custom_paid_by__";
const SEO_CONTENT_COLLECTION = "seoContent";
const MARKETING_AGENT_RUNS_COLLECTION = "marketingAgentRuns";
const SEO_CONTENT_CATEGORIES = [
  "Homestay guide",
  "City travel guide",
  "Area guide",
  "Host CRM guide",
  "Revenue management guide",
  "Listing growth guide",
  "Calendar blocking guide",
  "Bike rental guide",
  "Car rental guide",
  "Couple friendly stays",
  "Hourly stay guide"
];
const MARKETING_AGENT_SEO_FOCUS_AREAS = [
  "Listings SEO",
  "Host CRM SEO",
  "Revenue management SEO",
  "Calendar blocking SEO",
  "Bike rental SEO",
  "Car rental SEO",
  "City and area SEO",
  "Technical SEO"
];

const STATIC_PUBLISHED_GUIDES = [
  {
    id: "static-takeoff-heaven-guwahati-airport-stay-guide",
    slug: "hotel-takeoff-heaven-near-guwahati-airport-stay-guide",
    status: "published",
    title: "Hotel Takeoff Heaven Near Guwahati Airport: Stay Guide for Early Flights and Short Trips",
    metaTitle: "Hotel Takeoff Heaven Near Guwahati Airport",
    metaDescription: "Plan an airport-side stay at Hotel Takeoff Heaven near Guwahati Airport with 1BHK comfort, WiFi, parking, kitchen access, and host support.",
    keywords: [
      "Hotel Takeoff Heaven near Guwahati Airport",
      "Takeoff Heaven Homestay",
      "Takeoff Heaven 1BHK Guwahati",
      "hotel near Guwahati Airport",
      "homestay near Guwahati Airport",
      "airport stay in Guwahati",
      "Borjhar homestay",
      "Garal Guwahati stay"
    ],
    introduction:
      "Hotel Takeoff Heaven is an airport-side Guwahati stay for guests who want a simple, private, and comfortable base near Lokpriya Gopinath Bordoloi International Airport. It is especially useful for early flights, late arrivals, short Guwahati stopovers, and travelers who prefer apartment-style space over a standard room.",
    sections: [
      {
        heading: "Why airport-side stays matter in Guwahati",
        body:
          "Many Guwahati travelers do not want to cross the city before an early morning flight or after a late arrival. An airport-side stay near Borjhar, Garal, or Kuhabari Road can reduce travel stress because guests can stay closer to the airport corridor and still reach key Guwahati areas with planned transport."
      },
      {
        heading: "Who should consider Hotel Takeoff Heaven",
        body:
          "Takeoff Heaven works well for solo travelers, couples, families, business guests, and transit travelers who want a quieter stay near Guwahati Airport. The property is positioned around 1BHK-style comfort, so guests can look for more privacy, useful room space, and practical amenities instead of only a bed for the night."
      },
      {
        heading: "Amenities guests usually search for",
        body:
          "Airport guests commonly check for WiFi, parking, kitchen access, AC availability, workspace, hot water, clean bathrooms, power backup, and easy host communication. These details matter because a short airport stay needs to be predictable, especially when a guest has a flight, family arrival, or next-day road trip."
      },
      {
        heading: "How to plan check-in and airport movement",
        body:
          "Before booking, guests should confirm check-in timing, check-out timing, airport pickup or taxi availability, exact location guidance, luggage needs, and whether a late arrival is possible. Travel time can change with traffic and weather, so it is better to plan airport movement with a time buffer."
      },
      {
        heading: "Why book through Homavia",
        body:
          "Homavia gives guests a direct way to discover Takeoff Heaven and compare verified stay details. For the host, Homavia also keeps listing data, calendar blocking, room availability, and manual booking records in one CRM, which helps guests see a more reliable stay experience over time."
      }
    ],
    faq: [
      {
        question: "Is Hotel Takeoff Heaven near Guwahati Airport?",
        answer:
          "Yes. Takeoff Heaven is positioned as an airport-side Guwahati stay near the Borjhar/Garal airport corridor. Guests should confirm exact travel time before arrival because traffic and route conditions can change."
      },
      {
        question: "Is Takeoff Heaven suitable for early morning flights?",
        answer:
          "Yes, it is a practical choice for early flights because guests can stay closer to the airport side of Guwahati. Confirm checkout timing, taxi planning, and airport reporting time before booking."
      },
      {
        question: "Is Takeoff Heaven a hotel or homestay?",
        answer:
          "Guests may find it described as Hotel Takeoff Heaven, Takeoff Heaven Homestay, or Takeoff Heaven 1BHK across platforms. The useful thing to check is the room type, amenities, host rules, and booking details."
      },
      {
        question: "Can families stay at Takeoff Heaven?",
        answer:
          "Yes, the apartment-style setup can suit families, couples, and solo travelers. Guests should confirm guest count, extra guest policy, kitchen use, and house rules before booking."
      }
    ],
    relatedLinks: [
      { label: "Search Takeoff Heaven", path: "/?city=Guwahati&search=Takeoff%20Heaven" },
      { label: "Takeoff Heaven Google location", path: "https://share.google/8sL29nkbVFrPy2Rut" },
      { label: "Takeoff Heaven 1BHK guide", path: "/travel-guides/takeoff-heaven-1bhk-guwahati-airport-family-couple-guide" },
      { label: "Bike rental in Guwahati", path: "/bike-rental" },
      { label: "Read more travel guides", path: "/travel-guides" }
    ],
    cta: "Search Takeoff Heaven on Homavia and confirm airport-side availability, guest count, timing, and host rules before booking.",
    category: "Area guide",
    city: "Guwahati",
    targetKeyword: "Hotel Takeoff Heaven near Guwahati Airport",
    createdAt: "2026-06-08T00:00:00+05:30",
    updatedAt: "2026-06-08T00:00:00+05:30",
    publishedAt: "2026-06-08T00:00:00+05:30"
  },
  {
    id: "static-takeoff-heaven-1bhk-airport-family-guide",
    slug: "takeoff-heaven-1bhk-guwahati-airport-family-couple-guide",
    status: "published",
    title: "Takeoff Heaven 1BHK Guwahati Airport Guide for Families, Couples, and Solo Travelers",
    metaTitle: "Takeoff Heaven 1BHK Guwahati Airport Guide",
    metaDescription: "See why Takeoff Heaven 1BHK near Guwahati Airport suits families, couples, solo guests, work trips, and short private stays.",
    keywords: [
      "Takeoff Heaven 1BHK Guwahati",
      "1BHK near Guwahati Airport",
      "family stay near Guwahati Airport",
      "couple stay near Guwahati Airport",
      "private apartment near Guwahati Airport",
      "airport homestay Guwahati",
      "Takeoff Heaven apartment"
    ],
    introduction:
      "Takeoff Heaven 1BHK is useful for travelers who want a private apartment-style stay near Guwahati Airport. Instead of choosing only by price, guests should compare privacy, room layout, kitchen access, parking, WiFi, work setup, guest rules, and airport movement.",
    sections: [
      {
        heading: "Why 1BHK airport stays rank well",
        body:
          "Search demand near Guwahati Airport is practical. Guests look for private rooms, 1BHK apartments, family stays, couple-friendly stays, parking, kitchen access, and flexible timing. A clear 1BHK guide helps Takeoff Heaven appear for searches that are more specific than only hotel near Guwahati Airport."
      },
      {
        heading: "For families",
        body:
          "Families often need more than a bed. They check whether the stay has enough space, a usable kitchen, parking, clean bathrooms, easy luggage handling, and a host who can explain directions. A 1BHK near the airport can be useful before flights, after long drives, or during short Guwahati visits."
      },
      {
        heading: "For couples and solo travelers",
        body:
          "Couples and solo guests usually care about privacy, safety, ID rules, WiFi, quiet surroundings, and easy check-in. Before booking Takeoff Heaven, guests should confirm house rules, maximum occupancy, arrival timing, and whether any extra guest charges apply."
      },
      {
        heading: "For work and transit trips",
        body:
          "Business and transit travelers should check WiFi strength, desk or table availability, charging points, phone network, taxi access, and power backup. These small details matter when the stay is short and the guest needs to work, rest, and leave on time."
      },
      {
        heading: "How Homavia supports Takeoff Heaven",
        body:
          "Homavia can connect this property-focused guide to the live Takeoff Heaven listing, related Guwahati guides, and rental pages. Internal links help Google understand that Takeoff Heaven is part of a broader Guwahati airport stay cluster rather than an isolated listing."
      }
    ],
    faq: [
      {
        question: "Who is Takeoff Heaven 1BHK best for?",
        answer:
          "It is best for guests who want private apartment-style comfort near Guwahati Airport, including families, couples, solo travelers, business guests, and short-stay visitors."
      },
      {
        question: "What should I confirm before booking a 1BHK near Guwahati Airport?",
        answer:
          "Confirm location, guest count, check-in timing, checkout timing, kitchen use, parking, WiFi, AC, extra guest charges, cancellation terms, and taxi planning."
      },
      {
        question: "Can a 1BHK stay be better than a hotel room?",
        answer:
          "Yes, when guests want more privacy, more usable space, a kitchen, and a home-like stay. A hotel room may be better for guests who need reception service and standardized hotel facilities."
      },
      {
        question: "How does this blog help Takeoff Heaven rank?",
        answer:
          "It targets specific searches such as Takeoff Heaven 1BHK Guwahati, family stay near Guwahati Airport, and private apartment near Guwahati Airport, then links those searches back into Homavia."
      }
    ],
    relatedLinks: [
      { label: "Search Takeoff Heaven", path: "/?city=Guwahati&search=Takeoff%20Heaven" },
      { label: "Takeoff Heaven Google location", path: "https://share.google/8sL29nkbVFrPy2Rut" },
      { label: "Airport stay guide", path: "/travel-guides/hotel-takeoff-heaven-near-guwahati-airport-stay-guide" },
      { label: "Airport stay guide", path: "/travel-guides/hotel-takeoff-heaven-near-guwahati-airport-stay-guide" },
      { label: "Open Host CRM", path: "/my-listings" }
    ],
    cta: "Use Homavia to find Takeoff Heaven 1BHK and confirm the right unit, guest count, and airport-side timing before booking.",
    category: "Homestay guide",
    city: "Guwahati",
    targetKeyword: "Takeoff Heaven 1BHK Guwahati",
    createdAt: "2026-06-08T00:00:00+05:30",
    updatedAt: "2026-06-08T00:00:00+05:30",
    publishedAt: "2026-06-08T00:00:00+05:30"
  },
  {
    id: "static-guwahati-airport-hotel-booking-checklist-takeoff-heaven",
    slug: "guwahati-airport-hotel-booking-checklist-takeoff-heaven",
    status: "published",
    title: "Guwahati Airport Hotel Booking Checklist: When to Choose Takeoff Heaven",
    metaTitle: "Guwahati Airport Hotel Booking Checklist",
    metaDescription: "Use this Guwahati Airport hotel checklist for early flights, late arrivals, family stays, 1BHK apartments, parking, WiFi, and Takeoff Heaven.",
    keywords: [
      "Guwahati Airport hotel booking",
      "hotel near Lokpriya Gopinath Bordoloi Airport",
      "Guwahati airport hotel checklist",
      "Takeoff Heaven near airport",
      "short stay near Guwahati Airport",
      "late arrival stay Guwahati Airport",
      "early flight hotel Guwahati"
    ],
    introduction:
      "Booking a stay near Guwahati Airport is different from booking a city hotel. Guests need to think about flight timing, taxi access, luggage, check-in rules, sleep quality, parking, WiFi, and whether the room type suits a family, couple, solo traveler, or work trip. Takeoff Heaven is one airport-side option to consider when those details matter.",
    sections: [
      {
        heading: "Start with flight timing",
        body:
          "For early flights, choose a stay that reduces morning travel stress. For late arrivals, confirm whether the host can support your arrival window and provide clear directions. Always keep a buffer for security reporting time, traffic, rain, and route delays."
      },
      {
        heading: "Compare location and access",
        body:
          "Airport-side areas such as Borjhar, Garal, and nearby airport corridors can be more practical than central Guwahati for transit stays. Guests should still confirm the exact pickup point, route, and travel time because airport access can vary by time of day."
      },
      {
        heading: "Check the stay type",
        body:
          "A 1BHK or apartment-style stay can be better for guests who need a kitchen, work desk, private space, parking, and family comfort. A standard hotel room can be better for guests who want reception support, restaurant service, and hotel-style operations."
      },
      {
        heading: "Look for practical amenities",
        body:
          "For an airport stay, the most important amenities are clean bedding, WiFi, AC or fan comfort, parking, hot water, power backup, kitchen basics, good phone communication, and easy checkout. These are the details guests search for before choosing a hotel or homestay near Guwahati Airport."
      },
      {
        heading: "Where Takeoff Heaven fits",
        body:
          "Takeoff Heaven should be positioned as a practical airport-side stay for guests searching for a private 1BHK, homestay, apartment, or hotel-style option near Guwahati Airport. The strongest SEO angle is clear: near airport, private space, useful amenities, and direct Homavia discovery."
      }
    ],
    faq: [
      {
        question: "What is the best type of stay near Guwahati Airport?",
        answer:
          "For transit, early flights, and family comfort, a private 1BHK or airport-side homestay can be useful. For full-service needs, a hotel may be better. The best choice depends on timing, budget, and guest needs."
      },
      {
        question: "Should I stay near the airport or central Guwahati?",
        answer:
          "Stay near the airport for early flights, late arrivals, or short stopovers. Stay in central Guwahati if your main work is around GS Road, Paltan Bazar, Pan Bazaar, or city attractions."
      },
      {
        question: "Why include Takeoff Heaven in airport hotel searches?",
        answer:
          "Takeoff Heaven matches the airport-side intent because guests search for hotel, homestay, apartment, and 1BHK options near Guwahati Airport. A clear blog page helps Google connect those searches to Homavia."
      },
      {
        question: "Can I book Takeoff Heaven directly from Homavia?",
        answer:
          "Guests can use Homavia to discover the property and check the current listing details, then confirm availability, pricing, and house rules before booking."
      }
    ],
    relatedLinks: [
      { label: "Search Takeoff Heaven", path: "/?city=Guwahati&search=Takeoff%20Heaven" },
      { label: "Takeoff Heaven Google location", path: "https://share.google/8sL29nkbVFrPy2Rut" },
      { label: "Takeoff Heaven 1BHK guide", path: "/travel-guides/takeoff-heaven-1bhk-guwahati-airport-family-couple-guide" },
      { label: "Guwahati airport stay guide", path: "/travel-guides/hotel-takeoff-heaven-near-guwahati-airport-stay-guide" },
      { label: "Car rentals", path: "/car-rental" }
    ],
    cta: "Search Takeoff Heaven on Homavia when you need an airport-side Guwahati stay for early flights, late arrivals, or private 1BHK comfort.",
    category: "Area guide",
    city: "Guwahati",
    targetKeyword: "Guwahati Airport hotel booking",
    createdAt: "2026-06-08T00:00:00+05:30",
    updatedAt: "2026-06-08T00:00:00+05:30",
    publishedAt: "2026-06-08T00:00:00+05:30"
  }
];

const ACTIVE_STATIC_PUBLISHED_GUIDES = [
  ...STATIC_PUBLISHED_GUIDES,
  ...GENERATED_STATIC_SEO_GUIDES
];
const TOP_HOMESTAY_GUIDES = ACTIVE_STATIC_PUBLISHED_GUIDES
  .filter(guide => guide.source === "static-top-homestays-india")
  .sort((a, b) => String(a.city || a.title).localeCompare(String(b.city || b.title)));
const ONE_YEAR_BLOG_GUIDES = ACTIVE_STATIC_PUBLISHED_GUIDES
  .filter(guide => guide.source === "static-one-year-blog-plan")
  .sort((a, b) => String(a.title).localeCompare(String(b.title)));
const MAP_HOMESTAY_AREA_GUIDES = ACTIVE_STATIC_PUBLISHED_GUIDES
  .filter(guide => guide.source === "static-map-homestay-areas")
  .sort((a, b) => String(a.city || a.title).localeCompare(String(b.city || b.title)));

/* ------------------------------
   Helper Functions
------------------------------ */
const buildAbsoluteUrl = (path = "/") => {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
};

const toPlainText = (value = "") =>
  String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncateMeta = (value = "", maxLength = 155) => {
  const clean = toPlainText(value);
  if (clean.length <= maxLength) return clean;

  const trimmed = clean.slice(0, maxLength - 1).replace(/\s+\S*$/, "").trim();
  return `${trimmed || clean.slice(0, maxLength - 1)}...`;
};

const ensureSentence = (value = "") => {
  const clean = toPlainText(value);
  if (!clean) return "";
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
};

const createContentSlug = (title = "") => {
  const baseSlug = toPlainText(title)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\+/g, "plus")
    .replace(/@/g, "at")
    .replace(/'/g, "")
    .replace(/"/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 70)
    .replace(/-+$/g, "");

  return baseSlug || `homavia-guide-${Date.now()}`;
};

const normalizeSeoContentDraft = (draft = {}, fallbackTopic = "") => {
  const rawSections = Array.isArray(draft.sections) ? draft.sections : [];
  const sections = rawSections
    .map(section => ({
      heading: toPlainText(section?.heading || ""),
      body: toPlainText(section?.body || section?.content || "")
    }))
    .filter(section => section.heading && section.body);

  return {
    title: toPlainText(draft.title || fallbackTopic || "Homavia Travel Guide"),
    metaTitle: toPlainText(draft.metaTitle || draft.title || fallbackTopic || "Homavia Travel Guide"),
    metaDescription: truncateMeta(draft.metaDescription || draft.introduction || DEFAULT_DESCRIPTION),
    keywords: Array.isArray(draft.keywords)
      ? draft.keywords.map(keyword => toPlainText(keyword)).filter(Boolean).slice(0, 12)
      : [],
    introduction: toPlainText(draft.introduction || ""),
    sections,
    faq: (Array.isArray(draft.faq) ? draft.faq : [])
      .map(item => ({
        question: toPlainText(item?.question || ""),
        answer: toPlainText(item?.answer || "")
      }))
      .filter(item => item.question && item.answer)
      .slice(0, 6),
    cta: toPlainText(draft.cta || "Explore verified Homavia stays and travel rentals before you book.")
  };
};

const normalizeStringList = (items = [], limit = 12) => (
  (Array.isArray(items) ? items : [])
    .map(item => toPlainText(item))
    .filter(Boolean)
    .slice(0, limit)
);

const normalizeMarketingAgentResult = (result = {}, fallbackTopic = "") => ({
  summary: toPlainText(result.summary || "Website SEO plan generated for Homavia."),
  seoDraft: normalizeSeoContentDraft(result.seoDraft || result.draft || result, fallbackTopic),
  sitePlan: normalizeStringList(result.sitePlan || result.campaignPlan || result.plan || [], 10),
  landingPages: normalizeStringList(result.landingPages || result.websitePages || result.pages || [], 12),
  contentClusters: normalizeStringList(result.contentClusters || result.clusters || [], 12),
  internalLinks: normalizeStringList(result.internalLinks || result.links || [], 12),
  technicalSeoTasks: normalizeStringList(result.technicalSeoTasks || result.technicalTasks || [], 12),
  schemaIdeas: normalizeStringList(result.schemaIdeas || result.schema || [], 8),
  weeklyTasks: normalizeStringList(result.weeklyTasks || result.tasks || [], 12),
  qualityChecklist: normalizeStringList(result.qualityChecklist || result.checklist || [], 12),
  sourceLinks: (Array.isArray(result.sourceLinks) ? result.sourceLinks : [])
    .map(source => ({
      title: toPlainText(source?.title || source?.url || ""),
      url: toPlainText(source?.url || "")
    }))
    .filter(source => source.url)
    .slice(0, 8)
});

const normalizeSeoImage = (image) => {
  if (!image) return DEFAULT_OG_IMAGE;
  return buildAbsoluteUrl(image);
};

const cleanStructuredData = (value) =>
  JSON.parse(JSON.stringify(value, (_, item) => {
    if (item === undefined || item === null || item === "") return undefined;
    if (Array.isArray(item) && item.length === 0) return undefined;
    return item;
  }));

const getPriceUnitLabel = (priceType) => {
  switch (priceType) {
    case "perHour":
      return "hour";
    case "perDay":
      return "day";
    case "perWeek":
      return "week";
    case "perMonth":
      return "month";
    case "perNight":
    default:
      return "night";
  }
};

function SeoHelmet({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalPath = "/",
  image = DEFAULT_OG_IMAGE,
  imageAlt = "Homavia verified homestays and travel rentals",
  type = "website",
  robots = DEFAULT_ROBOTS,
  schema = []
}) {
  const metaTitle = title || `${SITE_NAME} - Verified Homestays, Bike Rentals & Car Rentals in India`;
  const metaDescription = truncateMeta(description);
  const canonicalUrl = buildAbsoluteUrl(canonicalPath);
  const imageUrl = normalizeSeoImage(image);
  const schemaItems = (Array.isArray(schema) ? schema : [schema]).filter(Boolean);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const upsertMeta = (selector, attributes) => {
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        document.head.appendChild(element);
      }
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    };

    const upsertLink = (selector, attributes) => {
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement("link");
        document.head.appendChild(element);
      }
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    };

    document.documentElement.lang = SITE_LANGUAGE;
    document.title = metaTitle;
    upsertMeta('meta[name="description"]', { name: "description", content: metaDescription });
    upsertMeta('meta[name="keywords"]', { name: "keywords", content: keywords });
    upsertMeta('meta[name="author"]', { name: "author", content: SITE_NAME });
    upsertMeta('meta[name="robots"]', { name: "robots", content: robots });
    upsertLink('link[rel="canonical"]', { rel: "canonical", href: canonicalUrl });

    upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: metaTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: metaDescription });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: imageUrl });
    upsertMeta('meta[property="og:image:alt"]', { property: "og:image:alt", content: imageAlt });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME });
    upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: SITE_LOCALE });

    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:url"]', { name: "twitter:url", content: canonicalUrl });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: metaTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: metaDescription });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: imageUrl });
    upsertMeta('meta[name="twitter:image:alt"]', { name: "twitter:image:alt", content: imageAlt });

    upsertLink('link[rel="alternate"][hreflang="en-in"]', { rel: "alternate", hreflang: "en-in", href: canonicalUrl });
    upsertLink('link[rel="alternate"][hreflang="x-default"]', { rel: "alternate", hreflang: "x-default", href: canonicalUrl });
  }, [canonicalUrl, imageAlt, imageUrl, keywords, metaDescription, metaTitle, robots, type]);

  return (
    <Helmet>
      <html lang={SITE_LANGUAGE} />
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={SITE_NAME} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={SITE_LOCALE} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={imageAlt} />

      <link rel="alternate" hrefLang="en-in" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {schemaItems.map((item, index) => (
        <script key={`schema-${index}`} type="application/ld+json">
          {JSON.stringify(cleanStructuredData(item))}
        </script>
      ))}
    </Helmet>
  );
}

function WebsiteTrafficTracker() {
  const location = useLocation();

  useEffect(() => {
    const pagePath = `${location.pathname}${location.search}`;
    if (!shouldTrackTrafficPath(pagePath)) return undefined;

    const timer = window.setTimeout(() => {
      trackPageView(pagePath, document.title || pagePath);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search]);

  return null;
}

// Create SEO-friendly URL slug from homestay name, city, and ID
const createSlug = (name, id, city = '') => {
  // Clean and normalize the name
  let slug = String(name || "homestay")
    .toLowerCase()
    .trim()
    // Replace common symbols and special characters
    .replace(/&/g, 'and')
    .replace(/\+/g, 'plus')
    .replace(/@/g, 'at')
    .replace(/'/g, '')
    .replace(/"/g, '')
    // Remove all non-alphanumeric characters except spaces and hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace multiple spaces or hyphens with single hyphen
    .replace(/[\s-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit to 50 characters for cleaner URLs
    .substring(0, 50)
    .replace(/-+$/g, ''); // Remove trailing hyphen if substring cut in middle

  if (!slug) slug = "homestay";
  
  // Add city for better SEO context (optional)
  if (city) {
    const citySlug = String(city)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (citySlug) slug = `${slug}-${citySlug}`;
  }
  
  // Always append ID at the end for uniqueness
  return id ? `${slug}-${id}` : slug;
};

// Extract ID from slug (always the last segment after final hyphen)
const getIdFromSlug = (slug) => {
  if (!slug) return null;
  const publicListing = PUBLIC_GOOGLE_HOMESTAYS.find(homestay => slug.endsWith(`-${homestay.id}`) || slug === homestay.id);
  if (publicListing) return publicListing.id;
  const parts = slug.split('-');
  return parts[parts.length - 1];
};

const CALENDAR_PORTAL_MATCHERS = [
  { id: 'airbnb', tokens: ['airbnb'], name: 'Airbnb' },
  { id: 'bookingCom', tokens: ['booking.com', 'booking-calendar'], name: 'Booking.com' },
  { id: 'external', tokens: ['vrbo', 'homeaway'], name: 'Vrbo' },
  { id: 'googleCalendar', tokens: ['google.com/calendar', 'calendar.google'], name: 'Google Calendar' },
  { id: 'agoda', tokens: ['agoda'], name: 'Agoda' },
  { id: 'makemytrip', tokens: ['makemytrip', 'make my trip', 'mmt'], name: 'MakeMyTrip' },
  { id: 'goibibo', tokens: ['goibibo'], name: 'Goibibo' },
  { id: 'expedia', tokens: ['expedia'], name: 'Expedia' },
  { id: 'external', tokens: ['tripadvisor'], name: 'Tripadvisor' },
  { id: 'external', tokens: ['hostaway'], name: 'Hostaway' },
  { id: 'external', tokens: ['lodgify'], name: 'Lodgify' },
  { id: 'external', tokens: ['guesty'], name: 'Guesty' },
  { id: 'external', tokens: ['smoobu'], name: 'Smoobu' },
  { id: 'external', tokens: ['beds24'], name: 'Beds24' },
  { id: 'external', tokens: ['ownerrez'], name: 'OwnerRez' },
  { id: 'external', tokens: ['cloudbeds'], name: 'Cloudbeds' },
  { id: 'external', tokens: ['eviivo'], name: 'eviivo' }
];

const findCalendarPortalMatch = (text) => {
  const searchable = String(text || '').toLowerCase();
  return CALENDAR_PORTAL_MATCHERS.find(portal =>
    portal.tokens.some(token => searchable.includes(token))
  );
};

const getCalendarPortalName = (icalUrl) => {
  if (!icalUrl) return 'No calendar linked';

  const normalized = String(icalUrl).trim().toLowerCase();
  let searchable = normalized;

  try {
    const parsedUrl = new URL(normalized);
    searchable = `${parsedUrl.hostname}${parsedUrl.pathname}`.replace(/^www\./, '');
  } catch (error) {
    // Some pasted calendar values are not valid URLs. Fall back to text matching.
  }

  const match = findCalendarPortalMatch(searchable);

  if (match) return match.name;

  try {
    return new URL(normalized).hostname.replace(/^www\./, '');
  } catch (error) {
    return 'External calendar';
  }
};

const toPositiveNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

const normalizeUnitCount = (value) => {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) && number > 0 ? number : 1;
};

const cleanPlatformPrices = (platformPrices = {}) => {
  return Object.entries(platformPrices).reduce((acc, [platformId, value]) => {
    const amount = toPositiveNumber(value);
    if (amount > 0) acc[platformId] = amount;
    return acc;
  }, {});
};

const getPlatformPriceKey = (source) => {
  const sourceText = String(source || '').toLowerCase();
  if (sourceText.includes('owner block') || sourceText.includes('maintenance')) return 'ownerBlock';
  if (sourceText.includes('homavia') || sourceText.includes('direct')) return 'homavia';

  const match = findCalendarPortalMatch(sourceText);
  return match?.id || 'external';
};

const getListingUnitCount = (listing) => {
  return normalizeUnitCount(listing?.unitCount || listing?.units || 1);
};

const createPublishedUnits = (unitCount = 1) => (
  Array.from({ length: normalizeUnitCount(unitCount) }, (_, index) => {
    const unitNumber = index + 1;
    return {
      id: `unit-${unitNumber}`,
      unitNumber,
      label: `Unit ${unitNumber}`,
      status: "published",
      published: true
    };
  })
);

const getListingPublishedUnits = (listing) => {
  const rawUnits = Array.isArray(listing?.publishedUnits) ? listing.publishedUnits : [];

  return rawUnits
    .map((unit, index) => {
      const data = typeof unit === "string" ? { label: unit } : (unit || {});
      const unitNumber = normalizeUnitCount(data.unitNumber || data.number || index + 1);
      const status = data.status || (data.published === false ? "draft" : "published");

      return {
        id: data.id || `unit-${unitNumber}`,
        unitNumber,
        label: data.label || data.name || `Unit ${unitNumber}`,
        status,
        published: data.published !== false
      };
    })
    .filter(unit => unit.published && unit.status === "published")
    .sort((a, b) => a.unitNumber - b.unitNumber);
};

const getManualBlockUnitCount = (entry) => {
  return normalizeUnitCount(entry?.units || entry?.roomCount || entry?.rooms || 1);
};

const getMonthValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getMonthLabel = (monthValue) => {
  const [year, month] = String(monthValue).split('-').map(Number);
  if (!year || !month) return 'Selected month';

  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });
};

const formatCurrency = (value) => {
  return `₹${Math.round(value || 0).toLocaleString('en-IN')}`;
};

const normalizeCalendarUrlForFetch = (icalUrl) => {
  if (!icalUrl) return '';

  try {
    const parsedUrl = new URL(icalUrl);
    if (parsedUrl.protocol === 'webcal:') {
      parsedUrl.protocol = 'https:';
      return parsedUrl.toString();
    }
  } catch (error) {
    return icalUrl;
  }

  return icalUrl;
};

const getCalendarFetchUrl = (icalUrl) => {
  const normalizedUrl = normalizeCalendarUrlForFetch(icalUrl);
  const proxyUrl = 'https://api.allorigins.win/raw?url=';
  return normalizedUrl.startsWith('http') ? proxyUrl + encodeURIComponent(normalizedUrl) : normalizedUrl;
};

const toSearchableCalendarValue = (value) => {
  if (!value) return '';
  if (Array.isArray(value)) return value.map(toSearchableCalendarValue).join(' ');
  if (typeof value === 'object') {
    return [
      value.toString?.(),
      value.name,
      value.email,
      value.uri
    ].filter(Boolean).join(' ');
  }
  return String(value);
};

const getCalendarEventSourceName = (vevent, icalUrl) => {
  const fallbackSource = getCalendarPortalName(icalUrl);
  const eventFields = [
    'summary',
    'description',
    'location',
    'uid',
    'url',
    'organizer',
    'attendee',
    'comment',
    'categories'
  ];

  const eventText = eventFields
    .map(field => toSearchableCalendarValue(vevent.getFirstPropertyValue(field)))
    .join(' ');

  const match = findCalendarPortalMatch(`${eventText} ${icalUrl}`);
  return match?.name || fallbackSource || 'External calendar';
};

const getLocalDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDateFromLocalKey = (dateKey) => {
  const [year, month, day] = String(dateKey || '').split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const getManualBlockSourceOption = (sourceId = 'homavia') => (
  MANUAL_BLOCK_SOURCE_OPTIONS.find(option => option.id === sourceId) ||
  MANUAL_BLOCK_SOURCE_OPTIONS[0]
);

const normalizeManualBlockDateKey = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return getLocalDateKey(value);

  const textValue = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(textValue)) return textValue;

  const parsed = new Date(textValue);
  return Number.isNaN(parsed.getTime()) ? null : getLocalDateKey(parsed);
};

const getCalendarLinkSourceOption = (sourceId = 'external') => (
  CALENDAR_LINK_SOURCE_OPTIONS.find(option => option.id === sourceId) ||
  CALENDAR_LINK_SOURCE_OPTIONS.find(option => option.id === 'external') ||
  CALENDAR_LINK_SOURCE_OPTIONS[0]
);

const normalizeListingCalendarLinks = (calendarLinks = [], legacyIcalUrl = '') => {
  const rawLinks = Array.isArray(calendarLinks) ? [...calendarLinks] : [];

  if (legacyIcalUrl && !rawLinks.some(link => String(link?.url || link).trim() === String(legacyIcalUrl).trim())) {
    const legacySource = getCalendarPortalName(legacyIcalUrl);
    rawLinks.push({
      sourceId: getPlatformPriceKey(legacySource),
      source: legacySource,
      url: legacyIcalUrl
    });
  }

  const seen = new Set();
  return rawLinks
    .map((entry) => {
      const rawUrl = typeof entry === 'string' ? entry : entry?.url;
      const url = normalizeCalendarUrlForFetch(String(rawUrl || '').trim());
      if (!url) return null;

      const detectedSource = typeof entry === 'string'
        ? getCalendarPortalName(url)
        : entry?.source || getCalendarPortalName(url);
      const sourceId = typeof entry === 'string'
        ? getPlatformPriceKey(detectedSource)
        : entry?.sourceId || getPlatformPriceKey(detectedSource);
      const sourceOption = getCalendarLinkSourceOption(sourceId);
      const dedupeKey = `${sourceOption.id}-${url}`;

      if (seen.has(dedupeKey)) return null;
      seen.add(dedupeKey);

      return {
        sourceId: sourceOption.id,
        source: sourceOption.name,
        url
      };
    })
    .filter(Boolean);
};

const getEditableCalendarLinks = (form = {}) => {
  if (Array.isArray(form.calendarLinks) && form.calendarLinks.length > 0) {
    return form.calendarLinks;
  }

  return normalizeListingCalendarLinks([], form.icalUrl);
};

const normalizeManualBlockedDates = (manualBlockedDates = []) => {
  const seen = new Set();

  return (Array.isArray(manualBlockedDates) ? manualBlockedDates : [])
    .map(entry => {
      const dateKey = normalizeManualBlockDateKey(typeof entry === 'string' ? entry : entry?.date);
      if (!dateKey) return null;

      const rawSourceId = typeof entry === 'string'
        ? 'homavia'
        : entry?.sourceId || getPlatformPriceKey(entry?.source || 'Homavia / Direct booking');
      const sourceOption = getManualBlockSourceOption(rawSourceId);
      const uniqueKey = `${dateKey}-${sourceOption.id}`;

      if (seen.has(uniqueKey)) return null;
      seen.add(uniqueKey);

      const note = typeof entry === 'string' ? '' : toPlainText(entry?.note || '');
      const units = typeof entry === 'string' ? 1 : getManualBlockUnitCount(entry);
      return {
        date: dateKey,
        sourceId: sourceOption.id,
        source: sourceOption.name,
        units,
        note
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date) || a.source.localeCompare(b.source));
};

const getManualBlockedCalendarDates = (manualBlockedDates = []) => {
  const dateMap = new Map();

  normalizeManualBlockedDates(manualBlockedDates).forEach(entry => {
    const date = getDateFromLocalKey(entry.date);
    if (!date) return;

    const existing = dateMap.get(entry.date);
    const summary = entry.note || entry.source;
    const units = getManualBlockUnitCount(entry);

    if (existing) {
      if (!existing.sources.includes(entry.source)) existing.sources.push(entry.source);
      existing.sourceCounts[entry.source] = (existing.sourceCounts[entry.source] || 0) + units;
      existing.totalBookings += units;
      if (summary && !existing.summaries.includes(summary)) existing.summaries.push(summary);
    } else {
      dateMap.set(entry.date, {
        key: entry.date,
        date,
        source: entry.source,
        sources: [entry.source],
        sourceCounts: { [entry.source]: units },
        totalBookings: units,
        summary,
        summaries: summary ? [summary] : [],
        manual: true
      });
    }
  });

  return Array.from(dateMap.values()).sort((a, b) => a.date - b.date);
};

const mergeBlockedDateLists = (...blockedDateLists) => {
  const dateMap = new Map();

  blockedDateLists.flat().filter(Boolean).forEach(blockedDate => {
    const key = blockedDate.key || normalizeManualBlockDateKey(blockedDate.date);
    const date = blockedDate.date instanceof Date ? blockedDate.date : getDateFromLocalKey(key);
    if (!key || !date) return;

    const existing = dateMap.get(key);
    const sources = blockedDate.sources?.length ? blockedDate.sources : [blockedDate.source || 'External calendar'];
    const sourceCounts = blockedDate.sourceCounts || sources.reduce((acc, source) => {
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});
    const summaries = blockedDate.summaries?.length
      ? blockedDate.summaries
      : [blockedDate.summary].filter(Boolean);

    if (!existing) {
      dateMap.set(key, {
        key,
        date,
        source: sources[0],
        sources: [...new Set(sources)],
        sourceCounts: { ...sourceCounts },
        totalBookings: Object.values(sourceCounts).reduce((sum, count) => sum + (Number(count) || 0), 0),
        summary: summaries[0] || 'Blocked',
        summaries: [...new Set(summaries)],
        manual: !!blockedDate.manual
      });
      return;
    }

    sources.forEach(source => {
      if (!existing.sources.includes(source)) existing.sources.push(source);
      existing.sourceCounts[source] = (existing.sourceCounts[source] || 0) + (Number(sourceCounts[source]) || 1);
    });

    summaries.forEach(summary => {
      if (summary && !existing.summaries.includes(summary)) existing.summaries.push(summary);
    });

    existing.totalBookings = Object.values(existing.sourceCounts).reduce((sum, count) => sum + (Number(count) || 0), 0);
    existing.manual = existing.manual || !!blockedDate.manual;
  });

  return Array.from(dateMap.values()).sort((a, b) => a.date - b.date);
};

const getDateKeysInStayRange = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) return [];

  const current = new Date(checkInDate);
  const checkout = new Date(checkOutDate);
  if (Number.isNaN(current.getTime()) || Number.isNaN(checkout.getTime()) || current >= checkout) return [];

  current.setHours(0, 0, 0, 0);
  checkout.setHours(0, 0, 0, 0);

  const keys = [];
  while (current < checkout) {
    keys.push(getLocalDateKey(current));
    current.setDate(current.getDate() + 1);
  }
  return keys;
};

const hasManualBlockOverlap = (manualBlockedDates, checkInDate, checkOutDate, totalUnits = 1) => {
  const unitCapacity = normalizeUnitCount(totalUnits);
  const blockedUnitsByDate = normalizeManualBlockedDates(manualBlockedDates).reduce((acc, entry) => {
    acc[entry.date] = (acc[entry.date] || 0) + getManualBlockUnitCount(entry);
    return acc;
  }, {});

  return getDateKeysInStayRange(checkInDate, checkOutDate).some(dateKey => (
    (blockedUnitsByDate[dateKey] || 0) >= unitCapacity
  ));
};

const getListingBlockedDates = async (listing) => {
  const manualDates = getManualBlockedCalendarDates(listing?.manualBlockedDates);
  const calendarLinks = normalizeListingCalendarLinks(listing?.calendarLinks, listing?.icalUrl);

  if (calendarLinks.length === 0) return manualDates;

  const settledCalendarDates = await Promise.allSettled(
    calendarLinks.map(link => fetchCalendarBlockedDates(link.url, link.source))
  );
  const successfulDates = settledCalendarDates
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value);

  if (successfulDates.length > 0 || manualDates.length > 0) {
    return mergeBlockedDateLists(successfulDates, manualDates);
  }

  const firstError = settledCalendarDates.find(result => result.status === 'rejected')?.reason;
  throw firstError || new Error('No booking sources could be read.');
};

const getCalendarEventDates = (event) => {
  const start = event.startDate?.toJSDate?.();
  if (!start) return [];

  const end = event.endDate?.toJSDate?.() || new Date(start);
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  const endExclusive = new Date(end);
  endExclusive.setHours(0, 0, 0, 0);

  const dates = [];
  while (current < endExclusive) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  if (dates.length === 0) {
    const singleDate = new Date(start);
    singleDate.setHours(0, 0, 0, 0);
    dates.push(singleDate);
  }

  return dates;
};

const fetchCalendarBlockedDates = async (icalUrl, sourceOverride = '') => {
  const response = await fetch(getCalendarFetchUrl(icalUrl));
  if (!response.ok) {
    throw new Error(`Calendar fetch failed: ${response.status}`);
  }

  const icsData = await response.text();
  const jcalData = ICAL.parse(icsData);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents('vevent');
  const dateMap = new Map();

  vevents.forEach(vevent => {
    const event = new ICAL.Event(vevent);
    const source = sourceOverride || getCalendarEventSourceName(vevent, icalUrl);
    const summary = event.summary || 'Blocked';

    getCalendarEventDates(event).forEach(date => {
      const key = getLocalDateKey(date);
      const existing = dateMap.get(key);

      if (existing) {
        if (!existing.sources.includes(source)) existing.sources.push(source);
        existing.sourceCounts[source] = (existing.sourceCounts[source] || 0) + 1;
        existing.totalBookings += 1;
        if (summary && !existing.summaries.includes(summary)) existing.summaries.push(summary);
      } else {
        dateMap.set(key, {
          key,
          date,
          source,
          sources: [source],
          sourceCounts: { [source]: 1 },
          totalBookings: 1,
          summary,
          summaries: summary ? [summary] : []
        });
      }
    });
  });

  return Array.from(dateMap.values()).sort((a, b) => a.date - b.date);
};

const getShortPlatformLabel = (source) => {
  const shortLabels = {
    'Booking.com': 'Booking',
    'Google Calendar': 'Google',
    'Homavia / Direct booking': 'Homavia',
    'MakeMyTrip': 'MMT',
    'Owner block / Maintenance': 'Owner',
    'Tripadvisor': 'Trip',
    'External calendar': 'External'
  };

  if (shortLabels[source]) return shortLabels[source];
  if (!source) return 'Blocked';

  const compact = String(source).replace(/^www\./, '').split('.')[0];
  return compact.length > 8 ? `${compact.slice(0, 8)}...` : compact;
};

const useIsDesktop = (breakpoint = 1024) => {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= breakpoint
  );

  useEffect(() => {
    const handleResize = () => {
      setMatches(typeof window !== 'undefined' && window.innerWidth >= breakpoint);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return matches;
};

/* ------------------------------
   Design System Tokens
------------------------------ */
const designTokens = {
  // Typography Scale (8pt base grid: 12, 14, 16, 18, 20, 24, 32, 40, 48)
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48
  },
  // Spacing Scale (4px base grid)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    '4xl': 64
  },
  // Border Radius
  radius: {
    sm: 6,
    md: 8,
    lg: 8,
    xl: 12,
    full: 9999
  },
  // Shadows (layered approach)
  shadow: {
    sm: '0 1px 2px rgba(15, 23, 42, 0.05)',
    md: '0 10px 24px rgba(15, 23, 42, 0.08)',
    lg: '0 18px 46px rgba(15, 23, 42, 0.12)',
    xl: '0 28px 70px rgba(15, 23, 42, 0.16)'
  },
  // Colors - Semantic tokens for consistency
  colors: {
    primary: '#B42318',
    primaryHover: '#8F1D16',
    primaryLight: '#FEE4E2',
    accent: '#0E7490',
    accentLight: '#CFFAFE',
    gold: '#B7791F',
    goldLight: '#FEF3C7',
    dark: '#101828',
    darkMuted: '#344054',
    text: '#182230',
    textMuted: '#667085',
    textLight: '#98A2B3',
    border: '#D0D5DD',
    borderLight: '#EAECF0',
    surface: '#F8FAFC',
    success: '#067647',
    successLight: '#DCFAE6',
    warning: '#B54708',
    warningLight: '#FEF0C7',
    error: '#B42318',
    errorLight: '#FEE4E2',
    background: '#F6F7F9',
    white: '#ffffff'
  }
};

/* ------------------------------
   Styles
------------------------------ */
const styles = {
  container: {
    maxWidth: '100%',
    width: '100%',
    margin: "0 auto",
    padding: "0",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: designTokens.colors.background,
    position: 'relative',
    overflowX: 'hidden'
  },
  mainContent: {
    maxWidth: '100%',
    margin: '0 auto',
    width: '100%',
    padding: '20px 16px 0',
    boxSizing: 'border-box',
    overflowX: 'hidden'
  },
  desktopWarning: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa'
  },
  warningIcon: {
    fontSize: 64,
    color: designTokens.colors.primary,
    marginBottom: 20
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333'
  },
  warningText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 1.6,
    maxWidth: 400,
    marginBottom: 24
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: `1px solid ${designTokens.colors.borderLight}`,
    marginBottom: 0,
    position: 'sticky',
    top: 0,
    backgroundColor: 'rgba(255,255,255,0.96)',
    zIndex: 100,
    boxShadow: '0 1px 0 rgba(16, 24, 40, 0.04)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    maxWidth: '100%',
    boxSizing: 'border-box'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    color: designTokens.colors.primary,
    fontWeight: 800,
    fontSize: 18,
    textDecoration: 'none',
    letterSpacing: 0,
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: designTokens.radius.md,
    backgroundColor: designTokens.colors.primary,
    color: designTokens.colors.white,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 22px rgba(180, 35, 24, 0.18)',
    flexShrink: 0
  },
  logoText: {
    color: designTokens.colors.dark,
    fontSize: 19,
    fontWeight: 800,
    letterSpacing: 0,
    lineHeight: 1
  },
  logo: {
    height: 40,
    borderRadius: 10,
    boxShadow: '0 10px 22px rgba(16, 24, 40, 0.12)',
    transition: 'transform 0.2s ease'
  },
  desktopNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flex: 1,
    minWidth: 0
  },
  desktopNavLink: {
    color: designTokens.colors.text,
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 14,
    padding: '9px 11px',
    borderRadius: designTokens.radius.md,
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease'
  },
  navLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  navLink: {
    color: designTokens.colors.dark,
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: 16,
    transition: 'color 0.2s',
    letterSpacing: 0
  },
  authButton: {
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    padding: `10px ${designTokens.spacing.lg}px`,
    borderRadius: designTokens.radius.md,
    border: `1px solid ${designTokens.colors.border}`,
    backgroundColor: designTokens.colors.white,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: designTokens.fontSize.sm,
    color: designTokens.colors.text,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: designTokens.shadow.sm,
    whiteSpace: 'nowrap'
  },
  btnPrimary: {
    background: designTokens.colors.primary,
    color: designTokens.colors.white,
    border: 'none',
    boxShadow: designTokens.shadow.md,
    fontWeight: 600
  },
  heroShell: {
    minHeight: 360,
    borderRadius: designTokens.radius.xl,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: designTokens.spacing.xl,
    backgroundColor: designTokens.colors.dark,
    boxShadow: designTokens.shadow.lg,
    isolation: 'isolate'
  },
  heroImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, rgba(16, 24, 40, 0.86) 0%, rgba(16, 24, 40, 0.62) 46%, rgba(16, 24, 40, 0.14) 100%)'
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    minHeight: 360,
    maxWidth: 720,
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    color: designTokens.colors.white
  },
  heroEyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    width: 'fit-content',
    margin: '0 0 16px',
    padding: '8px 12px',
    borderRadius: designTokens.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    border: '1px solid rgba(255, 255, 255, 0.22)',
    color: '#F9FAFB',
    fontSize: designTokens.fontSize.xs,
    fontWeight: 700,
    letterSpacing: 0,
    textTransform: 'uppercase'
  },
  heroTitle: {
    margin: 0,
    maxWidth: 640,
    color: designTokens.colors.white,
    fontSize: 44,
    lineHeight: 1.08,
    fontWeight: 800,
    letterSpacing: 0
  },
  heroSubtitle: {
    margin: '18px 0 0',
    maxWidth: 580,
    color: '#E4E7EC',
    fontSize: designTokens.fontSize.base,
    lineHeight: 1.7
  },
  heroStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
    marginTop: 28,
    maxWidth: 620
  },
  heroStat: {
    padding: '14px 16px',
    borderRadius: designTokens.radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)'
  },
  heroStatValue: {
    margin: 0,
    color: designTokens.colors.white,
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1.1
  },
  heroStatLabel: {
    margin: '6px 0 0',
    color: '#D0D5DD',
    fontSize: 12,
    lineHeight: 1.4
  },
  homestayList: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: designTokens.spacing.xl,
    padding: 0,
    listStyle: 'none',
    marginTop: designTokens.spacing.lg,
    animation: 'fadeIn 0.5s ease',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflowX: 'hidden'
  },
  homestayItem: {
    borderRadius: designTokens.radius.lg,
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.06)',
    backgroundColor: designTokens.colors.white,
    cursor: 'pointer',
    position: 'relative',
    border: `1px solid ${designTokens.colors.borderLight}`,
    minWidth: 0
  },
  homestayImage: {
    width: '100%',
    height: 230,
    objectFit: 'cover',
    borderRadius: '0',
    marginBottom: 0,
    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: designTokens.colors.borderLight,
    display: 'block'
  },
  homestayInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '18px 20px 20px'
  },
  price: {
    fontWeight: 800,
    fontSize: designTokens.fontSize.lg,
    color: designTokens.colors.primary,
    letterSpacing: 0
  },
  title: {
    fontWeight: 700,
    fontSize: designTokens.fontSize.base,
    color: designTokens.colors.text,
    letterSpacing: 0,
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
  },
  location: {
    color: designTokens.colors.textMuted,
    fontSize: designTokens.fontSize.sm,
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
    letterSpacing: 0
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 13,
    fontWeight: 700,
    color: designTokens.colors.dark,
    whiteSpace: 'nowrap'
  },
  filterSummaryCard: {
    background: designTokens.colors.white,
    borderRadius: designTokens.radius.lg,
    padding: '18px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.lg,
    boxShadow: designTokens.shadow.sm,
    border: `1px solid ${designTokens.colors.borderLight}`,
    flexWrap: 'wrap'
  },
  sectionEyebrow: {
    fontSize: designTokens.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0,
    color: designTokens.colors.textLight,
    marginBottom: designTokens.spacing.xs,
    fontWeight: 700
  },
  summaryTitle: {
    fontSize: designTokens.fontSize.base,
    fontWeight: 700,
    margin: 0,
    color: designTokens.colors.dark
  },
  summarySubtext: {
    fontSize: designTokens.fontSize.sm,
    color: designTokens.colors.textMuted,
    marginTop: designTokens.spacing.xs
  },
  summaryActions: {
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing.md,
    flexWrap: 'wrap'
  },
  summaryToggleBtn: {
    padding: `${designTokens.spacing.md}px ${designTokens.spacing.lg}px`,
    borderRadius: designTokens.radius.full,
    border: 'none',
    background: designTokens.colors.dark,
    color: designTokens.colors.white,
    fontSize: designTokens.fontSize.sm,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    transition: 'all 0.2s',
    boxShadow: designTokens.shadow.md
  },
  resetFiltersBtn: {
    padding: `${designTokens.spacing.sm}px ${designTokens.spacing.md}px`,
    borderRadius: designTokens.radius.full,
    border: 'none',
    backgroundColor: 'transparent',
    color: designTokens.colors.accent,
    fontSize: designTokens.fontSize.sm,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  filterSectionWrapper: {
    marginBottom: designTokens.spacing.lg,
    animation: 'slideDown 0.3s ease-out'
  },
  filterCard: {
    background: designTokens.colors.white,
    borderRadius: designTokens.radius.lg,
    padding: designTokens.spacing.xl,
    boxShadow: designTokens.shadow.md,
    border: `1px solid ${designTokens.colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: designTokens.spacing.md
  },
  filterSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: designTokens.spacing.sm
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: designTokens.spacing.md,
    marginTop: designTokens.spacing.sm
  },
  filterPillsWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: designTokens.spacing.sm
  },
  filterPill: {
    padding: `${designTokens.spacing.sm}px ${designTokens.spacing.md}px`,
    borderRadius: designTokens.radius.md,
    border: `1px solid ${designTokens.colors.border}`,
    backgroundColor: designTokens.colors.white,
    cursor: 'pointer',
    minWidth: 0,
    flex: '0 0 auto',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  filterPillActive: {
    background: designTokens.colors.dark,
    color: designTokens.colors.white,
    borderColor: designTokens.colors.dark,
    boxShadow: designTokens.shadow.sm
  },
  filterPillLabel: {
    fontSize: designTokens.fontSize.xs,
    fontWeight: 600
  },
  filterPillHelper: {
    fontSize: 11,
    color: 'inherit',
    opacity: 0.8
  },
  filterDivider: {
    height: 1,
    width: '100%',
    backgroundColor: designTokens.colors.borderLight,
    margin: `${designTokens.spacing.xs}px 0`
  },
  advancedToggle: {
    padding: `${designTokens.spacing.sm}px ${designTokens.spacing.md}px`,
    borderRadius: designTokens.radius.sm,
    border: `1px solid ${designTokens.colors.border}`,
    backgroundColor: designTokens.colors.surface,
    fontSize: designTokens.fontSize.xs,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
    width: 'fit-content',
    transition: 'all 0.2s'
  },
  advancedFilterGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: designTokens.spacing.md
  },
  filterFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: designTokens.spacing.md,
    marginTop: designTokens.spacing.sm
  },
  filterFooterText: {
    fontSize: designTokens.fontSize.sm,
    color: designTokens.colors.textMuted
  },
  filterFooterActions: {
    display: 'flex',
    gap: designTokens.spacing.sm
  },
  locationDropdown: {
    padding: '12px 14px',
    borderRadius: designTokens.radius.md,
    border: `1px solid ${designTokens.colors.border}`,
    fontSize: 14,
    width: '100%',
    marginBottom: 12,
    backgroundColor: designTokens.colors.white,
    color: designTokens.colors.text,
    cursor: 'pointer'
  },
  formContainer: {
    maxWidth: '1120px',
    width: '100%',
    margin: '0 auto',
    padding: '34px 20px 56px',
    boxSizing: 'border-box'
  },
  formTitle: {
    fontSize: 34,
    fontWeight: 850,
    marginBottom: 14,
    color: designTokens.colors.dark,
    letterSpacing: 0,
    lineHeight: 1.14
  },
  formSection: {
    marginBottom: 20,
    padding: 24,
    backgroundColor: designTokens.colors.white,
    border: `1px solid ${designTokens.colors.borderLight}`,
    borderRadius: designTokens.radius.lg,
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.06)'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 800,
    marginBottom: 18,
    color: designTokens.colors.dark,
    letterSpacing: 0
  },
  inputGroup: {
    marginBottom: 18
  },
  label: {
    display: 'block',
    marginBottom: designTokens.spacing.sm,
    fontWeight: 600,
    fontSize: designTokens.fontSize.sm,
    color: designTokens.colors.text,
    letterSpacing: 0
  },
  input: {
    width: '100%',
    minHeight: 48,
    padding: `${designTokens.spacing.md}px ${designTokens.spacing.lg}px`,
    borderRadius: designTokens.radius.md,
    border: `1px solid ${designTokens.colors.border}`,
    fontSize: designTokens.fontSize.sm,
    color: designTokens.colors.text,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
    fontFamily: 'inherit',
    backgroundColor: designTokens.colors.white,
    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
  },
  textarea: {
    width: '100%',
    padding: `${designTokens.spacing.lg}px ${designTokens.spacing.lg}px`,
    borderRadius: designTokens.radius.md,
    border: `1px solid ${designTokens.colors.border}`,
    fontSize: designTokens.fontSize.sm,
    color: designTokens.colors.text,
    minHeight: 124,
    resize: 'vertical',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
    fontFamily: 'inherit',
    lineHeight: 1.6,
    backgroundColor: designTokens.colors.white,
    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
  },
  checkboxGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: designTokens.spacing.md,
    marginTop: designTokens.spacing.md
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    padding: '12px 14px',
    borderRadius: designTokens.radius.md,
    border: `1px solid ${designTokens.colors.borderLight}`,
    backgroundColor: designTokens.colors.surface,
    color: designTokens.colors.text,
    fontSize: designTokens.fontSize.sm,
    fontWeight: 600
  },
  imagePreview: {
    width: '100%',
    maxHeight: 300,
    objectFit: 'cover',
    borderRadius: designTokens.radius.md,
    marginTop: designTokens.spacing.lg
  },
  submitButton: {
    background: designTokens.colors.primary,
    color: designTokens.colors.white,
    border: 'none',
    padding: `${designTokens.spacing.lg}px ${designTokens.spacing['2xl']}px`,
    borderRadius: designTokens.radius.md,
    fontSize: designTokens.fontSize.base,
    fontWeight: 800,
    cursor: 'pointer',
    marginTop: designTokens.spacing.lg,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    width: '100%',
    minHeight: 52,
    boxShadow: designTokens.shadow.md,
    letterSpacing: 0
  },
  detailContainer: {
    maxWidth: '1240px',
    width: '100%',
    margin: '0 auto',
    padding: `${designTokens.spacing.xl}px 0 ${designTokens.spacing['3xl']}px`,
    boxSizing: 'border-box'
  },
  detailHeader: {
    marginBottom: designTokens.spacing['2xl'],
    paddingBottom: designTokens.spacing.xl,
    borderBottom: `1px solid ${designTokens.colors.borderLight}`
  },
  detailTitle: {
    fontSize: designTokens.fontSize['3xl'],
    fontWeight: 800,
    marginBottom: designTokens.spacing.lg,
    color: designTokens.colors.dark,
    lineHeight: 1.3,
    letterSpacing: 0
  },
  detailLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    color: designTokens.colors.textMuted,
    fontSize: designTokens.fontSize.base,
    marginBottom: designTokens.spacing.lg
  },
  detailImage: {
    width: '100%',
    borderRadius: designTokens.radius.xl,
    marginBottom: designTokens.spacing['2xl'],
    maxHeight: 500,
    aspectRatio: '16 / 10',
    objectFit: 'cover',
    boxShadow: designTokens.shadow.lg
  },
  detailInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: designTokens.spacing['2xl'],
    marginTop: designTokens.spacing['2xl']
  },
  detailGridMobile: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 28,
    alignItems: 'start'
  },
  detailGridDesktop: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 380px',
    gap: 32,
    alignItems: 'start'
  },
  detailMain: {
    minWidth: 0
  },
  detailAmenities: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: designTokens.spacing.lg,
    marginTop: designTokens.spacing.xl
  },
  amenityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing.md,
    padding: `${designTokens.spacing.md}px ${designTokens.spacing.lg}px`,
    backgroundColor: designTokens.colors.white,
    border: `1px solid ${designTokens.colors.borderLight}`,
    borderRadius: designTokens.radius.md,
    fontSize: designTokens.fontSize.base
  },
  bookingCard: {
    border: `1px solid ${designTokens.colors.borderLight}`,
    borderRadius: designTokens.radius.lg,
    padding: 28,
    boxShadow: designTokens.shadow.lg,
    order: -1,
    backgroundColor: '#fff',
    position: 'sticky',
    top: 90
  },
  priceDetail: {
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 20,
    color: designTokens.colors.primary
  },
  priceTypeLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'normal',
    marginLeft: 4
  },
  additionalPricing: {
    backgroundColor: designTokens.colors.surface,
    padding: 12,
    borderRadius: designTokens.radius.md,
    marginTop: 12,
    fontSize: 13
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottom: '1px solid #e0e0e0'
  },
  bookButton: {
    width: '100%',
    padding: `${designTokens.spacing.md}px ${designTokens.spacing.xl}px`,
    background: designTokens.colors.primary,
    color: designTokens.colors.white,
    border: 'none',
    borderRadius: designTokens.radius.md,
    fontSize: designTokens.fontSize.base,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.sm,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    minHeight: 44,
    boxShadow: designTokens.shadow.sm,
    letterSpacing: 0,
    boxSizing: 'border-box'
  },
  callButton: {
    width: '100%',
    padding: `${designTokens.spacing.md}px ${designTokens.spacing.xl}px`,
    background: designTokens.colors.success,
    color: designTokens.colors.white,
    border: 'none',
    borderRadius: designTokens.radius.md,
    fontSize: designTokens.fontSize.base,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: designTokens.spacing.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.sm,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    textDecoration: 'none',
    minHeight: 44,
    boxShadow: designTokens.shadow.sm,
    letterSpacing: 0,
    boxSizing: 'border-box'
  },
  whatsappButton: {
    width: '100%',
    padding: `${designTokens.spacing.md}px ${designTokens.spacing.xl}px`,
    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
    color: designTokens.colors.white,
    border: 'none',
    borderRadius: designTokens.radius.md,
    fontSize: designTokens.fontSize.base,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: designTokens.spacing.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.sm,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    textDecoration: 'none',
    minHeight: 44,
    boxShadow: designTokens.shadow.sm,
    letterSpacing: 0,
    boxSizing: 'border-box'
  },
  buttonGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: designTokens.spacing.sm,
    marginTop: designTokens.spacing.md
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 18,
    padding: '14px',
    background: designTokens.colors.white,
    borderRadius: designTokens.radius.lg,
    border: `1px solid ${designTokens.colors.border}`,
    boxShadow: designTokens.shadow.md
  },
  searchInput: {
    flex: 1,
    padding: '14px 16px',
    borderRadius: designTokens.radius.md,
    border: `1px solid ${designTokens.colors.border}`,
    fontSize: 15,
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.2s',
    backgroundColor: designTokens.colors.surface,
    fontWeight: 500
  },
  searchButton: {
    padding: '14px 24px',
    borderRadius: designTokens.radius.md,
    border: 'none',
    background: designTokens.colors.primary,
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontSize: 15,
    fontWeight: 600,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    minHeight: 48,
    whiteSpace: 'nowrap',
    boxShadow: '0 12px 24px rgba(180, 35, 24, 0.22)'
  },
  premiumBadge: {
    backgroundColor: designTokens.colors.goldLight,
    color: '#7A4E0A',
    padding: '4px 8px',
    borderRadius: designTokens.radius.sm,
    fontSize: 11,
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    marginLeft: 8
  },
  pageContainer: {
    maxWidth: '1240px',
    width: '100%',
    margin: '0 auto',
    padding: '44px 20px 60px',
    boxSizing: 'border-box'
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: 850,
    marginBottom: 26,
    textAlign: 'left',
    color: designTokens.colors.dark,
    letterSpacing: 0
  },
  pageContent: {
    lineHeight: 1.8,
    fontSize: 16,
    maxWidth: '960px',
    margin: '0 auto',
    color: designTokens.colors.text,
    backgroundColor: designTokens.colors.white,
    border: `1px solid ${designTokens.colors.borderLight}`,
    borderRadius: designTokens.radius.lg,
    padding: 28,
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.06)'
  },
  teamContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 24,
    marginTop: 32
  },
  teamMember: {
    textAlign: 'center'
  },
  memberImage: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    objectFit: 'cover',
    margin: '0 auto 12px',
    border: `3px solid ${designTokens.colors.primary}`
  },
  contactForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginTop: 24
  },
  contactInput: {
    padding: '12px 15px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 16,
    width: '100%',
    boxSizing: 'border-box'
  },
  featureList: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 20,
    marginTop: 32
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: designTokens.radius.lg,
    padding: 32,
    boxShadow: designTokens.shadow.sm,
    textAlign: 'center',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: `1px solid ${designTokens.colors.borderLight}`
  },
  featureIcon: {
    fontSize: 44,
    color: designTokens.colors.primary,
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'center'
  },
  footer: {
    background: designTokens.colors.dark,
    padding: '48px 0 24px',
    marginTop: 'auto',
    borderTop: 'none'
  },
  footerContainer: {
    maxWidth: '1240px',
    width: '100%',
    margin: '0 auto',
    padding: '0 20px',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 40,
    boxSizing: 'border-box'
  },
  footerColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 16,
    color: '#fff',
    letterSpacing: 0,
    textTransform: 'uppercase'
  },
  footerLink: {
    color: '#9ca3af',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    transition: 'all 0.2s',
    padding: '5px 0'
  },
  copyright: {
    textAlign: 'center',
    paddingTop: 32,
    color: '#6b7280',
    borderTop: '1px solid #374151',
    marginTop: 32,
    fontSize: 13,
    letterSpacing: 0,
    maxWidth: '1240px',
    margin: '32px auto 0',
    padding: '24px 20px 0'
  },
  testimonialContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    paddingBottom: 20,
    marginTop: 32
  },
  testimonialCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  testimonialText: {
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 1.6
  },
  testimonialAuthor: {
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  premiumBanner: {
    backgroundColor: designTokens.colors.white,
    border: `1px solid ${designTokens.colors.borderLight}`,
    borderRadius: 8,
    padding: 18,
    margin: '0 0 20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.06)'
  },
  hamburgerButton: {
    display: 'block',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: 26,
    cursor: 'pointer',
    padding: 8,
    color: '#222',
    transition: 'all 0.2s',
    borderRadius: 8
  },
  mobileMenu: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '85%',
    maxWidth: '400px',
    height: '100vh',
    backgroundColor: 'white',
    zIndex: 1000,
    padding: 24,
    boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
    transform: 'translateX(100%)',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflowY: 'auto'
  },
  mobileMenuOpen: {
    transform: 'translateX(0)'
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8
  },
  mobileNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    marginTop: 60
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 999,
    display: 'none',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
    transition: 'opacity 0.3s ease'
  },
  overlayVisible: {
    display: 'block'
  },
  cityDropdown: {
    padding: '12px 14px',
    borderRadius: designTokens.radius.md,
    border: `1px solid ${designTokens.colors.border}`,
    fontSize: 14,
    width: '100%',
    marginBottom: 12,
    backgroundColor: designTokens.colors.white,
    color: designTokens.colors.text,
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  datePickerContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    background: 'white',
    padding: '16px',
    borderRadius: 12,
    border: '1px solid #e0e0e0',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
  },
  dateInput: {
    padding: '12px 14px',
    borderRadius: 10,
    border: '1.5px solid #e0e0e0',
    fontSize: 14,
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    fontWeight: 500,
    transition: 'all 0.2s',
    color: '#222'
  },
  calendarContainer: {
    marginTop: 12,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    border: '1px solid #e0e0e0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
  },
  calendarPopup: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
    zIndex: 1000,
    overflow: 'hidden',
    border: '1px solid #e0e0e0',
    animation: 'slideDown 0.2s ease-out'
  },
  reactCalendar: {
    width: '100%',
    border: 'none',
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'white',
    fontFamily: "'Inter', -apple-system, sans-serif",
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },
  availabilityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: designTokens.colors.success,
    color: 'white',
    padding: '6px 12px',
    borderRadius: designTokens.radius.full,
    fontSize: 11,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    boxShadow: '0 8px 20px rgba(6, 118, 71, 0.24)',
    letterSpacing: 0
  },
  unavailableBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: designTokens.colors.error,
    color: 'white',
    padding: '6px 12px',
    borderRadius: designTokens.radius.full,
    fontSize: 11,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    boxShadow: '0 8px 20px rgba(180, 35, 24, 0.24)',
    letterSpacing: 0
  },
  clearDatesButton: {
    padding: '10px 16px',
    borderRadius: 12,
    border: '1.5px solid #e0e0e0',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    color: '#666',
    transition: 'all 0.2s'
  },
  toggleCalendarButton: {
    padding: '12px 18px',
    borderRadius: 12,
    border: `1px solid ${designTokens.colors.primary}`,
    backgroundColor: 'white',
    color: designTokens.colors.primary,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    transition: 'all 0.2s',
    boxShadow: '0 8px 18px rgba(180, 35, 24, 0.12)'
  },
  locationButton: {
    padding: '14px 20px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: '#3b82f6',
    color: 'white',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
    minHeight: 48
  },
  mapContainer: {
    height: '420px',
    width: '100%',
    borderRadius: designTokens.radius.lg,
    overflow: 'hidden',
    marginBottom: 20,
    border: `1px solid ${designTokens.colors.border}`
  },
  // Loader styles
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    minHeight: '400px'
  },
  spinner: {
    width: 50,
    height: 50,
    border: '4px solid #f3f4f6',
    borderTop: `4px solid ${designTokens.colors.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loaderText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: 500
  },
  loaderSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af'
  },
  viewToggleContainer: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
    backgroundColor: designTokens.colors.white,
    padding: 8,
    borderRadius: designTokens.radius.lg,
    border: `1px solid ${designTokens.colors.borderLight}`,
    boxShadow: designTokens.shadow.sm
  },
  viewToggleButton: {
    flex: 1,
    padding: '10px 15px',
    borderRadius: designTokens.radius.md,
    border: 'none',
    backgroundColor: 'transparent',
    color: designTokens.colors.textMuted,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.2s'
  },
  viewToggleButtonActive: {
    backgroundColor: designTokens.colors.dark,
    color: designTokens.colors.white,
    boxShadow: designTokens.shadow.sm
  }
};

/* ------------------------------
   iCal Availability Helper
------------------------------ */
const fetchAndCheckAvailability = async (listingOrIcalUrl, checkInDate, checkOutDate, manualBlockedDates = []) => {
  if (!checkInDate || !checkOutDate) {
    console.log('Missing date parameters:', { checkInDate, checkOutDate });
    return 'unknown';
  }

  const listing = typeof listingOrIcalUrl === 'object' && listingOrIcalUrl !== null ? listingOrIcalUrl : null;
  const listingManualBlocks = listing ? listing.manualBlockedDates : manualBlockedDates;
  const calendarLinks = listing
    ? normalizeListingCalendarLinks(listing.calendarLinks, listing.icalUrl)
    : normalizeListingCalendarLinks([], listingOrIcalUrl);

  if (hasManualBlockOverlap(listingManualBlocks, checkInDate, checkOutDate, listing ? getListingUnitCount(listing) : 1)) {
    return 'unavailable';
  }

  if (calendarLinks.length === 0) return 'available';
  
  try {
    const requestedKeys = new Set(getDateKeysInStayRange(checkInDate, checkOutDate));
    let readAnyCalendar = false;

    for (const calendarLink of calendarLinks) {
      try {
        const blockedDates = await fetchCalendarBlockedDates(calendarLink.url, calendarLink.source);
        readAnyCalendar = true;
        if (blockedDates.some(blockedDate => requestedKeys.has(blockedDate.key))) {
          return 'unavailable';
        }
      } catch (calendarError) {
        console.error('Error checking calendar link:', calendarLink.source, calendarError);
      }
    }
    
    return readAnyCalendar ? 'available' : 'unknown';
  } catch (error) {
    console.error('Error checking availability:', error);
    return 'unknown';
  }
};

function PlatformPricingFields({ form, setForm }) {
  const handlePlatformPriceChange = (platformId, value) => {
    setForm(prev => {
      const platformPrices = { ...(prev.platformPrices || {}) };
      if (value && !isNaN(value) && Number(value) > 0) {
        platformPrices[platformId] = value;
      } else {
        delete platformPrices[platformId];
      }
      return { ...prev, platformPrices };
    });
  };

  return (
    <div style={styles.formSection}>
      <h2 style={styles.sectionTitle}>Revenue Settings</h2>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
        Used for monthly revenue estimates from platform calendar links and portal blocked dates.
      </p>

      <div style={styles.formGrid} className="form-grid">
        <div style={styles.inputGroup}>
          <label style={styles.label}>Units / Rooms *</label>
          <input
            style={styles.input}
            type="number"
            min="1"
            value={form.unitCount}
            onChange={(e) => setForm(prev => ({ ...prev, unitCount: e.target.value }))}
            required
            placeholder="Example: 1"
          />
          <small style={{ color: '#666' }}>
            Revenue uses blocked dates multiplied by this unit count.
          </small>
        </div>
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Platform-wise Price (₹)</label>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
          Leave a platform blank to use the primary listing price.
        </p>
        <div className="platform-price-grid">
          {PLATFORM_PRICE_OPTIONS.map(platform => (
            <div key={platform.id} className="platform-price-field">
              <label style={{ ...styles.label, fontSize: 12, color: '#666' }}>
                {platform.name}
              </label>
              <input
                style={styles.input}
                type="number"
                min="0"
                value={(form.platformPrices || {})[platform.id] || ''}
                onChange={(e) => handlePlatformPriceChange(platform.id, e.target.value)}
                placeholder={`₹${form.price || '0'}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarLinksFields({ form, setForm }) {
  const editableLinks = getEditableCalendarLinks(form);

  const updateLinks = (nextLinks) => {
    const firstUrl = nextLinks.find(link => link.url)?.url || '';
    setForm(prev => ({
      ...prev,
      calendarLinks: nextLinks,
      icalUrl: firstUrl
    }));
  };

  const handleAddLink = () => {
    updateLinks([
      ...editableLinks,
      { sourceId: 'airbnb', source: 'Airbnb', url: '' }
    ]);
  };

  const handleChangeLink = (index, field, value) => {
    const nextLinks = editableLinks.map((link, currentIndex) => {
      if (currentIndex !== index) return link;

      if (field === 'sourceId') {
        const sourceOption = getCalendarLinkSourceOption(value);
        return {
          ...link,
          sourceId: sourceOption.id,
          source: sourceOption.name
        };
      }

      return { ...link, [field]: value };
    });

    updateLinks(nextLinks);
  };

  const handleRemoveLink = (index) => {
    updateLinks(editableLinks.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div style={styles.formSection}>
      <h2 style={styles.sectionTitle}>Platform Calendar Links</h2>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
        Add one iCal link per platform so blocked dates and revenue are attributed correctly.
      </p>

      <div className="calendar-link-list">
        {editableLinks.length === 0 ? (
          <div className="calendar-link-empty">
            No external calendars connected. You can still block dates manually from the Homavia portal below.
          </div>
        ) : (
          editableLinks.map((link, index) => {
            const sourceOption = getCalendarLinkSourceOption(link.sourceId || getPlatformPriceKey(link.source));
            return (
              <div key={`${index}-${sourceOption.id}`} className="calendar-link-row">
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Platform</label>
                  <select
                    style={styles.input}
                    value={sourceOption.id}
                    onChange={(e) => handleChangeLink(index, 'sourceId', e.target.value)}
                  >
                    {CALENDAR_LINK_SOURCE_OPTIONS.map(option => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>iCal URL</label>
                  <input
                    style={styles.input}
                    type="url"
                    placeholder="https://.../calendar.ics or webcal://..."
                    value={link.url || ''}
                    onChange={(e) => handleChangeLink(index, 'url', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="calendar-link-remove"
                  onClick={() => handleRemoveLink(index)}
                  aria-label={`Remove ${sourceOption.name} calendar link`}
                >
                  <FiX size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <button type="button" className="calendar-link-add" onClick={handleAddLink}>
        <FiCalendar size={16} /> Add Calendar Link
      </button>
    </div>
  );
}

function ManualBlockedDatesFields({ form, setForm }) {
  const [selectedSourceId, setSelectedSourceId] = useState('homavia');
  const [blockNote, setBlockNote] = useState('');
  const [blockUnitCount, setBlockUnitCount] = useState(1);
  const totalListingUnits = normalizeUnitCount(form.unitCount);
  const manualBlocks = useMemo(
    () => normalizeManualBlockedDates(form.manualBlockedDates),
    [form.manualBlockedDates]
  );
  const totalBlockedUnits = manualBlocks.reduce((sum, block) => sum + getManualBlockUnitCount(block), 0);
  const blockMap = useMemo(() => {
    return manualBlocks.reduce((acc, block) => {
      if (!acc[block.date]) acc[block.date] = [];
      acc[block.date].push(block);
      return acc;
    }, {});
  }, [manualBlocks]);

  const updateManualBlocks = (nextBlocks) => {
    setForm(prev => ({
      ...prev,
      manualBlockedDates: normalizeManualBlockedDates(nextBlocks)
    }));
  };

  const handleToggleDate = (date) => {
    const dateKey = getLocalDateKey(date);
    const existingIndex = manualBlocks.findIndex(block =>
      block.date === dateKey && block.sourceId === selectedSourceId
    );

    if (existingIndex >= 0) {
      updateManualBlocks(manualBlocks.filter((_, index) => index !== existingIndex));
      return;
    }

    const sourceOption = getManualBlockSourceOption(selectedSourceId);
    const units = Math.min(normalizeUnitCount(blockUnitCount), totalListingUnits);
    updateManualBlocks([
      ...manualBlocks,
      {
        date: dateKey,
        sourceId: sourceOption.id,
        source: sourceOption.name,
        units,
        note: blockNote.trim()
      }
    ]);
  };

  const handleRemoveBlock = (date, sourceId) => {
    updateManualBlocks(manualBlocks.filter(block => !(block.date === date && block.sourceId === sourceId)));
  };

  return (
    <div style={styles.formSection}>
      <h2 style={styles.sectionTitle}>Portal Date Blocking</h2>
      <div className="manual-block-panel">
        <div className="manual-block-controls">
          <div style={styles.inputGroup}>
            <label style={styles.label}>Block Source</label>
            <select
              style={styles.input}
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
            >
              {MANUAL_BLOCK_SOURCE_OPTIONS.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Internal Note</label>
            <input
              style={styles.input}
              value={blockNote}
              onChange={(e) => setBlockNote(e.target.value)}
              placeholder="Direct booking, maintenance, owner stay..."
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Rooms to Block</label>
            <input
              style={styles.input}
              type="number"
              min="1"
              max={totalListingUnits}
              value={blockUnitCount}
              onChange={(e) => setBlockUnitCount(e.target.value)}
            />
          </div>
        </div>

        <div className="manual-block-calendar-shell">
          <Calendar
            className="professional-calendar manual-block-calendar"
            onClickDay={handleToggleDate}
            tileClassName={({ date, view }) => {
              if (view !== 'month') return null;
              const dateBlocks = blockMap[getLocalDateKey(date)];
              return dateBlocks?.length ? 'portal-block-date' : null;
            }}
            tileContent={({ date, view }) => {
              if (view !== 'month') return null;
              const dateBlocks = blockMap[getLocalDateKey(date)];
              if (!dateBlocks?.length) return null;

              const primaryBlock = dateBlocks[0];
              return (
                <span
                  className="calendar-platform-pill"
                  title={dateBlocks.map(block => block.source).join(', ')}
                >
                  {getShortPlatformLabel(primaryBlock.source)}
                </span>
              );
            }}
          />
        </div>

        <div className="manual-block-footer">
          <div>
            <strong>{totalBlockedUnits}</strong>
            <span>{totalBlockedUnits === 1 ? ' room blocked' : ' rooms blocked'} across {manualBlocks.length} date source{manualBlocks.length === 1 ? '' : 's'}</span>
          </div>
          {manualBlocks.length > 0 && (
            <button type="button" className="manual-block-clear" onClick={() => updateManualBlocks([])}>
              Clear all
            </button>
          )}
        </div>

        {manualBlocks.length > 0 && (
          <div className="manual-block-list">
            {manualBlocks.map(block => (
              <div key={`${block.date}-${block.sourceId}`} className="manual-block-row">
                <div>
                  <strong>{getDateFromLocalKey(block.date)?.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}</strong>
                  <span>
                    {block.source} • {getManualBlockUnitCount(block)} {getManualBlockUnitCount(block) === 1 ? 'room' : 'rooms'}
                    {block.note ? ` - ${block.note}` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveBlock(block.date, block.sourceId)}
                  aria-label={`Remove blocked date ${block.date}`}
                >
                  <FiX size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BrandLogo({ compact = false }) {
  return (
    <>
      <img src={logo} alt="Homavia" style={styles.logo} />
    </>
  );
}

/* ------------------------------
   Homestay Listing
------------------------------ */
function HomestayListing({ homestays, loading = false }) {
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedArea, setSelectedArea] = useState("All");
  const [coupleFriendlyOnly, setCoupleFriendlyOnly] = useState(false);
  const [hourlyOnly, setHourlyOnly] = useState(false);
  const [roomType, setRoomType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'map'
  const [showFilters, setShowFilters] = useState(false); // Filter expand/collapse
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(null);
  
  // Initialize with today's date
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [checkInDate, setCheckInDate] = useState(getTodayDate());
  const [checkOutDate, setCheckOutDate] = useState(getTomorrowDate());
  const [availabilityStatus, setAvailabilityStatus] = useState({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all', 'available', 'booked'
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cityParam = params.get("city");
    const areaParam = params.get("area");
    const searchParam = params.get("search");

    if (cityParam && ALL_CITIES.includes(cityParam)) {
      setSelectedCity(cityParam);

      if (areaParam && AREAS_BY_CITY[cityParam]?.includes(areaParam)) {
        setSelectedArea(areaParam);
      }
    }

    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, []);

  // Check availability for all homestays with iCal URLs when dates are selected
  useEffect(() => {
    const checkAvailability = async () => {
      if (!checkInDate || !checkOutDate) {
        setAvailabilityStatus({});
        return;
      }

      if (new Date(checkInDate) >= new Date(checkOutDate)) {
        return;
      }

      setCheckingAvailability(true);
      const statuses = {};

      for (const homestay of homestays) {
        const status = await fetchAndCheckAvailability(
          homestay,
          checkInDate,
          checkOutDate
        );
        statuses[homestay.id] = status;
      }

      setAvailabilityStatus(statuses);
      setCheckingAvailability(false);
    };

    checkAvailability();
  }, [checkInDate, checkOutDate, homestays]);

  const filteredHomestays = homestays.filter(homestay => {
    const matchesCity = selectedCity === "All" || homestay.city === selectedCity;
    const matchesArea = selectedArea === "All" || homestay.area === selectedArea;
    const matchesCoupleFriendly = !coupleFriendlyOnly || homestay.coupleFriendly;
    const matchesHourly = !hourlyOnly || homestay.hourly;
    const matchesRoomType = roomType === "All" || homestay.roomType === roomType;
    const matchesSearch =
      (homestay.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (homestay.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (homestay.area || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (homestay.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by availability if enabled
    const availability = availabilityStatus[homestay.id];
    let matchesAvailability = true;
    if (checkInDate && checkOutDate) {
      if (availabilityFilter === 'available') {
        matchesAvailability = availability === 'available' || availability === 'unknown';
      } else if (availabilityFilter === 'booked') {
        matchesAvailability = availability === 'unavailable';
      }
      // 'all' shows everything
    }

    return (
      matchesCity &&
      matchesArea &&
      matchesCoupleFriendly &&
      matchesHourly &&
      matchesRoomType &&
      matchesAvailability &&
      (searchQuery === "" || matchesSearch)
    );
  });

  // Sort homestays: available first, then unknown, then unavailable
  const sortedHomestays = [...filteredHomestays].sort((a, b) => {
    if (!checkInDate || !checkOutDate) return 0;

    const statusA = availabilityStatus[a.id] || 'unknown';
    const statusB = availabilityStatus[b.id] || 'unknown';

    const priority = { 'available': 0, 'unknown': 1, 'unavailable': 2 };
    return priority[statusA] - priority[statusB];
  });

  const availableAreas = selectedCity === "All" ? [] : AREAS_BY_CITY[selectedCity] || [];

  const clearDates = () => {
    setCheckInDate("");
    setCheckOutDate("");
    setAvailabilityStatus({});
    setShowAvailableOnly(false);
  };

  const toggleShowAvailableOnly = () => {
    setShowAvailableOnly(!showAvailableOnly);
  };

  const availableCount = Object.values(availabilityStatus).filter(status => status === 'available').length;
  const bookedCount = Object.values(availabilityStatus).filter(status => status === 'unavailable').length;

  const activeFilterCount = [
    selectedCity !== "All",
    selectedArea !== "All",
    coupleFriendlyOnly,
    hourlyOnly,
    showAvailableOnly,
    roomType !== "All",
    availabilityFilter !== 'all'
  ].filter(Boolean).length;

  const filterSummaryText = [
    selectedCity !== "All" ? selectedCity : null,
    selectedArea !== "All" ? selectedArea : null,
    roomType !== "All" ? roomType : null
  ].filter(Boolean).join(" • ") || "Browsing every location";

  const quickFilters = [
    {
      id: 'coupleFriendly',
      label: 'Couple friendly',
      helper: 'Verified & ID compliant',
      active: coupleFriendlyOnly,
      onToggle: () => setCoupleFriendlyOnly(prev => !prev)
    },
    {
      id: 'hourly',
      label: 'Hourly stays',
      helper: '2-8 hour slots',
      active: hourlyOnly,
      onToggle: () => setHourlyOnly(prev => !prev)
    },
    {
      id: 'instantAvail',
      label: 'Instant availability',
      helper: 'Only free dates',
      disabled: !(checkInDate && checkOutDate),
      active: showAvailableOnly,
      onToggle: () => {
        if (!(checkInDate && checkOutDate)) return;
        toggleShowAvailableOnly();
      }
    }
  ];

  const handleResetFilters = () => {
    setSelectedCity("All");
    setSelectedArea("All");
    setCoupleFriendlyOnly(false);
    setHourlyOnly(false);
    setRoomType("All");
    setShowAvailableOnly(false);
    setAvailabilityFilter('all');
    setSearchQuery("");
    setShowAdvancedFilters(false);
  };

  // Get center coordinates for map based on selected city
  const getCityCenter = () => {
    if (mapCenter) return mapCenter;
    
    const cityCoords = {
      'Guwahati': [26.1445, 91.7362],
      'Shillong': [25.5788, 91.8933],
      'Goa': [15.2993, 74.1240]
    };
    return selectedCity !== "All" && cityCoords[selectedCity] 
      ? cityCoords[selectedCity] 
      : [23.6345, 85.3803]; // Center of India as default
  };

  // Search for location on map
  const handleMapSearch = async () => {
    if (!mapSearchQuery.trim()) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        setMapZoom(13);
      } else {
        alert('Location not found. Try searching for a city, area, or landmark.');
      }
    } catch (error) {
      console.error('Map search error:', error);
      alert('Failed to search location. Please try again.');
    }
  };

  const visibleHomestayCount = sortedHomestays.length || homestays.length;
  const inventoryPhrase = visibleHomestayCount > 0
    ? `${visibleHomestayCount}+ verified homestays`
    : "verified homestays";

  const homeTitle = selectedCity !== "All"
    ? `Verified Homestays in ${selectedCity} | Homavia`
    : "Homavia - Verified Homestays, Bike Rentals & Car Rentals in India";
  const homeDescription = selectedCity !== "All"
    ? `Browse ${inventoryPhrase} in ${selectedCity}. Compare transparent prices, check calendar availability, and contact hosts directly on Homavia.`
    : `Explore ${inventoryPhrase} across India with bike and car rentals, couple-friendly options, live filters, and direct host contact.`;
  const homeCanonicalPath = selectedCity !== "All" ? `/?city=${encodeURIComponent(selectedCity)}` : "/";
  const itemListSchema = sortedHomestays.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": selectedCity !== "All" ? `Homestays in ${selectedCity}` : "Verified homestays on Homavia",
    "numberOfItems": sortedHomestays.length,
    "itemListOrder": "https://schema.org/ItemListOrderAscending",
    "itemListElement": sortedHomestays.slice(0, 10).map((homestay, index) => {
      const listingUrl = buildAbsoluteUrl(`/homestays/${createSlug(homestay.name, homestay.id, homestay.city)}`);
      return {
        "@type": "ListItem",
        "position": index + 1,
        "url": listingUrl,
        "name": homestay.name,
        "item": {
          "@type": "LodgingBusiness",
          "@id": `${listingUrl}#lodging`,
          "name": homestay.name,
          "url": listingUrl,
          "image": normalizeSeoImage(homestay.imageUrl),
          "address": {
            "@type": "PostalAddress",
            "addressLocality": homestay.area,
            "addressRegion": homestay.city,
            "addressCountry": "IN"
          },
          "priceRange": homestay.price ? `INR ${homestay.price}` : undefined
        }
      };
    })
  } : null;
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": homeTitle,
    "url": buildAbsoluteUrl(homeCanonicalPath),
    "description": homeDescription,
    "inLanguage": SITE_LANGUAGE,
    "isPartOf": {
      "@type": "WebSite",
      "name": SITE_NAME,
      "url": SITE_URL
    },
    "mainEntity": itemListSchema
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": SITE_URL,
    "description": DEFAULT_DESCRIPTION,
    "inLanguage": SITE_LANGUAGE,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${SITE_URL}/?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SITE_NAME,
    "url": SITE_URL,
    "logo": DEFAULT_OG_IMAGE,
    "email": CONTACT_EMAIL,
    "telephone": CONTACT_PHONE,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": CONTACT_PHONE,
      "email": CONTACT_EMAIL,
      "contactType": "customer support",
      "areaServed": "IN",
      "availableLanguage": ["English", "Hindi"]
    }
  };
  const travelAgencySchema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": SITE_NAME,
    "url": SITE_URL,
    "description": DEFAULT_DESCRIPTION,
    "areaServed": {
      "@type": "Country",
      "name": "India"
    }
  };

  return (
    <div>
      <SeoHelmet
        title={homeTitle}
        description={homeDescription}
        keywords={`Homavia, homestay ${selectedCity !== "All" ? selectedCity : "India"}, verified homestays, book homestay, couple friendly homestay, bike rental, car rental, direct host contact`}
        canonicalPath={homeCanonicalPath}
        schema={[websiteSchema, organizationSchema, travelAgencySchema, collectionPageSchema, itemListSchema]}
      />

      <section style={styles.heroShell} className="home-hero">
        <img
          src={heroImage}
          alt="Private pool villa homestay with garden lighting"
          style={styles.heroImage}
        />
        <div style={styles.heroOverlay} />
        <div style={styles.heroContent} className="home-hero-content">
          <p style={styles.heroEyebrow}>
            <FiCheck size={14} /> Verified stays across India
          </p>
          <h1 style={styles.heroTitle}>Curated homestays for effortless travel</h1>
          <p style={styles.heroSubtitle}>
            Compare trusted properties, clear pricing, live location filters, and direct host contact in one polished booking experience.
          </p>
          <div style={styles.heroStats} className="home-hero-stats">
            <div style={styles.heroStat}>
              <p style={styles.heroStatValue}>{visibleHomestayCount > 0 ? `${visibleHomestayCount}+` : "Live"}</p>
              <p style={styles.heroStatLabel}>listed stays</p>
            </div>
            <div style={styles.heroStat}>
              <p style={styles.heroStatValue}>{ALL_CITIES.length}</p>
              <p style={styles.heroStatLabel}>active destinations</p>
            </div>
            <div style={styles.heroStat}>
              <p style={styles.heroStatValue}>Direct</p>
              <p style={styles.heroStatLabel}>host contact</p>
            </div>
          </div>
        </div>
      </section>

      {/* Availability Calendar Section - Completely hidden, moved to advanced filters */}
      {false && showFilters && showAdvancedFilters && (
        <div style={styles.datePickerContainer}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <FiCalendar size={20} color="#B42318" />
          <h3 style={{ fontSize: 17, fontWeight: 'bold', margin: 0, letterSpacing: 0 }}>
            Check Availability
          </h3>
        </div>
        
        {checkingAvailability && (
          <div style={{ 
            fontSize: 13, 
            color: '#666', 
            fontStyle: 'italic', 
            marginBottom: 12, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            padding: '10px 14px',
            backgroundColor: '#f0f9ff',
            borderRadius: 10,
            border: '1px solid #bae6fd'
          }}>
            <div style={{ 
              width: 16, 
              height: 16, 
              border: '2px solid #e0e0e0', 
              borderTop: '2px solid #B42318',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Checking availability for {homestays.length} properties...
          </div>
        )}

        {!checkingAvailability && (checkInDate || checkOutDate) && (
          <div style={{ 
            fontSize: 14, 
            color: '#10b981', 
            fontWeight: 600, 
            marginBottom: 12,
            padding: '10px 14px',
            backgroundColor: '#f0fdf4',
            borderRadius: 10,
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <FiCheck size={16} />
            {availableCount} available • {bookedCount} booked
          </div>
        )}

        {/* Always Visible Calendar */}
        <div style={styles.calendarContainer}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 12 
          }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#222' }}>
              Select Your Dates
            </h4>
            {(checkInDate || checkOutDate) && (
              <button 
                style={{
                  ...styles.clearDatesButton,
                  padding: '8px 12px',
                  fontSize: 12
                }} 
                onClick={clearDates}
              >
                <FiX size={14} />
                Clear
              </button>
            )}
          </div>

          {/* Clickable Date Boxes */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 12, 
            marginBottom: showCalendar ? 16 : 0
          }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 0, display: 'block', marginBottom: 6 }}>
                Check-in
              </label>
              <div 
                onClick={() => setShowCalendar(!showCalendar)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: checkInDate ? '#fff' : '#f8f8f8',
                  border: checkInDate ? '2px solid #B42318' : '1px solid #e0e0e0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: checkInDate ? '#222' : '#999',
                  minHeight: 42,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#B42318';
                }}
                onMouseLeave={(e) => {
                  if (!checkInDate) e.currentTarget.style.borderColor = '#e0e0e0';
                }}
              >
                <span>
                  {checkInDate ? new Date(checkInDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'Select date'}
                </span>
                <FiCalendar size={16} color="#B42318" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 0, display: 'block', marginBottom: 6 }}>
                Check-out
              </label>
              <div 
                onClick={() => setShowCalendar(!showCalendar)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: checkOutDate ? '#fff' : '#f8f8f8',
                  border: checkOutDate ? '2px solid #B42318' : '1px solid #e0e0e0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: checkOutDate ? '#222' : '#999',
                  minHeight: 42,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#B42318';
                }}
                onMouseLeave={(e) => {
                  if (!checkOutDate) e.currentTarget.style.borderColor = '#e0e0e0';
                }}
              >
                <span>
                  {checkOutDate ? new Date(checkOutDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'Select date'}
                </span>
                <FiCalendar size={16} color="#B42318" />
              </div>
            </div>
          </div>

          {/* Collapsible Calendar */}
          {showCalendar && (
            <div style={{
              animation: 'slideDown 0.2s ease-out',
              marginTop: 16
            }}>
              <Calendar
                selectRange={true}
                onChange={(dates) => {
                  if (Array.isArray(dates)) {
                    const [start, end] = dates;
                    setCheckInDate(start.toISOString().split('T')[0]);
                    if (end) {
                      setCheckOutDate(end.toISOString().split('T')[0]);
                    } else {
                      // If only start date selected, set checkout to next day
                      const nextDay = new Date(start);
                      nextDay.setDate(nextDay.getDate() + 1);
                      setCheckOutDate(nextDay.toISOString().split('T')[0]);
                    }
                  }
                }}
                value={checkInDate && checkOutDate ? [new Date(checkInDate), new Date(checkOutDate)] : null}
                minDate={new Date()}
                className="professional-calendar"
              />
              <p style={{ 
                fontSize: 12, 
                color: '#666', 
                marginTop: 12, 
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                Click and drag to select your check-in and check-out dates
              </p>
            </div>
          )}
        </div>

        <style>{`
          * {
            box-sizing: border-box;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Ensure no overflow */
          body, html, #root {
            overflow-x: hidden !important;
            max-width: 100vw !important;
          }

          /* Desktop Navigation */
          @media (min-width: 768px) {
            .desktop-nav {
              display: flex !important;
              align-items: center;
              gap: 24px;
            }
            .desktop-nav a {
              color: #222;
              text-decoration: none;
              font-weight: 500;
              font-size: 15px;
              transition: color 0.2s;
              white-space: nowrap;
            }
            .desktop-nav a:hover {
              color: #B42318;
            }
            .hamburger-button {
              display: none !important;
            }
            .mobile-menu, .overlay {
              display: none !important;
            }
          }

          /* Desktop Responsive Grid */
          @media (min-width: 768px) {
            .homestay-list {
              grid-template-columns: repeat(2, 1fr) !important;
            }
            .main-content {
              padding: 0 32px !important;
            }
            .filter-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
            
            /* Detail Page Desktop Layout */
            .detail-page {
              max-width: 1200px;
              margin: 0 auto;
            }
            .detail-grid {
              display: grid;
              grid-template-columns: 1fr 400px;
              gap: 40px;
              margin-top: 24px;
            }
            .detail-main {
              order: 1;
            }
            .detail-sidebar {
              order: 2;
              position: sticky;
              top: 100px;
              align-self: start;
            }
          }

          @media (min-width: 1024px) {
            .homestay-list {
              grid-template-columns: repeat(3, 1fr) !important;
            }
            .filter-grid {
              grid-template-columns: repeat(3, 1fr) !important;
            }
            .form-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }

          @media (min-width: 1440px) {
            .homestay-list {
              grid-template-columns: repeat(4, 1fr) !important;
            }
            .main-content {
              padding: 0 48px !important;
            }
          }

          /* Professional Calendar Styles */
          .professional-calendar {
            width: 100%;
            border: none;
            border-radius: 12px;
            background: white;
            font-family: 'Inter', -apple-system, sans-serif;
            box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          }

          .professional-calendar .react-calendar__navigation {
            display: flex;
            height: 44px;
            margin-bottom: 12px;
            background: #fafafa;
            border-radius: 10px;
            padding: 4px;
          }

          .professional-calendar .react-calendar__navigation button {
            min-width: 44px;
            background: transparent;
            border: none;
            font-size: 16px;
            font-weight: 600;
            color: #222;
            border-radius: 8px;
            transition: all 0.2s;
          }

          .professional-calendar .react-calendar__navigation button:hover {
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.04);
          }

          .professional-calendar .react-calendar__navigation button:disabled {
            color: #ccc;
          }

          .professional-calendar .react-calendar__month-view__weekdays {
            text-align: center;
            font-weight: 600;
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }

          .professional-calendar .react-calendar__month-view__weekdays__weekday {
            padding: 8px;
          }

          .professional-calendar .react-calendar__month-view__weekdays abbr {
            text-decoration: none;
          }

          .professional-calendar .react-calendar__tile {
            max-width: 100%;
            padding: 12px 6px;
            background: transparent;
            text-align: center;
            line-height: 16px;
            border-radius: 10px;
            border: none;
            font-weight: 500;
            font-size: 14px;
            color: #222;
            transition: all 0.2s;
            margin: 2px;
          }

          .professional-calendar .react-calendar__tile:hover {
            background: #f0f9ff;
            color: #0284c7;
          }

          .professional-calendar .react-calendar__tile--now {
            background: #fef3c7;
            color: #92400e;
            font-weight: 600;
          }

          .professional-calendar .react-calendar__tile--now:hover {
            background: #fde68a;
          }

          .professional-calendar .react-calendar__tile--active {
            background: #B42318 !important;
            color: white !important;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(180, 35, 24, 0.3);
          }

          .professional-calendar .react-calendar__tile--active:hover {
            background: #8F1D16 !important;
          }

          .professional-calendar .react-calendar__tile--range {
            background: #FEE4E2 !important;
            color: #222 !important;
          }

          .professional-calendar .react-calendar__tile--rangeStart,
          .professional-calendar .react-calendar__tile--rangeEnd {
            background: #B42318 !important;
            color: white !important;
            font-weight: 600;
          }

          .professional-calendar .react-calendar__tile--rangeStart:hover,
          .professional-calendar .react-calendar__tile--rangeEnd:hover {
            background: #8F1D16 !important;
          }

          .professional-calendar .react-calendar__tile:disabled {
            color: #ddd;
            background: transparent;
          }

          .professional-calendar .react-calendar__month-view__days__day--neighboringMonth {
            color: #ccc;
          }
        `}</style>
        </div>
      )}

      <div style={styles.searchContainer} className="home-search">
        <input
          type="text"
          placeholder="Search homestays by name, location..."
          style={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button 
          style={styles.searchButton}
          onClick={() => setShowFilters(true)}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 14px 28px rgba(180, 35, 24, 0.28)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 12px 24px rgba(180, 35, 24, 0.22)';
          }}
        >
          <FiSearch /> Search
        </button>
      </div>

      <div style={styles.filterSummaryCard}>
        <div>
          <p style={styles.sectionEyebrow}>Filters</p>
          <h3 style={styles.summaryTitle}>{activeFilterCount ? `${activeFilterCount} active` : 'All stays'}</h3>
          <p style={styles.summarySubtext}>{filterSummaryText}</p>
        </div>
        <div style={styles.summaryActions}>
          {activeFilterCount > 0 && (
            <button style={styles.resetFiltersBtn} onClick={handleResetFilters}>
              Reset
            </button>
          )}
          <button
            style={styles.summaryToggleBtn}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter size={16} /> {showFilters ? 'Hide panel' : 'Open filters'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          <div style={styles.filterSectionWrapper}>
            <div style={styles.filterCard}>
              <div style={styles.filterSectionHeader}>
                <div>
                  <p style={styles.sectionEyebrow}>Refine your stay</p>
                  <h3 style={styles.summaryTitle}>Choose what matters</h3>
                </div>
                <button
                  style={styles.advancedToggle}
                  onClick={() => setShowAdvancedFilters(prev => !prev)}
                >
                  {showAdvancedFilters ? 'Hide advanced' : 'Advanced filters'}
                </button>
              </div>

              <div style={styles.filterPillsWrapper}>
                {quickFilters.map(filter => (
                  <button
                    key={filter.id}
                    style={{
                      ...styles.filterPill,
                      ...(filter.active ? styles.filterPillActive : {}),
                      ...(filter.disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {})
                    }}
                    onClick={filter.onToggle}
                    disabled={filter.disabled}
                  >
                    <span style={styles.filterPillLabel}>{filter.label}</span>
                    <span style={styles.filterPillHelper}>{filter.helper}</span>
                  </button>
                ))}
              </div>

              <div style={styles.filterDivider} />

              <div style={styles.filterGrid} className="filter-grid">
                <div>
                  <label style={styles.label}>City</label>
                  <select
                    style={styles.cityDropdown}
                    value={selectedCity}
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      setSelectedArea("All");
                    }}
                  >
                    <option value="All">All Cities</option>
                    {ALL_CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Area</label>
                  <select
                    style={styles.locationDropdown}
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    disabled={selectedCity === "All"}
                  >
                    <option value="All">
                      {selectedCity === "All" ? "Select a city first" : `All areas in ${selectedCity}`}
                    </option>
                    {availableAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>

              {showAdvancedFilters && (
                <div style={styles.advancedFilterGrid} className="form-grid-desktop">
                  <div>
                    <label style={styles.label}>Check-in Date</label>
                    <input
                      type="date"
                      style={styles.input}
                      value={checkInDate || ''}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Check-out Date</label>
                    <input
                      type="date"
                      style={styles.input}
                      value={checkOutDate || ''}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      min={checkInDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Room type</label>
                    <select
                      style={styles.locationDropdown}
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                    >
                      <option value="All">All Types</option>
                      {ROOM_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {checkInDate && checkOutDate && (
                    <div>
                      <label style={styles.label}>Availability</label>
                      <select
                        style={styles.locationDropdown}
                        value={availabilityFilter}
                        onChange={(e) => setAvailabilityFilter(e.target.value)}
                      >
                        <option value="all">All Properties</option>
                        <option value="available">✓ Available Only ({availableCount})</option>
                        <option value="booked">✗ Booked Only ({bookedCount})</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div style={styles.filterFooter}>
                <p style={styles.filterFooterText}>
                  {sortedHomestays.length} stays • {filterSummaryText}
                </p>
                <div style={styles.filterFooterActions}>
                  <button
                    style={{...styles.summaryToggleBtn, background: designTokens.colors.success}}
                    onClick={() => setShowFilters(false)}
                  >
                    <FiCheck size={16} /> Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.viewToggleContainer}>
        <button 
          style={{
            ...styles.viewToggleButton,
            ...(viewMode === 'list' ? styles.viewToggleButtonActive : {})
          }}
          onClick={() => setViewMode('list')}
        >
          <FiHome size={16} />
          List View
        </button>
        <button 
          style={{
            ...styles.viewToggleButton,
            ...(viewMode === 'map' ? styles.viewToggleButtonActive : {})
          }}
          onClick={() => setViewMode('map')}
        >
          <FiMap size={16} />
          Map View
        </button>
      </div>

      {viewMode === 'map' && sortedHomestays.filter(h => h.latitude && h.longitude).length > 0 && (
        <div>
          {/* Map Search Bar */}
          <div style={{ 
            marginBottom: 16, 
            padding: 16, 
            backgroundColor: designTokens.colors.white,
            borderRadius: designTokens.radius.lg,
            boxShadow: designTokens.shadow.sm,
            border: `1px solid ${designTokens.colors.borderLight}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <FiSearch size={18} color={designTokens.colors.primary} />
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Search Location on Map</h4>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Search city, area, or landmark..."
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleMapSearch()}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: `1px solid ${designTokens.colors.border}`,
                  borderRadius: 8,
                  fontSize: 15,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = designTokens.colors.primary}
                onBlur={(e) => e.target.style.borderColor = designTokens.colors.border}
              />
              <button
                onClick={handleMapSearch}
                style={{
                  padding: '12px 24px',
                  backgroundColor: designTokens.colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  minHeight: 48,
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = designTokens.colors.primaryHover}
                onMouseLeave={(e) => e.target.style.backgroundColor = designTokens.colors.primary}
              >
                <FiSearch size={16} />
                Search
              </button>
              {mapCenter && (
                <button
                  onClick={() => {
                    setMapCenter(null);
                    setMapZoom(null);
                    setMapSearchQuery('');
                  }}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#fff',
                    color: '#666',
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                    minHeight: 48,
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f8f8f8';
                    e.target.style.borderColor = designTokens.colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.borderColor = '#ddd';
                  }}
                >
                  <FiX size={16} />
                  Reset
                </button>
              )}
            </div>
          </div>

          <div style={styles.mapContainer}>
          <MapContainer 
            key={mapCenter ? `${mapCenter[0]}-${mapCenter[1]}` : 'default'}
            center={getCityCenter()} 
            zoom={mapZoom || (selectedCity !== "All" ? 12 : 5)} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {sortedHomestays
              .filter(homestay => homestay.latitude && homestay.longitude)
              .map(homestay => {
                const availability = availabilityStatus[homestay.id];
                return (
                  <Marker 
                    key={homestay.id} 
                    position={[homestay.latitude, homestay.longitude]}
                  >
                    <Popup>
                      <div style={{ minWidth: 200 }}>
                        <img 
                          src={homestay.imageUrl} 
                          alt={`${homestay.name} - ${homestay.city}`}
                          title={homestay.name}
                          loading="lazy"
                          style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                        />
                        <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 'bold' }}>
                          {homestay.name}
                        </h4>
                        <p style={{ margin: '0 0 4px 0', fontSize: 12, color: '#666' }}>
                          {homestay.area}, {homestay.city}
                        </p>
                        <p style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 'bold', color: designTokens.colors.primary }}>
                          ₹{homestay.price} / {PRICE_TYPES.find(pt => pt.id === homestay.priceType)?.suffix || 'night'}
                        </p>
                        {availability === 'available' && (
                          <span style={{ 
                            backgroundColor: designTokens.colors.success,
                            color: 'white', 
                            padding: '2px 6px', 
                            borderRadius: 4, 
                            fontSize: 11,
                            fontWeight: 'bold'
                          }}>
                            AVAILABLE
                          </span>
                        )}
                        {availability === 'unavailable' && (
                          <span style={{ 
                            backgroundColor: designTokens.colors.error,
                            color: 'white', 
                            padding: '2px 6px', 
                            borderRadius: 4, 
                            fontSize: 11,
                            fontWeight: 'bold'
                          }}>
                            BOOKED
                          </span>
                        )}
                        <Link 
                          to={`/homestays/${createSlug(homestay.name, homestay.id, homestay.city)}`}
                          style={{
                            display: 'block',
                            marginTop: 8,
                            padding: '6px 12px',
                            backgroundColor: designTokens.colors.primary,
                            color: 'white',
                            textAlign: 'center',
                            borderRadius: 6,
                            textDecoration: 'none',
                            fontSize: 12,
                            fontWeight: 'bold'
                          }}
                        >
                          View Details
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </MapContainer>
        </div>
        </div>
      )}

      {loading && homestays.length === 0 ? (
        <div style={styles.loaderContainer}>
          <div style={styles.spinner}></div>
          <h3 style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: 8
          }}>Loading verified stays</h3>
          <p style={{
            fontSize: 14,
            color: '#6b7280',
            marginBottom: 20
          }}>Fetching the latest Homavia inventory for this page.</p>
        </div>
      ) : sortedHomestays.length === 0 ? (
        <div style={styles.loaderContainer}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: designTokens.colors.white,
            color: designTokens.colors.primary,
            border: `1px solid ${designTokens.colors.borderLight}`,
            boxShadow: designTokens.shadow.sm
          }}><FiHome size={26} /></div>
          <h3 style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: 8
          }}>No homestays found</h3>
          <p style={{
            fontSize: 14,
            color: '#6b7280',
            marginBottom: 20
          }}>Try adjusting your filters or search query</p>
          {showAvailableOnly && (
            <button 
              style={{ ...styles.submitButton, marginTop: 15, maxWidth: 300 }}
              onClick={toggleShowAvailableOnly}
            >
              Show All Homestays
            </button>
          )}
        </div>
      ) : (
        <ul style={styles.homestayList} className="homestay-list-grid">
          {sortedHomestays.map(homestay => {
            const availability = availabilityStatus[homestay.id];
            return (
              <li 
                key={homestay.id} 
                style={styles.homestayItem}
                className="homestay-item-hover homestay-card-hover"
              >
                <Link to={`/homestays/${createSlug(homestay.name, homestay.id, homestay.city)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={homestay.imageUrl}
                      alt={`${homestay.name} - ${homestay.roomType} in ${homestay.area}, ${homestay.city}`}
                      title={`Book ${homestay.name} on Homavia`}
                      loading="lazy"
                      style={styles.homestayImage}
                    />
                    {homestay.premium && (
                      <div style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        backgroundColor: designTokens.colors.goldLight,
                        color: '#7A4E0A',
                        padding: '6px 10px',
                        borderRadius: designTokens.radius.full,
                        fontSize: 10,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        boxShadow: '0 8px 20px rgba(16, 24, 40, 0.16)',
                        letterSpacing: 0
                      }}>
                        <FiStar fill="#7A4E0A" /> PREMIUM
                      </div>
                    )}
                    {checkInDate && checkOutDate && availability === 'available' && (
                      <div style={styles.availabilityBadge}>
                        <FiCheck size={12} /> AVAILABLE
                      </div>
                    )}
                    {checkInDate && checkOutDate && availability === 'unavailable' && (
                      <div style={styles.unavailableBadge}>
                        <FiX size={12} /> BOOKED
                      </div>
                    )}
                  </div>
                  <div style={styles.homestayInfo}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={styles.title}>{homestay.name}</h3>
                      <div style={styles.rating}>
                        <FiStar fill={designTokens.colors.gold} color={designTokens.colors.gold} />
                        {homestay.rating || "New"}
                      </div>
                    </div>
                    <p style={styles.location}>
                      <FiMapPin /> {homestay.area}, {homestay.city}
                    </p>
                    <p style={styles.price}>
                      ₹{homestay.price} / {PRICE_TYPES.find(pt => pt.id === homestay.priceType)?.suffix || 'night'}
                    </p>
                    {homestay.additionalPrices && Object.keys(homestay.additionalPrices).length > 0 && (
                      <p style={{ fontSize: 12, color: designTokens.colors.textMuted, marginTop: 4 }}>
                        + {Object.keys(homestay.additionalPrices).length} more pricing option{Object.keys(homestay.additionalPrices).length > 1 ? 's' : ''}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                      {homestay.coupleFriendly && (
                        <span style={{
                          backgroundColor: '#e8f5e8',
                          color: designTokens.colors.success,
                          padding: '4px 9px',
                          borderRadius: designTokens.radius.full,
                          fontSize: 12,
                          fontWeight: 700
                        }}>
                          Couple Friendly
                        </span>
                      )}
                      {homestay.hourly && (
                        <span style={{
                          backgroundColor: '#e3f2fd',
                          color: designTokens.colors.accent,
                          padding: '4px 9px',
                          borderRadius: designTokens.radius.full,
                          fontSize: 12,
                          fontWeight: 700
                        }}>
                          Hourly Stays
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------
   Add Homestay Form
------------------------------ */
function AddHomestayForm() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    priceType: "perNight",
    additionalPrices: {},
    unitCount: 1,
    platformPrices: {},
    city: "",
    area: "",
    contact: "",
    roomType: "",
    maxGuests: 2,
    coupleFriendly: false,
    hourly: false,
    petsAllowed: false,
    smokingAllowed: false,
    amenities: [],
    premium: false,
    imagePreview: null,
    icalUrl: "",
    calendarLinks: [],
    manualBlockedDates: [],
    latitude: null,
    longitude: null,
    address: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCenter, setMapCenter] = useState([23.6345, 85.3803]); // Center of India
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [showPublishPreview, setShowPublishPreview] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return unsubscribe;
  }, []);

  const handleAmenityChange = (amenityId) => {
    const updatedAmenities = form.amenities.includes(amenityId)
      ? form.amenities.filter(id => id !== amenityId)
      : [...form.amenities, amenityId];

    setForm({ ...form, amenities: updatedAmenities });
  };

  const handleAdditionalPriceChange = (priceTypeId, value) => {
    const updatedPrices = { ...form.additionalPrices };
    if (value && !isNaN(value) && Number(value) > 0) {
      updatedPrices[priceTypeId] = Number(value);
    } else {
      delete updatedPrices[priceTypeId];
    }
    setForm({ ...form, additionalPrices: updatedPrices });
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        // Reverse geocoding to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude}, ${longitude}`;
          
          setForm({ 
            ...form, 
            latitude, 
            longitude,
            address
          });
          setMapCenter([latitude, longitude]);
          setLocationLoading(false);
          alert("Location captured successfully!");
        } catch (error) {
          setForm({ 
            ...form, 
            latitude, 
            longitude,
            address: `${latitude}, ${longitude}`
          });
          setMapCenter([latitude, longitude]);
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationError("Unable to retrieve your location. Please enable location access.");
        setLocationLoading(false);
      }
    );
  };

  const handleLocationSearch = async () => {
    if (!locationSearchQuery.trim()) return;
    
    setLocationLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        setForm({
          ...form,
          latitude,
          longitude,
          address: display_name
        });
        setMapCenter([latitude, longitude]);
        setLocationLoading(false);
        alert("Location found and set successfully!");
      } else {
        setLocationLoading(false);
        alert('Location not found. Try searching for a city, area, or landmark.');
      }
    } catch (error) {
      console.error('Location search error:', error);
      setLocationLoading(false);
      alert('Failed to search location. Please try again.');
    }
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    setForm({ 
      ...form, 
      city,
      area: ""
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setImageError("Image size must be less than 2MB");
      return;
    }

    if (!file.type.match("image.*")) {
      setImageError("Only image files are allowed");
      return;
    }

    setImageError(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, imagePreview: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const isValidIcalUrl = (url) => {
    if (!url) return true; // optional
    try {
      const u = new URL(url);
      const isWebCal = u.protocol === "webcal:";
      const isHttp = u.protocol === "http:" || u.protocol === "https:";
      return isWebCal || isHttp;
    } catch {
      return false;
    }
  };

  const hasInvalidCalendarLinks = () => (
    getEditableCalendarLinks(form).some(link => link.url && !isValidIcalUrl(link.url))
  );

  const uploadImage = async () => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Upload failed:", error);
      return null;
    }
  };

  const handlePreviewRequest = (e) => {
    e.preventDefault();
    if (!user) return;
    if (imageError) return;
    if (hasInvalidCalendarLinks()) {
      alert("Please enter valid calendar links (https://, http://, or webcal://).");
      return;
    }

    setShowPublishPreview(true);
    window.setTimeout(() => {
      document.getElementById("property-publish-preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (imageError) return;
    if (hasInvalidCalendarLinks()) {
      alert("Please enter valid calendar links (https://, http://, or webcal://).");
      return;
    }

    setLoading(true);
    try {
      const imageUrl = await uploadImage();
      if (!imageUrl) throw new Error("Image upload failed");
      const calendarLinks = normalizeListingCalendarLinks(form.calendarLinks, form.icalUrl);

      await addDoc(collection(db, "homestays"), {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        priceType: form.priceType,
        additionalPrices: form.additionalPrices,
        unitCount: normalizeUnitCount(form.unitCount),
        platformPrices: cleanPlatformPrices(form.platformPrices),
        city: form.city,
        area: form.area,
        contact: form.contact,
        roomType: form.roomType,
        maxGuests: Number(form.maxGuests),
        coupleFriendly: form.coupleFriendly,
        hourly: form.hourly,
        petsAllowed: form.petsAllowed,
        smokingAllowed: form.smokingAllowed,
        amenities: form.amenities,
        premium: form.premium,
        imageUrl,
        latitude: form.latitude,
        longitude: form.longitude,
        address: form.address,
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: serverTimestamp(),
        rating: Math.floor(Math.random() * 2) + 4,
        icalUrl: calendarLinks[0]?.url || "",
        calendarLinks,
        manualBlockedDates: normalizeManualBlockedDates(form.manualBlockedDates),
        status: "published",
        published: true,
        publishedAt: serverTimestamp()
      });

      setForm({
        name: "",
        description: "",
        price: "",
        priceType: "perNight",
        additionalPrices: {},
        unitCount: 1,
        platformPrices: {},
        city: "",
        area: "",
        contact: "",
        roomType: "",
        maxGuests: 2,
        coupleFriendly: false,
        hourly: false,
        petsAllowed: false,
        smokingAllowed: false,
        amenities: [],
        premium: false,
        imagePreview: null,
        icalUrl: "",
        calendarLinks: [],
        manualBlockedDates: [],
        latitude: null,
        longitude: null,
        address: ""
      });
      setImageFile(null);
      setShowPublishPreview(false);
      alert("Homestay added successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to add homestay");
    }
    setLoading(false);
  };

  const availableAreas = form.city ? AREAS_BY_CITY[form.city] || [] : [];

  return (
    <div style={styles.formContainer}>
      <SeoHelmet
        title="List Your Homestay | Homavia"
        description="Host dashboard for adding a Homavia homestay listing, pricing, units, amenities, and calendar sync."
        canonicalPath="/add-homestay"
        robots={PRIVATE_ROBOTS}
      />

      <h1 style={styles.formTitle}>List your homestay</h1>
      <p className="form-kicker">
        Add the details guests need, connect your calendar, and keep revenue estimates accurate from day one.
      </p>

      <div style={styles.premiumBanner}>
        <FiStar size={20} color="#ffd700" />
        <div>
          <p style={{ fontWeight: 'bold', marginBottom: 5, fontSize: 14 }}>Premium Listing Available</p>
          <p style={{ fontSize: 12 }}>Get more views with our Premium feature.</p>
        </div>
      </div>

      <form onSubmit={showPublishPreview ? handleSubmit : handlePreviewRequest}>
        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Basic Information</h2>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Homestay Name *</label>
            <input
              style={styles.input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Description *</label>
            <textarea
              style={styles.textarea}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              placeholder="Tell guests what makes your place special..."
            />
          </div>

          <div style={styles.formGrid} className="form-grid">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Primary Price (₹) *</label>
              <input
                style={styles.input}
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                placeholder="Enter primary price"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Primary Price Type *</label>
              <select
                style={styles.input}
                value={form.priceType}
                onChange={(e) => setForm({ ...form, priceType: e.target.value })}
                required
              >
                {PRICE_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Additional Pricing Options (Optional)</label>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
              Add alternative pricing for different booking periods
            </p>
            {PRICE_TYPES.filter(pt => pt.id !== form.priceType).map(priceType => (
              <div key={priceType.id} style={{ marginBottom: 12 }}>
                <label style={{ ...styles.label, fontSize: 13, color: '#666' }}>
                  {priceType.label} (₹)
                </label>
                <input
                  style={styles.input}
                  type="number"
                  value={form.additionalPrices[priceType.id] || ''}
                  onChange={(e) => handleAdditionalPriceChange(priceType.id, e.target.value)}
                  placeholder={`Optional price per ${priceType.suffix}`}
                />
              </div>
            ))}
          </div>
        </div>

        <PlatformPricingFields form={form} setForm={setForm} />

        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Location & Calendar</h2>
          <div style={styles.formGrid} className="form-grid">
            <div style={styles.inputGroup}>
              <label style={styles.label}>City *</label>
              <select
                style={styles.input}
                value={form.city}
                onChange={handleCityChange}
                required
              >
                <option value="">Select City</option>
                {ALL_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Area *</label>
              <select
                style={styles.input}
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                required
                disabled={!form.city}
              >
                <option value="">Select Area</option>
                {availableAreas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Room Type *</label>
              <select
                style={styles.input}
                value={form.roomType}
                onChange={(e) => setForm({ ...form, roomType: e.target.value })}
                required
              >
                <option value="">Select Room Type</option>
                {ROOM_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone Number *</label>
              <input
                style={styles.input}
                type="tel"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Maximum Guests *</label>
              <input
                style={styles.input}
                type="number"
                min="1"
                value={form.maxGuests}
                onChange={(e) => setForm({ ...form, maxGuests: e.target.value })}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Property Location (GPS)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  style={{ ...styles.locationButton, flex: 1 }}
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                >
                  <FiNavigation size={16} />
                  {locationLoading ? 'Getting Location...' : 'Use Current Location'}
                </button>
                <button
                  type="button"
                  style={{ 
                    ...styles.locationButton, 
                    flex: 1,
                    backgroundColor: showMapPicker ? '#B42318' : '#fff',
                    color: showMapPicker ? '#fff' : '#222',
                    border: showMapPicker ? 'none' : '1px solid #ddd'
                  }}
                  onClick={() => {
                    setShowMapPicker(!showMapPicker);
                    if (form.latitude && form.longitude) {
                      setMapCenter([form.latitude, form.longitude]);
                    }
                  }}
                >
                  <FiMapPin size={16} />
                  Pick on Map
                </button>
              </div>
              {locationError && (
                <p style={{ color: '#B42318', marginTop: 8, fontSize: 13 }}>
                  {locationError}
                </p>
              )}
              {form.latitude && form.longitude && (
                <div style={{ 
                  marginTop: 10, 
                  padding: 10, 
                  backgroundColor: '#e8f5e9', 
                  borderRadius: 8,
                  fontSize: 13
                }}>
                  <p style={{ margin: 0, color: '#2e7d32', fontWeight: 'bold', marginBottom: 4 }}>
                    ✓ Location Captured
                  </p>
                  <p style={{ margin: 0, color: '#666', fontSize: 12 }}>
                    Lat: {form.latitude.toFixed(6)}, Lng: {form.longitude.toFixed(6)}
                  </p>
                  {form.address && (
                    <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 12 }}>
                      📍 {form.address}
                    </p>
                  )}
                </div>
              )}
              
              {showMapPicker && (
                <div style={{ marginTop: 12, border: '2px solid #B42318', borderRadius: 12, overflow: 'hidden' }}>
                  {/* Location Search Bar */}
                  <div style={{ padding: 12, backgroundColor: '#fff', borderBottom: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={locationSearchQuery}
                        onChange={(e) => setLocationSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                        placeholder="Search city, area, or landmark..."
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          fontSize: 14,
                          border: '1px solid #ddd',
                          borderRadius: 8,
                          outline: 'none'
                        }}
                        disabled={locationLoading}
                      />
                      <button
                        onClick={handleLocationSearch}
                        disabled={locationLoading || !locationSearchQuery.trim()}
                        style={{
                          padding: '10px 20px',
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#fff',
                          backgroundColor: locationLoading || !locationSearchQuery.trim() ? '#ccc' : '#B42318',
                          border: 'none',
                          borderRadius: 8,
                          cursor: locationLoading || !locationSearchQuery.trim() ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <FiSearch size={16} />
                        {locationLoading ? 'Searching...' : 'Search'}
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ height: 400 }}>
                    <MapContainer 
                      center={mapCenter} 
                      zoom={13} 
                      style={{ height: '100%', width: '100%' }}
                      onClick={async (e) => {
                        const latitude = e.latlng.lat;
                        const longitude = e.latlng.lng;
                        setMapCenter([latitude, longitude]);
                        
                        // Reverse geocoding
                        try {
                          const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                          );
                          const data = await response.json();
                          const address = data.display_name || `${latitude}, ${longitude}`;
                          
                          setForm({ ...form, latitude, longitude, address });
                        } catch (error) {
                          setForm({ ...form, latitude, longitude, address: `${latitude}, ${longitude}` });
                        }
                      }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                      {form.latitude && form.longitude && (
                        <Marker position={[form.latitude, form.longitude]}>
                          <Popup>
                            Selected Location<br />
                            {form.address || `${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)}`}
                          </Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>
                  <div style={{ padding: 12, backgroundColor: '#f8f8f8', textAlign: 'center', fontSize: 13, color: '#666' }}>
                    💡 Search for your property location or click on the map
                  </div>
                </div>
              )}
              
              <small style={{ color: '#666', display: 'block', marginTop: 8 }}>
                Click the button to automatically capture your property's exact location. This helps guests find you on the map.
              </small>
            </div>
          </div>
        </div>

        <CalendarLinksFields form={form} setForm={setForm} />

        <ManualBlockedDatesFields form={form} setForm={setForm} />

        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Photos</h2>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Main Photo *</label>
            <input
              style={styles.input}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
            {imageError && <p style={{ color: 'red', marginTop: 5, fontSize: 12 }}>{imageError}</p>}
            {form.imagePreview && (
              <img
                src={form.imagePreview}
                alt="Preview"
                style={styles.imagePreview}
              />
            )}
          </div>
        </div>

        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Amenities</h2>
          <div style={styles.checkboxGroup}>
            {AMENITIES.map(amenity => (
              <label key={amenity.id} style={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={form.amenities.includes(amenity.id)}
                  onChange={() => handleAmenityChange(amenity.id)}
                />
                {amenity.icon && <span>{amenity.icon}</span>}
                {amenity.name}
              </label>
            ))}
          </div>
        </div>

        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Additional Information</h2>
          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={form.coupleFriendly}
                onChange={(e) => setForm({ ...form, coupleFriendly: e.target.checked })}
              />
              Couple Friendly
            </label>

            <label style={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={form.hourly}
                onChange={(e) => setForm({ ...form, hourly: e.target.checked })}
              />
              Hourly Stays Available
            </label>

            <label style={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={form.premium}
                onChange={(e) => setForm({ ...form, premium: e.target.checked })}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                Premium Listing <span style={styles.premiumBadge}><FiStar /> FEATURED</span>
              </span>
            </label>
          </div>
        </div>

        {showPublishPreview && (
          <section id="property-publish-preview" className="property-publish-preview">
            <div className="property-publish-preview-media">
              {form.imagePreview ? (
                <img src={form.imagePreview} alt={`${form.name || "Property"} preview`} />
              ) : (
                <div>No photo selected</div>
              )}
            </div>
            <div className="property-publish-preview-body">
              <span>Preview before publish</span>
              <h2>{form.name || "Property name"}</h2>
              <p>{form.description || "Property description will appear here."}</p>
              <div className="property-publish-preview-grid">
                <div>
                  <small>Location</small>
                  <strong>{[form.area, form.city].filter(Boolean).join(", ") || "Not set"}</strong>
                </div>
                <div>
                  <small>Price</small>
                  <strong>
                    ₹{form.price || "0"} / {PRICE_TYPES.find(type => type.id === form.priceType)?.suffix || "night"}
                  </strong>
                </div>
                <div>
                  <small>Units</small>
                  <strong>{normalizeUnitCount(form.unitCount)} unit{normalizeUnitCount(form.unitCount) === 1 ? "" : "s"}</strong>
                </div>
                <div>
                  <small>Max Guests</small>
                  <strong>{form.maxGuests || 1}</strong>
                </div>
                <div>
                  <small>Room Type</small>
                  <strong>{form.roomType || "Not set"}</strong>
                </div>
                <div>
                  <small>Contact</small>
                  <strong>{form.contact || "Not set"}</strong>
                </div>
              </div>
              {form.amenities.length > 0 && (
                <div className="property-publish-preview-tags">
                  {form.amenities.map(amenityId => {
                    const amenity = AMENITIES.find(item => item.id === amenityId);
                    return <span key={amenityId}>{amenity?.name || amenityId}</span>;
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {showPublishPreview ? (
          <div className="property-publish-actions">
            <button
              type="button"
              style={{ ...styles.filterButton, margin: 0 }}
              onClick={() => setShowPublishPreview(false)}
              disabled={loading}
            >
              Edit Details
            </button>
            <button
              style={{ ...styles.submitButton, marginTop: 0 }}
              type="submit"
              disabled={loading || !user || imageError}
            >
              {loading ? "Publishing..." : "Publish Property"}
            </button>
          </div>
        ) : (
          <button
            style={styles.submitButton}
            type="submit"
            disabled={loading || !user || imageError}
          >
            Preview Property
          </button>
        )}
      </form>
    </div>
  );
}

/* ------------------------------
   Edit Homestay Form
------------------------------ */
function EditHomestayForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    priceType: "perNight",
    additionalPrices: {},
    unitCount: 1,
    platformPrices: {},
    city: "",
    area: "",
    contact: "",
    roomType: "",
    maxGuests: 2,
    coupleFriendly: false,
    hourly: false,
    petsAllowed: false,
    smokingAllowed: false,
    amenities: [],
    premium: false,
    imagePreview: null,
    icalUrl: "",
    calendarLinks: [],
    manualBlockedDates: [],
    latitude: null,
    longitude: null,
    address: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCenter, setMapCenter] = useState([23.6345, 85.3803]);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const loadHomestay = async () => {
      try {
        const ref = doc(db, "homestays", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          alert("Listing not found");
          navigate("/");
          return;
        }
        const data = snap.data();

        const currentUser = auth.currentUser;
        if (
          currentUser &&
          data.createdBy &&
          data.createdBy !== currentUser.uid &&
          !isAdminUser(currentUser)
        ) {
          alert("You are not allowed to edit this listing.");
          navigate("/");
          return;
        }

        setForm({
          name: data.name || "",
          description: data.description || "",
          price: data.price || "",
          priceType: data.priceType || "perNight",
          additionalPrices: data.additionalPrices || {},
          unitCount: data.unitCount || data.units || 1,
          platformPrices: data.platformPrices || {},
          city: data.city || "",
          area: data.area || "",
          contact: data.contact || "",
          roomType: data.roomType || "",
          maxGuests: data.maxGuests || 2,
          coupleFriendly: !!data.coupleFriendly,
          hourly: !!data.hourly,
          petsAllowed: !!data.petsAllowed,
          smokingAllowed: !!data.smokingAllowed,
          amenities: data.amenities || [],
          premium: !!data.premium,
          imagePreview: data.imageUrl || null,
          icalUrl: data.icalUrl || "",
          calendarLinks: normalizeListingCalendarLinks(data.calendarLinks, data.icalUrl),
          manualBlockedDates: normalizeManualBlockedDates(data.manualBlockedDates),
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          address: data.address || ""
        });
        setInitialLoaded(true);
      } catch (err) {
        console.error(err);
        alert("Failed to load listing");
        navigate("/");
      }
    };

    loadHomestay();
  }, [id, navigate]);

  const handleAmenityChange = (amenityId) => {
    const updatedAmenities = form.amenities.includes(amenityId)
      ? form.amenities.filter(id => id !== amenityId)
      : [...form.amenities, amenityId];

    setForm({ ...form, amenities: updatedAmenities });
  };

  const handleAdditionalPriceChange = (priceTypeId, value) => {
    const updatedPrices = { ...form.additionalPrices };
    if (value && !isNaN(value) && Number(value) > 0) {
      updatedPrices[priceTypeId] = Number(value);
    } else {
      delete updatedPrices[priceTypeId];
    }
    setForm({ ...form, additionalPrices: updatedPrices });
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude}, ${longitude}`;
          
          setForm({ 
            ...form, 
            latitude, 
            longitude,
            address
          });
          setMapCenter([latitude, longitude]);
          setLocationLoading(false);
          alert("Location captured successfully!");
        } catch (error) {
          setForm({ 
            ...form, 
            latitude, 
            longitude,
            address: `${latitude}, ${longitude}`
          });
          setMapCenter([latitude, longitude]);
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationError("Unable to retrieve your location. Please enable location access.");
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleLocationSearch = async () => {
    if (!locationSearchQuery.trim()) return;
    
    setLocationLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        setForm({
          ...form,
          latitude,
          longitude,
          address: display_name
        });
        setMapCenter([latitude, longitude]);
        setLocationLoading(false);
        alert("Location found and set successfully!");
      } else {
        setLocationLoading(false);
        alert('Location not found. Try searching for a city, area, or landmark.');
      }
    } catch (error) {
      console.error('Location search error:', error);
      setLocationLoading(false);
      alert('Failed to search location. Please try again.');
    }
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    setForm({ 
      ...form, 
      city,
      area: ""
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setImageError("Image size must be less than 2MB");
      return;
    }

    if (!file.type.match("image.*")) {
      setImageError("Only image files are allowed");
      return;
    }

    setImageError(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, imagePreview: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const isValidIcalUrl = (url) => {
    if (!url) return true; // optional
    try {
      const u = new URL(url);
      const isWebCal = u.protocol === "webcal:";
      const isHttp = u.protocol === "http:" || u.protocol === "https:";
      return isWebCal || isHttp;
    } catch {
      return false;
    }
  };

  const hasInvalidCalendarLinks = () => (
    getEditableCalendarLinks(form).some(link => link.url && !isValidIcalUrl(link.url))
  );

  const uploadImage = async () => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Upload failed:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (imageError) return;
    if (hasInvalidCalendarLinks()) {
      alert("Please enter valid calendar links (https://, http://, or webcal://).");
      return;
    }

    setLoading(true);
    try {
      let imageUrlToSave = form.imagePreview;

      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (!uploadedUrl) throw new Error("Image upload failed");
        imageUrlToSave = uploadedUrl;
      }
      const calendarLinks = normalizeListingCalendarLinks(form.calendarLinks, form.icalUrl);

      const ref = doc(db, "homestays", id);
      await updateDoc(ref, {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        priceType: form.priceType,
        additionalPrices: form.additionalPrices,
        unitCount: normalizeUnitCount(form.unitCount),
        platformPrices: cleanPlatformPrices(form.platformPrices),
        city: form.city,
        area: form.area,
        contact: form.contact,
        roomType: form.roomType,
        maxGuests: Number(form.maxGuests),
        coupleFriendly: form.coupleFriendly,
        hourly: form.hourly,
        petsAllowed: form.petsAllowed,
        smokingAllowed: form.smokingAllowed,
        amenities: form.amenities,
        premium: form.premium,
        imageUrl: imageUrlToSave,
        latitude: form.latitude,
        longitude: form.longitude,
        address: form.address,
        icalUrl: calendarLinks[0]?.url || "",
        calendarLinks,
        manualBlockedDates: normalizeManualBlockedDates(form.manualBlockedDates)
      });

      alert("Homestay updated successfully!");
      navigate(`/homestays/${createSlug(form.name, id, form.city)}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to update homestay");
    }
    setLoading(false);
  };

  const availableAreas = form.city ? AREAS_BY_CITY[form.city] || [] : [];

  if (!initialLoaded) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        Loading listing...
      </div>
    );
  }

  return (
    <div style={styles.formContainer}>
      <SeoHelmet
        title="Edit Homestay Listing | Homavia"
        description="Host dashboard for editing a Homavia homestay listing, pricing, units, amenities, and calendar sync."
        canonicalPath="/edit-homestay"
        robots={PRIVATE_ROBOTS}
      />

      <h1 style={styles.formTitle}>Edit your homestay</h1>
      <p className="form-kicker">
        Keep pricing, units, calendar sync, and guest-facing details current across every channel.
      </p>

      <div style={styles.premiumBanner}>
        <FiStar size={20} color="#ffd700" />
        <div>
          <p style={{ fontWeight: 'bold', marginBottom: 5, fontSize: 14 }}>Premium Listing</p>
          <p style={{ fontSize: 12 }}>Update your details and keep your listing fresh.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Basic Information</h2>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Homestay Name *</label>
            <input
              style={styles.input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Description *</label>
            <textarea
              style={styles.textarea}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              placeholder="Tell guests what makes your place special..."
            />
          </div>

          <div style={styles.formGrid} className="form-grid">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Primary Price (₹) *</label>
              <input
                style={styles.input}
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                placeholder="Enter primary price"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Primary Price Type *</label>
              <select
                style={styles.input}
                value={form.priceType}
                onChange={(e) => setForm({ ...form, priceType: e.target.value })}
                required
              >
                {PRICE_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Additional Pricing Options (Optional)</label>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
              Add alternative pricing for different booking periods
            </p>
            {PRICE_TYPES.filter(pt => pt.id !== form.priceType).map(priceType => (
              <div key={priceType.id} style={{ marginBottom: 12 }}>
                <label style={{ ...styles.label, fontSize: 13, color: '#666' }}>
                  {priceType.label} (₹)
                </label>
                <input
                  style={styles.input}
                  type="number"
                  value={form.additionalPrices[priceType.id] || ''}
                  onChange={(e) => handleAdditionalPriceChange(priceType.id, e.target.value)}
                  placeholder={`Optional price per ${priceType.suffix}`}
                />
              </div>
            ))}
          </div>
        </div>

        <PlatformPricingFields form={form} setForm={setForm} />

        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Location & Calendar</h2>
          <div style={styles.formGrid} className="form-grid">
            <div style={styles.inputGroup}>
              <label style={styles.label}>City *</label>
              <select
                style={styles.input}
                value={form.city}
                onChange={handleCityChange}
                required
              >
                <option value="">Select City</option>
                {ALL_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Area *</label>
              <select
                style={styles.input}
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                required
                disabled={!form.city}
              >
                <option value="">Select Area</option>
                {availableAreas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Room Type *</label>
              <select
                style={styles.input}
                value={form.roomType}
                onChange={(e) => setForm({ ...form, roomType: e.target.value })}
                required
              >
                <option value="">Select Room Type</option>
                {ROOM_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone Number *</label>
              <input
                style={styles.input}
                type="tel"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Maximum Guests *</label>
              <input
                style={styles.input}
                type="number"
                min="1"
                value={form.maxGuests}
                onChange={(e) => setForm({ ...form, maxGuests: e.target.value })}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Property Location (GPS)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  style={{ ...styles.locationButton, flex: 1 }}
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                >
                  <FiNavigation size={16} />
                  {locationLoading ? 'Getting Location...' : 'Use Current Location'}
                </button>
                <button
                  type="button"
                  style={{ 
                    ...styles.locationButton, 
                    flex: 1,
                    backgroundColor: showMapPicker ? '#B42318' : '#fff',
                    color: showMapPicker ? '#fff' : '#222',
                    border: showMapPicker ? 'none' : '1px solid #ddd'
                  }}
                  onClick={() => {
                    setShowMapPicker(!showMapPicker);
                    if (form.latitude && form.longitude) {
                      setMapCenter([form.latitude, form.longitude]);
                    }
                  }}
                >
                  <FiMapPin size={16} />
                  Pick on Map
                </button>
              </div>
              {locationError && (
                <p style={{ color: '#B42318', marginTop: 8, fontSize: 13 }}>
                  {locationError}
                </p>
              )}
              {form.latitude && form.longitude && (
                <div style={{ 
                  marginTop: 10, 
                  padding: 10, 
                  backgroundColor: '#e8f5e9', 
                  borderRadius: 8,
                  fontSize: 13
                }}>
                  <p style={{ margin: 0, color: '#2e7d32', fontWeight: 'bold', marginBottom: 4 }}>
                    ✓ Location Captured
                  </p>
                  <p style={{ margin: 0, color: '#666', fontSize: 12 }}>
                    Lat: {form.latitude.toFixed(6)}, Lng: {form.longitude.toFixed(6)}
                  </p>
                  {form.address && (
                    <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 12 }}>
                      📍 {form.address}
                    </p>
                  )}
                </div>
              )}
              
              {showMapPicker && (
                <div style={{ marginTop: 12, border: '2px solid #B42318', borderRadius: 12, overflow: 'hidden' }}>
                  {/* Location Search Bar */}
                  <div style={{ padding: 12, backgroundColor: '#fff', borderBottom: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={locationSearchQuery}
                        onChange={(e) => setLocationSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                        placeholder="Search city, area, or landmark..."
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          fontSize: 14,
                          border: '1px solid #ddd',
                          borderRadius: 8,
                          outline: 'none'
                        }}
                        disabled={locationLoading}
                      />
                      <button
                        onClick={handleLocationSearch}
                        disabled={locationLoading || !locationSearchQuery.trim()}
                        style={{
                          padding: '10px 20px',
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#fff',
                          backgroundColor: locationLoading || !locationSearchQuery.trim() ? '#ccc' : '#B42318',
                          border: 'none',
                          borderRadius: 8,
                          cursor: locationLoading || !locationSearchQuery.trim() ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <FiSearch size={16} />
                        {locationLoading ? 'Searching...' : 'Search'}
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ height: 400 }}>
                    <MapContainer 
                      center={mapCenter} 
                      zoom={13} 
                      style={{ height: '100%', width: '100%' }}
                      onClick={async (e) => {
                        const latitude = e.latlng.lat;
                        const longitude = e.latlng.lng;
                        setMapCenter([latitude, longitude]);
                        
                        // Reverse geocoding
                        try {
                          const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                          );
                          const data = await response.json();
                          const address = data.display_name || `${latitude}, ${longitude}`;
                          
                          setForm({ ...form, latitude, longitude, address });
                        } catch (error) {
                          setForm({ ...form, latitude, longitude, address: `${latitude}, ${longitude}` });
                        }
                      }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                      {form.latitude && form.longitude && (
                        <Marker position={[form.latitude, form.longitude]}>
                          <Popup>
                            Selected Location<br />
                            {form.address || `${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)}`}
                          </Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>
                  <div style={{ padding: 12, backgroundColor: '#f8f8f8', textAlign: 'center', fontSize: 13, color: '#666' }}>
                    💡 Search for your property location or click on the map
                  </div>
                </div>
              )}
              
              <small style={{ color: '#666', display: 'block', marginTop: 8 }}>
                Capture or update your property's exact location.
              </small>
            </div>
          </div>
        </div>

        <CalendarLinksFields form={form} setForm={setForm} />

        <ManualBlockedDatesFields form={form} setForm={setForm} />

        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Photos</h2>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Main Photo</label>
            <input
              style={styles.input}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              Leave empty to keep the existing photo.
            </p>
            {imageError && <p style={{ color: 'red', marginTop: 5, fontSize: 12 }}>{imageError}</p>}
            {form.imagePreview && (
              <img
                src={form.imagePreview}
                alt="Preview"
                style={styles.imagePreview}
              />
            )}
          </div>
        </div>

        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Amenities</h2>
          <div style={styles.checkboxGroup}>
            {AMENITIES.map(amenity => (
              <label key={amenity.id} style={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={form.amenities.includes(amenity.id)}
                  onChange={() => handleAmenityChange(amenity.id)}
                />
                {amenity.icon && <span>{amenity.icon}</span>}
                {amenity.name}
              </label>
            ))}
          </div>
        </div>

        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Additional Information</h2>
          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={form.coupleFriendly}
                onChange={(e) => setForm({ ...form, coupleFriendly: e.target.checked })}
              />
              Couple Friendly
            </label>

            <label style={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={form.hourly}
                onChange={(e) => setForm({ ...form, hourly: e.target.checked })}
              />
              Hourly Stays Available
            </label>

            <label style={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={form.premium}
                onChange={(e) => setForm({ ...form, premium: e.target.checked })}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                Premium Listing <span style={styles.premiumBadge}><FiStar /> FEATURED</span>
              </span>
            </label>
          </div>
        </div>

        <button
          style={styles.submitButton}
          type="submit"
          disabled={loading || !user || imageError}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

/* ------------------------------
   Homestay Detail
------------------------------ */
function HomestayDetail() {
  const { slug } = useParams();
  const [homestay, setHomestay] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [bookedDates, setBookedDates] = useState([]);
  const navigate = useNavigate();
  const isDesktop = useIsDesktop(960);

  useEffect(() => {
    const fetchHomestay = async () => {
      const id = getIdFromSlug(slug);
      const docRef = doc(db, "homestays", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setHomestay(data);
        try {
          const dates = await getListingBlockedDates(data);
          setBookedDates(dates);
        } catch (err) {
          console.log('Could not fetch calendar:', err);
          setBookedDates(getManualBlockedCalendarDates(data.manualBlockedDates));
        }
      } else if (getPublicHomestayById(id)) {
        const data = getPublicHomestayById(id);
        setHomestay(data);
        setBookedDates(getManualBlockedCalendarDates(data.manualBlockedDates));
      } else {
        navigate("/");
      }
    };
    fetchHomestay();
  }, [slug, navigate]);

  const bookedDateMap = useMemo(() => {
    return new Map(bookedDates.map(blockedDate => [blockedDate.key, blockedDate]));
  }, [bookedDates]);

  const bookedSourceSummary = useMemo(() => {
    const totals = bookedDates.reduce((acc, blockedDate) => {
      blockedDate.sources.forEach(source => {
        acc[source] = (acc[source] || 0) + 1;
      });
      return acc;
    }, {});

    return Object.entries(totals)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
  }, [bookedDates]);

  if (!homestay) return <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>;

  const selectedAmenities = AMENITIES.filter(amenity => 
    homestay.amenities?.includes(amenity.id)
  );

  const listingName = toPlainText(homestay.name || "Homavia homestay");
  const listingCity = toPlainText(homestay.city || "India");
  const listingArea = toPlainText(homestay.area || listingCity);
  const priceUnit = getPriceUnitLabel(homestay.priceType);
  const pageUrl = buildAbsoluteUrl(`/homestays/${createSlug(listingName, homestay.id, listingCity)}`);
  const imageUrl = normalizeSeoImage(homestay.imageUrl);
  const seoTitle = `${listingName} in ${listingArea}, ${listingCity} | Homavia`;
  const seoDescription = truncateMeta(
    `${homestay.description ? `${ensureSentence(homestay.description)} ` : ""}Book ${listingName} in ${listingArea}, ${listingCity}. ${homestay.roomType || "Homestay"}${homestay.maxGuests ? ` for up to ${homestay.maxGuests} guests` : ""}${homestay.price ? ` from ₹${homestay.price}/${priceUnit}` : ""}. ${homestay.coupleFriendly ? "Couple-friendly stay. " : ""}Check details and contact the host on Homavia.`
  );
  const calendarLinkNames = normalizeListingCalendarLinks(homestay.calendarLinks, homestay.icalUrl)
    .map(link => link.source);
  const manualBlockedDateCount = normalizeManualBlockedDates(homestay.manualBlockedDates).length;
  const blockedSourceLabel = [
    calendarLinkNames.length > 0 ? calendarLinkNames.join(', ') : null,
    manualBlockedDateCount > 0 ? 'Homavia portal' : null
  ].filter(Boolean).join(' + ');
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": `${pageUrl}#lodging`,
    "name": listingName,
    "url": pageUrl,
    "mainEntityOfPage": pageUrl,
    "description": seoDescription,
    "image": [imageUrl],
    "inLanguage": SITE_LANGUAGE,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": homestay.address,
      "addressLocality": listingArea,
      "addressRegion": listingCity,
      "addressCountry": "IN"
    },
    "geo": homestay.latitude && homestay.longitude ? {
      "@type": "GeoCoordinates",
      "latitude": homestay.latitude,
      "longitude": homestay.longitude
    } : undefined,
    "hasMap": homestay.latitude && homestay.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${homestay.latitude},${homestay.longitude}`
      : undefined,
    "telephone": homestay.contact || CONTACT_PHONE,
    "sameAs": homestay.googleMapLink ? [homestay.googleMapLink] : undefined,
    "priceRange": homestay.price ? `INR ${homestay.price}` : undefined,
    "aggregateRating": homestay.rating && homestay.reviewCount ? {
      "@type": "AggregateRating",
      "ratingValue": homestay.rating,
      "bestRating": "5",
      "ratingCount": homestay.reviewCount
    } : undefined,
    "amenityFeature": selectedAmenities.map(a => ({
      "@type": "LocationFeatureSpecification",
      "name": a.name,
      "value": true
    })),
    "makesOffer": homestay.price ? {
      "@type": "Offer",
      "url": pageUrl,
      "priceCurrency": "INR",
      "price": homestay.price,
      "availability": "https://schema.org/InStock",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": homestay.price,
        "priceCurrency": "INR",
        "unitText": priceUnit
      },
      "seller": {
        "@type": "Organization",
        "name": SITE_NAME,
        "url": SITE_URL
      }
    } : undefined
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": buildAbsoluteUrl("/")
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": listingCity,
        "item": buildAbsoluteUrl(`/?city=${encodeURIComponent(listingCity)}`)
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": listingArea,
        "item": buildAbsoluteUrl(`/?city=${encodeURIComponent(listingCity)}&area=${encodeURIComponent(listingArea)}`)
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": listingName,
        "item": pageUrl
      }
    ]
  };
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": listingName,
    "description": seoDescription,
    "image": imageUrl,
    "category": homestay.roomType || "Homestay",
    "brand": {
      "@type": "Brand",
      "name": SITE_NAME
    },
    "offers": homestay.price ? {
      "@type": "Offer",
      "url": pageUrl,
      "priceCurrency": "INR",
      "price": homestay.price,
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": SITE_NAME,
        "url": SITE_URL
      }
    } : undefined
  };
  const bookingCardStyle = {
    ...styles.bookingCard,
    ...(isDesktop
      ? { order: 'initial', position: 'sticky', top: 96 }
      : { order: -1, position: 'static' })
  };

  return (
    <div style={styles.detailContainer} className="detail-page">
      <SeoHelmet
        title={seoTitle}
        description={seoDescription}
        keywords={`${listingName}, homestay in ${listingCity}, ${listingArea} homestay, ${homestay.roomType || "private stay"}, ${homestay.coupleFriendly ? "couple friendly homestay, " : ""}book homestay ${listingCity}, Homavia`}
        canonicalPath={pageUrl}
        image={imageUrl}
        imageAlt={`${listingName} homestay in ${listingCity}`}
        type="website"
        schema={[structuredData, breadcrumbSchema, productSchema]}
      />

      <div style={styles.detailHeader}>
        <h1 style={styles.detailTitle}>
          {homestay.name}
          {homestay.premium && (
            <span style={styles.premiumBadge}>
              <FiStar /> PREMIUM
            </span>
          )}
        </h1>
        <div style={styles.detailLocation}>
          <FiMapPin /> {homestay.area}, {homestay.city} • {homestay.roomType || 'Private Room'}
        </div>
        <div style={styles.rating}>
          <FiStar fill={designTokens.colors.gold} color={designTokens.colors.gold} /> {homestay.rating || 'New'}
        </div>
      </div>

      <div
        className="detail-grid"
        style={isDesktop ? styles.detailGridDesktop : styles.detailGridMobile}
      >
        <div className="detail-main" style={styles.detailMain}>
          <img
            src={homestay.imageUrl}
            alt={`${homestay.name} - Premium ${homestay.roomType} in ${homestay.area}, ${homestay.city}`}
            title={`${homestay.name} - Book on Homavia`}
            style={styles.detailImage}
          />

          {homestay.latitude && homestay.longitude && (
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 22, fontWeight: '600', marginBottom: 16, color: '#222', paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>Location</h2>
              <div style={styles.mapContainer}>
                <MapContainer 
                  center={[homestay.latitude, homestay.longitude]} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[homestay.latitude, homestay.longitude]}>
                    <Popup>
                      <div style={{ textAlign: 'center' }}>
                        <strong>{homestay.name}</strong>
                        <br />
                        {homestay.address || `${homestay.area}, ${homestay.city}`}
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
              {homestay.address && (
                <p style={{ marginTop: 10, fontSize: 14, color: '#666' }}>
                  📍 {homestay.address}
                </p>
              )}
            </div>
          )}

          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 22, fontWeight: '600', marginBottom: 16, color: '#222', paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>About this place</h2>
            <p style={{ lineHeight: 1.7, fontSize: 15, color: '#484848' }}>{homestay.description || 'No description provided.'}</p>
          </div>

          <div>
            <h2 style={{ fontSize: 22, fontWeight: '600', marginBottom: 16, color: '#222', paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>Amenities</h2>
            <div style={styles.detailAmenities}>
              {selectedAmenities.length > 0 ? (
                selectedAmenities.map(amenity => (
                  <div key={amenity.id} style={styles.amenityItem}>
                    {amenity.icon || <FiHome />}
                    <span>{amenity.name}</span>
                  </div>
                ))
              ) : (
                <p>No amenities listed</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="detail-sidebar" style={bookingCardStyle}>
          <div style={styles.priceDetail}>
            ₹{homestay.price} 
            <span style={{ fontWeight: 'normal', fontSize: 16 }}>
              / {PRICE_TYPES.find(pt => pt.id === homestay.priceType)?.suffix || 'night'}
            </span>
          </div>

          {blockedSourceLabel && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 0',
              marginBottom: 16,
              borderTop: `1px solid ${designTokens.colors.borderLight}`,
              borderBottom: `1px solid ${designTokens.colors.borderLight}`
            }}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: designTokens.colors.textMuted,
                fontSize: 13,
                fontWeight: 600
              }}>
                <FiCalendar size={15} /> Blocked source
              </span>
              <span style={{
                color: designTokens.colors.dark,
                fontSize: 13,
                fontWeight: 800
              }}>
                {blockedSourceLabel}
              </span>
            </div>
          )}

          {homestay.additionalPrices && Object.keys(homestay.additionalPrices).length > 0 && (
            <div style={styles.additionalPricing}>
              <h4 style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Other Pricing Options</h4>
              {Object.entries(homestay.additionalPrices).map(([priceTypeId, price]) => {
                const priceTypeInfo = PRICE_TYPES.find(pt => pt.id === priceTypeId);
                return (
                  <div key={priceTypeId} style={styles.priceRow}>
                    <span style={{ color: '#666' }}>{priceTypeInfo?.label}</span>
                    <span style={{ fontWeight: 'bold' }}>₹{price}</span>
                  </div>
                );
              })}
            </div>
          )}

          {homestay.premium && (
            <div style={{ backgroundColor: '#fff8e1', padding: 12, borderRadius: 8, marginBottom: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <FiCheck color="#4CAF50" size={16} />
                <span style={{ fontWeight: 'bold', fontSize: 14 }}>Premium Verified</span>
              </div>
              <p style={{ fontSize: 12 }}>This host has been verified and offers premium amenities.</p>
            </div>
          )}

          <button 
            style={styles.bookButton}
            onClick={() => setShowCalendar(!showCalendar)}
          >
            {showCalendar ? 'Hide Calendar' : 'Check Availability'}
          </button>

          {showCalendar && (
            <div style={{ marginTop: 15, marginBottom: 15 }}>
              <Calendar
                className="professional-calendar"
                tileClassName={({ date, view }) => {
                  if (view !== 'month') return null;
                  return bookedDateMap.has(getLocalDateKey(date)) ? 'booked-date' : 'available-date';
                }}
                tileContent={({ date, view }) => {
                  if (view !== 'month') return null;
                  const blockedDate = bookedDateMap.get(getLocalDateKey(date));
                  if (!blockedDate) return null;

                  const sourceText = blockedDate.sources.join(', ');
                  return (
                    <span
                      className="calendar-platform-pill"
                      title={`Blocked via ${sourceText}`}
                    >
                      {getShortPlatformLabel(blockedDate.source)}
                    </span>
                  );
                }}
                minDate={new Date()}
              />
              <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: '#f0f0f0' }}></div>
                  <span>Available</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: '#ffebee' }}></div>
                  <span>Blocked</span>
                </div>
              </div>
              {bookedSourceSummary.length > 0 && (
                <div className="blocked-source-summary">
                  <div className="blocked-source-title">Blocked by platform</div>
                  {bookedSourceSummary.map(({ source, count }) => (
                    <div key={source} className="blocked-source-row">
                      <span>{source}</span>
                      <strong>{count} {count === 1 ? 'date' : 'dates'}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div style={styles.buttonGroup}>
            <a 
              href={`tel:${homestay.contact}`} 
              style={{...styles.callButton, marginTop: 0}}
              onClick={() => trackCallClick(homestay.id, homestay.name)}
            >
              <FiPhone /> Call
            </a>
            <a 
              href={`https://wa.me/${homestay.contact.replace(/[^0-9]/g, '')}?text=Hi, I'm interested in ${encodeURIComponent(homestay.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{...styles.whatsappButton, marginTop: 0}}
              onClick={() => trackWhatsAppClick(homestay.id, homestay.name)}
            >
              <FiMessageCircle /> WhatsApp
            </a>
          </div>

          {homestay.googleMapLink && (
            <a
              href={homestay.googleMapLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...styles.bookButton,
                marginTop: 10,
                backgroundColor: '#ffffff',
                color: designTokens.colors.primary,
                border: `1px solid ${designTokens.colors.primary}`,
                textDecoration: 'none'
              }}
            >
              <FiMapPin /> Open Google location
            </a>
          )}

          {auth.currentUser?.uid === homestay.createdBy && (
            <>
              <button
                style={{ ...styles.bookButton, backgroundColor: '#1565c0', marginTop: 10 }}
                onClick={() => navigate(`/edit-homestay/${homestay.id}`)}
              >
                Edit Listing
              </button>

              <button
                style={{ ...styles.bookButton, backgroundColor: '#c62828', marginTop: 10 }}
                onClick={async () => {
                  if (!window.confirm("Delete this listing?")) return;
                  await deleteDoc(doc(db, "homestays", homestay.id));
                  navigate("/");
                }}
              >
                Delete Listing
              </button>
            </>
          )}

          <div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px solid #ebebeb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <FiUser size={16} />
              <span style={{ fontWeight: '500' }}>Hosted by {homestay.createdByName || 'Owner'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------
   Manual Host CRM Panel
------------------------------ */
const getDailyEntryGuestCount = (value) => {
  const count = Math.round(Number(value) || 1);
  return Math.min(Math.max(count, 1), 20);
};

const createDailyGuestDetail = () => ({
  name: "",
  phone: "",
  address: ""
});

const createDailyGuestDetails = (count = 1, existingDetails = []) => {
  const normalizedCount = getDailyEntryGuestCount(count);
  return Array.from({ length: normalizedCount }, (_, index) => ({
    ...createDailyGuestDetail(),
    ...(existingDetails[index] || {})
  }));
};

const cleanDailyGuestDetails = (guestDetails = [], guestCount = 1) => (
  createDailyGuestDetails(guestCount, guestDetails)
    .map(guest => ({
      name: toPlainText(guest.name).trim(),
      phone: toPlainText(guest.phone).trim(),
      address: toPlainText(guest.address).trim()
    }))
);

const getSavedDailyGuestDetails = (entry = {}) => {
  const savedDetails = Array.isArray(entry.guestDetails)
    ? entry.guestDetails
    : Array.isArray(entry.guests)
      ? entry.guests
      : [];
  const cleaned = savedDetails
    .map(guest => ({
      name: toPlainText(guest.name).trim(),
      phone: toPlainText(guest.phone).trim(),
      address: toPlainText(guest.address).trim()
    }))
    .filter(guest => guest.name || guest.phone || guest.address);

  if (cleaned.length) return cleaned;

  const fallbackGuest = {
    name: toPlainText(entry.guestName).trim(),
    phone: toPlainText(entry.guestPhone).trim(),
    address: toPlainText(entry.guestAddress).trim()
  };

  return fallbackGuest.name || fallbackGuest.phone || fallbackGuest.address
    ? [fallbackGuest]
    : [];
};

const createDailyEntryForm = (listingId = "") => ({
  listingId,
  entryDate: getLocalDateKey(new Date()),
  unitNumber: "1",
  status: "Occupied",
  platform: "Homavia / Direct booking",
  guestCount: "1",
  guestDetails: createDailyGuestDetails(1),
  price: "",
  paymentStatus: "Paid",
  notes: ""
});

const createDailyEntryDocId = (uid, listingId, entryDate, unitNumber) => (
  [HOST_DAILY_ENTRY_RECORD_TYPE, uid, listingId, entryDate, `unit${unitNumber}`]
    .join("_")
    .replace(/[^A-Za-z0-9_-]/g, "_")
);

const getDailyEntryPrice = (entry) => (
  Number(entry?.price ?? entry?.revenue ?? entry?.amount) || 0
);

function HostManualCrmPanel({ listings, user }) {
  const [monthValue, setMonthValue] = useState(getMonthValue());
  const [activeTab, setActiveTab] = useState("daily");
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState("");
  const hasRealListings = listings.length > 0;
  const propertyOptions = useMemo(() => (
    hasRealListings
      ? listings
      : [{ id: HOST_MANUAL_FALLBACK_LISTING_ID, name: HOST_MANUAL_FALLBACK_LISTING_NAME }]
  ), [hasRealListings, listings]);
  const firstListingId = propertyOptions[0]?.id || HOST_MANUAL_FALLBACK_LISTING_ID;
  const hostPaidByName = user?.displayName || user?.email || "Host";
  const [dailyEntryForm, setDailyEntryForm] = useState(createDailyEntryForm(firstListingId));
  const [expenseForm, setExpenseForm] = useState({
    listingId: firstListingId,
    expenseDate: getLocalDateKey(new Date()),
    category: "Cleaning",
    amount: "",
    paidBy: hostPaidByName,
    customPaidBy: "",
    paymentMode: "Cash",
    notes: ""
  });
  const expensePaidByOptions = useMemo(() => {
    const savedPaidByNames = expenses
      .map(expense => toPlainText(expense.paidBy).trim())
      .filter(Boolean);
    const activePaidByName = expenseForm.paidBy && expenseForm.paidBy !== HOST_EXPENSE_CUSTOM_PAID_BY
      ? expenseForm.paidBy
      : "";

    return [hostPaidByName, activePaidByName, ...savedPaidByNames, ...HOST_EXPENSE_PAID_BY_OPTIONS]
      .filter((option, index, options) => option && options.indexOf(option) === index);
  }, [expenses, expenseForm.paidBy, hostPaidByName]);
  const [taskForm, setTaskForm] = useState({
    listingId: firstListingId,
    title: "",
    owner: "Host",
    dueDate: "",
    priority: "Medium",
    status: "Open"
  });
  const [calendarListingId, setCalendarListingId] = useState(firstListingId);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarSourceId, setCalendarSourceId] = useState("homavia");
  const [calendarBlockUnits, setCalendarBlockUnits] = useState(1);
  const [calendarNote, setCalendarNote] = useState("Manual CRM block");
  const [calendarSaving, setCalendarSaving] = useState(false);

  useEffect(() => {
    if (!firstListingId) return;

    setDailyEntryForm(current => current.listingId ? current : { ...current, listingId: firstListingId });
    setExpenseForm(current => current.listingId ? current : { ...current, listingId: firstListingId });
    setTaskForm(current => current.listingId ? current : { ...current, listingId: firstListingId });
    setCalendarListingId(current => current || firstListingId);
  }, [firstListingId]);

  useEffect(() => {
    if (!hasRealListings && activeTab === "calendar") {
      setActiveTab("daily");
    }
  }, [activeTab, hasRealListings]);

  useEffect(() => {
    setExpenseForm(current => {
      if (current.paidBy && current.paidBy !== "Host") return current;
      return { ...current, paidBy: hostPaidByName };
    });
  }, [hostPaidByName]);

  useEffect(() => {
    if (!user) return undefined;

    setLoading(true);
    const cleanups = [];
    const subscribeToCollection = (collectionName, setter) => {
      const qRef = query(collection(db, collectionName), where("createdBy", "==", user.uid));
      const unsub = onSnapshot(
        qRef,
        (snapshot) => {
          const docs = snapshot.docs
            .map((entry) => ({ id: entry.id, ...entry.data() }))
            .sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
              const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
              return bTime - aTime;
            });
          setter(docs);
          setLoading(false);
        },
        (error) => {
          console.error(`Failed to read ${collectionName}:`, error);
          setSaveError("Could not read manual CRM data from Firebase.");
          setLoading(false);
        }
      );

      cleanups.push(unsub);
    };

    subscribeToCollection(HOST_MANUAL_BOOKINGS_COLLECTION, setBookings);
    subscribeToCollection(HOST_MANUAL_EXPENSES_COLLECTION, setExpenses);
    subscribeToCollection(HOST_MANUAL_TASKS_COLLECTION, setTasks);

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [user]);

  const listingsById = useMemo(() => {
    return propertyOptions.reduce((acc, listing) => {
      acc[listing.id] = listing;
      return acc;
    }, {});
  }, [propertyOptions]);

  const dailyEntries = useMemo(() => (
    bookings.filter(booking => booking.recordType === HOST_DAILY_ENTRY_RECORD_TYPE)
  ), [bookings]);

  const monthDailyEntries = useMemo(() => (
    dailyEntries.filter(entry => String(entry.entryDate || "").startsWith(monthValue))
  ), [dailyEntries, monthValue]);

  const monthExpenses = useMemo(() => (
    expenses.filter(expense => String(expense.expenseDate || "").startsWith(monthValue))
  ), [expenses, monthValue]);

  const selectedDailyListing = listingsById[dailyEntryForm.listingId] || propertyOptions[0];
  const publishedDailyUnitOptions = useMemo(
    () => getListingPublishedUnits(selectedDailyListing),
    [selectedDailyListing]
  );
  const selectedDailyUnit = publishedDailyUnitOptions.find(unit => String(unit.unitNumber) === String(dailyEntryForm.unitNumber));

  useEffect(() => {
    if (!publishedDailyUnitOptions.length) {
      setDailyEntryForm(current => current.unitNumber ? { ...current, unitNumber: "" } : current);
      return;
    }

    const publishedUnitNumbers = publishedDailyUnitOptions.map(unit => String(unit.unitNumber));
    setDailyEntryForm(current => (
      publishedUnitNumbers.includes(String(current.unitNumber))
        ? current
        : { ...current, unitNumber: publishedUnitNumbers[0] }
    ));
  }, [publishedDailyUnitOptions]);

  const dailyEntryTotals = useMemo(() => {
    const unitMap = {};
    let totalPrice = 0;
    let occupiedDays = 0;
    let guestCount = 0;

    monthDailyEntries.forEach(entry => {
      const price = getDailyEntryPrice(entry);
      const unitNumber = String(entry.unitNumber || "1");
      const listingName = entry.listingName || listingsById[entry.listingId]?.name || "Property";
      const unitKey = `${entry.listingId || listingName}_${unitNumber}`;
      const entryGuestCount = Number(entry.guestCount) || getSavedDailyGuestDetails(entry).length;

      totalPrice += price;
      if (entry.status === "Occupied") occupiedDays += 1;
      guestCount += entryGuestCount;

      if (!unitMap[unitKey]) {
        unitMap[unitKey] = {
          unitKey,
          listingName,
          unitNumber,
          entries: 0,
          occupied: 0,
          available: 0,
          maintenance: 0,
          price: 0
        };
      }

      unitMap[unitKey].entries += 1;
      unitMap[unitKey].price += price;
      if (entry.status === "Occupied") unitMap[unitKey].occupied += 1;
      if (entry.status === "Available") unitMap[unitKey].available += 1;
      if (entry.status === "Maintenance" || entry.status === "Owner block") unitMap[unitKey].maintenance += 1;
    });

    return {
      totalPrice,
      occupiedDays,
      guestCount,
      unitSummaries: Object.values(unitMap).sort((a, b) => (
        a.listingName.localeCompare(b.listingName) ||
        Number(a.unitNumber) - Number(b.unitNumber)
      ))
    };
  }, [listingsById, monthDailyEntries]);

  const sortedMonthDailyEntries = useMemo(() => {
    return [...monthDailyEntries].sort((a, b) => (
      String(b.entryDate || "").localeCompare(String(a.entryDate || "")) ||
      (a.listingName || listingsById[a.listingId]?.name || "").localeCompare(b.listingName || listingsById[b.listingId]?.name || "") ||
      Number(a.unitNumber || 1) - Number(b.unitNumber || 1)
    ));
  }, [listingsById, monthDailyEntries]);

  const crmTotals = useMemo(() => {
    const expensePaidByMap = {};
    let totalExpenses = 0;

    monthExpenses.forEach(expense => {
      const amount = Number(expense.amount) || 0;
      const paidBy = expense.paidBy || "Host";

      totalExpenses += amount;
      if (!expensePaidByMap[paidBy]) {
        expensePaidByMap[paidBy] = { paidBy, count: 0, amount: 0 };
      }

      expensePaidByMap[paidBy].count += 1;
      expensePaidByMap[paidBy].amount += amount;
    });

    return {
      totalExpenses,
      expensesByPaidBy: Object.values(expensePaidByMap).sort((a, b) => b.amount - a.amount || a.paidBy.localeCompare(b.paidBy))
    };
  }, [monthExpenses]);

  const selectedCalendarListing = listingsById[calendarListingId] || listings[0];
  const calendarBlocks = useMemo(
    () => normalizeManualBlockedDates(selectedCalendarListing?.manualBlockedDates),
    [selectedCalendarListing]
  );
  const calendarBlocksByDate = useMemo(() => {
    return calendarBlocks.reduce((acc, block) => {
      if (!acc[block.date]) acc[block.date] = [];
      acc[block.date].push(block);
      return acc;
    }, {});
  }, [calendarBlocks]);
  const selectedCalendarDateKey = normalizeManualBlockDateKey(calendarDate);
  const selectedDateBlocks = calendarBlocksByDate[selectedCalendarDateKey] || [];
  const calendarBlockCount = calendarBlocks.length;
  const calendarBlockedRoomHolds = calendarBlocks.reduce((sum, block) => sum + getManualBlockUnitCount(block), 0);
  const selectedCalendarTotalRooms = getListingUnitCount(selectedCalendarListing);
  const selectedDateBlockedRooms = Math.min(
    selectedCalendarTotalRooms,
    selectedDateBlocks.reduce((sum, block) => sum + getManualBlockUnitCount(block), 0)
  );
  const selectedDateAvailableRooms = Math.max(selectedCalendarTotalRooms - selectedDateBlockedRooms, 0);
  const selectedSourceOption = getManualBlockSourceOption(calendarSourceId);
  const selectedSourceBlockedRooms = selectedDateBlocks
    .filter(block => block.sourceId === selectedSourceOption.id)
    .reduce((sum, block) => sum + getManualBlockUnitCount(block), 0);
  const selectedDateAvailableForSource = Math.max(
    selectedCalendarTotalRooms - (selectedDateBlockedRooms - selectedSourceBlockedRooms),
    0
  );
  const calendarBlockUnitLimit = Math.max(1, selectedDateAvailableForSource);
  const requestedCalendarBlockUnits = Math.min(normalizeUnitCount(calendarBlockUnits), calendarBlockUnitLimit);

  useEffect(() => {
    setCalendarBlockUnits(current => Math.min(normalizeUnitCount(current), calendarBlockUnitLimit));
  }, [calendarBlockUnitLimit]);

  const handleDailyGuestCountChange = (value) => {
    const nextGuestCount = getDailyEntryGuestCount(value);
    setDailyEntryForm(current => ({
      ...current,
      guestCount: String(nextGuestCount),
      guestDetails: createDailyGuestDetails(nextGuestCount, current.guestDetails)
    }));
  };

  const handleDailyGuestDetailChange = (index, field, value) => {
    setDailyEntryForm(current => {
      const nextDetails = createDailyGuestDetails(current.guestCount, current.guestDetails);
      nextDetails[index] = {
        ...nextDetails[index],
        [field]: value
      };
      return { ...current, guestDetails: nextDetails };
    });
  };

  const handleDailyEntrySubmit = async (event) => {
    event.preventDefault();
    if (!user || !dailyEntryForm.listingId) return;
    if (!publishedDailyUnitOptions.length) {
      setSaveError("Admin must publish units for this property before manual daily entry.");
      return;
    }

    const entryDate = dailyEntryForm.entryDate || getLocalDateKey(new Date());
    const unitNumber = Math.max(1, Math.round(Number(dailyEntryForm.unitNumber) || 1));
    const price = Math.max(0, Math.round(Number(dailyEntryForm.price) || 0));
    const listingName = listingsById[dailyEntryForm.listingId]?.name || HOST_MANUAL_FALLBACK_LISTING_NAME;
    const guestCount = getDailyEntryGuestCount(dailyEntryForm.guestCount);
    const guestDetails = cleanDailyGuestDetails(dailyEntryForm.guestDetails, guestCount);
    const filledGuestDetails = guestDetails.filter(guest => guest.name || guest.phone || guest.address);
    const primaryGuest = filledGuestDetails[0] || guestDetails[0] || createDailyGuestDetail();
    const docId = createDailyEntryDocId(user.uid, dailyEntryForm.listingId, entryDate, unitNumber);

    setSaveError("");
    try {
      await setDoc(doc(db, HOST_MANUAL_BOOKINGS_COLLECTION, docId), {
        recordType: HOST_DAILY_ENTRY_RECORD_TYPE,
        listingId: dailyEntryForm.listingId,
        listingName,
        entryDate,
        unitNumber,
        unitId: selectedDailyUnit?.id || `unit-${unitNumber}`,
        unitLabel: selectedDailyUnit?.label || `Unit ${unitNumber}`,
        status: dailyEntryForm.status || "Occupied",
        platform: toPlainText(dailyEntryForm.platform).trim() || "Manual",
        guestCount,
        guestDetails: filledGuestDetails,
        guests: filledGuestDetails,
        guestName: primaryGuest.name,
        guestPhone: primaryGuest.phone,
        guestAddress: primaryGuest.address,
        price,
        amount: price,
        revenue: price,
        expense: 0,
        paymentStatus: dailyEntryForm.paymentStatus || "Paid",
        notes: toPlainText(dailyEntryForm.notes).trim(),
        source: "manual-daily-entry",
        createdBy: user.uid,
        createdByName: user.displayName || user.email || "Host",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      setDailyEntryForm(current => ({
        ...current,
        guestDetails: createDailyGuestDetails(current.guestCount),
        price: "",
        notes: ""
      }));
    } catch (error) {
      console.error("Failed to save daily unit entry:", error);
      setSaveError("Daily unit entry could not be saved to Firebase.");
    }
  };

  const handleExpenseSubmit = async (event) => {
    event.preventDefault();
    if (!user || !expenseForm.listingId) return;

    const amount = Math.max(0, Math.round(Number(expenseForm.amount) || 0));
    const paidByName = toPlainText(
      expenseForm.paidBy === HOST_EXPENSE_CUSTOM_PAID_BY
        ? expenseForm.customPaidBy
        : expenseForm.paidBy
    ).trim();

    if (!amount) {
      setSaveError("Expense amount must be greater than zero.");
      return;
    }
    if (!paidByName) {
      setSaveError("Paid by name is required.");
      return;
    }

    setSaveError("");
    try {
      const { customPaidBy, ...expensePayload } = expenseForm;
      await addDoc(collection(db, HOST_MANUAL_EXPENSES_COLLECTION), {
        ...expensePayload,
        listingId: expenseForm.listingId,
        listingName: listingsById[expenseForm.listingId]?.name || HOST_MANUAL_FALLBACK_LISTING_NAME,
        amount,
        category: expenseForm.category || "Other",
        paidBy: paidByName,
        paymentMode: expenseForm.paymentMode || "Cash",
        source: "manual",
        createdBy: user.uid,
        createdByName: user.displayName || user.email || "Host",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setExpenseForm(current => ({
        ...current,
        paidBy: paidByName,
        customPaidBy: "",
        amount: "",
        notes: ""
      }));
    } catch (error) {
      console.error("Failed to save manual expense:", error);
      setSaveError("Expense could not be saved to Firebase.");
    }
  };

  const handleTaskSubmit = async (event) => {
    event.preventDefault();
    if (!user || !taskForm.title.trim()) return;

    setSaveError("");
    try {
      await addDoc(collection(db, HOST_MANUAL_TASKS_COLLECTION), {
        ...taskForm,
        title: taskForm.title.trim(),
        listingName: listingsById[taskForm.listingId]?.name || HOST_MANUAL_FALLBACK_LISTING_NAME,
        source: "manual",
        createdBy: user.uid,
        createdByName: user.displayName || user.email || "Host",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setTaskForm(current => ({ ...current, title: "", status: "Open" }));
    } catch (error) {
      console.error("Failed to save manual task:", error);
      setSaveError("Task could not be saved to Firebase.");
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await updateDoc(doc(db, HOST_MANUAL_TASKS_COLLECTION, taskId), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to update task:", error);
      setSaveError("Task status could not be updated.");
    }
  };

  const updateListingManualBlocks = async (nextBlocks) => {
    if (!hasRealListings || !selectedCalendarListing?.id) return;

    setCalendarSaving(true);
    setSaveError("");
    try {
      await updateDoc(doc(db, "homestays", selectedCalendarListing.id), {
        manualBlockedDates: normalizeManualBlockedDates(nextBlocks),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to update manual calendar:", error);
      setSaveError("Manual calendar could not be updated.");
    } finally {
      setCalendarSaving(false);
    }
  };

  const blockSelectedCalendarDate = async () => {
    if (!selectedCalendarDateKey) return;
    if (selectedDateAvailableForSource === 0) return;

    const nextBlocks = [
      ...calendarBlocks.filter(block => !(block.date === selectedCalendarDateKey && block.sourceId === selectedSourceOption.id)),
      {
        date: selectedCalendarDateKey,
        sourceId: selectedSourceOption.id,
        source: selectedSourceOption.name,
        units: requestedCalendarBlockUnits,
        note: calendarNote.trim() || (selectedCalendarListing?.hourly ? "Hourly stay hold" : "Manual CRM block")
      }
    ];

    await updateListingManualBlocks(nextBlocks);
  };

  const unblockSelectedCalendarDate = async () => {
    if (!selectedCalendarDateKey) return;
    await updateListingManualBlocks(calendarBlocks.filter(block => block.date !== selectedCalendarDateKey));
  };

  const deleteManualRecord = async (collectionName, recordId) => {
    try {
      await deleteDoc(doc(db, collectionName, recordId));
    } catch (error) {
      console.error("Failed to delete manual CRM record:", error);
      setSaveError("Record could not be deleted from Firebase.");
    }
  };

  return (
    <section className="manual-crm-panel">
      <div className="manual-crm-header">
        <div>
          <h2>Manual Host Dashboard</h2>
          <p>Manual entries are the source of truth for unit status, guests, price, tasks, and property calendar blocks.</p>
        </div>
        <label className="host-revenue-month">
          <span>Month</span>
          <input
            type="month"
            value={monthValue}
            onChange={(event) => setMonthValue(event.target.value)}
          />
        </label>
      </div>

      <div className="manual-crm-stats">
        <div>
          <span>Total Price</span>
          <strong>{formatCurrency(dailyEntryTotals.totalPrice)}</strong>
          <small>{getMonthLabel(monthValue)}</small>
        </div>
        <div>
          <span>Expenses</span>
          <strong>{formatCurrency(crmTotals.totalExpenses)}</strong>
          <small>{monthExpenses.length} manual records</small>
        </div>
        <div>
          <span>Net Price</span>
          <strong>{formatCurrency(dailyEntryTotals.totalPrice - crmTotals.totalExpenses)}</strong>
          <small>Price minus expenses</small>
        </div>
        <div>
          <span>Daily Entries</span>
          <strong>{monthDailyEntries.length}</strong>
          <small>Unit-wise records</small>
        </div>
        <div>
          <span>Occupied Unit Days</span>
          <strong>{dailyEntryTotals.occupiedDays}</strong>
          <small>Manual unit status</small>
        </div>
        <div>
          <span>Guest Count</span>
          <strong>{dailyEntryTotals.guestCount}</strong>
          <small>From daily entries</small>
        </div>
        <div>
          <span>Open Tasks</span>
          <strong>{tasks.filter(task => task.status !== "Done").length}</strong>
          <small>{tasks.length} total tasks</small>
        </div>
      </div>

      {saveError && <div className="host-revenue-alert">{saveError}</div>}

      <div className="manual-crm-tabs" role="tablist" aria-label="Manual CRM sections">
        {[
          ["daily", "Daily Entries"],
          ["expenses", "Expenses"],
          ...(hasRealListings ? [["calendar", "Calendar"]] : []),
          ["tasks", "Tasks"]
        ].map(([tabId, label]) => (
          <button
            key={tabId}
            type="button"
            className={activeTab === tabId ? "active" : ""}
            onClick={() => setActiveTab(tabId)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "daily" && (
        <div className="manual-crm-grid manual-daily-grid">
          <form className="manual-crm-form" onSubmit={handleDailyEntrySubmit}>
            <h3>Daily Unit Entry</h3>
            <label>
              Property
              <select
                value={dailyEntryForm.listingId}
                onChange={(event) => setDailyEntryForm({
                  ...dailyEntryForm,
                  listingId: event.target.value,
                  unitNumber: ""
                })}
                required
              >
                {propertyOptions.map(listing => (
                  <option key={listing.id} value={listing.id}>{listing.name || "(No name)"}</option>
                ))}
              </select>
            </label>
            <div className="manual-crm-form-row">
              <label>
                Date
                <input
                  type="date"
                  value={dailyEntryForm.entryDate}
                  onChange={(event) => setDailyEntryForm({ ...dailyEntryForm, entryDate: event.target.value })}
                  required
                />
              </label>
              <label>
                Unit
                <select
                  value={dailyEntryForm.unitNumber}
                  onChange={(event) => setDailyEntryForm({ ...dailyEntryForm, unitNumber: event.target.value })}
                  disabled={!publishedDailyUnitOptions.length}
                  required
                >
                  {publishedDailyUnitOptions.length === 0 ? (
                    <option value="">Admin must publish units first</option>
                  ) : publishedDailyUnitOptions.map(unit => (
                    <option key={unit.id} value={unit.unitNumber}>{unit.label}</option>
                  ))}
                </select>
              </label>
            </div>
            {!publishedDailyUnitOptions.length && (
              <p className="manual-unit-warning">
                Admin must publish units for this property before manual daily entry can be saved.
              </p>
            )}
            <div className="manual-crm-form-row">
              <label>
                Status
                <select
                  value={dailyEntryForm.status}
                  onChange={(event) => setDailyEntryForm({ ...dailyEntryForm, status: event.target.value })}
                >
                  {HOST_DAILY_ENTRY_STATUSES.map(status => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label>
                Source
                <input
                  list="daily-entry-platform-options"
                  value={dailyEntryForm.platform}
                  onChange={(event) => setDailyEntryForm({ ...dailyEntryForm, platform: event.target.value })}
                  placeholder="Manual, Airbnb, Booking.com"
                />
                <datalist id="daily-entry-platform-options">
                  {HOST_MANUAL_PLATFORMS.map(platform => (
                    <option key={platform} value={platform} />
                  ))}
                </datalist>
              </label>
            </div>
            <label>
              Guest Count
              <input
                type="number"
                min="1"
                max="20"
                value={dailyEntryForm.guestCount}
                onChange={(event) => handleDailyGuestCountChange(event.target.value)}
                required
              />
            </label>
            <div className="manual-guest-detail-list">
              {createDailyGuestDetails(dailyEntryForm.guestCount, dailyEntryForm.guestDetails).map((guest, index) => (
                <div className="manual-guest-detail-card" key={`guest-${index}`}>
                  <h4>Guest {index + 1}</h4>
                  <div className="manual-crm-form-row">
                    <label>
                      Name
                      <input
                        value={guest.name}
                        onChange={(event) => handleDailyGuestDetailChange(index, "name", event.target.value)}
                        placeholder={`Guest ${index + 1} name`}
                      />
                    </label>
                    <label>
                      Phone
                      <input
                        type="tel"
                        value={guest.phone}
                        onChange={(event) => handleDailyGuestDetailChange(index, "phone", event.target.value)}
                        placeholder="+91..."
                      />
                    </label>
                  </div>
                  <label>
                    Address
                    <input
                      value={guest.address}
                      onChange={(event) => handleDailyGuestDetailChange(index, "address", event.target.value)}
                      placeholder={`Guest ${index + 1} address`}
                    />
                  </label>
                </div>
              ))}
            </div>
            <div className="manual-crm-form-row">
              <label>
                Price
                <input
                  type="number"
                  min="0"
                  value={dailyEntryForm.price}
                  onChange={(event) => setDailyEntryForm({ ...dailyEntryForm, price: event.target.value })}
                  placeholder="0"
                />
              </label>
              <label>
                Payment
                <select
                  value={dailyEntryForm.paymentStatus}
                  onChange={(event) => setDailyEntryForm({ ...dailyEntryForm, paymentStatus: event.target.value })}
                >
                  <option>Paid</option>
                  <option>Partial</option>
                  <option>Pending</option>
                  <option>Not applicable</option>
                </select>
              </label>
            </div>
            <label>
              Notes
              <input
                value={dailyEntryForm.notes}
                onChange={(event) => setDailyEntryForm({ ...dailyEntryForm, notes: event.target.value })}
                placeholder="Cleaning, checkout, repair, guest note"
              />
            </label>
            <button
              className="manual-crm-primary"
              type="submit"
              disabled={!publishedDailyUnitOptions.length}
            >
              Save Daily Unit Entry
            </button>
          </form>

          <div className="manual-crm-list manual-daily-ledger">
            <h3>{loading ? "Loading..." : "Unit-wise Daily Ledger"}</h3>
            <div className="manual-daily-summary">
              <div>
                <span>Total Price</span>
                <strong>{formatCurrency(dailyEntryTotals.totalPrice)}</strong>
              </div>
              <div>
                <span>Daily Entries</span>
                <strong>{monthDailyEntries.length}</strong>
              </div>
              <div>
                <span>Occupied Unit Days</span>
                <strong>{dailyEntryTotals.occupiedDays}</strong>
              </div>
              <div>
                <span>Guest Count</span>
                <strong>{dailyEntryTotals.guestCount}</strong>
              </div>
            </div>

            {dailyEntryTotals.unitSummaries.length > 0 && (
              <div className="manual-unit-summary-grid">
                {dailyEntryTotals.unitSummaries.map(summary => (
                  <div key={summary.unitKey}>
                    <strong>{summary.listingName} • Unit {summary.unitNumber}</strong>
                    <span>{summary.occupied} occupied • {summary.available} available • {summary.maintenance} blocked</span>
                    <small>{formatCurrency(summary.price)} price total from {summary.entries} entr{summary.entries === 1 ? "y" : "ies"}</small>
                  </div>
                ))}
              </div>
            )}

            {sortedMonthDailyEntries.length === 0 ? (
              <p className="host-revenue-empty">No daily unit entries saved for this month.</p>
            ) : sortedMonthDailyEntries.map(entry => {
              const entryGuestDetails = getSavedDailyGuestDetails(entry);
              const guestSummary = entryGuestDetails.length
                ? entryGuestDetails
                  .map((guest, index) => (
                    [
                      `Guest ${index + 1}${guest.name ? `: ${guest.name}` : ""}`,
                      guest.phone,
                      guest.address
                    ].filter(Boolean).join(" • ")
                  ))
                  .join(" | ")
                : "No guest details";

              return (
                <div className="manual-crm-row manual-daily-row" key={entry.id}>
                  <div>
                    <strong>{entry.entryDate} • Unit {entry.unitNumber || 1}</strong>
                    <span>{entry.listingName || listingsById[entry.listingId]?.name || "Property"} • {entry.status || "Manual status"} • {entry.platform || "Manual"}</span>
                    <small>
                      {guestSummary}{entry.notes ? ` | ${entry.notes}` : ""}
                    </small>
                  </div>
                  <div className="manual-daily-money">
                    <strong>{formatCurrency(getDailyEntryPrice(entry))}</strong>
                    <small>{entry.paymentStatus || "Manual"}</small>
                  </div>
                  <button
                    type="button"
                    aria-label="Delete daily unit entry"
                    onClick={() => deleteManualRecord(HOST_MANUAL_BOOKINGS_COLLECTION, entry.id)}
                  >
                    <FiX />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "expenses" && (
        <div className="manual-crm-grid">
          <form className="manual-crm-form" onSubmit={handleExpenseSubmit}>
            <h3>Add Expense</h3>
            <label>
              Property
              <select
                value={expenseForm.listingId}
                onChange={(event) => setExpenseForm({ ...expenseForm, listingId: event.target.value })}
                required
              >
                {propertyOptions.map(listing => (
                  <option key={listing.id} value={listing.id}>{listing.name || "(No name)"}</option>
                ))}
              </select>
            </label>
            <div className="manual-crm-form-row">
              <label>
                Expense Date
                <input
                  type="date"
                  value={expenseForm.expenseDate}
                  onChange={(event) => setExpenseForm({ ...expenseForm, expenseDate: event.target.value })}
                  required
                />
              </label>
              <label>
                Category
                <select
                  value={expenseForm.category}
                  onChange={(event) => setExpenseForm({ ...expenseForm, category: event.target.value })}
                >
                  {HOST_EXPENSE_CATEGORIES.map(category => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="manual-crm-form-row">
              <label>
                Amount
                <input
                  type="number"
                  min="0"
                  value={expenseForm.amount}
                  onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })}
                  placeholder="0"
                  required
                />
              </label>
              <label>
                Paid By
                <select
                  value={expenseForm.paidBy}
                  onChange={(event) => setExpenseForm({ ...expenseForm, paidBy: event.target.value })}
                >
                  {expensePaidByOptions.map(paidBy => (
                    <option key={paidBy}>{paidBy}</option>
                  ))}
                  <option value={HOST_EXPENSE_CUSTOM_PAID_BY}>Add new name</option>
                </select>
                {expenseForm.paidBy === HOST_EXPENSE_CUSTOM_PAID_BY && (
                  <input
                    value={expenseForm.customPaidBy}
                    onChange={(event) => setExpenseForm({ ...expenseForm, customPaidBy: event.target.value })}
                    placeholder="Enter payer name"
                    required
                  />
                )}
              </label>
            </div>
            <label>
              Payment Mode
              <select
                value={expenseForm.paymentMode}
                onChange={(event) => setExpenseForm({ ...expenseForm, paymentMode: event.target.value })}
              >
                {HOST_EXPENSE_PAYMENT_MODES.map(mode => (
                  <option key={mode}>{mode}</option>
                ))}
              </select>
            </label>
            <label>
              Notes
              <input
                value={expenseForm.notes}
                onChange={(event) => setExpenseForm({ ...expenseForm, notes: event.target.value })}
                placeholder="Bill number, vendor, reimbursement note"
              />
            </label>
            <button className="manual-crm-primary" type="submit">Save Expense</button>
          </form>

          <div className="manual-crm-list">
            <h3>{loading ? "Loading..." : "Expense Ledger"}</h3>
            {crmTotals.expensesByPaidBy.length > 0 && (
              <div className="manual-expense-breakdown">
                {crmTotals.expensesByPaidBy.map(summary => (
                  <div key={summary.paidBy}>
                    <span>Paid by {summary.paidBy}</span>
                    <strong>{formatCurrency(summary.amount)}</strong>
                    <small>{summary.count} expense{summary.count === 1 ? "" : "s"}</small>
                  </div>
                ))}
              </div>
            )}
            {monthExpenses.length === 0 ? (
              <p className="host-revenue-empty">No manual expenses saved for this month.</p>
            ) : monthExpenses.map(expense => (
              <div className="manual-crm-row" key={expense.id}>
                <div>
                  <strong>{expense.category || "Expense"}</strong>
                  <span>{expense.listingName || listingsById[expense.listingId]?.name || "Property"} • Paid by {expense.paidBy || "Host"}</span>
                  <small>{expense.expenseDate || "No date"} • {expense.paymentMode || "Payment mode not set"}{expense.notes ? ` • ${expense.notes}` : ""}</small>
                </div>
                <strong>{formatCurrency(expense.amount)}</strong>
                <button
                  type="button"
                  aria-label="Delete manual expense"
                  onClick={() => deleteManualRecord(HOST_MANUAL_EXPENSES_COLLECTION, expense.id)}
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "calendar" && hasRealListings && (
        <div className="manual-crm-calendar-grid">
          <div className="manual-crm-form manual-crm-calendar-controls">
            <h3>Manual Property Calendar</h3>
            <label>
              Property
              <select
                value={calendarListingId}
                onChange={(event) => setCalendarListingId(event.target.value)}
                required
              >
                {listings.map(listing => (
                  <option key={listing.id} value={listing.id}>{listing.name || "(No name)"}</option>
                ))}
              </select>
            </label>
            <label>
              Block Reason
              <select
                value={calendarSourceId}
                onChange={(event) => setCalendarSourceId(event.target.value)}
              >
                {MANUAL_BLOCK_SOURCE_OPTIONS.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </label>
            <label>
              Rooms to Block
              <input
                type="number"
                min="1"
                max={calendarBlockUnitLimit}
                value={calendarBlockUnits}
                onChange={(event) => setCalendarBlockUnits(event.target.value)}
              />
            </label>
            <label>
              Note
              <input
                value={calendarNote}
                onChange={(event) => setCalendarNote(event.target.value)}
                placeholder="Hourly stay, maintenance, direct booking"
              />
            </label>
            <div className="manual-calendar-selected">
              <span>Selected Date</span>
              <strong>{selectedCalendarDateKey || "Choose a date"}</strong>
              <small>
                {selectedDateBlockedRooms
                  ? `${selectedDateBlockedRooms} of ${selectedCalendarTotalRooms} room${selectedCalendarTotalRooms === 1 ? "" : "s"} blocked on this date`
                  : `All ${selectedCalendarTotalRooms} room${selectedCalendarTotalRooms === 1 ? "" : "s"} available`}
              </small>
            </div>
            <div className="manual-calendar-availability">
              <div>
                <span>Total Rooms</span>
                <strong>{selectedCalendarTotalRooms}</strong>
              </div>
              <div>
                <span>Blocked</span>
                <strong>{selectedDateBlockedRooms}</strong>
              </div>
              <div>
                <span>Available</span>
                <strong>{selectedDateAvailableRooms}</strong>
              </div>
            </div>
            <div className="manual-calendar-actions">
              <button
                className="manual-crm-primary"
                type="button"
                onClick={blockSelectedCalendarDate}
                disabled={calendarSaving || !selectedCalendarDateKey || selectedDateAvailableForSource === 0}
              >
                {calendarSaving ? "Saving..." : "Block Date"}
              </button>
              <button
                className="manual-calendar-unblock"
                type="button"
                onClick={unblockSelectedCalendarDate}
                disabled={calendarSaving || !selectedDateBlocks.length}
              >
                Unblock Date
              </button>
            </div>
            <p className="manual-calendar-help">
              For hourly stays, block the date while the guest is inside. After checkout, click the same date and unblock it so hosts can sell the remaining hours manually.
            </p>
          </div>

          <div className="manual-crm-calendar-board">
            <div className="manual-crm-calendar-summary">
              <div>
                <h3>{selectedCalendarListing?.name || "Property calendar"}</h3>
                <p>
                  {calendarBlockCount} manual blocked date{calendarBlockCount === 1 ? "" : "s"}
                  {calendarBlockedRoomHolds ? ` • ${calendarBlockedRoomHolds} room hold${calendarBlockedRoomHolds === 1 ? "" : "s"}` : ""}
                  {selectedCalendarListing?.hourly ? " • Hourly stay supported" : ""}
                </p>
              </div>
            </div>
            <Calendar
              className="professional-calendar manual-crm-calendar"
              value={calendarDate}
              onChange={(value) => setCalendarDate(Array.isArray(value) ? value[0] : value)}
              tileClassName={({ date, view }) => {
                if (view !== "month") return null;
                return calendarBlocksByDate[getLocalDateKey(date)] ? "portal-block-date" : null;
              }}
              tileContent={({ date, view }) => {
                if (view !== "month") return null;
                const dateBlocks = calendarBlocksByDate[getLocalDateKey(date)];
                if (!dateBlocks?.length) return null;
                return <span className="calendar-platform-pill">{getShortPlatformLabel(dateBlocks[0].source)}</span>;
              }}
            />
            <div className="manual-crm-list manual-calendar-list">
              <h3>Blocked Dates</h3>
              {calendarBlocks.length === 0 ? (
                <p className="host-revenue-empty">No manual blocked dates for this property.</p>
              ) : calendarBlocks.map(block => (
                <div className="manual-crm-row" key={`${block.date}-${block.sourceId}`}>
                  <div>
                    <strong>{block.date}</strong>
                    <span>{block.source} • {getManualBlockUnitCount(block)} {getManualBlockUnitCount(block) === 1 ? "room" : "rooms"}</span>
                    <small>{block.note || "Manual calendar block"}</small>
                  </div>
                  <button
                    type="button"
                    aria-label={`Unblock ${block.date}`}
                    onClick={() => updateListingManualBlocks(calendarBlocks.filter(item => !(item.date === block.date && item.sourceId === block.sourceId)))}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="manual-crm-grid">
          <form className="manual-crm-form" onSubmit={handleTaskSubmit}>
            <h3>Add Manual Task</h3>
            <label>
              Property
              <select
                value={taskForm.listingId}
                onChange={(event) => setTaskForm({ ...taskForm, listingId: event.target.value })}
                required
              >
                {propertyOptions.map(listing => (
                  <option key={listing.id} value={listing.id}>{listing.name || "(No name)"}</option>
                ))}
              </select>
            </label>
            <label>
              Task
              <input
                value={taskForm.title}
                onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
                placeholder="Cleaning, maintenance, ID check"
                required
              />
            </label>
            <div className="manual-crm-form-row">
              <label>
                Owner
                <input
                  value={taskForm.owner}
                  onChange={(event) => setTaskForm({ ...taskForm, owner: event.target.value })}
                  placeholder="Host"
                />
              </label>
              <label>
                Due Date
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })}
                />
              </label>
            </div>
            <div className="manual-crm-form-row">
              <label>
                Priority
                <select
                  value={taskForm.priority}
                  onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </label>
              <label>
                Status
                <select
                  value={taskForm.status}
                  onChange={(event) => setTaskForm({ ...taskForm, status: event.target.value })}
                >
                  <option>Open</option>
                  <option>In progress</option>
                  <option>Done</option>
                </select>
              </label>
            </div>
            <button className="manual-crm-primary" type="submit">Save Task</button>
          </form>

          <div className="manual-crm-list">
            <h3>Saved Tasks</h3>
            {tasks.length === 0 ? (
              <p className="host-revenue-empty">No manual tasks saved yet.</p>
            ) : tasks.map(task => (
              <div className="manual-crm-row" key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.listingName || listingsById[task.listingId]?.name || "Property"} • {task.owner}</span>
                  <small>{task.priority} priority • Due {task.dueDate || "Not set"}</small>
                </div>
                <select
                  value={task.status || "Open"}
                  onChange={(event) => updateTaskStatus(task.id, event.target.value)}
                >
                  <option>Open</option>
                  <option>In progress</option>
                  <option>Done</option>
                </select>
                <button
                  type="button"
                  aria-label="Delete manual task"
                  onClick={() => deleteManualRecord(HOST_MANUAL_TASKS_COLLECTION, task.id)}
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------
   My Listings (Host's own homestays)
------------------------------ */
function MyListings() {
  const [user, setUser] = useState(null);
  const [myHomestays, setMyHomestays] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeListings = null;

    const cleanupHostStreams = () => {
      if (unsubscribeListings) {
        unsubscribeListings();
        unsubscribeListings = null;
      }
    };

    const unsubAuth = auth.onAuthStateChanged((u) => {
      cleanupHostStreams();
      setUser(u);

      if (!u) {
        setMyHomestays([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const qRef = query(
        collection(db, "homestays"),
        where("createdBy", "==", u.uid),
        orderBy("createdAt", "desc")
      );

      unsubscribeListings = onSnapshot(
        qRef,
        (snapshot) => {
          const docs = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((homestay) => homestay.recordType !== "hostProfile");
          setMyHomestays(docs);
          setLoading(false);
        },
        (error) => {
          console.error("Error loading host listings:", error);
          setMyHomestays([]);
          setLoading(false);
        }
      );
    });

    return () => {
      cleanupHostStreams();
      unsubAuth();
    };
  }, []);

  if (!user) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        Please log in to view your listings.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loaderText}>Loading your dashboard...</p>
        <p style={styles.loaderSubtext}>Please wait while we fetch your host workspace</p>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <SeoHelmet
        title="Host Dashboard | Homavia"
        description="Private Homavia host dashboard for managing listings, revenue, platform prices, and availability."
        canonicalPath="/my-listings"
        robots={PRIVATE_ROBOTS}
      />

      <h1 style={styles.pageTitle}>Host Dashboard</h1>

      <HostManualCrmPanel listings={myHomestays} user={user} />

      {myHomestays.length > 0 && (
        <ul style={styles.homestayList} className="homestay-list-grid">
          {myHomestays.map((h) => (
            <li key={h.id} style={styles.homestayItem}>
              <div style={{ position: "relative" }}>
                <img
                  src={h.imageUrl}
                  alt={h.name}
                  style={styles.homestayImage}
                />
              </div>
              <div style={styles.homestayInfo}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <h3 style={styles.title}>{h.name || "(No name)"}</h3>
                  <span style={{ fontSize: 12, color: "#666" }}>
                    {h.city} • {h.area}
                  </span>
                </div>
                <p style={styles.price}>
                  ₹{h.price} /{" "}
                  {PRICE_TYPES.find((pt) => pt.id === h.priceType)?.suffix ||
                    "night"}
                </p>
                <div style={{ fontSize: 12, color: '#667085', marginTop: -6, marginBottom: 8 }}>
                  {getListingUnitCount(h)} {getListingUnitCount(h) === 1 ? 'unit' : 'units'} • Platform prices configurable
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    style={{
                      ...styles.filterButton,
                      borderColor: "#B42318",
                      color: "#B42318"
                    }}
                    onClick={() => navigate(`/homestays/${createSlug(h.name, h.id, h.city)}`)}
                  >
                    View
                  </button>
                  <button
                    style={{
                      ...styles.filterButton,
                      borderColor: "#1565c0",
                      color: "#1565c0"
                    }}
                    onClick={() => navigate(`/edit-homestay/${h.id}`)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------
   Analytics Dashboard Component
------------------------------ */
function AnalyticsDashboard() {
  const [stats, setStats] = useState({
    totalPageViews: 0,
    totalCalls: 0,
    totalWhatsApp: 0,
    uniqueVisitors: 0,
    totalEvents: 0,
    topPages: [],
    topReferrers: [],
    deviceBreakdown: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // 'today', 'week', 'month', 'all'

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        let analyticsQuery = collection(db, ANALYTICS_COLLECTION);
        
        // Apply time filter
        if (timeRange !== 'all') {
          const now = new Date();
          let startDate = new Date();
          
          if (timeRange === 'today') {
            startDate.setHours(0, 0, 0, 0);
          } else if (timeRange === 'week') {
            startDate.setDate(now.getDate() - 7);
          } else if (timeRange === 'month') {
            startDate.setMonth(now.getMonth() - 1);
          }
          
          analyticsQuery = query(
            analyticsQuery,
            where("timestamp", ">=", Timestamp.fromDate(startDate)),
            orderBy("timestamp", "desc"),
            limit(1000)
          );
        } else {
          analyticsQuery = query(analyticsQuery, orderBy("timestamp", "desc"), limit(1000));
        }

        const snapshot = await getDocs(analyticsQuery);
        const activity = snapshot.docs.map(entry => {
          const data = entry.data();

          return {
            id: entry.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          };
        });
        const pageViewEvents = activity.filter(item => item.eventType === 'page_view');
        const pageViews = pageViewEvents.length;
        const calls = activity.filter(item => item.eventType === 'call_click').length;
        const whatsapp = activity.filter(item => item.eventType === 'whatsapp_click').length;
        const uniqueVisitors = new Set(pageViewEvents.map(item => item.sessionId).filter(Boolean)).size;
        const pageCounts = {};
        const pageTitles = {};
        const referrerCounts = {};
        const deviceCounts = {};

        pageViewEvents.forEach(item => {
          const pagePath = item.pagePath || "Unknown page";
          pageCounts[pagePath] = (pageCounts[pagePath] || 0) + 1;
          if (!pageTitles[pagePath] && item.pageTitle) pageTitles[pagePath] = item.pageTitle;

          const referrerHost = item.referrerHost || "direct";
          const referrerLabel = referrerHost === "direct" || referrerHost.includes("homavia.in")
            ? "Direct / internal"
            : referrerHost;
          referrerCounts[referrerLabel] = (referrerCounts[referrerLabel] || 0) + 1;

          const device = item.deviceType || "unknown";
          deviceCounts[device] = (deviceCounts[device] || 0) + 1;
        });

        const toSortedEntries = (counts, limitCount = 8) => (
          Object.entries(counts)
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limitCount)
        );

        setStats({
          totalPageViews: pageViews,
          totalCalls: calls,
          totalWhatsApp: whatsapp,
          uniqueVisitors,
          totalEvents: activity.length,
          topPages: toSortedEntries(pageCounts, 10).map(item => ({
            ...item,
            title: pageTitles[item.label] || item.label
          })),
          topReferrers: toSortedEntries(referrerCounts, 8),
          deviceBreakdown: toSortedEntries(deviceCounts, 5),
          recentActivity: activity.slice(0, 60)
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const statCardStyle = {
    flex: 1,
    minWidth: 200,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center'
  };

  const statNumberStyle = {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#B42318',
    margin: '12px 0'
  };

  const statLabelStyle = {
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0
  };
  const listCardStyle = {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    minWidth: 0
  };
  const trafficList = (title, items, formatter = item => item.label) => (
    <div style={listCardStyle}>
      <h3 style={{ marginTop: 0, marginBottom: 18, fontSize: 18 }}>{title}</h3>
      {items.length === 0 ? (
        <p style={{ color: '#666', margin: 0 }}>No data yet</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((item, index) => {
            const maxCount = Math.max(...items.map(entry => entry.count), 1);
            const width = `${Math.max(8, Math.round((item.count / maxCount) * 100))}%`;

            return (
              <div key={`${title}-${item.label}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#344054', fontWeight: 700 }}>
                    {index + 1}. {formatter(item)}
                  </span>
                  <span style={{ fontSize: 13, color: '#B42318', fontWeight: 800 }}>{item.count}</span>
                </div>
                <div style={{ height: 7, borderRadius: 999, backgroundColor: '#f2f4f7', overflow: 'hidden' }}>
                  <div style={{ width, height: '100%', backgroundColor: '#B42318' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
  const eventLabel = (eventType) => {
    if (eventType === 'page_view') return 'Page view';
    if (eventType === 'call_click') return 'Call click';
    if (eventType === 'whatsapp_click') return 'WhatsApp click';
    return eventType || 'Event';
  };
  const eventColor = (eventType) => {
    if (eventType === 'call_click') return '#0284c7';
    if (eventType === 'whatsapp_click') return '#16a34a';
    return '#B42318';
  };

  return (
    <div>
      <div style={{
        padding: 16,
        backgroundColor: '#f0f9ff',
        borderRadius: 12,
        marginBottom: 24,
        border: '1px solid #bae6fd'
      }}>
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16, color: '#0284c7' }}>
          Website Traffic Tracker
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: '#475467' }}>
          Tracks public page views, unique visitor sessions, top pages, referrers, devices, and booking-intent clicks.
          Private admin and host pages are excluded from page-view tracking.
        </p>
      </div>

      {/* Time Range Filter */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {['today', 'week', 'month', 'all'].map(range => (
          <button
            key={range}
            style={{
              padding: '10px 20px',
              border: timeRange === range ? '2px solid #B42318' : '1px solid #ddd',
              borderRadius: 8,
              backgroundColor: timeRange === range ? '#fff0f3' : '#fff',
              color: timeRange === range ? '#B42318' : '#666',
              fontWeight: timeRange === range ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.2s'
            }}
            onClick={() => setTimeRange(range)}
          >
            {range === 'all' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p>Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Page Views</div>
              <div style={statNumberStyle}>{stats.totalPageViews}</div>
              <div style={{ fontSize: 12, color: '#999' }}>Public route visits</div>
            </div>

            <div style={statCardStyle}>
              <div style={statLabelStyle}>Unique Visitors</div>
              <div style={{...statNumberStyle, color: '#7c3aed'}}>{stats.uniqueVisitors}</div>
              <div style={{ fontSize: 12, color: '#999' }}>Browser sessions</div>
            </div>
            
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Call Clicks</div>
              <div style={{...statNumberStyle, color: '#0284c7'}}>{stats.totalCalls}</div>
              <div style={{ fontSize: 12, color: '#999' }}>Users clicked call button</div>
            </div>
            
            <div style={statCardStyle}>
              <div style={statLabelStyle}>WhatsApp Clicks</div>
              <div style={{...statNumberStyle, color: '#25D366'}}>{stats.totalWhatsApp}</div>
              <div style={{ fontSize: 12, color: '#999' }}>Users clicked WhatsApp</div>
            </div>

            <div style={statCardStyle}>
              <div style={statLabelStyle}>Total Engagement</div>
              <div style={{...statNumberStyle, color: '#f97316'}}>{stats.totalCalls + stats.totalWhatsApp}</div>
              <div style={{ fontSize: 12, color: '#999' }}>Call + WhatsApp clicks</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
            {trafficList("Top Pages", stats.topPages, item => item.title || item.label)}
            {trafficList("Top Referrers", stats.topReferrers)}
            {trafficList("Devices", stats.deviceBreakdown, item => item.label.charAt(0).toUpperCase() + item.label.slice(1))}
          </div>

          {/* Recent Activity */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18 }}>Recent Activity</h3>
            
            {stats.recentActivity.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center' }}>No activity recorded yet</p>
            ) : (
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                {stats.recentActivity.map((activity) => {
                  const label = eventLabel(activity.eventType);
                  const color = eventColor(activity.eventType);

                  return (
                    <div
                      key={activity.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 0',
                        borderBottom: '1px solid #f0f0f0'
                      }}
                    >
                      <div style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: color,
                        flex: '0 0 auto'
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color, fontSize: 14 }}>{label}</div>
                        {activity.pagePath && (
                          <div style={{ fontSize: 12, color: '#344054', marginTop: 2, wordBreak: 'break-word' }}>
                            {activity.pagePath}
                          </div>
                        )}
                        {activity.homestayName && (
                          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                            {activity.homestayName}
                          </div>
                        )}
                        {activity.pageTitle && (
                          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                            {activity.pageTitle}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: '#98a2b3', marginTop: 2 }}>
                          {activity.referrerHost || 'direct'} • {activity.deviceType || 'unknown'}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#999', textAlign: 'right' }}>
                        {activity.timestamp.toLocaleDateString()}<br/>
                        {activity.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------
   Admin Tools (visible only to ADMIN_EMAIL)
------------------------------ */
function AdminTools() {
  const [currentUser, setCurrentUser] = useState(null);
  const [cutoff, setCutoff] = useState("2025-11-01"); // default Nov 1, 2025
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [mode, setMode] = useState("preview"); // 'preview' | 'delete'
  const [activeTab, setActiveTab] = useState("manage"); // 'manage' | 'cleanup'
  const [msg, setMsg] = useState("");
  const [contentItems, setContentItems] = useState([]);
  const [marketingRuns, setMarketingRuns] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentMsg, setContentMsg] = useState("");
  const [contentDraft, setContentDraft] = useState(null);
  const [contentForm, setContentForm] = useState({
    goal: "Grow organic Google traffic for Homavia listings, host CRM, revenue tools, bike rental, and car rental pages",
    topic: "Homavia host CRM and verified homestay listings in Guwahati",
    city: "Guwahati",
    category: "Host CRM guide",
    targetKeyword: "homestay management software in Guwahati",
    focusAreas: ["Listings SEO", "Host CRM SEO", "Revenue management SEO", "Calendar blocking SEO"],
    autoPublish: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setCurrentUser);
    return unsub;
  }, []);

  // Fetch all listings for management
  useEffect(() => {
    if (!isAdminUser(currentUser)) return;
    
    const unsubscribe = onSnapshot(
      query(collection(db, "homestays"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const listings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter(listing => listing.recordType !== "hostProfile");
        setAllListings(listings);
      }
    );
    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (!isAdminUser(currentUser)) return undefined;

    const unsubscribe = onSnapshot(
      query(collection(db, SEO_CONTENT_COLLECTION), orderBy("createdAt", "desc"), limit(50)),
      (snapshot) => {
        setContentItems(snapshot.docs.map(entry => ({ id: entry.id, ...entry.data() })));
      },
      (error) => {
        console.error("Failed to load SEO content:", error);
        setContentMsg("Could not load SEO content.");
      }
    );

    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (!isAdminUser(currentUser)) return undefined;

    const unsubscribe = onSnapshot(
      query(collection(db, MARKETING_AGENT_RUNS_COLLECTION), orderBy("createdAt", "desc"), limit(25)),
      (snapshot) => {
        setMarketingRuns(snapshot.docs.map(entry => ({ id: entry.id, ...entry.data() })));
      },
      (error) => {
        console.error("Failed to load marketing agent runs:", error);
        setContentMsg("Could not load marketing agent history.");
      }
    );

    return unsubscribe;
  }, [currentUser]);

  if (!isAdminUser(currentUser)) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Forbidden</div>;
  }

  const cutoffToTimestamp = () => {
    const iso = `${cutoff}T00:00:00+05:30`;
    return Timestamp.fromDate(new Date(iso));
  };

  const fetchCandidates = async () => {
    setLoading(true);
    setMsg("");
    setResults([]);
    try {
      const ts = cutoffToTimestamp();
      const pageLimit = 200;

      const qRef = query(
        collection(db, "homestays"),
        orderBy("createdAt"),
        where("createdAt", "<", ts),
        limit(pageLimit)
      );
      let all = [];
      let snap = await getDocs(qRef);
      all.push(...snap.docs);

      const allSnap = await getDocs(collection(db, "homestays"));
      const cutoffMs = ts.toDate().getTime();
      allSnap.forEach(d => {
        const data = d.data();
        const ca = data.createdAt;
        if (!ca || ca instanceof Timestamp) return;
        if (typeof ca === "string") {
          const parsed = Date.parse(ca);
          if (!Number.isNaN(parsed) && parsed < cutoffMs) {
            if (!all.find(x => x.id === d.id)) all.push(d);
          }
        }
      });

      const mapped = all.map(d => ({ id: d.id, ...d.data() }));
      setResults(mapped);
      setMsg(`Found ${mapped.length} listing(s) before ${cutoff}.`);
    } catch (e) {
      console.error(e);
      setMsg("Failed to fetch candidates.");
    } finally {
      setLoading(false);
    }
  };

  const deleteOne = async (id) => {
    if (!isAdminUser(currentUser)) {
      alert("Not allowed.");
      return;
    }
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "homestays", id));
      setResults(prev => prev.filter(x => x.id !== id));
      setAllListings(prev => prev.filter(x => x.id !== id));
      alert("Listing deleted successfully!");
    } catch (e) {
      console.error(e);
      alert("Delete failed.");
    }
  };

  const publishListingUnits = async (listing) => {
    if (!isAdminUser(currentUser)) {
      alert("Not allowed.");
      return;
    }

    const unitCount = getListingUnitCount(listing);
    try {
      await updateDoc(doc(db, "homestays", listing.id), {
        unitCount,
        publishedUnits: createPublishedUnits(unitCount),
        unitsPublished: true,
        unitsPublishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      alert(`${unitCount} unit${unitCount === 1 ? "" : "s"} published for ${listing.name || "property"}.`);
    } catch (error) {
      console.error("Failed to publish units:", error);
      alert("Unit publish failed.");
    }
  };

  const bulkDelete = async () => {
    if (!isAdminUser(currentUser)) {
      alert("Not allowed.");
      return;
    }
    if (results.length === 0) {
      alert("No items to delete.");
      return;
    }
    if (!window.confirm(`Delete ALL ${results.length} listing(s)? This cannot be undone.`)) return;

    setLoading(true);
    try {
      const chunks = [];
      for (let i = 0; i < results.length; i += 450) {
        chunks.push(results.slice(i, i + 450));
      }
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(item => batch.delete(doc(db, "homestays", item.id)));
        await batch.commit();
      }
      setResults([]);
      setMsg("Bulk delete complete.");
    } catch (e) {
      console.error(e);
      setMsg("Bulk delete failed.");
    } finally {
      setLoading(false);
    }
  };

  const publishSeoContent = async (draft = contentDraft, status = "published") => {
    if (!draft) {
      setContentMsg("Generate a draft first.");
      return;
    }

    const normalizedDraft = normalizeSeoContentDraft(draft.seoDraft || draft, contentForm.topic);
    const slug = createContentSlug(normalizedDraft.title);

    setContentLoading(true);
    setContentMsg("");
    try {
      await addDoc(collection(db, SEO_CONTENT_COLLECTION), {
        ...normalizedDraft,
        slug,
        category: contentForm.category,
        city: toPlainText(contentForm.city),
        targetKeyword: toPlainText(contentForm.targetKeyword),
        status,
        generatedBy: "gemini",
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || currentUser.email || "Admin",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: status === "published" ? serverTimestamp() : null
      });

      setContentDraft(null);
      setContentMsg(status === "published" ? "Content published successfully." : "Draft saved successfully.");
    } catch (error) {
      console.error("Failed to publish SEO content:", error);
      setContentMsg("Could not save content.");
    } finally {
      setContentLoading(false);
    }
  };

  const runMarketingAgent = async () => {
    if (!contentForm.topic.trim() || !contentForm.targetKeyword.trim()) {
      setContentMsg("Topic and target keyword are required.");
      return;
    }

    setContentLoading(true);
    setContentMsg("");
    try {
      const marketingAgent = httpsCallable(functionsClient, "runMarketingAgent");
      const result = await marketingAgent({
        goal: contentForm.goal,
        topic: contentForm.topic,
        city: contentForm.city,
        category: contentForm.category,
        targetKeyword: contentForm.targetKeyword,
        focusAreas: contentForm.focusAreas,
        listingSnapshot: allListings.slice(0, 12).map(listing => ({
          name: listing.name || "",
          city: listing.city || "",
          area: listing.area || "",
          roomType: listing.roomType || "",
          price: listing.price || "",
          priceType: listing.priceType || "",
          coupleFriendly: !!listing.coupleFriendly,
          hourly: !!listing.hourly,
          premium: !!listing.premium
        }))
      });
      const generatedResult = normalizeMarketingAgentResult(result.data?.result || result.data, contentForm.topic);
      setContentDraft(generatedResult);

      await addDoc(collection(db, MARKETING_AGENT_RUNS_COLLECTION), {
        ...generatedResult,
        goal: toPlainText(contentForm.goal),
        topic: toPlainText(contentForm.topic),
        city: toPlainText(contentForm.city),
        category: contentForm.category,
        targetKeyword: toPlainText(contentForm.targetKeyword),
        focusAreas: contentForm.focusAreas,
        generatedBy: "gemini",
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || currentUser.email || "Admin",
        createdAt: serverTimestamp()
      });

      if (contentForm.autoPublish) {
        await publishSeoContent(generatedResult.seoDraft, "published");
      } else {
        setContentMsg("Gemini marketing agent run complete. Review before publishing the SEO page.");
      }
    } catch (error) {
      console.error("Gemini marketing agent failed:", error);
      setContentMsg("Gemini agent failed. Deploy the Firebase function and set the GEMINI_API_KEY secret.");
    } finally {
      setContentLoading(false);
    }
  };

  const updateSeoContentStatus = async (item, status) => {
    try {
      await updateDoc(doc(db, SEO_CONTENT_COLLECTION, item.id), {
        status,
        updatedAt: serverTimestamp(),
        publishedAt: status === "published" ? (item.publishedAt || serverTimestamp()) : null
      });
    } catch (error) {
      console.error("Failed to update SEO content:", error);
      setContentMsg("Could not update content status.");
    }
  };

  const seoPreviewDraft = contentDraft?.seoDraft || null;
  const agentOutputGroups = contentDraft ? [
    { title: "Website SEO Plan", items: contentDraft.sitePlan },
    { title: "Landing Page Ideas", items: contentDraft.landingPages },
    { title: "Content Clusters", items: contentDraft.contentClusters },
    { title: "Internal Links", items: contentDraft.internalLinks },
    { title: "Technical SEO", items: contentDraft.technicalSeoTasks },
    { title: "Schema Ideas", items: contentDraft.schemaIdeas },
    { title: "Weekly SEO Tasks", items: contentDraft.weeklyTasks },
    { title: "Quality Checklist", items: contentDraft.qualityChecklist }
  ].filter(group => group.items?.length > 0) : [];

  return (
    <div style={styles.pageContainer}>
      <SeoHelmet
        title="Admin Panel | Homavia"
        description="Private Homavia admin panel for managing listings, activity, analytics, and revenue."
        canonicalPath="/admin"
        robots={PRIVATE_ROBOTS}
      />

      <h1 style={styles.pageTitle}>Admin Panel</h1>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '2px solid #ebebeb' }}>
        <button
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'manage' ? '3px solid #B42318' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'manage' ? '#B42318' : '#666',
            fontWeight: activeTab === 'manage' ? 'bold' : 'normal',
            fontSize: 16,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => setActiveTab('manage')}
        >
          Manage All Listings ({allListings.length})
        </button>
        <button
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'analytics' ? '3px solid #B42318' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'analytics' ? '#B42318' : '#666',
            fontWeight: activeTab === 'analytics' ? 'bold' : 'normal',
            fontSize: 16,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => setActiveTab('analytics')}
        >
          Traffic Tracker
        </button>
        <button
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'content' ? '3px solid #B42318' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'content' ? '#B42318' : '#666',
            fontWeight: activeTab === 'content' ? 'bold' : 'normal',
            fontSize: 16,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => setActiveTab('content')}
        >
          SEO Agent
        </button>
        <button
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'cleanup' ? '3px solid #B42318' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'cleanup' ? '#B42318' : '#666',
            fontWeight: activeTab === 'cleanup' ? 'bold' : 'normal',
            fontSize: 16,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => setActiveTab('cleanup')}
        >
          Cleanup Old Listings
        </button>
      </div>

      {/* Manage All Listings Tab */}
      {activeTab === 'manage' && (
        <div style={styles.pageContent}>
          <div style={{ 
            padding: 16, 
            backgroundColor: '#f0f9ff', 
            borderRadius: 12, 
            marginBottom: 24,
            border: '1px solid #bae6fd'
          }}>
            <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16, color: '#0284c7' }}>
              All Property Listings
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
              View, edit, or delete any property listing. Total: {allListings.length} listings
            </p>
          </div>

          {allListings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
              No listings found
            </div>
          ) : (
            <ul style={{ ...styles.homestayList, marginTop: 10 }}>
              {allListings.map((h) => {
                const created = h.createdAt instanceof Timestamp
                  ? h.createdAt.toDate().toLocaleDateString()
                  : (h.createdAt || "—");
                const calendarPortalName = getCalendarPortalName(h.icalUrl);
                const manualBlockCount = normalizeManualBlockedDates(h.manualBlockedDates).length;
                const hasBlockingSource = h.icalUrl || manualBlockCount > 0;
                const blockingSourceLabel = [
                  h.icalUrl ? calendarPortalName : null,
                  manualBlockCount > 0 ? `Homavia portal (${manualBlockCount})` : null
                ].filter(Boolean).join(' + ') || calendarPortalName;
                const publishedUnits = getListingPublishedUnits(h);
                const expectedUnitCount = getListingUnitCount(h);
                const unitsReady = publishedUnits.length > 0;
                return (
                  <li key={h.id} style={styles.homestayItem}>
                    <div style={{ padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                            {h.name || "(No name)"}
                            {h.premium && (
                              <span style={{ ...styles.premiumBadge, marginLeft: 8, fontSize: 10 }}>
                                <FiStar /> PREMIUM
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>
                            📍 {h.city || "City"} • {h.area || "Area"} • {h.roomType || "Room Type"}
                          </div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            Host: {h.createdByName || "Unknown"} • Created: {String(created)}
                          </div>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            marginTop: 6,
                            padding: '4px 8px',
                            borderRadius: designTokens.radius.full,
                            backgroundColor: hasBlockingSource ? designTokens.colors.primaryLight : designTokens.colors.surface,
                            color: hasBlockingSource ? designTokens.colors.primary : designTokens.colors.textMuted,
                            fontSize: 12,
                            fontWeight: 700
                          }}>
                            <FiCalendar size={12} />
                            {hasBlockingSource ? `Blocks from ${blockingSourceLabel}` : blockingSourceLabel}
                          </div>
                          <div style={{ fontSize: 12, color: '#0284c7', marginTop: 4 }}>
                            ₹{h.price} / {PRICE_TYPES.find(pt => pt.id === h.priceType)?.suffix || 'night'}
                          </div>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            marginTop: 6,
                            padding: '4px 8px',
                            borderRadius: designTokens.radius.full,
                            backgroundColor: unitsReady ? '#dcfce7' : '#fff7ed',
                            color: unitsReady ? '#166534' : '#9a3412',
                            fontSize: 12,
                            fontWeight: 800
                          }}>
                            <FiHome size={12} />
                            {unitsReady
                              ? `${publishedUnits.length}/${expectedUnitCount} units published`
                              : `Units not published (${expectedUnitCount})`}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 100 }}>
                          <Link 
                            to={`/homestays/${createSlug(h.name, h.id, h.city)}`} 
                            style={{ 
                              ...styles.filterButton, 
                              textDecoration: 'none',
                              textAlign: 'center',
                              padding: '8px 16px',
                              fontSize: 14
                            }}
                          >
                            <FiInfo size={14} /> View
                          </Link>
                          <button
                            style={{
                              ...styles.filterButton,
                              backgroundColor: unitsReady ? '#166534' : '#15803d',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              fontSize: 14
                            }}
                            onClick={() => publishListingUnits(h)}
                          >
                            {unitsReady ? "Republish Units" : "Publish Units"}
                          </button>
                          <button
                            style={{
                              ...styles.filterButton,
                              backgroundColor: '#1565c0',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              fontSize: 14
                            }}
                            onClick={() => navigate(`/edit-homestay/${h.id}`)}
                          >
                            Edit
                          </button>
                          <button
                            style={{ 
                              ...styles.filterButton,
                              backgroundColor: '#c62828',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              fontSize: 14
                            }}
                            onClick={() => deleteOne(h.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div style={styles.pageContent}>
          <AnalyticsDashboard />
        </div>
      )}

      {activeTab === 'content' && (
        <div className="admin-content-publisher">
          <div className="admin-content-card">
            <div>
              <h2>Gemini Website SEO Agent</h2>
              <p>Generate indexable website content and SEO action plans for Homavia listings, CRM, revenue tools, calendar blocking, and rentals.</p>
            </div>

            <div className="admin-content-grid">
              <label className="admin-content-wide">
                SEO Goal
                <textarea
                  value={contentForm.goal}
                  onChange={(event) => setContentForm({ ...contentForm, goal: event.target.value })}
                  placeholder="Grow organic Google traffic for Homavia website features"
                  rows={3}
                />
              </label>
              <label>
                Page Topic
                <input
                  value={contentForm.topic}
                  onChange={(event) => setContentForm({ ...contentForm, topic: event.target.value })}
                  placeholder="Homavia host CRM and verified homestay listings"
                />
              </label>
              <label>
                Target Keyword
                <input
                  value={contentForm.targetKeyword}
                  onChange={(event) => setContentForm({ ...contentForm, targetKeyword: event.target.value })}
                  placeholder="homestay management software in Guwahati"
                />
              </label>
              <label>
                City
                <input
                  value={contentForm.city}
                  onChange={(event) => setContentForm({ ...contentForm, city: event.target.value })}
                  placeholder="Guwahati"
                />
              </label>
              <label>
                Category
                <select
                  value={contentForm.category}
                  onChange={(event) => setContentForm({ ...contentForm, category: event.target.value })}
                >
                  {SEO_CONTENT_CATEGORIES.map(category => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-content-fieldset">
              <strong>SEO Focus Areas</strong>
              <div className="admin-channel-grid">
                {MARKETING_AGENT_SEO_FOCUS_AREAS.map(area => (
                  <label key={area}>
                    <input
                      type="checkbox"
                      checked={contentForm.focusAreas.includes(area)}
                      onChange={(event) => {
                        const focusAreas = event.target.checked
                          ? [...contentForm.focusAreas, area]
                          : contentForm.focusAreas.filter(item => item !== area);
                        setContentForm({ ...contentForm, focusAreas });
                      }}
                    />
                    {area}
                  </label>
                ))}
              </div>
            </div>

            <label className="admin-content-toggle">
              <input
                type="checkbox"
                checked={contentForm.autoPublish}
                onChange={(event) => setContentForm({ ...contentForm, autoPublish: event.target.checked })}
              />
              Auto publish SEO page after Gemini generation
            </label>

            <div className="admin-content-actions">
              <button type="button" onClick={runMarketingAgent} disabled={contentLoading}>
                {contentLoading ? "Working..." : "Run Website SEO Agent"}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => publishSeoContent(seoPreviewDraft, "draft")}
                disabled={contentLoading || !seoPreviewDraft}
              >
                Save Draft
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => publishSeoContent(seoPreviewDraft, "published")}
                disabled={contentLoading || !seoPreviewDraft}
              >
                Publish
              </button>
            </div>

            {contentMsg && <div className="host-revenue-alert">{contentMsg}</div>}
          </div>

          {contentDraft && (
            <div className="admin-content-card">
              <h2>SEO Agent Output</h2>
              {contentDraft.summary && <p>{contentDraft.summary}</p>}

              {agentOutputGroups.length > 0 && (
                <div className="admin-agent-output-grid">
                  {agentOutputGroups.map(group => (
                    <section className="admin-agent-output-card" key={group.title}>
                      <h3>{group.title}</h3>
                      <ul>
                        {group.items.map(item => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}

              {contentDraft.sourceLinks?.length > 0 && (
                <div className="admin-content-sources">
                  <h3>Research Sources</h3>
                  {contentDraft.sourceLinks.map(source => (
                    <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                      {source.title || source.url}
                    </a>
                  ))}
                </div>
              )}

              {seoPreviewDraft && (
                <>
                  <h2>{seoPreviewDraft.title}</h2>
                  <p>{seoPreviewDraft.metaDescription}</p>
                </>
              )}
              <div className="admin-content-preview">
                {seoPreviewDraft?.introduction && <p>{seoPreviewDraft.introduction}</p>}
                {seoPreviewDraft?.sections.map(section => (
                  <section key={section.heading}>
                    <h3>{section.heading}</h3>
                    <p>{section.body}</p>
                  </section>
                ))}
                {seoPreviewDraft?.faq.length > 0 && (
                  <section>
                    <h3>FAQ</h3>
                    {seoPreviewDraft.faq.map(item => (
                      <div key={item.question}>
                        <strong>{item.question}</strong>
                        <p>{item.answer}</p>
                      </div>
                    ))}
                  </section>
                )}
              </div>
            </div>
          )}

          <div className="admin-content-card">
            <h2>SEO Agent History</h2>
            {marketingRuns.length === 0 ? (
              <p>No SEO agent runs saved yet.</p>
            ) : (
              <div className="admin-content-list">
                {marketingRuns.map(item => (
                  <div className="admin-content-row" key={item.id}>
                    <div>
                      <strong>{item.topic || item.seoDraft?.title || "SEO run"}</strong>
                      <span>{item.category || "SEO"} • {item.targetKeyword || "No keyword"} • {(item.focusAreas || []).join(", ") || "Website SEO"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-content-card">
            <h2>Published Content</h2>
            {contentItems.length === 0 ? (
              <p>No content generated yet.</p>
            ) : (
              <div className="admin-content-list">
                {contentItems.map(item => (
                  <div className="admin-content-row" key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.category || "Guide"} • {item.status || "draft"} • {item.targetKeyword || "No keyword"}</span>
                    </div>
                    <div className="admin-content-row-actions">
                      {item.status === "published" && (
                        <Link to={`/travel-guides/${item.slug}`}>View</Link>
                      )}
                      <button
                        type="button"
                        onClick={() => updateSeoContentStatus(item, item.status === "published" ? "draft" : "published")}
                      >
                        {item.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      <button type="button" onClick={() => deleteDoc(doc(db, SEO_CONTENT_COLLECTION, item.id))}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cleanup Old Listings Tab */}
      {activeTab === 'cleanup' && (
        <div style={{ ...styles.pageContent, display: 'grid', gap: 16 }}>
        <label style={styles.label}>Delete everything created before (IST):</label>
        <input
          type="date"
          value={cutoff}
          onChange={(e) => setCutoff(e.target.value)}
          style={styles.input}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={styles.submitButton}
            disabled={loading}
            onClick={fetchCandidates}
          >
            {loading ? "Loading..." : "Find Listings"}
          </button>

          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={styles.input}
          >
            <option value="preview">Preview</option>
            <option value="delete">Delete Mode</option>
          </select>
        </div>

        {msg && <div style={{ fontSize: 14, color: '#555' }}>{msg}</div>}

        {results.length > 0 && (
          <>
            <button
              style={{ ...styles.submitButton, backgroundColor: '#c62828' }}
              onClick={bulkDelete}
              disabled={loading || mode !== "delete"}
              title={mode !== "delete" ? "Switch to Delete Mode to enable" : undefined}
            >
              Bulk Delete ({results.length})
            </button>

            <ul style={{ ...styles.homestayList, marginTop: 10 }}>
              {results.map((h) => {
                const created =
                  h.createdAt instanceof Timestamp
                    ? h.createdAt.toDate().toLocaleString()
                    : (h.createdAt || "—");
                return (
                  <li key={h.id} style={styles.homestayItem}>
                    <div style={{ padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{h.name || "(No name)"}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            {h.city || "City"} • {h.area || "Area"} • createdAt: {String(created)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Link to={`/homestays/${createSlug(h.name, h.id, h.city)}`} style={{ ...styles.filterButton, textDecoration: 'none' }}>
                            View
                          </Link>
                          <button
                            style={{ ...styles.filterButton, ...(mode === "delete" ? { borderColor: '#c62828', color: '#c62828' } : {}) }}
                            onClick={() => mode === "delete" ? deleteOne(h.id) : alert("Switch to Delete Mode first")}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------
   RequireAdmin wrapper
------------------------------ */
function RequireAdmin({ user, children }) {
  if (!user) return <div style={{ padding: 24, textAlign: 'center' }}>Please sign in.</div>;
  if (!isAdminUser(user)) return <div style={{ padding: 24, textAlign: 'center' }}>Forbidden</div>;
  return children;
}

/* ------------------------------
   Static pages
------------------------------ */
const formatGuideDate = (value) => {
  const rawDate = value?.toDate?.() || value;
  const parsed = rawDate instanceof Date ? rawDate : new Date(rawDate || Date.now());

  return Number.isNaN(parsed.getTime())
    ? new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : parsed.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};

const getGuideTime = (guide = {}) => {
  const value = guide.publishedAt || guide.createdAt || guide.updatedAt;
  const rawDate = value?.toDate?.() || value;
  const parsed = rawDate instanceof Date ? rawDate : new Date(rawDate || 0);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const toGuideIsoDate = (value) => {
  const rawDate = value?.toDate?.() || value;
  const parsed = rawDate instanceof Date ? rawDate : new Date(rawDate || "");
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const mergePublishedGuides = (remoteGuides = []) => {
  const merged = new Map();

  [...remoteGuides, ...ACTIVE_STATIC_PUBLISHED_GUIDES].forEach(guide => {
    if (guide?.slug && !merged.has(guide.slug)) {
      merged.set(guide.slug, guide);
    }
  });

  return Array.from(merged.values()).sort((a, b) => getGuideTime(b) - getGuideTime(a));
};

const fetchScheduledGuides = async (slug = "") => {
  try {
    const endpoint = slug
      ? `/.netlify/functions/seo-content?slug=${encodeURIComponent(slug)}`
      : "/.netlify/functions/seo-content";
    const response = await fetch(endpoint, { headers: { Accept: "application/json" } });

    if (!response.ok) return slug ? null : [];

    const payload = await response.json();
    return slug ? (payload.guide || null) : (Array.isArray(payload.guides) ? payload.guides : []);
  } catch (error) {
    console.warn("Scheduled guide content unavailable:", error);
    return slug ? null : [];
  }
};

function TravelGuidesPage() {
  const [guides, setGuides] = useState(ACTIVE_STATIC_PUBLISHED_GUIDES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const applyGuides = async (firestoreGuides = []) => {
      const scheduledGuides = await fetchScheduledGuides();
      if (!active) return;
      setGuides(mergePublishedGuides([...firestoreGuides, ...scheduledGuides]));
      setLoading(false);
    };

    const unsubscribe = onSnapshot(
      query(collection(db, SEO_CONTENT_COLLECTION), where("status", "==", "published"), limit(80)),
      (snapshot) => {
        const publishedGuides = snapshot.docs.map(entry => ({ id: entry.id, ...entry.data() }));
        applyGuides(publishedGuides);
      },
      (error) => {
        console.error("Failed to load travel guides:", error);
        applyGuides([]);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <div style={styles.pageContainer}>
      <SeoHelmet
        title="Homavia Travel & Host Guides | Homestay, CRM, Revenue & Rental SEO"
        description="Read Homavia guides for verified homestays, host CRM, manual revenue tracking, calendar blocking, bike rentals, car rentals, and local travel planning."
        canonicalPath="/travel-guides"
        keywords="Homavia guides, homestay CRM India, homestay revenue calculator, verified homestays Guwahati, bike rental guide, car rental guide"
        schema={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Homavia Travel and Host Guides",
          "url": buildAbsoluteUrl("/travel-guides"),
          "description": "SEO-friendly Homavia guides for guests and hosts.",
          "inLanguage": SITE_LANGUAGE
        }}
      />

      <section className="guide-index-hero">
        <span>Homavia Guides</span>
        <h1>Website guides for stays, rentals, CRM, and host revenue</h1>
        <p>
          Practical Homavia pages for travelers searching for verified stays and hosts managing bookings, rooms, expenses, calendars, and revenue.
        </p>
      </section>

      {loading ? (
        <div style={styles.pageContent}>Loading guides...</div>
      ) : guides.length === 0 ? (
        <div style={styles.pageContent}>No published guides yet.</div>
      ) : (
        <div className="guide-card-grid">
          {guides.map(guide => (
            <Link className="guide-card" to={`/travel-guides/${guide.slug}`} key={guide.id}>
              <span>{guide.category || "Guide"}</span>
              <h2>{guide.title}</h2>
              <p>{guide.metaDescription || guide.introduction || DEFAULT_DESCRIPTION}</p>
              <small>{guide.targetKeyword || guide.city || "Homavia SEO"}</small>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function IndiaTravelPage() {
  const topHomestayGuides = useMemo(() => TOP_HOMESTAY_GUIDES, []);
  const featuredGuides = topHomestayGuides.slice(0, 18);
  const firstYearBlog = ONE_YEAR_BLOG_GUIDES[0];
  const firstMapAreaGuide = MAP_HOMESTAY_AREA_GUIDES[0];
  const northEastGuides = topHomestayGuides.filter(guide => [
    "Assam", "Meghalaya", "Arunachal Pradesh", "Sikkim", "Nagaland", "Manipur", "Tripura", "Mizoram"
  ].includes(guide.state));
  const northGuides = topHomestayGuides.filter(guide => [
    "Delhi", "Rajasthan", "Uttar Pradesh", "Uttarakhand", "Himachal Pradesh", "Jammu and Kashmir", "Ladakh", "Punjab", "Chandigarh"
  ].includes(guide.state));
  const westSouthGuides = topHomestayGuides.filter(guide => [
    "Goa", "Maharashtra", "Gujarat", "Karnataka", "Kerala", "Tamil Nadu", "Puducherry", "Telangana", "Andhra Pradesh", "Andaman and Nicobar Islands"
  ].includes(guide.state));

  const destinationListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Top Homestay Destinations in India",
    "itemListElement": topHomestayGuides.slice(0, 100).map((guide, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": guide.city || guide.title,
      "url": buildAbsoluteUrl(`/travel-guides/${guide.slug}`)
    }))
  };

  return (
    <div style={styles.pageContainer}>
      <SeoHelmet
        title="India Travel Guide | Top Homestays, Rentals & Destination Stays | Homavia"
        description="Explore Homavia's India travel hub for top homestay destinations, verified stay checks, bike rentals, car rentals, host contact, and local trip planning."
        canonicalPath="/india-travel"
        keywords="India travel guide, top homestays in India, best homestay destinations India, verified homestays India, India trip planning, Homavia travel"
        schema={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Homavia India Travel Guide",
            "url": buildAbsoluteUrl("/india-travel"),
            "description": "Homavia hub for India travel, top homestay destinations, rentals, verified stay checks, and destination planning.",
            "inLanguage": SITE_LANGUAGE,
            "isPartOf": {
              "@type": "WebSite",
              "name": SITE_NAME,
              "url": SITE_URL
            }
          },
          destinationListSchema,
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": SITE_URL
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "India Travel",
                "item": buildAbsoluteUrl("/india-travel")
              }
            ]
          }
        ]}
      />

      <section className="guide-index-hero">
        <span>India Travel by Homavia</span>
        <h1>India travel guide for top homestays, rentals, and destination stays</h1>
        <p>
          Build your India trip around practical stay decisions: verified host contact, best areas, family and couple checks,
          workation comfort, bike rentals, car rentals, and destination-specific homestay guides.
        </p>
      </section>

      <div className="guide-card-grid" style={{ marginBottom: 24 }}>
        <Link className="guide-card" to="/travel-guides">
          <span>Guide Library</span>
          <h2>{ACTIVE_STATIC_PUBLISHED_GUIDES.length}+ Homavia travel guides</h2>
          <p>Browse destination pages, host CRM guides, rental planning, calendar blocking, and revenue workflows.</p>
          <small>Travel SEO cluster</small>
        </Link>
        {firstYearBlog && (
          <Link className="guide-card" to={`/travel-guides/${firstYearBlog.slug}`}>
            <span>One-Year Blog Plan</span>
            <h2>{ONE_YEAR_BLOG_GUIDES.length} seasonal travel blogs</h2>
            <p>Month-by-month India travel content for homestays, rentals, workations, couples, and family trips.</p>
            <small>Weekly SEO publishing</small>
          </Link>
        )}
        {firstMapAreaGuide && (
          <Link className="guide-card" to={`/travel-guides/${firstMapAreaGuide.slug}`}>
            <span>Map Area Discovery</span>
            <h2>{MAP_HOMESTAY_AREA_GUIDES.length} landmark-area guides</h2>
            <p>Area-led homestay discovery around airports, beaches, ghats, markets, safari gates, and hill routes.</p>
            <small>Map SEO cluster</small>
          </Link>
        )}
        <Link className="guide-card" to="/pool-homestays">
          <span>Pool Stay Directory</span>
          <h2>{POOL_HOMESTAY_CANDIDATE_COUNT} pool stay candidates</h2>
          <p>Map-sourced pool stay candidates and Homavia pool homestay leads across India with verification notes.</p>
          <small>{CONFIRMED_OSM_POOL_STAY_COUNT} OSM pool-tagged entries</small>
        </Link>
        <Link className="guide-card" to="/bike-rental">
          <span>Rental Planning</span>
          <h2>Bike rentals for local trips</h2>
          <p>Connect stay discovery with two-wheeler planning for beach, hill, city, and short-distance routes.</p>
          <small>Bike rental India</small>
        </Link>
        <Link className="guide-card" to="/car-rental">
          <span>Rental Planning</span>
          <h2>Car rentals for destination travel</h2>
          <p>Plan airport pickup, local sightseeing, family drives, and intercity travel around your stay.</p>
          <small>Car rental India</small>
        </Link>
      </div>

      <section className="guide-index-hero">
        <span>Destination Coverage</span>
        <h2>{topHomestayGuides.length} top homestay destination pages across India</h2>
        <p>
          These pages create crawlable internal routes for high-intent searches like top homestays in Goa,
          top homestays in Manali, top homestays in Guwahati, and verified homestay destinations across India.
        </p>
      </section>

      <div className="guide-card-grid" style={{ marginBottom: 24 }}>
        {featuredGuides.map(guide => (
          <Link className="guide-card" to={`/travel-guides/${guide.slug}`} key={guide.id}>
            <span>{guide.state || "India"} • Top homestays</span>
            <h2>{guide.city || guide.title}</h2>
            <p>{guide.metaDescription || guide.introduction || DEFAULT_DESCRIPTION}</p>
            <small>{guide.targetKeyword}</small>
          </Link>
        ))}
      </div>

      <section className="guide-detail-layout">
        <div className="guide-article">
          <h2>Regional travel clusters</h2>
          <p>
            Homavia uses regional clusters so visitors and search engines can move from an India-level travel hub
            to destination pages, then into stay, rental, and host-contact workflows.
          </p>
          <h3>North East India</h3>
          <p>{northEastGuides.slice(0, 18).map(guide => guide.city).join(", ")}</p>
          <h3>North and Himalayan India</h3>
          <p>{northGuides.slice(0, 24).map(guide => guide.city).join(", ")}</p>
          <h3>West and South India</h3>
          <p>{westSouthGuides.slice(0, 36).map(guide => guide.city).join(", ")}</p>
        </div>
        <aside className="guide-sidebar">
          <strong>Rank-building focus</strong>
          <p>Real inventory, helpful destination content, crawlable links, fresh sitemap URLs, and verified host data.</p>
          <Link to="/travel-guides/top-homestays-in-goa-best-areas-booking-checks-and-homavia-tips">Top homestays in Goa</Link>
          <Link to="/travel-guides/top-homestays-in-manali-best-areas-booking-checks-and-homavia-tips">Top homestays in Manali</Link>
          <Link to="/travel-guides/top-homestays-in-guwahati-best-areas-booking-checks-and-homavia-tips">Top homestays in Guwahati</Link>
          <Link to="/">Browse Homavia stays</Link>
        </aside>
      </section>
    </div>
  );
}

function PoolHomestaysPage() {
  const confirmedPoolStays = useMemo(
    () => POOL_HOMESTAY_CANDIDATES.filter(item => item.poolStatus === "confirmed_map_pool_tag"),
    []
  );
  const mapPoolLeads = useMemo(
    () => POOL_HOMESTAY_CANDIDATES.filter(item => item.poolStatus !== "confirmed_map_pool_tag"),
    []
  );
  const featuredItems = useMemo(
    () => [...confirmedPoolStays, ...mapPoolLeads].slice(0, 120),
    [confirmedPoolStays, mapPoolLeads]
  );

  return (
    <div style={styles.pageContainer}>
      <SeoHelmet
        title="Pool Homestays in India | 100+ Map Leads & Pool Stay Candidates | Homavia"
        description="Explore 100+ Homavia pool homestay leads and map-sourced pool stay candidates across India. Verify pool access, host details, price, and availability before booking."
        canonicalPath="/pool-homestays"
        keywords="pool homestays in India, private pool villa India, homestay with swimming pool India, pool stay near me, Homavia pool stays"
        schema={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Pool Homestays and Pool Stay Candidates in India",
          "url": buildAbsoluteUrl("/pool-homestays"),
          "description": "Homavia directory of map-sourced pool stay candidates and pool homestay leads across India.",
          "inLanguage": SITE_LANGUAGE,
          "mainEntity": {
            "@type": "ItemList",
            "name": "Pool homestay candidates",
            "numberOfItems": POOL_HOMESTAY_CANDIDATE_COUNT,
            "itemListElement": featuredItems.slice(0, 100).map((item, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "name": item.name,
              "url": buildAbsoluteUrl("/pool-homestays")
            }))
          }
        }}
      />

      <section className="guide-index-hero">
        <span>Pool Homestays</span>
        <h1>Pool homestays and map-sourced pool stay candidates in India</h1>
        <p>
          Browse {POOL_HOMESTAY_CANDIDATE_COUNT} pool stay candidates across India, including {CONFIRMED_OSM_POOL_STAY_COUNT}
          {" "}OpenStreetMap entries with pool-related map tags and {MAP_POOL_HOMESTAY_LEAD_COUNT} Homavia map-area leads for outreach and verification.
        </p>
      </section>

      <div className="guide-card-grid" style={{ marginBottom: 24 }}>
        <div className="guide-card">
          <span>Confirmed Map Tags</span>
          <h2>{CONFIRMED_OSM_POOL_STAY_COUNT} OSM pool-tagged stays</h2>
          <p>Named accommodation entries where public map tags include pool access. Always confirm current access before publishing as bookable.</p>
          <small>{OSM_ATTRIBUTION.label} • {OSM_ATTRIBUTION.license}</small>
        </div>
        <div className="guide-card">
          <span>Verification Leads</span>
          <h2>{MAP_POOL_HOMESTAY_LEAD_COUNT} map-area pool leads</h2>
          <p>Homavia area-led outreach candidates for private pool villas, family pool stays, couple suites, and workation pool properties.</p>
          <small>Verify host, pool, price, photos</small>
        </div>
        <Link className="guide-card" to="/india-travel">
          <span>SEO Cluster</span>
          <h2>India travel hub</h2>
          <p>Connect pool searches with destination guides, rentals, direct host contact, and verified Homavia stay workflows.</p>
          <small>Internal link hub</small>
        </Link>
      </div>

      <section className="guide-index-hero">
        <span>Important</span>
        <h2>Verification before booking</h2>
        <p>
          These entries are not automatically verified Homavia listings. Confirm pool access, property type, host identity, photos,
          pricing, guest rules, safety, and live availability before booking or moving a candidate into the main Homavia listings.
        </p>
      </section>

      <div className="guide-card-grid">
        {featuredItems.map(item => (
          <article className="guide-card" key={item.id}>
            <span>{item.poolStatus === "confirmed_map_pool_tag" ? "OSM pool tag" : "Map lead"} • {item.city}</span>
            <h2>{item.name}</h2>
            <p>
              {item.area}, {item.state}. {item.roomType ? `${item.roomType}. ` : ""}
              {item.guestFit ? `${item.guestFit}. ` : ""}
              {item.mapContext || `Pool tag: ${item.poolTag}.`}
            </p>
            <small>
              {item.poolTag} • {item.verificationStatus}
            </small>
            <div style={{ marginTop: 12, display: 'grid', gap: 6, fontSize: 12, color: '#667085' }}>
              <span>Map: {item.lat}, {item.lon}</span>
              {item.sourceUrl ? (
                <a href={item.sourceUrl} target="_blank" rel="noreferrer">Open map source</a>
              ) : (
                <span>Source: {item.source}</span>
              )}
            </div>
          </article>
        ))}
      </div>

      <section style={{ ...styles.pageContent, marginTop: 24 }}>
        <p style={{ margin: 0, color: '#667085', fontSize: 13 }}>
          Map data attribution: confirmed map-tag entries use data from{" "}
          <a href={OSM_ATTRIBUTION.url} target="_blank" rel="noreferrer">{OSM_ATTRIBUTION.label}</a>
          {" "}under {OSM_ATTRIBUTION.license}. Homavia map-area leads are research leads for future verification, not final booking inventory.
        </p>
      </section>
    </div>
  );
}

function TravelGuideDetail() {
  const { slug } = useParams();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGuide = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(
          query(collection(db, SEO_CONTENT_COLLECTION), where("slug", "==", slug), limit(1))
        );
        const entry = snapshot.docs[0];
        const data = entry ? { id: entry.id, ...entry.data() } : null;
        const staticGuide = ACTIVE_STATIC_PUBLISHED_GUIDES.find(item => item.slug === slug);
        if (data?.status === "published") {
          setGuide(data);
          return;
        }

        if (staticGuide) {
          setGuide(staticGuide);
          return;
        }

        setGuide(await fetchScheduledGuides(slug));
      } catch (error) {
        console.error("Failed to load guide:", error);
        setGuide(
          ACTIVE_STATIC_PUBLISHED_GUIDES.find(item => item.slug === slug) ||
          await fetchScheduledGuides(slug)
        );
      } finally {
        setLoading(false);
      }
    };

    loadGuide();
  }, [slug]);

  if (loading) {
    return <div style={styles.pageContainer}><div style={styles.pageContent}>Loading guide...</div></div>;
  }

  if (!guide) {
    return (
      <div style={styles.pageContainer}>
        <SeoHelmet title="Guide Not Found | Homavia" canonicalPath={`/travel-guides/${slug}`} robots={PRIVATE_ROBOTS} />
        <div style={styles.pageContent}>This guide is not available.</div>
      </div>
    );
  }

  const keywords = guide.keywords?.length ? guide.keywords.join(", ") : DEFAULT_KEYWORDS;
  const guideUrl = `/travel-guides/${guide.slug}`;
  const publishedDate = formatGuideDate(guide.publishedAt || guide.createdAt);
  const faqSchema = guide.faq?.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": guide.faq.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  } : null;

  return (
    <article style={styles.pageContainer}>
      <SeoHelmet
        title={`${guide.metaTitle || guide.title} | Homavia`}
        description={guide.metaDescription || guide.introduction || DEFAULT_DESCRIPTION}
        canonicalPath={guideUrl}
        keywords={keywords}
        type="article"
        schema={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": guide.title,
            "description": guide.metaDescription || guide.introduction,
            "datePublished": toGuideIsoDate(guide.publishedAt || guide.createdAt),
            "dateModified": toGuideIsoDate(guide.updatedAt || guide.publishedAt || guide.createdAt),
            "author": {
              "@type": "Organization",
              "name": SITE_NAME,
              "url": SITE_URL
            },
            "publisher": {
              "@type": "Organization",
              "name": SITE_NAME,
              "url": SITE_URL
            },
            "mainEntityOfPage": buildAbsoluteUrl(guideUrl),
            "inLanguage": SITE_LANGUAGE
          },
          faqSchema
        ]}
      />

      <header className="guide-detail-hero">
        <Link to="/travel-guides">Travel Guides</Link>
        <span>{guide.category || "Guide"} • {publishedDate}</span>
        <h1>{guide.title}</h1>
        <p>{guide.introduction || guide.metaDescription}</p>
      </header>

      <div className="guide-detail-layout">
        <main className="guide-article">
          {guide.sections?.map(section => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}

          {guide.faq?.length > 0 && (
            <section>
              <h2>Frequently Asked Questions</h2>
              {guide.faq.map(item => (
                <div className="guide-faq" key={item.question}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </div>
              ))}
            </section>
          )}
        </main>

        <aside className="guide-sidebar">
          <strong>Next step</strong>
          <p>{guide.cta || "Explore verified Homavia stays and travel rentals before you book."}</p>
          <Link to="/">Browse Homavia</Link>
          <Link to="/my-listings">Open Host CRM</Link>
          {guide.relatedLinks?.length > 0 && (
            <>
              <strong>Related pages</strong>
              {guide.relatedLinks.map(link => {
                const linkPath = link.path || "/";
                const linkLabel = link.label || "Open page";
                const linkKey = `${guide.slug}-${linkPath || linkLabel}`;

                return /^https?:\/\//i.test(linkPath) ? (
                  <a href={linkPath} key={linkKey} target="_blank" rel="noopener noreferrer">
                    {linkLabel}
                  </a>
                ) : (
                  <Link to={linkPath} key={linkKey}>
                    {linkLabel}
                  </Link>
                );
              })}
            </>
          )}
        </aside>
      </div>
    </article>
  );
}

function AboutPage() {
  return (
    <div style={styles.pageContainer}>
      <SeoHelmet
        title="About Homavia | Verified Homestays & Travel Rentals in India"
        description="Learn how Homavia connects travelers with verified homestays, local hosts, bike rentals, and car rentals across India."
        canonicalPath="/about"
        schema={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About Homavia",
          "url": buildAbsoluteUrl("/about"),
          "description": "Homavia helps travelers discover verified homestays and local travel rentals across India.",
          "inLanguage": SITE_LANGUAGE,
          "mainEntity": {
            "@type": "Organization",
            "name": SITE_NAME,
            "url": SITE_URL,
            "email": CONTACT_EMAIL,
            "telephone": CONTACT_PHONE
          }
        }}
      />

      <h1 style={styles.pageTitle}>About Homavia</h1>

      <div style={styles.pageContent}>
        <p>
          Founded in 2023, Homavia is dedicated to transforming how travelers experience Northeast India and Goa.
          We connect guests with unique, authentic homestays that offer more than just a place to sleep -
          they offer a true local hospitality experience.
        </p>

        <p>
          Our mission is to empower local homeowners while providing travelers with memorable stays that
          showcase the rich culture and warm hospitality of each region.
        </p>

        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginTop: 30, marginBottom: 15 }}>Our Destinations</h2>

        <div style={styles.featureList}>
          <div style={styles.featureCard} className="feature-card-hover">
            <div style={styles.featureIcon}><FiMapPin /></div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Guwahati</h3>
            <p>The gateway to Northeast India, offering a blend of urban convenience and natural beauty.</p>
          </div>

          <div style={styles.featureCard} className="feature-card-hover">
            <div style={styles.featureIcon}><FiHome /></div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Shillong</h3>
            <p>Known as the "Scotland of the East", this picturesque hill station offers cool climate and stunning landscapes.</p>
          </div>

          <div style={styles.featureCard} className="feature-card-hover">
            <div style={styles.featureIcon}><FiStar /></div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Goa</h3>
            <p>Famous for its beaches, Portuguese heritage, and vibrant culture.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
  };

  return (
    <div style={styles.pageContainer}>
      <SeoHelmet
        title="Contact Homavia | Booking & Host Support"
        description="Contact Homavia for homestay booking help, host listing support, bike rentals, car rentals, and travel questions."
        canonicalPath="/contact"
        schema={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Contact Homavia",
          "url": buildAbsoluteUrl("/contact"),
          "description": "Contact Homavia for traveler support and host listing support.",
          "inLanguage": SITE_LANGUAGE,
          "mainEntity": {
            "@type": "Organization",
            "name": SITE_NAME,
            "url": SITE_URL,
            "email": CONTACT_EMAIL,
            "telephone": CONTACT_PHONE,
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": CONTACT_PHONE,
              "email": CONTACT_EMAIL,
              "contactType": "customer support",
              "areaServed": "IN",
              "availableLanguage": ["English", "Hindi"]
            }
          }
        }}
      />

      <h1 style={styles.pageTitle}>Contact Us</h1>

      <div style={styles.pageContent}>
        <p style={{ marginBottom: 25 }}>
          Have questions about booking a homestay or listing your property? Our team is here to help!
        </p>

        <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 25 }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: 15, fontSize: 18 }}>Contact Information</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiPhone size={16} />
              </div>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14 }}>Phone</p>
                <p style={{ fontSize: 14 }}>+91 8638572663</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiMail size={16} />
              </div>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14 }}>Email</p>
                <p style={{ fontSize: 14 }}>takeoffheaven@gmail.com</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: 15, fontSize: 18 }}>Send us a message</h3>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <FiCheck size={32} color="#4CAF50" style={{ marginBottom: 15 }} />
              <h3 style={{ fontWeight: 'bold', marginBottom: 10, fontSize: 16 }}>Message Sent!</h3>
              <p style={{ fontSize: 14 }}>Thank you for contacting us. We'll get back to you within 24 hours.</p>
              <button
                style={{ ...styles.submitButton, marginTop: 15 }}
                onClick={() => setSubmitted(false)}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={styles.contactForm}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Your Name *</label>
                  <input
                    type="text"
                    name="name"
                    style={styles.contactInput}
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    style={styles.contactInput}
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    style={styles.contactInput}
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Message *</label>
                  <textarea
                    name="message"
                    style={{ ...styles.contactInput, minHeight: 120 }}
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <button type="submit" style={styles.submitButton}>
                  Send Message
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function PremiumPage() {
  return (
    <div style={styles.pageContainer}>
      <SeoHelmet
        title="Homavia Premium | Featured Visibility for Homestay Hosts"
        description="Upgrade to Homavia Premium to improve homestay visibility, earn a featured listing badge, and reach more travelers."
        canonicalPath="/premium"
        schema={{
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Homavia Premium",
          "url": buildAbsoluteUrl("/premium"),
          "description": "Featured listing and visibility service for Homavia homestay hosts.",
          "provider": {
            "@type": "Organization",
            "name": SITE_NAME,
            "url": SITE_URL
          },
          "areaServed": {
            "@type": "Country",
            "name": "India"
          }
        }}
      />

      <h1 style={styles.pageTitle}>Premium Features</h1>

      <div style={{ ...styles.pageContent, textAlign: 'center' }}>
        <p style={{ fontSize: 16, marginBottom: 25 }}>
          Elevate your homestay listing with our Premium features designed to increase your visibility and bookings.
        </p>

        <div style={styles.featureList}>
          <div style={styles.featureCard} className="feature-card-hover">
            <div style={styles.featureIcon}><FiStar /></div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Featured Listings</h3>
            <p>Your property appears at the top of search results with a premium badge.</p>
          </div>

          <div style={styles.featureCard} className="feature-card-hover">
            <div style={styles.featureIcon}><FiSearch /></div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>3x More Visibility</h3>
            <p>Get up to 3 times more views compared to regular listings.</p>
          </div>

          <div style={styles.featureCard} className="feature-card-hover">
            <div style={styles.featureIcon}><FiCheck /></div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Verified Badge</h3>
            <p>Gain trust with our verified badge that shows you're a premium host.</p>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, marginTop: 25, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Premium Hosting Plans</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Basic</h3>
              <p style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 15 }}>₹499<span style={{ fontSize: 14, fontWeight: 'normal' }}>/month</span></p>
              <ul style={{ textAlign: 'left', marginBottom: 20, listStyle: 'none', padding: 0, fontSize: 14 }}>
                <li style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><FiCheck size={14} /> Featured for 7 days</li>
                <li style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><FiCheck size={14} /> Premium badge</li>
                <li style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><FiCheck size={14} /> Basic analytics</li>
              </ul>
              <button style={styles.submitButton}>Select Plan</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------
   Bike Rental Page
------------------------------ */
function BikeRentalPage() {
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [user, setUser] = useState(null);

  const BIKE_TYPES = ["Scooter", "Sport Bike", "Cruiser", "Electric", "Standard"];
  const FUEL_TYPES = ["Petrol", "Electric", "Diesel"];
  const FEATURE_OPTIONS = ["Helmet Included", "Insurance", "Unlimited KMs", "Saddle Bags", "GPS Tracker", "Charging Cable", "Phone Mount", "Rain Gear"];

  const emptyForm = {
    name: '', type: 'Scooter', city: 'Goa', price: '',
    fuel: 'Petrol', cc: '', seats: 2, available: true,
    features: ["Helmet Included", "Insurance"],
    contactNumber: '918638572663'
  };
  const [form, setForm] = useState(emptyForm);

  // Auth listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return () => unsub();
  }, []);

  // Fetch bikes from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "bikes"),
      (snapshot) => {
        const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        all.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate?.() ? b.createdAt.toDate().getTime() : 0;
          return bTime - aTime;
        });
        setBikes(all);
        setLoading(false);
      },
      (err) => { console.error("Error fetching bikes:", err); setLoading(false); }
    );
    return () => unsub();
  }, []);

  const filteredBikes = bikes.filter(bike => {
    if (selectedCity !== "All" && bike.city !== selectedCity) return false;
    if (selectedType !== "All" && bike.type !== selectedType) return false;
    return true;
  });

  const handleWhatsAppEnquiry = (bike) => {
    const phone = bike.contactNumber || '918638572663';
    const message = `Hi! I'm interested in renting the ${bike.name} in ${bike.city}. Price: ₹${bike.price}/day. Please share availability details.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFeatureToggle = (feature) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST", body: formData
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handleAddBike = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.cc) {
      alert("Please fill in all required fields (Name, Price, CC).");
      return;
    }
    if (!imageFile) {
      alert("Please upload a bike image.");
      return;
    }
    setSubmitting(true);
    try {
      const imageUrl = await uploadImage(imageFile);
      await addDoc(collection(db, "bikes"), {
        name: form.name,
        type: form.type,
        city: form.city,
        price: Number(form.price),
        fuel: form.fuel,
        cc: form.cc,
        seats: Number(form.seats),
        available: form.available,
        features: form.features,
        contactNumber: form.contactNumber || '918638572663',
        image: imageUrl,
        rating: 0,
        createdAt: serverTimestamp(),
        addedBy: user?.email || 'anonymous'
      });
      setForm(emptyForm);
      setImageFile(null);
      setImagePreview(null);
      setShowAddForm(false);
      alert("Bike added successfully!");
    } catch (err) {
      console.error("Error adding bike:", err);
      alert("Failed to add bike. Please try again.");
    }
    setSubmitting(false);
  };

  const handleDeleteBike = async (bikeId, bikeName) => {
    if (!window.confirm(`Are you sure you want to delete "${bikeName}"?`)) return;
    try {
      await deleteDoc(doc(db, "bikes", bikeId));
    } catch (err) {
      console.error("Error deleting bike:", err);
      alert("Failed to delete bike.");
    }
  };

  const handleToggleAvailability = async (bikeId, currentStatus) => {
    try {
      await updateDoc(doc(db, "bikes", bikeId), { available: !currentStatus });
    } catch (err) {
      console.error("Error updating availability:", err);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1px solid #e0e0e0', fontSize: 14, fontWeight: 500,
    backgroundColor: '#fff', boxSizing: 'border-box', outline: 'none',
    transition: 'border-color 0.2s'
  };
  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 600, color: '#374151',
    marginBottom: 6, letterSpacing: 0
  };
  const bikeRentalDescription = "Rent bikes, scooters, and motorcycles in Goa, Guwahati, and Shillong with daily pricing, WhatsApp booking, helmets, and local support from Homavia.";
  const bikeServiceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Homavia Bike Rental",
    "serviceType": "Bike rental",
    "url": buildAbsoluteUrl("/bike-rental"),
    "description": bikeRentalDescription,
    "provider": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": SITE_URL
    },
    "areaServed": ["Goa", "Guwahati", "Shillong"]
  };
  const bikeItemListSchema = filteredBikes.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Bikes and scooters available on Homavia",
    "numberOfItems": filteredBikes.length,
    "itemListElement": filteredBikes.slice(0, 10).map((bike, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": bike.name,
        "image": normalizeSeoImage(bike.image),
        "category": bike.type || "Bike rental",
        "brand": {
          "@type": "Brand",
          "name": SITE_NAME
        },
        "offers": bike.price ? {
          "@type": "Offer",
          "priceCurrency": "INR",
          "price": bike.price,
          "availability": bike.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "seller": {
            "@type": "Organization",
            "name": SITE_NAME
          }
        } : undefined
      }
    }))
  } : null;

  return (
    <div>
      <SeoHelmet
        title="Rent Bikes & Scooters in Goa, Guwahati & Shillong | Homavia"
        description={bikeRentalDescription}
        keywords="bike rental Goa, scooter rental Goa, bike rental Guwahati, bike rental Shillong, motorcycle rental India, Homavia rentals"
        canonicalPath="/bike-rental"
        schema={[bikeServiceSchema, bikeItemListSchema]}
      />

      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        borderRadius: 20, padding: '40px 24px', marginBottom: 28,
        textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏍️</div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: 0 }}>
            Rent a Bike
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            Explore cities on two wheels. Affordable bike & scooter rentals with helmet, insurance & unlimited kilometers.
          </p>
        </div>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,56,92,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,56,92,0.08)' }} />
      </div>

      {/* Add Bike Button (admin/logged-in users) */}
      {user && (
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '10px 20px', borderRadius: 12, border: 'none',
              background: showAddForm ? '#6b7280' : 'linear-gradient(135deg, #B42318 0%, #D92D20 100%)',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 12px rgba(255,56,92,0.3)', transition: 'all 0.2s'
            }}
          >
            {showAddForm ? <><FiX size={16} /> Cancel</> : <><FiHome size={16} /> Add Bike</>}
          </button>
        </div>
      )}

      {/* Add Bike Form */}
      {showAddForm && user && (
        <form onSubmit={handleAddBike} style={{
          backgroundColor: '#fff', borderRadius: 16, padding: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6',
          marginBottom: 28, animation: 'fadeIn 0.3s ease'
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#1f2937' }}>
            🏍️ Add New Bike
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label style={labelStyle}>Bike Name *</label>
              <input style={inputStyle} placeholder="e.g. Honda Activa 6G" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label style={labelStyle}>Type *</label>
              <select style={inputStyle} value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {BIKE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>City *</label>
              <select style={inputStyle} value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}>
                {ALL_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Price per Day (₹) *</label>
              <input style={inputStyle} type="number" placeholder="e.g. 400" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" />
            </div>
            <div>
              <label style={labelStyle}>Fuel Type *</label>
              <select style={inputStyle} value={form.fuel}
                onChange={(e) => setForm({ ...form, fuel: e.target.value })}>
                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Engine CC *</label>
              <input style={inputStyle} placeholder="e.g. 110cc" value={form.cc}
                onChange={(e) => setForm({ ...form, cc: e.target.value })} required />
            </div>
            <div>
              <label style={labelStyle}>Seats</label>
              <input style={inputStyle} type="number" value={form.seats} min="1" max="3"
                onChange={(e) => setForm({ ...form, seats: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>WhatsApp Number</label>
              <input style={inputStyle} placeholder="e.g. 918638572663" value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
            </div>
          </div>

          {/* Features */}
          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Features Included</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {FEATURE_OPTIONS.map(f => (
                <button key={f} type="button" onClick={() => handleFeatureToggle(f)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                    border: form.features.includes(f) ? '2px solid #10b981' : '1px solid #e0e0e0',
                    backgroundColor: form.features.includes(f) ? '#d1fae5' : '#fff',
                    color: form.features.includes(f) ? '#065f46' : '#6b7280',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                  {form.features.includes(f) ? <><FiCheck size={12} /> </> : null}{f}
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Bike Image *</label>
            <input type="file" accept="image/*" onChange={handleImageChange}
              style={{ ...inputStyle, padding: '10px 12px' }} />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" style={{
                width: 200, height: 140, objectFit: 'cover', borderRadius: 12,
                marginTop: 12, border: '2px solid #f3f4f6'
              }} />
            )}
          </div>

          {/* Availability */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="bike-available" checked={form.available}
              onChange={(e) => setForm({ ...form, available: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: '#10b981' }} />
            <label htmlFor="bike-available" style={{ fontSize: 14, fontWeight: 500, color: '#374151', cursor: 'pointer' }}>
              Currently Available for Rent
            </label>
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting} style={{
            marginTop: 24, width: '100%', padding: '14px 24px', borderRadius: 12,
            border: 'none', background: submitting ? '#d1d5db' : 'linear-gradient(135deg, #B42318 0%, #D92D20 100%)',
            color: '#fff', fontSize: 16, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(255,56,92,0.3)', transition: 'all 0.2s'
          }}>
            {submitting ? 'Adding Bike...' : '🏍️ Add Bike'}
          </button>
        </form>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e0e0e0', fontSize: 14, fontWeight: 500, backgroundColor: '#fff', flex: '1 1 140px', minWidth: 140, cursor: 'pointer' }}>
          <option value="All">All Cities</option>
          {ALL_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
        </select>
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e0e0e0', fontSize: 14, fontWeight: 500, backgroundColor: '#fff', flex: '1 1 140px', minWidth: 140, cursor: 'pointer' }}>
          <option value="All">All Types</option>
          {BIKE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      {/* Results Count */}
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16, fontWeight: 500 }}>
        {filteredBikes.length} bike{filteredBikes.length !== 1 ? 's' : ''} available
      </p>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e0e0e0', borderTop: '3px solid #B42318', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Loading bikes...</p>
        </div>
      )}

      {/* Bike Grid */}
      {!loading && (
        <div className="bike-rental-grid">
          {filteredBikes.map(bike => (
            <div key={bike.id} style={{
              borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6',
              transition: 'all 0.3s ease', cursor: 'pointer', position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
            }}>
              {/* Image */}
              <div style={{ position: 'relative' }}>
                <img src={bike.image} alt={bike.name} loading="lazy"
                  style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                {!bike.available && (
                  <div style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#ef4444', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>BOOKED</div>
                )}
                <div style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{bike.type}</div>
              </div>

              {/* Info */}
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1f2937', lineHeight: 1.3 }}>
                    {bike.name}
                  </h3>
                  {bike.rating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 600, color: '#f59e0b', flexShrink: 0 }}>
                      <FiStar fill="#f59e0b" size={14} /> {bike.rating}
                    </div>
                  )}
                </div>

                <p style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, margin: '0 0 8px' }}>
                  <FiMapPin size={13} /> {bike.city}
                </p>

                {/* Specs */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#374151', backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: 6, fontWeight: 500 }}>
                    ⛽ {bike.fuel}
                  </span>
                  <span style={{ fontSize: 12, color: '#374151', backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: 6, fontWeight: 500 }}>
                    🏎️ {bike.cc}
                  </span>
                  <span style={{ fontSize: 12, color: '#374151', backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: 6, fontWeight: 500 }}>
                    👥 {bike.seats} seats
                  </span>
                </div>

                {/* Features */}
                {bike.features && bike.features.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {bike.features.map((f, i) => (
                      <span key={i} style={{
                        fontSize: 11, color: '#10b981', backgroundColor: '#d1fae5',
                        padding: '2px 8px', borderRadius: 10, fontWeight: 500
                      }}>
                        <FiCheck size={10} style={{ marginRight: 2 }} />{f}
                      </span>
                    ))}
                  </div>
                )}

                {/* Price & CTA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#B42318' }}>₹{bike.price}</span>
                    <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}> / day</span>
                  </div>
                  <button
                    onClick={() => handleWhatsAppEnquiry(bike)}
                    disabled={!bike.available}
                    style={{
                      padding: '8px 16px', borderRadius: 10, border: 'none',
                      backgroundColor: bike.available ? '#25d366' : '#d1d5db',
                      color: '#fff', fontSize: 13, fontWeight: 700, cursor: bike.available ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { if (bike.available) e.target.style.backgroundColor = '#1da851'; }}
                    onMouseLeave={(e) => { if (bike.available) e.target.style.backgroundColor = '#25d366'; }}
                  >
                    <FiMessageCircle size={14} /> {bike.available ? 'Book Now' : 'Unavailable'}
                  </button>
                </div>

                {/* Admin controls */}
                {user && (isAdminUser(user) || bike.addedBy === user.email) && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
                    <button onClick={() => handleToggleAvailability(bike.id, bike.available)}
                      style={{
                        flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #e0e0e0',
                        backgroundColor: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        color: bike.available ? '#ef4444' : '#10b981', transition: 'all 0.2s'
                      }}>
                      {bike.available ? 'Mark Booked' : 'Mark Available'}
                    </button>
                    <button onClick={() => handleDeleteBike(bike.id, bike.name)}
                      style={{
                        padding: '6px 10px', borderRadius: 8, border: '1px solid #fee2e2',
                        backgroundColor: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        color: '#ef4444', transition: 'all 0.2s'
                      }}>
                      <FiX size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredBikes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏍️</div>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>No bikes found</h3>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            {bikes.length === 0 ? 'No bikes added yet. Be the first to add one!' : 'Try changing your filters'}
          </p>
        </div>
      )}

      {/* How it works */}
      <div style={{
        marginTop: 40, padding: '32px 24px', backgroundColor: '#fff',
        borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 24, color: '#1f2937' }}>
          How It Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
          {[
            { icon: '🔍', title: 'Choose a Bike', desc: 'Browse our collection and pick your ride' },
            { icon: '📱', title: 'Book via WhatsApp', desc: 'Quick booking through WhatsApp chat' },
            { icon: '🔑', title: 'Pick Up & Ride', desc: 'Collect your bike and start exploring' },
            { icon: '✅', title: 'Return & Done', desc: 'Drop it back at the pickup point' }
          ].map((step, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{step.icon}</div>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#1f2937' }}>{step.title}</h4>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------
   Car Rental Page
------------------------------ */
function CarRentalPage() {
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [user, setUser] = useState(null);

  const CAR_TYPES = ["Hatchback", "Sedan", "SUV", "MUV", "Luxury", "Electric"];
  const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "CNG", "Hybrid"];
  const TRANSMISSION_TYPES = ["Manual", "Automatic"];
  const FEATURE_OPTIONS = ["AC", "GPS Navigation", "Bluetooth", "USB Charging", "Airbags", "Rear Camera", "Sunroof", "Roof Carrier", "Child Seat", "Toll Pass"];

  const emptyForm = {
    name: '', type: 'Hatchback', city: 'Goa', price: '',
    fuel: 'Petrol', transmission: 'Manual', seats: 5, available: true,
    features: ["AC", "Bluetooth", "USB Charging"],
    contactNumber: '918638572663'
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "cars"),
      (snapshot) => {
        const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        all.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate?.() ? b.createdAt.toDate().getTime() : 0;
          return bTime - aTime;
        });
        setCars(all);
        setLoading(false);
      },
      (err) => { console.error("Error fetching cars:", err); setLoading(false); }
    );
    return () => unsub();
  }, []);

  const filteredCars = cars.filter(car => {
    if (selectedCity !== "All" && car.city !== selectedCity) return false;
    if (selectedType !== "All" && car.type !== selectedType) return false;
    return true;
  });

  const handleWhatsAppEnquiry = (car) => {
    const phone = car.contactNumber || '918638572663';
    const message = `Hi! I'm interested in renting the ${car.name} in ${car.city}. Price: ₹${car.price}/day. Please share availability details.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFeatureToggle = (feature) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST", body: formData
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      alert("Please fill in all required fields (Name, Price).");
      return;
    }
    if (!imageFile) {
      alert("Please upload a car image.");
      return;
    }
    setSubmitting(true);
    try {
      const imageUrl = await uploadImage(imageFile);
      await addDoc(collection(db, "cars"), {
        name: form.name,
        type: form.type,
        city: form.city,
        price: Number(form.price),
        fuel: form.fuel,
        transmission: form.transmission,
        seats: Number(form.seats),
        available: form.available,
        features: form.features,
        contactNumber: form.contactNumber || '918638572663',
        image: imageUrl,
        rating: 0,
        createdAt: serverTimestamp(),
        addedBy: user?.email || 'anonymous'
      });
      setForm(emptyForm);
      setImageFile(null);
      setImagePreview(null);
      setShowAddForm(false);
      alert("Car added successfully!");
    } catch (err) {
      console.error("Error adding car:", err);
      alert("Failed to add car. Please try again.");
    }
    setSubmitting(false);
  };

  const handleDeleteCar = async (carId, carName) => {
    if (!window.confirm(`Are you sure you want to delete "${carName}"?`)) return;
    try {
      await deleteDoc(doc(db, "cars", carId));
    } catch (err) {
      console.error("Error deleting car:", err);
      alert("Failed to delete car.");
    }
  };

  const handleToggleAvailability = async (carId, currentStatus) => {
    try {
      await updateDoc(doc(db, "cars", carId), { available: !currentStatus });
    } catch (err) {
      console.error("Error updating availability:", err);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1px solid #e0e0e0', fontSize: 14, fontWeight: 500,
    backgroundColor: '#fff', boxSizing: 'border-box', outline: 'none',
    transition: 'border-color 0.2s'
  };
  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 600, color: '#374151',
    marginBottom: 6, letterSpacing: 0
  };
  const carRentalDescription = "Rent self-drive and chauffeur-driven cars in Goa, Guwahati, and Shillong with transparent daily pricing, WhatsApp booking, and local support from Homavia.";
  const carServiceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Homavia Car Rental",
    "serviceType": "Car rental",
    "url": buildAbsoluteUrl("/car-rental"),
    "description": carRentalDescription,
    "provider": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": SITE_URL
    },
    "areaServed": ["Goa", "Guwahati", "Shillong"]
  };
  const carItemListSchema = filteredCars.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Cars available on Homavia",
    "numberOfItems": filteredCars.length,
    "itemListElement": filteredCars.slice(0, 10).map((car, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": car.name,
        "image": normalizeSeoImage(car.image),
        "category": car.type || "Car rental",
        "brand": {
          "@type": "Brand",
          "name": SITE_NAME
        },
        "offers": car.price ? {
          "@type": "Offer",
          "priceCurrency": "INR",
          "price": car.price,
          "availability": car.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "seller": {
            "@type": "Organization",
            "name": SITE_NAME
          }
        } : undefined
      }
    }))
  } : null;

  return (
    <div>
      <SeoHelmet
        title="Rent Cars in Goa, Guwahati & Shillong | Homavia"
        description={carRentalDescription}
        keywords="car rental Goa, self drive car Goa, car rental Guwahati, car rental Shillong, SUV rental India, Homavia rentals"
        canonicalPath="/car-rental"
        schema={[carServiceSchema, carItemListSchema]}
      />

      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        borderRadius: 20, padding: '40px 24px', marginBottom: 28,
        textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚗</div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: 0 }}>
            Rent a Car
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            Drive at your own pace. Self-drive & chauffeur-driven cars available with insurance & unlimited kilometers.
          </p>
        </div>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(59,130,246,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(59,130,246,0.08)' }} />
      </div>

      {/* Add Car Button */}
      {user && (
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '10px 20px', borderRadius: 12, border: 'none',
              background: showAddForm ? '#6b7280' : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)', transition: 'all 0.2s'
            }}>
            {showAddForm ? <><FiX size={16} /> Cancel</> : <><FiHome size={16} /> Add Car</>}
          </button>
        </div>
      )}

      {/* Add Car Form */}
      {showAddForm && user && (
        <form onSubmit={handleAddCar} style={{
          backgroundColor: '#fff', borderRadius: 16, padding: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6',
          marginBottom: 28, animation: 'fadeIn 0.3s ease'
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#1f2937' }}>
            🚗 Add New Car
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label style={labelStyle}>Car Name *</label>
              <input style={inputStyle} placeholder="e.g. Maruti Swift" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label style={labelStyle}>Type *</label>
              <select style={inputStyle} value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {CAR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>City *</label>
              <select style={inputStyle} value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}>
                {ALL_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Price per Day (₹) *</label>
              <input style={inputStyle} type="number" placeholder="e.g. 1500" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" />
            </div>
            <div>
              <label style={labelStyle}>Fuel Type *</label>
              <select style={inputStyle} value={form.fuel}
                onChange={(e) => setForm({ ...form, fuel: e.target.value })}>
                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Transmission *</label>
              <select style={inputStyle} value={form.transmission}
                onChange={(e) => setForm({ ...form, transmission: e.target.value })}>
                {TRANSMISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Seats</label>
              <input style={inputStyle} type="number" value={form.seats} min="2" max="12"
                onChange={(e) => setForm({ ...form, seats: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>WhatsApp Number</label>
              <input style={inputStyle} placeholder="e.g. 918638572663" value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
            </div>
          </div>

          {/* Features */}
          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Features Included</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {FEATURE_OPTIONS.map(f => (
                <button key={f} type="button" onClick={() => handleFeatureToggle(f)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                    border: form.features.includes(f) ? '2px solid #3b82f6' : '1px solid #e0e0e0',
                    backgroundColor: form.features.includes(f) ? '#dbeafe' : '#fff',
                    color: form.features.includes(f) ? '#1e40af' : '#6b7280',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                  {form.features.includes(f) ? <><FiCheck size={12} /> </> : null}{f}
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Car Image *</label>
            <input type="file" accept="image/*" onChange={handleImageChange}
              style={{ ...inputStyle, padding: '10px 12px' }} />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" style={{
                width: 200, height: 140, objectFit: 'cover', borderRadius: 12,
                marginTop: 12, border: '2px solid #f3f4f6'
              }} />
            )}
          </div>

          {/* Availability */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="car-available" checked={form.available}
              onChange={(e) => setForm({ ...form, available: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: '#3b82f6' }} />
            <label htmlFor="car-available" style={{ fontSize: 14, fontWeight: 500, color: '#374151', cursor: 'pointer' }}>
              Currently Available for Rent
            </label>
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting} style={{
            marginTop: 24, width: '100%', padding: '14px 24px', borderRadius: 12,
            border: 'none', background: submitting ? '#d1d5db' : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
            color: '#fff', fontSize: 16, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(59,130,246,0.3)', transition: 'all 0.2s'
          }}>
            {submitting ? 'Adding Car...' : '🚗 Add Car'}
          </button>
        </form>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e0e0e0', fontSize: 14, fontWeight: 500, backgroundColor: '#fff', flex: '1 1 140px', minWidth: 140, cursor: 'pointer' }}>
          <option value="All">All Cities</option>
          {ALL_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
        </select>
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e0e0e0', fontSize: 14, fontWeight: 500, backgroundColor: '#fff', flex: '1 1 140px', minWidth: 140, cursor: 'pointer' }}>
          <option value="All">All Types</option>
          {CAR_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      {/* Results Count */}
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16, fontWeight: 500 }}>
        {filteredCars.length} car{filteredCars.length !== 1 ? 's' : ''} available
      </p>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e0e0e0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Loading cars...</p>
        </div>
      )}

      {/* Car Grid */}
      {!loading && (
        <div className="bike-rental-grid">
          {filteredCars.map(car => (
            <div key={car.id} style={{
              borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6',
              transition: 'all 0.3s ease', cursor: 'pointer', position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
            }}>
              {/* Image */}
              <div style={{ position: 'relative' }}>
                <img src={car.image} alt={car.name} loading="lazy"
                  style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                {!car.available && (
                  <div style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#ef4444', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>BOOKED</div>
                )}
                <div style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{car.type}</div>
              </div>

              {/* Info */}
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1f2937', lineHeight: 1.3 }}>
                    {car.name}
                  </h3>
                  {car.rating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 600, color: '#f59e0b', flexShrink: 0 }}>
                      <FiStar fill="#f59e0b" size={14} /> {car.rating}
                    </div>
                  )}
                </div>

                <p style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, margin: '0 0 8px' }}>
                  <FiMapPin size={13} /> {car.city}
                </p>

                {/* Specs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#374151', backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: 6, fontWeight: 500 }}>
                    ⛽ {car.fuel}
                  </span>
                  <span style={{ fontSize: 12, color: '#374151', backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: 6, fontWeight: 500 }}>
                    ⚙️ {car.transmission}
                  </span>
                  <span style={{ fontSize: 12, color: '#374151', backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: 6, fontWeight: 500 }}>
                    👥 {car.seats} seats
                  </span>
                </div>

                {/* Features */}
                {car.features && car.features.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {car.features.map((f, i) => (
                      <span key={i} style={{
                        fontSize: 11, color: '#2563eb', backgroundColor: '#dbeafe',
                        padding: '2px 8px', borderRadius: 10, fontWeight: 500
                      }}>
                        <FiCheck size={10} style={{ marginRight: 2 }} />{f}
                      </span>
                    ))}
                  </div>
                )}

                {/* Price & CTA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6' }}>₹{car.price}</span>
                    <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}> / day</span>
                  </div>
                  <button
                    onClick={() => handleWhatsAppEnquiry(car)}
                    disabled={!car.available}
                    style={{
                      padding: '8px 16px', borderRadius: 10, border: 'none',
                      backgroundColor: car.available ? '#25d366' : '#d1d5db',
                      color: '#fff', fontSize: 13, fontWeight: 700, cursor: car.available ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { if (car.available) e.target.style.backgroundColor = '#1da851'; }}
                    onMouseLeave={(e) => { if (car.available) e.target.style.backgroundColor = '#25d366'; }}
                  >
                    <FiMessageCircle size={14} /> {car.available ? 'Book Now' : 'Unavailable'}
                  </button>
                </div>

                {/* Admin controls */}
                {user && (isAdminUser(user) || car.addedBy === user.email) && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
                    <button onClick={() => handleToggleAvailability(car.id, car.available)}
                      style={{
                        flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #e0e0e0',
                        backgroundColor: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        color: car.available ? '#ef4444' : '#10b981', transition: 'all 0.2s'
                      }}>
                      {car.available ? 'Mark Booked' : 'Mark Available'}
                    </button>
                    <button onClick={() => handleDeleteCar(car.id, car.name)}
                      style={{
                        padding: '6px 10px', borderRadius: 8, border: '1px solid #fee2e2',
                        backgroundColor: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        color: '#ef4444', transition: 'all 0.2s'
                      }}>
                      <FiX size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredCars.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚗</div>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>No cars found</h3>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            {cars.length === 0 ? 'No cars added yet. Be the first to add one!' : 'Try changing your filters'}
          </p>
        </div>
      )}

      {/* How it works */}
      <div style={{
        marginTop: 40, padding: '32px 24px', backgroundColor: '#fff',
        borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 24, color: '#1f2937' }}>
          How It Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
          {[
            { icon: '🔍', title: 'Choose a Car', desc: 'Browse our fleet and pick your ride' },
            { icon: '📱', title: 'Book via WhatsApp', desc: 'Quick booking through WhatsApp chat' },
            { icon: '🔑', title: 'Pick Up & Drive', desc: 'Collect your car and hit the road' },
            { icon: '✅', title: 'Return & Done', desc: 'Drop it back at the pickup point' }
          ].map((step, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{step.icon}</div>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#1f2937' }}>{step.title}</h4>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------
   Property Sale Page
------------------------------ */
const PROPERTY_ENQUIRY_PHONE = "918638572663";
const PROPERTY_ENQUIRY_DISPLAY = "+91 86385 72663";
const APARTMENT_PROJECT_STATUS_OPTIONS = [
  "All statuses",
  "Under Construction",
  "Ready To Move",
  "Ongoing",
  "Completed",
  "Upcoming"
];
const ACTIVE_APARTMENT_PROJECTS = [];
const APARTMENT_PROJECT_CITIES = [
  "All project cities",
  ...Array.from(new Set(ACTIVE_APARTMENT_PROJECTS.map(project => project.city))).sort()
];

function PropertySalePage() {
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [projectSearch, setProjectSearch] = useState("");
  const [selectedProjectCity, setSelectedProjectCity] = useState("All project cities");
  const [selectedProjectStatus, setSelectedProjectStatus] = useState("All statuses");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [user, setUser] = useState(null);

  const PROPERTY_TYPES = ["Apartment Sale", "Land for Sale"];
  const SIZE_UNITS = ["sq ft", "katha", "bigha", "acre"];
  const STATUS_OPTIONS = ["Available", "Under Offer", "Sold"];
  const FEATURE_OPTIONS = [
    "Airport side",
    "Road facing",
    "Clear title",
    "Parking",
    "Lift",
    "Security",
    "Water supply",
    "Power backup",
    "Loan support",
    "Ready to move",
    "RERA available",
    "Gated community",
    "Gym",
    "Clubhouse",
    "Balcony",
    "Vastu compliant"
  ];
  const emptyForm = {
    title: "",
    category: "Apartment Sale",
    city: "Guwahati",
    area: "",
    price: "",
    size: "",
    sizeUnit: "sq ft",
    projectName: "",
    developerName: "",
    reraId: "",
    possession: "",
    bedrooms: "",
    bathrooms: "",
    floor: "",
    furnishingStatus: "Unfurnished",
    parking: "Not mentioned",
    balcony: "",
    ownershipType: "Freehold",
    status: "Available",
    description: "",
    googleMapLink: "",
    contactNumber: PROPERTY_ENQUIRY_PHONE,
    features: ["Clear title", "Loan support"]
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "propertySales"),
      (snapshot) => {
        const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        all.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate?.() ? b.createdAt.toDate().getTime() : 0;
          return bTime - aTime;
        });
        setProperties(all);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching property sales:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filteredProperties = properties.filter(property => {
    if (selectedCity !== "All" && property.city !== selectedCity) return false;
    if (selectedCategory !== "All" && property.category !== selectedCategory) return false;
    return true;
  });

  const filteredApartmentProjects = useMemo(() => {
    const search = projectSearch.trim().toLowerCase();
    return ACTIVE_APARTMENT_PROJECTS.filter(project => {
      if (selectedProjectCity !== "All project cities" && project.city !== selectedProjectCity) return false;
      if (selectedProjectStatus !== "All statuses" && project.status !== selectedProjectStatus) return false;
      if (!search) return true;
      return [
        project.name,
        project.city,
        project.area,
        project.developer,
        project.category,
        project.status
      ].join(" ").toLowerCase().includes(search);
    });
  }, [projectSearch, selectedProjectCity, selectedProjectStatus]);

  const formatPropertyPrice = (price) => {
    const amount = Number(price || 0);
    if (!amount) return "Price on request";
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(amount % 10000000 === 0 ? 0 : 2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 2)} L`;
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const handleWhatsAppEnquiry = (property) => {
    const phone = property.contactNumber || PROPERTY_ENQUIRY_PHONE;
    const apartmentDetails = property.category === "Apartment Sale"
      ? [
          property.projectName ? `Project: ${property.projectName}` : "",
          property.developerName ? `Developer: ${property.developerName}` : "",
          property.bedrooms ? `${property.bedrooms} BHK` : "",
          property.possession ? `Possession: ${property.possession}` : "",
          property.reraId ? `RERA: ${property.reraId}` : ""
        ].filter(Boolean).join(". ")
      : "";
    const message = `Hi! I'm interested in ${property.title} listed on Homavia. Category: ${property.category}. Location: ${property.area || property.city}. Price: ${formatPropertyPrice(property.price)}.${apartmentDetails ? ` ${apartmentDetails}.` : ""} Please share more details.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleApartmentProjectEnquiry = (project) => {
    const message = `Hi Homavia, I want details for ${project.name} in ${project.area}, ${project.city}. Developer: ${project.developer}. Please share apartment availability and price.`;
    window.open(`https://wa.me/${PROPERTY_ENQUIRY_PHONE}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFeatureToggle = (feature) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(item => item !== feature)
        : [...prev.features, feature]
    }));
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handleAddProperty = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.city || !form.area || !form.size) {
      alert("Please fill in title, price, city, area, and size.");
      return;
    }

    setSubmitting(true);
    try {
      const imageUrl = imageFile ? await uploadImage(imageFile) : "";
      await addDoc(collection(db, "propertySales"), {
        title: form.title,
        category: form.category,
        city: form.city,
        area: form.area,
        price: Number(form.price),
        size: Number(form.size),
        sizeUnit: form.sizeUnit,
        projectName: form.category === "Apartment Sale" ? form.projectName : "",
        developerName: form.category === "Apartment Sale" ? form.developerName : "",
        reraId: form.category === "Apartment Sale" ? form.reraId : "",
        possession: form.category === "Apartment Sale" ? form.possession : "",
        bedrooms: form.category === "Apartment Sale" ? Number(form.bedrooms || 0) : 0,
        bathrooms: form.category === "Apartment Sale" ? Number(form.bathrooms || 0) : 0,
        floor: form.category === "Apartment Sale" ? form.floor : "",
        furnishingStatus: form.category === "Apartment Sale" ? form.furnishingStatus : "",
        parking: form.category === "Apartment Sale" ? form.parking : "",
        balcony: form.category === "Apartment Sale" ? form.balcony : "",
        ownershipType: form.ownershipType,
        status: form.status,
        description: form.description,
        googleMapLink: form.googleMapLink,
        contactNumber: form.contactNumber || PROPERTY_ENQUIRY_PHONE,
        features: form.features,
        image: imageUrl,
        createdAt: serverTimestamp(),
        createdBy: user?.uid || "",
        addedBy: user?.email || "anonymous"
      });
      setForm(emptyForm);
      setImageFile(null);
      setImagePreview(null);
      setShowAddForm(false);
      alert("Property sale listing added successfully!");
    } catch (err) {
      console.error("Error adding property sale:", err);
      alert("Failed to add property sale listing. Please try again.");
    }
    setSubmitting(false);
  };

  const handleDeleteProperty = async (propertyId, propertyTitle) => {
    if (!window.confirm(`Delete "${propertyTitle}" from property sale listings?`)) return;
    try {
      await deleteDoc(doc(db, "propertySales", propertyId));
    } catch (err) {
      console.error("Error deleting property sale:", err);
      alert("Failed to delete property sale listing.");
    }
  };

  const handleStatusChange = async (propertyId, status) => {
    try {
      await updateDoc(doc(db, "propertySales", propertyId), { status });
    } catch (err) {
      console.error("Error updating property status:", err);
      alert("Failed to update status.");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #e0e0e0",
    fontSize: 14,
    fontWeight: 500,
    backgroundColor: "#fff",
    boxSizing: "border-box",
    outline: "none"
  };
  const labelStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
    letterSpacing: 0
  };
  const propertySaleDescription = "Explore apartments for sale, residential projects, and land for sale on Homavia with project enquiries across Guwahati and Tier 1 Indian cities.";
  const propertyServiceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Homavia Property Sale",
    "serviceType": "Apartment project and property sale enquiries",
    "url": buildAbsoluteUrl("/property-sale"),
    "description": propertySaleDescription,
    "provider": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": SITE_URL
    },
    "areaServed": APARTMENT_PROJECT_CITIES.filter(city => city !== "All project cities")
  };
  const apartmentProjectListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Apartment and residential projects on Homavia",
    "numberOfItems": filteredApartmentProjects.length,
    "itemListElement": filteredApartmentProjects.slice(0, 20).map((project, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Residence",
        "name": project.name,
        "address": `${project.area}, ${project.city}`,
        "telephone": `+${PROPERTY_ENQUIRY_PHONE}`,
        "description": `${project.category} project by ${project.developer} in ${project.area}, ${project.city}. Status: ${project.status}.`
      }
    }))
  };
  const propertyItemListSchema = filteredProperties.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Land and apartments for sale on Homavia",
    "numberOfItems": filteredProperties.length,
    "itemListElement": filteredProperties.slice(0, 10).map((property, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": property.title,
        "image": normalizeSeoImage(property.image),
        "category": property.category || "Property sale",
        "description": property.description || propertySaleDescription,
        "offers": property.price ? {
          "@type": "Offer",
          "priceCurrency": "INR",
          "price": property.price,
          "availability": property.status === "Sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
          "seller": {
            "@type": "Organization",
            "name": SITE_NAME
          }
        } : undefined
      }
    }))
  } : null;
  const projectCityCount = APARTMENT_PROJECT_CITIES.length - 1;

  return (
    <div>
      <SeoHelmet
        title="Apartments for Sale & Residential Projects | Homavia Property"
        description={propertySaleDescription}
        keywords="apartments for sale Guwahati, residential projects Guwahati, apartment projects Mumbai, apartment projects Delhi NCR, apartment projects Bengaluru, property sale India, Homavia property"
        canonicalPath="/property-sale"
        schema={[propertyServiceSchema, apartmentProjectListSchema, propertyItemListSchema]}
      />

      <section style={{
        background: "linear-gradient(135deg, #0f172a 0%, #14532d 55%, #166534 100%)",
        borderRadius: 20,
        padding: "40px 24px",
        marginBottom: 28,
        color: "#fff",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 760 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#bbf7d0" }}>
            <FiHome /> Homavia Property
          </span>
          <h1 style={{ fontSize: 32, lineHeight: 1.15, fontWeight: 800, margin: "0 0 10px", letterSpacing: 0 }}>
            Apartments for sale and residential projects
          </h1>
          <p style={{ color: "#dcfce7", fontSize: 15, lineHeight: 1.7, maxWidth: 620, margin: 0 }}>
            Browse apartment project enquiries across Guwahati, Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Pune, Kolkata, and Ahmedabad. Buyers can enquire directly on WhatsApp at {PROPERTY_ENQUIRY_DISPLAY}.
          </p>
        </div>
      </section>

      {ACTIVE_APARTMENT_PROJECTS.length > 0 && (
      <section style={{
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 22,
        marginBottom: 28,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "1px solid #f3f4f6"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(240px, 320px)",
          gap: 18,
          alignItems: "start",
          marginBottom: 18
        }} className="property-project-header">
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: "#b42318", marginBottom: 8 }}>
              <FiHome /> Apartment project directory
            </span>
            <h2 style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.18, margin: "0 0 8px", color: "#111827" }}>
              Tier 1 city apartment projects with one Homavia enquiry number
            </h2>
            <p style={{ fontSize: 14, color: "#667085", lineHeight: 1.65, maxWidth: 760, margin: 0 }}>
              Search public project leads by city, locality, developer, category, or status. Every project card uses {PROPERTY_ENQUIRY_DISPLAY} for call and WhatsApp enquiries.
            </p>
          </div>

          <div style={{
            border: "1px solid #fee4e2",
            background: "#fff7f6",
            borderRadius: 14,
            padding: 16
          }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 900, color: "#b42318", textTransform: "uppercase", marginBottom: 8 }}>
              Project enquiry contact
            </span>
            <a href={`tel:+${PROPERTY_ENQUIRY_PHONE}`} style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "#111827",
              textDecoration: "none",
              fontSize: 20,
              fontWeight: 900
            }}>
              <FiPhone /> {PROPERTY_ENQUIRY_DISPLAY}
            </a>
            <p style={{ color: "#667085", fontSize: 13, margin: "8px 0 0", lineHeight: 1.5 }}>
              {ACTIVE_APARTMENT_PROJECTS.length} project leads across {projectCityCount} cities.
            </p>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(220px, 1fr) repeat(2, minmax(180px, 0.5fr)) auto",
          gap: 12,
          alignItems: "end",
          marginBottom: 18
        }} className="property-project-toolbar">
          <div>
            <label style={labelStyle}>Search project</label>
            <div style={{ position: "relative" }}>
              <FiSearch size={17} style={{ position: "absolute", left: 12, top: 14, color: "#98a2b3" }} />
              <input
                aria-label="Search apartment projects"
                style={{ ...inputStyle, paddingLeft: 38 }}
                placeholder="Project, developer, area"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>City</label>
            <select
              aria-label="Apartment project city"
              style={inputStyle}
              value={selectedProjectCity}
              onChange={(e) => setSelectedProjectCity(e.target.value)}
            >
              {APARTMENT_PROJECT_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select
              aria-label="Apartment project status"
              style={inputStyle}
              value={selectedProjectStatus}
              onChange={(e) => setSelectedProjectStatus(e.target.value)}
            >
              {APARTMENT_PROJECT_STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <div style={{
            minHeight: 46,
            border: "1px solid #eaecf0",
            borderRadius: 10,
            padding: "8px 12px",
            backgroundColor: "#f9fafb",
            minWidth: 130
          }}>
            <strong style={{ display: "block", color: "#111827", fontSize: 18, lineHeight: 1 }}>
              {filteredApartmentProjects.length}
            </strong>
            <span style={{ fontSize: 11, color: "#667085", fontWeight: 800, textTransform: "uppercase" }}>
              Projects
            </span>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 14
        }}>
          {filteredApartmentProjects.map(project => (
            <article key={project.id} style={{
              border: "1px solid #eaecf0",
              borderRadius: 14,
              padding: 16,
              background: "#fff",
              boxShadow: "0 2px 10px rgba(15,23,42,0.05)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: "#166534",
                  backgroundColor: "#dcfce7",
                  padding: "4px 8px",
                  borderRadius: 999
                }}>
                  {project.category}
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: "#7c2d12",
                  backgroundColor: "#ffedd5",
                  padding: "4px 8px",
                  borderRadius: 999,
                  textAlign: "right"
                }}>
                  {project.status}
                </span>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.25, margin: "0 0 8px", color: "#111827" }}>
                {project.name}
              </h3>
              <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#667085", margin: "0 0 10px" }}>
                <FiMapPin size={14} /> {project.area}, {project.city}
              </p>

              <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "#667085", fontWeight: 900, textTransform: "uppercase" }}>Developer</span>
                  <strong style={{ fontSize: 13, color: "#111827" }}>{project.developer}</strong>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "#667085", fontWeight: 900, textTransform: "uppercase" }}>Contact</span>
                  <strong style={{ fontSize: 13, color: "#111827" }}>{PROPERTY_ENQUIRY_DISPLAY}</strong>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid #f2f4f7", paddingTop: 12 }}>
                <a href={`tel:+${PROPERTY_ENQUIRY_PHONE}`} style={{
                  flex: "1 1 90px",
                  minHeight: 38,
                  borderRadius: 10,
                  backgroundColor: "#111827",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 900,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}>
                  <FiPhone size={14} /> Call
                </a>
                <button type="button" onClick={() => handleApartmentProjectEnquiry(project)} style={{
                  flex: "1 1 120px",
                  minHeight: 38,
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: "#25d366",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}>
                  <FiMessageCircle size={14} /> WhatsApp
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      )}

      {user && (
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              border: "none",
              background: showAddForm ? "#6b7280" : "linear-gradient(135deg, #15803d 0%, #22c55e 100%)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(34,197,94,0.25)"
            }}
          >
            {showAddForm ? <><FiX size={16} /> Cancel</> : <><FiHome size={16} /> Add Property</>}
          </button>
        </div>
      )}

      {showAddForm && user && (
        <form onSubmit={handleAddProperty} style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "1px solid #f3f4f6",
          marginBottom: 28
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: "#111827" }}>
            Add Land or Apartment Sale
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <div>
              <label style={labelStyle}>Listing Title *</label>
              <input style={inputStyle} placeholder="e.g. Airport-side residential land" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label style={labelStyle}>Sale Type *</label>
              <select style={inputStyle} value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {PROPERTY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>City *</label>
              <select style={inputStyle} value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}>
                {ALL_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Area / Locality *</label>
              <input style={inputStyle} placeholder="e.g. Borjhar, Garal, Six Mile" value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })} required />
            </div>
            <div>
              <label style={labelStyle}>Price (INR) *</label>
              <input style={inputStyle} type="number" placeholder="e.g. 3500000" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" />
            </div>
            <div>
              <label style={labelStyle}>Size *</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 8 }}>
                <input style={inputStyle} type="number" placeholder="e.g. 1440" value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })} required min="0" />
                <select style={inputStyle} value={form.sizeUnit}
                  onChange={(e) => setForm({ ...form, sizeUnit: e.target.value })}>
                  {SIZE_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </div>
            </div>
            {form.category === "Apartment Sale" && (
              <>
                <div>
                  <label style={labelStyle}>Project / Building Name</label>
                  <input style={inputStyle} placeholder="e.g. Airport Residency, Takeoff Heights" value={form.projectName}
                    onChange={(e) => setForm({ ...form, projectName: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Developer / Builder</label>
                  <input style={inputStyle} placeholder="e.g. Owner name, builder name" value={form.developerName}
                    onChange={(e) => setForm({ ...form, developerName: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>RERA ID</label>
                  <input style={inputStyle} placeholder="RERA number if available" value={form.reraId}
                    onChange={(e) => setForm({ ...form, reraId: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Possession / Availability</label>
                  <input style={inputStyle} placeholder="e.g. Ready to move, Dec 2027" value={form.possession}
                    onChange={(e) => setForm({ ...form, possession: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Bedrooms</label>
                  <input style={inputStyle} type="number" min="0" placeholder="e.g. 2" value={form.bedrooms}
                    onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Bathrooms</label>
                  <input style={inputStyle} type="number" min="0" placeholder="e.g. 2" value={form.bathrooms}
                    onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Floor</label>
                  <input style={inputStyle} placeholder="e.g. 3rd floor" value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Furnishing</label>
                  <select style={inputStyle} value={form.furnishingStatus}
                    onChange={(e) => setForm({ ...form, furnishingStatus: e.target.value })}>
                    <option>Unfurnished</option>
                    <option>Semi furnished</option>
                    <option>Fully furnished</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Parking</label>
                  <select style={inputStyle} value={form.parking}
                    onChange={(e) => setForm({ ...form, parking: e.target.value })}>
                    <option>Not mentioned</option>
                    <option>1 covered parking</option>
                    <option>1 open parking</option>
                    <option>2 parkings</option>
                    <option>No parking</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Balcony</label>
                  <input style={inputStyle} placeholder="e.g. 1 balcony, road-facing" value={form.balcony}
                    onChange={(e) => setForm({ ...form, balcony: e.target.value })} />
                </div>
              </>
            )}
            <div>
              <label style={labelStyle}>Ownership</label>
              <input style={inputStyle} placeholder="e.g. Freehold, Patta, Leasehold" value={form.ownershipType}
                onChange={(e) => setForm({ ...form, ownershipType: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>WhatsApp Number</label>
              <input style={inputStyle} placeholder="e.g. 918638572663" value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Google Map Link</label>
              <input style={inputStyle} placeholder="https://maps.google.com/..." value={form.googleMapLink}
                onChange={(e) => setForm({ ...form, googleMapLink: e.target.value })} />
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={labelStyle}>Highlights</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {FEATURE_OPTIONS.map(feature => (
                <button key={feature} type="button" onClick={() => handleFeatureToggle(feature)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    border: form.features.includes(feature) ? "2px solid #16a34a" : "1px solid #e5e7eb",
                    backgroundColor: form.features.includes(feature) ? "#dcfce7" : "#fff",
                    color: form.features.includes(feature) ? "#166534" : "#6b7280",
                    cursor: "pointer"
                  }}>
                  {feature}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 110, resize: "vertical" }} value={form.description}
              placeholder="Share nearby landmarks, road width, apartment condition, paperwork, or buyer notes."
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={labelStyle}>Property Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange}
              style={{ ...inputStyle, padding: "10px 12px" }} />
            {imagePreview && (
              <img src={imagePreview} alt="Property preview" style={{
                width: 220,
                height: 140,
                objectFit: "cover",
                borderRadius: 12,
                marginTop: 12,
                border: "1px solid #e5e7eb"
              }} />
            )}
          </div>

          <button type="submit" disabled={submitting} style={{
            marginTop: 24,
            width: "100%",
            padding: "14px 24px",
            borderRadius: 12,
            border: "none",
            background: submitting ? "#d1d5db" : "linear-gradient(135deg, #15803d 0%, #22c55e 100%)",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: submitting ? "not-allowed" : "pointer",
            boxShadow: "0 4px 16px rgba(34,197,94,0.25)"
          }}>
            {submitting ? "Adding Property..." : "Add Property Sale Listing"}
          </button>
        </form>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}
          style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #e0e0e0", fontSize: 14, fontWeight: 500, backgroundColor: "#fff", flex: "1 1 150px", minWidth: 150 }}>
          <option value="All">All Cities</option>
          {ALL_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
        </select>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #e0e0e0", fontSize: 14, fontWeight: 500, backgroundColor: "#fff", flex: "1 1 180px", minWidth: 180 }}>
          <option value="All">Land and Apartments</option>
          {PROPERTY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16, fontWeight: 500 }}>
        {filteredProperties.length} property sale listing{filteredProperties.length !== 1 ? "s" : ""} available
      </p>

      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e0e0e0", borderTop: "3px solid #16a34a", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
          <p style={{ fontSize: 14, color: "#6b7280" }}>Loading property sale listings...</p>
        </div>
      )}

      {!loading && (
        <div className="bike-rental-grid">
          {filteredProperties.map(property => {
            const canManage = user && (isAdminUser(user) || property.createdBy === user.uid || property.addedBy === user.email);
            return (
              <div key={property.id} style={{
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "#fff",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                border: "1px solid #f3f4f6",
                transition: "all 0.3s ease",
                position: "relative"
              }}>
                {property.image ? (
                  <img src={property.image} alt={property.title} loading="lazy"
                    style={{ width: "100%", height: 210, objectFit: "cover" }} />
                ) : (
                  <div style={{
                    height: 210,
                    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#166534",
                    fontWeight: 800,
                    fontSize: 18
                  }}>
                    {property.category}
                  </div>
                )}

                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 8 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: 0, lineHeight: 1.3 }}>
                      {property.title}
                    </h2>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: property.status === "Sold" ? "#991b1b" : "#166534",
                      backgroundColor: property.status === "Sold" ? "#fee2e2" : "#dcfce7",
                      padding: "4px 8px",
                      borderRadius: 999,
                      whiteSpace: "nowrap"
                    }}>
                      {property.status || "Available"}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 5, margin: "0 0 10px" }}>
                    <FiMapPin size={14} /> {property.area}, {property.city}
                  </p>

                  {property.category === "Apartment Sale" && (
                    <div style={{
                      display: "grid",
                      gap: 8,
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: "#f9fafb",
                      border: "1px solid #f2f4f7",
                      marginBottom: 12
                    }}>
                      {property.projectName && (
                        <div>
                          <span style={{ display: "block", fontSize: 10, color: "#667085", fontWeight: 900, textTransform: "uppercase" }}>Project</span>
                          <strong style={{ fontSize: 13, color: "#111827" }}>{property.projectName}</strong>
                        </div>
                      )}
                      {property.developerName && (
                        <div>
                          <span style={{ display: "block", fontSize: 10, color: "#667085", fontWeight: 900, textTransform: "uppercase" }}>Developer</span>
                          <strong style={{ fontSize: 13, color: "#111827" }}>{property.developerName}</strong>
                        </div>
                      )}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {property.possession && (
                          <span style={{ fontSize: 11, color: "#344054", backgroundColor: "#fff", border: "1px solid #eaecf0", padding: "4px 8px", borderRadius: 999, fontWeight: 800 }}>
                            Possession: {property.possession}
                          </span>
                        )}
                        {property.furnishingStatus && (
                          <span style={{ fontSize: 11, color: "#344054", backgroundColor: "#fff", border: "1px solid #eaecf0", padding: "4px 8px", borderRadius: 999, fontWeight: 800 }}>
                            {property.furnishingStatus}
                          </span>
                        )}
                        {property.parking && property.parking !== "Not mentioned" && (
                          <span style={{ fontSize: 11, color: "#344054", backgroundColor: "#fff", border: "1px solid #eaecf0", padding: "4px 8px", borderRadius: 999, fontWeight: 800 }}>
                            {property.parking}
                          </span>
                        )}
                        {property.balcony && (
                          <span style={{ fontSize: 11, color: "#344054", backgroundColor: "#fff", border: "1px solid #eaecf0", padding: "4px 8px", borderRadius: 999, fontWeight: 800 }}>
                            {property.balcony}
                          </span>
                        )}
                        {property.reraId && (
                          <span style={{ fontSize: 11, color: "#166534", backgroundColor: "#dcfce7", border: "1px solid #bbf7d0", padding: "4px 8px", borderRadius: 999, fontWeight: 900 }}>
                            RERA: {property.reraId}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: "#374151", backgroundColor: "#f3f4f6", padding: "4px 8px", borderRadius: 8, fontWeight: 600 }}>
                      {property.category}
                    </span>
                    <span style={{ fontSize: 12, color: "#374151", backgroundColor: "#f3f4f6", padding: "4px 8px", borderRadius: 8, fontWeight: 600 }}>
                      {property.size} {property.sizeUnit}
                    </span>
                    {property.category === "Apartment Sale" && property.bedrooms > 0 && (
                      <span style={{ fontSize: 12, color: "#374151", backgroundColor: "#f3f4f6", padding: "4px 8px", borderRadius: 8, fontWeight: 600 }}>
                        {property.bedrooms} BHK
                      </span>
                    )}
                    {property.ownershipType && (
                      <span style={{ fontSize: 12, color: "#374151", backgroundColor: "#f3f4f6", padding: "4px 8px", borderRadius: 8, fontWeight: 600 }}>
                        {property.ownershipType}
                      </span>
                    )}
                  </div>

                  {property.description && (
                    <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.55, margin: "0 0 12px" }}>
                      {property.description}
                    </p>
                  )}

                  {property.features?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                      {property.features.slice(0, 5).map(feature => (
                        <span key={feature} style={{
                          fontSize: 11,
                          color: "#166534",
                          backgroundColor: "#dcfce7",
                          padding: "3px 8px",
                          borderRadius: 999,
                          fontWeight: 600
                        }}>
                          <FiCheck size={10} style={{ marginRight: 2 }} />{feature}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div>
                      <strong style={{ fontSize: 22, color: "#15803d", fontWeight: 900 }}>
                        {formatPropertyPrice(property.price)}
                      </strong>
                    </div>
                    <button
                      onClick={() => handleWhatsAppEnquiry(property)}
                      disabled={property.status === "Sold"}
                      style={{
                        padding: "9px 14px",
                        borderRadius: 10,
                        border: "none",
                        backgroundColor: property.status === "Sold" ? "#d1d5db" : "#25d366",
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: property.status === "Sold" ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <FiMessageCircle size={14} /> Enquire
                    </button>
                  </div>

                  {property.googleMapLink && (
                    <a href={property.googleMapLink} target="_blank" rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#15803d", fontSize: 13, fontWeight: 700, marginTop: 12, textDecoration: "none" }}>
                      <FiMap /> View location
                    </a>
                  )}

                  {canManage && (
                    <div style={{ display: "flex", gap: 8, marginTop: 12, borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
                      <select value={property.status || "Available"} onChange={(e) => handleStatusChange(property.id, e.target.value)}
                        style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, fontWeight: 700 }}>
                        {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <button onClick={() => handleDeleteProperty(property.id, property.title)}
                        style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #fee2e2", backgroundColor: "#fff", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredProperties.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "1px solid #f3f4f6" }}>
          <FiHome size={42} color="#16a34a" style={{ marginBottom: 14 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>No property sale listings yet</h2>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            Add land or apartment sale listings after logging in.
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------
   Footer
------------------------------ */
function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerContainer} className="footer-grid-responsive">
        <div style={styles.footerColumn}>
          <div style={styles.logoContainer}>
            <BrandLogo />
          </div>
          <p style={{ color: '#9ca3af', lineHeight: 1.6, fontSize: 14 }}>
            Your trusted platform for authentic homestay experiences in Guwahati, Shillong, and Goa.
          </p>
        </div>

        <div style={styles.footerColumn}>
          <h4 style={styles.footerTitle}>Quick Links</h4>
          <Link to="/" style={styles.footerLink} className="footer-link-hover"><FiHome /> Home</Link>
          <Link to="/about" style={styles.footerLink} className="footer-link-hover"><FiInfo /> About Us</Link>
          <Link to="/contact" style={styles.footerLink} className="footer-link-hover"><FiPhone /> Contact</Link>
          <Link to="/premium" style={styles.footerLink} className="footer-link-hover"><FiStar /> Premium</Link>
          <Link to="/india-travel" style={styles.footerLink} className="footer-link-hover"><FiMap /> India Travel</Link>
          <Link to="/pool-homestays" style={styles.footerLink} className="footer-link-hover"><FiDroplet /> Pool Homestays</Link>
          <Link to="/travel-guides" style={styles.footerLink} className="footer-link-hover"><FiSearch /> Guides</Link>
          <Link to="/bike-rental" style={styles.footerLink} className="footer-link-hover"><FiNavigation /> Bike Rental</Link>
          <Link to="/car-rental" style={styles.footerLink} className="footer-link-hover"><FiNavigation /> Car Rental</Link>
          <Link to="/property-sale" style={styles.footerLink} className="footer-link-hover"><FiHome /> Property Sale</Link>
          <Link to="/add-homestay" style={styles.footerLink} className="footer-link-hover"><FiHome /> List Your Homestay</Link>
        </div>

        <div style={styles.footerColumn}>
          <h4 style={styles.footerTitle}>Contact Us</h4>
          <a href={`mailto:${CONTACT_EMAIL}`} style={styles.footerLink} className="footer-link-hover"><FiMail /> {CONTACT_EMAIL}</a>
          <a href="tel:+918638572663" style={styles.footerLink} className="footer-link-hover"><FiPhone /> +91 8638572663</a>
        </div>
      </div>

      <div style={styles.copyright}>
        © {new Date().getFullYear()} Homavia. All rights reserved.
      </div>
    </footer>
  );
}

/* ------------------------------
   Mobile App
------------------------------ */
function MobileApp() {
  const [homestays, setHomestays] = useState(PUBLIC_GOOGLE_HOMESTAYS);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const isDesktop = useIsDesktop(1024);

  // PWA Install Prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  useEffect(() => {
    // Set a timeout to hide loader if data takes too long
    const loaderTimeout = setTimeout(() => {
      setInitialLoading(false);
    }, 5000); // 5 seconds max

    const unsubscribe = onSnapshot(
      collection(db, "homestays"),
      (snapshot) => {
        clearTimeout(loaderTimeout);
        setHomestays(normalizeHomestaySnapshot(snapshot));
        setInitialLoading(false);
      },
      (error) => {
        clearTimeout(loaderTimeout);
        console.error("Error fetching homestays:", error);
        setHomestays(PUBLIC_GOOGLE_HOMESTAYS);
        setInitialLoading(false);
      }
    );

    const authUnsubscribe = auth.onAuthStateChanged(setUser);

    return () => {
      clearTimeout(loaderTimeout);
      unsubscribe();
      authUnsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <Router>
      <WebsiteTrafficTracker />
      <div style={styles.container}>
        <header style={styles.header}>
          <Link to="/" style={styles.logoContainer} onClick={closeMobileMenu}>
            <BrandLogo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" style={isDesktop ? styles.desktopNav : { display: 'none' }}>
            <Link to="/" style={styles.desktopNavLink}>Home</Link>
            <Link to="/about" style={styles.desktopNavLink}>About Us</Link>
            <Link to="/contact" style={styles.desktopNavLink}>Contact</Link>
            <Link to="/premium" style={styles.desktopNavLink}>Premium</Link>
            <Link to="/india-travel" style={styles.desktopNavLink}>India Travel</Link>
            <Link to="/pool-homestays" style={styles.desktopNavLink}>Pool Stays</Link>
            <Link to="/travel-guides" style={styles.desktopNavLink}>Guides</Link>
            <Link to="/bike-rental" style={styles.desktopNavLink}>Bike Rental</Link>
            <Link to="/car-rental" style={styles.desktopNavLink}>Car Rental</Link>
            <Link to="/property-sale" style={styles.desktopNavLink}>Property Sale</Link>
            {user && <Link to="/my-listings" style={styles.desktopNavLink}>My Listings</Link>}
            {user && isAdminUser(user) && <Link to="/admin" style={styles.desktopNavLink}>Admin</Link>}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 12 }}>
              {showInstallButton && (
                <button 
                  onClick={handleInstallClick}
                  style={{
                    ...styles.authButton,
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  📥 Install App
                </button>
              )}
              {user ? (
                <>
                  <Link 
                    to="/add-homestay" 
                    style={{ ...styles.authButton, ...styles.btnPrimary }}
                  >
                    Add Homestay
                  </Link>
                  <button 
                    style={styles.authButton} 
                    onClick={handleLogout}
                  >
                    <FiUser /> Logout
                  </button>
                </>
              ) : (
                <button 
                  style={styles.authButton} 
                  onClick={handleLogin}
                >
                  <FiUser /> Login
                </button>
              )}
            </div>
          </nav>

          {/* Mobile Hamburger */}
          <button
            className="hamburger-button"
            aria-label="Open navigation menu"
            style={{
              ...styles.hamburgerButton,
              display: isDesktop ? 'none' : 'block'
            }}
            onClick={toggleMobileMenu}
          >
            <FiMenu />
          </button>
        </header>

        {/* Mobile Overlay */}
        <div 
          className="overlay"
          style={{
            ...styles.overlay,
            ...(mobileMenuOpen ? styles.overlayVisible : {})
          }}
          onClick={closeMobileMenu}
        />

        {/* Mobile Menu */}
        <div 
          className="mobile-menu"
          style={{
            ...styles.mobileMenu,
            ...(mobileMenuOpen ? styles.mobileMenuOpen : {})
          }}
        >
          <button style={styles.closeButton} onClick={closeMobileMenu} aria-label="Close navigation menu">
            <FiX />
          </button>

          <div style={styles.mobileNav}>
            <Link to="/" style={styles.navLink} onClick={closeMobileMenu}>Home</Link>
            <Link to="/about" style={styles.navLink} onClick={closeMobileMenu}>About Us</Link>
            <Link to="/contact" style={styles.navLink} onClick={closeMobileMenu}>Contact</Link>
            <Link to="/premium" style={styles.navLink} onClick={closeMobileMenu}>Premium</Link>
            <Link to="/india-travel" style={styles.navLink} onClick={closeMobileMenu}>India Travel</Link>
            <Link to="/pool-homestays" style={styles.navLink} onClick={closeMobileMenu}>Pool Stays</Link>
            <Link to="/travel-guides" style={styles.navLink} onClick={closeMobileMenu}>Guides</Link>
            <Link to="/bike-rental" style={styles.navLink} onClick={closeMobileMenu}>Bike Rental</Link>
            <Link to="/car-rental" style={styles.navLink} onClick={closeMobileMenu}>Car Rental</Link>
            <Link to="/property-sale" style={styles.navLink} onClick={closeMobileMenu}>Property Sale</Link>
            {user && (
              <Link to="/my-listings" style={styles.navLink} onClick={closeMobileMenu}>
                My Listings
              </Link>
            )}
            {user && isAdminUser(user) && (
              <Link to="/admin" style={styles.navLink} onClick={closeMobileMenu}>Admin</Link>
            )}
          </div>

          <div style={{ marginTop: 30 }}>
            {user ? (
              <>
                <Link 
                  to="/add-homestay" 
                  style={{ ...styles.authButton, ...styles.btnPrimary, display: 'block', textAlign: 'center', marginBottom: 15 }}
                  onClick={closeMobileMenu}
                >
                  Add Homestay
                </Link>
                <button 
                  style={{ ...styles.authButton, width: '100%' }} 
                  onClick={() => { handleLogout(); closeMobileMenu(); }}
                >
                  <FiUser /> Logout
                </button>
              </>
            ) : (
              <button 
                style={{ ...styles.authButton, width: '100%' }} 
                onClick={() => { handleLogin(); closeMobileMenu(); }}
              >
                <FiUser /> Login
              </button>
            )}
          </div>
        </div>

        <main style={{ flex: 1 }}>
          <div className="main-content page-fade-in" style={styles.mainContent}>
            <Routes>
              <Route path="/" element={<HomestayListing homestays={homestays} loading={initialLoading} />} />
              <Route path="/add-homestay" element={<AddHomestayForm />} />
              <Route path="/edit-homestay/:id" element={<EditHomestayForm />} />
            <Route path="/my-listings" element={<MyListings />} />
            <Route path="/homestays/:slug" element={<HomestayDetail />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/premium" element={<PremiumPage />} />
            <Route path="/india-travel" element={<IndiaTravelPage />} />
            <Route path="/pool-homestays" element={<PoolHomestaysPage />} />
            <Route path="/travel-guides" element={<TravelGuidesPage />} />
            <Route path="/travel-guides/:slug" element={<TravelGuideDetail />} />
            <Route path="/bike-rental" element={<BikeRentalPage />} />
            <Route path="/car-rental" element={<CarRentalPage />} />
            <Route path="/property-sale" element={<PropertySalePage />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin user={user}>
                  <AdminTools />
                </RequireAdmin>
              }
            />
          </Routes>
          </div>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

/* ------------------------------
   Main App
------------------------------ */
function App() {
  return <MobileApp />;
}

export default App;
