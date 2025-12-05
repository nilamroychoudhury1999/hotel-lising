import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
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
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate
} from "react-router-dom";
import {
  FiUser, FiMapPin, FiHome, FiStar, FiWifi, FiTv, FiCoffee, FiDroplet, FiSearch,
  FiMail, FiPhone, FiInfo, FiCheck, FiMenu, FiX, FiCalendar, FiNavigation, FiMap, FiFilter
} from "react-icons/fi";
import { Helmet } from "react-helmet";
import ICAL from "ical.js";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import logo from "./IMG-20250818-WA0009.jpg";

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

/* ------------------------------
   Styles
------------------------------ */
const styles = {
  container: {
    maxWidth: '100%',
    margin: "0 auto",
    padding: "0",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: '#fafafa'
  },
  mainContent: {
    maxWidth: '1440px',
    margin: '0 auto',
    width: '100%',
    padding: '0 24px',
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
    padding: '20px 24px',
    borderBottom: '1px solid #e0e0e0',
    marginBottom: 0,
    position: 'sticky',
    top: 0,
    backgroundColor: '#fff',
    zIndex: 100,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#ff385c',
    fontWeight: 'bold',
    fontSize: 22,
    textDecoration: 'none',
    letterSpacing: '-0.5px'
  },
  logo: {
    height: 36,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(255,56,92,0.2)'
  },
  navLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },
  navLink: {
    color: '#222',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: 16,
    transition: 'color 0.2s',
    letterSpacing: '-0.2px'
  },
  authButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 16px',
    borderRadius: 24,
    border: '1px solid #e0e0e0',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
  },
  btnPrimary: {
    backgroundColor: '#ff385c',
    color: 'white',
    border: 'none',
    boxShadow: '0 4px 12px rgba(255,56,92,0.25)'
  },
  homestayList: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 24,
    padding: 0,
    listStyle: 'none',
    marginTop: 10
  },
  homestayItem: {
    borderRadius: 16,
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    cursor: 'pointer'
  },
  homestayImage: {
    width: '100%',
    height: 220,
    objectFit: 'cover',
    borderRadius: '16px 16px 0 0',
    marginBottom: 0
  },
  homestayInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '16px'
  },
  price: {
    fontWeight: 'bold',
    fontSize: 19,
    color: '#222',
    letterSpacing: '-0.3px'
  },
  title: {
    fontWeight: 600,
    fontSize: 17,
    color: '#222',
    letterSpacing: '-0.2px',
    lineHeight: 1.3
  },
  location: {
    color: '#717171',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    letterSpacing: '-0.1px'
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 14,
    fontWeight: 600
  },
  filterContainer: {
    display: 'flex',
    gap: 10,
    marginBottom: 20,
    overflowX: 'auto',
    paddingBottom: 10,
    scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch'
  },
  filterButton: {
    padding: '10px 18px',
    borderRadius: 24,
    border: '1px solid #e0e0e0',
    backgroundColor: 'white',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
    letterSpacing: '-0.1px'
  },
  activeFilter: {
    backgroundColor: '#222',
    color: 'white',
    borderColor: '#222',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
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
    padding: '14px 24px',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 20,
    transition: 'all 0.2s',
    width: '100%',
    minHeight: 48
  },
  detailContainer: {
    maxWidth: '100%',
    margin: '0 auto',
    padding: '20px 0',
    width: '100%'
  },
  detailHeader: {
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: '1px solid #ebebeb'
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
    lineHeight: 1.3
  },
  detailLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    color: '#717171',
    fontSize: 15,
    marginBottom: 16
  },
  detailImage: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 24,
    maxHeight: 500,
    objectFit: 'cover',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
  },
  detailInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 30,
    marginTop: 30
  },
  detailAmenities: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 16,
    marginTop: 20
  },
  amenityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    fontSize: 15
  },
  bookingCard: {
    border: '1px solid #e0e0e0',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
    order: -1,
    backgroundColor: '#fff'
  },
  priceDetail: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222'
  },
  priceTypeLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'normal',
    marginLeft: 4
  },
  additionalPricing: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
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
    padding: '14px 24px',
    backgroundColor: '#ff385c',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: 48
  },
  callButton: {
    width: '100%',
    padding: '14px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.2s',
    textDecoration: 'none',
    minHeight: 48
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
    padding: '14px 24px',
    borderRadius: 30,
    border: 'none',
    backgroundColor: '#ff385c',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontSize: 16,
    fontWeight: 600,
    transition: 'all 0.2s',
    minHeight: 48,
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
  },
  datePickerContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    background: 'white',
    padding: 20,
    borderRadius: 16,
    border: '1px solid #e0e0e0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
  },
  dateInput: {
    padding: '14px 16px',
    borderRadius: 12,
    border: '1.5px solid #e0e0e0',
    fontSize: 15,
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
    backgroundColor: '#10b981',
    color: 'white',
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
    letterSpacing: '0.5px'
  },
  unavailableBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
    letterSpacing: '0.5px'
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
    border: '1.5px solid #ff385c',
    backgroundColor: 'white',
    color: '#ff385c',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(255, 56, 92, 0.1)'
  },
  showAvailableOnlyButton: {
    padding: '12px 18px',
    borderRadius: 12,
    border: 'none',
    backgroundColor: '#10b981',
    color: 'white',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
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
    height: '400px',
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    border: '1px solid #ddd'
  },
  viewToggleContainer: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 12
  },
  viewToggleButton: {
    flex: 1,
    padding: '10px 15px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: 'white',
    color: '#666',
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
    backgroundColor: '#ff385c',
    color: 'white'
  }
};

/* ------------------------------
   iCal Availability Helper
------------------------------ */
const fetchAndCheckAvailability = async (icalUrl, checkInDate, checkOutDate) => {
  if (!icalUrl || !checkInDate || !checkOutDate) {
    console.log('Missing parameters:', { icalUrl, checkInDate, checkOutDate });
    return 'unknown';
  }
  
  try {
    console.log('Fetching iCal from:', icalUrl);
    
    // Use a CORS proxy for external iCal URLs
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const urlToFetch = icalUrl.startsWith('http') ? proxyUrl + encodeURIComponent(icalUrl) : icalUrl;
    
    const response = await fetch(urlToFetch);
    if (!response.ok) {
      console.error('Failed to fetch iCal:', response.status, response.statusText);
      return 'unknown';
    }
    
    const icalData = await response.text();
    console.log('iCal data received, length:', icalData.length);
    
    if (!icalData || icalData.length < 10) {
      console.error('Invalid iCal data received');
      return 'unknown';
    }
    
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');
    
    console.log('Found', vevents.length, 'events in calendar');
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(23, 59, 59, 999);
    
    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      const eventStart = event.startDate.toJSDate();
      const eventEnd = event.endDate.toJSDate();
      
      console.log('Checking event:', {
        eventStart: eventStart.toISOString(),
        eventEnd: eventEnd.toISOString(),
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString()
      });
      
      // Check if there's any overlap between the requested dates and booked dates
      if (
        (checkIn >= eventStart && checkIn < eventEnd) ||
        (checkOut > eventStart && checkOut <= eventEnd) ||
        (checkIn <= eventStart && checkOut >= eventEnd)
      ) {
        console.log('Found conflict - property is unavailable');
        return 'unavailable';
      }
    }
    
    console.log('No conflicts found - property is available');
    return 'available';
  } catch (error) {
    console.error('Error checking availability:', error);
    return 'unknown';
  }
};

/* ------------------------------
   Homestay Listing
------------------------------ */
function HomestayListing({ homestays }) {
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedArea, setSelectedArea] = useState("All");
  const [coupleFriendlyOnly, setCoupleFriendlyOnly] = useState(false);
  const [hourlyOnly, setHourlyOnly] = useState(false);
  const [roomType, setRoomType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'map'
  const [showFilters, setShowFilters] = useState(true); // Filter expand/collapse
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
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all', 'available', 'booked'
  const [showCalendar, setShowCalendar] = useState(false);

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
        if (homestay.icalUrl) {
          const status = await fetchAndCheckAvailability(
            homestay.icalUrl,
            checkInDate,
            checkOutDate
          );
          statuses[homestay.id] = status;
        } else {
          statuses[homestay.id] = 'unknown';
        }
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

  return (
    <div>
      <Helmet>
        <title>Find Homestays - Homavia</title>
        <meta name="description" content="Discover the perfect homestay for your stay in Guwahati, Shillong, and Goa." />
      </Helmet>

      {/* Availability Calendar Section */}
      <div style={styles.datePickerContainer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <FiCalendar size={20} color="#ff385c" />
          <h3 style={{ fontSize: 17, fontWeight: 'bold', margin: 0, letterSpacing: '-0.3px' }}>
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
              borderTop: '2px solid #ff385c',
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
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                Check-in
              </label>
              <div 
                onClick={() => setShowCalendar(!showCalendar)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: checkInDate ? '#fff' : '#f8f8f8',
                  border: checkInDate ? '2px solid #ff385c' : '1px solid #e0e0e0',
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
                  e.currentTarget.style.borderColor = '#ff385c';
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
                <FiCalendar size={16} color="#ff385c" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                Check-out
              </label>
              <div 
                onClick={() => setShowCalendar(!showCalendar)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: checkOutDate ? '#fff' : '#f8f8f8',
                  border: checkOutDate ? '2px solid #ff385c' : '1px solid #e0e0e0',
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
                  e.currentTarget.style.borderColor = '#ff385c';
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
                <FiCalendar size={16} color="#ff385c" />
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button 
              style={{
                ...styles.showAvailableOnlyButton,
                flex: 1,
                ...(showAvailableOnly ? {} : { 
                  backgroundColor: 'white', 
                  color: '#10b981', 
                  border: '1.5px solid #10b981',
                  boxShadow: 'none'
                })
              }}
              onClick={toggleShowAvailableOnly}
            >
              <FiCheck size={16} />
              {showAvailableOnly ? 'Available Only' : 'Show All'}
            </button>
            
            {(checkInDate || checkOutDate) && (
              <button 
                style={{
                  ...styles.clearDatesButton,
                  padding: '12px 16px'
                }} 
                onClick={clearDates}
              >
                <FiX size={16} />
              </button>
            )}
          </div>
        </div>

        <style>{`
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
              color: #ff385c;
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
            background: #ff385c !important;
            color: white !important;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(255, 56, 92, 0.3);
          }

          .professional-calendar .react-calendar__tile--active:hover {
            background: #e31c5f !important;
          }

          .professional-calendar .react-calendar__tile--range {
            background: #ffe0e6 !important;
            color: #222 !important;
          }

          .professional-calendar .react-calendar__tile--rangeStart,
          .professional-calendar .react-calendar__tile--rangeEnd {
            background: #ff385c !important;
            color: white !important;
            font-weight: 600;
          }

          .professional-calendar .react-calendar__tile--rangeStart:hover,
          .professional-calendar .react-calendar__tile--rangeEnd:hover {
            background: #e31c5f !important;
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

      {/* Filter Toggle Button */}
      <div style={{ marginBottom: 16 }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            backgroundColor: showFilters ? '#ff385c' : '#fff',
            color: showFilters ? '#fff' : '#222',
            border: showFilters ? 'none' : '1px solid #ddd',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FiFilter size={18} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {showFilters && (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          <div style={styles.filterGrid} className="filter-grid">
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

        {checkInDate && checkOutDate && (
          <div>
            <label style={styles.label}>Availability Status</label>
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
        </div>
      )}

      {viewMode === 'map' && sortedHomestays.filter(h => h.latitude && h.longitude).length > 0 && (
        <div>
          {/* Map Search Bar */}
          <div style={{ 
            marginBottom: 16, 
            padding: 16, 
            backgroundColor: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #ebebeb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <FiSearch size={18} color="#ff385c" />
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
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 15,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ff385c'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
              <button
                onClick={handleMapSearch}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#ff385c',
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
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e31c5f'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ff385c'}
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
                    e.target.style.borderColor = '#ff385c';
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
            <small style={{ fontSize: 12, color: '#666', marginTop: 8, display: 'block' }}>
              💡 Search for any location to navigate the map. Press Enter or click Search.
            </small>
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
                          alt={homestay.name}
                          style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                        />
                        <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 'bold' }}>
                          {homestay.name}
                        </h4>
                        <p style={{ margin: '0 0 4px 0', fontSize: 12, color: '#666' }}>
                          {homestay.area}, {homestay.city}
                        </p>
                        <p style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 'bold', color: '#ff385c' }}>
                          ₹{homestay.price} / {PRICE_TYPES.find(pt => pt.id === homestay.priceType)?.suffix || 'night'}
                        </p>
                        {availability === 'available' && (
                          <span style={{ 
                            backgroundColor: '#4CAF50', 
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
                            backgroundColor: '#ff5252', 
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
                          to={`/homestays/${homestay.id}`}
                          style={{
                            display: 'block',
                            marginTop: 8,
                            padding: '6px 12px',
                            backgroundColor: '#ff385c',
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

      {sortedHomestays.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <h3>No homestays found matching your criteria</h3>
          <p>Try adjusting your filters or search query</p>
          {showAvailableOnly && (
            <button 
              style={{ ...styles.submitButton, marginTop: 15 }}
              onClick={toggleShowAvailableOnly}
            >
              Show All Homestays
            </button>
          )}
        </div>
      ) : (
        <ul style={styles.homestayList} className="homestay-list">
          {sortedHomestays.map(homestay => {
            const availability = availabilityStatus[homestay.id];
            return (
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
                        <FiStar fill="#ff385c" color="#ff385c" />
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
                      <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        + {Object.keys(homestay.additionalPrices).length} more pricing option{Object.keys(homestay.additionalPrices).length > 1 ? 's' : ''}
                      </p>
                    )}
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
          setLocationLoading(false);
          alert("Location captured successfully!");
        } catch (error) {
          setForm({ 
            ...form, 
            latitude, 
            longitude,
            address: `${latitude}, ${longitude}`
          });
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

  const normalizeIcalUrl = (url) => {
    if (!url) return "";
    try {
      const u = new URL(url);
      if (u.protocol === "webcal:") {
        u.protocol = "https:";
        return u.toString();
      }
      return url;
    } catch {
      return url;
    }
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
    if (!isValidIcalUrl(form.icalUrl)) {
      alert("Please enter a valid iCal URL (https://, http://, or webcal://).");
      return;
    }

    setLoading(true);
    try {
      const imageUrl = await uploadImage();
      if (!imageUrl) throw new Error("Image upload failed");

      await addDoc(collection(db, "homestays"), {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        priceType: form.priceType,
        additionalPrices: form.additionalPrices,
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
        icalUrl: normalizeIcalUrl(form.icalUrl)
      });

      setForm({
        name: "",
        description: "",
        price: "",
        priceType: "perNight",
        additionalPrices: {},
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
        latitude: null,
        longitude: null,
        address: ""
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
              <label style={styles.label}>Host Calendar (iCal URL) *</label>
              <input
                style={styles.input}
                type="url"
                placeholder="https://example.com/calendar.ics or webcal://..."
                value={form.icalUrl}
                onChange={(e) => setForm({ ...form, icalUrl: e.target.value })}
                required
              />
              <small style={{ color: '#666' }}>
                Required. Paste an iCal (ICS) link to sync your availability calendar. Get from Airbnb, Booking.com, or Google Calendar.
              </small>
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
                    backgroundColor: showMapPicker ? '#ff385c' : '#fff',
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
                <p style={{ color: '#ff5252', marginTop: 8, fontSize: 13 }}>
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
                <div style={{ marginTop: 12, border: '2px solid #ff385c', borderRadius: 12, overflow: 'hidden' }}>
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
                    💡 Click anywhere on the map to set your property location
                  </div>
                </div>
              )}
              
              <small style={{ color: '#666', display: 'block', marginTop: 8 }}>
                Click the button to automatically capture your property's exact location. This helps guests find you on the map.
              </small>
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
          type="submit"
          disabled={loading || !user || imageError}
        >
          {loading ? "Submitting..." : "List Your Homestay"}
        </button>
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
          setLocationLoading(false);
          alert("Location captured successfully!");
        } catch (error) {
          setForm({ 
            ...form, 
            latitude, 
            longitude,
            address: `${latitude}, ${longitude}`
          });
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

  const normalizeIcalUrl = (url) => {
    if (!url) return "";
    try {
      const u = new URL(url);
      if (u.protocol === "webcal:") {
        u.protocol = "https:";
        return u.toString();
      }
      return url;
    } catch {
      return url;
    }
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
    if (!isValidIcalUrl(form.icalUrl)) {
      alert("Please enter a valid iCal URL (https://, http://, or webcal://).");
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

      const ref = doc(db, "homestays", id);
      await updateDoc(ref, {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        priceType: form.priceType,
        additionalPrices: form.additionalPrices,
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
        icalUrl: normalizeIcalUrl(form.icalUrl)
      });

      alert("Homestay updated successfully!");
      navigate(`/homestays/${id}`);
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
      <Helmet>
        <title>Edit Homestay - Homavia</title>
        <meta name="description" content="Edit your homestay listing on Homavia." />
      </Helmet>

      <h1 style={styles.formTitle}>Edit your homestay</h1>

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
              <label style={styles.label}>Host Calendar (iCal URL) *</label>
              <input
                style={styles.input}
                type="url"
                placeholder="https://example.com/calendar.ics or webcal://..."
                value={form.icalUrl}
                onChange={(e) => setForm({ ...form, icalUrl: e.target.value })}
                required
              />
              <small style={{ color: '#666' }}>
                Required. Paste an iCal (ICS) link to sync your availability calendar from Airbnb, Booking.com, etc.
              </small>
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
                    backgroundColor: showMapPicker ? '#ff385c' : '#fff',
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
                <p style={{ color: '#ff5252', marginTop: 8, fontSize: 13 }}>
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
                <div style={{ marginTop: 12, border: '2px solid #ff385c', borderRadius: 12, overflow: 'hidden' }}>
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
                    💡 Click anywhere on the map to set your property location
                  </div>
                </div>
              )}
              
              <small style={{ color: '#666', display: 'block', marginTop: 8 }}>
                Capture or update your property's exact location.
              </small>
            </div>
          </div>
        </div>

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
  const { id } = useParams();
  const [homestay, setHomestay] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [bookedDates, setBookedDates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHomestay = async () => {
      const docRef = doc(db, "homestays", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setHomestay(data);
        
        // Fetch booked dates from iCal
        if (data.icalUrl) {
          try {
            const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(data.icalUrl)}`);
            const icsData = await response.text();
            const jcalData = ICAL.parse(icsData);
            const comp = new ICAL.Component(jcalData);
            const vevents = comp.getAllSubcomponents('vevent');
            
            const dates = [];
            vevents.forEach(vevent => {
              const event = new ICAL.Event(vevent);
              const start = event.startDate.toJSDate();
              const end = event.endDate.toJSDate();
              
              // Add all dates in range
              const current = new Date(start);
              while (current <= end) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
              }
            });
            setBookedDates(dates);
          } catch (err) {
            console.log('Could not fetch calendar:', err);
          }
        }
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
    <div style={styles.detailContainer} className="detail-page">
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

      <div className="detail-grid">
        <div className="detail-main">
          <img
            src={homestay.imageUrl}
            alt={homestay.name}
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
        
        <div className="detail-sidebar" style={styles.bookingCard}>
          <div style={styles.priceDetail}>
            ₹{homestay.price} 
            <span style={{ fontWeight: 'normal', fontSize: 16 }}>
              / {PRICE_TYPES.find(pt => pt.id === homestay.priceType)?.suffix || 'night'}
            </span>
          </div>

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
                tileClassName={({ date }) => {
                  const isBooked = bookedDates.some(bookedDate => 
                    bookedDate.getFullYear() === date.getFullYear() &&
                    bookedDate.getMonth() === date.getMonth() &&
                    bookedDate.getDate() === date.getDate()
                  );
                  return isBooked ? 'booked-date' : 'available-date';
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
                  <span>Booked</span>
                </div>
              </div>
            </div>
          )}
          
          <a href={`tel:${homestay.contact}`} style={styles.callButton}>
            <FiPhone /> Call Host
          </a>

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
   My Listings (Host's own homestays)
------------------------------ */
function MyListings() {
  const [user, setUser] = useState(null);
  const [myHomestays, setMyHomestays] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (!u) {
        setMyHomestays([]);
        setLoading(false);
        return;
      }

      const qRef = query(
        collection(db, "homestays"),
        where("createdBy", "==", u.uid),
        orderBy("createdAt", "desc")
      );

      const unsub = onSnapshot(qRef, (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMyHomestays(docs);
        setLoading(false);
      });

      return () => unsub();
    });

    return () => unsubAuth();
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
      <div style={{ padding: 24, textAlign: "center" }}>
        Loading your listings...
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <Helmet>
        <title>My Listings - Homavia</title>
      </Helmet>

      <h1 style={styles.pageTitle}>My Listings</h1>

      {myHomestays.length === 0 ? (
        <div style={{ textAlign: "center" }}>
          <p>You haven't listed any homestays yet.</p>
          <button
            style={styles.submitButton}
            onClick={() => navigate("/add-homestay")}
          >
            List Your First Homestay
          </button>
        </div>
      ) : (
        <ul style={styles.homestayList} className="homestay-list">
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

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    style={{
                      ...styles.filterButton,
                      borderColor: "#ff385c",
                      color: "#ff385c",
                    }}
                    onClick={() => navigate(`/homestays/${h.id}`)}
                  >
                    View
                  </button>
                  <button
                    style={{
                      ...styles.filterButton,
                      borderColor: "#1565c0",
                      color: "#1565c0",
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
        }));
        setAllListings(listings);
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

  return (
    <div style={styles.pageContainer}>
      <Helmet>
        <title>Admin Panel - Homavia</title>
      </Helmet>

      <h1 style={styles.pageTitle}>Admin Panel</h1>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '2px solid #ebebeb' }}>
        <button
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'manage' ? '3px solid #ff385c' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'manage' ? '#ff385c' : '#666',
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
            borderBottom: activeTab === 'cleanup' ? '3px solid #ff385c' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'cleanup' ? '#ff385c' : '#666',
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
                          <div style={{ fontSize: 12, color: '#0284c7', marginTop: 4 }}>
                            ₹{h.price} / {PRICE_TYPES.find(pt => pt.id === h.priceType)?.suffix || 'night'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 100 }}>
                          <Link 
                            to={`/homestays/${h.id}`} 
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
                          <Link to={`/homestays/${h.id}`} style={{ ...styles.filterButton, textDecoration: 'none' }}>
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

/* ------------------------------
   Footer
------------------------------ */
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
          <Link to="/my-listings" style={styles.footerLink}><FiUser /> My Listings</Link>
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

/* ------------------------------
   Mobile App
------------------------------ */
function MobileApp() {
  const [homestays, setHomestays] = useState([]);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

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
    const unsubscribe = onSnapshot(collection(db, "homestays"), (snapshot) => {
      const all = snapshot.docs.map(docu => ({
        id: docu.id,
        ...docu.data()
      }));

      const cutoffIST = new Date("2025-11-01T00:00:00+05:30").getTime();

      const normalizeCreatedAtMs = (ca) => {
        if (!ca) return 0;
        if (ca instanceof Timestamp) return ca.toDate().getTime();
        if (typeof ca === "string") {
          const parsed = Date.parse(ca);
          return Number.isNaN(parsed) ? 0 : parsed;
        }
        if (ca?.toDate) {
          try { return ca.toDate().getTime(); } catch { return 0; }
        }
        return 0;
      };

      const filtered = all
        .filter(x => normalizeCreatedAtMs(x.createdAt) >= cutoffIST)
        .sort((a, b) => normalizeCreatedAtMs(b.createdAt) - normalizeCreatedAtMs(a.createdAt));

      setHomestays(filtered);
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

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

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
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" style={{ display: 'none' }}>
            <Link to="/">Home</Link>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/premium">Premium</Link>
            {user && <Link to="/my-listings">My Listings</Link>}
            {user && isAdminUser(user) && <Link to="/admin">Admin</Link>}
            
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
          <button className="hamburger-button" style={styles.hamburgerButton} onClick={toggleMobileMenu}>
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
          <button style={styles.closeButton} onClick={closeMobileMenu}>
            <FiX />
          </button>

          <div style={styles.mobileNav}>
            <Link to="/" style={styles.navLink} onClick={closeMobileMenu}>Home</Link>
            <Link to="/about" style={styles.navLink} onClick={closeMobileMenu}>About Us</Link>
            <Link to="/contact" style={styles.navLink} onClick={closeMobileMenu}>Contact</Link>
            <Link to="/premium" style={styles.navLink} onClick={closeMobileMenu}>Premium</Link>
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
          <div className="main-content" style={styles.mainContent}>
            <Routes>
              <Route path="/" element={<HomestayListing homestays={homestays} />} />
              <Route path="/add-homestay" element={<AddHomestayForm />} />
              <Route path="/edit-homestay/:id" element={<EditHomestayForm />} />
            <Route path="/my-listings" element={<MyListings />} />
            <Route path="/homestays/:id" element={<HomestayDetail />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/premium" element={<PremiumPage />} />
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
