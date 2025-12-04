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
              <div className="call-body">
                <p><strong>From:</strong> {c.from}</p>
                <p><strong>To:</strong> {c.to}</p>
                <p><strong>Duration:</strong> {c.duration}s</p>
                <p><strong>Outcome:</strong> {c.outcome}</p>
                <p><strong>Timestamp:</strong> 
                  {c.timestamp ? new Date(c.timestamp).toLocaleString() : "N/A"}
                </p>
                <p><strong>Transcript:</strong> {c.transcript || "No transcript"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}