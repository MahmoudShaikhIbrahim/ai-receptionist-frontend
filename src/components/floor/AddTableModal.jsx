import { useEffect, useMemo, useState } from "react";

const SHAPES = [
  { value: "rect", label: "Rectangle" },
  { value: "square", label: "Square" },
  { value: "round", label: "Round" },
  { value: "oval", label: "Oval" },
];

export default function AddTableModal({
  open,
  onClose,
  onCreate,
  existingLabels = [],
  defaultLabel = "T1",
  defaultCapacity = 4,
}) {
  const [label, setLabel] = useState(defaultLabel);
  const [capacity, setCapacity] = useState(String(defaultCapacity));
  const [shape, setShape] = useState("rect");
  const [error, setError] = useState("");

  const labelSet = useMemo(() => {
    return new Set(existingLabels.map((x) => String(x || "").trim().toLowerCase()));
  }, [existingLabels]);

  useEffect(() => {
    if (!open) return;
    setLabel(defaultLabel);
    setCapacity(String(defaultCapacity));
    setShape("rect");
    setError("");
  }, [open, defaultLabel, defaultCapacity]);

  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") onClose?.();
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSubmit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!open) return null;

  const handleSubmit = () => {
    const trimmed = String(label || "").trim();
    if (!trimmed) {
      setError("Table name is required.");
      return;
    }
    if (labelSet.has(trimmed.toLowerCase())) {
      setError("This table name already exists. Pick another name.");
      return;
    }

    const parsed = Number(capacity);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 50) {
      setError("Capacity must be a number between 1 and 50.");
      return;
    }

    setError("");
    onCreate?.({ label: trimmed, capacity: parsed, shape });
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={header}>
          <div>
            <div style={title}>Add table</div>
            <div style={subtitle}>Create a new table and place it on the floor.</div>
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={body}>
          <label style={labelStyle}>
            Table name
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
              style={input}
              placeholder="T1"
            />
          </label>

          <label style={labelStyle}>
            Capacity
            <input
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              style={input}
              inputMode="numeric"
            />
          </label>

          <div style={labelStyle}>
            Shape
            <div style={shapeRow}>
              {SHAPES.map((s) => {
                const active = shape === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setShape(s.value)}
                    style={{
                      ...shapeBtn,
                      background: active ? "#007AFF" : "rgba(255,255,255,0.7)",
                      color: active ? "#fff" : "#111",
                      border: active
                        ? "none"
                        : "1px solid rgba(0,0,0,0.12)",
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error ? <div style={errorBox}>{error}</div> : null}
          <div style={hint}>Tip: Ctrl/⌘ + Enter to create.</div>
        </div>

        <div style={footer}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={handleSubmit} style={btnPrimary}>Create</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- styles ---------------- */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.20)",
  backdropFilter: "blur(10px)",
  display: "grid",
  placeItems: "center",
  zIndex: 2000,
};

const modal = {
  width: 520,
  maxWidth: "calc(100vw - 24px)",
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 18,
  boxShadow: "0 30px 80px rgba(0,0,0,0.20)",
  overflow: "hidden",
};

const header = {
  padding: 18,
  display: "flex",
  justifyContent: "space-between",
  borderBottom: "1px solid rgba(0,0,0,0.06)",
};

const title = { fontSize: 18, fontWeight: 700 };
const subtitle = { fontSize: 13, color: "rgba(0,0,0,0.60)", marginTop: 4 };

const closeBtn = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.70)",
  cursor: "pointer",
};

const body = { padding: 18, display: "grid", gap: 14 };

const labelStyle = {
  display: "grid",
  gap: 8,
  fontSize: 13,
  fontWeight: 600,
};

const input = {
  height: 40,
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  padding: "0 12px",
  fontSize: 14,
};

const shapeRow = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const shapeBtn = {
  height: 34,
  padding: "0 12px",
  borderRadius: 999,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 12,
};

const errorBox = {
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(255,59,48,0.10)",
  border: "1px solid rgba(255,59,48,0.22)",
  color: "#B42318",
  fontSize: 13,
  fontWeight: 600,
};

const hint = { fontSize: 12, color: "rgba(0,0,0,0.55)" };

const footer = {
  padding: 18,
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  borderTop: "1px solid rgba(0,0,0,0.06)",
};

const btnGhost = {
  height: 40,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "rgba(255,255,255,0.60)",
  cursor: "pointer",
  fontWeight: 700,
};

const btnPrimary = {
  height: 40,
  padding: "0 16px",
  borderRadius: 12,
  border: "none",
  background: "#007AFF",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 800,
};