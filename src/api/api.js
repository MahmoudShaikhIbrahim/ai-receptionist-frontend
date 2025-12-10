// src/api/api.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.warn("VITE_API_BASE_URL is not defined. Check your .env.");
}

// Base axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token automatically if exists
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("pureai_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ===============================
// AUTH – BUSINESS
// ===============================

export async function signupBusiness(payload) {
  // { businessName, email, password, businessType }
  const res = await apiClient.post("/auth/signup", payload);
  return res.data;
}

export async function loginBusiness(payload) {
  // { email, password }
  const res = await apiClient.post("/auth/login", payload);
  return res.data;
}

export async function getBusinessMe() {
  const res = await apiClient.get("/business/me");
  return res.data; // { business, agent }
}

// ===============================
// CALLS (admin or later per business)
// ===============================
export async function fetchCalls() {
  try {
    const response = await apiClient.get("/calls");
    const data = response.data;

    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") return [data];
    return [];
  } catch (error) {
    console.error("Error fetching calls:", error);
    return [];
  }
}

// ===============================
// AGENTS – legacy admin endpoints (keep for now)
// ===============================
export async function fetchAgents() {
  try {
    const response = await apiClient.get("/agents");
    return response.data;
  } catch (error) {
    console.error("Error fetching agents:", error);
    return [];
  }
}

export async function createAgent(agentData) {
  try {
    const response = await apiClient.post("/agents", agentData);
    return response.data;
  } catch (error) {
    console.error("Error creating agent:", error);
    throw error;
  }
}