import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
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
  FiMail, FiPhone, FiInfo, FiCheck, FiMenu, FiX, FiSmartphone, FiCalendar, FiNavigation, FiMap
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
  },
  datePickerContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    border: '1px solid #ddd'
  },
  dateInput: {
    padding: '12px 15px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 14,
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: 'white'
  },
  calendarContainer: {
    marginTop: 10,
    marginBottom: 10
  },
  reactCalendar: {
    width: '100%',
    border: '1px solid #ddd',
    borderRadius: 12,
    padding: 10,
    backgroundColor: 'white',
    fontFamily: "'Inter', sans-serif"
  },
  availabilityBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  unavailableBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ff5252',
    color: 'white',
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  clearDatesButton: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #ddd',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: '#666'
  },
  toggleCalendarButton: {
    padding: '10px 15px',
    borderRadius: 8,
    border: '1px solid #ff385c',
    backgroundColor: 'white',
    color: '#ff385c',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10
  },
  showAvailableOnlyButton: {
    padding: '10px 15px',
    borderRadius: 8,
    border: '1px solid #4CAF50',
    backgroundColor: '#4CAF50',
    color: 'white',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10
  },
  locationButton: {
    padding: '10px 15px',
    borderRadius: 8,
    border: '1px solid #2196F3',
    backgroundColor: '#2196F3',
    color: 'white',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10
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
   Helpers
------------------------------ */
const isMobileDevice = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

/* ------------------------------
   iCal Availability Helper
------------------------------ */
const fetchAndCheckAvailability = async (icalUrl, checkInDate, checkOutDate) => {
  if (!icalUrl || !checkInDate || !checkOutDate) return 'unknown';
  
  try {
    const response = await fetch(icalUrl);
    if (!response.ok) return 'unknown';
    
    const icalData = await response.text();
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      const eventStart = event.startDate.toJSDate();
      const eventEnd = event.endDate.toJSDate();
      
      // Check if there's any overlap between the requested dates and booked dates
      if (
        (checkIn >= eventStart && checkIn < eventEnd) ||
        (checkOut > eventStart && checkOut <= eventEnd) ||
        (checkIn <= eventStart && checkOut >= eventEnd)
      ) {
        return 'unavailable';
      }
    }
    
    return 'available';
  } catch (error) {
    console.error('Error checking availability:', error);
    return 'unknown';
  }
};

/* ------------------------------
   Desktop Warning
------------------------------ */
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

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
    const matchesAvailability = !showAvailableOnly || availability === 'available' || availability === 'unknown';

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

  const handleCalendarChange = (date) => {
    setSelectedDate(date);
    const selectedDateStr = date.toISOString().split('T')[0];
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];
    
    setCheckInDate(selectedDateStr);
    setCheckOutDate(nextDayStr);
  };

  const toggleShowAvailableOnly = () => {
    setShowAvailableOnly(!showAvailableOnly);
  };

  const availableCount = Object.values(availabilityStatus).filter(status => status === 'available').length;
  const bookedCount = Object.values(availabilityStatus).filter(status => status === 'unavailable').length;

  // Get center coordinates for map based on selected city
  const getCityCenter = () => {
    const cityCoords = {
      'Guwahati': [26.1445, 91.7362],
      'Shillong': [25.5788, 91.8933],
      'Goa': [15.2993, 74.1240]
    };
    return selectedCity !== "All" && cityCoords[selectedCity] 
      ? cityCoords[selectedCity] 
      : [23.6345, 85.3803]; // Center of India as default
  };

  return (
    <div>
      <Helmet>
        <title>Find Homestays - Homavia</title>
        <meta name="description" content="Discover the perfect homestay for your stay in Guwahati, Shillong, and Goa." />
      </Helmet>

      <div style={styles.datePickerContainer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <FiCalendar size={18} color="#ff385c" />
          <h3 style={{ fontSize: 16, fontWeight: 'bold', margin: 0 }}>Check Availability</h3>
        </div>
        
        {checkingAvailability && (
          <div style={{ fontSize: 13, color: '#666', fontStyle: 'italic', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ 
              width: 16, 
              height: 16, 
              border: '2px solid #ddd', 
              borderTop: '2px solid #ff385c',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Checking availability...
          </div>
        )}

        {!checkingAvailability && (checkInDate || checkOutDate) && (
          <div style={{ fontSize: 13, color: '#4CAF50', fontWeight: 500, marginBottom: 10 }}>
            ✓ {availableCount} available • {bookedCount} booked
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ ...styles.label, fontSize: 13 }}>Check-in Date</label>
            <input
              type="date"
              style={styles.dateInput}
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              min={getTodayDate()}
            />
          </div>
          <div>
            <label style={{ ...styles.label, fontSize: 13 }}>Check-out Date</label>
            <input
              type="date"
              style={styles.dateInput}
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              min={checkInDate || getTodayDate()}
            />
          </div>
          
          <button 
            style={styles.toggleCalendarButton} 
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <FiCalendar size={16} />
            {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
          </button>

          {showCalendar && (
            <div style={styles.calendarContainer}>
              <Calendar
                onChange={handleCalendarChange}
                value={selectedDate}
                minDate={new Date()}
                className="custom-calendar"
              />
              <style>{`
                .custom-calendar {
                  width: 100%;
                  border: 1px solid #ddd;
                  border-radius: 12px;
                  padding: 10px;
                  background-color: white;
                  font-family: 'Inter', sans-serif;
                }
                .custom-calendar .react-calendar__tile--active {
                  background: #ff385c;
                  color: white;
                }
                .custom-calendar .react-calendar__tile--now {
                  background: #ffebee;
                }
                .custom-calendar .react-calendar__tile:hover {
                  background: #ffe0e5;
                }
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              style={{
                ...styles.showAvailableOnlyButton,
                ...(showAvailableOnly ? {} : { backgroundColor: 'white', color: '#4CAF50', border: '1px solid #4CAF50' })
              }}
              onClick={toggleShowAvailableOnly}
            >
              <FiCheck size={16} />
              {showAvailableOnly ? 'Showing Available Only' : 'Show All'}
            </button>
            
            {(checkInDate || checkOutDate) && (
              <button style={styles.clearDatesButton} onClick={clearDates}>
                Clear
              </button>
            )}
          </div>
        </div>
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
        <div style={styles.mapContainer}>
          <MapContainer 
            center={getCityCenter()} 
            zoom={selectedCity !== "All" ? 12 : 5} 
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
        <ul style={styles.homestayList}>
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

        <div style={styles.formGrid}>
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
            <label style={styles.label}>Host Calendar (iCal URL)</label>
            <input
              style={styles.input}
              type="url"
              placeholder="https://example.com/calendar.ics or webcal://..."
              value={form.icalUrl}
              onChange={(e) => setForm({ ...form, icalUrl: e.target.value })}
            />
            <small style={{ color: '#666' }}>
              Optional. Paste an iCal (ICS) link to your availability calendar to use later.
            </small>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Property Location (GPS)</label>
            <button
              type="button"
              style={styles.locationButton}
              onClick={getCurrentLocation}
              disabled={locationLoading}
            >
              <FiNavigation size={16} />
              {locationLoading ? 'Getting Location...' : 'Use Current Location'}
            </button>
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
        onClick={handleSubmit}
        disabled={loading || !user || imageError}
      >
        {loading ? "Submitting..." : "List Your Homestay"}
      </button>
    </div>
  );
}

/* ------------------------------
   Homestay Detail
------------------------------ */
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

      {homestay.latitude && homestay.longitude && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>Location</h2>
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

          <button style={styles.bookButton}>
            Book Now
          </button>
          
          <a href={`tel:${homestay.contact}`} style={styles.callButton}>
            <FiPhone /> Call Host
          </a>

          {homestay.icalUrl && (
            <div style={{ marginTop: 12 }}>
              <h4 style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 6 }}>Host Calendar</h4>
              <a
                href={homestay.icalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#1565c0',
                  textDecoration: 'underline',
                  wordBreak: 'break-all',
                  fontSize: 14
                }}
              >
                Open iCal Link
              </a>
            </div>
          )}

          {(auth.currentUser?.uid === homestay.createdBy || isAdminUser(auth.currentUser)) && (
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
   Admin Tools (visible only to ADMIN_EMAIL)
------------------------------ */
function AdminTools() {
  const [currentUser, setCurrentUser] = useState(null);
  const [cutoff, setCutoff] = useState("2025-11-01"); // default Nov 1, 2025
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [mode, setMode] = useState("preview"); // 'preview' | 'delete'
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setCurrentUser);
    return unsub;
  }, []);

  if (!isAdminUser(currentUser)) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Forbidden</div>;
  }

  const cutoffToTimestamp = () => {
    // Localize to IST midnight
    // Using fixed offset +05:30
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

      // Query by Timestamp field
      const qRef = query(
        collection(db, "homestays"),
        orderBy("createdAt"),
        where("createdAt", "<", ts),
        limit(pageLimit)
      );
      let all = [];
      let snap = await getDocs(qRef);
      all.push(...snap.docs);

      // Fallback: include docs where createdAt is a string older than cutoff
      const allSnap = await getDocs(collection(db, "homestays"));
      const cutoffMs = ts.toDate().getTime();
      allSnap.forEach(d => {
        const data = d.data();
        const ca = data.createdAt;
        if (!ca || ca instanceof Timestamp) return; // handled above
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
        <title>Admin Tools - Homavia</title>
      </Helmet>

      <h1 style={styles.pageTitle}>Admin Tools</h1>

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

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "homestays"), (snapshot) => {
      const all = snapshot.docs.map(docu => ({
        id: docu.id,
        ...docu.data()
      }));

      // Hide everything created before Nov 1, 2025 (IST)
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
          <Routes>
            <Route path="/" element={<HomestayListing homestays={homestays} />} />
            <Route path="/add-homestay" element={<AddHomestayForm />} />
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
