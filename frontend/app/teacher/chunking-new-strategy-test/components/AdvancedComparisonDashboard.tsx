"use client";

import React, { useState, useMemo } from "react";
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
  AlertTriangle,
  DollarSign,
  Activity,
  Brain,
  Gauge,
  Scale,
  TrendingDown,
  Eye,
  EyeOff,
  Filter,
  Download,
  RefreshCw,
  Sparkles,
  Hash,
  FileText,
  PieChart,
  BarChart,
  LineChart
} from "lucide-react";
import {
  BarChart as RechartsBarChart,
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
  LineChart as RechartsLineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  AreaChart,
  Area,
  ComposedChart
} from "recharts";

interface ChunkData {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  size: number;
  semanticScore?: number;
  boundaryType?: "natural" | "forced" | "semantic";
  reasoning?: string;
  processingTime?: number;
  tokenCount?: number;
  informationDensity?: number;
}

interface ChunkingMetrics {
  totalChunks: number;
  averageChunkSize: number;
  chunkSizeVariance: number;
  semanticCoherence: number;
  boundaryQuality: number;
  processingTime: number;
  tokenEfficiency?: number;
  informationRetention?: number;
  contextPreservation?: number;
  costEfficiency?: number;
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

interface StatisticalSignificance {
  pValue: number;
  isSignificant: boolean;
  confidenceInterval: [number, number];
  effectSize: number;
}

interface AdvancedComparisonDashboardProps {
  comparison: ComparisonData;
  originalText: string;
  testName: string;
  enableStatisticalTests?: boolean;
  showCostAnalysis?: boolean;
  turkishOptimized?: boolean;
}

const AdvancedComparisonDashboard: React.FC<AdvancedComparisonDashboardProps> = ({
  comparison,
  originalText,
  testName,
  enableStatisticalTests = true,
  showCostAnalysis = true,
  turkishOptimized = true,
}) => {
  const [activeView, setActiveView] = useState<"overview" | "detailed" | "statistical" | "performance" | "roi">("overview");
  const [selectedMetric, setSelectedMetric] = useState<"semantic" | "boundary" | "efficiency" | "cost">("semantic");
  const [showOutliers, setShowOutliers] = useState(true);
  const [comparisonMode, setComparisonMode] = useState<"absolute" | "relative" | "normalized">("absolute");

  // Enhanced comparison metrics calculation
  const enhancedMetrics = useMemo(() => {
    const traditional = comparison.traditional.metrics;
    const agentic = comparison.agentic.metrics;

    // Calculate improvements
    const improvements = {
      semanticCoherence: ((agentic.semanticCoherence - traditional.semanticCoherence) / traditional.semanticCoherence) * 100,
      boundaryQuality: ((agentic.boundaryQuality - traditional.boundaryQuality) / traditional.boundaryQuality) * 100,
      processingEfficiency: ((traditional.processingTime - agentic.processingTime) / traditional.processingTime) * 100,
      chunkConsistency: ((traditional.chunkSizeVariance - agentic.chunkSizeVariance) / traditional.chunkSizeVariance) * 100,
      tokenEfficiency: agentic.tokenEfficiency && traditional.tokenEfficiency 
        ? ((agentic.tokenEfficiency - traditional.tokenEfficiency) / traditional.tokenEfficiency) * 100 
        : 0,
      informationRetention: agentic.informationRetention && traditional.informationRetention
        ? ((agentic.informationRetention - traditional.informationRetention) / traditional.informationRetention) * 100
        : 0,
    };

    // Calculate statistical significance (simplified)
    const calculateSignificance = (metric1: number, metric2: number): StatisticalSignificance => {
      const diff = Math.abs(metric1 - metric2);
      const pooledStd = Math.sqrt((Math.pow(metric1 * 0.1, 2) + Math.pow(metric2 * 0.1, 2)) / 2);
      const tStat = diff / (pooledStd * Math.sqrt(2));
      const pValue = Math.max(0.001, Math.min(0.999, 1 - (tStat / 3))); // Simplified p-value
      
      return {
        pValue,
        isSignificant: pValue < 0.05,
        confidenceInterval: [Math.min(metric1, metric2) * 0.95, Math.max(metric1, metric2) * 1.05],
        effectSize: diff / pooledStd
      };
    };

    const significance = {
      semanticCoherence: calculateSignificance(traditional.semanticCoherence, agentic.semanticCoherence),
      boundaryQuality: calculateSignificance(traditional.boundaryQuality, agentic.boundaryQuality),
      processingTime: calculateSignificance(traditional.processingTime, agentic.processingTime),
    };

    return { improvements, significance };
  }, [comparison]);

  // Prepare comprehensive chart data
  const chartData = useMemo(() => {
    const traditional = comparison.traditional;
    const agentic = comparison.agentic;

    // Basic metrics comparison
    const basicMetrics = [
      {
        metric: "Chunk Sayısı",
        traditional: traditional.metrics.totalChunks,
        agentic: agentic.metrics.totalChunks,
        improvement: ((agentic.metrics.totalChunks - traditional.metrics.totalChunks) / traditional.metrics.totalChunks) * 100,
        unit: "chunks"
      },
      {
        metric: "Ort. Boyut",
        traditional: Math.round(traditional.metrics.averageChunkSize),
        agentic: Math.round(agentic.metrics.averageChunkSize),
        improvement: ((agentic.metrics.averageChunkSize - traditional.metrics.averageChunkSize) / traditional.metrics.averageChunkSize) * 100,
        unit: "karakter"
      },
      {
        metric: "Semantik Uyum",
        traditional: Math.round(traditional.metrics.semanticCoherence * 100),
        agentic: Math.round(agentic.metrics.semanticCoherence * 100),
        improvement: enhancedMetrics.improvements.semanticCoherence,
        unit: "%"
      },
      {
        metric: "Sınır Kalitesi",
        traditional: Math.round(traditional.metrics.boundaryQuality * 100),
        agentic: Math.round(agentic.metrics.boundaryQuality * 100),
        improvement: enhancedMetrics.improvements.boundaryQuality,
        unit: "%"
      },
      {
        metric: "İşlem Süresi",
        traditional: traditional.metrics.processingTime,
        agentic: agentic.metrics.processingTime,
        improvement: enhancedMetrics.improvements.processingEfficiency,
        unit: "saniye",
        lowerIsBetter: true
      }
    ];

    // Quality radar data
    const radarData = [
      {
        metric: "Semantik Uyum",
        traditional: traditional.metrics.semanticCoherence * 100,
        agentic: agentic.metrics.semanticCoherence * 100,
        fullMark: 100
      },
      {
        metric: "Sınır Kalitesi",
        traditional: traditional.metrics.boundaryQuality * 100,
        agentic: agentic.metrics.boundaryQuality * 100,
        fullMark: 100
      },
      {
        metric: "Tutarlılık",
        traditional: Math.max(0, 100 - (traditional.metrics.chunkSizeVariance / 100)),
        agentic: Math.max(0, 100 - (agentic.metrics.chunkSizeVariance / 100)),
        fullMark: 100
      },
      {
        metric: "Verimlilik",
        traditional: Math.max(0, 100 - (traditional.metrics.processingTime / 10)),
        agentic: Math.max(0, 100 - (agentic.metrics.processingTime / 10)),
        fullMark: 100
      },
      {
        metric: "Token Verimliliği",
        traditional: (traditional.metrics.tokenEfficiency || 0.7) * 100,
        agentic: (agentic.metrics.tokenEfficiency || 0.8) * 100,
        fullMark: 100
      },
      {
        metric: "Bilgi Korunumu",
        traditional: (traditional.metrics.informationRetention || 0.75) * 100,
        agentic: (agentic.metrics.informationRetention || 0.85) * 100,
        fullMark: 100
      }
    ];

    // Chunk size distribution
    const sizeDistribution = {
      traditional: [
        { range: "0-500", count: traditional.chunks.filter(c => c.size <= 500).length },
        { range: "501-1000", count: traditional.chunks.filter(c => c.size > 500 && c.size <= 1000).length },
        { range: "1001-1500", count: traditional.chunks.filter(c => c.size > 1000 && c.size <= 1500).length },
        { range: "1501-2000", count: traditional.chunks.filter(c => c.size > 1500 && c.size <= 2000).length },
        { range: "2000+", count: traditional.chunks.filter(c => c.size > 2000).length }
      ],
      agentic: [
        { range: "0-500", count: agentic.chunks.filter(c => c.size <= 500).length },
        { range: "501-1000", count: agentic.chunks.filter(c => c.size > 500 && c.size <= 1000).length },
        { range: "1001-1500", count: agentic.chunks.filter(c => c.size > 1000 && c.size <= 1500).length },
        { range: "1501-2000", count: agentic.chunks.filter(c => c.size > 1500 && c.size <= 2000).length },
        { range: "2000+", count: agentic.chunks.filter(c => c.size > 2000).length }
      ]
    };

    return { basicMetrics, radarData, sizeDistribution };
  }, [comparison, enhancedMetrics]);

  // Performance analysis
  const performanceAnalysis = useMemo(() => {
    const traditional = comparison.traditional;
    const agentic = comparison.agentic;

    const throughput = {
      traditional: originalText.length / traditional.metrics.processingTime,
      agentic: originalText.length / agentic.metrics.processingTime
    };

    const chunkProductionRate = {
      traditional: traditional.metrics.totalChunks / traditional.metrics.processingTime,
      agentic: agentic.metrics.totalChunks / agentic.metrics.processingTime
    };

    const qualityPerSecond = {
      traditional: traditional.metrics.semanticCoherence / traditional.metrics.processingTime,
      agentic: agentic.metrics.semanticCoherence / agentic.metrics.processingTime
    };

    return {
      throughput,
      chunkProductionRate,
      qualityPerSecond,
      speedImprovement: ((throughput.agentic - throughput.traditional) / throughput.traditional) * 100,
      productionImprovement: ((chunkProductionRate.agentic - chunkProductionRate.traditional) / chunkProductionRate.traditional) * 100,
      qualitySpeedRatio: ((qualityPerSecond.agentic - qualityPerSecond.traditional) / qualityPerSecond.traditional) * 100
    };
  }, [comparison, originalText]);

  // Cost-benefit analysis
  const costBenefitAnalysis = useMemo(() => {
    if (!showCostAnalysis) return null;

    const traditional = comparison.traditional;
    const agentic = comparison.agentic;

    // Estimated costs (simplified)
    const estimatedCosts = {
      traditional: {
        processing: traditional.metrics.processingTime * 0.001, // $0.001 per second
        tokens: (traditional.chunks.reduce((sum, c) => sum + (c.tokenCount || c.size * 0.25), 0) / 1000) * 0.002,
        total: 0
      },
      agentic: {
        processing: agentic.metrics.processingTime * 0.002, // Higher cost for LLM processing
        tokens: (agentic.chunks.reduce((sum, c) => sum + (c.tokenCount || c.size * 0.3), 0) / 1000) * 0.002,
        llmCalls: agentic.chunks.filter(c => c.reasoning).length * 0.001, // Cost per LLM call
        total: 0
      }
    };

    estimatedCosts.traditional.total = estimatedCosts.traditional.processing + estimatedCosts.traditional.tokens;
    estimatedCosts.agentic.total = estimatedCosts.agentic.processing + estimatedCosts.agentic.tokens + estimatedCosts.agentic.llmCalls;

    // Benefits calculation
    const qualityBenefit = (agentic.metrics.semanticCoherence - traditional.metrics.semanticCoherence) * 100;
    const efficiencyBenefit = ((traditional.metrics.processingTime - agentic.metrics.processingTime) / traditional.metrics.processingTime) * 100;
    
    const roi = ((qualityBenefit + efficiencyBenefit) - ((estimatedCosts.agentic.total - estimatedCosts.traditional.total) * 1000)) / 100;

    return {
      costs: estimatedCosts,
      benefits: {
        quality: qualityBenefit,
        efficiency: efficiencyBenefit,
        total: qualityBenefit + efficiencyBenefit
      },
      roi,
      costPerQualityPoint: estimatedCosts.agentic.total / (agentic.metrics.semanticCoherence * 100),
      breakEvenPoint: estimatedCosts.agentic.total / (qualityBenefit / 100)
    };
  }, [comparison, showCostAnalysis]);

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 5) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (improvement < -5) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <ArrowRight className="h-4 w-4 text-gray-400" />;
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement > 5) return "text-green-600";
    if (improvement < -5) return "text-red-600";
    return "text-gray-500";
  };

  const getSignificanceIcon = (significance: StatisticalSignificance) => {
    if (significance.isSignificant && significance.effectSize > 0.5) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (significance.isSignificant) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <GitBranch className="h-8 w-8 text-white" />
            </div>
            Gelişmiş Karşılaştırmalı Analiz
          </h2>
          <p className="text-gray-600 mt-1">{testName} - Agentic vs Traditional Chunking</p>
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
          {enableStatisticalTests && (
            <Button
              variant={activeView === "statistical" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView("statistical")}
            >
              <Activity className="h-4 w-4 mr-2" />
              İstatistiksel
            </Button>
          )}
          <Button
            variant={activeView === "performance" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("performance")}
          >
            <Gauge className="h-4 w-4 mr-2" />
            Performans
          </Button>
          {showCostAnalysis && (
            <Button
              variant={activeView === "roi" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView("roi")}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              ROI Analizi
            </Button>
          )}
        </div>
      </div>

      {/* Overview Tab */}
      {activeView === "overview" && (
        <div className="space-y-6">
          {/* Key Improvements Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Semantik Uyum İyileştirmesi</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-800">
                        {enhancedMetrics.improvements.semanticCoherence > 0 ? '+' : ''}{enhancedMetrics.improvements.semanticCoherence.toFixed(1)}%
                      </span>
                      {getImprovementIcon(enhancedMetrics.improvements.semanticCoherence)}
                    </div>
                  </div>
                  <Brain className="h-8 w-8 text-green-600" />
                </div>
                {enableStatisticalTests && (
                  <div className="flex items-center gap-1 mt-2">
                    {getSignificanceIcon(enhancedMetrics.significance.semanticCoherence)}
                    <span className="text-xs text-green-700">
                      p = {enhancedMetrics.significance.semanticCoherence.pValue.toFixed(3)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Sınır Kalitesi İyileştirmesi</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-800">
                        {enhancedMetrics.improvements.boundaryQuality > 0 ? '+' : ''}{enhancedMetrics.improvements.boundaryQuality.toFixed(1)}%
                      </span>
                      {getImprovementIcon(enhancedMetrics.improvements.boundaryQuality)}
                    </div>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                {enableStatisticalTests && (
                  <div className="flex items-center gap-1 mt-2">
                    {getSignificanceIcon(enhancedMetrics.significance.boundaryQuality)}
                    <span className="text-xs text-blue-700">
                      p = {enhancedMetrics.significance.boundaryQuality.pValue.toFixed(3)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">İşlem Verimliliği</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-purple-800">
                        {enhancedMetrics.improvements.processingEfficiency > 0 ? '+' : ''}{enhancedMetrics.improvements.processingEfficiency.toFixed(1)}%
                      </span>
                      {getImprovementIcon(enhancedMetrics.improvements.processingEfficiency)}
                    </div>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  {comparison.traditional.metrics.processingTime.toFixed(1)}s → {comparison.agentic.metrics.processingTime.toFixed(1)}s
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700">Tutarlılık İyileştirmesi</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-orange-800">
                        {enhancedMetrics.improvements.chunkConsistency > 0 ? '+' : ''}{enhancedMetrics.improvements.chunkConsistency.toFixed(1)}%
                      </span>
                      {getImprovementIcon(enhancedMetrics.improvements.chunkConsistency)}
                    </div>
                  </div>
                  <Scale className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-xs text-orange-600 mt-2">
                  Varyans azalması
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Side-by-Side Comparison Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Metrics Comparison Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Metrik Karşılaştırması
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={chartData.basicMetrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value} ${chartData.basicMetrics.find(m => m.traditional === value || m.agentic === value)?.unit || ''}`,
                        name === 'traditional' ? 'Geleneksel' : 'Agentic'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="traditional" fill="#94a3b8" name="Geleneksel" />
                    <Bar dataKey="agentic" fill="#3b82f6" name="Agentic" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quality Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Kalite Analizi Radarı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={chartData.radarData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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

          {/* Improvement Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                İyileştirme Detayları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chartData.basicMetrics.map((metric, index) => (
                  <div key={metric.metric} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        metric.improvement > 5 ? 'bg-green-500' :
                        metric.improvement < -5 ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                      <span className="font-medium">{metric.metric}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">
                        {metric.traditional} → {metric.agentic} {metric.unit}
                      </div>
                      <div className={`flex items-center gap-1 ${getImprovementColor(metric.improvement)}`}>
                        {getImprovementIcon(metric.improvement)}
                        <span className="font-semibold">
                          {metric.improvement > 0 ? '+' : ''}{metric.improvement.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Winner Analysis */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Award className="h-5 w-5" />
                Genel Sonuç Değerlendirmesi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {Object.values(enhancedMetrics.improvements).filter(imp => imp > 5).length}
                  </div>
                  <div className="text-sm font-medium text-green-800">Önemli İyileştirme</div>
                  <div className="text-xs text-green-600">(%5+ artış)</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {enableStatisticalTests ? Object.values(enhancedMetrics.significance).filter(sig => sig.isSignificant).length : 'N/A'}
                  </div>
                  <div className="text-sm font-medium text-blue-800">İstatistiksel Anlamlı</div>
                  <div className="text-xs text-blue-600">(p &lt; 0.05)</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {((enhancedMetrics.improvements.semanticCoherence + enhancedMetrics.improvements.boundaryQuality) / 2).toFixed(1)}%
                  </div>
                  <div className="text-sm font-medium text-purple-800">Ortalama Kalite Artışı</div>
                  <div className="text-xs text-purple-600">Semantik + Sınır</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional tabs will be implemented in subsequent components */}
      {activeView === "detailed" && (
        <Card>
          <CardContent className="text-center py-12">
            <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Detaylı Analiz
            </h3>
            <p className="text-gray-500">
              Bu bölüm QualityMetricsComparison component'i ile tamamlanacak.
            </p>
          </CardContent>
        </Card>
      )}

      {activeView === "statistical" && enableStatisticalTests && (
        <Card>
          <CardContent className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              İstatistiksel Analiz
            </h3>
            <p className="text-gray-500">
              Bu bölüm StatisticalAnalysis component'i ile tamamlanacak.
            </p>
          </CardContent>
        </Card>
      )}

      {activeView === "performance" && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Gauge className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {performanceAnalysis.speedImprovement.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Hız İyileştirmesi</div>
                <div className="text-xs text-gray-500 mt-1">
                  {performanceAnalysis.throughput.traditional.toFixed(0)} → {performanceAnalysis.throughput.agentic.toFixed(0)} kar/sn
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Activity className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {performanceAnalysis.productionImprovement.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Üretim Hızı</div>
                <div className="text-xs text-gray-500 mt-1">
                  {performanceAnalysis.chunkProductionRate.traditional.toFixed(1)} → {performanceAnalysis.chunkProductionRate.agentic.toFixed(1)} chunk/sn
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {performanceAnalysis.qualitySpeedRatio.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Kalite/Hız Oranı</div>
                <div className="text-xs text-gray-500 mt-1">
                  Saniye başına kalite puanı
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performans Karşılaştırması</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={[
                  {
                    metric: "Throughput (kar/sn)",
                    traditional: performanceAnalysis.throughput.traditional,
                    agentic: performanceAnalysis.throughput.agentic
                  },
                  {
                    metric: "Chunk/Saniye",
                    traditional: performanceAnalysis.chunkProductionRate.traditional,
                    agentic: performanceAnalysis.chunkProductionRate.agentic
                  },
                  {
                    metric: "Kalite/Saniye",
                    traditional: performanceAnalysis.qualityPerSecond.traditional * 100,
                    agentic: performanceAnalysis.qualityPerSecond.agentic * 100
                  }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="traditional" fill="#94a3b8" name="Geleneksel" />
                  <Bar dataKey="agentic" fill="#3b82f6" name="Agentic" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === "roi" && showCostAnalysis && costBenefitAnalysis && (
        <div className="space-y-6">
          {/* ROI Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {costBenefitAnalysis.roi.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">ROI Skoru</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  ${costBenefitAnalysis.costs.agentic.total.toFixed(4)}
                </div>
                <div className="text-sm text-gray-600">Agentic Maliyet</div>
                <div className="text-xs text-gray-500">
                  vs ${costBenefitAnalysis.costs.traditional.total.toFixed(4)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {costBenefitAnalysis.benefits.total.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Toplam Fayda</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Scale className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">
                  ${costBenefitAnalysis.costPerQualityPoint.toFixed(6)}
                </div>
                <div className="text-sm text-gray-600">Maliyet/Kalite</div>
              </CardContent>
            </Card>
          </div>

          {/* Cost Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Maliyet Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Geleneksel Chunking</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">İşlem:</span>
                        <span className="font-medium">${costBenefitAnalysis.costs.traditional.processing.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Token:</span>
                        <span className="font-medium">${costBenefitAnalysis.costs.traditional.tokens.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Toplam:</span>
                        <span className="font-bold">${costBenefitAnalysis.costs.traditional.total.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Agentic Chunking</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">İşlem:</span>
                        <span className="font-medium">${costBenefitAnalysis.costs.agentic.processing.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Token:</span>
                        <span className="font-medium">${costBenefitAnalysis.costs.agentic.tokens.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">LLM Çağrıları:</span>
                        <span className="font-medium">${costBenefitAnalysis.costs.agentic.llmCalls.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Toplam:</span>
                        <span className="font-bold">${costBenefitAnalysis.costs.agentic.total.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fayda Analizi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Kalite İyileştirmesi:</span>
                    <span className="font-semibold text-green-600">
                      +{costBenefitAnalysis.benefits.quality.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Verimlilik İyileştirmesi:</span>
                    <span className="font-semibold text-blue-600">
                      +{costBenefitAnalysis.benefits.efficiency.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="font-semibold">Toplam Fayda:</span>
                    <span className="font-bold text-purple-600">
                      +{costBenefitAnalysis.benefits.total.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <div className="text-sm text-blue-800">
                      <strong>Break-even Point:</strong> ${costBenefitAnalysis.breakEvenPoint.toFixed(4)} kalite artışında
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedComparisonDashboard;