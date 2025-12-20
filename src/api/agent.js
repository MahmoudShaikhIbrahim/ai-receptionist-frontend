// src/api/agent.js
import apiClient from "./client";

export async function getAgentMe() {
  const res = await apiClient.get("/business/agent/me");
  return res.data;
}

export async function updateAgentMe(updates) {
  const res = await apiClient.put("/business/agent", updates);
  return res.data;
}