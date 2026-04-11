// src/pages/Bookings.jsx
import { useEffect, useRef, useState } from "react";
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
  return (o.rounds || []).reduce((s, r) => s + (r.items || []).reduce((ss, i) => ss + (i.price || 0) * (i.quantity || 1), 0), 0);
}
function totalItems(o) {
  return (o.rounds || []).reduce((s, r) => s + (r.items || []).reduce((ss, i) => ss + (i.quantity || 1), 0), 0);
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
    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: "nowrap", textTransform: "capitalize" }}>
      {status?.replace("_", "-") || "—"}
    </span>
  );
}

// ─── action btn ───────────────────────────────────────────────────────────────
function Btn({ label, color, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "5px 10px", borderRadius: 7,
      border: `1px solid ${color}44`, background: `${color}14`,
      color, fontSize: 11, fontWeight: 600, cursor: "pointer",
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#1D1D1F", lineHeight: 1.3 }}>{name}</span>
        <Pill status={order.status} />
      </div>
      <div style={{ fontSize: 11, color: "#86868B", lineHeight: 1.8 }}>
        {totalItems(order)} items · {fmtAED(orderTotal(order))}
        {(order.rounds?.length || 0) > 1 && (
          <span style={{ marginLeft: 4, padding: "1px 5px", borderRadius: 5, background: "rgba(255,149,0,0.12)", color: "#92400E", fontSize: 10, fontWeight: 700 }}>
            {order.rounds.length}R
          </span>
        )}
        {order.scheduledTime && <div>⏰ {fmtTime(order.scheduledTime)}</div>}
        {order.customerPhone && <div>📞 {order.customerPhone}</div>}
        {order.deliveryAddress && <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>📍 {order.deliveryAddress}</div>}
        {order.notes && <div>📝 {order.notes}</div>}
      </div>

      <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", color: "#0071E3", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: "4px 0 0", textAlign: "left" }}>
        {expanded ? "▾ Hide items" : "▸ Show items"}
      </button>

      {expanded && (
        <div style={{ marginTop: 6, background: "rgba(0,0,0,0.03)", borderRadius: 8, padding: "8px 10px" }}>
          {(order.rounds || []).map((round, ri) => (
            <div key={ri} style={{ marginBottom: ri < order.rounds.length - 1 ? 6 : 0 }}>
              {order.rounds.length > 1 && (
                <div style={{ fontSize: 10, fontWeight: 700, color: "#86868B", textTransform: "uppercase", marginBottom: 3 }}>Round {ri + 1}</div>
              )}
              {(round.items || []).map((item, ii) => (
                <div key={ii} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                  <span>{item.name} × {item.quantity}</span>
                  <span style={{ fontWeight: 600, flexShrink: 0, marginLeft: 6 }}>{fmtAED(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        {order.status === "confirmed" && <Btn label="Preparing" color="#FF9500" onClick={() => onStatus(order._id, "preparing")} disabled={busy} />}
        {order.status === "preparing" && <Btn label="Ready" color="#0071E3" onClick={() => onStatus(order._id, "ready")} disabled={busy} />}
        {order.status === "ready" && <Btn label="✅ Complete" color="#34C759" onClick={() => onComplete(order._id)} disabled={busy} />}
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#1D1D1F", lineHeight: 1.3 }}>{booking.customerName || "Guest"}</span>
        <Pill status={booking.status} />
      </div>
      <div style={{ fontSize: 11, color: "#86868B", lineHeight: 1.8 }}>
        👥 {booking.partySize} guests
        <div>⏰ {fmtTime(booking.startIso)}</div>
        {tableLabel && <div>🪑 {tableLabel}{capacity ? ` (${capacity})` : ""}</div>}
        {booking.customerPhone && <div>📞 {booking.customerPhone}</div>}
        {booking.notes && <div>📝 {booking.notes}</div>}
        <span style={{ padding: "1px 7px", borderRadius: 999, fontSize: 10, fontWeight: 600, background: booking.source === "ai" ? "rgba(0,113,227,0.08)" : "rgba(52,199,89,0.10)", color: booking.source === "ai" ? "#0071E3" : "#166634" }}>
          {booking.source === "ai" ? "🤖 AI" : "📋 Manual"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        {booking.status === "confirmed" && <Btn label="Seat" color="#0071E3" onClick={() => onStatus(booking._id, "seated")} disabled={busy} />}
        {["confirmed","seated"].includes(booking.status) && (
          <>
            <Btn label="No-show" color="#FF9500" onClick={() => onStatus(booking._id, "no_show")} disabled={busy} />
            <Btn label="Cancel"  color="#FF3B30" onClick={() => onStatus(booking._id, "cancelled")} disabled={busy} />
          </>
        )}
        {booking.status === "seated" && <Btn label="Complete" color="#34C759" onClick={() => onStatus(booking._id, "completed")} disabled={busy} />}
      </div>
    </div>
  );
}

// ─── box component (column box with max-5 scroll) ─────────────────────────────
function Box({ icon, title, count, accentColor, children, style }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      background: "#fff",
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 16,
      overflow: "hidden",
      ...style,
    }}>
      {/* header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "12px 14px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "#fff",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", flex: 1 }}>{title}</span>
        <span style={{ padding: "2px 9px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: `${accentColor}1a`, color: accentColor }}>
          {count}
        </span>
      </div>
      {/* body — max 5 cards visible, scrollable */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxHeight: 480,
        background: "rgba(0,0,0,0.015)",
      }}>
        {count === 0
          ? <div style={{ textAlign: "center", color: "#C7C7CC", fontSize: 12, padding: "24px 0" }}>Empty</div>
          : children
        }
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function BookingsOrders() {
  const [orders,   setOrders]   = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(null);
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
        apiClient.get("/orders", { params: { limit: 100 } }),
        apiClient.get("/bookings", { params: { limit: 100 } }),
      ]);
      setOrders(oRes.data.orders || []);
      setBookings(bRes.data.data || []);
      setLastUpdated(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // ── derive columns ────────────────────────────────────────────────────────
  const active = orders.filter(o => !["delivered","cancelled"].includes(o.status));

  const walkInOrders  = active.filter(o => o.orderType === "pickup"   && !o.scheduledTime);
  const pickupOrders  = active.filter(o => o.orderType === "pickup"   &&  o.scheduledTime);
  const deliveryOrders = active.filter(o => o.orderType === "delivery");
  const dineInOrders  = active.filter(o => o.orderType === "dineIn");
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
    <div className="page" style={{ maxWidth: "unset", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 className="pageTitle">Bookings & Orders</h1>
          {lastUpdated && (
            <p className="pageSubtitle" style={{ margin: 0 }}>
              Live · updated {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      ) : (
        <>
          {/* ── TOP ROW: Walk-in | Pickup | Delivery ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>

            <Box icon="🚶" title="Walk-in" count={walkInOrders.length} accentColor="#FF9500">
              {walkInOrders.map(o => (
                <OrderCard key={o._id} order={o} onStatus={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />
              ))}
            </Box>

            <Box icon="🛍️" title="Pickup" count={pickupOrders.length} accentColor="#0071E3">
              {pickupOrders.map(o => (
                <OrderCard key={o._id} order={o} onStatus={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />
              ))}
            </Box>

            <Box icon="🚗" title="Delivery" count={deliveryOrders.length} accentColor="#AF52DE">
              {deliveryOrders.map(o => (
                <OrderCard key={o._id} order={o} onStatus={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />
              ))}
            </Box>

          </div>

          {/* ── BOTTOM ROW: Dine-in (50%) | divider | Bookings (50%) ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>

            <Box
              icon="🍽️"
              title="Dine-in"
              count={dineInOrders.length}
              accentColor="#34C759"
              style={{ borderRadius: "16px 0 0 16px", borderRight: "none" }}
            >
              {dineInOrders.map(o => (
                <OrderCard key={o._id} order={o} onStatus={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />
              ))}
            </Box>

            {/* divider line */}
            <div style={{ display: "flex" }}>
              <div style={{ width: 1, background: "rgba(0,0,0,0.10)", flexShrink: 0 }} />
              <Box
                icon="📅"
                title="Bookings"
                count={upcomingBookings.length}
                accentColor="#FF3B30"
                style={{ flex: 1, borderRadius: "0 16px 16px 0", borderLeft: "none" }}
              >
                {upcomingBookings.map(b => (
                  <BookingCard key={b._id} booking={b} onStatus={handleBookingStatus} updating={updating} />
                ))}
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
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: "12px 12px 10px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
};