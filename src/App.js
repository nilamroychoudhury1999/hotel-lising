import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { FiHeart, FiUser, FiMapPin, FiHome, FiStar, FiWifi, FiTv, FiCoffee, FiDroplet, FiSearch, FiMail, FiPhone, FiInfo,  FiCheck } from "react-icons/fi";
import { Helmet } from "react-helmet";
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

const styles = {
  container: {
    maxWidth: 1500,
    margin: "0 auto",
    padding: "0 20px",
    fontFamily: "'Inter', sans-serif",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column"
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 0',
    borderBottom: '1px solid #ebebeb',
    marginBottom: 30
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#ff385c',
    fontWeight: 'bold',
    fontSize: 24,
    textDecoration: 'none'
  },
  logo: {
    height: 40,
    borderRadius: 8
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 20
  },
  navLinks: {
    display: 'flex',
    gap: 20
  },
  navLink: {
    color: '#333',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: 16,
    transition: 'color 0.2s',
    ':hover': {
      color: '#ff385c'
    }
  },
  authButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '10px 15px',
    borderRadius: 30,
    border: '1px solid #ddd',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: 14
  },
  btnPrimary: {
    backgroundColor: '#ff385c',
    color: 'white',
    border: 'none'
  },
  homestayList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 25,
    padding: 0,
    listStyle: 'none'
  },
  homestayItem: {
    borderRadius: 12,
    overflow: 'hidden',
    transition: 'transform 0.2s',
    ':hover': {
      transform: 'scale(1.02)'
    },
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  homestayImage: {
    width: '100%',
    height: 250,
    objectFit: 'cover',
    borderRadius: 12,
    marginBottom: 10
  },
  homestayInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    padding: '0 10px 15px'
  },
  price: {
    fontWeight: 'bold',
    fontSize: 18
  },
  title: {
    fontWeight: 500,
    fontSize: 16
  },
  location: {
    color: '#717171',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 5
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 14
  },
  filterContainer: {
    display: 'flex',
    gap: 15,
    marginBottom: 25,
    overflowX: 'auto',
    paddingBottom: 10,
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': {
      display: 'none'
    }
  },
  filterButton: {
    padding: '10px 15px',
    borderRadius: 30,
    border: '1px solid #ddd',
    backgroundColor: 'white',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontSize: 14,
    fontWeight: 500
  },
  activeFilter: {
    backgroundColor: '#000',
    color: 'white',
    borderColor: '#000'
  },
  locationDropdown: {
    padding: '12px 15px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 16,
    width: '100%',
    marginBottom: 20,
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  formContainer: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '20px 0'
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30
  },
  formSection: {
    marginBottom: 30
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    display: 'block',
    marginBottom: 8,
    fontWeight: 500
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 16
  },
  textarea: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 16,
    minHeight: 100,
    resize: 'vertical'
  },
  checkboxGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 15
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 120
  },
  imagePreview: {
    width: '100%',
    maxHeight: 300,
    objectFit: 'cover',
    borderRadius: 12,
    marginTop: 15
  },
  submitButton: {
    backgroundColor: '#ff385c',
    color: 'white',
    border: 'none',
    padding: '15px 25px',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: 20,
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#e51e4d'
    }
  },
  detailContainer: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '20px 0'
  },
  detailHeader: {
    marginBottom: 30
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10
  },
  detailLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    color: '#717171',
    fontSize: 16,
    marginBottom: 20
  },
  detailImage: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 30,
    maxHeight: 500,
    objectFit: 'cover',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  detailInfo: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: 40,
    marginTop: 40
  },
  detailAmenities: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 15,
    marginTop: 30
  },
  amenityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  bookingCard: {
    border: '1px solid #ddd',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    position: 'sticky',
    top: 20
  },
  priceDetail: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20
  },
  bookButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#ff385c',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#e51e4d'
    }
  },
  callButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#3d8b40'
    }
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20
  },
  searchInput: {
    flex: 1,
    padding: '12px 15px',
    borderRadius: 30,
    border: '1px solid #ddd',
    fontSize: 16
  },
  searchButton: {
    padding: '12px 20px',
    borderRadius: 30,
    border: 'none',
    backgroundColor: '#ff385c',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5
  },
  premiumBadge: {
    backgroundColor: '#ffd700',
    color: '#333',
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    marginLeft: 8
  },
  pageContainer: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '40px 20px'
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center'
  },
  pageContent: {
    lineHeight: 1.8,
    fontSize: 18,
    maxWidth: 800,
    margin: '0 auto'
  },
  teamContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: 30,
    marginTop: 40
  },
  teamMember: {
    textAlign: 'center'
  },
  memberImage: {
    width: 150,
    height: 150,
    borderRadius: '50%',
    objectFit: 'cover',
    margin: '0 auto 15px',
    border: '3px solid #ff385c'
  },
  contactForm: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
    marginTop: 30
  },
  contactInput: {
    padding: '12px 15px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 16,
    width: '100%'
  },
  fullWidthInput: {
    gridColumn: '1 / span 2'
  },
  featureList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 30,
    marginTop: 40
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    textAlign: 'center'
  },
  featureIcon: {
    fontSize: 40,
    color: '#ff385c',
    marginBottom: 20
  },
  footer: {
    backgroundColor: '#f8f9fa',
    padding: '40px 0',
    marginTop: 'auto',
    borderTop: '1px solid #ebebeb'
  },
  footerContainer: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 40
  },
  footerColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 15
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  footerLink: {
    color: '#666',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'color 0.2s',
    ':hover': {
      color: '#ff385c'
    }
  },
  copyright: {
    textAlign: 'center',
    paddingTop: 30,
    color: '#666',
    borderTop: '1px solid #ebebeb',
    marginTop: 30
  },
  testimonialContainer: {
    display: 'flex',
    gap: 30,
    overflowX: 'auto',
    paddingBottom: 20,
    marginTop: 40
  },
  testimonialCard: {
    minWidth: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  testimonialText: {
    fontStyle: 'italic',
    marginBottom: 15,
    lineHeight: 1.6
  },
  testimonialAuthor: {
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    objectFit: 'cover'
  },
  premiumBanner: {
    backgroundColor: '#fff8e1',
    border: '1px solid #ffd54f',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 10
  }
};

function AuthBar({ user, handleLogin, handleLogout }) {
  return (
    <div style={styles.nav}>
      {user ? (
        <>
          <Link to="/add-homestay" style={{ ...styles.authButton, ...styles.btnPrimary }}>
            Add Homestay
          </Link>
          <button style={styles.authButton} onClick={handleLogout}>
            <FiUser /> Logout
          </button>
        </>
      ) : (
        <button style={styles.authButton} onClick={handleLogin}>
          <FiUser /> Login
        </button>
      )}
    </div>
  );
}

function NavigationBar() {
  return (
    <div style={styles.navLinks}>
      <Link to="/" style={styles.navLink}>Home</Link>
      <Link to="/about" style={styles.navLink}>About Us</Link>
      <Link to="/contact" style={styles.navLink}>Contact</Link>
      <Link to="/premium" style={styles.navLink}>Premium</Link>
    </div>
  );
}

function HomestayListing({ homestays }) {
  const [selectedArea, setSelectedArea] = useState("All");
  const [coupleFriendlyOnly, setCoupleFriendlyOnly] = useState(false);
  const [hourlyOnly, setHourlyOnly] = useState(false);
  const [roomType, setRoomType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHomestays = homestays.filter(homestay => {
    const matchesArea =
      selectedArea === "All" || homestay.city === selectedArea;

    const matchesCoupleFriendly =
      !coupleFriendlyOnly || homestay.coupleFriendly;

    const matchesHourly =
      !hourlyOnly || homestay.hourly;

    const matchesRoomType =
      roomType === "All" || homestay.roomType === roomType;

    const matchesSearch =
      searchQuery === "" ||
      homestay.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      homestay.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      homestay.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesArea && matchesCoupleFriendly && matchesHourly && matchesRoomType && matchesSearch;
  });

  return (
    <div>
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search homestays by name, location or description..."
          style={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button style={styles.searchButton}>
          <FiSearch /> Search
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <select
          style={styles.locationDropdown}
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
        >
          <option value="All">All Areas in Guwahati</option>
          {GUWAHATI_AREAS.map(area => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
      </div>

      <div style={styles.filterContainer}>
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

        <select
          style={styles.filterButton}
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
        >
          <option value="All">All Types</option>
          {ROOM_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {filteredHomestays.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <h3>No homestays found matching your criteria</h3>
          <p>Try adjusting your filters or search query</p>
        </div>
      ) : (
        <ul style={styles.homestayList}>
          {filteredHomestays.map(homestay => (
            <li key={homestay.id} style={styles.homestayItem}>
              <Link to={`/homestays/${homestay.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={homestay.imageUrl}
                    alt={homestay.name}
                    style={styles.homestayImage}
                  />
                  {homestay.premium && (
                    <div style={{
                      position: 'absolute',
                      top: 15,
                      left: 15,
                      backgroundColor: '#ffd700',
                      color: '#333',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3
                    }}>
                      <FiStar fill="#333" /> PREMIUM
                    </div>
                  )}
                  <button style={{
                    position: 'absolute',
                    top: 15,
                    right: 15,
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: 30,
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <FiHeart />
                  </button>
                </div>
                <div style={styles.homestayInfo}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={styles.title}>{homestay.name}</h3>
                    <div style={styles.rating}>
                      <FiStar fill="#000" /> {homestay.rating || 'New'}
                    </div>
                  </div>
                  <p style={styles.location}><FiMapPin /> {homestay.city}</p>
                  <p style={{ color: '#717171', fontSize: 14 }}>{homestay.roomType || 'Private Room'}</p>
                  <p style={styles.price}>₹{homestay.price} <span style={{ fontWeight: 'normal' }}>night</span></p>
                  {homestay.hourly && (
                    <p style={{ color: '#717171', fontSize: 14 }}>Hourly rates available</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddHomestayForm({ user, form, setForm, handleSubmit, loading, handleImageChange, imageError }) {
  const handleAmenityChange = (amenityId) => {
    const updatedAmenities = form.amenities.includes(amenityId)
      ? form.amenities.filter(id => id !== amenityId)
      : [...form.amenities, amenityId];

    setForm({ ...form, amenities: updatedAmenities });
  };

  return (
    <div style={styles.formContainer}>
      <Helmet>
        <title>Add Homestay - Guwahati Stays</title>
        <meta name="description" content="List your homestay on Guwahati Stays and connect with travelers looking for unique accommodations in Guwahati." />
      </Helmet>

      <h1 style={styles.formTitle}>List your homestay</h1>

      <div style={styles.premiumBanner}>
        <FiStar size={24} color="#ffd700" />
        <div>
          <p style={{ fontWeight: 'bold', marginBottom: 5 }}>Premium Listing Available</p>
          <p style={{ fontSize: 14 }}>Get 3x more views with our Premium feature. Highlight your listing and appear at the top of search results.</p>
          <Link to="/premium" style={{ color: '#ff385c', fontWeight: 500, textDecoration: 'none', display: 'inline-block', marginTop: 10 }}>
            Learn more →
          </Link>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Price (₹ per night) *</label>
            <input
              style={styles.input}
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Area in Guwahati *</label>
            <select
              style={styles.input}
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
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Phone Number *</label>
            <input
              style={styles.input}
              type="tel"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              required
              pattern="[0-9]{10}"
              title="10 digit phone number"
            />
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
      </div>

      <div style={styles.formSection}>
        <h2 style={styles.sectionTitle}>Photos</h2>
        <p style={{ color: '#717171', marginBottom: 15 }}>
          Upload at least one high-quality photo to showcase your space.
        </p>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Main Photo *</label>
          <input
            style={styles.input}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
          {imageError && <p style={{ color: 'red', marginTop: 5 }}>{imageError}</p>}
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
        <p style={{ color: '#717171', marginBottom: 15 }}>
          Select all amenities that your homestay offers
        </p>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
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
              checked={form.petsAllowed}
              onChange={(e) => setForm({ ...form, petsAllowed: e.target.checked })}
            />
            Pets Allowed
          </label>

          <label style={styles.checkboxItem}>
            <input
              type="checkbox"
              checked={form.smokingAllowed}
              onChange={(e) => setForm({ ...form, smokingAllowed: e.target.checked })}
            />
            Smoking Allowed
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
        type="submit"
        style={styles.submitButton}
        onClick={handleSubmit}
        disabled={loading || !user || imageError}
      >
        {loading ? "Submitting..." : "List Your Homestay"}
      </button>
    </div>
  );
}

function HomestayDetail() {
  const { id } = useParams();
  const [homestay, setHomestay] = useState(null);
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

  return (
    <div style={styles.detailContainer}>
      <Helmet>
        <title>{homestay.name} - Guwahati Stays</title>
        <meta name="description" content={`${homestay.name} in ${homestay.city} - ${homestay.description?.substring(0, 160)}...`} />
      </Helmet>

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
          <FiMapPin /> {homestay.city} • {homestay.roomType || 'Private Room'}
        </div>
        <div style={styles.rating}>
          <FiStar fill="#000" /> {homestay.rating || 'New'}
        </div>
      </div>

      <img
        src={homestay.imageUrl}
        alt={homestay.name}
        style={styles.detailImage}
      />

      <div style={styles.detailInfo}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>About this place</h2>
          <p style={{ lineHeight: 1.6, marginBottom: 30 }}>{homestay.description || 'No description provided.'}</p>

          <h2 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Amenities</h2>
          <div style={styles.detailAmenities}>
            {homestay.amenities && homestay.amenities.length > 0 ? (
              homestay.amenities.map(amenityId => {
                const amenity = AMENITIES.find(a => a.id === amenityId);
                return amenity ? (
                  <div key={amenityId} style={styles.amenityItem}>
                    {amenity.icon || <FiHome />}
                    <span>{amenity.name}</span>
                  </div>
                ) : null;
              })
            ) : (
              <p>No amenities listed</p>
            )}
          </div>
        </div>

        <div style={styles.bookingCard}>
          <div style={styles.priceDetail}>
            ₹{homestay.price} <span style={{ fontWeight: 'normal' }}>/ night</span>
          </div>

          {homestay.premium && (
            <div style={{ backgroundColor: '#fff8e1', padding: 15, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <FiCheck color="#4CAF50" size={20} />
                <span style={{ fontWeight: 'bold' }}>Premium Verified</span>
              </div>
              <p style={{ fontSize: 14 }}>This host has been verified and offers premium amenities.</p>
            </div>
          )}

          <a href={`tel:${homestay.contact}`} style={styles.callButton}>
            <FiUser /> Call Host
          </a>
        </div>
      </div>
    </div>
  );
}

function AboutUs() {
  return (
    <div style={styles.pageContainer}>
      <Helmet>
        <title>About Us - Guwahati Stays</title>
        <meta name="description" content="Learn about Guwahati Stays - your trusted platform for finding the perfect homestay in Guwahati." />
      </Helmet>
      
      <h1 style={styles.pageTitle}>About Guwahati Stays</h1>
      
      <div style={styles.pageContent}>
        <p>
          Founded in 2023, Guwahati Stays is dedicated to transforming how travelers experience Guwahati. 
          We connect guests with unique, authentic homestays that offer more than just a place to sleep - 
          they offer a true Assamese hospitality experience.
        </p>
        
        <p>
          Our mission is to empower local homeowners while providing travelers with memorable stays that 
          showcase the rich culture and warm hospitality of Assam. We carefully vet every property to ensure 
          quality and comfort for our guests.
        </p>
        
        <h2 style={{ fontSize: 24, fontWeight: 'bold', marginTop: 40, marginBottom: 20 }}>Our Team</h2>
        
        <div style={styles.teamContainer}>
          <div style={styles.teamMember}>
            <div style={{ 
              width: 150, 
              height: 150, 
              borderRadius: '50%', 
              backgroundColor: '#ff385c', 
              margin: '0 auto 15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 50,
              fontWeight: 'bold'
            }}>AK</div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 5 }}>Amit Kumar</h3>
            <p>Founder & CEO</p>
          </div>
          
          <div style={styles.teamMember}>
            <div style={{ 
              width: 150, 
              height: 150, 
              borderRadius: '50%', 
              backgroundColor: '#ff385c', 
              margin: '0 auto 15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 50,
              fontWeight: 'bold'
            }}>PS</div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 5 }}>Priya Sharma</h3>
            <p>Head of Operations</p>
          </div>
          
          <div style={styles.teamMember}>
            <div style={{ 
              width: 150, 
              height: 150, 
              borderRadius: '50%', 
              backgroundColor: '#ff385c', 
              margin: '0 auto 15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 50,
              fontWeight: 'bold'
            }}>RJ</div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 5 }}>Rajiv Jain</h3>
            <p>Technology Director</p>
          </div>
        </div>
        
        <h2 style={{ fontSize: 24, fontWeight: 'bold', marginTop: 40, marginBottom: 20 }}>Our Values</h2>
        
        <div style={styles.featureList}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}><FiHome size={36} /></div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Authentic Experiences</h3>
            <p>We prioritize homestays that offer genuine local experiences and cultural immersion.</p>
          </div>
          
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}><FiCheck size={36} /></div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Quality Assurance</h3>
            <p>Every property is personally verified to meet our standards of comfort and cleanliness.</p>
          </div>
          
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}><FiStar size={36} /></div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Premium Service</h3>
            <p>Our dedicated support team is available 24/7 to assist with any needs during your stay.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactUs() {
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
    // In a real app, you would send this data to your backend
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
  };

  return (
    <div style={styles.pageContainer}>
      <Helmet>
        <title>Contact Us - Guwahati Stays</title>
        <meta name="description" content="Get in touch with Guwahati Stays for any questions or support regarding your homestay bookings." />
      </Helmet>
      
      <h1 style={styles.pageTitle}>Contact Us</h1>
      
      <div style={{ ...styles.pageContent, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        <div>
          <p style={{ marginBottom: 30 }}>
            Have questions about booking a homestay or listing your property? Our team is here to help!
          </p>
          
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 30, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: 20, fontSize: 20 }}>Contact Information</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiPhone />
                </div>
                <div>
                  <p style={{ fontWeight: 500 }}>Phone</p>
                  <p>+91 98765 43210</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiMail />
                </div>
                <div>
                  <p style={{ fontWeight: 500 }}>Email</p>
                  <p>support@guwahatistays.com</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiMapPin />
                </div>
                <div>
                  <p style={{ fontWeight: 500 }}>Office</p>
                  <p>GS Road, Dispur, Guwahati, Assam 781006</p>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: 40 }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: 20, fontSize: 20 }}>Business Hours</h3>
            <p style={{ marginBottom: 10 }}>Monday - Friday: 9:00 AM - 6:00 PM</p>
            <p>Saturday: 10:00 AM - 4:00 PM</p>
            <p>Sunday: Closed</p>
          </div>
        </div>
        
        <div>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 30, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: 20, fontSize: 20 }}>Send us a message</h3>
            
            {submitted ? (
              <div style={{ textAlign: 'center', padding: 30 }}>
                <FiCheck size={40} color="#4CAF50" style={{ marginBottom: 20 }} />
                <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Message Sent!</h3>
                <p>Thank you for contacting us. Our team will get back to you within 24 hours.</p>
                <button 
                  style={{ ...styles.submitButton, marginTop: 20 }} 
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
                  
                  <div style={{ ...styles.inputGroup, ...styles.fullWidthInput }}>
                    <label style={styles.label}>Message *</label>
                    <textarea
                      name="message"
                      style={{ ...styles.contactInput, minHeight: 150 }}
                      value={formData.message}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>
                  
                  <div style={{ ...styles.inputGroup, ...styles.fullWidthInput }}>
                    <button type="submit" style={styles.submitButton}>
                      Send Message
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PremiumPage() {
  return (
    <div style={styles.pageContainer}>
      <Helmet>
        <title>Premium Features - Guwahati Stays</title>
        <meta name="description" content="Upgrade to Guwahati Stays Premium to get more visibility for your homestay and increase your bookings." />
      </Helmet>
      
      <h1 style={styles.pageTitle}>Premium Features</h1>
      
      <div style={{ ...styles.pageContent, textAlign: 'center' }}>
        <p style={{ fontSize: 20, maxWidth: 700, margin: '0 auto 40px' }}>
          Elevate your homestay listing with our Premium features designed to increase your visibility and bookings.
        </p>
        
        <div style={styles.featureList}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}><FiStar size={36} /></div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Featured Listings</h3>
            <p>Your property appears at the top of search results with a premium badge.</p>
          </div>
          
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}><FiSearch size={36} /></div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>3x More Visibility</h3>
            <p>Get up to 3 times more views compared to regular listings.</p>
          </div>
          
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}><FiCheck size={36} /></div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Verified Badge</h3>
            <p>Gain trust with our verified badge that shows you're a premium host.</p>
          </div>
        </div>
        
        <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 40, marginTop: 40, maxWidth: 800, margin: '40px auto 0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 30 }}>Premium Hosting Plans</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 30, textAlign: 'center' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Basic</h3>
              <p style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 20 }}>₹499<span style={{ fontSize: 16, fontWeight: 'normal' }}>/month</span></p>
              <ul style={{ textAlign: 'left', marginBottom: 20, listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><FiCheck /> Featured for 7 days</li>
                <li style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><FiCheck /> Premium badge</li>
                <li style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><FiCheck /> Basic analytics</li>
              </ul>
              <button style={styles.submitButton}>Select Plan</button>
            </div>
            
            <div style={{ border: '1px solid #ff385c', borderRadius: 12, padding: 30, textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#ff385c', color: 'white', padding: '5px 15px', borderRadius: 20, fontSize: 14 }}>
                MOST POPULAR
              </div>
              <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Professional</h3>
              <p style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 20 }}>₹899<span style={{ fontSize: 16, fontWeight: 'normal' }}>/month</span></p>
              <ul style={{ textAlign: 'left', marginBottom: 20, listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><FiCheck /> Featured for 30 days</li>
                <li style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><FiCheck /> Premium badge</li>
                <li style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><FiCheck /> Advanced analytics</li>
                <li style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><FiCheck /> Priority support</li>
                <li style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><FiCheck /> Social media promotion</li>
              </ul>
              <button style={{ ...styles.submitButton, backgroundColor: '#333' }}>Select Plan</button>
            </div>
            
            <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 30, textAlign: 'center' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Business</h3>
              <p style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 20 }}>₹1499<span style={{ fontSize: 16, fontWeight: 'normal' }}>/month</span></p>
              <ul style={{ textAlign: 'left', marginBottom: 20, listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><FiCheck /> Featured for 90 days</li>
                <li style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><FiCheck /> Premium badge</li>
                <li style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><FiCheck /> Full analytics dashboard</li>
                <li style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><FiCheck /> Dedicated account manager</li>
                <li style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><FiCheck /> Professional photography</li>
                <li style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><FiCheck /> Marketing campaign</li>
              </ul>
              <button style={styles.submitButton}>Select Plan</button>
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: 60 }}>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>What Our Premium Hosts Say</h2>
          
          <div style={styles.testimonialContainer}>
            <div style={styles.testimonialCard}>
              <p style={styles.testimonialText}>
                "Since upgrading to Premium, my bookings have increased by 70%! The featured placement makes all the difference."
              </p>
              <div style={styles.testimonialAuthor}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '50%', 
                  backgroundColor: '#ff385c', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}>RS</div>
                <div>
                  <div>Rajesh Sharma</div>
                  <div style={{ fontSize: 14, color: '#666' }}>Premium Host, Khanapara</div>
                </div>
              </div>
            </div>
            
            <div style={styles.testimonialCard}>
              <p style={styles.testimonialText}>
                "The professional photography included in the Business plan transformed my listing. Worth every rupee!"
              </p>
              <div style={styles.testimonialAuthor}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '50%', 
                  backgroundColor: '#ff385c', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}>PD</div>
                <div>
                  <div>Priyanka Das</div>
                  <div style={{ fontSize: 14, color: '#666' }}>Business Host, Zoo Road</div>
                </div>
              </div>
            </div>
            
            <div style={styles.testimonialCard}>
              <p style={styles.testimonialText}>
                "As a new host, Premium gave me the visibility I needed to establish my homestay quickly."
              </p>
              <div style={styles.testimonialAuthor}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '50%', 
                  backgroundColor: '#ff385c', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}>AM</div>
                <div>
                  <div>Amit Mehta</div>
                  <div style={{ fontSize: 14, color: '#666' }}>Premium Host, Ganeshguri</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerContainer}>
        <div style={styles.footerColumn}>
          <div style={styles.logoContainer}>
            <img
              src={logo}
              alt="Guwahati Homestay Finder Logo"
              style={styles.logo}
            />
            <span>Guwahati Stays</span>
          </div>
          <p style={{ color: '#666', lineHeight: 1.6 }}>
            Your trusted platform for authentic homestay experiences in Guwahati. Connect with local hosts and discover the real Assam.
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
          <a href="mailto:support@guwahatistays.com" style={styles.footerLink}><FiMail /> support@guwahatistays.com</a>
          <a href="tel:+919876543210" style={styles.footerLink}><FiPhone /> +91 98765 43210</a>
          <div style={styles.footerLink}><FiMapPin /> GS Road, Dispur, Guwahati, Assam 781006</div>
        </div>
        
        <div style={styles.footerColumn}>
          <h4 style={styles.footerTitle}>Legal</h4>
          <Link to="/terms" style={styles.footerLink}>Terms of Service</Link>
          <Link to="/privacy" style={styles.footerLink}>Privacy Policy</Link>
          <Link to="/cancellation" style={styles.footerLink}>Cancellation Policy</Link>
        </div>
      </div>
      
      <div style={styles.copyright}>
        © {new Date().getFullYear()} Guwahati Stays. All rights reserved.
      </div>
    </footer>
  );
}

function HomePage({ homestays }) {
  return (
    <>
      <Helmet>
        <title>Guwahati Stays - Find the Perfect Homestay in Guwahati</title>
        <meta name="description" content="Discover unique homestays across Guwahati. Book comfortable and affordable accommodations for your stay in Guwahati." />
      </Helmet>
      <HomestayListing homestays={homestays} />
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [homestays, setHomestays] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    city: "",
    contact: "",
    roomType: "",
    maxGuests: 2,
    coupleFriendly: false,
    hourly: false,
    petsAllowed: false,
    smokingAllowed: false,
    amenities: [],
    premium: false,
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

    // Check file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setImageError("Image size must be less than 2MB");
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
        description: form.description,
        price: Number(form.price),
        city: form.city,
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
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: new Date().toISOString()
      });

      // Reset form
      setForm({
        name: "",
        description: "",
        price: "",
        city: "",
        contact: "",
        roomType: "",
        maxGuests: 2,
        coupleFriendly: false,
        hourly: false,
        petsAllowed: false,
        smokingAllowed: false,
        amenities: [],
        premium: false,
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
        <header style={styles.header}>
          <Link to="/" style={styles.logoContainer}>
            <img
              src={logo}
              alt="Guwahati Homestay Finder Logo"
              style={styles.logo}
            />
            <span>Guwahati Stays</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            <NavigationBar />
            <AuthBar user={user} handleLogin={handleLogin} handleLogout={handleLogout} />
          </div>
        </header>

        <Routes>
          <Route path="/" element={<HomePage homestays={homestays} />} />
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
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/premium" element={<PremiumPage />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}
