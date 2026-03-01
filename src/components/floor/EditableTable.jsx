// src/components/floor/EditableTable.jsx
import { useMemo } from "react";
import { Rnd } from "react-rnd";

const GRID_SIZE = 10;

function snap(v) {
  return Math.round(v / GRID_SIZE) * GRID_SIZE;
}

function safeNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * EditableTable
 * mode:
 * - "edit": draggable/resizable (Rnd)
 * - "live": static (no Rnd), click opens details
 */
export default function EditableTable({
  table,
  mode = "edit",
  canvasScale = 1,
  onClick,
  onChange,
  onDelete,
}) {
  const x = safeNum(table?.x, 0);
  const y = safeNum(table?.y, 0);
  const w = Math.max(60, safeNum(table?.w, 120));
  const h = Math.max(60, safeNum(table?.h, 120));
  const capacity = clamp(safeNum(table?.capacity, 0), 0, 50);
  const label = typeof table?.label === "string" ? table.label : "";

  const size = useMemo(() => ({ width: w, height: h }), [w, h]);
  const position = useMemo(() => ({ x, y }), [x, y]);

  const tableNode = (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 18,
        position: "relative",
        userSelect: "none",
        cursor: mode === "edit" ? "grab" : "pointer",
      }}
    >
      <TableSvg width={w} height={h} chairs={capacity} />

{mode === "live" && (
  <div
    style={{
      position: "absolute",
      top: 6,
      right: 6,
      padding: "4px 8px",
      fontSize: 10,
      fontWeight: 700,
      borderRadius: 20,
      background:
        table.status === "free"
          ? "#34C759"
          : table.status === "seated"
          ? "#FF3B30"
          : table.status === "booked"
          ? "#FF9F0A"
          : "#8E8E93",
      color: "#FFFFFF",
      letterSpacing: 0.5,
      boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    }}
  >
    {table.status?.toUpperCase()}
  </div>
)}

      {/* Label (edit: editable, live: read-only) */}
      {mode === "edit" ? (
        <div
          className="no-drag"
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
          }}
        >
          <input
            className="no-drag"
            value={label}
            onChange={(e) => {
              const next = String(e.target.value || "").slice(0, 20);
              onChange?.({ ...table, label: next });
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              pointerEvents: "auto",
              width: "72%",
              textAlign: "center",
              background: "rgba(0,0,0,0.18)",
              border: "1px solid rgba(255,255,255,0.14)",
              outline: "none",
              borderRadius: 10,
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: 13,
              padding: "6px 8px",
              backdropFilter: "blur(6px)",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "#FFFFFF",
            fontWeight: 800,
            fontSize: 14,
            textShadow: "0 2px 10px rgba(0,0,0,0.35)",
            pointerEvents: "none",
          }}
        >
          {label}
        </div>
      )}

      {/* Delete (edit only) */}
      {mode === "edit" && (
        <button
          className="no-drag"
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          title="Delete"
          style={{
            position: "absolute",
            top: -14,
            right: -14,
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "none",
            background: "#FF3B30",
            color: "#FFFFFF",
            fontSize: 12,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 10px 25px rgba(0,0,0,0.30)",
          }}
        >
          ✕
        </button>
      )}
    </div>
  );

  // LIVE: no Rnd
  if (mode !== "edit") {
    return (
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
        }}
      >
        {tableNode}
      </div>
    );
  }

  // EDIT: Rnd enabled
  return (
    <Rnd
      size={size}
      position={position}
      style={{ cursor: "grab" }}
      bounds="parent"
      scale={canvasScale}
      cancel=".no-drag"
      onDragStop={(_, d) => {
        onChange?.({
          ...table,
          x: snap(d.x),
          y: snap(d.y),
        });
      }}
      onResizeStop={(_, __, ref, ___, pos) => {
        const nextW = Math.max(60, snap(parseInt(ref.style.width, 10)));
        const nextH = Math.max(60, snap(parseInt(ref.style.height, 10)));

        onChange?.({
          ...table,
          x: snap(pos.x),
          y: snap(pos.y),
          w: nextW,
          h: nextH,
        });
      }}
      minWidth={60}
      minHeight={60}
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: false,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
    >
      {tableNode}
    </Rnd>
  );
}

/**
 * Real 2D table + chairs (SVG)
 * Chairs are distributed along the perimeter, not random.
 */
function TableSvg({ width, height, chairs, shape = "rect" }) {
  const w = Math.max(60, safeNum(width, 120));
  const h = Math.max(60, safeNum(height, 120));
  const count = clamp(safeNum(chairs, 0), 0, 50);

  const inset = 18;

  // Force square proportions for square/round
  const baseSize = Math.min(w, h);

  let tableW = w - inset * 2;
  let tableH = h - inset * 2;

  if (shape === "square" || shape === "round") {
    tableW = baseSize - inset * 2;
    tableH = baseSize - inset * 2;
  }

  const tableX = (w - tableW) / 2;
  const tableY = (h - tableH) / 2;

  const chairW = 18;
  const chairH = 14;
  const chairR = 5;

  const perSide = [0, 0, 0, 0];
  for (let i = 0; i < count; i++) perSide[i % 4]++;

  const positions = [];

  const distribute = (n, start, end, pad = 14) => {
    if (n <= 0) return [];
    const s = start + pad;
    const e = end - pad;
    if (e <= s) return Array.from({ length: n }, () => (start + end) / 2);
    if (n === 1) return [(s + e) / 2];
    const step = (e - s) / (n - 1);
    return Array.from({ length: n }, (_, i) => s + i * step);
  };

  // TOP
  distribute(perSide[0], tableX, tableX + tableW).forEach((cx) => {
    positions.push({ cx, cy: tableY - 10, rot: 0 });
  });

  // RIGHT
  distribute(perSide[1], tableY, tableY + tableH).forEach((cy) => {
    positions.push({ cx: tableX + tableW + 10, cy, rot: 90 });
  });

  // BOTTOM
  distribute(perSide[2], tableX, tableX + tableW).forEach((cx) => {
    positions.push({ cx, cy: tableY + tableH + 10, rot: 180 });
  });

  // LEFT
  distribute(perSide[3], tableY, tableY + tableH).forEach((cy) => {
    positions.push({ cx: tableX - 10, cy, rot: 270 });
  });

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="tbl" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#2C2C2E" />
          <stop offset="1" stopColor="#141416" />
        </linearGradient>

        <linearGradient id="chair" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#EDEDF2" />
          <stop offset="1" stopColor="#C9CAD1" />
        </linearGradient>
      </defs>

      {/* Chairs */}
      {positions.map((p, idx) => (
        <g key={idx} transform={`translate(${p.cx},${p.cy}) rotate(${p.rot})`}>
          <rect
            x={-chairW / 2}
            y={-chairH / 2 - 6}
            width={chairW}
            height={6}
            rx={chairR}
            fill="#9FA1A8"
          />
          <rect
            x={-chairW / 2}
            y={-chairH / 2}
            width={chairW}
            height={chairH}
            rx={chairR}
            fill="url(#chair)"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="0.6"
          />
        </g>
      ))}

      {/* Table Shape */}
      {shape === "round" && (
        <circle
          cx={w / 2}
          cy={h / 2}
          r={tableW / 2}
          fill="url(#tbl)"
          stroke="rgba(255,255,255,0.10)"
        />
      )}

      {shape === "oval" && (
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={tableW / 2}
          ry={tableH / 2}
          fill="url(#tbl)"
          stroke="rgba(255,255,255,0.10)"
        />
      )}

      {(shape === "rect" || shape === "square") && (
        <rect
          x={tableX}
          y={tableY}
          width={tableW}
          height={tableH}
          rx={16}
          fill="url(#tbl)"
          stroke="rgba(255,255,255,0.10)"
        />
      )}
    </svg>
  );
}