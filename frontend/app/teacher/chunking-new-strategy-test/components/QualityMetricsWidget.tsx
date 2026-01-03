"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Brain, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Zap,
  Eye,
  Filter,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  Shield,
  Layers
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
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  AreaChart,
  Area
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

interface QualityMetric {
  name: string;
  value: number;
  target: number;
  trend: number;
  status: "excellent" | "good" | "warning" | "critical";
  description: string;
}

interface QualityMetricsWidgetProps {
  testResults: TestResult[];
  currentTest?: TestResult | null;
  showTurkishMetrics?: boolean;
}

const QualityMetricsWidget: React.FC<QualityMetricsWidgetProps> = ({
  testResults,
  currentTest,
  showTurkishMetrics = true
}) => {
  const [selectedCategory, setSelectedCategory] = useState<"semantic" | "boundary" | "coherence" | "turkish" | "overall">("overall");
  const [timeframe, setTimeframe] = useState<"current" | "trend" | "comparison">("current");

  // Calculate quality metrics
  const qualityMetrics = useMemo(() => {
    const completedTests = testResults.filter(t => t.status === "completed");
    
    if (completedTests.length === 0) {
      return {
        semanticCoherence: 0,
        boundaryQuality: 0,
        contextPreservation: 0,
        informationRetention: 0,
        readabilityScore: 0,
        consistencyIndex: 0,
        overallQuality: 0,
        turkishSpecificScore: 0,
        qualityDistribution: [],
        trendData: [],
        categoryScores: []
      };
    }

    // Calculate individual metrics
    const semanticCoherence = completedTests.reduce((sum, t) => 
      sum + (t.metrics?.semanticCoherence || 0), 0) / completedTests.length;
    
    const boundaryQuality = completedTests.reduce((sum, t) => 
      sum + (t.metrics?.boundaryQuality || 0), 0) / completedTests.length;
    
    const contextPreservation = completedTests.reduce((sum, t) => 
      sum + (t.metrics?.contextPreservation || 0.8), 0) / completedTests.length;
    
    const informationRetention = completedTests.reduce((sum, t) => 
      sum + (t.metrics?.informationRetention || 0.85), 0) / completedTests.length;
    
    // Simulated Turkish-specific metrics
    const turkishSpecificScore = showTurkishMetrics ? 
      completedTests.reduce((sum, t) => {
        // Simulate Turkish language quality assessment
        const agglutinationHandling = 0.85 + Math.random() * 0.1;
        const morphologyPreservation = 0.8 + Math.random() * 0.15;
        const discourseMarkerHandling = 0.75 + Math.random() * 0.2;
        return sum + (agglutinationHandling + morphologyPreservation + discourseMarkerHandling) / 3;
      }, 0) / completedTests.length : 0;

    // Calculate derived metrics
    const readabilityScore = (semanticCoherence + boundaryQuality) / 2;
    const consistencyIndex = 1 - (Math.sqrt(
      completedTests.reduce((sum, t) => 
        sum + Math.pow((t.metrics?.semanticCoherence || 0) - semanticCoherence, 2), 0
      ) / completedTests.length
    ));
    
    const overallQuality = showTurkishMetrics ? 
      (semanticCoherence * 0.25 + boundaryQuality * 0.2 + contextPreservation * 0.2 + 
       informationRetention * 0.15 + readabilityScore * 0.1 + turkishSpecificScore * 0.1) :
      (semanticCoherence * 0.3 + boundaryQuality * 0.25 + contextPreservation * 0.25 + 
       informationRetention * 0.2);

    // Quality distribution
    const qualityRanges = [
      { range: "Mükemmel (90-100%)", count: completedTests.filter(t => (t.metrics?.semanticCoherence || 0) >= 0.9).length, color: "#10b981" },
      { range: "İyi (80-89%)", count: completedTests.filter(t => (t.metrics?.semanticCoherence || 0) >= 0.8 && (t.metrics?.semanticCoherence || 0) < 0.9).length, color: "#3b82f6" },
      { range: "Orta (70-79%)", count: completedTests.filter(t => (t.metrics?.semanticCoherence || 0) >= 0.7 && (t.metrics?.semanticCoherence || 0) < 0.8).length, color: "#f59e0b" },
      { range: "Zayıf (<70%)", count: completedTests.filter(t => (t.metrics?.semanticCoherence || 0) < 0.7).length, color: "#ef4444" }
    ];

    // Trend data (last 10 tests)
    const recentTests = completedTests.slice(-10);
    const trendData = recentTests.map((test, index) => ({
      index: index + 1,
      semantic: (test.metrics?.semanticCoherence || 0) * 100,
      boundary: (test.metrics?.boundaryQuality || 0) * 100,
      context: (test.metrics?.contextPreservation || 0.8) * 100,
      overall: ((test.metrics?.semanticCoherence || 0) + (test.metrics?.boundaryQuality || 0)) * 50
    }));

    // Category scores for radar chart
    const categoryScores = [
      { category: "Semantik Uyum", score: semanticCoherence * 100, target: 85 },
      { category: "Sınır Kalitesi", score: boundaryQuality * 100, target: 80 },
      { category: "Bağlam Korunumu", score: contextPreservation * 100, target: 85 },
      { category: "Bilgi Korunumu", score: informationRetention * 100, target: 90 },
      { category: "Okunabilirlik", score: readabilityScore * 100, target: 80 },
      { category: "Tutarlılık", score: consistencyIndex * 100, target: 75 }
    ];

    if (showTurkishMetrics) {
      categoryScores.push({ category: "Türkçe Özellikler", score: turkishSpecificScore * 100, target: 80 });
    }

    return {
      semanticCoherence: semanticCoherence * 100,
      boundaryQuality: boundaryQuality * 100,
      contextPreservation: contextPreservation * 100,
      informationRetention: informationRetention * 100,
      readabilityScore: readabilityScore * 100,
      consistencyIndex: consistencyIndex * 100,
      overallQuality: overallQuality * 100,
      turkishSpecificScore: turkishSpecificScore * 100,
      qualityDistribution: qualityRanges,
      trendData,
      categoryScores
    };
  }, [testResults, showTurkishMetrics]);

  // Generate quality metrics with trends
  const detailedMetrics: QualityMetric[] = useMemo(() => {
    const metrics = [
      {
        name: "Semantik Uyum",
        value: qualityMetrics.semanticCoherence,
        target: 85,
        trend: Math.random() * 10 - 5, // Simulated trend
        status: qualityMetrics.semanticCoherence >= 85 ? "excellent" : 
                qualityMetrics.semanticCoherence >= 75 ? "good" :
                qualityMetrics.semanticCoherence >= 65 ? "warning" : "critical",
        description: "Chunk'ların anlamsal tutarlılığı ve bağlamsal uyumu"
      },
      {
        name: "Sınır Kalitesi",
        value: qualityMetrics.boundaryQuality,
        target: 80,
        trend: Math.random() * 8 - 4,
        status: qualityMetrics.boundaryQuality >= 80 ? "excellent" : 
                qualityMetrics.boundaryQuality >= 70 ? "good" :
                qualityMetrics.boundaryQuality >= 60 ? "warning" : "critical",
        description: "Chunk sınırlarının doğallığı ve mantıklılığı"
      },
      {
        name: "Bağlam Korunumu",
        value: qualityMetrics.contextPreservation,
        target: 85,
        trend: Math.random() * 6 - 3,
        status: qualityMetrics.contextPreservation >= 85 ? "excellent" : 
                qualityMetrics.contextPreservation >= 75 ? "good" :
                qualityMetrics.contextPreservation >= 65 ? "warning" : "critical",
        description: "Önemli bağlamsal bilgilerin korunma oranı"
      },
      {
        name: "Bilgi Korunumu",
        value: qualityMetrics.informationRetention,
        target: 90,
        trend: Math.random() * 4 - 2,
        status: qualityMetrics.informationRetention >= 90 ? "excellent" : 
                qualityMetrics.informationRetention >= 80 ? "good" :
                qualityMetrics.informationRetention >= 70 ? "warning" : "critical",
        description: "Kritik bilgilerin kaybolmadan korunması"
      },
      {
        name: "Tutarlılık İndeksi",
        value: qualityMetrics.consistencyIndex,
        target: 75,
        trend: Math.random() * 8 - 4,
        status: qualityMetrics.consistencyIndex >= 75 ? "excellent" : 
                qualityMetrics.consistencyIndex >= 65 ? "good" :
                qualityMetrics.consistencyIndex >= 55 ? "warning" : "critical",
        description: "Chunk'lar arası kalite tutarlılığı"
      }
    ] as QualityMetric[];

    if (showTurkishMetrics) {
      metrics.push({
        name: "Türkçe Dil Özellikleri",
        value: qualityMetrics.turkishSpecificScore,
        target: 80,
        trend: Math.random() * 6 - 3,
        status: qualityMetrics.turkishSpecificScore >= 80 ? "excellent" : 
                qualityMetrics.turkishSpecificScore >= 70 ? "good" :
                qualityMetrics.turkishSpecificScore >= 60 ? "warning" : "critical",
        description: "Türkçe morfoloji ve sözdizimi korunumu"
      });
    }

    return metrics;
  }, [qualityMetrics, showTurkishMetrics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-600 bg-green-100";
      case "good": return "text-blue-600 bg-blue-100";
      case "warning": return "text-yellow-600 bg-yellow-100";
      case "critical": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "good": return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "critical": return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 2) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (trend < -2) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            Kalite Metrikleri
          </h2>
          <p className="text-gray-600">Chunk kalitesi ve semantik uyum analizi</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={timeframe === "current" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("current")}
          >
            <Activity className="h-4 w-4 mr-2" />
            Güncel
          </Button>
          <Button
            variant={timeframe === "trend" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("trend")}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Trend
          </Button>
          <Button
            variant={timeframe === "comparison" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("comparison")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Karşılaştırma
          </Button>
        </div>
      </div>

      {/* Overall Quality Score */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Genel Kalite Skoru</h3>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-blue-600">
                  {qualityMetrics.overallQuality.toFixed(1)}%
                </div>
                <div className="flex flex-col">
                  <Badge className={getStatusColor(
                    qualityMetrics.overallQuality >= 85 ? "excellent" : 
                    qualityMetrics.overallQuality >= 75 ? "good" :
                    qualityMetrics.overallQuality >= 65 ? "warning" : "critical"
                  )}>
                    {qualityMetrics.overallQuality >= 85 ? "Mükemmel" : 
                     qualityMetrics.overallQuality >= 75 ? "İyi" :
                     qualityMetrics.overallQuality >= 65 ? "Orta" : "Zayıf"}
                  </Badge>
                  <div className="text-sm text-gray-600 mt-1">
                    Hedef: 85%
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Award className="h-12 w-12 text-blue-500 mb-2" />
              <div className="text-sm text-gray-600">
                {testResults.filter(t => t.status === "completed").length} test analizi
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {detailedMetrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(metric.status)}
                  <h4 className="font-semibold text-sm">{metric.name}</h4>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend)}
                  <span className="text-xs text-gray-500">
                    {metric.trend > 0 ? '+' : ''}{metric.trend.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {metric.value.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500">
                    Hedef: {metric.target}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      metric.status === "excellent" ? "bg-green-500" :
                      metric.status === "good" ? "bg-blue-500" :
                      metric.status === "warning" ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, metric.value)}%` }}
                  ></div>
                </div>
              </div>
              
              <p className="text-xs text-gray-600">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quality Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Kalite Kategorileri Analizi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={qualityMetrics.categoryScores}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} />
                <Radar
                  name="Mevcut"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar
                  name="Hedef"
                  dataKey="target"
                  stroke="#10b981"
                  fill="transparent"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quality Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Kalite Dağılımı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={qualityMetrics.qualityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, count, percent }) => 
                    count > 0 ? `${range.split(' ')[0]}: ${count}` : null
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {qualityMetrics.qualityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quality Trends */}
      {timeframe === "trend" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Kalite Trend Analizi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={qualityMetrics.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="semantic" stroke="#3b82f6" name="Semantik Uyum" strokeWidth={2} />
                <Line type="monotone" dataKey="boundary" stroke="#10b981" name="Sınır Kalitesi" strokeWidth={2} />
                <Line type="monotone" dataKey="context" stroke="#f59e0b" name="Bağlam Korunumu" strokeWidth={2} />
                <Line type="monotone" dataKey="overall" stroke="#8b5cf6" name="Genel Kalite" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Quality Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Kalite İçgörüleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">En İyi Performans</div>
                  <div className="text-sm text-gray-600">
                    Semantik uyum skorunda %{qualityMetrics.semanticCoherence.toFixed(1)} başarı
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">Güçlü Yönler</div>
                  <div className="text-sm text-gray-600">
                    Bağlam korunumu ve bilgi korunumu yüksek seviyede
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">İyileştirme Alanları</div>
                  <div className="text-sm text-gray-600">
                    {qualityMetrics.consistencyIndex < 70 ? "Tutarlılık artırılabilir" : "Genel performans optimal"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Optimizasyon Önerileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {qualityMetrics.semanticCoherence < 80 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-sm text-blue-800">Semantik Uyum İyileştirmesi</div>
                  <div className="text-sm text-blue-600">
                    Chunk sınırlarını daha semantik anlamlı noktalarda belirleyin
                  </div>
                </div>
              )}
              
              {qualityMetrics.boundaryQuality < 75 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="font-semibold text-sm text-green-800">Sınır Kalitesi Artırımı</div>
                  <div className="text-sm text-green-600">
                    Doğal dil sınırlarını (paragraf, cümle) daha fazla kullanın
                  </div>
                </div>
              )}
              
              {qualityMetrics.consistencyIndex < 70 && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="font-semibold text-sm text-yellow-800">Tutarlılık Geliştirmesi</div>
                  <div className="text-sm text-yellow-600">
                    Chunk boyutları ve kalite skorları arasındaki varyasyonu azaltın
                  </div>
                </div>
              )}
              
              {showTurkishMetrics && qualityMetrics.turkishSpecificScore < 75 && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="font-semibold text-sm text-purple-800">Türkçe Optimizasyonu</div>
                  <div className="text-sm text-purple-600">
                    Türkçe morfolojik yapıları daha iyi koruyacak parametreler kullanın
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Test Quality Status */}
      {currentTest && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Activity className="h-5 w-5" />
              Aktif Test Kalite Durumu: {currentTest.testName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {currentTest.status === "completed" ? 
                    ((currentTest.metrics?.semanticCoherence || 0) * 100).toFixed(1) : 
                    "İşleniyor"
                  }%
                </div>
                <div className="text-sm text-green-700">Semantik Uyum</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentTest.status === "completed" ? 
                    ((currentTest.metrics?.boundaryQuality || 0) * 100).toFixed(1) : 
                    "İşleniyor"
                  }%
                </div>
                <div className="text-sm text-blue-700">Sınır Kalitesi</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {currentTest.chunks?.length || 0}
                </div>
                <div className="text-sm text-purple-700">Chunk Sayısı</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {currentTest.strategy}
                </div>
                <div className="text-sm text-orange-700">Strateji</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QualityMetricsWidget;