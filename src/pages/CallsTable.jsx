export default function CallsTable({ calls }) {
  if (!calls.length) {
    return <p>No calls yet.</p>;
  }

  return (
    <table width="100%" border="1" cellPadding="8">
      <thead>
        <tr>
          <th>Date</th>
          <th>Caller</th>
          <th>Intent</th>
          <th>Duration (sec)</th>
        </tr>
      </thead>

      <tbody>
        {calls.map((call) => (
          <tr key={call._id}>
            <td>{new Date(call.createdAt).toLocaleString()}</td>
            <td>{call.callerNumber || "Unknown"}</td>
            <td>{call.intent}</td>
            <td>{call.durationSeconds ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}