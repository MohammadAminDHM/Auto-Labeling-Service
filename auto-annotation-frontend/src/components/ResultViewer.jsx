// src/components/ResultViewer.jsx
import React from "react";
import ResultJSON from "./ResultJSON";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function renderValue(value) {
  if (value == null) return <em className="text-gray-400">null</em>;

  if (typeof value === "string") {
    return <span className="text-gray-800">{value}</span>;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return <span className="text-gray-800">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    return (
      <pre className="bg-white p-2 rounded border text-xs overflow-x-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  if (typeof value === "object") {
    return (
      <pre className="bg-white p-2 rounded border text-xs overflow-x-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return String(value);
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export default function ResultViewer({ result }) {
  if (!result) {
    return <p className="text-gray-500">No result available</p>;
  }

  const {
    imageUrl,
    results,
    task,
    model,
    ok,
  } = result;

  const hasResults =
    results && typeof results === "object" && Object.keys(results).length > 0;

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="text-sm text-gray-600">
        <strong>Model:</strong> {model ?? "unknown"} ·{" "}
        <strong>Task:</strong> {task ?? "unknown"} ·{" "}
        <strong>Status:</strong>{" "}
        {ok ? (
          <span className="text-green-600">OK</span>
        ) : (
          <span className="text-red-600">FAILED</span>
        )}
      </div>

      {/* Image */}
      {imageUrl && (
        <div className="border rounded shadow-sm inline-block bg-white">
          <img
            src={imageUrl}
            alt="Inference result"
            className="max-w-full block"
          />
        </div>
      )}

      {/* Structured Results */}
      {hasResults && (
        <div className="bg-gray-50 p-4 rounded border space-y-2">
          <h4 className="font-semibold">
            Task Results
          </h4>

          {Object.entries(results).map(([key, value]) => (
            <div key={key}>
              <div className="font-mono text-xs text-indigo-600 mb-1">
                {key}
              </div>
              {renderValue(value)}
            </div>
          ))}
        </div>
      )}

      {/* Fallback */}
      {!hasResults && (
        <p className="text-gray-500 text-sm">
          No structured results returned for this task.
        </p>
      )}

      {/* Raw JSON (debug only) */}
      <div className="pt-4">
        <ResultJSON data={result.raw} />
      </div>
    </div>
  );
}
