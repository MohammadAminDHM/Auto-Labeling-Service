{
  "name": "Image",
  "type": "object",
  "properties": {
    "project_id": {
      "type": "string",
      "description": "Associated project ID"
    },
    "filename": {
      "type": "string",
      "description": "Original filename"
    },
    "image_url": {
      "type": "string",
      "description": "URL to the uploaded image"
    },
    "width": {
      "type": "integer",
      "description": "Image width in pixels"
    },
    "height": {
      "type": "integer",
      "description": "Image height in pixels"
    },
    "status": {
      "type": "string",
      "enum": [
        "pending",
        "processing",
        "completed",
        "failed"
      ],
      "default": "pending",
      "description": "Processing status"
    },
    "annotations_count": {
      "type": "integer",
      "default": 0,
      "description": "Number of annotations"
    }
  },
  "required": [
    "filename",
    "image_url",
    "project_id"
  ]
}