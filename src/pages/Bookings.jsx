// src/pages/Bookings.jsx
import { useEffect, useRef, useState } from "react";
import { getBookings, updateBookingStatus } from "../api/business";
import { useNotifications } from "../context/NotificationContext";

const STATUS_COLORS = {
  confirmed: { bg: "rgba(52,199,89,0.12)", color: "#166534" },
  seated: { bg: "rgba(0,113,227,0.10)", color: "#0071E3" },
  cancelled: { bg: "rgba(255,59,48,0.10)", color: "#B42318" },
  completed: { bg: "rgba(0,0,0,0.05)", color: "#86868B" },
  "no-show": { bg: "rgba(255,149,0,0.12)", color: "#92400E" },
};

const SOURCE_COLORS = {
  ai: { bg: "rgba(0,113,227,0.08)", color: "#0071E3" },
  dashboard: { bg: "rgba(255,149,0,0.10)", color: "#92400E" },
  manual: { bg: "rgba(52,199,89,0.10)", color: "#166534" },
};

function StatusPill({ status }) {
  const s = STATUS_COLORS[status] || { bg: "rgba(0,0,0,0.05)", color: "#86868B" };
  return (
    <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

function SourcePill({ source }) {
  const s = SOURCE_COLORS[source] || { bg: "rgba(0,0,0,0.05)", color: "#86868B" };
  return (
    <span style={{ padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      {source === "ai" ? "AI" : source === "manual" ? "Walk-in" : "Dashboard"}
    </span>
  );
}

function formatDateTime(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZone: "Asia/Dubai",
    });
  } catch { return "—"; }
}

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [updating, setUpdating] = useState(null);
  const { clearBookings } = useNotifications();
  const filterRef = useRef(filter);
  filterRef.current = filter;

  useEffect(() => { clearBookings(); }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => silentLoad(), 15000);
    return () => clearInterval(interval);
  }, [filter]);

  async function load() {
    try {
      setLoading(true);
      const data = await getBookings({ status: filter === "all" ? undefined : filter, limit: 50 });
      setBookings((data.bookings || data.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch {
      setErr("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  async function silentLoad() {
    try {
      const data = await getBookings({ status: filterRef.current === "all" ? undefined : filterRef.current, limit: 50 });
      setBookings((data.bookings || data.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch { }
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

  const statusFilters = ["all", "confirmed", "seated", "completed", "cancelled", "no-show"];
  const sourceFilters = ["all", "ai", "manual", "dashboard"];

  // Apply source filter client-side
  const filtered = sourceFilter === "all"
    ? bookings
    : bookings.filter(b => b.source === sourceFilter);

  const walkinCount = bookings.filter(b => b.source === "manual" && ["confirmed","seated"].includes(b.status)).length;
  const aiCount = bookings.filter(b => b.source === "ai" && ["confirmed","seated"].includes(b.status)).length;

  return (
    <div className="page">
      <div>
        <h1 className="pageTitle">Bookings</h1>
        <p className="pageSubtitle">Manage all table reservations.</p>
      </div>

      {err && <div className="alert alert--error">{err}</div>}

      {/* Summary pills */}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ padding: "10px 16px", borderRadius: 12, background: "rgba(0,113,227,0.08)", fontSize: 13, fontWeight: 600, color: "#0071E3" }}>
          🤖 AI Bookings: {aiCount} active
        </div>
        <div style={{ padding: "10px 16px", borderRadius: 12, background: "rgba(52,199,89,0.10)", fontSize: 13, fontWeight: 600, color: "#166534" }}>
          🚶 Walk-ins: {walkinCount} active
        </div>
      </div>

      {/* Status filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {statusFilters.map(f => (
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

      {/* Source filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {sourceFilters.map(f => (
          <button
            key={f}
            onClick={() => setSourceFilter(f)}
            style={{
              padding: "5px 12px", borderRadius: 999, fontSize: 12,
              fontWeight: 600, cursor: "pointer", border: "1px solid",
              borderColor: sourceFilter === f ? "#34C759" : "var(--stroke)",
              background: sourceFilter === f ? "rgba(52,199,89,0.12)" : "rgba(255,255,255,0.7)",
              color: sourceFilter === f ? "#166534" : "var(--muted)",
              transition: "all 200ms",
            }}
          >
            {f === "all" ? "All Sources" : f === "ai" ? "🤖 AI" : f === "manual" ? "🚶 Walk-in" : "📋 Dashboard"}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p style={{ padding: 24, color: "var(--muted)" }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>No bookings found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--stroke)" }}>
                {["Customer", "Party", "Time", "Source", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={b._id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--stroke)" : "none", transition: "background 150ms" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{b.customerName || "Walk-in"}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{b.customerPhone || ""}</div>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 14 }}>{b.partySize} guests</td>
                  <td style={{ padding: "14px 20px", fontSize: 14 }}>{formatDateTime(b.startIso)}</td>
                  <td style={{ padding: "14px 20px" }}><SourcePill source={b.source} /></td>
                  <td style={{ padding: "14px 20px" }}><StatusPill status={b.status} /></td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {b.source === "manual" ? (
  <ActionBtn label="Available" color="#34C759" loading={updating === b._id} onClick={() => handleStatus(b._id, "completed")} />
) : (
  <>
    {b.status === "confirmed" && (
      <ActionBtn label="Seat" color="#0071E3" loading={updating === b._id} onClick={() => handleStatus(b._id, "seated")} />
    )}
    {["confirmed", "seated"].includes(b.status) && (
      <ActionBtn label="Cancel" color="#FF3B30" loading={updating === b._id} onClick={() => handleStatus(b._id, "cancelled")} />
    )}
    {b.status === "seated" && (
      <ActionBtn label="Complete" color="#34C759" loading={updating === b._id} onClick={() => handleStatus(b._id, "completed")} />
    )}
    {["confirmed", "seated"].includes(b.status) && (
      <ActionBtn label="No-show" color="#FF9500" loading={updating === b._id} onClick={() => handleStatus(b._id, "no_show")} />
    )}
  </>
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
      style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: color, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1 }}
    >
      {label}
    </button>
  );
}