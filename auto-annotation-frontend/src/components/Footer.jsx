// src/components/Footer.jsx
import React from "react";

export default function Footer(){
  return (
    <footer className="bg-white border-t mt-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-gray-500">
        © {new Date().getFullYear()} AutoAnnotate — Built for dataset automation
      </div>
    </footer>
  );
}
