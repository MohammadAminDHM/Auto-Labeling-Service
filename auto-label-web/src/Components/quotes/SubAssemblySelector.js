import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, X, Layers } from "lucide-react";
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

export default function SubAssemblySelector({ 
  subAssemblies, 
  suppliers, 
  selectedSubAssemblyIds = [], 
  onSelectionChange, 
  onAddSubAssemblies, 
  subAssemblyCategories = [] 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [localSelection, setLocalSelection] = useState([]);

  const filteredSubAssemblies = useMemo(() => {
    return subAssemblies.filter(assembly => {
      const matchesSearch = !searchTerm || 
        assembly.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assembly.assembly_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || assembly.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [subAssemblies, searchTerm, categoryFilter]);

  const handleOpen = () => {
    setLocalSelection([...selectedSubAssemblyIds]);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm("");
    setCategoryFilter("all");
  };

  const toggleSelection = (assemblyId) => {
    setLocalSelection(prev => 
      prev.includes(assemblyId) 
        ? prev.filter(id => id !== assemblyId)
        : [...prev, assemblyId]
    );
  };

  const handleAddSelected = () => {
    const newAssemblies = localSelection.filter(id => !selectedSubAssemblyIds.includes(id));
    if (newAssemblies.length > 0) {
      onAddSubAssemblies(newAssemblies);
    }
    handleClose();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={handleOpen} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Sub-Assemblies
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Sub-Assemblies to Add</DialogTitle>
          <DialogDescription>
            Search and filter sub-assemblies, then select the ones you want to add to the quote.
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-4 border-b pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name or assembly number..."
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
                {subAssemblyCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchTerm || categoryFilter !== "all") && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {filteredSubAssemblies.length} of {subAssemblies.length} sub-assemblies</span>
            <span>{localSelection.length} selected</span>
          </div>
        </div>

        {/* Sub-Assemblies List */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-[300px]">
          {filteredSubAssemblies.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No sub-assemblies found matching your criteria</p>
            </div>
          ) : (
            filteredSubAssemblies.map((assembly) => {
              const isSelected = localSelection.includes(assembly.id);
              const isAlreadyAdded = selectedSubAssemblyIds.includes(assembly.id);
              const totalHours = (assembly.labor_entries || []).reduce((sum, entry) => sum + (entry.hours || 0), 0);
              
              return (
                <div 
                  key={assembly.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : isAlreadyAdded
                      ? 'border-muted bg-muted/30 opacity-60'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                  onClick={() => !isAlreadyAdded && toggleSelection(assembly.id)}
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
                        <h4 className="font-medium truncate">{assembly.name}</h4>
                        <p className="text-sm text-muted-foreground font-mono">{assembly.assembly_number}</p>
                        {assembly.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{assembly.description}</p>
                        )}
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold">${assembly.selling_price?.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {assembly.category?.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {totalHours}h labor
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
              {localSelection.filter(id => !selectedSubAssemblyIds.includes(id)).length} new sub-assemblies selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddSelected}
                disabled={localSelection.filter(id => !selectedSubAssemblyIds.includes(id)).length === 0}
              >
                Add Selected ({localSelection.filter(id => !selectedSubAssemblyIds.includes(id)).length})
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}