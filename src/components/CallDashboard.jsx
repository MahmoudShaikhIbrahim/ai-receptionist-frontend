import { useEffect, useState } from "react";
import { fetchCalls } from "../api/api";
import "../assets/styles.css";

export default function CallDashboard() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await fetchCalls();
        console.log("CALL DATA FROM BACKEND:", result);

        setCalls(result || []);
      } catch (err) {
        console.error("Error loading calls:", err);
        setCalls([]); 
      }

      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="loading">Loading calls...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">📞 AI Receptionist — Call Logs</h1>

      {calls.length === 0 ? (
        <div className="no-calls">No calls yet</div>
      ) : (
        <div className="call-list">
          {calls.map((c) => (
            <div key={c._id} className="call-card">
              <div className="call-header">
                <span className="call-type">{c.call_type}</span>
                <span className="call-status">{c.call_status}</span>
              </div>
              <div className="call-body">
                <p><strong>Call ID:</strong> {c.call_id}</p>
                <p><strong>Agent:</strong> {c.agent_name}</p>
                <p><strong>Started:</strong> {new Date(c.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}