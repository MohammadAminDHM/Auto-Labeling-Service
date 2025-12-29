// src/components/ProgressBar.jsx
import React from "react";

export default function ProgressBar({ value = 0 }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div style={{ width: `${pct}%` }} className="h-full bg-indigo-600 transition-all" />
    </div>
  );
}
