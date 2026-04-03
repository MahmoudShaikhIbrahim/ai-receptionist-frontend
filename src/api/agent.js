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

export async function addMenuItem(item) {
  const res = await apiClient.post("/business/agent/menu", item);
  return res.data;
}

export async function updateMenuItem(itemId, updates) {
  const res = await apiClient.put(`/business/agent/menu/${itemId}`, updates);
  return res.data;
}

export async function deleteMenuItem(itemId) {
  const res = await apiClient.delete(`/business/agent/menu/${itemId}`);
  return res.data;
}