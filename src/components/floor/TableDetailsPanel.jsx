// src/components/floor/TableDetailsPanel.jsx
import { useEffect, useState } from "react";
import { getAgentMe } from "../../api/api";
import { getBusinessMe } from "../../api/business";
import apiClient from "../../api/client";

export default function TableDetailsPanel({ table, onClose, initialView = "order" }) {
  const [view, setView] = useState("order");
  const [menu, setMenu] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [vatPct, setVatPct] = useState(5);
  const [discount, setDiscount] = useState("");
  const [menuLoading, setMenuLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [noteModal, setNoteModal] = useState(null);

  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  // Reset when table changes
  useEffect(() => {
    setView(initialView || "order");
    setOrderItems([]);
    setDiscount("");
    setCurrentOrder(null);
    setMenu([]);
  }, [table?._id]);

  // Load menu and existing order when order view is shown
  useEffect(() => {
    if (view === "order") {
      if (menu.length === 0) loadMenu();
      if (table?._id) loadExistingOrder();
    }
  }, [view]);

  async function loadMenu() {
    setMenuLoading(true);
    try {
      const [agentData, bizData] = await Promise.all([getAgentMe(), getBusinessMe()]);
      setMenu(agentData.agent?.menu?.filter(m => m.available) || []);
      setVatPct(bizData.business?.vatPercentage ?? 5);
    } catch { }
    finally { setMenuLoading(false); }
  }

  async function loadExistingOrder() {
    try {
      const res = await apiClient.get(`/orders/table/${table._id}`);
      setCurrentOrder(res.data.order || null);
    } catch { }
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
    if (!orderItems.length || !table?._id) return;
    setSending(true);
    try {
      const res = await apiClient.post("/orders/table", {
        tableId: table._id,
        tableLabel: table.label,
        customerName: table.booking?.customerName || "Walk-in",
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
      alert("Failed to send order to kitchen");
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

    // ✅ FIX 1: If all items removed, order is auto-cancelled — clear the panel
    if (updatedOrder.status === "cancelled") {
      setCurrentOrder(null);
    } else {
      setCurrentOrder(updatedOrder);
    }
  } catch {
    alert("Failed to cancel item");
  }
}

  // Bill calculations — based on all rounds in currentOrder
  const allRounds = currentOrder?.rounds || [];
  const billItems = allRounds.flatMap(r => r.items);
  const billSubtotal = billItems.reduce((s, i) => s + i.price * (i.quantity || 1), 0);
  const discountAmount = discount ? Math.min(Number(discount), billSubtotal) : 0;
  const afterDiscount = billSubtotal - discountAmount;
  const vatAmount = (afterDiscount * vatPct) / 100;
  const billTotal = afterDiscount + vatAmount;

  // New items subtotal
  const newSubtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);

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
            {view === "bill" && (
              <button onClick={() => setView("order")} style={backBtn}>←</button>
            )}
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              {view === "order" ? `${table.label} — Order` : `${table.label} — Bill`}
            </h2>
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {/* ORDER VIEW */}
        {view === "order" && (
          <>
            {/* Existing rounds */}
            {allRounds.length > 0 && (
              <div style={{ marginBottom: 16 }}>
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
        style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: "rgba(255,59,48,0.12)", color: "#FF3B30", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}
        title="Cancel item"
      >×</button>
    </div>
  </div>
))}
                  </div>
                ))}
                <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "12px 0" }} />
              </div>
            )}

            {/* Menu */}
            {menuLoading ? (
              <p style={{ color: "#86868B", textAlign: "center", padding: 20 }}>Loading menu…</p>
            ) : menu.length === 0 ? (
              <p style={{ color: "#86868B", textAlign: "center", padding: 20 }}>No menu items available.</p>
            ) : (
              <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
                {allRounds.length > 0 && (
                  <div style={{ fontSize: 12, color: "#86868B", fontWeight: 600, marginBottom: 10 }}>
                    Add more items:
                  </div>
                )}
                {Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat} style={{ marginBottom: 20 }}>
                    <div style={catLabel}>{cat}</div>
                    {items.map(item => {
                      const qty = getQty(item._id);
                      const orderItem = orderItems.find(i => i._id === item._id);
                      return (
                        <div key={item._id} style={menuRow}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: "#0071E3", fontWeight: 700 }}>{item.price} {item.currency || "AED"}</div>
                            {orderItem?.notes && (
                              <div style={{ fontSize: 11, color: "#86868B", marginTop: 2 }}>📝 {orderItem.notes}</div>
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
                ))}
              </div>
            )}

            {/* Confirm Order button */}
            {orderItems.length > 0 && (
              <div style={summaryBar}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {orderItems.reduce((s, i) => s + i.qty, 0)} items · {newSubtotal.toFixed(2)} AED
                </span>
                <button style={confirmBtn} onClick={handleConfirmOrder} disabled={sending}>
                  {sending ? "Sending…" : "✅ Confirm Order"}
                </button>
              </div>
            )}

            {/* View Bill button — only if there's an existing order and no pending new items */}
            {currentOrder && orderItems.length === 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: "#34C759", fontWeight: 600, textAlign: "center", marginBottom: 8 }}>
                  ✅ Order sent to kitchen
                </div>
                <button style={{ ...orderBtn, background: "#34C759" }} onClick={() => setView("bill")}>
                  🧾 View Bill · {currentOrder.total?.toFixed(2)} AED
                </button>
              </div>
            )}
          </>
        )}

        {/* BILL VIEW */}
        {view === "bill" && (
          <div>
            <div style={{ fontSize: 13, color: "#86868B", marginBottom: 16 }}>
              {table.label} · {allRounds.length} round{allRounds.length !== 1 ? "s" : ""}
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
                style={{ width: "100%", marginTop: 6, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, boxSizing: "border-box" }}
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
              style={{ ...orderBtn, marginTop: 24, background: "#34C759" }}
              onClick={() => handlePrint({ table, allRounds, billSubtotal, discountAmount, vatPct, vatAmount, billTotal })}
            >
              🖨 Print Bill
            </button>
          </div>
        )}
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
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", fontSize: 14, boxSizing: "border-box", marginBottom: 16 }}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  setOrderItems(prev => prev.map(i => i._id === noteModal.itemId ? { ...i, notes: noteModal.note } : i));
                  setNoteModal(null);
                }
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setNoteModal(null)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", cursor: "pointer" }}>Cancel</button>
              <button
                onClick={() => {
                  setOrderItems(prev => prev.map(i => i._id === noteModal.itemId ? { ...i, notes: noteModal.note } : i));
                  setNoteModal(null);
                }}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#0071E3", color: "#fff", fontWeight: 700, cursor: "pointer" }}
              >Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function handlePrint({ table, allRounds, billSubtotal, discountAmount, vatPct, vatAmount, billTotal }) {
  const win = window.open("", "_blank");
  win.document.write(`
    <html>
    <head>
      <title>Bill - ${table.label}</title>
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
      <h1>${table.label}</h1>
      <div class="sub">${new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" })}</div>
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
const panelStyle = { width: 400, background: "#FFFFFF", padding: 24, boxShadow: "-10px 0 40px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", overflowY: "auto", maxHeight: "100vh" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 };
const closeBtn = { border: "none", background: "transparent", fontSize: 18, cursor: "pointer" };
const backBtn = { border: "none", background: "rgba(0,0,0,0.06)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" };
const orderBtn = { width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "#0071E3", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" };
const catLabel = { fontSize: 11, fontWeight: 700, color: "#86868B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 };
const menuRow = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" };
const qtyBtn = { width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(0,0,0,0.04)", cursor: "pointer", fontWeight: 700, fontSize: 16 };
const summaryBar = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(0,113,227,0.06)", borderRadius: 12, marginTop: 8 };
const confirmBtn = { padding: "8px 16px", borderRadius: 10, border: "none", background: "#0071E3", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 };
const divider = { border: "none", borderTop: "1px solid rgba(0,0,0,0.08)", margin: "16px 0" };
const totalRow = { display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 };