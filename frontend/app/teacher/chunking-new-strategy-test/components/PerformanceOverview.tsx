"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Gauge, 
  Clock, 
  Zap, 
  TrendingUp, 
  Activity,
  Target,
  BarChart3,
  LineChart,
  PieChart,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus
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
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  ScatterChart,
  Scatter
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

interface PerformanceOverviewProps {
  testResults: TestResult[];
  currentTest?: TestResult | null;
  timeRange: "1h" | "24h" | "7d" | "30d" | "all";
}

const PerformanceOverview: React.FC<PerformanceOverviewProps> = ({
  testResults,
  currentTest,
  timeRange
}) => {
  const [selectedMetric, setSelectedMetric] = useState<"throughput" | "latency" | "efficiency" | "quality">("throughput");
  const [viewMode, setViewMode] = useState<"realtime" | "historical" | "comparison">("realtime");

  // Filter tests based on time range
  const filteredTests = useMemo(() => {
    if (timeRange === "all") return testResults;
    
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeRange) {
      case "1h":
        cutoff.setHours(now.getHours() - 1);
        break;
      case "24h":
        cutoff.setDate(now.getDate() - 1);
        break;
      case "7d":
        cutoff.setDate(now.getDate() - 7);
        break;
      case "30d":
        cutoff.setDate(now.getDate() - 30);
        break;
    }
    
    return testResults.filter(test => {
      const testDate = new Date(test.endTime || test.startTime);
      return testDate >= cutoff;
    });
  }, [testResults, timeRange]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    const completedTests = filteredTests.filter(t => t.status === "completed");
    
    if (completedTests.length === 0) {
      return {
        avgThroughput: 0,
        avgLatency: 0,
        avgEfficiency: 0,
        avgQuality: 0,
        throughputTrend: 0,
        latencyTrend: 0,
        efficiencyTrend: 0,
        qualityTrend: 0,
        peakThroughput: 0,
        minLatency: 0,
        maxEfficiency: 0,
        consistencyScore: 0,
        performanceScore: 0,
        bottlenecks: [],
        recommendations: []
      };
    }

    // Calculate averages
    const avgThroughput = completedTests.reduce((sum, t) => 
      sum + (t.totalCharacters / t.processingTime), 0) / completedTests.length;
    
    const avgLatency = completedTests.reduce((sum, t) => 
      sum + t.processingTime, 0) / completedTests.length;
    
    const avgEfficiency = completedTests.reduce((sum, t) => 
      sum + (t.metrics?.tokenEfficiency || 0.7), 0) / completedTests.length;
    
    const avgQuality = completedTests.reduce((sum, t) => 
      sum + (t.metrics?.semanticCoherence || 0), 0) / completedTests.length;

    // Calculate trends (compare first half vs second half)
    const midPoint = Math.floor(completedTests.length / 2);
    const firstHalf = completedTests.slice(0, midPoint);
    const secondHalf = completedTests.slice(midPoint);

    const calculateTrend = (firstHalf: TestResult[], secondHalf: TestResult[], metric: string) => {
      if (firstHalf.length === 0 || secondHalf.length === 0) return 0;
      
      let firstAvg = 0, secondAvg = 0;
      
      switch (metric) {
        case "throughput":
          firstAvg = firstHalf.reduce((sum, t) => sum + (t.totalCharacters / t.processingTime), 0) / firstHalf.length;
          secondAvg = secondHalf.reduce((sum, t) => sum + (t.totalCharacters / t.processingTime), 0) / secondHalf.length;
          break;
        case "latency":
          firstAvg = firstHalf.reduce((sum, t) => sum + t.processingTime, 0) / firstHalf.length;
          secondAvg = secondHalf.reduce((sum, t) => sum + t.processingTime, 0) / secondHalf.length;
          break;
        case "efficiency":
          firstAvg = firstHalf.reduce((sum, t) => sum + (t.metrics?.tokenEfficiency || 0.7), 0) / firstHalf.length;
          secondAvg = secondHalf.reduce((sum, t) => sum + (t.metrics?.tokenEfficiency || 0.7), 0) / secondHalf.length;
          break;
        case "quality":
          firstAvg = firstHalf.reduce((sum, t) => sum + (t.metrics?.semanticCoherence || 0), 0) / firstHalf.length;
          secondAvg = secondHalf.reduce((sum, t) => sum + (t.metrics?.semanticCoherence || 0), 0) / secondHalf.length;
          break;
      }
      
      return ((secondAvg - firstAvg) / firstAvg) * 100;
    };

    const throughputTrend = calculateTrend(firstHalf, secondHalf, "throughput");
    const latencyTrend = calculateTrend(firstHalf, secondHalf, "latency");
    const efficiencyTrend = calculateTrend(firstHalf, secondHalf, "efficiency");
    const qualityTrend = calculateTrend(firstHalf, secondHalf, "quality");

    // Calculate peaks and extremes
    const peakThroughput = Math.max(...completedTests.map(t => t.totalCharacters / t.processingTime));
    const minLatency = Math.min(...completedTests.map(t => t.processingTime));
    const maxEfficiency = Math.max(...completedTests.map(t => t.metrics?.tokenEfficiency || 0.7));

    // Calculate consistency score (lower variance = higher consistency)
    const throughputValues = completedTests.map(t => t.totalCharacters / t.processingTime);
    const throughputVariance = throughputValues.reduce((sum, val) => 
      sum + Math.pow(val - avgThroughput, 2), 0) / throughputValues.length;
    const consistencyScore = Math.max(0, 100 - (Math.sqrt(throughputVariance) / avgThroughput) * 100);

    // Overall performance score
    const performanceScore = (
      (avgThroughput / 1000) * 0.3 +
      (100 / avgLatency) * 0.2 +
      avgEfficiency * 100 * 0.2 +
      avgQuality * 100 * 0.2 +
      consistencyScore * 0.1
    );

    // Identify bottlenecks
    const bottlenecks = [];
    if (avgLatency > 10) bottlenecks.push("Yüksek işlem süresi");
    if (avgEfficiency < 0.7) bottlenecks.push("Düşük token verimliliği");
    if (avgQuality < 0.8) bottlenecks.push("Düşük kalite skoru");
    if (consistencyScore < 70) bottlenecks.push("Tutarsız performans");

    // Generate recommendations
    const recommendations = [];
    if (avgLatency > 10) recommendations.push("Paralel işleme önerilir");
    if (avgEfficiency < 0.7) recommendations.push("Token optimizasyonu gerekli");
    if (avgQuality < 0.8) recommendations.push("Kalite parametrelerini gözden geçirin");
    if (consistencyScore < 70) recommendations.push("Sistem kaynaklarını stabilize edin");

    return {
      avgThroughput,
      avgLatency,
      avgEfficiency,
      avgQuality,
      throughputTrend,
      latencyTrend,
      efficiencyTrend,
      qualityTrend,
      peakThroughput,
      minLatency,
      maxEfficiency,
      consistencyScore,
      performanceScore,
      bottlenecks,
      recommendations
    };
  }, [filteredTests]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return filteredTests
      .filter(t => t.status === "completed")
      .map((test, index) => ({
        index: index + 1,
        testName: test.testName.substring(0, 10) + "...",
        throughput: test.totalCharacters / test.processingTime,
        latency: test.processingTime,
        efficiency: (test.metrics?.tokenEfficiency || 0.7) * 100,
        quality: (test.metrics?.semanticCoherence || 0) * 100,
        timestamp: new Date(test.endTime || test.startTime).getTime()
      }));
  }, [filteredTests]);

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (trend < -5) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 5) return "text-green-600";
    if (trend < -5) return "text-red-600";
    return "text-gray-500";
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gauge className="h-6 w-6 text-blue-600" />
            Performans Genel Bakış
          </h2>
          <p className="text-gray-600">Sistem performansı ve verimlilik metrikleri</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "realtime" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("realtime")}
          >
            <Activity className="h-4 w-4 mr-2" />
            Gerçek Zamanlı
          </Button>
          <Button
            variant={viewMode === "historical" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("historical")}
          >
            <LineChart className="h-4 w-4 mr-2" />
            Geçmiş
          </Button>
          <Button
            variant={viewMode === "comparison" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("comparison")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Karşılaştırma
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Throughput</p>
                <p className="text-2xl font-bold text-blue-800">
                  {performanceMetrics.avgThroughput.toFixed(0)}
                </p>
                <p className="text-xs text-blue-600">karakter/saniye</p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(performanceMetrics.throughputTrend)}
                <span className={`text-sm font-semibold ${getTrendColor(performanceMetrics.throughputTrend)}`}>
                  {performanceMetrics.throughputTrend > 0 ? '+' : ''}{performanceMetrics.throughputTrend.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Latency</p>
                <p className="text-2xl font-bold text-green-800">
                  {performanceMetrics.avgLatency.toFixed(1)}s
                </p>
                <p className="text-xs text-green-600">ortalama süre</p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(-performanceMetrics.latencyTrend)} {/* Negative because lower is better */}
                <span className={`text-sm font-semibold ${getTrendColor(-performanceMetrics.latencyTrend)}`}>
                  {performanceMetrics.latencyTrend > 0 ? '+' : ''}{performanceMetrics.latencyTrend.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Verimlilik</p>
                <p className="text-2xl font-bold text-purple-800">
                  {(performanceMetrics.avgEfficiency * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-purple-600">token verimliliği</p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(performanceMetrics.efficiencyTrend)}
                <span className={`text-sm font-semibold ${getTrendColor(performanceMetrics.efficiencyTrend)}`}>
                  {performanceMetrics.efficiencyTrend > 0 ? '+' : ''}{performanceMetrics.efficiencyTrend.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Kalite</p>
                <p className="text-2xl font-bold text-orange-800">
                  {(performanceMetrics.avgQuality * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-orange-600">semantik uyum</p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(performanceMetrics.qualityTrend)}
                <span className={`text-sm font-semibold ${getTrendColor(performanceMetrics.qualityTrend)}`}>
                  {performanceMetrics.qualityTrend > 0 ? '+' : ''}{performanceMetrics.qualityTrend.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Score and Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Genel Performans Skoru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getPerformanceColor(performanceMetrics.performanceScore)}`}>
                {performanceMetrics.performanceScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 mb-4">100 üzerinden</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    performanceMetrics.performanceScore >= 80 ? 'bg-green-500' :
                    performanceMetrics.performanceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, performanceMetrics.performanceScore)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Performans Darboğazları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performanceMetrics.bottlenecks.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Darboğaz tespit edilmedi</span>
                </div>
              ) : (
                performanceMetrics.bottlenecks.map((bottleneck, index) => (
                  <div key={index} className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">{bottleneck}</span>
                  </div>
                ))
              )}
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
            <div className="space-y-2">
              {performanceMetrics.recommendations.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Sistem optimal durumda</span>
                </div>
              ) : (
                performanceMetrics.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-center gap-2 text-blue-600">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm">{recommendation}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Throughput Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Throughput Trendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${Number(value).toFixed(0)} kar/sn`, "Throughput"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="throughput" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quality vs Efficiency Scatter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Kalite vs Verimlilik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={chartData}>
                <CartesianGrid />
                <XAxis dataKey="efficiency" name="Verimlilik" unit="%" />
                <YAxis dataKey="quality" name="Kalite" unit="%" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Testler" data={chartData} fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Detaylı Performans Metrikleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Hız Metrikleri</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Ortalama Throughput:</span>
                  <span className="font-semibold">{performanceMetrics.avgThroughput.toFixed(0)} kar/sn</span>
                </div>
                <div className="flex justify-between">
                  <span>Peak Throughput:</span>
                  <span className="font-semibold">{performanceMetrics.peakThroughput.toFixed(0)} kar/sn</span>
                </div>
                <div className="flex justify-between">
                  <span>Min Latency:</span>
                  <span className="font-semibold">{performanceMetrics.minLatency.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Ortalama Latency:</span>
                  <span className="font-semibold">{performanceMetrics.avgLatency.toFixed(1)}s</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Kalite Metrikleri</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Ortalama Kalite:</span>
                  <span className="font-semibold">{(performanceMetrics.avgQuality * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Verimlilik:</span>
                  <span className="font-semibold">{(performanceMetrics.maxEfficiency * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Tutarlılık Skoru:</span>
                  <span className="font-semibold">{performanceMetrics.consistencyScore.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Genel Skor:</span>
                  <span className={`font-semibold ${getPerformanceColor(performanceMetrics.performanceScore)}`}>
                    {performanceMetrics.performanceScore.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Sistem Durumu</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Aktif Testler:</span>
                  <span className="font-semibold">{filteredTests.filter(t => t.status === "running").length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tamamlanan:</span>
                  <span className="font-semibold">{filteredTests.filter(t => t.status === "completed").length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Başarısız:</span>
                  <span className="font-semibold text-red-600">{filteredTests.filter(t => t.status === "failed").length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sistem Sağlığı:</span>
                  <span className={`font-semibold ${
                    performanceMetrics.performanceScore >= 80 ? 'text-green-600' :
                    performanceMetrics.performanceScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {performanceMetrics.performanceScore >= 80 ? 'Mükemmel' :
                     performanceMetrics.performanceScore >= 60 ? 'İyi' : 'Dikkat Gerekli'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Test Real-time Status */}
      {currentTest && currentTest.status === "running" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Activity className="h-5 w-5" />
              Aktif Test: {currentTest.testName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{currentTest.progress}%</div>
                <div className="text-sm text-blue-700">İlerleme</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {((Date.now() - new Date(currentTest.startTime).getTime()) / 1000).toFixed(0)}s
                </div>
                <div className="text-sm text-green-700">Geçen Süre</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{currentTest.strategy}</div>
                <div className="text-sm text-purple-700">Strateji</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {currentTest.totalCharacters.toLocaleString()}
                </div>
                <div className="text-sm text-orange-700">Karakter</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceOverview;