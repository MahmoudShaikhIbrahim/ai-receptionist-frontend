import { useEffect, useState } from "react";
import api from "../../api/api";

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [agent, setAgent] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [callsRes, agentRes] = await Promise.all([
          api.get("/calls"),
          api.get("/business/agent/me"),
        ]);

        const calls = callsRes.data.calls || [];
        const agentData = agentRes.data.agent;

        const totalCalls = calls.length;
        const missedCalls = calls.filter(c => c.status === "missed").length;
        const bookings = calls.filter(c => c.booking?.date).length;
        const orders = calls.filter(c => c.order?.items?.length).length;

        setStats({
          totalCalls,
          missedCalls,
          bookings,
          orders,
          lastCall: calls[0] || null,
        });

        setAgent(agentData);
      } catch (err) {
        console.error("Dashboard load failed", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <p>Loading dashboard…</p>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {!agent?.retellAgentId && (
        <div className="alert warning">
          Your AI agent is not connected yet.
        </div>
      )}

      <div className="statsGrid">
        <StatCard label="Total Calls" value={stats.totalCalls} />
        <StatCard label="Missed Calls" value={stats.missedCalls} />
        <StatCard label="Bookings" value={stats.bookings} />
        <StatCard label="Orders" value={stats.orders} />
      </div>

      {stats.lastCall && (
        <div className="card">
          <h3>Last Call</h3>
          <p><strong>From:</strong> {stats.lastCall.fromNumber}</p>
          <p><strong>Status:</strong> {stats.lastCall.status}</p>
          <p><strong>Time:</strong> {new Date(stats.lastCall.createdAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="statCard">
      <h4>{label}</h4>
      <p>{value}</p>
    </div>
  );
}