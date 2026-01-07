import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadZone from "../components/UploadZone";
import { submitJob } from "../services/api";
import { getTasksForModel } from "../constants/tasks";

export default function Upload() {
  const navigate = useNavigate();

  const [model, setModel] = useState("florence");
  const [availableModels] = useState(["florence", "rexomni"]);

  const [tasks, setTasks] = useState([]);
  const [requiredInputs, setRequiredInputs] = useState({});
  const [task, setTask] = useState("");

  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [categories, setCategories] = useState("");

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState(null);

  /* ------------------------------------------------------------ */
  /* STATIC task loading (NO backend call)                        */
  /* ------------------------------------------------------------ */
  useEffect(() => {
    const taskMap = getTasksForModel(model);
    const taskList = Object.keys(taskMap);

    setTasks(taskList);
    setRequiredInputs(taskMap);
    setTask(taskList[0] || "");

    setTextInput("");
    setCategories("");
    setError(null);
  }, [model]);

  /* Reset dynamic inputs on task change */
  useEffect(() => {
    setTextInput("");
    setCategories("");
  }, [task]);

  /* ------------------------------------------------------------ */
  /* Submit                                                       */
  /* ------------------------------------------------------------ */
  const handleSubmit = async () => {
    if (!file || !task) {
      setError("File and task are required");
      return;
    }

    const inputs = {};
    const req = requiredInputs[task] || [];

    if (req.includes("text_input")) inputs.text_input = textInput;
    if (req.includes("categories")) inputs.categories = categories;

    setLoadingSubmit(true);
    setError(null);

    try {
      const { jobId } = await submitJob(file, task, model, inputs);
      navigate(`/annotate/${jobId}`);
    } catch (e) {
      setError(e.message || "Job submission failed");
    } finally {
      setLoadingSubmit(false);
    }
  };

  /* ------------------------------------------------------------ */
  /* UI                                                           */
  /* ------------------------------------------------------------ */
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Start New Annotation</h2>

      <div className="flex gap-4 mb-4">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="border p-2 rounded"
        >
          {availableModels.map((m) => (
            <option key={m} value={m}>
              {m.toUpperCase()}
            </option>
          ))}
        </select>

        <select
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="border p-2 rounded flex-1"
        >
          {tasks.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ").toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic inputs */}
      {requiredInputs[task]?.includes("text_input") && (
        <input
          className="border p-2 w-full mb-3 rounded"
          placeholder="Enter text input"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
        />
      )}

      {requiredInputs[task]?.includes("categories") && (
        <input
          className="border p-2 w-full mb-3 rounded"
          placeholder="Categories (comma-separated)"
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
        />
      )}

      <UploadZone onFileSelected={setFile} />

      <button
        onClick={handleSubmit}
        disabled={loadingSubmit || !file}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded disabled:bg-gray-400"
      >
        {loadingSubmit ? "Submitting…" : "Start Annotation"}
      </button>

      {error && <p className="text-red-500 mt-3">{error}</p>}
    </div>
  );
}
