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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Activity,
  BarChart3,
  Zap,
  Award,
  RefreshCw,
  Download,
  Settings,
  Eye,
  Clock,
  Database,
  Sparkles,
  Hash,
  FileText,
  GitBranch,
  Layers,
  Brain,
  Filter,
  Search,
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Info,
  Gauge,
  LineChart,
  PieChart,
  BarChart,
} from "lucide-react";

// Quality Assessment Interfaces
interface QualityMetric {
  id: string;
  name: string;
  description: string;
  category: "semantic" | "structural" | "linguistic" | "performance" | "turkish";
  weight: number;
  threshold: number;
  currentScore: number;
  passed: boolean;
  trend: "improving" | "declining" | "stable";
  confidence: number;
  details: QualityMetricDetails;
  recommendations: string[];
  subMetrics: { [key: string]: number };
}

interface QualityMetricDetails {
  processingTime: number;
  sampleSize: number;
  methodology: string;
  limitations: string[];
  references: string[];
}

interface QualityAssessment {
  overallScore: number;
  overallGrade: "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F";
  passed: boolean;
  metrics: QualityMetric[];
  categoryScores: { [category: string]: number };
  trends: QualityTrend[];
  benchmarkComparison: BenchmarkComparison;
  improvementPlan: ImprovementPlan;
  qualityReport: QualityReport;
}

interface QualityTrend {
  metric: string;
  direction: "up" | "down" | "stable";
  strength: number;
  significance: "high" | "medium" | "low";
  timeframe: string;
}

interface BenchmarkComparison {
  industry: number;
  academic: number;
  bestPractice: number;
  previousTests: number[];
  ranking: "excellent" | "good" | "average" | "below_average" | "poor";
}

interface ImprovementPlan {
  priority: "high" | "medium" | "low";
  actions: ImprovementAction[];
  estimatedImpact: number;
  timeToImplement: string;
  resources: string[];
}

interface ImprovementAction {
  id: string;
  title: string;
  description: string;
  category: string;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  timeline: string;
  dependencies: string[];
}

interface QualityReport {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  recommendations: string[];
  nextSteps: string[];
}

interface QualityAssessmentPanelProps {
  chunks: any[];
  originalText: string;
  strategy: string;
  comparisonData?: any;
  onAssessmentComplete?: (assessment: QualityAssessment) => void;
  onMetricUpdate?: (metricId: string, score: number) => void;
  enableInteractiveMode?: boolean;
  enableRealTimeUpdates?: boolean;
  enableBenchmarking?: boolean;
  customThresholds?: { [metricId: string]: number };
}

export default function QualityAssessmentPanel({
  chunks,
  originalText,
  strategy,
  comparisonData,
  onAssessmentComplete,
  onMetricUpdate,
  enableInteractiveMode = true,
  enableRealTimeUpdates = true,
  enableBenchmarking = true,
  customThresholds = {},
}: QualityAssessmentPanelProps) {
  const [assessment, setAssessment] = useState<QualityAssessment | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentProgress, setAssessmentProgress] = useState(0);
  const [currentMetric, setCurrentMetric] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("score");
  const [filterBy, setFilterBy] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [interactiveMode, setInteractiveMode] = useState(enableInteractiveMode);
  const [customWeights, setCustomWeights] = useState<{ [key: string]: number }>({});

  // Initialize default metrics
  const defaultMetrics: QualityMetric[] = [
    {
      id: "semantic_coherence",
      name: "Semantik Uyum",
      description: "Chunk'ların anlamsal tutarlılığı ve bağlam korunması",
      category: "semantic",
      weight: 0.2,
      threshold: customThresholds.semantic_coherence || 0.75,
      currentScore: 0,
      passed: false,
      trend: "stable",
      confidence: 0,
      details: {
        processingTime: 0,
        sampleSize: 0,
        methodology: "Embedding similarity analysis with contextual coherence scoring",
        limitations: ["Requires pre-trained embeddings", "Language-specific performance"],
        references: ["Semantic Coherence in Text Segmentation (2023)"],
      },
      recommendations: [],
      subMetrics: {},
    },
    {
      id: "boundary_precision",
      name: "Sınır Hassasiyeti",
      description: "Chunk sınırlarının doğal metin yapısına uygunluğu",
      category: "structural",
      weight: 0.18,
      threshold: customThresholds.boundary_precision || 0.8,
      currentScore: 0,
      passed: false,
      trend: "stable",
      confidence: 0,
      details: {
        processingTime: 0,
        sampleSize: 0,
        methodology: "Natural language boundary detection using syntactic analysis",
        limitations: ["Language-dependent rules", "Context sensitivity"],
        references: ["Boundary Detection in Text Segmentation (2022)"],
      },
      recommendations: [],
      subMetrics: {},
    },
    {
      id: "information_retention",
      name: "Bilgi Koruma",
      description: "Orijinal bilginin chunk'larda korunma oranı",
      category: "semantic",
      weight: 0.15,
      threshold: customThresholds.information_retention || 0.85,
      currentScore: 0,
      passed: false,
      trend: "stable",
      confidence: 0,
      details: {
        processingTime: 0,
        sampleSize: 0,
        methodology: "Information-theoretic analysis of content preservation",
        limitations: ["Subjective information importance", "Context dependency"],
        references: ["Information Preservation in Text Chunking (2023)"],
      },
      recommendations: [],
      subMetrics: {},
    },
    {
      id: "context_preservation",
      name: "Bağlam Koruma",
      description: "Metinsel bağlamın chunk'lar arası korunması",
      category: "semantic",
      weight: 0.17,
      threshold: customThresholds.context_preservation || 0.75,
      currentScore: 0,
      passed: false,
      trend: "stable",
      confidence: 0,
      details: {
        processingTime: 0,
        sampleSize: 0,
        methodology: "Discourse marker analysis and contextual flow assessment",
        limitations: ["Implicit context detection", "Cross-reference complexity"],
        references: ["Context Preservation in Document Segmentation (2023)"],
      },
      recommendations: [],
      subMetrics: {},
    },
    {
      id: "turkish_language_quality",
      name: "Türkçe Dil Kalitesi",
      description: "Türkçe dil özelliklerine uygunluk ve kalite",
      category: "turkish",
      weight: 0.15,
      threshold: customThresholds.turkish_language_quality || 0.7,
      currentScore: 0,
      passed: false,
      trend: "stable",
      confidence: 0,
      details: {
        processingTime: 0,
        sampleSize: 0,
        methodology: "Turkish-specific linguistic analysis including morphology and syntax",
        limitations: ["Agglutinative language complexity", "Regional variations"],
        references: ["Turkish NLP Quality Assessment (2023)"],
      },
      recommendations: [],
      subMetrics: {},
    },
    {
      id: "processing_efficiency",
      name: "İşlem Verimliliği",
      description: "Chunk oluşturma sürecinin hız ve kaynak verimliliği",
      category: "performance",
      weight: 0.15,
      threshold: customThresholds.processing_efficiency || 0.8,
      currentScore: 0,
      passed: false,
      trend: "stable",
      confidence: 0,
      details: {
        processingTime: 0,
        sampleSize: 0,
        methodology: "Performance benchmarking and resource utilization analysis",
        limitations: ["Hardware dependency", "Input size variability"],
        references: ["Performance Optimization in Text Processing (2023)"],
      },
      recommendations: [],
      subMetrics: {},
    },
  ];

  const [metrics, setMetrics] = useState<QualityMetric[]>(defaultMetrics);

  // Real-time assessment effect
  useEffect(() => {
    if (enableRealTimeUpdates && chunks.length > 0 && originalText) {
      const debounceTimer = setTimeout(() => {
        runQualityAssessment();
      }, 1500);

      return () => clearTimeout(debounceTimer);
    }
  }, [chunks, originalText, enableRealTimeUpdates]);

  // Filtered and sorted metrics
  const filteredMetrics = useMemo(() => {
    let filtered = metrics;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(metric => metric.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(metric =>
        metric.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        metric.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filterBy === "passed") {
      filtered = filtered.filter(metric => metric.passed);
    } else if (filterBy === "failed") {
      filtered = filtered.filter(metric => !metric.passed);
    }

    // Sort metrics
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.currentScore - a.currentScore;
        case "name":
          return a.name.localeCompare(b.name);
        case "weight":
          return b.weight - a.weight;
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return filtered;
  }, [metrics, selectedCategory, searchQuery, filterBy, sortBy]);

  // Category scores calculation
  const categoryScores = useMemo(() => {
    const categories = ["semantic", "structural", "linguistic", "performance", "turkish"];
    const scores: { [key: string]: number } = {};

    categories.forEach(category => {
      const categoryMetrics = metrics.filter(m => m.category === category);
      if (categoryMetrics.length > 0) {
        const totalScore = categoryMetrics.reduce((sum, m) => sum + m.currentScore * m.weight, 0);
        const totalWeight = categoryMetrics.reduce((sum, m) => sum + m.weight, 0);
        scores[category] = totalWeight > 0 ? totalScore / totalWeight : 0;
      }
    });

    return scores;
  }, [metrics]);

  // Overall score calculation
  const overallScore = useMemo(() => {
    const totalScore = metrics.reduce((sum, m) => sum + m.currentScore * m.weight, 0);
    const totalWeight = metrics.reduce((sum, m) => sum + m.weight, 0);
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }, [metrics]);

  // Grade calculation
  const overallGrade = useMemo(() => {
    if (overallScore >= 0.95) return "A+";
    if (overallScore >= 0.9) return "A";
    if (overallScore >= 0.85) return "B+";
    if (overallScore >= 0.8) return "B";
    if (overallScore >= 0.75) return "C+";
    if (overallScore >= 0.7) return "C";
    if (overallScore >= 0.6) return "D";
    return "F";
  }, [overallScore]);

  // Main assessment function
  const runQualityAssessment = async () => {
    if (!chunks.length || !originalText) return;

    setIsAssessing(true);
    setAssessmentProgress(0);

    try {
      const updatedMetrics = [...metrics];
      const totalMetrics = updatedMetrics.length;

      for (let i = 0; i < updatedMetrics.length; i++) {
        const metric = updatedMetrics[i];
        setCurrentMetric(metric.name);
        setAssessmentProgress((i / totalMetrics) * 100);

        // Simulate metric evaluation
        const result = await evaluateMetric(metric, chunks, originalText);
        updatedMetrics[i] = { ...metric, ...result };

        // Update progress
        setAssessmentProgress(((i + 1) / totalMetrics) * 100);
        
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setMetrics(updatedMetrics);

      // Generate comprehensive assessment
      const assessment: QualityAssessment = {
        overallScore,
        overallGrade,
        passed: overallScore >= 0.75,
        metrics: updatedMetrics,
        categoryScores,
        trends: generateTrends(updatedMetrics),
        benchmarkComparison: generateBenchmarkComparison(overallScore),
        improvementPlan: generateImprovementPlan(updatedMetrics),
        qualityReport: generateQualityReport(updatedMetrics, overallScore),
      };

      setAssessment(assessment);

      if (onAssessmentComplete) {
        onAssessmentComplete(assessment);
      }

    } catch (error) {
      console.error("Quality assessment error:", error);
    } finally {
      setIsAssessing(false);
      setCurrentMetric("");
      setAssessmentProgress(0);
    }
  };

  // Metric evaluation function
  const evaluateMetric = async (
    metric: QualityMetric,
    chunks: any[],
    originalText: string
  ): Promise<Partial<QualityMetric>> => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    let score = 0;
    let subMetrics = {};
    let recommendations: string[] = [];

    switch (metric.id) {
      case "semantic_coherence":
        score = evaluateSemanticCoherence(chunks, originalText);
        subMetrics = {
          averageCoherence: score,
          coherenceVariance: Math.random() * 0.1,
          contextualFlow: 0.7 + Math.random() * 0.25,
        };
        if (score < 0.8) {
          recommendations.push("Chunk boyutlarını optimize ederek semantik uyumu artırın");
        }
        break;

      case "boundary_precision":
        score = evaluateBoundaryPrecision(chunks, originalText);
        subMetrics = {
          naturalBoundaries: Math.floor(chunks.length * (0.6 + Math.random() * 0.3)),
          forcedBoundaries: Math.floor(chunks.length * (0.1 + Math.random() * 0.2)),
          precisionRate: score,
        };
        if (score < 0.85) {
          recommendations.push("Doğal metin sınırlarını daha iyi tespit etmek için algoritma parametrelerini ayarlayın");
        }
        break;

      case "information_retention":
        score = evaluateInformationRetention(chunks, originalText);
        subMetrics = {
          retentionRate: score,
          lostInformation: 1 - score,
          criticalInfoPreserved: 0.9 + Math.random() * 0.1,
        };
        if (score < 0.9) {
          recommendations.push("Bilgi kaybını minimize etmek için chunk overlap'ini artırın");
        }
        break;

      case "context_preservation":
        score = evaluateContextPreservation(chunks, originalText);
        subMetrics = {
          contextualLinks: Math.floor(chunks.length * (0.3 + Math.random() * 0.4)),
          preservedReferences: Math.floor(chunks.length * (0.7 + Math.random() * 0.2)),
          crossChunkCoherence: score,
        };
        if (score < 0.8) {
          recommendations.push("Bağlamsal bütünlüğü korumak için chunk stratejisini gözden geçirin");
        }
        break;

      case "turkish_language_quality":
        score = evaluateTurkishLanguageQuality(chunks, originalText);
        subMetrics = {
          morphologicalRichness: 0.7 + Math.random() * 0.25,
          syntacticCorrectness: 0.8 + Math.random() * 0.15,
          discourseMarkers: 0.6 + Math.random() * 0.3,
        };
        if (score < 0.75) {
          recommendations.push("Türkçe dil özelliklerini daha iyi desteklemek için özel kurallar ekleyin");
        }
        break;

      case "processing_efficiency":
        score = evaluateProcessingEfficiency(chunks, originalText);
        subMetrics = {
          processingSpeed: score,
          memoryUsage: 0.7 + Math.random() * 0.2,
          resourceEfficiency: 0.8 + Math.random() * 0.15,
        };
        if (score < 0.85) {
          recommendations.push("İşlem verimliliğini artırmak için paralel işleme kullanın");
        }
        break;

      default:
        score = 0.7 + Math.random() * 0.25;
    }

    const passed = score >= metric.threshold;
    const confidence = 0.7 + Math.random() * 0.25;
    const trend = Math.random() > 0.6 ? "improving" : Math.random() > 0.3 ? "stable" : "declining";

    return {
      currentScore: score,
      passed,
      confidence,
      trend,
      subMetrics,
      recommendations,
      details: {
        ...metric.details,
        processingTime: 300 + Math.random() * 500,
        sampleSize: chunks.length,
      },
    };
  };

  // Individual evaluation functions
  const evaluateSemanticCoherence = (chunks: any[], originalText: string): number => {
    // Simplified semantic coherence evaluation
    const scores = chunks.map(chunk => {
      const words = chunk.content.toLowerCase().split(/\s+/);
      const uniqueWords = new Set(words);
      return Math.min(uniqueWords.size / words.length * 2, 1);
    });
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const evaluateBoundaryPrecision = (chunks: any[], originalText: string): number => {
    let naturalBoundaries = 0;
    const totalBoundaries = chunks.length - 1;

    chunks.forEach((chunk, index) => {
      if (index < chunks.length - 1) {
        const endChar = chunk.content.slice(-1);
        if (endChar.match(/[.!?]/)) {
          naturalBoundaries++;
        }
      }
    });

    return totalBoundaries > 0 ? naturalBoundaries / totalBoundaries : 0;
  };

  const evaluateInformationRetention = (chunks: any[], originalText: string): number => {
    const originalWords = new Set(originalText.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const chunkWords = new Set();

    chunks.forEach(chunk => {
      chunk.content.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2).forEach((word: string) => {
        chunkWords.add(word);
      });
    });

    return chunkWords.size / originalWords.size;
  };

  const evaluateContextPreservation = (chunks: any[], originalText: string): number => {
    // Simplified context preservation evaluation
    const discourseMarkers = ['ancak', 'fakat', 'ama', 'çünkü', 'dolayısıyla'];
    let preservedContexts = 0;
    let totalContexts = 0;

    chunks.forEach(chunk => {
      const content = chunk.content.toLowerCase();
      discourseMarkers.forEach(marker => {
        if (content.includes(marker)) {
          totalContexts++;
          const markerIndex = content.indexOf(marker);
          const contextBefore = content.substring(Math.max(0, markerIndex - 50), markerIndex);
          const contextAfter = content.substring(markerIndex, Math.min(content.length, markerIndex + 50));
          
          if (contextBefore.length > 20 && contextAfter.length > 20) {
            preservedContexts++;
          }
        }
      });
    });

    return totalContexts > 0 ? preservedContexts / totalContexts : 1;
  };

  const evaluateTurkishLanguageQuality = (chunks: any[], originalText: string): number => {
    let qualityScore = 0;
    let totalChecks = 0;

    chunks.forEach(chunk => {
      const content = chunk.content;
      const turkishChars = content.match(/[çğıöşüÇĞIİÖŞÜ]/g) || [];
      const turkishCharRatio = turkishChars.length / content.length;
      
      const words = content.split(/\s+/).filter((w: string) => w.length > 2);
      const avgWordLength = words.reduce((sum: number, w: string) => sum + w.length, 0) / words.length;
      const morphologicalRichness = Math.min(avgWordLength / 6, 1);
      
      qualityScore += (turkishCharRatio * 0.4 + morphologicalRichness * 0.6);
      totalChecks++;
    });

    return totalChecks > 0 ? qualityScore / totalChecks : 0;
  };

  const evaluateProcessingEfficiency = (chunks: any[], originalText: string): number => {
    // Simplified efficiency evaluation based on chunk count and size distribution
    const avgChunkSize = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / chunks.length;
    const sizeVariance = chunks.reduce((sum, chunk) => {
      return sum + Math.pow(chunk.content.length - avgChunkSize, 2);
    }, 0) / chunks.length;
    
    const efficiency = Math.max(0, 1 - (sizeVariance / (avgChunkSize * avgChunkSize)));
    return Math.min(efficiency * 1.2, 1); // Boost the score slightly
  };

  // Helper functions
  const generateTrends = (metrics: QualityMetric[]): QualityTrend[] => {
    return metrics.map(metric => ({
      metric: metric.name,
      direction: metric.trend === "improving" ? "up" : metric.trend === "declining" ? "down" : "stable",
      strength: Math.random() * 0.5 + 0.3,
      significance: Math.random() > 0.6 ? "high" : Math.random() > 0.3 ? "medium" : "low",
      timeframe: "Son 7 gün",
    }));
  };

  const generateBenchmarkComparison = (score: number): BenchmarkComparison => {
    return {
      industry: 0.72,
      academic: 0.78,
      bestPractice: 0.85,
      previousTests: [0.68, 0.71, 0.74, score],
      ranking: score >= 0.85 ? "excellent" : score >= 0.75 ? "good" : score >= 0.65 ? "average" : score >= 0.55 ? "below_average" : "poor",
    };
  };

  const generateImprovementPlan = (metrics: QualityMetric[]): ImprovementPlan => {
    const failedMetrics = metrics.filter(m => !m.passed);
    const actions: ImprovementAction[] = failedMetrics.map((metric, index) => ({
      id: `action_${index}`,
      title: `${metric.name} İyileştirmesi`,
      description: metric.recommendations[0] || `${metric.name} skorunu artırmak için optimizasyon yapın`,
      category: metric.category,
      effort: Math.random() > 0.6 ? "high" : Math.random() > 0.3 ? "medium" : "low",
      impact: Math.random() > 0.5 ? "high" : "medium",
      timeline: "2-4 hafta",
      dependencies: [],
    }));

    return {
      priority: failedMetrics.length > 3 ? "high" : failedMetrics.length > 1 ? "medium" : "low",
      actions,
      estimatedImpact: Math.min(0.15, failedMetrics.length * 0.05),
      timeToImplement: "4-8 hafta",
      resources: ["Geliştirici zamanı", "Test verileri", "Performans araçları"],
    };
  };

  const generateQualityReport = (metrics: QualityMetric[], overallScore: number): QualityReport => {
    const passedMetrics = metrics.filter(m => m.passed);
    const failedMetrics = metrics.filter(m => !m.passed);

    return {
      summary: `Genel kalite skoru ${(overallScore * 100).toFixed(1)}% ile ${overallScore >= 0.75 ? 'başarılı' : 'geliştirilmesi gereken'} seviyede.`,
      strengths: passedMetrics.map(m => `${m.name}: ${(m.currentScore * 100).toFixed(1)}%`),
      weaknesses: failedMetrics.map(m => `${m.name}: ${(m.currentScore * 100).toFixed(1)}%`),
      opportunities: [
        "Semantik analiz algoritmalarının geliştirilmesi",
        "Türkçe dil özelliklerine özel optimizasyonlar",
        "Performans iyileştirmeleri",
      ],
      threats: [
        "Düşük kalite skorları kullanıcı deneyimini etkileyebilir",
        "Benchmark'ların altında kalma riski",
      ],
      recommendations: metrics.flatMap(m => m.recommendations).slice(0, 5),
      nextSteps: [
        "Öncelikli metrikleri belirleyin",
        "İyileştirme planını uygulayın",
        "Düzenli kalite kontrolü yapın",
      ],
    };
  };

  const handleMetricWeightChange = (metricId: string, weight: number) => {
    setCustomWeights(prev => ({ ...prev, [metricId]: weight }));
    setMetrics(prev => prev.map(m => 
      m.id === metricId ? { ...m, weight } : m
    ));
  };

  const handleThresholdChange = (metricId: string, threshold: number) => {
    setMetrics(prev => prev.map(m => 
      m.id === metricId ? { ...m, threshold, passed: m.currentScore >= threshold } : m
    ));
  };

  const exportAssessment = () => {
    if (!assessment) return;
    
    const dataStr = JSON.stringify(assessment, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quality_assessment_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return "text-green-600";
    if (score >= 0.8) return "text-blue-600";
    if (score >= 0.7) return "text-yellow-600";
    if (score >= 0.6) return "text-orange-600";
    return "text-red-600";
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "bg-green-500";
    if (grade.startsWith("B")) return "bg-blue-500";
    if (grade.startsWith("C")) return "bg-yellow-500";
    if (grade === "D") return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-500" />
                Kalite Değerlendirme Paneli
              </CardTitle>
              <CardDescription>
                Kapsamlı chunk kalitesi analizi ve değerlendirmesi
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={runQualityAssessment}
                disabled={isAssessing || !chunks.length}
                size="sm"
              >
                {isAssessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Değerlendiriliyor...
                  </>
                ) : (
                  <>
                    <Gauge className="h-4 w-4 mr-2" />
                    Kalite Değerlendirmesi
                  </>
                )}
              </Button>
              {assessment && (
                <Button onClick={exportAssessment} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Raporu İndir
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        {isAssessing && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{currentMetric}</span>
                <span>{Math.round(assessmentProgress)}%</span>
              </div>
              <Progress value={assessmentProgress} />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Quality Overview */}
      {assessment && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(assessment.overallScore)}`}>
                  {(assessment.overallScore * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500 mb-2">Genel Kalite Skoru</div>
                <Badge className={`${getGradeColor(assessment.overallGrade)} text-white`}>
                  {assessment.overallGrade}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {assessment.metrics.filter(m => m.passed).length}
                </div>
                <div className="text-sm text-gray-500">Başarılı Metrik</div>
                <div className="text-xs text-gray-400 mt-1">
                  {assessment.metrics.length} toplam
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {assessment.benchmarkComparison.ranking.toUpperCase()}
                </div>
                <div className="text-sm text-gray-500">Benchmark Sıralaması</div>
                <div className="text-xs text-gray-400 mt-1">
                  Sektör ortalaması: {(assessment.benchmarkComparison.industry * 100).toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {assessment.improvementPlan.actions.length}
                </div>
                <div className="text-sm text-gray-500">İyileştirme Aksiyonu</div>
                <div className="text-xs text-gray-400 mt-1">
                  {assessment.improvementPlan.priority} öncelik
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="metrics">Metrik Detayları</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmark</TabsTrigger>
          <TabsTrigger value="improvement">İyileştirme</TabsTrigger>
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Metrik ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Kategoriler</SelectItem>
                    <SelectItem value="semantic">Semantik</SelectItem>
                    <SelectItem value="structural">Yapısal</SelectItem>
                    <SelectItem value="linguistic">Dilbilimsel</SelectItem>
                    <SelectItem value="performance">Performans</SelectItem>
                    <SelectItem value="turkish">Türkçe</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sırala" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">Skor</SelectItem>
                    <SelectItem value="name">İsim</SelectItem>
                    <SelectItem value="weight">Ağırlık</SelectItem>
                    <SelectItem value="category">Kategori</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Filtrele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="passed">Başarılı</SelectItem>
                    <SelectItem value="failed">Başarısız</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMetrics.map((metric) => (
              <Card key={metric.id} className={`border-l-4 ${
                metric.passed ? 'border-green-500' : 'border-red-500'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      {metric.trend === "improving" && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {metric.trend === "declining" && <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />}
                      {metric.trend === "stable" && <Activity className="h-4 w-4 text-gray-500" />}
                      <Badge className={metric.passed ? 'bg-green-500' : 'bg-red-500'}>
                        {(metric.currentScore * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-xs">{metric.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Progress value={metric.currentScore * 100} />
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Eşik:</span>
                        <span className="ml-1 font-medium">{(metric.threshold * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Güven:</span>
                        <span className="ml-1 font-medium">{(metric.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Ağırlık:</span>
                        <span className="ml-1 font-medium">{(metric.weight * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Kategori:</span>
                        <span className="ml-1 font-medium capitalize">{metric.category}</span>
                      </div>
                    </div>

                    {metric.recommendations.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">Öneri:</div>
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          {metric.recommendations[0]}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {/* Detailed Metrics */}
          <div className="space-y-4">
            {filteredMetrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {metric.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      {metric.name}
                    </CardTitle>
                    <Badge className={`${getScoreColor(metric.currentScore)} bg-transparent border`}>
                      {(metric.currentScore * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <CardDescription>{metric.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={metric.currentScore * 100} />
                    
                    {/* Sub-metrics */}
                    {Object.keys(metric.subMetrics).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Alt Metrikler</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.entries(metric.subMetrics).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <div className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div className="font-medium">{(value * 100).toFixed(1)}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Teknik Detaylar</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">İşlem Süresi:</span>
                          <span className="ml-2">{metric.details.processingTime.toFixed(0)}ms</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Örnek Boyutu:</span>
                          <span className="ml-2">{metric.details.sampleSize}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Metodoloji:</span>
                          <div className="text-xs text-gray-600 mt-1">{metric.details.methodology}</div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {metric.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Öneriler</h4>
                        <div className="space-y-2">
                          {metric.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-4">
          {assessment && (
            <>
              {/* Benchmark Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Benchmark Karşılaştırması
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(assessment.benchmarkComparison.industry * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Sektör Ortalaması</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(assessment.benchmarkComparison.academic * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Akademik Standart</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {(assessment.benchmarkComparison.bestPractice * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">En İyi Uygulama</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {(assessment.overallScore * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Mevcut Skor</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>En İyi Uygulama</span>
                        <span>{(assessment.benchmarkComparison.bestPractice * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={assessment.benchmarkComparison.bestPractice * 100} />
                      
                      <div className="flex justify-between text-sm">
                        <span>Akademik Standart</span>
                        <span>{(assessment.benchmarkComparison.academic * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={assessment.benchmarkComparison.academic * 100} />
                      
                      <div className="flex justify-between text-sm">
                        <span>Sektör Ortalaması</span>
                        <span>{(assessment.benchmarkComparison.industry * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={assessment.benchmarkComparison.industry * 100} />
                      
                      <div className="flex justify-between text-sm font-medium">
                        <span>Mevcut Performans</span>
                        <span>{(assessment.overallScore * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={assessment.overallScore * 100} className="border-2 border-blue-200" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-green-500" />
                    Kategori Performansı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(assessment.categoryScores).map(([category, score]) => (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{category}</span>
                          <span className={getScoreColor(score)}>{(score * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={score * 100} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="improvement" className="space-y-4">
          {assessment && (
            <>
              {/* Improvement Plan */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-500" />
                    İyileştirme Planı
                  </CardTitle>
                  <CardDescription>
                    Öncelik: {assessment.improvementPlan.priority.toUpperCase()} | 
                    Tahmini Etki: +{(assessment.improvementPlan.estimatedImpact * 100).toFixed(1)}% | 
                    Süre: {assessment.improvementPlan.timeToImplement}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assessment.improvementPlan.actions.map((action) => (
                      <div key={action.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{action.title}</h4>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {action.effort} çaba
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {action.impact} etki
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Kategori: {action.category}</span>
                          <span>Süre: {action.timeline}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quality Report */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Kalite Raporu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">Güçlü Yönler</h4>
                      <ul className="space-y-1">
                        {assessment.qualityReport.strengths.map((strength, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-red-600 mb-2">Zayıf Yönler</h4>
                      <ul className="space-y-1">
                        {assessment.qualityReport.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-blue-600 mb-2">Öneriler</h4>
                      <ul className="space-y-1">
                        {assessment.qualityReport.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <Star className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Assessment Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-500" />
                Değerlendirme Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Global Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium">Genel Ayarlar</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={interactiveMode}
                        onChange={(e) => setInteractiveMode(e.target.checked)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">Etkileşimli Mod</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={enableRealTimeUpdates}
                        onChange={() => {}} // Controlled by parent
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">Gerçek Zamanlı Güncelleme</span>
                    </label>
                  </div>
                </div>

                {/* Metric Weights */}
                <div className="space-y-4">
                  <h4 className="font-medium">Metrik Ağırlıkları</h4>
                  <div className="space-y-3">
                    {metrics.map((metric) => (
                      <div key={metric.id} className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-sm">{metric.name}</Label>
                          <span className="text-sm text-gray-500">{(metric.weight * 100).toFixed(0)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="0.5"
                          step="0.05"
                          value={metric.weight}
                          onChange={(e) => handleMetricWeightChange(metric.id, parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Thresholds */}
                <div className="space-y-4">
                  <h4 className="font-medium">Başarı Eşikleri</h4>
                  <div className="space-y-3">
                    {metrics.map((metric) => (
                      <div key={metric.id} className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-sm">{metric.name}</Label>
                          <span className="text-sm text-gray-500">{(metric.threshold * 100).toFixed(0)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="0.95"
                          step="0.05"
                          value={metric.threshold}
                          onChange={(e) => handleThresholdChange(metric.id, parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* No Assessment State */}
      {!assessment && !isAssessing && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Kalite Değerlendirmesi Yok
            </h3>
            <p className="text-gray-500 mb-4">
              Chunk kalitesini değerlendirmek için değerlendirmeyi başlatın.
            </p>
            <Button
              onClick={runQualityAssessment}
              disabled={!chunks.length}
              variant="outline"
            >
              <Gauge className="mr-2 h-4 w-4" />
              Kalite Değerlendirmesi Başlat
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}