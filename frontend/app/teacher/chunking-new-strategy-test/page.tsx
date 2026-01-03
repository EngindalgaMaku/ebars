"use client";

import React, { useState, useEffect, useRef } from "react";
import TeacherLayout from "../../components/TeacherLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Play,
  Square,
  RotateCcw,
  Brain,
  Target,
  Clock,
  TrendingUp,
  Settings,
  Download,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Activity,
  BarChart3,
  FileText,
  RefreshCw,
  Upload,
  Zap,
  BookOpen,
  Users,
  Award,
  Database,
  Trash2,
  Eye,
  Layers,
  Scissors,
  GitBranch,
  Sparkles,
  List,
  Edit,
  Hash,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { apiClient } from "@/lib/api-client";
import ChunkVisualization from "./components/ChunkVisualization";
import ChunkingComparison from "./components/ChunkingComparison";
import ReasoningDisplay from "./components/ReasoningDisplay";
import TokenAnalysis from "./components/TokenAnalysis";
import ChunkSizeAnalyzer from "./components/ChunkSizeAnalyzer";
import VisualTextContextAnalyzer from "./components/VisualTextContextAnalyzer";
import ReferenceIntegrityChecker from "./components/ReferenceIntegrityChecker";
import ContextPreservationTester from "./components/ContextPreservationTester";
import TurkishAcademicAnalyzer from "./components/TurkishAcademicAnalyzer";
import TestResultsDashboard from "./components/TestResultsDashboard";
import TestScenarioLibrary from "./components/TestScenarioLibrary";
import InteractiveTutorial from "./components/InteractiveTutorial";
import SampleContentGenerator from "./components/SampleContentGenerator";
import QuickStartWizard from "./components/QuickStartWizard";
import BestPracticesGuide from "./components/BestPracticesGuide";
import AutomatedEvaluationEngine from "./components/AutomatedEvaluationEngine";
import QualityAssessmentPanel from "./components/QualityAssessmentPanel";
import EvaluationMetricsDisplay from "./components/EvaluationMetricsDisplay";
import ContinuousMonitoring from "./components/ContinuousMonitoring";
import EvaluationReports from "./components/EvaluationReports";
// Topic Drift and Context Noise Analysis Components
import TopicDriftDetector from "./components/TopicDriftDetector";
import ContextNoiseAnalyzer from "./components/ContextNoiseAnalyzer";
import CoherenceValidator from "./components/CoherenceValidator";
import NoiseFilterEngine from "./components/NoiseFilterEngine";
import DriftVisualization from "./components/DriftVisualization";

// Chunking Strategy Configuration Interface
interface ChunkingConfig {
  testName: string;
  strategy: "traditional" | "agentic" | "comparison";
  file: File | null;
  
  // Traditional chunking parameters
  chunkSize: number;
  chunkOverlap: number;
  
  // Agentic chunking parameters
  similarityThreshold: number;
  llmReasoningWeight: number;
  maxChunkSize: number;
  minChunkSize: number;
  useSemanticBoundaries: boolean;
  enableContextualMerging: boolean;
  
  // Comparison parameters
  enableQualityMetrics: boolean;
  enableVisualization: boolean;
  exportFormat: string[];
}

// Chunking Test Result Interface
interface ChunkingResult {
  testId: string;
  testName: string;
  status: "running" | "completed" | "failed" | "stopped";
  progress: number;
  startTime: string;
  endTime?: string;
  strategy: string;
  
  // Results data
  chunks: ChunkData[];
  metrics: ChunkingMetrics;
  comparison?: ComparisonData;
  
  // Processing info
  originalText: string;
  totalCharacters: number;
  processingTime: number;
}

interface ChunkData {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  size: number;
  semanticScore?: number;
  boundaryType?: "natural" | "forced" | "semantic";
  reasoning?: string; // For agentic chunking
}

interface ChunkingMetrics {
  totalChunks: number;
  averageChunkSize: number;
  chunkSizeVariance: number;
  semanticCoherence: number;
  boundaryQuality: number;
  processingTime: number;
}

interface ComparisonData {
  traditional: {
    chunks: ChunkData[];
    metrics: ChunkingMetrics;
  };
  agentic: {
    chunks: ChunkData[];
    metrics: ChunkingMetrics;
  };
}

export default function ChunkingNewStrategyTestPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("configuration");

  // Configuration State
  const [config, setConfig] = useState<ChunkingConfig>({
    testName: "",
    strategy: "comparison",
    file: null,
    
    // Traditional parameters
    chunkSize: 1000,
    chunkOverlap: 200,
    
    // Agentic parameters
    similarityThreshold: 0.7,
    llmReasoningWeight: 0.3,
    maxChunkSize: 2000,
    minChunkSize: 100,
    useSemanticBoundaries: true,
    enableContextualMerging: true,
    
    // Comparison parameters
    enableQualityMetrics: true,
    enableVisualization: true,
    exportFormat: ["json", "csv"],
  });

  // Test Execution State
  const [currentTest, setCurrentTest] = useState<ChunkingResult | null>(null);
  const [testList, setTestList] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  
  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Edit/Delete Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [editingTestName, setEditingTestName] = useState("");
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
  
  // Polling interval ref
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef<boolean>(false);

  useEffect(() => {
    setMounted(true);
    loadTestList();
  }, []);

  // Load test list
  const loadTestList = async () => {
    setIsLoadingTests(true);
    try {
      const data = await apiClient.get("/chunking-test/list");
      if (data.success && data.tests) {
        setTestList(data.tests);
      }
    } catch (error) {
      console.error("Error loading test list:", error);
    } finally {
      setIsLoadingTests(false);
    }
  };

  // Load specific test details
  const loadTestDetails = async (testId: string) => {
    try {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      const status = await apiClient.get(`/chunking-test/status/${testId}`);

      const testResult: ChunkingResult = {
        testId: status.testId || testId,
        testName: status.testName || `Test ${testId.substring(0, 8)}`,
        status: status.status || "completed",
        progress: status.progress || 100,
        startTime: status.startTime || "",
        endTime: status.endTime,
        strategy: status.currentStrategy || "unknown",
        chunks: status.chunks || [],
        metrics: {
          totalChunks: status.metrics?.totalChunks || 0,
          averageChunkSize: status.metrics?.averageChunkSize || 0,
          chunkSizeVariance: status.metrics?.chunkSizeVariance || 0,
          semanticCoherence: status.metrics?.semanticCoherence || 0,
          boundaryQuality: status.metrics?.boundaryQuality || 0,
          processingTime: status.metrics?.processingTime || status.processingTime || 0,
        },
        comparison: status.comparison,
        originalText: status.originalText || "",
        totalCharacters: status.totalCharacters || 0,
        processingTime: status.processingTime || 0,
      };

      setCurrentTest(testResult);
      setSelectedTestId(testId);
      setIsRunning(testResult.status === "running");
      setActiveTab("results");
    } catch (error) {
      console.error("Error loading test details:", error);
    }
  };

  // Edit test name
  const handleEditTest = (testId: string, currentName: string) => {
    setEditingTestId(testId);
    setEditingTestName(currentName);
    setEditDialogOpen(true);
  };

  const saveEditTest = async () => {
    if (!editingTestId || !editingTestName.trim()) {
      toast.error("Lütfen test adı girin");
      return;
    }

    try {
      const response = await fetch(`/api/chunking-test/update/${editingTestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testName: editingTestName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Test güncellenemedi");
      }

      toast.success("Test adı güncellendi");
      setEditDialogOpen(false);
      setEditingTestId(null);
      setEditingTestName("");
      
      // Refresh test list and current test if it's the one being edited
      loadTestList();
      if (currentTest?.testId === editingTestId) {
        loadTestDetails(editingTestId);
      }
    } catch (error: any) {
      console.error("Edit test error:", error);
      toast.error(error.message || "Test güncellenemedi");
    }
  };

  // Delete test
  const handleDeleteTest = (testId: string) => {
    setDeletingTestId(testId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTest = async () => {
    if (!deletingTestId) return;

    try {
      const response = await apiClient.delete(`/chunking-test/delete/${deletingTestId}`);

      if (!response.success) {
        throw new Error("Test silinemedi");
      }

      toast.success("Test silindi");
      setDeleteDialogOpen(false);
      setDeletingTestId(null);
      
      // Clear current test if it's the one being deleted
      if (currentTest?.testId === deletingTestId) {
        setCurrentTest(null);
        setSelectedTestId(null);
      }
      
      // Refresh test list
      loadTestList();
    } catch (error: any) {
      console.error("Delete test error:", error);
      toast.error(error.message || "Test silinemedi");
    }
  };

  // Export test results
  const exportTest = async (testId: string) => {
    try {
      const response = await apiClient.get(`/chunking-test/export/${testId}`);
      
      const blob = new Blob([JSON.stringify(response, null, 2)], {
        type: "application/json",
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chunking_test_${testId.substring(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Test sonuçları indirildi");
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.message || "Export başarısız");
    }
  };

  // Export academic report
  const exportAcademicReport = async (testId: string) => {
    try {
      const response = await apiClient.get(`/chunking-test/status/${testId}`);
      
      if (!response.success) {
        throw new Error("Test verileri alınamadı");
      }

      const report = generateAcademicReport(response);
      
      const blob = new Blob([report], {
        type: "text/markdown",
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `academic_report_${testId.substring(0, 8)}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Akademik rapor indirildi");
    } catch (error: any) {
      console.error("Academic report export error:", error);
      toast.error(error.message || "Akademik rapor oluşturulamadı");
    }
  };

  // Export comprehensive PDF report
  const exportComprehensivePdfReport = async (testId: string) => {
    try {
      const response = await apiClient.get(`/chunking-test/export-pdf/${testId}`);
      
      if (!response.success) {
        throw new Error("PDF raporu oluşturulamadı");
      }

      // Create markdown file from the response
      const markdownContent = response.report || "Rapor içeriği bulunamadı";
      const blob = new Blob([markdownContent], {
        type: "text/markdown",
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.filename || `agentic_chunking_report_${testId.substring(0, 8)}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Kapsamlı akademik rapor indirildi");
    } catch (error: any) {
      console.error("PDF export error:", error);
      toast.error(error.message || "Rapor oluşturulamadı");
    }
  };

  // Generate academic report
  const generateAcademicReport = (testData: any) => {
    const date = new Date().toLocaleDateString("tr-TR");
    const chunks = testData.chunks || [];
    const metrics = testData.metrics || {};
    const strategyComparison = testData.strategyComparison || {};
    
    // Calculate detailed metrics
    const semanticScores = chunks.map((c: any) => c.semanticScore || 0);
    const chunkSizes = chunks.map((c: any) => c.size || 0);
    
    const avgSemanticScore = semanticScores.length > 0
      ? semanticScores.reduce((a: number, b: number) => a + b, 0) / semanticScores.length
      : 0;
    
    const minSize = Math.min(...chunkSizes);
    const maxSize = Math.max(...chunkSizes);
    const stdDev = calculateStandardDeviation(chunkSizes);
    const cv = chunkSizes.length > 0 ? (stdDev / (chunkSizes.reduce((a: number, b: number) => a + b, 0) / chunkSizes.length)) * 100 : 0;

    // Enhanced Token Analysis
    const totalWords = chunks.reduce((sum: number, c: any) => {
      const words = (c.content || '').trim().split(/\s+/).filter((w: string) => w.length > 0).length;
      return sum + words;
    }, 0);
    
    const totalTokens = Math.ceil(totalWords * 1.3); // Turkish token estimation
    const avgTokensPerChunk = chunks.length > 0 ? totalTokens / chunks.length : 0;
    const tokenDensity = testData.totalCharacters > 0 ? totalTokens / testData.totalCharacters : 0;
    
    // Cost Analysis
    const estimatedInputCost = (totalTokens / 1000) * 0.0015;
    const estimatedOutputCost = (totalTokens * 0.1 / 1000) * 0.002;
    const totalEstimatedCost = estimatedInputCost + estimatedOutputCost;
    
    // Size Distribution Analysis
    const sizeRanges = [
      { range: "0-500", chunks: chunks.filter((c: any) => c.size <= 500) },
      { range: "501-1000", chunks: chunks.filter((c: any) => c.size > 500 && c.size <= 1000) },
      { range: "1001-1500", chunks: chunks.filter((c: any) => c.size > 1000 && c.size <= 1500) },
      { range: "1501-2000", chunks: chunks.filter((c: any) => c.size > 1500 && c.size <= 2000) },
      { range: "2000+", chunks: chunks.filter((c: any) => c.size > 2000) }
    ];
    
    // Turkish Language Metrics
    const avgWordLength = chunks.length > 0 ? chunks.reduce((sum: number, c: any) => {
      const words = (c.content || '').trim().split(/\s+/).filter((w: string) => w.length > 0);
      const totalChars = words.reduce((charSum: number, word: string) => charSum + word.length, 0);
      return sum + (words.length > 0 ? totalChars / words.length : 0);
    }, 0) / chunks.length : 0;
    
    const morphologicalComplexity = Math.min(3, avgWordLength / 4);
    const agglutinationIndex = Math.min(1, avgWordLength / 8);
    
    // Information Density Analysis
    const informationDensity = chunks.length > 0 ? chunks.reduce((sum: number, c: any) => {
      const words = (c.content || '').toLowerCase().split(/\s+/);
      const uniqueWords = new Set(words).size;
      const density = words.length > 0 ? uniqueWords / words.length : 0;
      return sum + density;
    }, 0) / chunks.length : 0;

    // Categorize chunks by semantic score
    const excellentChunks = chunks.filter((c: any) => (c.semanticScore || 0) >= 0.9);
    const goodChunks = chunks.filter((c: any) => (c.semanticScore || 0) >= 0.75 && (c.semanticScore || 0) < 0.9);
    const averageChunks = chunks.filter((c: any) => (c.semanticScore || 0) >= 0.6 && (c.semanticScore || 0) < 0.75);
    const poorChunks = chunks.filter((c: any) => (c.semanticScore || 0) < 0.6);

    // Generate reasoning quality analysis
    const reasoningChunks = chunks.filter((c: any) => c.reasoning && c.reasoning.length > 0);
    const highQualityReasoning = reasoningChunks.filter((c: any) => c.reasoning.length > 100);
    const mediumQualityReasoning = reasoningChunks.filter((c: any) => c.reasoning.length > 50 && c.reasoning.length <= 100);
    const lowQualityReasoning = reasoningChunks.filter((c: any) => c.reasoning.length <= 50);

    // Advanced reasoning analysis
    const contextualReasonings = reasoningChunks.filter((c: any) =>
      c.reasoning.toLowerCase().includes('bağlam') ||
      c.reasoning.toLowerCase().includes('context')
    );
    const semanticReasonings = reasoningChunks.filter((c: any) =>
      c.reasoning.toLowerCase().includes('semantik') ||
      c.reasoning.toLowerCase().includes('semantic')
    );
    const morphologicalReasonings = reasoningChunks.filter((c: any) =>
      c.reasoning.toLowerCase().includes('morfoloji') ||
      c.reasoning.toLowerCase().includes('morphology')
    );
    const discourseMarkerReasonings = reasoningChunks.filter((c: any) =>
      c.reasoning.toLowerCase().includes('ancak') ||
      c.reasoning.toLowerCase().includes('fakat') ||
      c.reasoning.toLowerCase().includes('lakin') ||
      c.reasoning.toLowerCase().includes('ama') ||
      c.reasoning.toLowerCase().includes('discourse')
    );

    // Calculate reasoning quality scores
    const avgReasoningLength = reasoningChunks.length > 0
      ? reasoningChunks.reduce((sum: number, c: any) => sum + c.reasoning.length, 0) / reasoningChunks.length
      : 0;
    
    const reasoningComplexityScore = reasoningChunks.length > 0
      ? reasoningChunks.reduce((sum: number, c: any) => {
          let complexity = 0;
          if (c.reasoning.includes('çünkü') || c.reasoning.includes('because')) complexity += 0.2;
          if (c.reasoning.includes('dolayısıyla') || c.reasoning.includes('therefore')) complexity += 0.2;
          if (c.reasoning.includes('bağlam') || c.reasoning.includes('context')) complexity += 0.3;
          if (c.reasoning.includes('semantik') || c.reasoning.includes('semantic')) complexity += 0.3;
          return sum + Math.min(complexity, 1.0);
        }, 0) / reasoningChunks.length
      : 0;

    return `# Agentic Chunking Sistemi - Kapsamlı Akademik Değerlendirme Raporu

## 1. EXECUTIVE SUMMARY

### Test Konfigürasyonu
- **Test ID**: ${testData.testId}
- **Test Adı**: ${testData.testName || 'Unnamed Test'}
- **Test Tarihi**: ${date}
- **Doküman Boyutu**: ${testData.totalCharacters || 0} karakter
- **Strateji**: ${testData.currentStrategy || 'Agentic Reasoning'}
- **Model**: Groq Llama 3.1 8B
- **İşlem Süresi**: ${testData.processingTime || 0} saniye

### Temel Sonuçlar
- **Toplam Chunk Sayısı**: ${chunks.length}
- **Ortalama Chunk Boyutu**: ${Math.round(metrics.averageChunkSize || 0)} karakter
- **Semantik Uyum Skoru**: ${(avgSemanticScore * 100).toFixed(1)}%
- **Sınır Kalitesi**: ${((metrics.boundaryQuality || 0) * 100).toFixed(1)}%
- **Başarı Oranı**: ${testData.status === 'completed' ? '100' : '0'}%

### Token ve Maliyet Analizi
- **Toplam Token Sayısı**: ${totalTokens.toLocaleString()}
- **Ortalama Token/Chunk**: ${Math.round(avgTokensPerChunk)}
- **Token Yoğunluğu**: ${tokenDensity.toFixed(4)} token/karakter
- **Tahmini Maliyet**: $${totalEstimatedCost.toFixed(6)}
- **Maliyet/Chunk**: $${(totalEstimatedCost / chunks.length).toFixed(8)}

## 2. DETAYLI SONUÇLAR

### 2.1 Chunk Analizi

| Chunk ID | Boyut | Semantic Score | Boundary Type | Reasoning Quality |
|----------|-------|----------------|---------------|-------------------|
${chunks.slice(0, 10).map((chunk: any, index: number) =>
  `| ${chunk.id || `chunk_${index}`} | ${chunk.size || 0} | ${((chunk.semanticScore || 0) * 100).toFixed(1)}% | ${chunk.boundaryType || 'semantic'} | ${chunk.reasoning ? (chunk.reasoning.length > 100 ? 'Yüksek' : chunk.reasoning.length > 50 ? 'Orta' : 'Düşük') : 'N/A'} |`
).join('\n')}
${chunks.length > 10 ? `| ... | ... | ... | ... | ... |\n| (${chunks.length - 10} chunk daha) | | | | |` : ''}

### 2.2 Kalite Metrikleri Dağılımı

#### Semantik Uyum Dağılımı
\`\`\`
Mükemmel (0.90-1.00): ${excellentChunks.length} chunks (${((excellentChunks.length / chunks.length) * 100).toFixed(1)}%)
İyi (0.75-0.89):      ${goodChunks.length} chunks (${((goodChunks.length / chunks.length) * 100).toFixed(1)}%)
Orta (0.60-0.74):     ${averageChunks.length} chunks (${((averageChunks.length / chunks.length) * 100).toFixed(1)}%)
Zayıf (<0.60):        ${poorChunks.length} chunks (${((poorChunks.length / chunks.length) * 100).toFixed(1)}%)
\`\`\`

#### Chunk Boyut Analizi
\`\`\`
Minimum Boyut:    ${minSize} karakter
Maksimum Boyut:   ${maxSize} karakter
Ortalama Boyut:   ${Math.round(metrics.averageChunkSize || 0)} karakter
Standart Sapma:   ${stdDev.toFixed(1)} karakter
Varyasyon Katsayısı: ${cv.toFixed(1)}%
\`\`\`

### 2.3 LLM Reasoning Analizi

#### Reasoning Kalite Skorları
\`\`\`
Toplam Reasoning Sayısı:         ${reasoningChunks.length} chunks (${((reasoningChunks.length / chunks.length) * 100).toFixed(1)}%)
Detaylı Açıklama (>100 karakter): ${highQualityReasoning.length} chunks (${((highQualityReasoning.length / chunks.length) * 100).toFixed(1)}%)
Orta Açıklama (50-100 karakter): ${mediumQualityReasoning.length} chunks (${((mediumQualityReasoning.length / chunks.length) * 100).toFixed(1)}%)
Kısa Açıklama (<50 karakter):    ${lowQualityReasoning.length} chunks (${((lowQualityReasoning.length / chunks.length) * 100).toFixed(1)}%)

Ortalama Reasoning Uzunluğu:     ${Math.round(avgReasoningLength)} karakter
Reasoning Karmaşıklık Skoru:     ${(reasoningComplexityScore * 100).toFixed(1)}%
\`\`\`

#### Türkçe-Spesifik Reasoning Analizi
\`\`\`
Bağlamsal Reasoning:             ${contextualReasonings.length} chunks (${reasoningChunks.length > 0 ? ((contextualReasonings.length / reasoningChunks.length) * 100).toFixed(1) : '0'}%)
Semantik Reasoning:              ${semanticReasonings.length} chunks (${reasoningChunks.length > 0 ? ((semanticReasonings.length / reasoningChunks.length) * 100).toFixed(1) : '0'}%)
Morfolojik Reasoning:            ${morphologicalReasonings.length} chunks (${reasoningChunks.length > 0 ? ((morphologicalReasonings.length / reasoningChunks.length) * 100).toFixed(1) : '0'}%)
Söylem İşaretçisi Reasoning:     ${discourseMarkerReasonings.length} chunks (${reasoningChunks.length > 0 ? ((discourseMarkerReasonings.length / reasoningChunks.length) * 100).toFixed(1) : '0'}%)
\`\`\`

**Not**: Bu metrikler LLM reasoning açıklamalarının kalitesini ve Türkçe dil özelliklerine uygunluğunu ölçer.

## 3. TOKEN VE BOYUT ANALİZİ

### 3.1 Token Dağılım Analizi
\`\`\`
Toplam Token:                    ${totalTokens.toLocaleString()}
Ortalama Token/Chunk:            ${Math.round(avgTokensPerChunk)}
Token Yoğunluğu:                 ${tokenDensity.toFixed(4)} token/karakter
Kelime/Token Oranı:              ${(totalWords / totalTokens).toFixed(3)}
\`\`\`

### 3.2 Boyut Dağılım Analizi
${sizeRanges.map(range => `
**${range.range} karakter**: ${range.chunks.length} chunks (${((range.chunks.length / chunks.length) * 100).toFixed(1)}%)
- Ortalama Token: ${range.chunks.length > 0 ? Math.round(range.chunks.reduce((sum: number, c: any) => sum + Math.ceil(((c.content || '').trim().split(/\s+/).filter((w: string) => w.length > 0).length) * 1.3), 0) / range.chunks.length) : 0}
- Ortalama Kalite: ${range.chunks.length > 0 ? ((range.chunks.reduce((sum: number, c: any) => sum + (c.semanticScore || 0), 0) / range.chunks.length) * 100).toFixed(1) : 0}%`).join('')}

### 3.3 Maliyet Verimliliği Analizi
\`\`\`
Input Token Maliyeti:            $${estimatedInputCost.toFixed(6)}
Output Token Maliyeti:           $${estimatedOutputCost.toFixed(6)}
Toplam Tahmini Maliyet:          $${totalEstimatedCost.toFixed(6)}
Maliyet/Bilgi Birimi:            $${(totalEstimatedCost / (informationDensity * chunks.length)).toFixed(8)}
Verimlilik Skoru:                ${((informationDensity * 100) / (totalEstimatedCost * 1000000)).toFixed(2)}
\`\`\`

### 3.4 Türkçe Dil Özellikleri Analizi
\`\`\`
Ortalama Kelime Uzunluğu:        ${avgWordLength.toFixed(1)} karakter
Morfolojik Karmaşıklık:          ${morphologicalComplexity.toFixed(2)} (0-3 skala)
Ekleşme İndeksi:                 ${agglutinationIndex.toFixed(2)} (0-1 skala)
Bilgi Yoğunluğu:                 ${(informationDensity * 100).toFixed(1)}%
\`\`\`

## 4. CHUNK-LEVEL DETAY ANALİZİ

### 3.1 En İyi Performans Gösteren Chunk'lar

${excellentChunks.slice(0, 3).map((chunk: any, index: number) => `
#### Chunk #${chunk.id || index + 1} - Semantic Score: ${((chunk.semanticScore || 0) * 100).toFixed(1)}%
\`\`\`
İçerik: "${(chunk.content || '').substring(0, 200)}${(chunk.content || '').length > 200 ? '...' : ''}"
Boyut: ${chunk.size || 0} karakter
Boundary Type: ${chunk.boundaryType || 'semantic'}
LLM Reasoning: "${chunk.reasoning || 'N/A'}"

Kalite Analizi:
- Konu tutarlılığı: ${(chunk.semanticScore || 0) >= 0.9 ? 'Mükemmel' : 'İyi'}
- Cümle akışı: Doğal
- Bilgi yoğunluğu: Optimal
- Bağlamsal bütünlük: Tam
\`\`\`
`).join('')}

### 3.2 İyileştirme Gerektiren Chunk'lar

${poorChunks.slice(0, 2).map((chunk: any, index: number) => `
#### Chunk #${chunk.id || index + 1} - Semantic Score: ${((chunk.semanticScore || 0) * 100).toFixed(1)}%
\`\`\`
İçerik: "${(chunk.content || '').substring(0, 200)}${(chunk.content || '').length > 200 ? '...' : ''}"
Boyut: ${chunk.size || 0} karakter
Sorun: Düşük semantik uyum skoru
Önerilen İyileştirme: Chunk sınırlarının yeniden değerlendirilmesi
\`\`\`
`).join('')}

## 5. PERFORMANS VE VERİMLİLİK ANALİZİ

### 5.1 İşlem Süresi Analizi
\`\`\`
Toplam İşlem Süresi:             ${testData.processingTime || 0} saniye
Throughput:                      ${testData.totalCharacters && testData.processingTime ? Math.round(testData.totalCharacters / testData.processingTime) : 0} karakter/saniye
Token İşleme Hızı:               ${testData.processingTime ? Math.round(totalTokens / testData.processingTime) : 0} token/saniye
\`\`\`

### 5.2 Sistem Metrikleri
\`\`\`
Chunk Üretim Oranı:              ${testData.processingTime ? (chunks.length / testData.processingTime).toFixed(2) : 0} chunk/saniye
Ortalama Chunk Kalitesi:         ${(avgSemanticScore * 100).toFixed(1)}%
Boyut Tutarlılığı (CV):          ${cv.toFixed(1)}%
Bilgi Yoğunluğu Skoru:           ${(informationDensity * 100).toFixed(1)}%
Başarı Oranı:                    ${testData.status === 'completed' ? '100' : '0'}%
\`\`\`

### 5.3 Maliyet-Fayda Analizi
\`\`\`
Maliyet/Karakter:                $${(totalEstimatedCost / (testData.totalCharacters || 1)).toFixed(10)}
Maliyet/Kelime:                  $${(totalEstimatedCost / totalWords).toFixed(8)}
Maliyet/Chunk:                   $${(totalEstimatedCost / chunks.length).toFixed(8)}
ROI Skoru:                       ${((informationDensity * avgSemanticScore * 100) / (totalEstimatedCost * 1000000)).toFixed(2)}
\`\`\`

## 6. SONUÇLAR VE ÖNERİLER

### 6.1 Ana Bulgular
1. **Semantik Uyum**: Ortalama ${(avgSemanticScore * 100).toFixed(1)}% semantic coherence elde edildi
2. **Chunk Kalitesi**: ${excellentChunks.length + goodChunks.length} chunk (%${(((excellentChunks.length + goodChunks.length) / chunks.length) * 100).toFixed(1)}) yüksek kalitede
3. **Boyut Tutarlılığı**: CV=${cv.toFixed(1)}% ile ${cv < 30 ? 'iyi' : cv < 50 ? 'orta' : 'zayıf'} tutarlılık
4. **Token Verimliliği**: ${tokenDensity.toFixed(4)} token/karakter oranı ile ${tokenDensity > 0.15 ? 'yüksek' : tokenDensity > 0.12 ? 'orta' : 'düşük'} verimlilik
5. **Maliyet Etkinliği**: $${totalEstimatedCost.toFixed(6)} toplam maliyet ile ekonomik işlem
6. **LLM Reasoning**: ${reasoningChunks.length} chunk'ta detaylı açıklama mevcut

### 6.2 Akademik Katkılar
1. **Metodolojik İnovasyon**: LLM-guided chunking stratejisi başarıyla uygulandı
2. **Kalite Metrikleri**: Comprehensive evaluation framework geliştirildi
3. **Türkçe Optimizasyonu**: Dil-specific iyileştirmeler sağlandı
4. **Token Analizi**: Kapsamlı token ve maliyet analizi framework'ü
5. **Ölçeklenebilirlik**: ${testData.totalCharacters || 0} karakterlik doküman başarıyla işlendi

### 6.3 Pratik Uygulamalar
1. **RAG Sistemleri**: Gelişmiş retrieval accuracy ve maliyet optimizasyonu
2. **Doküman Analizi**: Daha iyi içerik organizasyonu ve token verimliliği
3. **Bilgi Yönetimi**: Gelişmiş bilgi yapılandırması ve maliyet kontrolü
4. **Eğitim Teknolojisi**: Adaptif içerik sunumu ve bütçe yönetimi
5. **Kurumsal AI**: Ölçeklenebilir ve maliyet-etkin metin işleme

### 6.4 Optimizasyon Önerileri
1. **Boyut Optimizasyonu**: ${cv > 50 ? 'Chunk boyutlarında daha fazla tutarlılık sağlanmalı' : 'Mevcut boyut tutarlılığı optimal'}
2. **Maliyet Optimizasyonu**: ${totalEstimatedCost > 0.01 ? 'Büyük ölçekli işlemler için batch processing önerilir' : 'Maliyet seviyesi kabul edilebilir'}
3. **Kalite İyileştirme**: ${avgSemanticScore < 0.8 ? 'Semantik uyum skorunu artırmak için threshold değerleri ayarlanabilir' : 'Kalite seviyesi yeterli'}
4. **Türkçe Optimizasyonu**: Morfolojik karmaşıklık ${morphologicalComplexity.toFixed(2)} ile ${morphologicalComplexity > 2 ? 'yüksek' : 'optimal'} seviyede

---

**Rapor Tarihi**: ${date}
**Versiyon**: 1.0
**Test Durumu**: ${testData.status}
**Sistem**: Agentic Chunking v2.0
`;
  };

  // Helper function to calculate standard deviation
  const calculateStandardDeviation = (values: number[]) => {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  };

  // File upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "text/markdown" || file.name.endsWith(".md")) {
        setConfig({ ...config, file });
        toast.success(`Dosya yüklendi: ${file.name}`);
      } else {
        toast.error("Lütfen sadece Markdown (.md) dosyaları yükleyin");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "text/markdown" || file.name.endsWith(".md")) {
        setConfig({ ...config, file });
        toast.success(`Dosya yüklendi: ${file.name}`);
      } else {
        toast.error("Lütfen sadece Markdown (.md) dosyaları yükleyin");
      }
    }
  };

  // Start chunking test
  const startChunkingTest = async () => {
    if (!config.testName.trim()) {
      toast.error("Lütfen test adı girin");
      return;
    }

    if (!config.file) {
      toast.error("Lütfen test edilecek dosyayı yükleyin");
      return;
    }

    try {
      setIsRunning(true);
      setError(null);

      // Read file content as text
      const fileText = await config.file.text();

      // Create JSON request body
      const requestBody = {
        testName: config.testName,
        inputText: fileText,
        strategies: config.strategy === "comparison" ? ["traditional", "agentic_reasoning"] :
                   config.strategy === "agentic" ? ["agentic_reasoning"] : [config.strategy],
        targetChunkSize: config.chunkSize,
        overlapSize: config.chunkOverlap,
        enableGrokReasoning: config.llmReasoningWeight > 0,
        turkishOptimization: true,
        sessionId: null
      };

      const result = await apiClient.post("/chunking-test/start", requestBody);

      // Initialize test result
      const initialResult: ChunkingResult = {
        testId: result.testId,
        testName: config.testName,
        status: "running",
        progress: 0,
        startTime: new Date().toISOString(),
        strategy: config.strategy,
        chunks: [],
        metrics: {
          totalChunks: 0,
          averageChunkSize: 0,
          chunkSizeVariance: 0,
          semanticCoherence: 0,
          boundaryQuality: 0,
          processingTime: 0,
        },
        originalText: "",
        totalCharacters: 0,
        processingTime: 0,
      };

      setCurrentTest(initialResult);
      setActiveTab("monitoring");
      toast.success("Chunking testi başlatıldı!");

      // Start polling for test progress
      pollTestStatus(result.testId);
      setTimeout(() => loadTestList(), 1000);
    } catch (error) {
      console.error("Chunking test başlatma hatası:", error);
      setError(error instanceof Error ? error.message : "Test başlatılamadı");
      toast.error("Test başlatılamadı");
      setIsRunning(false);
    }
  };

  // Poll test status
  const pollTestStatus = (testId: string) => {
    // Stop any existing polling first
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    isPollingRef.current = true;
    
    const poll = async () => {
      if (!isPollingRef.current) return;
      
      try {
        const status = await apiClient.get(`/chunking-test/status/${testId}`);
        
        console.log("API Status Response:", status); // Debug log

        setCurrentTest((prevTest: any) => {
          if (!prevTest || prevTest.testId !== testId) {
            return prevTest;
          }

          // Map API response to frontend format
          const updatedTest = {
            ...prevTest,
            progress: Math.max(prevTest.progress || 0, status.progress || 0),
            status: status.status || prevTest.status,
            endTime: status.endTime || prevTest.endTime,
            originalText: status.originalText || prevTest.originalText,
            totalCharacters: status.totalCharacters || prevTest.totalCharacters,
            processingTime: status.processingTime || prevTest.processingTime,
            
            // Handle chunks data
            chunks: status.chunks && status.chunks.length > 0 ? status.chunks : prevTest.chunks,
            
            // Handle metrics data
            metrics: {
              totalChunks: status.metrics?.totalChunks || prevTest.metrics?.totalChunks || 0,
              averageChunkSize: status.metrics?.averageChunkSize || prevTest.metrics?.averageChunkSize || 0,
              chunkSizeVariance: status.metrics?.chunkSizeVariance || prevTest.metrics?.chunkSizeVariance || 0,
              semanticCoherence: status.metrics?.semanticCoherence || prevTest.metrics?.semanticCoherence || 0,
              boundaryQuality: status.metrics?.boundaryQuality || prevTest.metrics?.boundaryQuality || 0,
              processingTime: status.metrics?.processingTime || status.processingTime || prevTest.metrics?.processingTime || 0,
            },
            
            // Handle comparison data
            comparison: status.comparison || prevTest.comparison,
          };
          
          console.log("Updated Test State:", updatedTest); // Debug log
          return updatedTest;
        });

        if (status.status === "completed" || status.status === "failed" || status.status === "stopped") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          isPollingRef.current = false;
          setIsRunning(false);

          if (status.status === "completed") {
            toast.success("Chunking testi tamamlandı!");
            setActiveTab("results");
            setTimeout(() => loadTestList(), 1000);
          } else if (status.status === "failed") {
            toast.error(`Test başarısız: ${status.error || "Bilinmeyen hata"}`);
            setError(status.error || "Test başarısız");
          }
        }
      } catch (error) {
        console.error("Error polling test status:", error);
      }
    };
    
    poll();
    pollingIntervalRef.current = setInterval(poll, 2000);
  };

  // Stop test
  const stopTest = async () => {
    if (currentTest) {
      try {
        await apiClient.post(`/chunking-test/stop/${currentTest.testId}`);

        setCurrentTest({
          ...currentTest,
          status: "stopped",
          endTime: new Date().toISOString(),
        });
        setIsRunning(false);
        toast.info("Test durduruldu");
      } catch (error) {
        console.error("Stop test error:", error);
        toast.error("Test durdurulurken hata oluştu");
      }
    }
  };

  // Reset test
  const resetTest = () => {
    setCurrentTest(null);
    setIsRunning(false);
    setError(null);
    setActiveTab("configuration");
  };

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      isPollingRef.current = false;
    };
  }, []);

  if (!mounted) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Yükleniyor...</span>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl">
                <Scissors className="h-8 w-8 text-white" />
              </div>
              Agentic Chunking Strategy Test
            </h1>
            <p className="text-gray-600 mt-1">
              Yeni akıllı chunking stratejisini test edin ve geleneksel yöntemlerle karşılaştırın
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-18">
            <TabsTrigger value="quick-start" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Hızlı Başlangıç
            </TabsTrigger>
            <TabsTrigger value="test-scenarios" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Test Senaryoları
            </TabsTrigger>
            <TabsTrigger value="tutorial" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Etkileşimli Eğitim
            </TabsTrigger>
            <TabsTrigger value="content-generator" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              İçerik Üretici
            </TabsTrigger>
            <TabsTrigger value="best-practices" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              En İyi Uygulamalar
            </TabsTrigger>
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Konfigürasyon
            </TabsTrigger>
            <TabsTrigger value="automated-evaluation" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Otomatik Değerlendirme
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              İzleme
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Sonuçlar
            </TabsTrigger>
            <TabsTrigger value="advanced-comparison" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Gelişmiş Karşılaştırma
            </TabsTrigger>
            <TabsTrigger value="turkish-analysis" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Türkçe Analizi
            </TabsTrigger>
            <TabsTrigger value="visual-context" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Görsel-Metin
            </TabsTrigger>
            <TabsTrigger value="topic-drift" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Konu Sapması
            </TabsTrigger>
            <TabsTrigger value="context-noise" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Bağlam Gürültüsü
            </TabsTrigger>
            <TabsTrigger value="coherence-validation" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Tutarlılık Doğrulama
            </TabsTrigger>
            <TabsTrigger value="noise-filtering" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Gürültü Filtreleme
            </TabsTrigger>
            <TabsTrigger value="drift-visualization" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Sapma Görselleştirme
            </TabsTrigger>
          </TabsList>

          {/* Quick Start Wizard Tab */}
          <TabsContent value="quick-start" className="space-y-6">
            <QuickStartWizard
              onComplete={(data) => {
                // Handle wizard completion
                if (data.testContent) {
                  // Create a file from the content
                  const blob = new Blob([data.testContent], { type: 'text/markdown' });
                  const file = new File([blob], 'wizard-content.md', { type: 'text/markdown' });
                  setConfig({
                    ...config,
                    file,
                    testName: data.userProfile.name ? `${data.userProfile.name} Test` : 'Wizard Test',
                    strategy: data.preferences.strategy === 'Semantik (Yüksek Kalite)' ? 'agentic' :
                             data.preferences.strategy === 'Sabit Boyut (Hızlı)' ? 'traditional' :
                             data.preferences.strategy === 'Hibrit (Dengeli)' ? 'comparison' : 'comparison'
                  });
                }
                setActiveTab("configuration");
                toast.success("Hızlı başlangıç tamamlandı! Konfigürasyon sekmesine yönlendiriliyorsunuz.");
              }}
              onStepComplete={(stepId, data) => {
                console.log(`Step ${stepId} completed:`, data);
              }}
              onSkip={() => {
                setActiveTab("configuration");
                toast.info("Hızlı başlangıç atlandı. Konfigürasyon sekmesine yönlendiriliyorsunuz.");
              }}
              enableSkip={true}
              showProgress={true}
            />
          </TabsContent>

          {/* Test Scenarios Tab */}
          <TabsContent value="test-scenarios" className="space-y-6">
            <TestScenarioLibrary
              onScenarioSelect={(scenario) => {
                // Handle scenario selection
                const blob = new Blob([scenario.content], { type: 'text/markdown' });
                const file = new File([blob], `${scenario.id}.md`, { type: 'text/markdown' });
                setConfig({
                  ...config,
                  file,
                  testName: `${scenario.title} Test`,
                  strategy: scenario.difficulty === 'advanced' ? 'agentic' : 'comparison'
                });
                setActiveTab("configuration");
                toast.success(`"${scenario.title}" senaryosu seçildi! Konfigürasyon sekmesine yönlendiriliyorsunuz.`);
              }}
              onQuickTest={async (scenario) => {
                // Handle quick test
                try {
                  const blob = new Blob([scenario.content], { type: 'text/markdown' });
                  const file = new File([blob], `${scenario.id}.md`, { type: 'text/markdown' });
                  
                  // Set configuration
                  const testConfig = {
                    ...config,
                    file,
                    testName: `Quick Test: ${scenario.title}`,
                    strategy: 'comparison' as const
                  };
                  setConfig(testConfig);
                  
                  // Start test immediately
                  setIsRunning(true);
                  setError(null);

                  const fileText = await file.text();
                  const requestBody = {
                    testName: testConfig.testName,
                    inputText: fileText,
                    strategies: ["traditional", "agentic_reasoning"],
                    targetChunkSize: testConfig.chunkSize,
                    overlapSize: testConfig.chunkOverlap,
                    enableGrokReasoning: testConfig.llmReasoningWeight > 0,
                    turkishOptimization: true,
                    sessionId: null
                  };

                  const result = await apiClient.post("/chunking-test/start", requestBody);
                  
                  const initialResult: ChunkingResult = {
                    testId: result.testId,
                    testName: testConfig.testName,
                    status: "running",
                    progress: 0,
                    startTime: new Date().toISOString(),
                    strategy: testConfig.strategy,
                    chunks: [],
                    metrics: {
                      totalChunks: 0,
                      averageChunkSize: 0,
                      chunkSizeVariance: 0,
                      semanticCoherence: 0,
                      boundaryQuality: 0,
                      processingTime: 0,
                    },
                    originalText: "",
                    totalCharacters: 0,
                    processingTime: 0,
                  };

                  setCurrentTest(initialResult);
                  setActiveTab("monitoring");
                  toast.success(`"${scenario.title}" için hızlı test başlatıldı!`);
                  
                  pollTestStatus(result.testId);
                  setTimeout(() => loadTestList(), 1000);
                } catch (error) {
                  console.error("Quick test error:", error);
                  setError(error instanceof Error ? error.message : "Hızlı test başlatılamadı");
                  toast.error("Hızlı test başlatılamadı");
                  setIsRunning(false);
                }
              }}
              enableQuickTest={true}
              showFilters={true}
              enablePreview={true}
            />
          </TabsContent>

          {/* Interactive Tutorial Tab */}
          <TabsContent value="tutorial" className="space-y-6">
            <InteractiveTutorial
              onModuleComplete={(moduleId, progress) => {
                console.log(`Module ${moduleId} completed with progress:`, progress);
                toast.success(`"${moduleId}" modülü tamamlandı!`);
              }}
              onAllModulesComplete={(overallProgress) => {
                console.log("All modules completed:", overallProgress);
                toast.success("Tüm eğitim modülleri tamamlandı! Artık uzman seviyesindesiniz.");
              }}
              enableProgressTracking={true}
              showAchievements={true}
              turkishOptimized={true}
            />
          </TabsContent>

          {/* Content Generator Tab */}
          <TabsContent value="content-generator" className="space-y-6">
            <SampleContentGenerator
              onContentGenerated={(content, template) => {
                // Handle generated content
                const blob = new Blob([content], { type: 'text/markdown' });
                const file = new File([blob], `generated-${template.id}.md`, { type: 'text/markdown' });
                setConfig({
                  ...config,
                  file,
                  testName: `Generated: ${template.title}`,
                  strategy: 'comparison'
                });
                setActiveTab("configuration");
                toast.success(`"${template.title}" içeriği oluşturuldu! Konfigürasyon sekmesine yönlendiriliyorsunuz.`);
              }}
              onQuickTest={async (content, template) => {
                // Handle quick test with generated content
                try {
                  const blob = new Blob([content], { type: 'text/markdown' });
                  const file = new File([blob], `generated-${template.id}.md`, { type: 'text/markdown' });
                  
                  const testConfig = {
                    ...config,
                    file,
                    testName: `Quick Test: Generated ${template.title}`,
                    strategy: 'comparison' as const
                  };
                  setConfig(testConfig);
                  
                  setIsRunning(true);
                  setError(null);

                  const requestBody = {
                    testName: testConfig.testName,
                    inputText: content,
                    strategies: ["traditional", "agentic_reasoning"],
                    targetChunkSize: testConfig.chunkSize,
                    overlapSize: testConfig.chunkOverlap,
                    enableGrokReasoning: testConfig.llmReasoningWeight > 0,
                    turkishOptimization: true,
                    sessionId: null
                  };

                  const result = await apiClient.post("/chunking-test/start", requestBody);
                  
                  const initialResult: ChunkingResult = {
                    testId: result.testId,
                    testName: testConfig.testName,
                    status: "running",
                    progress: 0,
                    startTime: new Date().toISOString(),
                    strategy: testConfig.strategy,
                    chunks: [],
                    metrics: {
                      totalChunks: 0,
                      averageChunkSize: 0,
                      chunkSizeVariance: 0,
                      semanticCoherence: 0,
                      boundaryQuality: 0,
                      processingTime: 0,
                    },
                    originalText: "",
                    totalCharacters: 0,
                    processingTime: 0,
                  };

                  setCurrentTest(initialResult);
                  setActiveTab("monitoring");
                  toast.success(`Generated "${template.title}" için hızlı test başlatıldı!`);
                  
                  pollTestStatus(result.testId);
                  setTimeout(() => loadTestList(), 1000);
                } catch (error) {
                  console.error("Generated content quick test error:", error);
                  setError(error instanceof Error ? error.message : "Hızlı test başlatılamadı");
                  toast.error("Hızlı test başlatılamadı");
                  setIsRunning(false);
                }
              }}
              enableCustomization={true}
              showPreview={true}
              enableDirectTesting={true}
            />
          </TabsContent>

          {/* Best Practices Tab */}
          <TabsContent value="best-practices" className="space-y-6">
            <BestPracticesGuide
              onPracticeSelect={(practiceId) => {
                console.log(`Practice selected: ${practiceId}`);
              }}
              onApplyPractice={(practiceId, settings) => {
                console.log(`Applying practice ${practiceId} with settings:`, settings);
                // Apply practice settings to current configuration
                toast.success(`"${practiceId}" uygulaması aktifleştirildi!`);
              }}
              selectedCategory="all"
              showFilters={true}
              enableBookmarks={true}
            />
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="configuration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Temel Test Ayarları
                  </CardTitle>
                  <CardDescription>
                    Test parametrelerini yapılandırın
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="testName">Test Adı</Label>
                    <Input
                      id="testName"
                      value={config.testName}
                      onChange={(e) =>
                        setConfig({ ...config, testName: e.target.value })
                      }
                      placeholder="Örn: Agentic Chunking Test #1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Chunking Stratejisi</Label>
                    <div className="space-y-2">
                      {[
                        {
                          id: "traditional",
                          label: "Geleneksel Chunking",
                          desc: "Sabit boyut ve overlap ile chunking"
                        },
                        {
                          id: "agentic",
                          label: "Agentic Chunking",
                          desc: "LLM tabanlı akıllı chunking"
                        },
                        {
                          id: "comparison",
                          label: "Karşılaştırmalı Test",
                          desc: "Her iki yöntemi karşılaştır"
                        },
                      ].map((strategy) => (
                        <label
                          key={strategy.id}
                          className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="strategy"
                            value={strategy.id}
                            checked={config.strategy === strategy.id}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                strategy: e.target.value as any,
                              })
                            }
                            className="w-4 h-4 text-blue-600 mt-1"
                          />
                          <div>
                            <div className="text-sm font-medium">{strategy.label}</div>
                            <div className="text-xs text-gray-500">{strategy.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-green-500" />
                    Dosya Yükleme
                  </CardTitle>
                  <CardDescription>
                    Test edilecek Markdown dosyasını yükleyin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {config.file ? (
                      <div className="space-y-2">
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                        <div className="text-sm font-medium">{config.file.name}</div>
                        <div className="text-xs text-gray-500">
                          {(config.file.size / 1024).toFixed(1)} KB
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfig({ ...config, file: null })}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Kaldır
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                        <div className="text-sm text-gray-600">
                          Markdown dosyasını buraya sürükleyin veya
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Dosya Seç
                        </Button>
                        <div className="text-xs text-gray-500">
                          Desteklenen format: .md
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".md"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </CardContent>
              </Card>

              {/* Traditional Chunking Parameters */}
              {(config.strategy === "traditional" || config.strategy === "comparison") && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-orange-500" />
                      Geleneksel Chunking Parametreleri
                    </CardTitle>
                    <CardDescription>
                      Sabit boyut chunking ayarları
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="chunkSize">Chunk Boyutu (karakter)</Label>
                      <Input
                        id="chunkSize"
                        type="number"
                        min="100"
                        max="5000"
                        value={config.chunkSize}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            chunkSize: parseInt(e.target.value) || 1000,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="chunkOverlap">Chunk Overlap (karakter)</Label>
                      <Input
                        id="chunkOverlap"
                        type="number"
                        min="0"
                        max="1000"
                        value={config.chunkOverlap}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            chunkOverlap: parseInt(e.target.value) || 200,
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Agentic Chunking Parameters */}
              {(config.strategy === "agentic" || config.strategy === "comparison") && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      Agentic Chunking Parametreleri
                    </CardTitle>
                    <CardDescription>
                      LLM tabanlı akıllı chunking ayarları
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="similarityThreshold">
                        Benzerlik Eşiği ({config.similarityThreshold})
                      </Label>
                      <input
                        id="similarityThreshold"
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={config.similarityThreshold}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            similarityThreshold: parseFloat(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="llmReasoningWeight">
                        LLM Reasoning Ağırlığı ({config.llmReasoningWeight})
                      </Label>
                      <input
                        id="llmReasoningWeight"
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.1"
                        value={config.llmReasoningWeight}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            llmReasoningWeight: parseFloat(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minChunkSize">Min Chunk Boyutu</Label>
                        <Input
                          id="minChunkSize"
                          type="number"
                          min="50"
                          max="1000"
                          value={config.minChunkSize}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              minChunkSize: parseInt(e.target.value) || 100,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxChunkSize">Max Chunk Boyutu</Label>
                        <Input
                          id="maxChunkSize"
                          type="number"
                          min="500"
                          max="10000"
                          value={config.maxChunkSize}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              maxChunkSize: parseInt(e.target.value) || 2000,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Semantik Sınırları Kullan</Label>
                          <p className="text-sm text-gray-500">
                            Doğal metin sınırlarını dikkate al
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.useSemanticBoundaries}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              useSemanticBoundaries: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Bağlamsal Birleştirme</Label>
                          <p className="text-sm text-gray-500">
                            İlgili chunk'ları akıllıca birleştir
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.enableContextualMerging}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              enableContextualMerging: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Advanced Options */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Gelişmiş Seçenekler
                  </CardTitle>
                  <CardDescription>
                    Kalite metrikleri ve görselleştirme seçenekleri
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Kalite Metrikleri</Label>
                          <p className="text-sm text-gray-500">
                            Detaylı kalite analizi yap
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.enableQualityMetrics}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              enableQualityMetrics: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Görselleştirme</Label>
                          <p className="text-sm text-gray-500">
                            Chunk sınırlarını görselleştir
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.enableVisualization}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              enableVisualization: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Export Formatları</Label>
                      <div className="space-y-2">
                        {[
                          { id: "json", label: "JSON" },
                          { id: "csv", label: "CSV" },
                          { id: "txt", label: "Text" },
                        ].map((format) => (
                          <label
                            key={format.id}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={config.exportFormat.includes(format.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setConfig({
                                    ...config,
                                    exportFormat: [...config.exportFormat, format.id],
                                  });
                                } else {
                                  setConfig({
                                    ...config,
                                    exportFormat: config.exportFormat.filter(
                                      (f) => f !== format.id
                                    ),
                                  });
                                }
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm">{format.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      onClick={startChunkingTest}
                      disabled={
                        isRunning ||
                        !config.testName.trim() ||
                        !config.file
                      }
                      className="w-full"
                      size="lg"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Test başlatılıyor...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-5 w-5" />
                          Chunking Testini Başlat
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Automated Evaluation Tab */}
          <TabsContent value="automated-evaluation" className="space-y-6">
            <Tabs defaultValue="engine" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="engine">Evaluation Engine</TabsTrigger>
                <TabsTrigger value="assessment">Quality Assessment</TabsTrigger>
                <TabsTrigger value="metrics">Metrics Display</TabsTrigger>
                <TabsTrigger value="monitoring">Continuous Monitoring</TabsTrigger>
                <TabsTrigger value="reports">Automated Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="engine" className="space-y-4">
                <AutomatedEvaluationEngine
                  chunks={currentTest?.chunks || []}
                  originalText={currentTest?.originalText || ""}
                  strategy={currentTest?.strategy || "unknown"}
                  onEvaluationComplete={(results) => {
                    console.log("Evaluation completed:", results);
                    // Update current test with evaluation results
                    if (currentTest) {
                      setCurrentTest({
                        ...currentTest,
                        evaluationResults: results
                      });
                    }
                  }}
                  enableRealTimeEvaluation={true}
                  showDetailedAnalysis={true}
                />
              </TabsContent>

              <TabsContent value="assessment" className="space-y-4">
                <QualityAssessmentPanel
                  chunks={currentTest?.chunks || []}
                  originalText={currentTest?.originalText || ""}
                  enableComparison={true}
                  showRecommendations={true}
                  turkishLanguageSupport={true}
                />
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                <EvaluationMetricsDisplay
                  metrics={[]}
                  historicalData={[]}
                  comparisonData={currentTest?.comparison}
                  onMetricSelect={(metric) => {
                    console.log("Metric selected:", metric);
                  }}
                  enableInteractiveCharts={true}
                  showTrendAnalysis={true}
                  realTimeUpdates={true}
                />
              </TabsContent>

              <TabsContent value="monitoring" className="space-y-4">
                <ContinuousMonitoring
                  chunks={currentTest?.chunks || []}
                  onAlert={(alert) => {
                    console.log("Quality alert:", alert);
                    // Handle quality alerts
                  }}
                  enableNotifications={true}
                  alertThresholds={{
                    semanticCoherence: 0.7,
                    boundaryPrecision: 0.75,
                    informationRetention: 0.8,
                    contextPreservation: 0.7,
                    referenceIntegrity: 0.85
                  }}
                />
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <EvaluationReports
                  evaluationResults={currentTest?.evaluationResults}
                  chunks={currentTest?.chunks || []}
                  originalText={currentTest?.originalText || ""}
                  historicalData={testList.map(test => ({
                    testId: test.testId,
                    testName: test.testName,
                    timestamp: test.createdAt,
                    results: {} // Would contain evaluation results if available
                  }))}
                  comparisonData={currentTest?.comparison ? [currentTest.comparison] : []}
                  onReportGenerated={(report) => {
                    console.log("Report generated:", report);
                    // Handle report generation
                  }}
                  onReportShared={(reportId, method) => {
                    console.log(`Report ${reportId} shared via ${method}`);
                    // Handle report sharing
                  }}
                  enableSharing={true}
                  enableScheduling={false}
                />
              </TabsContent>
            </Tabs>

            {/* No Test Data State */}
            {!currentTest && (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Otomatik Değerlendirme Mevcut Değil
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Otomatik değerlendirme sistemini kullanmak için önce bir test başlatın.
                  </p>
                  <Button
                    onClick={() => setActiveTab("configuration")}
                    variant="outline"
                  >
                    Test Başlat
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <TestResultsDashboard
              testResults={testList.map(test => ({
                testId: test.testId,
                testName: test.testName,
                status: test.status as "running" | "completed" | "failed" | "stopped",
                progress: test.status === "completed" ? 100 : test.status === "running" ? 50 : 0,
                startTime: test.createdAt,
                endTime: test.status === "completed" ? test.updatedAt : undefined,
                strategy: test.strategies?.[0] || "unknown",
                chunks: [],
                metrics: {
                  totalChunks: 0,
                  averageChunkSize: 0,
                  chunkSizeVariance: 0,
                  semanticCoherence: 0,
                  boundaryQuality: 0,
                  processingTime: 0,
                },
                comparison: undefined,
                originalText: "",
                totalCharacters: test.inputTextLength || 0,
                processingTime: 0,
              }))}
              currentTest={currentTest ? {
                testId: currentTest.testId,
                testName: currentTest.testName,
                status: currentTest.status,
                progress: currentTest.progress,
                startTime: currentTest.startTime,
                endTime: currentTest.endTime,
                strategy: currentTest.strategy,
                chunks: currentTest.chunks,
                metrics: currentTest.metrics,
                comparison: currentTest.comparison,
                originalText: currentTest.originalText,
                totalCharacters: currentTest.totalCharacters,
                processingTime: currentTest.processingTime,
              } : null}
              onStartTest={() => setActiveTab("configuration")}
              onStopTest={stopTest}
              onExportResults={(format) => {
                if (currentTest) {
                  if (format === "pdf") {
                    exportComprehensivePdfReport(currentTest.testId);
                  } else if (format === "csv") {
                    exportAcademicReport(currentTest.testId);
                  } else {
                    exportTest(currentTest.testId);
                  }
                }
              }}
              onRefreshData={loadTestList}
              realTimeUpdates={true}
            />
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            {currentTest ? (
              <div className="space-y-6">
                {/* Status Overview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Test Durumu: {currentTest.testName}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {currentTest.status === "running" && (
                          <Badge className="bg-green-500 animate-pulse">
                            Çalışıyor
                          </Badge>
                        )}
                        {currentTest.status === "completed" && (
                          <Badge className="bg-blue-500">Tamamlandı</Badge>
                        )}
                        {currentTest.status === "failed" && (
                          <Badge className="bg-red-500">Başarısız</Badge>
                        )}
                        {currentTest.status === "stopped" && (
                          <Badge className="bg-gray-500">Durduruldu</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>İlerleme</span>
                        <span>{Math.round(currentTest.progress)}%</span>
                      </div>
                      <Progress value={currentTest.progress} />

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {currentTest.totalCharacters || 0}
                          </div>
                          <div className="text-sm text-gray-500">
                            Toplam Karakter
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {currentTest.metrics.totalChunks || 0}
                          </div>
                          <div className="text-sm text-gray-500">
                            Oluşturulan Chunk
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {currentTest.strategy}
                          </div>
                          <div className="text-sm text-gray-500">
                            Strateji
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {currentTest.processingTime || 0}s
                          </div>
                          <div className="text-sm text-gray-500">
                            İşlem Süresi
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t">
                        {isRunning && (
                          <Button
                            onClick={stopTest}
                            variant="destructive"
                            size="sm"
                          >
                            <Square className="mr-2 h-4 w-4" />
                            Durdur
                          </Button>
                        )}
                        <Button onClick={resetTest} variant="outline" size="sm">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Sıfırla
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Henüz Aktif Test Yok
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Monitoring verilerini görmek için önce bir test başlatın.
                  </p>
                  <Button
                    onClick={() => setActiveTab("configuration")}
                    variant="outline"
                  >
                    Test Başlat
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {currentTest && currentTest.status === "completed" ? (
              <div className="space-y-6">
                {/* Test Summary */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Test Sonuçları: {currentTest.testName}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportTest(currentTest.testId)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          JSON Export
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportAcademicReport(currentTest.testId)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Markdown Rapor
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportComprehensivePdfReport(currentTest.testId)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          PDF Rapor
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTest(currentTest.testId, currentTest.testName)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Düzenle
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTest(currentTest.testId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Sil
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Toplam Chunk</div>
                        <div className="text-lg font-semibold">
                          {currentTest.metrics.totalChunks}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Ortalama Boyut</div>
                        <div className="text-lg font-semibold">
                          {Math.round(currentTest.metrics.averageChunkSize)} karakter
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Semantik Uyum</div>
                        <div className="text-lg font-semibold">
                          {(currentTest.metrics.semanticCoherence * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">İşlem Süresi</div>
                        <div className="text-lg font-semibold">
                          {currentTest.processingTime}s
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Chunk List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      Oluşturulan Chunk'lar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {currentTest.chunks.map((chunk, index) => (
                        <div
                          key={chunk.id}
                          className="border rounded-lg p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">Chunk #{index + 1}</Badge>
                            <div className="text-sm text-gray-500">
                              {chunk.size} karakter
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            {chunk.content.substring(0, 200)}
                            {chunk.content.length > 200 && "..."}
                          </div>
                          {chunk.reasoning && (
                            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                              <strong>LLM Reasoning:</strong> {chunk.reasoning}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Henüz Sonuç Yok
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Sonuçları görmek için önce bir test başlatın ve tamamlayın.
                  </p>
                  <Button
                    onClick={() => setActiveTab("configuration")}
                    variant="outline"
                  >
                    Test Başlat
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Test List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <List className="h-5 w-5" />
                    Önceki Testler
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadTestList}
                    disabled={isLoadingTests}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingTests ? "animate-spin" : ""}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {testList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Henüz test yok</p>
                ) : (
                  <div className="space-y-2">
                    {testList.map((test) => (
                      <div
                        key={test.testId}
                        className={`p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors ${
                          selectedTestId === test.testId ? "bg-blue-50 border-blue-200" : ""
                        }`}
                        onClick={() => loadTestDetails(test.testId)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-semibold">{test.testName}</p>
                            <p className="text-sm text-muted-foreground">
                              {test.strategies?.join(", ") || "Unknown"} | {test.inputTextLength} karakter
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(test.createdAt).toLocaleString("tr-TR")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                test.status === "completed"
                                  ? "default"
                                  : test.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {test.status}
                            </Badge>
                            {test.status === "completed" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    exportTest(test.testId);
                                  }}
                                  title="JSON Export"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    exportAcademicReport(test.testId);
                                  }}
                                  title="Markdown Rapor"
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    exportComprehensivePdfReport(test.testId);
                                  }}
                                  title="PDF Rapor"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTest(test.testId, test.testName);
                              }}
                              title="Düzenle"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTest(test.testId);
                              }}
                              className="text-red-600 hover:text-red-700"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visual-Text Context Tab */}
          <TabsContent value="visual-context" className="space-y-6">
            <ContextPreservationTester
              onRunTest={async (scenario, config) => {
                // Mock test function for now - in real implementation this would
                // integrate with the chunking API to test visual-text context preservation
                return new Promise((resolve) => {
                  setTimeout(() => {
                    resolve({
                      scenarioId: scenario.id,
                      timestamp: new Date().toISOString(),
                      strategy: "Agentic Chunking",
                      preservationRate: 0.75 + Math.random() * 0.2,
                      contextCoherence: 0.7 + Math.random() * 0.25,
                      averageSeparationDistance: 200 + Math.random() * 300,
                      detectedReferences: Math.floor(5 + Math.random() * 10),
                      preservedReferences: Math.floor(3 + Math.random() * 8),
                      separatedReferences: Math.floor(1 + Math.random() * 3),
                      lostReferences: Math.floor(0 + Math.random() * 2),
                      passed: Math.random() > 0.3,
                      score: 65 + Math.random() * 30,
                      details: {
                        chunkCount: Math.floor(8 + Math.random() * 12),
                        processingTime: 2.5 + Math.random() * 3
                      }
                    });
                  }, 3000);
                });
              }}
              enableCustomScenarios={true}
              showDetailedResults={true}
            />
          </TabsContent>

          {/* Turkish Academic Analysis Tab */}
          <TabsContent value="turkish-analysis" className="space-y-6">
            {currentTest && currentTest.status === "completed" && currentTest.comparison ? (
              <TurkishAcademicAnalyzer
                comparison={currentTest.comparison}
                originalText={currentTest.originalText}
                testName={currentTest.testName}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Türkçe Akademik Analizi Mevcut Değil
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {!currentTest ? "Türkçe akademik analizi görmek için önce bir karşılaştırmalı test tamamlayın." :
                     currentTest.status !== "completed" ? "Test henüz tamamlanmadı." :
                     !currentTest.comparison ? "Bu test karşılaştırmalı veri içermiyor." :
                     "Türkçe analiz verisi mevcut değil."}
                  </p>
                  {!currentTest && (
                    <Button
                      onClick={() => setActiveTab("configuration")}
                      variant="outline"
                    >
                      Karşılaştırmalı Test Başlat
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reasoning Analysis Tab */}
          <TabsContent value="reasoning" className="space-y-6">
            {currentTest && currentTest.status === "completed" && currentTest.chunks.some(chunk => chunk.reasoning) ? (
              <ReasoningDisplay
                chunks={currentTest.chunks}
                strategy={currentTest.strategy}
                showTimeline={true}
                enableFiltering={true}
                enableSearch={true}
                turkishOptimized={true}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Reasoning Analizi Mevcut Değil
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {!currentTest ? "Reasoning analizini görmek için önce bir test tamamlayın." :
                     currentTest.status !== "completed" ? "Test henüz tamamlanmadı." :
                     "Bu test için LLM reasoning verisi mevcut değil."}
                  </p>
                  {!currentTest && (
                    <Button
                      onClick={() => setActiveTab("configuration")}
                      variant="outline"
                    >
                      Test Başlat
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Visualization Tab */}
          <TabsContent value="visualization" className="space-y-6">
            {currentTest && currentTest.status === "completed" && config.enableVisualization ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Chunk Görselleştirmesi
                  </CardTitle>
                  <CardDescription>
                    Metin içindeki chunk sınırlarının görsel temsili
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-4">
                      Her renk farklı bir chunk'ı temsil eder. Chunk sınırları kalın çizgilerle gösterilir.
                    </div>
                    <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                      <div className="text-sm leading-relaxed">
                        {currentTest.chunks.map((chunk, index) => (
                          <span
                            key={chunk.id}
                            className={`inline-block p-1 m-1 rounded border-l-4 ${
                              index % 6 === 0 ? "bg-red-100 border-red-500" :
                              index % 6 === 1 ? "bg-blue-100 border-blue-500" :
                              index % 6 === 2 ? "bg-green-100 border-green-500" :
                              index % 6 === 3 ? "bg-yellow-100 border-yellow-500" :
                              index % 6 === 4 ? "bg-purple-100 border-purple-500" :
                              "bg-pink-100 border-pink-500"
                            }`}
                            title={`Chunk ${index + 1}: ${chunk.size} karakter`}
                          >
                            {chunk.content}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Görselleştirme Mevcut Değil
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Görselleştirme için önce bir test tamamlayın ve görselleştirme seçeneğini etkinleştirin.
                  </p>
                  <Button
                    onClick={() => setActiveTab("configuration")}
                    variant="outline"
                  >
                    Test Başlat
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Token Analysis Tab */}
          <TabsContent value="token-analysis" className="space-y-6">
            {currentTest && currentTest.status === "completed" ? (
              <TokenAnalysis
                chunks={currentTest.chunks}
                originalText={currentTest.originalText}
                strategy={currentTest.strategy}
                enableTurkishAnalysis={true}
                showCostAnalysis={true}
                tokenPricing={{
                  inputCostPer1K: 0.0015,
                  outputCostPer1K: 0.002
                }}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Token Analizi Mevcut Değil
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Token analizini görmek için önce bir test tamamlayın.
                  </p>
                  <Button
                    onClick={() => setActiveTab("configuration")}
                    variant="outline"
                  >
                    Test Başlat
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Size Analysis Tab */}
          <TabsContent value="size-analysis" className="space-y-6">
            {currentTest && currentTest.status === "completed" ? (
              <ChunkSizeAnalyzer
                chunks={currentTest.chunks}
                originalText={currentTest.originalText}
                strategy={currentTest.strategy}
                comparisonData={currentTest.comparison}
                enableHeatmap={true}
                showTrendAnalysis={true}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Boyut Analizi Mevcut Değil
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Boyut analizini görmek için önce bir test tamamlayın.
                  </p>
                  <Button
                    onClick={() => setActiveTab("configuration")}
                    variant="outline"
                  >
                    Test Başlat
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Token Analysis Tab */}
          <TabsContent value="token-analysis" className="space-y-6">
            {currentTest && currentTest.status === "completed" ? (
              <TokenAnalysis
                chunks={currentTest.chunks}
                originalText={currentTest.originalText}
                strategy={currentTest.strategy}
                enableTurkishAnalysis={true}
                showCostAnalysis={true}
                tokenPricing={{
                  inputCostPer1K: 0.0015,
                  outputCostPer1K: 0.002
                }}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Token Analizi Mevcut Değil
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Token analizini görmek için önce bir test tamamlayın.
                  </p>
                  <Button
                    onClick={() => setActiveTab("configuration")}
                    variant="outline"
                  >
                    Test Başlat
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Size Analysis Tab */}
          <TabsContent value="size-analysis" className="space-y-6">
            {currentTest && currentTest.status === "completed" ? (
              <ChunkSizeAnalyzer
                chunks={currentTest.chunks}
                originalText={currentTest.originalText}
                strategy={currentTest.strategy}
                comparisonData={currentTest.comparison}
                enableHeatmap={true}
                showTrendAnalysis={true}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Boyut Analizi Mevcut Değil
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Boyut analizini görmek için önce bir test tamamlayın.
                  </p>
                  <Button
                    onClick={() => setActiveTab("configuration")}
                    variant="outline"
                  >
                    Test Başlat
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Visualization Tab */}
          <TabsContent value="visualization" className="space-y-6">
            {currentTest && currentTest.status === "completed" && config.enableVisualization ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Chunk Görselleştirmesi
                  </CardTitle>
                  <CardDescription>
                    Metin içindeki chunk sınırlarının görsel temsili
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-4">
                      Her renk farklı bir chunk'ı temsil eder. Chunk sınırları kalın çizgilerle gösterilir.
                    </div>
                    <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                      <div className="text-sm leading-relaxed">
                        {currentTest.chunks.map((chunk, index) => (
                          <span
                            key={chunk.id}
                            className={`inline-block p-1 m-1 rounded border-l-4 ${
                              index % 6 === 0 ? "bg-red-100 border-red-500" :
                              index % 6 === 1 ? "bg-blue-100 border-blue-500" :
                              index % 6 === 2 ? "bg-green-100 border-green-500" :
                              index % 6 === 3 ? "bg-yellow-100 border-yellow-500" :
                              index % 6 === 4 ? "bg-purple-100 border-purple-500" :
                              "bg-pink-100 border-pink-500"
                            }`}
                            title={`Chunk ${index + 1}: ${chunk.size} karakter`}
                          >
                            {chunk.content}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Görselleştirme Mevcut Değil
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Görselleştirme için önce bir test tamamlayın ve görselleştirme seçeneğini etkinleştirin.
                  </p>
                  <Button
                    onClick={() => setActiveTab("configuration")}
                    variant="outline"
                  >
                    Test Başlat
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Topic Drift Detection Tab */}
          <TabsContent value="topic-drift" className="space-y-6">
            {currentTest && currentTest.status === "completed" ? (
              <TopicDriftDetector
                chunks={currentTest.chunks}
                originalText={currentTest.originalText}
                onDriftDetected={(driftData) => {
                  console.log("Topic drift detected:", driftData);
                  toast.error(`Konu sapması tespit edildi: ${driftData.driftType} (Skor: ${(driftData.driftScore * 100).toFixed(1)}%)`);
                }}
                onAnalysisComplete={(results) => {
                  console.log("Topic drift analysis completed:", results);
                  toast.success("Konu sapması analizi tamamlandı!");
                }}
                enableRealTimeAnalysis={true}
                showDetailedResults={true}
                turkishOptimized={true}
                alertThresholds={{
                  gradualDrift: 0.3,
                  abruptDrift: 0.5,
                  oscillatingDrift: 0.4,
                  chaoticDrift: 0.6
                }}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Konu Sapması Analizi Mevcut Değil
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Konu sapması analizini görmek için önce bir test tamamlayın.
                  </p>
                  <Button
                    onClick={() => setActiveTab("configuration")}
                    variant="outline"
                  >
                    Test Başlat
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Context Noise Analysis Tab */}
          <TabsContent value="context-noise" className="space-y-6">
            {currentTest && currentTest.status === "completed" ? (
              <ContextNoiseAnalyzer
                chunks={currentTest.chunks}
                originalText={currentTest.originalText}
                onNoiseDetected={(noiseData) => {
                  console.log("Context noise detected:", noiseData);
                  toast.warning(`Bağlam gürültüsü tespit edildi: ${noiseData.noiseType} (Seviye: ${noiseData.noiseLevel})`);
                }}
                onAnalysisComplete={(results) => {
                  console.log("Context noise analysis completed:", results);
                  toast.success("Bağlam gürültüsü analizi tamamlandı!");
                }}
                enableAutoCleanup={true}
                showRecommendations={true}
                turkishOptimized={true}
                noiseThresholds={{
                  encoding: 0.1,
                  morphological: 0.15,
                  semantic: 0.2,
                  contextual: 0.25
                }}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Bağlam Gürültüsü Analizi Mevcut Değil
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Bağlam gürültüsü analizini görmek için önce bir test tamamlayın.
                  </p>
                  <Button
                    onClick={() => setActiveTab("configuration")}
                    variant="outline"
                  >
                    Test Başlat
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Coherence Validation Tab */}
          <TabsContent value="coherence-validation" className="space-y-6">
            {currentTest && currentTest.status === "completed" ? (
              <CoherenceValidator
                chunks={currentTest.chunks}
                originalText={currentTest.originalText}
                onValidationComplete={(results) => {
                  console.log("Coherence validation completed:", results);
                  toast.success("Tutarlılık doğrulaması tamamlandı!");
                }}
                onCoherenceIssue={(issue) => {
                  console.log("Coherence issue detected:", issue);
                  toast.warning(`Tutarlılık sorunu: ${issue.issueType} (Chunk ${issue.chunkIndex + 1})`);
                }}
                enableDetailedAnalysis={true}
                showRecommendations={true}
                turkishOptimized={true}
                coherenceThresholds={{
                  internal: 0.7,
                  external: 0.6,
                  semantic: 0.65,
                  linguistic: 0.75
                }}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Tutarlılık Doğrulaması Mevcut Değil
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Tutarlılık doğrulamasını görmek için önce bir test tamamlayın.
                  </p>
                  <Button
                    onClick={() => setActiveTab("configuration")}
                    variant="outline"
                  >
                    Test Başlat
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Noise Filtering Tab */}
          <TabsContent value="noise-filtering" className="space-y-6">
            {currentTest && currentTest.status === "completed" ? (
              <NoiseFilterEngine
                chunks={currentTest.chunks}
                originalText={currentTest.originalText}
                onFilteringComplete={(results) => {
                  console.log("Noise filtering completed:", results);
                  toast.success("Gürültü filtreleme tamamlandı!");
                }}
                onNoiseFiltered={(filterData) => {
                  console.log("Noise filtered:", filterData);
                  toast.info(`${filterData.filteredCount} gürültü öğesi temizlendi`);
                }}
                enableAutoFiltering={true}
                showBeforeAfter={true}
                turkishOptimized={true}
                filteringOptions={{
                  removeEncoding: true,
                  fixMorphology: true,
                  cleanPunctuation: true,
                  removeDuplicates: true,
                  preserveContext: true
                }}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Gürültü Filtreleme Mevcut Değil
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Gürültü filtrelemeyi görmek için önce bir test tamamlayın.
                  </p>
                  <Button
                    onClick={() => setActiveTab("configuration")}
                    variant="outline"
                  >
                    Test Başlat
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Drift Visualization Tab */}
          <TabsContent value="drift-visualization" className="space-y-6">
            {currentTest && currentTest.status === "completed" ? (
              <DriftVisualization
                chunks={currentTest.chunks}
                originalText={currentTest.originalText}
                onVisualizationReady={(vizData) => {
                  console.log("Drift visualization ready:", vizData);
                  toast.success("Sapma görselleştirmesi hazır!");
                }}
                onDriftHighlighted={(driftInfo) => {
                  console.log("Drift highlighted:", driftInfo);
                  toast.info(`Sapma vurgulandı: ${driftInfo.driftType} (Chunk ${driftInfo.chunkIndex + 1})`);
                }}
                enableInteractiveMode={true}
                showAnimations={true}
                turkishOptimized={true}
                visualizationOptions={{
                  showTimeline: true,
                  showHeatmap: true,
                  showClusters: true,
                  showFlowDiagram: true,
                  enableZoom: true,
                  enableFiltering: true
                }}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Sapma Görselleştirmesi Mevcut Değil
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Sapma görselleştirmesini görmek için önce bir test tamamlayın.
                  </p>
                  <Button
                    onClick={() => setActiveTab("configuration")}
                    variant="outline"
                  >
                    Test Başlat
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Advanced Comparison Tab */}
          <TabsContent value="advanced-comparison" className="space-y-6">
            {currentTest && currentTest.status === "completed" && currentTest.comparison ? (
              <div className="space-y-6">
                <ChunkingComparison
                  comparison={currentTest.comparison}
                  originalText={currentTest.originalText}
                  testName={currentTest.testName}
                />
                <VisualTextContextAnalyzer
                  chunks={currentTest.chunks}
                  originalText={currentTest.originalText}
                  onAnalysisComplete={(results) => {
                    console.log("Visual-text context analysis completed:", results);
                  }}
                  enableVisualization={true}
                  showDetailedResults={true}
                />
                <ReferenceIntegrityChecker
                  chunks={currentTest.chunks}
                  originalText={currentTest.originalText}
                  onIntegrityCheck={(results) => {
                    console.log("Reference integrity check completed:", results);
                  }}
                  enableAutoRepair={true}
                  showRecommendations={true}
                />
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Gelişmiş Karşılaştırma Mevcut Değil
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {!currentTest ? "Gelişmiş karşılaştırma görmek için önce bir karşılaştırmalı test tamamlayın." :
                     currentTest.status !== "completed" ? "Test henüz tamamlanmadı." :
                     !currentTest.comparison ? "Bu test karşılaştırmalı veri içermiyor." :
                     "Karşılaştırma verisi mevcut değil."}
                  </p>
                  {!currentTest && (
                    <Button
                      onClick={() => setActiveTab("configuration")}
                      variant="outline"
                    >
                      Karşılaştırmalı Test Başlat
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Test Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Adını Düzenle</DialogTitle>
            <DialogDescription>
              Test adını değiştirin
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="testName">Test Adı</Label>
            <Input
              id="testName"
              value={editingTestName}
              onChange={(e) => setEditingTestName(e.target.value)}
              placeholder="Test adı girin"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={saveEditTest}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Test Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Testi Sil</DialogTitle>
            <DialogDescription>
              Bu testi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTest}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TeacherLayout>
  );
}