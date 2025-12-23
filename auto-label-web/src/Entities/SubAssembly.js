{
  "name": "SubAssembly",
  "type": "object",
  "properties": {
    "assembly_number": {
      "type": "string",
      "description": "Unique assembly identifier"
    },
    "name": {
      "type": "string",
      "description": "Assembly name"
    },
    "description": {
      "type": "string",
      "description": "Assembly description"
    },
    "category": {
      "type": "string",
      "description": "Assembly category"
    },
    "image_url": {
      "type": "string",
      "description": "Sub-assembly image URL"
    },
    "supplier_id": {
      "type": "string",
      "description": "Reference to a supplier if this assembly is outsourced"
    },
    "parts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "part_id": {
            "type": "string"
          },
          "part_name": {
            "type": "string"
          },
          "part_number": {
            "type": "string"
          },
          "quantity": {
            "type": "number",
            "default": 1
          },
          "unit_cost": {
            "type": "number"
          },
          "total_cost": {
            "type": "number"
          }
        }
      },
      "description": "Parts included in the assembly"
    },
    "raw_materials": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "material_id": {
            "type": "string"
          },
          "material_name": {
            "type": "string"
          },
          "quantity": {
            "type": "number"
          },
          "unit_cost": {
            "type": "number"
          },
          "total_cost": {
            "type": "number"
          }
        }
      },
      "description": "Raw materials used in the assembly"
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
      "description": "List of labor operations and costs"
    },
    "total_parts_cost": {
      "type": "number",
      "description": "Total cost of all parts"
    },
    "total_materials_cost": {
      "type": "number",
      "description": "Total cost of all raw materials"
    },
    "total_labor_cost": {
      "type": "number",
      "description": "Total labor cost"
    },
    "total_cost": {
      "type": "number",
      "description": "Total assembly cost"
    },
    "markup_percent": {
      "type": "number",
      "default": 25,
      "description": "Markup percentage"
    },
    "selling_price": {
      "type": "number",
      "description": "Assembly selling price"
    },
    "compatible_machines": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List of compatible machine categories"
    },
    "assembly_time_minutes": {
      "type": "number",
      "default": 0,
      "description": "Expected assembly time in minutes, calculated from labor hours"
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "description": "Whether assembly is available for quoting"
    }
  },
  "required": [
    "assembly_number",
    "name",
    "category"
  ]
}