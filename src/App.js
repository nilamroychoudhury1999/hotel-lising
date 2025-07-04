import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";

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
    maxWidth: 1200,
    margin: "0 auto",
    padding: 20,
    fontFamily: "'Inter', sans-serif"
  },
  header: {
    textAlign: "center",
    margin: "20px 0",
    fontSize: 36,
    fontWeight: "bold"
  },
  authBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 20px",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 20,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  button: {
    padding: "10px 15px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    marginLeft: 10
  },
  btnPrimary: {
    backgroundColor: "#007bff",
    color: "white"
  },
  btnSuccess: {
    backgroundColor: "#28a745",
    color: "white"
  },
  searchInput: {
    width: "100%",
    padding: 10,
    marginBottom: 20,
    borderRadius: 6,
    border: "1px solid #ddd"
  },
  homestayList: {
    listStyle: "none",
    padding: 0
  },
  homestayItem: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 15,
    borderRadius: 8,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  callButton: {
    display: "inline-block",
    padding: "8px 15px",
    backgroundColor: "#28a745",
    color: "white",
    borderRadius: 6,
    textDecoration: "none",
    marginTop: 10
  },
  filterContainer: {
    display: "flex",
    gap: 15,
    marginBottom: 20,
    flexWrap: "wrap"
  },
  filterButton: {
    padding: "8px 15px",
    borderRadius: 20,
    border: "1px solid #007bff",
    backgroundColor: "white",
    cursor: "pointer"
  },
  activeFilter: {
    backgroundColor: "#007bff",
    color: "white"
  }
};

function AuthBar({ user, handleLogin, handleLogout }) {
  return (
    <div style={styles.authBar}>
      {user ? (
        <>
          <span>Welcome, {user.displayName}</span>
          <div>
            <Link to="/add-homestay" style={{ ...styles.button, ...styles.btnSuccess }}>
              Add Homestay
            </Link>
            <button style={{ ...styles.button, ...styles.btnPrimary }} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </>
      ) : (
        <button style={{ ...styles.button, ...styles.btnPrimary }} onClick={handleLogin}>
          Login
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
      <input
        style={styles.searchInput}
        type="text"
        placeholder="Search homestays by name or area..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div style={styles.filterContainer}>
        <div>
          <label>Filter by Area:</label>
          <select
            style={{ ...styles.searchInput, width: "auto" }}
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
          >
            <option value="All">All Areas</option>
            {GUWAHATI_AREAS.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
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
      </div>

      <ul style={styles.homestayList}>
        {filteredHomestays.length === 0 ? (
          <li style={{ textAlign: "center", padding: 20 }}>
            No homestays found matching your criteria
          </li>
        ) : (
          filteredHomestays.map(homestay => (
            <li key={homestay.id} style={styles.homestayItem}>
              <h3>{homestay.name}</h3>
              <p><strong>Area:</strong> {homestay.city}</p>
              <p><strong>Price:</strong> ₹{homestay.price} per night</p>
              {homestay.coupleFriendly && <p>✅ Couple Friendly</p>}
              {homestay.hourly && <p>⏳ Hourly Stays Available</p>}
              {homestay.contact && (
                <a href={`tel:${homestay.contact}`} style={styles.callButton}>
                  Call: {homestay.contact}
                </a>
              )}
              <Link 
                to={`/homestays/${homestay.id}`} 
                style={{ display: "inline-block", marginTop: 10, color: "#007bff" }}
              >
                View Details →
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function AddHomestayForm({ user, form, setForm, handleSubmit, loading }) {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2>Add New Homestay</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 15 }}>
          <label>Homestay Name *</label>
          <input
            style={styles.searchInput}
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            required
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Price (₹ per night) *</label>
          <input
            style={styles.searchInput}
            type="number"
            value={form.price}
            onChange={(e) => setForm({...form, price: e.target.value})}
            required
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Area in Guwahati *</label>
          <select
            style={styles.searchInput}
            value={form.city}
            onChange={(e) => setForm({...form, city: e.target.value})}
            required
          >
            <option value="">Select Area</option>
            {GUWAHATI_AREAS.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Phone Number *</label>
          <input
            style={styles.searchInput}
            type="tel"
            value={form.contact}
            onChange={(e) => setForm({...form, contact: e.target.value})}
            required
            pattern="[0-9]{10}"
            title="10 digit phone number"
          />
        </div>

        <div style={{ marginBottom: 15, display: "flex", gap: 20 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <input
              type="checkbox"
              checked={form.coupleFriendly}
              onChange={(e) => setForm({...form, coupleFriendly: e.target.checked})}
            />
            Couple Friendly
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <input
              type="checkbox"
              checked={form.hourly}
              onChange={(e) => setForm({...form, hourly: e.target.checked})}
            />
            Hourly Stays
          </label>
        </div>

        <button 
          type="submit" 
          style={{ ...styles.button, ...styles.btnSuccess }}
          disabled={loading || !user}
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
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={styles.homestayItem}>
        <h2>{homestay.name}</h2>
        <p><strong>Area:</strong> {homestay.city}</p>
        <p><strong>Price:</strong> ₹{homestay.price} per night</p>
        {homestay.coupleFriendly && <p>✅ Couple Friendly</p>}
        {homestay.hourly && <p>⏳ Hourly Stays Available</p>}
        {homestay.contact && (
          <a href={`tel:${homestay.contact}`} style={styles.callButton}>
            Call: {homestay.contact}
          </a>
        )}
        <p><strong>Added by:</strong> {homestay.createdByName || "Admin"}</p>
        
        <button 
          onClick={() => navigate(-1)} 
          style={{ ...styles.button, marginTop: 15 }}
        >
          Back to List
        </button>
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
    hourly: false
  });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "homestays"), {
        ...form,
        price: Number(form.price),
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: new Date().toISOString()
      });
      setForm({
        name: "",
        price: "",
        city: "",
        contact: "",
        coupleFriendly: false,
        hourly: false
      });
      alert("Homestay added successfully!");
    } catch (error) {
      console.error("Error adding homestay:", error);
      alert("Failed to add homestay");
    }
    setLoading(false);
  };

  return (
    <Router>
      <div style={styles.container}>
        <h1 style={styles.header}>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            Guwahati Homestay Finder
          </Link>
        </h1>

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
            />
          } />
          <Route path="/homestays/:id" element={<HomestayDetail />} />
        </Routes>
      </div>
    </Router>
  );
}
