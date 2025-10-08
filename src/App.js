import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { FiHeart, FiUser, FiMapPin, FiHome, FiStar, FiWifi, FiTv, FiCoffee, FiDroplet, FiSearch, FiMail, FiPhone, FiInfo, FiCheck, FiMenu, FiX } from "react-icons/fi";
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

// Responsive styles
const styles = {
  container: {
    maxWidth: 1500,
    margin: "0 auto",
    padding: "0 16px",
    fontFamily: "'Inter', sans-serif",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column"
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
    textDecoration: 'none',
    '@media (min-width: 768px)': {
      fontSize: 24
    }
  },
  logo: {
    height: 32,
    borderRadius: 6,
    '@media (min-width: 768px)': {
      height: 40
    }
  },
  nav: {
    display: 'none',
    alignItems: 'center',
    gap: 16,
    '@media (min-width: 768px)': {
      display: 'flex'
    }
  },
  navLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    '@media (min-width: 768px)': {
      flexDirection: 'row',
      gap: 20
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
    padding: '8px 12px',
    borderRadius: 30,
    border: '1px solid #ddd',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: 14,
    '@media (min-width: 768px)': {
      padding: '10px 15px'
    }
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
    listStyle: 'none',
    '@media (min-width: 480px)': {
      gridTemplateColumns: 'repeat(2, 1fr)'
    },
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 25
    }
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
    height: 200,
    objectFit: 'cover',
    borderRadius: 12,
    marginBottom: 10,
    '@media (min-width: 768px)': {
      height: 250
    }
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
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': {
      display: 'none'
    },
    '@media (min-width: 768px)': {
      gap: 15,
      marginBottom: 25
    }
  },
  filterButton: {
    padding: '8px 12px',
    borderRadius: 30,
    border: '1px solid #ddd',
    backgroundColor: 'white',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontSize: 14,
    fontWeight: 500,
    '@media (min-width: 768px)': {
      padding: '10px 15px'
    }
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
    cursor: 'pointer',
    '@media (min-width: 768px)': {
      marginBottom: 20
    }
  },
  formContainer: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '20px 0',
    width: '100%'
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    '@media (min-width: 768px)': {
      fontSize: 28,
      marginBottom: 30
    }
  },
  formSection: {
    marginBottom: 24,
    '@media (min-width: 768px)': {
      marginBottom: 30
    }
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    '@media (min-width: 768px)': {
      fontSize: 20,
      marginBottom: 15
    }
  },
  inputGroup: {
    marginBottom: 16,
    '@media (min-width: 768px)': {
      marginBottom: 20
    }
  },
  label: {
    display: 'block',
    marginBottom: 6,
    fontWeight: 500,
    fontSize: 14,
    '@media (min-width: 768px)': {
      marginBottom: 8,
      fontSize: 16
    }
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
    marginTop: 12,
    '@media (min-width: 480px)': {
      gridTemplateColumns: 'repeat(2, 1fr)'
    },
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 15,
      marginTop: 15
    }
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 'auto'
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
    width: '100%',
    ':hover': {
      backgroundColor: '#e51e4d'
    },
    '@media (min-width: 768px)': {
      padding: '15px 25px',
      width: 'auto'
    }
  },
  detailContainer: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '20px 0',
    width: '100%'
  },
  detailHeader: {
    marginBottom: 24,
    '@media (min-width: 768px)': {
      marginBottom: 30
    }
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    '@media (min-width: 768px)': {
      fontSize: 28,
      marginBottom: 10
    }
  },
  detailLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    color: '#717171',
    fontSize: 14,
    marginBottom: 16,
    '@media (min-width: 768px)': {
      fontSize: 16,
      marginBottom: 20
    }
  },
  detailImage: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 24,
    maxHeight: 400,
    objectFit: 'cover',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    '@media (min-width: 768px)': {
      maxHeight: 500,
      marginBottom: 30
    }
  },
  detailInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 30,
    marginTop: 30,
    '@media (min-width: 1024px)': {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: 40
    }
  },
  detailAmenities: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 12,
    marginTop: 20,
    '@media (min-width: 480px)': {
      gridTemplateColumns: 'repeat(2, 1fr)'
    },
    '@media (min-width: 768px)': {
      marginTop: 30
    }
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
    order: -1,
    '@media (min-width: 1024px)': {
      order: 0,
      position: 'sticky',
      top: 20
    }
  },
  priceDetail: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    '@media (min-width: 768px)': {
      fontSize: 22,
      marginBottom: 20
    }
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
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#e51e4d'
    },
    '@media (min-width: 768px)': {
      padding: 15
    }
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
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#3d8b40'
    },
    '@media (min-width: 768px)': {
      padding: 15
    }
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
    '@media (min-width: 480px)': {
      flexDirection: 'row',
      alignItems: 'center'
    }
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
    maxWidth: 1200,
    margin: '0 auto',
    padding: '32px 16px',
    width: '100%',
    '@media (min-width: 768px)': {
      padding: '40px 20px'
    }
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    '@media (min-width: 768px)': {
      fontSize: 36,
      marginBottom: 30
    }
  },
  pageContent: {
    lineHeight: 1.8,
    fontSize: 16,
    maxWidth: 800,
    margin: '0 auto',
    '@media (min-width: 768px)': {
      fontSize: 18
    }
  },
  teamContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 24,
    marginTop: 32,
    '@media (min-width: 480px)': {
      gridTemplateColumns: 'repeat(2, 1fr)'
    },
    '@media (min-width: 768px)': {
      gap: 30,
      marginTop: 40
    }
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
    border: '3px solid #ff385c',
    '@media (min-width: 768px)': {
      width: 150,
      height: 150
    }
  },
  contactForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginTop: 24,
    '@media (min-width: 768px)': {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20,
      marginTop: 30
    }
  },
  contactInput: {
    padding: '12px 15px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 16,
    width: '100%',
    boxSizing: 'border-box'
  },
  fullWidthInput: {
    gridColumn: '1 / -1'
  },
  featureList: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 20,
    marginTop: 32,
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 30,
      marginTop: 40
    }
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    textAlign: 'center',
    '@media (min-width: 768px)': {
      padding: 30
    }
  },
  featureIcon: {
    fontSize: 32,
    color: '#ff385c',
    marginBottom: 16,
    '@media (min-width: 768px)': {
      fontSize: 40,
      marginBottom: 20
    }
  },
  footer: {
    backgroundColor: '#f8f9fa',
    padding: '32px 0',
    marginTop: 'auto',
    borderTop: '1px solid #ebebeb',
    '@media (min-width: 768px)': {
      padding: '40px 0'
    }
  },
  footerContainer: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 16px',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 32,
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: 40,
      padding: '0 20px'
    }
  },
  footerColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    '@media (min-width: 768px)': {
      gap: 15
    }
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    '@media (min-width: 768px)': {
      fontSize: 18,
      marginBottom: 10
    }
  },
  footerLink: {
    color: '#666',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'color 0.2s',
    fontSize: 14,
    ':hover': {
      color: '#ff385c'
    },
    '@media (min-width: 768px)': {
      fontSize: 16
    }
  },
  copyright: {
    textAlign: 'center',
    paddingTop: 24,
    color: '#666',
    borderTop: '1px solid #ebebeb',
    marginTop: 24,
    fontSize: 14,
    '@media (min-width: 768px)': {
      paddingTop: 30,
      marginTop: 30,
      fontSize: 16
    }
  },
  testimonialContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    overflowX: 'auto',
    paddingBottom: 20,
    marginTop: 32,
    '@media (min-width: 768px)': {
      flexDirection: 'row',
      gap: 30,
      marginTop: 40
    }
  },
  testimonialCard: {
    minWidth: 'auto',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    '@media (min-width: 768px)': {
      minWidth: 300,
      padding: 25
    }
  },
  testimonialText: {
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 1.6,
    '@media (min-width: 768px)': {
      marginBottom: 15
    }
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
    padding: 12,
    marginTop: 16,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    '@media (min-width: 768px)': {
      padding: 15,
      marginTop: 20,
      alignItems: 'center'
    }
  },
  // Mobile menu styles
  hamburgerButton: {
    display: 'block',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    padding: 8,
    '@media (min-width: 768px)': {
      display: 'none'
    }
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
    boxSizing: 'border-box',
    '@media (min-width: 768px)': {
      marginBottom: 15
    }
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    '@media (min-width: 768px)': {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20
    }
  },
  filterGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
    '@media (min-width: 768px)': {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 15
    }
  }
};

// Apply responsive styles with media queries
const responsiveStyles = {
  ...styles,
  container: {
    ...styles.container,
    '@media (max-width: 767px)': {
      padding: '0 12px'
    }
  }
};

function AuthBar({ user, handleLogin, handleLogout }) {
  return (
    <div style={responsiveStyles.nav}>
      {user ? (
        <>
          <Link to="/add-homestay" style={{ ...responsiveStyles.authButton, ...responsiveStyles.btnPrimary }}>
            Add Homestay
          </Link>
          <button style={responsiveStyles.authButton} onClick={handleLogout}>
            <FiUser /> Logout
          </button>
        </>
      ) : (
        <button style={responsiveStyles.authButton} onClick={handleLogin}>
          <FiUser /> Login
        </button>
      )}
    </div>
  );
}

function NavigationBar({ isMobile, closeMenu }) {
  const navStyle = isMobile ? responsiveStyles.mobileNav : responsiveStyles.navLinks;
  
  return (
    <div style={navStyle}>
      <Link to="/" style={responsiveStyles.navLink} onClick={closeMenu}>Home</Link>
      <Link to="/about" style={responsiveStyles.navLink} onClick={closeMenu}>About Us</Link>
      <Link to="/contact" style={responsiveStyles.navLink} onClick={closeMenu}>Contact</Link>
      <Link to="/premium" style={responsiveStyles.navLink} onClick={closeMenu}>Premium</Link>
    </div>
  );
}

function HomestayListing({ homestays }) {
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedArea, setSelectedArea] = useState("All");
  const [coupleFriendlyOnly, setCoupleFriendlyOnly] = useState(false);
  const [hourlyOnly, setHourlyOnly] = useState(false);
  const [roomType, setRoomType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHomestays = homestays.filter(homestay => {
    const matchesCity =
      selectedCity === "All" || homestay.city === selectedCity;

    const matchesArea =
      selectedArea === "All" || homestay.area === selectedArea;

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
      homestay.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      homestay.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCity && matchesArea && matchesCoupleFriendly && matchesHourly && matchesRoomType && matchesSearch;
  });

  const availableAreas = selectedCity === "All" 
    ? [] 
    : AREAS_BY_CITY[selectedCity] || [];

  return (
    <div>
      <div style={responsiveStyles.searchContainer}>
        <input
          type="text"
          placeholder="Search homestays by name, location or description..."
          style={responsiveStyles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button style={responsiveStyles.searchButton}>
          <FiSearch /> Search
        </button>
      </div>

      <div style={responsiveStyles.filterGrid}>
        <div>
          <label style={responsiveStyles.label}>Select City</label>
          <select
            style={responsiveStyles.cityDropdown}
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
          <label style={responsiveStyles.label}>Select Area</label>
          <select
            style={responsiveStyles.locationDropdown}
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

      <div style={responsiveStyles.filterContainer}>
        <button
          style={{
            ...responsiveStyles.filterButton,
            ...(coupleFriendlyOnly ? responsiveStyles.activeFilter : {})
          }}
          onClick={() => setCoupleFriendlyOnly(!coupleFriendlyOnly)}
        >
          Couple Friendly
        </button>

        <button
          style={{
            ...responsiveStyles.filterButton,
            ...(hourlyOnly ? responsiveStyles.activeFilter : {})
          }}
          onClick={() => setHourlyOnly(!hourlyOnly)}
        >
          Hourly Stays
        </button>

        <select
          style={responsiveStyles.filterButton}
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
        <ul style={responsiveStyles.homestayList}>
          {filteredHomestays.map(homestay => (
            <li key={homestay.id} style={responsiveStyles.homestayItem}>
              <Link to={`/homestays/${homestay.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={homestay.imageUrl}
                    alt={homestay.name}
                    style={responsiveStyles.homestayImage}
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
                      gap: 3,
                      '@media (min-width: 768px)': {
                        top: 15,
                        left: 15,
                        fontSize: 12
                      }
                    }}>
                      <FiStar fill="#333" /> PREMIUM
                    </div>
                  )}
                  <button style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 16,
                    '@media (min-width: 768px)': {
                      top: 15,
                      right: 15,
                      width: 32,
                      height: 32
                    }
                  }}>
                    <FiHeart />
                  </button>
                </div>
                <div style={responsiveStyles.homestayInfo}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={responsiveStyles.title}>{homestay.name}</h3>
                    <div style={responsiveStyles.rating}>
                      <FiStar fill="#ff385c" color="#ff385c" />
                      {homestay.rating || "New"}
                    </div>
                  </div>
                  <p style={responsiveStyles.location}>
                    <FiMapPin /> {homestay.area}, {homestay.city}
                  </p>
                  <p style={responsiveStyles.price}>₹{homestay.price} / night</p>
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

function AddHomestayForm() {
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    area: "",
    price: "",
    description: "",
    imageUrl: "",
    roomType: "",
    amenities: [],
    coupleFriendly: false,
    hourly: false,
    premium: false,
    contactEmail: "",
    contactPhone: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return unsubscribe;
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleAmenityChange = (amenityId) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to add a homestay");
      return;
    }

    setUploading(true);

    try {
      let imageUrl = formData.imageUrl;

      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      const homestayData = {
        ...formData,
        imageUrl,
        ownerId: user.uid,
        ownerName: user.displayName || user.email,
        createdAt: new Date(),
        rating: Math.floor(Math.random() * 2) + 4
      };

      await addDoc(collection(db, "homestays"), homestayData);
      alert("Homestay added successfully!");
      setFormData({
        name: "",
        city: "",
        area: "",
        price: "",
        description: "",
        imageUrl: "",
        roomType: "",
        amenities: [],
        coupleFriendly: false,
        hourly: false,
        premium: false,
        contactEmail: "",
        contactPhone: ""
      });
      setImageFile(null);
    } catch (error) {
      console.error("Error adding homestay:", error);
      alert("Error adding homestay. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const availableAreas = formData.city ? AREAS_BY_CITY[formData.city] || [] : [];

  return (
    <div style={responsiveStyles.formContainer}>
      <h1 style={responsiveStyles.formTitle}>Add Your Homestay</h1>
      <form onSubmit={handleSubmit}>
        <div style={responsiveStyles.formGrid}>
          <div style={responsiveStyles.inputGroup}>
            <label style={responsiveStyles.label}>Homestay Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              style={responsiveStyles.input}
              placeholder="Enter homestay name"
            />
          </div>

          <div style={responsiveStyles.inputGroup}>
            <label style={responsiveStyles.label}>City *</label>
            <select
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              required
              style={responsiveStyles.input}
            >
              <option value="">Select a City</option>
              {ALL_CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div style={responsiveStyles.inputGroup}>
            <label style={responsiveStyles.label}>Area *</label>
            <select
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              required
              disabled={!formData.city}
              style={responsiveStyles.input}
            >
              <option value="">Select an Area</option>
              {availableAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div style={responsiveStyles.inputGroup}>
            <label style={responsiveStyles.label}>Price per Night (₹) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              style={responsiveStyles.input}
              placeholder="Enter price per night"
            />
          </div>
        </div>

        <div style={responsiveStyles.formSection}>
          <h3 style={responsiveStyles.sectionTitle}>Room Information</h3>
          <div style={responsiveStyles.formGrid}>
            <div style={responsiveStyles.inputGroup}>
              <label style={responsiveStyles.label}>Room Type *</label>
              <select
                name="roomType"
                value={formData.roomType}
                onChange={handleInputChange}
                required
                style={responsiveStyles.input}
              >
                <option value="">Select Room Type</option>
                {ROOM_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div style={responsiveStyles.inputGroup}>
              <label style={responsiveStyles.label}>
                <input
                  type="checkbox"
                  name="coupleFriendly"
                  checked={formData.coupleFriendly}
                  onChange={handleInputChange}
                  style={{ marginRight: 8 }}
                />
                Couple Friendly
              </label>
            </div>

            <div style={responsiveStyles.inputGroup}>
              <label style={responsiveStyles.label}>
                <input
                  type="checkbox"
                  name="hourly"
                  checked={formData.hourly}
                  onChange={handleInputChange}
                  style={{ marginRight: 8 }}
                />
                Available for Hourly Stays
              </label>
            </div>

            <div style={responsiveStyles.inputGroup}>
              <label style={responsiveStyles.label}>
                <input
                  type="checkbox"
                  name="premium"
                  checked={formData.premium}
                  onChange={handleInputChange}
                  style={{ marginRight: 8 }}
                />
                Premium Listing
              </label>
            </div>
          </div>
        </div>

        <div style={responsiveStyles.formSection}>
          <h3 style={responsiveStyles.sectionTitle}>Contact Information</h3>
          <div style={responsiveStyles.formGrid}>
            <div style={responsiveStyles.inputGroup}>
              <label style={responsiveStyles.label}>Contact Email *</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                required
                style={responsiveStyles.input}
                placeholder="Enter contact email"
              />
            </div>

            <div style={responsiveStyles.inputGroup}>
              <label style={responsiveStyles.label}>Contact Phone *</label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                required
                style={responsiveStyles.input}
                placeholder="Enter contact phone number"
              />
            </div>
          </div>
        </div>

        <div style={responsiveStyles.formSection}>
          <h3 style={responsiveStyles.sectionTitle}>Description</h3>
          <div style={responsiveStyles.inputGroup}>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              style={responsiveStyles.textarea}
              placeholder="Describe your homestay, including nearby attractions, facilities, and any special features..."
            />
          </div>
        </div>

        <div style={responsiveStyles.formSection}>
          <h3 style={responsiveStyles.sectionTitle}>Images</h3>
          <div style={responsiveStyles.inputGroup}>
            <label style={responsiveStyles.label}>Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              style={responsiveStyles.input}
            />
          </div>
          <div style={responsiveStyles.inputGroup}>
            <label style={responsiveStyles.label}>Or Enter Image URL</label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              style={responsiveStyles.input}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          {(imageFile || formData.imageUrl) && (
            <img
              src={imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl}
              alt="Preview"
              style={responsiveStyles.imagePreview}
            />
          )}
        </div>

        <div style={responsiveStyles.formSection}>
          <h3 style={responsiveStyles.sectionTitle}>Amenities</h3>
          <div style={responsiveStyles.checkboxGroup}>
            {AMENITIES.map(amenity => (
              <label key={amenity.id} style={responsiveStyles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity.id)}
                  onChange={() => handleAmenityChange(amenity.id)}
                  style={{ marginRight: 8 }}
                />
                {amenity.icon && <span style={{ marginRight: 5 }}>{amenity.icon}</span>}
                {amenity.name}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading}
          style={responsiveStyles.submitButton}
        >
          {uploading ? "Adding Homestay..." : "Add Homestay"}
        </button>
      </form>
    </div>
  );
}

function HomestayDetail() {
  const { id } = useParams();
  const [homestay, setHomestay] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHomestay = async () => {
      try {
        const docRef = doc(db, "homestays", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setHomestay({ id: docSnap.id, ...docSnap.data() });
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching homestay:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchHomestay();
  }, [id, navigate]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>;
  }

  if (!homestay) {
    return <div style={{ textAlign: 'center', padding: 40 }}>Homestay not found</div>;
  }

  const selectedAmenities = AMENITIES.filter(amenity => 
    homestay.amenities?.includes(amenity.id)
  );

  return (
    <div style={responsiveStyles.detailContainer}>
      <div style={responsiveStyles.detailHeader}>
        <h1 style={responsiveStyles.detailTitle}>
          {homestay.name}
          {homestay.premium && (
            <span style={responsiveStyles.premiumBadge}>
              <FiStar fill="#333" /> PREMIUM
            </span>
          )}
        </h1>
        <p style={responsiveStyles.detailLocation}>
          <FiMapPin /> {homestay.area}, {homestay.city}
        </p>
        <div style={responsiveStyles.rating}>
          <FiStar fill="#ff385c" color="#ff385c" />
          {homestay.rating || "New"}
        </div>
      </div>

      <img
        src={homestay.imageUrl}
        alt={homestay.name}
        style={responsiveStyles.detailImage}
      />

      <div style={responsiveStyles.detailInfo}>
        <div>
          <div style={responsiveStyles.formSection}>
            <h3 style={responsiveStyles.sectionTitle}>Description</h3>
            <p style={{ lineHeight: 1.6 }}>{homestay.description}</p>
          </div>

          <div style={responsiveStyles.formSection}>
            <h3 style={responsiveStyles.sectionTitle}>Room Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p><strong>Room Type:</strong> {homestay.roomType}</p>
              <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
                {homestay.coupleFriendly && (
                  <span style={{
                    backgroundColor: '#e8f5e8',
                    color: '#2e7d32',
                    padding: '5px 12px',
                    borderRadius: 20,
                    fontSize: 14,
                    fontWeight: 500
                  }}>
                    Couple Friendly
                  </span>
                )}
                {homestay.hourly && (
                  <span style={{
                    backgroundColor: '#e3f2fd',
                    color: '#1565c0',
                    padding: '5px 12px',
                    borderRadius: 20,
                    fontSize: 14,
                    fontWeight: 500
                  }}>
                    Hourly Stays Available
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={responsiveStyles.formSection}>
            <h3 style={responsiveStyles.sectionTitle}>Amenities</h3>
            <div style={responsiveStyles.detailAmenities}>
              {selectedAmenities.map(amenity => (
                <div key={amenity.id} style={responsiveStyles.amenityItem}>
                  {amenity.icon && amenity.icon}
                  <span>{amenity.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={responsiveStyles.bookingCard}>
          <div style={responsiveStyles.priceDetail}>
            ₹{homestay.price} / night
          </div>
          
          <button style={responsiveStyles.bookButton}>
            Book Now
          </button>
          
          <button 
            style={responsiveStyles.callButton}
            onClick={() => window.location.href = `tel:${homestay.contactPhone}`}
          >
            <FiPhone /> Call Now
          </button>

          {homestay.premium && (
            <div style={responsiveStyles.premiumBanner}>
              <FiInfo color="#ff9800" size={20} />
              <div>
                <strong>Premium Verified</strong>
                <div style={{ fontSize: 14, marginTop: 2 }}>
                  This property has been verified for quality and safety
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #ebebeb' }}>
            <h4 style={{ marginBottom: 10 }}>Contact Information</h4>
            <p style={{ marginBottom: 5 }}>
              <FiMail style={{ marginRight: 8 }} />
              {homestay.contactEmail}
            </p>
            <p>
              <FiPhone style={{ marginRight: 8 }} />
              {homestay.contactPhone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div style={responsiveStyles.pageContainer}>
      <Helmet>
        <title>About Us - HomestayHub</title>
        <meta name="description" content="Learn about HomestayHub - your trusted platform for finding the perfect homestay experience across India." />
      </Helmet>
      
      <h1 style={responsiveStyles.pageTitle}>About HomestayHub</h1>
      
      <div style={responsiveStyles.pageContent}>
        <p>
          Welcome to HomestayHub, your premier destination for discovering unique and comfortable 
          homestay experiences across India. Founded with a passion for authentic travel and local 
          experiences, we connect travelers with homeowners to create memorable stays.
        </p>
        
        <p>
          Our platform features carefully curated homestays in popular destinations like Guwahati, 
          Shillong, and Goa, with plans to expand nationwide. Each property is verified to ensure 
          quality and provide you with peace of mind during your travels.
        </p>
        
        <h2 style={{ marginTop: 30, marginBottom: 15 }}>Our Mission</h2>
        <p>
          To revolutionize the way people travel by providing authentic, local experiences through 
          trusted homestay accommodations that offer comfort, privacy, and a personal touch.
        </p>
        
        <h2 style={{ marginTop: 30, marginBottom: 15 }}>Why Choose HomestayHub?</h2>
        <div style={responsiveStyles.featureList}>
          <div style={responsiveStyles.featureCard}>
            <FiCheck style={responsiveStyles.featureIcon} />
            <h3>Verified Properties</h3>
            <p>Every homestay is carefully reviewed and verified for quality and safety standards.</p>
          </div>
          
          <div style={responsiveStyles.featureCard}>
            <FiStar style={responsiveStyles.featureIcon} />
            <h3>Premium Listings</h3>
            <p>Discover our premium collection of high-quality, well-maintained properties.</p>
          </div>
          
          <div style={responsiveStyles.featureCard}>
            <FiUser style={responsiveStyles.featureIcon} />
            <h3>Local Experiences</h3>
            <p>Immerse yourself in local culture with authentic homestay experiences.</p>
          </div>
        </div>
        
        <h2 style={{ marginTop: 30, marginBottom: 15 }}>Our Team</h2>
        <div style={responsiveStyles.teamContainer}>
          <div style={responsiveStyles.teamMember}>
            <div style={responsiveStyles.memberImage}></div>
            <h3>Founder & CEO</h3>
            <p>Leading the vision to transform travel experiences across India.</p>
          </div>
          
          <div style={responsiveStyles.teamMember}>
            <div style={responsiveStyles.memberImage}></div>
            <h3>Operations Head</h3>
            <p>Ensuring smooth operations and quality control across all properties.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Thank you for your message! We'll get back to you soon.");
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: ""
    });
  };

  return (
    <div style={responsiveStyles.pageContainer}>
      <Helmet>
        <title>Contact Us - HomestayHub</title>
        <meta name="description" content="Get in touch with HomestayHub team for any queries or support." />
      </Helmet>
      
      <h1 style={responsiveStyles.pageTitle}>Contact Us</h1>
      
      <div style={responsiveStyles.pageContent}>
        <p>
          Have questions or need assistance? We're here to help! Reach out to our team through 
          any of the following methods:
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiMail />
            <span>Email: support@homestayhub.com</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiPhone />
            <span>Phone: +91-9876543210</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiMapPin />
            <span>Address: Guwahati, Assam, India</span>
          </div>
        </div>
        
        <h2 style={{ marginTop: 30, marginBottom: 15 }}>Send us a Message</h2>
        <form onSubmit={handleSubmit} style={responsiveStyles.contactForm}>
          <div style={responsiveStyles.inputGroup}>
            <label style={responsiveStyles.label}>Your Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              style={responsiveStyles.contactInput}
            />
          </div>
          
          <div style={responsiveStyles.inputGroup}>
            <label style={responsiveStyles.label}>Your Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              style={responsiveStyles.contactInput}
            />
          </div>
          
          <div style={{ ...responsiveStyles.inputGroup, ...responsiveStyles.fullWidthInput }}>
            <label style={responsiveStyles.label}>Subject *</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              style={responsiveStyles.contactInput}
            />
          </div>
          
          <div style={{ ...responsiveStyles.inputGroup, ...responsiveStyles.fullWidthInput }}>
            <label style={responsiveStyles.label}>Message *</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              style={{ ...responsiveStyles.textarea, minHeight: 120 }}
            />
          </div>
          
          <div style={{ ...responsiveStyles.inputGroup, ...responsiveStyles.fullWidthInput }}>
            <button type="submit" style={responsiveStyles.submitButton}>
              Send Message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PremiumPage() {
  return (
    <div style={responsiveStyles.pageContainer}>
      <Helmet>
        <title>Premium Homestays - HomestayHub</title>
        <meta name="description" content="Discover our premium collection of verified, high-quality homestays with exceptional amenities and services." />
      </Helmet>
      
      <h1 style={responsiveStyles.pageTitle}>Premium Homestays</h1>
      
      <div style={responsiveStyles.pageContent}>
        <p>
          Upgrade your travel experience with HomestayHub Premium - our exclusive collection of 
          verified, high-quality homestays that offer exceptional comfort, amenities, and service.
        </p>
        
        <div style={responsiveStyles.premiumBanner}>
          <FiStar fill="#ffd700" color="#ff9800" size={24} />
          <div>
            <strong>Premium Benefits</strong>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiCheck color="#4CAF50" /> Enhanced Verification Process
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiCheck color="#4CAF50" /> Priority Customer Support
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiCheck color="#4CAF50" /> Premium Amenities Included
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiCheck color="#4CAF50" /> Quality Guarantee
              </div>
            </div>
          </div>
        </div>
        
        <h2 style={{ marginTop: 30, marginBottom: 15 }}>What Makes a Homestay Premium?</h2>
        <ul style={{ lineHeight: 1.8, paddingLeft: 20 }}>
          <li>Rigorous quality verification and regular inspections</li>
          <li>High-standard cleanliness and maintenance</li>
          <li>Premium amenities and facilities</li>
          <li>Excellent host responsiveness and service</li>
          <li>Prime locations with easy access to attractions</li>
          <li>Enhanced safety and security measures</li>
        </ul>
        
        <h2 style={{ marginTop: 30, marginBottom: 15 }}>Become a Premium Host</h2>
        <p>
          List your property as Premium and enjoy increased visibility, higher booking rates, 
          and access to our premium host support program. Contact us to learn more about the 
          verification process and requirements.
        </p>
        
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <Link to="/contact" style={{ ...responsiveStyles.submitButton, display: 'inline-block' }}>
            Contact Us About Premium
          </Link>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer style={responsiveStyles.footer}>
      <div style={responsiveStyles.footerContainer}>
        <div style={responsiveStyles.footerColumn}>
          <h3 style={responsiveStyles.footerTitle}>HomestayHub</h3>
          <p style={{ color: '#666', lineHeight: 1.6 }}>
            Your trusted platform for authentic homestay experiences across India. 
            Discover comfortable stays and create memorable journeys.
          </p>
        </div>
        
        <div style={responsiveStyles.footerColumn}>
          <h3 style={responsiveStyles.footerTitle}>Quick Links</h3>
          <Link to="/" style={responsiveStyles.footerLink}>
            <FiHome /> Home
          </Link>
          <Link to="/about" style={responsiveStyles.footerLink}>
            <FiInfo /> About Us
          </Link>
          <Link to="/contact" style={responsiveStyles.footerLink}>
            <FiPhone /> Contact
          </Link>
          <Link to="/premium" style={responsiveStyles.footerLink}>
            <FiStar /> Premium
          </Link>
        </div>
        
        <div style={responsiveStyles.footerColumn}>
          <h3 style={responsiveStyles.footerTitle}>Contact Info</h3>
          <div style={responsiveStyles.footerLink}>
            <FiMail /> support@homestayhub.com
          </div>
          <div style={responsiveStyles.footerLink}>
            <FiPhone /> +91-9876543210
          </div>
          <div style={responsiveStyles.footerLink}>
            <FiMapPin /> Guwahati, Assam, India
          </div>
        </div>
        
        <div style={responsiveStyles.footerColumn}>
          <h3 style={responsiveStyles.footerTitle}>Cities</h3>
          {ALL_CITIES.map(city => (
            <div key={city} style={{ color: '#666', fontSize: 14, marginBottom: 5 }}>
              {city}
            </div>
          ))}
        </div>
      </div>
      
      <div style={responsiveStyles.copyright}>
        © 2024 HomestayHub. All rights reserved.
      </div>
    </footer>
  );
}

function App() {
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
        <title>HomestayHub - Find Your Perfect Homestay</title>
        <meta name="description" content="Discover authentic homestay experiences across India. Book comfortable, verified homestays in Guwahati, Shillong, Goa and more." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>

      <div style={responsiveStyles.container}>
        <header style={responsiveStyles.header}>
          <Link to="/" style={responsiveStyles.logoContainer}>
            <img src={logo} alt="HomestayHub Logo" style={responsiveStyles.logo} />
            HomestayHub
          </Link>

          {/* Desktop Navigation */}
          <NavigationBar isMobile={false} />

          {/* Desktop Auth Bar */}
          <AuthBar user={user} handleLogin={handleLogin} handleLogout={handleLogout} />

          {/* Mobile Menu Button */}
          <button style={responsiveStyles.hamburgerButton} onClick={toggleMobileMenu}>
            <FiMenu />
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        <div 
          style={{
            ...responsiveStyles.overlay,
            ...(mobileMenuOpen ? responsiveStyles.overlayVisible : {})
          }}
          onClick={closeMobileMenu}
        />

        {/* Mobile Menu */}
        <div 
          style={{
            ...responsiveStyles.mobileMenu,
            ...(mobileMenuOpen ? responsiveStyles.mobileMenuOpen : {})
          }}
        >
          <button style={responsiveStyles.closeButton} onClick={closeMobileMenu}>
            <FiX />
          </button>

          <NavigationBar isMobile={true} closeMenu={closeMobileMenu} />

          <div style={{ marginTop: 30 }}>
            {user ? (
              <>
                <Link 
                  to="/add-homestay" 
                  style={{ ...responsiveStyles.authButton, ...responsiveStyles.btnPrimary, display: 'block', textAlign: 'center', marginBottom: 15 }}
                  onClick={closeMobileMenu}
                >
                  Add Homestay
                </Link>
                <button 
                  style={{ ...responsiveStyles.authButton, width: '100%' }} 
                  onClick={() => { handleLogout(); closeMobileMenu(); }}
                >
                  <FiUser /> Logout
                </button>
              </>
            ) : (
              <button 
                style={{ ...responsiveStyles.authButton, width: '100%' }} 
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

export default App;
