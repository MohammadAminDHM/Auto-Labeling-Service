import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Settings as SettingsIcon, Loader2 } from "lucide-react";
import TaskSelector from "../components/annotate/TaskSelector";
import ImageUploader from "../components/annotate/ImageUploader";
import ResultsViewer from "../components/annotate/ResultsViewer";
import TaskInputFields from "../components/annotate/TaskInputFields";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/Components/ui/dialog";
import { Label } from "@/Components/ui/label";

export default function Annotate() {
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectedModel, setSelectedModel] = useState("florence");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [results, setResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [backendUrl, setBackendUrl] = useState("http://localhost:6996");
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [taskInputs, setTaskInputs] = useState({});

  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const projectIdFromUrl = urlParams.get("project_id");

  useEffect(() => {
    if (projectIdFromUrl) {
      setCurrentProjectId(projectIdFromUrl);
    }
  }, [projectIdFromUrl]);

  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.Settings.list(),
  });

  useEffect(() => {
    if (settings.length > 0) {
      setBackendUrl(settings[0].backend_url || "http://localhost:6996");
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (url) => {
      if (settings.length > 0) {
        return base44.entities.Settings.update(settings[0].id, { backend_url: url });
      } else {
        return base44.entities.Settings.create({ backend_url: url });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      setSettingsOpen(false);
    },
  });

  const handleTaskToggle = (task) => {
    setSelectedTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id && t.model === task.model);
      if (exists) {
        return prev.filter((t) => !(t.id === task.id && t.model === task.model));
      } else {
        return [...prev, task];
      }
    });
  };

  const handleTaskInputChange = (taskKey, value) => {
    setTaskInputs((prev) => ({
      ...prev,
      [taskKey]: value
    }));
  };

  const handleProcess = async () => {
    if (uploadedImages.length === 0) {
      alert("Please upload at least one image");
      return;
    }
    if (selectedTasks.length === 0) {
      alert("Please select at least one task");
      return;
    }

    setProcessing(true);
    const newResults = [];

    try {
      for (const image of uploadedImages) {
        await base44.entities.Image.update(image.id, { status: "processing" });

        for (const task of selectedTasks) {
          const startTime = Date.now();
          
          try {
            const endpoint = `${backendUrl}/vision/${task.model}/${task.id}`;
            
            const formData = new FormData();
            formData.append("file", image.localFile);
            formData.append("visualize", "true");

            // Add task-specific inputs if available
            const taskKey = `${task.model}_${task.id}`;
            if (taskInputs[taskKey]) {
              const inputValue = taskInputs[taskKey];
              
              // Handle different input types
              if (task.id === "visual_prompting") {
                formData.append("visual_prompt_boxes", inputValue);
              } else if (task.id === "open_vocab_detection") {
                formData.append("categories", inputValue);
              } else if (task.id === "region_category" || task.id === "region_description") {
                formData.append("region_box", inputValue);
              } else {
                formData.append("text_input", inputValue);
              }
            }

            const response = await fetch(endpoint, {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const resultsHeader = response.headers.get("x-florence-results") || response.headers.get("x-rexomni-results");
            let resultData = {};
            let visualizedUrl = null;
            
            if (resultsHeader) {
              resultData = JSON.parse(resultsHeader);
            }

            // Check if response is an image or JSON
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("image")) {
              const visualizedBlob = await response.blob();
              visualizedUrl = URL.createObjectURL(visualizedBlob);
            } else if (contentType && contentType.includes("json")) {
              const jsonData = await response.json();
              resultData = jsonData;
            }

            const processingTime = (Date.now() - startTime) / 1000;

            const annotationRecord = await base44.entities.Annotation.create({
              image_id: image.id,
              project_id: currentProjectId || "default",
              model: task.model,
              task_type: task.id,
              task_display_name: task.name,
              result: resultData,
              processing_time: processingTime,
              status: "success",
            });

            newResults.push({
              image_name: image.filename,
              task_name: task.name,
              model: task.model,
              data: resultData,
              visualized_url: visualizedUrl,
              original_url: image.image_url,
              status: "success",
              processing_time: processingTime,
            });

            await base44.entities.Image.update(image.id, {
              status: "completed",
              annotations_count: (image.annotations_count || 0) + 1,
            });

          } catch (error) {
            console.error(`Error processing ${task.name} on ${image.filename}:`, error);
            
            await base44.entities.Annotation.create({
              image_id: image.id,
              project_id: currentProjectId || "default",
              model: task.model,
              task_type: task.id,
              task_display_name: task.name,
              result: {},
              status: "failed",
              error_message: error.message,
            });

            newResults.push({
              image_name: image.filename,
              task_name: task.name,
              model: task.model,
              data: { error: error.message },
              original_url: image.image_url,
              status: "failed",
            });

            await base44.entities.Image.update(image.id, { status: "failed" });
          }
        }
      }

      setResults(newResults);
      
      if (currentProjectId) {
        const project = await base44.entities.Project.list();
        const currentProject = project.find(p => p.id === currentProjectId);
        if (currentProject) {
          await base44.entities.Project.update(currentProjectId, {
            total_images: (currentProject.total_images || 0) + uploadedImages.length,
            processed_images: (currentProject.processed_images || 0) + uploadedImages.length,
          });
        }
      }

      queryClient.invalidateQueries(['projects']);
      queryClient.invalidateQueries(['images']);
      queryClient.invalidateQueries(['annotations']);

    } catch (error) {
      console.error("Processing error:", error);
      alert("An error occurred during processing. Check console for details.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Auto Annotate</h1>
          <p className="text-slate-400">Upload images and select vision tasks to auto-label your dataset</p>
        </div>
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Backend Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Backend URL</Label>
                <Input
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  placeholder="http://localhost:6996"
                  className="bg-slate-800 border-slate-700 text-white mt-2"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Enter your FastAPI backend URL (e.g., http://localhost:6996 or http://your-ip:6996)
                </p>
              </div>
              <Button
                onClick={() => saveSettingsMutation.mutate(backendUrl)}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
                disabled={saveSettingsMutation.isPending}
              >
                {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <TaskSelector
            selectedTasks={selectedTasks}
            onTaskToggle={handleTaskToggle}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            onTaskInputChange={handleTaskInputChange}
            taskInputs={taskInputs}
          />

          <TaskInputFields
            selectedTasks={selectedTasks}
            taskInputs={taskInputs}
            onTaskInputChange={handleTaskInputChange}
          />
          
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="text-sm text-slate-400 mb-3">
                <p><strong className="text-white">{selectedTasks.length}</strong> task(s) selected</p>
                <p><strong className="text-white">{uploadedImages.length}</strong> image(s) uploaded</p>
              </div>
              <Button
                onClick={handleProcess}
                disabled={processing || uploadedImages.length === 0 || selectedTasks.length === 0}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Auto Labeling
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <ImageUploader
            onImagesUploaded={setUploadedImages}
            projectId={currentProjectId}
          />
          
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Results</h2>
            <ResultsViewer results={results} />
          </div>
        </div>
      </div>
    </div>
  );
}