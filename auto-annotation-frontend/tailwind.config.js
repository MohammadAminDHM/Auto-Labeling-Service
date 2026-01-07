/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Add custom colors if needed for better UX in annotation views
        primary: '#4F46E5',  // Indigo for buttons
        error: '#EF4444',    // Red for errors
      },
    },
  },
  plugins: [],
  darkMode: 'class',  // Enable dark mode support for future scalability
};