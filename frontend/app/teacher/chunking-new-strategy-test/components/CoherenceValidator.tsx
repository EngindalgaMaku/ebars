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
  CheckCircle2,
  AlertTriangle,
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
  Link,
  Unlink,
  Layers,
  Hash,
  BookOpen,
  Microscope,
  Search,
  TrendingUp,
  TrendingDown,
  GitBranch,
  Network
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  AreaChart,
  Area
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

interface CoherenceValidationResult {
  chunkId: string;
  chunkIndex: number;
  coherenceScore: number;
  coherenceLevel: "excellent" | "good" | "fair" | "poor" | "broken";
  internalCoherence: number;
  externalCoherence: number;
  semanticContinuity: number;
  topicalConsistency: number;
  linguisticCoherence: number;
  coherenceIssues: CoherenceIssue[];
  turkishCoherenceFeatures: TurkishCoherenceFeature[];
  improvementSuggestions: string[];
  contextualLinks: ContextualLink[];
}

interface CoherenceIssue {
  type: "semantic_break" | "topic_shift" | "linguistic_inconsistency" | "reference_break" | "discourse_disruption";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  location: { start: number; end: number };
  examples: string[];
  confidence: number;
}

interface TurkishCoherenceFeature {
  type: "discourse_markers" | "morphological_consistency" | "vowel_harmony" | "suffix_patterns" | "register_consistency";
  score: number;
  description: string;
  examples: string[];
  impact: "positive" | "neutral" | "negative";
}

interface ContextualLink {
  type: "anaphoric" | "cataphoric" | "lexical" | "semantic" | "temporal" | "causal";
  strength: number;
  description: string;
  sourceChunk: string;
  targetChunk: string;
}

interface CoherenceConfig {
  internalCoherenceWeight: number;
  externalCoherenceWeight: number;
  semanticContinuityWeight: number;
  topicalConsistencyWeight: number;
  linguisticCoherenceWeight: number;
  enableTurkishFeatures: boolean;
  coherenceThreshold: number;
  contextWindowSize: number;
  enableDeepAnalysis: boolean;
}

interface CoherenceValidatorProps {
  chunks: ChunkData[];
  originalText: string;
  onCoherenceValidated?: (result: CoherenceValidationResult) => void;
  onValidationComplete?: (results: CoherenceValidationResult[]) => void;
  enableRealTimeValidation?: boolean;
  showVisualization?: boolean;
  turkishOptimized?: boolean;
}

const CoherenceValidator: React.FC<CoherenceValidatorProps> = ({
  chunks,
  originalText,
  onCoherenceValidated,
  onValidationComplete,
  enableRealTimeValidation = true,
  showVisualization = true,
  turkishOptimized = true
}) => {
  const [activeTab, setActiveTab] = useState<"validation" | "visualization" | "analysis" | "settings">("validation");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<CoherenceValidationResult[]>([]);
  const [selectedChunk, setSelectedChunk] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  
  const [config, setConfig] = useState<CoherenceConfig>({
    internalCoherenceWeight: 0.25,
    externalCoherenceWeight: 0.25,
    semanticContinuityWeight: 0.2,
    topicalConsistencyWeight: 0.15,
    linguisticCoherenceWeight: 0.15,
    enableTurkishFeatures: turkishOptimized,
    coherenceThreshold: 0.7,
    contextWindowSize: 3,
    enableDeepAnalysis: true
  });

  // Turkish discourse markers and linguistic features
  const turkishDiscourseMarkers = {
    additive: ["ve", "ayrıca", "bunun yanında", "hem de", "üstelik"],
    adversative: ["ancak", "fakat", "lakin", "ama", "bununla birlikte", "oysa"],
    causal: ["çünkü", "zira", "bu nedenle", "dolayısıyla", "bu yüzden"],
    temporal: ["sonra", "daha sonra", "ardından", "önce", "şimdi", "o zaman"],
    conclusive: ["sonuç olarak", "özetle", "kısacası", "böylece", "netice olarak"],
    exemplification: ["örneğin", "mesela", "şöyle ki", "nitekim", "başka bir deyişle"]
  };

  const turkishMorphologicalPatterns = [
    /([aeiouöü])([bcçdfgğhjklmnprsştuvyz]+)([aeiouöü])/g, // Vowel harmony patterns
    /(lar|ler)$/g, // Plural suffixes
    /(da|de|ta|te)$/g, // Locative suffixes
    /(dan|den|tan|ten)$/g, // Ablative suffixes
    /(ın|in|un|ün)$/g, // Genitive suffixes
  ];

  // Validate coherence
  const validateCoherence = async () => {
    if (chunks.length === 0) return;

    setIsValidating(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2500));

      const results: CoherenceValidationResult[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Calculate internal coherence
        const internalCoherence = calculateInternalCoherence(chunk.content);
        
        // Calculate external coherence (with neighboring chunks)
        const externalCoherence = calculateExternalCoherence(chunk, chunks, i);
        
        // Calculate semantic continuity
        const semanticContinuity = calculateSemanticContinuity(chunk, chunks, i);
        
        // Calculate topical consistency
        const topicalConsistency = calculateTopicalConsistency(chunk, chunks, i);
        
        // Calculate linguistic coherence
        const linguisticCoherence = calculateLinguisticCoherence(chunk.content);
        
        // Calculate overall coherence score
        const coherenceScore = calculateOverallCoherence({
          internalCoherence,
          externalCoherence,
          semanticContinuity,
          topicalConsistency,
          linguisticCoherence
        });
        
        // Determine coherence level
        const coherenceLevel = determineCoherenceLevel(coherenceScore);
        
        // Detect coherence issues
        const coherenceIssues = detectCoherenceIssues(chunk, chunks, i);
        
        // Analyze Turkish-specific features
        const turkishFeatures = analyzeTurkishCoherenceFeatures(chunk.content);
        
        // Generate improvement suggestions
        const suggestions = generateImprovementSuggestions(
          coherenceScore,
          coherenceIssues,
          turkishFeatures
        );
        
        // Find contextual links
        const contextualLinks = findContextualLinks(chunk, chunks, i);

        const result: CoherenceValidationResult = {
          chunkId: chunk.id,
          chunkIndex: i,
          coherenceScore,
          coherenceLevel,
          internalCoherence,
          externalCoherence,
          semanticContinuity,
          topicalConsistency,
          linguisticCoherence,
          coherenceIssues,
          turkishCoherenceFeatures: turkishFeatures,
          improvementSuggestions: suggestions,
          contextualLinks
        };

        results.push(result);

        // Real-time callback
        if (enableRealTimeValidation && onCoherenceValidated) {
          onCoherenceValidated(result);
        }
      }

      setValidationResults(results);
      
      if (onValidationComplete) {
        onValidationComplete(results);
      }

    } catch (error) {
      console.error("Coherence validation failed:", error);
    } finally {
      setIsValidating(false);
    }
  };

  // Calculate internal coherence
  const calculateInternalCoherence = (content: string): number => {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
    if (sentences.length < 2) return 1.0;

    let coherenceSum = 0;
    for (let i = 0; i < sentences.length - 1; i++) {
      const similarity = calculateSentenceSimilarity(sentences[i], sentences[i + 1]);
      coherenceSum += similarity;
    }

    return coherenceSum / (sentences.length - 1);
  };

  // Calculate external coherence
  const calculateExternalCoherence = (chunk: ChunkData, allChunks: ChunkData[], index: number): number => {
    let coherenceSum = 0;
    let comparisons = 0;

    // Compare with previous chunks
    for (let i = Math.max(0, index - config.contextWindowSize); i < index; i++) {
      const similarity = calculateChunkSimilarity(chunk.content, allChunks[i].content);
      coherenceSum += similarity;
      comparisons++;
    }

    // Compare with next chunks
    for (let i = index + 1; i < Math.min(allChunks.length, index + config.contextWindowSize + 1); i++) {
      const similarity = calculateChunkSimilarity(chunk.content, allChunks[i].content);
      coherenceSum += similarity;
      comparisons++;
    }

    return comparisons > 0 ? coherenceSum / comparisons : 0.5;
  };

  // Calculate semantic continuity
  const calculateSemanticContinuity = (chunk: ChunkData, allChunks: ChunkData[], index: number): number => {
    if (index === 0) return 1.0;

    const previousChunk = allChunks[index - 1];
    const currentTopics = extractTopics(chunk.content);
    const previousTopics = extractTopics(previousChunk.content);

    const topicOverlap = calculateTopicOverlap(currentTopics, previousTopics);
    const lexicalCohesion = calculateLexicalCohesion(chunk.content, previousChunk.content);
    
    return (topicOverlap + lexicalCohesion) / 2;
  };

  // Calculate topical consistency
  const calculateTopicalConsistency = (chunk: ChunkData, allChunks: ChunkData[], index: number): number => {
    const chunkTopics = extractTopics(chunk.content);
    let consistencySum = 0;
    let comparisons = 0;

    // Compare with surrounding chunks
    const start = Math.max(0, index - 2);
    const end = Math.min(allChunks.length, index + 3);

    for (let i = start; i < end; i++) {
      if (i !== index) {
        const otherTopics = extractTopics(allChunks[i].content);
        const overlap = calculateTopicOverlap(chunkTopics, otherTopics);
        consistencySum += overlap;
        comparisons++;
      }
    }

    return comparisons > 0 ? consistencySum / comparisons : 0.5;
  };

  // Calculate linguistic coherence
  const calculateLinguisticCoherence = (content: string): number => {
    let score = 0.5; // Base score

    // Check for discourse markers
    const discourseMarkerScore = calculateDiscourseMarkerScore(content);
    score += discourseMarkerScore * 0.3;

    // Check for pronoun usage and anaphoric references
    const anaphoricScore = calculateAnaphoricScore(content);
    score += anaphoricScore * 0.2;

    // Check for lexical repetition and variation
    const lexicalScore = calculateLexicalVariationScore(content);
    score += lexicalScore * 0.2;

    // Check for sentence structure consistency
    const structuralScore = calculateStructuralConsistencyScore(content);
    score += structuralScore * 0.3;

    return Math.min(1.0, score);
  };

  // Helper functions
  const calculateSentenceSimilarity = (sent1: string, sent2: string): number => {
    const words1 = new Set(sent1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(sent2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  };

  const calculateChunkSimilarity = (content1: string, content2: string): number => {
    const words1 = new Set(content1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(content2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  };

  const extractTopics = (content: string): string[] => {
    const words = content.toLowerCase().split(/\s+/);
    const topics: string[] = [];

    // Academic domain detection
    const domains = {
      "biyoloji": ["hücre", "organizma", "gen", "dna", "protein", "enzim"],
      "fizik": ["kuvvet", "enerji", "hareket", "newton", "elektrik", "manyetik"],
      "kimya": ["reaksiyon", "molekül", "atom", "element", "bileşik", "asit"],
      "matematik": ["denklem", "formül", "hesap", "geometri", "algebra", "integral"],
      "tarih": ["dönem", "olay", "kültür", "medeniyet", "savaş", "devlet"],
      "coğrafya": ["harita", "iklim", "bölge", "şehir", "dağ", "nehir"]
    };

    Object.entries(domains).forEach(([domain, keywords]) => {
      if (keywords.some(keyword => words.includes(keyword))) {
        topics.push(domain);
      }
    });

    return topics.length > 0 ? topics : ["genel"];
  };

  const calculateTopicOverlap = (topics1: string[], topics2: string[]): number => {
    const set1 = new Set(topics1);
    const set2 = new Set(topics2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  };

  const calculateLexicalCohesion = (content1: string, content2: string): number => {
    const words1 = content1.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const words2 = content2.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    
    const commonWords = words1.filter(w => words2.includes(w));
    const totalWords = Math.max(words1.length, words2.length);
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  };

  const calculateDiscourseMarkerScore = (content: string): number => {
    const words = content.toLowerCase().split(/\s+/);
    let markerCount = 0;
    
    Object.values(turkishDiscourseMarkers).forEach(markers => {
      markers.forEach(marker => {
        if (words.includes(marker)) {
          markerCount++;
        }
      });
    });
    
    return Math.min(1.0, markerCount / 10);
  };

  const calculateAnaphoricScore = (content: string): number => {
    const pronouns = ["bu", "şu", "o", "bunlar", "şunlar", "onlar", "burada", "şurada", "orada"];
    const words = content.toLowerCase().split(/\s+/);
    const pronounCount = words.filter(w => pronouns.includes(w)).length;
    
    return Math.min(1.0, pronounCount / words.length * 10);
  };

  const calculateLexicalVariationScore = (content: string): number => {
    const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const uniqueWords = new Set(words);
    
    return words.length > 0 ? uniqueWords.size / words.length : 0;
  };

  const calculateStructuralConsistencyScore = (content: string): number => {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
    if (sentences.length < 2) return 1.0;
    
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    const variance = sentences.reduce((sum, s) => sum + Math.pow(s.length - avgLength, 2), 0) / sentences.length;
    const coefficient = Math.sqrt(variance) / avgLength;
    
    return Math.max(0, 1 - coefficient);
  };

  const calculateOverallCoherence = (scores: {
    internalCoherence: number;
    externalCoherence: number;
    semanticContinuity: number;
    topicalConsistency: number;
    linguisticCoherence: number;
  }): number => {
    return (
      scores.internalCoherence * config.internalCoherenceWeight +
      scores.externalCoherence * config.externalCoherenceWeight +
      scores.semanticContinuity * config.semanticContinuityWeight +
      scores.topicalConsistency * config.topicalConsistencyWeight +
      scores.linguisticCoherence * config.linguisticCoherenceWeight
    );
  };

  const determineCoherenceLevel = (score: number): "excellent" | "good" | "fair" | "poor" | "broken" => {
    if (score >= 0.9) return "excellent";
    if (score >= 0.75) return "good";
    if (score >= 0.6) return "fair";
    if (score >= 0.4) return "poor";
    return "broken";
  };

  const detectCoherenceIssues = (chunk: ChunkData, allChunks: ChunkData[], index: number): CoherenceIssue[] => {
    const issues: CoherenceIssue[] = [];

    // Check for semantic breaks
    if (index > 0) {
      const prevChunk = allChunks[index - 1];
      const similarity = calculateChunkSimilarity(chunk.content, prevChunk.content);
      if (similarity < 0.3) {
        issues.push({
          type: "semantic_break",
          severity: similarity < 0.1 ? "critical" : "high",
          description: "Önceki chunk ile semantik kopukluk",
          location: { start: 0, end: 50 },
          examples: [chunk.content.substring(0, 100)],
          confidence: 1 - similarity
        });
      }
    }

    // Check for topic shifts
    const topics = extractTopics(chunk.content);
    if (index > 0) {
      const prevTopics = extractTopics(allChunks[index - 1].content);
      const topicOverlap = calculateTopicOverlap(topics, prevTopics);
      if (topicOverlap < 0.2) {
        issues.push({
          type: "topic_shift",
          severity: topicOverlap < 0.1 ? "high" : "medium",
          description: "Ani konu değişimi",
          location: { start: 0, end: chunk.content.length },
          examples: [`Önceki: ${prevTopics.join(", ")}`, `Şimdiki: ${topics.join(", ")}`],
          confidence: 1 - topicOverlap
        });
      }
    }

    // Check for linguistic inconsistencies
    const discourseScore = calculateDiscourseMarkerScore(chunk.content);
    if (discourseScore < 0.1) {
      issues.push({
        type: "linguistic_inconsistency",
        severity: "medium",
        description: "Söylem işaretçisi eksikliği",
        location: { start: 0, end: chunk.content.length },
        examples: ["Bağlantı kelimeleri eksik"],
        confidence: 0.7
      });
    }

    return issues;
  };

  const analyzeTurkishCoherenceFeatures = (content: string): TurkishCoherenceFeature[] => {
    const features: TurkishCoherenceFeature[] = [];

    if (!config.enableTurkishFeatures) return features;

    // Analyze discourse markers
    const discourseScore = calculateDiscourseMarkerScore(content);
    features.push({
      type: "discourse_markers",
      score: discourseScore,
      description: "Söylem işaretçisi kullanımı",
      examples: findDiscourseMarkers(content),
      impact: discourseScore > 0.5 ? "positive" : discourseScore > 0.2 ? "neutral" : "negative"
    });

    // Analyze morphological consistency
    const morphScore = analyzeMorphologicalConsistency(content);
    features.push({
      type: "morphological_consistency",
      score: morphScore,
      description: "Morfolojik tutarlılık",
      examples: findMorphologicalPatterns(content),
      impact: morphScore > 0.7 ? "positive" : morphScore > 0.4 ? "neutral" : "negative"
    });

    // Analyze vowel harmony
    const vowelScore = analyzeVowelHarmony(content);
    features.push({
      type: "vowel_harmony",
      score: vowelScore,
      description: "Ünlü uyumu",
      examples: findVowelHarmonyExamples(content),
      impact: vowelScore > 0.8 ? "positive" : vowelScore > 0.6 ? "neutral" : "negative"
    });

    return features;
  };

  const findDiscourseMarkers = (content: string): string[] => {
    const words = content.toLowerCase().split(/\s+/);
    const found: string[] = [];
    
    Object.values(turkishDiscourseMarkers).forEach(markers => {
      markers.forEach(marker => {
        if (words.includes(marker)) {
          found.push(marker);
        }
      });
    });
    
    return [...new Set(found)].slice(0, 5);
  };

  const analyzeMorphologicalConsistency = (content: string): number => {
    const words = content.split(/\s+/);
    let consistentPatterns = 0;
    let totalPatterns = 0;

    turkishMorphologicalPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        totalPatterns += matches.length;
        consistentPatterns += matches.length; // Simplified - assume all matches are consistent
      }
    });

    return totalPatterns > 0 ? consistentPatterns / totalPatterns : 0.5;
  };

  const findMorphologicalPatterns = (content: string): string[] => {
    const examples: string[] = [];
    
    turkishMorphologicalPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        examples.push(...matches.slice(0, 2));
      }
    });
    
    return [...new Set(examples)].slice(0, 5);
  };

  const analyzeVowelHarmony = (content: string): number => {
    const words = content.split(/\s+/).filter(w => w.length > 3);
    let harmoniousWords = 0;
    
    words.forEach(word => {
      if (checkVowelHarmony(word)) {
        harmoniousWords++;
      }
    });
    
    return words.length > 0 ? harmoniousWords / words.length : 0.5;
  };

  const checkVowelHarmony = (word: string): boolean => {
    const frontVowels = ['e', 'i', 'ö', 'ü'];
    const backVowels = ['a', 'ı', 'o', 'u'];
    
    const vowels = word.toLowerCase().split('').filter(char => 
      frontVowels.includes(char) || backVowels.includes(char)
    );
    
    if (vowels.length < 2) return true;
    
    const firstVowelType = frontVowels.includes(vowels[0]) ? 'front' : 'back';
    
    return vowels.every(vowel => {
      const vowelType = frontVowels.includes(vowel) ? 'front' : 'back';
      return vowelType === firstVowelType;
    });
  };

  const findVowelHarmonyExamples = (content: string): string[] => {
    const words = content.split(/\s+/).filter(w => w.length > 3);
    const examples: string[] = [];
    
    words.forEach(word => {
      if (checkVowelHarmony(word)) {
        examples.push(word);
      }
    });
    
    return examples.slice(0, 5);
  };

  const generateImprovementSuggestions = (
    score: number,
    issues: CoherenceIssue[],
    turkishFeatures: TurkishCoherenceFeature[]
  ): string[] => {
    const suggestions: string[] = [];

    if (score < 0.6) {
      suggestions.push("Genel tutarlılığı artırmak için chunk sınırlarını gözden geçirin");
    }

    issues.forEach(issue => {
      switch (issue.type) {
        case "semantic_break":
          suggestions.push("Semantik kopukluğu gidermek için geçiş cümleleri ekleyin");
          break;
        case "topic_shift":
          suggestions.push("Konu değişimlerini yumuşatmak için bağlantı ifadeleri kullanın");
          break;
        case "linguistic_inconsistency":
          suggestions.push("Söylem işaretçilerini daha tutarlı kullanın");
          break;
        case "reference_break":
          suggestions.push("Referans bütünlüğünü koruyun");
          break;
        case "discourse_disruption":
          suggestions.push("Söylem akışını düzeltin");
          break;
      }
    });

    turkishFeatures.forEach(feature => {
      if (feature.impact === "negative") {
        switch (feature.type) {
          case "discourse_markers":
            suggestions.push("Türkçe bağlaç ve geçiş kelimelerini artırın");
            break;
          case "morphological_consistency":
            suggestions.push("Morfolojik tutarlılığı sağlayın");
            break;
          case "vowel_harmony":
            suggestions.push("Ünlü uyumu kurallarına dikkat edin");
            break;
        }
      }
    });

    return [...new Set(suggestions)];
  };

  const findContextualLinks = (chunk: ChunkData, allChunks: ChunkData[], index: number): ContextualLink[] => {
    const links: ContextualLink[] = [];

    // Find anaphoric references
    const pronouns = chunk.content.match(/\b(bu|şu|o|bunlar|şunlar|onlar)\b/gi);
    if (pronouns && index > 0) {
      links.push({
        type: "anaphoric",
        strength: 0.7,
        description: "Önceki chunk'a gönderim",
        sourceChunk: chunk.id,
        targetChunk: allChunks[index - 1].id
      });
    }

    // Find lexical links
    if (index > 0) {
      const lexicalSimilarity = calculateLexicalCohesion(chunk.content, allChunks[index - 1].content);
      if (lexicalSimilarity > 0.3) {
        links.push({
          type: "lexical",
          strength: lexicalSimilarity,
          description: "Sözcüksel bağlantı",
          sourceChunk: chunk.id,
          targetChunk: allChunks[index - 1].id
        });
      }
    }

    return links;
  };

  // Calculate aggregate statistics
  const aggregateStats = useMemo(() => {
    if (validationResults.length === 0) return null;

    const avgCoherence = validationResults.reduce((sum, r) => sum + r.coherenceScore, 0) / validationResults.length;
    const avgInternal = validationResults.reduce((sum, r) => sum + r.internalCoherence, 0) / validationResults.length;
    const avgExternal = validationResults.reduce((sum, r) => sum + r.externalCoherence, 0) / validationResults.length;
    const avgSemantic = validationResults.reduce((sum, r) => sum + r.semanticContinuity, 0) / validationResults.length;
    
    const excellentCount = validationResults.filter(r => r.coherenceLevel === "excellent").length;
    const goodCount = validationResults.filter(r => r.coherenceLevel === "good").length;
    const fairCount = validationResults.filter(r => r.coherenceLevel === "fair").length;
    const poorCount = validationResults.filter(r => r.coherenceLevel === "poor").length;
    const brokenCount = validationResults.filter(r => r.coherenceLevel === "broken").length;
    
    const totalIssues = validationResults.reduce((sum, r) => sum + r.coherenceIssues.length, 0);
    const criticalIssues = validationResults.reduce((sum, r) => 
      sum + r.coherenceIssues.filter(i => i.severity === "critical").length, 0);

    return {
      totalChunks: chunks.length,
      avgCoherence,
      avgInternal,
      avgExternal,
      avgSemantic,
      excellentCount,
      goodCount,
      fairCount,
      poorCount,
      brokenCount,
      totalIssues,
      criticalIssues,
      coherenceRate: (excellentCount + goodCount) / validationResults.length,
      qualityScore: avgCoherence * 100
    };
  }, [validationResults, chunks.length]);

  // Prepare visualization data
  const visualizationData = useMemo(() => {
    return validationResults.map((result, index) => ({
      chunkIndex: index,
      coherenceScore: result.coherenceScore,
      internalCoherence: result.internalCoherence,
      externalCoherence: result.externalCoherence,
      semanticContinuity: result.semanticContinuity,
      topicalConsistency: result.topicalConsistency,
      linguisticCoherence: result.linguisticCoherence,
      issueCount: result.coherenceIssues.length,
      coherenceLevel: result.coherenceLevel
    }));
  }, [validationResults]);

  const getCoherenceColor = (level: string) => {
    switch (level) {
      case "excellent": return "text-green-600 bg-green-50 border-green-200";
      case "good": return "text-blue-600 bg-blue-50 border-blue-200";
      case "fair": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "poor": return "text-orange-600 bg-orange-50 border-orange-200";
      case "broken": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getCoherenceIcon = (level: string) => {
    switch (level) {
      case "excellent": return <CheckCircle2 className="h-4 w-4" />;
      case "good": return <Target className="h-4 w-4" />;
      case "fair": return <Link className="h-4 w-4" />;
      case "poor": return <AlertTriangle className="h-4 w-4" />;
      case "broken": return <Unlink className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  // Auto-validate when chunks change
  useEffect(() => {
    if (chunks.length > 0 && enableRealTimeValidation) {
      validateCoherence();
    }
  }, [chunks, config]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Tutarlılık Doğrulama Sistemi</h2>
          {aggregateStats && (
            <Badge variant="outline" className="ml-2">
              %{aggregateStats.qualityScore.toFixed(0)} Tutarlılık
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isValidating && (
            <Badge className="bg-green-500 animate-pulse">
              <Brain className="h-3 w-3 mr-1" />
              Doğrulanıyor
            </Badge>
          )}
          <Button
            onClick={validateCoherence}
            disabled={isValidating || chunks.length === 0}
            size="sm"
          >
            {isValidating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Doğrulanıyor...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Tutarlılık Doğrula
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
                  <p className="text-sm text-gray-600">Genel Tutarlılık</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(aggregateStats.avgCoherence * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    Başarı: %{(aggregateStats.coherenceRate * 100).toFixed(0)}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">İç Tutarlılık</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(aggregateStats.avgInternal * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    Chunk içi uyum
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Dış Tutarlılık</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(aggregateStats.avgExternal * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    Chunk'lar arası
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
                  <p className="text-sm text-gray-600">Kritik Sorun</p>
                  <p className="text-2xl font-bold text-red-600">
                    {aggregateStats.criticalIssues}
                  </p>
                  <p className="text-xs text-gray-500">
                    Toplam: {aggregateStats.totalIssues}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="validation" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Doğrulama Sonuçları
          </TabsTrigger>
          <TabsTrigger value="visualization" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Görselleştirme
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Microscope className="h-4 w-4" />
            Detaylı Analiz
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Ayarlar
          </TabsTrigger>
        </TabsList>

        {/* Validation Results Tab */}
        <TabsContent value="validation" className="space-y-6">
          {validationResults.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz Tutarlılık Doğrulaması Yapılmadı
                </h3>
                <p className="text-gray-500 mb-4">
                  Tutarlılık doğrulamasını başlatmak için "Tutarlılık Doğrula" butonuna tıklayın.
                </p>
                <Button
                  onClick={validateCoherence}
                  disabled={chunks.length === 0}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Doğrulamayı Başlat
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {validationResults.map((result, index) => (
                <Card key={result.chunkId} className="transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">Chunk #{result.chunkIndex + 1}</Badge>
                        <div>
                          <div className="font-semibold">
                            Tutarlılık Skoru: {(result.coherenceScore * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500">
                            İç: {(result.internalCoherence * 100).toFixed(0)}% | 
                            Dış: {(result.externalCoherence * 100).toFixed(0)}% | 
                            Semantik: {(result.semanticContinuity * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getCoherenceColor(result.coherenceLevel)} border`}>
                          {getCoherenceIcon(result.coherenceLevel)}
                          {result.coherenceLevel === "excellent" ? "Mükemmel" :
                           result.coherenceLevel === "good" ? "İyi" :
                           result.coherenceLevel === "fair" ? "Orta" :
                           result.coherenceLevel === "poor" ? "Zayıf" : "Bozuk"}
                        </Badge>
                        {result.coherenceIssues.length > 0 && (
                          <Badge className="text-orange-600 bg-orange-50 border-orange-200">
                            {result.coherenceIssues.length} Sorun
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Detailed Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-sm font-bold text-blue-600">
                          {(result.internalCoherence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-blue-700">İç Tutarlılık</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="text-sm font-bold text-purple-600">
                          {(result.externalCoherence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-purple-700">Dış Tutarlılık</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-sm font-bold text-green-600">
                          {(result.semanticContinuity * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-green-700">Semantik Süreklilik</div>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 rounded">
                        <div className="text-sm font-bold text-yellow-600">
                          {(result.topicalConsistency * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-yellow-700">Konu Tutarlılığı</div>
                      </div>
                      <div className="text-center p-2 bg-indigo-50 rounded">
                        <div className="text-sm font-bold text-indigo-600">
                          {(result.linguisticCoherence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-indigo-700">Dilsel Tutarlılık</div>
                      </div>
                    </div>

                    {/* Coherence Issues */}
                    {result.coherenceIssues.length > 0 && (
                      <div className="bg-red-50 rounded p-3">
                        <div className="text-sm font-medium text-red-800 mb-2">
                          Tutarlılık Sorunları:
                        </div>
                        <div className="space-y-2">
                          {result.coherenceIssues.map((issue, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="text-xs text-red-700">{issue.description}</span>
                              <Badge variant="outline" className={`text-xs ${
                                issue.severity === "critical" ? "bg-red-100 text-red-800" :
                                issue.severity === "high" ? "bg-orange-100 text-orange-800" :
                                issue.severity === "medium" ? "bg-yellow-100 text-yellow-800" :
                                "bg-blue-100 text-blue-800"
                              }`}>
                                {issue.severity === "critical" ? "Kritik" :
                                 issue.severity === "high" ? "Yüksek" :
                                 issue.severity === "medium" ? "Orta" : "Düşük"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Turkish Features */}
                    {result.turkishCoherenceFeatures.length > 0 && (
                      <div className="bg-blue-50 rounded p-3">
                        <div className="text-sm font-medium text-blue-800 mb-2">
                          Türkçe Tutarlılık Özellikleri:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {result.turkishCoherenceFeatures.map((feature, idx) => (
                            <Badge key={idx} variant="outline" className={`text-xs ${
                              feature.impact === "positive" ? "bg-green-100 text-green-800" :
                              feature.impact === "neutral" ? "bg-gray-100 text-gray-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {feature.description}: {(feature.score * 100).toFixed(0)}%
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Improvement Suggestions */}
                    {result.improvementSuggestions.length > 0 && (
                      <div className="bg-green-50 rounded p-3">
                        <div className="text-sm font-medium text-green-800 mb-2">İyileştirme Önerileri:</div>
                        <ul className="text-xs text-green-700 space-y-1">
                          {result.improvementSuggestions.map((suggestion, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-green-600 mt-0.5">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Contextual Links */}
                    {result.contextualLinks.length > 0 && (
                      <div className="bg-purple-50 rounded p-3">
                        <div className="text-sm font-medium text-purple-800 mb-2">Bağlamsal Bağlantılar:</div>
                        <div className="flex flex-wrap gap-1">
                          {result.contextualLinks.map((link, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-purple-100 text-purple-800">
                              {link.description} ({(link.strength * 100).toFixed(0)}%)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Content Preview */}
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-sm font-medium text-gray-800 mb-2">Chunk İçeriği:</div>
                      <div className="text-xs text-gray-600 leading-relaxed max-h-20 overflow-hidden">
                        {chunks.find(c => c.id === result.chunkId)?.content.substring(0, 200)}...
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 p-0 h-auto mt-1"
                        onClick={() => setShowDetails(prev => ({
                          ...prev,
                          [result.chunkId]: !prev[result.chunkId]
                        }))}
                      >
                        {showDetails[result.chunkId] ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Gizle
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Detayları Göster
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Detailed Content */}
                    {showDetails[result.chunkId] && (
                      <div className="bg-gray-100 rounded p-4 max-h-96 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap text-gray-700">
                          {chunks.find(c => c.id === result.chunkId)?.content}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Visualization Tab */}
        <TabsContent value="visualization" className="space-y-6">
          {showVisualization && visualizationData.length > 0 ? (
            <div className="space-y-6">
              {/* Coherence Score Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Tutarlılık Skoru Zaman Çizelgesi
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
                        dataKey="coherenceScore" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        name="Genel Tutarlılık"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="internalCoherence" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="İç Tutarlılık"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="externalCoherence" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        name="Dış Tutarlılık"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Coherence Components Radar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Tutarlılık Bileşenleri Analizi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={[{
                      component: "İç Tutarlılık",
                      score: aggregateStats ? aggregateStats.avgInternal * 100 : 0
                    }, {
                      component: "Dış Tutarlılık", 
                      score: aggregateStats ? aggregateStats.avgExternal * 100 : 0
                    }, {
                      component: "Semantik Süreklilik",
                      score: aggregateStats ? aggregateStats.avgSemantic * 100 : 0
                    }, {
                      component: "Konu Tutarlılığı",
                      score: validationResults.length > 0 ? 
                        validationResults.reduce((sum, r) => sum + r.topicalConsistency, 0) / validationResults.length * 100 : 0
                    }, {
                      component: "Dilsel Tutarlılık",
                      score: validationResults.length > 0 ? 
                        validationResults.reduce((sum, r) => sum + r.linguisticCoherence, 0) / validationResults.length * 100 : 0
                    }]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="component" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar 
                        name="Tutarlılık Skorları" 
                        dataKey="score" 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Coherence Level Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Tutarlılık Seviyesi Dağılımı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { level: "Mükemmel", count: aggregateStats?.excellentCount || 0 },
                      { level: "İyi", count: aggregateStats?.goodCount || 0 },
                      { level: "Orta", count: aggregateStats?.fairCount || 0 },
                      { level: "Zayıf", count: aggregateStats?.poorCount || 0 },
                      { level: "Bozuk", count: aggregateStats?.brokenCount || 0 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="level" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
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
                  Görselleştirme için önce tutarlılık doğrulaması yapın.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Microscope className="h-5 w-5" />
                Detaylı Tutarlılık Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aggregateStats ? (
                <div className="space-y-6">
                  {/* Overall Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 rounded p-4">
                      <h4 className="font-medium text-green-800 mb-3">Güçlü Yönler</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        {aggregateStats.avgCoherence > 0.8 && (
                          <li>• Yüksek genel tutarlılık skoru</li>
                        )}
                        {aggregateStats.avgInternal > 0.75 && (
                          <li>• İyi iç tutarlılık</li>
                        )}
                        {aggregateStats.avgExternal > 0.7 && (
                          <li>• Chunk'lar arası iyi bağlantı</li>
                        )}
                        {aggregateStats.criticalIssues === 0 && (
                          <li>• Kritik tutarlılık sorunu yok</li>
                        )}
                      </ul>
                    </div>

                    <div className="bg-red-50 rounded p-4">
                      <h4 className="font-medium text-red-800 mb-3">İyileştirme Alanları</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {aggregateStats.avgCoherence < 0.6 && (
                          <li>• Genel tutarlılık düşük</li>
                        )}
                        {aggregateStats.criticalIssues > 0 && (
                          <li>• {aggregateStats.criticalIssues} kritik sorun mevcut</li>
                        )}
                        {aggregateStats.brokenCount > 0 && (
                          <li>• {aggregateStats.brokenCount} chunk'ta ciddi tutarsızlık</li>
                        )}
                        {aggregateStats.coherenceRate < 0.7 && (
                          <li>• Başarı oranı düşük (%{(aggregateStats.coherenceRate * 100).toFixed(0)})</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Detailed Metrics */}
                  <div className="bg-blue-50 rounded p-4">
                    <h4 className="font-medium text-blue-800 mb-3">Detaylı Metrikler</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-blue-700 font-medium">İç Tutarlılık</div>
                        <div className="text-blue-600">{(aggregateStats.avgInternal * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-blue-700 font-medium">Dış Tutarlılık</div>
                        <div className="text-blue-600">{(aggregateStats.avgExternal * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-blue-700 font-medium">Semantik Süreklilik</div>
                        <div className="text-blue-600">{(aggregateStats.avgSemantic * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-blue-700 font-medium">Toplam Sorun</div>
                        <div className="text-blue-600">{aggregateStats.totalIssues}</div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-yellow-50 rounded p-4">
                    <h4 className="font-medium text-yellow-800 mb-3">Genel Öneriler</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Chunk sınırlarını semantik bütünlüğe göre ayarlayın</li>
                      <li>• Söylem işaretçilerini daha tutarlı kullanın</li>
                      <li>• Konu geçişlerinde bağlantı cümleleri ekleyin</li>
                      <li>• Türkçe dil özelliklerini dikkate alın</li>
                      <li>• Referans bütünlüğünü koruyun</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Microscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Henüz Analiz Mevcut Değil
                  </h3>
                  <p className="text-gray-500">
                    Detaylı analiz için önce tutarlılık doğrulaması yapın.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Tutarlılık Doğrulama Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="internal-weight">
                    İç Tutarlılık Ağırlığı ({config.internalCoherenceWeight})
                  </Label>
                  <input
                    id="internal-weight"
                    type="range"
                    min="0.1"
                    max="0.5"
                    step="0.05"
                    value={config.internalCoherenceWeight}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      internalCoherenceWeight: parseFloat(e.target.value)
                    }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="external-weight">
                    Dış Tutarlılık Ağırlığı ({config.externalCoherenceWeight})
                  </Label>
                  <input
                    id="external-weight"
                    type="range"
                    min="0.1"
                    max="0.5"
                    step="0.05"
                    value={config.externalCoherenceWeight}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      externalCoherenceWeight: parseFloat(e.target.value)
                    }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="semantic-weight">
                    Semantik Süreklilik Ağırlığı ({config.semanticContinuityWeight})
                  </Label>
                  <input
                    id="semantic-weight"
                    type="range"
                    min="0.1"
                    max="0.4"
                    step="0.05"
                    value={config.semanticContinuityWeight}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      semanticContinuityWeight: parseFloat(e.target.value)
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
                    min="0.3"
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
              </div>

              <div className="space-y-3">
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
                    className="w-4 h-4 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Derin Analiz</Label>
                    <p className="text-sm text-gray-500">
                      Detaylı tutarlılık analizi yap
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enableDeepAnalysis}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      enableDeepAnalysis: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                </div>
              </div>

              <Button
                onClick={validateCoherence}
                disabled={isValidating || chunks.length === 0}
                className="w-full"
              >
                Ayarları Uygula ve Doğrula
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoherenceValidator;