"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  EyeOff, 
  Layers, 
  BarChart3, 
  Zap,
  Info,
  ChevronDown,
  ChevronRight
} from "lucide-react";

interface ChunkData {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  size: number;
  semanticScore?: number;
  boundaryType?: "natural" | "forced" | "semantic";
  reasoning?: string;
  // NEW: Enriched metadata fields
  metadata?: {
    chunk_id?: string;
    parent_header?: string | null;
    section_title?: string | null;
    header_hierarchy?: string[];
    keywords?: string[];
    chunk_type?: string;
    document_title?: string | null;
    page_number?: number | null;
    language?: string;
    previous_chunk_id?: string | null;
    next_chunk_id?: string | null;
  };
}

interface ChunkVisualizationProps {
  chunks: ChunkData[];
  originalText: string;
  strategy: string;
  showMetrics?: boolean;
}

const ChunkVisualization: React.FC<ChunkVisualizationProps> = ({
  chunks,
  originalText,
  strategy,
  showMetrics = true,
}) => {
  const [viewMode, setViewMode] = useState<"text" | "blocks" | "metrics">("text");
  const [selectedChunk, setSelectedChunk] = useState<string | null>(null);
  const [showReasoningDetails, setShowReasoningDetails] = useState<Record<string, boolean>>({});

  const getChunkColor = (index: number, boundaryType?: string) => {
    const baseColors = [
      "bg-red-100 border-red-500 text-red-900",
      "bg-blue-100 border-blue-500 text-blue-900",
      "bg-green-100 border-green-500 text-green-900",
      "bg-yellow-100 border-yellow-500 text-yellow-900",
      "bg-purple-100 border-purple-500 text-purple-900",
      "bg-pink-100 border-pink-500 text-pink-900",
      "bg-indigo-100 border-indigo-500 text-indigo-900",
      "bg-orange-100 border-orange-500 text-orange-900",
    ];

    let colorClass = baseColors[index % baseColors.length];

    // Add special styling for boundary types
    if (boundaryType === "semantic") {
      colorClass += " ring-2 ring-green-300";
    } else if (boundaryType === "forced") {
      colorClass += " ring-2 ring-red-300";
    }

    return colorClass;
  };

  const toggleReasoningDetails = (chunkId: string) => {
    setShowReasoningDetails(prev => ({
      ...prev,
      [chunkId]: !prev[chunkId]
    }));
  };

  const calculateMetrics = () => {
    if (chunks.length === 0) return null;

    const sizes = chunks.map(c => c.size);
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const variance = sizes.reduce((acc, size) => acc + Math.pow(size - avgSize, 2), 0) / sizes.length;
    const stdDev = Math.sqrt(variance);
    
    const semanticScores = chunks.filter(c => c.semanticScore).map(c => c.semanticScore!);
    const avgSemanticScore = semanticScores.length > 0 
      ? semanticScores.reduce((a, b) => a + b, 0) / semanticScores.length 
      : 0;

    return {
      totalChunks: chunks.length,
      avgSize: Math.round(avgSize),
      stdDev: Math.round(stdDev),
      minSize: Math.min(...sizes),
      maxSize: Math.max(...sizes),
      avgSemanticScore: avgSemanticScore,
      naturalBoundaries: chunks.filter(c => c.boundaryType === "natural").length,
      semanticBoundaries: chunks.filter(c => c.boundaryType === "semantic").length,
      forcedBoundaries: chunks.filter(c => c.boundaryType === "forced").length,
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("text")}
          >
            <Eye className="h-4 w-4 mr-2" />
            Metin Görünümü
          </Button>
          <Button
            variant={viewMode === "blocks" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("blocks")}
          >
            <Layers className="h-4 w-4 mr-2" />
            Blok Görünümü
          </Button>
          {showMetrics && (
            <Button
              variant={viewMode === "metrics" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("metrics")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Metrikler
            </Button>
          )}
        </div>
        <Badge variant="outline" className="text-sm">
          {strategy} Stratejisi - {chunks.length} Chunk
        </Badge>
      </div>

      {/* Text View */}
      {viewMode === "text" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Chunk Sınırları Görselleştirmesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 mb-4">
              Her renk farklı bir chunk'ı temsil eder. Chunk sınırları renkli kenarlıklarla gösterilir. Detaylar için chunk'a tıklayın.
            </div>
            <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
              <div className="text-sm leading-relaxed space-y-1">
                {chunks.map((chunk, index) => {
                  // Build tooltip with metadata
                  let tooltipParts = [`Chunk ${index + 1}: ${chunk.size} karakter`];
                  if (chunk.semanticScore) tooltipParts.push(`Skor: ${chunk.semanticScore.toFixed(3)}`);
                  if (chunk.metadata?.chunk_type && chunk.metadata.chunk_type !== 'content') {
                    tooltipParts.push(`Tür: ${chunk.metadata.chunk_type}`);
                  }
                  if (chunk.metadata?.parent_header) {
                    tooltipParts.push(`Bölüm: ${chunk.metadata.parent_header}`);
                  }
                  if (chunk.metadata?.keywords && chunk.metadata.keywords.length > 0) {
                    tooltipParts.push(`Anahtar: ${chunk.metadata.keywords.slice(0, 3).join(', ')}`);
                  }
                  
                  return (
                    <span
                      key={chunk.id}
                      className={`inline-block p-2 m-1 rounded border-l-4 cursor-pointer transition-all hover:shadow-md ${getChunkColor(index, chunk.boundaryType)} ${
                        selectedChunk === chunk.id ? "ring-2 ring-blue-400 shadow-lg" : ""
                      }`}
                      title={tooltipParts.join(' | ')}
                      onClick={() => setSelectedChunk(selectedChunk === chunk.id ? null : chunk.id)}
                    >
                      {chunk.content}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {chunk.boundaryType && (
                          <span className="text-xs opacity-75">
                            {chunk.boundaryType === "semantic" && "🧠 Semantik"}
                            {chunk.boundaryType === "natural" && "📝 Doğal"}
                            {chunk.boundaryType === "forced" && "✂️ Zorlanmış"}
                          </span>
                        )}
                        {chunk.metadata?.chunk_type && chunk.metadata.chunk_type !== 'content' && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-1 rounded">
                            {chunk.metadata.chunk_type === "header" && "📑"}
                            {chunk.metadata.chunk_type === "list" && "📋"}
                            {chunk.metadata.chunk_type === "table" && "📊"}
                            {chunk.metadata.chunk_type === "code" && "💻"}
                            {chunk.metadata.chunk_type === "question" && "❓"}
                          </span>
                        )}
                        {chunk.metadata?.keywords && chunk.metadata.keywords.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                            🏷️ {chunk.metadata.keywords.length}
                          </span>
                        )}
                      </div>
                    </span>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Block View */}
      {viewMode === "blocks" && (
        <div className="space-y-4">
          {chunks.map((chunk, index) => (
            <Card key={chunk.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Chunk #{index + 1}</Badge>
                    <div className="text-sm text-gray-500">
                      {chunk.size} karakter
                    </div>
                    {chunk.boundaryType && (
                      <Badge 
                        variant={chunk.boundaryType === "semantic" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {chunk.boundaryType === "semantic" && "🧠 Semantik"}
                        {chunk.boundaryType === "natural" && "📝 Doğal"}
                        {chunk.boundaryType === "forced" && "✂️ Zorlanmış"}
                      </Badge>
                    )}
                    {chunk.semanticScore && (
                      <Badge variant="outline" className="text-xs">
                        Skor: {chunk.semanticScore.toFixed(3)}
                      </Badge>
                    )}
                    {/* NEW: Chunk type badge */}
                    {chunk.metadata?.chunk_type && chunk.metadata.chunk_type !== "content" && (
                      <Badge variant="secondary" className="text-xs">
                        {chunk.metadata.chunk_type === "header" && "📑 Başlık"}
                        {chunk.metadata.chunk_type === "list" && "📋 Liste"}
                        {chunk.metadata.chunk_type === "table" && "📊 Tablo"}
                        {chunk.metadata.chunk_type === "code" && "💻 Kod"}
                        {chunk.metadata.chunk_type === "question" && "❓ Soru"}
                        {chunk.metadata.chunk_type === "image_caption" && "🖼️ Resim"}
                      </Badge>
                    )}
                  </div>
                </div>
                {/* NEW: Parent header display */}
                {chunk.metadata?.parent_header && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <span className="font-medium">📂 Bölüm:</span>
                    <span className="text-gray-700">{chunk.metadata.parent_header}</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {/* NEW: Keywords display */}
                {chunk.metadata?.keywords && chunk.metadata.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className="text-xs text-gray-500 mr-1">🏷️ Anahtar Kelimeler:</span>
                    {chunk.metadata.keywords.map((keyword, kidx) => (
                      <Badge key={kidx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border-l-4" 
                     style={{ borderLeftColor: getChunkColor(index).includes('red') ? '#ef4444' : 
                                               getChunkColor(index).includes('blue') ? '#3b82f6' :
                                               getChunkColor(index).includes('green') ? '#10b981' :
                                               getChunkColor(index).includes('yellow') ? '#f59e0b' :
                                               getChunkColor(index).includes('purple') ? '#8b5cf6' :
                                               getChunkColor(index).includes('pink') ? '#ec4899' : '#6366f1' }}>
                  {chunk.content.length > 300 ? (
                    <>
                      {chunk.content.substring(0, 300)}
                      <button 
                        className="text-blue-600 hover:text-blue-800 ml-2"
                        onClick={() => setSelectedChunk(selectedChunk === chunk.id ? null : chunk.id)}
                      >
                        {selectedChunk === chunk.id ? "Daha az göster" : "Devamını göster..."}
                      </button>
                      {selectedChunk === chunk.id && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          {chunk.content.substring(300)}
                        </div>
                      )}
                    </>
                  ) : (
                    chunk.content
                  )}
                </div>
                
                {chunk.reasoning && (
                  <div className="text-xs bg-purple-50 border border-purple-200 rounded p-3">
                    <button
                      className="flex items-center gap-1 text-purple-700 font-medium hover:text-purple-900 w-full text-left"
                      onClick={() => toggleReasoningDetails(chunk.id)}
                    >
                      {showReasoningDetails[chunk.id] ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      <Zap className="h-3 w-3" />
                      LLM Reasoning
                      {/* Add quality indicator */}
                      {chunk.semanticScore && (
                        <div className="ml-auto flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${
                            chunk.semanticScore >= 0.8 ? 'bg-green-500' :
                            chunk.semanticScore >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className="text-xs text-gray-600">
                            {(chunk.semanticScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </button>
                    {showReasoningDetails[chunk.id] && (
                      <div className="mt-3 space-y-2">
                        <div className="text-purple-800 leading-relaxed">
                          {chunk.reasoning}
                        </div>
                        
                        {/* Add reasoning quality metrics if available */}
                        {chunk.semanticScore && (
                          <div className="pt-2 border-t border-purple-200">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Kalite Skoru:</span>
                              <div className="flex items-center gap-2">
                                <div className={`px-2 py-1 rounded text-xs font-medium ${
                                  chunk.semanticScore >= 0.8 ? 'bg-green-100 text-green-800' :
                                  chunk.semanticScore >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {chunk.semanticScore >= 0.8 ? 'Yüksek' :
                                   chunk.semanticScore >= 0.6 ? 'Orta' : 'Düşük'}
                                </div>
                                <span className="font-semibold">
                                  {(chunk.semanticScore * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Add Turkish-specific reasoning indicators */}
                        <div className="pt-2 border-t border-purple-200">
                          <div className="flex flex-wrap gap-1">
                            {chunk.reasoning.includes('bağlam') && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                🔗 Bağlamsal
                              </span>
                            )}
                            {chunk.reasoning.includes('semantik') && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                🧠 Semantik
                              </span>
                            )}
                            {chunk.reasoning.includes('morfoloji') && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                📝 Morfolojik
                              </span>
                            )}
                            {(chunk.reasoning.includes('ancak') || chunk.reasoning.includes('fakat') ||
                              chunk.reasoning.includes('lakin') || chunk.reasoning.includes('ama')) && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                ↔️ Söylem İşaretçisi
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Metrics View */}
      {viewMode === "metrics" && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Temel Metrikler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Toplam Chunk:</span>
                <span className="font-semibold">{metrics.totalChunks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ortalama Boyut:</span>
                <span className="font-semibold">{metrics.avgSize} karakter</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Standart Sapma:</span>
                <span className="font-semibold">{metrics.stdDev}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Min/Max Boyut:</span>
                <span className="font-semibold">{metrics.minSize} / {metrics.maxSize}</span>
              </div>
            </CardContent>
          </Card>

          {/* Boundary Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="h-5 w-5" />
                Sınır Türleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  🧠 Semantik:
                </span>
                <span className="font-semibold">{metrics.semanticBoundaries}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  📝 Doğal:
                </span>
                <span className="font-semibold">{metrics.naturalBoundaries}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  ✂️ Zorlanmış:
                </span>
                <span className="font-semibold">{metrics.forcedBoundaries}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quality Metrics */}
          {metrics.avgSemanticScore > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5" />
                  Kalite Metrikleri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ortalama Semantik Skor:</span>
                  <span className="font-semibold">{metrics.avgSemanticScore.toFixed(3)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${metrics.avgSemanticScore * 100}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Selected Chunk Details */}
      {selectedChunk && viewMode === "text" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5" />
              Seçili Chunk Detayları
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const chunk = chunks.find(c => c.id === selectedChunk);
              if (!chunk) return null;
              
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Boyut:</span>
                      <span className="ml-2 font-semibold">{chunk.size} karakter</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pozisyon:</span>
                      <span className="ml-2 font-semibold">{chunk.startIndex} - {chunk.endIndex}</span>
                    </div>
                    {chunk.semanticScore && (
                      <div>
                        <span className="text-gray-600">Semantik Skor:</span>
                        <span className="ml-2 font-semibold">{chunk.semanticScore.toFixed(3)}</span>
                      </div>
                    )}
                    {chunk.boundaryType && (
                      <div>
                        <span className="text-gray-600">Sınır Türü:</span>
                        <span className="ml-2 font-semibold">
                          {chunk.boundaryType === "semantic" && "🧠 Semantik"}
                          {chunk.boundaryType === "natural" && "📝 Doğal"}
                          {chunk.boundaryType === "forced" && "✂️ Zorlanmış"}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* NEW: Metadata section */}
                  {chunk.metadata && (
                    <div className="mt-4 p-3 bg-white rounded border">
                      <div className="text-sm font-medium text-gray-700 mb-2">📋 Metadata:</div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Bölüm:</span>
                          <span className="ml-2 font-medium">{chunk.metadata.parent_header || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Chunk Türü:</span>
                          <span className="ml-2 font-medium">{chunk.metadata.chunk_type || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Dil:</span>
                          <span className="ml-2 font-medium">{chunk.metadata.language || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Doküman:</span>
                          <span className="ml-2 font-medium">{chunk.metadata.document_title || "N/A"}</span>
                        </div>
                        {chunk.metadata.page_number && (
                          <div>
                            <span className="text-gray-500">Sayfa:</span>
                            <span className="ml-2 font-medium">{chunk.metadata.page_number}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Header hierarchy */}
                      {chunk.metadata.header_hierarchy && chunk.metadata.header_hierarchy.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="text-gray-500 text-sm">Başlık Hiyerarşisi:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {chunk.metadata.header_hierarchy.map((header, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {idx > 0 && <span className="text-gray-400 mr-1">›</span>}
                                {header}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Keywords */}
                      {chunk.metadata.keywords && chunk.metadata.keywords.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="text-gray-500 text-sm">Anahtar Kelimeler:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {chunk.metadata.keywords.map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {chunk.reasoning && (
                    <div className="mt-4 p-3 bg-white rounded border">
                      <div className="text-sm font-medium text-gray-700 mb-2">LLM Reasoning:</div>
                      <div className="text-sm text-gray-600">{chunk.reasoning}</div>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChunkVisualization;