// src/utils.js

export function createPageUrl(pageName) {
  // Simple mapping: return lowercase path, adjust if you have routing rules
  return `/${pageName.toLowerCase()}`;
}
