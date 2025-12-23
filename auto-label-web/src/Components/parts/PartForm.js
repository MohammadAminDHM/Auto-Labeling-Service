import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Plus, X, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PartForm({ part, suppliers, rawMaterials, allParts, onSave, onCancel, partCategories, machineCategories }) {
  const [formData, setFormData] = useState({
    part_number: "",
    name: "",
    category: "",
    cost_price: 0,
    selling_price: 0,
    supplier_id: "",
    alternative_suppliers: [],
    cross_reference: "",
    replacement_part_id: "",
    is_obsolete: false,
    raw_materials: [],
    description: "",
    image_url: "",
    stock_quantity: 0,
    lead_time_days: 0,
    is_active: true,
    ...(part || {}),
    compatible_machines: part?.compatible_machines || [],
  });

  const [newMachine, setNewMachine] = useState("");
  const [newAltSupplier, setNewAltSupplier] = useState({
    supplier_id: "",
    supplier_part_number: "",
    cost_price: 0,
    lead_time_days: 0
  });
  const [newRawMaterial, setNewRawMaterial] = useState({
    material_id: "",
    quantity: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate total raw materials cost
    const totalRawMaterialsCost = formData.raw_materials.reduce((sum, mat) => sum + (mat.total_cost || 0), 0);
    
    // Auto-update cost price if raw materials are used
    let finalData = { ...formData };
    if (formData.raw_materials.length > 0) {
      finalData.cost_price = totalRawMaterialsCost;
    }
    
    onSave(finalData);
  };

  const addCompatibleMachine = () => {
    if (newMachine && !formData.compatible_machines.includes(newMachine)) {
      setFormData(prev => ({
        ...prev,
        compatible_machines: [...prev.compatible_machines, newMachine]
      }));
      setNewMachine("");
    }
  };

  const removeCompatibleMachine = (machine) => {
    setFormData(prev => ({
      ...prev,
      compatible_machines: prev.compatible_machines.filter(m => m !== machine)
    }));
  };

  const addAlternativeSupplier = () => {
    if (newAltSupplier.supplier_id) {
      const supplier = suppliers.find(s => s.id === newAltSupplier.supplier_id);
      const altSupplier = {
        ...newAltSupplier,
        supplier_name: supplier?.name || 'Unknown'
      };
      
      setFormData(prev => ({
        ...prev,
        alternative_suppliers: [...prev.alternative_suppliers, altSupplier]
      }));
      
      setNewAltSupplier({
        supplier_id: "",
        supplier_part_number: "",
        cost_price: 0,
        lead_time_days: 0
      });
    }
  };

  const removeAlternativeSupplier = (index) => {
    setFormData(prev => ({
      ...prev,
      alternative_suppliers: prev.alternative_suppliers.filter((_, i) => i !== index)
    }));
  };

  const addRawMaterial = () => {
    if (newRawMaterial.material_id && newRawMaterial.quantity > 0) {
      const material = rawMaterials?.find(m => m.id === newRawMaterial.material_id);
      if (material) {
        const materialEntry = {
          material_id: material.id,
          material_name: material.name,
          quantity: newRawMaterial.quantity,
          unit_cost: material.cost_per_unit,
          total_cost: material.cost_per_unit * newRawMaterial.quantity
        };
        
        setFormData(prev => ({
          ...prev,
          raw_materials: [...prev.raw_materials, materialEntry]
        }));
        
        setNewRawMaterial({ material_id: "", quantity: 0 });
      }
    }
  };

  const removeRawMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      raw_materials: prev.raw_materials.filter((_, i) => i !== index)
    }));
  };

  const marginPercent = formData.cost_price > 0 ?
    ((formData.selling_price - formData.cost_price) / formData.cost_price * 100).toFixed(1) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onCancel} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {part ? 'Edit Part' : 'Add New Part'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {part ? 'Update part details and pricing' : 'Add a new part to your inventory'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <Card className="bg-card border-border rounded-md">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="part_number">Part Number *</Label>
                <Input
                  id="part_number"
                  value={formData.part_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, part_number: e.target.value }))}
                  placeholder="e.g. P-12345"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Part Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Motor Assembly"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value.toLowerCase() }))}
                  placeholder="e.g., motor, bearing..."
                  list="part-category-suggestions"
                  required
                />
                <datalist id="part-category-suggestions">
                  {partCategories && partCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              
              <div>
                <Label htmlFor="cross_reference">Cross Reference</Label>
                <Input
                  id="cross_reference"
                  value={formData.cross_reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, cross_reference: e.target.value }))}
                  placeholder="OEM part number"
                />
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="is_obsolete"
                  checked={formData.is_obsolete}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_obsolete: checked }))}
                />
                <Label htmlFor="is_obsolete" className="text-sm">
                  Mark as obsolete
                </Label>
              </div>
            </div>

            {formData.is_obsolete && (
              <div>
                <Label htmlFor="replacement_part">Replacement Part</Label>
                <Select
                  value={formData.replacement_part_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, replacement_part_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select replacement part" />
                  </SelectTrigger>
                  <SelectContent>
                    {allParts?.filter(p => p.id !== part?.id).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.part_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-md">
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="cost_price">Cost Price *</Label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="selling_price">Selling Price *</Label>
                <Input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, selling_price: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="stock_quantity">Stock Quantity</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Margin</Label>
                <div className="mt-2 p-2 bg-muted rounded text-center">
                  <span className={`font-bold ${marginPercent > 50 ? 'text-green-600' : marginPercent > 25 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {marginPercent}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-md">
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primary_supplier">Primary Supplier</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select primary supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Alternative Suppliers</Label>
              <div className="flex gap-2 mt-2">
                <Select
                  value={newAltSupplier.supplier_id}
                  onValueChange={(value) => setNewAltSupplier(prev => ({ ...prev, supplier_id: value }))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.filter(s => s.id !== formData.supplier_id).map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Their part #"
                  className="w-32"
                  value={newAltSupplier.supplier_part_number}
                  onChange={(e) => setNewAltSupplier(prev => ({ ...prev, supplier_part_number: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Cost"
                  className="w-24"
                  step="0.01"
                  value={newAltSupplier.cost_price}
                  onChange={(e) => setNewAltSupplier(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                />
                <Button type="button" onClick={addAlternativeSupplier} disabled={!newAltSupplier.supplier_id}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2 mt-4">
                {formData.alternative_suppliers.map((altSupplier, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded border-border border">
                    <div>
                      <span className="font-medium">{altSupplier.supplier_name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        Part: {altSupplier.supplier_part_number} | Cost: ${altSupplier.cost_price}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAlternativeSupplier(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-md">
          <CardHeader>
            <CardTitle>Raw Materials (for fabricated parts)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select
                value={newRawMaterial.material_id}
                onValueChange={(value) => setNewRawMaterial(prev => ({ ...prev, material_id: value }))}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select raw material" />
                </SelectTrigger>
                <SelectContent>
                  {rawMaterials?.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} (${material.cost_per_unit}/{material.unit_of_measure})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Quantity"
                className="w-32"
                step="0.01"
                value={newRawMaterial.quantity}
                onChange={(e) => setNewRawMaterial(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
              />
              <Button type="button" onClick={addRawMaterial} disabled={!newRawMaterial.material_id || newRawMaterial.quantity <= 0}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {formData.raw_materials.map((material, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded border-border border">
                  <div>
                    <span className="font-medium">{material.material_name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      Qty: {material.quantity} | Unit: ${material.unit_cost} | Total: ${material.total_cost?.toFixed(2)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRawMaterial(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            {formData.raw_materials.length > 0 && (
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total Raw Materials Cost:</span>
                  <span>${formData.raw_materials.reduce((sum, mat) => sum + (mat.total_cost || 0), 0).toFixed(2)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-md">
          <CardHeader>
            <CardTitle>Machine Compatibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Compatible machine category"
                value={newMachine}
                onChange={(e) => setNewMachine(e.target.value)}
                list="machine-suggestions"
              />
              <datalist id="machine-suggestions">
                {machineCategories && machineCategories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
              <Button type="button" onClick={addCompatibleMachine} disabled={!newMachine}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.compatible_machines.map((machine) => (
                <Badge key={machine} variant="secondary" className="flex items-center gap-1">
                  {machine}
                  <button
                    type="button"
                    onClick={() => removeCompatibleMachine(machine)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-md">
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed part description..."
                className="h-24"
              />
            </div>

            <div>
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://example.com/part-image.jpg"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active" className="text-sm">
                Part is active and available for quoting
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            {part ? 'Update Part' : 'Add Part'}
          </Button>
        </div>
      </form>
    </div>
  );
}