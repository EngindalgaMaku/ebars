"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download,
  FileArchive,
  FileJson,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { triggerZipDownload, getFullEvaluation } from "../services/evaluationApi";

interface EvaluationExportPanelProps {
  testId: string;
  testName?: string;
  token?: string;
  onExportComplete?: () => void;
  onError?: (error: string) => void;
}

type ExportFormat = "zip" | "json" | "markdown";

export default function EvaluationExportPanel({
  testId,
  testName,
  token,
  onExportComplete,
  onError,
}: EvaluationExportPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("zip");
  const [includeChunks, setIncludeChunks] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeReport, setIncludeReport] = useState(true);
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle");

  const handleExport = async () => {
    setLoading(true);
    setExportStatus("idle");

    try {
      if (selectedFormat === "zip") {
        await triggerZipDownload(testId, testName || testId, token);
      } else if (selectedFormat === "json") {
        const evaluation = await getFullEvaluation(testId, token);
        const dataStr = JSON.stringify(evaluation, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `evaluation_${testName || testId}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else if (selectedFormat === "markdown") {
        const evaluation = await getFullEvaluation(testId, token);
        const markdown = generateMarkdownReport(evaluation);
        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `evaluation_${testName || testId}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      setExportStatus("success");
      onExportComplete?.();
    } catch (error) {
      setExportStatus("error");
      const message = error instanceof Error ? error.message : "Export failed";
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  const generateMarkdownReport = (evaluation: any): string => {
    const lines: string[] = [];
    
    lines.push("# Chunking Evaluation Report");
    lines.push("");
    lines.push(`**Test ID**: ${evaluation.test_id}`);
    lines.push(`**Generated**: ${new Date().toISOString()}`);
    lines.push("");
    
    lines.push("## Summary");
    lines.push("");
    lines.push(`- **Traditional Quality**: ${(evaluation.summary.traditional_quality * 100).toFixed(2)}%`);
    lines.push(`- **Multi-Agent Quality**: ${(evaluation.summary.multi_agent_quality * 100).toFixed(2)}%`);
    lines.push(`- **Improvement**: ${evaluation.summary.overall_improvement_pct.toFixed(2)}%`);
    lines.push(`- **Winner**: ${evaluation.summary.winner}`);
    lines.push("");
    
    if (includeMetrics && evaluation.evaluation) {
      lines.push("## Scientific Metrics");
      lines.push("");
      lines.push("| Metric | Traditional | Multi-Agent | Improvement |");
      lines.push("|--------|-------------|-------------|-------------|");
      
      const trad = evaluation.evaluation.scientific_metrics.traditional;
      const multi = evaluation.evaluation.scientific_metrics.multi_agent;
      
      const metrics = [
        ["HOPE Score", trad.hope_score, multi.hope_score],
        ["Topic Drift", trad.topic_drift_score, multi.topic_drift_score],
        ["Context Preservation", trad.context_preservation_score, multi.context_preservation_score],
        ["Semantic Coherence", trad.semantic_coherence_score, multi.semantic_coherence_score],
        ["Boundary Quality", trad.boundary_quality_score, multi.boundary_quality_score],
        ["Information Density", trad.information_density_score, multi.information_density_score],
        ["Overall Quality", trad.overall_quality_index, multi.overall_quality_index],
      ];
      
      metrics.forEach(([name, tradVal, multiVal]) => {
        const improvement = tradVal > 0 ? ((multiVal - tradVal) / tradVal * 100).toFixed(1) : "N/A";
        lines.push(`| ${name} | ${(tradVal * 100).toFixed(2)}% | ${(multiVal * 100).toFixed(2)}% | ${improvement}% |`);
      });
      
      lines.push("");
      
      if (evaluation.evaluation.agent_evaluation) {
        lines.push("## Agent Performance");
        lines.push("");
        lines.push("| Agent | Score | Weight |");
        lines.push("|-------|-------|--------|");
        
        const agents = evaluation.evaluation.agent_evaluation;
        lines.push(`| Structural | ${(agents.structural_score.score * 100).toFixed(2)}% | ${(agents.weights?.structural * 100 || 35).toFixed(0)}% |`);
        lines.push(`| Semantic | ${(agents.semantic_score.score * 100).toFixed(2)}% | ${(agents.weights?.semantic * 100 || 30).toFixed(0)}% |`);
        lines.push(`| Size | ${(agents.size_score.score * 100).toFixed(2)}% | ${(agents.weights?.size * 100 || 20).toFixed(0)}% |`);
        lines.push(`| Quality | ${(agents.quality_score.score * 100).toFixed(2)}% | ${(agents.weights?.quality * 100 || 15).toFixed(0)}% |`);
        lines.push(`| **Overall** | **${(agents.overall_score * 100).toFixed(2)}%** | 100% |`);
        lines.push("");
      }
    }
    
    lines.push("---");
    lines.push("*Generated by Chunking Evaluation System*");
    
    return lines.join("\n");
  };

  const formatOptions = [
    {
      value: "zip" as ExportFormat,
      label: "ZIP Archive",
      description: "Tüm chunk'lar, metadata ve rapor",
      icon: <FileArchive className="h-5 w-5" />,
    },
    {
      value: "json" as ExportFormat,
      label: "JSON",
      description: "Yapılandırılmış değerlendirme verisi",
      icon: <FileJson className="h-5 w-5" />,
    },
    {
      value: "markdown" as ExportFormat,
      label: "Markdown",
      description: "Okunabilir rapor formatı",
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-blue-500" />
          Değerlendirme Dışa Aktarma
        </CardTitle>
        <CardDescription>
          Chunking test sonuçlarını farklı formatlarda indirin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Format Seçin</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {formatOptions.map((option) => (
              <div
                key={option.value}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedFormat === option.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedFormat(option.value)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      selectedFormat === option.value
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {option.icon}
                  </div>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Options */}
        {selectedFormat === "zip" && (
          <div className="space-y-3">
            <label className="text-sm font-medium">İçerik Seçenekleri</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeChunks"
                  checked={includeChunks}
                  onCheckedChange={(checked) => setIncludeChunks(checked as boolean)}
                />
                <label htmlFor="includeChunks" className="text-sm">
                  Chunk dosyalarını dahil et
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMetrics"
                  checked={includeMetrics}
                  onCheckedChange={(checked) => setIncludeMetrics(checked as boolean)}
                />
                <label htmlFor="includeMetrics" className="text-sm">
                  Metrik verilerini dahil et
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeReport"
                  checked={includeReport}
                  onCheckedChange={(checked) => setIncludeReport(checked as boolean)}
                />
                <label htmlFor="includeReport" className="text-sm">
                  Karşılaştırma raporunu dahil et
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {exportStatus === "success" && (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-600">İndirme başarılı!</span>
              </>
            )}
            {exportStatus === "error" && (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-600">İndirme başarısız</span>
              </>
            )}
          </div>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                İndiriliyor...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                İndir ({selectedFormat.toUpperCase()})
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
