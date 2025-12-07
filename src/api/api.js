import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ===============================
// FETCH CALL LOGS
// ===============================
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

// ===============================
// FETCH ALL AGENTS
// ===============================
export async function fetchAgents() {
  try {
    const response = await axios.get(`${API_BASE_URL}/agents`);
    return response.data;
  } catch (error) {
    console.error("Error fetching agents:", error);
    return [];
  }
}

// ===============================
// FETCH ONE AGENT BY ID
// OPTIONAL (use later for editing)
// ===============================
export async function fetchAgentById(id) {
  try {
    const response = await axios.get(`${API_BASE_URL}/agents/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching agent by ID:", error);
    return null;
  }
}

// ===============================
// CREATE A NEW AGENT
// ===============================
export async function createAgent(agentData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/agents`, agentData);
    return response.data;
  } catch (error) {
    console.error("Error creating agent:", error);
    throw error;
  }
}