{
  "name": "Customer",
  "type": "object",
  "properties": {
    "company_name": {
      "type": "string",
      "description": "Company name"
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
    "locations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "location_id": {
            "type": "string",
            "description": "Unique location identifier"
          },
          "location_name": {
            "type": "string",
            "description": "Name/description of this location"
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
          "contact_person": {
            "type": "string",
            "description": "Location-specific contact person"
          },
          "email": {
            "type": "string",
            "description": "Location-specific email"
          },
          "phone": {
            "type": "string",
            "description": "Location-specific phone"
          },
          "is_primary": {
            "type": "boolean",
            "default": false,
            "description": "Whether this is the primary location"
          }
        },
        "required": [
          "location_id",
          "location_name"
        ]
      },
      "description": "Customer locations"
    },
    "industry": {
      "type": "string",
      "enum": [
        "manufacturing",
        "automotive",
        "aerospace",
        "construction",
        "energy",
        "other"
      ],
      "description": "Customer industry"
    },
    "discount_rate": {
      "type": "number",
      "default": 0,
      "description": "Default discount percentage for this customer"
    },
    "notes": {
      "type": "string",
      "description": "Customer notes"
    }
  },
  "required": [
    "company_name",
    "contact_person",
    "email"
  ]
}