// src/services/api.js
import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:6996";

const api = axios.create({
  baseURL: BASE,
  timeout: 120000,
});

export async function createJob(formData) {
  // Expected backend: POST /api/jobs (multipart)
  const res = await api.post("/api/jobs", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function getJob(jobId) {
  // GET /api/jobs/{jobId}
  const res = await api.get(`/api/jobs/${jobId}`);
  return res.data;
}

// Test ping
export async function ping() {
  return api.get("/health").then(r => r.data).catch(() => null);
}

export default api;
