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

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {status === "running" && (
        <p className="text-gray-600">Processing…</p>
      )}

      {status === "completed" && result && (
        <div className="space-y-6">
          <ResultViewer result={result} />
          <ResultJSON data={result.raw} />
        </div>
      )}

      {status === "completed" && !result && (
        <p className="text-yellow-600">No result returned.</p>
      )}
    </div>
  );
}
