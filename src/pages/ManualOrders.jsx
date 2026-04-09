// src/pages/ManualOrders.jsx
import { useEffect, useState } from "react";
import { getAgentMe } from "../api/api";
import { getBusinessMe } from "../api/business";
import apiClient from "../api/client";

export default function ManualOrders() {
  const [menu, setMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [orderItems, setOrderItems] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [vatPct, setVatPct] = useState(5);
  const [discount, setDiscount] = useState("");
  const [sending, setSending] = useState(false);
  const [view, setView] = useState("order"); // "order" | "bill"
  const [noteModal, setNoteModal] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  useEffect(() => { loadMenu(); }, []);

  async function loadMenu() {
    setMenuLoading(true);
    try {
      const [agentData, bizData] = await Promise.all([getAgentMe(), getBusinessMe()]);
      setMenu(agentData.agent?.menu?.filter(m => m.available) || []);
      setVatPct(bizData.business?.vatPercentage ?? 5);
    } catch { }
    finally { setMenuLoading(false); }
  }

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

  async function handleConfirmOrder() {
    if (!orderItems.length) return;
    setSending(true);
    try {
      const res = await apiClient.post("/orders/pickup", {
        customerName: customerName || "Walk-in",
        customerPhone: customerPhone || null,
        items: orderItems.map(i => ({
          name: i.name,
          quantity: i.qty,
          price: i.price,
          extras: i.extras || [],
          notes: i.notes || null,
        })),
      });
      setCurrentOrder(res.data.order);
      setOrderItems([]);
    } catch {
      alert("Failed to send order");
    } finally {
      setSending(false);
    }
  }

  async function handleAddRound() {
    if (!orderItems.length || !currentOrder?._id) return;
    setSending(true);
    try {
      const res = await apiClient.post("/orders/pickup/round", {
        orderId: currentOrder._id,
        items: orderItems.map(i => ({
          name: i.name,
          quantity: i.qty,
          price: i.price,
          extras: i.extras || [],
          notes: i.notes || null,
        })),
      });
      setCurrentOrder(res.data.order);
      setOrderItems([]);
    } catch {
      alert("Failed to add items");
    } finally {
      setSending(false);
    }
  }

  async function handleCancelItem(roundIndex, itemIndex) {
    if (!currentOrder?._id) return;
    try {
      const res = await apiClient.delete(`/orders/table/${currentOrder._id}/item`, {
        data: { roundIndex, itemIndex }
      });
      const updatedOrder = res.data.order;
      if (updatedOrder.status === "cancelled") {
        setCurrentOrder(null);
      } else {
        setCurrentOrder(updatedOrder);
      }
    } catch {
      alert("Failed to cancel item");
    }
  }

  function handleReset() {
    setCurrentOrder(null);
    setOrderItems([]);
    setDiscount("");
    setCustomerName("");
    setCustomerPhone("");
    setView("order");
  }

  // Bill calculations
  const allRounds = currentOrder?.rounds || [];
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
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 className="pageTitle">
            {view === "bill" ? "Bill" : "Manual Orders"}
          </h1>
          <p className="pageSubtitle">
            {view === "bill" ? "Review and print the bill." : "Create a pickup order for walk-in customers."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {view === "bill" && (
            <button
              onClick={() => setView("order")}
              style={secondaryBtn}
            >
              ← Back to Order
            </button>
          )}
          {currentOrder && (
            <button onClick={handleReset} style={secondaryBtn}>
              + New Order
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

        {/* LEFT — Menu */}
        {view === "order" && (
          <div className="card" style={{ flex: 1, padding: 24 }}>
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
                            <div style={{ fontSize: 11, color: "#86868B", marginTop: 2 }}>
                              📝 {orderItem.notes}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {qty > 0 && (
                            <>
                              <button style={qtyBtn} onClick={() => removeItem(item._id)}>−</button>
                              <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{qty}</span>
                              <button
                                style={{ ...qtyBtn, fontSize: 12 }}
                                onClick={() => setNoteModal({ itemId: item._id, note: orderItem?.notes || "" })}
                                title="Add note"
                              >📝</button>
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
          </div>
        )}

        {/* RIGHT — Order Summary / Bill */}
        <div className="card" style={{ width: 360, padding: 24, flexShrink: 0 }}>

          {view === "order" && (
            <>
              {/* Customer Info */}
              {!currentOrder && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Customer (optional)</h3>
                  <input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                    style={inputStyle}
                  />
                  <input
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="Phone number"
                    style={{ ...inputStyle, marginTop: 8 }}
                  />
                  <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "16px 0" }} />
                </div>
              )}

              {/* Existing rounds */}
              {allRounds.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>
                    {currentOrder?.customerName || "Walk-in"} · Pickup
                  </h3>
                  {allRounds.map((round, idx) => (
                    <div key={round._id || idx} style={{ background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: "#86868B", fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
                        Round {idx + 1} · {new Date(round.sentAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dubai" })}
                      </div>
                      {round.items.map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 4 }}>
                          <span>{item.name} × {item.quantity}{item.notes ? ` · ${item.notes}` : ""}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 600 }}>{(item.price * item.quantity).toFixed(2)} AED</span>
                            <button
                              onClick={() => handleCancelItem(idx, i)}
                              style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: "rgba(255,59,48,0.12)", color: "#FF3B30", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
                            >×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "12px 0" }} />
                </div>
              )}

              {/* New items being built */}
              {orderItems.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "#86868B", fontWeight: 600, marginBottom: 8 }}>
                    {currentOrder ? "Adding to order:" : "New order:"}
                  </div>
                  {orderItems.map(item => (
                    <div key={item._id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                      <span>{item.name} × {item.qty}</span>
                      <span style={{ fontWeight: 600 }}>{(item.price * item.qty).toFixed(2)} AED</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "12px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
                    <span>Subtotal</span>
                    <span>{newSubtotal.toFixed(2)} AED</span>
                  </div>
                  <button
                    style={primaryBtn}
                    onClick={currentOrder ? handleAddRound : handleConfirmOrder}
                    disabled={sending}
                  >
                    {sending ? "Sending…" : currentOrder ? "✅ Add to Order" : "✅ Confirm Order"}
                  </button>
                </div>
              )}

              {/* View Bill — only when order exists and no pending items */}
              {currentOrder && orderItems.length === 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: "#34C759", fontWeight: 600, textAlign: "center", marginBottom: 10 }}>
                    ✅ Order sent to kitchen
                  </div>
                  <button
                    style={{ ...primaryBtn, background: "#34C759" }}
                    onClick={() => setView("bill")}
                  >
                    🧾 View Bill · {currentOrder.total?.toFixed(2)} AED
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!currentOrder && orderItems.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 14, textAlign: "center", padding: "20px 0" }}>
                  Select items from the menu to start an order.
                </p>
              )}
            </>
          )}

          {/* BILL VIEW */}
          {view === "bill" && (
            <div>
              <div style={{ fontSize: 13, color: "#86868B", marginBottom: 16 }}>
                Pickup · {allRounds.length} round{allRounds.length !== 1 ? "s" : ""}
              </div>

              {allRounds.map((round, idx) => (
                <div key={round._id || idx} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: "#86868B", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>
                    Round {idx + 1} · {new Date(round.sentAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dubai" })}
                  </div>
                  {round.items.map((item, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                        <span>{item.name} × {item.quantity}</span>
                        <span style={{ fontWeight: 600 }}>{(item.price * item.quantity).toFixed(2)} AED</span>
                      </div>
                      {item.notes && <div style={{ fontSize: 11, color: "#86868B" }}>📝 {item.notes}</div>}
                    </div>
                  ))}
                </div>
              ))}

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
                  style={{ ...inputStyle, marginTop: 6 }}
                />
              </div>

              <div style={totalRow}><span style={{ color: "#86868B" }}>Subtotal</span><span>{billSubtotal.toFixed(2)} AED</span></div>
              {discountAmount > 0 && <div style={totalRow}><span style={{ color: "#FF3B30" }}>Discount</span><span style={{ color: "#FF3B30" }}>− {discountAmount.toFixed(2)} AED</span></div>}
              <div style={totalRow}><span style={{ color: "#86868B" }}>VAT ({vatPct}%)</span><span>{vatAmount.toFixed(2)} AED</span></div>

              <div style={divider} />

              <div style={{ ...totalRow, fontWeight: 800, fontSize: 18, marginTop: 12 }}>
                <span>Total</span>
                <span style={{ color: "#0071E3" }}>{billTotal.toFixed(2)} AED</span>
              </div>

              <button
                style={{ ...primaryBtn, marginTop: 24, background: "#34C759" }}
                onClick={() => handlePrint({ customerName, allRounds, billSubtotal, discountAmount, vatPct, vatAmount, billTotal })}
              >
                🖨 Print Bill
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Note Modal */}
      {noteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={() => setNoteModal(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 320, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Add Note</h3>
            <input
              autoFocus
              value={noteModal.note}
              onChange={e => setNoteModal(prev => ({ ...prev, note: e.target.value }))}
              placeholder="e.g. No onions, extra spicy..."
              style={{ ...inputStyle, marginBottom: 16 }}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  setOrderItems(prev => prev.map(i => i._id === noteModal.itemId ? { ...i, notes: noteModal.note } : i));
                  setNoteModal(null);
                }
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setNoteModal(null)} style={secondaryBtn}>Cancel</button>
              <button
                onClick={() => {
                  setOrderItems(prev => prev.map(i => i._id === noteModal.itemId ? { ...i, notes: noteModal.note } : i));
                  setNoteModal(null);
                }}
                style={{ ...primaryBtn, flex: 1 }}
              >Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function handlePrint({ customerName, allRounds, billSubtotal, discountAmount, vatPct, vatAmount, billTotal }) {
  const win = window.open("", "_blank");
  win.document.write(`
    <html>
    <head>
      <title>Bill - Pickup</title>
      <style>
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
      </style>
    </head>
    <body>
      <h1>Pickup Order</h1>
      <div class="sub">${customerName || "Walk-in"} · ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" })}</div>
      ${allRounds.map((round, idx) => `
        <div class="round-title">Round ${idx + 1} · ${new Date(round.sentAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dubai" })}</div>
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
    </body>
    </html>
  `);
  win.document.close();
  win.print();
}

const primaryBtn = { width: "100%", padding: "13px", borderRadius: 14, border: "none", background: "#0071E3", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" };
const secondaryBtn = { padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", fontSize: 14, boxSizing: "border-box", outline: "none" };
const catLabel = { fontSize: 11, fontWeight: 700, color: "#86868B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 };
const menuRow = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" };
const qtyBtn = { width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(0,0,0,0.04)", cursor: "pointer", fontWeight: 700, fontSize: 16 };
const divider = { border: "none", borderTop: "1px solid rgba(0,0,0,0.08)", margin: "16px 0" };
const totalRow = { display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 };