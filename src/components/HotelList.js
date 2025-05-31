import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

const HotelList = () => {
    const [hotels, setHotels] = useState([]);

    useEffect(() => {
        const fetchHotels = async () => {
            const querySnapshot = await getDocs(collection(db, "hotels"));
            setHotels(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        };
        fetchHotels();
    }, []);

    return (
        <div>
            <h2>Hotel Listings</h2>
            <ul>
                {hotels.map((hotel) => (
                    <li key={hotel.id}>{hotel.name} - {hotel.location}</li>
                ))}
            </ul>
        </div>
    );
};

export default HotelList;
