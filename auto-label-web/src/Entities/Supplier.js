{
  "name": "Supplier",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Supplier company name"
    },
    "contact_person": {
      "type": "string",
      "description": "Primary contact person"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "Contact email"
    },
    "phone": {
      "type": "string",
      "description": "Phone number"
    },
    "address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "city": {
          "type": "string"
        },
        "state": {
          "type": "string"
        },
        "zip": {
          "type": "string"
        },
        "country": {
          "type": "string"
        }
      }
    },
    "payment_terms": {
      "type": "string",
      "description": "Payment terms (e.g., Net 30, Net 60)"
    },
    "lead_time_days": {
      "type": "number",
      "default": 0,
      "description": "Standard lead time in days"
    },
    "notes": {
      "type": "string",
      "description": "Additional notes about this supplier"
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "description": "Whether supplier is active"
    }
  },
  "required": [
    "name",
    "contact_person",
    "email"
  ]
}