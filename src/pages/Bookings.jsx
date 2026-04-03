// src/pages/Bookings.jsx
import { useEffect, useState } from "react";
import { getBookings, updateBookingStatus } from "../api/business";

const STATUS_COLORS = {
  confirmed: { bg: "rgba(52,199,89,0.12)", color: "#166534" },
  seated: { bg: "rgba(0,113,227,0.10)", color: "#0071E3" },
  cancelled: { bg: "rgba(255,59,48,0.10)", color: "#B42318" },
  completed: { bg: "rgba(0,0,0,0.05)", color: "#86868B" },
  "no-show": { bg: "rgba(255,149,0,0.12)", color: "#92400E" },
};

function StatusPill({ status }) {
  const s = STATUS_COLORS[status] || { bg: "rgba(0,0,0,0.05)", color: "#86868B" };
  return (
    <span style={{
      padding: "4px 10px", borderRadius: 999, fontSize: 12,
      fontWeight: 600, background: s.bg, color: s.color,
    }}>
      {status}
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

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    load();
  }, [filter]);

  async function load() {
    try {
      setLoading(true);
      const data = await getBookings({ status: filter === "all" ? undefined : filter, limit: 50 });
      setBookings(data.bookings || data.data || []);
    } catch {
      setErr("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(id, status) {
    setUpdating(id);
    try {
      await updateBookingStatus(id, status);
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b));
    } catch {
      setErr("Failed to update status.");
    } finally {
      setUpdating(null);
    }
  }

  const filters = ["all", "confirmed", "seated", "completed", "cancelled", "no-show"];

  return (
    <div className="page">
      <div>
        <h1 className="pageTitle">Bookings</h1>
        <p className="pageSubtitle">Manage all table reservations.</p>
      </div>

      {err && <div className="alert alert--error">{err}</div>}

      {/* Filter tabs */}
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
        ) : bookings.length === 0 ? (
          <p style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>No bookings found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--stroke)" }}>
                {["Customer", "Party", "Time", "Status", "Actions"].map(h => (
                  <th key={h} style={{
                    padding: "14px 20px", textAlign: "left",
                    fontSize: 12, fontWeight: 600, color: "var(--muted)",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr key={b._id} style={{
                  borderBottom: i < bookings.length - 1 ? "1px solid var(--stroke)" : "none",
                  transition: "background 150ms",
                }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{b.customerName || "—"}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{b.customerPhone || ""}</div>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 14 }}>{b.partySize} guests</td>
                  <td style={{ padding: "14px 20px", fontSize: 14 }}>{formatDateTime(b.startTime)}</td>
                  <td style={{ padding: "14px 20px" }}><StatusPill status={b.status} /></td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {b.status === "confirmed" && (
                        <ActionBtn
                          label="Seat"
                          color="#0071E3"
                          loading={updating === b._id}
                          onClick={() => handleStatus(b._id, "seated")}
                        />
                      )}
                      {["confirmed", "seated"].includes(b.status) && (
                        <ActionBtn
                          label="Cancel"
                          color="#FF3B30"
                          loading={updating === b._id}
                          onClick={() => handleStatus(b._id, "cancelled")}
                        />
                      )}
                      {b.status === "seated" && (
                        <ActionBtn
                          label="Complete"
                          color="#34C759"
                          loading={updating === b._id}
                          onClick={() => handleStatus(b._id, "completed")}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ label, color, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: "6px 12px", borderRadius: 8, border: "none",
        background: color, color: "#fff", fontSize: 12,
        fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1,
        transition: "transform 150ms",
      }}
    >
      {label}
    </button>
  );
}