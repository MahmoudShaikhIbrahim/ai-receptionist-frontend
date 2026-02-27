import { useEffect, useRef, useState } from "react";
import { getFloors, getLiveFloor } from "../../api/business";
import { seatWalkIn, setTableMaintenance } from "../../api/tables";
import TableDetailsPanel from "../../components/floor/TableDetailsPanel";
import FloorCanvas from "../../components/floor/FloorCanvas";
import { Outlet } from "react-router-dom";

function formatTime(dt) {
  try {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  } catch {
    return "";
  }
}

export default function FloorLive() {
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [liveData, setLiveData] = useState(null);
  

  const [selectedTable, setSelectedTable] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ===========================
     LOAD FLOORS
  ============================ */
  useEffect(() => {
    loadFloors();
  }, []);

  useEffect(() => {
    if (!selectedFloor) return;

    loadLiveFloor(selectedFloor);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      loadLiveFloor(selectedFloor);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedFloor]);

  const loadFloors = async () => {
    try {
      const data = await getFloors();
      if (!mountedRef.current) return;

      setFloors(data.floors || []);
      if (data.floors?.length > 0) {
        setSelectedFloor(data.floors[0]._id);
      }
    } catch (err) {
      console.error("Failed to load floors:", err);
    }
  };

  const loadLiveFloor = async (floorId) => {
    try {
      const data = await getLiveFloor(floorId);
      if (!mountedRef.current) return;

      setLiveData(data);

      if (selectedTable) {
        const refreshed =
          data?.tables?.find(
            (t) => String(t._id) === String(selectedTable._id)
          ) || null;
        setSelectedTable(refreshed);
      }
    } catch (err) {
      console.error("Failed to load live floor:", err);
    }
  };

  /* ===========================
     ACTIONS
  ============================ */

  const closeModal = () => {
    setSelectedTable(null);
    setActionError("");
    setActionLoading(false);
  };

  const handleSeatWalkIn = async () => {
    if (!selectedTable?._id) return;

    setActionLoading(true);
    setActionError("");

    try {
      await seatWalkIn(selectedTable._id);
      await loadLiveFloor(selectedFloor);
      closeModal();
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to seat walk-in";
      setActionError(msg);
      setActionLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!selectedTable?._id) return;

    setActionLoading(true);
    setActionError("");

    try {
      await setTableMaintenance(
        selectedTable._id,
        selectedTable.status !== "maintenance"
      );

      await loadLiveFloor(selectedFloor);
      closeModal();
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update maintenance";
      setActionError(msg);
      setActionLoading(false);
    }
  };

  const canSeatWalkIn =
    selectedTable && selectedTable.status === "free";

  const statusLabel = (status) => {
    if (status === "maintenance") return "Maintenance";
    if (status === "seated") return "Seated";
    if (status === "booked") return "Booked";
    return "Free";
  };

  /* ===========================
     RENDER
  ============================ */

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 12 }}>Live Floor</h2>

      <select
        value={selectedFloor || ""}
        onChange={(e) => setSelectedFloor(e.target.value)}
        style={{
          padding: "10px 14px",
          fontSize: 15,
          borderRadius: 10,
          border: "1px solid rgba(0,0,0,0.12)",
          outline: "none",
          background: "#FFFFFF",
          color: "#1D1D1F",
        }}
      >
        {floors.map((floor) => (
          <option key={floor._id} value={floor._id}>
            {floor.name}
          </option>
        ))}
      </select>

      {liveData && (
        <FloorCanvas
          data={liveData}
          onTableClick={(table) => {
            setSelectedTable(table);
            setActionError("");
          }}
        />
      )}
      <TableDetailsPanel
  table={selectedTable}
  onClose={() => setSelectedTable(null)}
/>

      {/* ================= MODAL ================= */}
      {selectedTable && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#FFFFFF",
              borderRadius: 18,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              padding: 18,
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui',
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {selectedTable.label}
                </div>
                <div style={{ fontSize: 13, color: "#6E6E73" }}>
                  {selectedTable.capacity} seats •{" "}
                  {statusLabel(selectedTable.status)}
                </div>
              </div>

              <button
                onClick={closeModal}
                style={{
                  border: "none",
                  background: "rgba(0,0,0,0.05)",
                  borderRadius: 10,
                  padding: "8px 10px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: 12,
                  background: "rgba(255,59,48,0.10)",
                  color: "#B42318",
                  fontSize: 13,
                }}
              >
                {actionError}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                onClick={closeModal}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "#FFFFFF",
                  fontWeight: 600,
                }}
              >
                Close
              </button>

              <button
                onClick={handleSeatWalkIn}
                disabled={!canSeatWalkIn || actionLoading}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "none",
                  background:
                    !canSeatWalkIn || actionLoading
                      ? "#D2D2D7"
                      : "#007AFF",
                  color: "#FFFFFF",
                  fontWeight: 700,
                }}
              >
                {actionLoading ? "Seating..." : "Seat Walk-In"}
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              <button
                onClick={handleToggleMaintenance}
                disabled={actionLoading}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background:
                    selectedTable.status === "maintenance"
                      ? "#34C759"
                      : "#FF3B30",
                  color: "#FFFFFF",
                  fontWeight: 700,
                }}
              >
                {selectedTable.status === "maintenance"
                  ? "Remove Maintenance"
                  : "Mark Maintenance"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Outlet />
    </div>
  );
}