import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Building2, User, Mail, Phone, MapPin, Percent } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CustomerCard({ customer, onEdit }) {
  const getIndustryColor = (industry) => {
    const colors = {
      manufacturing: "bg-cyan-900/50 text-cyan-300 border-cyan-500/30",
      automotive: "bg-green-900/50 text-green-300 border-green-500/30",
      aerospace: "bg-purple-900/50 text-purple-300 border-purple-500/30",
      construction: "bg-orange-900/50 text-orange-300 border-orange-500/30",
      energy: "bg-red-900/50 text-red-300 border-red-500/30",
      other: "bg-slate-700 text-slate-300 border-slate-600"
    };
    return colors[industry] || colors.other;
  };

  const primaryLocation = customer.locations?.find(loc => loc.is_primary) || customer.locations?.[0];

  return (
    <Link to={createPageUrl(`CustomerDetail?id=${customer.id}`)} className="block">
      <Card className="bg-card border-border hover:border-primary/50 hover:shadow-lg transition-all duration-200 rounded-md cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-muted/50 rounded flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg font-semibold text-foreground truncate">
                  {customer.company_name}
                </CardTitle>
                <div className="flex items-center gap-1 mt-1">
                  <User className="w-3 h-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground truncate">{customer.contact_person}</p>
                </div>
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(customer);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={`text-xs ${getIndustryColor(customer.industry)}`}>
              {customer.industry?.toUpperCase() || 'OTHER'}
            </Badge>
            {customer.discount_rate > 0 && (
              <div className="flex items-center gap-1 text-green-400">
                <Percent className="w-3 h-3" />
                <span className="text-xs font-medium">{customer.discount_rate}% discount</span>
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground truncate">{customer.email}</span>
            </div>
            
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{customer.phone}</span>
              </div>
            )}
            
            {primaryLocation && (primaryLocation.address?.city || primaryLocation.address?.state) && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground truncate">
                  {[primaryLocation.address.city, primaryLocation.address.state].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

            {customer.locations && customer.locations.length > 1 && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  {customer.locations.length} locations
                </span>
              </div>
            )}
          </div>

          {customer.notes && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground line-clamp-2">{customer.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Added {new Date(customer.created_date).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}