import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Package } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SalesOrderCard({ order, onStatusChange }) {
  const getStatusColor = (status) => {
    const colors = {
      pending_production: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30",
      in_production: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
      shipped: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
      completed: "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30",
      cancelled: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
    };
    return colors[status] || "bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30";
  };

  const getStatusBarColor = (status) => {
    const colors = {
      pending_production: "bg-orange-500",
      in_production: "bg-blue-500",
      shipped: "bg-indigo-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-slate-500";
  };

  const statuses = [
    { value: "pending_production", label: "Pending Production" },
    { value: "in_production", label: "In Production" },
    { value: "shipped", label: "Shipped" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" }
  ];

  return (
    <Link to={createPageUrl(`SalesOrderDetail?id=${order.id}`)} className="block">
      <div className="relative p-4 hover:bg-muted/30 transition-colors cursor-pointer border-b border-border">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusBarColor(order.status)}`}></div>
        <div className="flex items-center justify-between pl-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-foreground truncate">
                {order.sales_order_number}
              </h3>
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge className={`text-xs capitalize cursor-pointer ${getStatusColor(order.status)} border`}>
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {statuses.map((status) => (
                      <DropdownMenuItem
                        key={status.value}
                        onClick={(e) => {
                          e.preventDefault();
                          onStatusChange(order.id, status.value);
                        }}
                        disabled={order.status === status.value}
                      >
                        {status.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {order.customer?.company_name || 'Unknown Customer'}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(order.order_date || order.created_date), 'MMM d, yyyy')}
              </div>
              <div className={`flex items-center gap-1 font-semibold ${(order.total_amount || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                <DollarSign className="w-3 h-3" />
                ${order.total_amount?.toFixed(2) || '0.00'}
              </div>
              {order.quote_number && (
                <div className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {order.quote_number}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}