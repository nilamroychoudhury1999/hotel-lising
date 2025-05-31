import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

const AddHotel = () => {
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");

    const handleAdd = async () => {
        if (name && location) {
            await addDoc(collection(db, "hotels"), { name, location });
            setName("");
            setLocation("");
        }
    };

    return (
        <div>
            <h2>Add Hotel</h2>
            <input
                type="text"
                placeholder="Hotel Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
            />
            <button onClick={handleAdd}>Add</button>
        </div>
    );
};

export default AddHotel;
