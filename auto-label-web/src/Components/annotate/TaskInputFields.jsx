import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Tasks that require additional inputs
const TASK_INPUT_REQUIREMENTS = {
  // Florence tasks with text inputs
  "referring_expression_segmentation": {
    label: "Referring Expression",
    type: "text",
    placeholder: "e.g., 'the red car on the left'",
    description: "Describe the object you want to segment"
  },
  "caption_to_phrase_grounding": {
    label: "Target Phrase",
    type: "text",
    placeholder: "e.g., 'person with laptop'",
    description: "Phrase to ground in the image"
  },
  "open_vocab_detection": {
    label: "Categories",
    type: "text",
    placeholder: "e.g., 'person, car, dog' (comma-separated)",
    description: "Custom object categories to detect"
  },
  "region_category": {
    label: "Region Box",
    type: "bbox",
    placeholder: "x1, y1, x2, y2",
    description: "Bounding box coordinates (format: x1,y1,x2,y2)"
  },
  "region_description": {
    label: "Region Box",
    type: "bbox",
    placeholder: "x1, y1, x2, y2",
    description: "Bounding box coordinates for description"
  },
  // RexOmni visual prompting
  "visual_prompting": {
    label: "Prompt Boxes",
    type: "bbox_array",
    placeholder: "[[x1,y1,x2,y2], [x1,y1,x2,y2]]",
    description: "JSON array of bounding boxes"
  }
};

export default function TaskInputFields({ selectedTasks, taskInputs, onTaskInputChange }) {
  const tasksNeedingInput = selectedTasks.filter(
    task => TASK_INPUT_REQUIREMENTS[task.id]
  );

  if (tasksNeedingInput.length === 0) {
    return null;
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white text-lg">Task-Specific Inputs</CardTitle>
        <p className="text-sm text-slate-400">Some tasks require additional parameters</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasksNeedingInput.map((task) => {
          const requirement = TASK_INPUT_REQUIREMENTS[task.id];
          const taskKey = `${task.model}_${task.id}`;
          
          return (
            <div key={taskKey} className="space-y-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={task.model === "florence" ? "bg-purple-500/20 text-purple-400" : "bg-cyan-500/20 text-cyan-400"}>
                  {task.name}
                </Badge>
              </div>
              
              <Label className="text-slate-300">{requirement.label}</Label>
              
              {requirement.type === "bbox_array" ? (
                <Textarea
                  value={taskInputs[taskKey] || ""}
                  onChange={(e) => onTaskInputChange(taskKey, e.target.value)}
                  placeholder={requirement.placeholder}
                  className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
                  rows={3}
                />
              ) : (
                <Input
                  value={taskInputs[taskKey] || ""}
                  onChange={(e) => onTaskInputChange(taskKey, e.target.value)}
                  placeholder={requirement.placeholder}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              )}
              
              <p className="text-xs text-slate-500">{requirement.description}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}