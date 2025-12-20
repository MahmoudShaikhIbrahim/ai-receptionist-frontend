// src/api/auth.js
import apiClient from "./client";

// REGISTER BUSINESS
export async function signupBusiness(payload) {
  const res = await apiClient.post("/auth/register", payload);
  return res.data; // { message, token, business, agentId }
}

// LOGIN BUSINESS
export async function loginBusiness(payload) {
  const res = await apiClient.post("/auth/login", payload);
  return res.data; // { message, token, business }
}