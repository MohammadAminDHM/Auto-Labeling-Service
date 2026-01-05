// src/pages/Upload.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UploadZone from "../components/UploadZone";
import { submitJob, getAvailableTasks } from "../services/api";

export default function Upload() {
  const navigate = useNavigate();

  const [task, setTask] = useState("");
  const [model, setModel] = useState("florence");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [requiredInputs, setRequiredInputs] = useState({});
  const [textInput, setTextInput] = useState("");

  useEffect(() => {
    async function fetchTasks() {
      try {
        const data = await getAvailableTasks(model);
        setAvailableTasks(data.tasks);
        setRequiredInputs(data.required_inputs);
        if (data.tasks.length > 0) setTask(data.tasks[0]);
      } catch (err) {
        setError("Failed to load tasks");
      }
    }
    fetchTasks();
  }, [model]);

  const handleFileSelected = (file) => {
    setSelectedFile(file);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !task) {
      setError("Please select a file and task");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { jobId } = await submitJob(selectedFile, task, model, textInput);
      navigate(`/annotate/${jobId}`);
    } catch (err) {
      setError("Failed to submit job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Start New Annotation</h2>

      <div className="flex gap-4 mb-4">
        <select value={model} onChange={(e) => setModel(e.target.value)} className="border p-2 rounded">
          <option value="florence">Florence</option>
        </select>

        <select value={task} onChange={(e) => setTask(e.target.value)} className="border p-2 rounded">
          <option value="">Select Task</option>
          {availableTasks.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ").toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {requiredInputs[task]?.includes("text_input") && (
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Enter text input (e.g., for grounding)"
          className="border p-2 rounded w-full mb-4"
        />
      )}

      <UploadZone onFileSelected={handleFileSelected} />

      <button
        onClick={handleSubmit}
        disabled={loading || !selectedFile}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-500 disabled:bg-gray-400 mt-4"
      >
        {loading ? "Submitting..." : "Start Annotation"}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {selectedFile && <p className="text-gray-700 mt-2">Selected file: {selectedFile.name}</p>}
    </div>
  );
}