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
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  BarChart3,
  Activity,
  Target,
  Search,
  Layers,
  Hash,
  BookOpen,
  Microscope,
  TrendingUp,
  TrendingDown,
  GitBranch,
  Network,
  Shield,
  Sparkles,
  Wand2
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter
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

interface NoiseFilterResult {
  chunkId: string;
  chunkIndex: number;
  originalContent: string;
  filteredContent: string;
  removedNoise: NoiseItem[];
  noiseReduction: number;
  qualityImprovement: number;
  filteringConfidence: number;
  preservedElements: PreservedElement[];
  filteringActions: FilteringAction[];
  turkishSpecificFiltering: TurkishFilteringResult[];
}

interface NoiseItem {
  type: "encoding_error" | "mixed_script" | "broken_morphology" | "punctuation_noise" | 
        "formatting_artifacts" | "irrelevant_content" | "duplicate_content" | "metadata_noise";
  content: string;
  location: { start: number; end: number };
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  reason: string;
  replacement?: string;
}

interface PreservedElement {
  type: "academic_term" | "proper_noun" | "technical_concept" | "reference" | "citation" | "formula";
  content: string;
  location: { start: number; end: number };
  importance: number;
  reason: string;
}

interface FilteringAction {
  action: "remove" | "replace" | "preserve" | "transform" | "merge";
  target: string;
  result: string;
  confidence: number;
  reason: string;
}

interface TurkishFilteringResult {
  type: "vowel_harmony_fix" | "morphology_correction" | "encoding_fix" | "diacritic_restoration";
  original: string;
  corrected: string;
  confidence: number;
  impact: "positive" | "neutral" | "negative";
}

interface FilterConfig {
  enableEncodingFix: boolean;
  enableMorphologyCorrection: boolean;
  enablePunctuationCleaning: boolean;
  enableDuplicateRemoval: boolean;
  enableIrrelevantContentFilter: boolean;
  enableTurkishSpecificFiltering: boolean;
  aggressivenessLevel: "conservative" | "moderate" | "aggressive";
  preserveAcademicTerms: boolean;
  preserveReferences: boolean;
  minimumConfidenceThreshold: number;
  contextWindowSize: number;
}

interface NoiseFilterEngineProps {
  chunks: ChunkData[];
  originalText: string;
  onFilteringComplete?: (results: NoiseFilterResult[]) => void;
  onChunkFiltered?: (result: NoiseFilterResult) => void;
  enableRealTimeFiltering?: boolean;
  showVisualization?: boolean;
  turkishOptimized?: boolean;
}

const NoiseFilterEngine: React.FC<NoiseFilterEngineProps> = ({
  chunks,
  originalText,
  onFilteringComplete,
  onChunkFiltered,
  enableRealTimeFiltering = true,
  showVisualization = true,
  turkishOptimized = true
}) => {
  const [activeTab, setActiveTab] = useState<"filtering" | "results" | "visualization" | "settings">("filtering");
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterResults, setFilterResults] = useState<NoiseFilterResult[]>([]);
  const [selectedChunk, setSelectedChunk] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [previewMode, setPreviewMode] = useState(false);
  
  const [config, setConfig] = useState<FilterConfig>({
    enableEncodingFix: true,
    enableMorphologyCorrection: turkishOptimized,
    enablePunctuationCleaning: true,
    enableDuplicateRemoval: true,
    enableIrrelevantContentFilter: true,
    enableTurkishSpecificFiltering: turkishOptimized,
    aggressivenessLevel: "moderate",
    preserveAcademicTerms: true,
    preserveReferences: true,
    minimumConfidenceThreshold: 0.7,
    contextWindowSize: 2
  });

  // Turkish-specific patterns and corrections
  const turkishEncodingFixes = {
    "Ã¼": "ü", "Ã¶": "ö", "Ã§": "ç", "Ä±": "ı", "Ä°": "İ", "Åž": "ş", "Ä": "ğ",
    "â€™": "'", "â€œ": '"', "â€": '"', "â€“": "–", "â€”": "—"
  };

  const turkishMorphologyPatterns = [
    { pattern: /([aeiouöü])([bcçdfgğhjklmnprsştuvyz]+)([aeiouöü])/g, type: "vowel_harmony" },
    { pattern: /(lar|ler)$/g, type: "plural_suffix" },
    { pattern: /(da|de|ta|te)$/g, type: "locative_suffix" },
    { pattern: /(dan|den|tan|ten)$/g, type: "ablative_suffix" },
    { pattern: /(ın|in|un|ün)$/g, type: "genitive_suffix" }
  ];

  const academicTermsPatterns = [
    /\b(analiz|sentez|hipotez|teori|model|yaklaşım|yöntem|teknik)\b/gi,
    /\b(araştırma|çalışma|inceleme|değerlendirme|karşılaştırma)\b/gi,
    /\b(sonuç|bulgu|veri|bilgi|kaynak|referans|atıf)\b/gi,
    /\b(kavram|olgu|durum|süreç|sistem|yapı|işlev)\b/gi
  ];

  const irrelevantContentPatterns = [
    /\b(tıkla|click|link|url|http|www)\b/gi,
    /\b(reklam|ilan|duyuru|haber|güncel)\b/gi,
    /\b(sosyal medya|facebook|twitter|instagram)\b/gi,
    /\b(video|resim|fotoğraf|görsel|medya)\b/gi
  ];

  // Main filtering function
  const filterNoise = async () => {
    if (chunks.length === 0) return;

    setIsFiltering(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      const results: NoiseFilterResult[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Detect noise items
        const noiseItems = detectNoiseItems(chunk.content);
        
        // Identify preserved elements
        const preservedElements = identifyPreservedElements(chunk.content);
        
        // Apply filtering
        const filteredContent = applyFiltering(chunk.content, noiseItems, preservedElements);
        
        // Calculate metrics
        const noiseReduction = calculateNoiseReduction(chunk.content, filteredContent);
        const qualityImprovement = calculateQualityImprovement(chunk.content, filteredContent);
        const filteringConfidence = calculateFilteringConfidence(noiseItems);
        
        // Generate filtering actions
        const filteringActions = generateFilteringActions(chunk.content, filteredContent, noiseItems);
        
        // Apply Turkish-specific filtering
        const turkishFiltering = applyTurkishSpecificFiltering(filteredContent);
        
        const result: NoiseFilterResult = {
          chunkId: chunk.id,
          chunkIndex: i,
          originalContent: chunk.content,
          filteredContent: turkishFiltering.content,
          removedNoise: noiseItems,
          noiseReduction,
          qualityImprovement,
          filteringConfidence,
          preservedElements,
          filteringActions,
          turkishSpecificFiltering: turkishFiltering.results
        };

        results.push(result);

        // Real-time callback
        if (enableRealTimeFiltering && onChunkFiltered) {
          onChunkFiltered(result);
        }
      }

      setFilterResults(results);
      
      if (onFilteringComplete) {
        onFilteringComplete(results);
      }

    } catch (error) {
      console.error("Noise filtering failed:", error);
    } finally {
      setIsFiltering(false);
    }
  };

  // Detect noise items in content
  const detectNoiseItems = (content: string): NoiseItem[] => {
    const noiseItems: NoiseItem[] = [];

    // Encoding errors
    if (config.enableEncodingFix) {
      Object.entries(turkishEncodingFixes).forEach(([error, correct]) => {
        const regex = new RegExp(error.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        let match;
        while ((match = regex.exec(content)) !== null) {
          noiseItems.push({
            type: "encoding_error",
            content: match[0],
            location: { start: match.index, end: match.index + match[0].length },
            severity: "high",
            confidence: 0.9,
            reason: "Türkçe karakter kodlama hatası",
            replacement: correct
          });
        }
      });
    }

    // Mixed script detection
    const mixedScriptRegex = /[a-zA-Z]+[çğıöşüÇĞIİÖŞÜ]+|[çğıöşüÇĞIİÖŞÜ]+[a-zA-Z]+/g;
    let match;
    while ((match = mixedScriptRegex.exec(content)) !== null) {
      noiseItems.push({
        type: "mixed_script",
        content: match[0],
        location: { start: match.index, end: match.index + match[0].length },
        severity: "medium",
        confidence: 0.7,
        reason: "Karışık alfabe kullanımı"
      });
    }

    // Punctuation noise
    if (config.enablePunctuationCleaning) {
      const punctuationNoiseRegex = /[.]{3,}|[!]{2,}|[?]{2,}|[,]{2,}|[\s]{3,}/g;
      while ((match = punctuationNoiseRegex.exec(content)) !== null) {
        noiseItems.push({
          type: "punctuation_noise",
          content: match[0],
          location: { start: match.index, end: match.index + match[0].length },
          severity: "low",
          confidence: 0.8,
          reason: "Fazla noktalama işareti",
          replacement: match[0].includes('.') ? '...' : 
                      match[0].includes('!') ? '!' :
                      match[0].includes('?') ? '?' :
                      match[0].includes(',') ? ',' : ' '
        });
      }
    }

    // Irrelevant content
    if (config.enableIrrelevantContentFilter) {
      irrelevantContentPatterns.forEach(pattern => {
        while ((match = pattern.exec(content)) !== null) {
          noiseItems.push({
            type: "irrelevant_content",
            content: match[0],
            location: { start: match.index, end: match.index + match[0].length },
            severity: "medium",
            confidence: 0.6,
            reason: "Alakasız içerik"
          });
        }
      });
    }

    // Duplicate content detection
    if (config.enableDuplicateRemoval) {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const duplicates = findDuplicateSentences(sentences);
      duplicates.forEach(dup => {
        const index = content.indexOf(dup.sentence);
        if (index !== -1) {
          noiseItems.push({
            type: "duplicate_content",
            content: dup.sentence,
            location: { start: index, end: index + dup.sentence.length },
            severity: "medium",
            confidence: 0.8,
            reason: `${dup.count} kez tekrarlanıyor`
          });
        }
      });
    }

    return noiseItems.filter(item => item.confidence >= config.minimumConfidenceThreshold);
  };

  // Identify elements to preserve
  const identifyPreservedElements = (content: string): PreservedElement[] => {
    const preserved: PreservedElement[] = [];

    // Academic terms
    if (config.preserveAcademicTerms) {
      academicTermsPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          preserved.push({
            type: "academic_term",
            content: match[0],
            location: { start: match.index, end: match.index + match[0].length },
            importance: 0.9,
            reason: "Akademik terim"
          });
        }
      });
    }

    // References and citations
    if (config.preserveReferences) {
      const referencePatterns = [
        /\([12]\d{3}\)/g, // Years in parentheses
        /\b[A-ZÇĞIİÖŞÜ][a-zçğıöşü]+\s+et\s+al\./g, // Et al. citations
        /\b[A-ZÇĞIİÖŞÜ][a-zçğıöşü]+\s+\([12]\d{3}\)/g, // Author (year)
      ];

      referencePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          preserved.push({
            type: "reference",
            content: match[0],
            location: { start: match.index, end: match.index + match[0].length },
            importance: 0.8,
            reason: "Akademik referans"
          });
        }
      });
    }

    // Proper nouns
    const properNounRegex = /\b[A-ZÇĞIİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞIİÖŞÜ][a-zçğıöşü]+)*\b/g;
    let match;
    while ((match = properNounRegex.exec(content)) !== null) {
      if (match[0].length > 2) {
        preserved.push({
          type: "proper_noun",
          content: match[0],
          location: { start: match.index, end: match.index + match[0].length },
          importance: 0.7,
          reason: "Özel isim"
        });
      }
    }

    return preserved;
  };

  // Apply filtering to content
  const applyFiltering = (content: string, noiseItems: NoiseItem[], preserved: PreservedElement[]): string => {
    let filteredContent = content;
    
    // Sort noise items by position (reverse order to maintain indices)
    const sortedNoise = [...noiseItems].sort((a, b) => b.location.start - a.location.start);
    
    // Check if noise item overlaps with preserved elements
    const isPreserved = (noiseItem: NoiseItem): boolean => {
      return preserved.some(p => 
        (noiseItem.location.start >= p.location.start && noiseItem.location.start <= p.location.end) ||
        (noiseItem.location.end >= p.location.start && noiseItem.location.end <= p.location.end)
      );
    };

    // Apply filtering based on aggressiveness level
    sortedNoise.forEach(item => {
      if (isPreserved(item)) return; // Skip preserved elements

      const shouldFilter = shouldApplyFilter(item);
      if (shouldFilter) {
        const before = filteredContent.substring(0, item.location.start);
        const after = filteredContent.substring(item.location.end);
        
        if (item.replacement) {
          filteredContent = before + item.replacement + after;
        } else if (item.type === "irrelevant_content" || item.type === "duplicate_content") {
          filteredContent = before + after;
        } else {
          filteredContent = before + item.content + after; // Keep original if no replacement
        }
      }
    });

    return filteredContent;
  };

  // Determine if filter should be applied based on config
  const shouldApplyFilter = (item: NoiseItem): boolean => {
    const { aggressivenessLevel } = config;
    
    switch (aggressivenessLevel) {
      case "conservative":
        return item.severity === "critical" || (item.severity === "high" && item.confidence > 0.9);
      case "moderate":
        return item.severity === "critical" || item.severity === "high" || 
               (item.severity === "medium" && item.confidence > 0.8);
      case "aggressive":
        return item.confidence >= config.minimumConfidenceThreshold;
      default:
        return false;
    }
  };

  // Apply Turkish-specific filtering
  const applyTurkishSpecificFiltering = (content: string): { content: string; results: TurkishFilteringResult[] } => {
    if (!config.enableTurkishSpecificFiltering) {
      return { content, results: [] };
    }

    let filteredContent = content;
    const results: TurkishFilteringResult[] = [];

    // Fix encoding issues
    Object.entries(turkishEncodingFixes).forEach(([error, correct]) => {
      if (filteredContent.includes(error)) {
        const originalContent = filteredContent;
        filteredContent = filteredContent.replace(new RegExp(error, 'g'), correct);
        if (originalContent !== filteredContent) {
          results.push({
            type: "encoding_fix",
            original: error,
            corrected: correct,
            confidence: 0.95,
            impact: "positive"
          });
        }
      }
    });

    // Morphology corrections (simplified)
    if (config.enableMorphologyCorrection) {
      const words = filteredContent.split(/\s+/);
      words.forEach((word, index) => {
        const correctedWord = correctTurkishMorphology(word);
        if (correctedWord !== word) {
          filteredContent = filteredContent.replace(word, correctedWord);
          results.push({
            type: "morphology_correction",
            original: word,
            corrected: correctedWord,
            confidence: 0.7,
            impact: "positive"
          });
        }
      });
    }

    return { content: filteredContent, results };
  };

  // Helper functions
  const findDuplicateSentences = (sentences: string[]): { sentence: string; count: number }[] => {
    const counts: Record<string, number> = {};
    sentences.forEach(sentence => {
      const normalized = sentence.trim().toLowerCase();
      if (normalized.length > 10) {
        counts[normalized] = (counts[normalized] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .filter(([_, count]) => count > 1)
      .map(([sentence, count]) => ({ sentence, count }));
  };

  const correctTurkishMorphology = (word: string): string => {
    // Simplified morphology correction
    // In a real implementation, this would use a proper Turkish morphological analyzer
    
    // Fix common vowel harmony issues
    if (word.includes('ı') && word.includes('e')) {
      return word.replace(/ı/g, 'i');
    }
    if (word.includes('u') && word.includes('ö')) {
      return word.replace(/u/g, 'ü');
    }
    
    return word;
  };

  const calculateNoiseReduction = (original: string, filtered: string): number => {
    const originalLength = original.length;
    const filteredLength = filtered.length;
    const reduction = (originalLength - filteredLength) / originalLength;
    return Math.max(0, Math.min(1, reduction));
  };

  const calculateQualityImprovement = (original: string, filtered: string): number => {
    // Simplified quality calculation based on various factors
    let score = 0;
    
    // Encoding quality
    const encodingErrors = Object.keys(turkishEncodingFixes).reduce((count, error) => 
      count + (original.match(new RegExp(error, 'g')) || []).length, 0);
    const fixedEncodingErrors = Object.keys(turkishEncodingFixes).reduce((count, error) => 
      count + (filtered.match(new RegExp(error, 'g')) || []).length, 0);
    
    if (encodingErrors > 0) {
      score += (encodingErrors - fixedEncodingErrors) / encodingErrors * 0.3;
    }
    
    // Punctuation quality
    const punctuationNoise = (original.match(/[.]{3,}|[!]{2,}|[?]{2,}|[,]{2,}/g) || []).length;
    const fixedPunctuation = (filtered.match(/[.]{3,}|[!]{2,}|[?]{2,}|[,]{2,}/g) || []).length;
    
    if (punctuationNoise > 0) {
      score += (punctuationNoise - fixedPunctuation) / punctuationNoise * 0.2;
    }
    
    // Content relevance (simplified)
    score += 0.5; // Base improvement score
    
    return Math.max(0, Math.min(1, score));
  };

  const calculateFilteringConfidence = (noiseItems: NoiseItem[]): number => {
    if (noiseItems.length === 0) return 1.0;
    
    const avgConfidence = noiseItems.reduce((sum, item) => sum + item.confidence, 0) / noiseItems.length;
    return avgConfidence;
  };

  const generateFilteringActions = (original: string, filtered: string, noiseItems: NoiseItem[]): FilteringAction[] => {
    const actions: FilteringAction[] = [];
    
    noiseItems.forEach(item => {
      if (item.replacement) {
        actions.push({
          action: "replace",
          target: item.content,
          result: item.replacement,
          confidence: item.confidence,
          reason: item.reason
        });
      } else if (item.type === "irrelevant_content" || item.type === "duplicate_content") {
        actions.push({
          action: "remove",
          target: item.content,
          result: "",
          confidence: item.confidence,
          reason: item.reason
        });
      }
    });
    
    return actions;
  };

  // Calculate aggregate statistics
  const aggregateStats = useMemo(() => {
    if (filterResults.length === 0) return null;

    const totalNoise = filterResults.reduce((sum, r) => sum + r.removedNoise.length, 0);
    const avgNoiseReduction = filterResults.reduce((sum, r) => sum + r.noiseReduction, 0) / filterResults.length;
    const avgQualityImprovement = filterResults.reduce((sum, r) => sum + r.qualityImprovement, 0) / filterResults.length;
    const avgConfidence = filterResults.reduce((sum, r) => sum + r.filteringConfidence, 0) / filterResults.length;
    
    const criticalNoise = filterResults.reduce((sum, r) => 
      sum + r.removedNoise.filter(n => n.severity === "critical").length, 0);
    const highNoise = filterResults.reduce((sum, r) => 
      sum + r.removedNoise.filter(n => n.severity === "high").length, 0);
    
    const totalPreserved = filterResults.reduce((sum, r) => sum + r.preservedElements.length, 0);
    const totalActions = filterResults.reduce((sum, r) => sum + r.filteringActions.length, 0);
    
    const turkishFixes = filterResults.reduce((sum, r) => sum + r.turkishSpecificFiltering.length, 0);

    return {
      totalChunks: chunks.length,
      totalNoise,
      avgNoiseReduction,
      avgQualityImprovement,
      avgConfidence,
      criticalNoise,
      highNoise,
      totalPreserved,
      totalActions,
      turkishFixes,
      cleanlinessScore: (1 - avgNoiseReduction) * 100,
      qualityScore: avgQualityImprovement * 100
    };
  }, [filterResults, chunks.length]);

  // Prepare visualization data
  const visualizationData = useMemo(() => {
    return filterResults.map((result, index) => ({
      chunkIndex: index,
      noiseReduction: result.noiseReduction,
      qualityImprovement: result.qualityImprovement,
      filteringConfidence: result.filteringConfidence,
      noiseCount: result.removedNoise.length,
      preservedCount: result.preservedElements.length,
      actionsCount: result.filteringActions.length
    }));
  }, [filterResults]);

  const getNoiseColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-600 bg-red-50 border-red-200";
      case "high": return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getNoiseIcon = (type: string) => {
    switch (type) {
      case "encoding_error": return <Hash className="h-4 w-4" />;
      case "mixed_script": return <GitBranch className="h-4 w-4" />;
      case "broken_morphology": return <BookOpen className="h-4 w-4" />;
      case "punctuation_noise": return <Target className="h-4 w-4" />;
      case "irrelevant_content": return <Trash2 className="h-4 w-4" />;
      case "duplicate_content": return <Layers className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  // Auto-filter when chunks change
  useEffect(() => {
    if (chunks.length > 0 && enableRealTimeFiltering) {
      filterNoise();
    }
  }, [chunks, config]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Gürültü Filtre Motoru</h2>
          {aggregateStats && (
            <Badge variant="outline" className="ml-2">
              %{aggregateStats.qualityScore.toFixed(0)} Kalite
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isFiltering && (
            <Badge className="bg-blue-500 animate-pulse">
              <Wand2 className="h-3 w-3 mr-1" />
              Filtreleniyor
            </Badge>
          )}
          <Button
            onClick={filterNoise}
            disabled={isFiltering || chunks.length === 0}
            size="sm"
          >
            {isFiltering ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Filtreleniyor...
              </>
            ) : (
              <>
                <Filter className="mr-2 h-4 w-4" />
                Gürültü Filtrele
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
                  <p className="text-sm text-gray-600">Kalite Skoru</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {aggregateStats.qualityScore.toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    Temizlik: %{aggregateStats.cleanlinessScore.toFixed(0)}
                  </p>
                </div>
                <Sparkles className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Temizlenen Gürültü</p>
                  <p className="text-2xl font-bold text-red-600">
                    {aggregateStats.totalNoise}
                  </p>
                  <p className="text-xs text-gray-500">
                    Kritik: {aggregateStats.criticalNoise}
                  </p>
                </div>
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Korunan Öğe</p>
                  <p className="text-2xl font-bold text-green-600">
                    {aggregateStats.totalPreserved}
                  </p>
                  <p className="text-xs text-gray-500">
                    Güvenli tutuldu
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
                  <p className="text-sm text-gray-600">Türkçe Düzeltme</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {aggregateStats.turkishFixes}
                  </p>
                  <p className="text-xs text-gray-500">
                    Dil özellikli
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="filtering" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtreleme
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Sonuçlar
          </TabsTrigger>
          <TabsTrigger value="visualization" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Görselleştirme
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Ayarlar
          </TabsTrigger>
        </TabsList>

        {/* Filtering Tab */}
        <TabsContent value="filtering" className="space-y-6">
          {filterResults.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz Gürültü Filtrelemesi Yapılmadı
                </h3>
                <p className="text-gray-500 mb-4">
                  Gürültü filtrelemeyi başlatmak için "Gürültü Filtrele" butonuna tıklayın.
                </p>
                <Button
                  onClick={filterNoise}
                  disabled={chunks.length === 0}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filtrelemeyi Başlat
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Filtreleme Önizlemesi</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    {previewMode ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Önizlemeyi Kapat
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Önizleme
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {filterResults.map((result, index) => (
                <Card key={result.chunkId} className="transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">Chunk #{result.chunkIndex + 1}</Badge>
                        <div>
                          <div className="font-semibold">
                            Kalite İyileştirmesi: {(result.qualityImprovement * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500">
                            Gürültü: {result.removedNoise.length} | 
                            Korunan: {result.preservedElements.length} | 
                            Güven: {(result.filteringConfidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-blue-600 bg-blue-50 border-blue-200">
                          {(result.noiseReduction * 100).toFixed(0)}% Azalma
                        </Badge>
                        {result.removedNoise.length > 0 && (
                          <Badge className="text-red-600 bg-red-50 border-red-200">
                            {result.removedNoise.length} Gürültü
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Noise Items */}
                    {result.removedNoise.length > 0 && (
                      <div className="bg-red-50 rounded p-3">
                        <div className="text-sm font-medium text-red-800 mb-2">
                          Temizlenen Gürültü:
                        </div>
                        <div className="space-y-2">
                          {result.removedNoise.slice(0, 3).map((noise, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getNoiseIcon(noise.type)}
                                <span className="text-xs text-red-700">{noise.reason}</span>
                              </div>
                              <Badge variant="outline" className={`text-xs ${getNoiseColor(noise.severity)}`}>
                                {noise.severity === "critical" ? "Kritik" :
                                 noise.severity === "high" ? "Yüksek" :
                                 noise.severity === "medium" ? "Orta" : "Düşük"}
                              </Badge>
                            </div>
                          ))}
                          {result.removedNoise.length > 3 && (
                            <div className="text-xs text-red-600">
                              +{result.removedNoise.length - 3} daha...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Preserved Elements */}
                    {result.preservedElements.length > 0 && (
                      <div className="bg-green-50 rounded p-3">
                        <div className="text-sm font-medium text-green-800 mb-2">
                          Korunan Öğeler:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {result.preservedElements.slice(0, 5).map((element, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-green-100 text-green-800">
                              {element.reason}: {element.content.substring(0, 20)}...
                            </Badge>
                          ))}
                          {result.preservedElements.length > 5 && (
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                              +{result.preservedElements.length - 5} daha
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Turkish Specific Filtering */}
                    {result.turkishSpecificFiltering.length > 0 && (
                      <div className="bg-purple-50 rounded p-3">
                        <div className="text-sm font-medium text-purple-800 mb-2">
                          Türkçe Düzeltmeler:
                        </div>
                        <div className="space-y-1">
                          {result.turkishSpecificFiltering.map((fix, idx) => (
                            <div key={idx} className="text-xs text-purple-700">
                              <span className="font-mono bg-purple-100 px-1 rounded">{fix.original}</span>
                              {" → "}
                              <span className="font-mono bg-purple-200 px-1 rounded">{fix.corrected}</span>
                              <span className="ml-2 text-purple-600">
                                ({fix.type.replace(/_/g, ' ')})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Content Preview */}
                    {previewMode && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-red-50 rounded p-3">
                          <div className="text-sm font-medium text-red-800 mb-2">Orijinal:</div>
                          <div className="text-xs text-red-700 leading-relaxed max-h-32 overflow-y-auto">
                            {result.originalContent.substring(0, 300)}...
                          </div>
                        </div>
                        <div className="bg-green-50 rounded p-3">
                          <div className="text-sm font-medium text-green-800 mb-2">Filtrelenmiş:</div>
                          <div className="text-xs text-green-700 leading-relaxed max-h-32 overflow-y-auto">
                            {result.filteredContent.substring(0, 300)}...
                          </div>
                        </div>
                      </div>
                    )}

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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded p-4">
                            <h4 className="font-medium text-gray-800 mb-2">Orijinal İçerik</h4>
                            <pre className="text-xs whitespace-pre-wrap text-gray-700 max-h-64 overflow-y-auto">
                              {result.originalContent}
                            </pre>
                          </div>
                          <div className="bg-blue-50 rounded p-4">
                            <h4 className="font-medium text-blue-800 mb-2">Filtrelenmiş İçerik</h4>
                            <pre className="text-xs whitespace-pre-wrap text-blue-700 max-h-64 overflow-y-auto">
                              {result.filteredContent}
                            </pre>
                          </div>
                        </div>

                        {/* Filtering Actions */}
                        {result.filteringActions.length > 0 && (
                          <div className="bg-yellow-50 rounded p-3">
                            <div className="text-sm font-medium text-yellow-800 mb-2">
                              Filtreleme İşlemleri:
                            </div>
                            <div className="space-y-1">
                              {result.filteringActions.map((action, idx) => (
                                <div key={idx} className="text-xs text-yellow-700">
                                  <Badge variant="outline" className="text-xs mr-2">
                                    {action.action === "remove" ? "Kaldır" :
                                     action.action === "replace" ? "Değiştir" :
                                     action.action === "preserve" ? "Koru" : action.action}
                                  </Badge>
                                  {action.reason} ({(action.confidence * 100).toFixed(0)}% güven)
                                </div>
                              ))}
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
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {aggregateStats ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Filtreleme Özeti
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Toplam Chunk:</span>
                        <span className="font-medium">{aggregateStats.totalChunks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Temizlenen Gürültü:</span>
                        <span className="font-medium text-red-600">{aggregateStats.totalNoise}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Korunan Öğe:</span>
                        <span className="font-medium text-green-600">{aggregateStats.totalPreserved}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Türkçe Düzeltme:</span>
                        <span className="font-medium text-purple-600">{aggregateStats.turkishFixes}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Kalite Metrikleri
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Kalite Skoru:</span>
                        <span className="font-medium text-blue-600">
                          {aggregateStats.qualityScore.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Gürültü Azalması:</span>
                        <span className="font-medium text-green-600">
                          {(aggregateStats.avgNoiseReduction * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Güven Skoru:</span>
                        <span className="font-medium text-purple-600">
                          {(aggregateStats.avgConfidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Temizlik Skoru:</span>
                        <span className="font-medium text-indigo-600">
                          {aggregateStats.cleanlinessScore.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Gürültü Analizi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Kritik Gürültü:</span>
                        <span className="font-medium text-red-600">{aggregateStats.criticalNoise}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Yüksek Gürültü:</span>
                        <span className="font-medium text-orange-600">{aggregateStats.highNoise}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Toplam İşlem:</span>
                        <span className="font-medium text-blue-600">{aggregateStats.totalActions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Başarı Oranı:</span>
                        <span className="font-medium text-green-600">
                          {((aggregateStats.totalNoise / (aggregateStats.totalNoise + aggregateStats.totalPreserved)) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Dışa Aktarma
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Filtrelenmiş Metni İndir
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Raporu İndir
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Ayarları Dışa Aktar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz Sonuç Mevcut Değil
                </h3>
                <p className="text-gray-500">
                  Sonuçları görmek için önce gürültü filtrelemesi yapın.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Visualization Tab */}
        <TabsContent value="visualization" className="space-y-6">
          {showVisualization && visualizationData.length > 0 ? (
            <div className="space-y-6">
              {/* Quality Improvement Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Kalite İyileştirme Grafiği
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
                        dataKey="qualityImprovement" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        name="Kalite İyileştirmesi"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="noiseReduction" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Gürültü Azalması"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="filteringConfidence" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Filtreleme Güveni"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Noise Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Gürültü Dağılımı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={visualizationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="chunkIndex" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="noiseCount" fill="#ef4444" name="Gürültü Sayısı" />
                      <Bar dataKey="preservedCount" fill="#10b981" name="Korunan Öğe" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Actions Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    İşlem Dağılımı
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
                        dataKey="actionsCount" 
                        stackId="1"
                        stroke="#8b5cf6" 
                        fill="#8b5cf6"
                        name="Filtreleme İşlemleri"
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
                  Görselleştirme için önce gürültü filtrelemesi yapın.
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
                Gürültü Filtre Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Kodlama Düzeltme</Label>
                      <p className="text-sm text-gray-500">
                        Türkçe karakter kodlama hatalarını düzelt
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enableEncodingFix}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        enableEncodingFix: e.target.checked
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Morfoloji Düzeltme</Label>
                      <p className="text-sm text-gray-500">
                        Türkçe morfolojik hataları düzelt
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enableMorphologyCorrection}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        enableMorphologyCorrection: e.target.checked
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Noktalama Temizleme</Label>
                      <p className="text-sm text-gray-500">
                        Fazla noktalama işaretlerini temizle
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enablePunctuationCleaning}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        enablePunctuationCleaning: e.target.checked
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Tekrar Kaldırma</Label>
                      <p className="text-sm text-gray-500">
                        Tekrarlanan içerikleri kaldır
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enableDuplicateRemoval}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        enableDuplicateRemoval: e.target.checked
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Alakasız İçerik Filtresi</Label>
                      <p className="text-sm text-gray-500">
                        Alakasız içerikleri filtrele
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enableIrrelevantContentFilter}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        enableIrrelevantContentFilter: e.target.checked
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Akademik Terim Koruma</Label>
                      <p className="text-sm text-gray-500">
                        Akademik terimleri koru
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.preserveAcademicTerms}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        preserveAcademicTerms: e.target.checked
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Referans Koruma</Label>
                      <p className="text-sm text-gray-500">
                        Akademik referansları koru
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.preserveReferences}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        preserveReferences: e.target.checked
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Türkçe Özel Filtreleme</Label>
                      <p className="text-sm text-gray-500">
                        Türkçe dil özelliklerini uygula
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enableTurkishSpecificFiltering}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        enableTurkishSpecificFiltering: e.target.checked
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="aggressiveness">
                    Saldırganlık Seviyesi: {config.aggressivenessLevel}
                  </Label>
                  <select
                    id="aggressiveness"
                    value={config.aggressivenessLevel}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      aggressivenessLevel: e.target.value as "conservative" | "moderate" | "aggressive"
                    }))}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="conservative">Muhafazakar (Sadece kritik)</option>
                    <option value="moderate">Orta (Kritik + Yüksek)</option>
                    <option value="aggressive">Saldırgan (Tüm gürültü)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="confidence-threshold">
                    Minimum Güven Eşiği ({config.minimumConfidenceThreshold})
                  </Label>
                  <input
                    id="confidence-threshold"
                    type="range"
                    min="0.3"
                    max="0.95"
                    step="0.05"
                    value={config.minimumConfidenceThreshold}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      minimumConfidenceThreshold: parseFloat(e.target.value)
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
                    max="5"
                    value={config.contextWindowSize}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      contextWindowSize: parseInt(e.target.value) || 2
                    }))}
                  />
                </div>
              </div>

              <Button
                onClick={filterNoise}
                disabled={isFiltering || chunks.length === 0}
                className="w-full"
              >
                Ayarları Uygula ve Filtrele
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NoiseFilterEngine;