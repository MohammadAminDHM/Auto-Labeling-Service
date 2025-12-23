import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Image as ImageIcon, Tag, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date', 50),
  });

  const { data: images = [] } = useQuery({
    queryKey: ['images'],
    queryFn: () => base44.entities.Image.list('-updated_date', 50),
  });

  const { data: annotations = [] } = useQuery({
    queryKey: ['annotations'],
    queryFn: () => base44.entities.Annotation.list('-created_date', 50),
  });

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalImages = images.length;
  const processedImages = images.filter(i => i.status === 'completed').length;
  const totalAnnotations = annotations.length;

  const recentAnnotations = annotations.slice(0, 5);

  const stats = [
    {
      title: "Active Projects",
      value: activeProjects,
      icon: FolderKanban,
      color: "from-cyan-500 to-blue-600",
      bgColor: "bg-cyan-500/10"
    },
    {
      title: "Total Images",
      value: totalImages,
      icon: ImageIcon,
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Processed Images",
      value: processedImages,
      icon: Activity,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Total Annotations",
      value: totalAnnotations,
      icon: Tag,
      color: "from-orange-500 to-red-600",
      bgColor: "bg-orange-500/10"
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Welcome to your Auto Labeling platform</p>
        </div>
        <Link to={createPageUrl("Annotate")}>
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
            Start Annotating
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} style={{WebkitTextFillColor: 'transparent'}} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Annotations */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Recent Annotations</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAnnotations.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No annotations yet</p>
            ) : (
              <div className="space-y-3">
                {recentAnnotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{annotation.task_display_name}</p>
                      <p className="text-slate-400 text-xs mt-1">
                        {annotation.model.toUpperCase()} • {new Date(annotation.created_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      annotation.status === 'success' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {annotation.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Recent Projects</CardTitle>
            <Link to={createPageUrl("Projects")}>
              <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">No projects yet</p>
                <Link to={createPageUrl("Projects")}>
                  <Button variant="outline" className="border-slate-700 text-slate-300">
                    Create Your First Project
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <Link key={project.id} to={createPageUrl(`Annotate?project_id=${project.id}`)}>
                    <div className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-medium">{project.name}</p>
                        <span className={`px-2 py-1 rounded text-xs ${
                          project.status === 'active' 
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : project.status === 'completed'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>{project.total_images} images</span>
                        <span>•</span>
                        <span>{project.processed_images} processed</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}