// src/api/business.js
import apiClient from "./client";

// GET business + agent
export async function getBusinessMe() {
  const res = await apiClient.get("/business/me");
  return res.data; // { business, agent }
}

// UPDATE business profile (name, phone, type, language, etc.)
export async function updateBusinessProfile(profile) {
  const res = await apiClient.put("/business/profile", profile);
  return res.data; // { business }
}

// UPDATE opening hours
export async function updateOpeningHours(hours) {
  const res = await apiClient.put("/business/hours", hours);
  return res.data; // { openingHours }
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
  return res.data; // { floors }
}

export async function getFloorLayout(floorId) {
  if (!floorId) throw new Error("floorId is required");
  const res = await apiClient.get(`/floors/${floorId}/layout`);
  return res.data; // { floor, tables }
}

export async function updateFloorLayout(floorId, payload) {
  if (!floorId) throw new Error("floorId is required");
  const res = await apiClient.put(`/floors/${floorId}/layout`, payload);
  return res.data; // { success, floor, tables }
}

export async function getLiveFloor(floorId) {
  if (!floorId) throw new Error("floorId is required");
  const res = await apiClient.get(`/floors/${floorId}/live`);
  return res.data; // { floor, tables }
}