// src/pages/Annotate.jsx
import React, { useState } from "react";
import UploadZone from "../components/UploadZone";
import { waitForJob } from "../services/api";

export default function Annotate() {
  const [task, setTask] = useState("detection");
  const [model, setModel] = useState("default-model");
  const [job, setJob] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleJobSubmitted = async (jobData) => {
    setJob(jobData);
    setLoading(true);
    try {
      const completedJob = await waitForJob(jobData.id);
      setResult(completedJob.result);
    } catch (err) {
      console.error("Job failed or timed out:", err);
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
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Annotate Workspace</h2>

      {/* Task / Model selection */}
      <div className="flex gap-4 mb-4">
        <select value={task} onChange={(e) => setTask(e.target.value)} className="border p-2 rounded">
          <option value="detection">Detection</option>
          <option value="open_vocab_detection">Open Vocabulary Detection</option>
          <option value="region_segmentation">Segmentation</option>
        </select>

        <select value={model} onChange={(e) => setModel(e.target.value)} className="border p-2 rounded">
          <option value="default-model">Default Model</option>
        </select>
      </div>

      {/* Upload */}
      <UploadZone task={task} model={model} onJobSubmitted={handleJobSubmitted} />

      {/* Loading */}
      {loading && <div className="mt-4 text-gray-600">Processing job...</div>}

      {/* Result preview */}
      {result?.image_url && (
        <div className="mt-4 relative inline-block">
          <img src={result.image_url} alt="Result" className="max-w-full border rounded" />
          {task.includes("detection") && renderBBoxes()}
          {/* TODO: segmentation overlays */}
        </div>
      )}
    </div>
  );
}
