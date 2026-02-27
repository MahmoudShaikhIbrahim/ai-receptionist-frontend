// src/api/tables.js
import apiClient from "./client";

/**
 * Seat a walk-in immediately on a specific table.
 * Optional partySize (must be <= table capacity). If omitted, backend defaults safely.
 */
export async function seatWalkIn(tableId, partySize) {
  if (!tableId) throw new Error("tableId is required");

  const payload = {};
  if (partySize !== undefined && partySize !== null && partySize !== "") {
    payload.partySize = partySize;
  }

  const res = await apiClient.post(`/tables/${tableId}/seat`, payload);
  return res.data; // { success, booking }
}

export async function setTableMaintenance(tableId, isMaintenance) {
  if (!tableId) throw new Error("tableId is required");

  const res = await apiClient.patch(
    `/tables/${tableId}/maintenance`,
    { isMaintenance }
  );

  return res.data;
}