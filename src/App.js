import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  doc,
  query,
  orderBy,
  getDoc,
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
import { Helmet, HelmetProvider } from 'react-helmet-async';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCQJ3dX_ZcxVKzlCD8H19JM3KYh7qf8wYk",
  authDomain: "form-ca7cc.firebaseapp.com",
  databaseURL: "https://form-ca7cc-default-rtdb.firebaseio.com",
  projectId: "form-ca7cc",
  storageBucket: "form-ca7cc.firebaseapp.com",
  messagingSenderId: "1054208318782",
  appId: "1:1054208318782:web:f64f43412902afcd7aa06f",
  measurementId: "G-CQSLK7PCFQ",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// --- Cloudinary Configuration ---
const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset_1";
const CLOUDINARY_CLOUD_NAME = "dyrmi2zkl";

// --- Geocoding Function ---
async function geocodeAddress(address) {
  if (!address) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.length === 0) return null;
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
}

// --- Utility: Slug Generation ---
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric, spaces, or hyphens
    .trim()                       // Trim whitespace from both ends
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/-+/g, '-');         // Replace multiple hyphens with single hyphen
}

// --- Global Styles Definition (CSS Variables) ---
const setGlobalCssVariables = () => {
    const root = document.documentElement.style;

    // Color Palette
    root.setProperty('--primary-color', '#e50914'); // BookMyShow-like Red
    root.setProperty('--primary-dark', '#b2070f');
    root.setProperty('--secondary-color', '#007bff'); // Standard Blue
    root.setProperty('--secondary-dark', '#0056b3');
    root.setProperty('--success-color', '#28a745');
    root.setProperty('--success-dark', '#218838');
    root.setProperty('--danger-color', '#dc3545');
    root.setProperty('--danger-dark', '#c82333');

    // Neutrals
    root.setProperty('--background-color', '#f5f5f5');
    root.setProperty('--card-background', '#ffffff');
    root.setProperty('--text-color', '#333333');
    root.setProperty('--light-text-color', '#666666');
    root.setProperty('--border-color', '#e0e0e0');
    root.setProperty('--shadow-light', 'rgba(0,0,0,0.05)');
    root.setProperty('--shadow-medium', 'rgba(0,0,0,0.08)');
    root.setProperty('--shadow-heavy', 'rgba(0,0,0,0.15)');

    // Typography
    root.setProperty('--font-family-body', "'Roboto', 'Helvetica Neue', Arial, sans-serif");
    root.setProperty('--font-family-heading', "'Montserrat', sans-serif");

    // Spacing
    root.setProperty('--spacing-xs', '8px');
    root.setProperty('--spacing-sm', '12px');
    root.setProperty('--spacing-md', '20px');
    root.setProperty('--spacing-lg', '30px');
    root.setProperty('--spacing-xl', '40px');

    // Border Radius
    root.setProperty('--border-radius-sm', '8px');
    root.setProperty('--border-radius-md', '12px');
    root.setProperty('--border-radius-lg', '16px');
    root.setProperty('--border-radius-pill', '30px');
};


// --- Inline Styles Object ---
const styles = {
  // General Layout & Structure
  container: {
    maxWidth: '1200px',
    margin: 'var(--spacing-xl) auto',
    fontFamily: 'var(--font-family-body)',
    color: 'var(--text-color)',
    backgroundColor: 'transparent',
    borderRadius: 'var(--border-radius-lg)',
  },
  mainContentArea: {
    padding: 'var(--spacing-md)',
    backgroundColor: 'var(--background-color)',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: '0 8px 30px var(--shadow-medium)',
  },
  headerWrapper: {
    backgroundColor: 'var(--card-background)',
    boxShadow: '0 4px 15px var(--shadow-light)',
    padding: '10px var(--spacing-lg)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '0 0 var(--border-radius-md) var(--border-radius-md)',
  },
  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  siteTitle: {
    fontSize: '36px',
    fontWeight: '800',
    color: 'var(--primary-color)',
    letterSpacing: '1px',
    fontFamily: 'var(--font-family-heading)',
    textDecoration: 'none',
  },
  footer: {
    textAlign: 'center',
    marginTop: 'var(--spacing-xl)',
    padding: 'var(--spacing-md) 0',
    borderTop: '1px solid var(--border-color)',
    backgroundColor: 'var(--card-background)',
    borderRadius: '0 0 var(--border-radius-lg) var(--border-radius-lg)',
    fontSize: '14px',
    color: 'var(--light-text-color)',
    boxShadow: '0 -4px 15px var(--shadow-light)',
  },

  // Auth Bar (now part of header) Styles
  authControls: {
    display: 'flex',
    gap: 'var(--spacing-sm)',
    alignItems: 'center',
  },
  userGreeting: {
    fontSize: '16px',
    color: 'var(--text-color)',
    fontWeight: '500',
    marginRight: 'var(--spacing-sm)',
  },

  // Button Base & Variants
  buttonBase: {
    padding: '12px 24px',
    fontSize: '16px',
    borderRadius: 'var(--border-radius-md)',
    cursor: 'pointer',
    border: 'none',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 10px var(--shadow-light)',
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: '0 1px 3px var(--shadow-light)',
    },
  },
  btnPrimary: {
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    '&:hover': {
      backgroundColor: 'var(--primary-dark)',
    },
  },
  btnSecondary: {
    backgroundColor: 'var(--secondary-color)',
    color: 'white',
    '&:hover': {
      backgroundColor: 'var(--secondary-dark)',
    },
  },
  btnSuccess: {
    backgroundColor: 'var(--success-color)',
    color: 'white',
    '&:hover': {
      backgroundColor: 'var(--success-dark)',
    },
  },
  btnDanger: {
    backgroundColor: 'var(--danger-color)',
    color: 'white',
    '&:hover': {
      backgroundColor: 'var(--danger-dark)',
    },
  },
  disabledButton: {
    opacity: '0.6',
    cursor: 'not-allowed',
  },
  backButton: {
    display: 'inline-block',
    margin: 'var(--spacing-md) 0',
    padding: '12px 22px',
    backgroundColor: '#6c757d',
    color: 'white',
    borderRadius: 'var(--border-radius-sm)',
    textDecoration: 'none',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease, transform 0.2s ease',
    '&:hover': {
        backgroundColor: '#5a6268',
        transform: 'translateY(-1px)',
    }
  },

  // Input & Form Elements
  searchInput: {
    width: '100%',
    padding: '16px',
    fontSize: '18px',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--border-color)',
    outline: 'none',
    marginBottom: 'var(--spacing-md)',
    boxSizing: 'border-box',
    boxShadow: '0 2px 8px var(--shadow-light)',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    '&:focus': {
      borderColor: 'var(--primary-color)',
      boxShadow: '0 0 0 0.3rem rgba(229,9,20,.15)',
    },
  },
  formContainer: {
    backgroundColor: 'var(--card-background)',
    padding: 'var(--spacing-xl)',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: '0 6px 20px var(--shadow-medium)',
    marginBottom: 'var(--spacing-xl)',
  },
  formTitle: {
    fontSize: '32px',
    marginBottom: 'var(--spacing-lg)',
    color: 'var(--text-color)',
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'var(--font-family-heading)',
  },
  formGroup: {
    marginBottom: 'var(--spacing-md)',
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: 'var(--spacing-xs)',
    fontWeight: '600',
    fontSize: '16px',
    color: 'var(--text-color)',
  },
  input: {
    padding: '14px',
    fontSize: '16px',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--border-color)',
    outline: 'none',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    '&:focus': {
      borderColor: 'var(--primary-color)',
      boxShadow: '0 0 0 0.25rem rgba(229,9,20,.15)',
    },
  },
  textarea: {
    padding: '14px',
    fontSize: '16px',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--border-color)',
    outline: 'none',
    resize: 'vertical',
    minHeight: '120px',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    '&:focus': {
      borderColor: 'var(--primary-color)',
      boxShadow: '0 0 0 0.25rem rgba(229,9,20,.15)',
    },
  },
  select: {
    padding: '14px',
    fontSize: '16px',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--border-color)',
    outline: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.3s ease',
    '&:focus': {
      borderColor: 'var(--primary-color)',
      boxShadow: '0 0 0 0.25rem rgba(229,9,20,.15)',
    },
  },

  // Category Filter Styles
  categoryFilter: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 'var(--spacing-sm)',
    marginBottom: 'var(--spacing-xl)',
  },
  categoryButton: {
    padding: '12px 25px',
    fontSize: '16px',
    borderRadius: 'var(--border-radius-pill)',
    border: '1px solid var(--primary-color)',
    backgroundColor: 'var(--card-background)',
    color: 'var(--primary-color)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      transform: 'translateY(-2px)',
      boxShadow: '0 3px 10px var(--shadow-light)',
    },
  },
  categoryButtonActive: {
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(229,9,20,0.25)',
  },

  // Event Listing Card Styles
  eventList: {
    listStyle: 'none',
    paddingLeft: 0,
    marginBottom: 'var(--spacing-xl)',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 'var(--spacing-lg)',
  },
  eventItem: {
    backgroundColor: 'var(--card-background)',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: '0 6px 20px var(--shadow-medium)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 12px 30px var(--shadow-heavy)',
    },
  },
  eventImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: 'var(--border-radius-lg) var(--border-radius-lg) 0 0',
    boxShadow: '0 2px 8px var(--shadow-light)',
  },
  eventContent: {
    padding: 'var(--spacing-md)',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: '22px',
    marginBottom: 'var(--spacing-sm)',
    color: 'var(--text-color)',
    fontWeight: '700',
    lineHeight: '1.3',
    minHeight: '2.6em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  eventDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: 'var(--spacing-md)',
    fontSize: '15px',
    color: 'var(--light-text-color)',
  },
  eventDetailLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '500',
  },
  eventIcon: {
    fontSize: '18px',
    color: 'var(--primary-color)',
  },
  eventDesc: {
    marginTop: '5px',
    fontSize: '15px',
    color: 'var(--light-text-color)',
    lineHeight: '1.6',
    marginBottom: 'var(--spacing-md)',
    minHeight: '4.8em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  },
  interestedSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 'var(--spacing-sm)',
    borderTop: '1px solid var(--border-color)',
    margin: '0 calc(var(--spacing-md) * -1) calc(var(--spacing-md) * -1) calc(var(--spacing-md) * -1)',
    padding: 'var(--spacing-sm) var(--spacing-md) var(--spacing-md) var(--spacing-md)',
  },
  interestedBtn: {
    padding: '10px 18px',
    borderRadius: 'var(--border-radius-sm)',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px var(--shadow-light)',
    },
  },
  interestedCount: {
    marginLeft: 'var(--spacing-sm)',
    fontSize: '15px',
    color: 'var(--light-text-color)',
    fontWeight: '500',
  },

  // Event Detail Page Styles
  detailContainer: {
    backgroundColor: 'var(--card-background)',
    padding: 'var(--spacing-xl)',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: '0 6px 20px var(--shadow-medium)',
    marginTop: 'var(--spacing-md)',
    marginBottom: 'var(--spacing-xl)',
  },
  detailImage: {
    width: '100%',
    maxHeight: '500px',
    objectFit: 'cover',
    borderRadius: 'var(--border-radius-md)',
    marginBottom: 'var(--spacing-lg)',
    boxShadow: '0 6px 15px var(--shadow-light)',
  },
  detailTitle: {
    fontSize: '40px',
    color: 'var(--text-color)',
    marginBottom: 'var(--spacing-md)',
    fontWeight: '800',
    fontFamily: 'var(--font-family-heading)',
  },
  detailInfo: {
    fontSize: '18px',
    color: 'var(--light-text-color)',
    marginBottom: 'var(--spacing-xs)',
    lineHeight: '1.6',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  detailDescription: {
    fontSize: '17px',
    lineHeight: '1.8',
    color: 'var(--text-color)',
    marginTop: 'var(--spacing-lg)',
    marginBottom: 'var(--spacing-lg)',
    whiteSpace: 'pre-wrap',
  },

  // Responsive Styles (applied dynamically in components based on screen size)
  responsive: {
    headerWrapperMobile: {
      padding: '8px var(--spacing-md)',
    },
    siteTitleMobile: {
      fontSize: '28px',
    },
    authControlsMobile: {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: '8px',
      marginTop: '8px',
      width: '100%',
    },
    userGreetingMobile: {
        textAlign: 'center',
        marginBottom: '5px',
        marginRight: 0,
    },
    buttonBaseMobile: {
        padding: '10px 15px',
        fontSize: '14px',
        width: '100%',
        textAlign: 'center',
    },
    eventListMobile: {
      gridTemplateColumns: '1fr',
    },
    detailTitleMobile: {
      fontSize: '32px',
    },
  },
};

// --- Component Definitions ---

// Top Navigation Component
function TopNavigation({ user, handleLogin, handleLogout }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
        if (window.innerWidth >= 768) {
            setMenuOpen(false);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav style={{ ...styles.headerWrapper, ...(isMobile && styles.responsive.headerWrapperMobile) }}>
      <div style={styles.headerInner}>
        <Link to="/" style={styles.siteTitle}>
          Listeve
        </Link>

        {isMobile ? (
          <>
            <button
              onClick={toggleMenu}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '28px',
                color: 'var(--text-color)',
                cursor: 'pointer',
                padding: '5px',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
            {menuOpen && (
              <div id="mobile-nav-menu" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '100%',
                backgroundColor: 'var(--card-background)',
                boxShadow: '0 4px 15px var(--shadow-light)',
                padding: 'var(--spacing-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-sm)',
                zIndex: 999,
              }}>
                {user ? (
                  <>
                    <span style={{ ...styles.userGreeting, ...styles.responsive.userGreetingMobile }}>
                      Welcome, <strong>{user.displayName}</strong>
                    </span>
                    <Link to="/add-event" style={{ ...styles.buttonBase, ...styles.btnSuccess, ...styles.responsive.buttonBaseMobile }} onClick={() => setMenuOpen(false)}>
                      + Add New Event
                    </Link>
                    <button style={{ ...styles.buttonBase, ...styles.btnDanger, ...styles.responsive.buttonBaseMobile }} onClick={() => { handleLogout(); setMenuOpen(false); }}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/add-event" style={{ ...styles.buttonBase, ...styles.btnSecondary, ...styles.responsive.buttonBaseMobile }} onClick={() => setMenuOpen(false)}>
                      Add Event
                    </Link>
                    <button style={{ ...styles.buttonBase, ...styles.btnPrimary, ...styles.responsive.buttonBaseMobile }} onClick={() => { handleLogin(); setMenuOpen(false); }}>
                      Login
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={styles.authControls}>
            {user ? (
              <>
                <span style={styles.userGreeting}>
                  Welcome, <strong>{user.displayName}</strong>
                </span>
                <Link to="/add-event" style={{ ...styles.buttonBase, ...styles.btnSuccess }}>
                  + Add New Event
                </Link>
                <button style={{ ...styles.buttonBase, ...styles.btnDanger }} onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/add-event" style={{ ...styles.buttonBase, ...styles.btnSecondary }}>
                  Add Event
                </Link>
                <button style={{ ...styles.buttonBase, ...styles.btnPrimary }} onClick={handleLogin}>
                  Login
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function EventListingPage({ user, events, loading, toggleInterest }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = ["All", "Music", "Sports", "Art", "Tech", "Food", "Other"];
  const [isMobileGrid, setIsMobileGrid] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobileGrid(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredEvents = events
    .filter((event) => {
      const lowerSearch = search.toLowerCase();
      const matchesSearch =
        event.title.toLowerCase().includes(lowerSearch) ||
        (event.city?.toLowerCase().includes(lowerSearch) ?? false) ||
        (event.state?.toLowerCase().includes(lowerSearch) ?? false) ||
        (event.country?.toLowerCase().includes(lowerSearch) ?? false) ||
        (event.description?.toLowerCase().includes(lowerSearch) ?? false);

      const matchesCategory =
        selectedCategory === "All" || event.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Construct current canonical URL for the homepage
  const currentUrl = window.location.origin;

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Listeve - Your Event Discovery Platform for India",
    "url": currentUrl,
    "description": "Discover and list upcoming events across India: music concerts, sports, tech meetups, art exhibitions, food festivals, and more. Find local events near you!",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${currentUrl}/?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <main style={{ padding: 'var(--spacing-md)' }}>
      <Helmet>
        <title>Listeve - Discover & List Events in India | Music, Sports, Tech, Art & More</title>
        <meta name="description" content="Discover and list upcoming events across India, including music concerts, sports, tech meetups, art exhibitions, food festivals, and more. Find local events near you!" />
        <link rel="canonical" href={currentUrl} />

        {/* Open Graph Tags for homepage */}
        <meta property="og:title" content="Listeve - Discover & List Events in India" />
        <meta property="og:description" content="Find and list events across India: music, sports, tech, art, food, and more. Your go-to platform for local happenings." />
        <meta property="og:image" content={`${currentUrl}/default_social_share_image.jpg`} /> {/* Replace with actual default image */}
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Listeve" />

        {/* Twitter Card Tags for homepage */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Listeve - Discover & List Events in India" />
        <meta name="twitter:description" content="Find and list events across India: music, sports, tech, art, food, and more. Your go-to platform for local happenings." />
        <meta name="twitter:image" content={`${currentUrl}/default_social_share_image.jpg`} /> {/* Replace with actual default image */}
        <meta name="twitter:creator" content="@YourTwitterHandle" /> {/* Optional: replace with your Twitter handle */}

        {/* JSON-LD WebSite Schema */}
        <script type="application/ld+json">
          {JSON.stringify(webSiteSchema)}
        </script>
      </Helmet>

      <section>
        <input
          style={styles.searchInput}
          type="search"
          placeholder="Search events by title, location, or keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={!events.length && !loading}
          aria-label="Search events"
        />

        {events.length > 0 && (
          <nav style={styles.categoryFilter} aria-label="Filter events by category">
            {categories.map((category) => (
              <button
                key={category}
                style={{
                  ...styles.categoryButton,
                  ...(selectedCategory === category
                    ? styles.categoryButtonActive
                    : {}),
                }}
                onClick={() => setSelectedCategory(category)}
                aria-pressed={selectedCategory === category}
              >
                {category}
              </button>
            ))}
          </nav>
        )}
      </section>

      <section>
        <h2 style={{ ...styles.formTitle, marginTop: 0, marginBottom: 'var(--spacing-lg)' }}>Upcoming Events</h2>
        <ul style={{ ...styles.eventList, ...(isMobileGrid && styles.responsive.eventListMobile) }}>
          {filteredEvents.length === 0 && (
            <li style={{ textAlign: "center", color: "var(--light-text-color)", fontSize: '18px', padding: 'var(--spacing-lg)', backgroundColor: 'var(--card-background)', borderRadius: 'var(--border-radius-md)', boxShadow: '0 2px 8px var(--shadow-light)', gridColumn: '1 / -1' }}>
              No events found matching your criteria. Try adjusting your search or filters.
            </li>
          )}

          {filteredEvents.map((event) => {
            const interestedCount = event.interestedUsers?.length || 0;
            const isInterested = user ? event.interestedUsers?.includes(user.uid) : false;
            const eventUrl = `/events/${event.slug || 'default-slug'}/${event.id}`;
            return (
              <li key={event.id} style={styles.eventItem}>
                <Link to={eventUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {event.imageUrl && (
                    <img
                      src={event.imageUrl}
                      alt={`${event.title} event ${event.category ? `(${event.category})` : ''}`}
                      title={event.title}
                      style={styles.eventImage}
                      loading="lazy"
                    />
                  )}
                  <article style={styles.eventContent}>
                    <h3 style={styles.eventTitle}>{event.title}</h3>
                    <div style={styles.eventDetails}>
                        <div style={styles.eventDetailLine}>
                            <span style={styles.eventIcon}>🗓️</span>
                            <time dateTime={event.date}>
                                {new Date(event.date).toLocaleDateString('en-IN', {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                })}
                            </time>
                        </div>
                        {(event.city || event.state || event.country) && (
                            <address style={styles.eventDetailLine}>
                                <span style={styles.eventIcon}>📍</span>
                                {[event.city, event.state, event.country].filter(Boolean).join(", ")}
                            </address>
                        )}
                        {event.category && (
                            <div style={styles.eventDetailLine}>
                                <span style={styles.eventIcon}>🏷️</span>
                                <strong>{event.category}</strong>
                            </div>
                        )}
                    </div>
                    {event.description && (
                      <p style={styles.eventDesc}>
                        {event.description}
                      </p>
                    )}
                  </article>
                </Link>
                <div style={styles.interestedSection}>
                  <button
                    style={{
                      ...styles.interestedBtn,
                      backgroundColor: isInterested ? 'var(--primary-color)' : 'var(--secondary-color)',
                      color: 'white',
                      ...(loading ? styles.disabledButton : {}),
                    }}
                    onClick={(e) => { e.stopPropagation(); toggleInterest(event); }}
                    disabled={loading}
                    aria-pressed={isInterested}
                  >
                    {isInterested ? "Interested ✓" : "Show Interest"}
                  </button>
                  <span style={styles.interestedCount}>{interestedCount} interested</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

function EventDetailPage({ user, toggleInterest }) {
  const { slug, id } = useParams();
  const [event, setEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function fetchEvent() {
      if (!id) return;
      setLoadingEvent(true);
      try {
        const eventRef = doc(db, "events", id);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          const eventData = { id: eventSnap.id, ...eventSnap.data() };
          // Optional: If slug in URL doesn't match stored slug, navigate to correct URL
          if (eventData.slug && eventData.slug !== slug) {
              navigate(`/events/${eventData.slug}/${event.id}`, { replace: true });
              return;
          }
          setEvent(eventData);
        } else {
          console.log("No such document!");
          navigate('/not-found');
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        alert("Failed to load event details.");
      }
      setLoadingEvent(false);
    }
    fetchEvent();
  }, [id, slug, navigate]);

  if (loadingEvent) {
    return <div style={{ textAlign: 'center', fontSize: '20px', padding: '50px', color: 'var(--light-text-color)' }}>Loading event details...</div>;
  }

  if (!event) {
    return <div style={{ textAlign: 'center', fontSize: '20px', padding: '50px', color: 'var(--danger-color)' }}>Event not found.</div>;
  }

  const interestedCount = event.interestedUsers?.length || 0;
  const isInterested = user ? event.interestedUsers?.includes(user.uid) : false;

  const eventDateFormatted = new Date(event.date).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const locationString = [event.city, event.state, event.country].filter(Boolean).join(", ");
  const currentUrl = `${window.location.origin}/events/${event.slug || 'default-slug'}/${event.id}`;
  const pageTitle = `${event.title} - ${eventDateFormatted} - ${event.category ? `${event.category} Events - ` : ''}Listeve`;
  const metaDescription = event.description
    ? event.description.substring(0, 160) + ` Find event details, date, and location in ${locationString}.`
    : `Details about the event "${event.title}" happening on ${eventDateFormatted} in ${locationString}. Join us!`;

  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "startDate": event.date,
    "endDate": event.date,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": locationString || event.title,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": event.city,
        "addressRegion": event.state,
        "addressCountry": "IN"
      }
    },
    "description": event.description,
    "image": event.imageUrl || "URL_TO_DEFAULT_EVENT_IMAGE.jpg",
    "organizer": {
      "@type": event.createdByName ? "Person" : "Organization",
      "name": event.createdByName || "Listeve Community"
    },
    "url": currentUrl
  };

  return (
    <article style={styles.detailContainer}>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={currentUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={event.imageUrl || 'URL_TO_DEFAULT_EVENT_IMAGE.jpg'} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content="event" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={event.imageUrl || 'URL_TO_DEFAULT_EVENT_IMAGE.jpg'} />

        <script type="application/ld+json">
          {JSON.stringify(eventSchema)}
        </script>
      </Helmet>

      <Link to="/" style={styles.backButton}>&larr; Back to All Events</Link>
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={`Image for ${event.title} event`}
          title={event.title}
          style={styles.detailImage}
        />
      )}
      <h1 style={{ ...styles.detailTitle, ...(isMobile && styles.responsive.detailTitleMobile) }}>{event.title}</h1>
      <p style={styles.detailInfo}>
          <span style={styles.eventIcon}>🗓️</span>
          <strong>Date:</strong> <time dateTime={event.date}>{eventDateFormatted}</time>
      </p>
      {(event.city || event.state || event.country) && (
        <p style={styles.detailInfo}>
          <span style={styles.eventIcon}>📍</span>
          <strong>Location:</strong> <address>{locationString}</address>
        </p>
      )}
      {event.category && (
        <p style={styles.detailInfo}>
            <span style={styles.eventIcon}>🏷️</span>
            <strong>Category:</strong> {event.category}
        </p>
      )}
      {event.contact && (
        <p style={styles.detailInfo}>
            <span style={styles.eventIcon}>✉️</span>
            <strong>Contact:</strong> <a href={`mailto:${event.contact}`} title="Contact event organizer" style={{ color: 'inherit', textDecoration: 'none' }}>{event.contact}</a>
        </p>
      )}
      {event.description && (
        <p style={styles.detailDescription}>{event.description}</p>
      )}
      <div style={styles.interestedSection}>
        <button
          style={{
            ...styles.interestedBtn,
            backgroundColor: isInterested ? 'var(--primary-color)' : 'var(--secondary-color)',
            color: 'white',
            ...(loadingEvent ? styles.disabledButton : {}),
          }}
          onClick={() => toggleInterest(event)}
          disabled={loadingEvent}
          aria-pressed={isInterested}
        >
          {isInterested ? "Interested ✓" : "Show Interest"}
        </button>
        <span style={styles.interestedCount}>{interestedCount} interested</span>
      </div>
    </article>
  );
}

function AddEventForm({ user, handleAddEvent, form, handleChange, imageFile, handleImageChange, loading }) {
  const categories = ["Select Category", "Music", "Sports", "Art", "Tech", "Food", "Other"];

  const isFormValid = () => {
    const { title, date, category, city, state, country, contact, description } = form;
    return (
      title.trim() !== "" &&
      date.trim() !== "" &&
      category.trim() !== "" &&
      city.trim() !== "" &&
      state.trim() !== "" &&
      country.trim() !== "" &&
      contact.trim() !== "" &&
      description.trim() !== "" &&
      imageFile !== null
    );
  };

  return (
    <section style={styles.formContainer}>
      <Helmet>
        <title>Add New Event - List Your Event on Listeve</title>
        <meta name="description" content="Add your event to Listeve, the best platform to discover and promote local events in India. List your music, sports, art, tech, or food event for free." />
      </Helmet>
      <h2 style={styles.formTitle}>Add New Event</h2>

      <form onSubmit={handleAddEvent}>
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="title">Event Title *</label>
          <input
            style={styles.input}
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="e.g., Local Music Festival"
            aria-required="true"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="date">Event Date *</label>
          <input
            style={styles.input}
            id="date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
            aria-required="true"
          />
        </div>

        <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="category">Category *</label>
            <select
                style={styles.select}
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                aria-required="true"
            >
                {categories.map((cat) => (
                    <option key={cat} value={cat === "Select Category" ? "" : cat} disabled={cat === "Select Category"}>
                        {cat}
                    </option>
                ))}
            </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="city">City *</label>
          <input
            style={styles.input}
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            required
            placeholder="e.g., Mumbai"
            aria-required="true"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="state">State *</label>
          <input
            style={styles.input}
            id="state"
            name="state"
            value={form.state}
            onChange={handleChange}
            required
            placeholder="e.g., Maharashtra"
            aria-required="true"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="country">Country *</label>
          <input
            style={styles.input}
            id="country"
            name="country"
            value={form.country}
            onChange={handleChange}
            required
            placeholder="e.g., India"
            aria-required="true"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="contact">Contact Info *</label>
          <input
            style={styles.input}
            id="contact"
            name="contact"
            value={form.contact}
            onChange={handleChange}
            required
            placeholder="e.g., email@example.com or phone number"
            type="email"
            aria-required="true"
          />
        </div>

        <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="imageUpload">Event Image *</label>
            <input
                style={styles.input}
                type="file"
                id="imageUpload"
                name="imageUpload"
                accept="image/*"
                onChange={handleImageChange}
                required
                aria-required="true"
            />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="description">Description *</label>
          <textarea
            style={styles.textarea}
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            placeholder="Provide a detailed description of the event..."
            aria-required="true"
          />
        </div>

        <button
          type="submit"
          style={{
            ...styles.buttonBase,
            ...styles.btnPrimary,
            ...(loading || !user || !isFormValid() ? styles.disabledButton : {}),
            width: '100%',
            marginTop: '10px',
          }}
          disabled={loading || !user || !isFormValid()}
        >
          {loading ? "Adding..." : "Add Event"}
        </button>
        {!user && <p style={{ color: 'var(--danger-color)', marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>Please login to add events.</p>}
        {user && !isFormValid() && <p style={{ color: 'var(--danger-color)', marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>Please fill all required fields.</p>}
      </form>
    </section>
  );
}

export default function EventListingApp() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    date: "",
    state: "",
    city: "",
    country: "",
    description: "",
    contact: "",
    category: "",
    imageUrl: "",
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    setGlobalCssVariables();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setEvents(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });
    return () => unsub();
  }, []);

  async function handleLogin() {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert("Login failed: " + error.message);
      console.error("Login error:", error);
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (error) {
      alert("Logout failed: " + error.message);
      console.error("Logout error:", error);
    }
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleImageChange(e) {
    setImageFile(e.target.files[0]);
  }

  async function uploadImage() {
    if (!imageFile) return null;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      setLoading(false);
      return data.secure_url;
    } catch (error) {
      setLoading(false);
      console.error("Image upload failed:", error);
      alert("Failed to upload image. Please try again.");
      return null;
    }
  }

  async function handleAddEvent(e) {
    e.preventDefault();
    if (!user) {
      alert("Please login to add an event.");
      return;
    }

    if (
      !form.title.trim() ||
      !form.date.trim() ||
      !form.category.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.country.trim() ||
      !form.contact.trim() ||
      !form.description.trim() ||
      !imageFile
    ) {
      alert("All fields are compulsory. Please fill them out.");
      setLoading(false);
      return;
    }

    setLoading(true);
    let imageUrl = "";
    if (imageFile) {
      imageUrl = await uploadImage();
      if (!imageUrl) {
        setLoading(false);
        return;
      }
    }

    const locationString = [form.city, form.state, form.country]
      .filter(Boolean)
      .join(", ");
    
    const eventSlug = generateSlug(form.title);

    try {
      const coords = await geocodeAddress(locationString);
      await addDoc(collection(db, "events"), {
        title: form.title.trim(),
        date: form.date,
        state: form.state.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        contact: form.contact.trim(),
        description: form.description.trim(),
        category: form.category,
        imageUrl: imageUrl,
        coords,
        slug: eventSlug,
        interestedUsers: [],
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: new Date().toISOString(),
      });
      setForm({
        title: "",
        date: "",
        state: "",
        city: "",
        country: "",
        description: "",
        contact: "",
        category: "",
        imageUrl: "",
      });
      setImageFile(null);
      alert("Event added successfully!");
    } catch (error) {
      alert("Failed to add event: " + error.message);
      console.error("Add event error:", error);
    }
    setLoading(false);
  }

  async function toggleInterest(event) {
    if (!user) {
      alert("Please login to show interest.");
      return;
    }
    setLoading(true);
    const eventRef = doc(db, "events", event.id);
    const isInterested = event.interestedUsers?.includes(user.uid);

    try {
      await updateDoc(eventRef, {
        interestedUsers: isInterested
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid),
      });
    } catch (error) {
      alert("Failed to update interest: " + error.message);
      console.error("Toggle interest error:", error);
    } finally {
        setLoading(false);
    }
  }

  return (
    <HelmetProvider>
      <Router>
        <TopNavigation user={user} handleLogin={handleLogin} handleLogout={handleLogout} />

        <div style={styles.container}>
          <div style={styles.mainContentArea}>
            <Routes>
              <Route
                path="/"
                element={
                  <EventListingPage
                    user={user}
                    events={events}
                    loading={loading}
                    toggleInterest={toggleInterest}
                  />
                }
              />
              <Route
                path="/events/:slug/:id"
                element={<EventDetailPage user={user} toggleInterest={toggleInterest} />}
              />
              <Route
                path="/add-event"
                element={
                  <AddEventForm
                    user={user}
                    handleAddEvent={handleAddEvent}
                    form={form}
                    handleChange={handleChange}
                    imageFile={imageFile}
                    handleImageChange={handleImageChange}
                    loading={loading}
                  />
                }
              />
              <Route path="*" element={<div style={{ textAlign: 'center', fontSize: '24px', padding: '50px', color: 'var(--danger-color)' }}>404 - Page Not Found</div>} />
            </Routes>
          </div>
          <footer style={styles.footer}>
            <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Listeve. All rights reserved.</p>
            <p style={{ margin: '5px 0 0 0' }}>
              <Link to="/privacy" style={{ color: 'var(--secondary-color)', textDecoration: 'none', marginRight: '10px' }}>Privacy Policy</Link>
              <Link to="/terms" style={{ color: 'var(--secondary-color)', textDecoration: 'none' }}>Terms of Service</Link>
            </p>
          </footer>
        </div>
      </Router>
    </HelmetProvider>
  );
} 
