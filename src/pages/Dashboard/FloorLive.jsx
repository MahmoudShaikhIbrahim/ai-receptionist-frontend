// src/pages/Dashboard/FloorLive.jsx
import { useEffect, useRef, useState } from "react";
import { getFloors, getLiveFloor } from "../../api/business";
import { seatWalkIn, setTableMaintenance, setTableAvailable } from "../../api/tables";
import TableDetailsPanel from "../../components/floor/TableDetailsPanel";
import FloorCanvas from "../../components/floor/FloorCanvas";

export default function FloorLive() {
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [showPanelView, setShowPanelView] = useState("order");

  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => { loadFloors(); }, []);

  useEffect(() => {
    if (!selectedFloor) return;
    loadLiveFloor(selectedFloor);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => loadLiveFloor(selectedFloor), 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [selectedFloor]);

  const loadFloors = async () => {
    try {
      const data = await getFloors();
      if (!mountedRef.current) return;
      setFloors(data.floors || []);
      if (data.floors?.length > 0) setSelectedFloor(data.floors[0]._id);
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
        const refreshed = data?.tables?.find(t => String(t._id) === String(selectedTable._id)) || null;
        setSelectedTable(refreshed);
      }
    } catch (err) {
      console.error("Failed to load live floor:", err);
    }
  };

  const closeModal = () => {
    setSelectedTable(null);
    setShowPanel(false);
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
      setActionError(err?.response?.data?.error || err?.message || "Failed to seat walk-in");
      setActionLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!selectedTable?._id) return;
    setActionLoading(true);
    setActionError("");
    try {
      await setTableMaintenance(selectedTable._id, selectedTable.status !== "maintenance");
      await loadLiveFloor(selectedFloor);
      closeModal();
    } catch (err) {
      setActionError(err?.response?.data?.error || err?.message || "Failed to update maintenance");
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 12 }}>Live Floor</h2>

      {/* Floor selector */}
      <select
        value={selectedFloor || ""}
        onChange={e => setSelectedFloor(e.target.value)}
        style={{ padding: "10px 14px", fontSize: 15, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", outline: "none", background: "#FFFFFF", color: "#1D1D1F" }}
      >
        {floors.map(floor => (
          <option key={floor._id} value={floor._id}>{floor.name}</option>
        ))}
      </select>

      {liveData && (
        <FloorCanvas
          data={liveData}
          onTableClick={(table) => {
            setSelectedTable(table);
            setShowPanel(false);
            setActionError("");
          }}
        />
      )}

      {/* TableDetailsPanel — only shows, no modal blocking it */}
      {showPanel && (
  <TableDetailsPanel
    table={selectedTable}
    initialView={showPanelView}
    onClose={closeModal}
  />
)}

      {/* Action Modal — only for Available / Walk-in / Maintenance */}
      {selectedTable && !showPanel && (
        <div
          onClick={closeModal}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 440, background: "#FFFFFF", borderRadius: 20, padding: 24, boxShadow: "0 25px 80px rgba(0,0,0,0.25)" }}
          >
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedTable.label}</div>
              <div style={{ fontSize: 13, color: "#6E6E73" }}>{selectedTable.capacity} seats</div>
            </div>

            {selectedTable.booking ? (
              <div style={{ background: "#F2F2F7", borderRadius: 14, padding: 14, marginBottom: 18, fontSize: 14 }}>
                <div><strong>Name:</strong> {selectedTable.booking.customerName || "Walk-in"}</div>
                <div><strong>Phone:</strong> {selectedTable.booking.customerPhone || "-"}</div>
                <div><strong>Guests:</strong> {selectedTable.booking.partySize}</div>
                <div><strong>Time:</strong> {new Date(selectedTable.booking.startIso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dubai" })}</div>
              </div>
            ) : (
              <div style={{ background: "#F2F2F7", borderRadius: 14, padding: 14, marginBottom: 18, fontSize: 14, color: "#6E6E73" }}>
                No active booking
              </div>
            )}

            {actionError && (
              <div style={{ marginBottom: 12, padding: 10, borderRadius: 12, background: "rgba(255,59,48,0.10)", color: "#B42318", fontSize: 13 }}>
                {actionError}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              {/* AVAILABLE */}
              <button
                disabled={actionLoading}
                onClick={async () => {
                  setActionLoading(true); setActionError("");
                  try { await setTableAvailable(selectedTable._id); await loadLiveFloor(selectedFloor); closeModal(); }
                  catch { setActionError("Failed to set available"); setActionLoading(false); }
                }}
                style={{ flex: 1, padding: "12px", borderRadius: 14, border: "none", background: "#34C759", color: "#FFFFFF", fontWeight: 700, cursor: "pointer" }}
              >
                Available
              </button>

              {/* WALK-IN — Red */}
              <button
                disabled={actionLoading || selectedTable.status !== "free"}
                onClick={handleSeatWalkIn}
                style={{ flex: 1, padding: "12px", borderRadius: 14, border: "none", background: selectedTable.status === "free" ? "#FF3B30" : "#D2D2D7", color: "#FFFFFF", fontWeight: 700, cursor: selectedTable.status === "free" ? "pointer" : "not-allowed" }}
              >
                Walk-in Guest
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              {/* MAINTENANCE — Grey when inactive, Green when active */}
              <button
                disabled={actionLoading}
                onClick={handleToggleMaintenance}
                style={{ flex: 1, padding: "12px", borderRadius: 14, border: "none", background: selectedTable.status === "maintenance" ? "#34C759" : "#8E8E93", color: "#FFFFFF", fontWeight: 700, cursor: "pointer" }}
              >
                {selectedTable.status === "maintenance" ? "Remove Maintenance" : "Maintenance"}
              </button>

              {/* TABLE ORDER — only for seated tables */}
              {selectedTable.status === "seated" && (
  <button
    onClick={() => { setShowPanel(true); setShowPanelView("order"); }}
    style={{ flex: 1, padding: "12px", borderRadius: 14, border: "none", background: "#0071E3", color: "#FFFFFF", fontWeight: 700, cursor: "pointer" }}
  >
    🍽 Table Order
  </button>
)}

              {/* CANCEL */}
              {selectedTable.status !== "seated" && (
                <button
                  disabled={actionLoading}
                  onClick={closeModal}
                  style={{ flex: 1, padding: "12px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.1)", background: "#FFFFFF", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
              )}
            </div>

            {selectedTable.status === "seated" && (
              <button
                onClick={closeModal}
                style={{ width: "100%", marginTop: 10, padding: "12px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.1)", background: "#FFFFFF", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}