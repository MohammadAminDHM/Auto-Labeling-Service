// src/components/ResultViewer.jsx
import React from "react";
import BoundingBoxOverlay from "./BoundingBoxOverlay";
import ResultJSON from "./ResultJSON";

export default function ResultViewer({ result }) {
  if (!result?.image_url) {
    return <div className="text-gray-500">No visualization available</div>;
  }

  const { task, outputs } = result;
  const hasBBoxes = outputs?.bboxes && outputs.bboxes.length > 0;

  return (
    <div className="space-y-6">
      {/* Image + overlays */}
      <div className="relative inline-block border rounded shadow-sm">
        <img
          src={result.image_url}
          alt="Inference result"
          className="max-w-full block"
        />

        {(task === "detection" || task === "open_vocab_detection") && hasBBoxes && (
          <BoundingBoxOverlay
            bboxes={outputs.bboxes}
            labels={outputs.labels}
            scores={outputs.scores}
          />
        )}

        {/* Segmentation overlay placeholder (future) */}
        {task === "region_segmentation" && (
          <div className="absolute inset-0 pointer-events-none">
            {/* segmentation overlays will go here */}
          </div>
        )}
      </div>

      {/* Structured JSON output */}
      <ResultJSON data={result} />
    </div>
  );
}
