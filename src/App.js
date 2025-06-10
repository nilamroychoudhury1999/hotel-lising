import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCQJ3dX_ZcxVKzlCD8H19JM3KYh7qf8wYk",
  authDomain: "form-ca7cc.firebaseapp.com",
  databaseURL: "https://form-ca7cc-default-rtdb.firebaseio.com",
  projectId: "form-ca7cc",
  storageBucket: "form-ca7cc.firebasestorage.app",
  messagingSenderId: "1054208318782",
  appId: "1:1054208318782:web:f64f43412902afcd7aa06f",
  measurementId: "G-CQSLK7PCFQ",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// --- Cloudinary Configuration ---
const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset_1";
const CLOUDINARY_CLOUD_NAME = "dyrmi2zkl";

// --- Geocoding Function ---
async function geocodeAddress(address) {
  if (!address) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    address
  )}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.length === 0) return null;
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
}

export default function EventListingApp() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    date: "",
    state: "",
    city: "",
    country: "",
    description: "",
    contact: "",
    category: "All", // New field for category
    imageUrl: "",    // New field for image URL
  });
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All"); // State for category filter
  const [imageFile, setImageFile] = useState(null); // State to hold the selected image file

  // --- Auth State Listener ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // --- Fetch Events from Firestore ---
  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setEvents(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });
    return () => unsub();
  }, []);

  // --- Authentication Handlers ---
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

  // --- Form Handlers ---
  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleImageChange(e) {
    setImageFile(e.target.files[0]);
  }

  // --- Upload Image to Cloudinary ---
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

  // --- Add Event Handler ---
  async function handleAddEvent(e) {
    e.preventDefault();
    if (!user) {
      alert("Please login to add an event.");
      return;
    }
    if (!form.title.trim() || !form.date.trim() || !form.category.trim()) {
      alert("Please fill in at least Title, Date, and Category.");
      return;
    }

    setLoading(true);
    let imageUrl = "";
    if (imageFile) {
      imageUrl = await uploadImage();
      if (!imageUrl) {
        setLoading(false);
        return; // Stop if image upload fails
      }
    }

    const locationString = [form.city, form.state, form.country]
      .filter(Boolean)
      .join(", ");

    try {
      const coords = await geocodeAddress(locationString);
      await addDoc(collection(db, "events"), {
        title: form.title.trim(),
        date: form.date,
        state: form.state.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        contact: form.contact.trim(),
        description: form.description.trim(),
        category: form.category, // Save category
        imageUrl: imageUrl,       // Save image URL
        coords,
        interestedUsers: [],
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: new Date().toISOString(),
      });
      setForm({
        title: "",
        date: "",
        state: "",
        city: "",
        country: "",
        description: "",
        contact: "",
        category: "All",
        imageUrl: "",
      });
      setImageFile(null); // Clear image input
      alert("Event added successfully!");
    } catch (error) {
      alert("Failed to add event: " + error.message);
      console.error("Add event error:", error);
    }
    setLoading(false);
  }

  // --- Toggle Interest Handler ---
  async function toggleInterest(event) {
    if (!user) {
      alert("Please login to show interest.");
      return;
    }
    const eventRef = doc(db, "events", event.id);
    const isInterested = event.interestedUsers?.includes(user.uid);

    try {
      await updateDoc(eventRef, {
        interestedUsers: isInterested
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid),
      });
    } catch (error) {
      alert("Failed to update interest: " + error.message);
      console.error("Toggle interest error:", error);
    }
  }

  // --- Event Filtering Logic ---
  const categories = ["All", "Music", "Sports", "Art", "Tech", "Food", "Other"];

  const filteredEvents = events
    .filter((event) => {
      const lowerSearch = search.toLowerCase();
      const matchesSearch =
        event.title.toLowerCase().includes(lowerSearch) ||
        (event.city?.toLowerCase().includes(lowerSearch) ?? false) ||
        (event.state?.toLowerCase().includes(lowerSearch) ?? false) ||
        (event.country?.toLowerCase().includes(lowerSearch) ?? false);

      const matchesCategory =
        selectedCategory === "All" || event.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Ensure events are sorted by date

  // --- Inline Styles (for professional appearance) ---
  const styles = {
    container: {
      maxWidth: 900,
      margin: "40px auto",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: "#333",
      padding: 20,
      backgroundColor: "#f5f7fa",
      borderRadius: 10,
      boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    },
    header: {
      textAlign: "center",
      marginBottom: 40,
      fontSize: 36,
      fontWeight: "800",
      color: "#2c3e50",
      letterSpacing: "1px",
    },
    authBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 30,
      padding: "15px 20px",
      backgroundColor: "#ffffff",
      borderRadius: 8,
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    },
    button: {
      padding: "10px 20px",
      fontSize: 15,
      borderRadius: 6,
      cursor: "pointer",
      border: "none",
      fontWeight: "700",
      transition: "background-color 0.3s ease, transform 0.2s ease",
      "&:hover": {
        transform: "translateY(-1px)",
      },
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
      transition: "border-color 0.2s ease",
      "&:focus": {
        borderColor: "#80bdff",
        boxShadow: "0 0 0 0.2rem rgba(0,123,255,.25)",
      },
    },
    categoryFilter: {
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 30,
    },
    categoryButton: {
        padding: "8px 16px",
        fontSize: 14,
        borderRadius: 20, // Pill shape
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
    eventList: {
      listStyle: "none",
      paddingLeft: 0,
      marginBottom: 40,
    },
    eventItem: {
      backgroundColor: "white",
      marginBottom: 15,
      padding: 20,
      borderRadius: 10,
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      display: "flex",
      gap: 20,
      alignItems: "flex-start",
    },
    eventImage: {
      width: 150,
      height: 100,
      objectFit: "cover",
      borderRadius: 8,
      flexShrink: 0,
    },
    eventContent: {
      flexGrow: 1,
    },
    eventTitle: {
      fontSize: 22,
      marginBottom: 8,
      color: "#2c3e50",
      fontWeight: "600",
    },
    eventDetails: {
      display: "flex",
      flexDirection: "column",
      gap: 5,
      marginBottom: 10,
    },
    eventDate: {
      color: "#6c757d",
      fontSize: 15,
      fontWeight: "500",
    },
    eventLocation: {
      color: "#6c757d",
      fontSize: 15,
      fontStyle: "italic",
    },
    eventCategory: {
        color: "#6c757d",
        fontSize: 15,
        fontWeight: "500",
    },
    eventDesc: {
      marginTop: 10,
      fontSize: 16,
      color: "#555",
      lineHeight: 1.6,
    },
    eventContact: {
      fontSize: 15,
      color: "#007bff",
      marginTop: 5,
    },
    interestedBtn: {
      marginTop: 15,
      padding: "10px 18px",
      borderRadius: 6,
      fontWeight: "600",
      cursor: "pointer",
      border: "none",
      transition: "background-color 0.3s ease",
    },
    interestedCount: {
      marginLeft: 10,
      fontSize: 14,
      color: "#555",
      fontWeight: "500",
    },
    formContainer: {
      backgroundColor: "#ffffff",
      padding: 30,
      borderRadius: 10,
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    },
    formTitle: {
      fontSize: 24,
      marginBottom: 25,
      color: "#2c3e50",
      fontWeight: "600",
      textAlign: "center",
    },
    formGroup: {
      marginBottom: 20,
      display: "flex",
      flexDirection: "column",
    },
    label: {
      marginBottom: 8,
      fontWeight: "600",
      fontSize: 15,
      color: "#333",
    },
    input: {
      padding: 12,
      fontSize: 16,
      borderRadius: 6,
      border: "1px solid #ced4da",
      outline: "none",
      transition: "border-color 0.2s ease",
      "&:focus": {
        borderColor: "#80bdff",
        boxShadow: "0 0 0 0.2rem rgba(0,123,255,.25)",
      },
    },
    textarea: {
      padding: 12,
      fontSize: 16,
      borderRadius: 6,
      border: "1px solid #ced4da",
      outline: "none",
      resize: "vertical",
      minHeight: 100,
      transition: "border-color 0.2s ease",
      "&:focus": {
        borderColor: "#80bdff",
        boxShadow: "0 0 0 0.2rem rgba(0,123,255,.25)",
      },
    },
    select: {
        padding: 12,
        fontSize: 16,
        borderRadius: 6,
        border: "1px solid #ced4da",
        outline: "none",
        backgroundColor: "white",
        cursor: "pointer",
    },
    disabledButton: {
        opacity: 0.6,
        cursor: "not-allowed",
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Listeve - Event Listing</h1>

      {/* --- Authentication Bar --- */}
      <div style={styles.authBar}>
        {user ? (
          <>
            <div>
              Welcome, <strong>{user.displayName}</strong>
            </div>
            <button
              style={{ ...styles.button, ...styles.btnDanger }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <button
            style={{ ...styles.button, ...styles.btnPrimary }}
            onClick={handleLogin}
          >
            Login with Google
          </button>
        )}
      </div>

      {/* --- Search Input --- */}
      <input
        style={styles.searchInput}
        type="text"
        placeholder="Search events by title, city, state, or country..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={!events.length && !loading}
      />

      {/* --- Category Filter --- */}
      {events.length > 0 && (
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

      {/* --- Event List --- */}
      <ul style={styles.eventList}>
        {filteredEvents.length === 0 && (
          <li style={{ textAlign: "center", color: "#777", fontSize: 16 }}>
            No events found matching your criteria.
          </li>
        )}

        {filteredEvents.map((event) => {
          const interestedCount = event.interestedUsers?.length || 0;
          const isInterested = user
            ? event.interestedUsers?.includes(user.uid)
            : false;
          return (
            <li key={event.id} style={styles.eventItem}>
              {event.imageUrl && (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  style={styles.eventImage}
                />
              )}
              <div style={styles.eventContent}>
                <div style={styles.eventTitle}>{event.title}</div>
                <div style={styles.eventDetails}>
                    <div style={styles.eventDate}>
                        Date: {new Date(event.date).toLocaleDateString()}
                    </div>
                    {(event.city || event.state || event.country) && (
                        <div style={styles.eventLocation}>
                            Location:{" "}
                            {[event.city, event.state, event.country]
                                .filter(Boolean)
                                .join(", ")}
                        </div>
                    )}
                    {event.category && (
                        <div style={styles.eventCategory}>
                            Category: <strong>{event.category}</strong>
                        </div>
                    )}
                </div>
                {event.description && (
                  <div style={styles.eventDesc}>{event.description}</div>
                )}
                {event.contact && (
                  <div style={styles.eventContact}>Contact: {event.contact}</div>
                )}
                <button
                  style={{
                    ...styles.interestedBtn,
                    backgroundColor: isInterested ? "#28a745" : "#007bff",
                    color: "white",
                    ...(loading ? styles.disabledButton : {}),
                  }}
                  onClick={() => toggleInterest(event)}
                  disabled={loading}
                >
                  {isInterested ? "Interested ✓" : "Show Interest"}
                </button>
                <span style={styles.interestedCount}>
                  {interestedCount} interested
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* --- Add New Event Form --- */}
      <form style={styles.formContainer} onSubmit={handleAddEvent}>
        <h2 style={styles.formTitle}>Add New Event</h2>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="title">
            Event Title *
          </label>
          <input
            style={styles.input}
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="e.g., Local Music Festival"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="date">
            Event Date *
          </label>
          <input
            style={styles.input}
            id="date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
          />
        </div>

        <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="category">
                Category *
            </label>
            <select
                style={styles.select}
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
            >
                {categories.map((cat) => (
                    <option key={cat} value={cat}>
                        {cat}
                    </option>
                ))}
            </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="city">
            City
          </label>
          <input
            style={styles.input}
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="e.g., Mumbai"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="state">
            State
          </label>
          <input
            style={styles.input}
            id="state"
            name="state"
            value={form.state}
            onChange={handleChange}
            placeholder="e.g., Maharashtra"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="country">
            Country
          </label>
          <input
            style={styles.input}
            id="country"
            name="country"
            value={form.country}
            onChange={handleChange}
            placeholder="e.g., India"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="contact">
            Contact Info
          </label>
          <input
            style={styles.input}
            id="contact"
            name="contact"
            value={form.contact}
            onChange={handleChange}
            placeholder="e.g., email@example.com or phone number"
          />
        </div>

        <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="imageUpload">
                Event Image (Optional)
            </label>
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
          <label style={styles.label} htmlFor="description">
            Description
          </label>
          <textarea
            style={styles.textarea}
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Provide a detailed description of the event..."
          />
        </div>

        <button
          type="submit"
          style={{
            ...styles.button,
            ...styles.btnSuccess,
            ...(loading ? styles.disabledButton : {}),
          }}
          disabled={loading || !user}
        >
          {loading ? "Adding..." : "Add Event"}
        </button>
        {!user && <p style={{color: '#dc3545', marginTop: 10, textAlign: 'center'}}>Please login to add events.</p>}
      </form>
    </div>
  );
}
