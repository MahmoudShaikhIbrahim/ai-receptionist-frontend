// src/pages/Settings/MenuSettings.jsx
import { useEffect, useState } from "react";
import { getAgentMe, updateAgentMe } from "../../api/api";

const CATEGORIES = ["Starters", "Mains", "Grills", "Sides", "Desserts", "Drinks", "Other"];

export default function MenuSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState(defaultForm());

  function defaultForm() {
    return { name: "", price: "", currency: "AED", category: "Mains", description: "", available: true };
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getAgentMe();
        if (!mounted) return;
        setItems(data.agent?.menu || []);
      } catch {
        if (mounted) setErr("Failed to load menu.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  function openAdd() {
    setForm(defaultForm());
    setEditIndex(null);
    setShowForm(true);
  }

  function openEdit(idx) {
    const item = items[idx];
    setForm({
      name: item.name || "",
      price: item.price?.toString() || "",
      currency: item.currency || "AED",
      category: item.category || "Mains",
      description: item.description || "",
      available: item.available !== false,
    });
    setEditIndex(idx);
    setShowForm(true);
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!form.name.trim()) return setErr("Item name is required.");
    if (!form.price || isNaN(Number(form.price))) return setErr("Enter a valid price.");

    const newItem = {
      name: form.name.trim(),
      price: Number(form.price),
      currency: form.currency,
      category: form.category,
      description: form.description.trim(),
      available: form.available,
    };

    const updatedItems = editIndex !== null
      ? items.map((it, i) => i === editIndex ? newItem : it)
      : [...items, newItem];

    setItems(updatedItems);
    setShowForm(false);
    setEditIndex(null);
    setForm(defaultForm());

    try {
      await updateAgentMe({ menu: updatedItems });
      setMsg(editIndex !== null ? "Item updated." : "Item added.");
    } catch {
      setErr("Failed to save menu.");
    }
  }

  async function deleteItem(idx) {
    setErr(""); setMsg("");
    const updatedItems = items.filter((_, i) => i !== idx);
    setItems(updatedItems);
    try {
      await updateAgentMe({ menu: updatedItems });
      setMsg("Item removed.");
    } catch {
      setErr("Failed to save menu.");
    }
  }

  async function toggleAvailable(idx) {
    const updatedItems = items.map((it, i) =>
      i === idx ? { ...it, available: !it.available } : it
    );
    setItems(updatedItems);
    try {
      await updateAgentMe({ menu: updatedItems });
    } catch {
      setErr("Failed to save.");
    }
  }

  // Group items by category
  const grouped = items.reduce((acc, item, idx) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ ...item, _idx: idx });
    return acc;
  }, {});

  if (loading) return <p className="pageSubtitle">Loading menu…</p>;

  return (
    <div className="page">
      <div>
        <h1 className="pageTitle">Menu</h1>
        <p className="pageSubtitle">Manage your restaurant menu items and prices.</p>
      </div>

      {err && <div className="alert alert--error">{err}</div>}
      {msg && <div className="alert alert--success">{msg}</div>}

      {/* Add / Edit Modal */}
      {showForm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div className="cardHeader">
              <h2>{editIndex !== null ? "Edit Item" : "Add Menu Item"}</h2>
              <button
                onClick={() => { setShowForm(false); setErr(""); }}
                style={styles.closeBtn}
              >✕</button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="formGrid">
                <div className="formField formField--full">
                  <label>Item Name</label>
                  <input
                    className="input"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Grilled Chicken"
                    autoFocus
                  />
                </div>

                <div className="formField">
                  <label>Price</label>
                  <input
                    className="input"
                    name="price"
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.price}
                    onChange={handleFormChange}
                    placeholder="45"
                  />
                </div>

                <div className="formField">
                  <label>Currency</label>
                  <select className="input" name="currency" value={form.currency} onChange={handleFormChange}>
                    <option value="AED">AED</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="SAR">SAR</option>
                  </select>
                </div>

                <div className="formField">
                  <label>Category</label>
                  <select className="input" name="category" value={form.category} onChange={handleFormChange}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="formField">
                  <label>Available</label>
                  <div style={styles.toggleRow}>
                    <input
                      type="checkbox"
                      name="available"
                      checked={form.available}
                      onChange={handleFormChange}
                      style={{ width: 18, height: 18, cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 14, color: form.available ? "#166534" : "var(--muted)" }}>
                      {form.available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </div>

                <div className="formField formField--full">
                  <label>Description (optional)</label>
                  <input
                    className="input"
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder="Brief description of the item"
                  />
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  className="buttonSecondary"
                  onClick={() => { setShowForm(false); setErr(""); }}
                >
                  Cancel
                </button>
                <button type="submit" className="buttonPrimary" style={{ marginTop: 0 }}>
                  {editIndex !== null ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Card */}
      <div className="card">
        <div className="cardHeader">
          <h2>{items.length} item{items.length !== 1 ? "s" : ""}</h2>
          <button className="buttonPrimary" style={{ marginTop: 0 }} onClick={openAdd}>
            + Add Item
          </button>
        </div>

        {items.length === 0 ? (
          <div style={styles.empty}>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>No menu items yet. Add your first item.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {Object.entries(grouped).map(([cat, catItems]) => (
              <div key={cat}>
                <p style={styles.categoryLabel}>{cat}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {catItems.map((item) => (
                    <div key={item._idx} style={styles.itemRow}>
                      <div style={styles.itemLeft}>
                        <div style={styles.itemDot(item.available)} />
                        <div>
                          <p style={styles.itemName}>{item.name}</p>
                          {item.description && (
                            <p style={styles.itemDesc}>{item.description}</p>
                          )}
                        </div>
                      </div>
                      <div style={styles.itemRight}>
                        <span style={styles.itemPrice}>
                          {item.price} {item.currency || "AED"}
                        </span>
                        <button
                          style={styles.toggleBtn(item.available)}
                          onClick={() => toggleAvailable(item._idx)}
                        >
                          {item.available ? "Available" : "Unavailable"}
                        </button>
                        <button
                          className="buttonSecondary"
                          style={{ padding: "6px 12px", fontSize: 12 }}
                          onClick={() => openEdit(item._idx)}
                        >
                          Edit
                        </button>
                        <button
                          style={styles.deleteBtn}
                          onClick={() => deleteItem(item._idx)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.25)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modal: {
    background: "rgba(255,255,255,0.95)",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 18,
    padding: 28,
    width: "100%",
    maxWidth: 540,
    boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
  },
  closeBtn: {
    background: "rgba(0,0,0,0.05)",
    border: "none",
    borderRadius: 8,
    width: 30,
    height: 30,
    cursor: "pointer",
    fontSize: 14,
    color: "var(--muted)",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    paddingTop: 8,
  },
  empty: {
    padding: "40px 0",
    textAlign: "center",
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: "0 0 10px 0",
  },
  itemRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderRadius: 12,
    background: "rgba(0,0,0,0.02)",
    border: "1px solid rgba(0,0,0,0.05)",
  },
  itemLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  itemDot: (available) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: available ? "#22C55E" : "#D1D5DB",
    flexShrink: 0,
  }),
  itemName: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
  },
  itemDesc: {
    margin: "2px 0 0",
    fontSize: 12,
    color: "var(--muted)",
  },
  itemRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--blue)",
    minWidth: 60,
    textAlign: "right",
  },
  toggleBtn: (available) => ({
    padding: "5px 10px",
    borderRadius: 999,
    border: "none",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    background: available ? "rgba(34,197,94,0.12)" : "rgba(0,0,0,0.06)",
    color: available ? "#166534" : "var(--muted)",
  }),
  deleteBtn: {
    background: "rgba(255,59,48,0.08)",
    border: "none",
    borderRadius: 8,
    width: 28,
    height: 28,
    cursor: "pointer",
    fontSize: 12,
    color: "#B42318",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};