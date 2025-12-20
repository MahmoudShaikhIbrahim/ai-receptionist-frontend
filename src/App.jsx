// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import BusinessDashboard from "./pages/BusinessDashboard";

import DashboardLayout from "./layouts/DashboardLayout";
import BusinessSettings from "./pages/Settings/BusinessSettings";
import AgentSettings from "./pages/Settings/AgentSettings";

/* ---------------- PROTECTED ROUTE ---------------- */

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <div style={{ minHeight: "100vh" }}>Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* ---------------- PUBLIC ROOT ---------------- */

function RootRedirect() {
  const { token, loading } = useAuth();

  if (loading) {
    return <div style={{ minHeight: "100vh" }}>Loading...</div>;
  }

  // If logged in → dashboard
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  // If NOT logged in → login
  return <Navigate to="/login" replace />;
}

/* ---------------- APP ---------------- */

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ROOT */}
          <Route path="/" element={<RootRedirect />} />

          {/* AUTH */}
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <BusinessDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* SETTINGS */}
          <Route
            path="/settings/business"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <BusinessSettings />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings/agent"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AgentSettings />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}