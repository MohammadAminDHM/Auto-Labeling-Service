// src/services/api.js
import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:6996";

const api = axios.create({
  baseURL: BASE,
  timeout: 120000,
});

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function normalizeSubmitResponse(data) {
  if (!data) return null;

  if (data.job_id) return { jobId: data.job_id };
  if (data.id) return { jobId: data.id };
  if (data.job?.id) return { jobId: data.job.id };

  console.error("[API] Unknown submit response shape:", data);
  return null;
}

function normalizeJobStatus(job) {
  if (!job) return null;

  let status = job.status;
  if (status === "done") status = "completed";
  if (status === "error") status = "failed";

  return {
    id: job.id,
    status,
    progress: job.progress ?? 0,
    error: job.error ?? null,
    has_result: Boolean(job.has_result),
  };
}

function normalizeJobResult(result) {
  if (!result) return null;

  const normalized = { ...result };

  if (result.image_bytes) {
    normalized.image_url = `data:image/png;base64,${result.image_bytes}`;
  }

  return normalized;
}

/* ------------------------------------------------------------------ */
/* API calls                                                          */
/* ------------------------------------------------------------------ */

/**
 * Get available tasks for a model
 */
export async function getAvailableTasks(model = "florence") {
  try {
    const res = await api.get(`/api/jobs/tasks?model=${model.toLowerCase()}`);
    return res.data;  // {tasks: [...], required_inputs: {...}}
  } catch (err) {
    console.error("[API] getAvailableTasks error:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * Submit a new job
 * Backend expects:
 * - file (binary)
 * - task (string, lowercase)
 * - model (string, lowercase)
 * - text_input (optional string)
 */
export async function submitJob(
  file,
  task,
  model,
  textInput = ""
) {
  if (!file || !task || !model) {
    throw new Error("file, task, and model are required");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("task", task.toLowerCase());
  formData.append("model", model.toLowerCase());

  if (textInput) {
    formData.append("text_input", textInput);
  }

  try {
    const res = await api.post("/api/jobs", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const normalized = normalizeSubmitResponse(res.data);
    if (!normalized?.jobId) {
      throw new Error("Invalid submit response");
    }

    console.info("[API] Job submitted:", normalized.jobId);
    return normalized; // { jobId }
  } catch (err) {
    console.error("[API] submitJob error:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * Get job metadata / status
 */
export async function getJob(jobId) {
  if (!jobId) throw new Error("jobId is required");

  const res = await api.get(`/api/jobs/${jobId}`);
  return normalizeJobStatus(res.data);
}

/**
 * Get final job result
 * Only call when has_result === true
 */
export async function getJobResult(jobId) {
  if (!jobId) throw new Error("jobId is required");

  const res = await api.get(`/api/jobs/${jobId}/result`);
  return normalizeJobResult(res.data);
}

/**
 * Poll job until completion, then fetch result
 */
export async function waitForJob(
  jobId,
  {
    interval = 2000,
    timeout = 120000,
  } = {}
) {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const job = await getJob(jobId);
        console.log("[API] Poll job status:", job);

        if (job.status === "failed") {
          return reject(new Error(job.error || "Job failed"));
        }

        if (job.status === "completed") {
          if (!job.has_result) {
            return reject(new Error("Job completed but no result found"));
          }

          const result = await getJobResult(jobId);
          console.log("[API] Poll job result:", result);
          return resolve({
            job,
            result,
          });
        }

        if (Date.now() - start > timeout) {
          return reject(new Error("Job polling timeout"));
        }

        setTimeout(poll, interval);
      } catch (err) {
        console.error("[API] Poll error:", err.response?.data || err.message);
        reject(err);
      }
    };

    poll();
  });
}

export default api;