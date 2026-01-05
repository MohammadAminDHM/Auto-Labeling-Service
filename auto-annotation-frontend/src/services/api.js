// src/services/api.js
import axios from "axios";

/* ------------------------------------------------------------------ */
/* Axios instance                                                     */
/* ------------------------------------------------------------------ */

const BASE_URL =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:6996";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
});

/* ------------------------------------------------------------------ */
/* Normalization helpers                                              */
/* ------------------------------------------------------------------ */

/**
 * Normalize submit response
 * Backend guarantees: { job_id }
 */
function normalizeSubmitResponse(data) {
  if (!data) {
    throw new Error("Empty submit response");
  }

  if (data.job_id) {
    return { jobId: data.job_id };
  }

  // backward compatibility / defensive
  if (data.id) return { jobId: data.id };
  if (data.job?.id) return { jobId: data.job.id };

  console.error("[API] Unknown submit response shape:", data);
  throw new Error("Invalid submit response format");
}

/**
 * Normalize job metadata
 */
function normalizeJob(job) {
  if (!job) {
    throw new Error("Empty job payload");
  }

  const status = job.status;

  if (!["queued", "running", "completed", "failed"].includes(status)) {
    console.warn("[API] Unknown job status:", status);
  }

  return {
    id: job.id,
    status,
    progress: job.progress ?? 0,
    error: job.error ?? null,
    hasResult: Boolean(job.has_result),
    createdAt: job.created_at ?? null,
    updatedAt: job.updated_at ?? null,
  };
}

/**
 * Normalize job result payload
 *
 * Standard backend contract:
 * {
 *   ok: boolean
 *   task: string
 *   model: string
 *   results: object
 *   image_bytes?: base64
 * }
 */
function normalizeJobResult(result) {
  if (!result) {
    throw new Error("Empty job result");
  }

  const normalized = {
    ok: Boolean(result.ok),
    task: result.task ?? null,
    model: result.model ?? null,
    results: result.results ?? {},
    imageUrl: null,
    raw: result, // keep raw for debugging / advanced UI
  };

  if (result.image_bytes) {
    normalized.imageUrl = `data:image/png;base64,${result.image_bytes}`;
  }

  return normalized;
}

/* ------------------------------------------------------------------ */
/* API calls                                                          */
/* ------------------------------------------------------------------ */

/**
 * Fetch available tasks for a given model
 */
export async function getAvailableTasks(model = "florence") {
  try {
    const res = await api.get("/api/jobs/tasks", {
      params: { model: model.toLowerCase() },
    });
    return res.data; // { tasks, required_inputs }
  } catch (err) {
    console.error(
      "[API] getAvailableTasks error:",
      err.response?.data || err.message
    );
    throw err;
  }
}

/**
 * Submit a new inference job
 */
export async function submitJob(file, task, model, textInput = "") {
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

    return normalizeSubmitResponse(res.data);
  } catch (err) {
    console.error(
      "[API] submitJob error:",
      err.response?.data || err.message
    );
    throw err;
  }
}

/**
 * Fetch job metadata
 */
export async function getJob(jobId) {
  if (!jobId) {
    throw new Error("jobId is required");
  }

  try {
    const res = await api.get(`/api/jobs/${jobId}`);
    return normalizeJob(res.data);
  } catch (err) {
    console.error(
      "[API] getJob error:",
      err.response?.data || err.message
    );
    throw err;
  }
}

/**
 * Fetch job result (job must be completed)
 */
export async function getJobResult(jobId) {
  if (!jobId) {
    throw new Error("jobId is required");
  }

  try {
    const res = await api.get(`/api/jobs/${jobId}/result`);
    return normalizeJobResult(res.data);
  } catch (err) {
    console.error(
      "[API] getJobResult error:",
      err.response?.data || err.message
    );
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* Polling                                                            */
/* ------------------------------------------------------------------ */

/**
 * Poll job until completion or failure
 */
export async function waitForJob(
  jobId,
  {
    interval = 2000,
    timeout = 120000,
    onProgress = null,
  } = {}
) {
  const start = Date.now();

  while (true) {
    const job = await getJob(jobId);

    if (onProgress) {
      onProgress(job);
    }

    if (job.status === "failed") {
      throw new Error(job.error || "Job failed");
    }

    if (job.status === "completed") {
      if (!job.hasResult) {
        throw new Error("Job completed but no result found");
      }
      const result = await getJobResult(jobId);
      return { job, result };
    }

    if (Date.now() - start > timeout) {
      throw new Error("Job polling timeout");
    }

    await new Promise((r) => setTimeout(r, interval));
  }
}

export default api;
