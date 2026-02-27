export default function TableCard({ table, onClick }) {
  const statusColors = {
    free: {
      bg: "#E8F9EE",
      text: "#1E7E34",
    },
    seated: {
      bg: "#FFE5E5",
      text: "#C62828",
    },
    booked: {
      bg: "#FFF4E5",
      text: "#E65100",
    },
    maintenance: {
      bg: "#E5E5EA",
      text: "#5E5E5E",
    },
  };

  const color = statusColors[table.status] || statusColors.free;

  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        left: table.x,
        top: table.y,
        width: table.w,
        height: table.h,
        borderRadius: 20,
        background: "#FFFFFF",
        border: "1px solid rgba(0,0,0,0.05)",
        boxShadow: `
          0 1px 2px rgba(0,0,0,0.05),
          0 8px 20px rgba(0,0,0,0.06)
        `,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow =
          "0 12px 30px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow =
          "0 1px 2px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.06)";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          padding: "4px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          background: color.bg,
          color: color.text,
        }}
      >
        {table.status.toUpperCase()}
      </div>

      <div style={{ fontWeight: 600, fontSize: 16 }}>
        {table.label}
      </div>

      <div style={{ fontSize: 13, opacity: 0.6 }}>
        {table.capacity} seats
      </div>

      {table.booking && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            opacity: 0.7,
          }}
        >
          {table.booking.customerName || "Walk-in"}
        </div>
      )}
    </div>
  );
}