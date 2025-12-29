// src/components/UploadZone.jsx
import React, { useCallback, useState } from "react";

export default function UploadZone({ onFile }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`w-full border-2 border-dashed rounded-lg p-6 text-center ${dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-white"}`}
    >
      <input
        onChange={(e) => onFile(e.target.files?.[0])}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        id="fileInput"
      />
      <label htmlFor="fileInput" className="cursor-pointer">
        <div className="text-gray-700">Drag & drop an image here, or <span className="text-indigo-600 font-medium">browse</span></div>
        <div className="text-xs text-gray-400 mt-2">Supported: JPG, PNG, MP4 (preview limited)</div>
      </label>
    </div>
  );
}
