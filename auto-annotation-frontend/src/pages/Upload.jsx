// src/pages/Upload.jsx
import React, { useState } from "react";
import UploadZone from "../components/UploadZone";
import ProgressBar from "../components/ProgressBar";
import { submitJob, waitForJob } from "../services/api";

export default function Upload() {
  const [task, setTask] = useState("detection");
  const [model, setModel] = useState("rexomni");
  const [job, setJob] = useState(null);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = (file) => {
    setJob(null);
    setResult(null);
    setProgress(0);
    setError(null);

    if (!file) return;
    startJob(file);
  };

  const startJob = async (file) => {
    setLoading(true);
    try {
      const jobData = await submitJob(file, task, model);
      setJob(jobData);

      // Polling for result
      const completedJob = await waitForJob(jobData.id, 2000, 120000);
      setResult(completedJob.result);
      setProgress(100);
    } catch (err) {
      console.error("Job failed:", err);
      setError("Job failed or timed out");
    } finally {
      setLoading(false);
    }
  };

  const renderBBoxes = () => {
    if (!result?.results) return null;

    const taskKey = Object.keys(result.results)[0];
    const innerKey = Object.keys(result.results[taskKey])[0];
    const data = result.results[taskKey][innerKey];

    if (!data?.bboxes) return null;

    return data.bboxes.map((box, idx) => {
      const [x1, y1, x2, y2] = box;
      const label = data.labels?.[idx] ?? "";
      const score = data.scores?.[idx] ?? 0;
      return (
        <div
          key={idx}
          className="absolute border-2 border-red-500 text-red-500 text-xs font-bold px-1"
          style={{
            top: y1,
            left: x1,
            width: x2 - x1,
            height: y2 - y1,
          }}
        >
          {label} ({(score * 100).toFixed(0)}%)
        </div>
      );
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Upload & Start Annotation</h2>

      {/* Task / Model selection */}
      <div className="flex gap-4 mb-4">
        <select value={task} onChange={(e) => setTask(e.target.value)} className="border p-2 rounded">
          <option value="detection">Detection</option>
          <option value="open_vocab_detection">Open Vocabulary Detection</option>
          <option value="region_segmentation">Segmentation</option>
        </select>

        <select value={model} onChange={(e) => setModel(e.target.value)} className="border p-2 rounded">
          <option value="rexomni">RexOmni</option>
          <option value="default-model">Default Model</option>
        </select>
      </div>

      <UploadZone task={task} model={model} onJobSubmitted={handleFile} />

      {loading && <div className="mt-2 text-gray-600">Uploading / processing...</div>}

      {job && (
        <div className="bg-white p-4 rounded shadow mt-4 relative">
          {result?.image_url && (
            <div className="relative inline-block">
              <img src={result.image_url} alt="Result" className="max-w-full border rounded" />
              {task.includes("detection") && renderBBoxes()}
            </div>
          )}

          <ProgressBar value={progress} />
        </div>
      )}

      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
}
