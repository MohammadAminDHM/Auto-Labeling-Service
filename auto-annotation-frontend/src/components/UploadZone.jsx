// src/components/UploadZone.jsx
import React, { useState, useCallback } from "react";

export default function UploadZone({ onFileSelected }) {
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
      className={`w-full border-2 border-dashed rounded-lg p-6 text-center ${
        dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-white"
      }`}
    >
      <input
        type="file"
        accept="image/*,video/*"
        className="hidden"
        id="fileInput"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <label htmlFor="fileInput" className="cursor-pointer">
        <div className="text-gray-700">
          Drag & drop an image here, or <span className="text-indigo-600 font-medium">browse</span>
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Supported: JPG, PNG, MP4 (preview limited)
        </div>
      </label>
    </div>
  );
}
