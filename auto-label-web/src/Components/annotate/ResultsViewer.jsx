import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResultsViewer({ results }) {
  const handleDownload = (result) => {
    const dataStr = JSON.stringify(result.data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result.task_name}_${result.image_name}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (results.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
        <CardContent className="py-12 text-center">
          <p className="text-slate-400">No results yet. Upload images and run tasks to see results here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <Card key={index} className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-white text-lg">{result.image_name}</CardTitle>
                <Badge className={result.model === "florence" ? "bg-purple-500/20 text-purple-400" : "bg-cyan-500/20 text-cyan-400"}>
                  {result.model}
                </Badge>
                <Badge variant="outline" className="text-slate-400 border-slate-700">
                  {result.task_name}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {result.status === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <Button
                  onClick={() => handleDownload(result)}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.visualized_url ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400 mb-2">Original Image</p>
                  <img
                    src={result.original_url}
                    alt="Original"
                    className="w-full rounded-lg border border-slate-700"
                  />
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-2">Annotated Result</p>
                  <img
                    src={result.visualized_url}
                    alt="Annotated"
                    className="w-full rounded-lg border border-slate-700"
                  />
                </div>
              </div>
            ) : (
              <div>
                <img
                  src={result.original_url}
                  alt="Original"
                  className="w-full max-w-md rounded-lg border border-slate-700 mb-4"
                />
              </div>
            )}
            
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-2">Results:</p>
              <pre className="text-xs text-slate-300 overflow-x-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>

            {result.processing_time && (
              <p className="text-xs text-slate-500">
                Processing time: {result.processing_time.toFixed(2)}s
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}