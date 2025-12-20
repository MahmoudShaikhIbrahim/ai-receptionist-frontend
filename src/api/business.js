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
  return res.data; // { message, agent }
}

// UPDATE opening hours
export async function updateOpeningHours(hours) {
  const res = await apiClient.put("/business/hours", hours);
  return res.data; // { message, openingHours }
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