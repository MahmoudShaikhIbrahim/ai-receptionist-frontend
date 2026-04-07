import apiClient, { cachedGet, invalidateCache } from "./client";

export async function getAgentMe() {
  const res = await cachedGet("/business/agent/me", 60000);
  return res.data;
}

export async function updateAgentMe(updates) {
  invalidateCache("/business/agent/me");
  const res = await apiClient.put("/business/agent", updates);
  return res.data;
}

export async function addMenuItem(item) {
  invalidateCache("/business/agent/me");
  const res = await apiClient.post("/business/agent/menu", item);
  return res.data;
}

export async function updateMenuItem(itemId, updates) {
  invalidateCache("/business/agent/me");
  const res = await apiClient.put(`/business/agent/menu/${itemId}`, updates);
  return res.data;
}

export async function deleteMenuItem(itemId) {
  invalidateCache("/business/agent/me");
  const res = await apiClient.delete(`/business/agent/menu/${itemId}`);
  return res.data;
}