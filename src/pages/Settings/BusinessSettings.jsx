// src/pages/Settings/BusinessSettings.jsx
import { useEffect, useState } from "react";
import { getBusinessMe, updateBusinessProfile } from "../../api/api";

export default function BusinessSettings() {
  const [profile, setProfile] = useState({
    businessName: "",
    ownerEmail: "",
    ownerPhoneNumber: "",
    businessPhoneNumber: "",
    vatPercentage: 5,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getBusinessMe();
        if (!mounted) return;
        setProfile({
          businessName: data.business.businessName || "",
          ownerEmail: data.business.email || "",
          ownerPhoneNumber: data.business.ownerPhoneNumber || "",
          businessPhoneNumber: data.business.businessPhoneNumber || "",
          vatPercentage: data.business.vatPercentage ?? 5,
        });
      } catch {
        if (mounted) setErr("Failed to load business profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setProfile(p => ({ ...p, [name]: name === "vatPercentage" ? Number(value) : value }));
  }

  async function handleSave() {
    setErr(""); setMsg("");
    try {
      setSaving(true);
      await updateBusinessProfile(profile);
      setMsg("Profile updated successfully.");
    } catch {
      setErr("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="pageSubtitle">Loading settings…</p>;

  return (
    <div className="page">
      <div>
        <h1 className="pageTitle">Business Settings</h1>
        <p className="pageSubtitle">Manage your business contact information</p>
      </div>

      {err && <div className="alert alert--error">{err}</div>}
      {msg && <div className="alert alert--success">{msg}</div>}

      <section className="card">
        <div className="cardHeader"><h2>Business Profile</h2></div>
        <div className="formGrid">
          <Field label="Business Name">
            <input className="input" name="businessName" value={profile.businessName} onChange={handleChange} />
          </Field>
          <Field label="Owner Email">
            <input className="input" name="ownerEmail" value={profile.ownerEmail} disabled />
          </Field>
          <Field label="Owner Phone Number">
            <input className="input" name="ownerPhoneNumber" value={profile.ownerPhoneNumber} onChange={handleChange} placeholder="+9715xxxxxxx" />
          </Field>
          <Field label="Business Phone Number">
            <input className="input" name="businessPhoneNumber" value={profile.businessPhoneNumber} onChange={handleChange} placeholder="+9714xxxxxxx" />
          </Field>
        </div>
        <button className="buttonPrimary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </section>

      <section className="card">
        <div className="cardHeader"><h2>Billing Settings</h2></div>
        <p className="pageSubtitle" style={{ marginTop: -16, marginBottom: 20 }}>
          Set your VAT percentage for bill calculations.
        </p>
        <div className="formGrid">
          <Field label="VAT Percentage (%)">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                className="input"
                name="vatPercentage"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={profile.vatPercentage}
                onChange={handleChange}
                style={{ maxWidth: 120 }}
              />
              <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500 }}>
                % — UAE standard is 5%
              </span>
            </div>
          </Field>
        </div>
        <button className="buttonPrimary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </section>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="formField">
      <label>{label}</label>
      {children}
    </div>
  );
}