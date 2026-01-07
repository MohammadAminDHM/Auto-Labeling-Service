// src/components/BoundingBoxOverlay.jsx
import React from "react";

export default function BoundingBoxOverlay({ bboxes = [], labels = [], scores = [] }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {bboxes.map((box, idx) => {
        const [x1, y1, x2, y2] = box;
        const label = labels[idx] || "object";
        const score = scores?.[idx];

        return (
          <div
            key={idx}
            className="absolute border-2 border-red-500 text-red-500 text-xs font-semibold bg-black/50 px-1 rounded"
            style={{ left: x1, top: y1, width: x2 - x1, height: y2 - y1 }}
          >
            <span className="whitespace-nowrap">
              {label}
              {score !== undefined && ` ${(score * 100).toFixed(1)}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
