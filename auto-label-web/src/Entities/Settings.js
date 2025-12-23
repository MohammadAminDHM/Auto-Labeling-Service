{
  "name": "Settings",
  "type": "object",
  "properties": {
    "backend_url": {
      "type": "string",
      "default": "http://localhost:6996",
      "description": "FastAPI backend URL"
    },
    "visualize_by_default": {
      "type": "boolean",
      "default": true,
      "description": "Enable visualization by default"
    }
  },
  "required": []
}