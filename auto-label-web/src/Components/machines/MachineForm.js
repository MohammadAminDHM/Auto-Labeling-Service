
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Trash2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MachineForm({ machine, onSave, onCancel, onDelete, categories, laborRates }) {
  const [formData, setFormData] = useState(
    machine
      ? { ...machine, labor_entries: machine.labor_entries || [] }
      : {
          machine_id: "", // New field: machine_id
          name: "",
          manufacturer: "",
          category: "", // Changed default category to empty string
          specifications: {
            power: "",
            dimensions: "",
            weight: "",
            capacity: "",
          },
          description: "",
          image_url: "",
          labor_entries: [], // Use flexible labor entries
          markup_percent: 25,
          is_active: true,
        }
  );
  
  const [newLaborEntry, setNewLaborEntry] = useState({ operation: "", hours: "", rate: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleSpecificationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [field]: value
      }
    }));
  };
  
  const addLaborEntry = () => {
    if (!newLaborEntry.operation || newLaborEntry.hours === "" || newLaborEntry.rate === "") {
        // Optionally, add a more user-friendly error message or visual feedback here
        alert("Please fill in all fields for the labor operation.");
        return;
    }
    setFormData(prev => ({
        ...prev,
        labor_entries: [...prev.labor_entries, { ...newLaborEntry, hours: parseFloat(newLaborEntry.hours), rate: parseFloat(newLaborEntry.rate) }]
    }));
    setNewLaborEntry({ operation: "", hours: "", rate: "" }); // Reset for next entry
  }

  const removeLaborEntry = (index) => {
    setFormData(prev => ({
        ...prev,
        labor_entries: prev.labor_entries.filter((_, i) => i !== index)
    }));
  }

  return (
    <div className="p-6 space-y-6 bg-background text-foreground">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onCancel} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {machine ? 'Edit Machine' : 'Add New Machine'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {machine ? 'Update machine details' : 'Add a new machine to your catalog'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="machine_id" className="text-card-foreground">Machine ID *</Label>
                <Input
                  id="machine_id"
                  value={formData.machine_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, machine_id: e.target.value }))}
                  placeholder="e.g. CNC-5000"
                  required
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="name" className="text-card-foreground">Machine Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. ProCNC 5000"
                  required
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manufacturer" className="text-card-foreground">Manufacturer *</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                  placeholder="e.g. Industrial Solutions"
                  required
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="category" className="text-card-foreground">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value.toLowerCase() }))} // Ensure category is lowercase
                  placeholder="e.g., CNC, Lathe, or type a new one"
                  list="category-suggestions"
                  required
                  className="bg-background border-border text-foreground"
                />
                <datalist id="category-suggestions">
                  {categories && categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <Label htmlFor="markup_percent" className="text-card-foreground">Markup (%) *</Label>
              <Input
                id="markup_percent"
                type="number"
                value={formData.markup_percent}
                onChange={(e) => setFormData(prev => ({ ...prev, markup_percent: parseFloat(e.target.value) || 0 }))}
                placeholder="25"
                required
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="image_url" className="text-card-foreground">Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://example.com/machine-image.jpg"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-card-foreground">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the machine..."
                className="h-24 bg-background border-border text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Labor Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                {formData.labor_entries.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 border p-2 rounded-lg bg-background">
                        <span className="flex-1 font-medium">{entry.operation}</span>
                        <span className="text-muted-foreground">{entry.hours} hrs @ ${parseFloat(entry.rate).toFixed(2)}/hr</span>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeLaborEntry(index)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                    </div>
                ))}
            </div>
            <div className="flex gap-2 pt-4 border-t items-end">
                <div className="flex-1">
                    <Label htmlFor="op_name" className="text-xs">Operation</Label>
                    <Input id="op_name" value={newLaborEntry.operation} onChange={e => setNewLaborEntry(prev => ({...prev, operation: e.target.value}))} placeholder="e.g. Final Assembly"/>
                </div>
                <div className="w-24">
                    <Label htmlFor="op_hours" className="text-xs">Hours</Label>
                    <Input id="op_hours" type="number" step="0.25" value={newLaborEntry.hours} onChange={e => setNewLaborEntry(prev => ({...prev, hours: e.target.value}))} placeholder="2.5"/>
                </div>
                <div className="w-40">
                     <Label htmlFor="op_rate" className="text-xs">Rate</Label>
                     <Select value={String(newLaborEntry.rate)} onValueChange={value => setNewLaborEntry(prev => ({...prev, rate: value}))}>
                        <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Select rate"/></SelectTrigger>
                        <SelectContent>
                            {laborRates.map(rate => <SelectItem key={rate.name} value={String(rate.rate)}>{rate.name} (${rate.rate}/hr)</SelectItem>)}
                        </SelectContent>
                     </Select>
                </div>
                <Button type="button" onClick={addLaborEntry}><Plus className="w-4 h-4"/></Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Technical Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="power" className="text-card-foreground">Power</Label>
                <Input
                  id="power"
                  value={formData.specifications.power}
                  onChange={(e) => handleSpecificationChange('power', e.target.value)}
                  placeholder="e.g. 50 HP"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="capacity" className="text-card-foreground">Capacity</Label>
                <Input
                  id="capacity"
                  value={formData.specifications.capacity}
                  onChange={(e) => handleSpecificationChange('capacity', e.target.value)}
                  placeholder="e.g. 5-axis simultaneous"
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dimensions" className="text-card-foreground">Dimensions</Label>
                <Input
                  id="dimensions"
                  value={formData.specifications.dimensions}
                  onChange={(e) => handleSpecificationChange('dimensions', e.target.value)}
                  placeholder="e.g. 120 x 80 x 96 inches"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="weight" className="text-card-foreground">Weight</Label>
                <Input
                  id="weight"
                  value={formData.specifications.weight}
                  onChange={(e) => handleSpecificationChange('weight', e.target.value)}
                  placeholder="e.g. 12,000 lbs"
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                className="bg-background border-border text-foreground"
              />
              <Label htmlFor="is_active" className="text-sm font-medium text-card-foreground">
                Machine is active and available for quoting
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between gap-4">
          {machine && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" className="flex-shrink-0">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Machine
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border text-foreground">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-card-foreground">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This action cannot be undone. This will permanently delete the
                    &quot;{machine.name}&quot; machine from your catalog.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(machine.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <div className="flex gap-4 ml-auto">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              {machine ? 'Update Machine' : 'Add Machine'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
