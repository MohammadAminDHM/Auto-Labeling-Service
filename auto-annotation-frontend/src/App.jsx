// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Projects from "./pages/projects";
import Project from "./pages/project";
import Annotate from "./pages/Annotate";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<Project />} />
        <Route path="/annotate" element={<Annotate />} />
      </Route>
    </Routes>
  );
}
