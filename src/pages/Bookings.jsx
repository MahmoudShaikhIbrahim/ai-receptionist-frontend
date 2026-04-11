// src/pages/Bookings.jsx
import { useEffect, useRef, useState } from "react";
import { getBookings, getOrders, updateBookingStatus } from "../api/business";
import { useNotifications } from "../context/NotificationContext";
import apiClient from "../api/client";

// ─── helpers ───────────────────────────────────────────────────────────────────
function formatDateTime(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZone: "Asia/Dubai",
    });
  } catch { return "—"; }
}

function formatTime(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZone: "Asia/Dubai",
    });
  } catch { return "—"; }
}

const fmtAED = (n) => `${Number(n || 0).toFixed(2)} AED`;

function orderTotal(order) {
  return (order.rounds || []).reduce(
    (s, r) => s + (r.items || []).reduce((ss, i) => ss + (i.price || 0) * (i.quantity || 1), 0),
    0
  );
}

function totalItems(order) {
  return (order.rounds || []).reduce(
    (s, r) => s + (r.items || []).reduce((ss, i) => ss + (i.quantity || 1), 0),
    0
  );
}

// ─── pills ─────────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  confirmed:  { bg: "rgba(52,199,89,0.12)",  color: "#166534" },
  seated:     { bg: "rgba(0,113,227,0.10)",  color: "#0071E3" },
  cancelled:  { bg: "rgba(255,59,48,0.10)",  color: "#B42318" },
  completed:  { bg: "rgba(0,0,0,0.05)",      color: "#86868B" },
  no_show:    { bg: "rgba(255,149,0,0.12)",  color: "#92400E" },
  pending:    { bg: "rgba(255,149,0,0.12)",  color: "#92400E" },
  preparing:  { bg: "rgba(255,149,0,0.12)",  color: "#92400E" },
  ready:      { bg: "rgba(0,113,227,0.10)",  color: "#0071E3" },
  delivered:  { bg: "rgba(0,0,0,0.05)",      color: "#86868B" },
};

const SOURCE_COLORS = {
  ai:        { bg: "rgba(0,113,227,0.08)",  color: "#0071E3" },
  dashboard: { bg: "rgba(255,149,0,0.10)",  color: "#92400E" },
  manual:    { bg: "rgba(52,199,89,0.10)",  color: "#166534" },
};

function StatusPill({ status }) {
  const s = STATUS_COLORS[status] || { bg: "rgba(0,0,0,0.05)", color: "#86868B" };
  return (
    <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, textTransform: "capitalize" }}>
      {status?.replace("_", "-") || "—"}
    </span>
  );
}

function SourcePill({ source }) {
  const s = SOURCE_COLORS[source] || { bg: "rgba(0,0,0,0.05)", color: "#86868B" };
  const label = source === "ai" ? "🤖 AI" : source === "manual" ? "🚶 Walk-in" : "📋 Dashboard";
  return (
    <span style={{ padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      {label}
    </span>
  );
}

// ─── action button ──────────────────────────────────────────────────────────────
function ActionBtn({ label, color = "#0071E3", bg, onClick, disabled }) {
  const bgColor = bg || `${color}1a`;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "6px 12px", borderRadius: 8, border: `1px solid ${color}33`,
        background: bgColor, color, fontSize: 12, fontWeight: 600,
        cursor: "pointer", opacity: disabled ? 0.5 : 1, transition: "opacity 150ms",
      }}
    >
      {label}
    </button>
  );
}

// ─── section wrapper ────────────────────────────────────────────────────────────
function Section({ icon, title, count, accentColor, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", cursor: "pointer", userSelect: "none",
          borderBottom: open ? "1px solid rgba(0,0,0,0.06)" : "none",
          transition: "background 150ms",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.02)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F" }}>{title}</span>
          <span style={{
            padding: "2px 9px", borderRadius: 10, fontSize: 12, fontWeight: 700,
            background: `${accentColor}1a`, color: accentColor,
          }}>{count}</span>
        </div>
        <span style={{ fontSize: 12, color: "#86868B" }}>{open ? "▾" : "▸"}</span>
      </div>
      {open && (
        <div style={{ padding: count === 0 ? "20px" : "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {count === 0
            ? <p style={{ margin: 0, textAlign: "center", color: "#86868B", fontSize: 14 }}>Nothing here yet.</p>
            : children
          }
        </div>
      )}
    </div>
  );
}

// ─── booking card (upcoming dine-in) ───────────────────────────────────────────
function BookingCard({ booking, onAction, updating }) {
  const isUpdating = updating === booking._id;
  return (
    <div style={cardRowStyle}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{booking.customerName || "Guest"}</span>
          <SourcePill source={booking.source} />
          <StatusPill status={booking.status} />
        </div>
        <div style={{ fontSize: 12, color: "#86868B", lineHeight: 1.7 }}>
          👥 {booking.partySize} guests · ⏰ {formatDateTime(booking.startIso)}
          {booking.customerPhone && ` · 📞 ${booking.customerPhone}`}
          {booking.tables?.length > 0 && ` · 🪑 ${booking.tables.length} table(s)`}
          {booking.notes && <span style={{ display: "block" }}>📝 {booking.notes}</span>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-start" }}>
        {booking.status === "confirmed" && (
          <ActionBtn label="Seat" color="#0071E3" onClick={() => onAction(booking._id, "seated")} disabled={isUpdating} />
        )}
        {["confirmed", "seated"].includes(booking.status) && (
          <>
            <ActionBtn label="No-show" color="#FF9500" onClick={() => onAction(booking._id, "no_show")} disabled={isUpdating} />
            <ActionBtn label="Cancel" color="#FF3B30" onClick={() => onAction(booking._id, "cancelled")} disabled={isUpdating} />
          </>
        )}
        {booking.status === "seated" && (
          <ActionBtn label="Complete" color="#34C759" onClick={() => onAction(booking._id, "completed")} disabled={isUpdating} />
        )}
      </div>
    </div>
  );
}

// ─── order card (seated / pickup / delivery) ────────────────────────────────────
function OrderCard({ order, onStatusChange, onComplete, updating }) {
  const [expanded, setExpanded] = useState(false);
  const isUpdating = updating === order._id;

  const allItems = (order.rounds || []).flatMap(r => r.items || []);
  const typeLabel = order.orderType === "delivery" ? "🚗 Delivery" : order.orderType === "pickup" ? "🛍️ Pickup" : "🍽️ Dine-in";
  const displayName = order.tableLabel || order.customerName || "Order";

  return (
    <div style={cardRowStyle}>
      <div style={{ flex: 1 }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, cursor: "pointer" }}
          onClick={() => setExpanded(v => !v)}
        >
          <span style={{ fontWeight: 700, fontSize: 14 }}>{displayName}</span>
          <StatusPill status={order.status} />
          {(order.rounds?.length || 0) > 1 && (
            <span style={{ padding: "2px 7px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: "rgba(255,149,0,0.12)", color: "#92400E" }}>
              {order.rounds.length} rounds
            </span>
          )}
          <span style={{ fontSize: 12, color: "#86868B", marginLeft: "auto" }}>{expanded ? "▾" : "▸"}</span>
        </div>
        <div style={{ fontSize: 12, color: "#86868B", lineHeight: 1.7 }}>
          {typeLabel} · {totalItems(order)} items · {fmtAED(orderTotal(order))}
          {order.scheduledTime && ` · ⏰ ${formatTime(order.scheduledTime)}`}
          {order.customerPhone && ` · 📞 ${order.customerPhone}`}
          {order.deliveryAddress && <span style={{ display: "block" }}>📍 {order.deliveryAddress}</span>}
          {order.notes && <span style={{ display: "block" }}>📝 {order.notes}</span>}
        </div>

        {/* expanded items */}
        {expanded && allItems.length > 0 && (
          <div style={{ marginTop: 10, background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: "10px 12px" }}>
            {(order.rounds || []).map((round, ri) => (
              <div key={ri} style={{ marginBottom: ri < order.rounds.length - 1 ? 10 : 0 }}>
                {order.rounds.length > 1 && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#86868B", textTransform: "uppercase", marginBottom: 4 }}>
                    Round {ri + 1}
                  </div>
                )}
                {(round.items || []).map((item, ii) => (
                  <div key={ii} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                    <span>{item.name} × {item.quantity}</span>
                    <span style={{ fontWeight: 600 }}>{fmtAED(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-start" }}>
        {order.status === "confirmed" && (
          <ActionBtn label="Preparing" color="#FF9500" onClick={() => onStatusChange(order._id, "preparing")} disabled={isUpdating} />
        )}
        {order.status === "preparing" && (
          <ActionBtn label="Ready" color="#0071E3" onClick={() => onStatusChange(order._id, "ready")} disabled={isUpdating} />
        )}
        {order.status === "ready" && (
          <ActionBtn label="✅ Complete" color="#34C759" onClick={() => onComplete(order._id)} disabled={isUpdating} />
        )}
      </div>
    </div>
  );
}

// ─── main page ─────────────────────────────────────────────────────────────────
export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [updating, setUpdating] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { clearBookings } = useNotifications();

  useEffect(() => { clearBookings(); }, []);

  useEffect(() => {
    loadAll(true);
    const interval = setInterval(() => loadAll(false), 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadAll(showLoader = false) {
    try {
      if (showLoader) setLoading(true);
      const [bookingData, orderData] = await Promise.all([
        getBookings({ limit: 100 }),
        getOrders({ limit: 100 }),
      ]);
      setBookings(bookingData.bookings || bookingData.data || []);
      setOrders(orderData.orders || orderData.data || []);
      setLastUpdated(new Date());
    } catch {
      setErr("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  // ── derived sections ─────────────────────────────────────────────────────────
  // 1. Upcoming dine-in: confirmed bookings
  const upcomingBookings = bookings.filter(b =>
    ["confirmed"].includes(b.status)
  ).sort((a, b) => new Date(a.startIso) - new Date(b.startIso));

  // 2. Seated dine-in: dineIn orders that are active (not completed/cancelled)
  const seatedOrders = orders.filter(o =>
    o.orderType === "dineIn" &&
    !["delivered", "cancelled"].includes(o.status)
  );

  // 3. Pickup orders
  const pickupOrders = orders.filter(o =>
    o.orderType === "pickup" &&
    !["delivered", "cancelled"].includes(o.status)
  );

  // 4. Delivery orders
  const deliveryOrders = orders.filter(o =>
    o.orderType === "delivery" &&
    !["delivered", "cancelled"].includes(o.status)
  );

  // ── actions ──────────────────────────────────────────────────────────────────
  async function handleBookingAction(id, status) {
    setUpdating(id);
    try {
      await updateBookingStatus(id, status);
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b));
    } catch {
      setErr("Failed to update booking.");
    } finally {
      setUpdating(null);
    }
  }

  async function handleOrderStatus(id, status) {
    setUpdating(id);
    try {
      const res = await apiClient.patch(`/orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => o._id === id ? res.data.order || { ...o, status } : o));
    } catch {
      setErr("Failed to update order.");
    } finally {
      setUpdating(null);
    }
  }

  async function handleOrderComplete(id) {
    setUpdating(id);
    try {
      await apiClient.patch(`/orders/${id}/complete`);
      setOrders(prev => prev.filter(o => o._id !== id));
    } catch {
      setErr("Failed to complete order.");
    } finally {
      setUpdating(null);
    }
  }

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="pageTitle">Bookings & Orders</h1>
          <p className="pageSubtitle">
            All dine-in bookings, seated tables, pickup and delivery — in one place.
            {lastUpdated && (
              <span style={{ marginLeft: 8, color: "#9a9aa0", fontSize: 12 }}>
                Updated {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        {/* summary pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <SummaryPill label={`${upcomingBookings.length} Upcoming`} color="#0071E3" />
          <SummaryPill label={`${seatedOrders.length} Seated`} color="#34C759" />
          <SummaryPill label={`${pickupOrders.length} Pickup`} color="#FF9500" />
          <SummaryPill label={`${deliveryOrders.length} Delivery`} color="#AF52DE" />
        </div>
      </div>

      {err && <div className="alert alert--error">{err}</div>}

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      ) : (
        <>
          {/* 1. Upcoming Dine-in */}
          <Section icon="📅" title="Upcoming Dine-in" count={upcomingBookings.length} accentColor="#0071E3">
            {upcomingBookings.map(b => (
              <BookingCard key={b._id} booking={b} onAction={handleBookingAction} updating={updating} />
            ))}
          </Section>

          {/* 2. Seated Dine-in */}
          <Section icon="🍽️" title="Seated Dine-in" count={seatedOrders.length} accentColor="#34C759">
            {seatedOrders.map(o => (
              <OrderCard key={o._id} order={o} onStatusChange={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />
            ))}
          </Section>

          {/* 3. Pickup */}
          <Section icon="🛍️" title="Pickup Orders" count={pickupOrders.length} accentColor="#FF9500">
            {pickupOrders.map(o => (
              <OrderCard key={o._id} order={o} onStatusChange={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />
            ))}
          </Section>

          {/* 4. Delivery */}
          <Section icon="🚗" title="Delivery Orders" count={deliveryOrders.length} accentColor="#AF52DE">
            {deliveryOrders.map(o => (
              <OrderCard key={o._id} order={o} onStatusChange={handleOrderStatus} onComplete={handleOrderComplete} updating={updating} />
            ))}
          </Section>
        </>
      )}
    </div>
  );
}

function SummaryPill({ label, color }) {
  return (
    <div style={{ padding: "6px 14px", borderRadius: 12, background: `${color}14`, fontSize: 12, fontWeight: 600, color }}>
      {label}
    </div>
  );
}

// ─── shared styles ─────────────────────────────────────────────────────────────
const cardRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  padding: "14px 16px",
  background: "#F9F9FB",
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: 14,
  flexWrap: "wrap",
};