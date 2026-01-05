// src/pages/Projects.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await api.get("/api/projects"); // assume new endpoint
        setProjects(res.data.projects || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  if (loading) return <p className="text-gray-600">Loading projects…</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (projects.length === 0) return <p className="text-gray-600">No projects yet.</p>;

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div
          key={project.id}
          className="bg-white rounded-lg shadow p-4 flex justify-between items-center hover:shadow-md cursor-pointer"
          onClick={() => nav(`/projects/${project.id}`)}
        >
          <div>
            <h3 className="font-semibold text-gray-800">{project.name}</h3>
            <p className="text-sm text-gray-500">Tasks: {project.tasks_count}</p>
          </div>
          <div className="text-gray-400 text-sm">{project.status}</div>
        </div>
      ))}
    </div>
  );
}
