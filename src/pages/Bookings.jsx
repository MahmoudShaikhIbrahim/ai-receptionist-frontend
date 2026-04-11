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
    <span style={{
      padding: "2px 7px", borderRadius: 999,
      fontSize: 10, fontWeight: 700,
      background: s.bg, color: s.color,
      whiteSpace: "nowrap", textTransform: "capitalize",
      flexShrink: 0,
    }}>
      {status?.replace("_", "-") || "—"}
    </span>
  );
}

// ─── action button ────────────────────────────────────────────────────────────
function Btn({ label, color, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "3px 8px", borderRadius: 6,
      border: `1px solid ${color}44`, background: `${color}14`,
      color, fontSize: 10, fontWeight: 700, cursor: "pointer",
      opacity: disabled ? 0.45 : 1, whiteSpace: "nowrap",
    }}>{label}</button>
  );
}

// ─── order card — no name, just data ─────────────────────────────────────────
function OrderCard({ order, onStatus, onComplete, updating }) {
  const [expanded, setExpanded] = useState(false);
  const busy = updating === order._id;

  // For dine-in show table label as a small identifier
  const tableHint = order.tableLabel ? order.tableLabel : null;

  return (
    <div style={cardStyle}>
      {/* top row: key info + pill */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4, marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
          {tableHint && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#0071E3", background: "rgba(0,113,227,0.08)", padding: "1px 6px", borderRadius: 5, whiteSpace: "nowrap", flexShrink: 0 }}>
              {tableHint}
            </span>
          )}
          <span style={{ fontSize: 11, color: "#1D1D1F", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {totalItems(order)} items · {fmtAED(orderTotal(order))}
          </span>
        </div>
        <Pill status={order.status} />
      </div>

      {/* secondary meta */}
      <div style={{ fontSize: 10, color: "#86868B", lineHeight: 1.6 }}>
        {(order.rounds?.length || 0) > 1 && (
          <span style={{ marginRight: 5, padding: "0px 4px", borderRadius: 4, background: "rgba(255,149,0,0.12)", color: "#92400E", fontSize: 9, fontWeight: 700 }}>
            {order.rounds.length} rounds
          </span>
        )}
        {order.scheduledTime && <span>⏰ {fmtTime(order.scheduledTime)}</span>}
        {order.customerPhone && <div>📞 {order.customerPhone}</div>}
        {order.deliveryAddress && (
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {order.deliveryAddress}</div>
        )}
        {order.customerName && order.customerName !== "Walk-in" && (
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>👤 {order.customerName}</div>
        )}
      </div>

      {/* items toggle */}
      <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", color: "#0071E3", fontSize: 10, fontWeight: 600, cursor: "pointer", padding: "2px 0", textAlign: "left" }}>
        {expanded ? "▾ Hide" : "▸ Items"}
      </button>

      {expanded && (
        <div style={{ marginTop: 3, background: "rgba(0,0,0,0.03)", borderRadius: 6, padding: "5px 7px" }}>
          {(order.rounds || []).map((round, ri) => (
            <div key={ri} style={{ marginBottom: ri < order.rounds.length - 1 ? 4 : 0 }}>
              {order.rounds.length > 1 && (
                <div style={{ fontSize: 9, fontWeight: 700, color: "#86868B", textTransform: "uppercase", marginBottom: 2 }}>Round {ri + 1}</div>
              )}
              {(round.items || []).map((item, ii) => (
                <div key={ii} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 1 }}>
                  <span>{item.name} × {item.quantity}</span>
                  <span style={{ fontWeight: 600, marginLeft: 4, flexShrink: 0 }}>{fmtAED(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* actions */}
      <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
        {order.status === "confirmed" && <Btn label="Preparing" color="#FF9500" onClick={() => onStatus(order._id, "preparing")} disabled={busy} />}
        {order.status === "preparing" && <Btn label="Ready"     color="#0071E3" onClick={() => onStatus(order._id, "ready")}     disabled={busy} />}
        {order.status === "ready"     && <Btn label="✅ Done"   color="#34C759" onClick={() => onComplete(order._id)}            disabled={busy} />}
      </div>
    </div>
  );
}

// ─── booking card — no redundant label ────────────────────────────────────────
function BookingCard({ booking, onStatus, updating }) {
  const busy = updating === booking._id;
  const tableLabel = booking.tables?.[0]?.tableId?.label || null;
  const capacity   = booking.tables?.[0]?.tableId?.capacity || null;

  return (
    <div style={cardStyle}>
      {/* top row: guest name + pill */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4, marginBottom: 2 }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: "#1D1D1F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "58%" }}>
          {booking.customerName || "Guest"}
        </span>
        <Pill status={booking.status} />
      </div>

      <div style={{ fontSize: 10, color: "#86868B", lineHeight: 1.6 }}>
        👥 {booking.partySize} · ⏰ {fmtTime(booking.startIso)}
        {tableLabel && <div>🪑 {tableLabel}{capacity ? ` (${capacity})` : ""}</div>}
        {booking.customerPhone && <div>📞 {booking.customerPhone}</div>}
        {booking.notes && <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📝 {booking.notes}</div>}
        <span style={{ padding: "1px 5px", borderRadius: 999, fontSize: 9, fontWeight: 700, background: booking.source === "ai" ? "rgba(0,113,227,0.08)" : "rgba(52,199,89,0.10)", color: booking.source === "ai" ? "#0071E3" : "#166634" }}>
          {booking.source === "ai" ? "🤖 AI" : "📋 Manual"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
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

// ─── box — always fixed height ────────────────────────────────────────────────
const BOX_BODY_HEIGHT = 360;

function Box({ icon, title, count, accentColor, children, style }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      background: "#fff",
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 14,
      overflow: "hidden",
      height: BOX_BODY_HEIGHT + 34,
      ...style,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "8px 12px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        flexShrink: 0, height: 34, boxSizing: "border-box",
      }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", flex: 1 }}>{title}</span>
        <span style={{ padding: "1px 7px", borderRadius: 8, fontSize: 10, fontWeight: 700, background: `${accentColor}1a`, color: accentColor }}>
          {count}
        </span>
      </div>

      <div style={{
        height: BOX_BODY_HEIGHT,
        overflowY: "auto", overflowX: "hidden",
        padding: "7px",
        display: "flex", flexDirection: "column", gap: 5,
        background: "rgba(0,0,0,0.012)",
        boxSizing: "border-box",
      }}>
        {count === 0
          ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#C7C7CC", fontSize: 11 }}>Empty</div>
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

  const active         = orders.filter(o => !["delivered","cancelled"].includes(o.status));
  const walkInOrders   = active.filter(o => o.orderType === "pickup"  && !o.scheduledTime);
  const pickupOrders   = active.filter(o => o.orderType === "pickup"  &&  o.scheduledTime);
  const deliveryOrders = active.filter(o => o.orderType === "delivery");
  const dineInOrders   = active.filter(o => o.orderType === "dineIn");
  const upcomingBookings = bookings
    .filter(b => b.status === "confirmed")
    .sort((a, b) => new Date(a.startIso) - new Date(b.startIso));

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 0 24px" }}>

      {lastUpdated && (
        <div style={{ fontSize: 11, color: "#C7C7CC", paddingTop: 2 }}>
          Live · {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      )}

      {loading ? <p style={{ color: "#86868B", fontSize: 13 }}>Loading…</p> : (
        <>
          {/* TOP ROW */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Box icon="🚶" title="Walk-in"  count={walkInOrders.length}   accentColor="#FF9500">
              {walkInOrders.map(o   => <OrderCard key={o._id} order={o} onStatus={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />)}
            </Box>
            <Box icon="🛍️" title="Pickup"   count={pickupOrders.length}   accentColor="#0071E3">
              {pickupOrders.map(o   => <OrderCard key={o._id} order={o} onStatus={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />)}
            </Box>
            <Box icon="🚗" title="Delivery" count={deliveryOrders.length} accentColor="#AF52DE">
              {deliveryOrders.map(o => <OrderCard key={o._id} order={o} onStatus={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />)}
            </Box>
          </div>

          {/* BOTTOM ROW */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <Box icon="🍽️" title="Dine-in" count={dineInOrders.length} accentColor="#34C759"
              style={{ borderRadius: "14px 0 0 14px", borderRight: "none" }}>
              {dineInOrders.map(o => <OrderCard key={o._id} order={o} onStatus={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />)}
            </Box>
            <div style={{ display: "flex" }}>
              <div style={{ width: 1, background: "rgba(0,0,0,0.08)", flexShrink: 0 }} />
              <Box icon="📅" title="Bookings" count={upcomingBookings.length} accentColor="#FF3B30"
                style={{ flex: 1, borderRadius: "0 14px 14px 0", borderLeft: "none" }}>
                {upcomingBookings.map(b => <BookingCard key={b._id} booking={b} onStatus={handleBookingStatus} updating={updating} />)}
              </Box>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const cardStyle = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.07)",
  borderRadius: 9,
  padding: "7px 9px",
  flexShrink: 0,
};