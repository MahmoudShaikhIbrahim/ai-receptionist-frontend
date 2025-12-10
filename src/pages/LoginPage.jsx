import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setSubmitting(true);
      await login(form);
      navigate("/");
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error || "Failed to log in. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: "420px",
        margin: "0 auto",
        padding: "32px 16px",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>Log In to Pure AI</h1>
      <p style={{ fontSize: "14px", opacity: 0.7, marginBottom: "16px" }}>
        Use the email and password you registered your business with.
      </p>

      {error && (
        <div
          style={{
            marginBottom: "12px",
            padding: "10px 12px",
            borderRadius: "8px",
            background: "#442222",
            color: "#ffb3b3",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div>
          <label style={labelStyle}>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            style={inputStyle}
            placeholder="owner@example.com"
          />
        </div>

        <div>
          <label style={labelStyle}>Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            style={inputStyle}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: "8px",
            padding: "10px 18px",
            borderRadius: "999px",
            border: "none",
            background: "linear-gradient(135deg, #22c55e, #16a34a, #22c55e)",
            color: "#020617",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Logging in..." : "Log In"}
        </button>
      </form>

      <p style={{ marginTop: "16px", fontSize: "13px", opacity: 0.7 }}>
        Don&apos;t have an account?{" "}
        <Link to="/signup" style={{ color: "#22c55e", textDecoration: "none" }}>
          Create one
        </Link>
      </p>
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