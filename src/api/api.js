import axios from "axios";

// Read from Vite env (what you put in .env)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export async function fetchCalls() {
  try {
    const response = await axios.get(`${API_BASE_URL}/calls`);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching calls:", error);
    return [];
  }
}