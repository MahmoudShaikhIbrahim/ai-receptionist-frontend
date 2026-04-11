// src/pages/Bookings.jsx
import { useEffect, useState } from "react";
import { useNotifications } from "../context/NotificationContext";
import apiClient from "../api/client";

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmtTime(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZone: "Asia/Dubai",
    });
  } catch { return "—"; }
}
function fmtAED(n) { return `${Number(n || 0).toFixed(2)} AED`; }
function orderTotal(o) {
  return (o.rounds || []).reduce(
    (s, r) => s + (r.items || []).reduce((ss, i) => ss + (i.price || 0) * (i.quantity || 1), 0), 0
  );
}
function totalItems(o) {
  return (o.rounds || []).reduce(
    (s, r) => s + (r.items || []).reduce((ss, i) => ss + (i.quantity || 1), 0), 0
  );
}

// ─── status pill ──────────────────────────────────────────────────────────────
const SM = {
  confirmed: { bg: "rgba(52,199,89,0.12)",  color: "#166534" },
  preparing: { bg: "rgba(255,149,0,0.12)",  color: "#92400E" },
  ready:     { bg: "rgba(0,113,227,0.10)",  color: "#0071E3" },
  seated:    { bg: "rgba(0,113,227,0.10)",  color: "#0071E3" },
  cancelled: { bg: "rgba(255,59,48,0.10)",  color: "#B42318" },
  completed: { bg: "rgba(0,0,0,0.05)",      color: "#86868B" },
  no_show:   { bg: "rgba(255,149,0,0.12)",  color: "#92400E" },
  delivered: { bg: "rgba(0,0,0,0.05)",      color: "#86868B" },
};
function Pill({ status }) {
  const s = SM[status] || { bg: "rgba(0,0,0,0.05)", color: "#86868B" };
  return (
    <span style={{ padding: "2px 7px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: "nowrap", textTransform: "capitalize", letterSpacing: 0.2 }}>
      {status?.replace("_", "-") || "—"}
    </span>
  );
}

// ─── action button ────────────────────────────────────────────────────────────
function Btn({ label, color, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "4px 9px", borderRadius: 6,
      border: `1px solid ${color}44`, background: `${color}14`,
      color, fontSize: 10, fontWeight: 700, cursor: "pointer",
      opacity: disabled ? 0.45 : 1, whiteSpace: "nowrap",
      transition: "opacity 150ms",
    }}>{label}</button>
  );
}

// ─── order card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onStatus, onComplete, updating }) {
  const [expanded, setExpanded] = useState(false);
  const busy = updating === order._id;
  const name = order.tableLabel || order.customerName || "Order";

  return (
    <div style={cardStyle}>
      {/* row 1: name + pill */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4, marginBottom: 3 }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: "#1D1D1F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{name}</span>
        <Pill status={order.status} />
      </div>

      {/* row 2: meta */}
      <div style={{ fontSize: 11, color: "#86868B", lineHeight: 1.6 }}>
        <span>{totalItems(order)} items · {fmtAED(orderTotal(order))}</span>
        {(order.rounds?.length || 0) > 1 && (
          <span style={{ marginLeft: 4, padding: "1px 5px", borderRadius: 5, background: "rgba(255,149,0,0.12)", color: "#92400E", fontSize: 9, fontWeight: 700 }}>
            {order.rounds.length}R
          </span>
        )}
        {order.scheduledTime && <div>⏰ {fmtTime(order.scheduledTime)}</div>}
        {order.customerPhone && <div>📞 {order.customerPhone}</div>}
        {order.deliveryAddress && (
          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>📍 {order.deliveryAddress}</div>
        )}
      </div>

      {/* expand toggle */}
      <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", color: "#0071E3", fontSize: 10, fontWeight: 600, cursor: "pointer", padding: "3px 0 0", textAlign: "left" }}>
        {expanded ? "▾ Hide" : "▸ Items"}
      </button>

      {/* expanded items */}
      {expanded && (
        <div style={{ marginTop: 5, background: "rgba(0,0,0,0.03)", borderRadius: 7, padding: "6px 8px" }}>
          {(order.rounds || []).map((round, ri) => (
            <div key={ri} style={{ marginBottom: ri < order.rounds.length - 1 ? 5 : 0 }}>
              {order.rounds.length > 1 && (
                <div style={{ fontSize: 9, fontWeight: 700, color: "#86868B", textTransform: "uppercase", marginBottom: 2 }}>Round {ri + 1}</div>
              )}
              {(round.items || []).map((item, ii) => (
                <div key={ii} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                  <span>{item.name} × {item.quantity}</span>
                  <span style={{ fontWeight: 600, flexShrink: 0, marginLeft: 4 }}>{fmtAED(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* actions */}
      <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
        {order.status === "confirmed" && <Btn label="Preparing" color="#FF9500" onClick={() => onStatus(order._id, "preparing")} disabled={busy} />}
        {order.status === "preparing" && <Btn label="Ready"     color="#0071E3" onClick={() => onStatus(order._id, "ready")}     disabled={busy} />}
        {order.status === "ready"     && <Btn label="✅ Done"   color="#34C759" onClick={() => onComplete(order._id)}            disabled={busy} />}
      </div>
    </div>
  );
}

// ─── booking card ─────────────────────────────────────────────────────────────
function BookingCard({ booking, onStatus, updating }) {
  const busy = updating === booking._id;
  const tableLabel = booking.tables?.[0]?.tableId?.label || null;
  const capacity   = booking.tables?.[0]?.tableId?.capacity || null;

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4, marginBottom: 3 }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: "#1D1D1F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
          {booking.customerName || "Guest"}
        </span>
        <Pill status={booking.status} />
      </div>

      <div style={{ fontSize: 11, color: "#86868B", lineHeight: 1.6 }}>
        👥 {booking.partySize} · ⏰ {fmtTime(booking.startIso)}
        {tableLabel && <div>🪑 {tableLabel}{capacity ? ` (${capacity})` : ""}</div>}
        {booking.customerPhone && <div>📞 {booking.customerPhone}</div>}
        {booking.notes && <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📝 {booking.notes}</div>}
        <div style={{ marginTop: 2 }}>
          <span style={{ padding: "1px 6px", borderRadius: 999, fontSize: 9, fontWeight: 700, background: booking.source === "ai" ? "rgba(0,113,227,0.08)" : "rgba(52,199,89,0.10)", color: booking.source === "ai" ? "#0071E3" : "#166634" }}>
            {booking.source === "ai" ? "🤖 AI" : "📋 Manual"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
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

// ─── box ──────────────────────────────────────────────────────────────────────
// CARD_HEIGHT ≈ 110px × 5 cards + 4 gaps × 6px = 574px → we use 550 max
const BOX_MAX_HEIGHT = 550;

function Box({ icon, title, count, accentColor, children, style }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      background: "#fff",
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 14,
      overflow: "hidden",
      ...style,
    }}>
      {/* header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "9px 12px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", flex: 1 }}>{title}</span>
        <span style={{ padding: "1px 7px", borderRadius: 8, fontSize: 10, fontWeight: 700, background: `${accentColor}1a`, color: accentColor }}>
          {count}
        </span>
      </div>

      {/* scrollable body — max 5 cards */}
      <div style={{
        overflowY: "auto",
        maxHeight: BOX_MAX_HEIGHT,
        padding: count === 0 ? "16px 12px" : "8px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        background: "rgba(0,0,0,0.012)",
      }}>
        {count === 0
          ? <div style={{ textAlign: "center", color: "#C7C7CC", fontSize: 11, padding: "10px 0" }}>Empty</div>
          : children
        }
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function BookingsOrders() {
  const [orders,      setOrders]      = useState([]);
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [updating,    setUpdating]    = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { clearBookings } = useNotifications();

  useEffect(() => { clearBookings(); }, []);

  useEffect(() => {
    fetchAll(true);
    const interval = setInterval(() => fetchAll(false), 15000);
    return () => clearInterval(interval);
  }, []);

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

  // ── columns ──────────────────────────────────────────────────────────────
  const active = orders.filter(o => !["delivered","cancelled"].includes(o.status));

  const walkInOrders   = active.filter(o => o.orderType === "pickup"   && !o.scheduledTime);
  const pickupOrders   = active.filter(o => o.orderType === "pickup"   &&  o.scheduledTime);
  const deliveryOrders = active.filter(o => o.orderType === "delivery");
  const dineInOrders   = active.filter(o => o.orderType === "dineIn");
  const upcomingBookings = bookings
    .filter(b => b.status === "confirmed")
    .sort((a, b) => new Date(a.startIso) - new Date(b.startIso));

  // ── actions ───────────────────────────────────────────────────────────────
  async function handleOrderStatus(id, status) {
    setUpdating(id);
    try {
      const res = await apiClient.patch(`/orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => o._id === id ? (res.data.order || { ...o, status }) : o));
    } catch (e) { console.error(e); }
    finally { setUpdating(null); }
  }

  async function handleOrderComplete(id) {
    setUpdating(id);
    try {
      await apiClient.patch(`/orders/${id}/complete`);
      setOrders(prev => prev.filter(o => o._id !== id));
    } catch (e) { console.error(e); }
    finally { setUpdating(null); }
  }

  async function handleBookingStatus(id, status) {
    setUpdating(id);
    try {
      await apiClient.patch(`/bookings/${id}/status`, { status });
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b));
    } catch (e) { console.error(e); }
    finally { setUpdating(null); }
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 0 24px" }}>

      {/* tiny live indicator — no title */}
      {lastUpdated && (
        <div style={{ fontSize: 11, color: "#C7C7CC", paddingTop: 4 }}>
          Live · {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#86868B", fontSize: 13 }}>Loading…</p>
      ) : (
        <>
          {/* ── TOP ROW: Walk-in | Pickup | Delivery ─────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Box icon="🚶" title="Walk-in"  count={walkInOrders.length}   accentColor="#FF9500">
              {walkInOrders.map(o   => <OrderCard   key={o._id} order={o}     onStatus={handleOrderStatus}  onComplete={handleOrderComplete}  updating={updating} />)}
            </Box>
            <Box icon="🛍️" title="Pickup"   count={pickupOrders.length}   accentColor="#0071E3">
              {pickupOrders.map(o   => <OrderCard   key={o._id} order={o}     onStatus={handleOrderStatus}  onComplete={handleOrderComplete}  updating={updating} />)}
            </Box>
            <Box icon="🚗" title="Delivery" count={deliveryOrders.length} accentColor="#AF52DE">
              {deliveryOrders.map(o => <OrderCard   key={o._id} order={o}     onStatus={handleOrderStatus}  onComplete={handleOrderComplete}  updating={updating} />)}
            </Box>
          </div>

          {/* ── BOTTOM ROW: Dine-in (50%) │ Bookings (50%) ──────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <Box
              icon="🍽️" title="Dine-in" count={dineInOrders.length} accentColor="#34C759"
              style={{ borderRadius: "14px 0 0 14px", borderRight: "none" }}
            >
              {dineInOrders.map(o => <OrderCard key={o._id} order={o} onStatus={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />)}
            </Box>

            {/* divider */}
            <div style={{ display: "flex" }}>
              <div style={{ width: 1, background: "rgba(0,0,0,0.08)", flexShrink: 0 }} />
              <Box
                icon="📅" title="Bookings" count={upcomingBookings.length} accentColor="#FF3B30"
                style={{ flex: 1, borderRadius: "0 14px 14px 0", borderLeft: "none" }}
              >
                {upcomingBookings.map(b => <BookingCard key={b._id} booking={b} onStatus={handleBookingStatus} updating={updating} />)}
              </Box>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── card style ───────────────────────────────────────────────────────────────
const cardStyle = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.07)",
  borderRadius: 10,
  padding: "9px 10px 8px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};