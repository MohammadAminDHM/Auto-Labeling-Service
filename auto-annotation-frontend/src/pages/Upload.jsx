// src/pages/Upload.jsx
import React, { useState } from "react";
import UploadZone from "../components/UploadZone";
import ProgressBar from "../components/ProgressBar";
import { createJob } from "../services/api";
import useJobPoll from "../hooks/useJobPoll";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [mockProgress, setMockProgress] = useState(0);
  const [error, setError] = useState(null);

  const jobState = useJobPoll(jobId);

  const handleFile = (f) => {
    setFile(f);
    setJobId(null);
    setMockProgress(0);
    setError(null);
  };

  const startJob = async () => {
    if (!file) return setError("Please choose a file first.");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("task", "detection"); // default task for demo; UI will allow task selection later
    fd.append("model", "rexomni");

    try {
      const res = await createJob(fd);
      // expected res { job_id: '...', status: 'queued' }
      if (res?.job_id) {
        setJobId(res.job_id);
      } else {
        // API responded but without job id — fallback to mock
        startMock();
      }
    } catch (err) {
      // backend not available — fallback to mock simulation
      console.warn("createJob failed, using mock:", err?.message || err);
      startMock();
    }
  };

  const startMock = () => {
    setJobId("mock-" + Date.now());
    setMockProgress(5);
    let p = 5;
    const t = setInterval(() => {
      p += Math.floor(Math.random() * 12) + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(t);
      }
      setMockProgress(p);
    }, 700);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Upload & Start Annotation</h2>

      <div className="mb-4">
        <UploadZone onFile={handleFile} />
        {file && (
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{file.name}</div>
              <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
            <div>
              <button onClick={() => setFile(null)} className="text-sm text-red-500">Remove</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 items-center mb-6">
        <button onClick={startJob} className="px-4 py-2 bg-indigo-600 text-white rounded">Start Annotation</button>
        <button onClick={() => { setFile(null); setJobId(null); setMockProgress(0); }} className="px-4 py-2 border rounded">Reset</button>
      </div>

      <div className="space-y-3">
        {jobId && (
          <div className="bg-white p-4 rounded shadow">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium">Job ID: {jobId}</div>
              <div className="text-xs text-gray-500">{jobState?.status || "mock"}</div>
            </div>

            <ProgressBar value={jobState?.progress ?? mockProgress} />
            <div className="mt-2 text-xs text-gray-500">Progress: {jobState?.progress ?? mockProgress}%</div>
          </div>
        )}

        {error && <div className="text-sm text-red-500">{error}</div>}
      </div>
    </div>
  );
}
