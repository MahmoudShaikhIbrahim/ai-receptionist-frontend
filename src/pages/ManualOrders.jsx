// src/pages/ManualOrders.jsx
import { useEffect, useRef, useState } from "react";
import { getAgentMe } from "../api/api";
import { getBusinessMe } from "../api/business";
import apiClient from "../api/client";

const ORDER_TYPES = [
  { value: "pickup",    label: "🚶 Walk-in Pickup" },
  { value: "scheduled", label: "⏰ Scheduled Pickup" },
  { value: "delivery",  label: "🚗 Delivery" },
  { value: "dinein",    label: "🍽️ Dine-in (Upcoming)" },
];

const STATUS_COLORS = {
  confirmed: { bg: "rgba(0,113,227,0.10)",  color: "#0071E3" },
  preparing: { bg: "rgba(255,149,0,0.12)",  color: "#92400E" },
  ready:     { bg: "rgba(52,199,89,0.12)",  color: "#166534" },
};

// ── UAE Locations ──────────────────────────────────────────────────────────────
const UAE_LOCATIONS = [
  "Downtown Dubai","Dubai Marina","Jumeirah Beach Residence (JBR)","Palm Jumeirah",
  "Business Bay","DIFC","Deira","Bur Dubai","Jumeirah","Al Quoz","Al Barsha","Mirdif",
  "Karama","Satwa","Oud Metha","Al Nahda Dubai","Discovery Gardens","International City",
  "Dubai Silicon Oasis","Academic City","Dubai Hills Estate","Mohammed Bin Rashid City",
  "Jumeirah Village Circle (JVC)","Jumeirah Village Triangle (JVT)","Dubai Sports City",
  "Motor City","Arabian Ranches","Emirates Hills","The Meadows","The Springs","The Lakes",
  "The Greens","Dubai Internet City","Dubai Media City","Dubai Knowledge Park","Tecom",
  "Al Furjan","Dubai South","Town Square","Reem","Mudon","Damac Hills","Al Warqa",
  "Rashidiya","Muhaisnah","Al Qusais","Al Twar","Al Mizhar","Umm Suqeim","Umm Ramool",
  "Festival City","Ras Al Khor","Jebel Ali","Dubai Investments Park","Al Khawaneej",
  "Nad Al Sheba","Meydan","Abu Dhabi City Centre","Al Reem Island","Saadiyat Island",
  "Yas Island","Al Khalidiyah","Al Mushrif","Al Karama Abu Dhabi","Al Nahyan",
  "Corniche Abu Dhabi","Al Bateen","Khalifa City A","Khalifa City B",
  "Mohammed Bin Zayed City","Baniyas","Al Reef","Masdar City","Al Raha Beach",
  "Al Ghadeer","Shakhbout City","Al Shamkha","Sharjah City","Al Majaz",
  "Al Nahda Sharjah","Muwaileh","Al Qasimia","Al Taawun","Al Khan","Al Yarmook",
  "Al Suyoh","Al Zahia","University City Sharjah","Ajman City","Al Nuaimiyah",
  "Al Rashidiya Ajman","Al Jurf","Al Hamidiya","Ras Al Khaimah City","Al Hamra Village",
  "Mina Al Arab","Al Marjan Island","Fujairah City","Dibba Al Fujairah","Khor Fakkan",
  "Umm Al Quwain City",
];

// ── Luxury Time Picker (unchanged) ────────────────────────────────────────────
function LuxuryTimePicker({ value, onChange, label }) {
  const now = new Date();
  const [date, setDate] = useState(() => {
    if (value) return value.split("T")[0];
    return now.toISOString().split("T")[0];
  });
  const [hour, setHour] = useState(() => {
    if (value) { const h = parseInt(value.split("T")[1]?.split(":")[0] || "12"); return h % 12 === 0 ? 12 : h % 12; }
    const h = now.getHours(); return h % 12 === 0 ? 12 : h % 12;
  });
  const [minute, setMinute] = useState(() => {
    if (value) return parseInt(value.split("T")[1]?.split(":")[1] || "0");
    return Math.ceil(now.getMinutes() / 15) * 15 % 60;
  });
  const [ampm, setAmpm] = useState(() => {
    if (value) return parseInt(value.split("T")[1]?.split(":")[0] || "12") >= 12 ? "PM" : "AM";
    return now.getHours() >= 12 ? "PM" : "AM";
  });

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return {
      value: d.toISOString().split("T")[0],
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    };
  });

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 15, 30, 45];

  useEffect(() => {
    const h24 = ampm === "PM" ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    const iso = `${date}T${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    onChange(iso);
  }, [date, hour, minute, ampm]);

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: "#86868B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 10 }}>
        {label}
      </label>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#86868B", fontWeight: 600, marginBottom: 6 }}>DATE</div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {days.map(d => (
            <button key={d.value} onClick={() => setDate(d.value)} style={{
              padding: "8px 14px", borderRadius: 10, border: "1.5px solid",
              borderColor: date === d.value ? "#0071E3" : "rgba(0,0,0,0.10)",
              background: date === d.value ? "rgba(0,113,227,0.08)" : "#fff",
              color: date === d.value ? "#0071E3" : "#1D1D1F",
              fontWeight: date === d.value ? 700 : 500, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}>{d.label}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#86868B", fontWeight: 600, marginBottom: 6 }}>HOUR</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {hours.map(h => (
              <button key={h} onClick={() => setHour(h)} style={{
                width: 38, height: 38, borderRadius: 10, border: "1.5px solid",
                borderColor: hour === h ? "#0071E3" : "rgba(0,0,0,0.10)",
                background: hour === h ? "#0071E3" : "#fff",
                color: hour === h ? "#fff" : "#1D1D1F",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>{h}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#86868B", fontWeight: 600, marginBottom: 6 }}>MIN</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {minutes.map(m => (
              <button key={m} onClick={() => setMinute(m)} style={{
                width: 48, height: 32, borderRadius: 8, border: "1.5px solid",
                borderColor: minute === m ? "#0071E3" : "rgba(0,0,0,0.10)",
                background: minute === m ? "#0071E3" : "#fff",
                color: minute === m ? "#fff" : "#1D1D1F",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>:{String(m).padStart(2, "0")}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#86868B", fontWeight: 600, marginBottom: 6 }}>AM/PM</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {["AM","PM"].map(p => (
              <button key={p} onClick={() => setAmpm(p)} style={{
                width: 52, height: 32, borderRadius: 8, border: "1.5px solid",
                borderColor: ampm === p ? "#0071E3" : "rgba(0,0,0,0.10)",
                background: ampm === p ? "#0071E3" : "#fff",
                color: ampm === p ? "#fff" : "#1D1D1F",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
      {value && (
        <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(0,113,227,0.06)", fontSize: 13, fontWeight: 600, color: "#0071E3" }}>
          ⏰ {days.find(d => d.value === date)?.label} · {hour}:{String(minute).padStart(2, "0")} {ampm}
        </div>
      )}
    </div>
  );
}

// ── UAE Address Autocomplete (unchanged) ──────────────────────────────────────
function UAEAddressInput({ value, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val); onChange(val);
    if (val.length >= 2) {
      setFiltered(UAE_LOCATIONS.filter(l => l.toLowerCase().includes(val.toLowerCase())).slice(0, 8));
      setShowDropdown(true);
    } else { setShowDropdown(false); }
  }

  return (
    <div ref={ref} style={{ position: "relative", marginBottom: 10 }}>
      <label style={{ fontSize: 12, color: "#86868B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
        Delivery Address
      </label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>📍</span>
        <input value={query} onChange={handleChange} onFocus={() => { if (query.length >= 2) setShowDropdown(true); }}
          placeholder="Search area, community, city…" style={{ ...inputStyle, paddingLeft: 36 }} />
      </div>
      {showDropdown && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", border: "1px solid rgba(0,0,0,0.08)", marginTop: 4, overflow: "hidden" }}>
          {filtered.map(loc => (
            <div key={loc} onClick={() => { setQuery(loc); onChange(loc); setShowDropdown(false); }}
              style={{ padding: "11px 16px", cursor: "pointer", fontSize: 13, fontWeight: 500, borderBottom: "1px solid rgba(0,0,0,0.05)", transition: "background 100ms" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,113,227,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
              📍 {loc}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── New Booking Modal ──────────────────────────────────────────────────────────
function NewBookingModal({ tables, onConfirm, onClose, loading }) {
  const [name, setName] = useState("");
  const [guests, setGuests] = useState(2);
  const [phone, setPhone] = useState("");
  const [startIso, setStartIso] = useState("");
  const [endIso, setEndIso] = useState("");
  const [tableId, setTableId] = useState("");

  const available = tables.filter(t => t.status === "available");
  const valid = name.trim() && guests > 0 && startIso && tableId;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: 420, maxWidth: "92vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700 }}>📅 New Booking</h3>

        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Guest Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sara" style={inputStyle} />
          </div>
          <div style={{ width: 80 }}>
            <label style={labelStyle}>Guests</label>
            <input type="number" min={1} max={20} value={guests} onChange={e => setGuests(Number(e.target.value))} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Phone (optional)</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+971 5xx xxx xxxx" type="tel" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Table</label>
          <select value={tableId} onChange={e => setTableId(e.target.value)} style={inputStyle}>
            <option value="">— select table —</option>
            {available.map(t => (
              <option key={t._id} value={t._id}>
                {t.name || `Table ${t.tableNumber}`} (seats {t.capacity})
              </option>
            ))}
          </select>
        </div>

        <LuxuryTimePicker value={startIso} onChange={setStartIso} label="Booking Time (Start)" />

        {startIso && (
          <LuxuryTimePicker value={endIso} onChange={setEndIso} label="End Time (optional)" />
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button
            disabled={!valid || loading}
            onClick={() => onConfirm({ name, guests, phone, startIso, endIso, tableId })}
            style={{ ...primaryBtn, flex: 1, opacity: (!valid || loading) ? 0.5 : 1 }}
          >
            {loading ? "Creating…" : "Create Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dine-in Upcoming Modal ─────────────────────────────────────────────────────
function DineInModal({ tables, orderItems, onConfirm, onClose, loading }) {
  const [tableId, setTableId] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const available = tables.filter(t => t.status === "available");
  const valid = tableId && scheduledTime;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: 420, maxWidth: "92vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700 }}>🍽️ Upcoming Dine-in</h3>
        <p style={{ fontSize: 13, color: "#86868B", margin: "0 0 20px" }}>
          {orderItems.reduce((s, i) => s + i.qty, 0)} items will be saved to this table's upcoming order.
        </p>

        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Select Table</label>
          <select value={tableId} onChange={e => setTableId(e.target.value)} style={inputStyle}>
            <option value="">— select table —</option>
            {available.map(t => (
              <option key={t._id} value={t._id}>
                {t.name || `Table ${t.tableNumber}`} (seats {t.capacity})
              </option>
            ))}
          </select>
        </div>

        <LuxuryTimePicker value={scheduledTime} onChange={setScheduledTime} label="Arrival Time" />

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button
            disabled={!valid || loading}
            onClick={() => onConfirm({ tableId, scheduledTime })}
            style={{ ...primaryBtn, flex: 1, opacity: (!valid || loading) ? 0.5 : 1 }}
          >
            {loading ? "Saving…" : "Save to Upcoming"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── format helpers ─────────────────────────────────────────────────────────────
function formatTime(dt) {
  if (!dt) return null;
  try {
    return new Date(dt).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZone: "Asia/Dubai",
    });
  } catch { return null; }
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ManualOrders() {
  const [menu, setMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [vatPct, setVatPct] = useState(5);
  const [tables, setTables] = useState([]);

  const [orderType, setOrderType] = useState("pickup");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [sending, setSending] = useState(false);
  const [noteModal, setNoteModal] = useState(null);

  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [addingItems, setAddingItems] = useState(false);
  const [editTimeMode, setEditTimeMode] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [viewBill, setViewBill] = useState(false);
  const [discount, setDiscount] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // new modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDineInModal, setShowDineInModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [dineInLoading, setDineInLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadMenu();
    loadActiveOrders();
    loadTables();
    const interval = setInterval(loadActiveOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadMenu() {
    setMenuLoading(true);
    try {
      const [agentData, bizData] = await Promise.all([getAgentMe(), getBusinessMe()]);
      setMenu(agentData.agent?.menu?.filter(m => m.available) || []);
      setVatPct(bizData.business?.vatPercentage ?? 5);
    } catch { }
    finally { setMenuLoading(false); }
  }

  async function loadTables() {
    try {
      const res = await apiClient.get("/tables");
      setTables(res.data || []);
    } catch { }
  }

  async function loadActiveOrders() {
    try {
      const res = await apiClient.get("/orders/manual/active");
      setActiveOrders(res.data.orders || []);
    } catch { }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  // ── cart helpers ─────────────────────────────────────────────────────────────
  function addItem(item) {
    setOrderItems(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) return prev.map(i => i._id === item._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1, notes: "" }];
    });
  }

  function removeItem(itemId) {
    setOrderItems(prev => {
      const existing = prev.find(i => i._id === itemId);
      if (!existing) return prev;
      if (existing.qty === 1) return prev.filter(i => i._id !== itemId);
      return prev.map(i => i._id === itemId ? { ...i, qty: i.qty - 1 } : i);
    });
  }

  function getQty(itemId) {
    return orderItems.find(i => i._id === itemId)?.qty || 0;
  }

  // ── confirm order (pickup / scheduled / delivery) ────────────────────────────
  async function handleConfirmOrder() {
    if (!orderItems.length) return;

    // dine-in → open modal instead
    if (orderType === "dinein") {
      setShowDineInModal(true);
      return;
    }

    setSending(true);
    try {
      const backendOrderType = orderType === "delivery" ? "delivery" : "pickup";
      const payload = {
        customerName: customerName || "Walk-in",
        customerPhone: customerPhone || null,
        orderType: backendOrderType,
        scheduledTime: (orderType === "scheduled" || orderType === "delivery") && scheduledTime
          ? new Date(scheduledTime).toISOString()
          : null,
        deliveryAddress: orderType === "delivery" ? deliveryAddress : null,
        isScheduled: orderType === "scheduled",
        items: orderItems.map(i => ({
          name: i.name, quantity: i.qty, price: i.price,
          extras: i.extras || [], notes: i.notes || null,
        })),
      };
      await apiClient.post("/orders/pickup", payload);
      setOrderItems([]);
      setCustomerName(""); setCustomerPhone(""); setScheduledTime(""); setDeliveryAddress("");
      setOrderType("pickup");
      await loadActiveOrders();
      showToast("✅ Order created");
    } catch {
      showToast("❌ Failed to create order");
    } finally {
      setSending(false);
    }
  }

  // ── confirm dine-in upcoming ─────────────────────────────────────────────────
  async function handleDineInConfirm({ tableId, scheduledTime: sTime }) {
    setDineInLoading(true);
    try {
      await apiClient.post("/orders/table", {
        tableId,
        scheduledTime: new Date(sTime).toISOString(),
        items: orderItems.map(i => ({
          name: i.name, quantity: i.qty, price: i.price,
          extras: i.extras || [], notes: i.notes || null,
        })),
        orderType: "dineIn",
      });
      setOrderItems([]);
      setOrderType("pickup");
      setShowDineInModal(false);
      showToast("✅ Saved to Upcoming Dine-in");
    } catch {
      showToast("❌ Failed to save dine-in order");
    } finally {
      setDineInLoading(false);
    }
  }

  // ── new booking ──────────────────────────────────────────────────────────────
  async function handleBookingConfirm({ name, guests, phone, startIso, endIso, tableId }) {
    setBookingLoading(true);
    try {
      // resolve table capacity
      const table = tables.find(t => t._id === tableId);
      await apiClient.post("/bookings/manual", {
        customerName: name,
        partySize: guests,
        customerPhone: phone || null,
        startIso: new Date(startIso).toISOString(),
        endIso: endIso ? new Date(endIso).toISOString() : new Date(new Date(startIso).getTime() + 90 * 60000).toISOString(),
        tables: [{ tableId, capacity: table?.capacity || guests }],
        source: "dashboard",
      });
      setShowBookingModal(false);
      showToast("✅ Booking created");
    } catch {
      showToast("❌ Failed to create booking");
    } finally {
      setBookingLoading(false);
    }
  }

  // ── add round ────────────────────────────────────────────────────────────────
  async function handleAddRound() {
    if (!orderItems.length || !selectedOrder?._id) return;
    setSending(true);
    try {
      const res = await apiClient.post("/orders/pickup/round", {
        orderId: selectedOrder._id,
        items: orderItems.map(i => ({
          name: i.name, quantity: i.qty, price: i.price,
          extras: i.extras || [], notes: i.notes || null,
        })),
      });
      setSelectedOrder(res.data.order);
      setOrderItems([]);
      setAddingItems(false);
      await loadActiveOrders();
    } catch { alert("Failed to add items"); }
    finally { setSending(false); }
  }

  async function handleCancelItem(roundIndex, itemIndex) {
    if (!selectedOrder?._id) return;
    try {
      const res = await apiClient.delete(`/orders/table/${selectedOrder._id}/item`, { data: { roundIndex, itemIndex } });
      const updated = res.data.order;
      if (updated.status === "cancelled") {
        setSelectedOrder(null);
        setActiveOrders(prev => prev.filter(o => o._id !== updated._id));
      } else {
        setSelectedOrder(updated);
        setActiveOrders(prev => prev.map(o => o._id === updated._id ? updated : o));
      }
    } catch { alert("Failed to remove item"); }
  }

  async function handleUpdateTime() {
    if (!selectedOrder?._id || !newTime) return;
    setUpdatingId(selectedOrder._id);
    try {
      const res = await apiClient.patch(`/orders/${selectedOrder._id}/scheduled-time`, {
        scheduledTime: new Date(newTime).toISOString(),
      });
      setSelectedOrder(res.data.order);
      setActiveOrders(prev => prev.map(o => o._id === res.data.order._id ? res.data.order : o));
      setEditTimeMode(false); setNewTime("");
    } catch { alert("Failed to update time"); }
    finally { setUpdatingId(null); }
  }

  async function handleStatus(orderId, status) {
    setUpdatingId(orderId);
    try {
      const res = await apiClient.patch(`/orders/${orderId}/status`, { status });
      if (status === "cancelled") {
        setActiveOrders(prev => prev.filter(o => o._id !== orderId));
        if (selectedOrder?._id === orderId) setSelectedOrder(null);
      } else {
        setActiveOrders(prev => prev.map(o => o._id === orderId ? res.data.order : o));
        if (selectedOrder?._id === orderId) setSelectedOrder(res.data.order);
      }
    } catch { alert("Failed to update status"); }
    finally { setUpdatingId(null); }
  }

  async function handleComplete(orderId) {
    setUpdatingId(orderId);
    try {
      await apiClient.patch(`/orders/${orderId}/complete`);
      setActiveOrders(prev => prev.filter(o => o._id !== orderId));
      if (selectedOrder?._id === orderId) setSelectedOrder(null);
    } catch { alert("Failed to complete order"); }
    finally { setUpdatingId(null); }
  }

  const allRounds = selectedOrder?.rounds || [];
  const billItems = allRounds.flatMap(r => r.items);
  const billSubtotal = billItems.reduce((s, i) => s + i.price * (i.quantity || 1), 0);
  const discountAmount = discount ? Math.min(Number(discount), billSubtotal) : 0;
  const afterDiscount = billSubtotal - discountAmount;
  const vatAmount = (afterDiscount * vatPct) / 100;
  const billTotal = afterDiscount + vatAmount;
  const newSubtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);

  const grouped = menu.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="pageTitle">Manual Orders</h1>
          <p className="pageSubtitle">Create and manage walk-in, pickup, and delivery orders.</p>
        </div>
        {/* New Booking button — always visible */}
        <button
          onClick={() => setShowBookingModal(true)}
          style={{ ...primaryBtn, display: "flex", alignItems: "center", gap: 8, borderRadius: 12 }}
        >
          📅 New Booking
        </button>
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* LEFT: New Order Form */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>New Order</h3>

            {/* Order type tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {ORDER_TYPES.map(t => (
                <button key={t.value} onClick={() => { setOrderType(t.value); setScheduledTime(""); }}
                  style={{
                    padding: "8px 14px", borderRadius: 10, border: "1.5px solid",
                    borderColor: orderType === t.value ? "#0071E3" : "rgba(0,0,0,0.12)",
                    background: orderType === t.value ? "rgba(0,113,227,0.08)" : "#fff",
                    color: orderType === t.value ? "#0071E3" : "var(--text)",
                    fontWeight: 600, fontSize: 13, cursor: "pointer",
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* dine-in: show info, no customer fields needed */}
            {orderType === "dinein" ? (
              <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(0,113,227,0.06)", fontSize: 13, color: "#0071E3", fontWeight: 500 }}>
                🍽️ Select items from the menu, then tap <strong>Confirm Order</strong> to choose a table and arrival time.
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                    placeholder="Customer name (optional)" style={{ ...inputStyle, flex: 1 }} />
                  <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="Phone (optional)" style={{ ...inputStyle, flex: 1 }} />
                </div>
                {(orderType === "scheduled" || orderType === "delivery") && (
                  <LuxuryTimePicker value={scheduledTime} onChange={setScheduledTime}
                    label={orderType === "delivery" ? "Delivery Time" : "Pickup Time"} />
                )}
                {orderType === "delivery" && (
                  <UAEAddressInput value={deliveryAddress} onChange={setDeliveryAddress} />
                )}
              </>
            )}
          </div>

          {/* Menu */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Menu</h3>
            {menuLoading ? (
              <p style={{ color: "var(--muted)" }}>Loading menu…</p>
            ) : menu.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No menu items available.</p>
            ) : (
              Object.entries(grouped).map(([cat, items]) => (
                <div key={cat} style={{ marginBottom: 24 }}>
                  <div style={catLabel}>{cat}</div>
                  {items.map(item => {
                    const qty = getQty(item._id);
                    const orderItem = orderItems.find(i => i._id === item._id);
                    return (
                      <div key={item._id} style={menuRow}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: "#0071E3", fontWeight: 700 }}>
                            {item.price} {item.currency || "AED"}
                          </div>
                          {orderItem?.notes && (
                            <div style={{ fontSize: 11, color: "#86868B", marginTop: 2 }}>📝 {orderItem.notes}</div>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {qty > 0 && (
                            <>
                              <button style={qtyBtn} onClick={() => removeItem(item._id)}>−</button>
                              <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{qty}</span>
                            </>
                          )}
                          <button style={qtyBtn} onClick={() => addItem(item)}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}

            {orderItems.length > 0 && !selectedOrder && (
              <div style={{ marginTop: 16, padding: "14px 16px", background: "rgba(0,113,227,0.06)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {orderItems.reduce((s, i) => s + i.qty, 0)} items · {newSubtotal.toFixed(2)} AED
                </span>
                <button style={primaryBtn} onClick={handleConfirmOrder} disabled={sending}>
                  {sending ? "Creating…" : orderType === "dinein" ? "🍽️ Choose Table" : "✅ Confirm Order"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Active Orders (unchanged) */}
        <div style={{ width: 400, flexShrink: 0 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>
            Active Orders{activeOrders.length > 0 && (
              <span style={{ fontSize: 13, fontWeight: 600, color: "#86868B" }}> ({activeOrders.length})</span>
            )}
          </h3>

          {activeOrders.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
              No active orders yet.
            </div>
          ) : (
            activeOrders.map(order => (
              <div key={order._id} className="card"
                style={{
                  padding: 16, marginBottom: 12, cursor: "pointer",
                  border: selectedOrder?._id === order._id ? "2px solid #0071E3" : "2px solid transparent",
                  transition: "border 150ms",
                }}
                onClick={() => {
                  if (selectedOrder?._id === order._id) {
                    setSelectedOrder(null); setAddingItems(false); setViewBill(false); setEditTimeMode(false);
                  } else {
                    setSelectedOrder(order); setOrderItems([]); setAddingItems(false);
                    setViewBill(false); setEditTimeMode(false); setDiscount("");
                  }
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{order.customerName || "Walk-in"}</div>
                    <div style={{ fontSize: 12, color: "#86868B" }}>
                      {order.orderType === "delivery" ? "🚗 Delivery" : "🚶 Pickup"} ·{" "}
                      {order.rounds?.length || 0} round{order.rounds?.length !== 1 ? "s" : ""} ·{" "}
                      {order.total?.toFixed(2)} AED
                    </div>
                    {order.scheduledTime && (
                      <div style={{ fontSize: 12, color: "#FF9500", marginTop: 2 }}>⏰ {formatTime(order.scheduledTime)}</div>
                    )}
                    {order.deliveryAddress && (
                      <div style={{ fontSize: 12, color: "#86868B", marginTop: 2 }}>📍 {order.deliveryAddress}</div>
                    )}
                  </div>
                  <span style={{
                    padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                    background: STATUS_COLORS[order.status]?.bg, color: STATUS_COLORS[order.status]?.color,
                  }}>{order.status}</span>
                </div>

                {selectedOrder?._id === order._id && (
                  <div onClick={e => e.stopPropagation()}>
                    <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "12px 0" }} />

                    {!viewBill ? (
                      <>
                        {allRounds.map((round, idx) => (
                          <div key={round._id || idx} style={{ background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                            <div style={{ fontSize: 11, color: "#86868B", fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
                              Round {idx + 1} · {new Date(round.sentAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dubai" })}
                            </div>
                            {round.items.map((item, i) => (
                              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 4 }}>
                                <span>{item.name} × {item.quantity}{item.notes ? ` · ${item.notes}` : ""}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontWeight: 600 }}>{(item.price * item.quantity).toFixed(2)} AED</span>
                                  <button onClick={() => handleCancelItem(idx, i)}
                                    style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: "rgba(255,59,48,0.12)", color: "#FF3B30", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>×</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}

                        {editTimeMode ? (
                          <div style={{ marginBottom: 10 }}>
                            <LuxuryTimePicker value={newTime} onChange={setNewTime} label="New Time" />
                            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                              <button onClick={() => setEditTimeMode(false)} style={ghostBtn}>Cancel</button>
                              <button onClick={handleUpdateTime} disabled={updatingId === selectedOrder._id} style={{ ...primaryBtn, flex: 1 }}>Save Time</button>
                            </div>
                          </div>
                        ) : (
                          selectedOrder.scheduledTime && (
                            <button onClick={() => { setEditTimeMode(true); setNewTime(""); }} style={{ ...ghostBtn, marginBottom: 10, width: "100%" }}>
                              ✏️ Change Time · {formatTime(selectedOrder.scheduledTime)}
                            </button>
                          )
                        )}

                        {addingItems ? (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 12, color: "#86868B", fontWeight: 600, marginBottom: 8 }}>Select items to add:</div>
                            {Object.entries(grouped).map(([cat, items]) => (
                              <div key={cat} style={{ marginBottom: 12 }}>
                                <div style={catLabel}>{cat}</div>
                                {items.map(item => {
                                  const qty = getQty(item._id);
                                  return (
                                    <div key={item._id} style={menuRow}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                                        <div style={{ fontSize: 12, color: "#0071E3" }}>{item.price} AED</div>
                                      </div>
                                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        {qty > 0 && (
                                          <>
                                            <button style={qtyBtn} onClick={() => removeItem(item._id)}>−</button>
                                            <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{qty}</span>
                                          </>
                                        )}
                                        <button style={qtyBtn} onClick={() => addItem(item)}>+</button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                            {orderItems.length > 0 && (
                              <button onClick={handleAddRound} disabled={sending} style={primaryBtn}>
                                {sending ? "Adding…" : `✅ Add ${orderItems.reduce((s,i)=>s+i.qty,0)} items · ${newSubtotal.toFixed(2)} AED`}
                              </button>
                            )}
                            <button onClick={() => { setAddingItems(false); setOrderItems([]); }} style={{ ...ghostBtn, marginTop: 8, width: "100%" }}>Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setAddingItems(true)} style={{ ...ghostBtn, width: "100%", marginBottom: 10 }}>+ Add More Items</button>
                        )}

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {["confirmed", "preparing"].includes(order.status) && (
                            <button onClick={() => handleStatus(order._id, "cancelled")} disabled={updatingId === order._id} style={dangerBtn}>Cancel Order</button>
                          )}
                          {order.status === "ready" && (
                            <button onClick={() => handleComplete(order._id)} disabled={updatingId === order._id} style={{ ...primaryBtn, background: "#34C759", flex: 1 }}>✅ Complete & Close</button>
                          )}
                          <button onClick={() => setViewBill(true)} style={{ ...ghostBtn, flex: 1 }}>🧾 View Bill · {selectedOrder.total?.toFixed(2)} AED</button>
                        </div>
                      </>
                    ) : (
                      <div>
                        <button onClick={() => setViewBill(false)} style={{ ...ghostBtn, marginBottom: 12 }}>← Back</button>
                        {allRounds.map((round, idx) => (
                          <div key={idx} style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 11, color: "#86868B", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Round {idx + 1}</div>
                            {round.items.map((item, i) => (
                              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                                <span>{item.name} × {item.quantity}</span>
                                <span style={{ fontWeight: 600 }}>{(item.price * item.quantity).toFixed(2)} AED</span>
                              </div>
                            ))}
                          </div>
                        ))}
                        <div style={divider} />
                        <div style={{ marginBottom: 10 }}>
                          <label style={labelStyle}>Discount (AED)</label>
                          <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" style={{ ...inputStyle, marginTop: 4 }} />
                        </div>
                        <div style={totalRow}><span style={{ color: "#86868B" }}>Subtotal</span><span>{billSubtotal.toFixed(2)} AED</span></div>
                        {discountAmount > 0 && <div style={totalRow}><span style={{ color: "#FF3B30" }}>Discount</span><span style={{ color: "#FF3B30" }}>− {discountAmount.toFixed(2)} AED</span></div>}
                        <div style={totalRow}><span style={{ color: "#86868B" }}>VAT ({vatPct}%)</span><span>{vatAmount.toFixed(2)} AED</span></div>
                        <div style={divider} />
                        <div style={{ ...totalRow, fontWeight: 800, fontSize: 17 }}>
                          <span>Total</span>
                          <span style={{ color: "#0071E3" }}>{billTotal.toFixed(2)} AED</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                          <button style={{ ...primaryBtn, background: "#34C759", flex: 1 }}
                            onClick={() => handlePrint({ order: selectedOrder, allRounds, billSubtotal, discountAmount, vatPct, vatAmount, billTotal })}>
                            🖨 Print Bill
                          </button>
                          {order.status === "ready" && (
                            <button onClick={() => handleComplete(order._id)} disabled={updatingId === order._id} style={{ ...primaryBtn, flex: 1 }}>✅ Complete</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Note Modal (unchanged) */}
      {noteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={() => setNoteModal(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 320, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Add Note</h3>
            <input autoFocus value={noteModal.note} onChange={e => setNoteModal(prev => ({ ...prev, note: e.target.value }))}
              placeholder="e.g. No onions, extra spicy..." style={{ ...inputStyle, marginBottom: 16 }}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  setOrderItems(prev => prev.map(i => i._id === noteModal.itemId ? { ...i, notes: noteModal.note } : i));
                  setNoteModal(null);
                }
              }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setNoteModal(null)} style={ghostBtn}>Cancel</button>
              <button onClick={() => {
                setOrderItems(prev => prev.map(i => i._id === noteModal.itemId ? { ...i, notes: noteModal.note } : i));
                setNoteModal(null);
              }} style={{ ...primaryBtn, flex: 1 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* New Booking Modal */}
      {showBookingModal && (
        <NewBookingModal
          tables={tables}
          onConfirm={handleBookingConfirm}
          onClose={() => setShowBookingModal(false)}
          loading={bookingLoading}
        />
      )}

      {/* Dine-in Upcoming Modal */}
      {showDineInModal && (
        <DineInModal
          tables={tables}
          orderItems={orderItems}
          onConfirm={handleDineInConfirm}
          onClose={() => setShowDineInModal(false)}
          loading={dineInLoading}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: "#1D1D1F", color: "#fff", padding: "12px 24px", borderRadius: 100,
          fontSize: 14, fontWeight: 500, zIndex: 3000, whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Print handler (unchanged) ──────────────────────────────────────────────────
function handlePrint({ order, allRounds, billSubtotal, discountAmount, vatPct, vatAmount, billTotal }) {
  const win = window.open("", "_blank");
  win.document.write(`
    <html><head><title>Bill</title><style>
      body { font-family: -apple-system, sans-serif; padding: 32px; max-width: 400px; margin: 0 auto; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      .sub { color: #86868B; font-size: 13px; margin-bottom: 24px; }
      .round-title { font-size: 11px; font-weight: 700; color: #86868B; text-transform: uppercase; margin: 16px 0 8px; }
      .item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
      .note { font-size: 11px; color: #86868B; margin-bottom: 6px; }
      .divider { border: none; border-top: 1px solid #E5E5EA; margin: 16px 0; }
      .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
      .grand { font-size: 20px; font-weight: 800; color: #0071E3; }
      .footer { margin-top: 32px; text-align: center; color: #86868B; font-size: 12px; }
    </style></head><body>
      <h1>${order.orderType === "delivery" ? "Delivery Order" : "Pickup Order"}</h1>
      <div class="sub">
        ${order.customerName || "Walk-in"}
        ${order.customerPhone ? " · " + order.customerPhone : ""}
        ${order.scheduledTime ? " · " + new Date(order.scheduledTime).toLocaleString("en-US", { timeZone: "Asia/Dubai" }) : ""}
        ${order.deliveryAddress ? "<br/>📍 " + order.deliveryAddress : ""}
        <br/>${new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" })}
      </div>
      ${allRounds.map((round, idx) => `
        <div class="round-title">Round ${idx + 1}</div>
        ${round.items.map(i => `
          <div class="item"><span>${i.name} × ${i.quantity}</span><span>${(i.price * i.quantity).toFixed(2)} AED</span></div>
          ${i.notes ? `<div class="note">📝 ${i.notes}</div>` : ""}
        `).join("")}
      `).join("")}
      <hr class="divider"/>
      <div class="total-row"><span>Subtotal</span><span>${billSubtotal.toFixed(2)} AED</span></div>
      ${discountAmount > 0 ? `<div class="total-row" style="color:#FF3B30"><span>Discount</span><span>− ${discountAmount.toFixed(2)} AED</span></div>` : ""}
      <div class="total-row"><span>VAT (${vatPct}%)</span><span>${vatAmount.toFixed(2)} AED</span></div>
      <hr class="divider"/>
      <div class="total-row grand"><span>Total</span><span>${billTotal.toFixed(2)} AED</span></div>
      <div class="footer">Thank you!</div>
    </body></html>
  `);
  win.document.close(); win.print();
}

// ── style constants ────────────────────────────────────────────────────────────
const primaryBtn = { padding: "10px 18px", borderRadius: 12, border: "none", background: "#0071E3", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const ghostBtn   = { padding: "9px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const dangerBtn  = { padding: "9px 14px", borderRadius: 10, border: "none", background: "rgba(255,59,48,0.10)", color: "#FF3B30", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", fontSize: 14, boxSizing: "border-box", outline: "none" };
const labelStyle = { fontSize: 12, color: "#86868B", fontWeight: 500 };
const catLabel   = { fontSize: 11, fontWeight: 700, color: "#86868B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 };
const menuRow    = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" };
const qtyBtn     = { width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(0,0,0,0.04)", cursor: "pointer", fontWeight: 700, fontSize: 16 };
const divider    = { border: "none", borderTop: "1px solid rgba(0,0,0,0.08)", margin: "16px 0" };
const totalRow   = { display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 };