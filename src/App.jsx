// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import BusinessDashboard from "./pages/BusinessDashboard";
import FloorLive from "./pages/Dashboard/FloorLive";
import FloorLayoutPage from "./pages/Settings/FloorLayoutPage";
import Bookings from "./pages/Bookings";
import Orders from "./pages/Orders";
import ManualOrders from "./pages/ManualOrders";
import DashboardLayout from "./layouts/DashboardLayout";
import BusinessSettings from "./pages/Settings/BusinessSettings";
import AgentSettings from "./pages/Settings/AgentSettings";
import MenuSettings from "./pages/Settings/MenuSettings";
import OpeningHours from "./pages/Settings/OpeningHours";

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div style={{ minHeight: "100vh" }}>Loading…</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RootRedirect() {
  const { token, loading } = useAuth();
  if (loading) return <div style={{ minHeight: "100vh" }}>Loading…</div>;
  return token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><BusinessDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/floor" element={<ProtectedRoute><DashboardLayout><FloorLive /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/floor/layout" element={<ProtectedRoute><DashboardLayout><FloorLayoutPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><DashboardLayout><Bookings /></DashboardLayout></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><DashboardLayout><Orders /></DashboardLayout></ProtectedRoute>} />
            <Route path="/orders/manual" element={<ProtectedRoute><DashboardLayout><ManualOrders /></DashboardLayout></ProtectedRoute>} />
            <Route path="/settings/business" element={<ProtectedRoute><DashboardLayout><BusinessSettings /></DashboardLayout></ProtectedRoute>} />
            <Route path="/settings/agent" element={<ProtectedRoute><DashboardLayout><AgentSettings /></DashboardLayout></ProtectedRoute>} />
            <Route path="/settings/menu" element={<ProtectedRoute><DashboardLayout><MenuSettings /></DashboardLayout></ProtectedRoute>} />
            <Route path="/settings/hours" element={<ProtectedRoute><DashboardLayout><OpeningHours /></DashboardLayout></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}