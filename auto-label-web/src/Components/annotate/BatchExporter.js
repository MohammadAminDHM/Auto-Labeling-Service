import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BatchExporter({ annotations, images }) {
  const [exportFormat, setExportFormat] = React.useState("json");

  const exportAsJSON = () => {
    const data = annotations.map(annotation => {
      const image = images.find(img => img.id === annotation.image_id);
      return {
        image_id: annotation.image_id,
        image_filename: image?.filename,
        image_url: image?.image_url,
        image_width: image?.width,
        image_height: image?.height,
        model: annotation.model,
        task: annotation.task_display_name,
        task_type: annotation.task_type,
        result: annotation.result,
        processing_time: annotation.processing_time,
        status: annotation.status,
        created_date: annotation.created_date
      };
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `annotations_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsCOCO = () => {
    // COCO format structure
    const cocoData = {
      info: {
        description: "AutoLabel AI Annotations",
        version: "1.0",
        date_created: new Date().toISOString()
      },
      images: [],
      annotations: [],
      categories: []
    };

    const categoryMap = new Map();
    let categoryId = 1;
    let annotationId = 1;

    annotations.forEach((annotation, idx) => {
      const image = images.find(img => img.id === annotation.image_id);
      if (!image) return;

      // Add image if not already added
      if (!cocoData.images.find(img => img.id === image.id)) {
        cocoData.images.push({
          id: image.id,
          file_name: image.filename,
          width: image.width,
          height: image.height,
          url: image.image_url
        });
      }

      // Process bounding boxes from results
      const result = annotation.result;
      if (result && result.bboxes && result.labels) {
        result.bboxes.forEach((bbox, bboxIdx) => {
          const label = result.labels[bboxIdx] || "unknown";
          
          // Add category if new
          if (!categoryMap.has(label)) {
            categoryMap.set(label, categoryId);
            cocoData.categories.push({
              id: categoryId,
              name: label,
              supercategory: "object"
            });
            categoryId++;
          }

          // Add annotation
          const [x1, y1, x2, y2] = bbox;
          const width = x2 - x1;
          const height = y2 - y1;
          
          cocoData.annotations.push({
            id: annotationId++,
            image_id: image.id,
            category_id: categoryMap.get(label),
            bbox: [x1, y1, width, height],
            area: width * height,
            iscrowd: 0,
            source: annotation.model,
            task: annotation.task_type
          });
        });
      }
    });

    const blob = new Blob([JSON.stringify(cocoData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `annotations_coco_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsYOLO = () => {
    // YOLO format: class x_center y_center width height (normalized)
    const zip = {}; // Simple object to hold file contents
    
    annotations.forEach(annotation => {
      const image = images.find(img => img.id === annotation.image_id);
      if (!image) return;

      const result = annotation.result;
      if (result && result.bboxes && result.labels) {
        const lines = [];
        
        result.bboxes.forEach((bbox, idx) => {
          const [x1, y1, x2, y2] = bbox;
          const x_center = ((x1 + x2) / 2) / image.width;
          const y_center = ((y1 + y2) / 2) / image.height;
          const width = (x2 - x1) / image.width;
          const height = (y2 - y1) / image.height;
          
          // Use index as class (in real scenario, you'd have a class mapping)
          const classId = idx % 80; // Dummy class mapping
          
          lines.push(`${classId} ${x_center.toFixed(6)} ${y_center.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}`);
        });

        // Create a text file for this image
        const filename = image.filename.replace(/\.[^/.]+$/, ".txt");
        zip[filename] = lines.join("\n");
      }
    });

    // For simplicity, export as a single concatenated file
    // In production, you'd create a proper ZIP archive
    const allContent = Object.entries(zip)
      .map(([filename, content]) => `# ${filename}\n${content}`)
      .join("\n\n");

    const blob = new Blob([allContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `annotations_yolo_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    switch (exportFormat) {
      case "json":
        exportAsJSON();
        break;
      case "coco":
        exportAsCOCO();
        break;
      case "yolo":
        exportAsYOLO();
        break;
      default:
        exportAsJSON();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Select value={exportFormat} onValueChange={setExportFormat}>
        <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
          <SelectValue placeholder="Format" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          <SelectItem value="json">JSON</SelectItem>
          <SelectItem value="coco">COCO</SelectItem>
          <SelectItem value="yolo">YOLO</SelectItem>
        </SelectContent>
      </Select>
      <Button
        onClick={handleExport}
        disabled={annotations.length === 0}
        className="bg-gradient-to-r from-cyan-500 to-blue-600"
      >
        <Download className="w-4 h-4 mr-2" />
        Export ({annotations.length})
      </Button>
    </div>
  );
}