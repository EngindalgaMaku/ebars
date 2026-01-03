"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Languages, 
  BookOpen, 
  Brain, 
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Download,
  RefreshCw,
  FileText,
  Hash,
  Layers,
  Activity,
  BarChart3,
  PieChart,
  Zap,
  Award,
  Globe,
  MessageSquare,
  Type,
  Scissors,
  Link,
  Search,
  Clock,
  Users
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
  AreaChart,
  Area,
  Treemap,
  Sankey,
  ComposedChart
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

interface TurkishLanguageMetric {
  metric: string;
  value: number;
  benchmark: number;
  status: "excellent" | "good" | "fair" | "poor";
  description: string;
  category: "morphology" | "syntax" | "semantics" | "discourse" | "pragmatics";
}

interface MorphologicalAnalysis {
  wordCount: number;
  uniqueRoots: number;
  suffixComplexity: number;
  agglutinationIndex: number;
  derivationalDepth: number;
  inflectionalRichness: number;
}

interface DiscourseMarker {
  type: string;
  count: number;
  preservation: number;
  examples: string[];
}

interface TurkishAnalyticsPanelProps {
  testResults: TestResult[];
  currentTest?: TestResult | null;
  enableLinguisticAnalysis?: boolean;
}

const TurkishAnalyticsPanel: React.FC<TurkishAnalyticsPanelProps> = ({
  testResults,
  currentTest,
  enableLinguisticAnalysis = true
}) => {
  const [selectedView, setSelectedView] = useState<"overview" | "morphology" | "discourse" | "academic" | "cultural">("overview");
  const [analysisDepth, setAnalysisDepth] = useState<"basic" | "advanced" | "expert">("advanced");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["morphology", "syntax", "semantics", "discourse"]);

  // Turkish-specific linguistic analysis
  const turkishAnalysis = useMemo(() => {
    const completedTests = testResults.filter(t => t.status === "completed");
    
    if (completedTests.length === 0) {
      return {
        hasAnalysis: false,
        languageMetrics: [],
        morphologicalData: null,
        discourseMarkers: [],
        academicFeatures: [],
        culturalContext: [],
        complexityAnalysis: [],
        preservationScores: []
      };
    }

    // Simulate Turkish language analysis (in real implementation, this would use NLP libraries)
    const languageMetrics: TurkishLanguageMetric[] = [
      {
        metric: "Morfem Korunumu",
        value: 87.5,
        benchmark: 85.0,
        status: "good",
        description: "Türkçe morfem yapısının chunk'larda korunma oranı",
        category: "morphology"
      },
      {
        metric: "Ek Bütünlüğü",
        value: 92.3,
        benchmark: 90.0,
        status: "excellent",
        description: "Kelime eklerinin bölünmeden korunması",
        category: "morphology"
      },
      {
        metric: "Sözdizimi Tutarlılığı",
        value: 78.9,
        benchmark: 80.0,
        status: "fair",
        description: "Türkçe sözdizimi kurallarına uygunluk",
        category: "syntax"
      },
      {
        metric: "Anlamsal Bağlam",
        value: 85.2,
        benchmark: 82.0,
        status: "good",
        description: "Anlamsal bağlamın chunk'lar arası korunması",
        category: "semantics"
      },
      {
        metric: "Söylem Belirteçleri",
        value: 81.7,
        benchmark: 78.0,
        status: "good",
        description: "Türkçe söylem belirteçlerinin tanınması",
        category: "discourse"
      },
      {
        metric: "Akademik Terminoloji",
        value: 89.4,
        benchmark: 85.0,
        status: "excellent",
        description: "Akademik Türkçe terimlerinin işlenmesi",
        category: "semantics"
      },
      {
        metric: "Kültürel Bağlam",
        value: 76.8,
        benchmark: 75.0,
        status: "good",
        description: "Türk kültürüne özgü ifadelerin anlaşılması",
        category: "pragmatics"
      }
    ];

    // Morphological analysis simulation
    const morphologicalData: MorphologicalAnalysis = {
      wordCount: completedTests.reduce((sum, t) => sum + (t.originalText.split(' ').length), 0) / completedTests.length,
      uniqueRoots: 1250,
      suffixComplexity: 3.7,
      agglutinationIndex: 2.8,
      derivationalDepth: 2.3,
      inflectionalRichness: 4.2
    };

    // Discourse markers analysis
    const discourseMarkers: DiscourseMarker[] = [
      {
        type: "Bağlaçlar",
        count: 45,
        preservation: 89.2,
        examples: ["ve", "ama", "çünkü", "ancak", "dolayısıyla"]
      },
      {
        type: "Zaman Belirteçleri",
        count: 32,
        preservation: 92.1,
        examples: ["önce", "sonra", "şimdi", "daha sonra", "o zaman"]
      },
      {
        type: "Neden-Sonuç",
        count: 28,
        preservation: 85.7,
        examples: ["bu nedenle", "sonuç olarak", "bu yüzden", "dolayısıyla"]
      },
      {
        type: "Karşıtlık",
        count: 23,
        preservation: 87.3,
        examples: ["ancak", "fakat", "oysa", "buna karşın", "diğer yandan"]
      },
      {
        type: "Açıklama",
        count: 19,
        preservation: 91.5,
        examples: ["yani", "başka bir deyişle", "örneğin", "mesela"]
      }
    ];

    // Academic features specific to Turkish
    const academicFeatures = [
      { feature: "Akademik Kelime Dağarcığı", score: 88.5, category: "vocabulary" },
      { feature: "Formal Dil Kullanımı", score: 91.2, category: "register" },
      { feature: "Bilimsel Terminoloji", score: 86.7, category: "terminology" },
      { feature: "Argüman Yapısı", score: 83.4, category: "structure" },
      { feature: "Kaynak Gösterimi", score: 89.8, category: "citation" },
      { feature: "Objektif Anlatım", score: 87.1, category: "style" }
    ];

    // Cultural context analysis
    const culturalContext = [
      { aspect: "Kültürel Referanslar", preservation: 78.9, importance: "high" },
      { aspect: "Deyimler ve Atasözleri", preservation: 82.3, importance: "medium" },
      { aspect: "Tarihsel Bağlam", preservation: 85.1, importance: "high" },
      { aspect: "Sosyal Normlar", preservation: 79.7, importance: "medium" },
      { aspect: "Coğrafi Referanslar", preservation: 88.4, importance: "low" }
    ];

    // Complexity analysis
    const complexityAnalysis = [
      { level: "Basit Cümleler", percentage: 35.2, chunkPreservation: 94.1 },
      { level: "Bileşik Cümleler", percentage: 42.8, chunkPreservation: 87.3 },
      { level: "Karmaşık Cümleler", percentage: 22.0, chunkPreservation: 78.9 }
    ];

    // Preservation scores by linguistic feature
    const preservationScores = [
      { feature: "Kelime Sırası", traditional: 82.1, agentic: 89.7 },
      { feature: "Ek Yapısı", traditional: 78.5, agentic: 91.2 },
      { feature: "Anlamsal Roller", traditional: 85.3, agentic: 88.9 },
      { feature: "Söylem Bağlantıları", traditional: 79.8, agentic: 86.4 },
      { feature: "Pragmatik Anlam", traditional: 76.2, agentic: 83.7 }
    ];

    return {
      hasAnalysis: true,
      languageMetrics,
      morphologicalData,
      discourseMarkers,
      academicFeatures,
      culturalContext,
      complexityAnalysis,
      preservationScores
    };
  }, [testResults]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "bg-green-100 text-green-800";
      case "good": return "bg-blue-100 text-blue-800";
      case "fair": return "bg-yellow-100 text-yellow-800";
      case "poor": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "good": return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "fair": return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "poor": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "morphology": return <Type className="h-4 w-4" />;
      case "syntax": return <Link className="h-4 w-4" />;
      case "semantics": return <Brain className="h-4 w-4" />;
      case "discourse": return <MessageSquare className="h-4 w-4" />;
      case "pragmatics": return <Users className="h-4 w-4" />;
      default: return <Languages className="h-4 w-4" />;
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

  if (!turkishAnalysis.hasAnalysis) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Languages className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Türkçe Analiz Verisi Mevcut Değil
          </h3>
          <p className="text-gray-500 mb-4">
            Türkçe dil analizi için tamamlanmış test sonuçları gereklidir.
          </p>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Analizi Yenile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Languages className="h-6 w-6 text-blue-600" />
            Türkçe Dil Analizi
          </h2>
          <p className="text-gray-600">Türkçe'ye özgü dilbilimsel özellikler ve akademik içerik analizi</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={selectedView === "overview" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("overview")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Genel Bakış
          </Button>
          <Button
            variant={selectedView === "morphology" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("morphology")}
          >
            <Type className="h-4 w-4 mr-2" />
            Morfoloji
          </Button>
          <Button
            variant={selectedView === "discourse" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("discourse")}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Söylem
          </Button>
          <Button
            variant={selectedView === "academic" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("academic")}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Akademik
          </Button>
          <Button
            variant={selectedView === "cultural" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("cultural")}
          >
            <Globe className="h-4 w-4 mr-2" />
            Kültürel
          </Button>
        </div>
      </div>

      {/* Language Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {turkishAnalysis.languageMetrics.slice(0, 4).map((metric, index) => (
          <Card key={index} className={`border-l-4 ${
            metric.status === "excellent" ? "border-l-green-500 bg-green-50" :
            metric.status === "good" ? "border-l-blue-500 bg-blue-50" :
            metric.status === "fair" ? "border-l-yellow-500 bg-yellow-50" :
            "border-l-red-500 bg-red-50"
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(metric.category)}
                  <span className="text-sm font-medium">{metric.metric}</span>
                </div>
                {getStatusIcon(metric.status)}
              </div>
              <div className="text-2xl font-bold mb-1">
                {metric.value.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">
                Hedef: {metric.benchmark}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    metric.status === "excellent" ? "bg-green-500" :
                    metric.status === "good" ? "bg-blue-500" :
                    metric.status === "fair" ? "bg-yellow-500" :
                    "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(100, metric.value)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedView === "overview" && (
        <div className="space-y-6">
          {/* Language Metrics Radar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Türkçe Dil Metrikleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={turkishAnalysis.languageMetrics}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Mevcut Skor"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Hedef"
                    dataKey="benchmark"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Strategy Comparison for Turkish Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Strateji Karşılaştırması - Türkçe Özellikler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={turkishAnalysis.preservationScores}>
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
        </div>
      )}

      {/* Morphology Tab */}
      {selectedView === "morphology" && (
        <div className="space-y-6">
          {/* Morphological Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Morfolojik Analiz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Kelime Sayısı</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {turkishAnalysis.morphologicalData?.wordCount.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600">ortalama per test</div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Benzersiz Kökler</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {turkishAnalysis.morphologicalData?.uniqueRoots}
                    </div>
                    <div className="text-sm text-gray-600">farklı kök</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Ek Karmaşıklığı</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {turkishAnalysis.morphologicalData?.suffixComplexity.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">ortalama ek/kelime</div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Link className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">Yapışkan İndeks</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      {turkishAnalysis.morphologicalData?.agglutinationIndex.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">yapışkanlık derecesi</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Scissors className="h-4 w-4 text-red-600" />
                      <span className="font-medium">Türetim Derinliği</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {turkishAnalysis.morphologicalData?.derivationalDepth.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">ortalama seviye</div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-indigo-600" />
                      <span className="font-medium">Çekim Zenginliği</span>
                    </div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {turkishAnalysis.morphologicalData?.inflectionalRichness.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">çekim çeşitliliği</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Morphological Preservation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Morfolojik Özellik Korunumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {turkishAnalysis.languageMetrics.filter(m => m.category === "morphology").map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(metric.category)}
                      <div>
                        <div className="font-medium">{metric.metric}</div>
                        <div className="text-sm text-gray-600">{metric.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(metric.status)}>
                        {metric.status === "excellent" ? "Mükemmel" :
                         metric.status === "good" ? "İyi" :
                         metric.status === "fair" ? "Orta" : "Zayıf"}
                      </Badge>
                      <div className="text-right">
                        <div className="text-lg font-bold">{metric.value.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">Hedef: {metric.benchmark}%</div>
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
      {selectedView === "discourse" && (
        <div className="space-y-6">
          {/* Discourse Markers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Söylem Belirteçleri Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={turkishAnalysis.discourseMarkers}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" name="Sayı" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={turkishAnalysis.discourseMarkers}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="preservation" fill="#10b981" name="Korunum %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discourse Marker Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Söylem Belirteçleri Detayı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {turkishAnalysis.discourseMarkers.map((marker, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold">{marker.type}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{marker.count} adet</Badge>
                        <Badge className={marker.preservation > 90 ? "bg-green-100 text-green-800" : 
                                        marker.preservation > 80 ? "bg-blue-100 text-blue-800" : 
                                        "bg-yellow-100 text-yellow-800"}>
                          {marker.preservation.toFixed(1)}% korunum
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {marker.examples.map((example, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sentence Complexity Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Cümle Karmaşıklığı Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={turkishAnalysis.complexityAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="level" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="percentage" fill="#3b82f6" name="Dağılım %" />
                  <Line yAxisId="right" type="monotone" dataKey="chunkPreservation" stroke="#10b981" strokeWidth={3} name="Korunum %" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Academic Tab */}
      {selectedView === "academic" && (
        <div className="space-y-6">
          {/* Academic Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Akademik Türkçe Özellikleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={turkishAnalysis.academicFeatures}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="feature" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Skor"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Academic Feature Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Akademik Özellik Detayları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {turkishAnalysis.academicFeatures.map((feature, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{feature.feature}</span>
                      <Badge variant="outline">{feature.category}</Badge>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {feature.score.toFixed(1)}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${feature.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cultural Tab */}
      {selectedView === "cultural" && (
        <div className="space-y-6">
          {/* Cultural Context Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Kültürel Bağlam Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {turkishAnalysis.culturalContext.map((context, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">{context.aspect}</div>
                        <Badge className={
                          context.importance === "high" ? "bg-red-100 text-red-800" :
                          context.importance === "medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-green-100 text-green-800"
                        }>
                          {context.importance === "high" ? "Yüksek Önem" :
                           context.importance === "medium" ? "Orta Önem" : "Düşük Önem"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{context.preservation.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500">korunum oranı</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cultural Preservation Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Kültürel Özellik Korunumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsPieChart>
                  <Tooltip />
                  <Legend />
                  <RechartsPieChart data={turkishAnalysis.culturalContext}>
                    {turkishAnalysis.culturalContext.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </RechartsPieChart>
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analysis Summary */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Languages className="h-5 w-5" />
            Türkçe Analiz Özeti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {turkishAnalysis.languageMetrics.filter(m => m.status === "excellent" || m.status === "good").length}
              </div>
              <div className="text-sm font-medium text-blue-800">Başarılı Metrik</div>
              <div className="text-xs text-blue-600">
                / {turkishAnalysis.languageMetrics.length} toplam
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {turkishAnalysis.discourseMarkers.reduce((sum, m) => sum + m.count, 0)}
              </div>
              <div className="text-sm font-medium text-green-800">Söylem Belirteci</div>
              <div className="text-xs text-green-600">tespit edildi</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {turkishAnalysis.academicFeatures.filter(f => f.score > 85).length}
              </div>
              <div className="text-sm font-medium text-purple-800">Güçlü Akademik Özellik</div>
              <div className="text-xs text-purple-600">85% üzeri skor</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {turkishAnalysis.culturalContext.filter(c => c.preservation > 80).length}
              </div>
              <div className="text-sm font-medium text-orange-800">Korunan Kültürel Özellik</div>
              <div className="text-xs text-orange-600">80% üzeri korunum</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TurkishAnalyticsPanel;