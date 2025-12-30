// src/pages/Annotate.jsx
import React from "react";
import { useParams } from "react-router-dom";
import useJobPoll from "../hooks/useJobPoll";
import ResultViewer from "../components/ResultViewer";
import ResultJSON from "../components/ResultJSON";

export default function Annotate() {
  const { jobId } = useParams();

  /**
   * useJobPoll MUST now return:
   * {
   *   job: JobStatus | null,
   *   result: JobResult | null,
   *   status: "loading" | "completed" | "failed",
   *   error: string | null
   * }
   */
  const { job, result, status, error } = useJobPoll(jobId);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">
        Annotation Workspace
      </h2>

      {/* Error */}
      {error && (
        <p className="text-red-500 mb-4">
          {error}
        </p>
      )}

      {/* Loading */}
      {status === "loading" && (
        <p className="text-gray-600">
          Processing image and running annotation…
        </p>
      )}

      {/* Completed */}
      {status === "completed" && result && (
        <div className="space-y-6">
          <ResultViewer result={result} />
          <ResultJSON result={result} />
        </div>
      )}

      {/* Completed but no result (should not happen, but safe) */}
      {status === "completed" && !result && (
        <p className="text-yellow-600">
          Job completed, but no result was returned.
        </p>
      )}

      {/* Idle fallback */}
      {!job && status !== "loading" && !error && (
        <p className="text-gray-500">
          Waiting for job data…
        </p>
      )}
    </div>
  );
}
