// src/AddCustomer.js
import React, { useState } from "react";
import { db, auth } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import axios from "axios";

// Your previous Cloudinary upload details here:
const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset_1";
const CLOUDINARY_CLOUD_NAME = "dyrmi2zkl";

function AddCustomer() {
    const [user] = useAuthState(auth);
    const [identityId, setIdentityId] = useState("");
    const [name, setName] = useState("");
    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [roomNumber, setRoomNumber] = useState("");
    const [checkInDate, setCheckInDate] = useState("");
    const handleSubmit = async () => {
        if (!identityId || !name || !image) {
            alert("Please fill all fields and select an image");
            return;
        }
        if (!user) {
            alert("You must be logged in");
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", image);
            formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

            const res = await axios.post(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
                formData
            );

            const imageUrl = res.data.secure_url;

            await addDoc(collection(db, "customersByUser", user.uid, "customers"), {
                identityId,
                name,
                imageUrl,
                date: Timestamp.now(),
                roomNumber, // ✅ added
                checkInDate, // ✅ added
            });

            setIdentityId("");
            setName("");
            setImage(null);
            setRoomNumber("");
            setCheckInDate("")
            alert("Customer added!");
        } catch (error) {
            alert("Error uploading or saving: " + error.message);
        }

        setUploading(false);
    };

    if (!user) return <p>Please login to add customers.</p>;

    return (
        <div style={{ marginTop: 20, maxWidth: 600 }}>
            <h3>Add Customer</h3>
            <input
                type="text"
                placeholder="ID"
                value={identityId}
                onChange={(e) => setIdentityId(e.target.value)}
                style={{ marginRight: 10, padding: 8, width: "30%" }}
            />
            <input
                type="text"
                placeholder="Customer Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ marginRight: 10, padding: 8, width: "40%" }}
            />
            <input
                type="text"
                placeholder="Room Number"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                style={{ marginTop: 10, marginRight: 10, padding: 8, width: "30%" }}
            />
            <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                style={{ marginTop: 10, marginRight: 10, padding: 8, width: "40%" }}
            />
            <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
                style={{ marginRight: 10 }}
            />
            <button onClick={handleSubmit} disabled={uploading}>
                {uploading ? "Uploading..." : "Add"}
            </button>
        </div>
    );
}

export default AddCustomer;
