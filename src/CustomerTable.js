import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import * as XLSX from "xlsx";

function CustomerTable() {
    const [user] = useAuthState(auth);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!user) return;

        const fetchCustomers = async () => {
            setLoading(true);
            try {
                const q = query(
                    collection(db, "customersByUser", user.uid, "customers"),
                    orderBy("date", "desc")
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setCustomers(data);
            } catch (err) {
                console.error(err);
                alert("Error fetching customers");
            }
            setLoading(false);
        };

        fetchCustomers();
    }, [user]);

    const handleExport = () => {
        const exportData = customers.map((cust) => ({
            IdentityID: cust.identityId,
            Name: cust.name,
            RoomNumber: cust.roomNumber,
            CheckInDate: cust.checkInDate,
            ImageURL: cust.imageUrl,
            AddedDate: new Date(cust.date?.seconds * 1000).toLocaleString(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

        XLSX.writeFile(workbook, "customers.xlsx");
    };

    const filtered = customers.filter((cust) =>
        [cust.identityId, cust.name, cust.roomNumber]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    if (!user) return <p>Please login to see your customers.</p>;
    if (loading) return <p>Loading customers...</p>;

    return (
        <div style={{ marginTop: 20, maxWidth: 900 }}>
            <h3>Your Customers</h3>

            <input
                type="text"
                placeholder="Search by Name, ID, or Room"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                    padding: "8px",
                    width: "60%",
                    marginBottom: "10px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                }}
            />

            <button
                onClick={handleExport}
                style={{
                    marginLeft: 10,
                    padding: "8px 12px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                }}
            >
                Export to Excel
            </button>

            {filtered.length === 0 ? (
                <p>No customers found.</p>
            ) : (
                <table
                    border="1"
                    cellPadding="10"
                    style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}
                >
                    <thead style={{ backgroundColor: "#f0f0f0" }}>
                        <tr>
                            <th>Identity ID</th>
                            <th>Name</th>
                            <th>Room Number</th>
                            <th>Check-in Date</th>
                            <th>Image</th>
                            <th>Date Added</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((cust) => (
                            <tr key={cust.id}>
                                <td>{cust.identityId}</td>
                                <td>{cust.name}</td>
                                <td>{cust.roomNumber}</td>
                                <td>{cust.checkInDate}</td>
                                <td>
                                    <img
                                        src={cust.imageUrl}
                                        alt={cust.name}
                                        style={{ height: 50, objectFit: "cover" }}
                                    />
                                </td>
                                <td>{new Date(cust.date?.seconds * 1000).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default CustomerTable;
