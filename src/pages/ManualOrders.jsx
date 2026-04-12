// src/pages/ManualOrders.jsx
import { useEffect, useRef, useState } from "react";
import { getAgentMe } from "../api/api";
import { getBusinessMe } from "../api/business";
import apiClient from "../api/client";

// ─── Scroll Wheel Picker ───────────────────────────────────────────────────────
function ScrollPicker({ items, value, onChange, width = 60 }) {
  const ref   = useRef(null);
  const itemH = 44;
  const isScrolling = useRef(false);

  useEffect(() => {
    const idx = items.indexOf(String(value));
    if (ref.current && idx >= 0 && !isScrolling.current) {
      ref.current.scrollTop = idx * itemH;
    }
  }, [value, items]);

  function handleScroll() {
    isScrolling.current = true;
    clearTimeout(ref._scrollTimer);
    ref._scrollTimer = setTimeout(() => {
      isScrolling.current = false;
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / itemH);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      if (items[clamped] !== String(value)) onChange(items[clamped]);
    }, 80);
  }

  return (
    <div style={{ position: "relative", width, flexShrink: 0 }}>
      {/* highlight bar */}
      <div style={{ position: "absolute", top: "50%", left: 4, right: 4, height: itemH, transform: "translateY(-50%)", background: "rgba(0,113,227,0.10)", borderRadius: 10, pointerEvents: "none", zIndex: 1 }} />
      <div ref={ref} onScroll={handleScroll} style={{ height: itemH * 3, overflowY: "scroll", scrollSnapType: "y mandatory", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
        <div style={{ height: itemH }} />
        {items.map(item => (
          <div key={item} style={{ height: itemH, scrollSnapAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: item === String(value) ? 700 : 400, color: item === String(value) ? "#0071E3" : "#86868B", cursor: "pointer", userSelect: "none", transition: "color 0.15s" }}
            onClick={() => onChange(item)}>
            {item}
          </div>
        ))}
        <div style={{ height: itemH }} />
      </div>
    </div>
  );
}

// ─── Time Picker ───────────────────────────────────────────────────────────────
function TimePicker({ value, onChange, label }) {
  const now = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return { value: d.toISOString().split("T")[0], label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) };
  });

  const hours   = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = ["00", "15", "30", "45"];
  const amPms   = ["AM", "PM"];

  const initH = now.getHours(); const initM = now.getMinutes();
  const [date,   setDate]   = useState(days[0].value);
  const [hour,   setHour]   = useState(String(initH % 12 === 0 ? 12 : initH % 12));
  const [minute, setMinute] = useState(minutes[Math.min(Math.floor(initM / 15), 3)]);
  const [ampm,   setAmpm]   = useState(initH >= 12 ? "PM" : "AM");

  useEffect(() => {
    const h = parseInt(hour);
    const h24 = ampm === "PM" ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
    onChange(`${date}T${String(h24).padStart(2, "0")}:${minute}`);
  }, [date, hour, minute, ampm]);

  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ fontSize: 12, color: "#86868B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 10 }}>{label}</label>}
      {/* Day pills */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
        {days.map(d => (
          <button key={d.value} onClick={() => setDate(d.value)} style={{ padding: "6px 12px", borderRadius: 20, border: "1.5px solid", borderColor: date === d.value ? "#0071E3" : "rgba(0,0,0,0.10)", background: date === d.value ? "#0071E3" : "#fff", color: date === d.value ? "#fff" : "#1D1D1F", fontWeight: 600, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            {d.label}
          </button>
        ))}
      </div>
      {/* Scroll wheels */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, background: "#F5F5F7", borderRadius: 14, padding: "6px 12px" }}>
        <ScrollPicker items={hours}   value={hour}   onChange={setHour}   width={60} />
        <span style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", paddingBottom: 2, flexShrink: 0 }}>:</span>
        <ScrollPicker items={minutes} value={minute} onChange={setMinute} width={60} />
        <div style={{ width: 1, height: 44, background: "rgba(0,0,0,0.08)", margin: "0 8px", flexShrink: 0 }} />
        <ScrollPicker items={amPms}  value={ampm}   onChange={setAmpm}   width={60} />
      </div>
      {/* Preview */}
      <div style={{ marginTop: 8, padding: "6px 12px", borderRadius: 10, background: "rgba(0,113,227,0.06)", fontSize: 12, fontWeight: 600, color: "#0071E3" }}>
        ⏰ {days.find(d => d.value === date)?.label} · {hour}:{minute} {ampm}
      </div>
    </div>
  );
}

// ─── Bill Modal ────────────────────────────────────────────────────────────────
function BillModal({ order, vatPct, onDone, onClose }) {
  const [completing, setCompleting] = useState(false);

  const allItems = (order.rounds || []).flatMap(r => r.items || []);
  const subtotal = allItems.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
  const vat      = (subtotal * vatPct) / 100;
  const total    = subtotal + vat;

  function handlePrint() {
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Bill</title><style>
      body{font-family:-apple-system,sans-serif;padding:28px;max-width:360px;margin:0 auto;}
      h2{margin:0 0 4px;font-size:18px;}
      .sub{color:#86868B;font-size:11px;margin-bottom:18px;}
      .item{display:flex;justify-content:space-between;margin-bottom:5px;font-size:13px;}
      hr{border:none;border-top:1px solid #E5E5EA;margin:12px 0;}
      .row{display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;}
      .total{font-size:17px;font-weight:800;color:#0071E3;}
      .footer{margin-top:24px;text-align:center;color:#86868B;font-size:11px;}
    </style></head><body>
      <h2>${order.orderType === "delivery" ? "Delivery" : order.orderType === "dineIn" ? "Dine-in" : "Pickup"} Order</h2>
      <div class="sub">
        ${order.customerName && order.customerName !== "Walk-in" ? order.customerName : "Walk-in"}
        ${order.customerPhone ? " · " + order.customerPhone : ""}
        ${order.tableLabel ? " · " + order.tableLabel : ""}
        ${order.scheduledTime ? "<br/>⏰ " + new Date(order.scheduledTime).toLocaleString("en-US", { timeZone: "Asia/Dubai" }) : ""}
        ${order.deliveryAddress ? "<br/>📍 " + order.deliveryAddress : ""}
        <br/>${new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" })}
      </div>
      ${allItems.map(i => `<div class="item"><span>${i.name} × ${i.quantity}</span><span>${(i.price * i.quantity).toFixed(2)} AED</span></div>`).join("")}
      <hr/>
      <div class="row"><span>Subtotal</span><span>${subtotal.toFixed(2)} AED</span></div>
      <div class="row"><span>VAT (${vatPct}%)</span><span>${vat.toFixed(2)} AED</span></div>
      <hr/>
      <div class="row total"><span>Total</span><span>${total.toFixed(2)} AED</span></div>
      <div class="footer">Thank you!</div>
    </body></html>`);
    win.document.close();
    win.print();
  }

  async function handleDone() {
    setCompleting(true);
    try {
      await apiClient.patch(`/orders/${order._id}/complete`);
      onDone(order._id);
    } catch { alert("Failed to complete order"); }
    finally { setCompleting(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 26, width: 360, maxWidth: "92vw", boxShadow: "0 24px 70px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>Bill</h3>
        <p style={{ margin: "0 0 16px", fontSize: 11, color: "#86868B" }}>
          {order.customerName && order.customerName !== "Walk-in" ? order.customerName : "Walk-in"}
          {order.tableLabel && ` · ${order.tableLabel}`}
          {order.customerPhone && ` · ${order.customerPhone}`}
        </p>

        {/* items */}
        <div style={{ background: "#F5F5F7", borderRadius: 12, padding: "10px 12px", marginBottom: 16 }}>
          {allItems.map((i, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
              <span>{i.name} × {i.quantity}</span>
              <span style={{ fontWeight: 600 }}>{(i.price * i.quantity).toFixed(2)} AED</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", marginTop: 8, paddingTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#86868B", marginBottom: 2 }}><span>Subtotal</span><span>{subtotal.toFixed(2)} AED</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#86868B", marginBottom: 4 }}><span>VAT ({vatPct}%)</span><span>{vat.toFixed(2)} AED</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 800 }}><span>Total</span><span style={{ color: "#0071E3" }}>{total.toFixed(2)} AED</span></div>
          </div>
        </div>

        {/* actions */}
        <button onClick={handlePrint} style={{ ...ghostBtn, width: "100%", marginBottom: 8, textAlign: "center", fontSize: 14 }}>
          🖨️ Print Bill
        </button>
        <button onClick={handleDone} disabled={completing} style={{ ...primaryBtn, width: "100%", textAlign: "center", fontSize: 14, opacity: completing ? 0.5 : 1 }}>
          {completing ? "Completing…" : "✅ Done — Mark Complete"}
        </button>
        <button onClick={onClose} style={{ ...ghostBtn, width: "100%", marginTop: 8, textAlign: "center", fontSize: 13, color: "#86868B" }}>
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Active Orders Panel (replaces sidebar) ────────────────────────────────────
function ActiveOrdersPanel({ orders, vatPct, onBack, onOrderDone }) {
  const [selectedOrder, setSelectedOrder] = useState(null);

  function getItemNames(order) {
    const items = (order.rounds || []).flatMap(r => r.items || []);
    const counts = {};
    items.forEach(i => { counts[i.name] = (counts[i.name] || 0) + (i.quantity || 1); });
    return Object.entries(counts).map(([n, q]) => q > 1 ? `${n} ×${q}` : n).join(", ");
  }

  function getTotal(order) {
    const sub = (order.rounds || []).flatMap(r => r.items || []).reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
    return sub + (sub * vatPct) / 100;
  }

  const statusColor = { confirmed: "#34C759", preparing: "#FF9500", ready: "#0071E3" };
  const typeIcon    = { pickup: "🛍️", delivery: "🚗", dineIn: "🍽️" };

  return (
    <div style={{ width: 196, minWidth: 196, height: "100vh", background: "rgba(250,250,250,0.96)", borderRight: "1px solid rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      {/* header */}
      <div style={{ padding: "14px 12px 10px", borderBottom: "1px solid rgba(0,0,0,0.06)", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#0071E3", fontSize: 12, fontWeight: 700, padding: 0, marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
          ← Back to menu
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>Active Orders</div>
        <div style={{ fontSize: 10, color: "#86868B", marginTop: 1 }}>{orders.length} order{orders.length !== 1 ? "s" : ""}</div>
      </div>

      {/* list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: "center", color: "#C7C7CC", fontSize: 11, paddingTop: 40 }}>No active orders</div>
        ) : orders.map(order => (
          <div key={order._id} onClick={() => setSelectedOrder(order)}
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 10, padding: "8px 9px", marginBottom: 5, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#0071E3"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(0,0,0,0.07)"}>
            {/* top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <span style={{ fontSize: 13 }}>{typeIcon[order.orderType] || "📦"}</span>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor[order.status] || "#86868B", flexShrink: 0 }} />
            </div>
            {/* item names */}
            <div style={{ fontSize: 11, fontWeight: 600, color: "#1D1D1F", lineHeight: 1.35, marginBottom: 3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {getItemNames(order)}
            </div>
            {/* total */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0071E3", marginBottom: 2 }}>
              {getTotal(order).toFixed(2)} AED
            </div>
            {/* meta */}
            <div style={{ fontSize: 10, color: "#86868B", lineHeight: 1.5 }}>
              {order.customerName && order.customerName !== "Walk-in" && <div>👤 {order.customerName}</div>}
              {order.customerPhone && <div>📞 {order.customerPhone}</div>}
              {order.tableLabel && <div>🪑 {order.tableLabel}</div>}
              {order.deliveryAddress && <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {order.deliveryAddress}</div>}
              {order.scheduledTime && <div>⏰ {new Date(order.scheduledTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dubai" })}</div>}
            </div>
            <div style={{ marginTop: 5, fontSize: 10, color: "#0071E3", fontWeight: 600 }}>Tap for bill →</div>
          </div>
        ))}
      </div>

      {/* bill modal */}
      {selectedOrder && (
        <BillModal
          order={selectedOrder}
          vatPct={vatPct}
          onDone={(id) => { onOrderDone(id); setSelectedOrder(null); }}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

// ─── Order Confirm Modal ───────────────────────────────────────────────────────
function OrderModal({ cartItems, vatPct, tables, onConfirm, onClose }) {
  const [type,            setType]            = useState(null);
  const [customerName,    setCustomerName]    = useState("");
  const [customerPhone,   setCustomerPhone]   = useState("");
  const [scheduledTime,   setScheduledTime]   = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [tableId,         setTableId]         = useState("");
  const [sending,         setSending]         = useState(false);

  // Guard: ensure cartItems is always an array
  const safeCart = Array.isArray(cartItems) ? cartItems : [];

  const subtotal = safeCart.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
  const vat      = (subtotal * vatPct) / 100;
  const total    = subtotal + vat;

  const TYPES = [
    { value: "walkin",   icon: "🚶", label: "Walk-in",  desc: "Immediate" },
    { value: "pickup",   icon: "⏰", label: "Pickup",   desc: "Scheduled" },
    { value: "delivery", icon: "🚗", label: "Delivery", desc: "To address" },
    { value: "dinein",   icon: "🍽️", label: "Dine-in",  desc: "Table" },
  ];

  const needsTime    = type === "pickup" || type === "delivery";
  const needsAddress = type === "delivery";
  const needsTable   = type === "dinein";
  const canConfirm   = type &&
    (needsTime    ? !!scheduledTime   : true) &&
    (needsAddress ? !!deliveryAddress : true) &&
    (needsTable   ? !!tableId         : true);

  async function handleConfirm() {
    if (!safeCart.length) { alert("Cart is empty"); return; }
    setSending(true);
    try {
      const items = safeCart.map(i => ({ name: i.name, quantity: i.qty, price: i.price, extras: i.extras || [], notes: i.notes || null }));
      if (type === "dinein") {
        await apiClient.post("/orders/table", { tableId, items, customerName: customerName || "Walk-in" });
      } else {
        await apiClient.post("/orders/pickup", {
          customerName: customerName || "Walk-in",
          customerPhone: customerPhone || null,
          orderType: type === "delivery" ? "delivery" : "pickup",
          scheduledTime: needsTime && scheduledTime ? new Date(scheduledTime).toISOString() : null,
          deliveryAddress: needsAddress ? deliveryAddress : null,
          items,
        });
      }
      onConfirm();
    } catch (e) {
      console.error(e);
      alert("Failed to create order. Check console.");
    } finally { setSending(false); }
  }

  const availableTables = (tables || []).filter(t => t.status === "available");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 26, width: 460, maxWidth: "94vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>

        <h3 style={{ margin: "0 0 14px", fontSize: 17, fontWeight: 700 }}>Confirm Order</h3>

        {/* cart summary */}
        <div style={{ background: "rgba(0,113,227,0.04)", borderRadius: 12, padding: "10px 12px", marginBottom: 18 }}>
          {safeCart.length === 0 ? (
            <div style={{ color: "#86868B", fontSize: 13 }}>No items in cart</div>
          ) : safeCart.map((i, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
              <span>{i.name} × {i.qty}</span>
              <span style={{ fontWeight: 600 }}>{((i.price || 0) * (i.qty || 0)).toFixed(2)} AED</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", marginTop: 8, paddingTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#86868B" }}><span>Subtotal</span><span>{subtotal.toFixed(2)} AED</span></div>
            {vatPct > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#86868B" }}><span>VAT ({vatPct}%)</span><span>{vat.toFixed(2)} AED</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, marginTop: 4 }}><span>Total</span><span style={{ color: "#0071E3" }}>{total.toFixed(2)} AED</span></div>
          </div>
        </div>

        {/* order type */}
        <label style={{ fontSize: 11, color: "#86868B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Order Type</label>
        <div style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 16 }}>
          {TYPES.map(t => (
            <button key={t.value} onClick={() => { setType(t.value); setScheduledTime(""); }} style={{ flex: 1, padding: "10px 4px", borderRadius: 12, border: "1.5px solid", borderColor: type === t.value ? "#0071E3" : "rgba(0,0,0,0.10)", background: type === t.value ? "rgba(0,113,227,0.07)" : "#fff", cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 3 }}>{t.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: type === t.value ? "#0071E3" : "#1D1D1F" }}>{t.label}</div>
              <div style={{ fontSize: 10, color: "#86868B" }}>{t.desc}</div>
            </button>
          ))}
        </div>

        {type && (
          <>
            {type !== "dinein" && (
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "#86868B", fontWeight: 500, display: "block", marginBottom: 4 }}>Name</label>
                  <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "#86868B", fontWeight: 500, display: "block", marginBottom: 4 }}>Phone</label>
                  <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+971…" style={inputStyle} />
                </div>
              </div>
            )}

            {needsTable && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "#86868B", fontWeight: 500, display: "block", marginBottom: 4 }}>Table</label>
                <select value={tableId} onChange={e => setTableId(e.target.value)} style={inputStyle}>
                  <option value="">— select table —</option>
                  {availableTables.map(t => (
                    <option key={t._id} value={t._id}>{t.name || t.label || `Table ${t.tableNumber}`} (seats {t.capacity})</option>
                  ))}
                </select>
              </div>
            )}

            {needsTime && <TimePicker value={scheduledTime} onChange={setScheduledTime} label={type === "delivery" ? "Delivery Time" : "Pickup Time"} />}

            {needsAddress && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "#86868B", fontWeight: 500, display: "block", marginBottom: 4 }}>Delivery Address</label>
                <textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Enter delivery address…" rows={2} style={{ ...inputStyle, resize: "none" }} />
              </div>
            )}
          </>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button onClick={handleConfirm} disabled={!canConfirm || sending || safeCart.length === 0} style={{ ...primaryBtn, flex: 1, opacity: (!canConfirm || sending || safeCart.length === 0) ? 0.5 : 1 }}>
            {sending ? "Creating…" : "✅ Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Booking Modal ─────────────────────────────────────────────────────────────
function BookingModal({ onConfirm, onClose, loading }) {
  const [name, setName] = useState(""); const [guests, setGuests] = useState(2);
  const [phone, setPhone] = useState(""); const [notes, setNotes] = useState("");
  const [startTime, setStartTime] = useState("");
  const valid = name.trim() && guests > 0 && startTime;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 26, width: 420, maxWidth: "92vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 18px", fontSize: 17, fontWeight: 700 }}>📅 New Booking</h3>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}><label style={{ fontSize: 11, color: "#86868B", display: "block", marginBottom: 4 }}>Guest Name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sara" style={inputStyle} /></div>
          <div style={{ width: 80 }}><label style={{ fontSize: 11, color: "#86868B", display: "block", marginBottom: 4 }}>Guests</label><input type="number" min={1} max={20} value={guests} onChange={e => setGuests(Number(e.target.value))} style={inputStyle} /></div>
        </div>
        <div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, color: "#86868B", display: "block", marginBottom: 4 }}>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+971…" type="tel" style={inputStyle} /></div>
        <div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, color: "#86868B", display: "block", marginBottom: 4 }}>Notes</label><input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special requests…" style={inputStyle} /></div>
        <TimePicker value={startTime} onChange={setStartTime} label="Booking Time *" />
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button disabled={!valid || loading} onClick={() => onConfirm({ customerName: name, partySize: guests, customerPhone: phone, notes, startTime })} style={{ ...primaryBtn, flex: 1, opacity: (!valid || loading) ? 0.5 : 1 }}>
            {loading ? "Creating…" : "Create Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Menu Item Card ────────────────────────────────────────────────────────────
function MenuItemCard({ item, qty, onAdd, onRemove }) {
  return (
    <div onClick={onAdd} style={{ background: qty > 0 ? "rgba(0,113,227,0.04)" : "#fff", border: `1.5px solid ${qty > 0 ? "#0071E3" : "rgba(0,0,0,0.08)"}`, borderRadius: 12, padding: "11px 10px", cursor: "pointer", transition: "all 150ms", display: "flex", flexDirection: "column", gap: 3, position: "relative", userSelect: "none" }}>
      {qty > 0 && <div style={{ position: "absolute", top: 7, right: 7, width: 20, height: 20, borderRadius: "50%", background: "#0071E3", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{qty}</div>}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", lineHeight: 1.3, paddingRight: qty > 0 ? 22 : 0 }}>{item.name}</div>
      <div style={{ fontSize: 11, color: "#0071E3", fontWeight: 700 }}>{item.price} {item.currency || "AED"}</div>
      {item.description && <div style={{ fontSize: 10, color: "#86868B", lineHeight: 1.4 }}>{item.description.length > 50 ? item.description.slice(0, 50) + "…" : item.description}</div>}
      {qty > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }} onClick={e => e.stopPropagation()}>
          <button onClick={onRemove} style={qtyBtn}>−</button>
          <span style={{ fontWeight: 700, fontSize: 13, minWidth: 18, textAlign: "center" }}>{qty}</span>
          <button onClick={onAdd}    style={qtyBtn}>+</button>
        </div>
      )}
    </div>
  );
}

// ─── Swipeable Pages ───────────────────────────────────────────────────────────
function SwipeablePages({ categories, grouped, cart, onAdd, onRemove, activePage, onPageChange }) {
  const startX = useRef(null); const dragging = useRef(false); const mouseX = useRef(null);
  return (
    <div style={{ flex: 1, overflow: "hidden", position: "relative" }}
      onTouchStart={e => { startX.current = e.touches[0].clientX; dragging.current = false; }}
      onTouchMove={e  => { if (startX.current !== null && Math.abs(e.touches[0].clientX - startX.current) > 8) dragging.current = true; }}
      onTouchEnd={e   => { if (!dragging.current || startX.current === null) { startX.current = null; return; } const dx = e.changedTouches[0].clientX - startX.current; startX.current = null; if (dx < -50 && activePage < categories.length - 1) onPageChange(activePage + 1); if (dx > 50 && activePage > 0) onPageChange(activePage - 1); }}
      onMouseDown={e  => { mouseX.current = e.clientX; }}
      onMouseUp={e    => { if (mouseX.current === null) return; const dx = e.clientX - mouseX.current; mouseX.current = null; if (Math.abs(dx) < 10) return; if (dx < -50 && activePage < categories.length - 1) onPageChange(activePage + 1); if (dx > 50 && activePage > 0) onPageChange(activePage - 1); }}
    >
      <div style={{ display: "flex", width: `${categories.length * 100}%`, height: "100%", transform: `translateX(-${activePage * (100 / categories.length)}%)`, transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
        {categories.map(cat => (
          <div key={cat} style={{ width: `${100 / categories.length}%`, height: "100%", overflowY: "auto", padding: "14px 18px", boxSizing: "border-box" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#86868B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>{cat} ({grouped[cat].length})</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 9 }}>
              {grouped[cat].map(item => (
                <MenuItemCard key={item._id} item={item} qty={cart[item._id]?.qty || 0} onAdd={() => onAdd(item)} onRemove={() => onRemove(item._id)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function ManualOrders() {
  const [menu,           setMenu]           = useState([]);
  const [menuLoading,    setMenuLoading]    = useState(true);
  const [vatPct,         setVatPct]         = useState(5);
  const [tables,         setTables]         = useState([]);
  const [activePage,     setActivePage]     = useState(0);
  const [cart,           setCart]           = useState({}); // { id: { ...item, qty } }
  const [showOrder,      setShowOrder]      = useState(false);
  const [showBooking,    setShowBooking]    = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast,          setToast]          = useState(null);
  const [activeOrders,   setActiveOrders]   = useState([]);
  const [showPanel,      setShowPanel]      = useState(false);

  useEffect(() => {
    async function load() {
      setMenuLoading(true);
      try {
        const [agentData, bizData, tablesRes] = await Promise.all([getAgentMe(), getBusinessMe(), apiClient.get("/tables")]);
        // agentData shape: { agent: { menu: [...] } } OR { menu: [...] } — handle both
        const rawMenu = agentData?.agent?.menu ?? agentData?.menu ?? [];
        setMenu(Array.isArray(rawMenu) ? rawMenu.filter(m => m.available) : []);
        setVatPct(bizData?.business?.vatPercentage ?? bizData?.vatPercentage ?? 5);
        const rawTables = tablesRes?.data;
        setTables(Array.isArray(rawTables) ? rawTables : rawTables?.tables ?? rawTables?.data ?? []);
      } catch (e) { console.error(e); }
      finally { setMenuLoading(false); }
    }
    load();
    fetchActive();
    const iv = setInterval(fetchActive, 15000);
    return () => clearInterval(iv);
  }, []);

  async function fetchActive() {
    try {
      const res = await apiClient.get("/orders/manual/active");
      const raw = res?.data?.orders ?? res?.data ?? [];
      setActiveOrders(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.warn("fetchActive error:", e?.message);
    }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2800); }

  function addItem(item) {
    setCart(prev => {
      const ex = prev[item._id];
      return { ...prev, [item._id]: ex ? { ...ex, qty: ex.qty + 1 } : { ...item, qty: 1, notes: "" } };
    });
  }
  function removeItem(id) {
    setCart(prev => {
      const ex = prev[id]; if (!ex) return prev;
      if (ex.qty <= 1) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: { ...ex, qty: ex.qty - 1 } };
    });
  }

  // Always derive cartItems as array right before use
  const cartItems    = Object.values(cart).filter(i => i.qty > 0);
  const cartCount    = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  const grouped    = menu.reduce((acc, item) => { const c = item.category || "Other"; if (!acc[c]) acc[c] = []; acc[c].push(item); return acc; }, {});
  const categories = Object.keys(grouped);

  async function handleBookingConfirm({ customerName, partySize, customerPhone, notes, startTime }) {
    setBookingLoading(true);
    try {
      await apiClient.post("/bookings/manual", { customerName, partySize, customerPhone: customerPhone || null, notes: notes || null, startTime: new Date(startTime).toISOString() });
      setShowBooking(false); showToast("✅ Booking created");
    } catch { showToast("❌ Failed to create booking"); }
    finally { setBookingLoading(false); }
  }

  async function handleOrderConfirmed() {
    setCart({});
    setShowOrder(false);
    showToast("✅ Order created");
    await fetchActive();
    setShowPanel(true);
  }

  function handleOrderDone(id) {
    setActiveOrders(prev => prev.filter(o => o._id !== id));
    showToast("✅ Order completed");
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-page, #f5f5f7)" }}>

      {/* LEFT: Active orders panel OR nothing (sidebar lives in DashboardLayout) */}
      {showPanel && (
        <ActiveOrdersPanel
          orders={activeOrders}
          vatPct={vatPct}
          onBack={() => setShowPanel(false)}
          onOrderDone={handleOrderDone}
        />
      )}

      {/* RIGHT: Menu */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px 0", flexShrink: 0, gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!showPanel && activeOrders.length > 0 && (
              <button onClick={() => setShowPanel(true)} style={{ ...ghostBtn, display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "6px 12px" }}>
                📋 {activeOrders.length} active
              </button>
            )}
            <span style={{ fontSize: 12, color: "#86868B" }}>Tap items to add</span>
          </div>
          <button onClick={() => setShowBooking(true)} style={{ ...primaryBtn, fontSize: 12, padding: "8px 14px" }}>📅 New Booking</button>
        </div>

        {/* category tabs */}
        {!menuLoading && categories.length > 0 && (
          <div style={{ flexShrink: 0, padding: "10px 18px 0" }}>
            <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
              {categories.map((cat, idx) => (
                <button key={cat} onClick={() => setActivePage(idx)} style={{ padding: "5px 14px", borderRadius: 999, border: "1.5px solid", borderColor: activePage === idx ? "#0071E3" : "rgba(0,0,0,0.10)", background: activePage === idx ? "#0071E3" : "#fff", color: activePage === idx ? "#fff" : "#1D1D1F", fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {cat}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 5, paddingBottom: 6 }}>
              {categories.map((_, idx) => <div key={idx} onClick={() => setActivePage(idx)} style={{ width: activePage === idx ? 16 : 5, height: 5, borderRadius: 3, background: activePage === idx ? "#0071E3" : "rgba(0,0,0,0.15)", transition: "all 0.25s", cursor: "pointer" }} />)}
            </div>
          </div>
        )}

        {/* menu */}
        {menuLoading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#86868B" }}>Loading menu…</div>
        ) : menu.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#86868B" }}>No menu items.</div>
        ) : (
          <SwipeablePages categories={categories} grouped={grouped} cart={cart} onAdd={addItem} onRemove={removeItem} activePage={activePage} onPageChange={setActivePage} />
        )}

        {/* cart bar */}
        {cartCount > 0 && (
          <div style={{ flexShrink: 0, background: "rgba(255,255,255,0.94)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(0,0,0,0.08)", padding: "11px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#1D1D1F" }}>{cartCount} item{cartCount !== 1 ? "s" : ""}</span>
              <span style={{ fontSize: 12, color: "#86868B", marginLeft: 8 }}>{cartSubtotal.toFixed(2)} AED{vatPct > 0 && ` + ${((cartSubtotal * vatPct) / 100).toFixed(2)} VAT`}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setCart({})} style={ghostBtn}>Clear</button>
              <button onClick={() => setShowOrder(true)} style={primaryBtn}>Confirm Order →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showOrder && (
        <OrderModal
          cartItems={cartItems}
          vatPct={vatPct}
          tables={tables}
          onConfirm={handleOrderConfirmed}
          onClose={() => setShowOrder(false)}
        />
      )}
      {showBooking && (
        <BookingModal onConfirm={handleBookingConfirm} onClose={() => setShowBooking(false)} loading={bookingLoading} />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)", background: "#1D1D1F", color: "#fff", padding: "11px 22px", borderRadius: 100, fontSize: 13, fontWeight: 500, zIndex: 3000, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

const primaryBtn = { padding: "9px 18px", borderRadius: 12, border: "none", background: "#0071E3", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const ghostBtn   = { padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const inputStyle = { width: "100%", padding: "9px 11px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13, boxSizing: "border-box", outline: "none", fontFamily: "inherit" };
const qtyBtn     = { width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(0,0,0,0.04)", cursor: "pointer", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" };