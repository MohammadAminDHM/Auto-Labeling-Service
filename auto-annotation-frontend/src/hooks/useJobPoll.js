// src/hooks/useJobPoll.js
import { useEffect, useRef, useState } from "react";
import { getJob } from "../services/api";

export default function useJobPoll(jobId, { interval = 1000 } = {}) {
  const [state, setState] = useState({ status: "queued", progress: 0, result: null });
  const timer = useRef(null);

  useEffect(() => {
    if (!jobId) return;
    let mounted = true;

    async function tick() {
      try {
        const data = await getJob(jobId);
        if (!mounted) return;
        setState(data);
        if (data.status === "done" || data.status === "error") {
          clearInterval(timer.current);
        }
      } catch (err) {
        // If backend not available, keep polling but stop on repeated failures (not implemented)
        console.error("poll error", err);
      }
    }

    // initial
    tick();
    timer.current = setInterval(tick, interval);

    return () => {
      mounted = false;
      clearInterval(timer.current);
    };
  }, [jobId, interval]);

  return state;
}
