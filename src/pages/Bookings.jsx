// src/pages/Bookings.jsx
import { useEffect, useState } from "react";
import { useNotifications } from "../context/NotificationContext";
import apiClient from "../api/client";

function fmtTime(dt) {
  if (!dt) return "—";
  try { return new Date(dt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dubai" }); }
  catch { return "—"; }
}
function fmtAED(n) { return `${Number(n || 0).toFixed(2)} AED`; }
function getOrderItems(o) {
  const fromRounds = (o.rounds || []).flatMap(r => r.items || []);
  return fromRounds.length > 0 ? fromRounds : (o.items || []);
}
function orderTotal(o) { return getOrderItems(o).reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0); }
function totalItems(o) { return getOrderItems(o).reduce((s, i) => s + (i.quantity || 1), 0); }
function getItemNames(order) {
  const items = getOrderItems(order);
  if (!items.length) return "No items";
  const counts = {};
  items.forEach(i => { counts[i.name] = (counts[i.name] || 0) + (i.quantity || 1); });
  return Object.entries(counts).map(([n, q]) => q > 1 ? `${n} ×${q}` : n).join(", ");
}

// Only show pill for non-confirmed statuses
const SM = {
  preparing: { bg: "rgba(255,149,0,0.12)", color: "#92400E" },
  ready:     { bg: "rgba(0,113,227,0.10)", color: "#0071E3" },
  seated:    { bg: "rgba(0,113,227,0.10)", color: "#0071E3" },
  cancelled: { bg: "rgba(255,59,48,0.10)", color: "#B42318" },
  completed: { bg: "rgba(0,0,0,0.05)",     color: "#86868B" },
  no_show:   { bg: "rgba(255,149,0,0.12)", color: "#92400E" },
  delivered: { bg: "rgba(0,0,0,0.05)",     color: "#86868B" },
};

function Pill({ status }) {
  // don't show pill for "confirmed" — it's redundant
  if (status === "confirmed") return null;
  const s = SM[status] || { bg: "rgba(0,0,0,0.05)", color: "#86868B" };
  return (
    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: "nowrap", textTransform: "capitalize", flexShrink: 0 }}>
      {status?.replace("_", "-")}
    </span>
  );
}

function Btn({ label, color, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: "3px 9px", borderRadius: 6, border: `1px solid ${color}44`, background: `${color}14`, color, fontSize: 10, fontWeight: 700, cursor: "pointer", opacity: disabled ? 0.45 : 1, whiteSpace: "nowrap" }}>
      {label}
    </button>
  );
}

function OrderCard({ order, onStatus, onComplete, updating }) {
  const busy  = updating === order._id;
  const names = getItemNames(order);
  const tableHint = order.tableLabel || null;

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#1D1D1F", lineHeight: 1.4, marginBottom: 5 }}>
        {tableHint && <span style={{ fontSize: 10, fontWeight: 700, color: "#0071E3", background: "rgba(0,113,227,0.08)", padding: "1px 5px", borderRadius: 4, marginRight: 5 }}>{tableHint}</span>}
        {names}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
        <Pill status={order.status} />
        {order.status === "confirmed" && <Btn label="Preparing" color="#FF9500" onClick={() => onStatus(order._id, "preparing")} disabled={busy} />}
        {order.status === "preparing" && <Btn label="Ready"     color="#0071E3" onClick={() => onStatus(order._id, "ready")}     disabled={busy} />}
      </div>
    </div>
  );
}

function BookingCard({ booking, onStatus, updating }) {
  const busy = updating === booking._id;
  const tableLabel = booking.tables?.[0]?.tableId?.label || null;

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#1D1D1F", lineHeight: 1.4, marginBottom: 5 }}>
        {booking.customerName || "Guest"}
        <span style={{ fontWeight: 400, color: "#86868B", fontSize: 11, marginLeft: 6 }}>
          👥{booking.partySize} · {fmtTime(booking.startIso)}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
        <Pill status={booking.status} />
        {booking.status === "confirmed" && <Btn label="Seat"     color="#0071E3" onClick={() => onStatus(booking._id, "seated")}    disabled={busy} />}
        {["confirmed","seated"].includes(booking.status) && (
          <>
            <Btn label="No-show" color="#FF9500" onClick={() => onStatus(booking._id, "no_show")}   disabled={busy} />
            <Btn label="Cancel"  color="#FF3B30" onClick={() => onStatus(booking._id, "cancelled")} disabled={busy} />
          </>
        )}
        {booking.status === "seated" && <Btn label="Complete" color="#34C759" onClick={() => onStatus(booking._id, "completed")} disabled={busy} />}
      </div>
    </div>
  );
}

const BOX_BODY_HEIGHT = 360;

function Box({ icon, title, count, accentColor, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, overflow: "hidden", height: BOX_BODY_HEIGHT + 34, ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)", flexShrink: 0, height: 34, boxSizing: "border-box" }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", flex: 1 }}>{title}</span>
        <span style={{ padding: "1px 7px", borderRadius: 8, fontSize: 10, fontWeight: 700, background: `${accentColor}1a`, color: accentColor }}>{count}</span>
      </div>
      <div style={{ height: BOX_BODY_HEIGHT, overflowY: "auto", overflowX: "hidden", padding: "7px", display: "flex", flexDirection: "column", gap: 5, background: "rgba(0,0,0,0.012)", boxSizing: "border-box" }}>
        {count === 0
          ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#C7C7CC", fontSize: 11 }}>Empty</div>
          : children}
      </div>
    </div>
  );
}

export default function BookingsOrders() {
  const [orders,      setOrders]      = useState([]);
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [updating,    setUpdating]    = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { clearBookings } = useNotifications();

  useEffect(() => { clearBookings(); }, []);
  useEffect(() => { fetchAll(true); const i = setInterval(() => fetchAll(false), 15000); return () => clearInterval(i); }, []);

  async function fetchAll(showLoader = false) {
    try {
      if (showLoader) setLoading(true);
      const [oRes, bRes] = await Promise.all([
        apiClient.get("/orders",   { params: { limit: 100 } }),
        apiClient.get("/bookings", { params: { limit: 100 } }),
      ]);
      setOrders(oRes.data.orders || []);
      setBookings(bRes.data.data || []);
      setLastUpdated(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const active         = orders.filter(o => !["delivered","cancelled"].includes(o.status));
  const walkInOrders   = active.filter(o => o.orderType === "pickup"  && !o.scheduledTime);
  const pickupOrders   = active.filter(o => o.orderType === "pickup"  &&  o.scheduledTime);
  const deliveryOrders = active.filter(o => o.orderType === "delivery");
  const dineInOrders   = active.filter(o => o.orderType === "dineIn");
  const upcomingBookings = bookings.filter(b => b.status === "confirmed").sort((a, b) => new Date(a.startIso) - new Date(b.startIso));

  async function handleOrderStatus(id, status) {
    setUpdating(id);
    try { const res = await apiClient.patch(`/orders/${id}/status`, { status }); setOrders(prev => prev.map(o => o._id === id ? (res.data.order || { ...o, status }) : o)); }
    catch (e) { console.error(e); } finally { setUpdating(null); }
  }
  async function handleOrderComplete(id) {
    setUpdating(id);
    try { await apiClient.patch(`/orders/${id}/complete`); setOrders(prev => prev.filter(o => o._id !== id)); }
    catch (e) { console.error(e); } finally { setUpdating(null); }
  }
  async function handleBookingStatus(id, status) {
    setUpdating(id);
    try { await apiClient.patch(`/bookings/${id}/status`, { status }); setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b)); }
    catch (e) { console.error(e); } finally { setUpdating(null); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 0 24px" }}>
      {lastUpdated && <div style={{ fontSize: 11, color: "#C7C7CC", paddingTop: 2 }}>Live · {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>}
      {loading ? <p style={{ color: "#86868B", fontSize: 13 }}>Loading…</p> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Box icon="🚶" title="Walk-in"  count={walkInOrders.length}   accentColor="#FF9500">{walkInOrders.map(o   => <OrderCard key={o._id} order={o} onStatus={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />)}</Box>
            <Box icon="🛍️" title="Pickup"   count={pickupOrders.length}   accentColor="#0071E3">{pickupOrders.map(o   => <OrderCard key={o._id} order={o} onStatus={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />)}</Box>
            <Box icon="🚗" title="Delivery" count={deliveryOrders.length} accentColor="#AF52DE">{deliveryOrders.map(o => <OrderCard key={o._id} order={o} onStatus={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />)}</Box>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <Box icon="🍽️" title="Dine-in" count={dineInOrders.length} accentColor="#34C759" style={{ borderRadius: "14px 0 0 14px", borderRight: "none" }}>
              {dineInOrders.map(o => <OrderCard key={o._id} order={o} onStatus={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />)}
            </Box>
            <div style={{ display: "flex" }}>
              <div style={{ width: 1, background: "rgba(0,0,0,0.08)", flexShrink: 0 }} />
              <Box icon="📅" title="Bookings" count={upcomingBookings.length} accentColor="#FF3B30" style={{ flex: 1, borderRadius: "0 14px 14px 0", borderLeft: "none" }}>
                {upcomingBookings.map(b => <BookingCard key={b._id} booking={b} onStatus={handleBookingStatus} updating={updating} />)}
              </Box>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const cardStyle = { background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 9, padding: "8px 10px", flexShrink: 0 };