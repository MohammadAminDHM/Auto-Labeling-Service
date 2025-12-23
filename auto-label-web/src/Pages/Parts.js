
import React, { useState, useEffect } from "react";
import { Part, Supplier, AppSetup, RawMaterial } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Wrench,
  AlertTriangle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import PartCard from "../components/parts/PartCard";
import PartForm from "../components/parts/PartForm";

export default function Parts() {
  const [parts, setParts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [appSetup, setAppSetup] = useState(null); // New state for appSetup
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingPart, setEditingPart] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (parts.length === 0) return; // Ensure parts are loaded before checking URL params

    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const partId = urlParams.get('id');

    if (action === 'edit' && partId) {
      const partToEdit = parts.find(p => p.id === partId);
      if (partToEdit) {
        handleEdit(partToEdit);
        // Clean up URL params to prevent re-triggering on subsequent renders or navigation
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [parts]); // Depend on 'parts' to ensure the array is populated

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [partsData, suppliersData, rawMaterialsData, setupData] = await Promise.all([
        Part.list('-created_date'),
        Supplier.list(),
        RawMaterial.list(),
        AppSetup.list(null, 1) // Fetch AppSetup data, limit to 1 document
      ]);
      setParts(partsData);
      setSuppliers(suppliersData);
      setRawMaterials(rawMaterialsData);
      if (setupData.length > 0) {
        setAppSetup(setupData[0]); // Set the first AppSetup document
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async (partData) => {
    try {
      if (editingPart) {
        await Part.update(editingPart.id, partData);
      } else {
        await Part.create(partData);
      }
      setShowForm(false);
      setEditingPart(null);
      loadData();
    } catch (error) {
      console.error("Error saving part:", error);
    }
  };

  const handleEdit = (part) => {
    setEditingPart(part);
    setShowForm(true);
  };

  const handleDelete = async (partId) => {
    try {
      await Part.delete(partId);
      loadData(); // Refresh data
    } catch (error) {
      console.error("Error deleting part:", error);
    }
  };

  const filteredParts = parts.filter(part => {
    const supplier = suppliers.find(s => s.id === part.supplier_id);
    const matchesSearch = part.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || part.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Dynamically get categories from appSetup or default to empty array
  const categories = ["all", ...(appSetup?.part_categories || [])];
  const lowStockParts = parts.filter(part => part.stock_quantity <= 5);

  if (showForm) {
    return (
      <PartForm
        part={editingPart}
        suppliers={suppliers}
        rawMaterials={rawMaterials}
        allParts={parts}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingPart(null);
        }}
        partCategories={appSetup?.part_categories || []} // Pass part categories to PartForm
        machineCategories={appSetup?.machine_categories || []} // Pass machine categories to PartForm
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Parts Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage your parts and pricing</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Part
        </Button>
      </div>

      {lowStockParts.length > 0 && (
        <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <CardTitle className="text-orange-900 dark:text-orange-200">Low Stock Alert</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-orange-800 dark:text-orange-300 mb-3">
              {lowStockParts.length} part{lowStockParts.length !== 1 ? 's are' : ' is'} running low on stock:
            </p>
            <div className="flex flex-wrap gap-2">
              {lowStockParts.map((part) => (
                <Badge key={part.id} variant="outline" className="text-orange-900 dark:text-orange-200 border-orange-500/50 bg-orange-100 dark:bg-orange-900/30">
                  {part.part_number} ({part.stock_quantity} left)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search parts, numbers, or suppliers..."
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
            <div className="p-8 text-center text-muted-foreground">Loading parts...</div>
          ) : filteredParts.length === 0 ? (
            <div className="p-8 text-center">
              <Wrench className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No parts found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || categoryFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Add your first part to get started"
                }
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Part
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {filteredParts.map((part) => (
                <PartCard
                  key={part.id}
                  part={part}
                  supplier={suppliers.find(s => s.id === part.supplier_id)}
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
