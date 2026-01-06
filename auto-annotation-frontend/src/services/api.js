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
/* Normalizers (DEFENSIVE, REAL-WORLD SAFE)                            */
/* ------------------------------------------------------------------ */

/**
 * Submit response
 * Expected: { job_id }
 */
function normalizeSubmitResponse(data) {
  if (!data?.job_id) {
    console.error("[API] Invalid submit response:", data);
    throw new Error("Invalid submit response from backend");
  }
  return { jobId: data.job_id };
}

/**
 * Job metadata
 * Accepts multiple backend shapes safely
 */
function normalizeJob(raw) {
  if (!raw) {
    throw new Error("Empty job payload");
  }

  const id = raw.id ?? raw.job_id;
  const status = raw.status ?? raw.state;

  if (!id || !status) {
    console.error("[API] Unrecognized job payload:", raw);
    throw new Error("Unrecognized job payload");
  }

  return {
    id,
    status, // queued | running | completed | failed
    progress: raw.progress ?? 0,
    error: raw.error ?? null,
    hasResult:
      raw.has_result ??
      raw.status === "completed" ??
      false,
    artifacts: raw.artifacts ?? [],
    raw,
  };
}

/**
 * Job result
 * Supports Florence / RexOmni flexible outputs
 */
function normalizeJobResult(payload) {
  if (!payload) {
    throw new Error("Empty result payload");
  }

  // Florence sometimes returns direct dict results
  const annotations = payload.annotations ?? payload.results ?? payload;

  let imageUrl = null;
  if (annotations?.image_bytes) {
    imageUrl = `data:image/png;base64,${annotations.image_bytes}`;
  }

  return {
    jobId: payload.job_id ?? payload.id,
    task: payload.task ?? payload.task_type ?? null,
    model: payload.model ?? null,
    ok: annotations?.ok ?? true,
    results: annotations?.results ?? annotations,
    imageUrl,
    maskBytes: annotations?.mask_bytes ?? null,
    artifacts: payload.artifacts ?? {},
    raw: payload,
  };
}

/* ------------------------------------------------------------------ */
/* API calls                                                          */
/* ------------------------------------------------------------------ */

export async function getAvailableTasks(model = "florence") {
  const res = await api.get("/api/jobs/tasks", {
    params: { model: model.toLowerCase() },
  });
  return res.data;
}

export async function submitJob(file, task, model, dynamicInputs = {}) {
  if (!file || !task || !model) {
    throw new Error("file, task, and model are required");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("task", task);
  formData.append("model", model);

  if (dynamicInputs.text_input) {
    formData.append("text_input", dynamicInputs.text_input);
  }

  if (dynamicInputs.categories) {
    const csv = Array.isArray(dynamicInputs.categories)
      ? dynamicInputs.categories.join(",")
      : dynamicInputs.categories;
    formData.append("categories", csv);
  }

  const res = await api.post("/api/jobs", formData);
  return normalizeSubmitResponse(res.data);
}

export async function getJob(jobId) {
  const res = await api.get(`/api/jobs/${jobId}`);
  return normalizeJob(res.data);
}

export async function getJobResult(jobId) {
  const res = await api.get(`/api/jobs/${jobId}/result`);
  return normalizeJobResult(res.data);
}

export function getArtifactUrl(jobId, name) {
  return `${BASE_URL}/api/jobs/${jobId}/artifacts/${name}`;
}

/* ------------------------------------------------------------------ */
/* Polling                                                            */
/* ------------------------------------------------------------------ */

export async function waitForJob(
  jobId,
  { interval = 2000, timeout = 120000, onProgress } = {}
) {
  const start = Date.now();

  while (true) {
    let job;

    try {
      job = await getJob(jobId);
      onProgress?.(job);
    } catch (err) {
      console.warn("[API] Polling retry after job fetch error:", err.message);
      await sleep(interval);
      continue;
    }

    if (job.status === "failed") {
      throw new Error(job.error || "Job failed");
    }

    if (job.status === "completed") {
      try {
        const result = await getJobResult(jobId);
        return { job, result };
      } catch (err) {
        console.error(
          "[API] Job completed but result fetch failed:",
          err
        );
        throw err;
      }
    }

    if (Date.now() - start > timeout) {
      throw new Error("Polling timeout");
    }

    await sleep(interval);
  }
}

export default api;
