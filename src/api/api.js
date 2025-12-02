import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchCalls() {
  try {
    const response = await axios.get(`${API_BASE_URL}/calls`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching calls:", error);
    return [];
  }
}