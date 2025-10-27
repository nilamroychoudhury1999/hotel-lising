import React, { useEffect, useMemo, useState } from "react";
import { HashRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

/* =======================
   BASIC CONFIG (Firebase)
   ======================= */
const firebaseConfig = {
  apiKey: "AIzaSyCQJ3dX_ZcxVKzlCD8H19JM3KYh7qf8wYk",
  authDomain: "form-ca7cc.firebaseapp.com",
  projectId: "form-ca7cc",
  storageBucket: "form-ca7cc.appspot.com",
  messagingSenderId: "1054208318782",
  appId: "1:1054208318782:web:f64f43412902afcd7aa06f",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* =======================
   UTILITIES
   ======================= */
const fmt = (n) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(n || 0));
const asDate = (v) => (typeof v === "string" ? new Date(v) : v instanceof Date ? v : new Date(v?.seconds ? v.seconds * 1000 : Date.now()));
const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

// very small ICS parser (VEVENT DTSTART/DTEND, SUMMARY). Assumes UTC or Z. Good enough for block imports.
function parseICS(text) {
  const events = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let cur = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "BEGIN:VEVENT") cur = {};
    else if (line === "END:VEVENT" && cur) {
      if (cur.DTSTART && cur.DTEND) events.push(cur);
      cur = null;
    } else if (cur) {
      const idx = line.indexOf(":");
      if (idx > -1) {
        const k = line.slice(0, idx).split(";")[0];
        const v = line.slice(idx + 1);
        cur[k] = v;
      }
    }
  }
  return events.map((e) => ({
    start: icsToDate(e.DTSTART),
    end: icsToDate(e.DTEND),
    summary: e.SUMMARY || "Imported Block",
  }));
}
function icsToDate(s) {
  // Supports forms like 20250107, 20250107T120000Z, 20250107T120000
  const m = String(s).match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?$/);
  if (!m) return new Date();
  const [_, Y, Mo, D, h = "00", mi = "00", se = "00"] = m;
  return new Date(Number(Y), Number(Mo) - 1, Number(D), Number(h), Number(mi), Number(se));
}

function useAuth() {
  const [user, setUser] = useState(null);
  useEffect(() => auth.onAuthStateChanged(setUser), []);
  const login = async () => { try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); } };
  const logout = async () => { try { await signOut(auth); } catch (e) { console.error(e); } };
  return { user, login, logout };
}

/* =======================
   DATA HOOKS (Firestore)
   ======================= */
function useCollection(coll, constraints = []) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    const q = constraints?.length ? query(collection(db, coll), ...constraints) : collection(db, coll);
    return onSnapshot(q, (snap) => setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [coll, JSON.stringify(constraints)]);
  return rows;
}

/* Collections used
  - units: { name, code, type, capacity, baseRate }
  - customers: { name, phone, email, notes }
  - bookings: { unitId, customerId, checkIn, checkOut, amount, status }
  - blocks: { unitId, start, end, note, source }
*/

/* =======================
   HEADER & LAYOUT
   ======================= */
function Header() {
  const { user, login, logout } = useAuth();
  const nav = [
    ["/", "Dashboard"],
    ["/units", "Units"],
    ["/bookings", "Bookings"],
    ["/customers", "Customers"],
    ["/calendar", "Calendar"],
    ["/reports", "Reports"],
  ];
  return (
    <header style={styles.header}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={styles.logo}>StayFlexi • Mini</span>
        {nav.map(([to, label]) => (
          <Link key={to} to={to} style={styles.link}>{label}</Link>
        ))}
      </div>
      <div>
        {user ? (
          <>
            <span style={{ marginRight: 12 }}>{user.displayName || user.email}</span>
            <button style={styles.btn} onClick={logout}>Logout</button>
          </>
        ) : (
          <button style={styles.btnPrimary} onClick={login}>Login with Google</button>
        )}
      </div>
    </header>
  );
}

function Page({ title, actions, children }) {
  return (
    <div style={styles.page}>
      <div style={styles.pageHead}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <div>{actions}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}

/* =======================
   DASHBOARD (KPIs)
   ======================= */
function Dashboard() {
  const bookings = useCollection("bookings");
  const units = useCollection("units");
  const customers = useCollection("customers");

  const kpis = useMemo(() => {
    const today = new Date();
    const yYY = today.getFullYear();
    const mMM = today.getMonth();

    let revenueY = 0, revenueM = 0, bkgsOpen = 0, occToday = 0;
    const todayKey = dateKey(today);

    for (const b of bookings) {
      const amt = Number(b.amount || 0);
      const ci = asDate(b.checkIn), co = asDate(b.checkOut);
      const inMonth = ci.getFullYear() === yYY && ci.getMonth() === mMM;
      const inYear = ci.getFullYear() === yYY;
      if (inYear) revenueY += amt;
      if (inMonth) revenueM += amt;
      if ((b.status || "").toLowerCase() === "confirmed") bkgsOpen += 1;
      // occupancy today if today within [ci, co)
      if (today >= new Date(ci.setHours(0,0,0,0)) && today < new Date(co.setHours(0,0,0,0))) occToday += 1;
    }
    const occRate = units.length ? Math.round((occToday / units.length) * 100) : 0;
    return { revenueM, revenueY, bkgsOpen, occRate, units: units.length, guests: customers.length };
  }, [bookings, units, customers]);

  return (
    <Page title="Dashboard" actions={null}>
      <div style={styles.kpiGrid}>
        <KPI title="Revenue (This Month)" value={`₹ ${fmt(kpis.revenueM)}`} />
        <KPI title="Revenue (This Year)" value={`₹ ${fmt(kpis.revenueY)}`} />
        <KPI title="Open Bookings" value={fmt(kpis.bkgsOpen)} />
        <KPI title="Occupancy Today" value={`${fmt(kpis.occRate)}%`} />
        <KPI title="Total Units" value={fmt(kpis.units)} />
        <KPI title="Customers" value={fmt(kpis.guests)} />
      </div>
    </Page>
  );
}

function KPI({ title, value }) {
  return (
    <div style={styles.card}>
      <div style={{ color: "#666", fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

/* =======================
   UNITS (Rooms/Inventory)
   ======================= */
function Units() {
  const rows = useCollection("units", [orderBy("name")]);
  const [form, setForm] = useState({ name: "", code: "", type: "Room", capacity: 2, baseRate: 2000 });
  const add = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    await addDoc(collection(db, "units"), { ...form, capacity: Number(form.capacity), baseRate: Number(form.baseRate) });
    setForm({ name: "", code: "", type: "Room", capacity: 2, baseRate: 2000 });
  };
  const remove = async (id) => { if (window.confirm("Delete unit?")) await deleteDoc(doc(db, "units", id)); };
  return (
    <Page title="Units" actions={null}>
      <form onSubmit={add} style={styles.formRow}>
        <input style={styles.input} placeholder="Name" value={form.name} onChange={(e)=>setForm({ ...form, name:e.target.value })} />
        <input style={styles.input} placeholder="Code" value={form.code} onChange={(e)=>setForm({ ...form, code:e.target.value })} />
        <input style={styles.input} placeholder="Type" value={form.type} onChange={(e)=>setForm({ ...form, type:e.target.value })} />
        <input style={styles.input} type="number" placeholder="Capacity" value={form.capacity} onChange={(e)=>setForm({ ...form, capacity:e.target.value })} />
        <input style={styles.input} type="number" placeholder="Base Rate" value={form.baseRate} onChange={(e)=>setForm({ ...form, baseRate:e.target.value })} />
        <button style={styles.btnPrimary}>Add</button>
      </form>
      <table style={styles.table}>
        <thead><tr><th>Name</th><th>Code</th><th>Type</th><th>Capacity</th><th>Base Rate</th><th></th></tr></thead>
        <tbody>
          {rows.map((u)=> (
            <tr key={u.id}>
              <td>{u.name}</td><td>{u.code}</td><td>{u.type}</td><td>{u.capacity}</td><td>₹ {fmt(u.baseRate)}</td>
              <td><button style={styles.btn} onClick={()=>remove(u.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Page>
  );
}

/* =======================
   CUSTOMERS
   ======================= */
function Customers() {
  const rows = useCollection("customers", [orderBy("name")]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const add = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    await addDoc(collection(db, "customers"), form);
    setForm({ name: "", phone: "", email: "", notes: "" });
  };
  const remove = async (id) => { if (window.confirm("Delete customer?")) await deleteDoc(doc(db, "customers", id)); };
  return (
    <Page title="Customers" actions={null}>
      <form onSubmit={add} style={styles.formRow}>
        <input style={styles.input} placeholder="Name" value={form.name} onChange={(e)=>setForm({ ...form, name:e.target.value })} />
        <input style={styles.input} placeholder="Phone" value={form.phone} onChange={(e)=>setForm({ ...form, phone:e.target.value })} />
        <input style={styles.input} placeholder="Email" value={form.email} onChange={(e)=>setForm({ ...form, email:e.target.value })} />
        <input style={styles.input} placeholder="Notes" value={form.notes} onChange={(e)=>setForm({ ...form, notes:e.target.value })} />
        <button style={styles.btnPrimary}>Add</button>
      </form>
      <table style={styles.table}>
        <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Notes</th><th></th></tr></thead>
        <tbody>
          {rows.map((c)=> (
            <tr key={c.id}>
              <td>{c.name}</td><td>{c.phone}</td><td>{c.email}</td><td>{c.notes}</td>
              <td><button style={styles.btn} onClick={()=>remove(c.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Page>
  );
}

/* =======================
   BOOKINGS
   ======================= */
function Bookings() {
  const units = useCollection("units");
  const customers = useCollection("customers");
  const bookings = useCollection("bookings", [orderBy("checkIn", "desc")]);
  const [form, setForm] = useState({ unitId: "", customerId: "", checkIn: "", checkOut: "", amount: 0, status: "confirmed" });

  const add = async (e) => {
    e.preventDefault();
    if (!form.unitId || !form.customerId || !form.checkIn || !form.checkOut) return;
    await addDoc(collection(db, "bookings"), {
      ...form,
      amount: Number(form.amount || 0),
      createdAt: new Date().toISOString(),
    });
    setForm({ unitId: "", customerId: "", checkIn: "", checkOut: "", amount: 0, status: "confirmed" });
  };
  const remove = async (id) => { if (window.confirm("Delete booking?")) await deleteDoc(doc(db, "bookings", id)); };

  const unitById = Object.fromEntries(units.map(u => [u.id, u]));
  const customerById = Object.fromEntries(customers.map(c => [c.id, c]));

  return (
    <Page title="Bookings" actions={null}>
      <form onSubmit={add} style={styles.formRow}>
        <select style={styles.input} value={form.unitId} onChange={(e)=>setForm({ ...form, unitId:e.target.value })}>
          <option value="">Unit</option>
          {units.map((u)=> <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select style={styles.input} value={form.customerId} onChange={(e)=>setForm({ ...form, customerId:e.target.value })}>
          <option value="">Customer</option>
          {customers.map((c)=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input style={styles.input} type="date" value={form.checkIn} onChange={(e)=>setForm({ ...form, checkIn:e.target.value })} />
        <input style={styles.input} type="date" value={form.checkOut} onChange={(e)=>setForm({ ...form, checkOut:e.target.value })} />
        <input style={styles.input} type="number" placeholder="Amount" value={form.amount} onChange={(e)=>setForm({ ...form, amount:e.target.value })} />
        <select style={styles.input} value={form.status} onChange={(e)=>setForm({ ...form, status:e.target.value })}>
          <option value="confirmed">confirmed</option>
          <option value="cancelled">cancelled</option>
          <option value="pending">pending</option>
        </select>
        <button style={styles.btnPrimary}>Add</button>
      </form>

      <table style={styles.table}>
        <thead><tr><th>#</th><th>Unit</th><th>Customer</th><th>Check-In</th><th>Check-Out</th><th>Status</th><th>Amount</th><th></th></tr></thead>
        <tbody>
          {bookings.map((b, i)=> (
            <tr key={b.id}>
              <td>{i+1}</td>
              <td>{unitById[b.unitId]?.name || "-"}</td>
              <td>{customerById[b.customerId]?.name || "-"}</td>
              <td>{dateKey(asDate(b.checkIn))}</td>
              <td>{dateKey(asDate(b.checkOut))}</td>
              <td>{b.status}</td>
              <td>₹ {fmt(b.amount)}</td>
              <td><button style={styles.btn} onClick={()=>remove(b.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Page>
  );
}

/* =======================
   CALENDAR (Block Dates + ICS Import)
   ======================= */
function CalendarPage() {
  const units = useCollection("units");
  const bookings = useCollection("bookings");
  const blocks = useCollection("blocks");
  const [unitId, setUnitId] = useState("");
  const [month, setMonth] = useState(() => new Date());

  const monthDays = useMemo(() => {
    const y = month.getFullYear();
    const m = month.getMonth();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    const days = [];
    for (let d = 1; d <= end.getDate(); d++) days.push(new Date(y, m, d));
    return days;
  }, [month]);

  const unitBookings = bookings.filter((b) => !unitId || b.unitId === unitId);
  const unitBlocks = blocks.filter((b) => !unitId || b.unitId === unitId);

  const isBlocked = (d) => {
    for (const b of unitBookings) {
      if ((b.status || "").toLowerCase() !== "confirmed") continue;
      const ci = new Date(asDate(b.checkIn).setHours(0,0,0,0));
      const co = new Date(asDate(b.checkOut).setHours(0,0,0,0));
      if (d >= ci && d < co) return { type: "booking", ref: b };
    }
    for (const bl of unitBlocks) {
      const s = new Date(asDate(bl.start).setHours(0,0,0,0));
      const e = new Date(asDate(bl.end).setHours(0,0,0,0));
      if (d >= s && d < e) return { type: "block", ref: bl };
    }
    return null;
  };

  const addManualBlock = async () => {
    const start = prompt("Block from (YYYY-MM-DD)");
    const end = prompt("Block until (YYYY-MM-DD, exclusive)");
    if (!start || !end || !unitId) return;
    await addDoc(collection(db, "blocks"), { unitId, start, end, note: "Manual", source: "manual" });
  };

  const importICS = async () => {
    if (!unitId) { alert("Select a unit first"); return; }
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".ics,text/calendar";
    input.onchange = async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const text = await f.text();
      const events = parseICS(text);
      for (const ev of events) {
        await addDoc(collection(db, "blocks"), { unitId, start: ev.start.toISOString().slice(0,10), end: ev.end.toISOString().slice(0,10), note: ev.summary, source: "ics" });
      }
      alert(`Imported ${events.length} blocks`);
    };
    input.click();
  };

  return (
    <Page title="Calendar" actions={
      <div style={{ display: "flex", gap: 8 }}>
        <button style={styles.btn} onClick={()=>setMonth(new Date(month.getFullYear(), month.getMonth()-1, 1))}>◀ Prev</button>
        <button style={styles.btn} onClick={()=>setMonth(new Date())}>Today</button>
        <button style={styles.btn} onClick={()=>setMonth(new Date(month.getFullYear(), month.getMonth()+1, 1))}>Next ▶</button>
        <button style={styles.btn} onClick={addManualBlock}>+ Block</button>
        <button style={styles.btn} onClick={importICS}>Import .ics</button>
      </div>
    }>
      <div style={styles.formRow}>
        <select style={styles.input} value={unitId} onChange={(e)=>setUnitId(e.target.value)}>
          <option value="">All Units</option>
          {units.map((u)=> <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <div><strong>{month.toLocaleString(undefined, { month: "long", year: "numeric" })}</strong></div>
      </div>

      <div style={styles.calendarGrid}>
        {monthDays.map((d)=>{
          const b = isBlocked(d);
          return (
            <div key={dateKey(d)} style={{ ...styles.dayCell, background: b ? (b.type === 'booking' ? '#ffe8e8' : '#fff5d6') : '#fff', borderColor: b ? '#ffb3b3' : '#eee' }}>
              <div style={{ fontSize: 12, color: "#555" }}>{d.getDate()}</div>
              {b && (
                <div style={{ fontSize: 10, marginTop: 4 }}>
                  {b.type === 'booking' ? `Booked` : `Blocked`} {b.ref?.note ? `• ${b.ref.note}` : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Page>
  );
}

/* =======================
   REPORTS (Monthly / Yearly Sales)
   ======================= */
function Reports() {
  const bookings = useCollection("bookings");
  const [mode, setMode] = useState("monthly"); // or 'yearly'

  const rows = useMemo(() => {
    const map = new Map();
    for (const b of bookings) {
      if ((b.status || "").toLowerCase() === "cancelled") continue;
      const d = asDate(b.checkIn);
      const key = mode === "monthly" ? monthKey(d) : String(d.getFullYear());
      const cur = map.get(key) || { key, count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += Number(b.amount || 0);
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, z) => a.key.localeCompare(z.key));
  }, [bookings, mode]);

  const total = rows.reduce((s, r) => s + r.revenue, 0);

  return (
    <Page title="Reports" actions={
      <select style={styles.input} value={mode} onChange={(e)=>setMode(e.target.value)}>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
    }>
      <table style={styles.table}>
        <thead><tr><th>{mode === 'monthly' ? 'Month' : 'Year'}</th><th>Bookings</th><th>Revenue</th></tr></thead>
        <tbody>
          {rows.map((r)=> (
            <tr key={r.key}><td>{r.key}</td><td>{r.count}</td><td>₹ {fmt(r.revenue)}</td></tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td style={{ fontWeight: 700 }}>Total</td><td></td><td style={{ fontWeight: 700 }}>₹ {fmt(total)}</td></tr>
        </tfoot>
      </table>
    </Page>
  );
}

/* =======================
   APP SHELL
   ======================= */
export default function App() {
  return (
    <Router>
      <div style={styles.shell}>
        <Header />
        <main style={{ padding: 16 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/units" element={<Units />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

/* =======================
   STYLES (inline minimal)
   ======================= */
const styles = {
  shell: { fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif", color: "#222" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #eee", position: "sticky", top: 0, background: "#fff", zIndex: 10 },
  logo: { fontWeight: 800, letterSpacing: 0.2 },
  link: { textDecoration: "none", color: "#333", padding: "6px 8px", borderRadius: 6, border: "1px solid #eee" },
  btn: { padding: "8px 10px", border: "1px solid #ddd", background: "#fff", borderRadius: 6, cursor: "pointer" },
  btnPrimary: { padding: "8px 12px", border: "1px solid #ff385c", background: "#ff385c", color: "#fff", borderRadius: 6, cursor: "pointer" },
  page: { maxWidth: 1100, margin: "0 auto", padding: 8 },
  pageHead: { display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0 18px" },
  card: { border: "1px solid #eee", borderRadius: 10, padding: 16, background: "#fff" },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 },
  formRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, margin: "12px 0" },
  input: { padding: 10, border: "1px solid #ddd", borderRadius: 6 },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #eee" },
  calendarGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginTop: 12 },
  dayCell: { border: "1px solid #eee", borderRadius: 8, padding: 8, minHeight: 70 },
};
