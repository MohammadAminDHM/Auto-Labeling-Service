// src/components/ProgressBar.jsx
import React from "react";

export default function ProgressBar({ value = 0 }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div
        style={{ width: `${pct}%` }}
        className={`h-full transition-all ${pct < 50 ? "bg-red-500" : pct < 80 ? "bg-yellow-400" : "bg-indigo-600"}`}
      />
    </div>
  );
}
