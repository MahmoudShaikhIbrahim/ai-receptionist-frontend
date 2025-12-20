// src/api/calls.js
import apiClient from "./client";

export async function fetchCalls() {
  try {
    const res = await apiClient.get("/calls");
    const data = res.data;

    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") return [data];
    return [];
  } catch (err) {
    console.error("Error fetching calls:", err);
    return [];
  }
}