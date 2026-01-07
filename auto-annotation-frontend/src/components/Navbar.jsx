// src/components/Navbar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    isActive ? "text-indigo-600 font-medium" : "text-gray-600 hover:text-indigo-600";

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-semibold cursor-pointer" onClick={() => navigate("/")}>
              AutoAnnotate
            </div>
            <nav className="hidden md:flex items-center space-x-2">
              <NavLink to="/" className={linkClass}>Home</NavLink>
              <NavLink to="/upload" className={linkClass}>Upload</NavLink>
              <NavLink to="/projects" className={linkClass}>Projects</NavLink>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/upload")}
              className="hidden sm:inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-500"
            >
              New Job
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
