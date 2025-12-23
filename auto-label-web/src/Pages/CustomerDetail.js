
import React, { useState, useEffect, useCallback } from "react";
import { Customer, Quote, Machine, Part, SubAssembly, SalesOrder } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, MapPin, Building2, User, Mail, Phone, FileText, DollarSign, Package, TrendingUp, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function CustomerDetail() {
  const [customer, setCustomer] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [locationStats, setLocationStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const customerId = new URLSearchParams(window.location.search).get("id");

  const loadCustomerData = useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    try {
      const [customerData, quotesData, salesOrdersData, machinesData, partsData, subAssembliesData] = await Promise.all([
        Customer.filter({ id: customerId }),
        Quote.filter({ customer_id: customerId }),
        SalesOrder.filter({ customer_id: customerId }),
        Machine.list(),
        Part.list(),
        SubAssembly.list()
      ]);

      if (customerData.length > 0) {
        const currentCustomer = customerData[0];
        setCustomer(currentCustomer);
        setSalesOrders(salesOrdersData);

        // Enhance quotes with item details
        const enhancedQuotes = quotesData.map(quote => {
          const location = currentCustomer.locations?.find(loc => loc.location_id === quote.location_id);
          return {
            ...quote,
            location: location || currentCustomer.locations?.[0], // Fallback to first location
            machines: quote.machines?.map(m => ({
              ...m,
              machine: machinesData.find(machine => machine.id === m.machine_id)
            })) || [],
            parts: quote.parts?.map(p => ({
              ...p,
              part: partsData.find(part => part.id === p.part_id)
            })) || [],
            sub_assemblies: quote.sub_assemblies?.map(sa => ({
              ...sa,
              sub_assembly: subAssembliesData.find(assembly => assembly.id === sa.sub_assembly_id)
            })) || []
          };
        });
        setQuotes(enhancedQuotes);

        // Calculate location statistics
        const stats = {};
        currentCustomer.locations?.forEach(location => {
          const locationQuotes = enhancedQuotes.filter(q => q.location_id === location.location_id);
          const acceptedQuotes = locationQuotes.filter(q => q.status === 'accepted');
          
          stats[location.location_id] = {
            totalQuotes: locationQuotes.length,
            acceptedQuotes: acceptedQuotes.length,
            totalValue: acceptedQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0),
            recentQuotes: locationQuotes.slice(0, 3)
          };
        });
        setLocationStats(stats);
      }
    } catch (error) {
      console.error("Error loading customer details:", error);
    }
    setIsLoading(false);
  }, [customerId]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  if (isLoading) {
    return <div className="p-6">Loading customer details...</div>;
  }

  if (!customer) {
    return <div className="p-6">Customer not found.</div>;
  }

  const primaryLocation = customer.locations?.find(loc => loc.is_primary) || customer.locations?.[0];
  const totalQuotes = quotes.length;
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
  const totalValue = quotes.filter(q => q.status === 'accepted').reduce((sum, q) => sum + (q.total_amount || 0), 0);

  const getSalesOrderStatusInfo = (status) => {
    const statuses = {
      pending_production: { color: "text-orange-600 border-orange-500/50" },
      in_production: { color: "text-blue-600 border-blue-500/50" },
      shipped: { color: "text-indigo-600 border-indigo-500/50" },
      completed: { color: "text-green-600 border-green-500/50" },
      cancelled: { color: "text-red-600 border-red-500/50" }
    };
    return statuses[status] || { color: "text-gray-600 border-gray-500/50" };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Customers")}>
          <Button variant="ghost" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{customer.company_name}</h1>
          <p className="text-muted-foreground mt-1">
            {customer.industry} • {customer.locations?.length || 0} location{customer.locations?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to={createPageUrl(`Customers?action=edit&id=${customer.id}`)}>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Customer
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border rounded-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Quotes</p>
                    <p className="text-2xl font-bold text-foreground">{totalQuotes}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border rounded-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Sales Orders</p>
                    <p className="text-2xl font-bold text-foreground">{salesOrders.length}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border rounded-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Accepted</p>
                    <p className="text-2xl font-bold text-green-600">{acceptedQuotes}</p>
                  </div>
                  <Package className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border rounded-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold text-foreground">${totalValue.toFixed(0)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Location Performance */}
          <Card className="bg-card border-border rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Location Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer.locations?.map((location) => {
                const stats = locationStats[location.location_id] || {};
                return (
                  <div key={location.location_id} className="p-4 border border-border rounded-md bg-muted/30">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{location.location_name}</h4>
                          {location.is_primary && (
                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {[location.address?.city, location.address?.state].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${(stats.totalValue || 0).toFixed(0)}</p>
                        <p className="text-sm text-muted-foreground">
                          {stats.acceptedQuotes || 0}/{stats.totalQuotes || 0} quotes
                        </p>
                      </div>
                    </div>

                    {stats.recentQuotes?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Recent Quotes:</p>
                        <div className="space-y-1">
                          {stats.recentQuotes.map((quote) => (
                            <div key={quote.id} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <Link to={createPageUrl(`Quotes?id=${quote.id}`)} className="text-primary hover:underline">
                                  {quote.quote_number}
                                </Link>
                                <Badge variant="outline" className={`text-xs ${quote.status === 'accepted' ? 'text-green-600' : ''}`}>
                                  {quote.status}
                                </Badge>
                              </span>
                              <span className="font-medium">${(quote.total_amount || 0).toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Quotes */}
          <Card className="bg-card border-border rounded-md">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Recent Quotes</CardTitle>
              <Link to={createPageUrl(`Quotes?customer=${customer.id}`)}>
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {quotes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No quotes found for this customer</p>
              ) : (
                <div className="space-y-3">
                  {quotes.slice(0, 5).map((quote) => (
                    <div key={quote.id} className="flex items-center justify-between p-3 border border-border rounded bg-muted/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Link to={createPageUrl(`Quotes?id=${quote.id}`)} className="font-medium text-primary hover:underline">
                            {quote.quote_number}
                          </Link>
                          <Badge variant="outline" className={`text-xs ${quote.status === 'accepted' ? 'text-green-600' : ''}`}>
                            {quote.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{quote.location?.location_name || 'Unknown Location'}</span>
                          <span>{format(new Date(quote.created_date), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${(quote.total_amount || 0).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {(quote.machines?.length || 0) + (quote.parts?.length || 0) + (quote.sub_assemblies?.length || 0)} items
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sales Orders */}
          <Card className="bg-card border-border rounded-md">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Recent Sales Orders</CardTitle>
              <Link to={createPageUrl(`SalesOrders?customer=${customer.id}`)}>
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {salesOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No sales orders found for this customer</p>
              ) : (
                <div className="space-y-3">
                  {salesOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border border-border rounded bg-muted/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Link to={createPageUrl(`SalesOrders?id=${order.id}`)} className="font-medium text-primary hover:underline">
                            {order.sales_order_number}
                          </Link>
                          <Badge variant="outline" className={`text-xs capitalize ${getSalesOrderStatusInfo(order.status).color}`}>
                            {order.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Quote: {order.quote_number}</span>
                          <span>{format(new Date(order.order_date), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${(order.total_amount || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="bg-card border-border rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{customer.contact_person}</p>
                  <p className="text-sm text-muted-foreground">Primary Contact</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                  {customer.email}
                </a>
              </div>

              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                    {customer.phone}
                  </a>
                </div>
              )}

              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground">Industry</p>
                <p className="font-medium capitalize">{customer.industry}</p>
              </div>

              {customer.discount_rate > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Default Discount</p>
                  <p className="font-medium text-green-600">{customer.discount_rate}%</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Primary Location */}
          {primaryLocation && (
            <Card className="bg-card border-border rounded-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Primary Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{primaryLocation.location_name}</p>
                  {primaryLocation.contact_person && (
                    <p className="text-sm text-muted-foreground">{primaryLocation.contact_person}</p>
                  )}
                </div>

                {(primaryLocation.address?.street || primaryLocation.address?.city) && (
                  <div className="text-sm">
                    {primaryLocation.address.street && <p>{primaryLocation.address.street}</p>}
                    <p>
                      {[primaryLocation.address.city, primaryLocation.address.state, primaryLocation.address.zip]
                        .filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                {primaryLocation.email && (
                  <a href={`mailto:${primaryLocation.email}`} className="text-sm text-primary hover:underline block">
                    {primaryLocation.email}
                  </a>
                )}

                {primaryLocation.phone && (
                  <a href={`tel:${primaryLocation.phone}`} className="text-sm text-primary hover:underline block">
                    {primaryLocation.phone}
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {customer.notes && (
            <Card className="bg-card border-border rounded-md">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
