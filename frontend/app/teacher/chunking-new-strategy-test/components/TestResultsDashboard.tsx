"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dashboard,
  Activity,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Target,
  Award,
  RefreshCw,
  Download,
  Filter,
  Settings,
  Bell,
  Eye,
  Play,
  Pause,
  Square,
  MoreVertical,
  Calendar,
  Users,
  FileText,
  PieChart,
  LineChart,
  GitBranch,
  Languages,
  BookOpen,
  Brain,
  Layers,
  Hash,
  Globe
} from "lucide-react";

// Import the dashboard components
import PerformanceOverview from "./PerformanceOverview";
import QualityMetricsWidget from "./QualityMetricsWidget";
import ComparisonSummary from "./ComparisonSummary";
import TurkishAnalyticsPanel from "./TurkishAnalyticsPanel";

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

interface Alert {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  timestamp: string;
  dismissed: boolean;
}

interface KPI {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "stable";
  status: "excellent" | "good" | "warning" | "critical";
  icon: React.ReactNode;
}

interface TestResultsDashboardProps {
  testResults: TestResult[];
  currentTest?: TestResult | null;
  onStartTest?: () => void;
  onStopTest?: () => void;
  onExportResults?: (format: "pdf" | "csv" | "json") => void;
  onRefreshData?: () => void;
  realTimeUpdates?: boolean;
}

const TestResultsDashboard: React.FC<TestResultsDashboardProps> = ({
  testResults,
  currentTest,
  onStartTest,
  onStopTest,
  onExportResults,
  onRefreshData,
  realTimeUpdates = true
}) => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(realTimeUpdates);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [showAlerts, setShowAlerts] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("24h");

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !onRefreshData) return;

    const interval = setInterval(() => {
      onRefreshData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onRefreshData]);

  // Calculate KPIs
  const kpis = useMemo((): KPI[] => {
    const completedTests = testResults.filter(t => t.status === "completed");
    const runningTests = testResults.filter(t => t.status === "running");
    const failedTests = testResults.filter(t => t.status === "failed");
    
    const totalTests = testResults.length;
    const successRate = totalTests > 0 ? (completedTests.length / totalTests) * 100 : 0;
    
    const avgProcessingTime = completedTests.length > 0 
      ? completedTests.reduce((sum, t) => sum + t.processingTime, 0) / completedTests.length 
      : 0;
    
    const avgQualityScore = completedTests.length > 0
      ? completedTests.reduce((sum, t) => sum + ((t.metrics?.semanticCoherence || 0) * 100), 0) / completedTests.length
      : 0;

    const totalChunks = completedTests.reduce((sum, t) => sum + (t.metrics?.totalChunks || 0), 0);

    return [
      {
        label: "Başarı Oranı",
        value: `${successRate.toFixed(1)}%`,
        change: 5.2,
        trend: "up",
        status: successRate > 90 ? "excellent" : successRate > 80 ? "good" : successRate > 70 ? "warning" : "critical",
        icon: <CheckCircle className="h-5 w-5" />
      },
      {
        label: "Ortalama Kalite",
        value: `${avgQualityScore.toFixed(1)}%`,
        change: 3.8,
        trend: "up",
        status: avgQualityScore > 85 ? "excellent" : avgQualityScore > 75 ? "good" : avgQualityScore > 65 ? "warning" : "critical",
        icon: <Award className="h-5 w-5" />
      },
      {
        label: "İşlem Süresi",
        value: `${avgProcessingTime.toFixed(1)}s`,
        change: -12.3,
        trend: "down",
        status: avgProcessingTime < 5 ? "excellent" : avgProcessingTime < 10 ? "good" : avgProcessingTime < 20 ? "warning" : "critical",
        icon: <Clock className="h-5 w-5" />
      },
      {
        label: "Aktif Testler",
        value: runningTests.length,
        change: 0,
        trend: "stable",
        status: runningTests.length === 0 ? "good" : runningTests.length < 3 ? "warning" : "critical",
        icon: <Activity className="h-5 w-5" />
      },
      {
        label: "Toplam Chunk",
        value: totalChunks.toLocaleString(),
        change: 15.7,
        trend: "up",
        status: "good",
        icon: <Layers className="h-5 w-5" />
      },
      {
        label: "Hata Oranı",
        value: `${totalTests > 0 ? ((failedTests.length / totalTests) * 100).toFixed(1) : 0}%`,
        change: -2.1,
        trend: "down",
        status: failedTests.length === 0 ? "excellent" : failedTests.length < 2 ? "good" : "warning",
        icon: <XCircle className="h-5 w-5" />
      }
    ];
  }, [testResults]);

  // Generate alerts based on test results
  useEffect(() => {
    const newAlerts: Alert[] = [];
    
    // Check for failed tests
    const recentFailures = testResults.filter(t => 
      t.status === "failed" && 
      new Date(t.startTime).getTime() > Date.now() - 3600000 // Last hour
    );
    
    if (recentFailures.length > 0) {
      newAlerts.push({
        id: `failures-${Date.now()}`,
        type: "error",
        title: "Test Hataları Tespit Edildi",
        message: `Son 1 saatte ${recentFailures.length} test başarısız oldu.`,
        timestamp: new Date().toISOString(),
        dismissed: false
      });
    }

    // Check for performance degradation
    const recentTests = testResults
      .filter(t => t.status === "completed")
      .slice(-10);
    
    if (recentTests.length >= 5) {
      const avgRecentTime = recentTests.slice(-5).reduce((sum, t) => sum + t.processingTime, 0) / 5;
      const avgOlderTime = recentTests.slice(0, 5).reduce((sum, t) => sum + t.processingTime, 0) / 5;
      
      if (avgRecentTime > avgOlderTime * 1.5) {
        newAlerts.push({
          id: `performance-${Date.now()}`,
          type: "warning",
          title: "Performans Düşüşü",
          message: "Son testlerde işlem süresi artışı gözlemlendi.",
          timestamp: new Date().toISOString(),
          dismissed: false
        });
      }
    }

    // Check for quality improvements
    const completedTests = testResults.filter(t => t.status === "completed");
    if (completedTests.length > 0) {
      const avgQuality = completedTests.reduce((sum, t) => sum + ((t.metrics?.semanticCoherence || 0) * 100), 0) / completedTests.length;
      
      if (avgQuality > 90) {
        newAlerts.push({
          id: `quality-${Date.now()}`,
          type: "success",
          title: "Yüksek Kalite Skoru",
          message: `Ortalama kalite skoru %${avgQuality.toFixed(1)} seviyesinde.`,
          timestamp: new Date().toISOString(),
          dismissed: false
        });
      }
    }

    setAlerts(prev => [...prev.filter(a => a.dismissed), ...newAlerts]);
  }, [testResults]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-600 bg-green-50 border-green-200";
      case "good": return "text-blue-600 bg-blue-50 border-blue-200";
      case "warning": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "critical": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down": return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, dismissed: true } : a));
  };

  const filteredTestResults = useMemo(() => {
    let filtered = testResults;
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(t => t.status === filterStatus);
    }
    
    // Apply time range filter
    const now = Date.now();
    const timeRangeMs = {
      "1h": 3600000,
      "24h": 86400000,
      "7d": 604800000,
      "30d": 2592000000
    }[timeRange] || 86400000;
    
    filtered = filtered.filter(t => 
      new Date(t.startTime).getTime() > now - timeRangeMs
    );
    
    return filtered;
  }, [testResults, filterStatus, timeRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Dashboard className="h-8 w-8 text-blue-600" />
            Test Sonuçları Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Chunking stratejileri için kapsamlı analiz ve performans izleme
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Otomatik Yenile
          </Button>
          
          {/* Manual refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          
          {/* Export options */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExportResults?.("pdf")}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExportResults?.("csv")}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
          
          {/* Test controls */}
          {currentTest?.status === "running" ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={onStopTest}
            >
              <Square className="h-4 w-4 mr-2" />
              Durdur
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={onStartTest}
            >
              <Play className="h-4 w-4 mr-2" />
              Test Başlat
            </Button>
          )}
        </div>
      </div>

      {/* Alerts Section */}
      {showAlerts && alerts.filter(a => !a.dismissed).length > 0 && (
        <div className="space-y-2">
          {alerts.filter(a => !a.dismissed).slice(0, 3).map((alert) => (
            <Card key={alert.id} className={`border-l-4 ${
              alert.type === "success" ? "border-l-green-500 bg-green-50" :
              alert.type === "warning" ? "border-l-yellow-500 bg-yellow-50" :
              alert.type === "error" ? "border-l-red-500 bg-red-50" :
              "border-l-blue-500 bg-blue-50"
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <div className="font-semibold">{alert.title}</div>
                      <div className="text-sm text-gray-600">{alert.message}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className={`border ${getStatusColor(kpi.status)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {kpi.icon}
                  <span className="text-sm font-medium">{kpi.label}</span>
                </div>
                {getTrendIcon(kpi.trend)}
              </div>
              <div className="text-2xl font-bold mb-1">
                {kpi.value}
              </div>
              {kpi.change !== 0 && (
                <div className={`text-xs flex items-center gap-1 ${
                  kpi.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%
                  <span className="text-gray-500">son 24h</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Filtreler:</span>
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="running">Çalışan</option>
                <option value="completed">Tamamlanan</option>
                <option value="failed">Başarısız</option>
                <option value="stopped">Durdurulan</option>
              </select>
              
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="1h">Son 1 Saat</option>
                <option value="24h">Son 24 Saat</option>
                <option value="7d">Son 7 Gün</option>
                <option value="30d">Son 30 Gün</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              {filteredTestResults.length} test gösteriliyor
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performans
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Kalite
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Karşılaştırma
          </TabsTrigger>
          <TabsTrigger value="turkish" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Türkçe Analiz
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceOverview 
              testResults={filteredTestResults} 
              currentTest={currentTest}
            />
            <QualityMetricsWidget 
              testResults={filteredTestResults} 
              currentTest={currentTest}
            />
          </div>
          
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Hızlı İstatistikler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {filteredTestResults.filter(t => t.status === "completed").length}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Tamamlanan Testler</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {filteredTestResults.filter(t => t.strategy.includes("agentic")).length}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Agentic Testler</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {filteredTestResults.reduce((sum, t) => sum + (t.metrics?.totalChunks || 0), 0)}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Toplam Chunk</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {filteredTestResults.reduce((sum, t) => sum + t.totalCharacters, 0).toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-gray-700">İşlenen Karakter</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceOverview 
            testResults={filteredTestResults} 
            currentTest={currentTest}
          />
        </TabsContent>

        <TabsContent value="quality">
          <QualityMetricsWidget 
            testResults={filteredTestResults} 
            currentTest={currentTest}
          />
        </TabsContent>

        <TabsContent value="comparison">
          <ComparisonSummary 
            testResults={filteredTestResults} 
            currentTest={currentTest}
            enableStatisticalTests={true}
          />
        </TabsContent>

        <TabsContent value="turkish">
          <TurkishAnalyticsPanel 
            testResults={filteredTestResults} 
            currentTest={currentTest}
            enableLinguisticAnalysis={true}
          />
        </TabsContent>
      </Tabs>

      {/* Current Test Status */}
      {currentTest && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Activity className="h-5 w-5" />
              Aktif Test: {currentTest.testName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-blue-700">Durum</div>
                <Badge className={
                  currentTest.status === "running" ? "bg-blue-100 text-blue-800" :
                  currentTest.status === "completed" ? "bg-green-100 text-green-800" :
                  currentTest.status === "failed" ? "bg-red-100 text-red-800" :
                  "bg-gray-100 text-gray-800"
                }>
                  {currentTest.status === "running" ? "Çalışıyor" :
                   currentTest.status === "completed" ? "Tamamlandı" :
                   currentTest.status === "failed" ? "Başarısız" : "Durduruldu"}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-blue-700">İlerleme</div>
                <div className="text-lg font-semibold text-blue-800">
                  {currentTest.progress.toFixed(1)}%
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${currentTest.progress}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="text-sm text-blue-700">Strateji</div>
                <div className="text-lg font-semibold text-blue-800">
                  {currentTest.strategy === "traditional" ? "Geleneksel" : 
                   currentTest.strategy === "agentic" ? "Agentic" : 
                   "Agentic Reasoning"}
                </div>
              </div>
              <div>
                <div className="text-sm text-blue-700">Başlangıç</div>
                <div className="text-lg font-semibold text-blue-800">
                  {new Date(currentTest.startTime).toLocaleTimeString('tr-TR')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestResultsDashboard;