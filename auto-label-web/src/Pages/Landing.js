import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sparkles, 
  Zap, 
  Image as ImageIcon, 
  FileText, 
  Grid3x3, 
  MessageSquare,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function Landing() {
  const models = [
    {
      name: "Florence-2",
      description: "Vision-Language Foundation Model",
      tasks: 17,
      capabilities: ["Image Understanding", "Grounded Captions", "Open-Vocab Detection", "Segmentation", "OCR", "Region Reasoning"],
      color: "from-purple-500 to-pink-600"
    },
    {
      name: "RexOmni",
      description: "High-Performance Vision Perception",
      tasks: 4,
      capabilities: ["Object Detection", "OCR", "Keypoint Detection", "Visual Prompting"],
      color: "from-cyan-500 to-blue-600"
    }
  ];

  const useCases = [
    { icon: FileText, title: "Dataset Creation", description: "Accelerate dataset annotation for ML training" },
    { icon: Zap, title: "Research", description: "Computer vision research and experimentation" },
    { icon: Grid3x3, title: "Production ML", description: "Production-ready ML pipeline integration" },
    { icon: MessageSquare, title: "Vision-Language", description: "Advanced vision-language understanding tasks" }
  ];

  const features = [
    "21 vision tasks across 2 foundation models",
    "Real-time visualization of annotations",
    "Batch processing for large datasets",
    "Standardized JSON outputs",
    "Project-based organization",
    "Complete annotation history",
    "Export to multiple formats",
    "FastAPI backend integration"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-8 py-24">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-cyan-500/30">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">AI-Powered Auto Labeling Platform</span>
            </div>
            
            <h1 className="text-6xl font-bold text-white leading-tight">
              Automatic Annotation<br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                For Computer Vision
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Professional auto-labeling platform powered by state-of-the-art multimodal vision models.
              Support for 21 vision tasks including detection, segmentation, OCR, and vision-language understanding.
            </p>

            <div className="flex items-center justify-center gap-4 pt-6">
              <Link to={createPageUrl("Dashboard")}>
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-lg px-8">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to={createPageUrl("Annotate")}>
                <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-slate-800 text-lg px-8">
                  Try Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Models Section */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Powered by Foundation Models
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {models.map((model) => (
            <Card key={model.name} className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${model.color} opacity-20 mb-4`}></div>
                <CardTitle className="text-2xl text-white">{model.name}</CardTitle>
                <p className="text-slate-400">{model.description}</p>
                <div className="pt-2">
                  <span className={`text-sm font-semibold bg-gradient-to-r ${model.color} bg-clip-text text-transparent`}>
                    {model.tasks} Tasks Available
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {model.capabilities.map((cap) => (
                    <div key={cap} className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm">{cap}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Use Cases */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Built For Real-World Workflows
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase) => {
            const Icon = useCase.icon;
            return (
              <Card key={useCase.title} className="bg-slate-900/50 border-slate-800 backdrop-blur-xl hover:border-cyan-500/50 transition-all">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{useCase.title}</h3>
                  <p className="text-sm text-slate-400">{useCase.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Everything You Need
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-3 p-4 rounded-lg bg-slate-900/30 border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-8 py-24">
        <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-500/30 backdrop-blur-xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Accelerate Your Annotations?
            </h2>
            <p className="text-slate-400 mb-8 text-lg">
              Start auto-labeling your datasets with cutting-edge AI models
            </p>
            <Link to={createPageUrl("Annotate")}>
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-lg px-12">
                Start Annotating
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold">AutoLabel AI</span>
            </div>
            <p className="text-slate-500 text-sm">
              Powered by Florence-2 & RexOmni
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}