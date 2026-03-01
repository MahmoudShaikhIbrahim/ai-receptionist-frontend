// src/components/floor/FloorCanvas.jsx
import { useEffect, useRef, useState } from "react";
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

  const [fitScale, setFitScale] = useState(1);
  const [imageRatio, setImageRatio] = useState(null);

  /* ===============================
     Detect Image Aspect Ratio
  =============================== */
  useEffect(() => {
    if (!floor?.layoutImageUrl) {
      setImageRatio(null);
      return;
    }

    const apiBase =
      import.meta.env.VITE_API_URL || "http://localhost:3000";

    const img = new Image();
    img.src = `${apiBase}${floor.layoutImageUrl}`;

    img.onload = () => {
      const ratio = img.height / img.width;
      setImageRatio(ratio);
    };
  }, [floor?.layoutImageUrl]);

  /* ===============================
     Fit to container width
  =============================== */
  useEffect(() => {
    if (!floor?.width) return;

    const compute = () => {
      if (!containerRef.current) return;

      const containerWidth =
        containerRef.current.clientWidth || 1;

      const nextScale = containerWidth / floor.width;

      const safeScale = Math.min(1, Math.max(0.1, nextScale));

      setFitScale(safeScale);
    };

    compute();
    window.addEventListener("resize", compute);

    return () => {
      window.removeEventListener("resize", compute);
    };
  }, [floor?.width]);

  if (!floor) return null;

  const boardWidth = Math.round(
    (floor.width || 0) * fitScale
  );

  // 🔥 CRITICAL FIX:
  // If image exists → use real image ratio
  // Otherwise → fallback to DB height
  const boardHeight = imageRatio
    ? boardWidth * imageRatio
    : Math.round((floor.height || 0) * fitScale);

  /* ===============================
     Background Image
  =============================== */

  const apiBase =
    import.meta.env.VITE_API_URL || "http://localhost:3000";

  const backgroundUrl = floor.layoutImageUrl
    ? `${apiBase}${floor.layoutImageUrl}`
    : null;

  const boardStyle = {
    position: "relative",
    width: boardWidth,
    height: boardHeight,
    borderRadius: 24,
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow:
      "0 1px 2px rgba(0,0,0,0.04), 0 10px 30px rgba(0,0,0,0.06)",
    overflow: "hidden",
    backgroundColor: "#F2F2F7",
    backgroundImage: backgroundUrl
      ? `url(${backgroundUrl})`
      : undefined,

    // ✅ PERFECT FIT — NO CROP, NO ZOOM
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        marginTop: 16,
      }}
    >
      <div style={boardStyle}>
        {tables.map((original) => {
          const scaled = {
            ...original,
            x: (original.x ?? 0) * fitScale,
            y: (original.y ?? 0) * fitScale,
            w: (original.w ?? 120) * fitScale,
            h: (original.h ?? 120) * fitScale,
          };

          return (
            <EditableTable
              key={original._id}
              table={scaled}
              mode={mode}
              canvasScale={1}
              status={original.status}
              onClick={
                mode === "live"
                  ? () => onTableClick?.(original)
                  : undefined
              }
              onChange={
                mode === "edit"
                  ? (updatedScaled) => {
                      onTableChange?.({
                        ...original,
                        ...updatedScaled,
                        x: (updatedScaled.x ?? 0) / fitScale,
                        y: (updatedScaled.y ?? 0) / fitScale,
                        w: (updatedScaled.w ?? 120) / fitScale,
                        h: (updatedScaled.h ?? 120) / fitScale,
                      });
                    }
                  : undefined
              }
              onDelete={
                mode === "edit"
                  ? () => onDeleteTable?.(original._id)
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}