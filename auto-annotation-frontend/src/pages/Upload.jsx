// src/pages/Upload.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadZone from "../components/UploadZone";
import { submitJob } from "../services/api";

export default function Upload() {
  const navigate = useNavigate();

  const [task, setTask] = useState("detection");
  const [model, setModel] = useState("florence");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelected = (file) => {
    console.log("[Upload] File selected:", file);
    setSelectedFile(file);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[Upload] Submitting job", {
        task,
        model,
        file: selectedFile.name,
      });

      const { jobId } = await submitJob(selectedFile, task, model);

      console.log("[Upload] Job created with ID:", jobId);
      navigate(`/annotate/${jobId}`);
    } catch (err) {
      console.error("[Upload] Job submission failed:", err);
      setError("Failed to submit job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6">Upload Image</h2>

      {/* Task & model */}
      <div className="flex gap-4 mb-4">
        <select
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="detection">Object Detection</option>
          <option value="open_vocab_detection">Open Vocabulary Detection</option>
          <option value="region_segmentation">Segmentation</option>
        </select>

        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="florence">Florence</option>
          <option value="rexomni">RexOmni (server)</option>
        </select>
      </div>

      {/* Upload */}
      <UploadZone onFileSelected={handleFileSelected} />

      {/* Submit */}
      <div className="mt-4">
        <button
          onClick={handleSubmit}
          disabled={loading || !selectedFile}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {loading ? "Submitting…" : "Start Annotation"}
        </button>
      </div>

      {/* Feedback */}
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {selectedFile && !loading && (
        <p className="mt-2 text-gray-700">
          Selected file: {selectedFile.name}
        </p>
      )}
    </div>
  );
}
