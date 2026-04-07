// src/pages/Settings/FloorLayoutPage.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { getFloors, getFloorLayout, updateFloorLayout } from "../../api/business";
import FloorCanvas from "../../components/floor/FloorCanvas";
import apiClient from "../../api/client";
import AddTableModal from "../../components/floor/AddTableModal";

function nextSuggestedLabel(existingLabels) {
  const nums = existingLabels
    .map((l) => String(l || "").trim())
    .map((l) => { const m = /^T(\d+)$/i.exec(l); return m ? Number(m[1]) : null; })
    .filter((n) => Number.isFinite(n));
  return `T${(nums.length ? Math.max(...nums) : 0) + 1}`;
}

export default function FloorLayoutPage() {
  const [floors, setFloors] = useState([]);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [layoutData, setLayoutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [addFloorOpen, setAddFloorOpen] = useState(false);
  const [newFloorName, setNewFloorName] = useState("");
  const [floorLoading, setFloorLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadFloors(); }, []);
  useEffect(() => { if (selectedFloorId) loadFloorLayout(selectedFloorId); }, [selectedFloorId]);

  async function loadFloors() {
    const data = await getFloors();
    const list = data.floors || [];
    setFloors(list);
    if (list.length > 0 && !selectedFloorId) setSelectedFloorId(list[0]._id);
  }

  async function loadFloorLayout(floorId) {
    const data = await getFloorLayout(floorId);
    setLayoutData({ floor: data.floor, tables: data.tables || [] });
    setDirty(false);
  }

  async function handleAddFloor() {
    if (!newFloorName.trim()) return;
    setFloorLoading(true);
    try {
      const res = await apiClient.post("/floors", { name: newFloorName.trim() });
      const newFloor = res.data.floor;
      setFloors(prev => [...prev, newFloor]);
      setSelectedFloorId(newFloor._id);
      setNewFloorName("");
      setAddFloorOpen(false);
    } catch {
      alert("Failed to create floor");
    } finally {
      setFloorLoading(false);
    }
  }

  function handleDeleteFloor() {
    if (!selectedFloorId || floors.length <= 1) return;
    setConfirmState({
      title: "Delete this floor?",
      message: "All tables on this floor will be permanently deleted. This cannot be undone.",
      onConfirm: async () => {
        await apiClient.delete(`/floors/${selectedFloorId}`);
        const remaining = floors.filter(f => f._id !== selectedFloorId);
        setFloors(remaining);
        setSelectedFloorId(remaining[0]?._id || null);
      },
    });
  }

  const handleImportLayout = () => { if (selectedFloorId) fileInputRef.current?.click(); };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFloorId) return;
    try {
      const formData = new FormData();
      formData.append("image", file);
      await apiClient.post(`/floors/${selectedFloorId}/layout-image`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      e.target.value = "";
      await loadFloorLayout(selectedFloorId);
    } catch { alert("Failed to upload layout image"); }
  };

  const handleRemoveLayout = () => {
    if (!selectedFloorId) return;
    setConfirmState({
      title: "Remove layout image?",
      message: "This will permanently remove the background layout image.",
      onConfirm: async () => {
        await apiClient.delete(`/floors/${selectedFloorId}/layout-image`);
        await loadFloorLayout(selectedFloorId);
      },
    });
  };

  const existingLabels = useMemo(() => (layoutData?.tables || []).map(t => t.label), [layoutData]);
  const suggestedLabel = useMemo(() => nextSuggestedLabel(existingLabels), [existingLabels]);

  const handleTableChange = (updatedTable) => {
    setLayoutData(prev => ({ ...prev, tables: prev.tables.map(t => t._id === updatedTable._id ? updatedTable : t) }));
    setDirty(true);
  };

  const handleDeleteTable = (tableId) => {
    setConfirmState({
      title: "Delete table?",
      message: "This action cannot be undone. The table will be permanently removed.",
      onConfirm: async () => {
        await apiClient.delete(`/tables/${tableId}/hard`);
        setLayoutData(prev => ({ ...prev, tables: prev.tables.filter(t => t._id !== tableId) }));
        setDirty(true);
      },
    });
  };

  const handleCreateTable = async ({ label, capacity, shape }) => {
    if (!selectedFloorId) return;
    try {
      const res = await apiClient.post("/tables", { label, capacity, shape: shape || "rect", floorId: selectedFloorId, x: 120, y: 120, w: 140, h: 120, zone: null });
      setLayoutData(prev => ({ ...prev, tables: [...(prev?.tables || []), res.data.table] }));
      setDirty(true);
      setAddOpen(false);
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || "Failed to create table");
    }
  };

  const handleSave = async () => {
    if (!selectedFloorId || !layoutData) return;
    setLoading(true);
    await updateFloorLayout(selectedFloorId, {
      tables: layoutData.tables.map(t => ({ _id: t._id, label: t.label, capacity: t.capacity, shape: t.shape, zone: t.zone, isActive: t.isActive, x: t.x, y: t.y, w: t.w, h: t.h })),
    });
    setLoading(false);
    setDirty(false);
  };

  return (
    <div style={{ padding: 24, background: "#F5F5F7", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 0.6, opacity: 0.55, fontWeight: 800 }}>FLOOR LAYOUT</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>Editor</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={handleOpenAdd} style={btnStyle}>+ Add table</button>
            <button onClick={handleImportLayout} style={btnStyle}>Import Layout</button>
            <button onClick={handleRemoveLayout} style={btnStyle}>Remove Layout</button>
            <button onClick={handleSave} disabled={!dirty || loading} style={{ ...btnStyle, background: !dirty ? "#D2D2D7" : "#007AFF", color: "#fff", border: "none", cursor: !dirty ? "not-allowed" : "pointer" }}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Floor Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {floors.map(floor => (
            <button
              key={floor._id}
              onClick={() => setSelectedFloorId(floor._id)}
              style={{
                padding: "8px 16px", borderRadius: 10, border: "1px solid",
                borderColor: selectedFloorId === floor._id ? "#007AFF" : "rgba(0,0,0,0.12)",
                background: selectedFloorId === floor._id ? "rgba(0,113,227,0.10)" : "rgba(255,255,255,0.75)",
                color: selectedFloorId === floor._id ? "#007AFF" : "#1D1D1F",
                fontWeight: 700, cursor: "pointer", fontSize: 13,
              }}
            >
              {floor.name}
            </button>
          ))}
          <button
            onClick={() => setAddFloorOpen(true)}
            style={{ padding: "8px 16px", borderRadius: 10, border: "1px dashed rgba(0,0,0,0.25)", background: "transparent", fontWeight: 700, cursor: "pointer", fontSize: 13, color: "#007AFF" }}
          >
            + Add Floor
          </button>
          {floors.length > 1 && (
            <button
              onClick={handleDeleteFloor}
              style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,59,48,0.3)", background: "rgba(255,59,48,0.06)", fontWeight: 700, cursor: "pointer", fontSize: 13, color: "#FF3B30" }}
            >
              Delete Floor
            </button>
          )}
        </div>

        {/* Canvas */}
        {layoutData && (
          <div style={cardStyle}>
            <FloorCanvas data={layoutData} mode="edit" onTableChange={handleTableChange} onDeleteTable={handleDeleteTable} />
          </div>
        )}

        {!layoutData && (
          <div style={{ ...cardStyle, padding: 60, textAlign: "center", color: "#86868B" }}>
            No floor selected or no tables yet. Add a table to get started.
          </div>
        )}
      </div>

      {/* Add Floor Modal */}
      {addFloorOpen && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ margin: "0 0 16px" }}>Add New Floor</h3>
            <input
              className="input"
              placeholder="Floor name (e.g. Main Floor, Rooftop)"
              value={newFloorName}
              onChange={e => setNewFloorName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddFloor()}
              autoFocus
              style={{ width: "100%", marginBottom: 20, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <button style={cancelBtn} onClick={() => { setAddFloorOpen(false); setNewFloorName(""); }}>Cancel</button>
              <button
                style={{ ...confirmBtn, background: "#007AFF" }}
                onClick={handleAddFloor}
                disabled={floorLoading || !newFloorName.trim()}
              >
                {floorLoading ? "Creating..." : "Create Floor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmState && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ margin: 0 }}>{confirmState.title}</h3>
            <p style={{ marginTop: 8, fontSize: 14, color: "#555" }}>{confirmState.message}</p>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button style={cancelBtn} onClick={() => setConfirmState(null)}>Cancel</button>
              <button style={confirmBtn} onClick={async () => { await confirmState.onConfirm(); setConfirmState(null); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />

      <AddTableModal open={addOpen} onClose={() => setAddOpen(false)} onCreate={handleCreateTable} existingLabels={existingLabels} defaultLabel={suggestedLabel} defaultCapacity={4} />
    </div>
  );

  function handleOpenAdd() { setAddOpen(true); }
}

const btnStyle = { height: 40, padding: "0 14px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.75)", fontWeight: 800, cursor: "pointer" };
const cardStyle = { background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 20, padding: 16, boxShadow: "0 10px 40px rgba(0,0,0,0.06)" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 };
const modalStyle = { width: 380, borderRadius: 24, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", textAlign: "center" };
const cancelBtn = { flex: 1, padding: "12px 0", borderRadius: 14, border: "none", background: "#E5E5EA", cursor: "pointer" };
const confirmBtn = { flex: 1, padding: "12px 0", borderRadius: 14, border: "none", background: "#FF3B30", color: "#fff", fontWeight: 600, cursor: "pointer" };