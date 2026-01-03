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
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Shield,
  Target,
  Activity,
  BarChart3,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  Zap,
  Volume2,
  VolumeX,
  Layers,
  Hash,
  BookOpen,
  Microscope,
  Search,
  TrendingUp,
  TrendingDown
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
  PieChart,
  Pie,
  Cell
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

interface NoiseDetectionResult {
  chunkId: string;
  chunkIndex: number;
  noiseScore: number;
  noiseType: "none" | "low" | "medium" | "high" | "severe";
  relevanceScore: number;
  qualityScore: number;
  detectedNoisePatterns: NoisePattern[];
  turkishSpecificNoise: TurkishNoiseIssue[];
  cleanupRecommendations: string[];
  filteredContent?: string;
}

interface NoisePattern {
  type: "repetition" | "irrelevant_content" | "formatting_noise" | "encoding_issues" | "mixed_language" | "broken_references";
  severity: "low" | "medium" | "high";
  description: string;
  examples: string[];
  confidence: number;
}

interface TurkishNoiseIssue {
  type: "encoding_problem" | "mixed_script" | "broken_morphology" | "inconsistent_spelling" | "punctuation_noise";
  description: string;
  examples: string[];
  impact: "low" | "medium" | "high";
}

interface NoiseAnalysisConfig {
  relevanceThreshold: number;
  qualityThreshold: number;
  repetitionThreshold: number;
  enableTurkishOptimization: boolean;
  enableAutoCleanup: boolean;
  noiseDetectionSensitivity: "low" | "medium" | "high";
  contextWindowSize: number;
}

interface ContextNoiseAnalyzerProps {
  chunks: ChunkData[];
  originalText: string;
  onNoiseDetected?: (noise: NoiseDetectionResult) => void;
  onAnalysisComplete?: (results: NoiseDetectionResult[]) => void;
  onContentCleaned?: (cleanedChunks: ChunkData[]) => void;
  enableRealTimeAnalysis?: boolean;
  showVisualization?: boolean;
  turkishOptimized?: boolean;
}

const ContextNoiseAnalyzer: React.FC<ContextNoiseAnalyzerProps> = ({
  chunks,
  originalText,
  onNoiseDetected,
  onAnalysisComplete,
  onContentCleaned,
  enableRealTimeAnalysis = true,
  showVisualization = true,
  turkishOptimized = true
}) => {
  const [activeTab, setActiveTab] = useState<"analysis" | "visualization" | "cleanup" | "settings">("analysis");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [noiseResults, setNoiseResults] = useState<NoiseDetectionResult[]>([]);
  const [selectedChunk, setSelectedChunk] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [cleanedChunks, setCleanedChunks] = useState<ChunkData[]>([]);
  
  const [config, setConfig] = useState<NoiseAnalysisConfig>({
    relevanceThreshold: 0.6,
    qualityThreshold: 0.7,
    repetitionThreshold: 0.8,
    enableTurkishOptimization: turkishOptimized,
    enableAutoCleanup: false,
    noiseDetectionSensitivity: "medium",
    contextWindowSize: 5
  });

  // Turkish-specific noise patterns
  const turkishEncodingIssues = [
    "Ã¼", "Ã§", "Ä±", "Ä°", "Ã¶", "Ã¼", "ÅŸ", "Äž", // Common encoding problems
    "â€™", "â€œ", "â€", "â€¦", // Quote and punctuation issues
    "Ã‚", "Ã„", "Ã–", "Ã‡", "Ã…", // Capital letter encoding issues
  ];

  const turkishStopWords = [
    "ve", "bir", "bu", "da", "de", "ile", "için", "olan", "olarak", "daha",
    "çok", "en", "her", "kendi", "sonra", "kadar", "ancak", "gibi", "bütün",
    "şu", "o", "bunlar", "bunları", "bunu", "şunu", "onu", "onları"
  ];

  const irrelevantPatterns = [
    /\b(lorem ipsum|placeholder|test|sample|example)\b/gi,
    /\b(click here|read more|continue reading)\b/gi,
    /\b(advertisement|ads|sponsored)\b/gi,
    /\b(copyright|©|®|™)\b/gi,
    /\b(page \d+|sayfa \d+)\b/gi,
    /\b(figure|şekil|table|tablo)\s*\d*\s*$/gi
  ];

  // Analyze context noise
  const analyzeContextNoise = async () => {
    if (chunks.length === 0) return;

    setIsAnalyzing(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const results: NoiseDetectionResult[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Detect noise patterns
        const noisePatterns = detectNoisePatterns(chunk.content);
        
        // Calculate relevance score
        const relevanceScore = calculateRelevanceScore(chunk.content, originalText);
        
        // Calculate quality score
        const qualityScore = calculateQualityScore(chunk.content);
        
        // Calculate overall noise score
        const noiseScore = calculateNoiseScore(noisePatterns, relevanceScore, qualityScore);
        
        // Determine noise type
        let noiseType: "none" | "low" | "medium" | "high" | "severe" = "none";
        if (noiseScore >= 0.8) noiseType = "severe";
        else if (noiseScore >= 0.6) noiseType = "high";
        else if (noiseScore >= 0.4) noiseType = "medium";
        else if (noiseScore >= 0.2) noiseType = "low";

        // Detect Turkish-specific noise
        const turkishNoise = detectTurkishNoise(chunk.content);

        // Generate cleanup recommendations
        const recommendations = generateCleanupRecommendations(
          noisePatterns,
          turkishNoise,
          relevanceScore,
          qualityScore
        );

        // Generate filtered content if auto-cleanup is enabled
        let filteredContent: string | undefined;
        if (config.enableAutoCleanup && noiseScore > 0.3) {
          filteredContent = cleanContent(chunk.content, noisePatterns, turkishNoise);
        }

        const result: NoiseDetectionResult = {
          chunkId: chunk.id,
          chunkIndex: i,
          noiseScore,
          noiseType,
          relevanceScore,
          qualityScore,
          detectedNoisePatterns: noisePatterns,
          turkishSpecificNoise: turkishNoise,
          cleanupRecommendations: recommendations,
          filteredContent
        };

        results.push(result);

        // Real-time callback
        if (enableRealTimeAnalysis && onNoiseDetected && noiseType !== "none") {
          onNoiseDetected(result);
        }
      }

      setNoiseResults(results);
      
      // Generate cleaned chunks if auto-cleanup is enabled
      if (config.enableAutoCleanup) {
        const cleaned = chunks.map((chunk, index) => {
          const result = results[index];
          if (result.filteredContent) {
            return {
              ...chunk,
              content: result.filteredContent,
              size: result.filteredContent.length
            };
          }
          return chunk;
        });
        setCleanedChunks(cleaned);
        
        if (onContentCleaned) {
          onContentCleaned(cleaned);
        }
      }
      
      if (onAnalysisComplete) {
        onAnalysisComplete(results);
      }

    } catch (error) {
      console.error("Context noise analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Detect noise patterns in content
  const detectNoisePatterns = (content: string): NoisePattern[] => {
    const patterns: NoisePattern[] = [];

    // Check for repetition
    const repetitionScore = detectRepetition(content);
    if (repetitionScore > config.repetitionThreshold) {
      patterns.push({
        type: "repetition",
        severity: repetitionScore > 0.9 ? "high" : "medium",
        description: "Tekrarlayan içerik tespit edildi",
        examples: findRepetitivePatterns(content),
        confidence: repetitionScore
      });
    }

    // Check for irrelevant content
    const irrelevantMatches = irrelevantPatterns.map(pattern => {
      const matches = content.match(pattern);
      return matches ? matches.length : 0;
    }).reduce((a, b) => a + b, 0);

    if (irrelevantMatches > 0) {
      patterns.push({
        type: "irrelevant_content",
        severity: irrelevantMatches > 3 ? "high" : "medium",
        description: "Alakasız içerik tespit edildi",
        examples: extractIrrelevantContent(content),
        confidence: Math.min(irrelevantMatches / 10, 1)
      });
    }

    // Check for formatting noise
    const formattingNoise = detectFormattingNoise(content);
    if (formattingNoise.score > 0.3) {
      patterns.push({
        type: "formatting_noise",
        severity: formattingNoise.score > 0.7 ? "high" : "medium",
        description: "Biçimlendirme gürültüsü tespit edildi",
        examples: formattingNoise.examples,
        confidence: formattingNoise.score
      });
    }

    // Check for broken references
    const brokenRefs = detectBrokenReferences(content);
    if (brokenRefs.length > 0) {
      patterns.push({
        type: "broken_references",
        severity: brokenRefs.length > 2 ? "high" : "medium",
        description: "Bozuk referanslar tespit edildi",
        examples: brokenRefs,
        confidence: Math.min(brokenRefs.length / 5, 1)
      });
    }

    return patterns;
  };

  // Detect Turkish-specific noise
  const detectTurkishNoise = (content: string): TurkishNoiseIssue[] => {
    const issues: TurkishNoiseIssue[] = [];

    if (!config.enableTurkishOptimization) return issues;

    // Check for encoding problems
    const encodingIssues = turkishEncodingIssues.filter(issue => content.includes(issue));
    if (encodingIssues.length > 0) {
      issues.push({
        type: "encoding_problem",
        description: "Türkçe karakter kodlama sorunu",
        examples: encodingIssues,
        impact: encodingIssues.length > 3 ? "high" : "medium"
      });
    }

    // Check for mixed script issues
    const mixedScript = detectMixedScript(content);
    if (mixedScript.length > 0) {
      issues.push({
        type: "mixed_script",
        description: "Karışık yazı sistemi kullanımı",
        examples: mixedScript,
        impact: "medium"
      });
    }

    // Check for broken morphology
    const morphologyIssues = detectBrokenMorphology(content);
    if (morphologyIssues.length > 0) {
      issues.push({
        type: "broken_morphology",
        description: "Bozuk morfolojik yapı",
        examples: morphologyIssues,
        impact: "high"
      });
    }

    // Check for inconsistent spelling
    const spellingIssues = detectInconsistentSpelling(content);
    if (spellingIssues.length > 0) {
      issues.push({
        type: "inconsistent_spelling",
        description: "Tutarsız yazım",
        examples: spellingIssues,
        impact: "medium"
      });
    }

    // Check for punctuation noise
    const punctuationNoise = detectPunctuationNoise(content);
    if (punctuationNoise.length > 0) {
      issues.push({
        type: "punctuation_noise",
        description: "Noktalama gürültüsü",
        examples: punctuationNoise,
        impact: "low"
      });
    }

    return issues;
  };

  // Helper functions for noise detection
  const detectRepetition = (content: string): number => {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length < 2) return 0;

    let repetitionCount = 0;
    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        const similarity = calculateStringSimilarity(sentences[i].trim(), sentences[j].trim());
        if (similarity > 0.8) {
          repetitionCount++;
        }
      }
    }

    return repetitionCount / (sentences.length * (sentences.length - 1) / 2);
  };

  const findRepetitivePatterns = (content: string): string[] => {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const repetitive: string[] = [];

    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        const similarity = calculateStringSimilarity(sentences[i].trim(), sentences[j].trim());
        if (similarity > 0.8) {
          repetitive.push(sentences[i].trim().substring(0, 100) + "...");
        }
      }
    }

    return [...new Set(repetitive)].slice(0, 3);
  };

  const calculateStringSimilarity = (str1: string, str2: string): number => {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  };

  const extractIrrelevantContent = (content: string): string[] => {
    const irrelevant: string[] = [];
    irrelevantPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        irrelevant.push(...matches.slice(0, 3));
      }
    });
    return irrelevant;
  };

  const detectFormattingNoise = (content: string): { score: number; examples: string[] } => {
    const examples: string[] = [];
    let noiseCount = 0;

    // Check for excessive whitespace
    const excessiveWhitespace = content.match(/\s{3,}/g);
    if (excessiveWhitespace) {
      noiseCount += excessiveWhitespace.length;
      examples.push("Aşırı boşluk karakterleri");
    }

    // Check for broken HTML tags
    const brokenTags = content.match(/<[^>]*$/g);
    if (brokenTags) {
      noiseCount += brokenTags.length;
      examples.push("Bozuk HTML etiketleri");
    }

    // Check for special characters noise
    const specialChars = content.match(/[^\w\s\.,;:!?()[\]{}'"çğıöşüÇĞIÖŞÜ-]/g);
    if (specialChars && specialChars.length > content.length * 0.05) {
      noiseCount += 1;
      examples.push("Aşırı özel karakter kullanımı");
    }

    const score = Math.min(noiseCount / 10, 1);
    return { score, examples };
  };

  const detectBrokenReferences = (content: string): string[] => {
    const broken: string[] = [];

    // Check for incomplete figure references
    const incompleteFigures = content.match(/şekil\s*\d*\s*$/gi);
    if (incompleteFigures) {
      broken.push(...incompleteFigures);
    }

    // Check for incomplete table references
    const incompleteTables = content.match(/tablo\s*\d*\s*$/gi);
    if (incompleteTables) {
      broken.push(...incompleteTables);
    }

    // Check for broken URLs
    const brokenUrls = content.match(/https?:\/\/[^\s]*[^.\s]/g);
    if (brokenUrls) {
      const suspicious = brokenUrls.filter(url => url.includes('...') || url.length < 10);
      broken.push(...suspicious);
    }

    return broken.slice(0, 5);
  };

  const detectMixedScript = (content: string): string[] => {
    const mixed: string[] = [];
    
    // Check for Latin-Cyrillic mixing
    if (/[а-яё]/i.test(content) && /[a-z]/i.test(content)) {
      mixed.push("Latin-Kiril karışımı");
    }

    // Check for Arabic script mixing
    if (/[\u0600-\u06FF]/.test(content) && /[a-z]/i.test(content)) {
      mixed.push("Latin-Arap karışımı");
    }

    return mixed;
  };

  const detectBrokenMorphology = (content: string): string[] => {
    const broken: string[] = [];
    const words = content.split(/\s+/);

    // Check for words with unusual suffix patterns
    words.forEach(word => {
      if (word.length > 8) {
        // Check for repeated suffixes
        if (/(.{2,})\1{2,}$/.test(word)) {
          broken.push(word);
        }
        // Check for unusual character sequences
        if (/[çğıöşüÇĞIÖŞÜ]{4,}/.test(word)) {
          broken.push(word);
        }
      }
    });

    return [...new Set(broken)].slice(0, 5);
  };

  const detectInconsistentSpelling = (content: string): string[] => {
    const inconsistent: string[] = [];
    
    // Common Turkish spelling variations
    const variations = [
      ["de", "da"], ["ki", "kı"], ["mi", "mı"], ["mu", "mü"]
    ];

    variations.forEach(([form1, form2]) => {
      if (content.includes(form1) && content.includes(form2)) {
        inconsistent.push(`${form1}/${form2} tutarsızlığı`);
      }
    });

    return inconsistent;
  };

  const detectPunctuationNoise = (content: string): string[] => {
    const noise: string[] = [];

    // Check for excessive punctuation
    if (/[!?]{3,}/.test(content)) {
      noise.push("Aşırı ünlem/soru işareti");
    }

    // Check for misplaced commas
    if (/,\s*,/.test(content)) {
      noise.push("Yanlış yerleştirilmiş virgül");
    }

    // Check for space issues around punctuation
    if (/\w[.!?]/.test(content)) {
      noise.push("Noktalama öncesi boşluk eksikliği");
    }

    return noise;
  };

  const calculateRelevanceScore = (content: string, originalText: string): number => {
    const contentWords = new Set(content.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const originalWords = new Set(originalText.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    
    const intersection = new Set([...contentWords].filter(x => originalWords.has(x)));
    return contentWords.size > 0 ? intersection.size / contentWords.size : 0;
  };

  const calculateQualityScore = (content: string): number => {
    let score = 1.0;

    // Penalize very short content
    if (content.length < 50) score -= 0.3;

    // Penalize excessive special characters
    const specialCharRatio = (content.match(/[^\w\s\.,;:!?()[\]{}'"çğıöşüÇĞIÖŞÜ-]/g) || []).length / content.length;
    score -= specialCharRatio * 2;

    // Penalize excessive uppercase
    const uppercaseRatio = (content.match(/[A-ZÇĞIÖŞÜ]/g) || []).length / content.length;
    if (uppercaseRatio > 0.3) score -= 0.2;

    // Reward proper sentence structure
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
    if (sentences.length > 0) {
      const avgSentenceLength = content.length / sentences.length;
      if (avgSentenceLength > 20 && avgSentenceLength < 200) score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  };

  const calculateNoiseScore = (
    patterns: NoisePattern[],
    relevanceScore: number,
    qualityScore: number
  ): number => {
    let noiseScore = 0;

    // Add noise from patterns
    patterns.forEach(pattern => {
      const weight = pattern.severity === "high" ? 0.3 : pattern.severity === "medium" ? 0.2 : 0.1;
      noiseScore += weight * pattern.confidence;
    });

    // Add noise from low relevance
    noiseScore += (1 - relevanceScore) * 0.3;

    // Add noise from low quality
    noiseScore += (1 - qualityScore) * 0.2;

    return Math.min(1, noiseScore);
  };

  const generateCleanupRecommendations = (
    patterns: NoisePattern[],
    turkishNoise: TurkishNoiseIssue[],
    relevanceScore: number,
    qualityScore: number
  ): string[] => {
    const recommendations: string[] = [];

    patterns.forEach(pattern => {
      switch (pattern.type) {
        case "repetition":
          recommendations.push("Tekrarlayan içeriği kaldırın");
          break;
        case "irrelevant_content":
          recommendations.push("Alakasız içeriği filtreleyin");
          break;
        case "formatting_noise":
          recommendations.push("Biçimlendirme hatalarını düzeltin");
          break;
        case "broken_references":
          recommendations.push("Bozuk referansları onarın");
          break;
      }
    });

    turkishNoise.forEach(issue => {
      switch (issue.type) {
        case "encoding_problem":
          recommendations.push("Karakter kodlama sorunlarını düzeltin");
          break;
        case "mixed_script":
          recommendations.push("Tutarlı yazı sistemi kullanın");
          break;
        case "broken_morphology":
          recommendations.push("Morfolojik yapıyı düzeltin");
          break;
        case "inconsistent_spelling":
          recommendations.push("Yazım tutarlılığını sağlayın");
          break;
        case "punctuation_noise":
          recommendations.push("Noktalama düzenlemesi yapın");
          break;
      }
    });

    if (relevanceScore < 0.5) {
      recommendations.push("İçerik ilgililiğini artırın");
    }

    if (qualityScore < 0.6) {
      recommendations.push("Genel içerik kalitesini iyileştirin");
    }

    return [...new Set(recommendations)];
  };

  const cleanContent = (
    content: string,
    patterns: NoisePattern[],
    turkishNoise: TurkishNoiseIssue[]
  ): string => {
    let cleaned = content;

    // Remove encoding issues
    turkishEncodingIssues.forEach(issue => {
      const replacement = getCorrectTurkishChar(issue);
      cleaned = cleaned.replace(new RegExp(issue, 'g'), replacement);
    });

    // Remove irrelevant patterns
    irrelevantPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Clean excessive whitespace
    cleaned = cleaned.replace(/\s{3,}/g, ' ');

    // Remove broken HTML tags
    cleaned = cleaned.replace(/<[^>]*$/g, '');

    // Clean up punctuation
    cleaned = cleaned.replace(/[!?]{3,}/g, '!');
    cleaned = cleaned.replace(/,\s*,/g, ',');

    return cleaned.trim();
  };

  const getCorrectTurkishChar = (encodingIssue: string): string => {
    const corrections: Record<string, string> = {
      "Ã¼": "ü", "Ã§": "ç", "Ä±": "ı", "Ä°": "İ",
      "Ã¶": "ö", "ÅŸ": "ş", "Äž": "ğ",
      "â€™": "'", "â€œ": '"', "â€": '"', "â€¦": "..."
    };
    return corrections[encodingIssue] || encodingIssue;
  };

  // Calculate aggregate statistics
  const aggregateStats = useMemo(() => {
    if (noiseResults.length === 0) return null;

    const totalNoise = noiseResults.filter(r => r.noiseType !== "none").length;
    const severeNoise = noiseResults.filter(r => r.noiseType === "severe").length;
    const highNoise = noiseResults.filter(r => r.noiseType === "high").length;
    const mediumNoise = noiseResults.filter(r => r.noiseType === "medium").length;
    
    const avgNoiseScore = noiseResults.reduce((sum, r) => sum + r.noiseScore, 0) / noiseResults.length;
    const avgRelevanceScore = noiseResults.reduce((sum, r) => sum + r.relevanceScore, 0) / noiseResults.length;
    const avgQualityScore = noiseResults.reduce((sum, r) => sum + r.qualityScore, 0) / noiseResults.length;
    
    const totalPatterns = noiseResults.reduce((sum, r) => sum + r.detectedNoisePatterns.length, 0);
    const turkishIssuesCount = noiseResults.reduce((sum, r) => sum + r.turkishSpecificNoise.length, 0);

    return {
      totalChunks: chunks.length,
      totalNoise,
      severeNoise,
      highNoise,
      mediumNoise,
      avgNoiseScore,
      avgRelevanceScore,
      avgQualityScore,
      totalPatterns,
      turkishIssuesCount,
      noiseRate: totalNoise / noiseResults.length,
      cleanlinessScore: Math.max(0, 100 - (avgNoiseScore * 100))
    };
  }, [noiseResults, chunks.length]);

  // Prepare visualization data
  const visualizationData = useMemo(() => {
    return noiseResults.map((result, index) => ({
      chunkIndex: index,
      noiseScore: result.noiseScore,
      relevanceScore: result.relevanceScore,
      qualityScore: result.qualityScore,
      noiseType: result.noiseType,
      patternCount: result.detectedNoisePatterns.length,
      turkishIssues: result.turkishSpecificNoise.length
    }));
  }, [noiseResults]);

  const getNoiseColor = (noiseType: string) => {
    switch (noiseType) {
      case "severe": return "text-red-600 bg-red-50 border-red-200";
      case "high": return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-green-600 bg-green-50 border-green-200";
    }
  };

  const getNoiseIcon = (noiseType: string) => {
    switch (noiseType) {
      case "severe": return <VolumeX className="h-4 w-4" />;
      case "high": return <Volume2 className="h-4 w-4" />;
      case "medium": return <AlertTriangle className="h-4 w-4" />;
      case "low": return <Filter className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  // Auto-analyze when chunks change
  useEffect(() => {
    if (chunks.length > 0 && enableRealTimeAnalysis) {
      analyzeContextNoise();
    }
  }, [chunks, config]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Bağlam Gürültüsü Analiz Sistemi</h2>
          {aggregateStats && (
            <Badge variant="outline" className="ml-2">
              {aggregateStats.totalNoise} Gürültü Tespit Edildi
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAnalyzing && (
            <Badge className="bg-blue-500 animate-pulse">
              <Search className="h-3 w-3 mr-1" />
              Analiz Ediliyor
            </Badge>
          )}
          <Button
            onClick={analyzeContextNoise}
            disabled={isAnalyzing || chunks.length === 0}
            size="sm"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Analiz Ediliyor...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Gürültü Analizi
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
                  <p className="text-sm text-gray-600">Temizlik Skoru</p>
                  <p className="text-2xl font-bold text-green-600">
                    {aggregateStats.cleanlinessScore.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Gürültü: %{(aggregateStats.noiseRate * 100).toFixed(1)}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">İlgililik</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(aggregateStats.avgRelevanceScore * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    Ortalama skor
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
                  <p className="text-sm text-gray-600">Kalite</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(aggregateStats.avgQualityScore * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    İçerik kalitesi
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">TR Sorunları</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {aggregateStats.turkishIssuesCount}
                  </p>
                  <p className="text-xs text-gray-500">
                    Dil-spesifik
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Microscope className="h-4 w-4" />
            Analiz Sonuçları
          </TabsTrigger>
          <TabsTrigger value="visualization" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Görselleştirme
          </TabsTrigger>
          <TabsTrigger value="cleanup" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Temizleme
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Ayarlar
          </TabsTrigger>
        </TabsList>

        {/* Analysis Results Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {noiseResults.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz Gürültü Analizi Yapılmadı
                </h3>
                <p className="text-gray-500 mb-4">
                  Bağlam gürültüsü analizini başlatmak için "Gürültü Analizi" butonuna tıklayın.
                </p>
                <Button
                  onClick={analyzeContextNoise}
                  disabled={chunks.length === 0}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Analizi Başlat
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {noiseResults.map((result, index) => (
                <Card key={result.chunkId} className="transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">Chunk #{result.chunkIndex + 1}</Badge>
                        <div>
                          <div className="font-semibold">
                            Gürültü Skoru: {(result.noiseScore * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500">
                            İlgililik: {(result.relevanceScore * 100).toFixed(0)}% | 
                            Kalite: {(result.qualityScore * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getNoiseColor(result.noiseType)} border`}>
                          {getNoiseIcon(result.noiseType)}
                          {result.noiseType === "none" ? "Temiz" :
                           result.noiseType === "low" ? "Az Gürültü" :
                           result.noiseType === "medium" ? "Orta Gürültü" :
                           result.noiseType === "high" ? "Yüksek Gürültü" : "Ciddi Gürültü"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-red-50 rounded">
                        <div className="text-lg font-bold text-red-600">
                          {result.detectedNoisePatterns.length}
                        </div>
                        <div className="text-xs text-red-700">Gürültü Deseni</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded">
                        <div className="text-lg font-bold text-orange-600">
                          {result.turkishSpecificNoise.length}
                        </div>
                        <div className="text-xs text-orange-700">TR Sorunu</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-lg font-bold text-green-600">
                          {result.cleanupRecommendations.length}
                        </div>
                        <div className="text-xs text-green-700">Öneri</div>
                      </div>
                    </div>

                    {/* Noise Patterns */}
                    {result.detectedNoisePatterns.length > 0 && (
                      <div className="bg-red-50 rounded p-3">
                        <div className="text-sm font-medium text-red-800 mb-2">
                          Tespit Edilen Gürültü Desenleri:
                        </div>
                        <div className="space-y-2">
                          {result.detectedNoisePatterns.map((pattern, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="text-xs text-red-700">{pattern.description}</span>
                              <Badge variant="outline" className={`text-xs ${
                                pattern.severity === "high" ? "bg-red-100 text-red-800" :
                                pattern.severity === "medium" ? "bg-orange-100 text-orange-800" :
                                "bg-yellow-100 text-yellow-800"
                              }`}>
                                {pattern.severity === "high" ? "Yüksek" :
                                 pattern.severity === "medium" ? "Orta" : "Düşük"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Turkish-specific Issues */}
                    {result.turkishSpecificNoise.length > 0 && (
                      <div className="bg-orange-50 rounded p-3">
                        <div className="text-sm font-medium text-orange-800 mb-2">
                          Türkçe-Spesifik Sorunlar:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {result.turkishSpecificNoise.map((issue, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-orange-100 text-orange-800">
                              {issue.description}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cleanup Recommendations */}
                    {result.cleanupRecommendations.length > 0 && (
                      <div className="bg-green-50 rounded p-3">
                        <div className="text-sm font-medium text-green-800 mb-2">Temizleme Önerileri:</div>
                        <ul className="text-xs text-green-700 space-y-1">
                          {result.cleanupRecommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-green-600 mt-0.5">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Filtered Content Preview */}
                    {result.filteredContent && (
                      <div className="bg-blue-50 rounded p-3">
                        <div className="text-sm font-medium text-blue-800 mb-2">Temizlenmiş İçerik:</div>
                        <div className="text-xs text-blue-700 leading-relaxed max-h-20 overflow-hidden">
                          {result.filteredContent.substring(0, 200)}...
                        </div>
                      </div>
                    )}

                    {/* Original Content Preview */}
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-sm font-medium text-gray-800 mb-2">Orijinal İçerik:</div>
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
              {/* Noise Score Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Gürültü Skoru Zaman Çizelgesi
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
                        dataKey="noiseScore" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Gürültü Skoru"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="relevanceScore" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="İlgililik Skoru"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="qualityScore" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Kalite Skoru"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Noise Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Gürültü Türü Dağılımı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { type: "Temiz", count: noiseResults.filter(r => r.noiseType === "none").length },
                      { type: "Az", count: noiseResults.filter(r => r.noiseType === "low").length },
                      { type: "Orta", count: noiseResults.filter(r => r.noiseType === "medium").length },
                      { type: "Yüksek", count: noiseResults.filter(r => r.noiseType === "high").length },
                      { type: "Ciddi", count: noiseResults.filter(r => r.noiseType === "severe").length }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pattern and Issues Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Sorun Dağılımı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={visualizationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="chunkIndex" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="patternCount" fill="#f59e0b" name="Gürültü Desenleri" />
                      <Bar dataKey="turkishIssues" fill="#ef4444" name="TR Sorunları" />
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
                  Görselleştirme için önce gürültü analizi yapın.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cleanup Tab */}
        <TabsContent value="cleanup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                İçerik Temizleme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cleanedChunks.length > 0 ? (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      {cleanedChunks.length} chunk otomatik olarak temizlendi.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Orijinal İçerik Özeti:</h4>
                      <div className="bg-red-50 p-3 rounded text-sm">
                        <div>Toplam Karakter: {chunks.reduce((sum, c) => sum + c.size, 0)}</div>
                        <div>Gürültülü Chunk: {noiseResults.filter(r => r.noiseType !== "none").length}</div>
                        <div>Ortalama Gürültü: {aggregateStats ? (aggregateStats.avgNoiseScore * 100).toFixed(1) : 0}%</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Temizlenmiş İçerik Özeti:</h4>
                      <div className="bg-green-50 p-3 rounded text-sm">
                        <div>Toplam Karakter: {cleanedChunks.reduce((sum, c) => sum + c.size, 0)}</div>
                        <div>Temizlenen Chunk: {cleanedChunks.filter((c, i) => c.size !== chunks[i].size).length}</div>
                        <div>Boyut Azalması: {((1 - cleanedChunks.reduce((sum, c) => sum + c.size, 0) / chunks.reduce((sum, c) => sum + c.size, 0)) * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (onContentCleaned) {
                        onContentCleaned(cleanedChunks);
                      }
                    }}
                    className="w-full"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Temizlenmiş İçeriği Uygula
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Henüz Temizleme Yapılmadı
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Otomatik temizleme için ayarlarda "Otomatik Temizleme" seçeneğini etkinleştirin.
                  </p>
                  <Button
                    onClick={() => setActiveTab("settings")}
                    variant="outline"
                  >
                    Ayarlara Git
                  </Button>
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
                Gürültü Analiz Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="relevance-threshold">
                    İlgililik Eşiği ({config.relevanceThreshold})
                  </Label>
                  <input
                    id="relevance-threshold"
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={config.relevanceThreshold}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      relevanceThreshold: parseFloat(e.target.value)
                    }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="quality-threshold">
                    Kalite Eşiği ({config.qualityThreshold})
                  </Label>
                  <input
                    id="quality-threshold"
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={config.qualityThreshold}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      qualityThreshold: parseFloat(e.target.value)
                    }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="repetition-threshold">
                    Tekrar Eşiği ({config.repetitionThreshold})
                  </Label>
                  <input
                    id="repetition-threshold"
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={config.repetitionThreshold}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      repetitionThreshold: parseFloat(e.target.value)
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
                    max="20"
                    value={config.contextWindowSize}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      contextWindowSize: parseInt(e.target.value) || 5
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Türkçe Optimizasyonu</Label>
                    <p className="text-sm text-gray-500">
                      Türkçe dil özelliklerini dikkate al
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enableTurkishOptimization}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      enableTurkishOptimization: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Otomatik Temizleme</Label>
                    <p className="text-sm text-gray-500">
                      Tespit edilen gürültüyü otomatik temizle
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enableAutoCleanup}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      enableAutoCleanup: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                </div>
              </div>

              <Button
                onClick={analyzeContextNoise}
                disabled={isAnalyzing || chunks.length === 0}
                className="w-full"
              >
                Ayarları Uygula ve Analiz Et
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContextNoiseAnalyzer;