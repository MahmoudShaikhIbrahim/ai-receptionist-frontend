// src/api/client.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
console.log("API BASE URL:", API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("pureai_token") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── SIMPLE IN-MEMORY CACHE ───────────────────────────────
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

export async function cachedGet(url, ttl = CACHE_TTL) {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && now - cached.ts < ttl) {
    return cached.data;
  }
  const res = await apiClient.get(url);
  cache.set(url, { data: res, ts: now });
  return res;
}

export function invalidateCache(urlPattern) {
  for (const key of cache.keys()) {
    if (key.includes(urlPattern)) cache.delete(key);
  }
}

export function clearCache() {
  cache.clear();
}

export default apiClient;