// src/pages/BusinessDashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getBusinessMe } from "../api/api";

export default function BusinessDashboard() {
  const { business } = useAuth();
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
    <div className="dashboard">
      {/* Header */}
      <div className="dashboardHeader">
        <div>
          <h1 className="dashboardTitle">
            {business?.businessName || "Your Business"}
          </h1>
          <p className="dashboardSubtitle">
            Pure AI – Live Receptionist Dashboard
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="metricsGrid">
        <MetricCard label="Status" value="Active" accent />
        <MetricCard label="Business Type" value={business?.businessType || "—"} />
        <MetricCard
          label="Language"
          value={business?.languagePreference?.toUpperCase() || "—"}
        />
        <MetricCard
          label="AI Agent"
          value={agent ? "Connected" : "Not Connected"}
          muted={!agent}
        />
      </div>

      {/* Agent Overview */}
      <section className="card">
        <div className="cardHeader">
          <h2>AI Agent Overview</h2>
          {agent && <span className="statusPill">Live</span>}
        </div>

        {loading ? (
          <p className="muted">Loading agent data…</p>
        ) : !agent ? (
          <p className="muted">No agent found. This should not happen.</p>
        ) : (
          <div className="infoGrid">
            <InfoRow label="Agent Name" value={agent.name} />
            <InfoRow label="Business Type" value={agent.businessType} />
            <InfoRow label="Language" value={agent.languagePreference} />
            <InfoRow
              label="Retell Agent ID"
              value={
                agent.retellAgentId ? (
                  <code className="codePill">{agent.retellAgentId}</code>
                ) : (
                  "Not connected"
                )
              }
            />
          </div>
        )}
      </section>

      {/* Activity (placeholder for future real data) */}
      <section className="card">
        <div className="cardHeader">
          <h2>Recent Activity</h2>
        </div>

        <ul className="activityList">
          <ActivityItem
            title="Agent initialized"
            time="Just now"
          />
          <ActivityItem
            title="Business profile loaded"
            time="1 min ago"
          />
          <ActivityItem
            title="Dashboard accessed"
            time="Today"
          />
        </ul>
      </section>
    </div>
  );
}

/* ---------- Components ---------- */

function MetricCard({ label, value, accent, muted }) {
  return (
    <div className={`metricCard ${accent ? "metricCard--accent" : ""}`}>
      <div className="metricLabel">{label}</div>
      <div className={`metricValue ${muted ? "muted" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="infoRow">
      <div className="infoLabel">{label}</div>
      <div className="infoValue">{value}</div>
    </div>
  );
}

function ActivityItem({ title, time }) {
  return (
    <li className="activityItem">
      <div className="activityDot" />
      <div className="activityContent">
        <div className="activityTitle">{title}</div>
        <div className="activityTime">{time}</div>
      </div>
    </li>
  );
}