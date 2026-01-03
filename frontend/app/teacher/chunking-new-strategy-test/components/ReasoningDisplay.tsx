"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Brain, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Eye,
  EyeOff,
  BarChart3,
  Clock,
  Target,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Activity
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Enhanced interfaces for reasoning data
interface ReasoningQualityScores {
  depth: number; // 0-1: How detailed the reasoning is
  consistency: number; // 0-1: How consistent with other decisions
  contextUnderstanding: number; // 0-1: How well it understands context
  overall: number; // 0-1: Overall quality score
}

interface EnhancedChunkData {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  size: number;
  semanticScore?: number;
  boundaryType?: "natural" | "forced" | "semantic";
  reasoning?: string;
  reasoningQuality?: ReasoningQualityScores;
  confidence?: number; // 0-1: LLM confidence in the decision
  processingTime?: number; // Time taken for this chunk decision
  turkishSpecificFeatures?: {
    morphologyAware: boolean;
    discourseMarkers: string[];
    syntacticBoundaries: boolean;
  };
}

interface ReasoningDisplayProps {
  chunks: EnhancedChunkData[];
  strategy: string;
  showTimeline?: boolean;
  enableFiltering?: boolean;
  enableSearch?: boolean;
  turkishOptimized?: boolean;
}

const ReasoningDisplay: React.FC<ReasoningDisplayProps> = ({
  chunks,
  strategy,
  showTimeline = true,
  enableFiltering = true,
  enableSearch = true,
  turkishOptimized = true,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [qualityFilter, setQualityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [selectedChunk, setSelectedChunk] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [expandedReasonings, setExpandedReasonings] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"grid" | "timeline" | "analytics">("grid");

  // Calculate reasoning quality scores if not provided
  const enhancedChunks = useMemo(() => {
    return chunks.map(chunk => {
      if (!chunk.reasoningQuality && chunk.reasoning) {
        const reasoning = chunk.reasoning;
        const reasoningLength = reasoning.length;
        
        // Calculate quality scores based on reasoning content
        const depth = Math.min(1, reasoningLength / 200); // Longer reasoning = more depth
        const consistency = chunk.semanticScore || 0.7; // Use semantic score as proxy
        const contextUnderstanding = reasoning.includes('bağlam') || reasoning.includes('context') ? 0.9 : 0.6;
        const overall = (depth + consistency + contextUnderstanding) / 3;

        return {
          ...chunk,
          reasoningQuality: { depth, consistency, contextUnderstanding, overall },
          confidence: chunk.confidence || overall,
        };
      }
      return chunk;
    });
  }, [chunks]);

  // Filter and search logic
  const filteredChunks = useMemo(() => {
    let filtered = enhancedChunks.filter(chunk => chunk.reasoning);

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(chunk => 
        chunk.reasoning?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chunk.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply quality filter
    if (qualityFilter !== "all") {
      filtered = filtered.filter(chunk => {
        const quality = chunk.reasoningQuality?.overall || 0;
        switch (qualityFilter) {
          case "high": return quality >= 0.8;
          case "medium": return quality >= 0.6 && quality < 0.8;
          case "low": return quality < 0.6;
          default: return true;
        }
      });
    }

    return filtered;
  }, [enhancedChunks, searchTerm, qualityFilter]);

  // Get quality color
  const getQualityColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 0.6) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  // Get quality icon
  const getQualityIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle className="h-4 w-4" />;
    if (score >= 0.6) return <AlertCircle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  // Toggle reasoning expansion
  const toggleReasoning = (chunkId: string) => {
    setExpandedReasonings(prev => ({
      ...prev,
      [chunkId]: !prev[chunkId]
    }));
  };

  // Open detail modal
  const openDetailModal = (chunkId: string) => {
    setSelectedChunk(chunkId);
    setShowDetailModal(true);
  };

  // Calculate analytics
  const analytics = useMemo(() => {
    const reasoningChunks = enhancedChunks.filter(c => c.reasoning);
    const totalReasonings = reasoningChunks.length;
    
    if (totalReasonings === 0) return null;

    const avgQuality = reasoningChunks.reduce((sum, c) => sum + (c.reasoningQuality?.overall || 0), 0) / totalReasonings;
    const avgConfidence = reasoningChunks.reduce((sum, c) => sum + (c.confidence || 0), 0) / totalReasonings;
    const avgLength = reasoningChunks.reduce((sum, c) => sum + (c.reasoning?.length || 0), 0) / totalReasonings;
    
    const highQuality = reasoningChunks.filter(c => (c.reasoningQuality?.overall || 0) >= 0.8).length;
    const mediumQuality = reasoningChunks.filter(c => {
      const q = c.reasoningQuality?.overall || 0;
      return q >= 0.6 && q < 0.8;
    }).length;
    const lowQuality = reasoningChunks.filter(c => (c.reasoningQuality?.overall || 0) < 0.6).length;

    return {
      totalReasonings,
      avgQuality,
      avgConfidence,
      avgLength,
      highQuality,
      mediumQuality,
      lowQuality,
    };
  }, [enhancedChunks]);

  const selectedChunkData = selectedChunk ? enhancedChunks.find(c => c.id === selectedChunk) : null;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">LLM Reasoning Analizi</h2>
          <Badge variant="outline" className="ml-2">
            {filteredChunks.length} / {enhancedChunks.filter(c => c.reasoning).length} Reasoning
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Grid
          </Button>
          {showTimeline && (
            <Button
              variant={viewMode === "timeline" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("timeline")}
            >
              <Clock className="h-4 w-4 mr-2" />
              Timeline
            </Button>
          )}
          <Button
            variant={viewMode === "analytics" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("analytics")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      {(enableSearch || enableFiltering) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {enableSearch && (
                <div className="flex-1">
                  <Label htmlFor="search">Reasoning'lerde Ara</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Reasoning içeriğinde ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {enableFiltering && (
                <div className="md:w-48">
                  <Label htmlFor="quality-filter">Kalite Filtresi</Label>
                  <select
                    id="quality-filter"
                    value={qualityFilter}
                    onChange={(e) => setQualityFilter(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tüm Kaliteler</option>
                    <option value="high">Yüksek Kalite (≥80%)</option>
                    <option value="medium">Orta Kalite (60-79%)</option>
                    <option value="low">Düşük Kalite (&lt;60%)</option>
                  </select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics View */}
      {viewMode === "analytics" && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Genel İstatistikler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Toplam Reasoning:</span>
                <span className="font-semibold">{analytics.totalReasonings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ortalama Kalite:</span>
                <span className="font-semibold">{(analytics.avgQuality * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ortalama Güven:</span>
                <span className="font-semibold">{(analytics.avgConfidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ortalama Uzunluk:</span>
                <span className="font-semibold">{Math.round(analytics.avgLength)} karakter</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Kalite Dağılımı
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Yüksek:
                </span>
                <span className="font-semibold">{analytics.highQuality}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Orta:
                </span>
                <span className="font-semibold">{analytics.mediumQuality}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Düşük:
                </span>
                <span className="font-semibold">{analytics.lowQuality}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Kalite Metrikleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Derinlik</span>
                  <span>{(enhancedChunks.reduce((sum, c) => sum + (c.reasoningQuality?.depth || 0), 0) / enhancedChunks.length * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${enhancedChunks.reduce((sum, c) => sum + (c.reasoningQuality?.depth || 0), 0) / enhancedChunks.length * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tutarlılık</span>
                  <span>{(enhancedChunks.reduce((sum, c) => sum + (c.reasoningQuality?.consistency || 0), 0) / enhancedChunks.length * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${enhancedChunks.reduce((sum, c) => sum + (c.reasoningQuality?.consistency || 0), 0) / enhancedChunks.length * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Bağlam Anlayışı</span>
                  <span>{(enhancedChunks.reduce((sum, c) => sum + (c.reasoningQuality?.contextUnderstanding || 0), 0) / enhancedChunks.length * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${enhancedChunks.reduce((sum, c) => sum + (c.reasoningQuality?.contextUnderstanding || 0), 0) / enhancedChunks.length * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {turkishOptimized && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-600" />
                  Türkçe Optimizasyonu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Morfoloji Farkındalığı:</span>
                  <span className="font-semibold">
                    {enhancedChunks.filter(c => c.turkishSpecificFeatures?.morphologyAware).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Söylem İşaretçileri:</span>
                  <span className="font-semibold">
                    {enhancedChunks.reduce((sum, c) => sum + (c.turkishSpecificFeatures?.discourseMarkers?.length || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sözdizimsel Sınırlar:</span>
                  <span className="font-semibold">
                    {enhancedChunks.filter(c => c.turkishSpecificFeatures?.syntacticBoundaries).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="space-y-4">
          {filteredChunks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Reasoning Bulunamadı
                </h3>
                <p className="text-gray-500">
                  {searchTerm || qualityFilter !== "all" 
                    ? "Arama kriterlerinize uygun reasoning bulunamadı."
                    : "Bu test için henüz reasoning verisi mevcut değil."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredChunks.map((chunk, index) => (
              <Card key={chunk.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Chunk #{chunks.findIndex(c => c.id === chunk.id) + 1}</Badge>
                      <div className="text-sm text-gray-500">
                        {chunk.size} karakter
                      </div>
                      {chunk.reasoningQuality && (
                        <Badge 
                          className={`${getQualityColor(chunk.reasoningQuality.overall)} border`}
                        >
                          {getQualityIcon(chunk.reasoningQuality.overall)}
                          <span className="ml-1">
                            {(chunk.reasoningQuality.overall * 100).toFixed(0)}%
                          </span>
                        </Badge>
                      )}
                      {chunk.confidence && (
                        <Badge variant="outline" className="text-xs">
                          Güven: {(chunk.confidence * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetailModal(chunk.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Chunk Content Preview */}
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                    {chunk.content.length > 150 ? (
                      <>
                        {chunk.content.substring(0, 150)}
                        <button 
                          className="text-blue-600 hover:text-blue-800 ml-2"
                          onClick={() => openDetailModal(chunk.id)}
                        >
                          ...devamını göster
                        </button>
                      </>
                    ) : (
                      chunk.content
                    )}
                  </div>

                  {/* Reasoning Display */}
                  {chunk.reasoning && (
                    <div className="bg-purple-50 border border-purple-200 rounded p-3">
                      <button
                        className="flex items-center gap-2 text-purple-700 font-medium hover:text-purple-900 w-full text-left"
                        onClick={() => toggleReasoning(chunk.id)}
                      >
                        {expandedReasonings[chunk.id] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Lightbulb className="h-4 w-4" />
                        LLM Reasoning
                        {chunk.reasoningQuality && (
                          <div className={`w-4 h-4 rounded-full ${
                      (chunk.reasoningQuality?.overall ?? 0.5) >= 0.8 ? 'bg-green-500' :
                      (chunk.reasoningQuality?.overall ?? 0.5) >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />  
                        )}
                      </button>
                      
                      {expandedReasonings[chunk.id] && (
                        <div className="mt-3 space-y-2">
                          <div className="text-sm text-purple-800 leading-relaxed">
                            {chunk.reasoning}
                          </div>
                          
                          {chunk.reasoningQuality && (
                            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-purple-200">
                              <div className="text-center">
                                <div className="text-xs text-gray-600">Derinlik</div>
                                <div className="font-semibold text-sm">
                                  {(chunk.reasoningQuality.depth * 100).toFixed(0)}%
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-600">Tutarlılık</div>
                                <div className="font-semibold text-sm">
                                  {(chunk.reasoningQuality.consistency * 100).toFixed(0)}%
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-600">Bağlam</div>
                                <div className="font-semibold text-sm">
                                  {(chunk.reasoningQuality.contextUnderstanding * 100).toFixed(0)}%
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === "timeline" && showTimeline && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Reasoning Süreci Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredChunks.map((chunk, index) => (
                <div key={chunk.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full ${
                      (chunk.reasoningQuality?.overall ?? 0) >= 0.8 ? 'bg-green-500' :
                      (chunk.reasoningQuality?.overall ?? 0) >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    {index < filteredChunks.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-300 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Chunk #{chunks.findIndex(c => c.id === chunk.id) + 1}</Badge>
                      <span className="text-sm text-gray-500">
                        {chunk.processingTime ? `${chunk.processingTime}ms` : 'İşlem süresi bilinmiyor'}
                      </span>
                      {chunk.reasoningQuality && (
                        <Badge className={getQualityColor(chunk.reasoningQuality.overall)}>
                          {(chunk.reasoningQuality.overall * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-700 mb-2">
                      {chunk.content.substring(0, 100)}...
                    </div>
                    {chunk.reasoning && (
                      <div className="text-xs text-purple-700 bg-purple-50 p-2 rounded">
                        {chunk.reasoning.substring(0, 150)}...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

// ...
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Chunk Reasoning Detayları
            </DialogTitle>
            <DialogDescription>
              Chunk #{selectedChunkData ? chunks.findIndex(c => c.id === selectedChunkData.id) + 1 : ''} için detaylı reasoning analizi
            </DialogDescription>
          </DialogHeader>
          
          {selectedChunkData && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Boyut</div>
                  <div className="font-semibold">{selectedChunkData.size} karakter</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Semantik Skor</div>
                  <div className="font-semibold">
                    {selectedChunkData.semanticScore ? (selectedChunkData.semanticScore * 100).toFixed(1) + '%' : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Sınır Türü</div>
                  <div className="font-semibold">
                    {selectedChunkData.boundaryType === "semantic" && "🧠 Semantik"}
                    {selectedChunkData.boundaryType === "natural" && "📝 Doğal"}
                    {selectedChunkData.boundaryType === "forced" && "✂️ Zorlanmış"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Güven Skoru</div>
                  <div className="font-semibold">
                    {selectedChunkData.confidence ? (selectedChunkData.confidence * 100).toFixed(1) + '%' : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <h4 className="font-semibold mb-2">Chunk İçeriği</h4>
                <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded border max-h-40 overflow-y-auto">
                  {selectedChunkData.content}
                </div>
              </div>

              {/* Reasoning */}
              {selectedChunkData.reasoning && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    LLM Reasoning
                  </h4>
                  <div className="text-sm text-purple-800 bg-purple-50 p-4 rounded border">
                    {selectedChunkData.reasoning}
                  </div>
                </div>
              )}

              {/* Quality Scores */}
              {selectedChunkData.reasoningQuality && (
                <div>
                  <h4 className="font-semibold mb-3">Kalite Skorları</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {(selectedChunkData.reasoningQuality.depth * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">Derinlik</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {(selectedChunkData.reasoningQuality.consistency * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">Tutarlılık</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded">
                      <div className="text-2xl font-bold text-purple-600">
                        {(selectedChunkData.reasoningQuality.contextUnderstanding * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">Bağlam Anlayışı</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded">
                      <div className="text-2xl font-bold text-orange-600">
                        {(selectedChunkData.reasoningQuality.overall * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">Genel Kalite</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Turkish-specific features */}
              {turkishOptimized && selectedChunkData.turkishSpecificFeatures && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Türkçe Özel Özellikler
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Morfoloji Farkındalığı:</span>
                      <Badge variant={selectedChunkData.turkishSpecificFeatures.morphologyAware ? "default" : "secondary"}>
                        {selectedChunkData.turkishSpecificFeatures.morphologyAware ? "Aktif" : "Pasif"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sözdizimsel Sınırlar:</span>
                      <Badge variant={selectedChunkData.turkishSpecificFeatures.syntacticBoundaries ? "default" : "secondary"}>
                        {selectedChunkData.turkishSpecificFeatures.syntacticBoundaries ? "Aktif" : "Pasif"}
                      </Badge>
                    </div>
                    {selectedChunkData.turkishSpecificFeatures.discourseMarkers.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Söylem İşaretçileri:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedChunkData.turkishSpecificFeatures.discourseMarkers.map((marker, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {marker}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReasoningDisplay;