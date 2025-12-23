import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Image as ImageIcon, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import BatchExporter from "../components/annotate/BatchExporter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function History() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterModel, setFilterModel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: annotations = [], isLoading } = useQuery({
    queryKey: ['annotations'],
    queryFn: () => base44.entities.Annotation.list('-created_date', 200),
  });

  const { data: images = [] } = useQuery({
    queryKey: ['images'],
    queryFn: () => base44.entities.Image.list(),
  });

  const imagesMap = images.reduce((acc, img) => {
    acc[img.id] = img;
    return acc;
  }, {});

  const filteredAnnotations = annotations.filter((annotation) => {
    const image = imagesMap[annotation.image_id];
    const matchesSearch = !searchTerm || 
      annotation.task_display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (image?.filename || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModel = filterModel === "all" || annotation.model === filterModel;
    const matchesStatus = filterStatus === "all" || annotation.status === filterStatus;
    return matchesSearch && matchesModel && matchesStatus;
  });

  const handleExport = (annotation) => {
    const data = {
      task: annotation.task_display_name,
      model: annotation.model,
      result: annotation.result,
      created_date: annotation.created_date,
      processing_time: annotation.processing_time,
    };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `annotation_${annotation.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    const data = filteredAnnotations.map(annotation => ({
      task: annotation.task_display_name,
      model: annotation.model,
      result: annotation.result,
      created_date: annotation.created_date,
      processing_time: annotation.processing_time,
      image_id: annotation.image_id,
      image_filename: imagesMap[annotation.image_id]?.filename,
    }));
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `all_annotations_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Annotation History</h1>
          <p className="text-slate-400">View all your processed annotations</p>
        </div>
        <BatchExporter annotations={filteredAnnotations} images={images} />
      </div>

      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by task or image name..."
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
            <Select value={filterModel} onValueChange={setFilterModel}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Filter by model" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Models</SelectItem>
                <SelectItem value="florence">Florence</SelectItem>
                <SelectItem value="rexomni">RexOmni</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">Loading history...</div>
        </div>
      ) : filteredAnnotations.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No annotations found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnnotations.map((annotation) => {
            const image = imagesMap[annotation.image_id];
            return (
              <Card key={annotation.id} className="bg-slate-900/50 border-slate-800 backdrop-blur-xl hover:border-slate-700 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-white text-lg">{annotation.task_display_name}</CardTitle>
                        <Badge className={annotation.model === "florence" ? "bg-purple-500/20 text-purple-400" : "bg-cyan-500/20 text-cyan-400"}>
                          {annotation.model}
                        </Badge>
                        <Badge className={annotation.status === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                          {annotation.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <ImageIcon className="w-4 h-4" />
                          <span>{image?.filename || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(annotation.created_date).toLocaleString()}</span>
                        </div>
                        {annotation.processing_time && (
                          <span>⏱️ {annotation.processing_time.toFixed(2)}s</span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleExport(annotation)}
                      variant="outline"
                      size="sm"
                      className="border-slate-700 text-slate-300"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {image && (
                    <img
                      src={image.image_url}
                      alt={image.filename}
                      className="w-48 h-32 object-cover rounded-lg border border-slate-700 mb-3"
                    />
                  )}
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-2">Result Preview:</p>
                    <pre className="text-xs text-slate-300 overflow-x-auto max-h-32">
                      {JSON.stringify(annotation.result, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}