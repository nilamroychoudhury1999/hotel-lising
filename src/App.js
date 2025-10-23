import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, onSnapshot, doc, getDoc,
  getDocs, query, where, writeBatch
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import {
  FiUser, FiMapPin, FiHome, FiStar, FiWifi, FiTv, FiCoffee, FiDroplet,
  FiSearch, FiMail, FiPhone, FiInfo, FiCheck, FiMenu, FiX, FiSmartphone, FiUpload
} from "react-icons/fi";
import { Helmet } from "react-helmet";
import logo from "./IMG-20250818-WA0009.jpg";
import COMMON_IMAGE_URL from "./prairie-haven-51f728.jpg";

/* -------------------- CONFIG -------------------- */

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQJ3dX_ZcxVKzlCD8H19JM3KYh7qf8wYk",
  authDomain: "form-ca7cc.firebaseapp.com",
  projectId: "form-ca7cc",
  storageBucket: "form-ca7cc.appspot.com",
  messagingSenderId: "1054208318782",
  appId: "1:1054208318782:web:f64f43412902afcd7aa06f",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset_1";
const CLOUDINARY_CLOUD_NAME = "dyrmi2zkl";

// SEO constants
const SITE_NAME = "Homavia";
const SITE_URL = "https://homavia.in";
const DEFAULT_DESCRIPTION =
  "Discover authentic homestay experiences across Guwahati, Shillong, and Goa. Book verified, comfortable homestays with Homavia.";
// ✅ Your common/local splash image for all defaults (place this file in /public)
const DEFAULT_CONTACT = "+91 7002863681";

// Complete list of areas for all cities
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
    "Sarusajai", "Bora Service", "Gotanagar", "Nabin Nagar","Kharguli","Maligaon"
  ],
  Shillong: [
    "Police Bazaar", "Laitumkhrah", "Nongthymmai", "Dhankheti",
    "Mawkhar", "Laban", "Rynjah", "Malki", "Nongrim Hills",
    "Jail Road", "Happy Valley", "Umpling", "Mawprem", "Pynthorumkhrah",
    "Nongkseh", "Lawmali", "Risa Colony", "Cleve Colony", "Oakland",
    "Quinton Road", "Ward's Lake Area", "Golf Links", "Barapani", "Umiam"
  ],
  Goa: [
    "North Goa", "South Goa", "Panaji", "Mapusa", "Margao", "Vasco da Gama",
    "Calangute", "Baga", "Anjuna", "Vagator", "Candolim", "Sinquerim", "Arambol",
    "Morjim", "Ashwem", "Mandrem", "Colva", "Benaulim", "Varca", "Cavelossim",
    "Mobor", "Palolem", "Agonda", "Patnem", "Fontainhas", "Dona Paula", "Miramar",
    "Old Goa", "Ponda", "Quepem", "Sanguem"
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
  { id: "security", name: "24/7 Security" },
];

const ROOM_TYPES = ["Entire Home", "Private Room", "Shared Room", "Studio", "Villa"];

/* -------------------- UTILS (SEO + Slugs) -------------------- */

const slugify = (str = "") =>
  str
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const regionForCity = (city) => {
  if (!city) return "";
  if (city.toLowerCase() === "goa") return "Goa";
  if (city.toLowerCase() === "guwahati") return "Assam";
  if (city.toLowerCase() === "shillong") return "Meghalaya";
  return "";
};

const buildHomestayPath = (h) => {
  const citySlug = slugify(h.city || "city");
  const areaSlug = slugify(h.area || "area");
  const nameSlug = slugify(h.name || "homestay");
  const idFrag = (h.id || "").toString();
  return `/homestays/${citySlug}/${areaSlug}/${nameSlug}-${idFrag}`;
};

const absoluteUrl = (path) => {
  const base = SITE_URL.endsWith("/") ? SITE_URL.slice(0, -1) : SITE_URL;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

/* -------------------- STYLES -------------------- */

const styles = {
  container: { maxWidth: "100%", margin: "0 auto", padding: "0 16px", fontFamily: "'Inter', sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#fff" },
  desktopWarning: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px", textAlign: "center", backgroundColor: "#f8f9fa" },
  warningIcon: { fontSize: 64, color: "#ff385c", marginBottom: 20 },
  warningTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 16, color: "#333" },
  warningText: { fontSize: 16, color: "#666", lineHeight: 1.6, maxWidth: 400, marginBottom: 24 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid #ebebeb", marginBottom: 24, position: "relative" },
  logoContainer: { display: "flex", alignItems: "center", gap: 8, color: "#ff385c", fontWeight: "bold", fontSize: 20, textDecoration: "none" },
  logo: { height: 32, borderRadius: 6 },
  navLinks: { display: "flex", flexDirection: "column", gap: 16 },
  navLink: { color: "#333", textDecoration: "none", fontWeight: 500, fontSize: 16, transition: "color 0.2s" },
  authButton: { display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 30, border: "1px solid #ddd", backgroundColor: "white", cursor: "pointer", fontWeight: 500, fontSize: 14 },
  btnPrimary: { backgroundColor: "#ff385c", color: "white", border: "none" },
  homestayList: { display: "grid", gridTemplateColumns: "1fr", gap: 20, padding: 0, listStyle: "none" },
  homestayItem: { borderRadius: 12, overflow: "hidden", transition: "transform 0.2s", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
  homestayImage: { width: "100%", height: 200, objectFit: "cover", borderRadius: 12, marginBottom: 10 },
  homestayInfo: { display: "flex", flexDirection: "column", gap: 5, padding: "0 10px 15px" },
  price: { fontWeight: "bold", fontSize: 18 },
  title: { fontWeight: 500, fontSize: 16 },
  location: { color: "#717171", fontSize: 14, display: "flex", alignItems: "center", gap: 5 },
  rating: { display: "flex", alignItems: "center", gap: 5, fontSize: 14 },
  filterContainer: { display: "flex", gap: 12, marginBottom: 20, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" },
  filterButton: { padding: "8px 12px", borderRadius: 30, border: "1px solid #ddd", backgroundColor: "white", cursor: "pointer", whiteSpace: "nowrap", fontSize: 14, fontWeight: 500 },
  activeFilter: { backgroundColor: "#000", color: "white", borderColor: "#000" },
  locationDropdown: { padding: "12px 15px", borderRadius: 8, border: "1px solid #ddd", fontSize: 16, width: "100%", marginBottom: 16, backgroundColor: "white", cursor: "pointer" },
  formContainer: { maxWidth: "100%", margin: "0 auto", padding: "20px 0", width: "100%" },
  formTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 24 },
  formSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  inputGroup: { marginBottom: 16 },
  label: { display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 },
  input: { width: "100%", padding: "12px 15px", borderRadius: 8, border: "1px solid #ddd", fontSize: 16, boxSizing: "border-box" },
  textarea: { width: "100%", padding: "12px 15px", borderRadius: 8, border: "1px solid #ddd", fontSize: 16, minHeight: 100, resize: "vertical", boxSizing: "border-box" },
  checkboxGroup: { display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 12 },
  checkboxItem: { display: "flex", alignItems: "center", gap: 8 },
  imagePreview: { width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 12, marginTop: 15 },
  submitButton: { backgroundColor: "#ff385c", color: "white", border: "none", padding: "12px 20px", borderRadius: 8, fontSize: 16, fontWeight: "bold", cursor: "pointer", marginTop: 20, transition: "background-color 0.2s", width: "100%" },
  detailContainer: { maxWidth: "100%", margin: "0 auto", padding: "20px 0", width: "100%" },
  detailHeader: { marginBottom: 24 },
  detailTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  detailLocation: { display: "flex", alignItems: "center", gap: 5, color: "#717171", fontSize: 14, marginBottom: 16 },
  detailImage: { width: "100%", borderRadius: 12, marginBottom: 24, maxHeight: 400, objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
  detailInfo: { display: "flex", flexDirection: "column", gap: 30, marginTop: 30 },
  detailAmenities: { display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 20 },
  amenityItem: { display: "flex", alignItems: "center", gap: 10 },
  bookingCard: { border: "1px solid #ddd", borderRadius: 12, padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", order: -1 },
  priceDetail: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  bookButton: { width: "100%", padding: 12, backgroundColor: "#ff385c", color: "white", border: "none", borderRadius: 8, fontSize: 16, fontWeight: "bold", cursor: "pointer", transition: "background-color 0.2s" },
  callButton: { width: "100%", padding: 12, backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: 8, fontSize: 16, fontWeight: "bold", cursor: "pointer", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "background-color 0.2s" },
  searchContainer: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 },
  searchInput: { flex: 1, padding: "12px 15px", borderRadius: 30, border: "1px solid #ddd", fontSize: 16, width: "100%", boxSizing: "border-box" },
  searchButton: { padding: "12px 20px", borderRadius: 30, border: "none", backgroundColor: "#ff385c", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, whiteSpace: "nowrap" },
  premiumBadge: { backgroundColor: "#ffd700", color: "#333", padding: "3px 8px", borderRadius: 4, fontSize: 12, fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 8 },
  pageContainer: { maxWidth: "100%", margin: "0 auto", padding: "32px 16px", width: "100%" },
  pageTitle: { fontSize: 28, fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  pageContent: { lineHeight: 1.8, fontSize: 16, maxWidth: "100%", margin: "0 auto" },
  footer: { backgroundColor: "#f8f9fa", padding: "32px 0", marginTop: "auto", borderTop: "1px solid #ebebeb" },
  footerContainer: { maxWidth: "100%", margin: "0 auto", padding: "0 16px", display: "grid", gridTemplateColumns: "1fr", gap: 32 },
  footerColumn: { display: "flex", flexDirection: "column", gap: 12 },
  footerTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  footerLink: { color: "#666", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, fontSize: 14 },
  copyright: { textAlign: "center", paddingTop: 24, color: "#666", borderTop: "1px solid #ebebeb", marginTop: 24, fontSize: 14 },
  premiumBanner: { backgroundColor: "#fff8e1", border: "1px solid #ffd54f", borderRadius: 8, padding: 12, marginTop: 16, display: "flex", alignItems: "flex-start", gap: 10 },
  hamburgerButton: { display: "block", backgroundColor: "transparent", border: "none", fontSize: 24, cursor: "pointer", padding: 8 },
  mobileMenu: { position: "fixed", top: 0, right: 0, width: "80%", height: "100vh", backgroundColor: "white", zIndex: 1000, padding: 20, boxShadow: "-2px 0 10px rgba(0,0,0,0.1)", transform: "translateX(100%)", transition: "transform 0.3s ease-in-out", overflowY: "auto" },
  mobileMenuOpen: { transform: "translateX(0)" },
  closeButton: { backgroundColor: "transparent", border: "none", fontSize: 24, cursor: "pointer", position: "absolute", top: 16, right: 16, padding: 8 },
  mobileNav: { display: "flex", flexDirection: "column", gap: 20, marginTop: 40 },
  overlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 999, display: "none" },
  overlayVisible: { display: "block" },
  cityDropdown: { padding: "12px 15px", borderRadius: 8, border: "1px solid #ddd", fontSize: 16, width: "100%", marginBottom: 12, backgroundColor: "white", cursor: "pointer", boxSizing: "border-box" },
  formGrid: { display: "flex", flexDirection: "column", gap: 16 },
  filterGrid: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }
};

/* -------------------- RESPONSIVE GUARD -------------------- */

const isMobileDevice = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

function DesktopWarning() {
  return (
    <div style={styles.desktopWarning}>
      <FiSmartphone style={styles.warningIcon} />
      <h1 style={styles.warningTitle}>Mobile App Only</h1>
      <p style={styles.warningText}>
        This application is designed specifically for mobile devices.
        Please open this app on your smartphone or tablet for the best experience.
      </p>
      <div style={{
        backgroundColor: "#fff", padding: 20, borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxWidth: 400, width: "100%"
      }}>
        <h3 style={{ marginBottom: 10, color: "#333" }}>How to access:</h3>
        <ul style={{ textAlign: "left", color: "#666", lineHeight: 1.8, paddingLeft: 20 }}>
          <li>Open this link on your mobile device</li>
          <li>Scan the QR code if available</li>
          <li>Use your smartphone's browser</li>
        </ul>
      </div>
    </div>
  );
}

/* -------------------- LISTING -------------------- */

function HomestayListing({ homestays }) {
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedArea, setSelectedArea] = useState("All");
  const [coupleFriendlyOnly, setCoupleFriendlyOnly] = useState(false);
  const [hourlyOnly, setHourlyOnly] = useState(false);
  const [roomType, setRoomType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHomestays = homestays.filter((h) => {
    const matchesCity = selectedCity === "All" || h.city === selectedCity;
    const matchesArea = selectedArea === "All" || h.area === selectedArea;
    const matchesCoupleFriendly = !coupleFriendlyOnly || h.coupleFriendly;
    const matchesHourly = !hourlyOnly || h.hourly;
    const matchesRoomType = roomType === "All" || h.roomType === roomType;
    const matchesSearch =
      searchQuery === "" ||
      (h.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.area || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesArea && matchesCoupleFriendly && matchesHourly && matchesRoomType && matchesSearch;
  });

  const availableAreas = selectedCity === "All" ? [] : AREAS_BY_CITY[selectedCity] || [];

  const listingTitle = selectedCity === "All"
    ? "Find Homestays - Homavia"
    : `Homestays in ${selectedCity} — Homavia`;

  const listingDesc = selectedCity === "All"
    ? DEFAULT_DESCRIPTION
    : `Browse verified homestays in ${selectedCity} with amenities, prices, photos, and contact details.`;

  const canonical = absoluteUrl(
    selectedCity === "All" ? "/"
    : `/homestays/${slugify(selectedCity)}`
  );

  // JSON-LD (ItemList)
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": filteredHomestays.slice(0, 20).map((h, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "url": absoluteUrl(buildHomestayPath(h))
    }))
  };

  return (
    <div>
      <Helmet>
        <title>{listingTitle}</title>
        <meta name="description" content={listingDesc} />
        <link rel="canonical" href={canonical} />
        {/* Open Graph */}
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={listingTitle} />
        <meta property="og:description" content={listingDesc} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={COMMON_IMAGE_URL} />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={listingTitle} />
        <meta name="twitter:description" content={listingDesc} />
        <meta name="twitter:image" content={COMMON_IMAGE_URL} />
        <script type="application/ld+json">{JSON.stringify(itemListLd)}</script>
      </Helmet>

      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search homestays by name, location..."
          style={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search homestays"
        />
        <button style={styles.searchButton} aria-label="Search">
          <FiSearch /> Search
        </button>
      </div>

      <div style={styles.filterGrid}>
        <div>
          <label style={styles.label}>Select City</label>
          <select
            style={styles.cityDropdown}
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setSelectedArea("All");
            }}
            aria-label="Select city"
          >
            <option value="All">All Cities</option>
            {ALL_CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={styles.label}>Select Area</label>
          <select
            style={styles.locationDropdown}
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            disabled={selectedCity === "All"}
            aria-label="Select area"
          >
            <option value="All">
              {selectedCity === "All" ? "Select a city first" : `All Areas in ${selectedCity}`}
            </option>
            {availableAreas.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.filterContainer}>
        <button
          style={{
            ...styles.filterButton,
            ...(coupleFriendlyOnly ? styles.activeFilter : {}),
          }}
          onClick={() => setCoupleFriendlyOnly(!coupleFriendlyOnly)}
        >
          Couple Friendly
        </button>

        <button
          style={{
            ...styles.filterButton,
            ...(hourlyOnly ? styles.activeFilter : {}),
          }}
          onClick={() => setHourlyOnly(!hourlyOnly)}
        >
          Hourly Stays
        </button>

        <select
          style={styles.filterButton}
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          aria-label="Filter by room type"
        >
          <option value="All">All Types</option>
          {ROOM_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {filteredHomestays.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <h3>No homestays found matching your criteria</h3>
          <p>Try adjusting your filters or search query</p>
        </div>
      ) : (
        <ul style={styles.homestayList}>
          {filteredHomestays.map((h) => {
            const to = buildHomestayPath(h);
            const img =  COMMON_IMAGE_URL;
            return (
              <li key={h.id} style={styles.homestayItem}>
                <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ position: "relative" }}>
                    <img src={img} alt={h.name} style={styles.homestayImage} loading="lazy" />
                    {h.premium && (
                      <div style={{
                        position: "absolute", top: 10, left: 10, backgroundColor: "#ffd700",
                        color: "#333", padding: "3px 8px", borderRadius: 4, fontSize: 10,
                        fontWeight: "bold", display: "flex", alignItems: "center", gap: 3
                      }}>
                        <FiStar fill="#333" /> PREMIUM
                      </div>
                    )}
                  </div>
                  <div style={styles.homestayInfo}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h3 style={styles.title}>{h.name}</h3>
                      <div style={styles.rating}>
                        <FiStar fill="#ff385c" color="#ff385c" />
                        {h.rating || "New"}
                      </div>
                    </div>
                    <p style={styles.location}>
                      <FiMapPin /> {h.area}, {h.city}
                    </p>
                    <p style={styles.price}>₹{h.price} / night</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                      {h.coupleFriendly && (
                        <span style={{
                          backgroundColor: "#e8f5e8", color: "#2e7d32",
                          padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 500
                        }}>
                          Couple Friendly
                        </span>
                      )}
                      {h.hourly && (
                        <span style={{
                          backgroundColor: "#e3f2fd", color: "#1565c0",
                          padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 500
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

/* -------------------- ADD HOMESTAY -------------------- */

function AddHomestayForm() {
  const [form, setForm] = useState({
    name: "", description: "", price: "", city: "", area: "", contact: DEFAULT_CONTACT,
    roomType: "", maxGuests: 2, coupleFriendly: false, hourly: false, petsAllowed: false,
    smokingAllowed: false, amenities: [], premium: false, imagePreview: null
  });
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return unsubscribe;
  }, []);

  const handleAmenityChange = (amenityId) => {
    const updated = form.amenities.includes(amenityId)
      ? form.amenities.filter((id) => id !== amenityId)
      : [...form.amenities, amenityId];
    setForm({ ...form, amenities: updated });
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    setForm({ ...form, city, area: "" });
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
    reader.onloadend = () => setForm((prev) => ({ ...prev, imagePreview: reader.result }));
    reader.readAsDataURL(file);
  };

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
    if (!user || imageError) return;

    setLoading(true);
    try {
      const imageUrl = (await uploadImage()) || COMMON_IMAGE_URL;

      await addDoc(collection(db, "homestays"), {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        city: form.city,
        area: form.area,
        contact: form.contact || DEFAULT_CONTACT,
        roomType: form.roomType,
        maxGuests: Number(form.maxGuests),
        coupleFriendly: form.coupleFriendly,
        hourly: form.hourly,
        petsAllowed: form.petsAllowed,
        smokingAllowed: form.smokingAllowed,
        amenities: form.amenities,
        premium: form.premium,
        imageUrl,
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: new Date().toISOString(),
        rating: Math.floor(Math.random() * 2) + 4,
      });

      setForm({
        name: "", description: "", price: "", city: "", area: "", contact: DEFAULT_CONTACT,
        roomType: "", maxGuests: 2, coupleFriendly: false, hourly: false,
        petsAllowed: false, smokingAllowed: false, amenities: [], premium: false, imagePreview: null
      });
      setImageFile(null);
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
      <Helmet>
        <title>List Your Homestay — {SITE_NAME}</title>
        <meta name="description" content="List your homestay on Homavia and connect with travelers searching for authentic stays." />
        <link rel="canonical" href={absoluteUrl("/add-homestay")} />
        <meta property="og:title" content={`List Your Homestay — ${SITE_NAME}`} />
        <meta property="og:description" content="Add your property, set your price, and reach verified guests on Homavia." />
        <meta property="og:image" content={COMMON_IMAGE_URL} />
      </Helmet>

      <h1 style={styles.formTitle}>List your homestay</h1>

      <div style={styles.premiumBanner}>
        <FiStar size={20} color="#ffd700" />
        <div>
          <p style={{ fontWeight: "bold", marginBottom: 5, fontSize: 14 }}>Premium Listing Available</p>
          <p style={{ fontSize: 12 }}>Get more views with our Premium feature.</p>
        </div>
      </div>

      <div style={styles.formSection}>
        <h2 style={styles.sectionTitle}>Basic Information</h2>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Homestay Name *</label>
          <input
            style={styles.input}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            aria-label="Homestay name"
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
            aria-label="Description"
          />
        </div>

        <div style={styles.formGrid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Price (₹ per night) *</label>
            <input
              style={styles.input}
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
              aria-label="Price per night"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>City *</label>
            <select
              style={styles.input}
              value={form.city}
              onChange={handleCityChange}
              required
              aria-label="City"
            >
              <option value="">Select City</option>
              {ALL_CITIES.map((city) => (
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
              aria-label="Area"
            >
              <option value="">Select Area</option>
              {availableAreas.map((area) => (
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
              aria-label="Room type"
            >
              <option value="">Select Room Type</option>
              {ROOM_TYPES.map((type) => (
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
              aria-label="Phone number"
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
              aria-label="Maximum guests"
            />
          </div>
        </div>
      </div>

      <div style={styles.formSection}>
        <h2 style={styles.sectionTitle}>Photos</h2>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Main Photo *</label>
          <input
            style={styles.input}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imageError && <p style={{ color: "red", marginTop: 5, fontSize: 12 }}>{imageError}</p>}
          {form.imagePreview && (
            <img src={form.imagePreview} alt="Preview" style={styles.imagePreview} />
          )}
          {!form.imagePreview && (
            <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              No upload? We’ll use a default, SEO-optimized home image.
            </p>
          )}
        </div>
      </div>

      <div style={styles.formSection}>
        <h2 style={styles.sectionTitle}>Amenities</h2>
        <div style={styles.checkboxGroup}>
          {AMENITIES.map((amenity) => (
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

      <button
        style={styles.submitButton}
        onClick={handleSubmit}
        disabled={loading || !user || imageError}
      >
        {loading ? "Submitting..." : "List Your Homestay"}
      </button>
    </div>
  );
}

/* -------------------- HOMESTAY DETAIL -------------------- */

function HomestayDetail() {
  // Route: /homestays/:citySlug/:areaSlug/:slug  where slug = `${nameSlug}-${id}`
  const { slug } = useParams();
  const [homestay, setHomestay] = useState(null);
  const navigate = useNavigate();

  // Extract the ID from the tail of the slug
  const idFromSlug = React.useMemo(() => {
    if (!slug) return "";
    const parts = slug.split("-");
    return parts[parts.length - 1];
  }, [slug]);

  useEffect(() => {
    const fetchHomestay = async () => {
      if (!idFromSlug) { navigate("/"); return; }
      const ref = doc(db, "homestays", idFromSlug);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setHomestay({ id: snap.id, ...snap.data() });
      } else {
        navigate("/");
      }
    };
    fetchHomestay();
  }, [idFromSlug, navigate]);

  if (!homestay) return <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>;

  const selectedAmenities = AMENITIES.filter((a) => homestay.amenities?.includes(a.id));
  const img = COMMON_IMAGE_URL;

  // SEO meta for detail
  const title = `${homestay.name} — ${homestay.area}, ${homestay.city} | ${SITE_NAME}`;
  const description =
    `${homestay.name} in ${homestay.area}, ${homestay.city}. ` +
    `Book this ${homestay.roomType || "room"} from ₹${homestay.price}/night. ` +
    `Amenities: ${(homestay.amenities || []).join(", ")}.`;

  const path = buildHomestayPath(homestay);
  const canonical = absoluteUrl(path);

  // JSON-LD for LodgingBusiness
  const lodgingLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": homestay.name,
    "image": [img],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": homestay.city,
      "addressRegion": regionForCity(homestay.city),
      "streetAddress": homestay.area
    },
    "priceRange": `₹${homestay.price} per night`,
    "telephone": DEFAULT_CONTACT,
    "url": canonical,
    "amenityFeature": (homestay.amenities || []).map(a => ({
      "@type": "LocationFeatureSpecification",
      "name": a,
      "value": true
    })),
    "starRating": {
      "@type": "Rating",
      "ratingValue": homestay.rating || 4.5,
      "bestRating": 5
    }
  };

  return (
    <div style={styles.detailContainer}>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description.slice(0, 155)} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description.slice(0, 200)} />
        <meta property="og:image" content={img} />
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description.slice(0, 200)} />
        <meta name="twitter:image" content={img} />
        <script type="application/ld+json">{JSON.stringify(lodgingLd)}</script>
      </Helmet>

      <div style={styles.detailHeader}>
        <h1 style={styles.detailTitle}>
          {homestay.name}
          {homestay.premium && <span style={styles.premiumBadge}><FiStar /> PREMIUM</span>}
        </h1>
        <div style={styles.detailLocation}>
          <FiMapPin /> {homestay.area}, {homestay.city} • {homestay.roomType || "Private Room"}
        </div>
        <div style={styles.rating}>
          <FiStar fill="#ff385c" color="#ff385c" /> {homestay.rating || "New"}
        </div>
      </div>

      <img src={img} alt={homestay.name} style={styles.detailImage} />

      <div style={styles.detailInfo}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 15 }}>About this place</h2>
          <p style={{ lineHeight: 1.6, marginBottom: 25 }}>{homestay.description || "No description provided."}</p>

          <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 15 }}>Amenities</h2>
          <div style={styles.detailAmenities}>
            {selectedAmenities.length > 0 ? (
              selectedAmenities.map((amenity) => (
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

        <div style={styles.bookingCard}>
          <div style={styles.priceDetail}>
            ₹{homestay.price} <span style={{ fontWeight: "normal" }}>/ night</span>
          </div>

          {homestay.premium && (
            <div style={{ backgroundColor: "#fff8e1", padding: 12, borderRadius: 8, marginBottom: 15 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <FiCheck color="#4CAF50" size={16} />
                <span style={{ fontWeight: "bold", fontSize: 14 }}>Premium Verified</span>
              </div>
              <p style={{ fontSize: 12 }}>This host has been verified and offers premium amenities.</p>
            </div>
          )}

          <button style={styles.bookButton}>Book Now</button>

          <a href={`tel:${DEFAULT_CONTACT.replace(/\s+/g, "")}`} style={styles.callButton}>
            <FiPhone /> Call Host
          </a>

          <div style={{ marginTop: 15, paddingTop: 15, borderTop: "1px solid #ebebeb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <FiUser size={16} />
              <span style={{ fontWeight: "500" }}>Hosted by {homestay.createdByName || "Owner"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- STATIC PAGES -------------------- */

function AboutPage() {
  return (
    <div style={styles.pageContainer}>
      <Helmet>
        <title>About {SITE_NAME}</title>
        <meta name="description" content="Learn about Homavia — a platform dedicated to authentic homestay experiences in Northeast India and Goa." />
        <link rel="canonical" href={absoluteUrl("/about")} />
        <meta property="og:image" content={COMMON_IMAGE_URL} />
      </Helmet>

      <h1 style={styles.pageTitle}>About Homavia</h1>

      <div style={styles.pageContent}>
        <p>
          Founded in 2023, Homavia is dedicated to transforming how travelers experience Northeast India and Goa.
          We connect guests with unique, authentic homestays that offer more than just a place to sleep —
          they offer a true local hospitality experience.
        </p>

        <p>
          Our mission is to empower local homeowners while providing travelers with memorable stays that
          showcase the rich culture and warm hospitality of each region.
        </p>

        <h2 style={{ fontSize: 20, fontWeight: "bold", marginTop: 30, marginBottom: 15 }}>Our Destinations</h2>

        <div style={styles.featureList}>
          <div style={styles.featureCard}>
            <div style={{ fontSize: 32, color: "#ff385c", marginBottom: 16 }}><FiMapPin /></div>
            <h3 style={{ fontWeight: "bold", marginBottom: 10 }}>Guwahati</h3>
            <p>The gateway to Northeast India, offering a blend of urban convenience and natural beauty.</p>
          </div>

          <div style={styles.featureCard}>
            <div style={{ fontSize: 32, color: "#ff385c", marginBottom: 16 }}><FiHome /></div>
            <h3 style={{ fontWeight: "bold", marginBottom: 10 }}>Shillong</h3>
            <p>Known as the "Scotland of the East", this picturesque hill station offers cool climate and stunning landscapes.</p>
          </div>

          <div style={styles.featureCard}>
            <div style={{ fontSize: 32, color: "#ff385c", marginBottom: 16 }}><FiStar /></div>
            <h3 style={{ fontWeight: "bold", marginBottom: 10 }}>Goa</h3>
            <p>Famous for its beaches, Portuguese heritage, and vibrant culture.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => { e.preventDefault(); setSubmitted(true); };

  return (
    <div style={styles.pageContainer}>
      <Helmet>
        <title>Contact {SITE_NAME}</title>
        <meta name="description" content="Get in touch with Homavia for support, partnerships, or listing inquiries." />
        <link rel="canonical" href={absoluteUrl("/contact")} />
        <meta property="og:image" content={COMMON_IMAGE_URL} />
      </Helmet>

      <h1 style={styles.pageTitle}>Contact Us</h1>

      <div style={styles.pageContent}>
        <p style={{ marginBottom: 25 }}>
          Have questions about booking a homestay or listing your property? Our team is here to help!
        </p>

        <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: 25 }}>
          <h3 style={{ fontWeight: "bold", marginBottom: 15, fontSize: 18 }}>Contact Information</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FiPhone size={16} />
              </div>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14 }}>Phone</p>
                <p style={{ fontSize: 14 }}>{DEFAULT_CONTACT}</p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FiMail size={16} />
              </div>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14 }}>Email</p>
                <p style={{ fontSize: 14 }}>takeoffheaven@gmail.com</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontWeight: "bold", marginBottom: 15, fontSize: 18 }}>Send us a message</h3>

          {submitted ? (
            <div style={{ textAlign: "center", padding: 20 }}>
              <FiCheck size={32} color="#4CAF50" style={{ marginBottom: 15 }} />
              <h3 style={{ fontWeight: "bold", marginBottom: 10, fontSize: 16 }}>Message Sent!</h3>
              <p style={{ fontSize: 14 }}>Thank you for contacting us. We'll get back to you within 24 hours.</p>
              <button style={{ ...styles.submitButton, marginTop: 15 }} onClick={() => setSubmitted(false)}>
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="contactForm" style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Your Name *</label>
                  <input type="text" name="name" style={{ padding: "12px 15px", borderRadius: 8, border: "1px solid #ddd", fontSize: 16, width: "100%", boxSizing: "border-box" }} value={formData.name} onChange={handleChange} required />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email *</label>
                  <input type="email" name="email" style={{ padding: "12px 15px", borderRadius: 8, border: "1px solid #ddd", fontSize: 16, width: "100%", boxSizing: "border-box" }} value={formData.email} onChange={handleChange} required />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Phone Number</label>
                  <input type="tel" name="phone" style={{ padding: "12px 15px", borderRadius: 8, border: "1px solid #ddd", fontSize: 16, width: "100%", boxSizing: "border-box" }} value={formData.phone} onChange={handleChange} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Message *</label>
                  <textarea name="message" style={{ padding: "12px 15px", borderRadius: 8, border: "1px solid #ddd", fontSize: 16, width: "100%", boxSizing: "border-box", minHeight: 120 }} value={formData.message} onChange={handleChange} required></textarea>
                </div>

                <button type="submit" style={styles.submitButton}>Send Message</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------- FOOTER -------------------- */

function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerContainer}>
        <div style={styles.footerColumn}>
          <div style={styles.logoContainer}>
            <img src={logo} alt="Homavia Logo" style={styles.logo} />
            <span>Homavia</span>
          </div>
          <p style={{ color: "#666", lineHeight: 1.6, fontSize: 14 }}>
            Your trusted platform for authentic homestay experiences in Guwahati, Shillong, and Goa.
          </p>
        </div>

        <div style={styles.footerColumn}>
          <h4 style={styles.footerTitle}>Quick Links</h4>
          <Link to="/" style={styles.footerLink}><FiHome /> Home</Link>
          <Link to="/about" style={styles.footerLink}><FiInfo /> About Us</Link>
          <Link to="/contact" style={styles.footerLink}><FiPhone /> Contact</Link>
          <Link to="/premium" style={styles.footerLink}><FiStar /> Premium</Link>
          <Link to="/add-homestay" style={styles.footerLink}><FiHome /> List Your Homestay</Link>
        </div>

        <div style={styles.footerColumn}>
          <h4 style={styles.footerTitle}>Contact Us</h4>
          <a href="mailto:support@homavia.com" style={styles.footerLink}><FiMail /> support@homavia.com</a>
          <a href={`tel:${DEFAULT_CONTACT.replace(/\s+/g, "")}`} style={styles.footerLink}><FiPhone /> {DEFAULT_CONTACT}</a>
        </div>
      </div>

      <div style={styles.copyright}>
        © {new Date().getFullYear()} Homavia. All rights reserved.
      </div>
    </footer>
  );
}

/* -------------------- APP (with Admin Import) -------------------- */

function MobileApp() {
  const [homestays, setHomestays] = useState([]);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "homestays"), (snapshot) => {
      const d = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setHomestays(d);
    });
    const authUnsubscribe = auth.onAuthStateChanged(setUser);
    return () => { unsubscribe(); authUnsubscribe(); };
  }, []);

  const handleLogin = async () => { try { await signInWithPopup(auth, provider); } catch (e) { console.error("Login error:", e); } };
  const handleLogout = async () => { try { await signOut(auth); } catch (e) { console.error("Logout error:", e); } };
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isAdmin = user?.email === "nilamroychoudhury216@gmail.com";

  // Replace-import: deletes existing docs for uploaded cities, then imports.
  const handleImportJson = async () => {
    try {
      const picker = document.createElement("input");
      picker.type = "file";
      picker.accept = ".json,application/json";
      picker.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) { alert("Invalid JSON: expected an array of homestays."); return; }

        // Enforce SEO defaults on import
        const normalized = data.map((item) => ({
          ...item,
          city: (item.city || "Guwahati").trim(),
          area: (item.area || "").trim(),
          contact: DEFAULT_CONTACT,
          imageUrl: item.imageUrl || COMMON_IMAGE_URL,
          createdAt: item.createdAt || new Date().toISOString(),
        }));

        const cities = [...new Set(normalized.map((d) => d.city))];
        if (!window.confirm(`This will DELETE existing listings in: ${cities.join(", ")} and then import ${normalized.length} items. Continue?`)) return;

        // Delete by city
        for (const city of cities) {
          const qCity = query(collection(db, "homestays"), where("city", "==", city));
          const snap = await getDocs(qCity);
          if (!snap.empty) {
            const batch = writeBatch(db);
            snap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
            await batch.commit();
          }
        }

        // Batched writes for speed
        const BATCH_SIZE = 400;
        for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
          const batch = writeBatch(db);
          normalized.slice(i, i + BATCH_SIZE).forEach((item) => {
            const colRef = collection(db, "homestays");
            const newRef = doc(colRef);
            batch.set(newRef, item);
          });
          await batch.commit();
        }

        alert("✅ Replace import completed!");
        closeMobileMenu();
      };
      picker.click();
    } catch (err) {
      console.error(err);
      alert("Import failed. See console for details.");
    }
  };

  // Site-wide Helmet defaults (helpful for SEO across SPA routes)
  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": SITE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Router>
      <Helmet>
        <title>{SITE_NAME} — Find Your Perfect Homestay</title>
        <meta name="description" content={DEFAULT_DESCRIPTION} />
        <link rel="canonical" href={absoluteUrl("/")} />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${SITE_NAME} — Find Your Perfect Homestay`} />
        <meta property="og:description" content={DEFAULT_DESCRIPTION} />
        <meta property="og:image" content={COMMON_IMAGE_URL} />
        <script type="application/ld+json">{JSON.stringify(siteLd)}</script>
      </Helmet>

      <div style={styles.container}>
        <header style={styles.header}>
          <Link to="/" style={styles.logoContainer} onClick={closeMobileMenu}>
            <img src={logo} alt="Homavia Logo" style={styles.logo} />
            Homavia
          </Link>

        <button style={styles.hamburgerButton} onClick={toggleMobileMenu}>
            <FiMenu />
          </button>
        </header>

        <div
          style={{ ...styles.overlay, ...(mobileMenuOpen ? styles.overlayVisible : {}) }}
          onClick={closeMobileMenu}
        />

        <div style={{ ...styles.mobileMenu, ...(mobileMenuOpen ? styles.mobileMenuOpen : {}) }}>
          <button style={styles.closeButton} onClick={closeMobileMenu}>
            <FiX />
          </button>

          <div style={styles.mobileNav}>
            <Link to="/" style={styles.navLink} onClick={closeMobileMenu}>Home</Link>
            <Link to="/about" style={styles.navLink} onClick={closeMobileMenu}>About Us</Link>
            <Link to="/contact" style={styles.navLink} onClick={closeMobileMenu}>Contact</Link>
            <Link to="/premium" style={styles.navLink} onClick={closeMobileMenu}>Premium</Link>
          </div>

          <div style={{ marginTop: 30 }}>
            {user ? (
              <>
                <Link
                  to="/add-homestay"
                  style={{ ...styles.authButton, ...styles.btnPrimary, display: "block", textAlign: "center", marginBottom: 15 }}
                  onClick={closeMobileMenu}
                >
                  Add Homestay
                </Link>

                {isAdmin && (
                  <button
                    style={{ ...styles.authButton, width: "100%", marginBottom: 12, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
                    onClick={handleImportJson}
                    title="Import homestays from a JSON file"
                  >
                    <FiUpload /> 📦 Import Homestays (Admin)
                  </button>
                )}

                <button
                  style={{ ...styles.authButton, width: "100%" }}
                  onClick={() => { handleLogout(); closeMobileMenu(); }}
                >
                  <FiUser /> Logout
                </button>
              </>
            ) : (
              <button
                style={{ ...styles.authButton, width: "100%" }}
                onClick={() => { handleLogin(); closeMobileMenu(); }}
              >
                <FiUser /> Login
              </button>
            )}
          </div>
        </div>

        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomestayListing homestays={homestays} />} />
            <Route path="/add-homestay" element={<AddHomestayForm />} />
            {/* SEO route: slug = `${nameSlug}-${id}` */}
            <Route path="/homestays/:citySlug/:areaSlug/:slug" element={<HomestayDetail />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            {/* Premium page kept simple for SEO */}
            <Route
              path="/premium"
              element={
                <div style={styles.pageContainer}>
                  <Helmet>
                    <title>Premium Features — {SITE_NAME}</title>
                    <meta name="description" content="Upgrade to Homavia Premium to increase your listing visibility and bookings." />
                    <link rel="canonical" href={absoluteUrl("/premium")} />
                    <meta property="og:image" content={COMMON_IMAGE_URL} />
                  </Helmet>
                  <h1 style={styles.pageTitle}>Premium Features</h1>
                  <div style={{ ...styles.pageContent, textAlign: "center" }}>
                    <p style={{ fontSize: 16, marginBottom: 25 }}>
                      Elevate your homestay listing with our Premium features designed to increase your visibility and bookings.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginTop: 32 }}>
                      <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", textAlign: "center" }}>
                        <div style={{ fontSize: 32, color: "#ff385c", marginBottom: 16 }}><FiStar /></div>
                        <h3 style={{ fontWeight: "bold", marginBottom: 10 }}>Featured Listings</h3>
                        <p>Your property appears at the top of search results with a premium badge.</p>
                      </div>
                    </div>
                  </div>
                </div>
              }
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

/* -------------------- MAIN -------------------- */

function App() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => { setIsMobile(isMobileDevice()); }, []);
  if (!isMobile) return <DesktopWarning />;
  return <MobileApp />;
}

export default App;
