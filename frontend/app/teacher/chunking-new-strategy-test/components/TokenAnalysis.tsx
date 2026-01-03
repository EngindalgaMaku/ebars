"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Zap,
  FileText,
  Hash,
  Clock,
  Target,
  Activity,
  PieChart,
  Filter,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info
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
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  Histogram,
  ScatterChart,
  Scatter,
  Area,
  AreaChart
} from "recharts";

// Enhanced interfaces for token analysis
interface TokenMetrics {
  characters: number;
  words: number;
  tokens: number;
  sentences: number;
  paragraphs: number;
  averageWordsPerSentence: number;
  averageTokensPerWord: number;
  tokenDensity: number; // tokens per character
  readabilityScore?: number;
}

interface CostAnalysis {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  costPerChunk: number;
  costEfficiency: number; // cost per information unit
}

interface TurkishLanguageMetrics {
  morphologicalComplexity: number; // average morphemes per word
  agglutinationIndex: number; // measure of agglutination
  averageWordLength: number;
  suffixDensity: number;
  readabilityIndex: number; // Turkish-specific readability
  discourseMarkerCount: number;
  complexSentenceRatio: number;
}

interface ChunkTokenData {
  id: string;
  content: string;
  size: number;
  tokenMetrics: TokenMetrics;
  costAnalysis: CostAnalysis;
  turkishMetrics?: TurkishLanguageMetrics;
  informationDensity: number;
  qualityScore: number;
  efficiency: number; // information per token ratio
}

interface TokenAnalysisProps {
  chunks: any[];
  originalText: string;
  strategy: string;
  enableTurkishAnalysis?: boolean;
  showCostAnalysis?: boolean;
  tokenPricing?: {
    inputCostPer1K: number;
    outputCostPer1K: number;
  };
}

const TokenAnalysis: React.FC<TokenAnalysisProps> = ({
  chunks,
  originalText,
  strategy,
  enableTurkishAnalysis = true,
  showCostAnalysis = true,
  tokenPricing = { inputCostPer1K: 0.0015, outputCostPer1K: 0.002 }
}) => {
  const [activeView, setActiveView] = useState<"overview" | "distribution" | "comparison" | "efficiency">("overview");
  const [sizeFilter, setSizeFilter] = useState<{ min: number; max: number }>({ min: 0, max: 10000 });
  const [selectedMetric, setSelectedMetric] = useState<"tokens" | "characters" | "words" | "cost">("tokens");
  const [showOutliers, setShowOutliers] = useState(true);
  const [groupBy, setGroupBy] = useState<"size" | "quality" | "efficiency">("size");

  // Enhanced token counting function
  const calculateTokenMetrics = (text: string): TokenMetrics => {
    const characters = text.length;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    // Improved token estimation for Turkish
    // Turkish has more complex morphology, so tokens ≈ words * 1.3
    const tokens = Math.ceil(words * (enableTurkishAnalysis ? 1.3 : 1.2));
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    
    const averageWordsPerSentence = sentences > 0 ? words / sentences : 0;
    const averageTokensPerWord = words > 0 ? tokens / words : 0;
    const tokenDensity = characters > 0 ? tokens / characters : 0;
    
    // Simple readability score (Flesch-like for Turkish)
    const readabilityScore = enableTurkishAnalysis 
      ? Math.max(0, Math.min(100, 206.835 - (1.015 * averageWordsPerSentence) - (84.6 * (characters / words))))
      : Math.max(0, Math.min(100, 206.835 - (1.015 * averageWordsPerSentence) - (84.6 * (characters / words))));

    return {
      characters,
      words,
      tokens,
      sentences,
      paragraphs,
      averageWordsPerSentence,
      averageTokensPerWord,
      tokenDensity,
      readabilityScore
    };
  };

  // Turkish language specific analysis
  const calculateTurkishMetrics = (text: string): TurkishLanguageMetrics => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const totalCharacters = words.reduce((sum, word) => sum + word.length, 0);
    const averageWordLength = words.length > 0 ? totalCharacters / words.length : 0;
    
    // Estimate morphological complexity (Turkish words have many suffixes)
    const morphologicalComplexity = Math.min(3, averageWordLength / 4);
    
    // Agglutination index (higher for Turkish)
    const agglutinationIndex = Math.min(1, averageWordLength / 8);
    
    // Suffix density estimation
    const suffixDensity = words.filter(word => 
      word.includes('lar') || word.includes('ler') || 
      word.includes('da') || word.includes('de') ||
      word.includes('den') || word.includes('dan')
    ).length / words.length;
    
    // Turkish readability (adjusted for agglutinative nature)
    const readabilityIndex = Math.max(0, Math.min(100, 
      100 - (averageWordLength * 10) - (morphologicalComplexity * 20)
    ));
    
    // Discourse markers
    const discourseMarkers = ['ancak', 'fakat', 'lakin', 'ama', 'çünkü', 'dolayısıyla', 'böylece'];
    const discourseMarkerCount = discourseMarkers.reduce((count, marker) => 
      count + (text.toLowerCase().match(new RegExp(marker, 'g')) || []).length, 0
    );
    
    // Complex sentence ratio
    const complexSentenceRatio = (text.match(/[,;:]/g) || []).length / 
      (text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1);
    
    return {
      morphologicalComplexity,
      agglutinationIndex,
      averageWordLength,
      suffixDensity,
      readabilityIndex,
      discourseMarkerCount,
      complexSentenceRatio
    };
  };

  // Cost analysis calculation
  const calculateCostAnalysis = (tokenMetrics: TokenMetrics): CostAnalysis => {
    const inputTokens = tokenMetrics.tokens;
    const outputTokens = Math.ceil(tokenMetrics.tokens * 0.1); // Assume 10% output for processing
    const totalTokens = inputTokens + outputTokens;
    
    const estimatedCost = 
      (inputTokens / 1000) * tokenPricing.inputCostPer1K +
      (outputTokens / 1000) * tokenPricing.outputCostPer1K;
    
    const costPerChunk = estimatedCost;
    const costEfficiency = tokenMetrics.words > 0 ? estimatedCost / tokenMetrics.words : 0;
    
    return {
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
      costPerChunk,
      costEfficiency
    };
  };

  // Calculate information density
  const calculateInformationDensity = (text: string, tokenMetrics: TokenMetrics): number => {
    // Simple information density based on unique words and sentence complexity
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words).size;
    const uniqueWordRatio = words.length > 0 ? uniqueWords / words.length : 0;
    
    // Factor in sentence complexity
    const sentenceComplexity = tokenMetrics.averageWordsPerSentence / 15; // normalized
    
    return Math.min(1, uniqueWordRatio * 0.7 + sentenceComplexity * 0.3);
  };

  // Process chunks with enhanced token analysis
  const processedChunks = useMemo(() => {
    return chunks.map((chunk, index) => {
      const tokenMetrics = calculateTokenMetrics(chunk.content);
      const costAnalysis = calculateCostAnalysis(tokenMetrics);
      const turkishMetrics = enableTurkishAnalysis ? calculateTurkishMetrics(chunk.content) : undefined;
      const informationDensity = calculateInformationDensity(chunk.content, tokenMetrics);
      
      // Quality score based on multiple factors
      const qualityScore = Math.min(1, 
        (chunk.semanticScore || 0.7) * 0.4 +
        informationDensity * 0.3 +
        (tokenMetrics.readabilityScore || 50) / 100 * 0.3
      );
      
      // Efficiency: information per token
      const efficiency = tokenMetrics.tokens > 0 ? informationDensity / (tokenMetrics.tokens / 100) : 0;
      
      return {
        id: chunk.id || `chunk_${index}`,
        content: chunk.content,
        size: chunk.size || chunk.content.length,
        tokenMetrics,
        costAnalysis,
        turkishMetrics,
        informationDensity,
        qualityScore,
        efficiency
      } as ChunkTokenData;
    });
  }, [chunks, enableTurkishAnalysis, tokenPricing]);

  // Filter chunks based on size filter
  const filteredChunks = useMemo(() => {
    return processedChunks.filter(chunk => 
      chunk.size >= sizeFilter.min && chunk.size <= sizeFilter.max
    );
  }, [processedChunks, sizeFilter]);

  // Calculate aggregate statistics
  const aggregateStats = useMemo(() => {
    if (filteredChunks.length === 0) return null;
    
    const totalTokens = filteredChunks.reduce((sum, chunk) => sum + chunk.tokenMetrics.tokens, 0);
    const totalCost = filteredChunks.reduce((sum, chunk) => sum + chunk.costAnalysis.estimatedCost, 0);
    const totalCharacters = filteredChunks.reduce((sum, chunk) => sum + chunk.tokenMetrics.characters, 0);
    const totalWords = filteredChunks.reduce((sum, chunk) => sum + chunk.tokenMetrics.words, 0);
    
    const avgTokensPerChunk = totalTokens / filteredChunks.length;
    const avgCostPerChunk = totalCost / filteredChunks.length;
    const avgInformationDensity = filteredChunks.reduce((sum, chunk) => sum + chunk.informationDensity, 0) / filteredChunks.length;
    const avgEfficiency = filteredChunks.reduce((sum, chunk) => sum + chunk.efficiency, 0) / filteredChunks.length;
    
    // Size distribution
    const sizeRanges = [
      { range: "0-500", count: filteredChunks.filter(c => c.size <= 500).length },
      { range: "501-1000", count: filteredChunks.filter(c => c.size > 500 && c.size <= 1000).length },
      { range: "1001-1500", count: filteredChunks.filter(c => c.size > 1000 && c.size <= 1500).length },
      { range: "1501-2000", count: filteredChunks.filter(c => c.size > 1500 && c.size <= 2000).length },
      { range: "2000+", count: filteredChunks.filter(c => c.size > 2000).length }
    ];
    
    // Token distribution
    const tokenRanges = [
      { range: "0-100", count: filteredChunks.filter(c => c.tokenMetrics.tokens <= 100).length },
      { range: "101-250", count: filteredChunks.filter(c => c.tokenMetrics.tokens > 100 && c.tokenMetrics.tokens <= 250).length },
      { range: "251-500", count: filteredChunks.filter(c => c.tokenMetrics.tokens > 250 && c.tokenMetrics.tokens <= 500).length },
      { range: "501-750", count: filteredChunks.filter(c => c.tokenMetrics.tokens > 500 && c.tokenMetrics.tokens <= 750).length },
      { range: "750+", count: filteredChunks.filter(c => c.tokenMetrics.tokens > 750).length }
    ];
    
    return {
      totalChunks: filteredChunks.length,
      totalTokens,
      totalCost,
      totalCharacters,
      totalWords,
      avgTokensPerChunk,
      avgCostPerChunk,
      avgInformationDensity,
      avgEfficiency,
      sizeRanges,
      tokenRanges,
      minTokens: Math.min(...filteredChunks.map(c => c.tokenMetrics.tokens)),
      maxTokens: Math.max(...filteredChunks.map(c => c.tokenMetrics.tokens)),
      tokenStdDev: Math.sqrt(
        filteredChunks.reduce((sum, chunk) => 
          sum + Math.pow(chunk.tokenMetrics.tokens - avgTokensPerChunk, 2), 0
        ) / filteredChunks.length
      )
    };
  }, [filteredChunks]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return filteredChunks.map((chunk, index) => ({
      index: index + 1,
      tokens: chunk.tokenMetrics.tokens,
      characters: chunk.tokenMetrics.characters,
      words: chunk.tokenMetrics.words,
      cost: chunk.costAnalysis.estimatedCost * 1000, // Convert to cents for better visualization
      density: chunk.informationDensity * 100,
      efficiency: chunk.efficiency * 100,
      quality: chunk.qualityScore * 100,
      readability: chunk.tokenMetrics.readabilityScore || 0
    }));
  }, [filteredChunks]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (!aggregateStats) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Token Analizi Mevcut Değil
          </h3>
          <p className="text-gray-500">
            Token analizi için chunk verisi bulunamadı.
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
          <Calculator className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Token & Boyut Analizi</h2>
          <Badge variant="outline" className="ml-2">
            {aggregateStats.totalChunks} Chunk
          </Badge>
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
            variant={activeView === "distribution" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("distribution")}
          >
            <PieChart className="h-4 w-4 mr-2" />
            Dağılım
          </Button>
          <Button
            variant={activeView === "comparison" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("comparison")}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Karşılaştırma
          </Button>
          <Button
            variant={activeView === "efficiency" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("efficiency")}
          >
            <Zap className="h-4 w-4 mr-2" />
            Verimlilik
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="size-filter">Boyut Filtresi (karakter)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="size-filter-min"
                  type="number"
                  placeholder="Min"
                  value={sizeFilter.min}
                  onChange={(e) => setSizeFilter(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                  className="w-24"
                />
                <Input
                  id="size-filter-max"
                  type="number"
                  placeholder="Max"
                  value={sizeFilter.max}
                  onChange={(e) => setSizeFilter(prev => ({ ...prev, max: parseInt(e.target.value) || 10000 }))}
                  className="w-24"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="metric-select">Metrik</Label>
              <select
                id="metric-select"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className="mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="tokens">Token Sayısı</option>
                <option value="characters">Karakter Sayısı</option>
                <option value="words">Kelime Sayısı</option>
                {showCostAnalysis && <option value="cost">Maliyet</option>}
              </select>
            </div>

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
                onClick={() => setSizeFilter({ min: 0, max: 10000 })}
              >
                <RefreshCw className="h-4 w-4" />
                Sıfırla
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Tab */}
      {activeView === "overview" && (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Toplam Token</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {aggregateStats.totalTokens.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ort: {Math.round(aggregateStats.avgTokensPerChunk)}
                    </p>
                  </div>
                  <Hash className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Toplam Karakter</p>
                    <p className="text-2xl font-bold text-green-600">
                      {aggregateStats.totalCharacters.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round(aggregateStats.totalCharacters / aggregateStats.totalChunks)} ort/chunk
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            {showCostAnalysis && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Tahmini Maliyet</p>
                      <p className="text-2xl font-bold text-orange-600">
                        ${aggregateStats.totalCost.toFixed(4)}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${aggregateStats.avgCostPerChunk.toFixed(6)}/chunk
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Bilgi Yoğunluğu</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(aggregateStats.avgInformationDensity * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      Verimlilik: {(aggregateStats.avgEfficiency * 100).toFixed(1)}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Token Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Chunk Boyunca Token Dağılımı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      typeof value === 'number' ? value.toLocaleString() : value,
                      name === 'tokens' ? 'Token' : 
                      name === 'characters' ? 'Karakter' : 
                      name === 'words' ? 'Kelime' : name
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Statistical Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  İstatistiksel Özet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Min Token:</span>
                  <span className="font-semibold">{aggregateStats.minTokens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Token:</span>
                  <span className="font-semibold">{aggregateStats.maxTokens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Standart Sapma:</span>
                  <span className="font-semibold">{Math.round(aggregateStats.tokenStdDev)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Varyasyon Katsayısı:</span>
                  <span className="font-semibold">
                    {((aggregateStats.tokenStdDev / aggregateStats.avgTokensPerChunk) * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {enableTurkishAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Türkçe Dil Metrikleri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ort. Kelime Uzunluğu:</span>
                    <span className="font-semibold">
                      {(filteredChunks.reduce((sum, c) => sum + (c.turkishMetrics?.averageWordLength || 0), 0) / filteredChunks.length).toFixed(1)} karakter
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Morfolojik Karmaşıklık:</span>
                    <span className="font-semibold">
                      {(filteredChunks.reduce((sum, c) => sum + (c.turkishMetrics?.morphologicalComplexity || 0), 0) / filteredChunks.length).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ekleşme İndeksi:</span>
                    <span className="font-semibold">
                      {(filteredChunks.reduce((sum, c) => sum + (c.turkishMetrics?.agglutinationIndex || 0), 0) / filteredChunks.length).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Okunabilirlik:</span>
                    <span className="font-semibold">
                      {(filteredChunks.reduce((sum, c) => sum + (c.turkishMetrics?.readabilityIndex || 0), 0) / filteredChunks.length).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Distribution Tab */}
      {activeView === "distribution" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Size Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Boyut Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={aggregateStats.sizeRanges}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ range, count, percent }) => `${range}: ${count} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {aggregateStats.sizeRanges.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Token Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Token Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={aggregateStats.tokenRanges}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ range, count, percent }) => `${range}: ${count} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#82ca9d"
                      dataKey="count"
                    >
                      {aggregateStats.tokenRanges.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Histogram */}
          <Card>
            <CardHeader>
              <CardTitle>Token Sayısı Histogramı</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tokens" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparison Tab */}
      {activeView === "comparison" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Metrik Karşılaştırması</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="tokens" stroke="#3b82f6" name="Token" />
                  <Line type="monotone" dataKey="density" stroke="#10b981" name="Bilgi Yoğunluğu %" />
                  <Line type="monotone" dataKey="quality" stroke="#f59e0b" name="Kalite %" />
                  <Line type="monotone" dataKey="readability" stroke="#ef4444" name="Okunabilirlik %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Scatter Plot */}
          <Card>
            <CardHeader>
              <CardTitle>Token vs Kalite Korelasyonu</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={chartData}>
                  <CartesianGrid />
                  <XAxis dataKey="tokens" name="Token Sayısı" />
                  <YAxis dataKey="quality" name="Kalite Skoru" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Chunk'lar" data={chartData} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Efficiency Tab */}
      {activeView === "efficiency" && (
        <div className="space-y-6">
          {/* Efficiency Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">
                  {(aggregateStats.avgEfficiency * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Ortalama Verimlilik</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {(aggregateStats.avgInformationDensity * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Bilgi Yoğunluğu</div>
              </CardContent>
            </Card>

            {showCostAnalysis && (
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600">
                    ${(aggregateStats.totalCost / (aggregateStats.avgInformationDensity * aggregateStats.totalChunks)).toFixed(6)}
                  </div>
                  <div className="text-sm text-gray-600">Maliyet/Bilgi Birimi</div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Efficiency Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Verimlilik Analizi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="efficiency" fill="#10b981" name="Verimlilik %" />
                  <Bar dataKey="density" fill="#3b82f6" name="Bilgi Yoğunluğu %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>En Verimli Chunk'lar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredChunks
                  .sort((a, b) => b.efficiency - a.efficiency)
                  .slice(0, 5)
                  .map((chunk, index) => (
                    <div key={chunk.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <div className="font-medium">
                            {chunk.tokenMetrics.tokens} token, {chunk.size} karakter
                          </div>
                          <div className="text-sm text-gray-500">
                            {chunk.content.substring(0, 60)}...
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {(chunk.efficiency * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">verimlilik</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TokenAnalysis;