import React, { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44client";

export default function ImageUploader({ onImagesUploaded, projectId }) {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = file_url;
        });

        const imageRecord = await base44.entities.Image.create({
          project_id: projectId,
          filename: file.name,
          image_url: file_url,
          width: img.width,
          height: img.height,
          status: "pending",
        });

        uploadedUrls.push({ ...imageRecord, localFile: file });
      }

      setUploadedImages((prev) => [...prev, ...uploadedUrls]);
      onImagesUploaded(uploadedUrls);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    onImagesUploaded(uploadedImages.filter((_, i) => i !== index));
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
      <CardContent className="p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {uploadedImages.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 rounded-lg p-12 text-center cursor-pointer hover:border-cyan-500 transition-colors"
          >
            <Upload className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Upload Images</p>
            <p className="text-slate-400 text-sm mb-4">
              Click to browse or drag and drop your images here
            </p>
            <Button
              type="button"
              disabled={uploading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              {uploading ? "Uploading..." : "Select Images"}
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-medium">{uploadedImages.length} image(s) uploaded</p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300"
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Add More
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {uploadedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img.image_url}
                    alt={img.filename}
                    className="w-full h-32 object-cover rounded-lg border border-slate-700"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <p className="text-xs text-slate-400 mt-1 truncate">{img.filename}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}