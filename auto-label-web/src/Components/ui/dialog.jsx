import React from "react";

export function Dialog({ children, open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-4 rounded shadow-lg">
        {children}
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function DialogContent({ children }) {
  return <div>{children}</div>;
}

export function DialogHeader({ children }) {
  return <div className="font-bold mb-2">{children}</div>;
}

export function DialogTitle({ children }) {
  return <h3 className="text-lg font-semibold">{children}</h3>;
}

export function DialogTrigger({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>;
}
