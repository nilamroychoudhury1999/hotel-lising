import React, { useEffect, useMemo, useState } from "react";
import { HashRouter as Router, Routes, Route, Link, Navigate, useLocation, Outlet, useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, onSnapshot, doc, getDoc, getDocs, query, where,
  writeBatch, updateDoc, serverTimestamp, orderBy, runTransaction
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

/** ======================
 *  FIREBASE (same config)
 *  ====================== */
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

/** ======================
 *  SIMPLE RBAC (Option A)
 *  ====================== */
const ADMIN_EMAILS = new Set(["nilamroychoudhury216@gmail.com"]);

function useAuthState() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => { setUser(u); setLoading(false); });
    return unsub;
  }, []);
  const isAdmin = !!user && ADMIN_EMAILS.has(user.email || "");
  return { user, isAdmin, loading };
}

/** ======================
 *  UTILS & STYLES
 *  ====================== */
const styles = {
  layout: { display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh", background: "#fafafa" },
  sidebar: { borderRight: "1px solid #eee", padding: 16, background: "#fff" },
  main: { padding: 20 },
  navItem: (active) => ({
    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
    borderRadius: 10, textDecoration: "none", color: active ? "#fff" : "#333",
    background: active ? "#ff385c" : "transparent", fontWeight: 600
  }),
  btn: { padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", cursor: "pointer" },
  btnPrimary: { padding: "10px 14px", borderRadius: 10, border: "none", background: "#111", color: "#fff", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 12, overflow: "hidden" },
  th: { textAlign: "left", padding: 12, background: "#f5f5f5", borderBottom: "1px solid #eee" },
  td: { padding: 12, borderBottom: "1px solid #f0f0f0", fontSize: 14 },
  card: { background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 16 },
  grid: { display: "grid", gap: 12 },
  field: { display: "grid", gap: 6, marginBottom: 12 },
  input: { padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd" },
  select: { padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd" },
  hrow: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }
};

function fmtDate(d) {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().slice(0,10);
}
function addDays(dateISO, days) {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + days);
  return fmtDate(d);
}
function dateRange(startISO, endISO) {
  const out = [];
  for (let d = new Date(startISO); d < new Date(endISO); d.setDate(d.getDate()+1)) {
    out.push(fmtDate(d));
  }
  return out;
}
function overlap(aStart, aEnd, bStart, bEnd) {
  // half-open [start, end)
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

/** ======================
 *  DATA MODEL
 *  - Multi-tenant via ownerId
 *  - Each owner has one default property (auto-created)
 *  ====================== */
async function ensureDefaultProperty(user) {
  if (!user) return null;
  const q1 = query(collection(db, "properties"), where("ownerId", "==", user.uid));
  const snap = await getDocs(q1);
  if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
  const ref = await addDoc(collection(db, "properties"), {
    ownerId: user.uid,
    name: "Default Property",
    code: `PROP-${user.uid.slice(0,6).toUpperCase()}`,
    currency: "INR",
    timeZone: "Asia/Kolkata",
    createdAt: serverTimestamp()
  });
  return { id: ref.id, ownerId: user.uid, name: "Default Property", code: `PROP-${user.uid.slice(0,6).toUpperCase()}`, currency: "INR", timeZone: "Asia/Kolkata" };
}

/** ======================
 *  AUTH BAR
 *  ====================== */
function AuthBar() {
  const { user, isAdmin } = useAuthState();
  const nav = useNavigate();
  const doLogin = async () => { try { await signInWithPopup(auth, provider); nav("/hms"); } catch(e){ console.error(e); } };
  const doLogout = async () => { try { await signOut(auth); nav("/"); } catch(e){ console.error(e); } };
  return (
    <div style={{ ...styles.card, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <strong>HMS</strong> • {user ? (<span>Signed in as <b>{user.displayName || user.email}</b> {isAdmin ? "(Admin)" : ""}</span>) : "You are not signed in"}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {user ? (
          <button style={styles.btn} onClick={doLogout}>Logout</button>
        ) : (
          <button style={styles.btnPrimary} onClick={doLogin}>Login with Google</button>
        )}
      </div>
    </div>
  );
}

/** ======================
 *  PRIVATE ROUTE
 *  ====================== */
function PrivateRoute({ children }) {
  const { user, loading } = useAuthState();
  const location = useLocation();
  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  return children;
}

/** ======================
 *  LAYOUT
 *  ====================== */
function SidebarLink({ to, label }) {
  const loc = useLocation();
  const active = loc.pathname.includes(to);
  return <Link to={to} style={styles.navItem(active)}>{label}</Link>;
}
function HMSLayout() {
  const { isAdmin } = useAuthState();
  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={{ marginBottom: 12 }}><Link to="/hms" style={{ textDecoration: "none", fontWeight: 800, color: "#111" }}>🏨 Hotel HMS</Link></div>
        <div style={{ display: "grid", gap: 8 }}>
          <SidebarLink to="/hms/frontdesk" label="Front Desk" />
          <SidebarLink to="/hms/reservations" label="Reservations" />
          <SidebarLink to="/hms/housekeeping" label="Housekeeping" />
          <SidebarLink to="/hms/inventory" label="Inventory" />
          <SidebarLink to="/hms/rates" label="Rates" />
          <SidebarLink to="/hms/reports" label="Reports" />
          <SidebarLink to="/hms/settings" label="Settings" />
          {isAdmin && <SidebarLink to="/hms/admin" label="Admin (All Data)" />}
        </div>
      </aside>
      <main style={styles.main}>
        <AuthBar />
        <Outlet />
      </main>
    </div>
  );
}

/** ======================
 *  FRONT DESK (availability strip)
 *  ====================== */
function FrontDesk() {
  const { user } = useAuthState();
  const [prop, setProp] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [start, setStart] = useState(fmtDate(new Date()));
  const end = useMemo(() => addDays(start, 14), [start]); // 2 weeks
  const days = useMemo(() => dateRange(start, end), [start, end]);

  useEffect(() => { (async () => { const p = await ensureDefaultProperty(user); setProp(p); })(); }, [user]);
  useEffect(() => {
    if (!prop) return;
    const rq = query(collection(db, `properties/${prop.id}/rooms`));
    const unsubRooms = onSnapshot(rq, snap => setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const rsq = query(collection(db, `properties/${prop.id}/reservations`));
    const unsubRes = onSnapshot(rsq, snap => setReservations(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubRooms(); unsubRes(); };
  }, [prop]);

  const byRoom = useMemo(() => {
    const map = {};
    for (const r of rooms) map[r.id] = [];
    for (const res of reservations) {
      if (!res.roomId) continue;
      if (!map[res.roomId]) map[res.roomId] = [];
      map[res.roomId].push(res);
    }
    return map;
  }, [rooms, reservations]);

  return (
    <div className="frontdesk">
      <div style={{ ...styles.hrow, marginBottom: 12 }}>
        <h2>Front Desk — {prop?.name || "Loading property..."}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="date" value={start} onChange={e => setStart(e.target.value)} style={styles.input} />
          <Link to="/hms/reservations" style={styles.navItem(false)}>New Reservation</Link>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Room</th>
              {days.map(d => <th key={d} style={styles.th}>{d.slice(5)}</th>)}
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id}>
                <td style={styles.td}><b>{room.number || room.id}</b><div style={{ fontSize: 12, color: "#666" }}>{room.roomTypeName || room.roomTypeId}</div></td>
                {days.map(d => {
                  const cellRes = (byRoom[room.id] || []).find(r => overlap(r.checkInDate, r.checkOutDate, d, addDays(d,1)));
                  const bg = cellRes ? (cellRes.status === "checked_in" ? "#e8f5e8" : "#e3f2fd") : "transparent";
                  const label = cellRes ? (cellRes.guestName || cellRes.code || "Res") : "";
                  return <td key={d} title={label} style={{ ...styles.td, background: bg }}>{label}</td>;
                })}
              </tr>
            ))}
            {rooms.length === 0 && <tr><td style={styles.td} colSpan={days.length+1}>No rooms yet. Add rooms in Inventory.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** ======================
 *  RESERVATIONS (CRUD)
 *  ====================== */
function Reservations() {
  const { user } = useAuthState();
  const [prop, setProp] = useState(null);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    guestName: "", guestPhone: "", guestEmail: "",
    roomTypeId: "", roomId: "", adults: 2, children: 0,
    checkInDate: fmtDate(new Date()), checkOutDate: addDays(fmtDate(new Date()), 1)
  });
  useEffect(() => { (async () => setProp(await ensureDefaultProperty(user)))(); }, [user]);
  useEffect(() => {
    if (!prop) return;
    const q1 = query(collection(db, `properties/${prop.id}/reservations`), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q1, snap => setRows(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [prop]);

  // get available rooms for simple select
  const [rooms, setRooms] = useState([]);
  useEffect(() => {
    if (!prop) return;
    const rq = query(collection(db, `properties/${prop.id}/rooms`));
    const unsub = onSnapshot(rq, snap => setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [prop]);

  const createRes = async () => {
    if (!prop) return;
    if (new Date(form.checkInDate) >= new Date(form.checkOutDate)) { alert("Check-out must be after check-in"); return; }

    // Availability check for selected room
    const rsSnap = await getDocs(collection(db, `properties/${prop.id}/reservations`));
    const conflict = rsSnap.docs.some(d => {
      const r = d.data();
      if (r.roomId !== form.roomId) return false;
      return overlap(r.checkInDate, r.checkOutDate, form.checkInDate, form.checkOutDate) && ["booked", "checked_in"].includes(r.status);
    });
    if (conflict) { alert("Room not available for selected dates."); return; }

    await addDoc(collection(db, `properties/${prop.id}/reservations`), {
      code: `RES-${Math.random().toString(36).slice(2,7).toUpperCase()}`,
      guestName: form.guestName, guestPhone: form.guestPhone, guestEmail: form.guestEmail,
      roomTypeId: form.roomTypeId || null, roomId: form.roomId || null,
      adults: Number(form.adults || 0), children: Number(form.children || 0),
      checkInDate: form.checkInDate, checkOutDate: form.checkOutDate,
      nights: Math.max(1, Math.ceil((new Date(form.checkOutDate) - new Date(form.checkInDate))/86400000)),
      status: "booked",
      total: 0, balance: 0,
      createdBy: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
    setForm({ ...form, guestName: "", guestPhone: "", guestEmail: "" });
  };

  const setStatus = async (id, status) => {
    if (!prop) return;
    await updateDoc(doc(db, `properties/${prop.id}/reservations/${id}`), { status, updatedAt: serverTimestamp() });
  };
  const delRes = async (id) => {
    if (!prop) return;
    if (!window.confirm("Delete reservation?")) return;
    await updateDoc(doc(db, `properties/${prop.id}/reservations/${id}`), { status: "cancelled", updatedAt: serverTimestamp() });
  };

  return (
    <div>
      <div style={styles.hrow}>
        <h2>Reservations</h2>
      </div>

      <div style={{ ...styles.card, marginBottom: 12 }}>
        <h3 style={{ marginBottom: 8 }}>Create Reservation</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <div style={styles.field}><label>Guest Name</label><input style={styles.input} value={form.guestName} onChange={e=>setForm(f=>({...f, guestName:e.target.value}))} /></div>
          <div style={styles.field}><label>Phone</label><input style={styles.input} value={form.guestPhone} onChange={e=>setForm(f=>({...f, guestPhone:e.target.value}))} /></div>
          <div style={styles.field}><label>Email</label><input style={styles.input} value={form.guestEmail} onChange={e=>setForm(f=>({...f, guestEmail:e.target.value}))} /></div>
          <div style={styles.field}><label>Room</label>
            <select style={styles.select} value={form.roomId} onChange={e=>setForm(f=>({...f, roomId:e.target.value}))}>
              <option value="">Select room</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.number || r.id} • {r.roomTypeName || r.roomTypeId || "Type"}</option>)}
            </select>
          </div>
          <div style={styles.field}><label>Adults</label><input type="number" min="1" style={styles.input} value={form.adults} onChange={e=>setForm(f=>({...f, adults:e.target.value}))} /></div>
          <div style={styles.field}><label>Children</label><input type="number" min="0" style={styles.input} value={form.children} onChange={e=>setForm(f=>({...f, children:e.target.value}))} /></div>
          <div style={styles.field}><label>Check-In</label><input type="date" style={styles.input} value={form.checkInDate} onChange={e=>setForm(f=>({...f, checkInDate:e.target.value}))} /></div>
          <div style={styles.field}><label>Check-Out</label><input type="date" style={styles.input} value={form.checkOutDate} onChange={e=>setForm(f=>({...f, checkOutDate:e.target.value}))} /></div>
        </div>
        <div style={{ marginTop: 8 }}><button style={styles.btnPrimary} onClick={createRes}>Create</button></div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Code</th>
              <th style={styles.th}>Guest</th>
              <th style={styles.th}>Room</th>
              <th style={styles.th}>Dates</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={styles.td}>{r.code}</td>
                <td style={styles.td}>{r.guestName}<div style={{ color:"#666", fontSize:12 }}>{r.guestPhone}</div></td>
                <td style={styles.td}>{r.roomId || "-"}</td>
                <td style={styles.td}>{r.checkInDate} → {r.checkOutDate} ({r.nights}n)</td>
                <td style={styles.td}>{r.status}</td>
                <td style={styles.td}>
                  <div style={{ display:"flex", gap:8 }}>
                    {r.status === "booked" && <button style={styles.btn} onClick={()=>setStatus(r.id, "checked_in")}>Check-In</button>}
                    {r.status === "checked_in" && <button style={styles.btn} onClick={()=>setStatus(r.id, "checked_out")}>Check-Out</button>}
                    <button style={styles.btn} onClick={()=>delRes(r.id)}>Cancel</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td style={styles.td} colSpan={6}>No reservations yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** ======================
 *  HOUSEKEEPING
 *  ====================== */
function Housekeeping() {
  const { user } = useAuthState();
  const [prop, setProp] = useState(null);
  const [rooms, setRooms] = useState([]);
  useEffect(() => { (async () => setProp(await ensureDefaultProperty(user)))(); }, [user]);
  useEffect(() => {
    if (!prop) return;
    const rq = query(collection(db, `properties/${prop.id}/rooms`));
    const unsub = onSnapshot(rq, snap => setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [prop]);

  const setHK = async (roomId, hkStatus) => {
    await updateDoc(doc(db, `properties/${prop.id}/rooms/${roomId}`), { hkStatus });
  };

  return (
    <div>
      <div style={styles.hrow}><h2>Housekeeping</h2></div>
      <div style={styles.grid}>
        {rooms.map(r => (
          <div key={r.id} style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>Room {r.number || r.id}</strong>
              <span style={{ fontSize: 12, padding:"2px 8px", borderRadius: 8, background: "#f0f0f0" }}>{r.hkStatus || "clean"}</span>
            </div>
            <div style={{ color:"#666", marginTop: 6 }}>{r.roomTypeName || r.roomTypeId || "Type"} • {r.status || "vacant"}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={styles.btn} onClick={()=>setHK(r.id,"dirty")}>Mark Dirty</button>
              <button style={styles.btn} onClick={()=>setHK(r.id,"in_progress")}>In Progress</button>
              <button style={styles.btn} onClick={()=>setHK(r.id,"clean")}>Mark Clean</button>
              <button style={styles.btn} onClick={()=>setHK(r.id,"inspected")}>Inspected</button>
            </div>
          </div>
        ))}
        {rooms.length === 0 && <div style={styles.card}>No rooms yet.</div>}
      </div>
    </div>
  );
}

/** ======================
 *  INVENTORY (Room Types + Rooms)
 *  ====================== */
function Inventory() {
  const { user } = useAuthState();
  const [prop, setProp] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [rtForm, setRtForm] = useState({ name: "", capacity: 2, baseRate: 1500 });
  const [rForm, setRForm] = useState({ number: "", roomTypeId: "", floor: 1 });

  useEffect(() => { (async () => setProp(await ensureDefaultProperty(user)))(); }, [user]);
  useEffect(() => {
    if (!prop) return;
    const rtq = query(collection(db, `properties/${prop.id}/roomTypes`));
    const rq = query(collection(db, `properties/${prop.id}/rooms`));
    const unsub1 = onSnapshot(rtq, snap => setRoomTypes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsub2 = onSnapshot(rq, snap => setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsub1(); unsub2(); };
  }, [prop]);

  const addRoomType = async () => {
    await addDoc(collection(db, `properties/${prop.id}/roomTypes`), {
      name: rtForm.name, capacity: Number(rtForm.capacity||1), baseRate: Number(rtForm.baseRate||0),
      createdAt: serverTimestamp()
    });
    setRtForm({ name: "", capacity: 2, baseRate: 1500 });
  };
  const addRoom = async () => {
    const rt = roomTypes.find(t => t.id === rForm.roomTypeId);
    await addDoc(collection(db, `properties/${prop.id}/rooms`), {
      number: rForm.number, floor: Number(rForm.floor||1),
      roomTypeId: rForm.roomTypeId, roomTypeName: rt ? rt.name : "",
      status: "vacant", hkStatus: "clean", createdAt: serverTimestamp()
    });
    setRForm({ number: "", roomTypeId: "", floor: 1 });
  };

  return (
    <div className="inventory">
      <h2>Inventory</h2>

      <div style={{ ...styles.card, marginBottom: 16 }}>
        <h3>Room Types</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12 }}>
          <div style={styles.field}><label>Name</label><input style={styles.input} value={rtForm.name} onChange={e=>setRtForm(f=>({...f, name:e.target.value}))} /></div>
          <div style={styles.field}><label>Capacity</label><input type="number" style={styles.input} value={rtForm.capacity} onChange={e=>setRtForm(f=>({...f, capacity:e.target.value}))} /></div>
          <div style={styles.field}><label>Base Rate (₹)</label><input type="number" style={styles.input} value={rtForm.baseRate} onChange={e=>setRtForm(f=>({...f, baseRate:e.target.value}))} /></div>
          <div style={{ alignSelf:"end" }}><button style={styles.btnPrimary} onClick={addRoomType}>Add Type</button></div>
        </div>

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={styles.table}>
            <thead>
              <tr><th style={styles.th}>Name</th><th style={styles.th}>Capacity</th><th style={styles.th}>Base Rate</th></tr>
            </thead>
            <tbody>
              {roomTypes.map(t => <tr key={t.id}><td style={styles.td}>{t.name}</td><td style={styles.td}>{t.capacity}</td><td style={styles.td}>₹{t.baseRate}</td></tr>)}
              {roomTypes.length === 0 && <tr><td style={styles.td} colSpan={3}>No room types yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.card}>
        <h3>Rooms</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12 }}>
          <div style={styles.field}><label>Number</label><input style={styles.input} value={rForm.number} onChange={e=>setRForm(f=>({...f, number:e.target.value}))} /></div>
          <div style={styles.field}><label>Room Type</label>
            <select style={styles.select} value={rForm.roomTypeId} onChange={e=>setRForm(f=>({...f, roomTypeId:e.target.value}))}>
              <option value="">Select type</option>
              {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div style={styles.field}><label>Floor</label><input type="number" style={styles.input} value={rForm.floor} onChange={e=>setRForm(f=>({...f, floor:e.target.value}))} /></div>
          <div style={{ alignSelf:"end" }}><button style={styles.btnPrimary} onClick={addRoom}>Add Room</button></div>
        </div>

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={styles.table}>
            <thead>
              <tr><th style={styles.th}>Number</th><th style={styles.th}>Type</th><th style={styles.th}>Status</th><th style={styles.th}>HK</th></tr>
            </thead>
            <tbody>
              {rooms.map(r => <tr key={r.id}><td style={styles.td}>{r.number}</td><td style={styles.td}>{r.roomTypeName || r.roomTypeId}</td><td style={styles.td}>{r.status}</td><td style={styles.td}>{r.hkStatus}</td></tr>)}
              {rooms.length === 0 && <tr><td style={styles.td} colSpan={4}>No rooms yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** ======================
 *  RATES (simple per-day override)
 *  ====================== */
function Rates() {
  const { user } = useAuthState();
  const [prop, setProp] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [overrides, setOverrides] = useState([]); // list of {date, roomTypeId, price, stopSell, minLOS}

  useEffect(() => { (async () => setProp(await ensureDefaultProperty(user)))(); }, [user]);
  useEffect(() => {
    if (!prop) return;
    const rtq = query(collection(db, `properties/${prop.id}/roomTypes`));
    const unsubRt = onSnapshot(rtq, snap => setRoomTypes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const oq = query(collection(db, `properties/${prop.id}/rateCalendars`));
    const unsubOv = onSnapshot(oq, snap => setOverrides(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubRt(); unsubOv(); };
  }, [prop]);

  const [form, setForm] = useState({ date: fmtDate(new Date()), roomTypeId: "", price: 2000, stopSell: false, minLOS: 1 });
  const saveOverride = async () => {
    await addDoc(collection(db, `properties/${prop.id}/rateCalendars`), {
      date: form.date, roomTypeId: form.roomTypeId || null, price: Number(form.price||0),
      stopSell: !!form.stopSell, minLOS: Number(form.minLOS||1), createdAt: serverTimestamp()
    });
  };

  return (
    <div>
      <h2>Rates</h2>
      <div style={{ ...styles.card, marginBottom: 12 }}>
        <h3>Set Daily Override</h3>
        <div style={{ display:"grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          <div style={styles.field}><label>Date</label><input type="date" style={styles.input} value={form.date} onChange={e=>setForm(f=>({...f, date:e.target.value}))} /></div>
          <div style={styles.field}><label>Room Type</label>
            <select style={styles.select} value={form.roomTypeId} onChange={e=>setForm(f=>({...f, roomTypeId:e.target.value}))}>
              <option value="">All</option>
              {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div style={styles.field}><label>Price (₹)</label><input type="number" style={styles.input} value={form.price} onChange={e=>setForm(f=>({...f, price:e.target.value}))} /></div>
          <div style={styles.field}><label>Min LOS</label><input type="number" style={styles.input} value={form.minLOS} onChange={e=>setForm(f=>({...f, minLOS:e.target.value}))} /></div>
          <div style={styles.field}><label>Stop Sell</label>
            <select style={styles.select} value={form.stopSell ? "yes" : "no"} onChange={e=>setForm(f=>({...f, stopSell:e.target.value==="yes"}))}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 8 }}><button style={styles.btnPrimary} onClick={saveOverride}>Save</button></div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Room Type</th><th style={styles.th}>Price</th><th style={styles.th}>Min LOS</th><th style={styles.th}>Stop Sell</th></tr></thead>
          <tbody>
            {overrides.map(o => (
              <tr key={o.id}><td style={styles.td}>{o.date}</td><td style={styles.td}>{roomTypes.find(t=>t.id===o.roomTypeId)?.name || "All"}</td><td style={styles.td}>₹{o.price}</td><td style={styles.td}>{o.minLOS}</td><td style={styles.td}>{o.stopSell ? "Yes" : "No"}</td></tr>
            ))}
            {overrides.length === 0 && <tr><td style={styles.td} colSpan={5}>No overrides yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** ======================
 *  REPORTS (basic KPIs)
 *  ====================== */
function Reports() {
  const { user } = useAuthState();
  const [prop, setProp] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [start, setStart] = useState(fmtDate(new Date()));
  const [end, setEnd] = useState(addDays(fmtDate(new Date()), 7));

  useEffect(() => { (async () => setProp(await ensureDefaultProperty(user)))(); }, [user]);
  useEffect(() => {
    if (!prop) return;
    const rq = query(collection(db, `properties/${prop.id}/rooms`));
    const unsubR = onSnapshot(rq, snap => setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const rsq = query(collection(db, `properties/${prop.id}/reservations`));
    const unsubRes = onSnapshot(rsq, snap => setReservations(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubR(); unsubRes(); };
  }, [prop]);

  const kpis = useMemo(() => {
    if (!rooms.length) return { occupancy: 0, roomNights: 0, soldNights: 0, adr: 0, revpar: 0 };
    const dates = dateRange(start, end);
    let sold = 0;
    for (const r of reservations) {
      if (!["booked","checked_in","checked_out"].includes(r.status)) continue;
      for (const d of dates) if (overlap(r.checkInDate, r.checkOutDate, d, addDays(d,1))) sold++;
    }
    const available = rooms.length * dates.length;
    const occupancy = available ? (sold / available) * 100 : 0;
    const roomRevenue = 0; // Placeholder without rate engine
    const adr = sold ? roomRevenue / sold : 0;
    const revpar = rooms.length ? roomRevenue / rooms.length / dates.length : 0;
    return { occupancy, roomNights: available, soldNights: sold, adr, revpar };
  }, [rooms, reservations, start, end]);

  return (
    <div>
      <div style={styles.hrow}>
        <h2>Reports</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="date" value={start} onChange={e=>setStart(e.target.value)} style={styles.input} />
          <input type="date" value={end} onChange={e=>setEnd(e.target.value)} style={styles.input} />
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12, marginTop: 12 }}>
        <div style={styles.card}><div style={{ color:"#666" }}>Occupancy</div><div style={{ fontSize: 28, fontWeight: 800 }}>{kpis.occupancy.toFixed(1)}%</div></div>
        <div style={styles.card}><div style={{ color:"#666" }}>Sold Room-Nights</div><div style={{ fontSize: 28, fontWeight: 800 }}>{kpis.soldNights}</div></div>
        <div style={styles.card}><div style={{ color:"#666" }}>ADR</div><div style={{ fontSize: 28, fontWeight: 800 }}>₹{kpis.adr.toFixed(0)}</div></div>
        <div style={styles.card}><div style={{ color:"#666" }}>RevPAR</div><div style={{ fontSize: 28, fontWeight: 800 }}>₹{kpis.revpar.toFixed(0)}</div></div>
      </div>
    </div>
  );
}

/** ======================
 *  SETTINGS & ADMIN
 *  ====================== */
function Settings() {
  const { user } = useAuthState();
  const [prop, setProp] = useState(null);
  const [form, setForm] = useState({ name: "", currency: "INR", timeZone: "Asia/Kolkata" });
  useEffect(() => { (async () => {
    const p = await ensureDefaultProperty(user);
    setProp(p); setForm({ name: p?.name || "", currency: p?.currency || "INR", timeZone: p?.timeZone || "Asia/Kolkata" });
  })(); }, [user]);
  const save = async () => {
    await updateDoc(doc(db, `properties/${prop.id}`), { name: form.name, currency: form.currency, timeZone: form.timeZone });
    alert("Saved");
  };
  return (
    <div>
      <h2>Settings</h2>
      <div style={styles.card}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12 }}>
          <div style={styles.field}><label>Property Name</label><input style={styles.input} value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))}/></div>
          <div style={styles.field}><label>Currency</label><input style={styles.input} value={form.currency} onChange={e=>setForm(f=>({...f, currency:e.target.value}))}/></div>
          <div style={styles.field}><label>Time Zone</label><input style={styles.input} value={form.timeZone} onChange={e=>setForm(f=>({...f, timeZone:e.target.value}))}/></div>
        </div>
        <div style={{ marginTop: 8 }}><button style={styles.btnPrimary} onClick={save}>Save</button></div>
      </div>
    </div>
  );
}

function AdminAll() {
  const { isAdmin } = useAuthState();
  const [props, setProps] = useState([]);
  useEffect(() => {
    const q1 = query(collection(db, "properties"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q1, snap => setProps(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);
  if (!isAdmin) return <div>Unauthorized</div>;
  return (
    <div>
      <h2>Admin — All Properties</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}><thead>
          <tr><th style={styles.th}>ID</th><th style={styles.th}>Owner</th><th style={styles.th}>Name</th><th style={styles.th}>Code</th></tr>
        </thead><tbody>
          {props.map(p => <tr key={p.id}><td style={styles.td}>{p.id}</td><td style={styles.td}>{p.ownerId}</td><td style={styles.td}>{p.name}</td><td style={styles.td}>{p.code}</td></tr>)}
          {props.length === 0 && <tr><td style={styles.td} colSpan={4}>No properties.</td></tr>}
        </tbody></table>
      </div>
    </div>
  );
}

/** ======================
 *  HOME (Public landing)
 *  ====================== */
function Home() {
  const { user } = useAuthState();
  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: 16 }}>
      <h1>Homavia HMS</h1>
      <p style={{ color:"#555" }}>
        Welcome to your Hotel Management System. Use Google login to access your dashboard.
      </p>
      <div style={{ display:"flex", gap:8 }}>
        {user ? <Link to="/hms" style={styles.navItem(false)}>Go to HMS</Link> : <span>Login to continue</span>}
      </div>
      <div style={{ marginTop: 24, ...styles.card }}>
        <h3>What’s included</h3>
        <ul>
          <li>Front Desk availability strip</li>
          <li>Reservations CRUD with check-in/out</li>
          <li>Inventory: Room types & rooms</li>
          <li>Housekeeping workflow</li>
          <li>Rates daily overrides</li>
          <li>Reports: Occupancy basics</li>
        </ul>
      </div>
    </div>
  );
}

/** ======================
 *  ROOT ROUTER
 *  ====================== */
export default function App() {
  // Desktop first; HMS is desktop-friendly
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hms" element={<PrivateRoute><HMSLayout /></PrivateRoute>}>
          <Route index element={<FrontDesk />} />
          <Route path="frontdesk" element={<FrontDesk />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="housekeeping" element={<Housekeeping />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="rates" element={<Rates />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={<AdminAll />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
