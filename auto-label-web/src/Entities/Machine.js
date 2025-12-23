{
  "name": "Machine",
  "type": "object",
  "properties": {
    "machine_id": {
      "type": "string",
      "description": "Unique machine identifier/model number"
    },
    "name": {
      "type": "string",
      "description": "Machine name/model"
    },
    "manufacturer": {
      "type": "string",
      "description": "Manufacturer name"
    },
    "category": {
      "type": "string",
      "description": "Machine category"
    },
    "specifications": {
      "type": "object",
      "description": "Technical specifications",
      "properties": {
        "power": {
          "type": "string"
        },
        "dimensions": {
          "type": "string"
        },
        "weight": {
          "type": "string"
        },
        "capacity": {
          "type": "string"
        }
      }
    },
    "description": {
      "type": "string",
      "description": "Detailed description"
    },
    "image_url": {
      "type": "string",
      "description": "Machine image URL"
    },
    "labor_entries": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "operation": {
            "type": "string"
          },
          "hours": {
            "type": "number"
          },
          "rate": {
            "type": "number"
          }
        }
      },
      "description": "List of labor operations and costs for machine assembly"
    },
    "assembly_labor_hours": {
      "type": "number",
      "default": 0,
      "description": "Legacy field - Labor hours for machine assembly"
    },
    "assembly_labor_rate": {
      "type": "number",
      "default": 50,
      "description": "Legacy field - Labor rate per hour for assembly"
    },
    "finishing_labor_hours": {
      "type": "number",
      "default": 0,
      "description": "Legacy field - Labor hours for machine finishing"
    },
    "finishing_labor_rate": {
      "type": "number",
      "default": 50,
      "description": "Legacy field - Labor rate per hour for finishing"
    },
    "markup_percent": {
      "type": "number",
      "default": 25,
      "description": "Markup percentage to apply to total cost to get selling price"
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "description": "Whether machine is available for quoting"
    }
  },
  "required": [
    "machine_id",
    "name",
    "manufacturer",
    "category"
  ]
}