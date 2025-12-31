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
} from "lucide-react";
import { toast } from "@/lib/toast";
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
  
  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Polling interval ref
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef<boolean>(false);

  useEffect(() => {
    setMounted(true);
    loadTestList();
  }, []);

  // Load test list
  const loadTestList = async () => {
    try {
      const response = await fetch("/api/chunking-test/list");
      if (!response.ok) {
        console.error("Failed to load test list");
        return;
      }
      const data = await response.json();
      if (data.success && data.tests) {
        setTestList(data.tests);
      }
    } catch (error) {
      console.error("Error loading test list:", error);
    }
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
        strategies: config.strategy === "comparison" ? ["traditional", "agentic"] : [config.strategy],
        targetChunkSize: config.chunkSize,
        overlapSize: config.chunkOverlap,
        enableGrokReasoning: config.llmReasoningWeight > 0,
        turkishOptimization: true,
        sessionId: null
      };

      const response = await fetch("/api/chunking-test/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Test başlatılamadı" }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

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
        const response = await fetch(`/api/chunking-test/status/${testId}`);
        if (!response.ok) {
          console.error(`Failed to fetch test status: ${response.status}`);
          return;
        }

        const status = await response.json();

        setCurrentTest((prevTest) => {
          if (!prevTest || prevTest.testId !== testId) {
            return prevTest;
          }

          return {
            ...prevTest,
            progress: Math.max(prevTest.progress || 0, status.progress || 0),
            status: status.status || prevTest.status,
            endTime: status.endTime || prevTest.endTime,
            chunks: status.chunks || prevTest.chunks,
            metrics: status.metrics || prevTest.metrics,
            comparison: status.comparison || prevTest.comparison,
            originalText: status.originalText || prevTest.originalText,
            totalCharacters: status.totalCharacters || prevTest.totalCharacters,
            processingTime: status.processingTime || prevTest.processingTime,
          };
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
        const response = await fetch(`/api/chunking-test/stop/${currentTest.testId}`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Test durdurulamadı");
        }

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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Test Sonuçları: {currentTest.testName}
                    </CardTitle>
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
    </TeacherLayout>
  );
}