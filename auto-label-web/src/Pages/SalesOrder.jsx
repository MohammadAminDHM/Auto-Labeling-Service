import React, { useState, useEffect } from "react";
import { SalesOrder, Customer } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SalesOrderCard from "../components/sales_orders/SalesOrderCard";
import { toast } from "sonner";

export default function SalesOrders() {
  const [salesOrders, setSalesOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordersData, customersData] = await Promise.all([
        SalesOrder.list('-created_date'),
        Customer.list()
      ]);

      const enhancedOrders = ordersData.map(order => ({
        ...order,
        customer: customersData.find(c => c.id === order.customer_id)
      }));

      setSalesOrders(enhancedOrders);
    } catch (error) {
      console.error("Error loading sales orders:", error);
    }
    setIsLoading(false);
  };
  
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await SalesOrder.update(orderId, { status: newStatus });
      toast.success(`Sales Order status updated to "${newStatus}".`);
      loadData();
    } catch (error) {
      console.error("Error updating sales order status:", error);
      toast.error("Failed to update status.");
    }
  };

  const filteredOrders = salesOrders.filter(order => {
    const matchesSearch = order.sales_order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ["all", "pending_production", "in_production", "shipped", "completed", "cancelled"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and track customer orders</p>
        </div>
      </div>

      <Card className="bg-card border-border rounded-md">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search orders or customers..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading sales orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingCart className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No sales orders found</h3>
              <p className="text-muted-foreground">
                Accepted quotes will automatically appear here as sales orders.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredOrders.map((order) => (
                <SalesOrderCard 
                  key={order.id} 
                  order={order}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}