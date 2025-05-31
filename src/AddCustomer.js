import React, { useState } from "react";
import { db, auth } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import axios from "axios";

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
                roomNumber,
                checkInDate,
            });

            // Reset fields
            setIdentityId("");
            setName("");
            setImage(null);
            setRoomNumber("");
            setCheckInDate("");
            alert("Customer added!");
        } catch (error) {
            alert("Error uploading or saving: " + error.message);
        }

        setUploading(false);
    };

    if (!user) return <p>Please login to add customers.</p>;

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Add New Customer</h2>

            <div style={styles.form}>
                <input
                    type="text"
                    placeholder="Customer ID"
                    value={identityId}
                    onChange={(e) => setIdentityId(e.target.value)}
                    style={styles.input}
                />
                <input
                    type="text"
                    placeholder="Customer Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={styles.input}
                />
                <input
                    type="text"
                    placeholder="Room Number"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    style={styles.input}
                />
                <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    style={styles.input}
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    style={styles.input}
                />

                <button
                    onClick={handleSubmit}
                    disabled={uploading}
                    style={{
                        ...styles.button,
                        backgroundColor: uploading ? "#888" : "#4CAF50",
                    }}
                >
                    {uploading ? "Uploading..." : "Add Customer"}
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "500px",
        margin: "30px auto",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        backgroundColor: "#fff",
    },
    title: {
        textAlign: "center",
        marginBottom: "20px",
        color: "#333",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    input: {
        padding: "10px",
        fontSize: "16px",
        borderRadius: "6px",
        border: "1px solid #ccc",
        width: "100%",
        boxSizing: "border-box",
    },
    button: {
        padding: "12px",
        fontSize: "16px",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
    },
};

export default AddCustomer;
