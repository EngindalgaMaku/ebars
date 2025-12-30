"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GitBranch, 
  BarChart3, 
  TrendingUp, 
  Clock,
  Layers,
  Zap,
  Target,
  Award,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from "recharts";
import ChunkVisualization from "./ChunkVisualization";

interface ChunkData {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  size: number;
  semanticScore?: number;
  boundaryType?: "natural" | "forced" | "semantic";
  reasoning?: string;
}

interface ChunkingMetrics {
  totalChunks: number;
  averageChunkSize: number;
  chunkSizeVariance: number;
  semanticCoherence: number;
  boundaryQuality: number;
  processingTime: number;
}

interface ComparisonData {
  traditional: {
    chunks: ChunkData[];
    metrics: ChunkingMetrics;
  };
  agentic: {
    chunks: ChunkData[];
    metrics: ChunkingMetrics;
  };
}

interface ChunkingComparisonProps {
  comparison: ComparisonData;
  originalText: string;
  testName: string;
}

const ChunkingComparison: React.FC<ChunkingComparisonProps> = ({
  comparison,
  originalText,
  testName,
}) => {
  const [activeView, setActiveView] = useState<"overview" | "detailed" | "visualization">("overview");
  const [detailedTab, setDetailedTab] = useState("traditional");

  // Calculate comparison metrics
  const calculateComparisonMetrics = () => {
    const traditional = comparison.traditional.metrics;
    const agentic = comparison.agentic.metrics;

    return {
      chunkCountDiff: agentic.totalChunks - traditional.totalChunks,
      avgSizeDiff: agentic.averageChunkSize - traditional.averageChunkSize,
      varianceDiff: agentic.chunkSizeVariance - traditional.chunkSizeVariance,
      coherenceDiff: agentic.semanticCoherence - traditional.semanticCoherence,
      qualityDiff: agentic.boundaryQuality - traditional.boundaryQuality,
      timeDiff: agentic.processingTime - traditional.processingTime,
    };
  };

  const comparisonMetrics = calculateComparisonMetrics();

  // Prepare chart data
  const chartData = [
    {
      metric: "Chunk Sayısı",
      traditional: comparison.traditional.metrics.totalChunks,
      agentic: comparison.agentic.metrics.totalChunks,
    },
    {
      metric: "Ort. Boyut",
      traditional: Math.round(comparison.traditional.metrics.averageChunkSize),
      agentic: Math.round(comparison.agentic.metrics.averageChunkSize),
    },
    {
      metric: "Semantik Uyum",
      traditional: Math.round(comparison.traditional.metrics.semanticCoherence * 100),
      agentic: Math.round(comparison.agentic.metrics.semanticCoherence * 100),
    },
    {
      metric: "Sınır Kalitesi",
      traditional: Math.round(comparison.traditional.metrics.boundaryQuality * 100),
      agentic: Math.round(comparison.agentic.metrics.boundaryQuality * 100),
    },
  ];

  const radarData = [
    {
      metric: "Semantik Uyum",
      traditional: comparison.traditional.metrics.semanticCoherence * 100,
      agentic: comparison.agentic.metrics.semanticCoherence * 100,
    },
    {
      metric: "Sınır Kalitesi",
      traditional: comparison.traditional.metrics.boundaryQuality * 100,
      agentic: comparison.agentic.metrics.boundaryQuality * 100,
    },
    {
      metric: "Tutarlılık",
      traditional: Math.max(0, 100 - (comparison.traditional.metrics.chunkSizeVariance / 100)),
      agentic: Math.max(0, 100 - (comparison.agentic.metrics.chunkSizeVariance / 100)),
    },
    {
      metric: "Verimlilik",
      traditional: Math.max(0, 100 - (comparison.traditional.metrics.processingTime / 10)),
      agentic: Math.max(0, 100 - (comparison.agentic.metrics.processingTime / 10)),
    },
  ];

  const getImprovementIcon = (diff: number) => {
    if (diff > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (diff < 0) return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
    return <ArrowRight className="h-4 w-4 text-gray-400" />;
  };

  const getImprovementColor = (diff: number) => {
    if (diff > 0) return "text-green-600";
    if (diff < 0) return "text-red-600";
    return "text-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GitBranch className="h-6 w-6" />
            Chunking Stratejisi Karşılaştırması
          </h2>
          <p className="text-gray-600 mt-1">{testName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={activeView === "overview" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("overview")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Genel Bakış
          </Button>
          <Button
            variant={activeView === "detailed" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("detailed")}
          >
            <Target className="h-4 w-4 mr-2" />
            Detaylı Analiz
          </Button>
          <Button
            variant={activeView === "visualization" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("visualization")}
          >
            <Layers className="h-4 w-4 mr-2" />
            Görselleştirme
          </Button>
        </div>
      </div>

      {/* Overview */}
      {activeView === "overview" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Chunk Sayısı</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">
                        {comparison.traditional.metrics.totalChunks} → {comparison.agentic.metrics.totalChunks}
                      </span>
                      {getImprovementIcon(comparisonMetrics.chunkCountDiff)}
                    </div>
                  </div>
                  <Layers className="h-8 w-8 text-blue-500" />
                </div>
                <p className={`text-xs mt-1 ${getImprovementColor(comparisonMetrics.chunkCountDiff)}`}>
                  {comparisonMetrics.chunkCountDiff > 0 ? "+" : ""}{comparisonMetrics.chunkCountDiff} chunk farkı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ortalama Boyut</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">
                        {Math.round(comparison.traditional.metrics.averageChunkSize)} → {Math.round(comparison.agentic.metrics.averageChunkSize)}
                      </span>
                      {getImprovementIcon(comparisonMetrics.avgSizeDiff)}
                    </div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-500" />
                </div>
                <p className={`text-xs mt-1 ${getImprovementColor(comparisonMetrics.avgSizeDiff)}`}>
                  {comparisonMetrics.avgSizeDiff > 0 ? "+" : ""}{Math.round(comparisonMetrics.avgSizeDiff)} karakter
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Semantik Uyum</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">
                        {(comparison.traditional.metrics.semanticCoherence * 100).toFixed(1)}% → {(comparison.agentic.metrics.semanticCoherence * 100).toFixed(1)}%
                      </span>
                      {getImprovementIcon(comparisonMetrics.coherenceDiff)}
                    </div>
                  </div>
                  <Zap className="h-8 w-8 text-purple-500" />
                </div>
                <p className={`text-xs mt-1 ${getImprovementColor(comparisonMetrics.coherenceDiff)}`}>
                  {comparisonMetrics.coherenceDiff > 0 ? "+" : ""}{(comparisonMetrics.coherenceDiff * 100).toFixed(1)}% değişim
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">İşlem Süresi</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">
                        {comparison.traditional.metrics.processingTime.toFixed(1)}s → {comparison.agentic.metrics.processingTime.toFixed(1)}s
                      </span>
                      {getImprovementIcon(-comparisonMetrics.timeDiff)} {/* Negative because less time is better */}
                    </div>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
                <p className={`text-xs mt-1 ${getImprovementColor(-comparisonMetrics.timeDiff)}`}>
                  {comparisonMetrics.timeDiff > 0 ? "+" : ""}{comparisonMetrics.timeDiff.toFixed(1)}s fark
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Metrik Karşılaştırması
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="traditional" fill="#94a3b8" name="Geleneksel" />
                    <Bar dataKey="agentic" fill="#3b82f6" name="Agentic" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Kalite Analizi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} />
                    <Radar
                      name="Geleneksel"
                      dataKey="traditional"
                      stroke="#94a3b8"
                      fill="#94a3b8"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Agentic"
                      dataKey="agentic"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Winner Analysis */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Award className="h-5 w-5" />
                Sonuç Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {comparison.agentic.metrics.semanticCoherence > comparison.traditional.metrics.semanticCoherence ? (
                      <CheckCircle className="h-8 w-8 mx-auto" />
                    ) : comparison.agentic.metrics.semanticCoherence < comparison.traditional.metrics.semanticCoherence ? (
                      <XCircle className="h-8 w-8 mx-auto text-red-600" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 mx-auto text-yellow-600" />
                    )}
                  </div>
                  <div className="text-sm font-medium">Semantik Uyum</div>
                  <div className="text-xs text-gray-600">
                    {comparison.agentic.metrics.semanticCoherence > comparison.traditional.metrics.semanticCoherence 
                      ? "Agentic Kazandı" 
                      : comparison.agentic.metrics.semanticCoherence < comparison.traditional.metrics.semanticCoherence
                      ? "Geleneksel Kazandı"
                      : "Berabere"}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {comparison.agentic.metrics.boundaryQuality > comparison.traditional.metrics.boundaryQuality ? (
                      <CheckCircle className="h-8 w-8 mx-auto" />
                    ) : comparison.agentic.metrics.boundaryQuality < comparison.traditional.metrics.boundaryQuality ? (
                      <XCircle className="h-8 w-8 mx-auto text-red-600" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 mx-auto text-yellow-600" />
                    )}
                  </div>
                  <div className="text-sm font-medium">Sınır Kalitesi</div>
                  <div className="text-xs text-gray-600">
                    {comparison.agentic.metrics.boundaryQuality > comparison.traditional.metrics.boundaryQuality 
                      ? "Agentic Kazandı" 
                      : comparison.agentic.metrics.boundaryQuality < comparison.traditional.metrics.boundaryQuality
                      ? "Geleneksel Kazandı"
                      : "Berabere"}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {comparison.agentic.metrics.processingTime < comparison.traditional.metrics.processingTime ? (
                      <CheckCircle className="h-8 w-8 mx-auto" />
                    ) : comparison.agentic.metrics.processingTime > comparison.traditional.metrics.processingTime ? (
                      <XCircle className="h-8 w-8 mx-auto text-red-600" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 mx-auto text-yellow-600" />
                    )}
                  </div>
                  <div className="text-sm font-medium">Hız</div>
                  <div className="text-xs text-gray-600">
                    {comparison.agentic.metrics.processingTime < comparison.traditional.metrics.processingTime 
                      ? "Agentic Kazandı" 
                      : comparison.agentic.metrics.processingTime > comparison.traditional.metrics.processingTime
                      ? "Geleneksel Kazandı"
                      : "Berabere"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analysis */}
      {activeView === "detailed" && (
        <div className="space-y-6">
          <Tabs value={detailedTab} onValueChange={setDetailedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="traditional">Geleneksel Chunking</TabsTrigger>
              <TabsTrigger value="agentic">Agentic Chunking</TabsTrigger>
            </TabsList>
            
            <TabsContent value="traditional" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Geleneksel Chunking Detayları</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Toplam Chunk</div>
                      <div className="text-lg font-semibold">{comparison.traditional.metrics.totalChunks}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Ortalama Boyut</div>
                      <div className="text-lg font-semibold">{Math.round(comparison.traditional.metrics.averageChunkSize)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Varyans</div>
                      <div className="text-lg font-semibold">{Math.round(comparison.traditional.metrics.chunkSizeVariance)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">İşlem Süresi</div>
                      <div className="text-lg font-semibold">{comparison.traditional.metrics.processingTime.toFixed(1)}s</div>
                    </div>
                  </div>
                  <ChunkVisualization
                    chunks={comparison.traditional.chunks}
                    originalText={originalText}
                    strategy="Geleneksel"
                    showMetrics={false}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="agentic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Agentic Chunking Detayları</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Toplam Chunk</div>
                      <div className="text-lg font-semibold">{comparison.agentic.metrics.totalChunks}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Ortalama Boyut</div>
                      <div className="text-lg font-semibold">{Math.round(comparison.agentic.metrics.averageChunkSize)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Varyans</div>
                      <div className="text-lg font-semibold">{Math.round(comparison.agentic.metrics.chunkSizeVariance)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">İşlem Süresi</div>
                      <div className="text-lg font-semibold">{comparison.agentic.metrics.processingTime.toFixed(1)}s</div>
                    </div>
                  </div>
                  <ChunkVisualization
                    chunks={comparison.agentic.chunks}
                    originalText={originalText}
                    strategy="Agentic"
                    showMetrics={false}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Visualization */}
      {activeView === "visualization" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Geleneksel Chunking</CardTitle>
              </CardHeader>
              <CardContent>
                <ChunkVisualization
                  chunks={comparison.traditional.chunks}
                  originalText={originalText}
                  strategy="Geleneksel"
                  showMetrics={false}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agentic Chunking</CardTitle>
              </CardHeader>
              <CardContent>
                <ChunkVisualization
                  chunks={comparison.agentic.chunks}
                  originalText={originalText}
                  strategy="Agentic"
                  showMetrics={false}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChunkingComparison;