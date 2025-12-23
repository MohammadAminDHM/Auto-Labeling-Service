import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";

export default function RawMaterialForm({ material, suppliers, onSave, onCancel }) {
  const [formData, setFormData] = useState(material || {
    name: "",
    material_id: "",
    material_type: "",
    form: "",
    specifications: "",
    cost_per_unit: 0,
    unit_of_measure: "",
    stock_quantity: 0,
    supplier_id: "",
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onCancel} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {material ? 'Edit Raw Material' : 'Add New Raw Material'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {material ? 'Update material details' : 'Add a new material to your inventory'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle>Material Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Material Name *</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} required />
              </div>
              <div>
                <Label htmlFor="material_id">Material ID / SKU *</Label>
                <Input id="material_id" value={formData.material_id} onChange={e => setFormData(p => ({...p, material_id: e.target.value}))} required />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="material_type">Material Type</Label>
                <Input id="material_type" value={formData.material_type} onChange={e => setFormData(p => ({...p, material_type: e.target.value}))} placeholder="e.g., Steel, Aluminum"/>
              </div>
              <div>
                <Label htmlFor="form">Form</Label>
                <Input id="form" value={formData.form} onChange={e => setFormData(p => ({...p, form: e.target.value}))} placeholder="e.g., Sheet, Bar, Tube"/>
              </div>
            </div>
             <div>
                <Label htmlFor="specifications">Specifications</Label>
                <Input id="specifications" value={formData.specifications} onChange={e => setFormData(p => ({...p, specifications: e.target.value}))} placeholder="e.g., 1/4&quot; Plate, 2&quot; OD 16ga Tube" />
              </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle>Cost & Inventory</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cost_per_unit">Cost per Unit *</Label>
                <Input id="cost_per_unit" type="number" step="0.01" value={formData.cost_per_unit} onChange={e => setFormData(p => ({...p, cost_per_unit: parseFloat(e.target.value) || 0}))} required />
              </div>
              <div>
                <Label htmlFor="unit_of_measure">Unit of Measure *</Label>
                <Input id="unit_of_measure" value={formData.unit_of_measure} onChange={e => setFormData(p => ({...p, unit_of_measure: e.target.value}))} placeholder="e.g., kg, ft, sheet" required />
              </div>
              <div>
                <Label htmlFor="stock_quantity">Stock Quantity</Label>
                <Input id="stock_quantity" type="number" value={formData.stock_quantity} onChange={e => setFormData(p => ({...p, stock_quantity: parseFloat(e.target.value) || 0}))} />
              </div>
            </div>
             <div>
                <Label htmlFor="supplier_id">Supplier</Label>
                <Select value={formData.supplier_id} onValueChange={val => setFormData(p => ({...p, supplier_id: val}))}>
                  <SelectTrigger><SelectValue placeholder="Select a supplier" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
                <Textarea value={formData.notes} onChange={e => setFormData(p => ({...p, notes: e.target.value}))} placeholder="Add any relevant notes here..."/>
            </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            {material ? 'Update Material' : 'Save Material'}
          </Button>
        </div>
      </form>
    </div>
  );
}