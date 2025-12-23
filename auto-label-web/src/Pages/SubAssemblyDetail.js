import React, { useState, useEffect, useCallback } from "react";
import { SubAssembly, Part, RawMaterial, Supplier, AppSetup } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Plus, Trash2, Layers, Wrench, Box, Clock, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SubAssemblyDetail() {
  const [subAssembly, setSubAssembly] = useState(null);
  const [allParts, setAllParts] = useState([]);
  const [allRawMaterials, setAllRawMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const subAssemblyId = new URLSearchParams(window.location.search).get("id");

  const loadSubAssemblyData = useCallback(async () => {
    if (!subAssemblyId) return;
    setIsLoading(true);
    try {
      const [subAssemblyData, partsData, rawMaterialsData, suppliersData] = await Promise.all([
        SubAssembly.filter({ id: subAssemblyId }),
        Part.list(),
        RawMaterial.list(),
        Supplier.list()
      ]);

      if (subAssemblyData.length > 0) {
        setSubAssembly(subAssemblyData[0]);
      }
      setAllParts(partsData);
      setAllRawMaterials(rawMaterialsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error loading sub-assembly data:", error);
    }
    setIsLoading(false);
  }, [subAssemblyId]);

  useEffect(() => {
    loadSubAssemblyData();
  }, [loadSubAssemblyData]);

  if (isLoading) {
    return <div className="p-6">Loading sub-assembly details...</div>;
  }

  if (!subAssembly) {
    return <div className="p-6">Sub-assembly not found.</div>;
  }

  const totalPartsCount = subAssembly.parts?.length || 0;
  const totalMaterialsCount = subAssembly.raw_materials?.length || 0;
  const totalLaborHours = (subAssembly.labor_entries || []).reduce((sum, entry) => sum + (entry.hours || 0), 0);
  const supplier = suppliers.find(s => s.id === subAssembly.supplier_id);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("SubAssemblies")}>
          <Button variant="ghost" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{subAssembly.name}</h1>
          <p className="text-muted-foreground mt-1">
            Assembly #{subAssembly.assembly_number} • Category: {subAssembly.category}
          </p>
        </div>
        <Link to={createPageUrl(`SubAssemblies?action=edit&id=${subAssembly.id}`)}>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Assembly
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assembly Info */}
          <Card className="bg-card border-border">
            <CardHeader><CardTitle>Assembly Information</CardTitle></CardHeader>
            <CardContent>
              {subAssembly.image_url && (
                <div className="mb-4 h-64 bg-muted/50 rounded-md overflow-hidden">
                  <img src={subAssembly.image_url} alt={subAssembly.name} className="w-full h-full object-cover" />
                </div>
              )}
              <p className="text-muted-foreground">{subAssembly.description}</p>
              {supplier && (
                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm font-medium">Supplied by: {supplier.name}</p>
                  <p className="text-xs text-muted-foreground">Contact: {supplier.contact_person}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parts List */}
          {subAssembly.parts && subAssembly.parts.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5"/> Parts ({totalPartsCount})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subAssembly.parts.map((part, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border border-border rounded-md">
                      <Wrench className="w-4 h-4 text-teal-500" />
                      <div className="flex-1">
                        <p className="font-medium">{part.part_name}</p>
                        <p className="text-xs text-muted-foreground">{part.part_number}</p>
                      </div>
                      <p className="w-20 text-center">Qty: {part.quantity}</p>
                      <p className="w-24 text-right">${(part.total_cost || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Raw Materials List */}
          {subAssembly.raw_materials && subAssembly.raw_materials.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="flex items-center gap-2"><Box className="w-5 h-5"/> Raw Materials ({totalMaterialsCount})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subAssembly.raw_materials.map((material, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border border-border rounded-md">
                      <Box className="w-4 h-4 text-amber-500" />
                      <div className="flex-1">
                        <p className="font-medium">{material.material_name}</p>
                      </div>
                      <p className="w-20 text-center">Qty: {material.quantity}</p>
                      <p className="w-24 text-right">${(material.total_cost || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Labor Operations */}
          {subAssembly.labor_entries && subAssembly.labor_entries.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5"/> Labor Operations</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subAssembly.labor_entries.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border border-border rounded-md">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium">{entry.operation}</p>
                      </div>
                      <p className="w-20 text-center">{entry.hours}h</p>
                      <p className="w-24 text-right">${((entry.hours || 0) * (entry.rate || 0)).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Assembly Stats */}
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5"/> Assembly Stats</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span>Parts Count</span><span className="font-bold">{totalPartsCount}</span></div>
              <div className="flex justify-between"><span>Materials Count</span><span className="font-bold">{totalMaterialsCount}</span></div>
              <div className="flex justify-between"><span>Total Labor Time</span><span className="font-bold">{totalLaborHours}h</span></div>
              <div className="border-t pt-3 mt-3 flex justify-between text-lg">
                <span className="font-semibold">Assembly Time</span>
                <span className="font-bold text-primary">{subAssembly.assembly_time_minutes || Math.ceil(totalLaborHours * 60)} min</span>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5"/> Cost & Price</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span>Parts Cost</span><span>${(subAssembly.total_parts_cost || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Materials Cost</span><span>${(subAssembly.total_materials_cost || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Labor Cost</span><span>${(subAssembly.total_labor_cost || 0).toFixed(2)}</span></div>
              <div className="border-t pt-3 mt-3 flex justify-between font-bold">
                <span>Total Cost</span>
                <span>${(subAssembly.total_cost || 0).toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 mt-3 flex justify-between text-lg">
                <span className="font-semibold">Selling Price</span>
                <span className="font-bold text-primary">${(subAssembly.selling_price || 0).toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2">Based on {subAssembly.markup_percent || 0}% markup</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}