import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const FLORENCE_TASKS = [
  { id: "caption", name: "Caption", category: "Captioning" },
  { id: "caption_detailed", name: "Detailed Caption", category: "Captioning" },
  { id: "caption_more_detailed", name: "More Detailed Caption", category: "Captioning" },
  { id: "caption_grounding", name: "Caption + Grounding", category: "Grounding" },
  { id: "caption_grounding_detailed", name: "Detailed Caption + Grounding", category: "Grounding" },
  { id: "caption_grounding_more_detailed", name: "More Detailed Caption + Grounding", category: "Grounding" },
  { id: "caption_to_phrase_grounding", name: "Caption to Phrase Grounding", category: "Grounding" },
  { id: "object_detection", name: "Object Detection", category: "Detection" },
  { id: "open_vocab_detection", name: "Open Vocabulary Detection", category: "Detection" },
  { id: "ocr", name: "OCR", category: "OCR" },
  { id: "ocr_with_region", name: "OCR with Region", category: "OCR" },
  { id: "referring_expression_segmentation", name: "Referring Expression Segmentation", category: "Segmentation" },
  { id: "region_segmentation", name: "Region Segmentation", category: "Segmentation" },
  { id: "region_category", name: "Region to Category", category: "Region" },
  { id: "region_description", name: "Region to Description", category: "Region" },
  { id: "region_proposal", name: "Region Proposal", category: "Region" },
  { id: "dense_region_caption", name: "Dense Region Caption", category: "Region" },
];

const REXOMNI_TASKS = [
  { id: "detection", name: "Detection", category: "Detection" },
  { id: "ocr", name: "OCR", category: "OCR" },
  { id: "keypoint", name: "Keypoint Detection", category: "Keypoint" },
  { id: "visual_prompting", name: "Visual Prompting", category: "Prompting" },
];

export default function TaskSelector({ 
  selectedTasks, 
  onTaskToggle, 
  selectedModel, 
  onModelChange,
  onTaskInputChange,
  taskInputs 
}) {
  const tasks = selectedModel === "florence" ? FLORENCE_TASKS : REXOMNI_TASKS;
  
  const categories = [...new Set(tasks.map(t => t.category))];

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white">Select Tasks</CardTitle>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onModelChange("florence")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedModel === "florence"
                ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Florence-2 ({FLORENCE_TASKS.length})
          </button>
          <button
            onClick={() => onModelChange("rexomni")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedModel === "rexomni"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            RexOmni ({REXOMNI_TASKS.length})
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map((category) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-slate-400 mb-3">{category}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tasks
                .filter((t) => t.category === category)
                .map((task) => {
                  const isSelected = selectedTasks.some(
                    (t) => t.id === task.id && t.model === selectedModel
                  );
                  return (
                    <button
                      key={task.id}
                      onClick={() => onTaskToggle({ ...task, model: selectedModel })}
                      className={`p-3 rounded-lg text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/50"
                          : "bg-slate-800/50 hover:bg-slate-800 border border-slate-700"
                      }`}
                    >
                      <span className={`text-sm ${isSelected ? "text-cyan-400 font-medium" : "text-slate-300"}`}>
                        {task.name}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-cyan-400" />
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}