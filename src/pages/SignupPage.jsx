import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    businessName: "",
    email: "",
    password: "",
    businessType: "restaurant",
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

    if (!form.businessName || !form.email || !form.password || !form.businessType) {
      setError("All fields are required.");
      return;
    }

    try {
      setSubmitting(true);
      await signup(form);
      navigate("/");
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error || "Failed to sign up. Please try again.";
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
      <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>Create Your Pure AI Account</h1>
      <p style={{ fontSize: "14px", opacity: 0.7, marginBottom: "16px" }}>
        One login for your business. Your AI receptionist will be created automatically.
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
          <label style={labelStyle}>Business Name</label>
          <input
            name="businessName"
            value={form.businessName}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Example: Al Khaleej Restaurant"
          />
        </div>

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

        <div>
          <label style={labelStyle}>Business Type</label>
          <select
            name="businessType"
            value={form.businessType}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="restaurant">Restaurant</option>
            <option value="clinic">Clinic</option>
            <option value="cafe">Cafe</option>
            <option value="salon">Salon</option>
            <option value="hospital">Hospital</option>
            <option value="hotel">Hotel</option>
          </select>
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
          {submitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p style={{ marginTop: "16px", fontSize: "13px", opacity: 0.7 }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "#22c55e", textDecoration: "none" }}>
          Log in
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