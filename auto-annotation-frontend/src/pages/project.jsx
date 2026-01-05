// src/pages/Project.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

export default function Project() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await api.get(`/api/projects/${id}`);
        setProject(res.data.project);
      } catch (err) {
        console.error(err);
        setError("Failed to load project");
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [id]);

  if (loading) return <p className="text-gray-600">Loading project…</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!project) return <p className="text-gray-600">Project not found.</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{project.name}</h2>
      <p className="text-gray-500">{project.description}</p>

      <h3 className="text-lg font-semibold mt-4">Jobs</h3>
      {project.jobs.length === 0 ? (
        <p className="text-gray-600">No jobs submitted yet.</p>
      ) : (
        <div className="space-y-2">
          {project.jobs.map((job) => (
            <div
              key={job.id}
              className="flex justify-between bg-white p-3 rounded shadow hover:shadow-md cursor-pointer"
            >
              <div>
                <div className="font-medium">{job.task.replace(/_/g, " ")}</div>
                <div className="text-sm text-gray-500">
                  Model: {job.model}, Status: {job.status}
                </div>
              </div>
              <div className="text-indigo-600 cursor-pointer" onClick={() => window.location.href=`/annotate/${job.id}`}>
                View
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
