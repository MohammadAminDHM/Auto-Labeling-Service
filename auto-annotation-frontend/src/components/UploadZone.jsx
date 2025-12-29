// src/components/UploadZone.jsx
import React, { useCallback, useState } from "react";
import { submitJob } from "../services/api";

export default function UploadZone({ task, model, onJobSubmitted }) {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(async (file) => {
    if (!file || !task || !model) return;
    setLoading(true);
    try {
      const job = await submitJob(file, task, model);
      onJobSubmitted(job); // send job info to parent
    } catch (err) {
      console.error("Job submission failed:", err);
    } finally {
      setLoading(false);
    }
  }, [task, model, onJobSubmitted]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
      className={`w-full border-2 border-dashed rounded-lg p-6 text-center ${dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-white"}`}
    >
      <input
        onChange={(e) => handleFile(e.target.files?.[0])}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        id="fileInput"
      />
      <label htmlFor="fileInput" className="cursor-pointer">
        <div className="text-gray-700">
          {loading ? "Uploading..." : "Drag & drop an image here, or "} 
          <span className="text-indigo-600 font-medium">browse</span>
        </div>
        <div className="text-xs text-gray-400 mt-2">Supported: JPG, PNG, MP4 (preview limited)</div>
      </label>
    </div>
  );
}
