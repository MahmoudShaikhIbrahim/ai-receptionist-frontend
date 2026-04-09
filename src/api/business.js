// src/api/business.js

import apiClient, { cachedGet, invalidateCache } from "./client";

export async function getBusinessMe() {
  const res = await cachedGet("/business/me", 60000);
  return res.data;
}

export async function updateBusinessProfile(profile) {
  invalidateCache("/business/me");
  const res = await apiClient.put("/business/profile", profile);
  return res.data;
}

export async function updateOpeningHours(hours) {
  invalidateCache("/business/me");
  const res = await apiClient.put("/business/hours", hours);
  return res.data;
}

export async function getFloors() {
  const res = await cachedGet("/floors", 60000);
  return res.data;
}

export async function getFloorLayout(floorId) {
  if (!floorId) throw new Error("floorId is required");
  const res = await cachedGet(`/floors/${floorId}/layout`, 30000);
  return res.data;
}

export async function updateFloorLayout(floorId, payload) {
  if (!floorId) throw new Error("floorId is required");
  invalidateCache(`/floors/${floorId}`);
  const res = await apiClient.put(`/floors/${floorId}/layout`, payload);
  return res.data;
}

export async function getLiveFloor(floorId) {
  if (!floorId) throw new Error("floorId is required");
  // Live floor is NOT cached — always fresh
  const res = await apiClient.get(`/floors/${floorId}/live`);
  return res.data;
}

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

export async function sendPhoneVerificationCode() {
  const res = await apiClient.post("/business/phone/send");
  return res.data;
}

export async function verifyPhoneCode(code) {
  const res = await apiClient.post("/business/phone/verify", { code });
  return res.data;
}