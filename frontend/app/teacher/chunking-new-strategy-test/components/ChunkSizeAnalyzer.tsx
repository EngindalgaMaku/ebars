"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Layers, 
  BarChart3, 
  TrendingUp, 
  Zap,
  Target,
  Activity,
  PieChart,
  Maximize2,
  Minimize2,
  Filter,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  Thermometer,
  Grid3X3,
  LineChart,
  Scissors,
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
  LineChart as RechartsLineChart,
  Line,
  ScatterChart,
  Scatter,
  Area,
  AreaChart,
  ComposedChart,
  Cell,
  Treemap
} from "recharts";

// Enhanced interfaces for size analysis
interface SizeMetrics {
  characters: number;
  words: number;
  sentences: number;
  paragraphs: number;
  averageWordLength: number;
  averageSentenceLength: number;
  densityScore: number; // information density per character
  complexityScore: number; // structural complexity
}

interface SizeDistribution {
  range: string;
  count: number;
  percentage: number;
  averageQuality: number;
  totalTokens: number;
}

interface ChunkSizeData {
  id: string;
  index: number;
  content: string;
  size: number;
  sizeMetrics: SizeMetrics;
  qualityScore: number;
  semanticScore: number;
  boundaryType: string;
  efficiency: number;
  category: 'small' | 'medium' | 'large' | 'xlarge';
  outlier: boolean;
}

interface ComparisonMetrics {
  traditional: {
    averageSize: number;
    sizeVariance: number;
    distribution: SizeDistribution[];
  };
  agentic: {
    averageSize: number;
    sizeVariance: number;
    distribution: SizeDistribution[];
  };
}

interface ChunkSizeAnalyzerProps {
  chunks: any[];
  originalText: string;
  strategy: string;
  comparisonData?: any;
  enableHeatmap?: boolean;
  showTrendAnalysis?: boolean;
}

const ChunkSizeAnalyzer: React.FC<ChunkSizeAnalyzerProps> = ({
  chunks,
  originalText,
  strategy,
  comparisonData,
  enableHeatmap = true,
  showTrendAnalysis = true
}) => {
  const [activeView, setActiveView] = useState<"heatmap" | "distribution" | "trends" | "comparison">("heatmap");
  const [sizeRange, setSizeRange] = useState<{ min: number; max: number }>({ min: 0, max: 5000 });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showOutliers, setShowOutliers] = useState(true);
  const [heatmapMetric, setHeatmapMetric] = useState<"size" | "quality" | "efficiency">("size");
  const [zoomLevel, setZoomLevel] = useState(1);

  // Calculate size metrics for a chunk
  const calculateSizeMetrics = (text: string): SizeMetrics => {
    const characters = text.length;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    const averageWordLength = words.length > 0 ? 
      words.reduce((sum, word) => sum + word.length, 0) / words.length : 0;
    
    const averageSentenceLength = sentences.length > 0 ? characters / sentences.length : 0;
    
    // Information density: unique words / total words
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    const densityScore = words.length > 0 ? uniqueWords / words.length : 0;
    
    // Complexity based on sentence structure and punctuation
    const punctuationCount = (text.match(/[,;:()]/g) || []).length;
    const complexityScore = sentences.length > 0 ? 
      (punctuationCount + sentences.length) / characters * 100 : 0;
    
    return {
      characters,
      words: words.length,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      averageWordLength,
      averageSentenceLength,
      densityScore,
      complexityScore
    };
  };

  // Categorize chunk by size
  const categorizeBySize = (size: number): 'small' | 'medium' | 'large' | 'xlarge' => {
    if (size <= 500) return 'small';
    if (size <= 1000) return 'medium';
    if (size <= 2000) return 'large';
    return 'xlarge';
  };

  // Detect outliers using IQR method
  const detectOutliers = (sizes: number[]): boolean[] => {
    const sorted = [...sizes].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return sizes.map(size => size < lowerBound || size > upperBound);
  };

  // Process chunks with size analysis
  const processedChunks = useMemo(() => {
    const chunkSizes = chunks.map(chunk => chunk.size || chunk.content?.length || 0);
    const outliers = detectOutliers(chunkSizes);
    
    return chunks.map((chunk, index) => {
      const content = chunk.content || '';
      const size = chunk.size || content.length;
      const sizeMetrics = calculateSizeMetrics(content);
      const category = categorizeBySize(size);
      
      // Calculate efficiency (information per character)
      const efficiency = size > 0 ? sizeMetrics.densityScore / (size / 1000) : 0;
      
      return {
        id: chunk.id || `chunk_${index}`,
        index: index + 1,
        content,
        size,
        sizeMetrics,
        qualityScore: chunk.semanticScore || chunk.qualityScore || 0.7,
        semanticScore: chunk.semanticScore || 0.7,
        boundaryType: chunk.boundaryType || 'unknown',
        efficiency,
        category,
        outlier: outliers[index]
      } as ChunkSizeData;
    });
  }, [chunks]);

  // Filter chunks
  const filteredChunks = useMemo(() => {
    let filtered = processedChunks.filter(chunk => 
      chunk.size >= sizeRange.min && chunk.size <= sizeRange.max
    );
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(chunk => chunk.category === selectedCategory);
    }
    
    if (!showOutliers) {
      filtered = filtered.filter(chunk => !chunk.outlier);
    }
    
    return filtered;
  }, [processedChunks, sizeRange, selectedCategory, showOutliers]);

  // Calculate size distribution
  const sizeDistribution = useMemo(() => {
    const ranges = [
      { range: "0-250", min: 0, max: 250 },
      { range: "251-500", min: 251, max: 500 },
      { range: "501-1000", min: 501, max: 1000 },
      { range: "1001-1500", min: 1001, max: 1500 },
      { range: "1501-2000", min: 1501, max: 2000 },
      { range: "2000+", min: 2001, max: Infinity }
    ];
    
    return ranges.map(({ range, min, max }) => {
      const chunksInRange = filteredChunks.filter(chunk => 
        chunk.size >= min && (max === Infinity ? true : chunk.size <= max)
      );
      
      const count = chunksInRange.length;
      const percentage = filteredChunks.length > 0 ? (count / filteredChunks.length) * 100 : 0;
      const averageQuality = count > 0 ? 
        chunksInRange.reduce((sum, chunk) => sum + chunk.qualityScore, 0) / count : 0;
      const totalTokens = chunksInRange.reduce((sum, chunk) => 
        sum + Math.ceil(chunk.sizeMetrics.words * 1.3), 0
      );
      
      return {
        range,
        count,
        percentage,
        averageQuality,
        totalTokens
      };
    });
  }, [filteredChunks]);

  // Calculate aggregate statistics
  const aggregateStats = useMemo(() => {
    if (filteredChunks.length === 0) return null;
    
    const sizes = filteredChunks.map(chunk => chunk.size);
    const qualities = filteredChunks.map(chunk => chunk.qualityScore);
    const efficiencies = filteredChunks.map(chunk => chunk.efficiency);
    
    const totalSize = sizes.reduce((sum, size) => sum + size, 0);
    const averageSize = totalSize / sizes.length;
    const sizeVariance = sizes.reduce((sum, size) => sum + Math.pow(size - averageSize, 2), 0) / sizes.length;
    const sizeStdDev = Math.sqrt(sizeVariance);
    
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);
    const medianSize = sizes.sort((a, b) => a - b)[Math.floor(sizes.length / 2)];
    
    const averageQuality = qualities.reduce((sum, q) => sum + q, 0) / qualities.length;
    const averageEfficiency = efficiencies.reduce((sum, e) => sum + e, 0) / efficiencies.length;
    
    // Size consistency (lower CV is better)
    const coefficientOfVariation = (sizeStdDev / averageSize) * 100;
    
    // Quality-size correlation
    const qualitySizeCorrelation = calculateCorrelation(sizes, qualities);
    
    return {
      totalChunks: filteredChunks.length,
      totalSize,
      averageSize,
      sizeVariance,
      sizeStdDev,
      minSize,
      maxSize,
      medianSize,
      averageQuality,
      averageEfficiency,
      coefficientOfVariation,
      qualitySizeCorrelation,
      outlierCount: filteredChunks.filter(chunk => chunk.outlier).length
    };
  }, [filteredChunks]);

  // Calculate correlation coefficient
  const calculateCorrelation = (x: number[], y: number[]): number => {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  // Prepare heatmap data
  const heatmapData = useMemo(() => {
    const gridSize = Math.ceil(Math.sqrt(filteredChunks.length));
    const data = [];
    
    for (let i = 0; i < filteredChunks.length; i++) {
      const chunk = filteredChunks[i];
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      let value = 0;
      let color = '#e5e7eb';
      
      switch (heatmapMetric) {
        case 'size':
          value = chunk.size;
          color = chunk.size > (aggregateStats?.averageSize || 1000) ? '#ef4444' : 
                 chunk.size > (aggregateStats?.averageSize || 1000) * 0.7 ? '#f59e0b' : '#10b981';
          break;
        case 'quality':
          value = chunk.qualityScore * 100;
          color = chunk.qualityScore > 0.8 ? '#10b981' : 
                 chunk.qualityScore > 0.6 ? '#f59e0b' : '#ef4444';
          break;
        case 'efficiency':
          value = chunk.efficiency * 100;
          color = chunk.efficiency > 0.7 ? '#10b981' : 
                 chunk.efficiency > 0.4 ? '#f59e0b' : '#ef4444';
          break;
      }
      
      data.push({
        x: col,
        y: row,
        value,
        color,
        chunk: chunk
      });
    }
    
    return { data, gridSize };
  }, [filteredChunks, heatmapMetric, aggregateStats]);

  // Prepare trend data
  const trendData = useMemo(() => {
    return filteredChunks.map((chunk, index) => ({
      index: index + 1,
      size: chunk.size,
      quality: chunk.qualityScore * 100,
      efficiency: chunk.efficiency * 100,
      cumulativeAverage: filteredChunks.slice(0, index + 1)
        .reduce((sum, c) => sum + c.size, 0) / (index + 1),
      movingAverage: index >= 4 ? 
        filteredChunks.slice(index - 4, index + 1)
          .reduce((sum, c) => sum + c.size, 0) / 5 : chunk.size
    }));
  }, [filteredChunks]);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

  if (!aggregateStats) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Boyut Analizi Mevcut Değil
          </h3>
          <p className="text-gray-500">
            Boyut analizi için chunk verisi bulunamadı.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Chunk Boyut Analizi</h2>
          <Badge variant="outline" className="ml-2">
            {aggregateStats.totalChunks} Chunk
          </Badge>
          {aggregateStats.outlierCount > 0 && (
            <Badge variant="destructive" className="ml-1">
              {aggregateStats.outlierCount} Aykırı
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeView === "heatmap" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("heatmap")}
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            Heatmap
          </Button>
          <Button
            variant={activeView === "distribution" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("distribution")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Dağılım
          </Button>
          {showTrendAnalysis && (
            <Button
              variant={activeView === "trends" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView("trends")}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Trend
            </Button>
          )}
          {comparisonData && (
            <Button
              variant={activeView === "comparison" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView("comparison")}
            >
              <Scissors className="h-4 w-4 mr-2" />
              Karşılaştırma
            </Button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="size-range">Boyut Aralığı (karakter)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="size-range-min"
                  type="number"
                  placeholder="Min"
                  value={sizeRange.min}
                  onChange={(e) => setSizeRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                  className="w-24"
                />
                <Input
                  id="size-range-max"
                  type="number"
                  placeholder="Max"
                  value={sizeRange.max}
                  onChange={(e) => setSizeRange(prev => ({ ...prev, max: parseInt(e.target.value) || 5000 }))}
                  className="w-24"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category-select">Kategori</Label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Kategoriler</option>
                <option value="small">Küçük (≤500)</option>
                <option value="medium">Orta (501-1000)</option>
                <option value="large">Büyük (1001-2000)</option>
                <option value="xlarge">Çok Büyük (&gt;2000)</option>
              </select>
            </div>

            {activeView === "heatmap" && (
              <div>
                <Label htmlFor="heatmap-metric">Heatmap Metriği</Label>
                <select
                  id="heatmap-metric"
                  value={heatmapMetric}
                  onChange={(e) => setHeatmapMetric(e.target.value as any)}
                  className="mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="size">Boyut</option>
                  <option value="quality">Kalite</option>
                  <option value="efficiency">Verimlilik</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOutliers(!showOutliers)}
              >
                {showOutliers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showOutliers ? "Aykırı Gizle" : "Aykırı Göster"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSizeRange({ min: 0, max: 5000 });
                  setSelectedCategory("all");
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Sıfırla
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ortalama Boyut</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(aggregateStats.averageSize)}
                </p>
                <p className="text-xs text-gray-500">
                  Medyan: {Math.round(aggregateStats.medianSize)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Boyut Tutarlılığı</p>
                <p className="text-2xl font-bold text-green-600">
                  {aggregateStats.coefficientOfVariation.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">
                  CV (düşük = iyi)
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kalite-Boyut Korelasyonu</p>
                <p className="text-2xl font-bold text-purple-600">
                  {aggregateStats.qualitySizeCorrelation.toFixed(3)}
                </p>
                <p className="text-xs text-gray-500">
                  {Math.abs(aggregateStats.qualitySizeCorrelation) > 0.5 ? 'Güçlü' : 
                   Math.abs(aggregateStats.qualitySizeCorrelation) > 0.3 ? 'Orta' : 'Zayıf'}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Boyut Aralığı</p>
                <p className="text-2xl font-bold text-orange-600">
                  {aggregateStats.minSize} - {aggregateStats.maxSize}
                </p>
                <p className="text-xs text-gray-500">
                  Std: {Math.round(aggregateStats.sizeStdDev)}
                </p>
              </div>
              <Maximize2 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap View */}
      {activeView === "heatmap" && enableHeatmap && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Chunk Boyut Heatmap - {heatmapMetric === 'size' ? 'Boyut' : heatmapMetric === 'quality' ? 'Kalite' : 'Verimlilik'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Her kare bir chunk'ı temsil eder. Renk yoğunluğu seçilen metriği gösterir.
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">{Math.round(zoomLevel * 100)}%</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div 
                className="grid gap-1 p-4 bg-gray-50 rounded-lg overflow-auto"
                style={{ 
                  gridTemplateColumns: `repeat(${heatmapData.gridSize}, 1fr)`,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top left'
                }}
              >
                {heatmapData.data.map((cell, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded cursor-pointer transition-all hover:scale-110 hover:z-10 relative"
                    style={{ backgroundColor: cell.color }}
                    title={`Chunk ${cell.chunk.index}: ${
                      heatmapMetric === 'size' ? `${cell.chunk.size} karakter` :
                      heatmapMetric === 'quality' ? `Kalite: ${(cell.chunk.qualityScore * 100).toFixed(1)}%` :
                      `Verimlilik: ${(cell.chunk.efficiency * 100).toFixed(1)}%`
                    }`}
                  >
                    {cell.chunk.outlier && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white" />
                    )}
                  </div>
                ))}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Yüksek</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>Orta</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Düşük</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                  <span>Aykırı Değer</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribution View */}
      {activeView === "distribution" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Size Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Boyut Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sizeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        const numValue = Number(value);
                        const formattedValue = 
                          name === 'count' ? `${value} chunk` :
                          name === 'percentage' ? `${numValue.toFixed(1)}%` :
                          name === 'averageQuality' ? `${(numValue * 100).toFixed(1)}%` :
                          `${value} token`;
                        
                        const formattedName = 
                          name === 'count' ? 'Chunk Sayısı' :
                          name === 'percentage' ? 'Yüzde' :
                          name === 'averageQuality' ? 'Ortalama Kalite' :
                          'Toplam Token';

                        return [formattedValue, formattedName];
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" name="Chunk Sayısı" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quality vs Size Scatter */}
            <Card>
              <CardHeader>
                <CardTitle>Kalite vs Boyut Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={filteredChunks.map(chunk => ({
                    size: chunk.size,
                    quality: chunk.qualityScore * 100,
                    category: chunk.category,
                    outlier: chunk.outlier
                  }))}>
                    <CartesianGrid />
                    <XAxis dataKey="size" name="Boyut" />
                    <YAxis dataKey="quality" name="Kalite" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter 
                      name="Normal" 
                      data={filteredChunks.filter(c => !c.outlier).map(chunk => ({
                        size: chunk.size,
                        quality: chunk.qualityScore * 100
                      }))} 
                      fill="#3b82f6" 
                    />
                    <Scatter 
                      name="Aykırı" 
                      data={filteredChunks.filter(c => c.outlier).map(chunk => ({
                        size: chunk.size,
                        quality: chunk.qualityScore * 100
                      }))} 
                      fill="#ef4444" 
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Distribution Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detaylı Dağılım Tablosu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Boyut Aralığı</th>
                      <th className="text-right p-2">Chunk Sayısı</th>
                      <th className="text-right p-2">Yüzde</th>
                      <th className="text-right p-2">Ortalama Kalite</th>
                      <th className="text-right p-2">Toplam Token</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeDistribution.map((dist, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{dist.range}</td>
                        <td className="p-2 text-right">{dist.count}</td>
                        <td className="p-2 text-right">{dist.percentage.toFixed(1)}%</td>
                        <td className="p-2 text-right">
                          <span className={`px-2 py-1 rounded text-xs ${
                            dist.averageQuality > 0.8 ? 'bg-green-100 text-green-800' :
                            dist.averageQuality > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {(dist.averageQuality * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-2 text-right">{dist.totalTokens.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trends View */}
      {activeView === "trends" && showTrendAnalysis && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Boyut Trend Analizi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="size" fill="#e5e7eb" name="Chunk Boyutu" />
                  <Line type="monotone" dataKey="cumulativeAverage" stroke="#3b82f6" name="Kümülatif Ortalama" strokeWidth={2} />
                  <Line type="monotone" dataKey="movingAverage" stroke="#10b981" name="Hareketli Ortalama (5)" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kalite Trendi</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="quality" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verimlilik Trendi</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="efficiency" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Comparison View */}
      {activeView === "comparison" && comparisonData && (
        <Card>
          <CardHeader>
            <CardTitle>Strateji Karşılaştırması</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              Karşılaştırma özelliği yakında eklenecek...
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChunkSizeAnalyzer;