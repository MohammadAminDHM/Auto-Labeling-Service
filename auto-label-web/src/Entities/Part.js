{
  "name": "Part",
  "type": "object",
  "properties": {
    "part_number": {
      "type": "string",
      "description": "Unique part identifier"
    },
    "name": {
      "type": "string",
      "description": "Part name"
    },
    "category": {
      "type": "string",
      "description": "Part category"
    },
    "cost_price": {
      "type": "number",
      "description": "Our cost for this part"
    },
    "selling_price": {
      "type": "number",
      "description": "Selling price to customer"
    },
    "supplier_id": {
      "type": "string",
      "description": "Primary supplier for this part"
    },
    "alternative_suppliers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "supplier_id": {
            "type": "string"
          },
          "supplier_part_number": {
            "type": "string"
          },
          "cost_price": {
            "type": "number"
          },
          "lead_time_days": {
            "type": "number"
          }
        }
      },
      "description": "Alternative suppliers for this part"
    },
    "cross_reference": {
      "type": "string",
      "description": "Cross reference or OEM part number"
    },
    "replacement_part_id": {
      "type": "string",
      "description": "ID of replacement part if this part is obsolete"
    },
    "is_obsolete": {
      "type": "boolean",
      "default": false,
      "description": "Whether this part is obsolete"
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
      "description": "Raw materials used for fabricated parts"
    },
    "description": {
      "type": "string",
      "description": "Part description"
    },
    "image_url": {
      "type": "string",
      "description": "Part image URL"
    },
    "compatible_machines": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List of compatible machine categories"
    },
    "stock_quantity": {
      "type": "number",
      "default": 0,
      "description": "Current stock quantity"
    },
    "lead_time_days": {
      "type": "number",
      "default": 0,
      "description": "Lead time in days if not in stock"
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "description": "Whether part is available for quoting"
    }
  },
  "required": [
    "part_number",
    "name",
    "category",
    "cost_price",
    "selling_price"
  ]
}