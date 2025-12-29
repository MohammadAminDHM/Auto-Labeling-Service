// src/services/api.js
import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:6996";

const api = axios.create({
  baseURL: BASE,
  timeout: 120000,
});

/**
 * Submit a job to backend
 * @param {File} file - uploaded file
 * @param {string} task - task name (detection, segmentation, etc.)
 * @param {string} model - model name
 * @param {object} params - optional parameters
 */
export async function submitJob(file, task, model, params = {}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("task", task);
  formData.append("model", model);
  formData.append("params", JSON.stringify(params));

  const res = await api.post("/api/jobs", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data; // returns job info including job id
}

/**
 * Fetch job result by ID
 * @param {string} jobId
 */
export async function getJobResult(jobId) {
  const res = await api.get(`/api/jobs/${jobId}`);
  const data = res.data;

  // Decode image_bytes if exists
  if (data?.result?.image_bytes) {
    data.result.image_url = `data:image/png;base64,${data.result.image_bytes}`;
  }
  return data;
}

// Polling helper
export async function waitForJob(jobId, interval = 2000, timeout = 120000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = async () => {
      const job = await getJobResult(jobId);
      if (job.status === "completed") return resolve(job);
      if (job.status === "failed") return reject(job);
      if (Date.now() - start > timeout) return reject({ status: "timeout" });
      setTimeout(check, interval);
    };
    check();
  });
}

// Health check
export async function ping() {
  return api.get("/health").then(r => r.data).catch(() => null);
}

export default api;
