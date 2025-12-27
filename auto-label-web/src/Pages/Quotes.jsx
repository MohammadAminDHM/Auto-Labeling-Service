import React, { useState, useEffect } from "react";
import { Quote, Customer, Machine, Part, SubAssembly, SalesOrder } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Eye,
  Edit,
  FileText,
  Filter,
  Calendar,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

import QuoteBuilder from "../components/quotes/QuoteBuilder";
import QuoteCard from "../components/quotes/QuoteCard";
import { toast } from "sonner";

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [parts, setParts] = useState([]);
  const [subAssemblies, setSubAssemblies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  
  const location = useLocation();

  // Check URL params for actions
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const action = urlParams.get('action');
    const quoteId = urlParams.get('id');
    
    if (action === 'new') {
      setEditingQuote(null);
      setShowQuoteBuilder(true);
    } else if (quoteId && quotes.length > 0) {
      const quoteToEdit = quotes.find(q => q.id === quoteId);
      if (quoteToEdit) {
        setEditingQuote(quoteToEdit);
        setShowQuoteBuilder(true);
      }
    }
  }, [location.search, quotes]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [quotesData, customersData, machinesData, partsData, subAssembliesData] = await Promise.all([
        Quote.list('-created_date'),
        Customer.list(),
        Machine.list(),
        Part.list(),
        SubAssembly.list()
      ]);

      // Enhance quotes with customer data
      const enhancedQuotes = await Promise.all(
        quotesData.map(async (quote) => {
          const customer = customersData.find(c => c.id === quote.customer_id);
          return { ...quote, customer };
        })
      );

      setQuotes(enhancedQuotes);
      setCustomers(customersData);
      setMachines(machinesData);
      setParts(partsData);
      setSubAssemblies(subAssembliesData);
    } catch (error) {
      console.error("Error loading quotes data:", error);
      toast.error("Failed to load quotes data.");
    }
    setIsLoading(false);
  };

  const handleQuoteSaved = () => {
    setShowQuoteBuilder(false);
    setEditingQuote(null);
    // Clear URL parameters
    window.history.pushState({}, '', createPageUrl("Quotes"));
    loadData();
    toast.success("Quote saved successfully!");
  };

  const handleCreateNewQuote = () => {
    setEditingQuote(null);
    setShowQuoteBuilder(true);
  }

  const handleEditQuote = (quote) => {
    setEditingQuote(quote);
    setShowQuoteBuilder(true);
  }

  const handleDeleteQuote = async (quoteId) => {
    try {
      await Quote.delete(quoteId);
      loadData();
      toast.success("Quote deleted successfully!");
    } catch (error) {
      console.error("Error deleting quote:", error);
      toast.error("Failed to delete quote.");
    }
  };
  
  const handleStatusChange = async (quoteId, newStatus) => {
    try {
      await Quote.update(quoteId, { status: newStatus });
      toast.success(`Quote status updated to "${newStatus}".`);

      if (newStatus === 'accepted') {
        const acceptedQuote = quotes.find(q => q.id === quoteId);
        if (acceptedQuote) {
          const salesOrderNumber = `SO-${acceptedQuote.quote_number.replace('Q', '')}`;
          const salesOrderData = {
            sales_order_number: salesOrderNumber,
            quote_id: acceptedQuote.id,
            quote_number: acceptedQuote.quote_number,
            customer_id: acceptedQuote.customer_id,
            location_id: acceptedQuote.location_id,
            status: "pending_production",
            order_date: new Date().toISOString().split('T')[0],
            machines: acceptedQuote.machines,
            parts: acceptedQuote.parts,
            sub_assemblies: acceptedQuote.sub_assemblies,
            subtotal: acceptedQuote.subtotal,
            discount_amount: acceptedQuote.discount_amount,
            tax_amount: acceptedQuote.tax_amount,
            total_amount: acceptedQuote.total_amount,
            notes: acceptedQuote.notes,
            shipping_address: acceptedQuote.shipping_address || null,
            delivery_date: acceptedQuote.delivery_date || null,
            shipping_cost: acceptedQuote.shipping_cost || 0,
            delivery_method: acceptedQuote.delivery_method || null,
          };

          await SalesOrder.create(salesOrderData);
          toast.info(`Sales Order ${salesOrderNumber} created successfully.`);
        }
      }

      loadData();
    } catch (error) {
      console.error("Error updating quote status or creating sales order:", error);
      toast.error("Failed to update quote status.");
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.customer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-slate-100 text-slate-700",
      sent: "bg-blue-100 text-blue-700",
      accepted: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      expired: "bg-orange-100 text-orange-700"
    };
    return colors[status] || colors.draft;
  };

  if (showQuoteBuilder) {
    return (
      <QuoteBuilder
        customers={customers}
        machines={machines}
        parts={parts}
        subAssemblies={subAssemblies}
        initialQuote={editingQuote}
        onSave={handleQuoteSaved}
        onCancel={() => {
            setShowQuoteBuilder(false);
            setEditingQuote(null);
            // Clear URL parameters
            window.history.pushState({}, '', createPageUrl("Quotes"));
        }}
        onStatusChange={handleStatusChange}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quotes</h1>
          <p className="text-muted-foreground mt-1">Manage your machine quotes</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleCreateNewQuote}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Quote
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search quotes or customers..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              {["all", "draft", "sent", "accepted", "rejected"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? "bg-primary text-primary-foreground" : ""}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading quotes...</div>
          ) : filteredQuotes.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No quotes found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first quote to get started"
                }
              </p>
              <Button
                onClick={handleCreateNewQuote}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Quote
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredQuotes.map((quote) => (
                <QuoteCard 
                  key={quote.id} 
                  quote={quote} 
                  onEdit={handleEditQuote} 
                  onDelete={handleDeleteQuote}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}