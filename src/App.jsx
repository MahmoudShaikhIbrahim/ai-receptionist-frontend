// src/App.jsx
import React, { useEffect, useState } from "react";
import { fetchAgents, createAgent } from "./api";

function App() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    ownerEmail: "",
    businessPhoneNumber: "",
    industry: "",
    timezone: "Asia/Dubai",
    language: "en",
    retellAgentId: "",
    systemPrompt: "",
    greetingMessage: "",
    fallbackMessage: "",
    closingMessage: "",
  });

  // Load agents from backend
  useEffect(() => {
    async function loadAgents() {
      try {
        setLoading(true);
        const data = await fetchAgents();
        setAgents(data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load agents");
      } finally {
        setLoading(false);
      }
    }

    loadAgents();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.businessName || !form.systemPrompt) {
      setError("name, businessName and systemPrompt are required.");
      return;
    }

    try {
      setCreating(true);
      const newAgent = await createAgent({
        ...form,
        openingHours: {}, // placeholder for now
      });

      // add new agent to list
      setAgents((prev) => [newAgent, ...prev]);

      // reset form
      setForm((prev) => ({
        ...prev,
        name: "",
        businessName: "",
        ownerEmail: "",
        businessPhoneNumber: "",
        industry: "",
        retellAgentId: "",
        systemPrompt: "",
        greetingMessage: "",
        fallbackMessage: "",
        closingMessage: "",
      }));
    } catch (err) {
      console.error(err);
      setError("Failed to create agent");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050816",
        color: "#f5f5f5",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <header>
          <h1 style={{ fontSize: "24px", marginBottom: "4px" }}>
            Pure AI – Admin Dashboard
          </h1>
          <p style={{ opacity: 0.7, fontSize: "14px" }}>
            Backend: <code>{import.meta.env.VITE_API_BASE_URL}</code>
          </p>
        </header>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: "#442222",
              color: "#ffb3b3",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* CREATE AGENT FORM */}
        <section
          style={{
            background: "rgba(15,23,42,0.9)",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid rgba(148,163,184,0.3)",
          }}
        >
          <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>
            Create New Agent
          </h2>

          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px 16px",
              alignItems: "flex-start",
            }}
          >
            <div>
              <label style={labelStyle}>Name *</label>
              <input
                style={inputStyle}
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Agent name"
              />
            </div>

            <div>
              <label style={labelStyle}>Business Name *</label>
              <input
                style={inputStyle}
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                placeholder="Pure AI – Restaurant"
              />
            </div>

            <div>
              <label style={labelStyle}>Owner Email</label>
              <input
                style={inputStyle}
                name="ownerEmail"
                value={form.ownerEmail}
                onChange={handleChange}
                placeholder="owner@example.com"
              />
            </div>

            <div>
              <label style={labelStyle}>Business Phone</label>
              <input
                style={inputStyle}
                name="businessPhoneNumber"
                value={form.businessPhoneNumber}
                onChange={handleChange}
                placeholder="+9715..."
              />
            </div>

            <div>
              <label style={labelStyle}>Industry</label>
              <input
                style={inputStyle}
                name="industry"
                value={form.industry}
                onChange={handleChange}
                placeholder="Restaurant / Clinic / Salon..."
              />
            </div>

            <div>
              <label style={labelStyle}>Timezone</label>
              <input
                style={inputStyle}
                name="timezone"
                value={form.timezone}
                onChange={handleChange}
                placeholder="Asia/Dubai"
              />
            </div>

            <div>
              <label style={labelStyle}>Language</label>
              <input
                style={inputStyle}
                name="language"
                value={form.language}
                onChange={handleChange}
                placeholder="en"
              />
            </div>

            <div>
              <label style={labelStyle}>Retell Agent ID</label>
              <input
                style={inputStyle}
                name="retellAgentId"
                value={form.retellAgentId}
                onChange={handleChange}
                placeholder="retell_agent_123"
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>System Prompt *</label>
              <textarea
                style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                name="systemPrompt"
                value={form.systemPrompt}
                onChange={handleChange}
                placeholder="You are a professional AI receptionist for ..."
              />
            </div>

            <div>
              <label style={labelStyle}>Greeting Message</label>
              <input
                style={inputStyle}
                name="greetingMessage"
                value={form.greetingMessage}
                onChange={handleChange}
                placeholder="Thank you for calling..."
              />
            </div>

            <div>
              <label style={labelStyle}>Fallback Message</label>
              <input
                style={inputStyle}
                name="fallbackMessage"
                value={form.fallbackMessage}
                onChange={handleChange}
                placeholder="Let me check that for you..."
              />
            </div>

            <div>
              <label style={labelStyle}>Closing Message</label>
              <input
                style={inputStyle}
                name="closingMessage"
                value={form.closingMessage}
                onChange={handleChange}
                placeholder="Thank you for calling Pure AI..."
              />
            </div>

            <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
              <button
                type="submit"
                disabled={creating}
                style={{
                  padding: "10px 18px",
                  borderRadius: "999px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #22c55e, #16a34a, #22c55e)",
                  color: "#020617",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  opacity: creating ? 0.7 : 1,
                }}
              >
                {creating ? "Creating..." : "Create Agent"}
              </button>
            </div>
          </form>
        </section>

        {/* AGENTS LIST */}
        <section
          style={{
            background: "rgba(15,23,42,0.9)",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid rgba(148,163,184,0.3)",
          }}
        >
          <div
            style={{
              marginBottom: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <h2 style={{ fontSize: "18px" }}>Agents</h2>
            {loading && (
              <span style={{ fontSize: "13px", opacity: 0.7 }}>
                Loading agents…
              </span>
            )}
          </div>

          {agents.length === 0 && !loading && (
            <p style={{ fontSize: "14px", opacity: 0.7 }}>
              No agents yet. Create your first AI receptionist above.
            </p>
          )}

          {agents.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "14px",
              }}
            >
              {agents.map((agent) => (
                <div
                  key={agent._id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background:
                      "radial-gradient(circle at top left, #1e293b, #020617)",
                    border: "1px solid rgba(51,65,85,0.9)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {agent.name || "Unnamed Agent"}
                      </div>
                      <div style={{ opacity: 0.7, fontSize: "13px" }}>
                        {agent.businessName}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: "12px" }}>
                      <div style={{ opacity: 0.7 }}>
                        {agent.industry || "—"}
                      </div>
                      <div style={{ opacity: 0.5 }}>
                        {agent.language || "en"} •{" "}
                        {agent.timezone || "Asia/Dubai"}
                      </div>
                    </div>
                  </div>

                  {agent.ownerEmail && (
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "12px",
                        opacity: 0.7,
                      }}
                    >
                      Owner: {agent.ownerEmail}
                    </div>
                  )}

                  {agent.businessPhoneNumber && (
                    <div
                      style={{
                        fontSize: "12px",
                        opacity: 0.7,
                      }}
                    >
                      Phone: {agent.businessPhoneNumber}
                    </div>
                  )}

                  {agent.retellAgentId && (
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "12px",
                        opacity: 0.8,
                      }}
                    >
                      Retell Agent ID:{" "}
                      <code
                        style={{
                          background: "rgba(15,23,42,0.9)",
                          padding: "2px 6px",
                          borderRadius: "6px",
                        }}
                      >
                        {agent.retellAgentId}
                      </code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "12px",
  marginBottom: "4px",
  opacity: 0.8,
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid rgba(148,163,184,0.5)",
  background: "rgba(15,23,42,0.9)",
  color: "#f9fafb",
  fontSize: "13px",
  outline: "none",
};

export default App;