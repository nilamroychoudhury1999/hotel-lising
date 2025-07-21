import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { FaBed, FaBath, FaHeart, FaStar, FaSearch, FaMapMarkerAlt, FaUser, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import logo from "./IMG-20250719-WA0043.jpg";

// Firebase configuration
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
const provider = new GoogleAuthProvider();

// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset_1";
const CLOUDINARY_CLOUD_NAME = "dyrmi2zkl";

// Complete list of Guwahati areas
const GUWAHATI_AREAS = [
  "Paltan Bazaar", "Fancy Bazaar", "Uzan Bazaar", "Pan Bazaar",
  "Lachit Nagar", "Dispur", "Beltola", "Ganeshguri", "Six Mile",
  "Kahilipara", "Zoo Road", "Maligaon", "Chandmari", "Silpukhuri",
  "Geetanagar", "Hengrabari", "Bhangagarh", "Ulubari", "Rehabari",
  "Birubari", "Noonmati", "Lokhra", "Bhetapara", "Bamunimaidan",
  "Jalukbari", "North Guwahati", "Amingaon", "Azara", "VIP Road",
  "GS Road", "RG Baruah Road", "AT Road", "Bharalumukh", "Lakhra",
  "Bamunimaidam", "Christian Basti", "Survey", "Binova Nagar",
  "Rajgarh", "Khanapara", "Jayanagar", "Tarun Nagar", "Anil Nagar",
  "Sarusajai", "Bora Service", "Gotanagar", "Nabin Nagar"
];

const styles = {
  container: {
    maxWidth: 1400,
    margin: "0 auto",
    padding: "0 20px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: "20px 0",
    marginBottom: 20,
    borderBottom: "1px solid #e0e0e0"
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 15
  },
  logo: {
    height: 50,
    borderRadius: 8
  },
  headerTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: "#ff385c",
    letterSpacing: "-0.5px"
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 25
  },
  navLink: {
    color: "#222",
    textDecoration: "none",
    fontWeight: 500,
    fontSize: 16,
    padding: "8px 12px",
    borderRadius: 30,
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#f7f7f7"
    }
  },
  authBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 25px",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 30,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    border: "1px solid #e0e0e0"
  },
  button: {
    padding: "12px 20px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 15,
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  btnPrimary: {
    backgroundColor: "#ff385c",
    color: "white",
    ":hover": {
      backgroundColor: "#e61e4d"
    }
  },
  btnOutline: {
    backgroundColor: "transparent",
    border: "1px solid #dddddd",
    color: "#222",
    ":hover": {
      backgroundColor: "#f7f7f7"
    }
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    padding: "0 15px",
    height: 60,
    borderRadius: 30,
    border: "1px solid #dddddd",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    marginBottom: 30,
    ":hover": {
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }
  },
  searchInput: {
    flex: 1,
    padding: "0 15px",
    height: "100%",
    border: "none",
    fontSize: 16,
    outline: "none",
    fontWeight: 500
  },
  searchButton: {
    backgroundColor: "#ff385c",
    color: "white",
    borderRadius: "50%",
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: "none",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#e61e4d"
    }
  },
  homestayList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 30,
    padding: 0,
    margin: "30px 0"
  },
  homestayItem: {
    position: "relative",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    ":hover": {
      transform: "translateY(-5px)",
      boxShadow: "0 12px 24px rgba(0,0,0,0.12)"
    }
  },
  homestayImage: {
    width: "100%",
    height: 240,
    objectFit: "cover",
    borderBottom: "1px solid #f0f0f0"
  },
  favoriteIcon: {
    position: "absolute",
    top: 15,
    right: 15,
    color: "white",
    fontSize: 20,
    cursor: "pointer",
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
  },
  homestayInfo: {
    padding: 20
  },
  homestayTitle: {
    margin: "0 0 10px",
    fontSize: 18,
    fontWeight: 600,
    color: "#222",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  homestayLocation: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    color: "#717171",
    fontSize: 14,
    marginBottom: 12
  },
  homestayFeatures: {
    display: "flex",
    gap: 15,
    marginBottom: 15,
    color: "#717171",
    fontSize: 14
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: 4
  },
  homestayFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #f0f0f0",
    paddingTop: 15,
    marginTop: 15
  },
  homestayPrice: {
    fontWeight: 600,
    fontSize: 18,
    color: "#222"
  },
  pricePerNight: {
    fontWeight: 400,
    fontSize: 14,
    color: "#717171"
  },
  filterContainer: {
    display: "flex",
    gap: 15,
    marginBottom: 30,
    overflowX: "auto",
    padding: "10px 0",
    scrollbarWidth: "none",
    "::-webkit-scrollbar": {
      display: "none"
    }
  },
  filterButton: {
    padding: "10px 20px",
    borderRadius: 30,
    border: "1px solid #dddddd",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    whiteSpace: "nowrap",
    transition: "all 0.2s ease"
  },
  activeFilter: {
    backgroundColor: "#f7f7f7",
    borderColor: "#222",
    fontWeight: 600
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    objectFit: "cover",
    marginTop: 15
  },
  errorText: {
    color: "#ff385c",
    marginTop: 5,
    fontSize: 14
  },
  formContainer: {
    maxWidth: 700,
    margin: "0 auto",
    padding: "30px 0"
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 30,
    color: "#222"
  },
  formGroup: {
    marginBottom: 25
  },
  formLabel: {
    display: "block",
    marginBottom: 10,
    fontWeight: 500,
    color: "#222",
    fontSize: 16
  },
  formInput: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid #dddddd",
    fontSize: 16,
    transition: "border 0.2s ease",
    ":focus": {
      outline: "none",
      borderColor: "#ff385c",
      boxShadow: "0 0 0 2px rgba(255, 56, 92, 0.2)"
    }
  },
  formSelect: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid #dddddd",
    fontSize: 16,
    backgroundColor: "white",
    appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 16px center",
    backgroundSize: "18px",
    ":focus": {
      outline: "none",
      borderColor: "#ff385c",
      boxShadow: "0 0 0 2px rgba(255, 56, 92, 0.2)"
    }
  },
  checkboxContainer: {
    display: "flex",
    gap: 20,
    marginBottom: 25
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 500,
    cursor: "pointer",
    userSelect: "none"
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    border: "1px solid #dddddd",
    position: "relative",
    ":after": {
      content: "''",
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: 10,
      height: 10,
      backgroundColor: "#ff385c",
      borderRadius: 2,
      display: "none"
    }
  },
  checkboxInput: {
    display: "none",
    ":checked + $checkbox": {
      ":after": {
        display: "block"
      }
    }
  },
  detailContainer: {
    maxWidth: 1000,
    margin: "0 auto",
    padding: "30px 0"
  },
  detailHeader: {
    marginBottom: 20
  },
  detailTitle: {
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 10,
    color: "#222"
  },
  detailSubtitle: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#717171",
    marginBottom: 25
  },
  detailImage: {
    width: "100%",
    height: 500,
    borderRadius: 16,
    objectFit: "cover",
    marginBottom: 30
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 40
  },
  detailInfo: {
    padding: "30px 0"
  },
  detailSection: {
    marginBottom: 40
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 20,
    color: "#222"
  },
  detailFeatures: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 20
  },
  featureCard: {
    display: "flex",
    alignItems: "center",
    gap: 12
  },
  featureIcon: {
    fontSize: 20,
    color: "#ff385c"
  },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
    border: "1px solid #e0e0e0",
    position: "sticky",
    top: 20
  },
  bookingPrice: {
    fontSize: 26,
    fontWeight: 600,
    color: "#222",
    marginBottom: 5
  },
  bookingPerNight: {
    fontSize: 16,
    color: "#717171",
    marginBottom: 25
  },
  bookingButton: {
    width: "100%",
    padding: 16,
    backgroundColor: "#ff385c",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    ":hover": {
      backgroundColor: "#e61e4d"
    }
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#222",
    textDecoration: "none",
    fontWeight: 500,
    marginBottom: 30,
    fontSize: 16,
    ":hover": {
      textDecoration: "underline"
    }
  },
  emptyState: {
    textAlign: "center",
    padding: 60,
    margin: "50px 0"
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 15,
    color: "#222"
  },
  emptyText: {
    color: "#717171",
    maxWidth: 500,
    margin: "0 auto 30px",
    lineHeight: 1.6
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    backgroundColor: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    color: "#ff385c"
  }
};

function AuthBar({ user, handleLogin, handleLogout }) {
  return (
    <div style={styles.authBar}>
      {user ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link to="/add-homestay" style={{ ...styles.button, ...styles.btnOutline }}>
              <span>Add Homestay</span>
            </Link>
            <div style={{ ...styles.userAvatar }}>
              {user.displayName ? user.displayName.charAt(0) : "U"}
            </div>
          </div>
          <button style={{ ...styles.button, ...styles.btnOutline }} onClick={handleLogout}>
            Logout
          </button>
        </>
      ) : (
        <button style={{ ...styles.button, ...styles.btnPrimary }} onClick={handleLogin}>
          <FaUser /> Login
        </button>
      )}
    </div>
  );
}

function HomestayListing({ homestays }) {
  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState("All");
  const [coupleFriendlyOnly, setCoupleFriendlyOnly] = useState(false);
  const [hourlyOnly, setHourlyOnly] = useState(false);
  const [favorites, setFavorites] = useState({});

  const toggleFavorite = (id) => {
    setFavorites(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredHomestays = homestays.filter(homestay => {
    const matchesSearch =
      homestay.name.toLowerCase().includes(search.toLowerCase()) ||
      homestay.city.toLowerCase().includes(search.toLowerCase());

    const matchesArea =
      selectedArea === "All" ||
      homestay.city === selectedArea;

    const matchesCoupleFriendly =
      !coupleFriendlyOnly || homestay.coupleFriendly;

    const matchesHourly =
      !hourlyOnly || homestay.hourly;

    return matchesSearch && matchesArea && matchesCoupleFriendly && matchesHourly;
  });

  return (
    <div>
      <div style={styles.searchBar}>
        <FaSearch style={{ color: "#717171", fontSize: 18 }} />
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search homestays by name or area..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button style={styles.searchButton}>
          <FaSearch />
        </button>
      </div>

      <div style={styles.filterContainer}>
        <button
          style={{
            ...styles.filterButton,
            ...(selectedArea === "All" ? styles.activeFilter : {})
          }}
          onClick={() => setSelectedArea("All")}
        >
          All Areas
        </button>
        
        {GUWAHATI_AREAS.slice(0, 10).map(area => (
          <button
            key={area}
            style={{
              ...styles.filterButton,
              ...(selectedArea === area ? styles.activeFilter : {})
            }}
            onClick={() => setSelectedArea(area)}
          >
            {area}
          </button>
        ))}

        <button
          style={{
            ...styles.filterButton,
            ...(coupleFriendlyOnly ? styles.activeFilter : {})
          }}
          onClick={() => setCoupleFriendlyOnly(!coupleFriendlyOnly)}
        >
          Couple Friendly
        </button>
        <button
          style={{
            ...styles.filterButton,
            ...(hourlyOnly ? styles.activeFilter : {})
          }}
          onClick={() => setHourlyOnly(!hourlyOnly)}
        >
          Hourly Stays
        </button>
      </div>

      {filteredHomestays.length === 0 ? (
        <div style={styles.emptyState}>
          <h3 style={styles.emptyTitle}>No homestays found</h3>
          <p style={styles.emptyText}>Try adjusting your search filters or check back later for new listings.</p>
          <button 
            style={{ ...styles.button, ...styles.btnOutline }}
            onClick={() => {
              setSelectedArea("All");
              setCoupleFriendlyOnly(false);
              setHourlyOnly(false);
              setSearch("");
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <ul style={styles.homestayList}>
          {filteredHomestays.map(homestay => (
            <li key={homestay.id} style={styles.homestayItem}>
              <Link to={`/homestays/${homestay.id}`}>
                {homestay.imageUrl ? (
                  <img
                    src={homestay.imageUrl}
                    alt={homestay.name}
                    style={styles.homestayImage}
                  />
                ) : (
                  <div style={{...styles.homestayImage, backgroundColor: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#717171"}}>
                    No Image
                  </div>
                )}
              </Link>
              <FaHeart 
                style={{...styles.favoriteIcon, color: favorites[homestay.id] ? "#ff385c" : "white"}} 
                onClick={() => toggleFavorite(homestay.id)}
              />
              <div style={styles.homestayInfo}>
                <Link to={`/homestays/${homestay.id}`} style={{ textDecoration: "none" }}>
                  <h3 style={styles.homestayTitle}>{homestay.name}</h3>
                </Link>
                <div style={styles.homestayLocation}>
                  <FaMapMarkerAlt style={{ fontSize: 14 }} />
                  <span>{homestay.city}</span>
                </div>
                <div style={styles.homestayFeatures}>
                  <div style={styles.featureItem}>
                    <FaBed /> 
                    <span>2 beds</span>
                  </div>
                  <div style={styles.featureItem}>
                    <FaBath /> 
                    <span>1 bath</span>
                  </div>
                </div>
                <div style={styles.homestayFooter}>
                  <div>
                    <div style={styles.homestayPrice}>₹{homestay.price}</div>
                    <div style={styles.pricePerNight}>per night</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <FaStar style={{ color: "#ff385c" }} />
                    <span>4.8</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddHomestayForm({ user, form, setForm, handleSubmit, loading, handleImageChange, imageError }) {
  return (
    <div style={styles.formContainer}>
      <h2 style={styles.formTitle}>Add New Homestay</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Homestay Name *</label>
          <input
            style={styles.formInput}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Price (₹ per night) *</label>
          <input
            style={styles.formInput}
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Area in Guwahati *</label>
          <select
            style={styles.formSelect}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
          >
            <option value="">Select Area</option>
            {GUWAHATI_AREAS.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Phone Number *</label>
          <input
            style={styles.formInput}
            type="tel"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            required
            pattern="[0-9]{10}"
            title="10 digit phone number"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Homestay Image (Max 1MB) *</label>
          <input
            style={styles.formInput}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
          {imageError && <p style={styles.errorText}>{imageError}</p>}
          {form.imagePreview && (
            <img
              src={form.imagePreview}
              alt="Preview"
              style={styles.imagePreview}
            />
          )}
        </div>

        <div style={styles.checkboxContainer}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.coupleFriendly}
              onChange={(e) => setForm({ ...form, coupleFriendly: e.target.checked })}
              style={styles.checkboxInput}
            />
            <div style={styles.checkbox}></div>
            Couple Friendly
          </label>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.hourly}
              onChange={(e) => setForm({ ...form, hourly: e.target.checked })}
              style={styles.checkboxInput}
            />
            <div style={styles.checkbox}></div>
            Hourly Stays
          </label>
        </div>

        <button
          type="submit"
          style={{ ...styles.button, ...styles.btnPrimary }}
          disabled={loading || !user || imageError}
        >
          {loading ? "Submitting..." : "Add Homestay"}
        </button>
      </form>
    </div>
  );
}

function HomestayDetail() {
  const { id } = useParams();
  const [homestay, setHomestay] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHomestay = async () => {
      const docRef = doc(db, "homestays", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setHomestay({ id: docSnap.id, ...docSnap.data() });
      } else {
        navigate("/");
      }
    };
    fetchHomestay();
  }, [id, navigate]);

  if (!homestay) return <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>;

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % 1); // Only one image for now
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + 1) % 1); // Only one image for now
  };

  return (
    <div style={styles.detailContainer}>
      <Link to="/" style={styles.backButton}>
        <FaChevronLeft /> Back to listings
      </Link>
      
      <div style={styles.detailHeader}>
        <h1 style={styles.detailTitle}>{homestay.name}</h1>
        <div style={styles.detailSubtitle}>
          <FaMapMarkerAlt style={{ fontSize: 16 }} />
          <span>{homestay.city}, Guwahati</span>
          <span>·</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <FaStar style={{ color: "#ff385c" }} />
            <span>4.8 (24 reviews)</span>
          </div>
        </div>
      </div>
      
      <div style={{ position: "relative" }}>
        {homestay.imageUrl ? (
          <img
            src={homestay.imageUrl}
            alt={homestay.name}
            style={styles.detailImage}
          />
        ) : (
          <div style={{...styles.detailImage, backgroundColor: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#717171"}}>
            No Image Available
          </div>
        )}
        <button 
          style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", backgroundColor: "white", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", cursor: "pointer" }}
          onClick={prevImage}
        >
          <FaChevronLeft />
        </button>
        <button 
          style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", backgroundColor: "white", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", cursor: "pointer" }}
          onClick={nextImage}
        >
          <FaChevronRight />
        </button>
      </div>
      
      <div style={styles.detailGrid}>
        <div style={styles.detailInfo}>
          <div style={styles.detailSection}>
            <h3 style={styles.sectionTitle}>About this place</h3>
            <p>This beautiful homestay in the heart of {homestay.city} offers a comfortable stay with modern amenities. Perfect for travelers looking for a home away from home in Guwahati.</p>
          </div>
          
          <div style={styles.detailSection}>
            <h3 style={styles.sectionTitle}>Features</h3>
            <div style={styles.detailFeatures}>
              <div style={styles.featureCard}>
                <FaBed style={styles.featureIcon} />
                <div>
                  <div style={{ fontWeight: 500 }}>2 beds</div>
                  <div style={{ fontSize: 14, color: "#717171" }}>Comfortable sleeping</div>
                </div>
              </div>
              <div style={styles.featureCard}>
                <FaBath style={styles.featureIcon} />
                <div>
                  <div style={{ fontWeight: 500 }}>1 bath</div>
                  <div style={{ fontSize: 14, color: "#717171" }}>Hot water available</div>
                </div>
              </div>
              <div style={styles.featureCard}>
                <div style={styles.featureIcon}>W</div>
                <div>
                  <div style={{ fontWeight: 500 }}>WiFi</div>
                  <div style={{ fontSize: 14, color: "#717171" }}>High-speed internet</div>
                </div>
              </div>
              <div style={styles.featureCard}>
                <div style={styles.featureIcon}>A</div>
                <div>
                  <div style={{ fontWeight: 500 }}>AC</div>
                  <div style={{ fontSize: 14, color: "#717171" }}>Air conditioning</div>
                </div>
              </div>
              {homestay.coupleFriendly && (
                <div style={styles.featureCard}>
                  <div style={styles.featureIcon}>C</div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Couple Friendly</div>
                    <div style={{ fontSize: 14, color: "#717171" }}>Private and safe</div>
                  </div>
                </div>
              )}
              {homestay.hourly && (
                <div style={styles.featureCard}>
                  <div style={styles.featureIcon}>H</div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Hourly Stays</div>
                    <div style={{ fontSize: 14, color: "#717171" }}>Flexible booking</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div style={styles.bookingCard}>
          <div style={styles.bookingPrice}>₹{homestay.price} <span style={styles.bookingPerNight}>per night</span></div>
          <button style={styles.bookingButton}>
            Check Availability
          </button>
          {homestay.contact && (
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <p style={{ marginBottom: 10, color: "#717171" }}>Or contact directly</p>
              <a href={`tel:${homestay.contact}`} style={{ ...styles.button, ...styles.btnOutline, display: "block", textAlign: "center" }}>
                Call: {homestay.contact}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [homestays, setHomestays] = useState([]);
  const [form, setForm] = useState({
    name: "",
    price: "",
    city: "",
    contact: "",
    coupleFriendly: false,
    hourly: false,
    imagePreview: null
  });
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => setUser(user));
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "homestays"), (snapshot) => {
      setHomestays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (1MB max)
    if (file.size > 1024 * 1024) {
      setImageError("Image size must be less than 1MB");
      return;
    }

    // Check file type
    if (!file.type.match("image.*")) {
      setImageError("Only image files are allowed");
      return;
    }

    setImageError(null);
    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, imagePreview: reader.result }));
    };
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
    if (!user) return;
    if (imageError) return;

    setLoading(true);
    try {
      const imageUrl = await uploadImage();
      if (!imageUrl) throw new Error("Image upload failed");

      await addDoc(collection(db, "homestays"), {
        name: form.name,
        price: Number(form.price),
        city: form.city,
        contact: form.contact,
        coupleFriendly: form.coupleFriendly,
        hourly: form.hourly,
        imageUrl,
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: new Date().toISOString()
      });

      // Reset form
      setForm({
        name: "",
        price: "",
        city: "",
        contact: "",
        coupleFriendly: false,
        hourly: false,
        imagePreview: null
      });
      setImageFile(null);
      alert("Homestay added successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to add homestay");
    }
    setLoading(false);
  };

  return (
    <Router>
      <div style={styles.container}>
        <header style={styles.headerContainer}>
          <div style={styles.logoContainer}>
            <img
              src={logo}
              alt="Guwahati Homestay Finder Logo"
              style={styles.logo}
            />
            <h1 style={styles.headerTitle}>
              <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
                Guwahati Homestay Finder
              </Link>
            </h1>
          </div>
          
          <nav style={styles.nav}>
            <Link to="/" style={styles.navLink}>Explore</Link>
            <Link to="/add-homestay" style={styles.navLink}>Add Homestay</Link>
            <Link to="#" style={styles.navLink}>Favorites</Link>
          </nav>
        </header>

        <AuthBar user={user} handleLogin={handleLogin} handleLogout={handleLogout} />

        <Routes>
          <Route path="/" element={<HomestayListing homestays={homestays} />} />
          <Route path="/add-homestay" element={
            <AddHomestayForm
              user={user}
              form={form}
              setForm={setForm}
              handleSubmit={handleSubmit}
              loading={loading}
              handleImageChange={handleImageChange}
              imageError={imageError}
            />
          } />
          <Route path="/homestays/:id" element={<HomestayDetail />} />
        </Routes>
      </div>
    </Router>
  );
}
