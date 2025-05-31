// src/App.js
import React, { useState } from "react";
import Auth from "./Auth";
import AddCustomer from "./AddCustomer";
import CustomerTable from "./CustomerTable";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif", maxWidth: 900, margin: "auto" }}>
      <h1>Admin Customer Portal</h1>
      <Auth onAdminLogin={setIsAdmin} />
      {isAdmin ? (
        <>
          <AddCustomer />
          <CustomerTable />
        </>
      ) : (
        <p>Please login as an admin to manage customers.</p>
      )}
    </div>
  );
}

export default App;
