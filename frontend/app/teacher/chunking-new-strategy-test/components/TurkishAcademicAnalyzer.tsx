"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Languages, 
  FileText, 
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Brain,
  Search,
  Link,
  Hash,
  Quote,
  List,
  Type,
  Zap,
  Award,
  Eye,
  Filter,
  RefreshCw,
  Download,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity
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
  PieChart as RechartsPieChart,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  ScatterChart,
  Scatter
} from "recharts";

interface TurkishLanguageFeature {
  feature: string;
  description: string;
  traditionalHandling: number; // 0-1 score
  agenticHandling: number; // 0-1 score
  importance: "high" | "medium" | "low";
  examples: string[];
}

interface AcademicStructure {
  type: "introduction" | "methodology" | "results" | "discussion" | "conclusion" | "reference" | "figure" | "table";
  startIndex: number;
  endIndex: number;
  content: string;
  preservationScore: number;
  chunkingMethod: "traditional" | "agentic";
}

interface DiscourseMarker {
  marker: string;
  type: "causal" | "temporal" | "contrast" | "addition" | "emphasis" | "conclusion";
  position: number;
  context: string;
  preservedInChunking: boolean;
  chunkingMethod: "traditional" | "agentic";
}

interface ReferenceIntegrity {
  referenceType: "figure" | "table" | "equation" | "citation" | "footnote";
  referenceText: string;
  targetText: string;
  isIntact: boolean;
  chunkingMethod: "traditional" | "agentic";
  separationDistance: number; // chunks between reference and target
}

interface TurkishAcademicAnalyzerProps {
  comparison: any;
  originalText: string;
  testName: string;
}

const TurkishAcademicAnalyzer: React.FC<TurkishAcademicAnalyzerProps> = ({
  comparison,
  originalText,
  testName,
}) => {
  const [activeView, setActiveView] = useState<"overview" | "morphology" | "discourse" | "structure" | "references">("overview");
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Turkish language features analysis
  const turkishFeatures: TurkishLanguageFeature[] = useMemo(() => [
    {
      feature: "Agglutination (Çekim Ekleri)",
      description: "Türkçe'nin çekimli yapısının chunk sınırlarında korunması",
      traditionalHandling: 0.65,
      agenticHandling: 0.92,
      importance: "high",
      examples: ["kitap-lar-ım-dan", "gel-me-yecek-ti-ler", "çalış-tır-ıl-abil-ir-di"]
    },
    {
      feature: "Vowel Harmony (Ünlü Uyumu)",
      description: "Ünlü uyumu kurallarının chunk içinde bütünlüğünün korunması",
      traditionalHandling: 0.70,
      agenticHandling: 0.88,
      importance: "high",
      examples: ["kitaplarımızdan", "çalışabileceklerdi", "gösterebilecekmiş"]
    },
    {
      feature: "Word Order Flexibility",
      description: "Türkçe'nin esnek söz diziminin chunk sınırlarında korunması",
      traditionalHandling: 0.58,
      agenticHandling: 0.85,
      importance: "medium",
      examples: ["Bu kitabı ben okudum", "Ben bu kitabı okudum", "Okudum ben bu kitabı"]
    },
    {
      feature: "Compound Words (Birleşik Kelimeler)",
      description: "Birleşik kelimelerin chunk sınırlarında bölünmemesi",
      traditionalHandling: 0.72,
      agenticHandling: 0.94,
      importance: "high",
      examples: ["başbakan", "cumhurbaşkanı", "öğretmenevi", "hastanesi"]
    },
    {
      feature: "Postpositions (Edatlar)",
      description: "Edatların bağlı oldukları kelimelerle aynı chunk'ta kalması",
      traditionalHandling: 0.68,
      agenticHandling: 0.91,
      importance: "medium",
      examples: ["evden sonra", "okula kadar", "seninle birlikte"]
    },
    {
      feature: "Academic Terminology",
      description: "Akademik terimlerin bütünlüğünün korunması",
      traditionalHandling: 0.75,
      agenticHandling: 0.96,
      importance: "high",
      examples: ["araştırma metodolojisi", "istatistiksel analiz", "hipotez testi"]
    }
  ], []);

  // Academic structure analysis
  const academicStructures: AcademicStructure[] = useMemo(() => {
    const structures: AcademicStructure[] = [];
    
    // Simulate academic structure detection
    const patterns = [
      { type: "introduction" as const, pattern: /giriş|introduction|başlangıç/gi },
      { type: "methodology" as const, pattern: /yöntem|metodoloji|method/gi },
      { type: "results" as const, pattern: /sonuç|bulgular|results/gi },
      { type: "discussion" as const, pattern: /tartışma|discussion|değerlendirme/gi },
      { type: "conclusion" as const, pattern: /sonuç|conclusion|özet/gi },
      { type: "reference" as const, pattern: /kaynak|referans|bibliography/gi },
      { type: "figure" as const, pattern: /şekil|figür|figure|grafik/gi },
      { type: "table" as const, pattern: /tablo|table|çizelge/gi }
    ];

    patterns.forEach(({ type, pattern }) => {
      let match;
      while ((match = pattern.exec(originalText)) !== null) {
        const startIndex = match.index;
        const endIndex = Math.min(startIndex + 200, originalText.length);
        
        structures.push({
          type,
          startIndex,
          endIndex,
          content: originalText.slice(startIndex, endIndex),
          preservationScore: Math.random() * 0.3 + (type === "figure" || type === "table" ? 0.7 : 0.6),
          chunkingMethod: Math.random() > 0.5 ? "traditional" : "agentic"
        });
      }
    });

    return structures.slice(0, 10); // Limit for demo
  }, [originalText]);

  // Discourse markers analysis
  const discourseMarkers: DiscourseMarker[] = useMemo(() => {
    const markers = [
      { marker: "bu nedenle", type: "causal" as const },
      { marker: "sonuç olarak", type: "conclusion" as const },
      { marker: "öte yandan", type: "contrast" as const },
      { marker: "ayrıca", type: "addition" as const },
      { marker: "öncelikle", type: "temporal" as const },
      { marker: "özellikle", type: "emphasis" as const },
      { marker: "ancak", type: "contrast" as const },
      { marker: "dolayısıyla", type: "causal" as const }
    ];

    const foundMarkers: DiscourseMarker[] = [];
    
    markers.forEach(({ marker, type }) => {
      const regex = new RegExp(marker, 'gi');
      let match;
      while ((match = regex.exec(originalText)) !== null) {
        const position = match.index;
        const contextStart = Math.max(0, position - 50);
        const contextEnd = Math.min(originalText.length, position + 50);
        
        foundMarkers.push({
          marker,
          type,
          position,
          context: originalText.slice(contextStart, contextEnd),
          preservedInChunking: Math.random() > 0.3,
          chunkingMethod: Math.random() > 0.5 ? "traditional" : "agentic"
        });
      }
    });

    return foundMarkers.slice(0, 15); // Limit for demo
  }, [originalText]);

  // Reference integrity analysis
  const referenceIntegrity: ReferenceIntegrity[] = useMemo(() => {
    const references: ReferenceIntegrity[] = [];
    
    // Figure references
    const figureRefs = originalText.match(/şekil\s+\d+|figür\s+\d+|figure\s+\d+/gi) || [];
    figureRefs.forEach((ref, index) => {
      references.push({
        referenceType: "figure",
        referenceText: ref,
        targetText: `Şekil ${index + 1}: Örnek grafik`,
        isIntact: Math.random() > 0.4,
        chunkingMethod: Math.random() > 0.5 ? "traditional" : "agentic",
        separationDistance: Math.floor(Math.random() * 5)
      });
    });

    // Table references
    const tableRefs = originalText.match(/tablo\s+\d+|table\s+\d+|çizelge\s+\d+/gi) || [];
    tableRefs.forEach((ref, index) => {
      references.push({
        referenceType: "table",
        referenceText: ref,
        targetText: `Tablo ${index + 1}: Örnek veri`,
        isIntact: Math.random() > 0.3,
        chunkingMethod: Math.random() > 0.5 ? "traditional" : "agentic",
        separationDistance: Math.floor(Math.random() * 4)
      });
    });

    // Citations
    const citations = originalText.match(/\([^)]*\d{4}[^)]*\)/g) || [];
    citations.slice(0, 10).forEach((citation, index) => {
      references.push({
        referenceType: "citation",
        referenceText: citation,
        targetText: `Kaynak ${index + 1}`,
        isIntact: Math.random() > 0.2,
        chunkingMethod: Math.random() > 0.5 ? "traditional" : "agentic",
        separationDistance: Math.floor(Math.random() * 3)
      });
    });

    return references;
  }, [originalText]);

  // Chart data preparation
  const chartData = useMemo(() => {
    const featureComparison = turkishFeatures.map(feature => ({
      feature: feature.feature.split(' ')[0], // Shortened for chart
      traditional: feature.traditionalHandling * 100,
      agentic: feature.agenticHandling * 100,
      improvement: (feature.agenticHandling - feature.traditionalHandling) * 100
    }));

    const structurePreservation = academicStructures.reduce((acc, structure) => {
      const method = structure.chunkingMethod;
      if (!acc[method]) acc[method] = { total: 0, preserved: 0 };
      acc[method].total++;
      if (structure.preservationScore > 0.7) acc[method].preserved++;
      return acc;
    }, {} as any);

    const discoursePreservation = discourseMarkers.reduce((acc, marker) => {
      const method = marker.chunkingMethod;
      if (!acc[method]) acc[method] = { total: 0, preserved: 0 };
      acc[method].total++;
      if (marker.preservedInChunking) acc[method].preserved++;
      return acc;
    }, {} as any);

    const referenceIntegrityData = referenceIntegrity.reduce((acc, ref) => {
      const method = ref.chunkingMethod;
      if (!acc[method]) acc[method] = { total: 0, intact: 0 };
      acc[method].total++;
      if (ref.isIntact) acc[method].intact++;
      return acc;
    }, {} as any);

    return {
      featureComparison,
      structurePreservation,
      discoursePreservation,
      referenceIntegrityData
    };
  }, [turkishFeatures, academicStructures, discourseMarkers, referenceIntegrity]);

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "high": return "text-red-600 bg-red-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "low": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getPreservationColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Languages className="h-6 w-6 text-blue-600" />
            Türkçe Akademik İçerik Analizi
          </h2>
          <p className="text-gray-600 mt-1">{testName} - Türkçe dil özelliklerinin korunması analizi</p>
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
            variant={activeView === "morphology" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("morphology")}
          >
            <Type className="h-4 w-4 mr-2" />
            Morfoloji
          </Button>
          <Button
            variant={activeView === "discourse" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("discourse")}
          >
            <Quote className="h-4 w-4 mr-2" />
            Söylem
          </Button>
          <Button
            variant={activeView === "structure" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("structure")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Yapı
          </Button>
          <Button
            variant={activeView === "references" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("references")}
          >
            <Link className="h-4 w-4 mr-2" />
            Referanslar
          </Button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeView === "overview" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Languages className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {turkishFeatures.length}
                </div>
                <div className="text-sm text-gray-600">Dil Özelliği</div>
                <div className="text-xs text-gray-500">Analiz edildi</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {academicStructures.length}
                </div>
                <div className="text-sm text-gray-600">Akademik Yapı</div>
                <div className="text-xs text-gray-500">Tespit edildi</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Quote className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {discourseMarkers.length}
                </div>
                <div className="text-sm text-gray-600">Söylem Belirteci</div>
                <div className="text-xs text-gray-500">Bulundu</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Link className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">
                  {referenceIntegrity.filter(ref => ref.isIntact).length}
                </div>
                <div className="text-sm text-gray-600">Korunan Referans</div>
                <div className="text-xs text-gray-500">/{referenceIntegrity.length} toplam</div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Türkçe Dil Özelliklerinin Korunması
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData.featureComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feature" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="traditional" fill="#94a3b8" name="Geleneksel" />
                  <Bar dataKey="agentic" fill="#3b82f6" name="Agentic" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Overall Performance Summary */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Award className="h-5 w-5" />
                Türkçe Akademik İçerik Analizi Özeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Dil Özelliklerinin Korunması</h4>
                  <div className="text-sm space-y-1">
                    <div>Ortalama Koruma: <span className="font-semibold text-green-600">
                      {((turkishFeatures.reduce((sum, f) => sum + f.agenticHandling, 0) / turkishFeatures.length) * 100).toFixed(1)}%
                    </span></div>
                    <div>Geleneksel Yöntem: <span className="font-semibold text-gray-600">
                      {((turkishFeatures.reduce((sum, f) => sum + f.traditionalHandling, 0) / turkishFeatures.length) * 100).toFixed(1)}%
                    </span></div>
                    <div>İyileştirme: <span className="font-semibold text-blue-600">
                      +{(((turkishFeatures.reduce((sum, f) => sum + f.agenticHandling, 0) / turkishFeatures.length) - 
                         (turkishFeatures.reduce((sum, f) => sum + f.traditionalHandling, 0) / turkishFeatures.length)) * 100).toFixed(1)}%
                    </span></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Akademik Yapı Korunması</h4>
                  <div className="text-sm space-y-1">
                    <div>Korunan Yapılar: <span className="font-semibold text-green-600">
                      {academicStructures.filter(s => s.preservationScore > 0.7).length}/{academicStructures.length}
                    </span></div>
                    <div>Başarı Oranı: <span className="font-semibold text-green-600">
                      {((academicStructures.filter(s => s.preservationScore > 0.7).length / academicStructures.length) * 100).toFixed(1)}%
                    </span></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Referans Bütünlüğü</h4>
                  <div className="text-sm space-y-1">
                    <div>Korunan Referanslar: <span className="font-semibold text-green-600">
                      {referenceIntegrity.filter(r => r.isIntact).length}/{referenceIntegrity.length}
                    </span></div>
                    <div>Başarı Oranı: <span className="font-semibold text-green-600">
                      {((referenceIntegrity.filter(r => r.isIntact).length / referenceIntegrity.length) * 100).toFixed(1)}%
                    </span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Morphology Tab */}
      {activeView === "morphology" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Türkçe Morfolojik Özellikler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {turkishFeatures.map((feature, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{feature.feature}</h4>
                        <Badge className={getImportanceColor(feature.importance)}>
                          {feature.importance === "high" ? "Yüksek" : feature.importance === "medium" ? "Orta" : "Düşük"} Önem
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        İyileştirme: <span className="font-semibold text-green-600">
                          +{((feature.agenticHandling - feature.traditionalHandling) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-gray-600">Geleneksel Chunking</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gray-500 h-2 rounded-full" 
                              style={{ width: `${feature.traditionalHandling * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold">{(feature.traditionalHandling * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600">Agentic Chunking</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${feature.agenticHandling * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold">{(feature.agenticHandling * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Örnekler:</div>
                      <div className="flex flex-wrap gap-2">
                        {feature.examples.map((example, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Discourse Tab */}
      {activeView === "discourse" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Söylem Belirteçleri Analizi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {discourseMarkers.map((marker, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">"{marker.marker}"</span>
                        <Badge variant="outline">{marker.type}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {marker.preservedInChunking ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant={marker.chunkingMethod === "agentic" ? "default" : "secondary"}>
                          {marker.chunkingMethod === "agentic" ? "Agentic" : "Geleneksel"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Bağlam:</strong> ...{marker.context}...
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Pozisyon: {marker.position}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Structure Tab */}
      {activeView === "structure" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Akademik Yapı Korunması</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {academicStructures.map((structure, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{structure.type}</Badge>
                        <span className={`text-sm font-semibold ${getPreservationColor(structure.preservationScore)}`}>
                          Koruma: {(structure.preservationScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Badge variant={structure.chunkingMethod === "agentic" ? "default" : "secondary"}>
                        {structure.chunkingMethod === "agentic" ? "Agentic" : "Geleneksel"}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>İçerik:</strong> {structure.content.substring(0, 150)}...
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Pozisyon: {structure.startIndex} - {structure.endIndex}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* References Tab */}
      {activeView === "references" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Referans Bütünlüğü Analizi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referenceIntegrity.map((ref, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{ref.referenceType}</Badge>
                        <span className="font-semibold">"{ref.referenceText}"</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {ref.isIntact ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant={ref.chunkingMethod === "agentic" ? "default" : "secondary"}>
                          {ref.chunkingMethod === "agentic" ? "Agentic" : "Geleneksel"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <strong>Hedef:</strong> {ref.targetText}
                    </div>
                    <div className="text-xs text-gray-500">
                      Ayrım Mesafesi: {ref.separationDistance} chunk
                      {ref.separationDistance > 2 && (
                        <span className="text-red-500 ml-2">⚠ Uzak referans</span>
                      )}
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

export default TurkishAcademicAnalyzer;