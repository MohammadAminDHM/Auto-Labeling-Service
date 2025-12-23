import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Truck, AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
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

export default function PartCard({ part, supplier, onEdit, onDelete }) {
  const getCategoryColor = (category) => {
    const colors = {
      motor: "bg-cyan-900/50 text-cyan-300 border-cyan-500/30",
      bearing: "bg-green-900/50 text-green-300 border-green-500/30",
      belt: "bg-purple-900/50 text-purple-300 border-purple-500/30",
      hydraulic: "bg-red-900/50 text-red-300 border-red-500/30",
      electrical: "bg-yellow-900/50 text-yellow-300 border-yellow-500/30",
      cutting_tool: "bg-orange-900/50 text-orange-300 border-orange-500/30",
      safety: "bg-pink-900/50 text-pink-300 border-pink-500/30",
      accessory: "bg-indigo-900/50 text-indigo-300 border-indigo-500/30",
      other: "bg-slate-700 text-slate-300 border-slate-600"
    };
    return colors[category] || colors.other;
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { color: "text-red-400", icon: AlertTriangle, text: "Out of Stock" };
    if (quantity <= 5) return { color: "text-orange-400", icon: AlertTriangle, text: "Low Stock" };
    return { color: "text-green-400", icon: CheckCircle, text: "In Stock" };
  };

  const stockStatus = getStockStatus(part.stock_quantity);
  const marginPercent = part.cost_price > 0 ? ((part.selling_price - part.cost_price) / part.cost_price * 100).toFixed(1) : 0;

  return (
    <Link to={createPageUrl(`PartDetail?id=${part.id}`)} className="block">
      <Card className="bg-card border-border hover:border-primary/50 transition-all duration-200 flex flex-col cursor-pointer">
        {part.image_url && (
          <div className="h-40 bg-muted/50 rounded-t-lg overflow-hidden">
            <img
              src={part.image_url}
              alt={part.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-grow flex flex-col p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate" title={part.name}>
                {part.name}
              </h3>
              <p className="text-sm text-muted-foreground font-mono">{part.part_number}</p>
            </div>
            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(part);
                }}
                className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => e.preventDefault()}
                    className="text-destructive hover:text-destructive/80 h-8 w-8 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the part
                      <span className="font-bold"> {part.name}</span>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={(e) => {
                      e.preventDefault();
                      onDelete(part.id);
                    }}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {supplier && (
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground truncate">{supplier.name}</p>
            </div>
          )}
        
          <div className="flex items-center justify-between mb-3">
            <Badge variant="outline" className={`text-xs ${getCategoryColor(part.category)}`}>
              {part.category?.replace(/_/g, ' ').toUpperCase()}
            </Badge>
            <div className="flex items-center gap-1.5">
              <stockStatus.icon className={`w-4 h-4 ${stockStatus.color}`} />
              <span className={`text-xs font-medium ${stockStatus.color}`}>
                {part.stock_quantity} units
              </span>
            </div>
          </div>

          <div className="space-y-1 text-sm mb-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cost:</span>
              <span className={`font-medium ${(part.cost_price || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${part.cost_price?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Price:</span>
              <div className="flex items-center gap-1">
                <span className={`font-bold ${(part.selling_price || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${part.selling_price?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
            <span className={`text-xs font-medium ${marginPercent > 50 ? 'text-green-400' : marginPercent > 25 ? 'text-orange-400' : 'text-red-400'}`}>
              {marginPercent}% Margin
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}