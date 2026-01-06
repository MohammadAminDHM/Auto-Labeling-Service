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
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ------------------------------------------------------------------ */
/* Normalizers (STRICT backend contract)                              */
/* ------------------------------------------------------------------ */

/**
 * Submit response
 * Backend guarantees: { job_id }
 */
function normalizeSubmitResponse(data) {
  if (!data?.job_id) {
    console.error("[API] Invalid submit response:", data);
    throw new Error("Invalid submit response");
  }
  return { jobId: data.job_id };
}

/**
 * Job metadata
 */
function normalizeJob(job) {
  if (!job?.id || !job?.status) {
    console.error("[API] Invalid job payload:", job);
    throw new Error("Invalid job payload");
  }

  return {
    id: job.id,
    status: job.status, // queued | running | completed | failed
    progress: job.progress ?? 0,
    error: job.error ?? null,
    hasResult: Boolean(job.has_result),
    artifacts: job.artifacts ?? [],
  };
}

/**
 * Job result
 * Backend structure:
 * {
 *   job_id,
 *   task,
 *   model,
 *   annotations: { ok, results },
 *   artifacts: { overlay?: url }
 * }
 */
function normalizeJobResult(payload) {
  if (!payload?.annotations) {
    console.error("[API] Invalid result payload:", payload);
    throw new Error("Invalid result payload");
  }

  return {
    jobId: payload.job_id,
    task: payload.task,
    model: payload.model,
    ok: Boolean(payload.annotations.ok),
    results: payload.annotations.results ?? {},
    artifacts: payload.artifacts ?? {},
    raw: payload, // keep full backend payload
  };
}

/* ------------------------------------------------------------------ */
/* API calls                                                          */
/* ------------------------------------------------------------------ */

/**
 * Fetch available tasks for model
 */
export async function getAvailableTasks(model = "florence") {
  try {
    const res = await api.get("/api/jobs/tasks", {
      params: { model: model.toLowerCase() },
    });
    return res.data; // { tasks: string[], required_inputs: object }
  } catch (err) {
    console.error("[API] getAvailableTasks:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * Submit job
 *
 * dynamicInputs example:
 * {
 *   text_input?: string
 *   categories?: string[] | string
 * }
 */
export async function submitJob(file, task, model, dynamicInputs = {}) {
  if (!file || !task || !model) {
    throw new Error("file, task, and model are required");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("task", task);
  formData.append("model", model);

  // text_input
  if (dynamicInputs.text_input) {
    formData.append("text_input", dynamicInputs.text_input);
  }

  // categories (CSV string)
  if (dynamicInputs.categories) {
    const csv =
      Array.isArray(dynamicInputs.categories)
        ? dynamicInputs.categories.join(",")
        : dynamicInputs.categories;
    formData.append("categories", csv);
  }

  try {
    const res = await api.post("/api/jobs", formData);
    return normalizeSubmitResponse(res.data);
  } catch (err) {
    console.error("[API] submitJob:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * Fetch job status
 */
export async function getJob(jobId) {
  if (!jobId) throw new Error("jobId is required");

  try {
    const res = await api.get(`/api/jobs/${jobId}`);
    return normalizeJob(res.data);
  } catch (err) {
    console.error("[API] getJob:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * Fetch job result
 */
export async function getJobResult(jobId) {
  if (!jobId) throw new Error("jobId is required");

  try {
    const res = await api.get(`/api/jobs/${jobId}/result`);
    return normalizeJobResult(res.data);
  } catch (err) {
    console.error("[API] getJobResult:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * Artifact URL (overlay, mask, etc.)
 */
export function getArtifactUrl(jobId, name) {
  return `${BASE_URL}/api/jobs/${jobId}/artifacts/${name}`;
}

/* ------------------------------------------------------------------ */
/* Polling                                                            */
/* ------------------------------------------------------------------ */

/**
 * Poll job until completion
 */
export async function waitForJob(
  jobId,
  { interval = 2000, timeout = 120000, onProgress } = {}
) {
  const start = Date.now();

  while (true) {
    const job = await getJob(jobId);
    onProgress?.(job);

    if (job.status === "failed") {
      throw new Error(job.error || "Job failed");
    }

    if (job.status === "completed") {
      if (!job.hasResult) {
        throw new Error("Job completed but no result");
      }
      const result = await getJobResult(jobId);
      return { job, result };
    }

    if (Date.now() - start > timeout) {
      throw new Error("Polling timeout");
    }

    await sleep(interval);
  }
}

export default api;
