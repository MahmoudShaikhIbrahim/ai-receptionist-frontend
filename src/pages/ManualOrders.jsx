// src/pages/ManualOrders.jsx
import { useEffect, useRef, useState } from "react";
import { getAgentMe } from "../api/api";
import { getBusinessMe } from "../api/business";
import apiClient from "../api/client";

// ─── Scroll Wheel Time Picker ──────────────────────────────────────────────────
function ScrollPicker({ items, value, onChange, width = 56 }) {
  const ref = useRef(null);
  const itemH = 40;

  useEffect(() => {
    const idx = items.indexOf(value);
    if (ref.current && idx >= 0) {
      ref.current.scrollTop = idx * itemH;
    }
  }, [value, items]);

  function handleScroll() {
    if (!ref.current) return;
    const idx = Math.round(ref.current.scrollTop / itemH);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (items[clamped] !== value) onChange(items[clamped]);
  }

  return (
    <div style={{ position: "relative", width, flexShrink: 0 }}>
      {/* selection highlight */}
      <div style={{
        position: "absolute", top: "50%", left: 0, right: 0,
        height: itemH, transform: "translateY(-50%)",
        background: "rgba(0,113,227,0.08)", borderRadius: 10,
        pointerEvents: "none", zIndex: 1,
      }} />
      <div
        ref={ref}
        onScroll={handleScroll}
        style={{
          height: itemH * 3,
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          position: "relative",
        }}
      >
        {/* padding top/bottom so first/last item can center */}
        <div style={{ height: itemH }} />
        {items.map(item => (
          <div
            key={item}
            onClick={() => onChange(item)}
            style={{
              height: itemH, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: item === value ? 700 : 400,
              color: item === value ? "#0071E3" : "#86868B",
              cursor: "pointer", scrollSnapAlign: "center",
              transition: "color 0.15s, font-weight 0.15s",
              userSelect: "none",
            }}
          >
            {item}
          </div>
        ))}
        <div style={{ height: itemH }} />
      </div>
    </div>
  );
}

function TimePicker({ value, onChange, label }) {
  const now = new Date();

  // Build day options
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return {
      value: d.toISOString().split("T")[0],
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    };
  });

  const hours   = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = ["00", "15", "30", "45"];
  const amPms   = ["AM", "PM"];

  const [date,   setDate]   = useState(() => value ? value.split("T")[0] : days[0].value);
  const [hour,   setHour]   = useState(() => {
    const h = value ? parseInt(value.split("T")[1]?.split(":")[0] || "12") : now.getHours();
    return String(h % 12 === 0 ? 12 : h % 12);
  });
  const [minute, setMinute] = useState(() => {
    const m = value ? value.split("T")[1]?.split(":")[1] || "00" : String(Math.ceil(now.getMinutes() / 15) * 15 % 60).padStart(2, "0");
    return minutes.includes(m) ? m : "00";
  });
  const [ampm, setAmpm] = useState(() => {
    const h = value ? parseInt(value.split("T")[1]?.split(":")[0] || "12") : now.getHours();
    return h >= 12 ? "PM" : "AM";
  });

  useEffect(() => {
    const h = parseInt(hour);
    const h24 = ampm === "PM" ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
    onChange(`${date}T${String(h24).padStart(2, "0")}:${minute}`);
  }, [date, hour, minute, ampm]);

  const selectedDay = days.find(d => d.value === date);

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, color: "#86868B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 10 }}>
        {label}
      </label>

      {/* Day selector — horizontal scroll pills */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
        {days.map(d => (
          <button key={d.value} onClick={() => setDate(d.value)} style={{
            padding: "7px 14px", borderRadius: 20, border: "1.5px solid",
            borderColor: date === d.value ? "#0071E3" : "rgba(0,0,0,0.10)",
            background: date === d.value ? "#0071E3" : "#fff",
            color: date === d.value ? "#fff" : "#1D1D1F",
            fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}>{d.label}</button>
        ))}
      </div>

      {/* Scroll wheels */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        background: "#F5F5F7", borderRadius: 14, padding: "8px 16px",
      }}>
        <ScrollPicker items={hours}   value={hour}   onChange={setHour}   width={52} />
        <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", paddingBottom: 2 }}>:</span>
        <ScrollPicker items={minutes} value={minute} onChange={setMinute} width={52} />
        <div style={{ width: 1, height: 40, background: "rgba(0,0,0,0.08)", margin: "0 6px" }} />
        <ScrollPicker items={amPms}  value={ampm}   onChange={setAmpm}   width={52} />
      </div>

      {/* Preview */}
      {value && (
        <div style={{ marginTop: 8, padding: "7px 12px", borderRadius: 10, background: "rgba(0,113,227,0.06)", fontSize: 13, fontWeight: 600, color: "#0071E3" }}>
          ⏰ {selectedDay?.label} · {hour}:{minute} {ampm}
        </div>
      )}
    </div>
  );
}

// ─── Order Confirm Modal ───────────────────────────────────────────────────────
function OrderModal({ cart, vatPct, tables, onConfirm, onClose }) {
  const [type,            setType]            = useState(null);
  const [customerName,    setCustomerName]    = useState("");
  const [customerPhone,   setCustomerPhone]   = useState("");
  const [scheduledTime,   setScheduledTime]   = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [tableId,         setTableId]         = useState("");
  const [sending,         setSending]         = useState(false);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const vat      = (subtotal * vatPct) / 100;
  const total    = subtotal + vat;

  const TYPES = [
    { value: "walkin",   icon: "🚶", label: "Walk-in",  desc: "Immediate" },
    { value: "pickup",   icon: "⏰", label: "Pickup",   desc: "Scheduled" },
    { value: "delivery", icon: "🚗", label: "Delivery", desc: "To address" },
    { value: "dinein",   icon: "🍽️", label: "Dine-in",  desc: "Table order" },
  ];

  const needsTime    = type === "pickup" || type === "delivery";
  const needsAddress = type === "delivery";
  const needsTable   = type === "dinein";
  const canConfirm   = type &&
    (needsTime    ? !!scheduledTime    : true) &&
    (needsAddress ? !!deliveryAddress  : true) &&
    (needsTable   ? !!tableId          : true);

  async function handleConfirm() {
    setSending(true);
    try {
      if (type === "dinein") {
        await apiClient.post("/orders/table", {
          tableId,
          items: cart.map(i => ({ name: i.name, quantity: i.qty, price: i.price, extras: i.extras || [], notes: i.notes || null })),
          customerName: customerName || "Walk-in",
        });
      } else {
        await apiClient.post("/orders/pickup", {
          customerName: customerName || "Walk-in",
          customerPhone: customerPhone || null,
          orderType: type === "delivery" ? "delivery" : "pickup",
          scheduledTime: needsTime && scheduledTime ? new Date(scheduledTime).toISOString() : null,
          deliveryAddress: needsAddress ? deliveryAddress : null,
          items: cart.map(i => ({ name: i.name, quantity: i.qty, price: i.price, extras: i.extras || [], notes: i.notes || null })),
        });
      }
      onConfirm();
    } catch { alert("Failed to create order"); }
    finally { setSending(false); }
  }

  const availableTables = tables.filter(t => t.status === "available");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: 460, maxWidth: "92vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>

        <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>Confirm Order</h3>

        {/* cart summary */}
        <div style={{ background: "rgba(0,113,227,0.04)", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
          {cart.map((i, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
              <span>{i.name} × {i.qty}</span>
              <span style={{ fontWeight: 600 }}>{(i.price * i.qty).toFixed(2)} AED</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", marginTop: 8, paddingTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "#86868B" }}>Subtotal</span><span>{subtotal.toFixed(2)} AED</span></div>
            {vatPct > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "#86868B" }}>VAT ({vatPct}%)</span><span>{vat.toFixed(2)} AED</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, marginTop: 4 }}><span>Total</span><span style={{ color: "#0071E3" }}>{total.toFixed(2)} AED</span></div>
          </div>
        </div>

        {/* type selector */}
        <label style={fieldLabel}>Order Type</label>
        <div style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 18 }}>
          {TYPES.map(t => (
            <button key={t.value} onClick={() => setType(t.value)} style={{
              flex: 1, padding: "10px 4px", borderRadius: 12, border: "1.5px solid",
              borderColor: type === t.value ? "#0071E3" : "rgba(0,0,0,0.10)",
              background: type === t.value ? "rgba(0,113,227,0.07)" : "#fff",
              cursor: "pointer", textAlign: "center",
            }}>
              <div style={{ fontSize: 18, marginBottom: 3 }}>{t.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: type === t.value ? "#0071E3" : "#1D1D1F" }}>{t.label}</div>
              <div style={{ fontSize: 10, color: "#86868B" }}>{t.desc}</div>
            </button>
          ))}
        </div>

        {type && (
          <>
            {/* name + phone (not for dine-in) */}
            {type !== "dinein" && (
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Name</label>
                  <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name" style={{ ...inputStyle, marginTop: 4 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Phone</label>
                  <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+971…" style={{ ...inputStyle, marginTop: 4 }} />
                </div>
              </div>
            )}

            {/* table selector for dine-in */}
            {needsTable && (
              <div style={{ marginBottom: 14 }}>
                <label style={fieldLabel}>Table</label>
                <select value={tableId} onChange={e => setTableId(e.target.value)} style={{ ...inputStyle, marginTop: 4 }}>
                  <option value="">— select table —</option>
                  {availableTables.map(t => (
                    <option key={t._id} value={t._id}>{t.name || t.label || `Table ${t.tableNumber}`} (seats {t.capacity})</option>
                  ))}
                </select>
              </div>
            )}

            {/* time picker */}
            {needsTime && (
              <TimePicker value={scheduledTime} onChange={setScheduledTime} label={type === "delivery" ? "Delivery Time" : "Pickup Time"} />
            )}

            {/* delivery address — plain textarea */}
            {needsAddress && (
              <div style={{ marginBottom: 14 }}>
                <label style={fieldLabel}>Delivery Address</label>
                <textarea
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="Enter delivery address…"
                  rows={2}
                  style={{ ...inputStyle, marginTop: 4, resize: "none", height: "auto" }}
                />
              </div>
            )}
          </>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button onClick={handleConfirm} disabled={!canConfirm || sending} style={{ ...primaryBtn, flex: 1, opacity: (!canConfirm || sending) ? 0.5 : 1 }}>
            {sending ? "Creating…" : "✅ Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Booking Modal ─────────────────────────────────────────────────────────────
function BookingModal({ onConfirm, onClose, loading }) {
  const [name,      setName]      = useState("");
  const [guests,    setGuests]    = useState(2);
  const [phone,     setPhone]     = useState("");
  const [notes,     setNotes]     = useState("");
  const [startTime, setStartTime] = useState("");
  const valid = name.trim() && guests > 0 && startTime;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: 420, maxWidth: "92vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700 }}>📅 New Booking</h3>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>Guest Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sara" style={{ ...inputStyle, marginTop: 4 }} />
          </div>
          <div style={{ width: 80 }}>
            <label style={fieldLabel}>Guests</label>
            <input type="number" min={1} max={20} value={guests} onChange={e => setGuests(Number(e.target.value))} style={{ ...inputStyle, marginTop: 4 }} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={fieldLabel}>Phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+971…" type="tel" style={{ ...inputStyle, marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={fieldLabel}>Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special requests…" style={{ ...inputStyle, marginTop: 4 }} />
        </div>
        <TimePicker value={startTime} onChange={setStartTime} label="Booking Time *" />
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button disabled={!valid || loading} onClick={() => onConfirm({ customerName: name, partySize: guests, customerPhone: phone, notes, startTime })} style={{ ...primaryBtn, flex: 1, opacity: (!valid || loading) ? 0.5 : 1 }}>
            {loading ? "Creating…" : "Create Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ order, vatPct, onPaid, onClose }) {
  const [printing, setPrinting] = useState(false);
  const [paying,   setPaying]   = useState(false);

  const allItems  = (order.rounds || []).flatMap(r => r.items || []);
  const subtotal  = allItems.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
  const vat       = (subtotal * vatPct) / 100;
  const total     = subtotal + vat;

  function handlePrint() {
    setPrinting(true);
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Bill</title><style>
        body{font-family:-apple-system,sans-serif;padding:32px;max-width:380px;margin:0 auto;}
        h2{margin:0 0 4px;font-size:20px;}
        .sub{color:#86868B;font-size:12px;margin-bottom:20px;}
        .item{display:flex;justify-content:space-between;margin-bottom:6px;font-size:14px;}
        hr{border:none;border-top:1px solid #E5E5EA;margin:14px 0;}
        .row{display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;}
        .total{font-size:18px;font-weight:800;color:#0071E3;}
        .footer{margin-top:28px;text-align:center;color:#86868B;font-size:12px;}
      </style></head><body>
        <h2>${order.orderType === "delivery" ? "Delivery" : order.orderType === "dineIn" ? "Dine-in" : "Pickup"} Order</h2>
        <div class="sub">
          ${order.customerName || "Walk-in"}
          ${order.customerPhone ? " · " + order.customerPhone : ""}
          ${order.scheduledTime ? " · " + new Date(order.scheduledTime).toLocaleString("en-US", { timeZone: "Asia/Dubai" }) : ""}
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
      </body></html>
    `);
    win.document.close();
    win.print();
    setPrinting(false);
  }

  async function handlePay(method) {
    setPaying(true);
    try {
      await apiClient.patch(`/orders/${order._id}/complete`);
      onPaid(order._id);
    } catch { alert("Failed to complete order"); }
    finally { setPaying(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: 380, maxWidth: "92vw", boxShadow: "0 24px 70px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>

        <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700 }}>Payment</h3>
        <p style={{ margin: "0 0 18px", fontSize: 12, color: "#86868B" }}>
          {order.customerName || "Walk-in"} · {order.orderType}
        </p>

        {/* bill summary */}
        <div style={{ background: "#F5F5F7", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
          {allItems.map((i, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
              <span>{i.name} × {i.quantity}</span>
              <span style={{ fontWeight: 600 }}>{(i.price * i.quantity).toFixed(2)} AED</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", marginTop: 8, paddingTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#86868B", marginBottom: 2 }}><span>Subtotal</span><span>{subtotal.toFixed(2)} AED</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#86868B", marginBottom: 4 }}><span>VAT ({vatPct}%)</span><span>{vat.toFixed(2)} AED</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 800 }}><span>Total</span><span style={{ color: "#0071E3" }}>{total.toFixed(2)} AED</span></div>
          </div>
        </div>

        {/* print bill */}
        <button onClick={handlePrint} disabled={printing} style={{ ...ghostBtn, width: "100%", marginBottom: 12, textAlign: "center" }}>
          🖨️ Print Bill
        </button>

        {/* payment method */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button onClick={() => handlePay("cash")} disabled={paying} style={{ ...primaryBtn, background: "#34C759", padding: "14px", fontSize: 14, borderRadius: 14 }}>
            💵 Cash
          </button>
          <button onClick={() => handlePay("credit")} disabled={paying} style={{ ...primaryBtn, background: "#0071E3", padding: "14px", fontSize: 14, borderRadius: 14 }}>
            💳 Credit
          </button>
        </div>

        <button onClick={onClose} style={{ ...ghostBtn, width: "100%", marginTop: 10, textAlign: "center" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Active Orders Panel ───────────────────────────────────────────────────────
function ActiveOrdersPanel({ orders, vatPct, onBack, onOrderPaid }) {
  const [payingOrder, setPayingOrder] = useState(null);

  function getItemNames(order) {
    const items = (order.rounds || []).flatMap(r => r.items || []);
    const counts = {};
    items.forEach(i => { counts[i.name] = (counts[i.name] || 0) + (i.quantity || 1); });
    return Object.entries(counts).map(([n, q]) => q > 1 ? `${n} ×${q}` : n).join(", ");
  }

  function getTotal(order) {
    const sub = (order.rounds || []).flatMap(r => r.items || []).reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
    const vat  = (sub * vatPct) / 100;
    return { sub, vat, total: sub + vat };
  }

  const statusColors = {
    confirmed: { bg: "rgba(52,199,89,0.12)",  color: "#166534" },
    preparing: { bg: "rgba(255,149,0,0.12)",  color: "#92400E" },
    ready:     { bg: "rgba(0,113,227,0.10)",  color: "#0071E3" },
  };

  const typeIcon = { pickup: "🛍️", delivery: "🚗", dineIn: "🍽️" };

  return (
    <div style={{
      width: 196, minWidth: 196, height: "100vh",
      background: "#fff",
      borderRight: "1px solid rgba(0,0,0,0.08)",
      display: "flex", flexDirection: "column",
      flexShrink: 0,
    }}>
      {/* header */}
      <div style={{ padding: "16px 12px 10px", borderBottom: "1px solid rgba(0,0,0,0.06)", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#0071E3", fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
          ← Sidebar
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>Active Orders</div>
        <div style={{ fontSize: 11, color: "#86868B", marginTop: 2 }}>{orders.length} active</div>
      </div>

      {/* orders list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: "center", color: "#C7C7CC", fontSize: 11, paddingTop: 32 }}>No active orders</div>
        ) : orders.map(order => {
          const { total } = getTotal(order);
          const sc = statusColors[order.status] || { bg: "rgba(0,0,0,0.05)", color: "#86868B" };

          return (
            <div
              key={order._id}
              onClick={() => setPayingOrder(order)}
              style={{
                background: "#F9F9FB",
                border: "1px solid rgba(0,0,0,0.07)",
                borderRadius: 10, padding: "9px 10px",
                marginBottom: 6, cursor: "pointer",
                transition: "box-shadow 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
            >
              {/* type icon + status */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>{typeIcon[order.orderType] || "📦"}</span>
                <span style={{ padding: "2px 7px", borderRadius: 999, fontSize: 9, fontWeight: 700, background: sc.bg, color: sc.color, textTransform: "capitalize" }}>
                  {order.status}
                </span>
              </div>

              {/* item names */}
              <div style={{ fontSize: 11, fontWeight: 600, color: "#1D1D1F", lineHeight: 1.4, marginBottom: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {getItemNames(order)}
              </div>

              {/* total */}
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0071E3", marginBottom: 3 }}>
                {total.toFixed(2)} AED
              </div>

              {/* meta */}
              <div style={{ fontSize: 10, color: "#86868B", lineHeight: 1.6 }}>
                {order.customerName && order.customerName !== "Walk-in" && <div>👤 {order.customerName}</div>}
                {order.customerPhone && <div>📞 {order.customerPhone}</div>}
                {order.scheduledTime && <div>⏰ {new Date(order.scheduledTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dubai" })}</div>}
                {order.deliveryAddress && <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {order.deliveryAddress}</div>}
                {order.tableLabel && <div>🪑 {order.tableLabel}</div>}
              </div>

              {/* tap hint */}
              <div style={{ marginTop: 6, fontSize: 10, color: "#0071E3", fontWeight: 600 }}>
                Tap to pay →
              </div>
            </div>
          );
        })}
      </div>

      {/* payment modal */}
      {payingOrder && (
        <PaymentModal
          order={payingOrder}
          vatPct={vatPct}
          onPaid={(id) => {
            onOrderPaid(id);
            setPayingOrder(null);
          }}
          onClose={() => setPayingOrder(null)}
        />
      )}
    </div>
  );
}

// ─── Menu Item Card ────────────────────────────────────────────────────────────
function MenuItemCard({ item, qty, onAdd, onRemove }) {
  return (
    <div onClick={onAdd} style={{
      background: qty > 0 ? "rgba(0,113,227,0.04)" : "#fff",
      border: `1.5px solid ${qty > 0 ? "#0071E3" : "rgba(0,0,0,0.08)"}`,
      borderRadius: 12, padding: "12px 10px",
      cursor: "pointer", transition: "all 150ms",
      display: "flex", flexDirection: "column", gap: 4,
      position: "relative", userSelect: "none",
    }}>
      {qty > 0 && (
        <div style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%", background: "#0071E3", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {qty}
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", lineHeight: 1.3, paddingRight: qty > 0 ? 24 : 0 }}>
        {item.name}
      </div>
      <div style={{ fontSize: 12, color: "#0071E3", fontWeight: 700 }}>
        {item.price} {item.currency || "AED"}
      </div>
      {item.description && (
        <div style={{ fontSize: 11, color: "#86868B", lineHeight: 1.4, marginTop: 2 }}>
          {item.description.length > 55 ? item.description.slice(0, 55) + "…" : item.description}
        </div>
      )}
      {qty > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }} onClick={e => e.stopPropagation()}>
          <button onClick={onRemove} style={qtyBtnStyle}>−</button>
          <span style={{ fontWeight: 700, fontSize: 14, minWidth: 20, textAlign: "center" }}>{qty}</span>
          <button onClick={onAdd} style={qtyBtnStyle}>+</button>
        </div>
      )}
    </div>
  );
}

// ─── Swipeable Pages ───────────────────────────────────────────────────────────
function SwipeablePages({ categories, grouped, cart, onAdd, onRemove, activePage, onPageChange }) {
  const startXRef = useRef(null);
  const dragging  = useRef(false);
  const mouseStart = useRef(null);

  function handleTouchStart(e) { startXRef.current = e.touches[0].clientX; dragging.current = false; }
  function handleTouchMove(e)  { if (startXRef.current !== null && Math.abs(e.touches[0].clientX - startXRef.current) > 8) dragging.current = true; }
  function handleTouchEnd(e) {
    if (!dragging.current || startXRef.current === null) { startXRef.current = null; return; }
    const dx = e.changedTouches[0].clientX - startXRef.current;
    startXRef.current = null;
    if (dx < -50 && activePage < categories.length - 1) onPageChange(activePage + 1);
    if (dx >  50 && activePage > 0)                    onPageChange(activePage - 1);
  }
  function handleMouseDown(e) { mouseStart.current = e.clientX; }
  function handleMouseUp(e) {
    if (mouseStart.current === null) return;
    const dx = e.clientX - mouseStart.current;
    mouseStart.current = null;
    if (Math.abs(dx) < 10) return;
    if (dx < -50 && activePage < categories.length - 1) onPageChange(activePage + 1);
    if (dx >  50 && activePage > 0)                    onPageChange(activePage - 1);
  }

  return (
    <div style={{ flex: 1, overflow: "hidden", position: "relative", cursor: "grab" }}
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}   onMouseUp={handleMouseUp}>
      <div style={{
        display: "flex", width: `${categories.length * 100}%`, height: "100%",
        transform: `translateX(-${activePage * (100 / categories.length)}%)`,
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {categories.map(cat => (
          <div key={cat} style={{ width: `${100 / categories.length}%`, height: "100%", overflowY: "auto", padding: "16px 20px", boxSizing: "border-box" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#86868B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              {cat} <span style={{ fontWeight: 400 }}>({grouped[cat].length})</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
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

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ManualOrders() {
  const [menu,           setMenu]           = useState([]);
  const [menuLoading,    setMenuLoading]    = useState(true);
  const [vatPct,         setVatPct]         = useState(5);
  const [tables,         setTables]         = useState([]);
  const [activePage,     setActivePage]     = useState(0);
  const [cart,           setCart]           = useState({});
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
        const [agentData, bizData, tablesRes] = await Promise.all([
          getAgentMe(),
          getBusinessMe(),
          apiClient.get("/tables"),
        ]);
        setMenu(agentData.agent?.menu?.filter(m => m.available) || []);
        setVatPct(bizData.business?.vatPercentage ?? 5);
        setTables(tablesRes.data || []);
      } catch {}
      finally { setMenuLoading(false); }
    }
    load();
    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchActiveOrders() {
    try {
      const res = await apiClient.get("/orders/manual/active");
      setActiveOrders(res.data.orders || []);
    } catch {}
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

  const cartItems    = Object.values(cart).filter(i => i.qty > 0);
  const cartCount    = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  const grouped    = menu.reduce((acc, item) => { const c = item.category || "Other"; if (!acc[c]) acc[c] = []; acc[c].push(item); return acc; }, {});
  const categories = Object.keys(grouped);

  async function handleBookingConfirm({ customerName, partySize, customerPhone, notes, startTime }) {
    setBookingLoading(true);
    try {
      await apiClient.post("/bookings/manual", { customerName, partySize, customerPhone: customerPhone || null, notes: notes || null, startTime: new Date(startTime).toISOString() });
      setShowBooking(false);
      showToast("✅ Booking created");
    } catch { showToast("❌ Failed to create booking"); }
    finally { setBookingLoading(false); }
  }

  async function handleOrderConfirmed() {
    setCart({});
    setShowOrder(false);
    showToast("✅ Order created");
    await fetchActiveOrders();
    setShowPanel(true); // show active orders panel
  }

  function handleOrderPaid(id) {
    setActiveOrders(prev => prev.filter(o => o._id !== id));
    showToast("✅ Order completed");
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-page, #f5f5f7)" }}>

      {/* ── LEFT: Active Orders Panel OR nothing (sidebar is in DashboardLayout) ── */}
      {showPanel && (
        <ActiveOrdersPanel
          orders={activeOrders}
          vatPct={vatPct}
          onBack={() => setShowPanel(false)}
          onOrderPaid={handleOrderPaid}
        />
      )}

      {/* ── RIGHT: Menu area ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!showPanel && activeOrders.length > 0 && (
              <button onClick={() => setShowPanel(true)} style={{ ...ghostBtn, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                📋 Orders
                <span style={{ background: "#FF3B30", color: "#fff", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>
                  {activeOrders.length}
                </span>
              </button>
            )}
            <p style={{ margin: 0, fontSize: 13, color: "#86868B" }}>Tap items to add to cart</p>
          </div>
          <button onClick={() => setShowBooking(true)} style={{ ...primaryBtn, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            📅 New Booking
          </button>
        </div>

        {/* category tabs */}
        {!menuLoading && categories.length > 0 && (
          <div style={{ flexShrink: 0, padding: "12px 20px 0" }}>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
              {categories.map((cat, idx) => (
                <button key={cat} onClick={() => setActivePage(idx)} style={{
                  padding: "6px 16px", borderRadius: 999, border: "1.5px solid",
                  borderColor: activePage === idx ? "#0071E3" : "rgba(0,0,0,0.10)",
                  background:  activePage === idx ? "#0071E3" : "#fff",
                  color:       activePage === idx ? "#fff"    : "#1D1D1F",
                  fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                }}>{cat}</button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 5, paddingBottom: 8 }}>
              {categories.map((_, idx) => (
                <div key={idx} onClick={() => setActivePage(idx)} style={{ width: activePage === idx ? 18 : 5, height: 5, borderRadius: 3, background: activePage === idx ? "#0071E3" : "rgba(0,0,0,0.15)", transition: "all 0.25s", cursor: "pointer" }} />
              ))}
            </div>
          </div>
        )}

        {/* menu grid */}
        {menuLoading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#86868B" }}>Loading menu…</div>
        ) : menu.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#86868B" }}>No menu items available.</div>
        ) : (
          <SwipeablePages categories={categories} grouped={grouped} cart={cart} onAdd={addItem} onRemove={removeItem} activePage={activePage} onPageChange={setActivePage} />
        )}

        {/* sticky cart bar */}
        {cartCount > 0 && (
          <div style={{
            flexShrink: 0,
            background: "rgba(255,255,255,0.94)", backdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(0,0,0,0.08)", padding: "12px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
          }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#1D1D1F" }}>{cartCount} item{cartCount !== 1 ? "s" : ""}</span>
              <span style={{ fontSize: 12, color: "#86868B", marginLeft: 10 }}>
                {cartSubtotal.toFixed(2)} AED{vatPct > 0 && ` + ${((cartSubtotal * vatPct) / 100).toFixed(2)} VAT`}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setCart({})} style={ghostBtn}>Clear</button>
              <button onClick={() => setShowOrder(true)} style={primaryBtn}>Confirm Order →</button>
            </div>
          </div>
        )}
      </div>

      {/* modals */}
      {showOrder   && <OrderModal   cart={cartItems} vatPct={vatPct} tables={tables} onConfirm={handleOrderConfirmed} onClose={() => setShowOrder(false)} />}
      {showBooking && <BookingModal onConfirm={handleBookingConfirm} onClose={() => setShowBooking(false)} loading={bookingLoading} />}

      {/* toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "#1D1D1F", color: "#fff", padding: "12px 24px", borderRadius: 100, fontSize: 14, fontWeight: 500, zIndex: 3000, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

const primaryBtn  = { padding: "9px 18px", borderRadius: 12, border: "none", background: "#0071E3", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const ghostBtn    = { padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const inputStyle  = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", fontSize: 14, boxSizing: "border-box", outline: "none", fontFamily: "inherit" };
const fieldLabel  = { fontSize: 12, color: "#86868B", fontWeight: 500, display: "block" };
const qtyBtnStyle = { width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(0,0,0,0.04)", cursor: "pointer", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" };