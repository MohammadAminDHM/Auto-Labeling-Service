{
  "name": "Quote",
  "type": "object",
  "properties": {
    "quote_number": {
      "type": "string",
      "description": "Unique quote identifier"
    },
    "customer_id": {
      "type": "string",
      "description": "Reference to customer"
    },
    "location_id": {
      "type": "string",
      "description": "Reference to specific customer location"
    },
    "status": {
      "type": "string",
      "enum": [
        "draft",
        "sent",
        "accepted",
        "rejected",
        "expired"
      ],
      "default": "draft",
      "description": "Quote status"
    },
    "valid_until": {
      "type": "string",
      "format": "date",
      "description": "Quote expiration date"
    },
    "machines": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "machine_id": {
            "type": "string"
          },
          "quantity": {
            "type": "number",
            "default": 1
          },
          "unit_price": {
            "type": "number"
          },
          "discount_percent": {
            "type": "number",
            "default": 0
          },
          "total_price": {
            "type": "number"
          }
        }
      },
      "description": "Machines in the quote"
    },
    "parts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "part_id": {
            "type": "string"
          },
          "quantity": {
            "type": "number",
            "default": 1
          },
          "unit_price": {
            "type": "number"
          },
          "discount_percent": {
            "type": "number",
            "default": 0
          },
          "total_price": {
            "type": "number"
          }
        }
      },
      "description": "Parts in the quote"
    },
    "sub_assemblies": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "sub_assembly_id": {
            "type": "string"
          },
          "quantity": {
            "type": "number",
            "default": 1
          },
          "unit_price": {
            "type": "number"
          },
          "discount_percent": {
            "type": "number",
            "default": 0
          },
          "total_price": {
            "type": "number"
          }
        }
      },
      "description": "Sub-assemblies in the quote"
    },
    "subtotal": {
      "type": "number",
      "description": "Subtotal before discount and tax"
    },
    "discount_percent": {
      "type": "number",
      "default": 0,
      "description": "Overall quote discount percentage"
    },
    "discount_amount": {
      "type": "number",
      "description": "Discount amount in dollars"
    },
    "tax_rate": {
      "type": "number",
      "default": 0,
      "description": "Tax rate as decimal"
    },
    "tax_amount": {
      "type": "number",
      "description": "Tax amount"
    },
    "total_amount": {
      "type": "number",
      "description": "Total quote amount"
    },
    "notes": {
      "type": "string",
      "description": "Quote notes and terms"
    },
    "sent_date": {
      "type": "string",
      "format": "date",
      "description": "Date quote was sent to customer"
    }
  },
  "required": [
    "quote_number",
    "customer_id"
  ]
}