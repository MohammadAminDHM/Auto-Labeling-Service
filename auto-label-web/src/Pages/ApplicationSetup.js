
import React, { useState, useEffect, useRef } from "react";
import { AppSetup } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Trash2, Settings, List, DollarSign, Edit, Check, X, Layers } from "lucide-react";
import { toast } from "sonner";

const EditableListItem = ({ item, onUpdate, onDelete, editState, setEditState, index, type }) => {
  const isEditing = editState.type === type && editState.index === index;
  const inputRef = useRef(null);
  const inputRateRef = useRef(null); // Ref for the rate input

  useEffect(() => {
    if (isEditing) {
      if (typeof item === 'object' && inputRef.current && inputRateRef.current) {
        inputRef.current.focus();
      } else if (typeof item === 'string' && inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isEditing, item]);

  const handleSave = () => {
    onUpdate(index, editState.value);
    setEditState({ type: null, index: -1, value: null }); // Exit edit mode
  };

  const handleCancel = () => {
    setEditState({ type: null, index: -1, value: null }); // Exit edit mode
  };
  
  if (isEditing) {
    return (
      <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg">
        {typeof item === 'object' ? (
          <>
            <Input
              ref={inputRef}
              value={editState.value.name}
              onChange={(e) => setEditState(prev => ({ ...prev, value: {...prev.value, name: e.target.value} }))}
              className="h-7 flex-grow"
              placeholder="Name"
            />
            <Input
              ref={inputRateRef}
              type="number"
              value={editState.value.rate}
              onChange={(e) => setEditState(prev => ({ ...prev, value: {...prev.value, rate: parseFloat(e.target.value) || ''} }))} // Allow empty string for temporary empty input
              className="h-7 w-24"
              placeholder="Rate"
            />
          </>
        ) : (
          <Input
            ref={inputRef}
            value={editState.value}
            onChange={(e) => setEditState(prev => ({ ...prev, value: e.target.value }))}
            className="h-7 flex-grow"
            placeholder="Category name"
          />
        )}
        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500 hover:bg-green-500/10" onClick={handleSave}>
          <Check className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-500/10" onClick={handleCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center justify-between p-2 text-base w-full rounded-md">
      <span>
        {typeof item === 'object' ? `${item.name}: $${item.rate}/hr` : item}
      </span>
      <div className="flex items-center gap-1">
        <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6"
            onClick={() => setEditState({ type, index, value: typeof item === 'object' ? { ...item } : item })}
        >
            <Edit className="w-3 h-3 text-muted-foreground" />
        </Button>
        <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6"
            onClick={() => onDelete(index)}
        >
            <Trash2 className="w-3 h-3 text-destructive" />
        </Button>
      </div>
    </Badge>
  );
};


export default function ApplicationSetup() {
  const [setup, setSetup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [newMachineCat, setNewMachineCat] = useState("");
  const [newPartCat, setNewPartCat] = useState("");
  const [newSubAssemblyCat, setNewSubAssemblyCat] = useState("");
  const [newLaborRate, setNewLaborRate] = useState({ name: "", rate: "" });

  const [editState, setEditState] = useState({ type: null, index: -1, value: null });

  useEffect(() => {
    loadSetup();
  }, []);

  const loadSetup = async () => {
    setIsLoading(true);
    try {
      let data = await AppSetup.list(null, 1);
      if (data.length > 0) {
        const loadedSetup = data[0];
        setSetup({
          id: loadedSetup.id, // Keep the ID
          machine_categories: loadedSetup.machine_categories || ["cnc", "lathe", "mill", "press", "other"],
          part_categories: loadedSetup.part_categories || ["motor", "bearing", "belt", "electrical", "other"],
          sub_assembly_categories: loadedSetup.sub_assembly_categories || ["control", "pneumatic", "hydraulic", "mechanical", "electrical"], // New default
          labor_rates: loadedSetup.labor_rates || [
            { name: "Standard Assembly", rate: 50 },
            { name: "Skilled Assembly", rate: 75 },
            { name: "Finishing", rate: 60 },
          ],
        });
      } else {
        const newSetupData = {
          machine_categories: ["cnc", "lathe", "mill", "press", "other"],
          part_categories: ["motor", "bearing", "belt", "electrical", "other"],
          sub_assembly_categories: ["control", "pneumatic", "hydraulic", "mechanical", "electrical"],
          labor_rates: [
            { name: "Standard Assembly", rate: 50 },
            { name: "Skilled Assembly", rate: 75 },
            { name: "Finishing", rate: 60 },
          ],
        };
        const createdSetup = await AppSetup.create(newSetupData);
        setSetup(createdSetup);
      }
    } catch (error) {
      console.error("Error loading setup:", error);
      toast.error("Failed to load application setup.");
    }
    setIsLoading(false);
  };

  const handleSaveAll = async () => {
    if (!setup) return;
    try {
      await AppSetup.update(setup.id, setup);
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving setup:", error);
      toast.error("Failed to save settings.");
    }
  };

  const addItem = (type, value) => {
    // Input validation for value
    if (typeof value === 'string') {
        const trimmedValue = value.trim();
        if (trimmedValue === '') {
            toast.error("Category name cannot be empty.");
            return;
        }
        // Prevent duplicates for string categories
        if (setup[type].some(item => typeof item === 'string' && item.toLowerCase() === trimmedValue.toLowerCase())) {
            toast.warning("This item already exists.");
            return;
        }
        value = trimmedValue; // Use trimmed value
    } else if (typeof value === 'object') { // For labor rates
        if (!value.name || value.name.trim() === '') {
            toast.error("Labor rate name cannot be empty.");
            return;
        }
        if (isNaN(value.rate) || value.rate === null || value.rate <= 0) {
            toast.error("Labor rate must be a positive number.");
            return;
        }
        // Prevent duplicates for labor rates (check by name)
        if (setup[type].some(item => typeof item === 'object' && item.name.toLowerCase() === value.name.trim().toLowerCase())) {
            toast.warning("This labor rate name already exists.");
            return;
        }
        value = { ...value, name: value.name.trim() }; // Trim name
    }
    
    setSetup(prev => ({ ...prev, [type]: [...(prev[type] || []), value] }));
    
    // Clear corresponding input field
    if (type === "machine_categories") setNewMachineCat("");
    if (type === "part_categories") setNewPartCat("");
    if (type === "sub_assembly_categories") setNewSubAssemblyCat("");
    if (type === "labor_rates") setNewLaborRate({ name: "", rate: "" });
  };

  const deleteItem = (type, index) => {
    setSetup(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const updateItem = (type, index, newValue) => {
      // Validation for update
      if (typeof newValue === 'string') {
          const trimmedValue = newValue.trim();
          if (trimmedValue === '') {
              toast.error("Category name cannot be empty.");
              return;
          }
          // Prevent updating to a duplicate
          const isDuplicate = setup[type].some((item, i) => i !== index && typeof item === 'string' && item.toLowerCase() === trimmedValue.toLowerCase());
          if (isDuplicate) {
              toast.warning("This item already exists.");
              return;
          }
          newValue = trimmedValue; // Use trimmed value for update
      } else if (typeof newValue === 'object') { // For labor rates
          if (!newValue.name || newValue.name.trim() === '') {
              toast.error("Labor rate name cannot be empty.");
              return;
          }
          if (isNaN(newValue.rate) || newValue.rate === null || newValue.rate <= 0) {
              toast.error("Labor rate must be a positive number.");
              return;
          }
          // Prevent updating to a duplicate
          const isDuplicate = setup[type].some((item, i) => i !== index && typeof item === 'object' && item.name.toLowerCase() === newValue.name.trim().toLowerCase());
          if (isDuplicate) {
              toast.warning("This labor rate name already exists.");
              return;
          }
          newValue = { ...newValue, name: newValue.name.trim() }; // Trim name for update
      }

      setSetup(prev => {
          const updatedItems = [...prev[type]];
          updatedItems[index] = newValue;
          return { ...prev, [type]: updatedItems };
      });
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading settings...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Application Setup</h1>
          <p className="text-muted-foreground mt-1">Manage global categories and labor rates.</p>
        </div>
        <Button onClick={handleSaveAll} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg">
          <Save className="w-4 h-4 mr-2" />
          Save All Settings
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Machine Categories */}
        <Card className="bg-card border-border">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Machine Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newMachineCat}
                onChange={(e) => setNewMachineCat(e.target.value)}
                placeholder="New machine category..."
                onKeyPress={(e) => e.key === 'Enter' && addItem('machine_categories', newMachineCat)}
              />
              <Button onClick={() => addItem('machine_categories', newMachineCat)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {setup?.machine_categories?.map((cat, index) => (
                <EditableListItem 
                    key={`machine-${cat}-${index}`} 
                    item={cat}
                    onUpdate={(idx, val) => updateItem('machine_categories', idx, val)}
                    onDelete={(idx) => deleteItem('machine_categories', idx)}
                    editState={editState}
                    setEditState={setEditState}
                    index={index}
                    type="machine_categories"
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Part Categories */}
        <Card className="bg-card border-border">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <List className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Part Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newPartCat}
                onChange={(e) => setNewPartCat(e.target.value)}
                placeholder="New part category..."
                onKeyPress={(e) => e.key === 'Enter' && addItem('part_categories', newPartCat)}
              />
              <Button onClick={() => addItem('part_categories', newPartCat)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {setup?.part_categories?.map((cat, index) => (
                 <EditableListItem 
                    key={`part-${cat}-${index}`} 
                    item={cat}
                    onUpdate={(idx, val) => updateItem('part_categories', idx, val)}
                    onDelete={(idx) => deleteItem('part_categories', idx)}
                    editState={editState}
                    setEditState={setEditState}
                    index={index}
                    type="part_categories"
                />
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Sub-Assembly Categories */}
        <Card className="bg-card border-border">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Layers className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Sub-Assembly Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newSubAssemblyCat}
                onChange={(e) => setNewSubAssemblyCat(e.target.value)}
                placeholder="New sub-assembly category..."
                onKeyPress={(e) => e.key === 'Enter' && addItem('sub_assembly_categories', newSubAssemblyCat)}
              />
              <Button onClick={() => addItem('sub_assembly_categories', newSubAssemblyCat)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {setup?.sub_assembly_categories?.map((cat, index) => (
                 <EditableListItem 
                    key={`sub-${cat}-${index}`} 
                    item={cat}
                    onUpdate={(idx, val) => updateItem('sub_assembly_categories', idx, val)}
                    onDelete={(idx) => deleteItem('sub_assembly_categories', idx)}
                    editState={editState}
                    setEditState={setEditState}
                    index={index}
                    type="sub_assembly_categories"
                />
              ))}
            </div>
          </CardContent>
        </Card>


        {/* Labor Rates */}
        <Card className="md:col-span-2 lg:col-span-1 bg-card border-border">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <DollarSign className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Labor Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newLaborRate.name}
                onChange={(e) => setNewLaborRate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Rate name (e.g., Assembly)"
              />
              <Input
                type="number"
                value={newLaborRate.rate}
                onChange={(e) => setNewLaborRate(prev => ({ ...prev, rate: parseFloat(e.target.value) || "" }))}
                placeholder="$/hr"
                className="w-24"
                onKeyPress={(e) => e.key === 'Enter' && addItem('labor_rates', newLaborRate)}
              />
              <Button onClick={() => addItem('labor_rates', newLaborRate)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {setup?.labor_rates?.map((rate, index) => (
                 <EditableListItem 
                    key={`labor-${rate.name}-${index}`} 
                    item={rate}
                    onUpdate={(idx, val) => updateItem('labor_rates', idx, val)}
                    onDelete={(idx) => deleteItem('labor_rates', idx)}
                    editState={editState}
                    setEditState={setEditState}
                    index={index}
                    type="labor_rates"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
