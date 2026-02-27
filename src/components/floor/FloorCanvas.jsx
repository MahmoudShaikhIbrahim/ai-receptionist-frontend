import { useEffect, useMemo, useRef, useState } from "react";
import TableCard from "./TableCard";
import EditableTable from "./EditableTable";

export default function FloorCanvas({
  data,
  mode = "live",
  onTableClick,
  onTableChange,
  onDeleteTable,
}) {
  const floor = data?.floor;
  const tables = data?.tables ?? [];

  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Single selection only
  const [selectedId, setSelectedId] = useState(null);

  /* ===============================
     Auto-scale
  =============================== */
  useEffect(() => {
    if (!floor?.width || !containerRef.current) return;

    const compute = () => {
      const containerWidth = containerRef.current.clientWidth;
      const nextScale = containerWidth / floor.width;
      setScale(Math.min(1, Math.max(0.6, nextScale)));
    };

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [floor?.width]);

  const boardStyle = useMemo(
    () => ({
      position: "relative",
      width: floor?.width || 0,
      height: floor?.height || 0,
      background: "#F2F2F7",
      borderRadius: 24,
      boxShadow: `
        0 1px 2px rgba(0,0,0,0.05),
        0 10px 30px rgba(0,0,0,0.06)
      `,
      border: "1px solid rgba(0,0,0,0.04)",
      transform: `scale(${scale})`,
      transformOrigin: "top left",
    }),
    [floor?.width, floor?.height, scale]
  );

  if (!floor) return null;

  /* ===============================
     Handlers
  =============================== */

  const clearSelection = () => {
    setSelectedId(null);
  };

  const handleDelete = (id) => {
    if (typeof onDeleteTable === "function") {
      onDeleteTable(id);
    }
    setSelectedId(null);
  };

  /* ===============================
     Render
  =============================== */

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        marginTop: 24,
        overflow: "auto",
        borderRadius: 16,
      }}
    >
      <div
        style={{
          width: Math.ceil((floor.width || 0) * scale),
          height: Math.ceil((floor.height || 0) * scale),
        }}
      >
        <div style={boardStyle} onClick={clearSelection}>
          {mode === "edit"
            ? tables.map((table) => (
                <EditableTable
                  key={table._id}
                  table={table}
                  isSelected={selectedId === table._id}
                  onSelect={setSelectedId}
                  onChange={(updatedTable) => {
                    if (typeof onTableChange === "function") {
                      onTableChange(updatedTable);
                    }
                  }}
                  onDelete={handleDelete}
                />
              ))
            : tables.map((table) => (
                <TableCard
                  key={table._id}
                  table={table}
                  onClick={
                    onTableClick
                      ? () => onTableClick(table)
                      : undefined
                  }
                />
              ))}
        </div>
      </div>
    </div>
  );
}