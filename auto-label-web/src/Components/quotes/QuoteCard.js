import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
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

export default function QuoteCard({ quote, onEdit, onDelete }) {
  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30",
      sent: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
      accepted: "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30",
      rejected: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
      expired: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30"
    };
    return colors[status] || colors.draft;
  };

  const getStatusBarColor = (status) => {
    const colors = {
      draft: "bg-slate-500",
      sent: "bg-blue-500",
      accepted: "bg-green-500",
      rejected: "bg-red-500",
      expired: "bg-orange-500"
    };
    return colors[status] || colors.draft;
  };

  return (
    <Link to={createPageUrl(`Quotes?id=${quote.id}`)} className="block">
      <div className="relative p-4 hover:bg-muted/30 transition-colors cursor-pointer border-b border-border">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusBarColor(quote.status)}`}></div>
        <div className="flex items-center justify-between pl-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-foreground truncate">
                {quote.quote_number}
              </h3>
              <Badge className={`text-xs ${getStatusColor(quote.status)} border`}>
                {quote.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {quote.customer?.company_name || 'Unknown Customer'}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(quote.created_date), 'MMM d, yyyy')}
              </div>
              <div className={`flex items-center gap-1 font-semibold ${(quote.total_amount || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                <DollarSign className="w-3 h-3" />
                ${quote.total_amount?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onEdit(quote);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive/80"
                  onClick={(e) => e.preventDefault()}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Quote</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete quote {quote.quote_number}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(quote.id);
                    }} 
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </Link>
  );
}