// src/pages/Settings/AgentSettings.jsx
import { useEffect, useState } from "react";
import { getAgentMe, updateAgentMe } from "../../api/api";

export default function AgentSettings() {
  const [changeRequestText, setChangeRequestText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  /* ======================
     LOAD EXISTING REQUEST
  ====================== */
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await getAgentMe();
        if (!mounted) return;

        setChangeRequestText(data.agent?.changeRequestText || "");
        setErr("");
      } catch {
        if (mounted) setErr("Failed to load agent settings.");
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
     SAVE CHANGE REQUEST
  ====================== */
  async function handleSave(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!changeRequestText.trim()) {
      setErr("Please describe the changes you want to make.");
      return;
    }

    try {
      setSaving(true);

      await updateAgentMe({
        changeRequestText: changeRequestText.trim(),
      });

      setMsg("Request submitted. Pending admin review.");
    } catch {
      setErr("Failed to submit request.");
    } finally {
      setSaving(false);
    }
  }

  /* ======================
     RENDER
  ====================== */
  if (loading) {
    return <p className="muted">Loading agent settings…</p>;
  }

  return (
    <div className="settingsPage">
      <div className="settingsHeader">
        <h1>Agent Settings</h1>
        <p>
          Describe how you want your AI receptionist to behave.
          <br />
          Our team will review and apply the changes.
        </p>
      </div>

      {err && <div className="alert alert--error">{err}</div>}
      {msg && <div className="alert alert--success">{msg}</div>}

      <form className="card settingsCard" onSubmit={handleSave}>
        <div className="formGrid">

          <Field label="Receptionist Change Request" full>
            <textarea
              value={changeRequestText}
              onChange={(e) => setChangeRequestText(e.target.value)}
              placeholder="Write any changes you want for your receptionist. You can write in any language."
              rows={8}
            />
          </Field>

          <div className="formActions">
            <button
              className="primaryButton"
              type="submit"
              disabled={saving}
            >
              {saving ? "Submitting…" : "Submit Request"}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}

/* ======================
   FIELD
====================== */
function Field({ label, children, full }) {
  return (
    <div className={`formField ${full ? "formField--full" : ""}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}