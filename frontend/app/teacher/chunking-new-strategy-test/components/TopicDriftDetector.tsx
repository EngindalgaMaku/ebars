"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  GitBranch,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Target,
  Brain,
  Activity,
  BarChart3,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  Zap,
  Search,
  Layers,
  Hash,
  BookOpen,
  Microscope,
  Network,
  Compass,
  Map,
  Navigation,
  Shuffle,
  ArrowRight,
  ArrowDown,
  RotateCcw
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Sankey,
  TreeMap
} from "recharts";

// Interfaces
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

interface TopicDriftResult {
  chunkId: string;
  chunkIndex: number;
  detectedTopics: DetectedTopic[];
  driftScore: number;
  driftType: "none" | "gradual" | "abrupt" | "oscillating" | "chaotic";
  driftSeverity: "low" | "medium" | "high" | "critical";
  previousTopics: string[];
  topicTransitions: TopicTransition[];
  semanticShift: SemanticShift;
  coherenceBreakdown: CoherenceBreakdown;
  turkishTopicFeatures: TurkishTopicFeature[];
  driftAlerts: DriftAlert[];
  stabilityMetrics: StabilityMetric;
}

interface DetectedTopic {
  name: string;
  confidence: number;
  weight: number;
  keywords: string[];
  domain: string;
  academicLevel: "basic" | "intermediate" | "advanced" | "expert";
  turkishSpecific: boolean;
}

interface TopicTransition {
  fromTopic: string;
  toTopic: string;
  transitionType: "smooth" | "abrupt" | "bridged" | "disconnected";
  strength: number;
  naturalness: number;
  linguisticMarkers: string[];
  confidence: number;
}

interface SemanticShift {
  magnitude: number;
  direction: "forward" | "backward" | "lateral" | "chaotic";
  consistency: number;
  embeddingDistance: number;
  conceptualOverlap: number;
}

interface CoherenceBreakdown {
  lexicalCoherence: number;
  semanticCoherence: number;
  topicalCoherence: number;
  discourseCoherence: number;
  overallCoherence: number;
  breakdownPoints: BreakdownPoint[];
}

interface BreakdownPoint {
  location: number;
  type: "lexical" | "semantic" | "topical" | "discourse";
  severity: number;
  description: string;
}

interface TurkishTopicFeature {
  type: "discourse_marker" | "academic_terminology" | "domain_vocabulary" | "register_shift";
  feature: string;
  impact: "stabilizing" | "destabilizing" | "neutral";
  confidence: number;
  examples: string[];
}

interface DriftAlert {
  type: "sudden_shift" | "topic_loss" | "coherence_break" | "domain_change" | "register_mismatch";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  location: { start: number; end: number };
  confidence: number;
  recommendations: string[];
}

interface StabilityMetric {
  topicStability: number;
  semanticStability: number;
  lexicalStability: number;
  discourseStability: number;
  overallStability: number;
  volatilityIndex: number;
}

interface DriftDetectionConfig {
  sensitivityLevel: "low" | "medium" | "high" | "ultra";
  enableSemanticAnalysis: boolean;
  enableTopicModeling: boolean;
  enableCoherenceAnalysis: boolean;
  enableTurkishFeatures: boolean;
  driftThreshold: number;
  coherenceThreshold: number;
  topicSimilarityThreshold: number;
  contextWindowSize: number;
  enableRealTimeAlerts: boolean;
}

interface TopicDriftDetectorProps {
  chunks: ChunkData[];
  originalText: string;
  onDriftDetected?: (result: TopicDriftResult) => void;
  onAnalysisComplete?: (results: TopicDriftResult[]) => void;
  enableRealTimeDetection?: boolean;
  showVisualization?: boolean;
  turkishOptimized?: boolean;
}

const TopicDriftDetector: React.FC<TopicDriftDetectorProps> = ({
  chunks,
  originalText,
  onDriftDetected,
  onAnalysisComplete,
  enableRealTimeDetection = true,
  showVisualization = true,
  turkishOptimized = true
}) => {
  const [activeTab, setActiveTab] = useState<"detection" | "analysis" | "visualization" | "alerts" | "settings">("detection");
  const [isDetecting, setIsDetecting] = useState(false);
  const [driftResults, setDriftResults] = useState<TopicDriftResult[]>([]);
  const [selectedChunk, setSelectedChunk] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  
  const [config, setConfig] = useState<DriftDetectionConfig>({
    sensitivityLevel: "medium",
    enableSemanticAnalysis: true,
    enableTopicModeling: true,
    enableCoherenceAnalysis: true,
    enableTurkishFeatures: turkishOptimized,
    driftThreshold: 0.6,
    coherenceThreshold: 0.7,
    topicSimilarityThreshold: 0.4,
    contextWindowSize: 3,
    enableRealTimeAlerts: true
  });

  // Turkish academic domains and keywords
  const turkishAcademicDomains = {
    "biyoloji": {
      keywords: ["hücre", "organizma", "gen", "dna", "protein", "enzim", "metabolizma", "evrim", "ekoloji", "biyoçeşitlilik"],
      level: "intermediate",
      discourseMarkers: ["bu bağlamda", "öte yandan", "sonuç olarak", "diğer bir deyişle"]
    },
    "fizik": {
      keywords: ["kuvvet", "enerji", "hareket", "newton", "elektrik", "manyetik", "kuantum", "relativite", "termodinamik", "optik"],
      level: "advanced",
      discourseMarkers: ["bu durumda", "benzer şekilde", "aksine", "dolayısıyla"]
    },
    "kimya": {
      keywords: ["reaksiyon", "molekül", "atom", "element", "bileşik", "asit", "baz", "kataliz", "organik", "inorganik"],
      level: "intermediate",
      discourseMarkers: ["bu nedenle", "ayrıca", "özellikle", "genel olarak"]
    },
    "matematik": {
      keywords: ["denklem", "formül", "hesap", "geometri", "algebra", "integral", "türev", "limit", "matris", "vektör"],
      level: "advanced",
      discourseMarkers: ["bu şekilde", "benzer biçimde", "sonuç itibariyle", "başka bir ifadeyle"]
    },
    "tarih": {
      keywords: ["dönem", "olay", "kültür", "medeniyet", "savaş", "devlet", "toplum", "siyaset", "ekonomi", "sosyal"],
      level: "basic",
      discourseMarkers: ["bu dönemde", "o zamanlar", "daha sonra", "öncesinde"]
    },
    "coğrafya": {
      keywords: ["harita", "iklim", "bölge", "şehir", "dağ", "nehir", "nüfus", "yerleşim", "doğal", "beşeri"],
      level: "basic",
      discourseMarkers: ["bu bölgede", "coğrafi olarak", "mekânsal", "konumsal"]
    },
    "edebiyat": {
      keywords: ["şiir", "roman", "hikaye", "yazar", "eser", "tema", "karakter", "anlatım", "üslup", "dil"],
      level: "intermediate",
      discourseMarkers: ["bu eserde", "yazarın", "metinde", "anlatıcı"]
    },
    "felsefe": {
      keywords: ["düşünce", "kavram", "mantık", "etik", "estetik", "varlık", "bilgi", "hakikat", "değer", "anlam"],
      level: "expert",
      discourseMarkers: ["bu açıdan", "felsefi olarak", "düşünsel", "kavramsal"]
    }
  };

  // Test scenarios for topic drift
  const testScenarios = [
    {
      name: "Kuantum Fizik → Yemek Pişirme",
      description: "Kuantum fiziği konusundan yemek pişirme konusuna ani geçiş",
      severity: "critical",
      type: "abrupt"
    },
    {
      name: "Biyoloji → Ekonomi",
      description: "Biyoloji konusundan ekonomi konusuna kademeli geçiş",
      severity: "high",
      type: "gradual"
    },
    {
      name: "Edebiyat → Teknoloji",
      description: "Edebiyat analizinden teknoloji konusuna karışık geçiş",
      severity: "medium",
      type: "oscillating"
    },
    {
      name: "Akademik → Günlük Dil",
      description: "Akademik dilden günlük dile register değişimi",
      severity: "medium",
      type: "gradual"
    },
    {
      name: "Türkçe → İngilizce",
      description: "Türkçe metinden İngilizce metne dil değişimi",
      severity: "critical",
      type: "abrupt"
    }
  ];

  // Main drift detection function
  const detectTopicDrift = async () => {
    if (chunks.length === 0) return;

    setIsDetecting(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 3500));

      const results: TopicDriftResult[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Detect topics in current chunk
        const detectedTopics = detectTopicsInChunk(chunk.content);
        
        // Calculate drift score
        const driftScore = calculateDriftScore(chunk, chunks, i);
        
        // Determine drift type and severity
        const { driftType, driftSeverity } = analyzeDriftPattern(driftScore, i, chunks);
        
        // Get previous topics for comparison
        const previousTopics = i > 0 ? getPreviousTopics(chunks, i) : [];
        
        // Analyze topic transitions
        const topicTransitions = analyzeTopicTransitions(detectedTopics, previousTopics);
        
        // Calculate semantic shift
        const semanticShift = calculateSemanticShift(chunk, chunks, i);
        
        // Analyze coherence breakdown
        const coherenceBreakdown = analyzeCoherenceBreakdown(chunk.content);
        
        // Extract Turkish-specific features
        const turkishTopicFeatures = extractTurkishTopicFeatures(chunk.content);
        
        // Generate drift alerts
        const driftAlerts = generateDriftAlerts(driftScore, driftType, driftSeverity, detectedTopics, previousTopics);
        
        // Calculate stability metrics
        const stabilityMetrics = calculateStabilityMetrics(chunk, chunks, i);

        const result: TopicDriftResult = {
          chunkId: chunk.id,
          chunkIndex: i,
          detectedTopics,
          driftScore,
          driftType,
          driftSeverity,
          previousTopics,
          topicTransitions,
          semanticShift,
          coherenceBreakdown,
          turkishTopicFeatures,
          driftAlerts,
          stabilityMetrics
        };

        results.push(result);

        // Real-time callback
        if (enableRealTimeDetection && onDriftDetected) {
          onDriftDetected(result);
        }
      }

      setDriftResults(results);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(results);
      }

    } catch (error) {
      console.error("Topic drift detection failed:", error);
    } finally {
      setIsDetecting(false);
    }
  };

  // Detect topics in a chunk
  const detectTopicsInChunk = (content: string): DetectedTopic[] => {
    const topics: DetectedTopic[] = [];
    const words = content.toLowerCase().split(/\s+/);
    
    Object.entries(turkishAcademicDomains).forEach(([domain, domainData]) => {
      let matchCount = 0;
      const matchedKeywords: string[] = [];
      
      domainData.keywords.forEach(keyword => {
        if (words.includes(keyword)) {
          matchCount++;
          matchedKeywords.push(keyword);
        }
      });
      
      if (matchCount > 0) {
        const confidence = Math.min(1.0, matchCount / domainData.keywords.length * 2);
        const weight = matchCount / words.length * 100;
        
        topics.push({
          name: domain,
          confidence,
          weight,
          keywords: matchedKeywords,
          domain: domain,
          academicLevel: domainData.level as "basic" | "intermediate" | "advanced" | "expert",
          turkishSpecific: true
        });
      }
    });
    
    // Sort by confidence and return top topics
    return topics.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  };

  // Calculate drift score
  const calculateDriftScore = (chunk: ChunkData, allChunks: ChunkData[], index: number): number => {
    if (index === 0) return 0; // No drift for first chunk
    
    const currentTopics = detectTopicsInChunk(chunk.content);
    const previousTopics = detectTopicsInChunk(allChunks[index - 1].content);
    
    if (currentTopics.length === 0 && previousTopics.length === 0) return 0;
    if (currentTopics.length === 0 || previousTopics.length === 0) return 1.0;
    
    // Calculate topic overlap
    const currentTopicNames = new Set(currentTopics.map(t => t.name));
    const previousTopicNames = new Set(previousTopics.map(t => t.name));
    
    const intersection = new Set([...currentTopicNames].filter(x => previousTopicNames.has(x)));
    const union = new Set([...currentTopicNames, ...previousTopicNames]);
    
    const topicSimilarity = union.size > 0 ? intersection.size / union.size : 0;
    
    // Calculate semantic similarity (simplified)
    const semanticSimilarity = calculateSemanticSimilarity(chunk.content, allChunks[index - 1].content);
    
    // Calculate lexical similarity
    const lexicalSimilarity = calculateLexicalSimilarity(chunk.content, allChunks[index - 1].content);
    
    // Combine metrics
    const combinedSimilarity = (topicSimilarity * 0.5 + semanticSimilarity * 0.3 + lexicalSimilarity * 0.2);
    
    return 1 - combinedSimilarity; // Higher drift = lower similarity
  };

  // Analyze drift pattern
  const analyzeDriftPattern = (driftScore: number, index: number, allChunks: ChunkData[]): {
    driftType: "none" | "gradual" | "abrupt" | "oscillating" | "chaotic";
    driftSeverity: "low" | "medium" | "high" | "critical";
  } => {
    let driftType: "none" | "gradual" | "abrupt" | "oscillating" | "chaotic" = "none";
    let driftSeverity: "low" | "medium" | "high" | "critical" = "low";
    
    // Determine severity
    if (driftScore >= 0.8) driftSeverity = "critical";
    else if (driftScore >= 0.6) driftSeverity = "high";
    else if (driftScore >= 0.4) driftSeverity = "medium";
    else if (driftScore >= 0.2) driftSeverity = "low";
    
    // Determine type based on pattern
    if (driftScore < 0.2) {
      driftType = "none";
    } else if (index >= 2) {
      const prevDrift = calculateDriftScore(allChunks[index - 1], allChunks, index - 1);
      const prevPrevDrift = calculateDriftScore(allChunks[index - 2], allChunks, index - 2);
      
      if (driftScore > 0.7 && prevDrift < 0.3) {
        driftType = "abrupt";
      } else if (driftScore > prevDrift && prevDrift > prevPrevDrift) {
        driftType = "gradual";
      } else if (Math.abs(driftScore - prevDrift) > 0.4) {
        driftType = "oscillating";
      } else if (driftScore > 0.6 && prevDrift > 0.6 && prevPrevDrift > 0.6) {
        driftType = "chaotic";
      } else {
        driftType = "gradual";
      }
    } else {
      driftType = driftScore > 0.6 ? "abrupt" : "gradual";
    }
    
    return { driftType, driftSeverity };
  };

  // Get previous topics
  const getPreviousTopics = (allChunks: ChunkData[], currentIndex: number): string[] => {
    if (currentIndex === 0) return [];
    
    const windowStart = Math.max(0, currentIndex - config.contextWindowSize);
    const previousTopics: string[] = [];
    
    for (let i = windowStart; i < currentIndex; i++) {
      const topics = detectTopicsInChunk(allChunks[i].content);
      topics.forEach(topic => {
        if (!previousTopics.includes(topic.name)) {
          previousTopics.push(topic.name);
        }
      });
    }
    
    return previousTopics;
  };

  // Analyze topic transitions
  const analyzeTopicTransitions = (currentTopics: DetectedTopic[], previousTopics: string[]): TopicTransition[] => {
    const transitions: TopicTransition[] = [];
    
    currentTopics.forEach(currentTopic => {
      previousTopics.forEach(prevTopic => {
        if (currentTopic.name !== prevTopic) {
          const transitionType = determineTransitionType(prevTopic, currentTopic.name);
          const strength = calculateTransitionStrength(prevTopic, currentTopic.name);
          const naturalness = calculateTransitionNaturalness(prevTopic, currentTopic.name);
          
          transitions.push({
            fromTopic: prevTopic,
            toTopic: currentTopic.name,
            transitionType,
            strength,
            naturalness,
            linguisticMarkers: findLinguisticMarkers(prevTopic, currentTopic.name),
            confidence: currentTopic.confidence
          });
        }
      });
    });
    
    return transitions;
  };

  // Calculate semantic shift
  const calculateSemanticShift = (chunk: ChunkData, allChunks: ChunkData[], index: number): SemanticShift => {
    if (index === 0) {
      return {
        magnitude: 0,
        direction: "forward",
        consistency: 1,
        embeddingDistance: 0,
        conceptualOverlap: 1
      };
    }
    
    const prevChunk = allChunks[index - 1];
    const semanticSimilarity = calculateSemanticSimilarity(chunk.content, prevChunk.content);
    const magnitude = 1 - semanticSimilarity;
    
    // Simplified direction calculation
    const direction = magnitude > 0.5 ? "chaotic" : "forward";
    
    // Calculate consistency over window
    let consistency = 1;
    if (index >= 2) {
      const windowSimilarities: number[] = [];
      for (let i = Math.max(1, index - config.contextWindowSize); i <= index; i++) {
        const sim = calculateSemanticSimilarity(allChunks[i].content, allChunks[i - 1].content);
        windowSimilarities.push(sim);
      }
      
      const avgSimilarity = windowSimilarities.reduce((sum, s) => sum + s, 0) / windowSimilarities.length;
      const variance = windowSimilarities.reduce((sum, s) => sum + Math.pow(s - avgSimilarity, 2), 0) / windowSimilarities.length;
      consistency = Math.max(0, 1 - Math.sqrt(variance));
    }
    
    return {
      magnitude,
      direction: direction as "forward" | "backward" | "lateral" | "chaotic",
      consistency,
      embeddingDistance: magnitude,
      conceptualOverlap: semanticSimilarity
    };
  };

  // Analyze coherence breakdown
  const analyzeCoherenceBreakdown = (content: string): CoherenceBreakdown => {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
    
    // Calculate different types of coherence
    const lexicalCoherence = calculateLexicalCoherence(sentences);
    const semanticCoherence = calculateSemanticCoherence(sentences);
    const topicalCoherence = calculateTopicalCoherence(sentences);
    const discourseCoherence = calculateDiscourseCoherence(content);
    
    const overallCoherence = (lexicalCoherence + semanticCoherence + topicalCoherence + discourseCoherence) / 4;
    
    // Find breakdown points
    const breakdownPoints: BreakdownPoint[] = [];
    sentences.forEach((sentence, index) => {
      if (index > 0) {
        const similarity = calculateSentenceSimilarity(sentences[index - 1], sentence);
        if (similarity < 0.3) {
          breakdownPoints.push({
            location: index,
            type: "semantic",
            severity: 1 - similarity,
            description: `Cümle ${index + 1}'de semantik kopukluk`
          });
        }
      }
    });
    
    return {
      lexicalCoherence,
      semanticCoherence,
      topicalCoherence,
      discourseCoherence,
      overallCoherence,
      breakdownPoints
    };
  };

  // Extract Turkish-specific topic features
  const extractTurkishTopicFeatures = (content: string): TurkishTopicFeature[] => {
    const features: TurkishTopicFeature[] = [];
    
    if (!config.enableTurkishFeatures) return features;
    
    // Check for discourse markers
    Object.values(turkishAcademicDomains).forEach(domain => {
      domain.discourseMarkers.forEach(marker => {
        if (content.toLowerCase().includes(marker)) {
          features.push({
            type: "discourse_marker",
            feature: marker,
            impact: "stabilizing",
            confidence: 0.8,
            examples: [marker]
          });
        }
      });
    });
    
    // Check for academic terminology
    const academicTerms = ["analiz", "sentez", "hipotez", "teori", "model", "yaklaşım", "yöntem"];
    academicTerms.forEach(term => {
      if (content.toLowerCase().includes(term)) {
        features.push({
          type: "academic_terminology",
          feature: term,
          impact: "stabilizing",
          confidence: 0.9,
          examples: [term]
        });
      }
    });
    
    // Check for register shifts
    const informalWords = ["çok", "falan", "işte", "yani", "hani"];
    const formalWords = ["oldukça", "nitekim", "dolayısıyla", "bununla birlikte"];
    
    const informalCount = informalWords.filter(word => content.toLowerCase().includes(word)).length;
    const formalCount = formalWords.filter(word => content.toLowerCase().includes(word)).length;
    
    if (informalCount > 0 && formalCount > 0) {
      features.push({
        type: "register_shift",
        feature: "mixed_register",
        impact: "destabilizing",
        confidence: 0.7,
        examples: [...informalWords.filter(w => content.toLowerCase().includes(w)), 
                  ...formalWords.filter(w => content.toLowerCase().includes(w))]
      });
    }
    
    return features;
  };

  // Generate drift alerts
  const generateDriftAlerts = (
    driftScore: number,
    driftType: string,
    driftSeverity: string,
    currentTopics: DetectedTopic[],
    previousTopics: string[]
  ): DriftAlert[] => {
    const alerts: DriftAlert[] = [];
    
    // Sudden shift alert
    if (driftType === "abrupt" && driftScore > 0.7) {
      alerts.push({
        type: "sudden_shift",
        severity: driftSeverity as "low" | "medium" | "high" | "critical",
        message: "Ani konu değişimi tespit edildi",
        location: { start: 0, end: 100 },
        confidence: driftScore,
        recommendations: [
          "Geçiş cümleleri ekleyin",
          "Bağlantı kelimelerini kullanın",
          "Konu değişimini yumuşatın"
        ]
      });
    }
    
    // Topic loss alert
    if (previousTopics.length > 0 && currentTopics.length === 0) {
      alerts.push({
        type: "topic_loss",
        severity: "high",
        message: "Konu kaybı tespit edildi",
        location: { start: 0, end: 100 },
        confidence: 0.9,
        recommendations: [
          "Ana konuya geri dönün",
          "Konu bütünlüğünü sağlayın"
        ]
      });
    }
    
    // Domain change alert
    if (currentTopics.length > 0 && previousTopics.length > 0) {
      const currentDomains = new Set(currentTopics.map(t => t.domain));
      const previousDomains = new Set(previousTopics);
      const overlap = new Set([...currentDomains].filter(x => previousDomains.has(x)));
      
      if (overlap.size === 0) {
        alerts.push({
          type: "domain_change",
          severity: "medium",
          message: "Alan değişimi tespit edildi",
          location: { start: 0, end: 100 },
          confidence: 0.8,
          recommendations: [
            "Alan geçişini açıklayın",
            "Bağlantıyı kurun"
          ]
        });
      }
    }
    
    return alerts;
  };

  // Calculate stability metrics
  const calculateStabilityMetrics = (chunk: ChunkData, allChunks: ChunkData[], index: number): StabilityMetric => {
    if (index === 0) {
      return {
        topicStability: 1,
        semanticStability: 1,
        lexicalStability: 1,
        discourseStability: 1,
        overallStability: 1,
        volatilityIndex: 0
      };
    }
    
    const windowStart = Math.max(0, index - config.contextWindowSize);
    const windowChunks = allChunks.slice(windowStart, index + 1);
    
    // Calculate topic stability
    const topicStability = calculateTopicStabilityInWindow(windowChunks);
    
    // Calculate semantic stability
    const semanticStability = calculateSemanticStabilityInWindow(windowChunks);
    
    // Calculate lexical stability
    const lexicalStability = calculateLexicalStabilityInWindow(windowChunks);
    
    // Calculate discourse stability
    const discourseStability = calculateDiscourseStabilityInWindow(windowChunks);
    
    const overallStability = (topicStability + semanticStability + lexicalStability + discourseStability) / 4;
    
    // Calculate volatility
    const volatilityIndex = 1 - overallStability;
    
    return {
      topicStability,
      semanticStability,
      lexicalStability,
      discourseStability,
      overallStability,
      volatilityIndex
    };
  };

  // Helper functions
  const calculateSemanticSimilarity = (text1: string, text2: string): number => {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  };

  const calculateLexicalSimilarity = (text1: string, text2: string): number => {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(w => words2.includes(w));
    const totalWords = Math.max(words1.length, words2.length);
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  };

  const calculateSentenceSimilarity = (sent1: string, sent2: string): number => {
    const words1 = new Set(sent1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(sent2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  };

  const determineTransitionType = (fromTopic: string, toTopic: string): "smooth" | "abrupt" | "bridged" | "disconnected" => {
    // Simplified logic - in real implementation, this would use domain knowledge
    const relatedDomains = {
      "biyoloji": ["kimya", "fizik"],
      "fizik": ["matematik", "kimya"],
      "kimya": ["biyoloji", "fizik"],
      "matematik": ["fizik"],
      "tarih": ["coğrafya"],
      "coğrafya": ["tarih"],
      "edebiyat": ["felsefe"],
      "felsefe": ["edebiyat"]
    };
    
    if (fromTopic === toTopic) return "smooth";
    if (relatedDomains[fromTopic as keyof typeof relatedDomains]?.includes(toTopic)) return "bridged";
    
    return Math.random() > 0.5 ? "abrupt" : "disconnected";
  };

  const calculateTransitionStrength = (fromTopic: string, toTopic: string): number => {
    // Simplified calculation
    return fromTopic === toTopic ? 1.0 : Math.random() * 0.8 + 0.1;
  };

  const calculateTransitionNaturalness = (fromTopic: string, toTopic: string): number => {
    // Simplified calculation
    return fromTopic === toTopic ? 1.0 : Math.random() * 0.6 + 0.2;
  };

  const findLinguisticMarkers = (fromTopic: string, toTopic: string): string[] => {
    const markers = ["ancak", "fakat", "öte yandan", "bu bağlamda", "diğer taraftan", "benzer şekilde"];
    return markers.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  const calculateLexicalCoherence = (sentences: string[]): number => {
    if (sentences.length < 2) return 1.0;
    
    let totalSimilarity = 0;
    for (let i = 1; i < sentences.length; i++) {
      totalSimilarity += calculateSentenceSimilarity(sentences[i - 1], sentences[i]);
    }
    
    return totalSimilarity / (sentences.length - 1);
  };

  const calculateSemanticCoherence = (sentences: string[]): number => {
    // Simplified semantic coherence calculation
    return calculateLexicalCoherence(sentences) * 0.8 + Math.random() * 0.2;
  };

  const calculateTopicalCoherence = (sentences: string[]): number => {
    // Check for topic consistency across sentences
    const allTopics: string[] = [];
    sentences.forEach(sentence => {
      const topics = detectTopicsInChunk(sentence);
      topics.forEach(topic => allTopics.push(topic.name));
    });
    
    const uniqueTopics = new Set(allTopics);
    return allTopics.length > 0 ? 1 - (uniqueTopics.size - 1) / allTopics.length : 1;
  };

  const calculateDiscourseCoherence = (content: string): number => {
    const discourseMarkers = ["ancak", "fakat", "öte yandan", "bu nedenle", "dolayısıyla", "ayrıca"];
    const markerCount = discourseMarkers.filter(marker => content.toLowerCase().includes(marker)).length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
    
    return sentences.length > 0 ? Math.min(1.0, markerCount / sentences.length * 3) : 0;
  };

  const calculateTopicStabilityInWindow = (windowChunks: ChunkData[]): number => {
    if (windowChunks.length < 2) return 1.0;
    
    const allTopics = windowChunks.map(chunk => detectTopicsInChunk(chunk.content));
    let stabilitySum = 0;
    
    for (let i = 1; i < allTopics.length; i++) {
      const prevTopicNames = new Set(allTopics[i - 1].map(t => t.name));
      const currTopicNames = new Set(allTopics[i].map(t => t.name));
      const intersection = new Set([...prevTopicNames].filter(x => currTopicNames.has(x)));
      const union = new Set([...prevTopicNames, ...currTopicNames]);
      
      stabilitySum += union.size > 0 ? intersection.size / union.size : 0;
    }
    
    return stabilitySum / (allTopics.length - 1);
  };

  const calculateSemanticStabilityInWindow = (windowChunks: ChunkData[]): number => {
    if (windowChunks.length < 2) return 1.0;
    
    let stabilitySum = 0;
    for (let i = 1; i < windowChunks.length; i++) {
      stabilitySum += calculateSemanticSimilarity(windowChunks[i - 1].content, windowChunks[i].content);
    }
    
    return stabilitySum / (windowChunks.length - 1);
  };

  const calculateLexicalStabilityInWindow = (windowChunks: ChunkData[]): number => {
    if (windowChunks.length < 2) return 1.0;
    
    let stabilitySum = 0;
    for (let i = 1; i < windowChunks.length; i++) {
      stabilitySum += calculateLexicalSimilarity(windowChunks[i - 1].content, windowChunks[i].content);
    }
    
    return stabilitySum / (windowChunks.length - 1);
  };

  const calculateDiscourseStabilityInWindow = (windowChunks: ChunkData[]): number => {
    const discourseScores = windowChunks.map(chunk => calculateDiscourseCoherence(chunk.content));
    const avgScore = discourseScores.reduce((sum, score) => sum + score, 0) / discourseScores.length;
    const variance = discourseScores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / discourseScores.length;
    
    return Math.max(0, 1 - Math.sqrt(variance));
  };

  // Calculate aggregate statistics
  const aggregateStats = useMemo(() => {
    if (driftResults.length === 0) return null;

    const avgDriftScore = driftResults.reduce((sum, r) => sum + r.driftScore, 0) / driftResults.length;
    const avgStability = driftResults.reduce((sum, r) => sum + r.stabilityMetrics.overallStability, 0) / driftResults.length;
    const avgCoherence = driftResults.reduce((sum, r) => sum + r.coherenceBreakdown.overallCoherence, 0) / driftResults.length;
    
    const criticalDrifts = driftResults.filter(r => r.driftSeverity === "critical").length;
    const highDrifts = driftResults.filter(r => r.driftSeverity === "high").length;
    const totalAlerts = driftResults.reduce((sum, r) => sum + r.driftAlerts.length, 0);
    
    const abruptDrifts = driftResults.filter(r => r.driftType === "abrupt").length;
    const gradualDrifts = driftResults.filter(r => r.driftType === "gradual").length;
    const chaoticDrifts = driftResults.filter(r => r.driftType === "chaotic").length;

    return {
      totalChunks: chunks.length,
      avgDriftScore,
      avgStability,
      avgCoherence,
      criticalDrifts,
      highDrifts,
      totalAlerts,
      abruptDrifts,
      gradualDrifts,
      chaoticDrifts,
      driftRate: (criticalDrifts + highDrifts) / driftResults.length,
      stabilityScore: avgStability * 100,
      coherenceScore: avgCoherence * 100
    };
  }, [driftResults, chunks.length]);

  // Prepare visualization data
  const visualizationData = useMemo(() => {
    return driftResults.map((result, index) => ({
      chunkIndex: index,
      driftScore: result.driftScore,
      stability: result.stabilityMetrics.overallStability,
      coherence: result.coherenceBreakdown.overallCoherence,
      topicCount: result.detectedTopics.length,
      alertCount: result.driftAlerts.length,
      driftType: result.driftType,
      severity: result.driftSeverity
    }));
  }, [driftResults]);

  const getDriftColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-600 bg-red-50 border-red-200";
      case "high": return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getDriftIcon = (type: string) => {
    switch (type) {
      case "abrupt": return <TrendingUp className="h-4 w-4" />;
      case "gradual": return <TrendingDown className="h-4 w-4" />;
      case "oscillating": return <Activity className="h-4 w-4" />;
      case "chaotic": return <Shuffle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  // Auto-detect when chunks change
  useEffect(() => {
    if (chunks.length > 0 && enableRealTimeDetection) {
      detectTopicDrift();
    }
  }, [chunks, config]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-6 w-6 text-orange-600" />
          <h2 className="text-2xl font-bold text-gray-900">Konu Sapması Tespit Sistemi</h2>
          {aggregateStats && (
            <Badge variant="outline" className="ml-2">
              %{aggregateStats.stabilityScore.toFixed(0)} Kararlılık
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isDetecting && (
            <Badge className="bg-orange-500 animate-pulse">
              <Brain className="h-3 w-3 mr-1" />
              Tespit Ediliyor
            </Badge>
          )}
          <Button
            onClick={detectTopicDrift}
            disabled={isDetecting || chunks.length === 0}
            size="sm"
          >
            {isDetecting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Tespit Ediliyor...
              </>
            ) : (
              <>
                <GitBranch className="mr-2 h-4 w-4" />
                Sapma Tespit Et
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {aggregateStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Kararlılık Skoru</p>
                  <p className="text-2xl font-bold text-green-600">
                    {aggregateStats.stabilityScore.toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    Tutarlılık: %{aggregateStats.coherenceScore.toFixed(0)}
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
                  <p className="text-sm text-gray-600">Kritik Sapma</p>
                  <p className="text-2xl font-bold text-red-600">
                    {aggregateStats.criticalDrifts}
                  </p>
                  <p className="text-xs text-gray-500">
                    Yüksek: {aggregateStats.highDrifts}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ani Sapma</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {aggregateStats.abruptDrifts}
                  </p>
                  <p className="text-xs text-gray-500">
                    Kademeli: {aggregateStats.gradualDrifts}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Uyarı</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {aggregateStats.totalAlerts}
                  </p>
                  <p className="text-xs text-gray-500">
                    Sapma Oranı: %{(aggregateStats.driftRate * 100).toFixed(0)}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Test Senaryoları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testScenarios.map((scenario, index) => (
              <div key={index} className="border rounded p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm">{scenario.name}</div>
                  <Badge className={`${getDriftColor(scenario.severity)} border text-xs`}>
                    {scenario.severity === "critical" ? "Kritik" :
                     scenario.severity === "high" ? "Yüksek" :
                     scenario.severity === "medium" ? "Orta" : "Düşük"}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600 mb-3">{scenario.description}</div>
                <div className="flex items-center gap-2">
                  {getDriftIcon(scenario.type)}
                  <span className="text-xs text-gray-500 capitalize">{scenario.type}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="detection" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Tespit Sonuçları
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Microscope className="h-4 w-4" />
            Detaylı Analiz
          </TabsTrigger>
          <TabsTrigger value="visualization" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Görselleştirme
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Uyarılar
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Ayarlar
          </TabsTrigger>
        </TabsList>

        {/* Detection Results Tab */}
        <TabsContent value="detection" className="space-y-6">
          {driftResults.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz Konu Sapması Tespiti Yapılmadı
                </h3>
                <p className="text-gray-500 mb-4">
                  Konu sapması tespitini başlatmak için "Sapma Tespit Et" butonuna tıklayın.
                </p>
                <Button
                  onClick={detectTopicDrift}
                  disabled={chunks.length === 0}
                >
                  <GitBranch className="mr-2 h-4 w-4" />
                  Tespiti Başlat
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {driftResults.map((result, index) => (
                <Card key={result.chunkId} className="transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">Chunk #{result.chunkIndex + 1}</Badge>
                        <div>
                          <div className="font-semibold">
                            Sapma Skoru: {(result.driftScore * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500">
                            Kararlılık: {(result.stabilityMetrics.overallStability * 100).toFixed(0)}% | 
                            Tutarlılık: {(result.coherenceBreakdown.overallCoherence * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getDriftColor(result.driftSeverity)} border`}>
                          {getDriftIcon(result.driftType)}
                          {result.driftSeverity === "critical" ? "Kritik" :
                           result.driftSeverity === "high" ? "Yüksek" :
                           result.driftSeverity === "medium" ? "Orta" : "Düşük"}
                        </Badge>
                        {result.driftAlerts.length > 0 && (
                          <Badge className="text-red-600 bg-red-50 border-red-200">
                            {result.driftAlerts.length} Uyarı
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Detected Topics */}
                    {result.detectedTopics.length > 0 && (
                      <div className="bg-blue-50 rounded p-3">
                        <div className="text-sm font-medium text-blue-800 mb-2">
                          Tespit Edilen Konular:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.detectedTopics.map((topic, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-blue-100 text-blue-800">
                              {topic.name} ({(topic.confidence * 100).toFixed(0)}%)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Topic Transitions */}
                    {result.topicTransitions.length > 0 && (
                      <div className="bg-purple-50 rounded p-3">
                        <div className="text-sm font-medium text-purple-800 mb-2">
                          Konu Geçişleri:
                        </div>
                        <div className="space-y-1">
                          {result.topicTransitions.slice(0, 3).map((transition, idx) => (
                            <div key={idx} className="text-xs text-purple-700 flex items-center gap-2">
                              <span className="font-mono bg-purple-100 px-1 rounded">{transition.fromTopic}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span className="font-mono bg-purple-200 px-1 rounded">{transition.toTopic}</span>
                              <Badge variant="outline" className="text-xs">
                                {transition.transitionType}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Turkish Features */}
                    {result.turkishTopicFeatures.length > 0 && (
                      <div className="bg-green-50 rounded p-3">
                        <div className="text-sm font-medium text-green-800 mb-2">
                          Türkçe Özellikler:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {result.turkishTopicFeatures.map((feature, idx) => (
                            <Badge key={idx} variant="outline" className={`text-xs ${
                              feature.impact === "stabilizing" ? "bg-green-100 text-green-800" :
                              feature.impact === "destabilizing" ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {feature.feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Drift Alerts */}
                    {result.driftAlerts.length > 0 && (
                      <div className="bg-red-50 rounded p-3">
                        <div className="text-sm font-medium text-red-800 mb-2">
                          Sapma Uyarıları:
                        </div>
                        <div className="space-y-2">
                          {result.driftAlerts.map((alert, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="text-xs text-red-700">{alert.message}</span>
                              <Badge variant="outline" className={`text-xs ${getDriftColor(alert.severity)}`}>
                                {alert.severity === "critical" ? "Kritik" :
                                 alert.severity === "high" ? "Yüksek" :
                                 alert.severity === "medium" ? "Orta" : "Düşük"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stability Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-sm font-bold text-blue-600">
                          {(result.stabilityMetrics.topicStability * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-blue-700">Konu Kararlılığı</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-sm font-bold text-green-600">
                          {(result.stabilityMetrics.semanticStability * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-green-700">Semantik Kararlılık</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="text-sm font-bold text-purple-600">
                          {(result.stabilityMetrics.lexicalStability * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-purple-700">Sözcüksel Kararlılık</div>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 rounded">
                        <div className="text-sm font-bold text-yellow-600">
                          {(result.stabilityMetrics.discourseStability * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-yellow-700">Söylem Kararlılığı</div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                      onClick={() => setShowDetails(prev => ({
                        ...prev,
                        [result.chunkId]: !prev[result.chunkId]
                      }))}
                    >
                      {showDetails[result.chunkId] ? (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Detayları Gizle
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Detayları Göster
                        </>
                      )}
                    </Button>

                    {/* Detailed View */}
                    {showDetails[result.chunkId] && (
                      <div className="space-y-4 border-t pt-4">
                        {/* Semantic Shift Details */}
                        <div className="bg-gray-50 rounded p-4">
                          <h4 className="font-medium text-gray-800 mb-2">Semantik Kayma Analizi</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <div className="text-gray-600">Büyüklük:</div>
                              <div className="font-medium">{(result.semanticShift.magnitude * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Yön:</div>
                              <div className="font-medium capitalize">{result.semanticShift.direction}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Tutarlılık:</div>
                              <div className="font-medium">{(result.semanticShift.consistency * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Kavramsal Örtüşme:</div>
                              <div className="font-medium">{(result.semanticShift.conceptualOverlap * 100).toFixed(0)}%</div>
                            </div>
                          </div>
                        </div>

                        {/* Coherence Breakdown */}
                        <div className="bg-yellow-50 rounded p-4">
                          <h4 className="font-medium text-yellow-800 mb-2">Tutarlılık Analizi</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <div className="text-yellow-700">Sözcüksel:</div>
                              <div className="font-medium">{(result.coherenceBreakdown.lexicalCoherence * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="text-yellow-700">Semantik:</div>
                              <div className="font-medium">{(result.coherenceBreakdown.semanticCoherence * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="text-yellow-700">Konusal:</div>
                              <div className="font-medium">{(result.coherenceBreakdown.topicalCoherence * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="text-yellow-700">Söylemsel:</div>
                              <div className="font-medium">{(result.coherenceBreakdown.discourseCoherence * 100).toFixed(0)}%</div>
                            </div>
                          </div>
                        </div>

                        {/* Content Preview */}
                        <div className="bg-gray-100 rounded p-4">
                          <h4 className="font-medium text-gray-800 mb-2">Chunk İçeriği</h4>
                          <div className="text-xs text-gray-700 leading-relaxed max-h-32 overflow-y-auto">
                            {chunks.find(c => c.id === result.chunkId)?.content.substring(0, 500)}...
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {aggregateStats ? (
            <div className="space-y-6">
              {/* Overall Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Güçlü Yönler
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {aggregateStats.avgStability > 0.8 && (
                        <li className="text-green-700">• Yüksek genel kararlılık</li>
                      )}
                      {aggregateStats.avgCoherence > 0.75 && (
                        <li className="text-green-700">• İyi tutarlılık skoru</li>
                      )}
                      {aggregateStats.criticalDrifts === 0 && (
                        <li className="text-green-700">• Kritik sapma yok</li>
                      )}
                      {aggregateStats.abruptDrifts < aggregateStats.totalChunks * 0.2 && (
                        <li className="text-green-700">• Az ani sapma</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      İyileştirme Alanları
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {aggregateStats.criticalDrifts > 0 && (
                        <li className="text-red-700">• {aggregateStats.criticalDrifts} kritik sapma mevcut</li>
                      )}
                      {aggregateStats.avgStability < 0.6 && (
                        <li className="text-red-700">• Düşük kararlılık skoru</li>
                      )}
                      {aggregateStats.chaoticDrifts > 0 && (
                        <li className="text-red-700">• {aggregateStats.chaoticDrifts} kaotik sapma</li>
                      )}
                      {aggregateStats.driftRate > 0.5 && (
                        <li className="text-red-700">• Yüksek sapma oranı (%{(aggregateStats.driftRate * 100).toFixed(0)})</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Detaylı Metrikler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {(aggregateStats.avgDriftScore * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-blue-700">Ortalama Sapma</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {aggregateStats.stabilityScore.toFixed(0)}%
                      </div>
                      <div className="text-sm text-green-700">Kararlılık Skoru</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded">
                      <div className="text-2xl font-bold text-purple-600">
                        {aggregateStats.coherenceScore.toFixed(0)}%
                      </div>
                      <div className="text-sm text-purple-700">Tutarlılık Skoru</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded">
                      <div className="text-2xl font-bold text-orange-600">
                        {(aggregateStats.driftRate * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-orange-700">Sapma Oranı</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Öneriler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-blue-50 rounded p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Genel Öneriler</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Chunk sınırlarını konu bütünlüğüne göre ayarlayın</li>
                        <li>• Konu geçişlerinde bağlantı cümleleri kullanın</li>
                        <li>• Türkçe söylem işaretçilerini tutarlı kullanın</li>
                        <li>• Akademik terminolojiyi koruyun</li>
                      </ul>
                    </div>
                    
                    {aggregateStats.criticalDrifts > 0 && (
                      <div className="bg-red-50 rounded p-4">
                        <h4 className="font-medium text-red-800 mb-2">Kritik Sapma Önerileri</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          <li>• Ani konu değişimlerini yumuşatın</li>
                          <li>• Geçiş paragrafları ekleyin</li>
                          <li>• Konu bağlantılarını açıklayın</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Microscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz Analiz Mevcut Değil
                </h3>
                <p className="text-gray-500">
                  Detaylı analizi görmek için önce konu sapması tespiti yapın.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Visualization Tab */}
        <TabsContent value="visualization" className="space-y-6">
          {showVisualization && visualizationData.length > 0 ? (
            <div className="space-y-6">
              {/* Drift Score Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Sapma Skoru Zaman Çizelgesi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={visualizationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="chunkIndex" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="driftScore" 
                        stroke="#f97316" 
                        strokeWidth={3}
                        name="Sapma Skoru"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="stability" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Kararlılık"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="coherence" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Tutarlılık"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Drift Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Sapma Türü Dağılımı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { type: "Ani", count: aggregateStats?.abruptDrifts || 0 },
                      { type: "Kademeli", count: aggregateStats?.gradualDrifts || 0 },
                      { type: "Kaotik", count: aggregateStats?.chaoticDrifts || 0 },
                      { type: "Salınımlı", count: driftResults.filter(r => r.driftType === "oscillating").length }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Topic Count vs Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Konu Sayısı vs Uyarılar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={visualizationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="chunkIndex" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="topicCount" 
                        stackId="1"
                        stroke="#8b5cf6" 
                        fill="#8b5cf6"
                        name="Konu Sayısı"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="alertCount" 
                        stackId="2"
                        stroke="#ef4444" 
                        fill="#ef4444"
                        name="Uyarı Sayısı"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Görselleştirme Mevcut Değil
                </h3>
                <p className="text-gray-500">
                  Görselleştirme için önce konu sapması tespiti yapın.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          {driftResults.length > 0 ? (
            <div className="space-y-4">
              {driftResults
                .filter(result => result.driftAlerts.length > 0)
                .map((result, index) => (
                <Card key={result.chunkId}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">Chunk #{result.chunkIndex + 1} Uyarıları</div>
                      <Badge className="text-red-600 bg-red-50 border-red-200">
                        {result.driftAlerts.length} Uyarı
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.driftAlerts.map((alert, alertIndex) => (
                        <div key={alertIndex} className="border-l-4 border-red-400 pl-4 py-2">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-red-800">{alert.message}</div>
                            <Badge className={`${getDriftColor(alert.severity)} border`}>
                              {alert.severity === "critical" ? "Kritik" :
                               alert.severity === "high" ? "Yüksek" :
                               alert.severity === "medium" ? "Orta" : "Düşük"}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            Güven: {(alert.confidence * 100).toFixed(0)}%
                          </div>
                          {alert.recommendations.length > 0 && (
                            <div className="bg-yellow-50 rounded p-2">
                              <div className="text-sm font-medium text-yellow-800 mb-1">Öneriler:</div>
                              <ul className="text-xs text-yellow-700 space-y-1">
                                {alert.recommendations.map((rec, recIndex) => (
                                  <li key={recIndex}>• {rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz Uyarı Mevcut Değil
                </h3>
                <p className="text-gray-500">
                  Uyarıları görmek için önce konu sapması tespiti yapın.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Tespit Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="sensitivity">Hassasiyet Seviyesi</Label>
                    <select
                      id="sensitivity"
                      value={config.sensitivityLevel}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        sensitivityLevel: e.target.value as "low" | "medium" | "high" | "ultra"
                      }))}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    >
                      <option value="low">Düşük</option>
                      <option value="medium">Orta</option>
                      <option value="high">Yüksek</option>
                      <option value="ultra">Ultra</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="drift-threshold">
                      Sapma Eşiği ({config.driftThreshold})
                    </Label>
                    <input
                      id="drift-threshold"
                      type="range"
                      min="0.3"
                      max="0.9"
                      step="0.1"
                      value={config.driftThreshold}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        driftThreshold: parseFloat(e.target.value)
                      }))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="coherence-threshold">
                      Tutarlılık Eşiği ({config.coherenceThreshold})
                    </Label>
                    <input
                      id="coherence-threshold"
                      type="range"
                      min="0.4"
                      max="0.9"
                      step="0.1"
                      value={config.coherenceThreshold}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        coherenceThreshold: parseFloat(e.target.value)
                      }))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Semantik Analiz</Label>
                      <p className="text-sm text-gray-500">
                        Semantik benzerlik analizi yap
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enableSemanticAnalysis}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        enableSemanticAnalysis: e.target.checked
                      }))}
                      className="w-4 h-4 text-orange-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Konu Modelleme</Label>
                      <p className="text-sm text-gray-500">
                        Konu modelleme analizi yap
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enableTopicModeling}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        enableTopicModeling: e.target.checked
                      }))}
                      className="w-4 h-4 text-orange-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Tutarlılık Analizi</Label>
                      <p className="text-sm text-gray-500">
                        Tutarlılık analizi yap
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enableCoherenceAnalysis}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        enableCoherenceAnalysis: e.target.checked
                      }))}
                      className="w-4 h-4 text-orange-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Türkçe Özellikler</Label>
                      <p className="text-sm text-gray-500">
                        Türkçe dil özelliklerini analiz et
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enableTurkishFeatures}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        enableTurkishFeatures: e.target.checked
                      }))}
                      className="w-4 h-4 text-orange-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Gerçek Zamanlı Uyarılar</Label>
                      <p className="text-sm text-gray-500">
                        Anlık uyarı bildirimleri
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enableRealTimeAlerts}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        enableRealTimeAlerts: e.target.checked
                      }))}
                      className="w-4 h-4 text-orange-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="context-window">Bağlam Pencere Boyutu</Label>
                <Input
                  id="context-window"
                  type="number"
                  min="1"
                  max="10"
                  value={config.contextWindowSize}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    contextWindowSize: parseInt(e.target.value) || 3
                  }))}
                />
              </div>

              <Button
                onClick={detectTopicDrift}
                disabled={isDetecting || chunks.length === 0}
                className="w-full"
              >
                Ayarları Uygula ve Tespit Et
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TopicDriftDetector;