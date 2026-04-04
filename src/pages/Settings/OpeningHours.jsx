// src/pages/Settings/OpeningHours.jsx
import { useEffect, useState } from "react";
import { getAgentMe } from "../../api/api";
import { updateOpeningHours } from "../../api/business";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DEFAULT_HOURS = { open: "09:00", close: "22:00", closed: false };

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

export default function OpeningHours() {
  const [hours, setHours] = useState(() =>
    Object.fromEntries(DAYS.map(d => [d, { ...DEFAULT_HOURS }]))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getAgentMe();
        const existing = data.agent?.openingHours;
        if (existing) {
          const merged = Object.fromEntries(
            DAYS.map(d => [d, existing[d] ? { ...DEFAULT_HOURS, ...existing[d] } : { ...DEFAULT_HOURS, closed: true }])
          );
          setHours(merged);
        }
      } catch {
        setErr("Failed to load opening hours.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleChange(day, field, value) {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  function toggleClosed(day) {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], closed: !prev[day].closed } }));
  }

  function applyToAll(day) {
    const source = hours[day];
    setHours(prev => Object.fromEntries(DAYS.map(d => [d, { ...source, closed: prev[d].closed }])));
  }

  function set247() {
    setHours(Object.fromEntries(DAYS.map(d => [d, { open: "00:00", close: "23:59", closed: false }])));
  }

  async function handleSave() {
    setErr(""); setMsg("");
    try {
      setSaving(true);
      await updateOpeningHours(hours);
      setMsg("Opening hours saved.");
    } catch {
      setErr("Failed to save opening hours.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="pageSubtitle">Loading…</p>;

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="pageTitle">Opening Hours</h1>
          <p className="pageSubtitle">Set your restaurant's operating hours for each day.</p>
        </div>
        <button
          onClick={set247}
          style={{
            padding: "10px 18px", borderRadius: 999, border: "none",
            background: "rgba(0,113,227,0.10)", color: "var(--blue)",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            transition: "all 200ms",
          }}
        >
          Set 24/7
        </button>
      </div>

      {err && <div className="alert alert--error">{err}</div>}
      {msg && <div className="alert alert--success">{msg}</div>}

      <div className="card">
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {DAYS.map((day, i) => (
            <div key={day} style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "16px 0",
              borderBottom: i < DAYS.length - 1 ? "1px solid var(--stroke)" : "none",
            }}>
              <div style={{ width: 110, fontWeight: 600, fontSize: 14 }}>{capitalize(day)}</div>

              <div onClick={() => toggleClosed(day)} style={{
                width: 40, height: 24, borderRadius: 999,
                background: hours[day].closed ? "var(--stroke)" : "var(--blue)",
                position: "relative", cursor: "pointer", transition: "background 200ms", flexShrink: 0,
              }}>
                <div style={{
                  position: "absolute", top: 3,
                  left: hours[day].closed ? 3 : 19,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "#fff", transition: "left 200ms",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                }} />
              </div>
              <span style={{ fontSize: 13, color: hours[day].closed ? "var(--muted)" : "var(--text)", fontWeight: 500, minWidth: 50 }}>
                {hours[day].closed ? "Closed" : "Open"}
              </span>

              {!hours[day].closed && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="time" className="input" value={hours[day].open}
                      onChange={e => handleChange(day, "open", e.target.value)}
                      style={{ width: 120, height: 36 }} />
                    <span style={{ color: "var(--muted)", fontSize: 13 }}>to</span>
                    <input type="time" className="input" value={hours[day].close}
                      onChange={e => handleChange(day, "close", e.target.value)}
                      style={{ width: 120, height: 36 }} />
                  </div>
                  <button onClick={() => applyToAll(day)} style={{
                    padding: "6px 12px", borderRadius: 8, border: "1px solid var(--stroke)",
                    background: "rgba(0,0,0,0.03)", fontSize: 12, cursor: "pointer",
                    color: "var(--muted)", fontWeight: 500,
                  }}>
                    Apply to all
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <button className="buttonPrimary" onClick={handleSave} disabled={saving} style={{ marginTop: 24 }}>
          {saving ? "Saving…" : "Save Hours"}
        </button>
      </div>
    </div>
  );
}