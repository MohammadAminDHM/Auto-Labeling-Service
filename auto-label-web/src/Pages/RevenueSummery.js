
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  Calendar,
  CheckCircle,
  Package,
  Clock,
  Truck
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, subMonths } from "date-fns";

export default function RevenueSummary() {
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    completedOrders: 0,
    pendingRevenue: 0,
    pendingOrders: 0,
    averageOrderValue: 0,
    topCustomers: [],
    revenueByMonth: [],
    ordersByStatus: {}
  });
  const [salesOrders, setSalesOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    setIsLoading(true);
    try {
      const [ordersData, customersData] = await Promise.all([
        base44.entities.SalesOrder.list('-created_date'),
        base44.entities.Customer.list()
      ]);

      setSalesOrders(ordersData);
      setCustomers(customersData);

      // Calculate completed revenue
      const completedOrders = ordersData.filter(o => o.status === 'completed');
      const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      // Calculate pending revenue (orders not completed or cancelled)
      const pendingOrders = ordersData.filter(o => 
        o.status !== 'completed' && o.status !== 'cancelled'
      );
      const pendingRevenue = pendingOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      // Average order value
      const averageOrderValue = completedOrders.length > 0 
        ? totalRevenue / completedOrders.length 
        : 0;

      // Orders by status
      const ordersByStatus = ordersData.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      // Top customers by revenue
      const customerRevenue = {};
      completedOrders.forEach(order => {
        if (order.customer_id) {
          customerRevenue[order.customer_id] = 
            (customerRevenue[order.customer_id] || 0) + (order.total_amount || 0);
        }
      });

      const topCustomers = Object.entries(customerRevenue)
        .map(([customerId, revenue]) => ({
          customer: customersData.find(c => c.id === customerId),
          revenue,
          orderCount: completedOrders.filter(o => o.customer_id === customerId).length
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Revenue by month (last 6 months)
      const monthlyRevenue = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        const monthOrders = completedOrders.filter(o => {
          const orderDate = new Date(o.order_date || o.created_date);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });
        
        const monthTotal = monthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        
        monthlyRevenue.push({
          month: format(monthDate, 'MMM yyyy'),
          revenue: monthTotal,
          orderCount: monthOrders.length
        });
      }

      setRevenueData({
        totalRevenue,
        completedOrders: completedOrders.length,
        pendingRevenue,
        pendingOrders: pendingOrders.length,
        averageOrderValue,
        topCustomers,
        revenueByMonth: monthlyRevenue,
        ordersByStatus
      });
    } catch (error) {
      console.error("Error loading revenue data:", error);
    }
    setIsLoading(false);
  };

  const getStatusInfo = (status) => {
    const statuses = {
      pending_production: { 
        color: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30", 
        icon: Clock, 
        label: "Pending Production" 
      },
      in_production: { 
        color: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30", 
        icon: Package, 
        label: "In Production" 
      },
      shipped: { 
        color: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30", 
        icon: Truck, 
        label: "Shipped" 
      },
      completed: { 
        color: "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30", 
        icon: CheckCircle, 
        label: "Completed" 
      },
      cancelled: { 
        color: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30", 
        icon: Clock, 
        label: "Cancelled" 
      }
    };
    return statuses[status] || statuses.pending_production;
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-screen">
        <p className="text-muted-foreground">Loading revenue data...</p>
      </div>
    );
  }

  const maxMonthlyRevenue = Math.max(...revenueData.revenueByMonth.map(m => m.revenue), 1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Revenue Summary</h1>
          <p className="text-muted-foreground mt-1">Detailed revenue analysis and breakdown</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="p-2 rounded-lg bg-green-500">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${revenueData.totalRevenue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${revenueData.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {revenueData.completedOrders} completed orders
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Revenue</CardTitle>
            <div className="p-2 rounded-lg bg-yellow-500">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${revenueData.pendingRevenue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${revenueData.pendingRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {revenueData.pendingOrders} pending orders
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Order Value</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${revenueData.averageOrderValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${revenueData.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per completed order
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {salesOrders.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time sales orders
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Revenue Trend */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Revenue by Month (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueData.revenueByMonth.map((month, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">{month.month}</span>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${month.revenue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ${month.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({month.orderCount} orders)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${(month.revenue / maxMonthlyRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Orders by Status */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Orders by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(revenueData.ordersByStatus).map(([status, count]) => {
                  const statusInfo = getStatusInfo(status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div key={status} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <StatusIcon className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium text-foreground capitalize">
                          {status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <Badge className={statusInfo.color}>
                        {count} order{count !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Top Customers */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Top Customers by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.topCustomers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No customer data available</p>
              ) : (
                <div className="space-y-4">
                  {revenueData.topCustomers.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{index + 1}</span>
                          </div>
                          <div>
                            <Link 
                              to={createPageUrl(`CustomerDetail?id=${item.customer?.id}`)}
                              className="font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {item.customer?.company_name || 'Unknown'}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {item.orderCount} order{item.orderCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <span className={`font-bold ${item.revenue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ${item.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      {index < revenueData.topCustomers.length - 1 && (
                        <div className="border-b border-border" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={createPageUrl("SalesOrders")} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View All Orders
                </Button>
              </Link>
              <Link to={createPageUrl("Customers")} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  View Customers
                </Button>
              </Link>
              <Link to={createPageUrl("Quotes")} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="w-4 h-4 mr-2" />
                  View Quotes
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
