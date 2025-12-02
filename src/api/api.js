import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
console.log("API_BASE_URL from env:", API_BASE_URL); // ADD THIS LINE

export async function fetchCalls() {
  try {
    const response = await axios.get(`${API_BASE_URL}/calls`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching calls:", error);
    return [];
  }
}