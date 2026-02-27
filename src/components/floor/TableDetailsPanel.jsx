import { useEffect } from "react";

export default function TableDetailsPanel({
  table,
  onClose,
}) {
  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  if (!table) return null;

  const booking = table.booking;

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0 }}>
            {table.label}
          </h2>
          <button onClick={onClose} style={closeBtn}>
            ✕
          </button>
        </div>

        <div style={sectionStyle}>
          <StatusBadge status={table.status} />

          {booking ? (
            <>
              <InfoRow label="Customer" value={booking.customerName || "Walk-in"} />
              <InfoRow label="Phone" value={booking.customerPhone || "-"} />
              <InfoRow label="Guests" value={booking.partySize} />
              <InfoRow
                label="Time"
                value={
                  new Date(booking.startIso).toLocaleTimeString() +
                  " - " +
                  new Date(booking.endIso).toLocaleTimeString()
                }
              />
              <InfoRow label="Source" value={booking.source} />
            </>
          ) : (
            <p style={{ opacity: 0.6 }}>
              No active booking
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.6 }}>
        {label}
      </div>
      <div style={{ fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    free: "#34C759",
    seated: "#FF3B30",
    booked: "#FF9F0A",
    maintenance: "#8E8E93",
  };

  return (
    <div
      style={{
        display: "inline-block",
        padding: "6px 12px",
        borderRadius: 20,
        background: colors[status] || "#8E8E93",
        color: "#FFFFFF",
        fontSize: 13,
        marginBottom: 20,
      }}
    >
      {status.toUpperCase()}
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.25)",
  backdropFilter: "blur(8px)",
  display: "flex",
  justifyContent: "flex-end",
  zIndex: 1000,
};

const panelStyle = {
  width: 360,
  background: "#FFFFFF",
  padding: 24,
  boxShadow: "-10px 0 40px rgba(0,0,0,0.1)",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
};

const sectionStyle = {
  fontSize: 15,
};

const closeBtn = {
  border: "none",
  background: "transparent",
  fontSize: 18,
  cursor: "pointer",
};