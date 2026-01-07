// src/components/ResultJSON.jsx
import React, { useState } from "react";

export default function ResultJSON({ data }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-gray-50 border rounded p-4 text-sm">
      <button
        onClick={() => setOpen(!open)}
        className="text-blue-600 font-medium mb-2"
      >
        {open ? "Hide raw result" : "Show raw result"}
      </button>

      {open && (
        <pre className="overflow-auto max-h-96 bg-black text-green-400 p-3 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
