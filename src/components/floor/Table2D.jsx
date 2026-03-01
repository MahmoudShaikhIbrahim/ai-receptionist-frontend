export default function Table2D({
  table,
  showChairs = true,
  interactive = false,
}) {
  const width = table.w;
  const height = table.h;
  const capacity = Number(table.capacity || 0);

  const isRound = Math.abs(width - height) < 10;

  const renderChairs = () => {
    if (!showChairs || capacity <= 0) return null;

    const chairs = [];
    const radiusX = width / 2 + 22;
    const radiusY = height / 2 + 22;

    for (let i = 0; i < capacity; i++) {
      const angle = (i / capacity) * 2 * Math.PI;
      const x = Math.cos(angle) * radiusX;
      const y = Math.sin(angle) * radiusY;
      const rotate = (angle * 180) / Math.PI + 90;

      chairs.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotate}deg)`,
            width: 22,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 16,
              height: 12,
              borderRadius: 4,
              background: "#E5E5EA",
              boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -5,
                left: 3,
                right: 3,
                height: 4,
                borderRadius: 3,
                background: "#C7C7CC",
              }}
            />
          </div>
        </div>
      );
    }

    return chairs;
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Table surface */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: isRound ? "50%" : 18,
          background: "linear-gradient(145deg, #3A3A3C, #1C1C1E)",
          boxShadow:
            "0 12px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: 0.5,
          }}
        >
          {table.label}
        </span>
      </div>

      {renderChairs()}
    </div>
  );
}