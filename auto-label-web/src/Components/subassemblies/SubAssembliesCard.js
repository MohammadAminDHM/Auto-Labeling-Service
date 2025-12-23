import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, DollarSign, Layers, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SubAssemblyCard({ subAssembly, supplier, onEdit, onDelete }) {
  const getCategoryColor = (category) => {
    const colors = {
      control: "bg-blue-900/50 text-blue-300 border-blue-500/30",
      pneumatic: "bg-purple-900/50 text-purple-300 border-purple-500/30",
      hydraulic: "bg-cyan-900/50 text-cyan-300 border-cyan-500/30",
      mechanical: "bg-green-900/50 text-green-300 border-green-500/30",
      electrical: "bg-yellow-900/50 text-yellow-300 border-yellow-500/30",
      other: "bg-slate-700 text-slate-300 border-slate-600"
    };
    return colors[category] || colors.other;
  };

  const partsCount = subAssembly.parts?.length || 0;
  const materialsCount = subAssembly.raw_materials?.length || 0;
  const totalLaborHours = (subAssembly.labor_entries || []).reduce((sum, entry) => sum + (entry.hours || 0), 0);

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all duration-200 flex flex-col">
      <Link to={createPageUrl(`SubAssemblyDetail?id=${subAssembly.id}`)} className="flex-grow">
        {subAssembly.image_url && (
          <div className="h-48 bg-muted/50 rounded-t-lg overflow-hidden">
            <img
              src={subAssembly.image_url}
              alt={subAssembly.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-foreground truncate">
                {subAssembly.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground truncate">{subAssembly.assembly_number}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={`text-xs ${getCategoryColor(subAssembly.category)}`}>
              {subAssembly.category?.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className={`font-semibold text-sm ${(subAssembly.selling_price || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${(subAssembly.selling_price || 0).toFixed(0)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <p className="text-muted-foreground">Parts</p>
              <p className="font-semibold text-foreground">{partsCount}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Materials</p>
              <p className="font-semibold text-foreground">{materialsCount}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Labor</p>
              <p className="font-semibold text-foreground">{totalLaborHours}h</p>
            </div>
          </div>

          {(subAssembly.total_cost !== undefined || subAssembly.total_parts_cost !== undefined) && (
            <div className="space-y-1 text-xs">
              {subAssembly.total_parts_cost !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parts Cost:</span>
                  <span className={`font-medium ${(subAssembly.total_parts_cost || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${(subAssembly.total_parts_cost || 0).toFixed(2)}
                  </span>
                </div>
              )}
              {subAssembly.total_materials_cost !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Materials Cost:</span>
                  <span className={`font-medium ${(subAssembly.total_materials_cost || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${(subAssembly.total_materials_cost || 0).toFixed(2)}
                  </span>
                </div>
              )}
              {subAssembly.total_labor_cost !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Labor Cost:</span>
                  <span className={`font-medium ${(subAssembly.total_labor_cost || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${(subAssembly.total_labor_cost || 0).toFixed(2)}
                  </span>
                </div>
              )}
              {subAssembly.total_cost !== undefined && (
                <div className="flex justify-between pt-1 border-t border-border">
                  <span className="text-muted-foreground font-semibold">Total Cost:</span>
                  <span className={`font-bold ${(subAssembly.total_cost || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${(subAssembly.total_cost || 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {subAssembly.description && (
            <div>
              <p className="text-xs text-muted-foreground line-clamp-2">{subAssembly.description}</p>
            </div>
          )}
        </CardContent>
      </Link>
      <div className="px-6 pb-4 mt-auto">
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onEdit(subAssembly);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <Edit className="w-4 h-4 mr-2" />
            Quick Edit
          </Button>
          <Link to={createPageUrl(`SubAssemblyDetail?id=${subAssembly.id}`)}>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
            >
              View Details
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}