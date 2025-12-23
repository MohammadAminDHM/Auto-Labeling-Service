import React, { useState, useEffect, useCallback } from "react";
import { Part, Supplier, RawMaterial } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Package, AlertTriangle, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PartDetail() {
  const [part, setPart] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [alternativeSuppliers, setAlternativeSuppliers] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [replacementPart, setReplacementPart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const partId = new URLSearchParams(window.location.search).get("id");

  const loadPartData = useCallback(async () => {
    if (!partId) return;
    setIsLoading(true);
    try {
      const [partData, suppliersData, materialsData, allPartsData] = await Promise.all([
        Part.filter({ id: partId }),
        Supplier.list(),
        RawMaterial.list(),
        Part.list()
      ]);

      if (partData.length > 0) {
        const currentPart = partData[0];
        setPart(currentPart);

        // Find primary supplier
        const primarySupplier = suppliersData.find(s => s.id === currentPart.supplier_id);
        setSupplier(primarySupplier);

        // Find alternative suppliers
        const altSuppliers = (currentPart.alternative_suppliers || []).map(alt => ({
          ...alt,
          supplier: suppliersData.find(s => s.id === alt.supplier_id)
        }));
        setAlternativeSuppliers(altSuppliers);

        // Find raw materials
        const partMaterials = (currentPart.raw_materials || []).map(mat => ({
          ...mat,
          material: materialsData.find(m => m.id === mat.material_id)
        }));
        setRawMaterials(partMaterials);

        // Find replacement part
        if (currentPart.replacement_part_id) {
          const replacement = allPartsData.find(p => p.id === currentPart.replacement_part_id);
          setReplacementPart(replacement);
        }
      }
    } catch (error) {
      console.error("Error loading part details:", error);
    }
    setIsLoading(false);
  }, [partId]);

  useEffect(() => {
    loadPartData();
  }, [loadPartData]);

  if (isLoading) {
    return <div className="p-6">Loading part details...</div>;
  }

  if (!part) {
    return <div className="p-6">Part not found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Parts")}>
          <Button variant="ghost" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{part.name}</h1>
            {part.is_obsolete && (
              <Badge variant="destructive">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Obsolete
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Part # {part.part_number} • {part.category}
          </p>
        </div>
        <Link to={createPageUrl(`Parts?action=edit&id=${part.id}`)}>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Part
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Part Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Part Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {part.image_url && (
                <div className="w-full h-48 bg-muted/50 rounded-lg overflow-hidden">
                  <img
                    src={part.image_url}
                    alt={part.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{part.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock</p>
                  <p className="font-medium">{part.stock_quantity} units</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cost Price</p>
                  <p className="font-medium">${part.cost_price?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Selling Price</p>
                  <p className="font-medium">${part.selling_price?.toFixed(2)}</p>
                </div>
              </div>

              {part.cross_reference && (
                <div>
                  <p className="text-sm text-muted-foreground">Cross Reference</p>
                  <p className="font-medium">{part.cross_reference}</p>
                </div>
              )}

              {part.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{part.description}</p>
                </div>
              )}

              {/* Machine Compatibility */}
              {part.compatible_machines && part.compatible_machines.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Compatible Machines</p>
                  <div className="flex flex-wrap gap-2">
                    {part.compatible_machines.map((machine, index) => (
                      <Badge key={index} variant="secondary">
                        {machine.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw Materials */}
          {rawMaterials.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Raw Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rawMaterials.map((mat, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium">{mat.material_name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {mat.quantity}</p>
                      </div>
                      <p className="font-medium">${mat.total_cost?.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Replacement Part */}
          {part.is_obsolete && replacementPart && (
            <Card className="bg-card border-border border-orange-500/50">
              <CardHeader>
                <CardTitle className="text-orange-400">Replacement Part</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{replacementPart.name}</p>
                    <p className="text-sm text-muted-foreground">{replacementPart.part_number}</p>
                  </div>
                  <Link to={createPageUrl(`PartDetail?id=${replacementPart.id}`)}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Primary Supplier */}
          {supplier && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Primary Supplier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-foreground">{supplier.name}</p>
                  <p className="text-sm text-muted-foreground">{supplier.contact_person}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="text-sm">{supplier.email}</p>
                  {supplier.phone && <p className="text-sm">{supplier.phone}</p>}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lead Time</p>
                  <p className="text-sm">{part.lead_time_days} days</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alternative Suppliers */}
          {alternativeSuppliers.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Alternative Suppliers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alternativeSuppliers.map((alt, index) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg">
                    <p className="font-medium">{alt.supplier?.name}</p>
                    <p className="text-sm text-muted-foreground">Part #: {alt.supplier_part_number}</p>
                    <p className="text-sm">Cost: ${alt.cost_price?.toFixed(2)}</p>
                    <p className="text-sm">Lead Time: {alt.lead_time_days} days</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}