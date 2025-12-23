{
  "name": "RawMaterial",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Name of the raw material"
    },
    "material_id": {
      "type": "string",
      "description": "Internal ID or SKU for the material"
    },
    "material_type": {
      "type": "string",
      "description": "e.g., Steel, Aluminum, Plastic"
    },
    "form": {
      "type": "string",
      "description": "e.g., Sheet, Bar, Tube, Plate"
    },
    "specifications": {
      "type": "string",
      "description": "e.g., Grade, Thickness, Dimensions"
    },
    "cost_per_unit": {
      "type": "number",
      "description": "Cost per unit of measure"
    },
    "unit_of_measure": {
      "type": "string",
      "description": "e.g., kg, lb, meter, sq ft, sheet"
    },
    "stock_quantity": {
      "type": "number",
      "default": 0,
      "description": "Quantity in stock"
    },
    "supplier_id": {
      "type": "string",
      "description": "Reference to the supplier"
    },
    "notes": {
      "type": "string"
    }
  },
  "required": [
    "name",
    "material_id",
    "cost_per_unit",
    "unit_of_measure"
  ]
}