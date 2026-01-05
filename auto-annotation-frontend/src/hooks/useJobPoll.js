// src/hooks/useJobPoll.js
import { useEffect, useRef, useState } from "react";
import { waitForJob } from "../services/api";

const useJobPoll = (jobId, options = {}) => {
  const [job, setJob] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | running | completed | failed
  const [error, setError] = useState(null);

  const cancelRef = useRef(false);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setResult(null);
      setStatus("idle");
      setError(null);
      return;
    }

    cancelRef.current = false;
    setStatus("running");
    setError(null);
    setResult(null);

    waitForJob(jobId, {
      ...options,
      onProgress: (jobMeta) => {
        if (!cancelRef.current) {
          setJob(jobMeta);
        }
      },
    })
      .then(({ job, result }) => {
        if (!cancelRef.current) {
          setJob(job);
          setResult(result);
          setStatus("completed");
        }
      })
      .catch((err) => {
        if (!cancelRef.current) {
          setError(err.message || "Job failed");
          setStatus("failed");
        }
      });

    return () => {
      cancelRef.current = true;
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
};

export default useJobPoll;
