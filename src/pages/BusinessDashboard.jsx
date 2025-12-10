import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getBusinessMe } from "../api/api";

export default function BusinessDashboard() {
  const { business, logout } = useAuth();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getBusinessMe();
        setAgent(data.agent);
      } catch (err) {
        console.error("Failed to load business/agent:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div
      style={{
        maxWidth: "1080px",
        margin: "0 auto",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", marginBottom: "4px" }}>
            {business?.businessName || "Your Business"}
          </h1>
          <p style={{ fontSize: "13px", opacity: 0.7 }}>
            Pure AI – Live Receptionist Dashboard
          </p>
        </div>
        <button
          onClick={logout}
          style={{
            padding: "8px 14px",
            borderRadius: "999px",
            border: "1px solid rgba(148,163,184,0.7)",
            background: "transparent",
            color: "#e5e7eb",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </header>

      <section
        style={{
          background: "rgba(15,23,42,0.9)",
          borderRadius: "16px",
          padding: "20px",
          border: "1px solid rgba(148,163,184,0.3)",
        }}
      >
        <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>AI Agent Overview</h2>

        {loading ? (
          <p style={{ fontSize: "14px", opacity: 0.7 }}>Loading agent...</p>
        ) : !agent ? (
          <p style={{ fontSize: "14px", opacity: 0.7 }}>
            No agent found. (This should not happen if signup succeeded.)
          </p>
        ) : (
          <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div>
              <strong>Name:</strong> {agent.name}
            </div>
            <div>
              <strong>Business Type:</strong> {agent.businessType}
            </div>
            <div>
              <strong>Language Preference:</strong> {agent.languagePreference}
            </div>
            <div>
              <strong>Retell Agent ID:</strong>{" "}
              {agent.retellAgentId ? (
                <code
                  style={{
                    background: "rgba(15,23,42,0.9)",
                    padding: "2px 6px",
                    borderRadius: "6px",
                  }}
                >
                  {agent.retellAgentId}
                </code>
              ) : (
                "Not connected yet"
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}