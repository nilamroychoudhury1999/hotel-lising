import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { FiUser, FiStar, FiPhone, FiMapPin, FiSearch, FiHeart, FiCamera, FiHome, FiMusic, FiScissors, FiFeather, FiGift, FiTruck, FiCheck, FiInfo, FiMail } from "react-icons/fi";

// ======= Firebase (Client) =======
// 1) npm i firebase
// 2) Create a Firebase project -> Firestore + Authentication (Google) enabled
// 3) Replace config below with YOUR keys (Firebase web SDK keys are safe to expose in client apps)
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCQJ3dX_ZcxVKzlCD8H19JM3KYh7qf8wYk",
  authDomain: "form-ca7cc.firebaseapp.com",
  projectId: "form-ca7cc",
  storageBucket: "form-ca7cc.appspot.com",
  messagingSenderId: "1054208318782",
  appId: "1:1054208318782:web:f64f43412902afcd7aa06f"
};



// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset_1";
const CLOUDINARY_CLOUD_NAME = "dyrmi2zkl";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ======= Cloudinary unsigned upload =======
// 1) Create an unsigned preset in Cloudinary Settings → Upload
// 2) Replace with your details

// ======= Domain Data =======
const CITIES = [
  "All Cities", "Guwahati", "Delhi", "Mumbai", "Bengaluru", "Kolkata", "Hyderabad", "Chennai", "Pune", "Jaipur"
];

const CATEGORIES = [
  { id: "venue", name: "Venues", icon: <FiHome /> },
  { id: "photographer", name: "Photographers", icon: <FiCamera /> },
  { id: "makeup", name: "Bridal Makeup", icon: <FiScissors /> },
  { id: "decor", name: "Decor", icon: <FiFeather /> },
  { id: "catering", name: "Catering", icon: <FiTruck /> },
  { id: "mehandi", name: "Mehendi", icon: <FiGift /> },
  { id: "dj", name: "DJ & Music", icon: <FiMusic /> },
];

const SERVICES = [
  "Ac Hall", "Open Lawn", "Stage Setup", "Candid Photography", "Cinematography", "Drone", "HD Makeup", "Airbrush Makeup", "Floral Decor", "LED Wall", "Veg", "Non‑Veg"
];

// ======= Styles (inline, single file) =======
const styles = {
  container: { maxWidth: 1300, margin: "0 auto", padding: "0 20px", fontFamily: "Inter, system-ui, sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", borderBottom: "1px solid #eee", gap: 16 },
  brand: { display: "flex", gap: 10, alignItems: "center", textDecoration: "none", color: "#e91e63", fontWeight: 800, fontSize: 22 },
  navLinks: { display: "flex", gap: 18 },
  navLink: { textDecoration: "none", color: "#333", fontWeight: 600 },
  authBtn: { display: "flex", alignItems: "center", gap: 8, border: "1px solid #ddd", padding: "8px 14px", borderRadius: 28, background: "#fff", cursor: "pointer" },
  hero: { padding: "28px 0 8px" },
  searchBar: { display: "flex", gap: 10, margin: "12px 0 20px" },
  input: { flex: 1, padding: "12px 14px", borderRadius: 30, border: "1px solid #ddd" },
  select: { padding: "12px 14px", borderRadius: 30, border: "1px solid #ddd" },
  searchBtn: { padding: "12px 18px", borderRadius: 30, border: 0, background: "#e91e63", color: "#fff", display: "flex", gap: 8, alignItems: "center", cursor: "pointer" },
  pillRow: { display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 },
  pill: { padding: "10px 14px", border: "1px solid #ddd", borderRadius: 28, background: "#fff", whiteSpace: "nowrap", cursor: "pointer", fontWeight: 600 },
  activePill: { background: "#111", color: "#fff", borderColor: "#111" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 20, margin: "20px 0 40px" },
  card: { border: "1px solid #eee", borderRadius: 14, overflow: "hidden", background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,.05)" },
  img: { width: "100%", height: 200, objectFit: "cover" },
  cardBody: { padding: 14 },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontWeight: 800, fontSize: 16 },
  sub: { color: "#666", fontSize: 13 },
  price: { fontWeight: 800 },
  badge: { display: "inline-flex", gap: 6, alignItems: "center", background: "#ffe082", color: "#111", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700, marginLeft: 8 },
  like: { position: "absolute", top: 12, right: 12, background: "#fff", width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", border: "1px solid #eee", cursor: "pointer" },
  sticky: { position: "sticky", top: 20, border: "1px solid #eee", borderRadius: 12, padding: 18 },
  btn: { padding: 12, width: "100%", border: 0, borderRadius: 10, background: "#e91e63", color: "#fff", fontWeight: 800, cursor: "pointer" },
  outline: { background: "#fff", color: "#111", border: "1px solid #ddd" },
  section: { maxWidth: 1100, margin: "0 auto", padding: "40px 0" },
  footer: { marginTop: 30, padding: "30px 0", borderTop: "1px solid #eee", color: "#555" },
};

// ======= Components =======
function Navigation({ user, onLogin, onLogout }) {
  const [open, setOpen] = useState(false);
  return (
    <header style={{ ...styles.header, flexWrap: "wrap" }}>
      <Link to="/" style={styles.brand}><span>ShaadiHub</span></Link>
      <button onClick={() => setOpen(!open)} style={{ display: "none", background: "none", border: "none", fontSize: 26, cursor: "pointer", color: "#333" }} className="hamburger">☰</button>
      <div className="nav-container" style={{ display: open ? "flex" : "flex", flexDirection: open ? "column" : "row", gap: open ? 12 : 18, alignItems: open ? "flex-start" : "center", width: open ? "100%" : "auto" }}>
        <nav className="nav-links" style={{ ...styles.navLinks, flexDirection: open ? "column" : "row", gap: open ? 12 : 18, width: open ? "100%" : "auto" }}>
          <Link to="/vendors" style={styles.navLink}>Vendors</Link>
          <Link to="/premium" style={styles.navLink}>Premium</Link>
          <Link to="/about" style={styles.navLink}>About</Link>
          <Link to="/contact" style={styles.navLink}>Contact</Link>
        </nav>
        {user ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link to="/add-vendor" style={{ ...styles.authBtn, background: "#111", color: "#fff" }}>Add Vendor</Link>
            <button onClick={onLogout} style={styles.authBtn}><FiUser /> Logout</button>
          </div>
        ) : (
          <button onClick={onLogin} style={styles.authBtn}><FiUser /> Login</button>
        )}
      </div>
      <style>{`
        @media (max-width: 768px) {
          .hamburger { display: block; margin-left: auto; }
          .nav-container { display: ${open ? "flex" : "none"}; flex-direction: column; width: 100%; margin-top: 10px; }
          .nav-links { flex-direction: column; width: 100%; }
          .nav-links a { padding: 8px 0; display: block; width: 100%; }
        }
      `}</style>
    </header>
  );
}

function VendorCard({ v }) {
  return (
    <li style={styles.card}>
      <Link to={`/vendors/${v.id}`} style={{ textDecoration: "none", color: "inherit", position: "relative", display: "block" }}>
        <img alt={v.name} src={v.imageUrl} style={styles.img} />
        {v.premium && <span style={styles.badge}><FiStar /> FEATURED</span>}
        <span style={styles.like}><FiHeart /></span>
        <div style={styles.cardBody}>
          <div style={styles.row}>
            <h3 style={styles.title}>{v.name}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <FiStar /> {v.rating || "New"}
            </div>
          </div>
          <div style={{ ...styles.row, marginTop: 6 }}>
            <span style={styles.sub}><FiMapPin /> {v.city} • {v.categoryLabel}</span>
            <span style={styles.price}>₹{v.priceStart}+</span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function VendorListing({ vendors }) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("All Cities");
  const [cat, setCat] = useState("all");

  const filtered = vendors.filter(v => {
    const qMatch = !q || [v.name, v.city, v.services?.join(" ")].join(" ").toLowerCase().includes(q.toLowerCase());
    const cityMatch = city === "All Cities" || v.city === city;
    const catMatch = cat === "all" || v.category === cat;
    return qMatch && cityMatch && catMatch;
  });

  return (
    <section style={styles.section}>
      <Helmet>
        <title>ShaadiHub – Find Wedding Vendors</title>
        <meta name="description" content="Search venues, photographers, makeup artists, decorators, caterers and more. Compare prices, ratings and contact vendors directly." />
      </Helmet>

      <div style={styles.hero}>
        <div style={styles.searchBar}>
          <input style={styles.input} placeholder="Search by vendor, service or keyword" value={q} onChange={e => setQ(e.target.value)} />
          <select style={styles.select} value={city} onChange={e => setCity(e.target.value)}>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button style={styles.searchBtn}><FiSearch /> Search</button>
        </div>
        <div style={styles.pillRow}>
          <button onClick={() => setCat("all")} style={{ ...styles.pill, ...(cat === "all" ? styles.activePill : {}) }}>All</button>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{ ...styles.pill, ...(cat === c.id ? styles.activePill : {}) }}>
              <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>{c.icon}{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <ul style={styles.grid}>
          {filtered.map(v => <VendorCard key={v.id} v={v} />)}
        </ul>
      ) : (
        <div style={{ textAlign: "center", padding: 40 }}>
          <h3>No vendors match your filters</h3>
          <p>Try a different city, category or keyword.</p>
        </div>
      )}
    </section>
  );
}

function AddVendorForm({ user, form, setForm, onSubmit, loading, onImage }) {
  const handleServiceToggle = (s) => {
    setForm(prev => ({ ...prev, services: prev.services.includes(s) ? prev.services.filter(x => x !== s) : [...prev.services, s] }));
  };

  return (
    <section style={styles.section}>
      <Helmet><title>Add Vendor – ShaadiHub</title></Helmet>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 14 }}>List your Business</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div>
          <label style={{ fontWeight: 700 }}>Business Name *</label>
          <input style={{ ...styles.input, borderRadius: 10, width: "100%" }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label style={{ fontWeight: 700 }}>City *</label>
          <select style={{ ...styles.input, borderRadius: 10, width: "100%" }} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
            <option value="">Select city</option>
            {CITIES.filter(c => c !== "All Cities").map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 700 }}>Category *</label>
          <select style={{ ...styles.input, borderRadius: 10, width: "100%" }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value, categoryLabel: CATEGORIES.find(x => x.id === e.target.value)?.name })}>
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 700 }}>Starting Price (₹) *</label>
          <input type="number" style={{ ...styles.input, borderRadius: 10, width: "100%" }} value={form.priceStart} onChange={e => setForm({ ...form, priceStart: e.target.value })} />
        </div>
        <div style={{ gridColumn: "1 / span 2" }}>
          <label style={{ fontWeight: 700 }}>Description *</label>
          <textarea style={{ ...styles.input, borderRadius: 10, width: "100%", minHeight: 120 }} value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Tell couples what you offer and why you’re special" />
        </div>
        <div style={{ gridColumn: "1 / span 2" }}>
          <label style={{ fontWeight: 700 }}>Main Photo *</label>
          <input type="file" accept="image/*" onChange={onImage} />
          {form.imagePreview && <img src={form.imagePreview} alt="preview" style={{ marginTop: 10, width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 12 }} />}
        </div>
        <div style={{ gridColumn: "1 / span 2" }}>
          <label style={{ fontWeight: 700, display: "block", marginBottom: 10 }}>Services</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {SERVICES.map(s => (
              <label key={s} style={{ border: "1px solid #ddd", borderRadius: 26, padding: "8px 12px", display: "inline-flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={form.services.includes(s)} onChange={() => handleServiceToggle(s)} /> {s}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontWeight: 700 }}>Phone *</label>
          <input style={{ ...styles.input, borderRadius: 10, width: "100%" }} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label style={{ fontWeight: 700 }}>Website / Instagram</label>
          <input style={{ ...styles.input, borderRadius: 10, width: "100%" }} value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={form.premium} onChange={e => setForm({ ...form, premium: e.target.checked })} />
          <span>Premium Listing <span style={styles.badge}><FiStar /> FEATURED</span></span>
        </label>
      </div>
      <button disabled={loading || !user} onClick={onSubmit} style={{ ...styles.btn, marginTop: 18 }}>{loading ? "Submitting..." : "Publish Vendor"}</button>
      {!user && <p style={{ color: "#e91e63", marginTop: 10 }}>Login required to publish.</p>}
    </section>
  );
}

function VendorDetail() {
  const { id } = useParams();
  const [v, setV] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    const run = async () => {
      const snap = await getDoc(doc(db, "vendors", id));
      if (snap.exists()) setV({ id: snap.id, ...snap.data() });
      else nav("/");
    };
    run();
  }, [id, nav]);

  if (!v) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;

  return (
    <section style={styles.section}>
      <Helmet>
        <title>{v.name} – {v.categoryLabel} in {v.city} | ShaadiHub</title>
        <meta name="description" content={(v.desc || "").slice(0, 150)} />
      </Helmet>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div>
          <img src={v.imageUrl} alt={v.name} style={{ width: "100%", maxHeight: 480, objectFit: "cover", borderRadius: 12 }} />
          <h1 style={{ marginTop: 16, fontSize: 30, fontWeight: 900 }}>{v.name} {v.premium && <span style={styles.badge}><FiStar /> PREMIUM</span>}</h1>
          <div style={{ display: "flex", gap: 14, color: "#666", margin: "6px 0 14px" }}>
            <span><FiMapPin /> {v.city}</span>
            <span>• {v.categoryLabel}</span>
            <span>• <FiStar /> {v.rating || "New"}</span>
          </div>
          <p style={{ lineHeight: 1.7 }}>{v.desc}</p>
          <h3 style={{ marginTop: 18 }}>Services</h3>
          <ul style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
            {(v.services || []).map(s => <li key={s} style={{ border: "1px solid #eee", padding: "6px 10px", borderRadius: 20 }}>{s}</li>)}
          </ul>
        </div>
        <aside style={styles.sticky}>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Starts at ₹{v.priceStart}</div>
          {v.premium && (
            <div style={{ background: "#fff8e1", padding: 12, borderRadius: 10, margin: "14px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><FiCheck /> Premium Verified</div>
              <div style={{ fontSize: 13, color: "#555", marginTop: 6 }}>Fast response • Top rated</div>
            </div>
          )}
          <a href={`tel:${v.phone}`} style={{ ...styles.btn, display: "inline-block", textAlign: "center", textDecoration: "none" }}><FiPhone /> Call Vendor</a>
          {v.website && <a href={v.website} target="_blank" rel="noreferrer" style={{ ...styles.btn, ...styles.outline, marginTop: 10, display: "inline-block", textAlign: "center", textDecoration: "none" }}>Visit Website</a>}
          <a href={`mailto:${v.email || ''}?subject=ShaadiHub Enquiry for ${encodeURIComponent(v.name)}`} style={{ ...styles.btn, ...styles.outline, marginTop: 10, display: "inline-block", textAlign: "center", textDecoration: "none" }}><FiMail /> Send Enquiry</a>
        </aside>
      </div>
    </section>
  );
}

function About() {
  return (
    <section style={styles.section}>
      <Helmet><title>About – ShaadiHub</title></Helmet>
      <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 10 }}>About ShaadiHub</h1>
      <p style={{ maxWidth: 800, lineHeight: 1.75 }}>
        ShaadiHub is a modern wedding marketplace to discover, compare and contact the best wedding vendors across India. We verify listings and highlight premium partners for a smoother planning experience.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 16, marginTop: 24 }}>
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}><FiCheck /></div>
          <div style={{ fontWeight: 800 }}>Verified Vendors</div>
          <div className="sub">We manually screen premium listings for quality.</div>
        </div>
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}><FiStar /></div>
          <div style={{ fontWeight: 800 }}>Real Ratings</div>
          <div className="sub">Collect reviews post‑event and showcase trust.</div>
        </div>
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}><FiPhone /></div>
          <div style={{ fontWeight: 800 }}>Direct Contact</div>
          <div className="sub">Call or send enquiries without middlemen.</div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [sent, setSent] = useState(false);
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  return (
    <section style={styles.section}>
      <Helmet><title>Contact – ShaadiHub</title></Helmet>
      <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 10 }}>Contact Us</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <div>
          <p>Need help with vendor selection or listing your business? We’re here!</p>
          <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 20, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><FiPhone /> +91 98765 43210</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><FiMail /> hello@shaadihub.in</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><FiMapPin /> Guwahati, Assam</div>
          </div>
        </div>
        <div>
          {sent ? (
            <div style={{ textAlign: "center", padding: 30 }}>
              <FiCheck size={42} />
              <h3>Message sent!</h3>
              <button style={{ ...styles.btn, marginTop: 10 }} onClick={() => setSent(false)}>Send another</button>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setSent(true); }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input style={{ ...styles.input, borderRadius: 10 }} placeholder="Your Name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required />
                <input style={{ ...styles.input, borderRadius: 10 }} placeholder="Email" type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} required />
                <input style={{ ...styles.input, borderRadius: 10 }} placeholder="Phone" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
                <input style={{ ...styles.input, borderRadius: 10 }} placeholder="City" />
                <textarea style={{ ...styles.input, borderRadius: 10, gridColumn: "1 / span 2", minHeight: 140 }} placeholder="How can we help?" value={f.message} onChange={e => setF({ ...f, message: e.target.value })} required />
                <button style={{ ...styles.btn, gridColumn: "1 / span 2" }}>Send</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Premium() {
  return (
    <section style={styles.section}>
      <Helmet><title>Premium – ShaadiHub</title></Helmet>
      <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 10 }}>Premium Plans</h1>
      <p>Boost visibility with Featured placement, verified badge and social promos.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 20 }}>
        {[{ name: "Basic", price: 499, days: 7 }, { name: "Pro", price: 999, days: 30 }, { name: "Business", price: 1999, days: 90 }].map(p => (
          <div key={p.name} style={{ border: "1px solid #eee", borderRadius: 12, padding: 20, textAlign: "center" }}>
            <h3 style={{ fontWeight: 900 }}>{p.name}</h3>
            <div style={{ fontSize: 34, fontWeight: 900 }}>₹{p.price}<span style={{ fontSize: 14, fontWeight: 600 }}>/mo</span></div>
            <ul style={{ listStyle: "none", padding: 0, textAlign: "left", marginTop: 10 }}>
              <li style={{ display: "flex", gap: 8, alignItems: "center" }}><FiCheck /> Featured {p.days} days</li>
              <li style={{ display: "flex", gap: 8, alignItems: "center" }}><FiCheck /> Premium badge</li>
              <li style={{ display: "flex", gap: 8, alignItems: "center" }}><FiCheck /> Basic analytics</li>
            </ul>
            <button style={{ ...styles.btn, marginTop: 10 }}>Select</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 18 }}>
        <div><strong>ShaadiHub</strong><p>Find and book trusted wedding vendors.</p></div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Explore</div>
          <Link to="/vendors" style={styles.navLink}><FiSearch /> Vendors</Link><br />
          <Link to="/premium" style={styles.navLink}><FiStar /> Premium</Link>
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Legal</div>
          <Link to="/terms" style={styles.navLink}>Terms</Link><br />
          <Link to="/privacy" style={styles.navLink}>Privacy</Link>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>© {new Date().getFullYear()} ShaadiHub</div>
    </footer>
  );
}

function Home({ vendors }) {
  return (
    <>
      <VendorListing vendors={vendors} />
    </>
  );
}

// ======= App Root =======
export default function App() {
  const [user, setUser] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imgFile, setImgFile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    city: "",
    category: "",
    categoryLabel: "",
    priceStart: "",
    desc: "",
    services: [],
    phone: "",
    website: "",
    premium: false,
    imagePreview: null,
  });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "vendors"), snap => {
      setVendors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const onLogin = async () => { try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); } };
  const onLogout = async () => { try { await signOut(auth); } catch (e) { console.error(e); } };

  const onImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Image must be <2MB"); return; }
    if (!file.type.startsWith("image/")) { alert("Only images allowed"); return; }
    setImgFile(file);
    const r = new FileReader();
    r.onloadend = () => setForm(prev => ({ ...prev, imagePreview: r.result }));
    r.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!imgFile) return null;
    const fd = new FormData();
    fd.append("file", imgFile);
    fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      return data.secure_url;
    } catch (e) { console.error(e); return null; }
  };

  const onSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const imageUrl = await uploadImage();
      if (!imageUrl) throw new Error("Upload failed");
      await addDoc(collection(db, "vendors"), {
        name: form.name,
        city: form.city,
        category: form.category,
        categoryLabel: form.categoryLabel,
        priceStart: Number(form.priceStart),
        desc: form.desc,
        services: form.services,
        phone: form.phone,
        website: form.website,
        premium: form.premium,
        imageUrl,
        rating: 5,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        createdByName: user.displayName,
      });
      setForm({ name: "", city: "", category: "", categoryLabel: "", priceStart: "", desc: "", services: [], phone: "", website: "", premium: false, imagePreview: null });
      setImgFile(null);
      alert("Vendor published!");
    } catch (e) {
      console.error(e);
      alert("Failed to publish");
    } finally { setLoading(false); }
  };

  return (
    <Router>
      <div style={styles.container}>
        <Navigation user={user} onLogin={onLogin} onLogout={onLogout} />
        <Routes>
          <Route path="/" element={<Home vendors={vendors} />} />
          <Route path="/vendors" element={<VendorListing vendors={vendors} />} />
          <Route path="/vendors/:id" element={<VendorDetail />} />
          <Route path="/add-vendor" element={<AddVendorForm user={user} form={form} setForm={setForm} onSubmit={onSubmit} loading={loading} onImage={onImage} />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/terms" element={<div style={styles.section}><Helmet><title>Terms</title></Helmet><h1>Terms</h1><p>Coming soon.</p></div>} />
          <Route path="/privacy" element={<div style={styles.section}><Helmet><title>Privacy</title></Helmet><h1>Privacy</h1><p>Coming soon.</p></div>} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}
