import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, onSnapshot, doc, getDoc,
  getDocs, query, where, writeBatch
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import {
  FiUser, FiMapPin, FiHome, FiStar, FiWifi, FiTv, FiCoffee, FiDroplet,
  FiSearch, FiMail, FiPhone, FiInfo, FiCheck, FiMenu, FiX, FiSmartphone, FiUpload
} from "react-icons/fi";
import { Helmet } from "react-helmet";
import logo from "./IMG-20250818-WA0009.jpg";

// Firebase config
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

const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset_1";
const CLOUDINARY_CLOUD_NAME = "dyrmi2zkl";
const SITE_NAME = "Homavia";
const SITE_URL = "https://homavia.in";
const DEFAULT_DESCRIPTION = "Discover authentic homestay experiences across Guwahati, Shillong, and Goa.";
const COMMON_IMAGE_URL = "/prairie-haven-51f728.jpg";
const DEFAULT_CONTACT = "+91 7002863681";

// Sample utility
const slugify = (str = "") => str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const buildHomestayPath = (h) => `/homestays/${slugify(h.city)}/${slugify(h.area)}/${slugify(h.name)}-${h.id}`;

function HomestayListing({ homestays }) {
  return (
    <div style={{ padding: 20 }}>
      <Helmet>
        <title>Homavia — Find Your Perfect Homestay</title>
        <meta name="description" content={DEFAULT_DESCRIPTION} />
        <meta property="og:image" content={COMMON_IMAGE_URL} />
      </Helmet>
      <h2>Available Homestays</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {homestays.map((h) => (
          <li key={h.id} style={{ marginBottom: 20 }}>
            <Link to={buildHomestayPath(h)}>
              <img src={h.imageUrl || COMMON_IMAGE_URL} alt={h.name} style={{ width: "100%", borderRadius: 8 }} />
              <h3>{h.name}</h3>
              <p>{h.city}, {h.area}</p>
              <p>₹{h.price}/night</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HomestayDetail() {
  const { slug } = useParams();
  const [homestay, setHomestay] = useState(null);
  const navigate = useNavigate();
  const id = slug?.split("-").pop();
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return navigate("/");
      const snap = await getDoc(doc(db, "homestays", id));
      if (snap.exists()) setHomestay({ id: snap.id, ...snap.data() });
      else navigate("/");
    };
    fetchData();
  }, [id, navigate]);

  if (!homestay) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <Helmet>
        <title>{homestay.name} — {SITE_NAME}</title>
        <meta name="description" content={homestay.description} />
      </Helmet>
      <img src={homestay.imageUrl || COMMON_IMAGE_URL} alt={homestay.name} style={{ width: "100%", borderRadius: 8 }} />
      <h1>{homestay.name}</h1>
      <p>{homestay.area}, {homestay.city}</p>
      <p>₹{homestay.price}/night</p>
      <p>{homestay.description}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer style={{ background: "#f8f9fa", padding: 20, textAlign: "center" }}>
      <p>© {new Date().getFullYear()} Homavia. All rights reserved.</p>
    </footer>
  );
}

function MobileApp() {
  const [homestays, setHomestays] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "homestays"), (snap) => {
      setHomestays(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  return (
    <Router>
      <div style={{ fontFamily: "sans-serif" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottom: "1px solid #eee" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#ff385c" }}>
            <img src={logo} alt="Homavia" style={{ height: 32, borderRadius: 4 }} /> Homavia
          </Link>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<HomestayListing homestays={homestays} />} />
            <Route path="/homestays/:citySlug/:areaSlug/:slug" element={<HomestayDetail />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

function App() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad/i.test(navigator.userAgent));
  }, []);
  if (!isMobile) return <div style={{ padding: 40 }}>Please open on a mobile device.</div>;
  return <MobileApp />;
}

export default App;
