// src/context/NotificationContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getBookings, getOrders } from "../api/business";
import { useAuth } from "./AuthContext";
import apiClient from "../api/client";

const NotificationContext = createContext({});
export function useNotifications() { return useContext(NotificationContext); }

// ─── safe array helper — never crashes ────────────────────────────────────────
function safeArray(val) {
  if (Array.isArray(val)) return val;
  return [];
}

// ─── 15-min alert modal ────────────────────────────────────────────────────────
function BookingAlert({ booking, onSeatNow, onDismiss, onEdit, loading }) {
  const fmtTime = iso => {
    try { return new Date(iso).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dubai" }); }
    catch { return "—"; }
  };
  const tableLabel = booking.tables?.[0]?.tableId?.label || null;
  const capacity   = booking.tables?.[0]?.tableId?.capacity || null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={iconRingStyle}>📅</div>
        <h2 style={alertTitleStyle}>Booking in ~15 minutes</h2>
        <div style={detailsBoxStyle}>
          <DR label="Guest"  value={booking.customerName || "Guest"} />
          <DR label="Guests" value={`👥 ${booking.partySize}`} />
          {booking.startIso && <DR label="Time" value={`⏰ ${fmtTime(booking.startIso)}`} accent />}
          {tableLabel && <DR label="Table" value={`🪑 ${tableLabel}${capacity ? ` (${capacity})` : ""}`} />}
          {booking.customerPhone && <DR label="Phone" value={`📞 ${booking.customerPhone}`} />}
          {booking.notes && <DR label="Notes" value={`📝 ${booking.notes}`} />}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <button style={{ ...alertBtn, background: "#34C759", color: "#fff" }} onClick={() => onSeatNow(booking)} disabled={loading}>
            {loading ? "Seating…" : "✅ Seat Now"}
          </button>
          <button style={{ ...alertBtn, background: "#0071E3", color: "#fff" }} onClick={() => onEdit(booking)} disabled={loading}>
            ✏️ Edit
          </button>
          <button style={{ ...alertBtn, background: "rgba(0,0,0,0.05)", color: "#86868B" }} onClick={onDismiss} disabled={loading}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function DR({ label, value, accent }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#86868B", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: accent ? "#0071E3" : "#1D1D1F", textAlign: "right" }}>{value}</span>
    </div>
  );
}

// ─── edit modal (from alert) ───────────────────────────────────────────────────
function AlertEditModal({ booking, onSave, onCancel, loading }) {
  const [name,   setName]   = useState(booking.customerName || "");
  const [guests, setGuests] = useState(booking.partySize || 2);
  const [phone,  setPhone]  = useState(booking.customerPhone || "");
  const [notes,  setNotes]  = useState(booking.notes || "");

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={alertTitleStyle}>Edit Booking</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20, textAlign: "left" }}>
          {[
            ["Guest Name", name,   setName,                   "text"  ],
            ["Guests",     guests, v => setGuests(Number(v)), "number"],
            ["Phone",      phone,  setPhone,                  "tel"   ],
            ["Notes",      notes,  setNotes,                  "text"  ],
          ].map(([lbl, val, setter, type]) => (
            <div key={lbl}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#86868B", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>{lbl}</label>
              <input type={type} value={val} onChange={e => setter(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", fontSize: 14, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <button style={{ ...alertBtn, background: "rgba(0,0,0,0.05)", color: "#86868B", flex: 1 }} onClick={onCancel}>Cancel</button>
          <button style={{ ...alertBtn, background: "#0071E3", color: "#fff", flex: 2 }}
            disabled={!name.trim() || loading}
            onClick={() => onSave({ ...booking, customerName: name, partySize: guests, customerPhone: phone, notes })}>
            {loading ? "Saving…" : "Save & Seat"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── provider ──────────────────────────────────────────────────────────────────
export function NotificationProvider({ children }) {
  const { token } = useAuth();
  const [bookingCount, setBookingCount] = useState(0);
  const [orderCount,   setOrderCount]   = useState(0);
  const [activeAlert,    setActiveAlert]    = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [alertLoading,   setAlertLoading]   = useState(false);

  const lastBookingIds       = useRef(new Set());
  const lastOrderIds         = useRef(new Set());
  const lastOrderRoundCounts = useRef(new Map());
  const initialized          = useRef(false);
  const alertedIds           = useRef(new Set());
  const activeAlertRef       = useRef(null);
  const editingBookingRef    = useRef(null);

  useEffect(() => { activeAlertRef.current    = activeAlert;    }, [activeAlert]);
  useEffect(() => { editingBookingRef.current = editingBooking; }, [editingBooking]);

  function clearBookings() { setBookingCount(0); }
  function clearOrders()   { setOrderCount(0);   }

  function check15Min(bookings) {
    if (!Array.isArray(bookings)) return;
    if (activeAlertRef.current || editingBookingRef.current) return;
    const now    = Date.now();
    const TARGET = 15 * 60 * 1000;
    const WINDOW =  2 * 60 * 1000;
    for (const b of bookings) {
      if (["seated","cancelled","completed","no_show"].includes(b.status)) continue;
      if (alertedIds.current.has(String(b._id))) continue;
      if (!b.startIso) continue;
      const diff = new Date(b.startIso).getTime() - now;
      if (diff >= TARGET - WINDOW && diff <= TARGET + WINDOW) {
        alertedIds.current.add(String(b._id));
        setActiveAlert(b);
        break;
      }
    }
  }

  useEffect(() => {
    if (!token) return;

    async function poll() {
      try {
        const [bookingData, orderData] = await Promise.all([
          getBookings({ limit: 50 }),
          getOrders({ limit: 50 }),
        ]);

        // ── safe extraction — never assume shape ──────────────────────────────
        const bookings = safeArray(
          bookingData?.bookings ?? bookingData?.data ?? bookingData
        );
        const orders = safeArray(
          orderData?.orders ?? orderData?.data ?? orderData
        );

        // Only AI bookings for booking badge
        const aiBookings    = bookings.filter(b => b?.source !== "manual");
        // All active orders for order badge
        const kitchenOrders = orders.filter(o =>
          o && ["confirmed","preparing","ready"].includes(o.status)
        );

        const newBookingIds = new Set(aiBookings.map(b => String(b._id)));
        const newOrderIds   = new Set(kitchenOrders.map(o => String(o._id)));

        if (!initialized.current) {
          lastBookingIds.current = newBookingIds;
          lastOrderIds.current   = newOrderIds;
          for (const o of kitchenOrders) {
            lastOrderRoundCounts.current.set(String(o._id), o.rounds?.length || 0);
          }
          initialized.current = true;
          check15Min(bookings);
          return;
        }

        // booking badge
        let nb = 0;
        for (const id of newBookingIds) {
          if (!lastBookingIds.current.has(id)) nb++;
        }
        if (nb > 0) setBookingCount(p => p + nb);
        lastBookingIds.current = newBookingIds;

        // order badge
        let no = 0;
        for (const o of kitchenOrders) {
          const id  = String(o._id);
          const cur = o.rounds?.length || 0;
          if (!lastOrderIds.current.has(id)) {
            no++;
          } else {
            const prev = lastOrderRoundCounts.current.get(id) || 0;
            if (cur > prev) no++;
          }
          lastOrderRoundCounts.current.set(id, cur);
        }
        for (const id of lastOrderRoundCounts.current.keys()) {
          if (!newOrderIds.has(id)) lastOrderRoundCounts.current.delete(id);
        }
        if (no > 0) setOrderCount(p => p + no);
        lastOrderIds.current = newOrderIds;

        check15Min(bookings);

      } catch (err) {
        // Never let the poll crash the app
        console.warn("Notification poll error (silent):", err?.message);
      }
    }

    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [token]);

  // ── alert handlers ──────────────────────────────────────────────────────────
  async function handleSeatNow(booking) {
    const tableId = booking.tables?.[0]?.tableId?._id || booking.tables?.[0]?.tableId;
    if (!tableId) { setActiveAlert(null); return; }
    setAlertLoading(true);
    try {
      await apiClient.post(`/tables/${tableId}/seat`);
      await apiClient.patch(`/bookings/${booking._id}/status`, { status: "seated" });
    } catch (e) { console.error(e); }
    finally { setAlertLoading(false); setActiveAlert(null); }
  }

  function handleDismiss() { setActiveAlert(null); }
  function handleEditFromAlert(booking) { setEditingBooking(booking); setActiveAlert(null); }

  async function handleSaveAndSeat(updated) {
    setAlertLoading(true);
    try {
      await apiClient.patch(`/bookings/${updated._id}/status`, {
        customerName: updated.customerName,
        partySize:    updated.partySize,
        customerPhone: updated.customerPhone,
        notes:        updated.notes,
      });
      const tableId = updated.tables?.[0]?.tableId?._id || updated.tables?.[0]?.tableId;
      if (tableId) {
        await apiClient.post(`/tables/${tableId}/seat`);
        await apiClient.patch(`/bookings/${updated._id}/status`, { status: "seated" });
      }
    } catch (e) { console.error(e); }
    finally { setAlertLoading(false); setEditingBooking(null); }
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
const overlayStyle    = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 };
const modalStyle      = { background: "#fff", borderRadius: 22, padding: "32px 28px 26px", width: 360, maxWidth: "92vw", boxShadow: "0 24px 72px rgba(0,0,0,0.22)", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" };
const iconRingStyle   = { fontSize: 36, width: 68, height: 68, background: "rgba(0,113,227,0.08)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" };
const alertTitleStyle = { fontSize: 19, fontWeight: 700, color: "#1D1D1F", margin: "0 0 18px", letterSpacing: "-0.02em", textAlign: "center" };
const detailsBoxStyle = { background: "#F5F5F7", borderRadius: 14, padding: "14px 16px", marginBottom: 22, display: "flex", flexDirection: "column", gap: 10 };
const alertBtn        = { width: "100%", padding: 13, borderRadius: 13, fontSize: 15, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "inherit" };