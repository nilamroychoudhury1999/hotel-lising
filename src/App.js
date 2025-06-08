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

// Firebase config (replace with your own)
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

async function geocodeAddress(address) {
  if (!address) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    address
  )}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.length === 0) return null;
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
  };
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
    contact: ""
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    return auth.onAuthStateChanged((u) => setUser(u));
  }, []);

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

  async function handleLogin() {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  }

  async function handleLogout() {
    await signOut(auth);
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleAddEvent(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.date.trim()) {
      alert("Please fill in at least Title and Date.");
      return;
    }
    setLoading(true);

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
      });
    } catch (error) {
      alert("Failed to add event: " + error.message);
    }
    setLoading(false);
  }

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
    }
  }

  // Filter events by search input (title, city, state, country)
  const filteredEvents = events.filter((event) => {
    const lowerSearch = search.toLowerCase();
    return (
      event.title.toLowerCase().includes(lowerSearch) ||
      (event.city?.toLowerCase().includes(lowerSearch) ?? false) ||
      (event.state?.toLowerCase().includes(lowerSearch) ?? false) ||
      (event.country?.toLowerCase().includes(lowerSearch) ?? false)
    );
  });
  console.log(filteredEvents)
  // Inline styles
  const styles = {
    container: {
      maxWidth: 700,
      margin: "40px auto",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: "#222",
      padding: 20,
    },
    header: {
      textAlign: "center",
      marginBottom: 40,
      fontSize: 32,
      fontWeight: "700",
      color: "#333",
    },
    authBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 30,
    },
    button: {
      padding: "8px 16px",
      fontSize: 14,
      borderRadius: 4,
      cursor: "pointer",
      border: "none",
      fontWeight: "600",
      transition: "background-color 0.2s",
    },
    btnPrimary: {
      backgroundColor: "#007bff",
      color: "white",
    },
    btnDanger: {
      backgroundColor: "#dc3545",
      color: "white",
    },
    btnOutlinePrimary: {
      backgroundColor: "transparent",
      border: "2px solid #007bff",
      color: "#007bff",
    },
    btnSuccess: {
      backgroundColor: "#28a745",
      color: "white",
    },
    searchInput: {
      width: "100%",
      padding: "10px",
      fontSize: 16,
      borderRadius: 6,
      border: "1px solid #ccc",
      outline: "none",
      marginBottom: 30,
      boxSizing: "border-box",
    },
    eventList: {
      listStyle: "none",
      paddingLeft: 0,
      marginBottom: 40,
    },
    eventItem: {
      backgroundColor: "white",
      marginBottom: 12,
      padding: 15,
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    },
    eventTitle: {
      fontSize: 20,
      marginBottom: 6,
      color: "#222",
    },
    eventDate: {
      color: "#555",
      fontSize: 14,
    },
    eventLocation: {
      color: "#777",
      fontSize: 14,
      fontStyle: "italic",
    },
    eventDesc: {
      marginTop: 8,
      fontSize: 16,
      color: "#444",
    },
    interestedBtn: {
      marginTop: 10,
      padding: "8px 14px",
      borderRadius: 6,
      fontWeight: "600",
      cursor: "pointer",
      border: "none",
    },
    interestedCount: {
      marginLeft: 10,
      fontSize: 14,
      color: "#555",
    },
    formContainer: {
      backgroundColor: "#f9f9f9",
      padding: 20,
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    formGroup: {
      marginBottom: 15,
      display: "flex",
      flexDirection: "column",
    },
    label: {
      marginBottom: 6,
      fontWeight: "600",
      fontSize: 14,
      color: "#333",
    },
    input: {
      padding: 10,
      fontSize: 16,
      borderRadius: 6,
      border: "1px solid #ccc",
      outline: "none",
    },
    textarea: {
      padding: 10,
      fontSize: 16,
      borderRadius: 6,
      border: "1px solid #ccc",
      outline: "none",
      resize: "vertical",
      minHeight: 80,
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Event Listing App</h1>

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

      <input
        style={styles.searchInput}
        type="text"
        placeholder="Search events by title, city, state, or country..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={!events.length}
      />

      <ul style={styles.eventList}>
        {filteredEvents.length === 0 && (
          <li style={{ textAlign: "center", color: "#777" }}>
            No events found.
          </li>
        )}

        {filteredEvents.map((event) => {
          const interestedCount = event.interestedUsers?.length || 0;
          const isInterested = user
            ? event.interestedUsers?.includes(user.uid)
            : false;
          return (
            <li key={event.id} style={styles.eventItem}>
              <div style={styles.eventTitle}>{event.title}</div>
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
              {event.description && (
                <div style={styles.eventDesc}>{event.description}</div>
              )}
              {event.contact && (
                <div style={styles.eventDesc}>{event.contact}</div>
              )}
              <button
                style={{
                  ...styles.interestedBtn,
                  backgroundColor: isInterested
                    ? "#28a745"
                    : "#007bff",
                  color: "white",
                }}
                onClick={() => toggleInterest(event)}
              >
                {isInterested ? "Interested ✓" : "Show Interest"}
              </button>
              <span style={styles.interestedCount}>
                {interestedCount} interested
              </span>
            </li>
          );
        })}
      </ul>

      <form style={styles.formContainer} onSubmit={handleAddEvent}>
        <h2>Add New Event</h2>

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
            placeholder="Enter event title"
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
          <label style={styles.label} htmlFor="city">
            City
          </label>
          <input
            style={styles.input}
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="Enter city"
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
            placeholder="Enter state"
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
            placeholder="Enter country"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="country">
            contact
          </label>
          <input
            style={styles.input}
            id="contact"
            name="contact"
            value={form.contact}
            onChange={handleChange}
            placeholder="Enter contact"
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
            placeholder="Optional event description"
          />
        </div>

        <button
          type="submit"
          style={{ ...styles.button, ...styles.btnSuccess }}
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Event"}
        </button>
      </form>
    </div>
  );
}
