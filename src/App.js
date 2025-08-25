    import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { FiHeart, FiUser, FiMapPin, FiHome, FiStar, FiWifi, FiTv, FiCoffee, FiDroplet, FiSearch, FiMail, FiPhone, FiInfo, FiCheck, FiMenu, FiX, FiBike } from "react-icons/fi";
import { Helmet } from "react-helmet";
import logo from "./IMG-20250818-WA0009.jpg";

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

// Bike types and features
const BIKE_TYPES = [
  "Standard Bike", "Mountain Bike", "Road Bike", "Hybrid Bike", "Electric Bike", "Folding Bike"
];

const BIKE_FEATURES = [
  "Helmet Included", "Lock Included", "Basket", "Phone Mount", "Repair Kit", "Water Bottle Holder"
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
    marginBottom: 30,
    position: 'relative'
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
    gap: 20,
    '@media (max-width: 768px)': {
      display: 'none'
    }
  },
  navLinks: {
    display: 'flex',
    gap: 20,
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: 15,
      padding: '20px'
    }
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
  mobileMenuButton: {
    display: 'none',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    '@media (max-width: 768px)': {
      display: 'block'
    }
  },
  mobileMenu: {
    display: 'none',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 1000,
    padding: '20px 0',
    '@media (max-width: 768px)': {
      display: 'block'
    }
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
    marginTop: 40,
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
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
    marginTop: 30,
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
  },
  contactInput: {
    padding: '12px 15px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 16,
    width: '100%'
  },
  fullWidthInput: {
    gridColumn: '1 / span 2',
    '@media (max-width: 768px)': {
      gridColumn: '1'
    }
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

// Responsive Header Component
function Header({ user, handleLogin, handleLogout, mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <header style={styles.header}>
      <Link to="/" style={styles.logoContainer}>
        <img
          src={logo}
          alt="Homavia Logo"
          style={styles.logo}
        />
        <span>Homavia</span>
      </Link>

      <button 
        style={styles.mobileMenuButton} 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <FiX /> : <FiMenu />}
      </button>

      <div style={{ 
        ...styles.nav, 
        display: mobileMenuOpen ? 'flex' : styles.nav.display,
        flexDirection: mobileMenuOpen ? 'column' : 'row',
        position: mobileMenuOpen ? 'absolute' : 'static',
        top: mobileMenuOpen ? '100%' : 'auto',
        left: mobileMenuOpen ? 0 : 'auto',
        right: mobileMenuOpen ? 0 : 'auto',
        backgroundColor: mobileMenuOpen ? 'white' : 'transparent',
        padding: mobileMenuOpen ? '20px' : 0,
        boxShadow: mobileMenuOpen ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
        zIndex: mobileMenuOpen ? 1000 : 'auto'
      }}>
        <NavigationBar mobile={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <AuthBar user={user} handleLogin={handleLogin} handleLogout={handleLogout} mobile={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      </div>
    </header>
  );
}

function NavigationBar({ mobile, setMobileMenuOpen }) {
  const handleLinkClick = () => {
    if (mobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div style={{
      ...styles.navLinks,
      flexDirection: mobile ? 'column' : 'row'
    }}>
      <Link to="/" style={styles.navLink} onClick={handleLinkClick}>Home</Link>
      <Link to="/car-rentals" style={styles.navLink} onClick={handleLinkClick}>Car Rentals</Link>
      <Link to="/bike-rentals" style={styles.navLink} onClick={handleLinkClick}>Bike Rentals</Link>
      <Link to="/about" style={styles.navLink} onClick={handleLinkClick}>About Us</Link>
      <Link to="/contact" style={styles.navLink} onClick={handleLinkClick}>Contact</Link>
      <Link to="/premium" style={styles.navLink} onClick={handleLinkClick}>Premium</Link>
    </div>
  );
}

function AuthBar({ user, handleLogin, handleLogout, mobile, setMobileMenuOpen }) {
  const handleAuthAction = (action) => {
    if (mobile) {
      setMobileMenuOpen(false);
    }
    action();
  };

  return (
    <div style={{
      ...styles.nav,
      flexDirection: mobile ? 'column' : 'row',
      gap: mobile ? 15 : 20
    }}>
      {user ? (
        <>
          <Link to="/add-homestay" style={{ ...styles.authButton, ...styles.btnPrimary }} onClick={() => handleAuthAction(() => {})}>
            Add Homestay
          </Link>
          <Link to="/add-car-rental" style={{ ...styles.authButton, ...styles.btnPrimary }} onClick={() => handleAuthAction(() => {})}>
            Add Car Rental
          </Link>
          <Link to="/add-bike-rental" style={{ ...styles.authButton, ...styles.btnPrimary }} onClick={() => handleAuthAction(() => {})}>
            Add Bike Rental
          </Link>
          <button style={styles.authButton} onClick={() => handleAuthAction(handleLogout)}>
            <FiUser /> Logout
          </button>
        </>
      ) : (
        <button style={styles.authButton} onClick={() => handleAuthAction(handleLogin)}>
          <FiUser /> Login
        </button>
      )}
    </div>
  );
}

// Add Bike Rental Form Component
function AddBikeRentalForm({ user, bikeForm, setBikeForm, handleBikeSubmit, bikeLoading, handleBikeImageChange, bikeImageError }) {
  const handleFeatureChange = (feature) => {
    const updatedFeatures = bikeForm.features.includes(feature)
      ? bikeForm.features.filter(f => f !== feature)
      : [...bikeForm.features, feature];

    setBikeForm({ ...bikeForm, features: updatedFeatures });
  };

  return (
    <div style={styles.formContainer}>
      <Helmet>
        <title>Add Bike Rental - Homavia</title>
        <meta name="description" content="List your bike for rental on Homavia and connect with travelers looking for vehicles in Guwahati." />
      </Helmet>

      <h1 style={styles.formTitle}>List your bike for rental</h1>

      <div style={styles.formSection}>
        <h2 style={styles.sectionTitle}>Basic Information</h2>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Bike Name/Model *</label>
          <input
            style={styles.input}
            value={bikeForm.name}
            onChange={(e) => setBikeForm({ ...bikeForm, name: e.target.value })}
            required
            placeholder="e.g., Honda Activa, Yamaha MT-15"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Description *</label>
          <textarea
            style={styles.textarea}
            value={bikeForm.description}
            onChange={(e) => setBikeForm({ ...bikeForm, description: e.target.value })}
            required
            placeholder="Describe your bike's features, condition, and any special notes..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Price (₹ per day) *</label>
            <input
              style={styles.input}
              type="number"
              value={bikeForm.price}
              onChange={(e) => setBikeForm({ ...bikeForm, price: e.target.value })}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Area in Guwahati *</label>
            <select
              style={styles.input}
              value={bikeForm.city}
              onChange={(e) => setBikeForm({ ...bikeForm, city: e.target.value })}
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
              value={bikeForm.contact}
              onChange={(e) => setBikeForm({ ...bikeForm, contact: e.target.value })}
              required
              pattern="[0-9]{10}"
              title="10 digit phone number"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Bike Type *</label>
            <select
              style={styles.input}
              value={bikeForm.bikeType}
              onChange={(e) => setBikeForm({ ...bikeForm, bikeType: e.target.value })}
              required
            >
              <option value="">Select Bike Type</option>
              {BIKE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Engine Capacity (CC)</label>
            <input
              style={styles.input}
              type="number"
              min="0"
              value={bikeForm.engineCapacity}
              onChange={(e) => setBikeForm({ ...bikeForm, engineCapacity: e.target.value })}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Year of Manufacture</label>
            <input
              style={styles.input}
              type="number"
              min="2000"
              max={new Date().getFullYear()}
              value={bikeForm.year}
              onChange={(e) => setBikeForm({ ...bikeForm, year: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div style={styles.formSection}>
        <h2 style={styles.sectionTitle}>Photos</h2>
        <p style={{ color: '#717171', marginBottom: 15 }}>
          Upload at least one high-quality photo of your bike.
        </p>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Main Photo *</label>
          <input
            style={styles.input}
            type="file"
            accept="image/*"
            onChange={handleBikeImageChange}
            required
          />
          {bikeImageError && <p style={{ color: 'red', marginTop: 5 }}>{bikeImageError}</p>}
          {bikeForm.imagePreview && (
            <img
              src={bikeForm.imagePreview}
              alt="Preview"
              style={styles.imagePreview}
            />
          )}
        </div>
      </div>

      <div style={styles.formSection}>
        <h2 style={styles.sectionTitle}>Features</h2>
        <p style={{ color: '#717171', marginBottom: 15 }}>
          Select all features that your bike offers
        </p>
        <div style={styles.checkboxGroup}>
          {BIKE_FEATURES.map(feature => (
            <label key={feature} style={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={bikeForm.features.includes(feature)}
                onChange={() => handleFeatureChange(feature)}
              />
              {feature}
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
              checked={bikeForm.withHelmet}
              onChange={(e) => setBikeForm({ ...bikeForm, withHelmet: e.target.checked })}
            />
            Helmet Included
          </label>

          <label style={styles.checkboxItem}>
            <input
              type="checkbox"
              checked={bikeForm.premium}
              onChange={(e) => setBikeForm({ ...bikeForm, premium: e.target.checked })}
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
        onClick={handleBikeSubmit}
        disabled={bikeLoading || !user || bikeImageError}
      >
        {bikeLoading ? "Submitting..." : "List Your Bike"}
      </button>
    </div>
  );
}

// Bike Rental Listing Component
function BikeRentalListing({ bikeRentals }) {
  const [selectedArea, setSelectedArea] = useState("All");
  const [bikeType, setBikeType] = useState("All");
  const [withHelmet, setWithHelmet] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBikeRentals = bikeRentals.filter(bike => {
    const matchesArea =
      selectedArea === "All" || bike.city === selectedArea;

    const matchesBikeType =
      bikeType === "All" || bike.bikeType === bikeType;

    const matchesHelmet =
      !withHelmet || bike.withHelmet;

    const matchesSearch =
      searchQuery === "" ||
      bike.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bike.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bike.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesArea && matchesBikeType && matchesHelmet && matchesSearch;
  });

  return (
    <div>
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search bikes by name, type, or description..."
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
        <select
          style={styles.filterButton}
          value={bikeType}
          onChange={(e) => setBikeType(e.target.value)}
        >
          <option value="All">All Bike Types</option>
          {BIKE_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <button
          style={{
            ...styles.filterButton,
            ...(withHelmet ? styles.activeFilter : {})
          }}
          onClick={() => setWithHelmet(!withHelmet)}
        >
          Helmet Included
        </button>
      </div>

      {filteredBikeRentals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <h3>No bikes found matching your criteria</h3>
          <p>Try adjusting your filters or search query</p>
        </div>
      ) : (
        <ul style={styles.homestayList}>
          {filteredBikeRentals.map(bike => (
            <li key={bike.id} style={styles.homestayItem}>
              <Link to={`/bike-rentals/${bike.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={bike.imageUrl}
                    alt={bike.name}
                    style={styles.homestayImage}
                  />
                  {bike.premium && (
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
                </div>
                <div style={styles.homestayInfo}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={styles.title}>{bike.name}</h3>
                    <div style={styles.rating}>
                      <FiStar fill="#000" /> {bike.rating || 'New'}
                    </div>
                  </div>
                  <p style={styles.location}><FiMapPin /> {bike.city}</p>
                  <p style={{ color: '#717171', fontSize: 14 }}>{bike.bikeType}</p>
                  {bike.engineCapacity && (
                    <p style={{ color: '#717171', fontSize: 14 }}>
                      {bike.engineCapacity} CC
                    </p>
                  )}
                  <p style={styles.price}>₹{bike.price} <span style={{ fontWeight: 'normal' }}>/ day</span></p>
                  {bike.withHelmet && (
                    <p style={{ color: '#717171', fontSize: 14 }}>Helmet included</p>
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

// Bike Rental Detail Component
function BikeRentalDetail() {
  const { id } = useParams();
  const [bike, setBike] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBike = async () => {
      const docRef = doc(db, "bikeRentals", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBike({ id: docSnap.id, ...docSnap.data() });
      } else {
        navigate("/bike-rentals");
      }
    };
    fetchBike();
  }, [id, navigate]);

  if (!bike) return <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>;

  return (
    <div style={styles.detailContainer}>
      <Helmet>
        <title>{bike.name} - Bike Rental - Homavia</title>
        <meta name="description" content={`Rent ${bike.name} in ${bike.city} - ${bike.description?.substring(0, 160)}...`} />
      </Helmet>

      <div style={styles.detailHeader}>
        <h1 style={styles.detailTitle}>
          {bike.name}
          {bike.premium && (
            <span style={styles.premiumBadge}>
              <FiStar /> PREMIUM
            </span>
          )}
        </h1>
        <div style={styles.detailLocation}>
          <FiMapPin /> {bike.city} • {bike.bikeType}
        </div>
        <div style={styles.rating}>
          <FiStar fill="#000" /> {bike.rating || 'New'}
        </div>
      </div>

      <img
        src={bike.imageUrl}
        alt={bike.name}
        style={styles.detailImage}
      />

      <div style={styles.detailInfo}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>About this bike</h2>
          <p style={{ lineHeight: 1.6, marginBottom: 30 }}>{bike.description || 'No description provided.'}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 30 }}>
            {bike.engineCapacity && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiBike size={20} />
                <span><strong>Engine Capacity:</strong> {bike.engineCapacity} CC</span>
              </div>
            )}
            {bike.year && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiCalendar size={20} />
                <span><strong>Year:</strong> {bike.year}</span>
              </div>
            )}
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Features</h2>
          <div style={styles.detailAmenities}>
            {bike.features && bike.features.length > 0 ? (
              bike.features.map(feature => (
                <div key={feature} style={styles.amenityItem}>
                  <FiCheck />
                  <span>{feature}</span>
                </div>
              ))
            ) : (
              <p>No features listed</p>
            )}
          </div>
        </div>

        <div style={styles.bookingCard}>
          <div style={styles.priceDetail}>
            ₹{bike.price} <span style={{ fontWeight: 'normal' }}>/ day</span>
          </div>

          {bike.premium && (
            <div style={{ backgroundColor: '#fff8e1', padding: 15, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <FiCheck color="#4CAF50" size={20} />
                <span style={{ fontWeight: 'bold' }}>Premium Verified</span>
              </div>
              <p style={{ fontSize: 14 }}>This bike has been verified and is well-maintained.</p>
            </div>
          )}

          {bike.withHelmet && (
            <div style={{ backgroundColor: '#e8f5e9', padding: 15, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <FiCheck color="#4CAF50" size={20} />
                <span style={{ fontWeight: 'bold' }}>Helmet Included</span>
              </div>
              <p style={{ fontSize: 14 }}>This rental includes a safety helmet.</p>
            </div>
          )}

          <a href={`tel:${bike.contact}`} style={styles.callButton}>
            <FiUser /> Call Owner
          </a>
        </div>
      </div>
    </div>
  );
}

// Update the main App component
export default function App() {
  const [user, setUser] = useState(null);
  const [homestays, setHomestays] = useState([]);
  const [carRentals, setCarRentals] = useState([]);
  const [bikeRentals, setBikeRentals] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Form states
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
  
  const [carForm, setCarForm] = useState({
    name: "",
    description: "",
    price: "",
    city: "",
    contact: "",
    carType: "",
    fuelType: "",
    year: new Date().getFullYear(),
    seatingCapacity: 5,
    mileage: "",
    features: [],
    withDriver: false,
    premium: false,
    imagePreview: null
  });
  
  const [bikeForm, setBikeForm] = useState({
    name: "",
    description: "",
    price: "",
    city: "",
    contact: "",
    bikeType: "",
    engineCapacity: "",
    year: "",
    features: [],
    withHelmet: false,
    premium: false,
    imagePreview: null
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [carImageFile, setCarImageFile] = useState(null);
  const [bikeImageFile, setBikeImageFile] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [carImageError, setCarImageError] = useState(null);
  const [bikeImageError, setBikeImageError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [carLoading, setCarLoading] = useState(false);
  const [bikeLoading, setBikeLoading] = useState(false);

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

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "carRentals"), (snapshot) => {
      setCarRentals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "bikeRentals"), (snapshot) => {
      setBikeRentals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      setMobileMenuOpen(false);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMobileMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Image handling functions for homestays, cars, and bikes
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

  const handleCarImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setCarImageError("Image size must be less than 2MB");
      return;
    }

    if (!file.type.match("image.*")) {
      setCarImageError("Only image files are allowed");
      return;
    }

    setCarImageError(null);
    setCarImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setCarForm(prev => ({ ...prev, imagePreview: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleBikeImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setBikeImageError("Image size must be less than 2MB");
      return;
    }

    if (!file.type.match("image.*")) {
      setBikeImageError("Only image files are allowed");
      return;
    }

    setBikeImageError(null);
    setBikeImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setBikeForm(prev => ({ ...prev, imagePreview: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append("file", file);
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
      const imageUrl = await uploadImage(imageFile);
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

  const handleCarSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (carImageError) return;

    setCarLoading(true);
    try {
      const imageUrl = await uploadImage(carImageFile);
      if (!imageUrl) throw new Error("Image upload failed");

      await addDoc(collection(db, "carRentals"), {
        name: carForm.name,
        description: carForm.description,
        price: Number(carForm.price),
        city: carForm.city,
        contact: carForm.contact,
        carType: carForm.carType,
        fuelType: carForm.fuelType,
        year: Number(carForm.year),
        seatingCapacity: Number(carForm.seatingCapacity),
        mileage: Number(carForm.mileage),
        features: carForm.features,
        withDriver: carForm.withDriver,
        premium: carForm.premium,
        imageUrl,
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: new Date().toISOString()
      });

      setCarForm({
        name: "",
        description: "",
        price: "",
        city: "",
        contact: "",
        carType: "",
        fuelType: "",
        year: new Date().getFullYear(),
        seatingCapacity: 5,
        mileage: "",
        features: [],
        withDriver: false,
        premium: false,
        imagePreview: null
      });
      setCarImageFile(null);
      alert("Car listed successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to list car");
    }
    setCarLoading(false);
  };

  const handleBikeSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (bikeImageError) return;

    setBikeLoading(true);
    try {
      const imageUrl = await uploadImage(bikeImageFile);
      if (!imageUrl) throw new Error("Image upload failed");

      await addDoc(collection(db, "bikeRentals"), {
        name: bikeForm.name,
        description: bikeForm.description,
        price: Number(bikeForm.price),
        city: bikeForm.city,
        contact: bikeForm.contact,
        bikeType: bikeForm.bikeType,
        engineCapacity: bikeForm.engineCapacity ? Number(bikeForm.engineCapacity) : null,
        year: bikeForm.year ? Number(bikeForm.year) : null,
        features: bikeForm.features,
        withHelmet: bikeForm.withHelmet,
        premium: bikeForm.premium,
        imageUrl,
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: new Date().toISOString()
      });

      setBikeForm({
        name: "",
        description: "",
        price: "",
        city: "",
        contact: "",
        bikeType: "",
        engineCapacity: "",
        year: "",
        features: [],
        withHelmet: false,
        premium: false,
        imagePreview: null
      });
      setBikeImageFile(null);
      alert("Bike listed successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to list bike");
    }
    setBikeLoading(false);
  };

  return (
    <Router>
      <div style={styles.container}>
        <Header 
          user={user} 
          handleLogin={handleLogin} 
          handleLogout={handleLogout} 
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

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
          
          <Route path="/car-rentals" element={<CarRentalListing carRentals={carRentals} />} />
          <Route path="/add-car-rental" element={
            <AddCarRentalForm
              user={user}
              carForm={carForm}
              setCarForm={setCarForm}
              handleCarSubmit={handleCarSubmit}
              carLoading={carLoading}
              handleCarImageChange={handleCarImageChange}
              carImageError={carImageError}
            />
          } />
          <Route path="/car-rentals/:id" element={<CarRentalDetail />} />
          
          <Route path="/bike-rentals" element={<BikeRentalListing bikeRentals={bikeRentals} />} />
          <Route path="/add-bike-rental" element={
            <AddBikeRentalForm
              user={user}
              bikeForm={bikeForm}
              setBikeForm={setBikeForm}
              handleBikeSubmit={handleBikeSubmit}
              bikeLoading={bikeLoading}
              handleBikeImageChange={handleBikeImageChange}
              bikeImageError={bikeImageError}
            />
          } />
          <Route path="/bike-rentals/:id" element={<BikeRentalDetail />} />
          
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/premium" element={<PremiumPage />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}
