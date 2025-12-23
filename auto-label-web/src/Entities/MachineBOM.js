{
  "name": "MachineBOM",
  "type": "object",
  "properties": {
    "machine_id": {
      "type": "string",
      "description": "Reference to the machine this BOM line belongs to"
    },
    "item_type": {
      "type": "string",
      "enum": [
        "part",
        "sub_assembly"
      ],
      "description": "Type of item - either a part or sub-assembly"
    },
    "item_id": {
      "type": "string",
      "description": "ID of the part or sub-assembly"
    },
    "item_name": {
      "type": "string",
      "description": "Name of the part or sub-assembly"
    },
    "item_number": {
      "type": "string",
      "description": "Part number or assembly number"
    },
    "quantity": {
      "type": "number",
      "default": 1,
      "description": "Quantity of this item needed for the machine"
    },
    "unit_cost": {
      "type": "number",
      "description": "Unit cost of the item"
    },
    "total_cost": {
      "type": "number",
      "description": "Total cost (quantity * unit_cost)"
    },
    "notes": {
      "type": "string",
      "description": "Optional notes about this BOM line item"
    }
  },
  "required": [
    "machine_id",
    "item_type",
    "item_id",
    "item_name",
    "quantity"
  ]
}