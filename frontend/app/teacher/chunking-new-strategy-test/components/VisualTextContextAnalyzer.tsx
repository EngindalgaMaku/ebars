"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Image, 
  FileText, 
  Link, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Activity,
  Target,
  Layers,
  GitBranch,
  Zap,
  Info,
  RefreshCw
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
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

// Enhanced interfaces for visual-text context analysis
interface ImageReference {
  type: "img_tag" | "figure_ref" | "table_ref" | "diagram_ref";
  pattern: string;
  position: number;
  chunkId: string;
  referenceText: string;
  turkishPattern?: boolean;
}

interface ContextRelationship {
  imageRef: ImageReference;
  relatedText: string;
  distance: number; // Distance between image and related text
  contextStrength: number; // 0-1 score of how related they are
  preservationStatus: "preserved" | "separated" | "lost";
  chunkBoundary?: {
    imageChunk: string;
    textChunk: string;
    crossesBoundary: boolean;
  };
}

interface ContextPreservationMetrics {
  totalImageReferences: number;
  preservedReferences: number;
  separatedReferences: number;
  lostReferences: number;
  preservationRate: number;
  averageContextDistance: number;
  contextCoherenceScore: number;
  boundaryAccuracy: number;
}

interface TurkishAcademicPatterns {
  figurePatterns: string[];
  tablePatterns: string[];
  referencePatterns: string[];
  academicTerms: string[];
  citationPatterns: string[];
}

interface ChunkData {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  size: number;
  semanticScore?: number;
  boundaryType?: "natural" | "forced" | "semantic";
  reasoning?: string;
}

interface VisualTextContextAnalyzerProps {
  chunks: ChunkData[];
  originalText: string;
  strategy: string;
  enableTurkishPatterns?: boolean;
  showDetailedAnalysis?: boolean;
}

const VisualTextContextAnalyzer: React.FC<VisualTextContextAnalyzerProps> = ({
  chunks,
  originalText,
  strategy,
  enableTurkishPatterns = true,
  showDetailedAnalysis = true
}) => {
  const [activeView, setActiveView] = useState<"overview" | "references" | "analysis" | "heatmap">("overview");
  const [selectedReference, setSelectedReference] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "preserved" | "separated" | "lost">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Turkish academic patterns
  const turkishPatterns: TurkishAcademicPatterns = {
    figurePatterns: [
      "Şekil \\d+\\.?\\d*",
      "Figür \\d+\\.?\\d*", 
      "Grafik \\d+\\.?\\d*",
      "Diyagram \\d+\\.?\\d*",
      "Resim \\d+\\.?\\d*",
      "şekil \\d+\\.?\\d*",
      "figür \\d+\\.?\\d*"
    ],
    tablePatterns: [
      "Tablo \\d+\\.?\\d*",
      "Çizelge \\d+\\.?\\d*",
      "tablo \\d+\\.?\\d*",
      "çizelge \\d+\\.?\\d*"
    ],
    referencePatterns: [
      "yukarıdaki şekil",
      "aşağıdaki şekil",
      "yukarıdaki tablo",
      "aşağıdaki tablo",
      "bu şekil",
      "bu tablo",
      "ilgili şekil",
      "ilgili tablo",
      "gösterilen",
      "görüldüğü gibi",
      "belirtildiği üzere"
    ],
    academicTerms: [
      "analiz",
      "değerlendirme", 
      "karşılaştırma",
      "inceleme",
      "araştırma",
      "bulgular",
      "sonuçlar",
      "veriler",
      "örneklem",
      "metodoloji"
    ],
    citationPatterns: [
      "\\(\\d{4}\\)",
      "\\[\\d+\\]",
      "et al\\.",
      "ve ark\\.",
      "vd\\."
    ]
  };

  // Detect image references in text
  const detectImageReferences = useMemo(() => {
    const references: ImageReference[] = [];
    
    // HTML img tags
    const imgTagRegex = /<img[^>]*>/gi;
    let match;
    while ((match = imgTagRegex.exec(originalText)) !== null) {
      const chunkId = findChunkForPosition(match.index);
      references.push({
        type: "img_tag",
        pattern: match[0],
        position: match.index,
        chunkId,
        referenceText: match[0],
        turkishPattern: false
      });
    }

    // Figure references
    if (enableTurkishPatterns) {
      turkishPatterns.figurePatterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        while ((match = regex.exec(originalText)) !== null) {
          const chunkId = findChunkForPosition(match.index);
          references.push({
            type: "figure_ref",
            pattern,
            position: match.index,
            chunkId,
            referenceText: match[0],
            turkishPattern: true
          });
        }
      });

      // Table references
      turkishPatterns.tablePatterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        while ((match = regex.exec(originalText)) !== null) {
          const chunkId = findChunkForPosition(match.index);
          references.push({
            type: "table_ref",
            pattern,
            position: match.index,
            chunkId,
            referenceText: match[0],
            turkishPattern: true
          });
        }
      });
    }

    return references.sort((a, b) => a.position - b.position);
  }, [originalText, enableTurkishPatterns]);

  // Find which chunk contains a specific position
  const findChunkForPosition = (position: number): string => {
    for (const chunk of chunks) {
      if (position >= chunk.startIndex && position <= chunk.endIndex) {
        return chunk.id;
      }
    }
    return "unknown";
  };

  // Analyze context relationships
  const contextRelationships = useMemo(() => {
    const relationships: ContextRelationship[] = [];

    detectImageReferences.forEach(imageRef => {
      // Find related text within a reasonable distance
      const contextWindow = 500; // characters
      const startPos = Math.max(0, imageRef.position - contextWindow);
      const endPos = Math.min(originalText.length, imageRef.position + contextWindow);
      const contextText = originalText.substring(startPos, endPos);

      // Calculate context strength based on academic patterns
      let contextStrength = 0.5; // base score
      
      if (enableTurkishPatterns) {
        // Check for Turkish academic terms
        turkishPatterns.academicTerms.forEach(term => {
          if (contextText.toLowerCase().includes(term)) {
            contextStrength += 0.1;
          }
        });

        // Check for reference patterns
        turkishPatterns.referencePatterns.forEach(pattern => {
          if (contextText.toLowerCase().includes(pattern)) {
            contextStrength += 0.2;
          }
        });
      }

      contextStrength = Math.min(1, contextStrength);

      // Determine preservation status
      const imageChunk = findChunkForPosition(imageRef.position);
      const textChunk = findChunkForPosition(imageRef.position + 100); // Check nearby text
      
      let preservationStatus: "preserved" | "separated" | "lost" = "preserved";
      if (imageChunk !== textChunk) {
        preservationStatus = "separated";
        // Check if context is completely lost
        if (contextStrength < 0.3) {
          preservationStatus = "lost";
        }
      }

      relationships.push({
        imageRef,
        relatedText: contextText,
        distance: 0, // Will be calculated based on chunk boundaries
        contextStrength,
        preservationStatus,
        chunkBoundary: {
          imageChunk,
          textChunk,
          crossesBoundary: imageChunk !== textChunk
        }
      });
    });

    return relationships;
  }, [detectImageReferences, originalText, chunks, enableTurkishPatterns]);

  // Calculate preservation metrics
  const preservationMetrics = useMemo((): ContextPreservationMetrics => {
    const total = contextRelationships.length;
    const preserved = contextRelationships.filter(r => r.preservationStatus === "preserved").length;
    const separated = contextRelationships.filter(r => r.preservationStatus === "separated").length;
    const lost = contextRelationships.filter(r => r.preservationStatus === "lost").length;

    const preservationRate = total > 0 ? preserved / total : 0;
    const averageContextDistance = contextRelationships.reduce((sum, r) => sum + r.distance, 0) / total || 0;
    const contextCoherenceScore = contextRelationships.reduce((sum, r) => sum + r.contextStrength, 0) / total || 0;
    const boundaryAccuracy = total > 0 ? (preserved + separated * 0.5) / total : 0;

    return {
      totalImageReferences: total,
      preservedReferences: preserved,
      separatedReferences: separated,
      lostReferences: lost,
      preservationRate,
      averageContextDistance,
      contextCoherenceScore,
      boundaryAccuracy
    };
  }, [contextRelationships]);

  // Filter relationships based on current filter
  const filteredRelationships = useMemo(() => {
    let filtered = contextRelationships;

    if (filterType !== "all") {
      filtered = filtered.filter(r => r.preservationStatus === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.imageRef.referenceText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.relatedText.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [contextRelationships, filterType, searchTerm]);

  // Chart data preparation
  const chartData = [
    { name: "Korunan", value: preservationMetrics.preservedReferences, color: "#10b981" },
    { name: "Ayrılan", value: preservationMetrics.separatedReferences, color: "#f59e0b" },
    { name: "Kayıp", value: preservationMetrics.lostReferences, color: "#ef4444" }
  ];

  const radarData = [
    {
      metric: "Koruma Oranı",
      score: preservationMetrics.preservationRate * 100
    },
    {
      metric: "Bağlam Uyumu",
      score: preservationMetrics.contextCoherenceScore * 100
    },
    {
      metric: "Sınır Doğruluğu", 
      score: preservationMetrics.boundaryAccuracy * 100
    },
    {
      metric: "Referans Yoğunluğu",
      score: Math.min(100, (preservationMetrics.totalImageReferences / chunks.length) * 50)
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "preserved": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "separated": return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "lost": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preserved": return "text-green-600 bg-green-50 border-green-200";
      case "separated": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "lost": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Görsel-Metin Bağlam Analizi</h2>
          <Badge variant="outline" className="ml-2">
            {preservationMetrics.totalImageReferences} Referans
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
            variant={activeView === "references" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("references")}
          >
            <Link className="h-4 w-4 mr-2" />
            Referanslar
          </Button>
          <Button
            variant={activeView === "analysis" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("analysis")}
          >
            <Activity className="h-4 w-4 mr-2" />
            Detay Analiz
          </Button>
          <Button
            variant={activeView === "heatmap" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("heatmap")}
          >
            <Target className="h-4 w-4 mr-2" />
            Isı Haritası
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Referanslarda Ara</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Referans metni ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="md:w-48">
              <Label htmlFor="status-filter">Durum Filtresi</Label>
              <select
                id="status-filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="preserved">Korunan</option>
                <option value="separated">Ayrılan</option>
                <option value="lost">Kayıp</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                }}
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Toplam Referans</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {preservationMetrics.totalImageReferences}
                    </p>
                    <p className="text-xs text-gray-500">
                      {enableTurkishPatterns ? "Türkçe optimizasyonlu" : "Standart"}
                    </p>
                  </div>
                  <Image className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Koruma Oranı</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(preservationMetrics.preservationRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {preservationMetrics.preservedReferences} korunan
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Bağlam Uyumu</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(preservationMetrics.contextCoherenceScore * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      Ortalama güçlülük
                    </p>
                  </div>
                  <Link className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Sınır Doğruluğu</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {(preservationMetrics.boundaryAccuracy * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      Chunk sınır kalitesi
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preservation Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Koruma Durumu Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }: any) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quality Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Kalite Metrikleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} />
                    <Radar
                      name="Skor"
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <Card className={`border-2 ${
            preservationMetrics.preservationRate >= 0.8 ? "border-green-200 bg-green-50" :
            preservationMetrics.preservationRate >= 0.6 ? "border-yellow-200 bg-yellow-50" :
            "border-red-200 bg-red-50"
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performans Özeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {preservationMetrics.preservationRate >= 0.8 ? (
                      <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
                    ) : preservationMetrics.preservationRate >= 0.6 ? (
                      <AlertTriangle className="h-12 w-12 mx-auto text-yellow-600" />
                    ) : (
                      <XCircle className="h-12 w-12 mx-auto text-red-600" />
                    )}
                  </div>
                  <div className="text-sm font-medium">Genel Durum</div>
                  <div className="text-xs text-gray-600">
                    {preservationMetrics.preservationRate >= 0.8 ? "Mükemmel Koruma" :
                     preservationMetrics.preservationRate >= 0.6 ? "İyi Koruma" : "Zayıf Koruma"}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Korunan:</span>
                    <span className="font-semibold text-green-600">
                      {preservationMetrics.preservedReferences}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ayrılan:</span>
                    <span className="font-semibold text-yellow-600">
                      {preservationMetrics.separatedReferences}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Kayıp:</span>
                    <span className="font-semibold text-red-600">
                      {preservationMetrics.lostReferences}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Bağlam Gücü:</span>
                    <span className="font-semibold">
                      {(preservationMetrics.contextCoherenceScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sınır Kalitesi:</span>
                    <span className="font-semibold">
                      {(preservationMetrics.boundaryAccuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Strateji:</span>
                    <span className="font-semibold">{strategy}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* References Tab */}
      {activeView === "references" && (
        <div className="space-y-4">
          {filteredRelationships.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Referans Bulunamadı
                </h3>
                <p className="text-gray-500">
                  {searchTerm || filterType !== "all" 
                    ? "Arama kriterlerinize uygun referans bulunamadı."
                    : "Bu metinde görsel referansı tespit edilmedi."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRelationships.map((relationship, index) => (
              <Card key={`${relationship.imageRef.position}-${index}`} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <Badge 
                        className={`${getStatusColor(relationship.preservationStatus)} border`}
                      >
                        {getStatusIcon(relationship.preservationStatus)}
                        <span className="ml-1 capitalize">
                          {relationship.preservationStatus === "preserved" ? "Korunan" :
                           relationship.preservationStatus === "separated" ? "Ayrılan" : "Kayıp"}
                        </span>
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {relationship.imageRef.type === "img_tag" ? "IMG Tag" :
                         relationship.imageRef.type === "figure_ref" ? "Şekil Ref" :
                         relationship.imageRef.type === "table_ref" ? "Tablo Ref" : "Diyagram"}
                      </Badge>
                      {relationship.imageRef.turkishPattern && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          🇹🇷 Türkçe
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Güç: {(relationship.contextStrength * 100).toFixed(0)}%
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Reference Text */}
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="text-sm font-medium text-blue-800 mb-1">Referans Metni:</div>
                    <div className="text-sm text-blue-700 font-mono">
                      {relationship.imageRef.referenceText}
                    </div>
                  </div>

                  {/* Context Text */}
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <div className="text-sm font-medium text-gray-800 mb-1">Bağlam Metni:</div>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {relationship.relatedText.length > 200 ? (
                        <>
                          {relationship.relatedText.substring(0, 200)}
                          <button 
                            className="text-blue-600 hover:text-blue-800 ml-2"
                            onClick={() => setSelectedReference(
                              selectedReference === relationship.imageRef.referenceText ? null : relationship.imageRef.referenceText
                            )}
                          >
                            {selectedReference === relationship.imageRef.referenceText ? "Daha az göster" : "Devamını göster..."}
                          </button>
                          {selectedReference === relationship.imageRef.referenceText && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              {relationship.relatedText.substring(200)}
                            </div>
                          )}
                        </>
                      ) : (
                        relationship.relatedText
                      )}
                    </div>
                  </div>

                  {/* Chunk Information */}
                  {relationship.chunkBoundary && (
                    <div className="bg-purple-50 border border-purple-200 rounded p-3">
                      <div className="text-sm font-medium text-purple-800 mb-2">Chunk Bilgisi:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-purple-600">Görsel Chunk:</span>
                          <span className="ml-1 font-mono">{relationship.chunkBoundary.imageChunk}</span>
                        </div>
                        <div>
                          <span className="text-purple-600">Metin Chunk:</span>
                          <span className="ml-1 font-mono">{relationship.chunkBoundary.textChunk}</span>
                        </div>
                      </div>
                      {relationship.chunkBoundary.crossesBoundary && (
                        <div className="mt-2 text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded">
                          ⚠️ Referans chunk sınırını geçiyor
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

      {/* Analysis Tab */}
      {activeView === "analysis" && showDetailedAnalysis && (
        <div className="space-y-6">
          {/* Pattern Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Referans Kalıpları Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Tespit Edilen Kalıplar</h4>
                  <div className="space-y-2">
                    {Array.from(new Set(detectImageReferences.map(ref => ref.type))).map(type => {
                      const count = detectImageReferences.filter(ref => ref.type === type).length;
                      return (
                        <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">
                            {type === "img_tag" ? "HTML IMG Etiketleri" :
                             type === "figure_ref" ? "Şekil Referansları" :
                             type === "table_ref" ? "Tablo Referansları" : "Diyagram Referansları"}
                          </span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Türkçe Optimizasyon</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <span className="text-sm">Türkçe Kalıplar</span>
                      <Badge variant="outline" className="bg-blue-100">
                        {detectImageReferences.filter(ref => ref.turkishPattern).length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">Standart Kalıplar</span>
                      <Badge variant="outline">
                        {detectImageReferences.filter(ref => !ref.turkishPattern).length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm">Optimizasyon Oranı</span>
                      <Badge variant="outline" className="bg-green-100">
                        {detectImageReferences.length > 0 ? 
                          ((detectImageReferences.filter(ref => ref.turkishPattern).length / detectImageReferences.length) * 100).toFixed(0) + "%" 
                          : "0%"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Context Strength Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Bağlam Gücü Dağılımı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={contextRelationships.map((rel, idx) => ({
                  index: idx + 1,
                  strength: rel.contextStrength * 100,
                  status: rel.preservationStatus
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, "Bağlam Gücü"]}
                  />
                  <Bar dataKey="strength" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Zap className="h-5 w-5" />
                İyileştirme Önerileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {preservationMetrics.preservationRate < 0.8 && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <strong>Koruma Oranı Düşük:</strong> Chunk boyutlarını artırarak veya semantik sınır algılamasını iyileştirerek görsel-metin ilişkilerini daha iyi koruyabilirsiniz.
                    </div>
                  </div>
                )}
                
                {preservationMetrics.contextCoherenceScore < 0.7 && (
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <strong>Bağlam Uyumu Zayıf:</strong> Türkçe akademik terimler ve referans kalıplarını daha iyi tanıyacak şekilde algoritma parametrelerini ayarlayın.
                    </div>
                  </div>
                )}

                {preservationMetrics.separatedReferences > preservationMetrics.preservedReferences && (
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="text-sm">
                      <strong>Çok Fazla Ayrılma:</strong> Minimum chunk boyutunu artırın veya görsel referansları tespit eden özel kurallar ekleyin.
                    </div>
                  </div>
                )}

                {detectImageReferences.filter(ref => ref.turkishPattern).length === 0 && enableTurkishPatterns && (
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-purple-600 mt-0.5" />
                    <div className="text-sm">
                      <strong>Türkçe Optimizasyon:</strong> Metninizde Türkçe görsel referansları tespit edilmedi. Türkçe akademik kalıpları kontrol edin.
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Heatmap Tab */}
      {activeView === "heatmap" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Bağlam Koruma Isı Haritası
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                Her chunk'ın görsel-metin bağlam koruma performansı. Yeşil: İyi koruma, Sarı: Orta koruma, Kırmızı: Zayıf koruma
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                {chunks.map((chunk, index) => {
                  const chunkReferences = contextRelationships.filter(rel => 
                    rel.chunkBoundary?.imageChunk === chunk.id || rel.chunkBoundary?.textChunk === chunk.id
                  );
                  
                  const avgStrength = chunkReferences.length > 0 
                    ? chunkReferences.reduce((sum, rel) => sum + rel.contextStrength, 0) / chunkReferences.length
                    : 0;
                  
                  const heatColor = avgStrength >= 0.7 ? "bg-green-100 border-green-300" :
                                   avgStrength >= 0.4 ? "bg-yellow-100 border-yellow-300" :
                                   avgStrength > 0 ? "bg-red-100 border-red-300" : "bg-gray-100 border-gray-300";
                  
                  return (
                    <div key={chunk.id} className={`p-3 border rounded ${heatColor}`}>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">Chunk #{index + 1}</Badge>
                        <div className="text-sm">
                          {chunkReferences.length} referans, Güç: {(avgStrength * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 leading-relaxed">
                        {chunk.content.substring(0, 100)}
                        {chunk.content.length > 100 && "..."}
                      </div>
                      {chunkReferences.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {chunkReferences.map((rel, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {rel.imageRef.referenceText.substring(0, 20)}
                              {rel.imageRef.referenceText.length > 20 && "..."}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VisualTextContextAnalyzer;