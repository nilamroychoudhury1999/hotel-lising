import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

function CustomerTable() {
    const [user] = useAuthState(auth);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

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

    const handleExportExcel = () => {
        const exportData = filtered.map((cust) => ({
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

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const tableData = filtered.map((cust) => [
            cust.identityId,
            cust.name,
            cust.roomNumber,
            cust.checkInDate,
            new Date(cust.date?.seconds * 1000).toLocaleString(),
        ]);
        doc.autoTable({
            head: [["Identity ID", "Name", "Room", "Check-in", "Date Added"]],
            body: tableData,
        });
        doc.save("customers.pdf");
    };

    const filtered = customers.filter((cust) => {
        const matchSearch = [cust.identityId, cust.name, cust.roomNumber]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase());

        const addedDate = new Date(cust.date?.seconds * 1000);
        const matchStart = startDate ? new Date(startDate) <= addedDate : true;
        const matchEnd = endDate ? new Date(endDate) >= addedDate : true;

        return matchSearch && matchStart && matchEnd;
    });

    if (!user) return <p>Please login to see your customers.</p>;
    if (loading) return <p>Loading customers...</p>;

    return (
        <div style={styles.container}>
            <h3 style={styles.heading}>Your Customers</h3>

            <div style={styles.filters}>
                <input
                    type="text"
                    placeholder="Search by Name, ID, or Room"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={styles.input}
                />
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={styles.input}
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={styles.input}
                />
                <button onClick={handleExportExcel} style={styles.buttonGreen}>
                    Export Excel
                </button>
                <button onClick={handleExportPDF} style={styles.buttonBlue}>
                    Export PDF
                </button>
            </div>

            {filtered.length === 0 ? (
                <p>No customers found.</p>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={styles.table}>
                        <thead style={styles.tableHead}>
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
                                            style={{ height: 40, objectFit: "cover" }}
                                        />
                                    </td>
                                    <td>
                                        {new Date(cust.date?.seconds * 1000).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        padding: 20,
        maxWidth: "100%",
    },
    heading: {
        marginBottom: 10,
    },
    filters: {
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 15,
    },
    input: {
        padding: "8px",
        fontSize: "14px",
        borderRadius: "4px",
        border: "1px solid #ccc",
    },
    buttonGreen: {
        padding: "8px 12px",
        backgroundColor: "#28a745",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    buttonBlue: {
        padding: "8px 12px",
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        minWidth: 600,
    },
    tableHead: {
        backgroundColor: "#f0f0f0",
    },
};

export default CustomerTable;
