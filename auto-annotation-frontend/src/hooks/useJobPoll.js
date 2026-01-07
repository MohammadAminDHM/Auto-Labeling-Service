// src/hooks/useJobPoll.js
import { useEffect, useRef, useState } from "react";
import { waitForJob } from "../services/api";

export default function useJobPoll(jobId, options = {}) {
  const [job, setJob] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!jobId) return;

    cancelledRef.current = false;
    setStatus("running");
    setError(null);
    setJob(null);
    setResult(null);

    (async () => {
      try {
        const { job, result } = await waitForJob(jobId, {
          ...options,
          onProgress: (meta) => {
            if (!cancelledRef.current) {
              setJob(meta);
            }
          },
        });

        if (cancelledRef.current) return;

        setJob(job);
        setResult(result);
        setStatus("completed");
      } catch (err) {
        if (cancelledRef.current) return;

        console.error("[useJobPoll] Polling failed:", err);

        setError(
          err?.response?.data?.detail ||
          err?.message ||
          "Network error while polling job"
        );
        setStatus("failed");
      }
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, [jobId]);

  return {
    job,
    result,
    status,
    error,
    isRunning: status === "running",
    isCompleted: status === "completed",
    isFailed: status === "failed",
  };
}
