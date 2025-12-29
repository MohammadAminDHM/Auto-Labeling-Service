// src/pages/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const nav = useNavigate();
  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">Auto-Annotation Platform</h1>
          <p className="mt-4 text-gray-600">
            Bootstrap datasets quickly with automated vision tasks (detection, keypoints, OCR, segmentation, captioning).
            Connect powerful models (RexOmni, Florence) and review annotations in a fast, human-in-the-loop workflow.
          </p>

          <div className="mt-6 flex gap-3">
            <button onClick={() => nav("/upload")} className="px-5 py-3 bg-indigo-600 text-white rounded-md shadow">Upload & Annotate</button>
            <button onClick={() => nav("/projects")} className="px-5 py-3 border rounded-md">View Projects</button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-3">Quick demo</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>✔ Upload images or small batches.</li>
            <li>✔ Select task & model (front-end control in Annotate page).</li>
            <li>✔ Polling progress and preview annotated image.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
