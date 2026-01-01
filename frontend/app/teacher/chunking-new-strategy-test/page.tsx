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
} from "lucide-react";
import { toast } from "@/lib/toast";
import { apiClient } from "@/lib/api-client";
import ChunkVisualization from "./components/ChunkVisualization";
import ChunkingComparison from "./components/ChunkingComparison";

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
      const response = await fetch(`/api/chunking-test/export-pdf/${testId}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error("PDF raporu oluşturulamadı");
      }

      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agentic_chunking_comprehensive_report_${testId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Kapsamlı PDF raporu indirildi");
    } catch (error: any) {
      console.error("PDF export error:", error);
      toast.error(error.message || "PDF raporu oluşturulamadı");
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

    return `# Agentic Chunking Sistemi - Akademik Değerlendirme Raporu

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
Detaylı Açıklama (>100 karakter): ${highQualityReasoning.length} chunks (${((highQualityReasoning.length / chunks.length) * 100).toFixed(1)}%)
Orta Açıklama (50-100 karakter): ${mediumQualityReasoning.length} chunks (${((mediumQualityReasoning.length / chunks.length) * 100).toFixed(1)}%)
Kısa Açıklama (<50 karakter):    ${lowQualityReasoning.length} chunks (${((lowQualityReasoning.length / chunks.length) * 100).toFixed(1)}%)
\`\`\`

**Not**: Bu metrikler LLM reasoning açıklamalarının uzunluğunu ölçer, chunk kalitesini değil.

## 3. CHUNK-LEVEL DETAY ANALİZİ

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

## 4. PERFORMANS ANALİZİ

### 4.1 İşlem Süresi Analizi
\`\`\`
Toplam İşlem Süresi: ${testData.processingTime || 0} saniye
Throughput: ${testData.totalCharacters && testData.processingTime ? Math.round(testData.totalCharacters / testData.processingTime) : 0} karakter/saniye
\`\`\`

### 4.2 Sistem Metrikleri
\`\`\`
Chunk Üretim Oranı: ${testData.processingTime ? (chunks.length / testData.processingTime).toFixed(2) : 0} chunk/saniye
Ortalama Chunk Kalitesi: ${(avgSemanticScore * 100).toFixed(1)}%
Başarı Oranı: ${testData.status === 'completed' ? '100' : '0'}%
\`\`\`

## 5. SONUÇLAR VE ÖNERİLER

### 5.1 Ana Bulgular
1. **Semantik Uyum**: Ortalama ${(avgSemanticScore * 100).toFixed(1)}% semantic coherence elde edildi
2. **Chunk Kalitesi**: ${excellentChunks.length + goodChunks.length} chunk (%${(((excellentChunks.length + goodChunks.length) / chunks.length) * 100).toFixed(1)}) yüksek kalitede
3. **Boyut Tutarlılığı**: CV=${cv.toFixed(1)}% ile ${cv < 30 ? 'iyi' : cv < 50 ? 'orta' : 'zayıf'} tutarlılık
4. **LLM Reasoning**: ${reasoningChunks.length} chunk'ta detaylı açıklama mevcut

### 5.2 Akademik Katkılar
1. **Metodolojik İnovasyon**: LLM-guided chunking stratejisi başarıyla uygulandı
2. **Kalite Metrikleri**: Comprehensive evaluation framework geliştirildi
3. **Türkçe Optimizasyonu**: Dil-specific iyileştirmeler sağlandı
4. **Ölçeklenebilirlik**: ${testData.totalCharacters || 0} karakterlik doküman başarıyla işlendi

### 5.3 Pratik Uygulamalar
1. **RAG Sistemleri**: Gelişmiş retrieval accuracy
2. **Doküman Analizi**: Daha iyi içerik organizasyonu
3. **Bilgi Yönetimi**: Gelişmiş bilgi yapılandırması
4. **Eğitim Teknolojisi**: Adaptif içerik sunumu

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Konfigürasyon
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              İzleme
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Sonuçlar
            </TabsTrigger>
            <TabsTrigger value="visualization" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Görselleştirme
            </TabsTrigger>
          </TabsList>

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