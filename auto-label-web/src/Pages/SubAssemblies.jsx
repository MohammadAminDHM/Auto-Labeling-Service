
import React, { useState, useEffect } from "react";
import { SubAssembly, Part, Supplier, AppSetup } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Edit, 
  Layers,
  Package,
  Clock
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import SubAssemblyCard from "../components/subassemblies/SubAssemblyCard";
import SubAssemblyForm from "../components/subassemblies/SubAssemblyForm";

export default function SubAssemblies() {
  const [subAssemblies, setSubAssemblies] = useState([]);
  const [parts, setParts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [appSetup, setAppSetup] = useState(null); // Added appSetup state
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingSubAssembly, setEditingSubAssembly] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (subAssemblies.length === 0) return; // Ensure sub-assemblies are loaded before checking URL params

    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const subAssemblyId = urlParams.get('id');

    if (action === 'edit' && subAssemblyId) {
      const subAssemblyToEdit = subAssemblies.find(sa => sa.id === subAssemblyId);
      if (subAssemblyToEdit) {
        handleEdit(subAssemblyToEdit);
        // Clean up URL params to prevent re-triggering
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [subAssemblies]); // Depend on 'subAssemblies' to ensure the array is populated

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetches AppSetup data along with others
      const [subAssembliesData, partsData, suppliersData, setupData] = await Promise.all([
        SubAssembly.list('-created_date'),
        Part.list(),
        Supplier.list(),
        AppSetup.list(null, 1) // Fetching the first AppSetup record
      ]);
      setSubAssemblies(subAssembliesData);
      setParts(partsData);
      setSuppliers(suppliersData);
      if (setupData.length > 0) {
        setAppSetup(setupData[0]); // Set appSetup if data exists
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async (subAssemblyData) => {
    try {
      if (editingSubAssembly) {
        await SubAssembly.update(editingSubAssembly.id, subAssemblyData);
      } else {
        await SubAssembly.create(subAssemblyData);
      }
      setShowForm(false);
      setEditingSubAssembly(null);
      loadData();
    } catch (error) {
      console.error("Error saving sub-assembly:", error);
    }
  };

  const handleEdit = (subAssembly) => {
    setEditingSubAssembly(subAssembly);
    setShowForm(true);
  };
  
  // Added handleDelete function
  const handleDelete = async (assemblyId) => {
    try {
      await SubAssembly.delete(assemblyId);
      loadData(); // Reload data after deletion
    } catch (error) {
      console.error("Error deleting sub-assembly:", error);
    }
  };

  const filteredSubAssemblies = subAssemblies.filter(assembly => {
    const matchesSearch = assembly.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assembly.assembly_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || assembly.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Dynamically set categories based on appSetup
  const categories = ["all", ...(appSetup?.sub_assembly_categories || [])];

  if (showForm) {
    return (
      <SubAssemblyForm
        subAssembly={editingSubAssembly}
        parts={parts}
        suppliers={suppliers}
        appSetup={appSetup} // Pass appSetup to SubAssemblyForm
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingSubAssembly(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sub-Assemblies</h1>
          <p className="text-muted-foreground mt-1">Build and manage assemblies from parts</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Assembly
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search assemblies or assembly numbers..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading sub-assemblies...</div>
          ) : filteredSubAssemblies.length === 0 ? (
            <div className="p-8 text-center">
              <Layers className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No sub-assemblies found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || categoryFilter !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Create your first sub-assembly to get started"
                }
              </p>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Assembly
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {filteredSubAssemblies.map((assembly) => (
                <SubAssemblyCard 
                  key={assembly.id} 
                  subAssembly={assembly} 
                  supplier={suppliers.find(s => s.id === assembly.supplier_id)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
