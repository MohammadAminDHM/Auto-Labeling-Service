{
  "name": "AppSetup",
  "type": "object",
  "properties": {
    "machine_categories": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List of machine categories"
    },
    "part_categories": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List of part categories"
    },
    "sub_assembly_categories": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List of sub-assembly categories"
    },
    "labor_rates": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "rate": {
            "type": "number"
          }
        },
        "required": [
          "name",
          "rate"
        ]
      },
      "description": "List of labor rates with names"
    }
  },
  "required": []
}