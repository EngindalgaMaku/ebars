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
  const [evaluationResults, setEvaluationResults] = useState<any>(null);
  const [qualityAssessment, setQualityAssessment] = useState<any>(null);
  const [automatedEvaluationTab, setAutomatedEvaluationTab] = useState("engine");
  const [wizardData, setWizardData] = useState<any>({});

  const handleRunScenario = async (scenario: any) => {
    toast.info(`Running scenario: ${scenario.name}`);
    // Placeholder for actual implementation
  };

  const handlePreviewScenario = (scenario: any) => {
    toast.info(`Previewing scenario: ${scenario.name}`);
    // Placeholder for actual implementation
  };

  const handleContentGenerated = (content: any) => {
    toast.success(`Content generated: ${content.title}`);
    // Placeholder for actual implementation
  };

  const handleContentTest = (content: any) => {
    toast.info(`Testing generated content: ${content.title}`);
    // Placeholder for actual implementation
  };

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

  // Start a new chunking test
  const startChunkingTest = async () => {
    if (!config.file || !config.testName) {
      toast.error("Lütfen bir test adı girin ve bir dosya seçin.");
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", config.file);
      formData.append("config", JSON.stringify(config));

      const response = await apiClient.post("/chunking-test/start", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.success && response.testId) {
        toast.success(`Test '${config.testName}' başlatıldı.`);
        setCurrentTest({
          testId: response.testId,
          testName: config.testName,
          status: "running",
          progress: 0,
          startTime: new Date().toISOString(),
          strategy: config.strategy,
          chunks: [],
          metrics: {} as any,
          originalText: "",
          totalCharacters: 0,
          processingTime: 0,
        });
        setSelectedTestId(response.testId);
        setActiveTab("results");
        pollStatus(response.testId);
      } else {
        throw new Error(response.error || "Test başlatılamadı");
      }
    } catch (error: any) {
      console.error("Start test error:", error);
      setError(error.message || "Test başlatılırken bir hata oluştu.");
      setIsRunning(false);
    }
  };

  // Stop the currently running test
  const stopTest = async () => {
    if (!currentTest || !isRunning) return;

    try {
      await apiClient.post(`/chunking-test/stop/${currentTest.testId}`);
      toast.info("Test durduruldu.");
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsRunning(false);
      if (currentTest) {
        setCurrentTest({ ...currentTest, status: "stopped" });
      }
    } catch (error) {
      console.error("Stop test error:", error);
      toast.error("Test durdurulamadı.");
    }
  };

  // Poll for test status
  const pollStatus = (testId: string) => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const status = await apiClient.get(`/chunking-test/status/${testId}`);
        if (status.status === "completed" || status.status === "failed") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          isPollingRef.current = false;
          setIsRunning(false);
          loadTestDetails(testId);
        } else {
          setCurrentTest((prev) => prev ? { ...prev, progress: status.progress, status: status.status } : null);
        }
      } catch (error) {
        console.error("Polling error:", error);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        isPollingRef.current = false;
        setIsRunning(false);
      }
    }, 2000);
  };

  // Reset configuration
  const resetConfig = () => {
    setConfig({
      testName: "",
      strategy: "comparison",
      file: null,
      chunkSize: 1000,
      chunkOverlap: 200,
      similarityThreshold: 0.7,
      llmReasoningWeight: 0.3,
      maxChunkSize: 2000,
      minChunkSize: 100,
      useSemanticBoundaries: true,
      enableContextualMerging: true,
      enableQualityMetrics: true,
      enableVisualization: true,
      exportFormat: ["json", "csv"],
    });
    toast.info("Konfigürasyon sıfırlandı.");
  };

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
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.message || "Export başarısız");
    }
  };

  const exportAcademicReport = async (testId: string) => {
    toast.info(`Export not implemented: ${testId.substring(0, 8)}`);
  };

  const exportComprehensivePdfReport = async (testId: string) => {
    toast.info(`Export not implemented: ${testId.substring(0, 8)}`);
  };

  const evaluationMetricsArray = React.useMemo(() => {
    const rawMetrics = evaluationResults?.metrics;
    if (!rawMetrics || typeof rawMetrics !== "object") return [];

    return Object.entries(rawMetrics).map(([id, metric]: [string, any]) => {
      const score = metric?.score ?? 0;
      return {
        id,
        name: id,
        score,
        currentScore: score,
        passed: Boolean(metric?.passed),
        threshold: 0,
        category: "general",
      };
    });
  }, [evaluationResults]);

  if (!mounted) return null;

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Chunking New Strategy Test</h1>
            <p className="text-sm text-muted-foreground">
              Build hatalarını gidermek için sayfa geçici olarak sadeleştirildi.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="automated-evaluation">Automated Evaluation</TabsTrigger>
          </TabsList>

          <TabsContent value="configuration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Test Setup & File Upload */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>1. Test Kurulumu</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="test-name">Test Adı</Label>
                      <Input
                        id="test-name"
                        value={config.testName}
                        onChange={(e) => setConfig({ ...config, testName: e.target.value })}
                        placeholder="Örn: Karşılaştırmalı Strateji Testi"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Strateji</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={config.strategy === 'traditional' ? 'default' : 'outline'}
                          onClick={() => setConfig({ ...config, strategy: 'traditional' })}
                        >
                          Geleneksel
                        </Button>
                        <Button
                          variant={config.strategy === 'agentic' ? 'default' : 'outline'}
                          onClick={() => setConfig({ ...config, strategy: 'agentic' })}
                        >
                          Agentic
                        </Button>
                        <Button
                          variant={config.strategy === 'comparison' ? 'default' : 'outline'}
                          onClick={() => setConfig({ ...config, strategy: 'comparison' })}
                        >
                          Karşılaştırma
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>2. Dosya Yükleme</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          setConfig({ ...config, file: e.dataTransfer.files[0] });
                        }
                      }}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-4 text-sm text-gray-600">
                        Dosyanızı buraya sürükleyin veya{' '}
                        <button
                          type="button"
                          className="font-medium text-blue-600 hover:text-blue-500"
                          onClick={() => fileInputRef.current?.click()}>
                          seçmek için tıklayın
                        </button>
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setConfig({ ...config, file: e.target.files[0] });
                          }
                        }}
                      />
                    </div>
                    {config.file && (
                      <div className="mt-4 text-sm text-gray-700">
                        Seçilen dosya: <strong>{config.file.name}</strong>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Column 2: Parameters */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>3. Parametreler</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Traditional Chunking Parameters */}
                    {(config.strategy === 'traditional' || config.strategy === 'comparison') && (
                      <div className="space-y-4">
                        <h4 className="font-medium">Geleneksel Chunking</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="chunk-size">Chunk Boyutu</Label>
                            <Input id="chunk-size" type="number" value={config.chunkSize} onChange={(e) => setConfig({ ...config, chunkSize: Number(e.target.value) })} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="chunk-overlap">Chunk Overlap</Label>
                            <Input id="chunk-overlap" type="number" value={config.chunkOverlap} onChange={(e) => setConfig({ ...config, chunkOverlap: Number(e.target.value) })} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Agentic Chunking Parameters */}
                    {(config.strategy === 'agentic' || config.strategy === 'comparison') && (
                      <div className="space-y-4">
                        <h4 className="font-medium">Agentic Chunking</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="similarity-threshold">Benzerlik Eşiği</Label>
                            <Input id="similarity-threshold" type="number" step="0.1" value={config.similarityThreshold} onChange={(e) => setConfig({ ...config, similarityThreshold: Number(e.target.value) })} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="llm-reasoning-weight">LLM Muhakeme Ağırlığı</Label>
                            <Input id="llm-reasoning-weight" type="number" step="0.1" value={config.llmReasoningWeight} onChange={(e) => setConfig({ ...config, llmReasoningWeight: Number(e.target.value) })} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="max-chunk-size">Max Chunk Boyutu</Label>
                            <Input id="max-chunk-size" type="number" value={config.maxChunkSize} onChange={(e) => setConfig({ ...config, maxChunkSize: Number(e.target.value) })} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="min-chunk-size">Min Chunk Boyutu</Label>
                            <Input id="min-chunk-size" type="number" value={config.minChunkSize} onChange={(e) => setConfig({ ...config, minChunkSize: Number(e.target.value) })} />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="use-semantic-boundaries" checked={config.useSemanticBoundaries} onChange={(e) => setConfig({ ...config, useSemanticBoundaries: e.target.checked })} />
                          <Label htmlFor="use-semantic-boundaries">Semantik Sınırları Kullan</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="enable-contextual-merging" checked={config.enableContextualMerging} onChange={(e) => setConfig({ ...config, enableContextualMerging: e.target.checked })} />
                          <Label htmlFor="enable-contextual-merging">Bağlamsal Birleştirmeyi Etkinleştir</Label>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={resetConfig}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Sıfırla
              </Button>
              <Button onClick={startChunkingTest} disabled={!config.file || !config.testName || isRunning}>
                {isRunning ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Çalışıyor...</>
                ) : (
                  <><Play className="mr-2 h-4 w-4" /> Testi Başlat</>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="setup" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hızlı Başlangıç Rehberi</CardTitle>
                </CardHeader>
                <CardContent>
                  <QuickStartWizard onComplete={(data) => setWizardData(data)} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Test Senaryo Kütüphanesi</CardTitle>
                </CardHeader>
                <CardContent>
                  <TestScenarioLibrary
                    onRunScenario={handleRunScenario}
                    onPreviewScenario={handlePreviewScenario}
                  />
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Örnek İçerik Üretici</CardTitle>
              </CardHeader>
              <CardContent>
                <SampleContentGenerator
                  onContentGenerated={handleContentGenerated}
                  onContentTest={handleContentTest}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {currentTest ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Test Sonuçları: {currentTest.testName}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => exportTest(currentTest.testId)}><Download className="h-4 w-4 mr-2" /> JSON</Button>
                        <Button variant="outline" size="sm" onClick={() => exportAcademicReport(currentTest.testId)}><FileText className="h-4 w-4 mr-2" /> Markdown</Button>
                        <Button variant="outline" size="sm" onClick={() => exportComprehensivePdfReport(currentTest.testId)}><FileText className="h-4 w-4 mr-2" /> PDF</Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditTest(currentTest.testId, currentTest.testName)}><Edit className="h-4 w-4 mr-2" /> Düzenle</Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteTest(currentTest.testId)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4 mr-2" /> Sil</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Toplam Chunk</div>
                        <div className="text-lg font-semibold">{currentTest.metrics.totalChunks}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Ortalama Boyut</div>
                        <div className="text-lg font-semibold">{Math.round(currentTest.metrics.averageChunkSize)} karakter</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Semantik Uyum</div>
                        <div className="text-lg font-semibold">{currentTest.metrics.semanticCoherence.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">İşlem Süresi</div>
                        <div className="text-lg font-semibold">{currentTest.processingTime}s</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
                        <div key={chunk.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">Chunk #{index + 1}</Badge>
                            <div className="text-sm text-gray-500">{chunk.size} karakter</div>
                          </div>
                          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            {chunk.content.substring(0, 200)}{chunk.content.length > 200 && "..."}
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
                <CardHeader>
                  <CardTitle>Sonuçlar</CardTitle>
                  <CardDescription>Görüntülenecek bir test sonucu yok.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Lütfen "Configuration" sekmesinden bir test başlatın veya mevcut test listesinden birini seçin.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {!currentTest ? (
              <Card>
                <CardHeader>
                  <CardTitle>Analiz</CardTitle>
                  <CardDescription>
                    Analiz için önce bir test seçip sonuçları yükleyin.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("results")}
                  >
                    Sonuçlara Git
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Chunk Görselleştirme</CardTitle>
                    <CardDescription>
                      Chunk sınırlarını ve temel metrikleri inceleyin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChunkVisualization
                      chunks={currentTest.chunks}
                      originalText={currentTest.originalText}
                      strategy={currentTest.strategy}
                      showMetrics={true}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Token Analizi</CardTitle>
                    <CardDescription>
                      Token/boyut dağılımları ve maliyet tahmini.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TokenAnalysis
                      chunks={currentTest.chunks}
                      originalText={currentTest.originalText}
                      strategy={currentTest.strategy}
                      enableTurkishAnalysis={true}
                      showCostAnalysis={true}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Chunk Boyut Analizi</CardTitle>
                    <CardDescription>
                      Chunk boyut dağılımları ve trend analizi.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChunkSizeAnalyzer
                      chunks={currentTest.chunks}
                      originalText={currentTest.originalText}
                      strategy={currentTest.strategy}
                      comparisonData={currentTest.comparison}
                      enableHeatmap={true}
                      showTrendAnalysis={true}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>LLM Reasoning Analizi</CardTitle>
                    <CardDescription>
                      Agentic kararların gerekçeleri ve kalite skorları.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ReasoningDisplay
                      chunks={currentTest.chunks as any}
                      strategy={currentTest.strategy}
                      showTimeline={true}
                      enableFiltering={true}
                      enableSearch={true}
                      turkishOptimized={true}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="automated-evaluation" className="space-y-4">
            {!currentTest ? (
              <Card>
                <CardHeader>
                  <CardTitle>Otomatik Değerlendirme</CardTitle>
                  <CardDescription>
                    Önce bir test seçip sonuçları yükleyin.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" variant="outline" onClick={() => setActiveTab("results")}>
                    Sonuçlara Git
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Tabs
                value={automatedEvaluationTab}
                onValueChange={setAutomatedEvaluationTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="engine">Engine</TabsTrigger>
                  <TabsTrigger value="assessment">Assessment</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="engine" className="space-y-4">
                  <AutomatedEvaluationEngine
                    chunks={currentTest?.chunks || []}
                    originalText={currentTest?.originalText || ""}
                    strategy={currentTest?.strategy || "unknown"}
                    comparisonData={currentTest?.comparison}
                    onEvaluationComplete={(result: any) => {
                      setEvaluationResults(result);
                    }}
                    enableRealTimeEvaluation={true}
                  />
                </TabsContent>

                <TabsContent value="assessment" className="space-y-4">
                  <QualityAssessmentPanel
                    chunks={currentTest?.chunks || []}
                    originalText={currentTest?.originalText || ""}
                    strategy={currentTest?.strategy || "unknown"}
                    comparisonData={currentTest?.comparison}
                    onAssessmentComplete={(assessment: any) => {
                      setQualityAssessment(assessment);
                    }}
                    enableInteractiveMode={true}
                    enableRealTimeUpdates={true}
                    enableBenchmarking={true}
                  />
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4">
                  <EvaluationMetricsDisplay
                    metrics={evaluationMetricsArray}
                    historicalData={[]}
                    comparisonData={currentTest?.comparison ? [currentTest.comparison] : []}
                    enableInteractivity={true}
                    enableExport={true}
                    enableRealTimeUpdates={false}
                  />
                </TabsContent>

                <TabsContent value="monitoring" className="space-y-4">
                  <ContinuousMonitoring
                    chunks={currentTest?.chunks || []}
                    originalText={currentTest?.originalText || ""}
                    evaluationResults={evaluationResults}
                    enableNotifications={true}
                    enableAutoRestart={true}
                  />
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                  <EvaluationReports
                    evaluationResults={evaluationResults}
                    chunks={currentTest?.chunks || []}
                    originalText={currentTest?.originalText || ""}
                    historicalData={testList.map((test) => ({
                      testId: test.testId,
                      testName: test.testName,
                      timestamp: test.createdAt,
                      results: {},
                    }))}
                    comparisonData={currentTest?.comparison ? [currentTest.comparison] : []}
                    onReportShared={(reportId: string, method: string) => {
                      console.log(`Report ${reportId} shared via ${method}`);
                    }}
                    enableSharing={true}
                    enableScheduling={false}
                  />
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Adını Düzenle</DialogTitle>
              <DialogDescription>
                Test adını güncelleyin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Test Adı</Label>
              <Input
                value={editingTestName}
                onChange={(e) => setEditingTestName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={saveEditTest}>Kaydet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
      </div>
    </TeacherLayout>
  );
}
