import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Box, Truck, Package, DollarSign } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function RawMaterialCard({ material, supplier, onEdit, onDelete }) {
  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground truncate">{material.name}</CardTitle>
            <p className="text-sm text-muted-foreground font-mono">{material.material_id}</p>
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => onEdit(material)} className="h-8 w-8 shrink-0">
              <Edit className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 h-8 w-8 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the material: <span className="font-bold">{material.name}</span>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(material.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{material.material_type}</Badge>
          <Badge variant="outline">{material.form}</Badge>
        </div>
        <div className="text-sm space-y-2">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Specifications:</span>
                <span className="font-medium text-foreground truncate">{material.specifications}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Cost:</span>
                <span className={`font-medium ${(material.cost_per_unit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${material.cost_per_unit?.toFixed(2)} / {material.unit_of_measure}
                </span>
            </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Stock:</span>
                <span className="font-medium text-foreground">{material.stock_quantity} {material.unit_of_measure}</span>
            </div>
        </div>
        {supplier && (
           <div className="flex items-center gap-2 pt-2 border-t border-border">
             <Truck className="w-4 h-4 text-muted-foreground" />
             <p className="text-xs text-muted-foreground">Supplied by: {supplier.name}</p>
           </div>
        )}
        {material.notes && <p className="text-xs text-muted-foreground pt-2 border-t border-border line-clamp-2">Notes: {material.notes}</p>}
      </CardContent>
    </Card>
  );
}