
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Plus, Trash2, X, DollarSign, Clock } from "lucide-react";
import PartSelector from "../quotes/PartSelector"; // Added import

export default function SubAssemblyForm({ subAssembly, parts, suppliers, rawMaterials, appSetup, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    assembly_number: "", // Changed based on outline
    description: "",
    category: "other", // Kept default for initial state
    image_url: "",
    supplier_id: "",
    parts: [],
    raw_materials: [], // Added raw_materials
    labor_entries: [],
    markup_percent: 25,
    compatible_machines: [], // Re-added to ensure it's initialized
    is_active: true,
  });

  // selectedPart state removed as per outline
  const [selectedMaterial, setSelectedMaterial] = useState(""); // Added selectedMaterial
  const [newMachine, setNewMachine] = useState(""); // Kept newMachine state
  const [newLaborEntry, setNewLaborEntry] = useState({ operation: "", hours: "", rate: "" });

  const [totals, setTotals] = useState({
    parts: 0,
    materials: 0, // Added materials total
    labor: 0,
    total_cost: 0,
    selling_price: 0,
    assembly_time_minutes: 0, // Added assembly_time
  });

  useEffect(() => {
    if (subAssembly) {
      setFormData({ ...subAssembly });
    }
  }, [subAssembly]);

  const calculateTotals = useCallback(() => {
    const partsCost = formData.parts.reduce((sum, p) => sum + (p.total_cost || 0), 0);
    const materialsCost = formData.raw_materials.reduce((sum, m) => sum + (m.total_cost || 0), 0); // Calculate materials cost
    const laborCost = formData.labor_entries.reduce((sum, l) => sum + ((parseFloat(l.hours) || 0) * (parseFloat(l.rate) || 0)), 0);
    const totalCost = partsCost + materialsCost + laborCost; // Add materials cost to total
    const sellingPrice = totalCost * (1 + (formData.markup_percent / 100));
    const assemblyTime = formData.labor_entries.reduce((sum, l) => sum + (parseFloat(l.hours) || 0), 0) * 60; // Calculate assembly time in minutes

    setTotals({
      parts: partsCost,
      materials: materialsCost,
      labor: laborCost,
      total_cost: totalCost,
      selling_price: sellingPrice,
      assembly_time_minutes: assemblyTime
    });
  }, [formData.parts, formData.raw_materials, formData.labor_entries, formData.markup_percent]); // Updated dependencies

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]); // Dependency on calculateTotals ensures it runs when formData changes via calculateTotals' useCallback dependencies

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // addPart function removed as per outline

  const handleAddParts = (partIds) => {
    const newParts = partIds.map(partId => {
      const part = (parts || []).find(p => p.id === partId);
      if (!part) return null;
      
      // Check if part is already in the list
      const existingPart = formData.parts.find(p => p.part_id === partId);
      if (existingPart) {
        // If part already exists, skip adding it as a new entry.
        // The PartSelector should ideally filter out already selected parts,
        // but this prevents explicit duplicates in the formData.
        return null;
      }

      return {
        part_id: part.id,
        part_name: part.name,
        part_number: part.part_number,
        quantity: 1,
        unit_cost: part.cost_price,
        total_cost: part.cost_price
      };
    }).filter(Boolean); // Filter out nulls for already existing parts

    if (newParts.length > 0) {
      setFormData(prev => ({
        ...prev,
        parts: [...prev.parts, ...newParts]
      }));
    }
  };

  const updatePart = (index, field, value) => {
    setFormData(prev => {
      const newParts = [...prev.parts];
      newParts[index] = { ...newParts[index], [field]: value };
      if (field === 'quantity' || field === 'unit_cost') { // unit_cost is disabled in JSX, but logic included for completeness
        newParts[index].total_cost = (newParts[index].quantity || 0) * (newParts[index].unit_cost || 0);
      }
      return { ...prev, parts: newParts };
    });
  };

  const removePart = (index) => {
    setFormData(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
    }));
  };

  // Raw Material Handlers
  const addMaterial = () => {
    if (!selectedMaterial) return;
    const material = (rawMaterials || []).find(m => m.id === selectedMaterial);
    if (!material) return;
    
    setFormData(prev => ({
      ...prev,
      raw_materials: [...prev.raw_materials, {
        material_id: material.id,
        material_name: material.name,
        quantity: 1,
        unit_cost: material.cost_per_unit,
        total_cost: material.cost_per_unit,
      }]
    }));
    setSelectedMaterial("");
  };

  const updateMaterial = (index, field, value) => {
    setFormData(prev => {
      const newMaterials = [...prev.raw_materials];
      newMaterials[index] = { ...newMaterials[index], [field]: value };
      if (field === 'quantity' || field === 'unit_cost') {
        newMaterials[index].total_cost = (newMaterials[index].quantity || 0) * (newMaterials[index].unit_cost || 0);
      }
      return { ...prev, raw_materials: newMaterials };
    });
  };
  
  const removeMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      raw_materials: prev.raw_materials.filter((_, i) => i !== index),
    }));
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

  const addLaborEntry = () => {
    if (!newLaborEntry.operation || newLaborEntry.hours === "" || newLaborEntry.rate === "") {
        return;
    }
    setFormData(prev => ({
        ...prev,
        labor_entries: [...prev.labor_entries, { ...newLaborEntry, hours: parseFloat(newLaborEntry.hours), rate: parseFloat(newLaborEntry.rate) }]
    }));
    setNewLaborEntry({ operation: "", hours: "", rate: "" });
  }

  const removeLaborEntry = (index) => {
    setFormData(prev => ({
        ...prev,
        labor_entries: prev.labor_entries.filter((_, i) => i !== index)
    }));
  }

  const handleSave = () => {
    const finalData = {
      ...formData,
      total_parts_cost: totals.parts,
      total_materials_cost: totals.materials, // Added to final data
      total_labor_cost: totals.labor,
      total_cost: totals.total_cost,
      selling_price: totals.selling_price,
      assembly_time_minutes: totals.assembly_time_minutes
    };
    onSave(finalData);
  };

  // Use appSetup for categories, machine types, and labor rates
  const categoryOptions = appSetup?.sub_assembly_categories || [];
  const machineTypes = appSetup?.machine_categories || [];
  const laborRateOptions = appSetup?.labor_rates || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onCancel} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {subAssembly ? 'Edit Sub-Assembly' : 'Create New Sub-Assembly'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {subAssembly ? 'Update assembly details and parts list' : 'Build a new assembly from existing parts'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* Basic Information */}
            <Card className="bg-card border-border rounded-md">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assembly_number">Assembly Number *</Label>
                    <Input
                      id="assembly_number"
                      value={formData.assembly_number}
                      onChange={(e) => handleInputChange("assembly_number", e.target.value)}
                      placeholder="e.g. ASM-001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category"/>
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">Assembly Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g. CNC Tool Change Kit"
                    required
                  />
                </div>
                
                {/* New Image URL and Supplier fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="image_url">Image URL</Label>
                        <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => handleInputChange("image_url", e.target.value)}
                        placeholder="https://example.com/assembly.jpg"
                        />
                    </div>
                    <div>
                        <Label htmlFor="supplier_id">Supplier (if outsourced)</Label>
                        <Select
                            value={formData.supplier_id}
                            onValueChange={(value) => handleInputChange("supplier_id", value)}
                        >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a supplier" />
                        </SelectTrigger>
                        <SelectContent>
                            {(suppliers || []).map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Detailed description of the assembly..."
                    className="h-24"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Parts List */}
            <Card className="bg-card border-border rounded-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Parts List</CardTitle>
                  <PartSelector
                    parts={parts || []}
                    suppliers={suppliers || []}
                    selectedPartIds={formData.parts.map(p => p.part_id)}
                    onAddParts={handleAddParts}
                    partCategories={appSetup?.part_categories || []}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.parts.length > 0 && (
                  <div className="space-y-3">
                    {formData.parts.map((part, index) => (
                      <div key={index} className="border border-border rounded-lg p-4 bg-background">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{part.part_name}</h4>
                            <p className="text-xs text-muted-foreground">{part.part_number}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePart(index)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={part.quantity}
                              onChange={(e) => updatePart(index, "quantity", parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Unit Cost</Label>
                            <Input
                              value={`$${(part.unit_cost || 0).toFixed(2)}`}
                              disabled
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Total</Label>
                            <Input
                              value={`$${(part.total_cost || 0).toFixed(2)}`}
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {formData.parts.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No parts added yet. Use the "Add Parts" button above to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Raw Materials Card */}
            <Card className="bg-card border-border rounded-md">
              <CardHeader>
                <CardTitle>Raw Materials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select raw material..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(rawMaterials || []).map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} ({m.material_id}) - ${m.cost_per_unit.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addMaterial} disabled={!selectedMaterial}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.raw_materials.length > 0 && (
                  <div className="space-y-2">
                    {formData.raw_materials.map((mat, index) => (
                      <div key={index} className="flex items-center gap-2 border border-border p-2 rounded-md bg-background">
                        <p className="flex-1 font-medium">{mat.material_name}</p>
                        <Label className="sr-only">Quantity</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Qty"
                          value={mat.quantity}
                          onChange={(e) => updateMaterial(index, "quantity", parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                        <Label className="sr-only">Unit Cost</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Unit Cost"
                          value={mat.unit_cost}
                          onChange={(e) => updateMaterial(index, "unit_cost", parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                        <p className="w-24 text-right pr-2">${mat.total_cost.toFixed(2)}</p>
                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeMaterial(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Labor & Compatible Machines */}
            <Card className="bg-card border-border rounded-md">
              <CardHeader>
                <CardTitle>Labor Operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                    <Label>Labor Operations</Label>
                    <div className="space-y-2 mt-2">
                        {formData.labor_entries.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2 border p-2 rounded-lg bg-background">
                                <span className="flex-1">{entry.operation}</span>
                                <span className="text-muted-foreground">{entry.hours} hrs @ ${parseFloat(entry.rate).toFixed(2)}/hr</span>
                                <span>=</span>
                                <span className="font-medium">${(parseFloat(entry.hours) * parseFloat(entry.rate)).toFixed(2)}</span>
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeLaborEntry(index)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 mt-4 items-end">
                        <div className="flex-1">
                            <Label htmlFor="op_name" className="text-xs">Operation</Label>
                            <Input id="op_name" value={newLaborEntry.operation} onChange={e => setNewLaborEntry(prev => ({...prev, operation: e.target.value}))} placeholder="e.g. Assembly"/>
                        </div>
                        <div className="w-24">
                            <Label htmlFor="op_hours" className="text-xs">Hours</Label>
                            <Input id="op_hours" type="number" step="0.25" value={newLaborEntry.hours} onChange={e => setNewLaborEntry(prev => ({...prev, hours: e.target.value}))} placeholder="2.5"/>
                        </div>
                        <div className="w-40">
                             <Label htmlFor="op_rate" className="text-xs">Rate</Label>
                             <Select value={newLaborEntry.rate} onValueChange={value => setNewLaborEntry(prev => ({...prev, rate: value}))}>
                                <SelectTrigger><SelectValue placeholder="Select rate"/></SelectTrigger>
                                <SelectContent>
                                    {laborRateOptions.map(rate => <SelectItem key={rate.name} value={String(rate.rate)}>{rate.name} (${rate.rate}/hr)</SelectItem>)}
                                </SelectContent>
                             </Select>
                        </div>
                        <Button type="button" onClick={addLaborEntry}><Plus className="w-4 h-4"/></Button>
                    </div>
                </div>
              </CardContent>
            </Card>

            {/* Compatible Machines */}
            <Card className="bg-card border-border rounded-md">
              <CardHeader>
                <CardTitle>Compatible Machines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={newMachine} onValueChange={setNewMachine}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select machine type" />
                    </SelectTrigger>
                    <SelectContent>
                      {machineTypes.map((machine) => (
                        <SelectItem key={machine} value={machine}>
                          {machine.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addCompatibleMachine} disabled={!newMachine}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {formData.compatible_machines.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.compatible_machines.map((machine) => (
                      <Badge key={machine} variant="outline" className="flex items-center gap-1">
                        {machine.toUpperCase()}
                        <button
                          type="button"
                          onClick={() => removeCompatibleMachine(machine)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border rounded-md">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                  />
                  <Label htmlFor="is_active" className="text-sm font-medium">
                    Assembly is active and available for quoting
                  </Label>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Right Column (Pricing & Actions) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card border-border rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Parts Cost:</span>
                <span className="font-medium">${totals.parts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Materials Cost:</span>
                <span className="font-medium">${totals.materials.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Labor Cost:</span>
                <span className="font-medium">${totals.labor.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between items-center font-bold">
                  <span>Total Cost:</span>
                  <span>${totals.total_cost.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-3">
                <Label htmlFor="markup_percent">Markup %</Label>
                <Input
                  id="markup_percent"
                  type="number"
                  value={formData.markup_percent}
                  onChange={(e) => handleInputChange("markup_percent", parseFloat(e.target.value) || 0)}
                  className="w-28"
                />
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between items-center text-lg font-bold text-primary">
                  <span>Selling Price:</span>
                  <span>${totals.selling_price.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Assembly Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-center">
                {totals.assembly_time_minutes.toFixed(0)} minutes
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={formData.parts.length === 0 && formData.raw_materials.length === 0} // Adjusted validation to include raw materials
            >
              <Save className="w-4 h-4 mr-2" />
              {subAssembly ? 'Update Assembly' : 'Create Assembly'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
