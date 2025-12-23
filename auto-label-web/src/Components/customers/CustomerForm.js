import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Plus, Trash2, MapPin } from "lucide-react";

export default function CustomerForm({ customer, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    locations: [{
      location_id: `LOC${Date.now()}`,
      location_name: "Main Location",
      address: {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "USA"
      },
      contact_person: "",
      email: "",
      phone: "",
      is_primary: true
    }],
    industry: "manufacturing",
    discount_rate: 0,
    notes: "",
    ...(customer || {})
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const addLocation = () => {
    const newLocation = {
      location_id: `LOC${Date.now()}`,
      location_name: "",
      address: {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "USA"
      },
      contact_person: "",
      email: "",
      phone: "",
      is_primary: false
    };
    
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, newLocation]
    }));
  };

  const removeLocation = (index) => {
    if (formData.locations.length <= 1) return; // Keep at least one location
    
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  const updateLocation = (index, field, value) => {
    setFormData(prev => {
      const newLocations = [...prev.locations];
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        newLocations[index] = {
          ...newLocations[index],
          [parent]: {
            ...newLocations[index][parent],
            [child]: value
          }
        };
      } else {
        newLocations[index] = {
          ...newLocations[index],
          [field]: value
        };
      }
      return { ...prev, locations: newLocations };
    });
  };

  const setPrimaryLocation = (index) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) => ({
        ...loc,
        is_primary: i === index
      }))
    }));
  };

  const industries = [
    { value: "manufacturing", label: "Manufacturing" },
    { value: "automotive", label: "Automotive" },
    { value: "aerospace", label: "Aerospace" },
    { value: "construction", label: "Construction" },
    { value: "energy", label: "Energy" },
    { value: "other", label: "Other" }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onCancel} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {customer ? 'Update customer information' : 'Add a new customer to your database'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <Card className="bg-card border-border rounded-md">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="e.g. Advanced Manufacturing Corp"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind.value} value={ind.value}>
                        {ind.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discount_rate">Default Discount Rate (%)</Label>
                <Input
                  id="discount_rate"
                  type="number"
                  step="0.1"
                  value={formData.discount_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_rate: parseFloat(e.target.value) || 0 }))}
                  placeholder="5.0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-md">
          <CardHeader>
            <CardTitle>Primary Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_person">Contact Person *</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john.smith@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="555-0123"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-md">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Customer Locations
            </CardTitle>
            <Button type="button" onClick={addLocation} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.locations.map((location, index) => (
              <div key={location.location_id} className="p-4 border border-border rounded-md bg-muted/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">Location {index + 1}</h4>
                    {location.is_primary && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!location.is_primary && (
                      <Button
                        type="button"
                        onClick={() => setPrimaryLocation(index)}
                        variant="ghost"
                        size="sm"
                      >
                        Set as Primary
                      </Button>
                    )}
                    {formData.locations.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeLocation(index)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Location Name *</Label>
                    <Input
                      value={location.location_name}
                      onChange={(e) => updateLocation(index, 'location_name', e.target.value)}
                      placeholder="e.g. Main Factory, Warehouse"
                      required
                    />
                  </div>
                  <div>
                    <Label>Location Contact</Label>
                    <Input
                      value={location.contact_person}
                      onChange={(e) => updateLocation(index, 'contact_person', e.target.value)}
                      placeholder="Site manager name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Location Email</Label>
                    <Input
                      type="email"
                      value={location.email}
                      onChange={(e) => updateLocation(index, 'email', e.target.value)}
                      placeholder="location@company.com"
                    />
                  </div>
                  <div>
                    <Label>Location Phone</Label>
                    <Input
                      value={location.phone}
                      onChange={(e) => updateLocation(index, 'phone', e.target.value)}
                      placeholder="555-0123"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Street Address</Label>
                    <Input
                      value={location.address.street}
                      onChange={(e) => updateLocation(index, 'address.street', e.target.value)}
                      placeholder="123 Industrial Blvd"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input
                        value={location.address.city}
                        onChange={(e) => updateLocation(index, 'address.city', e.target.value)}
                        placeholder="Detroit"
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input
                        value={location.address.state}
                        onChange={(e) => updateLocation(index, 'address.state', e.target.value)}
                        placeholder="MI"
                      />
                    </div>
                    <div>
                      <Label>ZIP Code</Label>
                      <Input
                        value={location.address.zip}
                        onChange={(e) => updateLocation(index, 'address.zip', e.target.value)}
                        placeholder="48201"
                      />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Input
                        value={location.address.country}
                        onChange={(e) => updateLocation(index, 'address.country', e.target.value)}
                        placeholder="USA"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-md">
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes about this customer..."
              className="h-24"
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            {customer ? 'Update Customer' : 'Add Customer'}
          </Button>
        </div>
      </form>
    </div>
  );
}