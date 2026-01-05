// src/components/ResultViewer.jsx
import React from "react";
import BoundingBoxOverlay from "./BoundingBoxOverlay";
import ResultJSON from "./ResultJSON";

export default function ResultViewer({ result }) {
  if (!result?.image_url) {
    return <div className="text-gray-500">No visualization available</div>;
  }

  const { task, results } = result;
  const hasBBoxes = results?.bboxes?.length > 0;
  const hasPolygons = results?.polygons?.length > 0;
  const hasText = results?.text;

  return (
    <div className="space-y-6">
      <div className="relative inline-block border rounded shadow-sm">
        <img
          src={result.image_url}
          alt="Inference result"
          className="max-w-full block"
        />

        {hasBBoxes && (
          <BoundingBoxOverlay
            bboxes={results.bboxes}
            labels={results.labels}
            scores={results.scores}
          />
        )}

        {/* Placeholder for polygons (extend with canvas/SVG for production) */}
        {hasPolygons && (
          <div className="absolute inset-0 pointer-events-none bg-red-500/20">
            Polygons detected - Implement custom overlay
          </div>
        )}

        {hasText && (
          <div className="absolute bottom-0 left-0 bg-black/50 text-white p-2">
            {hasText}
          </div>
        )}
      </div>

      <ResultJSON data={result} />
    </div>
  );
}