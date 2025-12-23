import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Truck, User, Mail, Phone, MapPin, Clock } from "lucide-react";

export default function SupplierCard({ supplier, onEdit }) {
  return (
    <Card className="bg-card border-border hover:border-primary/50 hover:shadow-lg transition-all duration-200 rounded-md cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-muted/50 rounded flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold text-foreground truncate">
                {supplier.name}
              </CardTitle>
              <div className="flex items-center gap-1 mt-1">
                <User className="w-3 h-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground truncate">{supplier.contact_person}</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(supplier);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground truncate">{supplier.email}</span>
          </div>
          
          {supplier.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{supplier.phone}</span>
            </div>
          )}
          
          {supplier.address && (supplier.address.city || supplier.address.state) && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground truncate">
                {[supplier.address.city, supplier.address.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {supplier.lead_time_days > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">
                {supplier.lead_time_days} days lead time
              </span>
            </div>
          )}
        </div>

        {supplier.payment_terms && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Payment Terms: <span className="font-medium text-foreground">{supplier.payment_terms}</span>
            </p>
          </div>
        )}

        {supplier.notes && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground line-clamp-2">{supplier.notes}</p>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Added {new Date(supplier.created_date).toLocaleDateString()}
          </span>
          {!supplier.is_active && (
            <Badge variant="destructive" className="text-xs">Inactive</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}