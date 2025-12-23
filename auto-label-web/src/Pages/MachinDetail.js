
import React, { useState, useEffect, useCallback } from "react";
import { Machine, MachineBOM, Part, SubAssembly } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Plus, Trash2, Settings, Layers, Wrench, Clock, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import PartSelector from "../components/quotes/PartSelector";

export default function MachineDetail() {
  const [machine, setMachine] = useState(null);
  const [bomItems, setBomItems] = useState([]);
  const [allParts, setAllParts] = useState([]);
  const [allSubAssemblies, setAllSubAssemblies] = useState([]);
  
  const [selectedItemType, setSelectedItemType] = useState("sub_assembly"); // Changed default to sub_assembly
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedItemQty, setSelectedItemQty] = useState(1);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isBomLoading, setIsBomLoading] = useState(true);
  
  const machineId = new URLSearchParams(window.location.search).get("id");

  const loadMachineData = useCallback(async () => {
    if (!machineId) return;
    setIsLoading(true);
    try {
      const [machineData, partsData, subAssemblyData] = await Promise.all([
        Machine.filter({ id: machineId }),
        Part.list(),
        SubAssembly.list()
      ]);
      
      if (machineData.length > 0) {
        setMachine(machineData[0]);
      }
      setAllParts(partsData);
      setAllSubAssemblies(subAssemblyData);
    } catch (error) {
      console.error("Error loading machine data:", error);
      toast.error("Failed to load machine data.");
    }
    setIsLoading(false);
  }, [machineId]);

  const loadBomData = useCallback(async () => {
    if (!machineId) return;
    setIsBomLoading(true);
    try {
      const data = await MachineBOM.filter({ machine_id: machineId });
      setBomItems(data);
    } catch (error) {
      console.error("Error loading BOM:", error);
      toast.error("Failed to load BOM.");
    }
    setIsBomLoading(false);
  }, [machineId]);

  useEffect(() => {
    loadMachineData();
    loadBomData();
  }, [loadMachineData, loadBomData]);

  const handleAddParts = async (partIds) => {
    if (!machine?.id) {
      toast.error("Machine not loaded.");
      return;
    }

    if (partIds.length === 0) {
      toast.warning("No parts selected to add.");
      return;
    }

    try {
      for (const partId of partIds) {
        const part = allParts.find(p => p.id === partId);
        if (!part) continue;

        const existingBomItem = bomItems.find(
          item => item.item_type === 'part' && item.item_id === partId
        );

        if (existingBomItem) {
          // Update existing item - increase quantity by 1
          await MachineBOM.update(existingBomItem.id, {
            quantity: existingBomItem.quantity + 1,
            total_cost: (existingBomItem.quantity + 1) * existingBomItem.unit_cost
          });
        } else {
          // Create new item
          await MachineBOM.create({
            machine_id: machine.id,
            item_type: "part",
            item_id: part.id,
            item_name: part.name,
            item_number: part.part_number,
            quantity: 1,
            unit_cost: part.cost_price || 0,
            total_cost: part.cost_price || 0
          });
        }
      }

      toast.success(`Added ${partIds.length} part${partIds.length > 1 ? 's' : ''} to BOM.`);
      loadBomData();
    } catch (error) {
      console.error("Error adding parts:", error);
      toast.error("Failed to add parts to BOM.");
    }
  };

  const handleAddBomItem = async () => {
    if (!selectedItemId || selectedItemQty <= 0) {
      toast.warning("Please select an item and enter a valid quantity.");
      return;
    }
    
    if (selectedItemType !== "sub_assembly") {
      toast.error("Invalid item type selected for this operation.");
      return;
    }

    const itemDetails = allSubAssemblies.find(sa => sa.id === selectedItemId);
    
    if (!itemDetails) {
      toast.error("Selected sub-assembly not found.");
      return;
    }

    try {
      // Check if this sub-assembly already exists in the BOM
      const existingBomItem = bomItems.find(
        item => item.item_type === 'sub_assembly' && item.item_id === selectedItemId
      );

      if (existingBomItem) {
        // Update existing item - increase quantity
        await MachineBOM.update(existingBomItem.id, {
          quantity: existingBomItem.quantity + selectedItemQty,
          total_cost: (existingBomItem.quantity + selectedItemQty) * existingBomItem.unit_cost
        });
        toast.success("Sub-assembly quantity updated in BOM.");
      } else {
        // Create new item
        await MachineBOM.create({
          machine_id: machine.id,
          item_type: "sub_assembly",
          item_id: itemDetails.id,
          item_name: itemDetails.name,
          item_number: itemDetails.assembly_number,
          quantity: selectedItemQty,
          unit_cost: itemDetails.total_cost || 0,
          total_cost: (itemDetails.total_cost || 0) * selectedItemQty
        });
        toast.success("Sub-assembly added to BOM.");
      }
      
      loadBomData();
      setSelectedItemId("");
      setSelectedItemQty(1);
    } catch (error) {
      console.error("Error adding BOM item:", error);
      toast.error("Failed to add item to BOM.");
    }
  };

  const handleUpdateBomItem = async (bomItemId, newQuantity) => {
    const item = bomItems.find(i => i.id === bomItemId);
    if (!item) return;

    if (newQuantity <= 0) { 
      toast.warning("Quantity must be at least 1. Use the trash icon to remove the item.");
      return;
    }

    try {
      await MachineBOM.update(bomItemId, {
        quantity: newQuantity,
        total_cost: newQuantity * item.unit_cost
      });
      loadBomData();
      toast.success("Item quantity updated.");
    } catch (error) {
      console.error("Error updating BOM item:", error);
      toast.error("Failed to update item.");
    }
  };

  const handleRemoveBomItem = async (bomItemId) => {
    try {
      await MachineBOM.delete(bomItemId);
      toast.success("Item removed from BOM.");
      loadBomData();
    } catch (error) {
      console.error("Error removing BOM item:", error);
      toast.error("Failed to remove item.");
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading machine details...</div>;
  }

  if (!machine) {
    return <div className="p-6">Machine not found.</div>;
  }

  const bomCost = bomItems.reduce((sum, item) => sum + (item.total_cost || 0), 0);
  
  // Calculate total labor hours including BOM items
  let totalLaborHours = 0;
  let totalLaborCost = 0;

  // Add machine's own labor (new flexible system first, fallback to legacy)
  if (machine.labor_entries && machine.labor_entries.length > 0) {
    machine.labor_entries.forEach(entry => {
      totalLaborHours += entry.hours || 0;
      totalLaborCost += (entry.hours || 0) * (entry.rate || 0);
    });
  } else {
    // Legacy system fallback
    const legacyHours = (machine.assembly_labor_hours || 0) + (machine.finishing_labor_hours || 0);
    const legacyCost = (machine.assembly_labor_hours || 0) * (machine.assembly_labor_rate || 0) + 
                      (machine.finishing_labor_hours || 0) * (machine.finishing_labor_rate || 0);
    totalLaborHours += legacyHours;
    totalLaborCost += legacyCost;
  }

  // Add labor from BOM sub-assemblies
  bomItems.forEach(item => {
    if (item.item_type === 'sub_assembly') {
      const subAssembly = allSubAssemblies.find(sa => sa.id === item.item_id);
      if (subAssembly?.labor_entries) {
        subAssembly.labor_entries.forEach(entry => {
          const itemLaborHours = (entry.hours || 0) * (item.quantity || 1);
          totalLaborHours += itemLaborHours;
          totalLaborCost += itemLaborHours * (entry.rate || 0);
        });
      }
    }
    // Note: Individual parts don't typically have labor in this system,
    // but if they were fabricated parts, we could add that here too
  });

  const totalMachineCost = bomCost + totalLaborCost;
  const sellingPrice = totalMachineCost * (1 + (machine.markup_percent || 0) / 100);

  const maxLeadTime = Math.max(0, ...bomItems.map(item => {
    let leadTime = 0;
    if (item.item_type === 'part') {
      const part = allParts.find(p => p.id === item.item_id);
      leadTime = part?.lead_time_days || 0;
    } else if (item.item_type === 'sub_assembly') {
      const subAssembly = allSubAssemblies.find(sa => sa.id === item.item_id);
      // Assuming sub-assembly lead time is the max of its parts' lead times
      leadTime = Math.max(0, ...(subAssembly?.parts?.map(p => {
        const partDetails = allParts.find(ap => ap.id === p.part_id);
        return partDetails?.lead_time_days || 0;
      }) || [0]));
    }
    return leadTime;
  }));

  const totalBuildDays = Math.ceil(totalLaborHours / 8); // Assuming 8-hour work days
  const estimatedCompletionDays = maxLeadTime + totalBuildDays;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Machines")}>
          <Button variant="ghost" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{machine.name}</h1>
          <p className="text-muted-foreground mt-1">
            {machine.manufacturer} • Model: {machine.machine_id}
          </p>
        </div>
        <Link to={createPageUrl(`Machines?action=edit&id=${machine.id}`)}>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Machine
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Machine Info */}
          <Card className="bg-card border-border">
            <CardHeader><CardTitle>Machine Information</CardTitle></CardHeader>
            <CardContent>
              {machine.image_url && (
                <div className="mb-4 h-64 bg-muted/50 rounded-md overflow-hidden">
                  <img src={machine.image_url} alt={machine.name} className="w-full h-full object-cover" />
                </div>
              )}
              <p className="text-muted-foreground">{machine.description}</p>
            </CardContent>
          </Card>
          
          {/* Bill of Materials (BOM) */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle>Bill of Materials (BOM)</CardTitle>
                <div className="flex gap-2">
                  <PartSelector
                    parts={allParts}
                    suppliers={[]} // Assuming suppliers are not needed here or will be fetched if required by PartSelector
                    selectedPartIds={bomItems.filter(item => item.item_type === 'part').map(item => item.item_id)}
                    onAddParts={handleAddParts}
                    partCategories={[]} // Assuming part categories are not needed here or will be fetched if required by PartSelector
                  />
                  {/* Selector for adding sub-assemblies */}
                  <Select value={selectedItemType} onValueChange={setSelectedItemType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Add Item Type"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sub_assembly">Sub-Assembly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Sub-Assembly Form */}
              {selectedItemType === "sub_assembly" && (
                <div className="flex items-end gap-2 p-3 bg-muted/50 rounded-md">
                  <div className="flex-[3]">
                    <Label>Select Sub-Assembly</Label>
                    <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                      <SelectTrigger><SelectValue placeholder="Select a sub-assembly..."/></SelectTrigger>
                      <SelectContent>
                        {allSubAssemblies.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.assembly_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Quantity</Label>
                    <Input type="number" value={selectedItemQty} onChange={e => setSelectedItemQty(parseInt(e.target.value) || 1)} min="1" />
                  </div>
                  <Button onClick={handleAddBomItem} disabled={!selectedItemId}>
                    <Plus className="w-4 h-4 mr-2"/> Add
                  </Button>
                </div>
              )}

              {/* BOM List */}
              <div className="space-y-2">
                {isBomLoading ? <p>Loading BOM...</p> : bomItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2 p-3 border rounded-md bg-background">
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${item.item_type === 'part' ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300' : 'bg-purple-500/20 text-purple-700 dark:text-purple-300'}`}>
                      {item.item_type === 'part' ? <Wrench className="w-3 h-3"/> : <Layers className="w-3 h-3"/>}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.item_name}</p>
                      <p className="text-xs text-muted-foreground">{item.item_number}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Qty:</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateBomItem(item.id, parseInt(e.target.value) || 1)}
                        className="w-20 h-8 text-center"
                      />
                    </div>
                    <p className="w-24 text-right font-medium">${item.total_cost?.toFixed(2)}</p>
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 flex-shrink-0" onClick={() => handleRemoveBomItem(item.id)}>
                      <Trash2 className="w-4 h-4"/>
                    </Button>
                  </div>
                ))}
                {bomItems.length === 0 && !isBomLoading && <p className="text-center text-muted-foreground py-4">No items in BOM. Add parts and sub-assemblies above.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Production Estimates */}
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5"/> Production Estimate</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span>Longest Part Lead Time</span><span className="font-bold">{maxLeadTime} days</span></div>
              <div className="flex justify-between"><span>Total Labor Time</span><span className="font-bold">{totalLaborHours.toFixed(1)} hours</span></div>
              <div className="text-xs text-muted-foreground">Includes machine assembly + sub-assembly labor</div>
              <div className="border-t pt-3 mt-3 flex justify-between text-lg">
                <span className="font-semibold">Est. Completion</span>
                <span className="font-bold text-primary">{estimatedCompletionDays} days</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Pricing */}
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5"/> Cost & Price</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span>BOM Cost</span><span>${bomCost.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Labor Cost</span><span>${totalLaborCost.toFixed(2)}</span></div>
              <div className="border-t pt-3 mt-3 flex justify-between font-bold">
                <span>Total Machine Cost</span>
                <span>${totalMachineCost.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 mt-3 flex justify-between text-lg">
                <span className="font-semibold">Selling Price</span>
                <span className="font-bold text-primary">${sellingPrice.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2">Based on {machine.markup_percent}% markup</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
