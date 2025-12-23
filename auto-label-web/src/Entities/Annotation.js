{
  "name": "Annotation",
  "type": "object",
  "properties": {
    "image_id": {
      "type": "string",
      "description": "Associated image ID"
    },
    "project_id": {
      "type": "string",
      "description": "Associated project ID"
    },
    "model": {
      "type": "string",
      "enum": [
        "florence",
        "rexomni"
      ],
      "description": "Model used for annotation"
    },
    "task_type": {
      "type": "string",
      "description": "Task type executed"
    },
    "task_display_name": {
      "type": "string",
      "description": "Human-readable task name"
    },
    "result": {
      "type": "object",
      "description": "Annotation result from API"
    },
    "processing_time": {
      "type": "number",
      "description": "Processing time in seconds"
    },
    "status": {
      "type": "string",
      "enum": [
        "success",
        "failed"
      ],
      "default": "success",
      "description": "Annotation status"
    },
    "error_message": {
      "type": "string",
      "description": "Error message if failed"
    }
  },
  "required": [
    "image_id",
    "project_id",
    "model",
    "task_type"
  ]
}