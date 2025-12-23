
import React, { useState, useEffect } from "react";
import { Quote, Customer, Machine, Part, SubAssembly, MachineBOM, Supplier, AppSetup } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Plus, Trash2, CheckCircle, Send, XCircle, Ban, Circle } from "lucide-react";
import { format, addDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PartSelector from "./PartSelector";
import SubAssemblySelector from "./SubAssemblySelector";

export default function QuoteBuilder({ customers, initialQuote, onSave, onCancel, onStatusChange }) {
  const [quoteData, setQuoteData] = useState({
    quote_number: `Q${Date.now()}`,
    customer_id: "",
    location_id: "", // Added location_id to initial state
    status: "draft",
    valid_until: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    machines: [],
    parts: [],
    sub_assemblies: [],
    discount_percent: 0,
    tax_rate: 0.08,
    notes: ""
  });

  const [selectedMachine, setSelectedMachine] = useState("");
  // Removed: const [selectedParts, setSelectedParts] = useState([]);
  // Removed: const [selectedSubAssemblies, setSelectedSubAssemblies] = useState([]);
  
  const [subAssemblies, setSubAssemblies] = useState([]);
  const [allMachines, setAllMachines] = useState([]);
  const [allParts, setAllParts] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]); // New state
  const [appSetup, setAppSetup] = useState(null); // New state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAllReferenceData = async () => {
      setIsLoading(true);
      try {
        const [subAssembliesData, machinesData, partsData, suppliersData, setupData] = await Promise.all([
          SubAssembly.list(),
          Machine.list(),
          Part.list(),
          Supplier.list(), // Fetch suppliers
          AppSetup.list(null, 1) // Fetch app setup (assuming it's a singleton or we need the first one)
        ]);
        setSubAssemblies(subAssembliesData);
        setAllMachines(machinesData);
        setAllParts(partsData);
        setAllSuppliers(suppliersData); // Set suppliers state
        if (setupData.length > 0) {
          setAppSetup(setupData[0]); // Set app setup state
        }

        // If editing an existing quote, populate it with full item details
        if (initialQuote) {
          await populateExistingQuoteData(initialQuote, machinesData, partsData, subAssembliesData);
        }
      } catch (error) {
        console.error("Error loading reference data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAllReferenceData();
  }, [initialQuote]);

  const populateExistingQuoteData = async (quote, machinesData, partsData, subAssembliesData) => {
    // Populate machines with full details
    const enrichedMachines = quote.machines?.map(quoteMachine => {
      const fullMachine = machinesData.find(m => m.id === quoteMachine.machine_id);
      return {
        ...quoteMachine,
        machine_name: fullMachine?.name || 'Unknown Machine',
        machine_model_id: fullMachine?.machine_id || 'N/A'
      };
    }) || [];

    // Populate parts with full details  
    const enrichedParts = quote.parts?.map(quotePart => {
      const fullPart = partsData.find(p => p.id === quotePart.part_id);
      return {
        ...quotePart,
        part_name: fullPart?.name || 'Unknown Part',
        part_number: fullPart?.part_number || 'N/A'
      };
    }) || [];

    // Populate sub-assemblies with full details
    const enrichedSubAssemblies = quote.sub_assemblies?.map(quoteSubAssembly => {
      const fullSubAssembly = subAssembliesData.find(sa => sa.id === quoteSubAssembly.sub_assembly_id);
      return {
        ...quoteSubAssembly,
        sub_assembly_name: fullSubAssembly?.name || 'Unknown Sub-Assembly',
        assembly_number: fullSubAssembly?.assembly_number || 'N/A'
      };
    }) || [];

    setQuoteData({
      ...quote,
      valid_until: quote.valid_until ? format(new Date(quote.valid_until), 'yyyy-MM-dd') : format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      tax_rate: quote.tax_rate || 0.08,
      discount_percent: quote.discount_percent || 0,
      machines: enrichedMachines,
      parts: enrichedParts,
      sub_assemblies: enrichedSubAssemblies,
      location_id: quote.location_id || "" // Include location_id
    });
  };

  const addMachine = async () => {
    if (!selectedMachine) return;
    const machine = allMachines.find(m => m.id === selectedMachine);
    if (!machine) return;

    try {
        const bomData = await MachineBOM.filter({ machine_id: machine.id });
        const totalPartsCost = bomData.reduce((sum, item) => sum + (item.total_cost || 0), 0);
        
        const laborCost = (machine.assembly_labor_hours || 0) * (machine.assembly_labor_rate || 50) +
                          (machine.finishing_labor_hours || 0) * (machine.finishing_labor_rate || 50);

        const totalCost = totalPartsCost + laborCost;
        const sellingPrice = totalCost * (1 + (machine.markup_percent || 25) / 100);
        
        setQuoteData(prev => ({
          ...prev,
          machines: [...prev.machines, {
            machine_id: machine.id,
            machine_name: machine.name,
            machine_model_id: machine.machine_id,
            quantity: 1,
            unit_price: sellingPrice,
            discount_percent: 0,
            total_price: sellingPrice
          }]
        }));
    } catch (error) {
      console.error("Error calculating machine price:", error);
      const basePrice = (machine.assembly_labor_hours || 0) * (machine.assembly_labor_rate || 50) +
                        (machine.finishing_labor_hours || 0) * (machine.finishing_labor_rate || 50);
      const sellingPrice = basePrice * (1 + (machine.markup_percent || 25) / 100);
      setQuoteData(prev => ({
        ...prev,
        machines: [...prev.machines, {
          machine_id: machine.id,
          machine_name: machine.name,
          machine_model_id: machine.machine_id,
          quantity: 1,
          unit_price: sellingPrice || 0,
          discount_percent: 0,
          total_price: sellingPrice || 0
        }]
      }));
    }
    setSelectedMachine("");
  };

  const handleAddParts = (partIds) => {
    const newParts = partIds.map(partId => {
      const part = allParts.find(p => p.id === partId);
      if (!part) return null; // Defensive check
      return {
        part_id: part.id,
        part_name: part.name,
        part_number: part.part_number,
        quantity: 1,
        unit_price: part.selling_price,
        discount_percent: 0,
        total_price: part.selling_price
      };
    }).filter(Boolean); // Filter out any nulls if parts weren't found

    setQuoteData(prev => ({
      ...prev,
      parts: [...prev.parts, ...newParts]
    }));
  };

  const handleAddSubAssemblies = (subAssemblyIds) => {
    const newSubAssemblies = subAssemblyIds.map(saId => {
      const subAssembly = subAssemblies.find(sa => sa.id === saId);
      if (!subAssembly) return null; // Defensive check
      return {
        sub_assembly_id: subAssembly.id,
        sub_assembly_name: subAssembly.name,
        assembly_number: subAssembly.assembly_number,
        quantity: 1,
        unit_price: subAssembly.selling_price,
        discount_percent: 0,
        total_price: subAssembly.selling_price
      };
    }).filter(Boolean);

    setQuoteData(prev => ({
      ...prev,
      sub_assemblies: [...prev.sub_assemblies, ...newSubAssemblies]
    }));
  };

  const updateMachineItem = (index, field, value) => {
    setQuoteData(prev => {
      const newMachines = [...prev.machines];
      newMachines[index] = { ...newMachines[index], [field]: value };
      
      if (field === 'quantity' || field === 'unit_price' || field === 'discount_percent') {
        const item = newMachines[index];
        const subtotal = (item.quantity || 0) * (item.unit_price || 0);
        const discount = subtotal * ((item.discount_percent || 0) / 100);
        newMachines[index].total_price = subtotal - discount;
      }
      
      return { ...prev, machines: newMachines };
    });
  };

  const updatePartItem = (index, field, value) => {
    setQuoteData(prev => {
      const newParts = [...prev.parts];
      newParts[index] = { ...newParts[index], [field]: value };
      
      if (field === 'quantity' || field === 'unit_price' || field === 'discount_percent') {
        const item = newParts[index];
        const subtotal = (item.quantity || 0) * (item.unit_price || 0);
        const discount = subtotal * ((item.discount_percent || 0) / 100);
        newParts[index].total_price = subtotal - discount;
      }
      
      return { ...prev, parts: newParts };
    });
  };

  const updateSubAssemblyItem = (index, field, value) => {
    setQuoteData(prev => {
      const newSubAssemblies = [...prev.sub_assemblies];
      newSubAssemblies[index] = { ...newSubAssemblies[index], [field]: value };
      
      if (field === 'quantity' || field === 'unit_price' || field === 'discount_percent') {
        const item = newSubAssemblies[index];
        const subtotal = (item.quantity || 0) * (item.unit_price || 0);
        const discount = subtotal * ((item.discount_percent || 0) / 100);
        newSubAssemblies[index].total_price = subtotal - discount;
      }
      
      return { ...prev, sub_assemblies: newSubAssemblies };
    });
  };

  const removeMachine = (index) => {
    setQuoteData(prev => ({
      ...prev,
      machines: prev.machines.filter((_, i) => i !== index)
    }));
  };

  const removePart = (index) => {
    setQuoteData(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
    }));
  };

  const removeSubAssembly = (index) => {
    setQuoteData(prev => ({
      ...prev,
      sub_assemblies: prev.sub_assemblies.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const subtotal = [
      ...quoteData.machines.map(m => m.total_price || 0),
      ...quoteData.parts.map(p => p.total_price || 0),
      ...quoteData.sub_assemblies.map(sa => sa.total_price || 0)
    ].reduce((sum, price) => sum + price, 0);
    
    const discount_percent_val = parseFloat(quoteData.discount_percent) || 0;
    const tax_rate_val = parseFloat(quoteData.tax_rate) || 0;

    const discount_amount = subtotal * (discount_percent_val / 100);
    const discounted_subtotal = subtotal - discount_amount;
    const tax_amount = discounted_subtotal * tax_rate_val;
    const total_amount = discounted_subtotal + tax_amount;
    
    return { subtotal, discount_amount, discounted_subtotal, tax_amount, total_amount };
  };

  const handleSave = async () => {
    const totals = calculateTotals();
    const finalQuoteData = {
      ...quoteData,
      subtotal: totals.subtotal,
      discount_amount: totals.discount_amount,
      tax_amount: totals.tax_amount,
      total_amount: totals.total_amount,
      discount_percent: parseFloat(quoteData.discount_percent) || 0,
      tax_rate: parseFloat(quoteData.tax_rate) || 0,
    };

    try {
      if (initialQuote?.id) {
        await Quote.update(initialQuote.id, finalQuoteData);
      } else {
        await Quote.create(finalQuoteData);
      }
      onSave();
    } catch (error) {
      console.error("Error saving quote:", error);
    }
  };

  const totals = calculateTotals();

  const getStatusInfo = (status) => {
    const statuses = {
      draft: { color: "bg-slate-700 text-slate-300 border-slate-600", icon: Circle },
      sent: { color: "bg-blue-900/50 text-blue-300 border-blue-500/30", icon: Send },
      accepted: { color: "bg-green-900/50 text-green-300 border-green-500/30", icon: CheckCircle },
      rejected: { color: "bg-red-900/50 text-red-300 border-red-500/30", icon: XCircle },
      expired: { color: "bg-orange-900/50 text-orange-300 border-orange-500/30", icon: Ban }
    };
    return statuses[status] || statuses.draft;
  };

  const statusInfo = getStatusInfo(quoteData.status);
  const StatusIcon = statusInfo.icon;
  const quoteStatuses = ["draft", "sent", "accepted", "rejected", "expired"];

  if (isLoading) {
    return (
      <div className="p-6 text-center flex justify-center items-center h-screen">
        <p className="text-muted-foreground">Loading data for quote builder...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onCancel} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">
                {initialQuote ? `Quote ${initialQuote.quote_number}` : 'Create Quote'}
              </h1>
              {initialQuote && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={`text-xs h-auto px-3 py-1.5 border ${statusInfo.color}`}>
                      <StatusIcon className="w-3 h-3 mr-2" />
                      {quoteData.status.charAt(0).toUpperCase() + quoteData.status.slice(1)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {quoteStatuses.map((status) => (
                      <DropdownMenuItem 
                        key={status}
                        onClick={() => {
                          setQuoteData(prev => ({...prev, status}));
                          if (onStatusChange && initialQuote?.id) {
                            onStatusChange(initialQuote.id, status);
                          }
                        }}
                        disabled={quoteData.status === status}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {initialQuote ? 'View or edit quote details' : 'Build a new machine quote'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Details */}
          <Card className="bg-card border-border rounded-md">
            <CardHeader>
              <CardTitle>Quote Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quote_number">Quote Number</Label>
                  <Input
                    id="quote_number"
                    value={quoteData.quote_number}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, quote_number: e.target.value }))}
                    disabled={initialQuote ? true : false}
                  />
                </div>
                <div>
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={quoteData.valid_until}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, valid_until: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Select
                  value={quoteData.customer_id}
                  onValueChange={(value) => {
                    setQuoteData(prev => ({ ...prev, customer_id: value, location_id: "" })); // Reset location_id on customer change
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.company_name} - {customer.contact_person}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {quoteData.customer_id && (
                <div>
                  <Label htmlFor="location">Customer Location</Label>
                  <Select
                    value={quoteData.location_id}
                    onValueChange={(value) => setQuoteData(prev => ({ ...prev, location_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.find(c => c.id === quoteData.customer_id)?.locations?.map((location) => (
                        <SelectItem key={location.location_id} value={location.location_id}>
                          {location.location_name} - {[location.address?.city, location.address?.state].filter(Boolean).join(', ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Machines */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Machines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select machine to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {allMachines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name} ({machine.machine_id}) - {machine.manufacturer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addMachine} disabled={!selectedMachine}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {quoteData.machines.map((machine, index) => (
                <div key={index} className="border border-border rounded-lg p-4 space-y-3 bg-background">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{machine.machine_name}</h4>
                      {machine.machine_model_id && (
                        <p className="text-xs text-muted-foreground">Model: {machine.machine_model_id}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMachine(index)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        value={machine.quantity}
                        onChange={(e) => updateMachineItem(index, 'quantity', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        value={machine.unit_price}
                        onChange={(e) => updateMachineItem(index, 'unit_price', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Discount %</Label>
                      <Input
                        type="number"
                        value={machine.discount_percent}
                        onChange={(e) => updateMachineItem(index, 'discount_percent', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Total</Label>
                      <Input
                        value={`$${(machine.total_price || 0).toFixed(2)}`}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Parts */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Parts</CardTitle>
                <PartSelector
                  parts={allParts}
                  suppliers={allSuppliers}
                  selectedPartIds={quoteData.parts.map(p => p.part_id)}
                  onAddParts={handleAddParts}
                  partCategories={appSetup?.part_categories || []}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {quoteData.parts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No parts added yet. Use the "Add Parts" button to get started.</p>
                </div>
              ) : (
                quoteData.parts.map((part, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 space-y-3 bg-background">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{part.part_name}</h4>
                        <p className="text-xs text-muted-foreground">{part.part_number}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePart(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          value={part.quantity}
                          onChange={(e) => updatePartItem(index, 'quantity', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit Price</Label>
                        <Input
                          type="number"
                          value={part.unit_price}
                          onChange={(e) => updatePartItem(index, 'unit_price', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Discount %</Label>
                        <Input
                          type="number"
                          value={part.discount_percent}
                          onChange={(e) => updatePartItem(index, 'discount_percent', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Total</Label>
                        <Input
                          value={`$${(part.total_price || 0).toFixed(2)}`}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Sub-Assemblies */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sub-Assemblies</CardTitle>
                <SubAssemblySelector
                  subAssemblies={subAssemblies}
                  suppliers={allSuppliers}
                  selectedSubAssemblyIds={quoteData.sub_assemblies.map(sa => sa.sub_assembly_id)}
                  onAddSubAssemblies={handleAddSubAssemblies}
                  subAssemblyCategories={appSetup?.sub_assembly_categories || []}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {quoteData.sub_assemblies.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No sub-assemblies added yet. Use the "Add Sub-Assemblies" button to get started.</p>
                </div>
              ) : (
                quoteData.sub_assemblies.map((assembly, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 space-y-3 bg-background">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{assembly.sub_assembly_name}</h4>
                        <p className="text-xs text-muted-foreground">{assembly.assembly_number}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubAssembly(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          value={assembly.quantity}
                          onChange={(e) => updateSubAssemblyItem(index, 'quantity', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit Price</Label>
                        <Input
                          type="number"
                          value={assembly.unit_price}
                          onChange={(e) => updateSubAssemblyItem(index, 'unit_price', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Discount %</Label>
                        <Input
                          type="number"
                          value={assembly.discount_percent}
                          onChange={(e) => updateSubAssemblyItem(index, 'discount_percent', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Total</Label>
                        <Input
                          value={`$${(assembly.total_price || 0).toFixed(2)}`}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quote Summary */}
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Quote Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Discount:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="w-20 text-right"
                    value={quoteData.discount_percent}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, discount_percent: parseFloat(e.target.value) || 0 }))}
                    step="0.01"
                  />
                  <span className="text-xs">%</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Discount Amount:</span>
                <span className="font-medium text-red-400">-${totals.discount_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Tax Rate:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="w-20 text-right"
                    value={quoteData.tax_rate}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                    step="0.01"
                  />
                  <span className="text-xs">%</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Tax Amount:</span>
                <span className="font-medium">${totals.tax_amount.toFixed(2)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">${totals.total_amount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Additional terms, conditions, or notes..."
                value={quoteData.notes}
                onChange={(e) => setQuoteData(prev => ({ ...prev, notes: e.target.value }))}
                className="h-32"
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!quoteData.customer_id}
            >
              <Save className="w-4 h-4 mr-2" />
              {initialQuote ? 'Update Quote' : 'Save Quote'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
