import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  query,
  orderBy,
  getDoc,
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
import { Helmet, HelmetProvider } from 'react-helmet-async';

const firebaseConfig = {
  apiKey: "AIzaSyCQJ3dX_ZcxVKzlCD8H19JM3KYh7qf8wYk",
  authDomain: "form-ca7cc.firebaseapp.com",
  databaseURL: "https://form-ca7cc-default-rtdb.firebaseio.com",
  projectId: "form-ca7cc",
  storageBucket: "form-ca7cc.appspot.com",
  messagingSenderId: "1054208318782",
  appId: "1:1054208318782:web:f64f43412902afcd7aa06f",
  measurementId: "G-CQSLK7PCFQ",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset_1";
const CLOUDINARY_CLOUD_NAME = "dyrmi2zkl";

const styles = {
  container: {
    maxWidth: 1200,
    margin: "20px auto",
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: "#333",
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  header: {
    textAlign: "center",
    marginBottom: 30,
    fontSize: 36,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  authBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    padding: "15px 20px",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  button: {
    padding: "10px 20px",
    fontSize: 16,
    borderRadius: 6,
    cursor: "pointer",
    border: "none",
    fontWeight: "600",
    transition: "background-color 0.3s ease",
  },
  btnPrimary: {
    backgroundColor: "#007bff",
    color: "white",
    "&:hover": {
      backgroundColor: "#0056b3",
    },
  },
  btnDanger: {
    backgroundColor: "#dc3545",
    color: "white",
    "&:hover": {
      backgroundColor: "#c82333",
    },
  },
  btnSuccess: {
    backgroundColor: "#28a745",
    color: "white",
    "&:hover": {
      backgroundColor: "#218838",
    },
  },
  searchInput: {
    width: "100%",
    padding: "12px",
    fontSize: 16,
    borderRadius: 8,
    border: "1px solid #ced4da",
    outline: "none",
    marginBottom: 20,
    boxSizing: "border-box",
  },
  categoryFilter: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 25,
  },
  categoryButton: {
    padding: "8px 16px",
    fontSize: 14,
    borderRadius: 20,
    border: "1px solid #007bff",
    backgroundColor: "white",
    color: "#007bff",
    cursor: "pointer",
    transition: "background-color 0.3s, color 0.3s",
  },
  categoryButtonActive: {
    backgroundColor: "#007bff",
    color: "white",
  },
  hotelList: {
    listStyle: "none",
    paddingLeft: 0,
    marginBottom: 40,
  },
  hotelItem: {
    backgroundColor: "white",
    marginBottom: 15,
    padding: 20,
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    display: "flex",
    gap: 20,
  },
  hotelImage: {
    width: 200,
    height: 150,
    objectFit: "cover",
    borderRadius: 6,
  },
  hotelContent: {
    flexGrow: 1,
  },
  hotelTitle: {
    fontSize: 20,
    marginBottom: 8,
    color: "#2c3e50",
    fontWeight: "bold",
  },
  hotelDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    marginBottom: 10,
  },
  hotelRating: {
    color: "#ffc107",
    fontWeight: "bold",
  },
  hotelLocation: {
    color: "#6c757d",
  },
  hotelPrice: {
    color: "#28a745",
    fontWeight: "bold",
  },
  hotelAmenities: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  amenityTag: {
    backgroundColor: "#e9ecef",
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 12,
  },
  formContainer: {
    backgroundColor: "#ffffff",
    padding: 25,
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  formTitle: {
    fontSize: 24,
    marginBottom: 20,
    color: "#2c3e50",
    fontWeight: "bold",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: "600",
    fontSize: 14,
  },
  input: {
    padding: 10,
    fontSize: 14,
    borderRadius: 6,
    border: "1px solid #ced4da",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  textarea: {
    padding: 10,
    fontSize: 14,
    borderRadius: 6,
    border: "1px solid #ced4da",
    outline: "none",
    resize: "vertical",
    minHeight: 100,
    width: "100%",
  },
  select: {
    padding: 10,
    fontSize: 14,
    borderRadius: 6,
    border: "1px solid #ced4da",
    outline: "none",
    width: "100%",
  },
  detailContainer: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  detailImage: {
    width: '100%',
    maxHeight: 400,
    objectFit: 'cover',
    borderRadius: 8,
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 28,
    color: "#2c3e50",
    marginBottom: 15,
    fontWeight: "bold",
  },
  detailInfo: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
  },
  backButton: {
    display: 'inline-block',
    margin: '20px 0',
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    borderRadius: 6,
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  footer: {
    textAlign: 'center',
    marginTop: 30,
    padding: '20px 0',
    borderTop: '1px solid #e0e0e0',
  },
  starRating: {
    color: '#ffc107',
    fontSize: '18px',
    marginRight: '5px',
  }
};

function AuthBar({ user, handleLogin, handleLogout }) {
  return (
    <header style={styles.authBar}>
      {user ? (
        <>
          <div>
            Welcome, <strong>{user.displayName}</strong>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/add-hotel" style={{ ...styles.button, ...styles.btnSuccess }}>
              Add Hotel
            </Link>
            <button style={{ ...styles.button, ...styles.btnDanger }} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/add-hotel" style={{ ...styles.button, ...styles.btnSuccess }}>
            Add Hotel
          </Link>
          <button style={{ ...styles.button, ...styles.btnPrimary }} onClick={handleLogin}>
            Login
          </button>
        </div>
      )}
    </header>
  );
}

function HotelListingPage({ user, hotels, loading }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = ["All", "Luxury", "Budget", "Resort", "Boutique", "Business", "Family"];

  const filteredHotels = hotels
    .filter((hotel) => {
      const lowerSearch = search.toLowerCase();
      const matchesSearch =
        hotel.name.toLowerCase().includes(lowerSearch) ||
        (hotel.city?.toLowerCase().includes(lowerSearch) ?? false) ||
        (hotel.state?.toLowerCase().includes(lowerSearch) ?? false) ||
        (hotel.country?.toLowerCase().includes(lowerSearch) ?? false);

      const matchesCategory =
        selectedCategory === "All" || hotel.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => b.rating - a.rating);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} style={styles.starRating}>
          {i < rating ? '★' : '☆'}
        </span>
      );
    }
    return stars;
  };

  return (
    <main>
      <Helmet>
        <title>Hotel Finder - Discover Hotels in Guwahati</title>
        <meta name="description" content="Find and book hotels, resorts, and accommodations in Guwahati. Compare prices, amenities, and ratings." />
      </Helmet>

      <section>
        <input
          style={styles.searchInput}
          type="search"
          placeholder="Search hotels by name, area, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={!hotels.length && !loading}
        />

        {hotels.length > 0 && (
          <div style={styles.categoryFilter}>
            {categories.map((category) => (
              <button
                key={category}
                style={{
                  ...styles.categoryButton,
                  ...(selectedCategory === category
                    ? styles.categoryButtonActive
                    : {}),
                }}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ ...styles.formTitle, marginTop: 0 }}>Hotels in Guwahati</h2>
        <ul style={styles.hotelList}>
          {filteredHotels.length === 0 && (
            <li style={{ textAlign: "center", color: "#777", padding: 30 }}>
              No hotels found matching your criteria. Try adjusting your search or filters.
            </li>
          )}

          {filteredHotels.map((hotel) => (
            <li key={hotel.id} style={styles.hotelItem}>
              {hotel.imageUrl && (
                <img
                  src={hotel.imageUrl}
                  alt={hotel.name}
                  style={styles.hotelImage}
                  loading="lazy"
                />
              )}
              <div style={styles.hotelContent}>
                <Link to={`/hotels/${hotel.id}`} style={{ textDecoration: 'none' }}>
                  <h3 style={styles.hotelTitle}>{hotel.name}</h3>
                </Link>
                <div style={styles.hotelDetails}>
                  <div style={styles.hotelRating}>
                    {renderStars(hotel.rating)} ({hotel.rating}/5)
                  </div>
                  <div style={styles.hotelLocation}>
                    {hotel.city}, Guwahati
                  </div>
                  <div style={styles.hotelPrice}>
                    ₹{hotel.price} per night
                  </div>
                </div>
                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div style={styles.hotelAmenities}>
                    {hotel.amenities.slice(0, 5).map((amenity, index) => (
                      <span key={index} style={styles.amenityTag}>{amenity}</span>
                    ))}
                    {hotel.amenities.length > 5 && (
                      <span style={styles.amenityTag}>+{hotel.amenities.length - 5} more</span>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function HotelDetailPage({ user }) {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [loadingHotel, setLoadingHotel] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchHotel() {
      if (!id) return;
      setLoadingHotel(true);
      try {
        const hotelRef = doc(db, "hotels", id);
        const hotelSnap = await getDoc(hotelRef);
        if (hotelSnap.exists()) {
          setHotel({ id: hotelSnap.id, ...hotelSnap.data() });
        } else {
          console.log("No such document!");
          navigate('/not-found');
        }
      } catch (error) {
        console.error("Error fetching hotel:", error);
        alert("Failed to load hotel details.");
      }
      setLoadingHotel(false);
    }
    fetchHotel();
  }, [id, navigate]);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} style={styles.starRating}>
          {i < rating ? '★' : '☆'}
        </span>
      );
    }
    return stars;
  };

  if (loadingHotel) {
    return <div style={{ textAlign: 'center', padding: 50 }}>Loading hotel details...</div>;
  }

  if (!hotel) {
    return <div style={{ textAlign: 'center', padding: 50 }}>Hotel not found.</div>;
  }

  const pageTitle = `${hotel.name} - ${hotel.rating}★ Hotel in ${hotel.city}, Guwahati`;

  const hotelSchema = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "name": hotel.name,
    "description": hotel.description || `Hotel ${hotel.name} in ${hotel.city}, Guwahati`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": hotel.address,
      "addressLocality": hotel.city,
      "addressRegion": "Assam",
      "postalCode": hotel.pincode,
      "addressCountry": "India"
    },
    "priceRange": `₹${hotel.price}`,
    "telephone": hotel.contact,
    "starRating": {
      "@type": "Rating",
      "ratingValue": hotel.rating
    }
  };

  return (
    <article style={styles.detailContainer}>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={`Book ${hotel.name} - ${hotel.rating} star hotel in ${hotel.city}, Guwahati. ${hotel.description?.substring(0, 160) || ''}`} />
        <script type="application/ld+json">
          {JSON.stringify(hotelSchema)}
        </script>
      </Helmet>

      <Link to="/" style={styles.backButton}>&larr; Back to All Hotels</Link>
      {hotel.imageUrl && (
        <img
          src={hotel.imageUrl}
          alt={hotel.name}
          style={styles.detailImage}
        />
      )}
      <h1 style={styles.detailTitle}>{hotel.name}</h1>
      <div style={styles.detailInfo}>
        {renderStars(hotel.rating)} ({hotel.rating}/5)
      </div>
      <div style={styles.detailInfo}>
        <strong>Price:</strong> ₹{hotel.price} per night
      </div>
      <div style={styles.detailInfo}>
        <strong>Location:</strong> {hotel.city}, Guwahati
      </div>
      {hotel.address && (
        <div style={styles.detailInfo}>
          <strong>Address:</strong> {hotel.address}
        </div>
      )}
      {hotel.contact && (
        <div style={styles.detailInfo}>
          <strong>Contact:</strong> {hotel.contact}
        </div>
      )}
      {hotel.amenities && hotel.amenities.length > 0 && (
        <div style={styles.detailInfo}>
          <strong>Amenities:</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {hotel.amenities.map((amenity, index) => (
              <span key={index} style={styles.amenityTag}>{amenity}</span>
            ))}
          </div>
        </div>
      )}
      {hotel.description && (
        <div style={{ ...styles.detailInfo, marginTop: 20 }}>
          <strong>Description:</strong>
          <p>{hotel.description}</p>
        </div>
      )}
    </article>
  );
}

function AddHotelForm({ user, handleAddHotel, form, handleChange, imageFile, handleImageChange, loading }) {
  const categories = ["Luxury", "Budget", "Resort", "Boutique", "Business", "Family"];
  const amenitiesList = ["WiFi", "Pool", "Gym", "Spa", "Restaurant", "Parking", "AC", "Breakfast", "Bar", "Laundry"];
  
  const guwahatiAreas = [
    "Paltan Bazaar",
    "Fancy Bazaar",
    "Uzan Bazaar",
    "Pan Bazaar",
    "Lachit Nagar",
    "Dispur",
    "Beltola",
    "Ganeshguri",
    "Six Mile",
    "Kahilipara",
    "Zoo Road",
    "Maligaon",
    "Chandmari",
    "Silpukhuri",
    "Geetanagar",
    "Hengrabari",
    "Bhangagarh",
    "Ulubari",
    "Rehabari",
    "Birubari",
    "Noonmati",
    "Lokhra",
    "Bhetapara",
    "Bamunimaidan",
    "Jalukbari",
    "North Guwahati",
    "Amingaon",
    "Azara",
    "VIP Road",
    "GS Road",
    "RG Baruah Road"
  ];

  return (
    <section style={styles.formContainer}>
      <Helmet>
        <title>Add New Hotel - Guwahati Hotel Listing</title>
        <meta name="description" content="Add your hotel in Guwahati to our platform and reach more customers. List your property with photos, amenities, and pricing." />
      </Helmet>
      <h2 style={styles.formTitle}>Add New Hotel in Guwahati</h2>

      <form onSubmit={handleAddHotel}>
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="name">Hotel Name *</label>
          <input
            style={styles.input}
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="e.g., Grand Plaza Hotel"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="rating">Rating (1-5) *</label>
          <select
            style={styles.select}
            id="rating"
            name="rating"
            value={form.rating}
            onChange={handleChange}
            required
          >
            <option value="">Select Rating</option>
            <option value="1">1 ★</option>
            <option value="2">2 ★★</option>
            <option value="3">3 ★★★</option>
            <option value="4">4 ★★★★</option>
            <option value="5">5 ★★★★★</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="price">Price Per Night (₹) *</label>
          <input
            style={styles.input}
            id="price"
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            required
            placeholder="e.g., 2500"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="category">Category *</label>
          <select
            style={styles.select}
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="address">Address</label>
          <input
            style={styles.input}
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="e.g., 123 Main Street"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="city">Area in Guwahati *</label>
          <select
            style={styles.select}
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            required
          >
            <option value="">Select Area in Guwahati</option>
            {guwahatiAreas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="pincode">Pincode</label>
          <input
            style={styles.input}
            id="pincode"
            name="pincode"
            value={form.pincode}
            onChange={handleChange}
            placeholder="e.g., 781001"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="contact">Contact Info *</label>
          <input
            style={styles.input}
            id="contact"
            name="contact"
            value={form.contact}
            onChange={handleChange}
            required
            placeholder="e.g., +91 9876543210 or info@hotel.com"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="amenities">Amenities</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {amenitiesList.map(amenity => (
              <div key={amenity} style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id={`amenity-${amenity}`}
                  name="amenities"
                  value={amenity}
                  checked={form.amenities?.includes(amenity) || false}
                  onChange={(e) => {
                    const { checked, value } = e.target;
                    handleChange({
                      target: {
                        name: 'amenities',
                        value: checked
                          ? [...(form.amenities || []), value]
                          : form.amenities?.filter(a => a !== value) || []
                      }
                    });
                  }}
                />
                <label htmlFor={`amenity-${amenity}`} style={{ marginLeft: 5 }}>{amenity}</label>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="imageUpload">Hotel Image (Optional)</label>
          <input
            style={styles.input}
            type="file"
            id="imageUpload"
            name="imageUpload"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="description">Description</label>
          <textarea
            style={styles.textarea}
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe your hotel, rooms, services, etc..."
          />
        </div>

        <button
          type="submit"
          style={{
            ...styles.button,
            ...styles.btnSuccess,
            ...(loading || !user ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
          }}
          disabled={loading || !user}
        >
          {loading ? "Adding..." : "Add Hotel"}
        </button>
        {!user && <p style={{ color: '#dc3545', marginTop: 10 }}>Please login to add hotels.</p>}
      </form>
    </section>
  );
}

export default function HotelListingApp() {
  const [user, setUser] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    rating: "",
    price: "",
    category: "",
    address: "",
    city: "",
    state: "Assam",
    pincode: "",
    country: "India",
    contact: "",
    amenities: [],
    description: "",
    imageUrl: "",
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "hotels"), orderBy("rating", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setHotels(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });
    return () => unsub();
  }, []);

  async function handleLogin() {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert("Login failed: " + error.message);
      console.error("Login error:", error);
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (error) {
      alert("Logout failed: " + error.message);
      console.error("Logout error:", error);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleImageChange(e) {
    setImageFile(e.target.files[0]);
  }

  async function uploadImage() {
    if (!imageFile) return null;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      setLoading(false);
      return data.secure_url;
    } catch (error) {
      setLoading(false);
      console.error("Image upload failed:", error);
      alert("Failed to upload image. Please try again.");
      return null;
    }
  }

  async function handleAddHotel(e) {
    e.preventDefault();
    if (!user) {
      alert("Please login to add a hotel.");
      return;
    }
    if (!form.name.trim() || !form.rating || !form.price || !form.category || !form.city || !form.contact) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    let imageUrl = "";
    if (imageFile) {
      imageUrl = await uploadImage();
      if (!imageUrl) {
        setLoading(false);
        return;
      }
    }

    try {
      await addDoc(collection(db, "hotels"), {
        name: form.name.trim(),
        rating: parseFloat(form.rating),
        price: parseFloat(form.price),
        category: form.category,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        country: form.country.trim(),
        contact: form.contact.trim(),
        amenities: form.amenities || [],
        description: form.description.trim(),
        imageUrl: imageUrl,
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: new Date().toISOString(),
      });
      setForm({
        name: "",
        rating: "",
        price: "",
        category: "",
        address: "",
        city: "",
        state: "Assam",
        pincode: "",
        country: "India",
        contact: "",
        amenities: [],
        description: "",
        imageUrl: "",
      });
      setImageFile(null);
      alert("Hotel added successfully!");
    } catch (error) {
      alert("Failed to add hotel: " + error.message);
      console.error("Add hotel error:", error);
    }
    setLoading(false);
  }

  return (
    <HelmetProvider>
      <Router>
        <div style={styles.container}>
          <h1 style={styles.header}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              Guwahati Hotel Finder
            </Link>
          </h1>

          <AuthBar user={user} handleLogin={handleLogin} handleLogout={handleLogout} />

          <Routes>
            <Route
              path="/"
              element={
                <HotelListingPage
                  user={user}
                  hotels={hotels}
                  loading={loading}
                />
              }
            />
            <Route
              path="/hotels/:id"
              element={<HotelDetailPage user={user} />}
            />
            <Route
              path="/add-hotel"
              element={
                <AddHotelForm
                  user={user}
                  handleAddHotel={handleAddHotel}
                  form={form}
                  handleChange={handleChange}
                  imageFile={imageFile}
                  handleImageChange={handleImageChange}
                  loading={loading}
                />
              }
            />
            <Route path="*" element={<div style={{ textAlign: 'center', padding: 50 }}>404 - Page Not Found</div>} />
          </Routes>

          <footer style={styles.footer}>
            <p>&copy; {new Date().getFullYear()} Guwahati Hotel Finder. All rights reserved.</p>
          </footer>
        </div>
      </Router>
    </HelmetProvider>
  );
}
