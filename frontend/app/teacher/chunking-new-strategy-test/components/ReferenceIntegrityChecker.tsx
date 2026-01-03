"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Link2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search,
  Filter,
  BarChart3,
  Activity,
  Target,
  GitBranch,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
  Zap
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
  ScatterChart,
  Scatter
} from "recharts";

// Enhanced interfaces for reference integrity checking
interface CrossReference {
  id: string;
  sourceChunk: string;
  targetChunk: string;
  referenceType: "figure" | "table" | "section" | "equation" | "citation";
  sourceText: string;
  targetText: string;
  distance: number; // Distance between chunks
  integrityStatus: "intact" | "broken" | "weakened";
  confidence: number; // 0-1 confidence in the reference match
  turkishPattern?: boolean;
}

interface IntegrityMetrics {
  totalReferences: number;
  intactReferences: number;
  brokenReferences: number;
  weakenedReferences: number;
  integrityRate: number;
  averageDistance: number;
  confidenceScore: number;
  patternAccuracy: number;
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

interface ReferenceIntegrityCheckerProps {
  chunks: ChunkData[];
  originalText: string;
  strategy: string;
  enableTurkishPatterns?: boolean;
  showDetailedAnalysis?: boolean;
}

const ReferenceIntegrityChecker: React.FC<ReferenceIntegrityCheckerProps> = ({
  chunks,
  originalText,
  strategy,
  enableTurkishPatterns = true,
  showDetailedAnalysis = true
}) => {
  const [activeView, setActiveView] = useState<"overview" | "references" | "analysis" | "validation">("overview");
  const [selectedReference, setSelectedReference] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "intact" | "broken" | "weakened">("all");
  const [filterType, setFilterType] = useState<"all" | "figure" | "table" | "section" | "equation" | "citation">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfidenceThreshold, setShowConfidenceThreshold] = useState(0.5);

  // Turkish reference patterns
  const turkishReferencePatterns = {
    figure: [
      /Şekil\s+(\d+(?:\.\d+)?)/gi,
      /Figür\s+(\d+(?:\.\d+)?)/gi,
      /Grafik\s+(\d+(?:\.\d+)?)/gi,
      /Diyagram\s+(\d+(?:\.\d+)?)/gi,
      /yukarıdaki\s+şekil/gi,
      /aşağıdaki\s+şekil/gi,
      /bu\s+şekil/gi
    ],
    table: [
      /Tablo\s+(\d+(?:\.\d+)?)/gi,
      /Çizelge\s+(\d+(?:\.\d+)?)/gi,
      /yukarıdaki\s+tablo/gi,
      /aşağıdaki\s+tablo/gi,
      /bu\s+tablo/gi
    ],
    section: [
      /Bölüm\s+(\d+(?:\.\d+)?)/gi,
      /Kısım\s+(\d+(?:\.\d+)?)/gi,
      /yukarıda\s+belirtildiği\s+gibi/gi,
      /aşağıda\s+açıklandığı\s+üzere/gi
    ],
    equation: [
      /Denklem\s+(\d+(?:\.\d+)?)/gi,
      /Eşitlik\s+(\d+(?:\.\d+)?)/gi,
      /Formül\s+(\d+(?:\.\d+)?)/gi
    ],
    citation: [
      /\(([^)]+,?\s*\d{4}[a-z]?)\)/gi,
      /\[(\d+(?:,\s*\d+)*)\]/gi,
      /([\w\s]+)\s+et\s+al\.\s*\(\d{4}\)/gi,
      /([\w\s]+)\s+ve\s+ark\.\s*\(\d{4}\)/gi
    ]
  };

  // Detect cross-references in text
  const detectCrossReferences = useMemo(() => {
    const references: CrossReference[] = [];
    let refId = 0;

    // Function to find chunk containing position
    const findChunkForPosition = (position: number): string => {
      for (const chunk of chunks) {
        if (position >= chunk.startIndex && position <= chunk.endIndex) {
          return chunk.id;
        }
      }
      return "unknown";
    };

    // Function to calculate reference confidence
    const calculateConfidence = (sourceText: string, targetText: string, type: string): number => {
      let confidence = 0.5; // Base confidence
      
      // Increase confidence based on pattern specificity
      if (type === "figure" || type === "table") {
        if (/\d+/.test(sourceText)) confidence += 0.3; // Has number
        if (enableTurkishPatterns && /Şekil|Tablo|Figür|Çizelge/.test(sourceText)) confidence += 0.2;
      }
      
      // Increase confidence if target text contains relevant keywords
      const keywords = {
        figure: ["şekil", "grafik", "diyagram", "resim", "görsel"],
        table: ["tablo", "çizelge", "veri", "sonuç"],
        section: ["bölüm", "kısım", "başlık"],
        equation: ["denklem", "formül", "eşitlik"],
        citation: ["kaynak", "referans", "atıf"]
      };
      
      if (keywords[type as keyof typeof keywords]) {
        const typeKeywords = keywords[type as keyof typeof keywords];
        const targetLower = targetText.toLowerCase();
        if (typeKeywords.some(keyword => targetLower.includes(keyword))) {
          confidence += 0.2;
        }
      }
      
      return Math.min(1, confidence);
    };

    // Search for each reference type
    Object.entries(turkishReferencePatterns).forEach(([type, patterns]) => {
      patterns.forEach(pattern => {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        
        while ((match = regex.exec(originalText)) !== null) {
          const sourceChunk = findChunkForPosition(match.index);
          const sourceText = match[0];
          
          // Look for potential targets in nearby chunks
          const contextWindow = 1000; // characters
          const startPos = Math.max(0, match.index - contextWindow);
          const endPos = Math.min(originalText.length, match.index + contextWindow);
          const contextText = originalText.substring(startPos, endPos);
          
          // Find the most likely target chunk
          let bestTarget = "";
          let bestTargetText = "";
          let bestDistance = Infinity;
          
          chunks.forEach(chunk => {
            if (chunk.id !== sourceChunk) {
              const distance = Math.abs(chunk.startIndex - match.index);
              if (distance < bestDistance && distance < contextWindow) {
                bestTarget = chunk.id;
                bestTargetText = chunk.content.substring(0, 200);
                bestDistance = distance;
              }
            }
          });
          
          if (bestTarget) {
            const confidence = calculateConfidence(sourceText, bestTargetText, type);
            
            // Determine integrity status
            let integrityStatus: "intact" | "broken" | "weakened" = "intact";
            if (sourceChunk === "unknown" || bestTarget === "unknown") {
              integrityStatus = "broken";
            } else if (bestDistance > 500 || confidence < 0.6) {
              integrityStatus = "weakened";
            }
            
            references.push({
              id: `ref_${refId++}`,
              sourceChunk,
              targetChunk: bestTarget,
              referenceType: type as any,
              sourceText,
              targetText: bestTargetText,
              distance: bestDistance,
              integrityStatus,
              confidence,
              turkishPattern: enableTurkishPatterns
            });
          }
        }
      });
    });

    return references;
  }, [chunks, originalText, enableTurkishPatterns]);

  // Calculate integrity metrics
  const integrityMetrics = useMemo((): IntegrityMetrics => {
    const total = detectCrossReferences.length;
    const intact = detectCrossReferences.filter(ref => ref.integrityStatus === "intact").length;
    const broken = detectCrossReferences.filter(ref => ref.integrityStatus === "broken").length;
    const weakened = detectCrossReferences.filter(ref => ref.integrityStatus === "weakened").length;

    const integrityRate = total > 0 ? intact / total : 0;
    const averageDistance = total > 0 ? detectCrossReferences.reduce((sum, ref) => sum + ref.distance, 0) / total : 0;
    const confidenceScore = total > 0 ? detectCrossReferences.reduce((sum, ref) => sum + ref.confidence, 0) / total : 0;
    const patternAccuracy = total > 0 ? detectCrossReferences.filter(ref => ref.confidence >= 0.7).length / total : 0;

    return {
      totalReferences: total,
      intactReferences: intact,
      brokenReferences: broken,
      weakenedReferences: weakened,
      integrityRate,
      averageDistance,
      confidenceScore,
      patternAccuracy
    };
  }, [detectCrossReferences]);

  // Filter references
  const filteredReferences = useMemo(() => {
    let filtered = detectCrossReferences;

    if (filterStatus !== "all") {
      filtered = filtered.filter(ref => ref.integrityStatus === filterStatus);
    }

    if (filterType !== "all") {
      filtered = filtered.filter(ref => ref.referenceType === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(ref => 
        ref.sourceText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.targetText.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered = filtered.filter(ref => ref.confidence >= showConfidenceThreshold);

    return filtered;
  }, [detectCrossReferences, filterStatus, filterType, searchTerm, showConfidenceThreshold]);

  // Chart data
  const chartData = [
    { name: "Sağlam", value: integrityMetrics.intactReferences, color: "#10b981" },
    { name: "Zayıflamış", value: integrityMetrics.weakenedReferences, color: "#f59e0b" },
    { name: "Kırık", value: integrityMetrics.brokenReferences, color: "#ef4444" }
  ];

  const typeDistribution = Object.entries(
    detectCrossReferences.reduce((acc, ref) => {
      acc[ref.referenceType] = (acc[ref.referenceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, count]) => ({
    type: type === "figure" ? "Şekil" : 
          type === "table" ? "Tablo" :
          type === "section" ? "Bölüm" :
          type === "equation" ? "Denklem" : "Atıf",
    count
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "intact": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "weakened": return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "broken": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "intact": return "text-green-600 bg-green-50 border-green-200";
      case "weakened": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "broken": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "figure": return "🖼️";
      case "table": return "📊";
      case "section": return "📑";
      case "equation": return "🧮";
      case "citation": return "📚";
      default: return "🔗";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link2 className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Referans Bütünlük Kontrolü</h2>
          <Badge variant="outline" className="ml-2">
            {integrityMetrics.totalReferences} Referans
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
            <Link2 className="h-4 w-4 mr-2" />
            Referanslar
          </Button>
          <Button
            variant={activeView === "analysis" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("analysis")}
          >
            <Activity className="h-4 w-4 mr-2" />
            Analiz
          </Button>
          <Button
            variant={activeView === "validation" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("validation")}
          >
            <Target className="h-4 w-4 mr-2" />
            Doğrulama
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Referanslarda Ara</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Referans ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status-filter">Durum Filtresi</Label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="intact">Sağlam</option>
                <option value="weakened">Zayıflamış</option>
                <option value="broken">Kırık</option>
              </select>
            </div>

            <div>
              <Label htmlFor="type-filter">Tür Filtresi</Label>
              <select
                id="type-filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Türler</option>
                <option value="figure">Şekil</option>
                <option value="table">Tablo</option>
                <option value="section">Bölüm</option>
                <option value="equation">Denklem</option>
                <option value="citation">Atıf</option>
              </select>
            </div>

            <div>
              <Label htmlFor="confidence-threshold">Güven Eşiği: {showConfidenceThreshold.toFixed(1)}</Label>
              <input
                id="confidence-threshold"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={showConfidenceThreshold}
                onChange={(e) => setShowConfidenceThreshold(parseFloat(e.target.value))}
                className="mt-1 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterType("all");
                setShowConfidenceThreshold(0.5);
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Sıfırla
            </Button>
            <div className="text-sm text-gray-600">
              {filteredReferences.length} / {detectCrossReferences.length} referans gösteriliyor
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
                      {integrityMetrics.totalReferences}
                    </p>
                    <p className="text-xs text-gray-500">
                      Çapraz referans
                    </p>
                  </div>
                  <Link2 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Bütünlük Oranı</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(integrityMetrics.integrityRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {integrityMetrics.intactReferences} sağlam
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
                    <p className="text-sm text-gray-600">Güven Skoru</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(integrityMetrics.confidenceScore * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      Ortalama güven
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Kalıp Doğruluğu</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {(integrityMetrics.patternAccuracy * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      Yüksek güvenli
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Integrity Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Bütünlük Durumu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Reference Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Referans Türleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={typeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <Card className={`border-2 ${
            integrityMetrics.integrityRate >= 0.8 ? "border-green-200 bg-green-50" :
            integrityMetrics.integrityRate >= 0.6 ? "border-yellow-200 bg-yellow-50" :
            "border-red-200 bg-red-50"
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Bütünlük Performansı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {integrityMetrics.integrityRate >= 0.8 ? (
                      <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
                    ) : integrityMetrics.integrityRate >= 0.6 ? (
                      <AlertTriangle className="h-12 w-12 mx-auto text-yellow-600" />
                    ) : (
                      <XCircle className="h-12 w-12 mx-auto text-red-600" />
                    )}
                  </div>
                  <div className="text-sm font-medium">Genel Durum</div>
                  <div className="text-xs text-gray-600">
                    {integrityMetrics.integrityRate >= 0.8 ? "Mükemmel Bütünlük" :
                     integrityMetrics.integrityRate >= 0.6 ? "İyi Bütünlük" : "Zayıf Bütünlük"}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sağlam:</span>
                    <span className="font-semibold text-green-600">
                      {integrityMetrics.intactReferences}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Zayıflamış:</span>
                    <span className="font-semibold text-yellow-600">
                      {integrityMetrics.weakenedReferences}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Kırık:</span>
                    <span className="font-semibold text-red-600">
                      {integrityMetrics.brokenReferences}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ortalama Mesafe:</span>
                    <span className="font-semibold">
                      {Math.round(integrityMetrics.averageDistance)} karakter
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Güven Skoru:</span>
                    <span className="font-semibold">
                      {(integrityMetrics.confidenceScore * 100).toFixed(1)}%
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
          {filteredReferences.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Link2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Referans Bulunamadı
                </h3>
                <p className="text-gray-500">
                  {searchTerm || filterStatus !== "all" || filterType !== "all" 
                    ? "Arama kriterlerinize uygun referans bulunamadı."
                    : "Bu metinde çapraz referans tespit edilmedi."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredReferences.map((reference, index) => (
              <Card key={reference.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <Badge 
                        className={`${getStatusColor(reference.integrityStatus)} border`}
                      >
                        {getStatusIcon(reference.integrityStatus)}
                        <span className="ml-1 capitalize">
                          {reference.integrityStatus === "intact" ? "Sağlam" :
                           reference.integrityStatus === "weakened" ? "Zayıflamış" : "Kırık"}
                        </span>
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getTypeIcon(reference.referenceType)} {
                          reference.referenceType === "figure" ? "Şekil" :
                          reference.referenceType === "table" ? "Tablo" :
                          reference.referenceType === "section" ? "Bölüm" :
                          reference.referenceType === "equation" ? "Denklem" : "Atıf"
                        }
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Güven: {(reference.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {Math.round(reference.distance)} karakter mesafe
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Source Reference */}
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="text-sm font-medium text-blue-800 mb-1">
                      Kaynak Referans (Chunk: {reference.sourceChunk}):
                    </div>
                    <div className="text-sm text-blue-700 font-mono">
                      {reference.sourceText}
                    </div>
                  </div>

                  {/* Target Reference */}
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <div className="text-sm font-medium text-green-800 mb-1">
                      Hedef İçerik (Chunk: {reference.targetChunk}):
                    </div>
                    <div className="text-sm text-green-700 leading-relaxed">
                      {reference.targetText.length > 150 ? (
                        <>
                          {reference.targetText.substring(0, 150)}
                          <button 
                            className="text-green-600 hover:text-green-800 ml-2"
                            onClick={() => setSelectedReference(
                              selectedReference === reference.id ? null : reference.id
                            )}
                          >
                            {selectedReference === reference.id ? "Daha az göster" : "Devamını göster..."}
                          </button>
                          {selectedReference === reference.id && (
                            <div className="mt-2 pt-2 border-t border-green-200">
                              {reference.targetText.substring(150)}
                            </div>
                          )}
                        </>
                      ) : (
                        reference.targetText
                      )}
                    </div>
                  </div>

                  {/* Reference Flow */}
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <div className="text-sm font-medium text-gray-800 mb-2">Referans Akışı:</div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {reference.sourceChunk}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <Badge variant="outline" className="text-xs">
                        {reference.targetChunk}
                      </Badge>
                      <span className="text-gray-500 ml-2">
                        ({Math.round(reference.distance)} karakter)
                      </span>
                    </div>
                    
                    {/* Confidence and Status Details */}
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Güven Skoru:</span>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              reference.confidence >= 0.8 ? 'bg-green-500' :
                              reference.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${reference.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Mesafe Skoru:</span>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              reference.distance <= 200 ? 'bg-green-500' :
                              reference.distance <= 500 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.max(10, 100 - (reference.distance / 10))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Analysis Tab */}
      {activeView === "analysis" && showDetailedAnalysis && (
        <div className="space-y-6">
          {/* Distance vs Confidence Scatter Plot */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Mesafe vs Güven Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={detectCrossReferences.map(ref => ({
                  distance: ref.distance,
                  confidence: ref.confidence * 100,
                  status: ref.integrityStatus
                }))}>
                  <CartesianGrid />
                  <XAxis dataKey="distance" name="Mesafe" />
                  <YAxis dataKey="confidence" name="Güven %" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Referanslar" data={detectCrossReferences} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pattern Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Kalıp Analizi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    detectCrossReferences.reduce((acc, ref) => {
                      acc[ref.referenceType] = (acc[ref.referenceType] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm flex items-center gap-2">
                        {getTypeIcon(type)}
                        {type === "figure" ? "Şekil Referansları" :
                         type === "table" ? "Tablo Referansları" :
                         type === "section" ? "Bölüm Referansları" :
                         type === "equation" ? "Denklem Referansları" : "Atıf Referansları"}
                      </span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Kalite Metrikleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Yüksek Güven (≥80%):</span>
                    <Badge variant="outline" className="bg-green-50">
                      {detectCrossReferences.filter(ref => ref.confidence >= 0.8).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Orta Güven (60-79%):</span>
                    <Badge variant="outline" className="bg-yellow-50">
                      {detectCrossReferences.filter(ref => ref.confidence >= 0.6 && ref.confidence < 0.8).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Düşük Güven (<60%):</span>
                    <Badge variant="outline" className="bg-red-50">
                      {detectCrossReferences.filter(ref => ref.confidence < 0.6).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Yakın Mesafe (≤200):</span>
                    <Badge variant="outline" className="bg-blue-50">
                      {detectCrossReferences.filter(ref => ref.distance <= 200).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Zap className="h-5 w-5" />
                İyileştirme Önerileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {integrityMetrics.integrityRate < 0.7 && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <strong>Düşük Bütünlük Oranı:</strong> Chunk boyutlarını artırarak veya referans-hedef mesafesini azaltacak stratejiler uygulayarak bütünlüğü iyileştirebilirsiniz.
                    </div>
                  </div>
                )}
                
                {integrityMetrics.confidenceScore < 0.6 && (
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <strong>Düşük Güven Skoru:</strong> Türkçe referans kalıplarını geliştirin ve daha spesifik eşleştirme algoritmaları kullanın.
                    </div>
                  </div>
                )}

                {integrityMetrics.brokenReferences > integrityMetrics.intactReferences && (
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="text-sm">
                      <strong>Çok Fazla Kırık Referans:</strong> Referans tespit algoritmalarını iyileştirin ve chunk sınırlarını referansları koruyacak şekilde ayarlayın.
                    </div>
                  </div>
                )}

                {integrityMetrics.averageDistance > 1000 && (
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-purple-600 mt-0.5" />
                    <div className="text-sm">
                      <strong>Yüksek Ortalama Mesafe:</strong> İlgili içerikleri daha yakın chunk'larda tutacak semantik gruplandırma stratejileri uygulayın.
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Validation Tab */}
      {activeView === "validation" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Referans Doğrulama Testi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                Bu bölüm, tespit edilen referansların doğruluğunu manuel olarak kontrol etmenizi sağlar.
              </div>
              
              {/* Validation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {detectCrossReferences.filter(ref => ref.confidence >= 0.8).length}
                  </div>
                  <div className="text-sm text-green-700">Yüksek Güvenilir</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded">
                  <div className="text-2xl font-bold text-yellow-600">
                    {detectCrossReferences.filter(ref => ref.confidence >= 0.6 && ref.confidence < 0.8).length}
                  </div>
                  <div className="text-sm text-yellow-700">Manuel Kontrol Gerekli</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded">
                  <div className="text-2xl font-bold text-red-600">
                    {detectCrossReferences.filter(ref => ref.confidence < 0.6).length}
                  </div>
                  <div className="text-sm text-red-700">Düşük Güvenilir</div>
                </div>
              </div>

              {/* Manual Validation List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {detectCrossReferences
                  .filter(ref => ref.confidence < 0.8)
                  .slice(0, 10)
                  .map((ref, index) => (
                    <div key={ref.id} className="border rounded p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">Doğrulama #{index + 1}</Badge>
                        <Badge className={getStatusColor(ref.integrityStatus)}>
                          Güven: {(ref.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="text-sm space-y-2">
                        <div>
                          <strong>Kaynak:</strong> {ref.sourceText}
                        </div>
                        <div>
                          <strong>Hedef:</strong> {ref.targetText.substring(0, 100)}...
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Doğru
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            Yanlış
                          </Button>
                        </div>
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

export default ReferenceIntegrityChecker;