{
  "name": "SalesOrder",
  "type": "object",
  "properties": {
    "sales_order_number": {
      "type": "string",
      "description": "Unique sales order identifier"
    },
    "quote_id": {
      "type": "string",
      "description": "Reference to the original quote"
    },
    "quote_number": {
      "type": "string",
      "description": "Human-readable quote number from the original quote"
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
        "pending_production",
        "in_production",
        "shipped",
        "completed",
        "cancelled"
      ],
      "default": "pending_production",
      "description": "Sales order status"
    },
    "order_date": {
      "type": "string",
      "format": "date",
      "description": "Date the quote was accepted"
    },
    "expected_ship_date": {
      "type": "string",
      "format": "date",
      "description": "Expected ship date"
    },
    "actual_ship_date": {
      "type": "string",
      "format": "date",
      "description": "Actual ship date"
    },
    "requested_delivery_date": {
      "type": "string",
      "format": "date",
      "description": "Customer requested delivery date"
    },
    "shipping_method": {
      "type": "string",
      "enum": [
        "ground",
        "air",
        "freight",
        "pickup",
        "delivery"
      ],
      "default": "ground",
      "description": "Shipping method"
    },
    "shipping_address": {
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
        },
        "contact_person": {
          "type": "string"
        },
        "phone": {
          "type": "string"
        }
      },
      "description": "Shipping address (can be different from customer address)"
    },
    "tracking_number": {
      "type": "string",
      "description": "Shipping tracking number"
    },
    "shipping_cost": {
      "type": "number",
      "default": 0,
      "description": "Cost of shipping"
    },
    "delivery_instructions": {
      "type": "string",
      "description": "Special delivery instructions"
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
            "type": "number"
          },
          "unit_price": {
            "type": "number"
          },
          "total_price": {
            "type": "number"
          }
        }
      }
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
            "type": "number"
          },
          "unit_price": {
            "type": "number"
          },
          "total_price": {
            "type": "number"
          }
        }
      }
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
            "type": "number"
          },
          "unit_price": {
            "type": "number"
          },
          "total_price": {
            "type": "number"
          }
        }
      }
    },
    "subtotal": {
      "type": "number"
    },
    "discount_amount": {
      "type": "number"
    },
    "tax_amount": {
      "type": "number"
    },
    "total_amount": {
      "type": "number"
    },
    "notes": {
      "type": "string"
    }
  },
  "required": [
    "sales_order_number",
    "quote_id",
    "customer_id",
    "order_date"
  ]
}