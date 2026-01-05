// src/hooks/useJobPoll.js
import { useState, useEffect } from 'react';
import { waitForJob } from '../services/api';

const useJobPoll = (jobId) => {
  const [job, setJob] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) {
      setError('No job ID provided');
      setStatus('failed');
      return;
    }

    const pollJob = async () => {
      try {
        const { job: polledJob, result: polledResult } = await waitForJob(jobId);
        setJob(polledJob);
        setResult(polledResult);
        setStatus('completed');
      } catch (err) {
        setError(err.message);
        setStatus('failed');
      }
    };

    pollJob();
  }, [jobId]);

  return { job, result, status, error };
};

export default useJobPoll;