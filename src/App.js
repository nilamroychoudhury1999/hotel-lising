import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import {  FiUser, FiMapPin, FiHome, FiStar, FiWifi, FiTv, FiCoffee, FiDroplet, FiSearch, FiMail, FiPhone, FiInfo, FiCheck, FiMenu, FiX, FiSmartphone } from "react-icons/fi";
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

// Mobile-only styles
const styles = {
  container: {
    maxWidth: '100%',
    margin: "0 auto",
    padding: "0 16px",
    fontFamily: "'Inter', sans-serif",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: '#fff'
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
    color: '#ff385c',
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
    padding: '16px 0',
    borderBottom: '1px solid #ebebeb',
    marginBottom: 24,
    position: 'relative'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#ff385c',
    fontWeight: 'bold',
    fontSize: 20,
    textDecoration: 'none'
  },
  logo: {
    height: 32,
    borderRadius: 6
  },
  navLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  navLink: {
    color: '#333',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: 16,
    transition: 'color 0.2s'
  },
  authButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '8px 12px',
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
    gridTemplateColumns: '1fr',
    gap: 20,
    padding: 0,
    listStyle: 'none'
  },
  homestayItem: {
    borderRadius: 12,
    overflow: 'hidden',
    transition: 'transform 0.2s',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  homestayImage: {
    width: '100%',
    height: 200,
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
    gap: 12,
    marginBottom: 20,
    overflowX: 'auto',
    paddingBottom: 10,
    scrollbarWidth: 'none'
  },
  filterButton: {
    padding: '8px 12px',
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
    marginBottom: 16,
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  formContainer: {
    maxWidth: '100%',
    margin: '0 auto',
    padding: '20px 0',
    width: '100%'
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24
  },
  formSection: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    display: 'block',
    marginBottom: 6,
    fontWeight: 500,
    fontSize: 14
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 16,
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 16,
    minHeight: 100,
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  checkboxGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 12,
    marginTop: 12
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
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
    padding: '12px 20px',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: 20,
    transition: 'background-color 0.2s',
    width: '100%'
  },
  detailContainer: {
    maxWidth: '100%',
    margin: '0 auto',
    padding: '20px 0',
    width: '100%'
  },
  detailHeader: {
    marginBottom: 24
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8
  },
  detailLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    color: '#717171',
    fontSize: 14,
    marginBottom: 16
  },
  detailImage: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 24,
    maxHeight: 400,
    objectFit: 'cover',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  detailInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 30,
    marginTop: 30
  },
  detailAmenities: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 12,
    marginTop: 20
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
    order: -1
  },
  priceDetail: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16
  },
  bookButton: {
    width: '100%',
    padding: 12,
    backgroundColor: '#ff385c',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  callButton: {
    width: '100%',
    padding: 12,
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
    transition: 'background-color 0.2s'
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20
  },
  searchInput: {
    flex: 1,
    padding: '12px 15px',
    borderRadius: 30,
    border: '1px solid #ddd',
    fontSize: 16,
    width: '100%',
    boxSizing: 'border-box'
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
    justifyContent: 'center',
    gap: 5,
    whiteSpace: 'nowrap'
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
    maxWidth: '100%',
    margin: '0 auto',
    padding: '32px 16px',
    width: '100%'
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center'
  },
  pageContent: {
    lineHeight: 1.8,
    fontSize: 16,
    maxWidth: '100%',
    margin: '0 auto'
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
    border: '3px solid #ff385c'
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
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    textAlign: 'center'
  },
  featureIcon: {
    fontSize: 32,
    color: '#ff385c',
    marginBottom: 16
  },
  footer: {
    backgroundColor: '#f8f9fa',
    padding: '32px 0',
    marginTop: 'auto',
    borderTop: '1px solid #ebebeb'
  },
  footerContainer: {
    maxWidth: '100%',
    margin: '0 auto',
    padding: '0 16px',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 32
  },
  footerColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8
  },
  footerLink: {
    color: '#666',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14
  },
  copyright: {
    textAlign: 'center',
    paddingTop: 24,
    color: '#666',
    borderTop: '1px solid #ebebeb',
    marginTop: 24,
    fontSize: 14
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
    backgroundColor: '#fff8e1',
    border: '1px solid #ffd54f',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10
  },
  hamburgerButton: {
    display: 'block',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    padding: 8
  },
  mobileMenu: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '80%',
    height: '100vh',
    backgroundColor: 'white',
    zIndex: 1000,
    padding: 20,
    boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
    transform: 'translateX(100%)',
    transition: 'transform 0.3s ease-in-out',
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
    gap: 20,
    marginTop: 40
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
    display: 'none'
  },
  overlayVisible: {
    display: 'block'
  },
  cityDropdown: {
    padding: '12px 15px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 16,
    width: '100%',
    marginBottom: 12,
    backgroundColor: 'white',
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  filterGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20
  }
};

// Check if device is mobile
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Desktop Warning Component
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
        backgroundColor: '#fff', 
        padding: 20, 
        borderRadius: 12, 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: 400,
        width: '100%'
      }}>
        <h3 style={{ marginBottom: 10, color: '#333' }}>How to access:</h3>
        <ul style={{ textAlign: 'left', color: '#666', lineHeight: 1.8, paddingLeft: 20 }}>
          <li>Open this link on your mobile device</li>
          <li>Scan the QR code if available</li>
          <li>Use your smartphone's browser</li>
        </ul>
      </div>
    </div>
  );
}

// Homestay Listing Component
function HomestayListing({ homestays }) {
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedArea, setSelectedArea] = useState("All");
  const [coupleFriendlyOnly, setCoupleFriendlyOnly] = useState(false);
  const [hourlyOnly, setHourlyOnly] = useState(false);
  const [roomType, setRoomType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHomestays = homestays.filter(homestay => {
    const matchesCity = selectedCity === "All" || homestay.city === selectedCity;
    const matchesArea = selectedArea === "All" || homestay.area === selectedArea;
    const matchesCoupleFriendly = !coupleFriendlyOnly || homestay.coupleFriendly;
    const matchesHourly = !hourlyOnly || homestay.hourly;
    const matchesRoomType = roomType === "All" || homestay.roomType === roomType;
    const matchesSearch = searchQuery === "" ||
      homestay.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      homestay.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      homestay.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      homestay.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCity && matchesArea && matchesCoupleFriendly && matchesHourly && matchesRoomType && matchesSearch;
  });

  const availableAreas = selectedCity === "All" ? [] : AREAS_BY_CITY[selectedCity] || [];

  return (
    <div>
      <Helmet>
        <title>Find Homestays - Homavia</title>
        <meta name="description" content="Discover the perfect homestay for your stay in Guwahati, Shillong, and Goa." />
      </Helmet>

      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search homestays by name, location..."
          style={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button style={styles.searchButton}>
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
          >
            <option value="All">All Cities</option>
            {ALL_CITIES.map(city => (
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
          >
            <option value="All">
              {selectedCity === "All" ? "Select a city first" : `All Areas in ${selectedCity}`}
            </option>
            {availableAreas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
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
                      top: 10,
                      left: 10,
                      backgroundColor: '#ffd700',
                      color: '#333',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 10,
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={styles.title}>{homestay.name}</h3>
                    <div style={styles.rating}>
                      <FiStar fill="#ff385c" color="#ff385c" />
                      {homestay.rating || "New"}
                    </div>
                  </div>
                  <p style={styles.location}>
                    <FiMapPin /> {homestay.area}, {homestay.city}
                  </p>
                  <p style={styles.price}>₹{homestay.price} / night</p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                    {homestay.coupleFriendly && (
                      <span style={{
                        backgroundColor: '#e8f5e8',
                        color: '#2e7d32',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500
                      }}>
                        Couple Friendly
                      </span>
                    )}
                    {homestay.hourly && (
                      <span style={{
                        backgroundColor: '#e3f2fd',
                        color: '#1565c0',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500
                      }}>
                        Hourly Stays
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Add Homestay Form Component
function AddHomestayForm() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
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
    imagePreview: null
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
    const updatedAmenities = form.amenities.includes(amenityId)
      ? form.amenities.filter(id => id !== amenityId)
      : [...form.amenities, amenityId];

    setForm({ ...form, amenities: updatedAmenities });
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
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: new Date().toISOString(),
        rating: Math.floor(Math.random() * 2) + 4
      });

      setForm({
        name: "",
        description: "",
        price: "",
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

  const availableAreas = form.city ? AREAS_BY_CITY[form.city] || [] : [];

  return (
    <div style={styles.formContainer}>
      <Helmet>
        <title>Add Homestay - Homavia</title>
        <meta name="description" content="List your homestay on Homavia and connect with travelers." />
      </Helmet>

      <h1 style={styles.formTitle}>List your homestay</h1>

      <div style={styles.premiumBanner}>
        <FiStar size={20} color="#ffd700" />
        <div>
          <p style={{ fontWeight: 'bold', marginBottom: 5, fontSize: 14 }}>Premium Listing Available</p>
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

        <div style={styles.formGrid}>
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

// Homestay Detail Component
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

  const selectedAmenities = AMENITIES.filter(amenity => 
    homestay.amenities?.includes(amenity.id)
  );

  return (
    <div style={styles.detailContainer}>
      <Helmet>
        <title>{homestay.name} - Homavia</title>
        <meta name="description" content={`${homestay.name} in ${homestay.area}, ${homestay.city}`} />
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
          <FiMapPin /> {homestay.area}, {homestay.city} • {homestay.roomType || 'Private Room'}
        </div>
        <div style={styles.rating}>
          <FiStar fill="#ff385c" color="#ff385c" /> {homestay.rating || 'New'}
        </div>
      </div>

      <img
        src={homestay.imageUrl}
        alt={homestay.name}
        style={styles.detailImage}
      />

      <div style={styles.detailInfo}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>About this place</h2>
          <p style={{ lineHeight: 1.6, marginBottom: 25 }}>{homestay.description || 'No description provided.'}</p>

          <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>Amenities</h2>
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

        <div style={styles.bookingCard}>
          <div style={styles.priceDetail}>
            ₹{homestay.price} <span style={{ fontWeight: 'normal' }}>/ night</span>
          </div>

          {homestay.premium && (
            <div style={{ backgroundColor: '#fff8e1', padding: 12, borderRadius: 8, marginBottom: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <FiCheck color="#4CAF50" size={16} />
                <span style={{ fontWeight: 'bold', fontSize: 14 }}>Premium Verified</span>
              </div>
              <p style={{ fontSize: 12 }}>This host has been verified and offers premium amenities.</p>
            </div>
          )}

          <button style={styles.bookButton}>
            Book Now
          </button>
          
          <a href={`tel:${homestay.contact}`} style={styles.callButton}>
            <FiPhone /> Call Host
          </a>

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

// About Page Component
function AboutPage() {
  return (
    <div style={styles.pageContainer}>
      <Helmet>
        <title>About Us - Homavia</title>
        <meta name="description" content="Learn about Homavia - your trusted platform for finding the perfect homestay." />
      </Helmet>

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
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}><FiMapPin /></div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Guwahati</h3>
            <p>The gateway to Northeast India, offering a blend of urban convenience and natural beauty.</p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}><FiHome /></div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Shillong</h3>
            <p>Known as the "Scotland of the East", this picturesque hill station offers cool climate and stunning landscapes.</p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}><FiStar /></div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Goa</h3>
            <p>Famous for its beaches, Portuguese heritage, and vibrant culture.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Contact Page Component
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
      <Helmet>
        <title>Contact Us - Homavia</title>
        <meta name="description" content="Get in touch with Homavia for any questions or support." />
      </Helmet>

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

// Premium Page Component
function PremiumPage() {
  return (
    <div style={styles.pageContainer}>
      <Helmet>
        <title>Premium Features - Homavia</title>
        <meta name="description" content="Upgrade to Homavia Premium to get more visibility for your homestay." />
      </Helmet>

      <h1 style={styles.pageTitle}>Premium Features</h1>

      <div style={{ ...styles.pageContent, textAlign: 'center' }}>
        <p style={{ fontSize: 16, marginBottom: 25 }}>
          Elevate your homestay listing with our Premium features designed to increase your visibility and bookings.
        </p>

        <div style={styles.featureList}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}><FiStar /></div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>Featured Listings</h3>
            <p>Your property appears at the top of search results with a premium badge.</p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}><FiSearch /></div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>3x More Visibility</h3>
            <p>Get up to 3 times more views compared to regular listings.</p>
          </div>

          <div style={styles.featureCard}>
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

// Footer Component
function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerContainer}>
        <div style={styles.footerColumn}>
          <div style={styles.logoContainer}>
            <img
              src={logo}
              alt="Homavia Logo"
              style={styles.logo}
            />
            <span>Homavia</span>
          </div>
          <p style={{ color: '#666', lineHeight: 1.6, fontSize: 14 }}>
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
          <a href="tel:+918638572663" style={styles.footerLink}><FiPhone /> +91 8638572663</a>
        </div>
      </div>

      <div style={styles.copyright}>
        © {new Date().getFullYear()} Homavia. All rights reserved.
      </div>
    </footer>
  );
}

// Mobile App Component
function MobileApp() {
  const [homestays, setHomestays] = useState([]);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "homestays"), (snapshot) => {
      const homestaysData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHomestays(homestaysData);
    });

    const authUnsubscribe = auth.onAuthStateChanged(setUser);

    return () => {
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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <Router>
      <Helmet>
        <title>Homavia - Find Your Perfect Homestay</title>
        <meta name="description" content="Discover authentic homestay experiences across India. Book comfortable, verified homestays in Guwahati, Shillong, Goa and more." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
          style={{
            ...styles.overlay,
            ...(mobileMenuOpen ? styles.overlayVisible : {})
          }}
          onClick={closeMobileMenu}
        />

        <div 
          style={{
            ...styles.mobileMenu,
            ...(mobileMenuOpen ? styles.mobileMenuOpen : {})
          }}
        >
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
          <Routes>
            <Route path="/" element={<HomestayListing homestays={homestays} />} />
            <Route path="/add-homestay" element={<AddHomestayForm />} />
            <Route path="/homestays/:id" element={<HomestayDetail />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/premium" element={<PremiumPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

// Main App Component
function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (!isMobile) {
    return <DesktopWarning />;
  }

  return <MobileApp />;
}

export default App;
