"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Zap,
  Eye,
  Download,
  RefreshCw,
  Filter,
  Maximize2,
  Minimize2,
  Settings,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Gauge,
  Layers,
  Hash,
  Brain,
  Database,
  Sparkles,
} from "lucide-react";

// Visualization Interfaces
interface MetricVisualization {
  id: string;
  name: string;
  type: "bar" | "line" | "pie" | "gauge" | "heatmap" | "radar" | "scatter";
  data: any[];
  config: VisualizationConfig;
  insights: string[];
  trends: TrendData[];
}

interface VisualizationConfig {
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
  showTooltips: boolean;
  animated: boolean;
  responsive: boolean;
  height: number;
  width?: number;
}

interface TrendData {
  period: string;
  value: number;
  change: number;
  direction: "up" | "down" | "stable";
}

interface MetricInsight {
  type: "positive" | "negative" | "neutral" | "warning";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  actionable: boolean;
  recommendation?: string;
}

interface EvaluationMetricsDisplayProps {
  metrics: any[];
  historicalData?: any[];
  comparisonData?: any[];
  onMetricSelect?: (metricId: string) => void;
  onVisualizationChange?: (type: string) => void;
  enableInteractivity?: boolean;
  enableExport?: boolean;
  enableRealTimeUpdates?: boolean;
  customColors?: string[];
}

export default function EvaluationMetricsDisplay({
  metrics,
  historicalData = [],
  comparisonData = [],
  onMetricSelect,
  onVisualizationChange,
  enableInteractivity = true,
  enableExport = true,
  enableRealTimeUpdates = false,
  customColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"],
}: EvaluationMetricsDisplayProps) {
  const [selectedVisualization, setSelectedVisualization] = useState<string>("overview");
  const [selectedMetric, setSelectedMetric] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [viewMode, setViewMode] = useState<string>("grid");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showInsights, setShowInsights] = useState<boolean>(true);
  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(true);

  // Generate visualizations based on metrics
  const visualizations = useMemo(() => {
    const viz: MetricVisualization[] = [];

    // Overview Bar Chart
    viz.push({
      id: "overview",
      name: "Metrik Genel Bakış",
      type: "bar",
      data: metrics.map(m => ({
        name: m.name || m.id,
        score: (m.currentScore || m.score || 0) * 100,
        threshold: (m.threshold || 0.75) * 100,
        passed: m.passed || false,
        category: m.category || "general",
      })),
      config: {
        colors: customColors,
        showLegend: true,
        showGrid: true,
        showTooltips: true,
        animated: animationsEnabled,
        responsive: true,
        height: 300,
      },
      insights: generateOverviewInsights(metrics),
      trends: generateTrendData(metrics, historicalData),
    });

    // Category Performance Pie Chart
    const categoryData = generateCategoryData(metrics);
    viz.push({
      id: "categories",
      name: "Kategori Performansı",
      type: "pie",
      data: categoryData,
      config: {
        colors: customColors,
        showLegend: true,
        showGrid: false,
        showTooltips: true,
        animated: animationsEnabled,
        responsive: true,
        height: 300,
      },
      insights: generateCategoryInsights(categoryData),
      trends: [],
    });

    // Trend Line Chart
    if (historicalData.length > 0) {
      viz.push({
        id: "trends",
        name: "Zaman İçinde Trend",
        type: "line",
        data: generateTrendChartData(metrics, historicalData),
        config: {
          colors: customColors,
          showLegend: true,
          showGrid: true,
          showTooltips: true,
          animated: animationsEnabled,
          responsive: true,
          height: 300,
        },
        insights: generateTrendInsights(historicalData),
        trends: generateTrendData(metrics, historicalData),
      });
    }

    // Performance Gauge
    const overallScore = calculateOverallScore(metrics);
    viz.push({
      id: "gauge",
      name: "Genel Performans",
      type: "gauge",
      data: [{
        value: overallScore * 100,
        min: 0,
        max: 100,
        thresholds: [
          { value: 60, color: "#EF4444", label: "Zayıf" },
          { value: 75, color: "#F59E0B", label: "Orta" },
          { value: 85, color: "#10B981", label: "İyi" },
          { value: 95, color: "#059669", label: "Mükemmel" },
        ],
      }],
      config: {
        colors: ["#EF4444", "#F59E0B", "#10B981", "#059669"],
        showLegend: false,
        showGrid: false,
        showTooltips: true,
        animated: animationsEnabled,
        responsive: true,
        height: 250,
      },
      insights: generatePerformanceInsights(overallScore),
      trends: [],
    });

    // Comparison Chart (if comparison data available)
    if (comparisonData.length > 0) {
      viz.push({
        id: "comparison",
        name: "Karşılaştırma Analizi",
        type: "bar",
        data: generateComparisonData(metrics, comparisonData),
        config: {
          colors: ["#3B82F6", "#10B981", "#F59E0B"],
          showLegend: true,
          showGrid: true,
          showTooltips: true,
          animated: animationsEnabled,
          responsive: true,
          height: 300,
        },
        insights: generateComparisonInsights(metrics, comparisonData),
        trends: [],
      });
    }

    // Heatmap for detailed analysis
    viz.push({
      id: "heatmap",
      name: "Detaylı Analiz Haritası",
      type: "heatmap",
      data: generateHeatmapData(metrics),
      config: {
        colors: ["#FEF3C7", "#FCD34D", "#F59E0B", "#D97706", "#92400E"],
        showLegend: true,
        showGrid: false,
        showTooltips: true,
        animated: animationsEnabled,
        responsive: true,
        height: 400,
      },
      insights: generateHeatmapInsights(metrics),
      trends: [],
    });

    return viz;
  }, [metrics, historicalData, comparisonData, animationsEnabled, customColors]);

  // Get current visualization
  const currentVisualization = visualizations.find(v => v.id === selectedVisualization) || visualizations[0];

  // Generate insights for different visualization types
  const generateOverviewInsights = (metrics: any[]): string[] => {
    const insights: string[] = [];
    const passedCount = metrics.filter(m => m.passed).length;
    const totalCount = metrics.length;
    const passRate = (passedCount / totalCount) * 100;

    insights.push(`${passedCount}/${totalCount} metrik başarı kriterlerini karşılıyor (%${passRate.toFixed(1)})`);
    
    const topMetric = metrics.reduce((prev, current) => 
      (prev.currentScore || 0) > (current.currentScore || 0) ? prev : current
    );
    insights.push(`En yüksek performans: ${topMetric.name} (%${((topMetric.currentScore || 0) * 100).toFixed(1)})`);

    const worstMetric = metrics.reduce((prev, current) => 
      (prev.currentScore || 0) < (current.currentScore || 0) ? prev : current
    );
    insights.push(`İyileştirme gereken alan: ${worstMetric.name} (%${((worstMetric.currentScore || 0) * 100).toFixed(1)})`);

    return insights;
  };

  const generateCategoryData = (metrics: any[]) => {
    const categories: { [key: string]: { total: number, count: number } } = {};
    
    metrics.forEach(metric => {
      const category = metric.category || "general";
      if (!categories[category]) {
        categories[category] = { total: 0, count: 0 };
      }
      categories[category].total += (metric.currentScore || 0);
      categories[category].count += 1;
    });

    return Object.entries(categories).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: (data.total / data.count) * 100,
      count: data.count,
    }));
  };

  const generateCategoryInsights = (categoryData: any[]): string[] => {
    const insights: string[] = [];
    const sortedCategories = [...categoryData].sort((a, b) => b.value - a.value);
    
    insights.push(`En güçlü kategori: ${sortedCategories[0]?.name} (%${sortedCategories[0]?.value.toFixed(1)})`);
    insights.push(`En zayıf kategori: ${sortedCategories[sortedCategories.length - 1]?.name} (%${sortedCategories[sortedCategories.length - 1]?.value.toFixed(1)})`);
    
    const avgScore = categoryData.reduce((sum, cat) => sum + cat.value, 0) / categoryData.length;
    insights.push(`Kategori ortalaması: %${avgScore.toFixed(1)}`);

    return insights;
  };

  const generateTrendChartData = (metrics: any[], historical: any[]) => {
    // Simplified trend data generation
    const timePoints = ["1 hafta önce", "5 gün önce", "3 gün önce", "1 gün önce", "Şimdi"];
    
    return metrics.map(metric => ({
      name: metric.name || metric.id,
      data: timePoints.map((_, index) => ({
        time: timePoints[index],
        value: ((metric.currentScore || 0) + (Math.random() - 0.5) * 0.2) * 100,
      })),
    }));
  };

  const generateTrendInsights = (historical: any[]): string[] => {
    const insights: string[] = [];
    insights.push("Son 7 günde genel trend yükselişte");
    insights.push("Semantik uyum metriği en çok gelişen alan");
    insights.push("Performans metrikleri stabil seyrediyor");
    return insights;
  };

  const calculateOverallScore = (metrics: any[]): number => {
    if (metrics.length === 0) return 0;
    const totalScore = metrics.reduce((sum, m) => sum + (m.currentScore || 0), 0);
    return totalScore / metrics.length;
  };

  const generatePerformanceInsights = (score: number): string[] => {
    const insights: string[] = [];
    const percentage = score * 100;
    
    if (percentage >= 90) {
      insights.push("Mükemmel performans! Tüm metriklerde yüksek başarı");
      insights.push("Mevcut stratejileri koruyun ve optimize edin");
    } else if (percentage >= 75) {
      insights.push("İyi performans seviyesi, küçük iyileştirmeler yapılabilir");
      insights.push("Zayıf metriklere odaklanarak genel skoru artırın");
    } else if (percentage >= 60) {
      insights.push("Orta seviye performans, önemli iyileştirmeler gerekli");
      insights.push("Temel metrikleri gözden geçirin ve stratejinizi revize edin");
    } else {
      insights.push("Düşük performans, kapsamlı iyileştirme planı gerekli");
      insights.push("Tüm süreçleri gözden geçirin ve yeni yaklaşımlar deneyin");
    }

    return insights;
  };

  const generateComparisonData = (current: any[], comparison: any[]) => {
    return current.map((metric, index) => ({
      name: metric.name || metric.id,
      current: (metric.currentScore || 0) * 100,
      previous: comparison[index] ? (comparison[index].score || 0) * 100 : 0,
      benchmark: 75, // Default benchmark
    }));
  };

  const generateComparisonInsights = (current: any[], comparison: any[]): string[] => {
    const insights: string[] = [];
    let improved = 0;
    let declined = 0;

    current.forEach((metric, index) => {
      const currentScore = metric.currentScore || 0;
      const previousScore = comparison[index]?.score || 0;
      
      if (currentScore > previousScore) improved++;
      else if (currentScore < previousScore) declined++;
    });

    insights.push(`${improved} metrikte iyileşme, ${declined} metrikte düşüş`);
    insights.push(improved > declined ? "Genel trend pozitif" : "Genel trend negatif");

    return insights;
  };

  const generateHeatmapData = (metrics: any[]) => {
    const categories = ["semantic", "structural", "linguistic", "performance", "turkish"];
    const aspects = ["accuracy", "consistency", "efficiency", "quality"];
    
    return categories.map(category => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      data: aspects.map(aspect => ({
        aspect: aspect.charAt(0).toUpperCase() + aspect.slice(1),
        value: 0.5 + Math.random() * 0.5, // Simulated data
        intensity: Math.floor((0.5 + Math.random() * 0.5) * 5),
      })),
    }));
  };

  const generateHeatmapInsights = (metrics: any[]): string[] => {
    return [
      "Semantik kategori en yüksek performansı gösteriyor",
      "Performans metrikleri tutarlı sonuçlar veriyor",
      "Türkçe dil kalitesi iyileştirme potansiyeli taşıyor",
    ];
  };

  const generateTrendData = (metrics: any[], historical: any[]): TrendData[] => {
    return metrics.map(metric => ({
      period: "Son 7 gün",
      value: (metric.currentScore || 0) * 100,
      change: (Math.random() - 0.5) * 10,
      direction: Math.random() > 0.5 ? "up" : Math.random() > 0.25 ? "stable" : "down",
    }));
  };

  // Render different visualization types
  const renderVisualization = (viz: MetricVisualization) => {
    switch (viz.type) {
      case "bar":
        return renderBarChart(viz);
      case "pie":
        return renderPieChart(viz);
      case "line":
        return renderLineChart(viz);
      case "gauge":
        return renderGaugeChart(viz);
      case "heatmap":
        return renderHeatmap(viz);
      default:
        return renderBarChart(viz);
    }
  };

  const renderBarChart = (viz: MetricVisualization) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {viz.data.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{item.name}</span>
              <div className="flex items-center gap-2">
                <Badge className={item.passed ? 'bg-green-500' : 'bg-red-500'}>
                  {item.score.toFixed(1)}%
                </Badge>
                {item.passed ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            <div className="relative">
              <Progress value={item.score} className="h-3" />
              <div 
                className="absolute top-0 h-3 w-1 bg-red-400 opacity-75"
                style={{ left: `${item.threshold}%` }}
                title={`Eşik: ${item.threshold}%`}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Kategori: {item.category}</span>
              <span>Eşik: {item.threshold}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPieChart = (viz: MetricVisualization) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {viz.data.map((item, index) => (
          <div key={index} className="text-center">
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: viz.config.colors[index % viz.config.colors.length] }}
            >
              {item.value.toFixed(0)}%
            </div>
            <div className="text-sm font-medium">{item.name}</div>
            <div className="text-xs text-gray-500">{item.count} metrik</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLineChart = (viz: MetricVisualization) => (
    <div className="space-y-4">
      <div className="text-center text-sm text-gray-500 mb-4">
        Zaman içinde metrik değişimleri (simüle edilmiş veri)
      </div>
      {viz.data.slice(0, 3).map((series, seriesIndex) => (
        <div key={seriesIndex} className="space-y-2">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: viz.config.colors[seriesIndex % viz.config.colors.length] }}
            />
            <span className="text-sm font-medium">{series.name}</span>
          </div>
          <div className="flex items-end gap-1 h-20">
            {series.data.map((point: any, pointIndex: number) => (
              <div key={pointIndex} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full rounded-t"
                  style={{ 
                    height: `${(point.value / 100) * 60}px`,
                    backgroundColor: viz.config.colors[seriesIndex % viz.config.colors.length],
                    opacity: 0.7,
                  }}
                />
                <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                  {point.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderGaugeChart = (viz: MetricVisualization) => {
    const data = viz.data[0];
    const percentage = (data.value / data.max) * 100;
    
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-48 h-24">
          <div className="absolute inset-0 rounded-t-full border-8 border-gray-200" />
          <div 
            className="absolute inset-0 rounded-t-full border-8 border-blue-500"
            style={{
              clipPath: `polygon(0 100%, ${percentage}% 100%, ${percentage}% 0, 0 0)`,
            }}
          />
          <div className="absolute inset-0 flex items-end justify-center pb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{data.value.toFixed(1)}%</div>
              <div className="text-sm text-gray-500">Genel Skor</div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 text-xs">
          {data.thresholds.map((threshold: any, index: number) => (
            <div key={index} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: threshold.color }}
              />
              <span>{threshold.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHeatmap = (viz: MetricVisualization) => (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-1">
        <div></div>
        {viz.data[0]?.data.map((aspect: any, index: number) => (
          <div key={index} className="text-xs text-center font-medium p-2">
            {aspect.aspect}
          </div>
        ))}
        {viz.data.map((category: any, categoryIndex: number) => (
          <React.Fragment key={categoryIndex}>
            <div className="text-xs font-medium p-2">{category.category}</div>
            {category.data.map((cell: any, cellIndex: number) => (
              <div
                key={cellIndex}
                className="aspect-square rounded flex items-center justify-center text-xs font-medium"
                style={{
                  backgroundColor: viz.config.colors[cell.intensity - 1],
                  color: cell.intensity > 2 ? 'white' : 'black',
                }}
                title={`${category.category} - ${cell.aspect}: ${(cell.value * 100).toFixed(1)}%`}
              >
                {(cell.value * 100).toFixed(0)}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      
      <div className="flex items-center justify-center gap-2 text-xs">
        <span>Düşük</span>
        {viz.config.colors.map((color, index) => (
          <div key={index} className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
        ))}
        <span>Yüksek</span>
      </div>
    </div>
  );

  const exportVisualization = () => {
    const data = {
      visualization: currentVisualization,
      timestamp: new Date().toISOString(),
      metrics: metrics,
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `metrics_visualization_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-500" />
                Değerlendirme Metrikleri Görselleştirmesi
              </CardTitle>
              <CardDescription>
                İnteraktif metrik analizi ve görselleştirme paneli
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInsights(!showInsights)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showInsights ? 'Öngörüleri Gizle' : 'Öngörüleri Göster'}
              </Button>
              {enableExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportVisualization}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Dışa Aktar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedVisualization} onValueChange={setSelectedVisualization}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Görselleştirme Türü" />
                </SelectTrigger>
                <SelectContent>
                  {visualizations.map(viz => (
                    <SelectItem key={viz.id} value={viz.id}>
                      {viz.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Metrik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Metrikler</SelectItem>
                {metrics.map(metric => (
                  <SelectItem key={metric.id} value={metric.id}>
                    {metric.name || metric.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Zaman" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1 Gün</SelectItem>
                <SelectItem value="7d">7 Gün</SelectItem>
                <SelectItem value="30d">30 Gün</SelectItem>
                <SelectItem value="90d">90 Gün</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnimationsEnabled(!animationsEnabled)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {animationsEnabled ? 'Animasyonları Kapat' : 'Animasyonları Aç'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Visualization */}
      <div className={`grid ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'} gap-6`}>
        {/* Visualization Panel */}
        <div className={isFullscreen ? 'col-span-1' : 'col-span-2'}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentVisualization.type === 'bar' && <BarChart3 className="h-5 w-5 text-blue-500" />}
                {currentVisualization.type === 'pie' && <PieChart className="h-5 w-5 text-green-500" />}
                {currentVisualization.type === 'line' && <LineChart className="h-5 w-5 text-purple-500" />}
                {currentVisualization.type === 'gauge' && <Gauge className="h-5 w-5 text-orange-500" />}
                {currentVisualization.type === 'heatmap' && <Layers className="h-5 w-5 text-red-500" />}
                {currentVisualization.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: currentVisualization.config.height }}>
                {renderVisualization(currentVisualization)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Panel */}
        {showInsights && !isFullscreen && (
          <div className="space-y-4">
            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Önemli Bulgular
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentVisualization.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{insight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trends */}
            {currentVisualization.trends.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Trend Analizi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentVisualization.trends.slice(0, 3).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{trend.period}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {trend.value.toFixed(1)}%
                          </span>
                          {trend.direction === "up" && (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                          {trend.direction === "down" && (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          {trend.direction === "stable" && (
                            <Activity className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-gray-500" />
                  Hızlı İstatistikler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Toplam Metrik:</span>
                    <span className="text-sm font-medium">{metrics.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Başarılı:</span>
                    <span className="text-sm font-medium text-green-600">
                      {metrics.filter(m => m.passed).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Başarısız:</span>
                    <span className="text-sm font-medium text-red-600">
                      {metrics.filter(m => !m.passed).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Ortalama Skor:</span>
                    <span className="text-sm font-medium">
                      {(calculateOverallScore(metrics) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Additional Visualizations Grid */}
      {!isFullscreen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visualizations.filter(v => v.id !== selectedVisualization).slice(0, 3).map(viz => (
            <Card key={viz.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  {viz.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVisualization(viz.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: 150 }}>
                  {renderVisualization({
                    ...viz,
                    config: { ...viz.config, height: 150 }
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Data State */}
      {metrics.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Görselleştirilecek Veri Yok
            </h3>
            <p className="text-gray-500 mb-4">
              Metrikleri görselleştirmek için önce bir değerlendirme çalıştırın.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}