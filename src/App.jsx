// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

/* AUTH PAGES */
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";

/* DASHBOARD */
import BusinessDashboard from "./pages/BusinessDashboard";
import Calls from "./pages/Calls";
import FloorLive from "./pages/Dashboard/FloorLive";
import FloorLayoutPage from "./pages/Settings/FloorLayoutPage";

/* LAYOUT */
import DashboardLayout from "./layouts/DashboardLayout";

/* SETTINGS */
import BusinessSettings from "./pages/Settings/BusinessSettings";
import AgentSettings from "./pages/Settings/AgentSettings";

/* ======================
   PROTECTED ROUTE
====================== */
function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <div style={{ minHeight: "100vh" }}>Loading…</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* ======================
   ROOT REDIRECT
====================== */
function RootRedirect() {
  const { token, loading } = useAuth();

  if (loading) {
    return <div style={{ minHeight: "100vh" }}>Loading…</div>;
  }

  return token ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

/* ======================
   APP
====================== */
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

          {/* DASHBOARD HOME */}
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


           {/* LIVE FLOOR */}
          <Route
            path="/dashboard/floor"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <FloorLive />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* FLOOR LAYOUT EDITOR */}
          <Route
            path="/dashboard/floor/layout"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <FloorLayoutPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* CALLS ROUTE — TEMP DISABLED */}
          {/*
          <Route
            path="/calls"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Calls />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          */}

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