import { useEffect, useState } from "react";
import {
  getFloors,
  getFloorLayout,
  updateFloorLayout,
} from "../../api/business";
import FloorCanvas from "../../components/floor/FloorCanvas";
import apiClient from "../../api/client";

export default function FloorLayoutPage() {
  const [floors, setFloors] = useState([]);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [layoutData, setLayoutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  /* ===========================
     LOAD FLOORS
  ============================ */
  useEffect(() => {
    loadFloors();
  }, []);

  useEffect(() => {
    if (!selectedFloorId) return;
    loadFloorLayout(selectedFloorId);
  }, [selectedFloorId]);

  async function loadFloors() {
    const data = await getFloors();
    const list = data.floors || [];
    setFloors(list);

    if (list.length > 0) {
      setSelectedFloorId(list[0]._id);
    }
  }

  async function loadFloorLayout(floorId) {
    const data = await getFloorLayout(floorId);

    setLayoutData({
      floor: data.floor,
      tables: data.tables || [],
    });

    setDirty(false);
  }

  /* ===========================
     TABLE UPDATE
  ============================ */
  const handleTableChange = (updatedTable) => {
    setLayoutData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        tables: prev.tables.map((t) =>
          t._id === updatedTable._id ? updatedTable : t
        ),
      };
    });

    setDirty(true);
  };

  /* ===========================
     DELETE TABLE
  ============================ */
  const handleDeleteTable = async (tableId) => {
    if (!window.confirm("Delete this table?")) return;

    await apiClient.delete(`/tables/${tableId}`);

    setLayoutData((prev) => ({
      ...prev,
      tables: prev.tables.filter((t) => t._id !== tableId),
    }));

    setDirty(true);
  };

  /* ===========================
     DUPLICATE TABLE
  ============================ */
  const handleDuplicateTable = async (table) => {
    const res = await apiClient.post("/tables", {
      label: `${table.label}_copy`,
      capacity: table.capacity,
      floorId: selectedFloorId,
      x: table.x + 30,
      y: table.y + 30,
      w: table.w,
      h: table.h,
      zone: table.zone || null,
    });

    const newTable = res.data.table;

    setLayoutData((prev) => ({
      ...prev,
      tables: [...prev.tables, newTable],
    }));

    setDirty(true);
  };

  /* ===========================
     ADD TABLE
  ============================ */
  const handleAddTable = async () => {
  if (!selectedFloorId) return;

  try {
    const res = await apiClient.post("/tables", {
      label: `T${Date.now().toString().slice(-3)}`,
      capacity: 4,
      floorId: selectedFloorId,
      x: 100,
      y: 100,
      w: 120,
      h: 120,
    });

    const newTable = res.data.table;

    setLayoutData((prev) => ({
      ...prev,
      tables: [...prev.tables, newTable],
    }));

    setDirty(true);
  } catch (err) {
    console.error(err);
  }
};

  /* ===========================
     SAVE LAYOUT
  ============================ */
  const handleSave = async () => {
    if (!selectedFloorId || !layoutData) return;

    setLoading(true);

    await updateFloorLayout(selectedFloorId, {
      tables: layoutData.tables.map((t) => ({
        _id: t._id,
        x: t.x,
        y: t.y,
        w: t.w,
        h: t.h,
        rotation: t.rotation || 0,
      })),
    });

    setLoading(false);
    setDirty(false);
  };

  /* ===========================
     RENDER
  ============================ */
  return (
    <div
      style={{
        padding: 40,
        background: "#F5F5F7",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 24 }}>
        Floor Layout Editor
      </h1>

      {/* FLOOR TABS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {floors.map((floor) => (
          <button
            key={floor._id}
            onClick={() => setSelectedFloorId(floor._id)}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border:
                selectedFloorId === floor._id
                  ? "2px solid #007AFF"
                  : "1px solid #D2D2D7",
              background:
                selectedFloorId === floor._id
                  ? "#EAF3FF"
                  : "#FFFFFF",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {floor.name}
          </button>
        ))}
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button
          onClick={handleAddTable}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: "#007AFF",
            color: "#FFFFFF",
            fontWeight: 600,
          }}
        >
          + Add Table
        </button>

        <button
          onClick={handleSave}
          disabled={!dirty || loading}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: !dirty ? "#D2D2D7" : "#34C759",
            color: "#FFFFFF",
            fontWeight: 600,
          }}
        >
          {loading ? "Saving..." : "Save Layout"}
        </button>
      </div>

      {/* CANVAS */}
      {layoutData && (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            padding: 20,
            boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
          }}
        >
          <FloorCanvas
            data={layoutData}
            mode="edit"
            onTableChange={handleTableChange}
            onDeleteTable={handleDeleteTable}
            onDuplicateTable={handleDuplicateTable}
          />
        </div>
      )}
    </div>
  );
}