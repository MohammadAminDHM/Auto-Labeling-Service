// src/components/Button.jsx
import React from "react";

export default function Button({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center px-4 py-2 rounded-md shadow-sm bg-indigo-600 text-white hover:bg-indigo-500 focus:outline-none ${className}`}
    >
      {children}
    </button>
  );
}
