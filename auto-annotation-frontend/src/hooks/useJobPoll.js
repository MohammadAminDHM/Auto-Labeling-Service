// src/hooks/useJobPoll.js
import { useEffect, useRef, useState } from "react";
import { getJob } from "../services/api";

/**
 * Poll backend for job lifecycle and final result
 *
 * Returns a stable contract:
 * {
 *   job: Job | null,
 *   result: object | null,
 *   status: "idle" | "loading" | "completed" | "failed",
 *   error: string | null
 * }
 */
export default function useJobPoll(jobId, { interval = 2000 } = {}) {
  const [job, setJob] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const timerRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!jobId) return;

    mountedRef.current = true;
    setStatus("loading");
    setError(null);
    setJob(null);
    setResult(null);

    const poll = async () => {
      try {
        const data = await getJob(jobId);
        if (!mountedRef.current) return;

        setJob(data);

        // ---- terminal states ----
        if (data.status === "completed") {
          setStatus("completed");
          setResult(data.result || null);
          clearInterval(timerRef.current);
          return;
        }

        if (data.status === "failed") {
          setStatus("failed");
          setError("Job failed on server");
          clearInterval(timerRef.current);
          return;
        }

        // ---- still running ----
        setStatus("loading");
      } catch (err) {
        if (!mountedRef.current) return;

        console.error("[useJobPoll] polling error:", err);
        setStatus("failed");
        setError("Failed to fetch job status");
        clearInterval(timerRef.current);
      }
    };

    // initial fetch + polling
    poll();
    timerRef.current = setInterval(poll, interval);

    return () => {
      mountedRef.current = false;
      clearInterval(timerRef.current);
    };
  }, [jobId, interval]);

  return { job, result, status, error };
}
