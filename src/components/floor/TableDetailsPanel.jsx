// src/components/floor/TableDetailsPanel.jsx
import { useEffect, useState } from "react";
import { getAgentMe } from "../../api/api";
import { getBusinessMe } from "../../api/business";

export default function TableDetailsPanel({ table, onClose }) {
  const [view, setView] = useState("info"); // "info" | "order" | "bill"
  const [menu, setMenu] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [vatPct, setVatPct] = useState(5);
  const [discount, setDiscount] = useState("");
  const [menuLoading, setMenuLoading] = useState(false);

  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  useEffect(() => {
    if (view === "order" && menu.length === 0) loadMenu();
  }, [view]);

  useEffect(() => {
    // Reset when table changes
    setView("info");
    setOrderItems([]);
    setDiscount("");
  }, [table?._id]);

  async function loadMenu() {
    setMenuLoading(true);
    try {
      const [agentData, bizData] = await Promise.all([getAgentMe(), getBusinessMe()]);
      const items = agentData.agent?.menu?.filter(m => m.available) || [];
      setMenu(items);
      setVatPct(bizData.business?.vatPercentage ?? 5);
    } catch {
      // silent
    } finally {
      setMenuLoading(false);
    }
  }

  function addItem(item) {
    setOrderItems(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) return prev.map(i => i._id === item._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
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

  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountAmount = discount ? Math.min(Number(discount), subtotal) : 0;
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = (afterDiscount * vatPct) / 100;
  const total = afterDiscount + vatAmount;

  const grouped = menu.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (!table) return null;
  const booking = table.booking;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={panelStyle} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {view !== "info" && (
              <button onClick={() => setView(view === "bill" ? "order" : "info")} style={backBtn}>←</button>
            )}
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              {view === "info" ? table.label : view === "order" ? "Table Order" : "Bill"}
            </h2>
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {/* INFO VIEW */}
        {view === "info" && (
          <>
            <StatusBadge status={table.status} />
            {booking ? (
              <div style={{ marginBottom: 20 }}>
                <InfoRow label="Customer" value={booking.customerName || "Walk-in"} />
                <InfoRow label="Phone" value={booking.customerPhone || "-"} />
                <InfoRow label="Guests" value={booking.partySize} />
                <InfoRow label="Time" value={
                  new Date(booking.startIso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dubai" }) +
                  " - " +
                  new Date(booking.endIso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dubai" })
                } />
                <InfoRow label="Source" value={booking.source} />
              </div>
            ) : (
              <p style={{ opacity: 0.6, marginBottom: 20 }}>No active booking</p>
            )}

            {table.status === "seated" && (
              <button
                style={orderBtn}
                onClick={() => setView("order")}
              >
                🍽 Table Order
              </button>
            )}
          </>
        )}

        {/* ORDER VIEW */}
        {view === "order" && (
          <>
            {menuLoading ? (
              <p style={{ color: "#86868B", textAlign: "center", padding: 20 }}>Loading menu…</p>
            ) : menu.length === 0 ? (
              <p style={{ color: "#86868B", textAlign: "center", padding: 20 }}>No menu items available.</p>
            ) : (
              <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
                {Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat} style={{ marginBottom: 20 }}>
                    <div style={catLabel}>{cat}</div>
                    {items.map(item => {
                      const qty = getQty(item._id);
                      return (
                        <div key={item._id} style={menuRow}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: "#0071E3", fontWeight: 700 }}>{item.price} {item.currency || "AED"}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
              </div>
            )}

            {/* Order Summary Bar */}
            {orderItems.length > 0 && (
              <div style={summaryBar}>
                <span style={{ fontWeight: 600 }}>{orderItems.reduce((s, i) => s + i.qty, 0)} items · {subtotal.toFixed(2)} AED</span>
                <button style={billBtn} onClick={() => setView("bill")}>View Bill →</button>
              </div>
            )}
          </>
        )}

        {/* BILL VIEW */}
        {view === "bill" && (
          <div>
            {/* Items */}
            <div style={{ marginBottom: 20 }}>
              {orderItems.map(item => (
                <div key={item._id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
                  <span>{item.name} × {item.qty}</span>
                  <span style={{ fontWeight: 600 }}>{(item.price * item.qty).toFixed(2)} AED</span>
                </div>
              ))}
            </div>

            <div style={divider} />

            {/* Discount */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#86868B", fontWeight: 500 }}>Discount (AED)</label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                placeholder="0"
                style={{ width: "100%", marginTop: 6, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, boxSizing: "border-box" }}
              />
            </div>

            {/* Totals */}
            <div style={totalRow}>
              <span style={{ color: "#86868B" }}>Subtotal</span>
              <span>{subtotal.toFixed(2)} AED</span>
            </div>
            {discountAmount > 0 && (
              <div style={totalRow}>
                <span style={{ color: "#FF3B30" }}>Discount</span>
                <span style={{ color: "#FF3B30" }}>− {discountAmount.toFixed(2)} AED</span>
              </div>
            )}
            <div style={totalRow}>
              <span style={{ color: "#86868B" }}>VAT ({vatPct}%)</span>
              <span>{vatAmount.toFixed(2)} AED</span>
            </div>

            <div style={divider} />

            <div style={{ ...totalRow, fontWeight: 800, fontSize: 18, marginTop: 12 }}>
              <span>Total</span>
              <span style={{ color: "#0071E3" }}>{total.toFixed(2)} AED</span>
            </div>

            {/* Print */}
            <button
              style={{ ...orderBtn, marginTop: 24, background: "#34C759" }}
              onClick={() => handlePrint({ table, orderItems, subtotal, discountAmount, vatPct, vatAmount, total })}
            >
              🖨 Print Bill
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function handlePrint({ table, orderItems, subtotal, discountAmount, vatPct, vatAmount, total }) {
  const win = window.open("", "_blank");
  win.document.write(`
    <html>
    <head>
      <title>Bill - ${table.label}</title>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 32px; max-width: 400px; margin: 0 auto; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .sub { color: #86868B; font-size: 13px; margin-bottom: 24px; }
        .item { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
        .divider { border: none; border-top: 1px solid #E5E5EA; margin: 16px 0; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .grand { font-size: 20px; font-weight: 800; color: #0071E3; }
        .footer { margin-top: 32px; text-align: center; color: #86868B; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>${table.label}</h1>
      <div class="sub">${new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" })}</div>
      ${orderItems.map(i => `<div class="item"><span>${i.name} × ${i.qty}</span><span>${(i.price * i.qty).toFixed(2)} AED</span></div>`).join("")}
      <hr class="divider"/>
      <div class="total-row"><span>Subtotal</span><span>${subtotal.toFixed(2)} AED</span></div>
      ${discountAmount > 0 ? `<div class="total-row" style="color:#FF3B30"><span>Discount</span><span>− ${discountAmount.toFixed(2)} AED</span></div>` : ""}
      <div class="total-row"><span>VAT (${vatPct}%)</span><span>${vatAmount.toFixed(2)} AED</span></div>
      <hr class="divider"/>
      <div class="total-row grand"><span>Total</span><span>${total.toFixed(2)} AED</span></div>
      <div class="footer">Thank you for dining with us!</div>
    </body>
    </html>
  `);
  win.document.close();
  win.print();
}

function InfoRow({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
      <div style={{ fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = { free: "#34C759", seated: "#FF3B30", booked: "#FF9F0A", maintenance: "#8E8E93" };
  return (
    <div style={{ display: "inline-block", padding: "6px 12px", borderRadius: 20, background: colors[status] || "#8E8E93", color: "#FFFFFF", fontSize: 13, marginBottom: 20 }}>
      {status.toUpperCase()}
    </div>
  );
}

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "flex-end", zIndex: 1000 };
const panelStyle = { width: 380, background: "#FFFFFF", padding: 24, boxShadow: "-10px 0 40px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", overflowY: "auto", maxHeight: "100vh" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 };
const closeBtn = { border: "none", background: "transparent", fontSize: 18, cursor: "pointer" };
const backBtn = { border: "none", background: "rgba(0,0,0,0.06)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" };
const orderBtn = { width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "#0071E3", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" };
const catLabel = { fontSize: 11, fontWeight: 700, color: "#86868B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 };
const menuRow = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" };
const qtyBtn = { width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(0,0,0,0.04)", cursor: "pointer", fontWeight: 700, fontSize: 16 };
const summaryBar = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(0,113,227,0.06)", borderRadius: 12, marginTop: 8 };
const billBtn = { padding: "8px 16px", borderRadius: 10, border: "none", background: "#0071E3", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 };
const divider = { border: "none", borderTop: "1px solid rgba(0,0,0,0.08)", margin: "16px 0" };
const totalRow = { display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 };