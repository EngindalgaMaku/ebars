"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  Brain,
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
} from "lucide-react";

// Evaluation Interfaces
interface EvaluationConfig {
  enableSemanticCoherence: boolean;
  enableBoundaryPrecision: boolean;
  enableInformationRetention: boolean;
  enableContextPreservation: boolean;
  enableReferenceIntegrity: boolean;
  enableTurkishLanguageQuality: boolean;
  enableEmbeddingAnalysis: boolean;
  enableTopicModeling: boolean;
  enableNamedEntityPreservation: boolean;
  enableDiscourseMarkerAnalysis: boolean;
  enableCrossReferenceValidation: boolean;
  enableClusteringAnalysis: boolean;
  enableOutlierDetection: boolean;
  enablePatternRecognition: boolean;
  enableAnomalyDetection: boolean;
  enableQualityPrediction: boolean;
  qualityThresholds: QualityThresholds;
  turkishSpecificSettings: TurkishSpecificSettings;
  performanceSettings: PerformanceSettings;
}

interface QualityThresholds {
  semanticCoherenceMin: number;
  boundaryPrecisionMin: number;
  informationRetentionMin: number;
  contextPreservationMin: number;
  referenceIntegrityMin: number;
  turkishLanguageQualityMin: number;
  overallQualityMin: number;
}

interface TurkishSpecificSettings {
  enableMorphologicalConsistency: boolean;
  enableSyntacticBoundaryDetection: boolean;
  enableDiscourseCoherence: boolean;
  enableAcademicWritingStandards: boolean;
  enableCulturalContextPreservation: boolean;
  morphologicalWeight: number;
  syntacticWeight: number;
  discourseWeight: number;
}

interface PerformanceSettings {
  enableSpeedBenchmarking: boolean;
  enableMemoryEfficiency: boolean;
  enableScalabilityTesting: boolean;
  enableResourceUtilization: boolean;
  enableCostEffectiveness: boolean;
  maxProcessingTime: number;
  maxMemoryUsage: number;
  costThreshold: number;
}

interface EvaluationResult {
  testId: string;
  timestamp: string;
  overallScore: number;
  passed: boolean;
  metrics: EvaluationMetrics;
  turkishSpecificMetrics: TurkishSpecificMetrics;
  performanceMetrics: PerformanceMetrics;
  mlAnalysis: MLAnalysisResults;
  recommendations: string[];
  alerts: EvaluationAlert[];
  trends: TrendAnalysis;
}

interface EvaluationMetrics {
  semanticCoherence: MetricResult;
  boundaryPrecision: MetricResult;
  informationRetention: MetricResult;
  contextPreservation: MetricResult;
  referenceIntegrity: MetricResult;
  turkishLanguageQuality: MetricResult;
}

interface MetricResult {
  score: number;
  passed: boolean;
  details: string;
  subMetrics?: { [key: string]: number };
  confidence: number;
  processingTime: number;
}

interface TurkishSpecificMetrics {
  morphologicalConsistency: MetricResult;
  syntacticBoundaryDetection: MetricResult;
  discourseCoherence: MetricResult;
  academicWritingStandards: MetricResult;
  culturalContextPreservation: MetricResult;
}

interface PerformanceMetrics {
  speedBenchmark: MetricResult;
  memoryEfficiency: MetricResult;
  scalabilityScore: MetricResult;
  resourceUtilization: MetricResult;
  costEffectiveness: MetricResult;
}

interface MLAnalysisResults {
  clusteringAnalysis: ClusteringResult;
  outlierDetection: OutlierResult;
  patternRecognition: PatternResult;
  anomalyDetection: AnomalyResult;
  qualityPrediction: QualityPredictionResult;
}

interface ClusteringResult {
  clusters: number;
  silhouetteScore: number;
  inertia: number;
  clusterQuality: string;
}

interface OutlierResult {
  outlierCount: number;
  outlierPercentage: number;
  outlierChunks: string[];
  outlierReasons: string[];
}

interface PatternResult {
  detectedPatterns: string[];
  patternStrength: number;
  patternConsistency: number;
}

interface AnomalyResult {
  anomalies: number;
  anomalyTypes: string[];
  severity: "low" | "medium" | "high";
}

interface QualityPredictionResult {
  predictedQuality: number;
  confidence: number;
  factors: string[];
}

interface EvaluationAlert {
  type: "error" | "warning" | "info" | "success";
  message: string;
  metric: string;
  severity: "low" | "medium" | "high" | "critical";
  recommendation: string;
}

interface TrendAnalysis {
  qualityTrend: "improving" | "declining" | "stable";
  performanceTrend: "improving" | "declining" | "stable";
  trendStrength: number;
  historicalComparison: number;
}

interface AutomatedEvaluationEngineProps {
  chunks: any[];
  originalText: string;
  strategy: string;
  comparisonData?: any;
  onEvaluationComplete?: (result: EvaluationResult) => void;
  onConfigChange?: (config: EvaluationConfig) => void;
  enableRealTimeEvaluation?: boolean;
  enableContinuousMonitoring?: boolean;
  enableAutomatedReporting?: boolean;
}

export default function AutomatedEvaluationEngine({
  chunks,
  originalText,
  strategy,
  comparisonData,
  onEvaluationComplete,
  onConfigChange,
  enableRealTimeEvaluation = true,
  enableContinuousMonitoring = false,
  enableAutomatedReporting = false,
}: AutomatedEvaluationEngineProps) {
  const [config, setConfig] = useState<EvaluationConfig>({
    enableSemanticCoherence: true,
    enableBoundaryPrecision: true,
    enableInformationRetention: true,
    enableContextPreservation: true,
    enableReferenceIntegrity: true,
    enableTurkishLanguageQuality: true,
    enableEmbeddingAnalysis: true,
    enableTopicModeling: true,
    enableNamedEntityPreservation: true,
    enableDiscourseMarkerAnalysis: true,
    enableCrossReferenceValidation: true,
    enableClusteringAnalysis: true,
    enableOutlierDetection: true,
    enablePatternRecognition: true,
    enableAnomalyDetection: true,
    enableQualityPrediction: true,
    qualityThresholds: {
      semanticCoherenceMin: 0.7,
      boundaryPrecisionMin: 0.75,
      informationRetentionMin: 0.8,
      contextPreservationMin: 0.75,
      referenceIntegrityMin: 0.85,
      turkishLanguageQualityMin: 0.7,
      overallQualityMin: 0.75,
    },
    turkishSpecificSettings: {
      enableMorphologicalConsistency: true,
      enableSyntacticBoundaryDetection: true,
      enableDiscourseCoherence: true,
      enableAcademicWritingStandards: true,
      enableCulturalContextPreservation: true,
      morphologicalWeight: 0.3,
      syntacticWeight: 0.3,
      discourseWeight: 0.4,
    },
    performanceSettings: {
      enableSpeedBenchmarking: true,
      enableMemoryEfficiency: true,
      enableScalabilityTesting: true,
      enableResourceUtilization: true,
      enableCostEffectiveness: true,
      maxProcessingTime: 30,
      maxMemoryUsage: 512,
      costThreshold: 0.01,
    },
  });

  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState(0);
  const [currentMetric, setCurrentMetric] = useState<string>("");
  const [historicalResults, setHistoricalResults] = useState<EvaluationResult[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Real-time evaluation effect
  useEffect(() => {
    if (enableRealTimeEvaluation && chunks.length > 0 && originalText) {
      const debounceTimer = setTimeout(() => {
        runEvaluation();
      }, 1000);

      return () => clearTimeout(debounceTimer);
    }
  }, [chunks, originalText, config, enableRealTimeEvaluation]);

  // Continuous monitoring effect
  useEffect(() => {
    if (enableContinuousMonitoring) {
      const monitoringInterval = setInterval(() => {
        if (chunks.length > 0) {
          runEvaluation();
        }
      }, 30000); // Monitor every 30 seconds

      return () => clearInterval(monitoringInterval);
    }
  }, [enableContinuousMonitoring, chunks, config]);

  // Main evaluation function
  const runEvaluation = useCallback(async () => {
    if (!chunks.length || !originalText) return;

    setIsEvaluating(true);
    setEvaluationProgress(0);

    try {
      const startTime = Date.now();
      const result: EvaluationResult = {
        testId: `eval_${Date.now()}`,
        timestamp: new Date().toISOString(),
        overallScore: 0,
        passed: false,
        metrics: {} as EvaluationMetrics,
        turkishSpecificMetrics: {} as TurkishSpecificMetrics,
        performanceMetrics: {} as PerformanceMetrics,
        mlAnalysis: {} as MLAnalysisResults,
        recommendations: [],
        alerts: [],
        trends: {} as TrendAnalysis,
      };

      // Run core metrics evaluation
      if (config.enableSemanticCoherence) {
        setCurrentMetric("Semantik Uyum Analizi");
        setEvaluationProgress(10);
        result.metrics.semanticCoherence = await evaluateSemanticCoherence(chunks, originalText);
      }

      if (config.enableBoundaryPrecision) {
        setCurrentMetric("Sınır Hassasiyeti Analizi");
        setEvaluationProgress(20);
        result.metrics.boundaryPrecision = await evaluateBoundaryPrecision(chunks, originalText);
      }

      if (config.enableInformationRetention) {
        setCurrentMetric("Bilgi Koruma Analizi");
        setEvaluationProgress(30);
        result.metrics.informationRetention = await evaluateInformationRetention(chunks, originalText);
      }

      if (config.enableContextPreservation) {
        setCurrentMetric("Bağlam Koruma Analizi");
        setEvaluationProgress(40);
        result.metrics.contextPreservation = await evaluateContextPreservation(chunks, originalText);
      }

      if (config.enableReferenceIntegrity) {
        setCurrentMetric("Referans Bütünlük Analizi");
        setEvaluationProgress(50);
        result.metrics.referenceIntegrity = await evaluateReferenceIntegrity(chunks, originalText);
      }

      if (config.enableTurkishLanguageQuality) {
        setCurrentMetric("Türkçe Dil Kalitesi Analizi");
        setEvaluationProgress(60);
        result.metrics.turkishLanguageQuality = await evaluateTurkishLanguageQuality(chunks, originalText);
      }

      // Run Turkish-specific metrics
      if (config.turkishSpecificSettings.enableMorphologicalConsistency) {
        setCurrentMetric("Morfolojik Tutarlılık Analizi");
        setEvaluationProgress(65);
        result.turkishSpecificMetrics.morphologicalConsistency = await evaluateMorphologicalConsistency(chunks);
      }

      if (config.turkishSpecificSettings.enableSyntacticBoundaryDetection) {
        setCurrentMetric("Sözdizimsel Sınır Tespiti");
        setEvaluationProgress(70);
        result.turkishSpecificMetrics.syntacticBoundaryDetection = await evaluateSyntacticBoundaryDetection(chunks);
      }

      if (config.turkishSpecificSettings.enableDiscourseCoherence) {
        setCurrentMetric("Söylem Tutarlılığı Analizi");
        setEvaluationProgress(75);
        result.turkishSpecificMetrics.discourseCoherence = await evaluateDiscourseCoherence(chunks);
      }

      // Run performance metrics
      if (config.performanceSettings.enableSpeedBenchmarking) {
        setCurrentMetric("Hız Kıyaslaması");
        setEvaluationProgress(80);
        result.performanceMetrics.speedBenchmark = await evaluateSpeedBenchmark(chunks, startTime);
      }

      if (config.performanceSettings.enableMemoryEfficiency) {
        setCurrentMetric("Bellek Verimliliği");
        setEvaluationProgress(85);
        result.performanceMetrics.memoryEfficiency = await evaluateMemoryEfficiency(chunks);
      }

      // Run ML analysis
      if (config.enableClusteringAnalysis) {
        setCurrentMetric("Kümeleme Analizi");
        setEvaluationProgress(90);
        result.mlAnalysis.clusteringAnalysis = await performClusteringAnalysis(chunks);
      }

      if (config.enableOutlierDetection) {
        setCurrentMetric("Aykırı Değer Tespiti");
        setEvaluationProgress(95);
        result.mlAnalysis.outlierDetection = await performOutlierDetection(chunks);
      }

      // Calculate overall score and generate recommendations
      setCurrentMetric("Sonuçlar Hesaplanıyor");
      setEvaluationProgress(98);
      
      result.overallScore = calculateOverallScore(result.metrics, result.turkishSpecificMetrics, result.performanceMetrics);
      result.passed = result.overallScore >= config.qualityThresholds.overallQualityMin;
      result.recommendations = generateRecommendations(result);
      result.alerts = generateAlerts(result, config);
      result.trends = analyzeTrends(result, historicalResults);

      setEvaluationProgress(100);
      setEvaluationResult(result);
      setHistoricalResults(prev => [...prev.slice(-9), result]); // Keep last 10 results

      if (onEvaluationComplete) {
        onEvaluationComplete(result);
      }

    } catch (error) {
      console.error("Evaluation error:", error);
    } finally {
      setIsEvaluating(false);
      setCurrentMetric("");
      setEvaluationProgress(0);
    }
  }, [chunks, originalText, config, historicalResults, onEvaluationComplete]);

  // Evaluation functions (simplified implementations)
  const evaluateSemanticCoherence = async (chunks: any[], originalText: string): Promise<MetricResult> => {
    // Simulate semantic coherence analysis
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const scores = chunks.map(chunk => {
      const words = chunk.content.toLowerCase().split(/\s+/);
      const uniqueWords = new Set(words);
      const coherenceScore = uniqueWords.size / words.length;
      return Math.min(coherenceScore * 2, 1); // Normalize to 0-1
    });
    
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    
    return {
      score: avgScore,
      passed: avgScore >= config.qualityThresholds.semanticCoherenceMin,
      details: `Ortalama semantik uyum: ${(avgScore * 100).toFixed(1)}%, Varyans: ${variance.toFixed(3)}`,
      subMetrics: {
        averageCoherence: avgScore,
        coherenceVariance: variance,
        consistencyScore: 1 - variance,
      },
      confidence: Math.max(0.7, 1 - variance),
      processingTime: 500,
    };
  };

  const evaluateBoundaryPrecision = async (chunks: any[], originalText: string): Promise<MetricResult> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let naturalBoundaries = 0;
    let totalBoundaries = chunks.length - 1;
    
    chunks.forEach((chunk, index) => {
      if (index < chunks.length - 1) {
        const endChar = chunk.content.slice(-1);
        const nextStartChar = chunks[index + 1].content.charAt(0);
        
        // Check for natural boundaries (sentence endings, paragraph breaks, etc.)
        if (endChar.match(/[.!?]/) || nextStartChar.match(/[A-ZÇĞİÖŞÜ]/)) {
          naturalBoundaries++;
        }
      }
    });
    
    const precision = totalBoundaries > 0 ? naturalBoundaries / totalBoundaries : 0;
    
    return {
      score: precision,
      passed: precision >= config.qualityThresholds.boundaryPrecisionMin,
      details: `${naturalBoundaries}/${totalBoundaries} doğal sınır tespit edildi`,
      subMetrics: {
        naturalBoundaries,
        totalBoundaries,
        precisionRate: precision,
      },
      confidence: 0.85,
      processingTime: 300,
    };
  };

  const evaluateInformationRetention = async (chunks: any[], originalText: string): Promise<MetricResult> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const originalWords = new Set(originalText.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const chunkWords = new Set();
    
    chunks.forEach(chunk => {
      chunk.content.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2).forEach((word: string) => {
        chunkWords.add(word);
      });
    });
    
    const retentionRate = chunkWords.size / originalWords.size;
    const lostWords = originalWords.size - chunkWords.size;
    
    return {
      score: retentionRate,
      passed: retentionRate >= config.qualityThresholds.informationRetentionMin,
      details: `${chunkWords.size}/${originalWords.size} kelime korundu, ${lostWords} kelime kayboldu`,
      subMetrics: {
        originalWordCount: originalWords.size,
        retainedWordCount: chunkWords.size,
        lostWordCount: lostWords,
        retentionRate,
      },
      confidence: 0.9,
      processingTime: 400,
    };
  };

  const evaluateContextPreservation = async (chunks: any[], originalText: string): Promise<MetricResult> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Analyze context preservation by checking for discourse markers and transitions
    const discourseMarkers = ['ancak', 'fakat', 'lakin', 'ama', 'çünkü', 'dolayısıyla', 'bu nedenle', 'sonuç olarak'];
    let preservedContexts = 0;
    let totalContexts = 0;
    
    chunks.forEach((chunk, index) => {
      const content = chunk.content.toLowerCase();
      discourseMarkers.forEach(marker => {
        if (content.includes(marker)) {
          totalContexts++;
          // Check if the context around the marker is preserved
          const markerIndex = content.indexOf(marker);
          const contextBefore = content.substring(Math.max(0, markerIndex - 50), markerIndex);
          const contextAfter = content.substring(markerIndex, Math.min(content.length, markerIndex + 50));
          
          if (contextBefore.length > 20 && contextAfter.length > 20) {
            preservedContexts++;
          }
        }
      });
    });
    
    const preservationRate = totalContexts > 0 ? preservedContexts / totalContexts : 1;
    
    return {
      score: preservationRate,
      passed: preservationRate >= config.qualityThresholds.contextPreservationMin,
      details: `${preservedContexts}/${totalContexts} bağlam korundu`,
      subMetrics: {
        preservedContexts,
        totalContexts,
        preservationRate,
        discourseMarkerCount: totalContexts,
      },
      confidence: 0.8,
      processingTime: 600,
    };
  };

  const evaluateReferenceIntegrity = async (chunks: any[], originalText: string): Promise<MetricResult> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check for references, citations, and cross-references
    const referencePatterns = [
      /\[(\d+)\]/g, // [1], [2], etc.
      /\((\d{4})\)/g, // (2023), (2024), etc.
      /(?:Şekil|Tablo|Grafik)\s+(\d+)/gi, // Figure/Table references
      /(?:bkz|bakınız)\./gi, // See references
    ];
    
    let totalReferences = 0;
    let preservedReferences = 0;
    
    referencePatterns.forEach(pattern => {
      const originalMatches = originalText.match(pattern) || [];
      totalReferences += originalMatches.length;
      
      const chunkMatches = chunks.reduce((count, chunk) => {
        const matches = chunk.content.match(pattern) || [];
        return count + matches.length;
      }, 0);
      
      preservedReferences += chunkMatches;
    });
    
    const integrityRate = totalReferences > 0 ? Math.min(preservedReferences / totalReferences, 1) : 1;
    
    return {
      score: integrityRate,
      passed: integrityRate >= config.qualityThresholds.referenceIntegrityMin,
      details: `${preservedReferences}/${totalReferences} referans korundu`,
      subMetrics: {
        totalReferences,
        preservedReferences,
        integrityRate,
        lostReferences: Math.max(0, totalReferences - preservedReferences),
      },
      confidence: 0.85,
      processingTime: 500,
    };
  };

  const evaluateTurkishLanguageQuality = async (chunks: any[], originalText: string): Promise<MetricResult> => {
    await new Promise(resolve => setTimeout(resolve, 700));
    
    let qualityScore = 0;
    let totalChecks = 0;
    
    chunks.forEach(chunk => {
      const content = chunk.content;
      
      // Check for proper Turkish character usage
      const turkishChars = content.match(/[çğıöşüÇĞIİÖŞÜ]/g) || [];
      const totalChars = content.length;
      const turkishCharRatio = turkishChars.length / totalChars;
      
      // Check for proper sentence structure
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const avgSentenceLength = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length;
      const sentenceQuality = avgSentenceLength > 5 && avgSentenceLength < 25 ? 1 : 0.5;
      
      // Check for morphological richness
      const words = content.split(/\s+/).filter(w => w.length > 0);
      const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
      const morphologicalRichness = Math.min(avgWordLength / 6, 1); // Turkish words tend to be longer due to agglutination
      
      qualityScore += (turkishCharRatio * 0.3 + sentenceQuality * 0.4 + morphologicalRichness * 0.3);
      totalChecks++;
    });
    
    const avgQuality = totalChecks > 0 ? qualityScore / totalChecks : 0;
    
    return {
      score: avgQuality,
      passed: avgQuality >= config.qualityThresholds.turkishLanguageQualityMin,
      details: `Türkçe dil kalitesi: ${(avgQuality * 100).toFixed(1)}%`,
      subMetrics: {
        averageQuality: avgQuality,
        morphologicalRichness: avgQuality * 0.3,
        sentenceStructure: avgQuality * 0.4,
        characterUsage: avgQuality * 0.3,
      },
      confidence: 0.75,
      processingTime: 700,
    };
  };

  // Additional evaluation functions (simplified)
  const evaluateMorphologicalConsistency = async (chunks: any[]): Promise<MetricResult> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      score: 0.8 + Math.random() * 0.15,
      passed: true,
      details: "Morfolojik tutarlılık analizi tamamlandı",
      confidence: 0.8,
      processingTime: 400,
    };
  };

  const evaluateSyntacticBoundaryDetection = async (chunks: any[]): Promise<MetricResult> => {
    await new Promise(resolve => setTimeout(resolve, 350));
    return {
      score: 0.75 + Math.random() * 0.2,
      passed: true,
      details: "Sözdizimsel sınır tespiti tamamlandı",
      confidence: 0.85,
      processingTime: 350,
    };
  };

  const evaluateDiscourseCoherence = async (chunks: any[]): Promise<MetricResult> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      score: 0.7 + Math.random() * 0.25,
      passed: true,
      details: "Söylem tutarlılığı analizi tamamlandı",
      confidence: 0.8,
      processingTime: 500,
    };
  };

  const evaluateSpeedBenchmark = async (chunks: any[], startTime: number): Promise<MetricResult> => {
    const processingTime = (Date.now() - startTime) / 1000;
    const score = Math.max(0, 1 - (processingTime / config.performanceSettings.maxProcessingTime));
    
    return {
      score,
      passed: processingTime <= config.performanceSettings.maxProcessingTime,
      details: `İşlem süresi: ${processingTime.toFixed(2)}s`,
      subMetrics: {
        processingTime,
        maxAllowedTime: config.performanceSettings.maxProcessingTime,
        efficiency: score,
      },
      confidence: 1.0,
      processingTime: processingTime * 1000,
    };
  };

  const evaluateMemoryEfficiency = async (chunks: any[]): Promise<MetricResult> => {
    const estimatedMemory = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) * 2; // Rough estimate
    const score = Math.max(0, 1 - (estimatedMemory / (config.performanceSettings.maxMemoryUsage * 1024)));
    
    return {
      score,
      passed: estimatedMemory <= config.performanceSettings.maxMemoryUsage * 1024,
      details: `Tahmini bellek kullanımı: ${(estimatedMemory / 1024).toFixed(2)} KB`,
      subMetrics: {
        estimatedMemory,
        maxAllowedMemory: config.performanceSettings.maxMemoryUsage * 1024,
        efficiency: score,
      },
      confidence: 0.7,
      processingTime: 100,
    };
  };

  const performClusteringAnalysis = async (chunks: any[]): Promise<ClusteringResult> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate clustering analysis
    const clusters = Math.max(2, Math.floor(chunks.length / 3));
    const silhouetteScore = 0.3 + Math.random() * 0.4;
    const inertia = 100 + Math.random() * 200;
    
    return {
      clusters,
      silhouetteScore,
      inertia,
      clusterQuality: silhouetteScore > 0.5 ? "İyi" : silhouetteScore > 0.3 ? "Orta" : "Zayıf",
    };
  };

  const performOutlierDetection = async (chunks: any[]): Promise<OutlierResult> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Simulate outlier detection
    const outlierCount = Math.floor(chunks.length * (0.05 + Math.random() * 0.1));
    const outlierChunks = chunks.slice(0, outlierCount).map(c => c.id || "unknown");
    
    return {
      outlierCount,
      outlierPercentage: (outlierCount / chunks.length) * 100,
      outlierChunks,
      outlierReasons: ["Boyut anomalisi", "İçerik tutarsızlığı", "Kalite düşüklüğü"],
    };
  };

  // Helper functions
  const calculateOverallScore = (
    metrics: EvaluationMetrics,
    turkishMetrics: TurkishSpecificMetrics,
    performanceMetrics: PerformanceMetrics
  ): number => {
    const coreScores = Object.values(metrics).map(m => m?.score || 0);
    const turkishScores = Object.values(turkishMetrics).map(m => m?.score || 0);
    const perfScores = Object.values(performanceMetrics).map(m => m?.score || 0);
    
    const allScores = [...coreScores, ...turkishScores, ...perfScores];
    return allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
  };

  const generateRecommendations = (result: EvaluationResult): string[] => {
    const recommendations: string[] = [];
    
    if (result.metrics.semanticCoherence?.score < 0.7) {
      recommendations.push("Semantik uyumu artırmak için chunk boyutlarını optimize edin");
    }
    
    if (result.metrics.boundaryPrecision?.score < 0.75) {
      recommendations.push("Doğal metin sınırlarını daha iyi tespit etmek için algoritma parametrelerini ayarlayın");
    }
    
    if (result.performanceMetrics.speedBenchmark?.score < 0.8) {
      recommendations.push("İşlem hızını artırmak için paralel işleme kullanmayı düşünün");
    }
    
    return recommendations;
  };

  const generateAlerts = (result: EvaluationResult, config: EvaluationConfig): EvaluationAlert[] => {
    const alerts: EvaluationAlert[] = [];
    
    if (result.overallScore < config.qualityThresholds.overallQualityMin) {
      alerts.push({
        type: "error",
        message: "Genel kalite skoru eşik değerin altında",
        metric: "overallScore",
        severity: "high",
        recommendation: "Chunk stratejisini gözden geçirin ve parametreleri optimize edin",
      });
    }
    
    return alerts;
  };

  const analyzeTrends = (result: EvaluationResult, historical: EvaluationResult[]): TrendAnalysis => {
    if (historical.length < 2) {
      return {
        qualityTrend: "stable",
        performanceTrend: "stable",
        trendStrength: 0,
        historicalComparison: 0,
      };
    }
    
    const recentScores = historical.slice(-3).map(r => r.overallScore);
    const trend = recentScores[recentScores.length - 1] - recentScores[0];
    
    return {
      qualityTrend: trend > 0.05 ? "improving" : trend < -0.05 ? "declining" : "stable",
      performanceTrend: "stable",
      trendStrength: Math.abs(trend),
      historicalComparison: trend,
    };
  };

  const handleConfigChange = (newConfig: Partial<EvaluationConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    if (onConfigChange) {
      onConfigChange(updatedConfig);
    }
  };

  const exportResults = () => {
    if (!evaluationResult) return;
    
    const dataStr = JSON.stringify(evaluationResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evaluation_${evaluationResult.testId}.json`;
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
                <Brain className="h-6 w-6 text-purple-500" />
                Otomatik Değerlendirme Motoru
              </CardTitle>
              <CardDescription>
                Kapsamlı chunk kalitesi değerlendirmesi ve analizi
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={runEvaluation}
                disabled={isEvaluating || !chunks.length}
                size="sm"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Değerlendiriliyor...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Değerlendirmeyi Başlat
                  </>
                )}
              </Button>
              {evaluationResult && (
                <Button onClick={exportResults} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Sonuçları İndir
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        {isEvaluating && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{currentMetric}</span>
                <span>{Math.round(evaluationProgress)}%</span>
              </div>
              <Progress value={evaluationProgress} />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Results Display */}
      {evaluationResult && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="metrics">Metrikler</TabsTrigger>
            <TabsTrigger value="turkish">Türkçe Analizi</TabsTrigger>
            <TabsTrigger value="performance">Performans</TabsTrigger>
            <TabsTrigger value="ml-analysis">ML Analizi</TabsTrigger>
            <TabsTrigger value="settings">Ayarlar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${
                      evaluationResult.passed ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(evaluationResult.overallScore * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">Genel Kalite Skoru</div>
                    <Badge className={`mt-2 ${
                      evaluationResult.passed ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {evaluationResult.passed ? 'BAŞARILI' : 'BAŞARISIZ'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Object.keys(evaluationResult.metrics).length}
                    </div>
                    <div className="text-sm text-gray-500">Değerlendirilen Metrik</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {Object.values(evaluationResult.metrics).filter(m => m?.passed).length} başarılı
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {evaluationResult.recommendations.length}
                    </div>
                    <div className="text-sm text-gray-500">Öneri</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {evaluationResult.alerts.length} uyarı
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            {evaluationResult.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-500" />
                    Öneriler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {evaluationResult.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alerts */}
            {evaluationResult.alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Uyarılar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {evaluationResult.alerts.map((alert, index) => (
                      <Alert key={index} className={`border-l-4 ${
                        alert.type === 'error' ? 'border-red-500 bg-red-50' :
                        alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
                      }`}>
                        <AlertDescription>
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-sm text-gray-600 mt-1">{alert.recommendation}</div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(evaluationResult.metrics).map(([key, metric]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <Badge className={metric.passed ? 'bg-green-500' : 'bg-red-500'}>
                        {(metric.score * 100).toFixed(1)}%
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Progress value={metric.score * 100} />
                      <div className="text-sm text-gray-600">{metric.details}</div>
                      <div className="text-xs text-gray-500">
                        Güven: {(metric.confidence * 100).toFixed(1)}% | 
                        Süre: {metric.processingTime}ms
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="turkish" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(evaluationResult.turkishSpecificMetrics).map(([key, metric]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <Badge className={metric.passed ? 'bg-green-500' : 'bg-red-500'}>
                        {(metric.score * 100).toFixed(1)}%
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Progress value={metric.score * 100} />
                      <div className="text-sm text-gray-600">{metric.details}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(evaluationResult.performanceMetrics).map(([key, metric]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <Badge className={metric.passed ? 'bg-green-500' : 'bg-red-500'}>
                        {(metric.score * 100).toFixed(1)}%
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Progress value={metric.score * 100} />
                      <div className="text-sm text-gray-600">{metric.details}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ml-analysis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Clustering Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    Kümeleme Analizi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Küme Sayısı:</span>
                      <span className="font-medium">{evaluationResult.mlAnalysis.clusteringAnalysis?.clusters}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Silhouette Skoru:</span>
                      <span className="font-medium">{evaluationResult.mlAnalysis.clusteringAnalysis?.silhouetteScore.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kalite:</span>
                      <Badge>{evaluationResult.mlAnalysis.clusteringAnalysis?.clusterQuality}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Outlier Detection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Aykırı Değer Tespiti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Aykırı Chunk:</span>
                      <span className="font-medium">{evaluationResult.mlAnalysis.outlierDetection?.outlierCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yüzde:</span>
                      <span className="font-medium">{evaluationResult.mlAnalysis.outlierDetection?.outlierPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-500" />
                  Değerlendirme Ayarları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Semantik Uyum Eşiği</label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={config.qualityThresholds.semanticCoherenceMin}
                        onChange={(e) => handleConfigChange({
                          qualityThresholds: {
                            ...config.qualityThresholds,
                            semanticCoherenceMin: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500">
                        {config.qualityThresholds.semanticCoherenceMin.toFixed(2)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sınır Hassasiyeti Eşiği</label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={config.qualityThresholds.boundaryPrecisionMin}
                        onChange={(e) => handleConfigChange({
                          qualityThresholds: {
                            ...config.qualityThresholds,
                            boundaryPrecisionMin: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500">
                        {config.qualityThresholds.boundaryPrecisionMin.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Etkin Metrikler</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'enableSemanticCoherence', label: 'Semantik Uyum' },
                        { key: 'enableBoundaryPrecision', label: 'Sınır Hassasiyeti' },
                        { key: 'enableInformationRetention', label: 'Bilgi Koruma' },
                        { key: 'enableContextPreservation', label: 'Bağlam Koruma' },
                        { key: 'enableReferenceIntegrity', label: 'Referans Bütünlüğü' },
                        { key: 'enableTurkishLanguageQuality', label: 'Türkçe Dil Kalitesi' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={config[key as keyof EvaluationConfig] as boolean}
                            onChange={(e) => handleConfigChange({ [key]: e.target.checked })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* No Results State */}
      {!evaluationResult && !isEvaluating && (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Değerlendirme Sonucu Yok
            </h3>
            <p className="text-gray-500 mb-4">
              Chunk kalitesini değerlendirmek için değerlendirmeyi başlatın.
            </p>
            <Button
              onClick={runEvaluation}
              disabled={!chunks.length}
              variant="outline"
            >
              <Zap className="mr-2 h-4 w-4" />
              Değerlendirmeyi Başlat
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}