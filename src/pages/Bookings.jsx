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

function fmtAED(n) {
  return `${Number(n || 0).toFixed(2)} AED`;
}

function orderTotal(order) {
  return (order.rounds || []).reduce(
    (s, r) => s + (r.items || []).reduce((ss, i) => ss + (i.price || 0) * (i.quantity || 1), 0), 0
  );
}

function totalItems(order) {
  return (order.rounds || []).reduce(
    (s, r) => s + (r.items || []).reduce((ss, i) => ss + (i.quantity || 1), 0), 0
  );
}

// ─── status pill ──────────────────────────────────────────────────────────────
const STATUS_META = {
  confirmed:  { bg: "rgba(52,199,89,0.12)",   color: "#166534" },
  seated:     { bg: "rgba(0,113,227,0.10)",   color: "#0071E3" },
  cancelled:  { bg: "rgba(255,59,48,0.10)",   color: "#B42318" },
  completed:  { bg: "rgba(0,0,0,0.05)",       color: "#86868B" },
  no_show:    { bg: "rgba(255,149,0,0.12)",   color: "#92400E" },
  preparing:  { bg: "rgba(255,149,0,0.12)",   color: "#92400E" },
  ready:      { bg: "rgba(0,113,227,0.10)",   color: "#0071E3" },
  delivered:  { bg: "rgba(0,0,0,0.05)",       color: "#86868B" },
  pending:    { bg: "rgba(255,149,0,0.12)",   color: "#92400E" },
};

function StatusPill({ status }) {
  const s = STATUS_META[status] || { bg: "rgba(0,0,0,0.05)", color: "#86868B" };
  return (
    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, textTransform: "capitalize", whiteSpace: "nowrap" }}>
      {status?.replace("_", "-") || "—"}
    </span>
  );
}

// ─── action button ────────────────────────────────────────────────────────────
function Btn({ label, color, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "5px 10px", borderRadius: 7, border: `1px solid ${color}44`,
      background: `${color}14`, color, fontSize: 11, fontWeight: 600,
      cursor: "pointer", opacity: disabled ? 0.45 : 1, whiteSpace: "nowrap",
    }}>{label}</button>
  );
}

// ─── order card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onStatus, onComplete, updating }) {
  const [expanded, setExpanded] = useState(false);
  const busy = updating === order._id;
  const allItems = (order.rounds || []).flatMap(r => r.items || []);
  const name = order.tableLabel || order.customerName || "Order";

  return (
    <div style={cardStyle}>
      {/* top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#1D1D1F", lineHeight: 1.3 }}>{name}</span>
        <StatusPill status={order.status} />
      </div>

      {/* meta */}
      <div style={{ fontSize: 11, color: "#86868B", lineHeight: 1.8 }}>
        {totalItems(order)} items · {fmtAED(orderTotal(order))}
        {(order.rounds?.length || 0) > 1 && (
          <span style={{ marginLeft: 4, padding: "1px 6px", borderRadius: 6, background: "rgba(255,149,0,0.12)", color: "#92400E", fontSize: 10, fontWeight: 700 }}>
            {order.rounds.length}R
          </span>
        )}
        {order.scheduledTime && <div>⏰ {fmtTime(order.scheduledTime)}</div>}
        {order.customerPhone && <div>📞 {order.customerPhone}</div>}
        {order.deliveryAddress && <div>📍 {order.deliveryAddress}</div>}
        {order.notes && <div>📝 {order.notes}</div>}
      </div>

      {/* expand toggle */}
      {allItems.length > 0 && (
        <button onClick={() => setExpanded(v => !v)} style={{ marginTop: 6, background: "none", border: "none", color: "#0071E3", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0 }}>
          {expanded ? "▾ Hide items" : "▸ Show items"}
        </button>
      )}

      {/* expanded items */}
      {expanded && (
        <div style={{ marginTop: 8, background: "rgba(0,0,0,0.03)", borderRadius: 8, padding: "8px 10px" }}>
          {(order.rounds || []).map((round, ri) => (
            <div key={ri} style={{ marginBottom: ri < order.rounds.length - 1 ? 8 : 0 }}>
              {order.rounds.length > 1 && (
                <div style={{ fontSize: 10, fontWeight: 700, color: "#86868B", textTransform: "uppercase", marginBottom: 3 }}>Round {ri + 1}</div>
              )}
              {(round.items || []).map((item, ii) => (
                <div key={ii} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                  <span>{item.name} × {item.quantity}</span>
                  <span style={{ fontWeight: 600 }}>{fmtAED(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* actions */}
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        {order.status === "confirmed" && (
          <Btn label="Preparing" color="#FF9500" onClick={() => onStatus(order._id, "preparing")} disabled={busy} />
        )}
        {order.status === "preparing" && (
          <Btn label="Ready" color="#0071E3" onClick={() => onStatus(order._id, "ready")} disabled={busy} />
        )}
        {order.status === "ready" && (
          <Btn label="✅ Complete" color="#34C759" onClick={() => onComplete(order._id)} disabled={busy} />
        )}
      </div>
    </div>
  );
}

// ─── booking card ─────────────────────────────────────────────────────────────
function BookingCard({ booking, onStatus, updating }) {
  const busy = updating === booking._id;
  const tableLabel = booking.tables?.[0]?.tableId?.label || null;
  const capacity = booking.tables?.[0]?.tableId?.capacity || null;

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#1D1D1F", lineHeight: 1.3 }}>
          {booking.customerName || "Guest"}
        </span>
        <StatusPill status={booking.status} />
      </div>

      <div style={{ fontSize: 11, color: "#86868B", lineHeight: 1.8 }}>
        👥 {booking.partySize} guests
        <div>⏰ {fmtTime(booking.startIso)}</div>
        {tableLabel && <div>🪑 {tableLabel}{capacity ? ` (${capacity})` : ""}</div>}
        {booking.customerPhone && <div>📞 {booking.customerPhone}</div>}
        {booking.notes && <div>📝 {booking.notes}</div>}
        <div style={{ marginTop: 2 }}>
          <span style={{ padding: "1px 7px", borderRadius: 999, fontSize: 10, fontWeight: 600, background: booking.source === "ai" ? "rgba(0,113,227,0.08)" : "rgba(52,199,89,0.10)", color: booking.source === "ai" ? "#0071E3" : "#166534" }}>
            {booking.source === "ai" ? "🤖 AI" : "📋 Manual"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        {booking.status === "confirmed" && (
          <Btn label="Seat" color="#0071E3" onClick={() => onStatus(booking._id, "seated")} disabled={busy} />
        )}
        {["confirmed", "seated"].includes(booking.status) && (
          <>
            <Btn label="No-show" color="#FF9500" onClick={() => onStatus(booking._id, "no_show")} disabled={busy} />
            <Btn label="Cancel" color="#FF3B30" onClick={() => onStatus(booking._id, "cancelled")} disabled={busy} />
          </>
        )}
        {booking.status === "seated" && (
          <Btn label="Complete" color="#34C759" onClick={() => onStatus(booking._id, "completed")} disabled={busy} />
        )}
      </div>
    </div>
  );
}

// ─── column ───────────────────────────────────────────────────────────────────
function Column({ icon, title, count, accentColor, children }) {
  return (
    <div style={{
      flex: "0 0 220px",
      minWidth: 200,
      display: "flex",
      flexDirection: "column",
      gap: 0,
    }}>
      {/* column header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "12px 14px",
        background: "#fff",
        borderRadius: "14px 14px 0 0",
        border: "1px solid rgba(0,0,0,0.08)",
        borderBottom: "none",
        position: "sticky", top: 0, zIndex: 2,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", flex: 1 }}>{title}</span>
        <span style={{
          padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700,
          background: `${accentColor}1a`, color: accentColor,
        }}>{count}</span>
      </div>

      {/* column body */}
      <div style={{
        flex: 1,
        background: "rgba(0,0,0,0.02)",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: "0 0 14px 14px",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 120,
      }}>
        {count === 0 ? (
          <div style={{ textAlign: "center", color: "#C7C7CC", fontSize: 12, padding: "20px 0" }}>Empty</div>
        ) : children}
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function BookingsOrders() {
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // ── filter into columns ──────────────────────────────────────────────────────
  const active = orders.filter(o => !["delivered", "cancelled"].includes(o.status));

  // Dine-in: has tableId
  const dineInOrders = active.filter(o => o.orderType === "dineIn" && o.tableId);

  // Walk-in: pickup with no scheduledTime
  const walkInOrders = active.filter(o => o.orderType === "pickup" && !o.scheduledTime);

  // Pickup: pickup with scheduledTime
  const pickupOrders = active.filter(o => o.orderType === "pickup" && o.scheduledTime);

  // Delivery
  const deliveryOrders = active.filter(o => o.orderType === "delivery");

  // Bookings: confirmed only (upcoming)
  const upcomingBookings = bookings
    .filter(b => b.status === "confirmed")
    .sort((a, b) => new Date(a.startIso) - new Date(b.startIso));

  // ── actions ──────────────────────────────────────────────────────────────────
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

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="page" style={{ maxWidth: "unset" }}>

      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
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
        /* ── 5-column kanban ─────────────────────────────────────────────────── */
        <div style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          overflowX: "auto",
          paddingBottom: 24,
        }}>

          <Column icon="🍽️" title="Dine-in" count={dineInOrders.length} accentColor="#34C759">
            {dineInOrders.map(o => (
              <OrderCard key={o._id} order={o} onStatus={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />
            ))}
          </Column>

          <Column icon="🚶" title="Walk-in" count={walkInOrders.length} accentColor="#FF9500">
            {walkInOrders.map(o => (
              <OrderCard key={o._id} order={o} onStatus={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />
            ))}
          </Column>

          <Column icon="🛍️" title="Pickup" count={pickupOrders.length} accentColor="#0071E3">
            {pickupOrders.map(o => (
              <OrderCard key={o._id} order={o} onStatus={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />
            ))}
          </Column>

          <Column icon="🚗" title="Delivery" count={deliveryOrders.length} accentColor="#AF52DE">
            {deliveryOrders.map(o => (
              <OrderCard key={o._id} order={o} onStatus={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />
            ))}
          </Column>

          <Column icon="📅" title="Bookings" count={upcomingBookings.length} accentColor="#FF3B30">
            {upcomingBookings.map(b => (
              <BookingCard key={b._id} booking={b} onStatus={handleBookingStatus} updating={updating} />
            ))}
          </Column>

        </div>
      )}
    </div>
  );
}

// ─── shared card style ─────────────────────────────────────────────────────────
const cardStyle = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: "12px 12px 10px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  transition: "box-shadow 150ms",
};