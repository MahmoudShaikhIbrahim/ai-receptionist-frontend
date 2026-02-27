import { Rnd } from "react-rnd";

const GRID_SIZE = 10;

function snap(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export default function EditableTable({
  table,
  isSelected,
  onSelect,
  onChange,
  onDelete,
}) {
  const handleDragStop = (_, d) => {
    onChange({
      ...table,
      x: snap(d.x),
      y: snap(d.y),
    });
  };

  const handleResizeStop = (_, __, ref, ___, position) => {
    onChange({
      ...table,
      x: snap(position.x),
      y: snap(position.y),
      w: snap(parseInt(ref.style.width, 10)),
      h: snap(parseInt(ref.style.height, 10)),
    });
  };

  return (
    <Rnd
      size={{ width: table.w, height: table.h }}
      position={{ x: table.x, y: table.y }}
      bounds="parent"
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      cancel=".no-drag"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => onSelect(table._id)}
        style={{
          width: "100%",
          height: "100%",
          background: "#2C2C2E",
          borderRadius: 14,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFFFF",
          border: isSelected ? "2px solid #007AFF" : "none",
          cursor: "move",
        }}
      >
        {/* Rename */}
        <input
          className="no-drag"
          value={table.label}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) =>
            onChange({ ...table, label: e.target.value })
          }
          style={{
            background: "transparent",
            border: "none",
            color: "#FFFFFF",
            textAlign: "center",
            width: "80%",
            fontWeight: 600,
            outline: "none",
          }}
        />

        {/* Delete */}
        <button
          className="no-drag"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(table._id)}
          style={{
            position: "absolute",
            top: -18,
            right: -18,
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: "none",
            background: "#FF3B30",
            color: "#FFFFFF",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>
    </Rnd>
  );
}