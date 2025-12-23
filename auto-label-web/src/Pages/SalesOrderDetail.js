import React, { useState, useEffect, useCallback } from "react";
import { SalesOrder, Customer, Machine, Part, SubAssembly } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, MapPin, Building2, User, Mail, Phone, FileText, DollarSign, Package, TrendingUp, ShoppingCart, Calendar, CheckCircle, Clock, Truck, Ban, RefreshCw, Save, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SalesOrderDetail() {
  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [shippingData, setShippingData] = useState({});

  const orderId = new URLSearchParams(window.location.search).get("id");

  const getStatusInfo = (status) => {
    const statuses = {
      pending_production: { color: "bg-orange-900/50 text-orange-300 border-orange-500/30", icon: Clock, label: "Pending Production" },
      in_production: { color: "bg-blue-900/50 text-blue-300 border-blue-500/30", icon: RefreshCw, label: "In Production" },
      shipped: { color: "bg-indigo-900/50 text-indigo-300 border-indigo-500/30", icon: Truck, label: "Shipped" },
      completed: { color: "bg-green-900/50 text-green-300 border-green-500/30", icon: CheckCircle, label: "Completed" },
      cancelled: { color: "bg-red-900/50 text-red-300 border-red-500/30", icon: Ban, label: "Cancelled" }
    };
    return statuses[status] || { color: "bg-slate-700 text-slate-300 border-slate-600", icon: Clock, label: status };
  };

  const loadOrderData = useCallback(async () => {
    if (!orderId) return;
    setIsLoading(true);
    try {
      const [orderData, customers, machines, parts, subAssemblies] = await Promise.all([
        SalesOrder.filter({ id: orderId }),
        Customer.list(),
        Machine.list(),
        Part.list(),
        SubAssembly.list()
      ]);

      if (orderData.length > 0) {
        const currentOrder = orderData[0];
        
        // Enhance items with details
        currentOrder.machines = (currentOrder.machines || []).map(m => ({ ...m, ...machines.find(i => i.id === m.machine_id) }));
        currentOrder.parts = (currentOrder.parts || []).map(p => ({ ...p, ...parts.find(i => i.id === p.part_id) }));
        currentOrder.sub_assemblies = (currentOrder.sub_assemblies || []).map(sa => ({ ...sa, ...subAssemblies.find(i => i.id === sa.sub_assembly_id) }));
        
        setOrder(currentOrder);
        setCustomer(customers.find(c => c.id === currentOrder.customer_id));
        
        // Initialize shipping data
        setShippingData({
          expected_ship_date: currentOrder.expected_ship_date || "",
          actual_ship_date: currentOrder.actual_ship_date || "",
          requested_delivery_date: currentOrder.requested_delivery_date || "",
          shipping_method: currentOrder.shipping_method || "ground",
          tracking_number: currentOrder.tracking_number || "",
          shipping_cost: currentOrder.shipping_cost || 0,
          delivery_instructions: currentOrder.delivery_instructions || "",
          shipping_address: currentOrder.shipping_address || {
            street: "",
            city: "",
            state: "",
            zip: "",
            country: "USA",
            contact_person: "",
            phone: ""
          }
        });
      }
    } catch (error) {
      console.error("Error loading sales order details:", error);
      toast.error("Failed to load order details.");
    }
    setIsLoading(false);
  }, [orderId]);

  useEffect(() => {
    loadOrderData();
  }, [loadOrderData]);

  const handleStatusChange = async (newStatus) => {
    if (!order) return;
    try {
      await SalesOrder.update(order.id, { status: newStatus });
      toast.success(`Order status updated to "${newStatus.replace(/_/g, ' ')}".`);
      loadOrderData(); // Refresh data
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update order status.");
    }
  };

  const handleSaveShipping = async () => {
    if (!order) return;
    try {
      await SalesOrder.update(order.id, shippingData);
      toast.success("Shipping information updated successfully.");
      setIsEditingShipping(false);
      loadOrderData(); // Refresh data
    } catch (error) {
      console.error("Error updating shipping info:", error);
      toast.error("Failed to update shipping information.");
    }
  };

  const handleCancelShippingEdit = () => {
    // Reset shipping data to current order values
    setShippingData({
      expected_ship_date: order.expected_ship_date || "",
      actual_ship_date: order.actual_ship_date || "",
      requested_delivery_date: order.requested_delivery_date || "",
      shipping_method: order.shipping_method || "ground",
      tracking_number: order.tracking_number || "",
      shipping_cost: order.shipping_cost || 0,
      delivery_instructions: order.delivery_instructions || "",
      shipping_address: order.shipping_address || {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "USA",
        contact_person: "",
        phone: ""
      }
    });
    setIsEditingShipping(false);
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading order details...</div>;
  }

  if (!order) {
    return <div className="p-6 text-center">Sales Order not found.</div>;
  }

  const orderStatusInfo = getStatusInfo(order.status);
  const StatusIcon = orderStatusInfo.icon;
  const orderStatuses = ["pending_production", "in_production", "shipped", "completed", "cancelled"];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("SalesOrders")}>
            <Button variant="ghost" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">
                Sales Order {order.sales_order_number}
              </h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className={`text-xs h-auto px-3 py-1.5 border ${orderStatusInfo.color}`}>
                    <StatusIcon className="w-3 h-3 mr-2" />
                    {orderStatusInfo.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {orderStatuses.map((status) => (
                    <DropdownMenuItem 
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={order.status === status}
                      className="capitalize"
                    >
                      {status.replace(/_/g, ' ')}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-muted-foreground mt-1">
              From Quote <Link to={createPageUrl(`Quotes?action=edit&id=${order.quote_id}`)} className="text-primary hover:underline">{order.quote_number}</Link>
              &nbsp;&bull;&nbsp;
              Ordered on {format(new Date(order.order_date), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border rounded-md">
            <CardHeader>
              <CardTitle>Ordered Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.machines.map(item => (
                  <div key={item.machine_id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="font-semibold">{item.name || "Machine"}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">${(item.total_price || 0).toFixed(2)}</p>
                  </div>
                ))}
                {order.parts.map(item => (
                  <div key={item.part_id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="font-semibold">{item.name || "Part"}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">${(item.total_price || 0).toFixed(2)}</p>
                  </div>
                ))}
                {order.sub_assemblies.map(item => (
                  <div key={item.sub_assembly_id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="font-semibold">{item.name || "Sub-Assembly"}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">${(item.total_price || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {customer && (
            <Card className="bg-card border-border rounded-md">
              <CardHeader>
                <CardTitle>Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-lg">{customer.company_name}</p>
                <p className="text-muted-foreground">{customer.contact_person}</p>
                <p className="text-muted-foreground">{customer.email}</p>
                <Link to={createPageUrl(`CustomerDetail?id=${customer.id}`)}>
                  <Button variant="link" className="p-0 h-auto mt-2">View Customer Details</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card border-border rounded-md">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span>Subtotal</span><span>${(order.subtotal || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span className="text-green-500">-${(order.discount_amount || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>${(order.tax_amount || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>${(order.shipping_cost || 0).toFixed(2)}</span></div>
              <div className="border-t my-2"></div>
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>${((order.total_amount || 0) + (order.shipping_cost || 0)).toFixed(2)}</span></div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border rounded-md">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping & Delivery
              </CardTitle>
              {!isEditingShipping && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditingShipping(true)}>
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditingShipping ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Expected Ship Date</Label>
                      <Input
                        type="date"
                        value={shippingData.expected_ship_date}
                        onChange={(e) => setShippingData(prev => ({ ...prev, expected_ship_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Requested Delivery Date</Label>
                      <Input
                        type="date"
                        value={shippingData.requested_delivery_date}
                        onChange={(e) => setShippingData(prev => ({ ...prev, requested_delivery_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Shipping Method</Label>
                      <Select
                        value={shippingData.shipping_method}
                        onValueChange={(value) => setShippingData(prev => ({ ...prev, shipping_method: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ground">Ground Shipping</SelectItem>
                          <SelectItem value="air">Air Shipping</SelectItem>
                          <SelectItem value="freight">Freight</SelectItem>
                          <SelectItem value="pickup">Customer Pickup</SelectItem>
                          <SelectItem value="delivery">Direct Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Shipping Cost</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={shippingData.shipping_cost}
                        onChange={(e) => setShippingData(prev => ({ ...prev, shipping_cost: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Tracking Number</Label>
                    <Input
                      value={shippingData.tracking_number}
                      onChange={(e) => setShippingData(prev => ({ ...prev, tracking_number: e.target.value }))}
                      placeholder="Enter tracking number"
                    />
                  </div>

                  {order.status === "shipped" && (
                    <div>
                      <Label>Actual Ship Date</Label>
                      <Input
                        type="date"
                        value={shippingData.actual_ship_date}
                        onChange={(e) => setShippingData(prev => ({ ...prev, actual_ship_date: e.target.value }))}
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label>Shipping Address</Label>
                    <div className="space-y-2 p-3 border rounded-md bg-muted/30">
                      <Input
                        placeholder="Contact Person"
                        value={shippingData.shipping_address.contact_person}
                        onChange={(e) => setShippingData(prev => ({
                          ...prev,
                          shipping_address: { ...prev.shipping_address, contact_person: e.target.value }
                        }))}
                      />
                      <Input
                        placeholder="Street Address"
                        value={shippingData.shipping_address.street}
                        onChange={(e) => setShippingData(prev => ({
                          ...prev,
                          shipping_address: { ...prev.shipping_address, street: e.target.value }
                        }))}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="City"
                          value={shippingData.shipping_address.city}
                          onChange={(e) => setShippingData(prev => ({
                            ...prev,
                            shipping_address: { ...prev.shipping_address, city: e.target.value }
                          }))}
                        />
                        <Input
                          placeholder="State"
                          value={shippingData.shipping_address.state}
                          onChange={(e) => setShippingData(prev => ({
                            ...prev,
                            shipping_address: { ...prev.shipping_address, state: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="ZIP"
                          value={shippingData.shipping_address.zip}
                          onChange={(e) => setShippingData(prev => ({
                            ...prev,
                            shipping_address: { ...prev.shipping_address, zip: e.target.value }
                          }))}
                        />
                        <Input
                          placeholder="Phone"
                          value={shippingData.shipping_address.phone}
                          onChange={(e) => setShippingData(prev => ({
                            ...prev,
                            shipping_address: { ...prev.shipping_address, phone: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Delivery Instructions</Label>
                    <Textarea
                      value={shippingData.delivery_instructions}
                      onChange={(e) => setShippingData(prev => ({ ...prev, delivery_instructions: e.target.value }))}
                      placeholder="Special delivery instructions..."
                      className="h-20"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveShipping} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={handleCancelShippingEdit} className="flex-1">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {order.expected_ship_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Expected Ship Date</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(order.expected_ship_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  )}

                  {order.actual_ship_date && (
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Actual Ship Date</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(order.actual_ship_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  )}

                  {order.requested_delivery_date && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Requested Delivery</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(order.requested_delivery_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  )}

                  {order.shipping_method && (
                    <div>
                      <p className="text-sm font-medium">Shipping Method</p>
                      <p className="text-sm text-muted-foreground capitalize">{order.shipping_method.replace(/_/g, ' ')}</p>
                    </div>
                  )}

                  {order.tracking_number && (
                    <div>
                      <p className="text-sm font-medium">Tracking Number</p>
                      <p className="text-sm text-muted-foreground font-mono">{order.tracking_number}</p>
                    </div>
                  )}

                  {order.shipping_address && (order.shipping_address.street || order.shipping_address.city) && (
                    <div>
                      <p className="text-sm font-medium">Shipping Address</p>
                      <div className="text-sm text-muted-foreground">
                        {order.shipping_address.contact_person && <p>{order.shipping_address.contact_person}</p>}
                        {order.shipping_address.street && <p>{order.shipping_address.street}</p>}
                        <p>
                          {[order.shipping_address.city, order.shipping_address.state, order.shipping_address.zip]
                            .filter(Boolean).join(', ')}
                        </p>
                        {order.shipping_address.phone && <p>{order.shipping_address.phone}</p>}
                      </div>
                    </div>
                  )}

                  {order.delivery_instructions && (
                    <div>
                      <p className="text-sm font-medium">Delivery Instructions</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.delivery_instructions}</p>
                    </div>
                  )}

                  {!order.expected_ship_date && !order.shipping_method && !order.tracking_number && (
                    <p className="text-sm text-muted-foreground">No shipping information set yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}