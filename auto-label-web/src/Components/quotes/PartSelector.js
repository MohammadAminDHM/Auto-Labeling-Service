import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, X, Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function PartSelector({ 
  parts, 
  suppliers, 
  selectedPartIds = [], 
  onSelectionChange, 
  onAddParts, 
  partCategories = [] 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [localSelection, setLocalSelection] = useState([]);

  const filteredParts = useMemo(() => {
    return parts.filter(part => {
      const matchesSearch = !searchTerm || 
        part.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suppliers.find(s => s.id === part.supplier_id)?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || part.category === categoryFilter;
      const matchesSupplier = supplierFilter === "all" || part.supplier_id === supplierFilter;
      
      return matchesSearch && matchesCategory && matchesSupplier;
    });
  }, [parts, suppliers, searchTerm, categoryFilter, supplierFilter]);

  const handleOpen = () => {
    setLocalSelection([...selectedPartIds]);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm("");
    setCategoryFilter("all");
    setSupplierFilter("all");
  };

  const togglePartSelection = (partId) => {
    setLocalSelection(prev => 
      prev.includes(partId) 
        ? prev.filter(id => id !== partId)
        : [...prev, partId]
    );
  };

  const handleAddSelected = () => {
    const newParts = localSelection.filter(id => !selectedPartIds.includes(id));
    if (newParts.length > 0) {
      onAddParts(newParts);
    }
    handleClose();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setSupplierFilter("all");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={handleOpen} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Parts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Parts to Add</DialogTitle>
          <DialogDescription>
            Search and filter parts, then select the ones you want to add to the quote.
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-4 border-b pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by part name, number, or supplier..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {partCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchTerm || categoryFilter !== "all" || supplierFilter !== "all") && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {filteredParts.length} of {parts.length} parts</span>
            <span>{localSelection.length} selected</span>
          </div>
        </div>

        {/* Parts List */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-[300px]">
          {filteredParts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No parts found matching your criteria</p>
            </div>
          ) : (
            filteredParts.map((part) => {
              const supplier = suppliers.find(s => s.id === part.supplier_id);
              const isSelected = localSelection.includes(part.id);
              const isAlreadyAdded = selectedPartIds.includes(part.id);
              
              return (
                <div 
                  key={part.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : isAlreadyAdded
                      ? 'border-muted bg-muted/30 opacity-60'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                  onClick={() => !isAlreadyAdded && togglePartSelection(part.id)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isAlreadyAdded}
                    onChange={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-primary"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{part.name}</h4>
                        <p className="text-sm text-muted-foreground font-mono">{part.part_number}</p>
                        {supplier && (
                          <p className="text-xs text-muted-foreground">{supplier.name}</p>
                        )}
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold">${part.selling_price?.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {part.category?.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Stock: {part.stock_quantity || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {isAlreadyAdded && (
                      <p className="text-xs text-muted-foreground mt-1">Already added to quote</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              {localSelection.filter(id => !selectedPartIds.includes(id)).length} new parts selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddSelected}
                disabled={localSelection.filter(id => !selectedPartIds.includes(id)).length === 0}
              >
                Add Selected Parts ({localSelection.filter(id => !selectedPartIds.includes(id)).length})
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}