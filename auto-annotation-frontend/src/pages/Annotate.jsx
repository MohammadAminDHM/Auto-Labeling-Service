// src/pages/Annotate.jsx
import React from "react";
import { useParams } from "react-router-dom";
import useJobPoll from "../hooks/useJobPoll";
import ResultViewer from "../components/ResultViewer";
import ResultJSON from "../components/ResultJSON";

export default function Annotate() {
  const { jobId } = useParams();
  const { job, result, status, error } = useJobPoll(jobId);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Annotation Workspace</h2>

      {/* Error */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Loading */}
      {status === "running" && (
        <p className="text-gray-600">Processing file and running annotation…</p>
      )}

      {/* Completed */}
      {status === "completed" && result && (
        <div className="space-y-6">
          <ResultViewer result={result} />
          <ResultJSON data={result} />
        </div>
      )}

      {/* Completed but no result */}
      {status === "completed" && !result && (
        <p className="text-yellow-600">
          Job completed, but no result was returned.
        </p>
      )}

      {/* Idle fallback */}
      {!job && status !== "running" && !error && (
        <p className="text-gray-500">Waiting for job data…</p>
      )}
    </div>
  );
}
