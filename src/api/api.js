import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchCalls() {
  try {
    const response = await axios.get(`${API_BASE_URL}/calls`);
    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (data && typeof data === "object") {
      // backend returned a single call object
      return [data];
    }

    return [];
  } catch (error) {
    console.error("Error fetching calls:", error);
    return [];
  }
}