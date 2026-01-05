// src/pages/Upload.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UploadZone from "../components/UploadZone";
import { submitJob, getAvailableTasks } from "../services/api";

export default function Upload() {
  const navigate = useNavigate();

  const [model, setModel] = useState("florence");
  const [availableModels] = useState(["florence", "rexomni"]);

  const [task, setTask] = useState("");
  const [availableTasks, setAvailableTasks] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [textInput, setTextInput] = useState("");

  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState(null);

  // Fetch tasks whenever model changes
  useEffect(() => {
    if (!model) return;

    async function fetchTasks() {
      setLoadingTasks(true);
      setError(null);

      try {
        const data = await getAvailableTasks(model);

        const tasks = data.tasks || [];
        setAvailableTasks(tasks);

        // Select first task by default
        if (tasks.length > 0) {
          setTask(tasks[0]);
        } else {
          setTask("");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load tasks from server");
        setAvailableTasks([]);
        setTask("");
      } finally {
        setLoadingTasks(false);
      }
    }

    fetchTasks();
  }, [model]);

  // Reset text input when task changes (important)
  useEffect(() => {
    setTextInput("");
  }, [task]);

  const handleFileSelected = (file) => {
    setSelectedFile(file);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !task || !model) {
      setError("Please select a file, task, and model");
      return;
    }

    setLoadingSubmit(true);
    setError(null);

    try {
      const { jobId } = await submitJob(
        selectedFile,
        task,
        model,
        textInput || null
      );

      navigate(`/annotate/${jobId}`);
    } catch (err) {
      console.error(err);
      setError("Failed to submit job. Check the input.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Start New Annotation</h2>

      {/* Model and Task selectors */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="border p-2 rounded"
        >
          {availableModels.map((m) => (
            <option key={m} value={m}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="border p-2 rounded"
          disabled={loadingTasks}
        >
          {loadingTasks && <option>Loading tasks…</option>}
          {!loadingTasks && availableTasks.length === 0 && (
            <option>No tasks available</option>
          )}
          {!loadingTasks &&
            availableTasks.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ").toUpperCase()}
              </option>
            ))}
        </select>
      </div>

      {/* Optional text input */}
      <input
        type="text"
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        placeholder="Enter text input (optional)"
        className="border p-2 rounded w-full mb-4"
      />

      {/* File Upload */}
      <UploadZone onFileSelected={handleFileSelected} />

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loadingSubmit || !selectedFile}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-500 disabled:bg-gray-400 mt-4"
      >
        {loadingSubmit ? "Submitting..." : "Start Annotation"}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {selectedFile && (
        <p className="text-gray-700 mt-2">
          Selected file: {selectedFile.name}
        </p>
      )}
    </div>
  );
}
