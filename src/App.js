import React, { useState, useEffect } from "react";
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

// Your Firebase Config (keep it as is)
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

const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset_1";
const CLOUDINARY_CLOUD_NAME = "dyrmi2zkl";

async function geocodeAddress(address) {
  if (!address) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    address
  )}`;
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

// --- UPDATED STYLES ---
const styles = {
  // Color Palette inspired by modern, clean UIs (like BookMyShow's understated palette)
  // Primary Blue for actions/highlights
  primaryColor: '#e50914', // A bold, attention-grabbing red, similar to BMS's
  primaryDark: '#b2070f',
  // Secondary color for accents or less critical buttons
  secondaryColor: '#007bff',
  secondaryDark: '#0056b3',
  // Neutrals for background, text, borders
  backgroundColor: '#f5f5f5', // Light grey background
  cardBackground: '#ffffff', // White cards
  textColor: '#333333', // Dark text for readability
  lightTextColor: '#666666', // Lighter text for descriptions/details
  borderColor: '#e0e0e0', // Subtle border color

  // Typography
  fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif", // Modern, readable font
  headerFontFamily: "'Montserrat', sans-serif", // More impactful font for headings

  container: {
    maxWidth: 1200, // Slightly wider container
    margin: "40px auto",
    fontFamily: "var(--fontFamily)",
    color: "var(--textColor)",
    padding: 20,
    backgroundColor: "var(--backgroundColor)",
    borderRadius: 16, // More rounded corners
    boxShadow: "0 8px 30px rgba(0,0,0,0.1)", // More pronounced shadow
  },
  header: {
    textAlign: "center",
    marginBottom: 40,
    fontSize: 48, // Larger header
    fontWeight: "800", // Bolder
    color: "var(--primaryColor)", // Primary color for header
    letterSpacing: "1.5px",
    textShadow: "2px 2px 4px rgba(0,0,0,0.08)",
    fontFamily: "var(--headerFontFamily)",
  },
  authBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    padding: "20px 30px",
    backgroundColor: "var(--cardBackground)",
    borderRadius: 12,
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },
  button: {
    padding: "14px 28px", // Larger buttons
    fontSize: 17,
    borderRadius: 10, // More rounded
    cursor: "pointer",
    border: "none",
    fontWeight: "700",
    transition: "all 0.3s ease", // Smooth transitions for all properties
    "&:hover": {
      transform: "translateY(-3px)", // More noticeable lift on hover
      boxShadow: "0 6px 15px rgba(0,0,0,0.15)",
    },
    "&:active": {
      transform: "translateY(0)", // Press down effect
      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    }
  },
  btnPrimary: {
    backgroundColor: "var(--primaryColor)",
    color: "white",
    "&:hover": {
      backgroundColor: "var(--primaryDark)",
    },
  },
  btnSecondary: { // Added a secondary button style
    backgroundColor: "var(--secondaryColor)",
    color: "white",
    "&:hover": {
      backgroundColor: "var(--secondaryDark)",
    },
  },
  btnDanger: {
    backgroundColor: "#dc3545",
    color: "white",
    "&:hover": {
      backgroundColor: "#c82333",
    },
  },
  btnSuccess: {
    backgroundColor: "#28a745",
    color: "white",
    "&:hover": {
      backgroundColor: "#218838",
    },
  },
  searchInput: {
    width: "100%",
    padding: "16px", // Larger padding
    fontSize: 18,
    borderRadius: 12,
    border: "1px solid var(--borderColor)",
    outline: "none",
    marginBottom: 25,
    boxSizing: "border-box",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    "&:focus": {
      borderColor: "var(--primaryColor)",
      boxShadow: "0 0 0 0.3rem rgba(229,9,20,.15)", // Primary color focus shadow
    },
  },
  categoryFilter: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 15, // Increased gap
    marginBottom: 40,
  },
  categoryButton: {
    padding: "12px 25px",
    fontSize: 16,
    borderRadius: 30, // More pill-shaped
    border: `1px solid var(--primaryColor)`,
    backgroundColor: "var(--cardBackground)",
    color: "var(--primaryColor)",
    cursor: "pointer",
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: "var(--primaryColor)",
      color: "white",
      transform: "translateY(-2px)",
      boxShadow: "0 3px 10px rgba(0,123,255,0.2)",
    },
  },
  categoryButtonActive: {
    backgroundColor: "var(--primaryColor)",
    color: "white",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(229,9,20,0.25)",
  },
  eventList: {
    listStyle: "none",
    paddingLeft: 0,
    marginBottom: 40,
    display: 'grid', // Use CSS Grid for a modern layout
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // Responsive grid
    gap: 30, // Gap between cards
  },
  eventItem: {
    backgroundColor: "var(--cardBackground)",
    borderRadius: 16,
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
    overflow: 'hidden', // Ensures rounded corners clip images
    display: "flex",
    flexDirection: "column", // Stack image and content vertically
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    "&:hover": {
      transform: "translateY(-5px)", // More lift
      boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
    },
  },
  eventImage: {
    width: "100%",
    height: 200, // Fixed height for consistency
    objectFit: "cover",
    borderRadius: "16px 16px 0 0", // Rounded top corners
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  eventContent: {
    padding: 20, // Increased padding
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1, // Allow content to grow and push interested section down
  },
  eventTitle: {
    fontSize: 22, // Slightly smaller for card, but still prominent
    marginBottom: 10,
    color: "var(--textColor)",
    fontWeight: "700",
    lineHeight: 1.3,
    minHeight: '2.6em', // Ensure consistent height for titles across cards
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  eventDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 8, // More spacing for details
    marginBottom: 15,
    fontSize: 15,
    color: "var(--lightTextColor)",
  },
  eventDetailLine: { // Generic style for detail lines
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: '500',
  },
  eventIcon: { // Placeholder for icons
    fontSize: 18,
    color: "var(--primaryColor)",
  },
  eventDesc: {
    marginTop: 5,
    fontSize: 15,
    color: "var(--lightTextColor)",
    lineHeight: 1.6,
    marginBottom: 15,
    minHeight: '4.8em', // Consistent height for descriptions
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  },
  eventContact: {
    fontSize: 14,
    color: "var(--lightTextColor)",
    marginTop: 5,
    fontWeight: "500",
  },
  interestedSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between', // Push button to left, count to right
    marginTop: 'auto', // Push to bottom of flex column
    paddingTop: 15,
    borderTop: `1px solid var(--borderColor)`, // Separator line
    margin: '10px -20px -20px -20px', // Adjust margins to align with card padding
    padding: '15px 20px 20px 20px', // Adjust padding for the section
  },
  interestedBtn: {
    padding: "10px 18px",
    borderRadius: 8,
    fontWeight: "600",
    cursor: "pointer",
    border: "none",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-1px)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
  },
  interestedCount: {
    marginLeft: 12,
    fontSize: 15,
    color: "var(--lightTextColor)",
    fontWeight: "500",
  },
  formContainer: {
    backgroundColor: "var(--cardBackground)",
    padding: 40, // More padding
    borderRadius: 16,
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  },
  formTitle: {
    fontSize: 32, // Larger form title
    marginBottom: 35,
    color: "var(--textColor)",
    fontWeight: "700",
    textAlign: "center",
    fontFamily: "var(--headerFontFamily)",
  },
  formGroup: {
    marginBottom: 25,
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: 10,
    fontWeight: "600",
    fontSize: 16,
    color: "var(--textColor)",
  },
  input: {
    padding: 14,
    fontSize: 16,
    borderRadius: 8,
    border: "1px solid var(--borderColor)",
    outline: "none",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    "&:focus": {
      borderColor: "var(--primaryColor)",
      boxShadow: "0 0 0 0.25rem rgba(229,9,20,.15)",
    },
  },
  textarea: {
    padding: 14,
    fontSize: 16,
    borderRadius: 8,
    border: "1px solid var(--borderColor)",
    outline: "none",
    resize: "vertical",
    minHeight: 120,
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    "&:focus": {
      borderColor: "var(--primaryColor)",
      boxShadow: "0 0 0 0.25rem rgba(229,9,20,.15)",
    },
  },
  select: {
    padding: 14,
    fontSize: 16,
    borderRadius: 8,
    border: "1px solid var(--borderColor)",
    outline: "none",
    backgroundColor: "white",
    cursor: "pointer",
    transition: "border-color 0.3s ease",
    "&:focus": {
      borderColor: "var(--primaryColor)",
      boxShadow: "0 0 0 0.25rem rgba(229,9,20,.15)",
    },
  },
  disabledButton: {
    opacity: 0.6, // Slightly more opaque for disabled
    cursor: "not-allowed",
  },
  backButton: {
    display: 'inline-block',
    margin: '25px 0',
    padding: '12px 22px',
    backgroundColor: '#6c757d',
    color: 'white',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease, transform 0.2s ease',
    "&:hover": {
        backgroundColor: '#5a6268',
        transform: 'translateY(-1px)',
    }
  },
  detailContainer: {
    backgroundColor: "var(--cardBackground)",
    padding: 40,
    borderRadius: 16,
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
    marginTop: 25,
  },
  detailImage: {
    width: '100%',
    maxHeight: 500, // Larger image for details
    objectFit: 'cover',
    borderRadius: 12,
    marginBottom: 30,
    boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
  },
  detailTitle: {
    fontSize: 40, // Larger detail title
    color: "var(--textColor)",
    marginBottom: 20,
    fontWeight: "800",
    fontFamily: "var(--headerFontFamily)",
  },
  detailInfo: {
    fontSize: 18,
    color: "var(--lightTextColor)",
    marginBottom: 10,
    lineHeight: 1.6,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  detailDescription: {
    fontSize: 17,
    lineHeight: 1.8, // Increased line height for readability
    color: "var(--textColor)",
    marginTop: 30,
    marginBottom: 30,
    whiteSpace: 'pre-wrap', // Preserve newlines
  },
  footer: {
    textAlign: 'center',
    marginTop: 40,
    padding: '25px 0',
    borderTop: `1px solid var(--borderColor)`,
    backgroundColor: 'var(--cardBackground)',
    borderRadius: '0 0 16px 16px',
    fontSize: 14,
    color: 'var(--lightTextColor)',
  },
  // Responsive Adjustments (Media Queries within JSX are tricky, often done in external CSS or styled-components)
  // For simplicity here, we'll use inline style adjustments for key elements that need it
  // In a real app, use a CSS-in-JS library like styled-components or a global CSS file.
  responsiveEventList: {
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr', // Stack cards on smaller screens
    }
  },
  responsiveHeader: {
    '@media (max-width: 600px)': {
      fontSize: 36,
      marginBottom: 30,
    }
  },
  responsiveAuthBar: {
    '@media (max-width: 600px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
      padding: '15px 20px',
      gap: 15,
    },
    '@media (max-width: 600px) and (min-width: 320px)': {
        '> div:last-child': { // Target the button container
            width: '100%', // Make buttons full width
            flexDirection: 'column',
            gap: 10,
        },
        'button, a': { // Target buttons and links within AuthBar
            width: '100%',
            textAlign: 'center',
        }
    }
  },
  responsiveDetailTitle: {
    '@media (max-width: 600px)': {
      fontSize: 32,
    }
  }
};

// Applying CSS variables for easier theming
const rootStyles = document.documentElement.style;
rootStyles.setProperty('--primaryColor', styles.primaryColor);
rootStyles.setProperty('--primaryDark', styles.primaryDark);
rootStyles.setProperty('--secondaryColor', styles.secondaryColor);
rootStyles.setProperty('--secondaryDark', styles.secondaryDark);
rootStyles.setProperty('--backgroundColor', styles.backgroundColor);
rootStyles.setProperty('--cardBackground', styles.cardBackground);
rootStyles.setProperty('--textColor', styles.textColor);
rootStyles.setProperty('--lightTextColor', styles.lightTextColor);
rootStyles.setProperty('--borderColor', styles.borderColor);
rootStyles.setProperty('--fontFamily', styles.fontFamily);
rootStyles.setProperty('--headerFontFamily', styles.headerFontFamily);


// --- COMPONENTS WITH REVISED STYLES AND STRUCTURE ---

function AuthBar({ user, handleLogin, handleLogout }) {
    // Add a state for small screen to apply dynamic styles
    const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 600);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

  return (
    <header style={{ ...styles.authBar, ...(isMobile ? styles.responsiveAuthBar : {}) }}>
      {user ? (
        <>
          <div style={{ fontSize: 16, color: 'var(--textColor)', fontWeight: '500' }}>
            Welcome, <strong>{user.displayName}</strong>
          </div>
          <div style={{ display: 'flex', gap: 15, alignItems: 'center', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-end' }}>
            <Link to="/add-event" style={{ ...styles.button, ...styles.btnSuccess }}>
              + Add New Event
            </Link>
            <button style={{ ...styles.button, ...styles.btnDanger }} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', gap: 15, alignItems: 'center', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-end' }}>
          <Link to="/add-event" style={{ ...styles.button, ...styles.btnSecondary }}> {/* Changed to secondary for 'Add Event' when not logged in */}
            Add Event
          </Link>
          <button style={{ ...styles.button, ...styles.btnPrimary }} onClick={handleLogin}>
            Login
          </button>
        </div>
      )}
    </header>
  );
}


function EventListingPage({ user, events, loading, toggleInterest }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = ["All", "Music", "Sports", "Art", "Tech", "Food", "Other"];

  const filteredEvents = events
    .filter((event) => {
      const lowerSearch = search.toLowerCase();
      const matchesSearch =
        event.title.toLowerCase().includes(lowerSearch) ||
        (event.city?.toLowerCase().includes(lowerSearch) ?? false) ||
        (event.state?.toLowerCase().includes(lowerSearch) ?? false) ||
        (event.country?.toLowerCase().includes(lowerSearch) ?? false) ||
        (event.description?.toLowerCase().includes(lowerSearch) ?? false); // Search description too

      const matchesCategory =
        selectedCategory === "All" || event.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <main>
      <Helmet>
        <title>Listeve - Discover & List Events in India</title>
        <meta name="description" content="Discover and list upcoming events in India, including music concerts, sports, tech meetups, art exhibitions, food festivals, and more. Find local events near you!" />
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
        <h2 style={{ ...styles.formTitle, marginTop: 0, marginBottom: 30 }}>Upcoming Events</h2>
        <ul style={{ ...styles.eventList, ...styles.responsiveEventList }}>
          {filteredEvents.length === 0 && (
            <li style={{ textAlign: "center", color: "var(--lightTextColor)", fontSize: 18, padding: 30, backgroundColor: 'var(--cardBackground)', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', gridColumn: '1 / -1' }}>
              No events found matching your criteria. Try adjusting your search or filters.
            </li>
          )}

          {filteredEvents.map((event) => {
            const interestedCount = event.interestedUsers?.length || 0;
            const isInterested = user ? event.interestedUsers?.includes(user.uid) : false;
            return (
              <li key={event.id} style={styles.eventItem}>
                <Link to={`/events/${event.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
                    {/* Contact is better on detail page for privacy and space */}
                    {/* {event.contact && (
                      <p style={styles.eventContact}>Contact: <a href={`mailto:${event.contact}`} style={{ color: 'inherit', textDecoration: 'none' }}>{event.contact}</a></p>
                    )} */}
                  </article>
                </Link>
                <div style={styles.interestedSection}>
                  <button
                    style={{
                      ...styles.interestedBtn,
                      backgroundColor: isInterested ? "var(--primaryColor)" : "var(--secondaryColor)", // Use primary for interested, secondary for show interest
                      color: "white",
                      ...(loading ? styles.disabledButton : {}),
                    }}
                    onClick={(e) => { e.stopPropagation(); toggleInterest(event); }} // Stop propagation to prevent link click
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
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchEvent() {
      if (!id) return;
      setLoadingEvent(true);
      try {
        const eventRef = doc(db, "events", id);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          setEvent({ id: eventSnap.id, ...eventSnap.data() });
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
  }, [id, navigate]);

  if (loadingEvent) {
    return <div style={{ textAlign: 'center', fontSize: 20, padding: 50, color: 'var(--lightTextColor)' }}>Loading event details...</div>;
  }

  if (!event) {
    return <div style={{ textAlign: 'center', fontSize: 20, padding: 50, color: '#dc3545' }}>Event not found.</div>;
  }

  const interestedCount = event.interestedUsers?.length || 0;
  const isInterested = user ? event.interestedUsers?.includes(user.uid) : false;

  const eventDateFormatted = new Date(event.date).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const locationString = [event.city, event.state, event.country].filter(Boolean).join(", ");
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
    "url": window.location.href
  };

  return (
    <article style={styles.detailContainer}>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={window.location.href} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={event.imageUrl || 'URL_TO_DEFAULT_EVENT_IMAGE.jpg'} />
        <meta property="og:url" content={window.location.href} />
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
          alt={`${event.title} event in ${locationString}`}
          title={`Click to view ${event.title}`}
          style={styles.detailImage}
        />
      )}
      <h1 style={{ ...styles.detailTitle, ...(window.innerWidth < 600 ? styles.responsiveDetailTitle : {}) }}>{event.title}</h1>
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
            backgroundColor: isInterested ? "var(--primaryColor)" : "var(--secondaryColor)",
            color: "white",
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
  const categories = ["Select Category", "Music", "Sports", "Art", "Tech", "Food", "Other"]; // Changed "All" to "Select Category" for a form

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
          <label style={styles.label} htmlFor="city">City</label>
          <input
            style={styles.input}
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="e.g., Mumbai"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="state">State</label>
          <input
            style={styles.input}
            id="state"
            name="state"
            value={form.state}
            onChange={handleChange}
            placeholder="e.g., Maharashtra"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="country">Country</label>
          <input
            style={styles.input}
            id="country"
            name="country"
            value={form.country}
            onChange={handleChange}
            placeholder="e.g., India"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="contact">Contact Info</label>
          <input
            style={styles.input}
            id="contact"
            name="contact"
            value={form.contact}
            onChange={handleChange}
            placeholder="e.g., email@example.com or phone number"
            type="email"
          />
        </div>

        <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="imageUpload">Event Image (Optional)</label>
            <input
                style={styles.input}
                type="file"
                id="imageUpload"
                name="imageUpload"
                accept="image/*"
                onChange={handleImageChange}
            />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="description">Description</label>
          <textarea
            style={styles.textarea}
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Provide a detailed description of the event..."
          />
        </div>

        <button
          type="submit"
          style={{
            ...styles.button,
            ...styles.btnPrimary, // Primary color for submit
            ...(loading || !user ? styles.disabledButton : {}),
            width: '100%',
            marginTop: 10,
          }}
          disabled={loading || !user}
        >
          {loading ? "Adding..." : "Add Event"}
        </button>
        {!user && <p style={{ color: '#dc3545', marginTop: 15, textAlign: 'center', fontSize: 14 }}>Please login to add events.</p>}
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
    category: "", // Initialize as empty for "Select Category"
    imageUrl: "",
  });
  const [imageFile, setImageFile] = useState(null);

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
    if (!form.title.trim() || !form.date.trim() || !form.category.trim()) {
      alert("Please fill in at least Title, Date, and Category.");
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
        category: "", // Reset to empty for "Select Category"
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
        <div style={styles.container}>
          <h1 style={{ ...styles.header, ...(window.innerWidth < 600 ? styles.responsiveHeader : {}) }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              Listeve
            </Link>
          </h1>

          <AuthBar user={user} handleLogin={handleLogin} handleLogout={handleLogout} />

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
              path="/events/:id"
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
            <Route path="*" element={<div style={{ textAlign: 'center', fontSize: 24, padding: 50, color: '#dc3545' }}>404 - Page Not Found</div>} />
          </Routes>

          <footer style={styles.footer}>
            <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Listeve. All rights reserved.</p>
            <p style={{ margin: '5px 0 0 0' }}>
              <Link to="/privacy" style={{ color: 'var(--secondaryColor)', textDecoration: 'none', marginRight: 10 }}>Privacy Policy</Link>
              <Link to="/terms" style={{ color: 'var(--secondaryColor)', textDecoration: 'none' }}>Terms of Service</Link>
            </p>
          </footer>
        </div>
      </Router>
    </HelmetProvider>
  );
}
