import Layout from "@/Layout";
import { Routes, Route } from "react-router-dom";
import Annotate from "@/Pages/Annotate.jsx";
import Dashboard from "@/Pages/Dashboard.jsx";
import Landing from "@/Pages/Landing.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/annotate" element={<Annotate />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Add more routes as needed */}
      </Routes>
    </Layout>
  );
}
