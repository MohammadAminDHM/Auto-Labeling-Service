import React, { useState, useEffect } from "react";
import { Supplier } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Edit, 
  Truck,
  Building2,
  Mail,
  Phone
} from "lucide-react";

import SupplierCard from "../components/suppliers/SupplierCard";
import SupplierForm from "../components/suppliers/SupplierForm";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
      const data = await Supplier.list('-created_date');
      setSuppliers(data);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async (supplierData) => {
    try {
      if (editingSupplier) {
        await Supplier.update(editingSupplier.id, supplierData);
      } else {
        await Supplier.create(supplierData);
      }
      setShowForm(false);
      setEditingSupplier(null);
      loadSuppliers();
    } catch (error) {
      console.error("Error saving supplier:", error);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    return supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (showForm) {
    return (
      <SupplierForm
        supplier={editingSupplier}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingSupplier(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground mt-1">Manage your supplier network</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search suppliers, contacts, or emails..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading suppliers...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="p-8 text-center">
              <Truck className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No suppliers found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? "Try adjusting your search"
                  : "Add your first supplier to get started"
                }
              </p>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {filteredSuppliers.map((supplier) => (
                <SupplierCard 
                  key={supplier.id} 
                  supplier={supplier} 
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