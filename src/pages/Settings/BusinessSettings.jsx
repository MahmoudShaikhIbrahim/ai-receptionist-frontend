// src/pages/Settings/BusinessSettings.jsx
import { useEffect, useState } from "react";
import {
  getBusinessMe,
  updateBusinessProfile,
} from "../../api/api";

export default function BusinessSettings() {
  const [profile, setProfile] = useState({
    businessName: "",
    ownerEmail: "",
    ownerPhoneNumber: "",
    businessPhoneNumber: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  /* ======================
     LOAD BUSINESS PROFILE
  ====================== */
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
        });

        setErr("");
      } catch {
        if (mounted) setErr("Failed to load business profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  /* ======================
     HANDLE CHANGE
  ====================== */
  function handleChange(e) {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
  }

  /* ======================
     SAVE PROFILE
  ====================== */
  async function handleSave() {
    setErr("");
    setMsg("");

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

  /* ======================
     RENDER
  ====================== */
  if (loading) {
    return <p className="pageSubtitle">Loading settings…</p>;
  }

  return (
    <div className="page">
      <div>
        <h1 className="pageTitle">Business Settings</h1>
        <p className="pageSubtitle">
          Manage your business contact information
        </p>
      </div>

      {err && <div className="alert alert--error">{err}</div>}
      {msg && <div className="alert alert--success">{msg}</div>}

      <section className="card">
        <div className="cardHeader">
          <h2>Business Profile</h2>
        </div>

        <div className="formGrid">
          <Field label="Business Name">
            <input
              className="input"
              name="businessName"
              value={profile.businessName}
              onChange={handleChange}
            />
          </Field>

          <Field label="Owner Email">
            <input
              className="input"
              name="ownerEmail"
              value={profile.ownerEmail}
              disabled
            />
          </Field>

          <Field label="Owner Phone Number">
            <input
              className="input"
              name="ownerPhoneNumber"
              value={profile.ownerPhoneNumber}
              onChange={handleChange}
              placeholder="+9715xxxxxxx"
            />
          </Field>

          <Field label="Business Phone Number">
            <input
              className="input"
              name="businessPhoneNumber"
              value={profile.businessPhoneNumber}
              onChange={handleChange}
              placeholder="+9714xxxxxxx"
            />
          </Field>
        </div>

        <button
          className="buttonPrimary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </section>
    </div>
  );
}

/* ---------- FIELD ---------- */
function Field({ label, children }) {
  return (
    <div className="formField">
      <label>{label}</label>
      {children}
    </div>
  );
}