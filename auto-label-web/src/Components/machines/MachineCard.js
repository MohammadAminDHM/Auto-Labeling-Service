
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, DollarSign, Wrench, Package, ArrowRight, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MachineCard({ machine, onEdit }) {
  const getCategoryColor = (category) => {
    const colors = {
      cnc: "bg-cyan-900/50 text-cyan-300 border-cyan-500/30",
      lathe: "bg-green-900/50 text-green-300 border-green-500/30",
      mill: "bg-purple-900/50 text-purple-300 border-purple-500/30",
      press: "bg-red-900/50 text-red-300 border-red-500/30",
      grinder: "bg-orange-900/50 text-orange-300 border-orange-500/30",
      drill: "bg-yellow-900/50 text-yellow-300 border-yellow-500/30",
      saw: "bg-pink-900/50 text-pink-300 border-pink-500/30",
      welding: "bg-indigo-900/50 text-indigo-300 border-indigo-500/30",
      other: "bg-slate-700 text-slate-300 border-slate-600"
    };
    return colors[category] || colors.other;
  };

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all duration-200 flex flex-col">
      <Link to={createPageUrl(`MachineDetail?id=${machine.id}`)} className="flex-grow">
        {machine.image_url && (
          <div className="h-48 bg-muted/50 rounded-t-lg overflow-hidden">
            <img
              src={machine.image_url}
              alt={machine.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-foreground truncate">
                {machine.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground truncate">{machine.manufacturer}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={`text-xs ${getCategoryColor(machine.category)}`}>
              {machine.category?.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-1 text-foreground">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-sm">View Details for Price</span>
            </div>
          </div>

          {machine.description && (
            <div>
              <p className="text-xs text-muted-foreground line-clamp-2">{machine.description}</p>
            </div>
          )}
        </CardContent>
      </Link>
      <div className="px-6 pb-4 mt-auto">
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(machine)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Edit className="w-4 h-4 mr-2" />
            Quick Edit
          </Button>
          <Link to={createPageUrl(`MachineDetail?id=${machine.id}`)}>
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
