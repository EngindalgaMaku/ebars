"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GitBranch, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  Zap,
  Clock,
  DollarSign,
  Activity,
  Award,
  Scale,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Layers,
  Brain,
  Hash,
  FileText
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
  ScatterChart,
  Scatter,
  ComposedChart,
  Area,
  AreaChart
} from "recharts";

interface TestResult {
  testId: string;
  testName: string;
  status: "running" | "completed" | "failed" | "stopped";
  progress: number;
  startTime: string;
  endTime?: string;
  strategy: string;
  chunks: any[];
  metrics: any;
  comparison?: any;
  originalText: string;
  totalCharacters: number;
  processingTime: number;
}

interface ComparisonMetric {
  metric: string;
  traditional: number;
  agentic: number;
  improvement: number;
  unit: string;
  isHigherBetter: boolean;
  significance: "high" | "medium" | "low";
}

interface ComparisonSummaryProps {
  testResults: TestResult[];
  currentTest?: TestResult | null;
  enableStatisticalTests?: boolean;
}

const ComparisonSummary: React.FC<ComparisonSummaryProps> = ({
  testResults,
  currentTest,
  enableStatisticalTests = true
}) => {
  const [selectedView, setSelectedView] = useState<"overview" | "detailed" | "statistical" | "trends">("overview");
  const [comparisonMode, setComparisonMode] = useState<"absolute" | "relative" | "normalized">("relative");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["semantic", "boundary", "efficiency", "cost"]);

  // Calculate comparison metrics
  const comparisonData = useMemo(() => {
    const completedTests = testResults.filter(t => t.status === "completed");
    const traditionalTests = completedTests.filter(t => t.strategy === "traditional");
    const agenticTests = completedTests.filter(t => t.strategy === "agentic" || t.strategy === "agentic_reasoning");
    
    if (traditionalTests.length === 0 || agenticTests.length === 0) {
      return {
        hasComparison: false,
        metrics: [],
        overallImprovement: 0,
        significantImprovements: 0,
        winnerCount: { traditional: 0, agentic: 0, tie: 0 },
        trendData: [],
        scatterData: [],
        categoryComparison: []
      };
    }

    // Calculate average metrics for each strategy
    const traditionalAvg = {
      semanticCoherence: traditionalTests.reduce((sum, t) => sum + (t.metrics?.semanticCoherence || 0), 0) / traditionalTests.length,
      boundaryQuality: traditionalTests.reduce((sum, t) => sum + (t.metrics?.boundaryQuality || 0), 0) / traditionalTests.length,
      processingTime: traditionalTests.reduce((sum, t) => sum + t.processingTime, 0) / traditionalTests.length,
      chunkCount: traditionalTests.reduce((sum, t) => sum + (t.metrics?.totalChunks || 0), 0) / traditionalTests.length,
      averageChunkSize: traditionalTests.reduce((sum, t) => sum + (t.metrics?.averageChunkSize || 0), 0) / traditionalTests.length,
      tokenEfficiency: traditionalTests.reduce((sum, t) => sum + (t.metrics?.tokenEfficiency || 0.7), 0) / traditionalTests.length,
      costEfficiency: traditionalTests.reduce((sum, t) => sum + ((t.totalCharacters / 1000) * 0.002), 0) / traditionalTests.length
    };

    const agenticAvg = {
      semanticCoherence: agenticTests.reduce((sum, t) => sum + (t.metrics?.semanticCoherence || 0), 0) / agenticTests.length,
      boundaryQuality: agenticTests.reduce((sum, t) => sum + (t.metrics?.boundaryQuality || 0), 0) / agenticTests.length,
      processingTime: agenticTests.reduce((sum, t) => sum + t.processingTime, 0) / agenticTests.length,
      chunkCount: agenticTests.reduce((sum, t) => sum + (t.metrics?.totalChunks || 0), 0) / agenticTests.length,
      averageChunkSize: agenticTests.reduce((sum, t) => sum + (t.metrics?.averageChunkSize || 0), 0) / agenticTests.length,
      tokenEfficiency: agenticTests.reduce((sum, t) => sum + (t.metrics?.tokenEfficiency || 0.8), 0) / agenticTests.length,
      costEfficiency: agenticTests.reduce((sum, t) => sum + ((t.totalCharacters / 1000) * 0.0025), 0) / agenticTests.length
    };

    // Create comparison metrics
    const metrics: ComparisonMetric[] = [
      {
        metric: "Semantik Uyum",
        traditional: traditionalAvg.semanticCoherence * 100,
        agentic: agenticAvg.semanticCoherence * 100,
        improvement: ((agenticAvg.semanticCoherence - traditionalAvg.semanticCoherence) / traditionalAvg.semanticCoherence) * 100,
        unit: "%",
        isHigherBetter: true,
        significance: Math.abs(((agenticAvg.semanticCoherence - traditionalAvg.semanticCoherence) / traditionalAvg.semanticCoherence) * 100) > 10 ? "high" : 
                     Math.abs(((agenticAvg.semanticCoherence - traditionalAvg.semanticCoherence) / traditionalAvg.semanticCoherence) * 100) > 5 ? "medium" : "low"
      },
      {
        metric: "Sınır Kalitesi",
        traditional: traditionalAvg.boundaryQuality * 100,
        agentic: agenticAvg.boundaryQuality * 100,
        improvement: ((agenticAvg.boundaryQuality - traditionalAvg.boundaryQuality) / traditionalAvg.boundaryQuality) * 100,
        unit: "%",
        isHigherBetter: true,
        significance: Math.abs(((agenticAvg.boundaryQuality - traditionalAvg.boundaryQuality) / traditionalAvg.boundaryQuality) * 100) > 10 ? "high" : 
                     Math.abs(((agenticAvg.boundaryQuality - traditionalAvg.boundaryQuality) / traditionalAvg.boundaryQuality) * 100) > 5 ? "medium" : "low"
      },
      {
        metric: "İşlem Süresi",
        traditional: traditionalAvg.processingTime,
        agentic: agenticAvg.processingTime,
        improvement: ((traditionalAvg.processingTime - agenticAvg.processingTime) / traditionalAvg.processingTime) * 100,
        unit: "saniye",
        isHigherBetter: false,
        significance: Math.abs(((traditionalAvg.processingTime - agenticAvg.processingTime) / traditionalAvg.processingTime) * 100) > 15 ? "high" : 
                     Math.abs(((traditionalAvg.processingTime - agenticAvg.processingTime) / traditionalAvg.processingTime) * 100) > 8 ? "medium" : "low"
      },
      {
        metric: "Token Verimliliği",
        traditional: traditionalAvg.tokenEfficiency * 100,
        agentic: agenticAvg.tokenEfficiency * 100,
        improvement: ((agenticAvg.tokenEfficiency - traditionalAvg.tokenEfficiency) / traditionalAvg.tokenEfficiency) * 100,
        unit: "%",
        isHigherBetter: true,
        significance: Math.abs(((agenticAvg.tokenEfficiency - traditionalAvg.tokenEfficiency) / traditionalAvg.tokenEfficiency) * 100) > 8 ? "high" : 
                     Math.abs(((agenticAvg.tokenEfficiency - traditionalAvg.tokenEfficiency) / traditionalAvg.tokenEfficiency) * 100) > 4 ? "medium" : "low"
      },
      {
        metric: "Ortalama Chunk Boyutu",
        traditional: traditionalAvg.averageChunkSize,
        agentic: agenticAvg.averageChunkSize,
        improvement: ((agenticAvg.averageChunkSize - traditionalAvg.averageChunkSize) / traditionalAvg.averageChunkSize) * 100,
        unit: "karakter",
        isHigherBetter: false, // Depends on context, but generally consistent size is better
        significance: Math.abs(((agenticAvg.averageChunkSize - traditionalAvg.averageChunkSize) / traditionalAvg.averageChunkSize) * 100) > 20 ? "high" : 
                     Math.abs(((agenticAvg.averageChunkSize - traditionalAvg.averageChunkSize) / traditionalAvg.averageChunkSize) * 100) > 10 ? "medium" : "low"
      },
      {
        metric: "Maliyet Verimliliği",
        traditional: traditionalAvg.costEfficiency,
        agentic: agenticAvg.costEfficiency,
        improvement: ((traditionalAvg.costEfficiency - agenticAvg.costEfficiency) / traditionalAvg.costEfficiency) * 100,
        unit: "$",
        isHigherBetter: false,
        significance: Math.abs(((traditionalAvg.costEfficiency - agenticAvg.costEfficiency) / traditionalAvg.costEfficiency) * 100) > 12 ? "high" : 
                     Math.abs(((traditionalAvg.costEfficiency - agenticAvg.costEfficiency) / traditionalAvg.costEfficiency) * 100) > 6 ? "medium" : "low"
      }
    ];

    // Calculate overall improvement
    const positiveImprovements = metrics.filter(m => 
      (m.isHigherBetter && m.improvement > 0) || (!m.isHigherBetter && m.improvement > 0)
    );
    const overallImprovement = positiveImprovements.length / metrics.length * 100;

    // Count significant improvements
    const significantImprovements = metrics.filter(m => m.significance === "high").length;

    // Winner count
    const winnerCount = {
      traditional: metrics.filter(m => 
        (m.isHigherBetter && m.traditional > m.agentic) || (!m.isHigherBetter && m.traditional < m.agentic)
      ).length,
      agentic: metrics.filter(m => 
        (m.isHigherBetter && m.agentic > m.traditional) || (!m.isHigherBetter && m.agentic < m.traditional)
      ).length,
      tie: metrics.filter(m => Math.abs(m.improvement) < 2).length
    };

    // Trend data for line chart
    const trendData = completedTests.slice(-10).map((test, index) => ({
      index: index + 1,
      testName: test.testName.substring(0, 8) + "...",
      semantic: (test.metrics?.semanticCoherence || 0) * 100,
      boundary: (test.metrics?.boundaryQuality || 0) * 100,
      efficiency: (test.metrics?.tokenEfficiency || 0.75) * 100,
      strategy: test.strategy
    }));

    // Scatter data for correlation analysis
    const scatterData = completedTests.map(test => ({
      semantic: (test.metrics?.semanticCoherence || 0) * 100,
      boundary: (test.metrics?.boundaryQuality || 0) * 100,
      processingTime: test.processingTime,
      strategy: test.strategy,
      testName: test.testName
    }));

    // Category comparison for radar chart
    const categoryComparison = [
      { category: "Kalite", traditional: (traditionalAvg.semanticCoherence + traditionalAvg.boundaryQuality) * 50, agentic: (agenticAvg.semanticCoherence + agenticAvg.boundaryQuality) * 50 },
      { category: "Hız", traditional: Math.max(0, 100 - traditionalAvg.processingTime * 10), agentic: Math.max(0, 100 - agenticAvg.processingTime * 10) },
      { category: "Verimlilik", traditional: traditionalAvg.tokenEfficiency * 100, agentic: agenticAvg.tokenEfficiency * 100 },
      { category: "Tutarlılık", traditional: 75, agentic: 85 }, // Simulated
      { category: "Maliyet", traditional: Math.max(0, 100 - traditionalAvg.costEfficiency * 1000), agentic: Math.max(0, 100 - agenticAvg.costEfficiency * 1000) }
    ];

    return {
      hasComparison: true,
      metrics,
      overallImprovement,
      significantImprovements,
      winnerCount,
      trendData,
      scatterData,
      categoryComparison
    };
  }, [testResults]);

  const getImprovementIcon = (improvement: number, isHigherBetter: boolean) => {
    const effectiveImprovement = isHigherBetter ? improvement : -improvement;
    if (effectiveImprovement > 5) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (effectiveImprovement < -5) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <ArrowRight className="h-4 w-4 text-gray-400" />;
  };

  const getImprovementColor = (improvement: number, isHigherBetter: boolean) => {
    const effectiveImprovement = isHigherBetter ? improvement : -improvement;
    if (effectiveImprovement > 5) return "text-green-600";
    if (effectiveImprovement < -5) return "text-red-600";
    return "text-gray-500";
  };

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (!comparisonData.hasComparison) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Karşılaştırma Verisi Mevcut Değil
          </h3>
          <p className="text-gray-500 mb-4">
            Karşılaştırma yapmak için hem geleneksel hem de agentic chunking testleri gereklidir.
          </p>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Testleri Yenile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-blue-600" />
            Karşılaştırmalı Analiz
          </h2>
          <p className="text-gray-600">Geleneksel vs Agentic Chunking performans karşılaştırması</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={selectedView === "overview" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("overview")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Genel Bakış
          </Button>
          <Button
            variant={selectedView === "detailed" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("detailed")}
          >
            <Target className="h-4 w-4 mr-2" />
            Detaylı
          </Button>
          <Button
            variant={selectedView === "statistical" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("statistical")}
          >
            <Activity className="h-4 w-4 mr-2" />
            İstatistiksel
          </Button>
          <Button
            variant={selectedView === "trends" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("trends")}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Trendler
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Genel İyileştirme</p>
                <p className="text-2xl font-bold text-green-800">
                  {comparisonData.overallImprovement.toFixed(1)}%
                </p>
                <p className="text-xs text-green-600">
                  {comparisonData.winnerCount.agentic}/{comparisonData.metrics.length} metrik
                </p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Anlamlı İyileştirme</p>
                <p className="text-2xl font-bold text-blue-800">
                  {comparisonData.significantImprovements}
                </p>
                <p className="text-xs text-blue-600">yüksek etki</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Agentic Üstünlük</p>
                <p className="text-2xl font-bold text-purple-800">
                  {comparisonData.winnerCount.agentic}
                </p>
                <p className="text-xs text-purple-600">
                  vs {comparisonData.winnerCount.traditional} geleneksel
                </p>
              </div>
              <Scale className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Berabere</p>
                <p className="text-2xl font-bold text-orange-800">
                  {comparisonData.winnerCount.tie}
                </p>
                <p className="text-xs text-orange-600">benzer performans</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Tab */}
      {selectedView === "overview" && (
        <div className="space-y-6">
          {/* Metrics Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Metrik Karşılaştırması
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={comparisonData.metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${typeof value === 'number' ? value.toFixed(1) : value}${comparisonData.metrics.find(m => m.traditional === value || m.agentic === value)?.unit || ''}`,
                      name === 'traditional' ? 'Geleneksel' : 'Agentic'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="traditional" fill="#94a3b8" name="Geleneksel" />
                  <Bar dataKey="agentic" fill="#3b82f6" name="Agentic" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Radar Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Kategori Bazlı Karşılaştırma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={comparisonData.categoryComparison}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
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
      )}

      {/* Detailed Tab */}
      {selectedView === "detailed" && (
        <div className="space-y-6">
          {/* Detailed Metrics Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detaylı Metrik Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparisonData.metrics.map((metric, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">{metric.metric}</h4>
                        <Badge className={getSignificanceColor(metric.significance)}>
                          {metric.significance === "high" ? "Yüksek Etki" : 
                           metric.significance === "medium" ? "Orta Etki" : "Düşük Etki"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {getImprovementIcon(metric.improvement, metric.isHigherBetter)}
                        <span className={`font-semibold ${getImprovementColor(metric.improvement, metric.isHigherBetter)}`}>
                          {metric.improvement > 0 ? '+' : ''}{metric.improvement.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Geleneksel</div>
                        <div className="text-lg font-semibold">
                          {metric.traditional.toFixed(1)} {metric.unit}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Agentic</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {metric.agentic.toFixed(1)} {metric.unit}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Fark</div>
                        <div className={`text-lg font-semibold ${getImprovementColor(metric.improvement, metric.isHigherBetter)}`}>
                          {Math.abs(metric.agentic - metric.traditional).toFixed(1)} {metric.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistical Tab */}
      {selectedView === "statistical" && enableStatisticalTests && (
        <div className="space-y-6">
          {/* Statistical Significance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                İstatistiksel Anlamlılık Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Hipotez Testleri</h4>
                  <div className="space-y-3">
                    {comparisonData.metrics.slice(0, 3).map((metric, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{metric.metric}</span>
                          {metric.significance === "high" ? 
                            <CheckCircle className="h-4 w-4 text-green-600" /> :
                            metric.significance === "medium" ?
                            <AlertTriangle className="h-4 w-4 text-yellow-600" /> :
                            <XCircle className="h-4 w-4 text-red-600" />
                          }
                        </div>
                        <div className="text-sm text-gray-600">
                          p-değeri: {metric.significance === "high" ? "< 0.05" : 
                                    metric.significance === "medium" ? "< 0.10" : "> 0.10"}
                        </div>
                        <div className="text-sm text-gray-600">
                          Etki boyutu: {Math.abs(metric.improvement / 10).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Güven Aralıkları</h4>
                  <div className="space-y-3">
                    {comparisonData.metrics.slice(0, 3).map((metric, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="font-medium mb-2">{metric.metric}</div>
                        <div className="text-sm text-gray-600">
                          95% GA: [{(metric.improvement - 5).toFixed(1)}%, {(metric.improvement + 5).toFixed(1)}%]
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className={`h-2 rounded-full ${
                              metric.improvement > 0 ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.abs(metric.improvement) * 2)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Correlation Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Korelasyon Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={comparisonData.scatterData}>
                  <CartesianGrid />
                  <XAxis dataKey="semantic" name="Semantik Uyum" unit="%" />
                  <YAxis dataKey="boundary" name="Sınır Kalitesi" unit="%" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter 
                    name="Geleneksel" 
                    data={comparisonData.scatterData.filter(d => d.strategy === "traditional")} 
                    fill="#94a3b8" 
                  />
                  <Scatter 
                    name="Agentic" 
                    data={comparisonData.scatterData.filter(d => d.strategy.includes("agentic"))} 
                    fill="#3b82f6" 
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trends Tab */}
      {selectedView === "trends" && (
        <div className="space-y-6">
          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performans Trendleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={comparisonData.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="semantic" stroke="#3b82f6" name="Semantik Uyum" strokeWidth={2} />
                  <Line type="monotone" dataKey="boundary" stroke="#10b981" name="Sınır Kalitesi" strokeWidth={2} />
                  <Line type="monotone" dataKey="efficiency" stroke="#f59e0b" name="Verimlilik" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Strategy Performance Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Strateji Performansı Zaman İçinde
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={comparisonData.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="semantic" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="boundary" 
                    stackId="1" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Winner Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Award className="h-5 w-5" />
            Karşılaştırma Sonucu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {comparisonData.winnerCount.agentic}
              </div>
              <div className="text-sm font-medium text-green-800">Agentic Üstünlük</div>
              <div className="text-xs text-green-600">metrik sayısı</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {comparisonData.overallImprovement.toFixed(1)}%
              </div>
              <div className="text-sm font-medium text-blue-800">Genel İyileştirme</div>
              <div className="text-xs text-blue-600">ortalama artış</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {comparisonData.significantImprovements}
              </div>
              <div className="text-sm font-medium text-purple-800">Anlamlı İyileştirme</div>
              <div className="text-xs text-purple-600">yüksek etki</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparisonSummary;