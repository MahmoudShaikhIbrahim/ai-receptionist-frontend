import axios from "axios";

export const API_BASE_URL = "https://gangliest-marita-inefficaciously.ngrok-free.dev";

export async function fetchCalls() {
  try {
    const response = await axios.get(`${API_BASE_URL}/calls`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching calls:", error);
    return [];
  }
}