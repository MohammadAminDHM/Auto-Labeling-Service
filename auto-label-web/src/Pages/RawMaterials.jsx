import React, { useState, useEffect } from "react";
import { RawMaterial, Supplier } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Box } from "lucide-react";
import RawMaterialCard from "../components/rawmaterials/RawMaterialCard";
import RawMaterialForm from "../components/rawmaterials/RawMaterialForm";

export default function RawMaterials() {
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [materialsData, suppliersData] = await Promise.all([
        RawMaterial.list('-created_date'),
        Supplier.list()
      ]);
      setMaterials(materialsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async (materialData) => {
    try {
      if (editingMaterial) {
        await RawMaterial.update(editingMaterial.id, materialData);
      } else {
        await RawMaterial.create(materialData);
      }
      setShowForm(false);
      setEditingMaterial(null);
      loadData();
    } catch (error) {
      console.error("Error saving raw material:", error);
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setShowForm(true);
  };

  const handleDelete = async (materialId) => {
    try {
      await RawMaterial.delete(materialId);
      loadData();
    } catch (error) {
      console.error("Error deleting raw material:", error);
    }
  };

  const filteredMaterials = materials.filter(m =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.material_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showForm) {
    return (
      <RawMaterialForm
        material={editingMaterial}
        suppliers={suppliers}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingMaterial(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Raw Materials</h1>
          <p className="text-muted-foreground mt-1">Manage your inventory of raw materials.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
          <Plus className="w-4 h-4 mr-2" />
          Add Material
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name or material ID..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading materials...</div>
          ) : filteredMaterials.length === 0 ? (
            <div className="p-8 text-center">
              <Box className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No raw materials found</h3>
              <p className="text-muted-foreground mb-6">Add your first material to get started.</p>
              <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Material
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {filteredMaterials.map((material) => (
                <RawMaterialCard
                  key={material.id}
                  material={material}
                  supplier={suppliers.find(s => s.id === material.supplier_id)}
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