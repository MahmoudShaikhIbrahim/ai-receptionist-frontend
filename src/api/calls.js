// src/api/calls.js
import apiClient from "./client";

/**
 * Fetch calls for the authenticated business
 *
 * @param {Object} options
 * @param {"all" | "order" | "booking"} options.type
 * @param {number} options.page
 * @param {number} options.limit
 */
export async function fetchCalls({
  type = "all",
  page = 1,
  limit = 20,
} = {}) {
  const res = await apiClient.get("/business/calls", {
    params: {
      type,
      page,
      limit,
    },
  });

  return {
    data: res.data.data,
    pagination: res.data.pagination,
  };
}