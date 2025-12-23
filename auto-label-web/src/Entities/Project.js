{
  "name": "Project",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Project name"
    },
    "description": {
      "type": "string",
      "description": "Project description"
    },
    "status": {
      "type": "string",
      "enum": [
        "active",
        "completed",
        "archived"
      ],
      "default": "active",
      "description": "Project status"
    },
    "total_images": {
      "type": "integer",
      "default": 0,
      "description": "Total number of images"
    },
    "processed_images": {
      "type": "integer",
      "default": 0,
      "description": "Number of processed images"
    }
  },
  "required": [
    "name"
  ]
}