// src/pages/Orders.jsx
import { useEffect, useState } from "react";
import { getOrders } from "../api/business";

const STATUS_COLORS = {
  confirmed: { bg: "rgba(0,113,227,0.10)", color: "#0071E3" },
  preparing: { bg: "rgba(255,149,0,0.12)", color: "#92400E" },
  ready: { bg: "rgba(52,199,89,0.12)", color: "#166534" },
  delivered: { bg: "rgba(0,0,0,0.05)", color: "#86868B" },
  cancelled: { bg: "rgba(255,59,48,0.10)", color: "#B42318" },
};

const TYPE_COLORS = {
  pickup: { bg: "rgba(0,113,227,0.08)", color: "#0071E3" },
  delivery: { bg: "rgba(255,149,0,0.10)", color: "#92400E" },
  dineIn: { bg: "rgba(52,199,89,0.10)", color: "#166534" },
};

function Pill({ label, colors }) {
  return (
    <span style={{
      padding: "4px 10px", borderRadius: 999, fontSize: 12,
      fontWeight: 600, background: colors.bg, color: colors.color,
    }}>
      {label}
    </span>
  );
}

function formatDateTime(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  } catch { return "—"; }
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    load();
  }, [filter]);

  async function load() {
    try {
      setLoading(true);
      const data = await getOrders({ status: filter === "all" ? undefined : filter, limit: 50 });
      setOrders(data.orders || data.data || []);
    } catch {
      setErr("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  const filters = ["all", "confirmed", "preparing", "ready", "delivered", "cancelled"];

  return (
    <div className="page">
      <div>
        <h1 className="pageTitle">Orders</h1>
        <p className="pageSubtitle">View all pickup, delivery and dine-in orders.</p>
      </div>

      {err && <div className="alert alert--error">{err}</div>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 14px", borderRadius: 999, fontSize: 13,
              fontWeight: 600, cursor: "pointer", border: "1px solid",
              borderColor: filter === f ? "var(--blue)" : "var(--stroke)",
              background: filter === f ? "rgba(0,113,227,0.10)" : "rgba(255,255,255,0.7)",
              color: filter === f ? "var(--blue)" : "var(--text)",
              transition: "all 200ms",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p style={{ padding: 24, color: "var(--muted)" }}>Loading…</p>
        ) : orders.length === 0 ? (
          <p style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>No orders found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--stroke)" }}>
                {["Customer", "Type", "Items", "Total", "Time", "Status"].map(h => (
                  <th key={h} style={{
                    padding: "14px 20px", textAlign: "left",
                    fontSize: 12, fontWeight: 600, color: "var(--muted)",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <>
                  <tr
                    key={o._id}
                    onClick={() => setExpanded(expanded === o._id ? null : o._id)}
                    style={{
                      borderBottom: i < orders.length - 1 ? "1px solid var(--stroke)" : "none",
                      cursor: "pointer",
                      transition: "background 150ms",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.02)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{o.customerName || "—"}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{o.customerPhone || ""}</div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <Pill
                        label={o.orderType === "dineIn" ? "Dine-in" : o.orderType}
                        colors={TYPE_COLORS[o.orderType] || { bg: "rgba(0,0,0,0.05)", color: "#86868B" }}
                      />
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: "var(--muted)" }}>
                      {o.items?.length || 0} item{o.items?.length !== 1 ? "s" : ""}
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600 }}>
                      {o.total} AED
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 14 }}>{formatDateTime(o.createdAt)}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <Pill
                        label={o.status}
                        colors={STATUS_COLORS[o.status] || { bg: "rgba(0,0,0,0.05)", color: "#86868B" }}
                      />
                    </td>
                  </tr>
                  {expanded === o._id && (
                    <tr key={`${o._id}-expanded`}>
                      <td colSpan={6} style={{ padding: "0 20px 14px", background: "rgba(0,0,0,0.01)" }}>
                        <div style={{
                          borderRadius: 10, background: "rgba(0,0,0,0.03)",
                          padding: "12px 16px", fontSize: 13,
                        }}>
                          {o.deliveryAddress && (
                            <div style={{ marginBottom: 8, color: "var(--muted)" }}>
                              📍 {o.deliveryAddress}
                            </div>
                          )}
                          {o.scheduledTime && (
                            <div style={{ marginBottom: 8, color: "var(--muted)" }}>
                              🕐 Pickup at {formatDateTime(o.scheduledTime)}
                            </div>
                          )}
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {o.items?.map((item, idx) => (
                              <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>{item.name} × {item.quantity}</span>
                                <span style={{ fontWeight: 600 }}>{item.price * item.quantity} AED</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}