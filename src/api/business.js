// src/api/business.js
import apiClient from "./client";

// GET business + agent
export async function getBusinessMe() {
  const res = await apiClient.get("/business/me");
  return res.data;
}

// UPDATE business profile
export async function updateBusinessProfile(profile) {
  const res = await apiClient.put("/business/profile", profile);
  return res.data;
}

// UPDATE opening hours
export async function updateOpeningHours(hours) {
  const res = await apiClient.put("/business/hours", hours);
  return res.data;
}

// SEND phone verification code
export async function sendPhoneVerificationCode() {
  const res = await apiClient.post("/business/phone/send");
  return res.data;
}

// VERIFY phone code
export async function verifyPhoneCode(code) {
  const res = await apiClient.post("/business/phone/verify", { code });
  return res.data;
}

// ===============================
// FLOORS
// ===============================

export async function getFloors() {
  const res = await apiClient.get("/floors");
  return res.data;
}

export async function getFloorLayout(floorId) {
  if (!floorId) throw new Error("floorId is required");
  const res = await apiClient.get(`/floors/${floorId}/layout`);
  return res.data;
}

export async function updateFloorLayout(floorId, payload) {
  if (!floorId) throw new Error("floorId is required");
  const res = await apiClient.put(`/floors/${floorId}/layout`, payload);
  return res.data;
}

export async function getLiveFloor(floorId) {
  if (!floorId) throw new Error("floorId is required");
  const res = await apiClient.get(`/floors/${floorId}/live`);
  return res.data;
}

// ===============================
// BOOKINGS
// ===============================

export async function getBookings({ page = 1, limit = 50, status } = {}) {
  const params = { page, limit };
  if (status) params.status = status;
  const res = await apiClient.get("/bookings", { params });
  return res.data;
}

export async function updateBookingStatus(id, status) {
  const res = await apiClient.patch(`/bookings/${id}/status`, { status });
  return res.data;
}

// ===============================
// ORDERS
// ===============================

export async function getOrders({ page = 1, limit = 50, status } = {}) {
  const params = { page, limit };
  if (status) params.status = status;
  const res = await apiClient.get("/orders", { params });
  return res.data;
}

export async function updateOrderStatus(id, status) {
  const res = await apiClient.patch(`/orders/${id}/status`, { status });
  return res.data;
}