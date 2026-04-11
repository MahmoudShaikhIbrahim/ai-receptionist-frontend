// src/context/NotificationContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getBookings, getOrders } from "../api/business";
import { useAuth } from "./AuthContext";
import apiClient from "../api/client";

const NotificationContext = createContext({});

export function useNotifications() {
  return useContext(NotificationContext);
}

// ─── 15-min alert modal ────────────────────────────────────────────────────────
function BookingAlert({ booking, onSeatNow, onDismiss, onEdit, loading }) {
  const fmtTime = (iso) => {
    try {
      return new Date(iso).toLocaleString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dubai",
      });
    } catch { return "—"; }
  };

  const tableLabel = booking.tables?.[0]
    ? `Table (${booking.tables[0].capacity} seats)`
    : null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={iconRingStyle}>📅</div>
        <h2 style={alertTitleStyle}>Booking in ~15 minutes</h2>

        <div style={detailsBoxStyle}>
          <DetailRow label="Guest" value={booking.customerName || "Guest"} />
          <DetailRow label="Guests" value={`👥 ${booking.partySize}`} />
          {booking.startIso && (
            <DetailRow label="Time" value={`⏰ ${fmtTime(booking.startIso)}`} accent />
          )}
          {tableLabel && <DetailRow label="Table" value={`🪑 ${tableLabel}`} />}
          {booking.customerPhone && (
            <DetailRow label="Phone" value={`📞 ${booking.customerPhone}`} />
          )}
          {booking.notes && (
            <DetailRow label="Notes" value={`📝 ${booking.notes}`} />
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <button
            style={{ ...alertBtnBase, background: "#34C759", color: "#fff" }}
            onClick={() => onSeatNow(booking)}
            disabled={loading}
          >
            {loading ? "Seating…" : "✅ Seat Now"}
          </button>
          <button
            style={{ ...alertBtnBase, background: "#0071E3", color: "#fff" }}
            onClick={() => onEdit(booking)}
            disabled={loading}
          >
            ✏️ Edit
          </button>
          <button
            style={{ ...alertBtnBase, background: "rgba(0,0,0,0.05)", color: "#86868B" }}
            onClick={onDismiss}
            disabled={loading}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, accent }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#86868B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, color: accent ? "#0071E3" : "#1D1D1F", textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

// ─── edit booking mini-modal (from alert flow) ─────────────────────────────────
function AlertEditModal({ booking, onSave, onCancel, loading }) {
  const [name, setName] = useState(booking.customerName || "");
  const [guests, setGuests] = useState(booking.partySize || 2);
  const [phone, setPhone] = useState(booking.customerPhone || "");
  const [notes, setNotes] = useState(booking.notes || "");

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={alertTitleStyle}>Edit Booking</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <FieldInput label="Guest Name" value={name} onChange={setName} />
          <FieldInput label="Guests" value={guests} onChange={(v) => setGuests(Number(v))} type="number" />
          <FieldInput label="Phone" value={phone} onChange={setPhone} type="tel" />
          <FieldInput label="Notes" value={notes} onChange={setNotes} />
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <button
            style={{ ...alertBtnBase, background: "rgba(0,0,0,0.05)", color: "#86868B", flex: 1 }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            style={{ ...alertBtnBase, background: "#0071E3", color: "#fff", flex: 2 }}
            disabled={!name.trim() || loading}
            onClick={() => onSave({ ...booking, customerName: name, partySize: guests, customerPhone: phone, notes })}
          >
            {loading ? "Saving…" : "Save & Seat"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#86868B", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", fontSize: 14, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}
      />
    </div>
  );
}

// ─── provider ──────────────────────────────────────────────────────────────────
export function NotificationProvider({ children }) {
  const { token } = useAuth();
  const [bookingCount, setBookingCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  // 15-min alert state
  const [activeAlert, setActiveAlert] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [alertLoading, setAlertLoading] = useState(false);

  // original badge tracking refs
  const lastBookingIds = useRef(new Set());
  const lastOrderIds = useRef(new Set());
  const lastOrderRoundCounts = useRef(new Map());
  const initialized = useRef(false);

  // alert tracking — each booking only alerts once per session
  const alertedBookingIds = useRef(new Set());

  // refs for alert state (needed inside setInterval closure)
  const activeAlertRef = useRef(null);
  const editingBookingRef = useRef(null);
  useEffect(() => { activeAlertRef.current = activeAlert; }, [activeAlert]);
  useEffect(() => { editingBookingRef.current = editingBooking; }, [editingBooking]);

  function clearBookings() { setBookingCount(0); }
  function clearOrders() { setOrderCount(0); }

  // ── 15-min check (pure function, uses refs) ─────────────────────────────────
  function check15MinAlert(bookings) {
    if (activeAlertRef.current || editingBookingRef.current) return;

    const now = Date.now();
    const TARGET = 15 * 60 * 1000;
    const WINDOW = 2 * 60 * 1000; // ±2 min tolerance

    for (const b of bookings) {
      if (["seated", "cancelled", "completed", "no_show"].includes(b.status)) continue;
      if (alertedBookingIds.current.has(String(b._id))) continue;
      if (!b.startIso) continue;

      const diff = new Date(b.startIso).getTime() - now;
      if (diff >= TARGET - WINDOW && diff <= TARGET + WINDOW) {
        alertedBookingIds.current.add(String(b._id));
        setActiveAlert(b);
        break;
      }
    }
  }

  // ── poll ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    async function poll() {
      try {
        const [bookingData, orderData] = await Promise.all([
          getBookings({ limit: 50 }),
          getOrders({ limit: 50 }),
        ]);

        const bookings = bookingData.bookings || bookingData.data || [];
        const orders = orderData.orders || orderData.data || [];

        // AI bookings only for badge (original logic)
        const aiBookings = bookings.filter(b => b.source !== "manual");

        const kitchenOrders = orders.filter(o =>
          ["confirmed", "preparing", "ready"].includes(o.status)
        );

        const newBookingIds = new Set(aiBookings.map(b => b._id));
        const newOrderIds = new Set(kitchenOrders.map(o => o._id));

        if (!initialized.current) {
          lastBookingIds.current = newBookingIds;
          lastOrderIds.current = newOrderIds;
          for (const order of kitchenOrders) {
            lastOrderRoundCounts.current.set(
              String(order._id),
              order.rounds?.length || 0
            );
          }
          initialized.current = true;
          check15MinAlert(bookings);
          return;
        }

        // New booking badge count (original logic)
        let newBookings = 0;
        for (const id of newBookingIds) {
          if (!lastBookingIds.current.has(id)) newBookings++;
        }
        if (newBookings > 0) setBookingCount(prev => prev + newBookings);
        lastBookingIds.current = newBookingIds;

        // New orders + new rounds badge count (original logic)
        let newOrders = 0;
        for (const order of kitchenOrders) {
          const id = String(order._id);
          const currentRounds = order.rounds?.length || 0;
          if (!lastOrderIds.current.has(id)) {
            newOrders++;
          } else {
            const prevRounds = lastOrderRoundCounts.current.get(id) || 0;
            if (currentRounds > prevRounds) newOrders++;
          }
          lastOrderRoundCounts.current.set(id, currentRounds);
        }
        for (const id of lastOrderRoundCounts.current.keys()) {
          if (!newOrderIds.has(id)) lastOrderRoundCounts.current.delete(id);
        }
        if (newOrders > 0) setOrderCount(prev => prev + newOrders);
        lastOrderIds.current = newOrderIds;

        // 15-min alert check (all bookings)
        check15MinAlert(bookings);

      } catch {
        // silent fail
      }
    }

    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [token]);

  // ── alert handlers ──────────────────────────────────────────────────────────
  async function handleSeatNow(booking) {
    const tableId = booking.tables?.[0]?.tableId;
    if (!tableId) {
      setActiveAlert(null);
      return;
    }
    setAlertLoading(true);
    try {
      await apiClient.post(`/tables/${tableId}/seat`);
      await apiClient.patch(`/bookings/${booking._id}/status`, { status: "seated" });
    } catch (e) {
      console.error("Seat error:", e);
    } finally {
      setAlertLoading(false);
      setActiveAlert(null);
    }
  }

  function handleDismiss() {
    setActiveAlert(null);
  }

  function handleEditFromAlert(booking) {
    setEditingBooking(booking);
    setActiveAlert(null);
  }

  async function handleSaveAndSeat(updated) {
    setAlertLoading(true);
    try {
      await apiClient.patch(`/bookings/${updated._id}/status`, {
        customerName: updated.customerName,
        partySize: updated.partySize,
        customerPhone: updated.customerPhone,
        notes: updated.notes,
      });
      const tableId = updated.tables?.[0]?.tableId;
      if (tableId) {
        await apiClient.post(`/tables/${tableId}/seat`);
        await apiClient.patch(`/bookings/${updated._id}/status`, { status: "seated" });
      }
    } catch (e) {
      console.error("Save/seat error:", e);
    } finally {
      setAlertLoading(false);
      setEditingBooking(null);
    }
  }

  return (
    <NotificationContext.Provider value={{ bookingCount, orderCount, clearBookings, clearOrders }}>
      {children}

      {activeAlert && !editingBooking && (
        <BookingAlert
          booking={activeAlert}
          onSeatNow={handleSeatNow}
          onDismiss={handleDismiss}
          onEdit={handleEditFromAlert}
          loading={alertLoading}
        />
      )}

      {editingBooking && (
        <AlertEditModal
          booking={editingBooking}
          onSave={handleSaveAndSeat}
          onCancel={() => setEditingBooking(null)}
          loading={alertLoading}
        />
      )}
    </NotificationContext.Provider>
  );
}

// ─── styles ────────────────────────────────────────────────────────────────────
const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalStyle = {
  background: "#fff",
  borderRadius: 22,
  padding: "32px 28px 26px",
  width: 360,
  maxWidth: "92vw",
  boxShadow: "0 24px 72px rgba(0,0,0,0.22)",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
};

const iconRingStyle = {
  fontSize: 36,
  width: 68,
  height: 68,
  background: "rgba(0,113,227,0.08)",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 16px",
};

const alertTitleStyle = {
  fontSize: 19,
  fontWeight: 700,
  color: "#1D1D1F",
  margin: "0 0 18px",
  letterSpacing: "-0.02em",
  textAlign: "center",
};

const detailsBoxStyle = {
  background: "#F5F5F7",
  borderRadius: 14,
  padding: "14px 16px",
  marginBottom: 22,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const alertBtnBase = {
  width: "100%",
  padding: 13,
  borderRadius: 13,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
};