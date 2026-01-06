import { useEffect, useRef, useState } from "react";
import { waitForJob } from "../services/api";

export default function useJobPoll(jobId, options = {}) {
  const [job, setJob] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const cancelled = useRef(false);

  useEffect(() => {
    if (!jobId) return;

    cancelled.current = false;
    setStatus("running");
    setError(null);
    setResult(null);

    waitForJob(jobId, {
      ...options,
      onProgress: (meta) => !cancelled.current && setJob(meta),
    })
      .then(({ job, result }) => {
        if (!cancelled.current) {
          setJob(job);
          setResult(result);
          setStatus("completed");
        }
      })
      .catch((err) => {
        if (!cancelled.current) {
          setError(err.message || "Job failed");
          setStatus("failed");
        }
      });

    return () => {
      cancelled.current = true;
    };
  }, [jobId]);

  return { job, result, status, error };
}
