/* TEMP DISABLED — Step 1 backend only */

// import { useEffect, useState } from "react";
// import { fetchCalls } from "../api/calls";
// import CallsTable from "../components/CallsTable";


export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const res = await fetchCalls({ page, limit });

        if (!mounted) return;

        setCalls(res.data);
        setPagination(res.pagination);
        setError("");
      } catch {
        if (mounted) setError("Failed to load calls");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [page]);

  if (loading) return <p>Loading calls…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="page">
      <h1>Calls</h1>

      <CallsTable calls={calls} />

      {pagination && (
        <div style={{ marginTop: 20 }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>

          <span style={{ margin: "0 10px" }}>
            Page {pagination.page} of {pagination.pages}
          </span>

          <button
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}