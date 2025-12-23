
import React, { useState, useEffect } from "react";
import { Machine, AppSetup } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Edit, 
  Settings,
  Filter,
  DollarSign,
  Package,
  Wrench
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import MachineCard from "../components/machines/MachineCard";
import MachineForm from "../components/machines/MachineForm";

export default function Machines() {
  const [machines, setMachines] = useState([]);
  const [appSetup, setAppSetup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (machines.length === 0) return; // Ensure machines are loaded before checking URL params

    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const machineId = urlParams.get('id');

    if (action === 'edit' && machineId) {
      const machineToEdit = machines.find(m => m.id === machineId);
      if (machineToEdit) {
        handleEdit(machineToEdit);
        // Clean up URL params to prevent re-triggering
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [machines]); // Depend on 'machines' to ensure the array is populated

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [data, setupData] = await Promise.all([
        Machine.list('-created_date'),
        AppSetup.list(null, 1)
      ]);
      setMachines(data);
      if (setupData.length > 0) {
        setAppSetup(setupData[0]);
      }
    } catch (error) {
      console.error("Error loading machines or setup:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async (machineData) => {
    try {
      let currentSetup = appSetup;
      // If a new category is used, add it to the global setup
      if (currentSetup && machineData.category && !currentSetup.machine_categories.includes(machineData.category)) {
        const updatedSetup = {
          ...currentSetup,
          machine_categories: [...currentSetup.machine_categories, machineData.category]
        };
        await AppSetup.update(currentSetup.id, updatedSetup);
        setAppSetup(updatedSetup); // Update local state
      }

      if (editingMachine) {
        await Machine.update(editingMachine.id, machineData);
      } else {
        await Machine.create(machineData);
      }
      setShowForm(false);
      setEditingMachine(null);
      loadData();
    } catch (error) {
      console.error("Error saving machine:", error);
    }
  };

  const handleEdit = (machine) => {
    setEditingMachine(machine);
    setShowForm(true);
  };
  
  const handleDelete = async (machineId) => {
    try {
      await Machine.delete(machineId);
      setShowForm(false);
      setEditingMachine(null);
      loadData();
    } catch (error) {
      console.error("Error deleting machine:", error);
    }
  };

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = machine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         machine.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || machine.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...(appSetup?.machine_categories || [])];

  if (showForm) {
    return (
      <MachineForm
        machine={editingMachine}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingMachine(null);
        }}
        onDelete={handleDelete}
        categories={appSetup?.machine_categories || []}
        laborRates={appSetup?.labor_rates || []}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Machines</h1>
          <p className="text-muted-foreground mt-1">Manage your machine catalog</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Machine
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search machines or manufacturers..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading machines...</div>
          ) : filteredMachines.length === 0 ? (
            <div className="p-8 text-center">
              <Settings className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No machines found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || categoryFilter !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Add your first machine to get started"
                }
              </p>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Machine
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {filteredMachines.map((machine) => (
                <MachineCard 
                  key={machine.id} 
                  machine={machine} 
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
