import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { FiHeart, FiUser, FiMapPin, FiHome, FiStar, FiWifi, FiTv, FiCoffee, FiDroplet, FiSearch } from "react-icons/fi";
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
  "Sarusajai", "Bora Service", "Gotanagar", "Nabin Nagar" ,"Kharguli"
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
    fontFamily: "'Inter', sans-serif"
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
    }
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
    gap: 5
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
    marginTop: 20
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
    objectFit: 'cover'
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
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
    cursor: 'pointer'
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
    gap: 5
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
                    cursor: 'pointer'
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
        <h1 style={styles.detailTitle}>{homestay.name}</h1>
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






          <a href={`tel:${homestay.contact}`} style={styles.callButton}>
            <FiUser /> Call Host
          </a>
        </div>
      </div>
    </div>
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

          <AuthBar user={user} handleLogin={handleLogin} handleLogout={handleLogout} />
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
        </Routes>
      </div>
    </Router>
  );
}
