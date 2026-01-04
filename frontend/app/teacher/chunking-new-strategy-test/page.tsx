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
import { tokenManager } from "@/lib/token-manager";
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
// QuickStartWizard kaldırıldı - yerine inline text yapıştırma alanı eklendi
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
// NEW: Evaluation Components
import AgentPerformanceRadar from "./components/AgentPerformanceRadar";
import EvaluationExportPanel from "./components/EvaluationExportPanel";

// Chunking Strategy Configuration Interface
interface ChunkingConfig {
  testName: string;
  strategy: "traditional" | "agentic" | "multi_agent" | "comparison";
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
  status: string;
  progress: number;
  startTime: string;
  endTime?: string;
  strategy: string;
  
  // Results data
  chunks: ChunkData[];
  metrics: ChunkingMetrics;
  comparison?: any;
  
  // Processing info
  originalText: string;
  totalCharacters: number;
  processingTime: number;

  // Agentic reasoning details
  reasoningDecisions?: AgenticReasoningDecision[];
  similarityAnalysis?: AgenticSimilarityAnalysis;
  detailedChunks?: any[];

  // Full results payload details (from /chunking-test/results/{id})
  configuration?: any;
  strategyMetrics?: Record<string, any>;
  detailedResults?: any[];
  
  // Progress tracking details
  progressMessage?: string;
  subProgress?: {
    current_step: number;
    total_steps: number;
    step_message: string;
    step_percentage: number;
  };
}

interface AgenticReasoningDecision {
  decision: "SPLIT" | "MERGE" | "CONDITIONAL" | string;
  confidence?: number;
  reasoning?: string;
  semantic_coherence?: number;
  topic_continuity?: number;
  metadata?: Record<string, any>;
}

interface AgenticSimilarityAnalysis {
  total_boundary_decisions?: number;
  split_ratio?: number;
  avg_confidence?: number;
  avg_semantic_coherence?: number;
  avg_topic_continuity?: number;
  reasoning_methods?: string[];
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
  // NEW: Enriched metadata fields
  metadata?: {
    chunk_id?: string;
    parent_header?: string | null;
    section_title?: string | null;
    header_hierarchy?: string[];
    keywords?: string[];
    chunk_type?: string;
    document_title?: string | null;
    page_number?: number | null;
    language?: string;
    previous_chunk_id?: string | null;
    next_chunk_id?: string | null;
  };
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
  const UI_VERSION = "2026-01-04-1";
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("configuration");
  const [evaluationResults, setEvaluationResults] = useState<any>(null);
  const [qualityAssessment, setQualityAssessment] = useState<any>(null);
  const [automatedEvaluationTab, setAutomatedEvaluationTab] = useState("engine");

  const [agenticDecisionFilter, setAgenticDecisionFilter] = useState<
    "all" | "SPLIT" | "MERGE"
  >("all");
  const [agenticDecisionSearch, setAgenticDecisionSearch] = useState("");
  const [expandedDecisionIndexes, setExpandedDecisionIndexes] = useState<
    Record<number, boolean>
  >({});

  const mapStatusToResult = (
    status: any,
    fallbackTestId: string,
    fallbackTestName: string,
    fallbackStrategy: string
  ): ChunkingResult => {
    return {
      testId: status.testId || fallbackTestId,
      testName: status.testName || fallbackTestName,
      status: status.status || "completed",
      progress: Number(status.progress ?? status.progress_percentage ?? 0),
      startTime: status.startTime || "",
      endTime: status.endTime,
      strategy: status.currentStrategy || fallbackStrategy,
      chunks: status.chunks || [],
      metrics: {
        totalChunks: Number(status.metrics?.totalChunks || 0),
        averageChunkSize: Number(status.metrics?.averageChunkSize || 0),
        chunkSizeVariance: Number(status.metrics?.chunkSizeVariance || 0),
        semanticCoherence: Number(status.metrics?.semanticCoherence || 0),
        boundaryQuality: Number(status.metrics?.boundaryQuality || 0),
        processingTime: Number(status.metrics?.processingTime || status.processingTime || 0),
      },
      comparison: status.comparison,
      originalText: status.originalText || "",
      totalCharacters: Number(status.totalCharacters || status.inputTextLength || 0),
      processingTime: Number(status.metrics?.processingTime || status.processingTime || 0),
      // Progress tracking details
      progressMessage: status.progress_message || status.progressMessage || undefined,
      subProgress: status.sub_progress || status.subProgress || undefined,
    };
  };

  const mergeAgenticReasoningIntoResult = (
    base: ChunkingResult,
    resultsPayload: any
  ): ChunkingResult => {
    const payloadResults = Array.isArray(resultsPayload?.results)
      ? resultsPayload.results
      : Array.isArray(resultsPayload?.detailed_results)
        ? resultsPayload.detailed_results
        : Array.isArray(resultsPayload?.detailedResults)
          ? resultsPayload.detailedResults
          : [];

    const agenticResult =
      payloadResults.find((r: any) => r?.strategy === "agentic") ||
      payloadResults.find((r: any) => r?.strategy === "agentic_reasoning") ||
      payloadResults[0];

    const reasoningDecisions: AgenticReasoningDecision[] = Array.isArray(
      agenticResult?.reasoning_decisions
    )
      ? agenticResult.reasoning_decisions
      : [];

    const similarityAnalysis: AgenticSimilarityAnalysis | undefined =
      agenticResult?.similarity_analysis &&
      typeof agenticResult.similarity_analysis === "object"
        ? agenticResult.similarity_analysis
        : undefined;

    const detailedChunks = Array.isArray(agenticResult?.detailed_chunks)
      ? agenticResult.detailed_chunks
      : undefined;

    const detailedResults = payloadResults;
    const configuration = resultsPayload?.configuration;
    const strategyMetrics =
      resultsPayload?.strategy_metrics && typeof resultsPayload.strategy_metrics === "object"
        ? resultsPayload.strategy_metrics
        : undefined;

    // If status payload didn't include chunks/metrics, fall back to results payload.
    const shouldHydrateChunks = !Array.isArray(base.chunks) || base.chunks.length === 0;
    const rawChunks: any[] = Array.isArray(agenticResult?.chunks) ? agenticResult.chunks : [];
    const detailedChunksArray = Array.isArray(agenticResult?.detailed_chunks) ? agenticResult.detailed_chunks : [];
    
    const hydratedChunks: ChunkData[] = shouldHydrateChunks
      ? rawChunks.map((chunkContent: any, i: number) => {
          const content = typeof chunkContent === "string" ? chunkContent : String(chunkContent ?? "");
          const detailedInfo = detailedChunksArray[i] || {};
          
          // Determine boundaryType based on agent decisions
          // Priority: force_split > structural preserve > default semantic
          let boundaryType: "natural" | "forced" | "semantic" = "semantic";
          
          // Check size decision first (highest priority - forced splits)
          if (detailedInfo.size_decision === "force_split") {
            boundaryType = "forced";
          }
          // Then check structural decision (only "preserve" indicates natural boundary)
          // Only mark as natural if there's no semantic decision or it's neutral
          else if (detailedInfo.structural_decision === "preserve" && 
                   (!detailedInfo.semantic_decision || detailedInfo.semantic_decision === "neutral")) {
            boundaryType = "natural";
          }
          // All other cases (semantic split/merge, allow_split, empty decisions) remain as "semantic" (default)
          
          // Extract metadata from detailed chunk info
          const chunkMetadata = detailedInfo.metadata || {};
          
          return {
            id: detailedInfo.id !== undefined ? `multi_agent_${detailedInfo.id}` : `agentic_${i}`,
            content,
            startIndex: detailedInfo.start_index || 0,
            endIndex: detailedInfo.end_index || content.length,
            size: detailedInfo.char_count || content.length,
            semanticScore: detailedInfo.quality_score || Number(agenticResult?.semantic_coherence_score ?? 0),
            boundaryType,
            reasoning: detailedInfo.reasoning || "Generated by multi-agent strategy",
            // NEW: Include enriched metadata
            metadata: chunkMetadata && Object.keys(chunkMetadata).length > 0 ? {
              chunk_id: chunkMetadata.chunk_id || undefined,
              parent_header: chunkMetadata.parent_header || null,
              section_title: chunkMetadata.section_title || null,
              header_hierarchy: Array.isArray(chunkMetadata.header_hierarchy) ? chunkMetadata.header_hierarchy : [],
              keywords: Array.isArray(chunkMetadata.keywords) ? chunkMetadata.keywords : [],
              chunk_type: chunkMetadata.chunk_type || "content",
              document_title: chunkMetadata.document_title || null,
              page_number: chunkMetadata.page_number ?? null,
              language: chunkMetadata.language || "auto",
              previous_chunk_id: chunkMetadata.previous_chunk_id || null,
              next_chunk_id: chunkMetadata.next_chunk_id || null,
            } : undefined,
          };
        })
      : base.chunks;

    const hydratedMetrics: ChunkingMetrics = shouldHydrateChunks
      ? {
          totalChunks: Number(agenticResult?.chunk_count ?? rawChunks.length ?? 0),
          averageChunkSize: Number(agenticResult?.avg_chunk_size ?? 0),
          chunkSizeVariance: Number(base.metrics?.chunkSizeVariance ?? 0),
          semanticCoherence: Number(agenticResult?.semantic_coherence_score ?? 0),
          boundaryQuality: Number(agenticResult?.boundary_quality_score ?? 0),
          processingTime: Number(
            (agenticResult?.processing_time_ms ?? 0) / 1000
          ),
        }
      : base.metrics;

    return {
      ...base,
      chunks: hydratedChunks,
      metrics: hydratedMetrics,
      reasoningDecisions,
      similarityAnalysis,
      detailedChunks,
      configuration,
      strategyMetrics,
      detailedResults,
    };
  };

  const handleRunScenario = async (scenario: any) => {
    const content = String(scenario?.content ?? "");
    const name = String(scenario?.name ?? `Scenario ${String(scenario?.id ?? "").substring(0, 8)}`);

    if (!content.trim()) {
      toast.error("Senaryo içeriği bulunamadı.");
      return;
    }

    applyTemplateAndMaybeRun({
      name,
      content,
      strategy: "agentic",
      autoStart: true,
    });
  };

  const handlePreviewScenario = (scenario: any) => {
    const content = String(scenario?.content ?? "");
    const name = String(scenario?.name ?? `Scenario ${String(scenario?.id ?? "").substring(0, 8)}`);

    if (!content.trim()) {
      toast.error("Senaryo içeriği bulunamadı.");
      return;
    }

    applyTemplateAndMaybeRun({
      name,
      content,
      strategy: "agentic",
      autoStart: false,
    });

    toast.success("Senaryo konfigürasyona aktarıldı. İstersen parametreleri düzenleyip testi başlatabilirsin.");
  };

  const handleContentGenerated = (content: any) => {
    const text = String(content?.content ?? "");
    const title = String(content?.title ?? "Generated Content");
    if (!text.trim()) {
      toast.error("Oluşturulan içerik boş geldi.");
      return;
    }

    applyTemplateAndMaybeRun({
      name: title,
      content: text,
      strategy: "agentic",
      autoStart: false,
    });

    toast.success("İçerik konfigürasyona aktarıldı.");
  };

  const handleContentTest = (content: any) => {
    const text = String(content?.content ?? "");
    const title = String(content?.title ?? "Generated Content");
    if (!text.trim()) {
      toast.error("Test edilecek içerik boş.");
      return;
    }

    applyTemplateAndMaybeRun({
      name: title,
      content: text,
      strategy: "agentic",
      autoStart: true,
    });
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
    minChunkSize: 200,
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

  // UI state
  const [expandedChunkIds, setExpandedChunkIds] = useState<Record<string, boolean>>({});
  
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

  // Setup helpers
  const pendingAutoStartRef = useRef<boolean>(false);
  const pendingAutoStartNameRef = useRef<string>("");

  const createTextFile = (name: string, content: string) => {
    const safeName = (name || "test").replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 50);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    return new File([blob], `${safeName}.txt`, { type: "text/plain" });
  };

  const applyTemplateAndMaybeRun = (
    opts: { name: string; content: string; strategy?: ChunkingConfig["strategy"]; autoStart?: boolean }
  ) => {
    const strategy = opts.strategy ?? "agentic";
    const file = createTextFile(opts.name, opts.content);

    setConfig((prev) => ({
      ...prev,
      testName: opts.name,
      strategy,
      file,
    }));

    setActiveTab("configuration");

    if (opts.autoStart) {
      pendingAutoStartRef.current = true;
      pendingAutoStartNameRef.current = opts.name;
    }
  };

  useEffect(() => {
    if (!pendingAutoStartRef.current) return;
    if (!config.file) return;
    if (!config.testName) return;
    if (config.testName !== pendingAutoStartNameRef.current) return;

    pendingAutoStartRef.current = false;
    pendingAutoStartNameRef.current = "";
    startChunkingTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.file, config.testName]);

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

        // If test is finished, stop polling first to avoid race overwriting UI with partial status payload.
        if (status.status === "completed" || status.status === "failed") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          isPollingRef.current = false;
          setIsRunning(false);
          await loadTestDetails(testId);
          return;
        }

        setCurrentTest((prev: ChunkingResult | null) => {
          const fallbackName = prev?.testName || `Test ${testId.substring(0, 8)}`;
          const fallbackStrategy = prev?.strategy || "unknown";

          const next = mapStatusToResult(status, testId, fallbackName, fallbackStrategy);

          // Guard: don't let an empty/partial status payload wipe an already-loaded result.
          const prevHasChunks = Array.isArray(prev?.chunks) && (prev?.chunks?.length ?? 0) > 0;
          const nextHasChunks = Array.isArray(next?.chunks) && (next?.chunks?.length ?? 0) > 0;
          const prevTotal = Number(prev?.metrics?.totalChunks ?? 0);
          const nextTotal = Number(next?.metrics?.totalChunks ?? 0);

          if (prev && prev.status === "completed" && prevHasChunks && !nextHasChunks) return prev;
          if (prev && prevTotal > 0 && nextTotal === 0 && prevHasChunks) return prev;

          return next;
        });
      } catch (error) {
        console.error("Polling error:", error);
        setError("Test durumu alınamadı. Lütfen sayfayı yenileyin veya tekrar deneyin.");
        toast.error("Test durumu alınamadı");
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
      minChunkSize: 200,
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
        const sorted = [...data.tests].sort((a: any, b: any) => {
          const aKey = a?.updatedAt || a?.startTime || a?.createdAt || "";
          const bKey = b?.updatedAt || b?.startTime || b?.createdAt || "";
          const aTime = aKey ? new Date(aKey).getTime() : 0;
          const bTime = bKey ? new Date(bKey).getTime() : 0;
          if (aTime !== bTime) return bTime - aTime;
          return String(b?.testId || "").localeCompare(String(a?.testId || ""));
        });
        setTestList(sorted);
      } else {
        setError(data?.error || "Test listesi alınamadı");
      }
    } catch (error) {
      console.error("Error loading test list:", error);
      setError("Test listesi alınamadı");
    } finally {
      setIsLoadingTests(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    if (isLoadingTests) return;
    if (!testList || testList.length === 0) return;
    if (currentTest) return;

    // Intentionally do NOT auto-load the last test.
    // Results tab should first show the saved tests list, then user selects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isLoadingTests, testList]);

  // Load specific test details
  const loadTestDetails = async (testId: string) => {
    try {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      const status = await apiClient.get(`/chunking-test/status/${testId}`);

      let testResult: ChunkingResult = mapStatusToResult(
        status,
        testId,
        status.testName || `Test ${testId.substring(0, 8)}`,
        status.currentStrategy || "unknown"
      );

      if (status.status === "completed") {
        try {
          const results = await apiClient.get(`/chunking-test/results/${testId}`);
          testResult = mergeAgenticReasoningIntoResult(testResult, results);
        } catch (resultsError) {
          console.error("Error loading test results:", resultsError);
        }
      } else if (status.status === "running") {
        // Ensure live monitoring keeps refreshing while test is still running.
        pollStatus(testId);
      }

      setCurrentTest(testResult);
      setSelectedTestId(testId);
      try {
        window.localStorage.setItem("chunking-test:lastTestId", testId);
      } catch {
        // ignore
      }
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
      const response = await apiClient.put(`/chunking-test/update/${editingTestId}`, {
        testName: editingTestName.trim(),
      });

      if (!response?.success) throw new Error("Test güncellenemedi");

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
      const response = await fetch(`/api/chunking-test/export/${testId}?format=json`, {
        method: "GET",
        headers: {
          ...(tokenManager.getAccessToken()
            ? { Authorization: `Bearer ${tokenManager.getAccessToken()}` }
            : {}),
        },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Export başarısız" }));
        throw new Error(err?.error || "Export başarısız");
      }

      const data = await response.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chunking_test_${testId.substring(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.message || "Export başarısız");
    }
  };

  const exportAcademicReport = async (testId: string) => {
    try {
      const response = await fetch(`/api/chunking-test/export/${testId}?format=txt`, {
        method: "GET",
        headers: {
          ...(tokenManager.getAccessToken()
            ? { Authorization: `Bearer ${tokenManager.getAccessToken()}` }
            : {}),
        },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Export başarısız" }));
        throw new Error(err?.error || "Export başarısız");
      }

      const text = await response.text();
      const blob = new Blob([text], { type: "text/markdown" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chunking_report_${testId.substring(0, 8)}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Markdown export error:", error);
      toast.error(error.message || "Markdown export başarısız");
    }
  };

  const exportComprehensivePdfReport = async (testId: string) => {
    try {
      const response = await fetch(`/api/chunking-test/export-pdf/${testId}`, {
        method: "GET",
        headers: {
          ...(tokenManager.getAccessToken()
            ? { Authorization: `Bearer ${tokenManager.getAccessToken()}` }
            : {}),
        },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "PDF export başarısız" }));
        throw new Error(err?.error || "PDF export başarısız");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chunking_report_${testId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("PDF export error:", error);
      toast.error(error.message || "PDF export başarısız");
    }
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
              Agentic chunking stratejilerini test edin ve karşılaştırın.
            </p>
            <p className="text-xs text-muted-foreground">UI: {UI_VERSION}</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="configuration">Konfigürasyon</TabsTrigger>
            <TabsTrigger value="setup">Kurulum</TabsTrigger>
            <TabsTrigger value="results">Sonuçlar</TabsTrigger>
            <TabsTrigger value="analysis">Analiz</TabsTrigger>
            <TabsTrigger value="automated-evaluation">Otomatik Değerlendirme</TabsTrigger>
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
                          variant={config.strategy === 'multi_agent' ? 'default' : 'outline'}
                          onClick={() => setConfig({ ...config, strategy: 'multi_agent' })}
                        >
                          Multi-Agent
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

                    {/* Multi-Agent Chunking Parameters */}
                    {config.strategy === 'multi_agent' && (
                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Multi-Agent Chunking
                        </h4>
                        <p className="text-sm text-gray-600">
                          5 uzman ajan ile akıllı chunking: Structural, Semantic, Size, Quality ve Coordinator
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="ma-target-size">Hedef Chunk Boyutu</Label>
                            <Input id="ma-target-size" type="number" value={config.chunkSize} onChange={(e) => setConfig({ ...config, chunkSize: Number(e.target.value) })} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ma-quality-threshold">Kalite Eşiği</Label>
                            <Input id="ma-quality-threshold" type="number" step="0.05" min="0" max="1" value={config.similarityThreshold} onChange={(e) => setConfig({ ...config, similarityThreshold: Number(e.target.value) })} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ma-max-size">Max Chunk Boyutu</Label>
                            <Input id="ma-max-size" type="number" value={config.maxChunkSize} onChange={(e) => setConfig({ ...config, maxChunkSize: Number(e.target.value) })} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ma-min-size">Min Chunk Boyutu</Label>
                            <Input id="ma-min-size" type="number" value={config.minChunkSize} onChange={(e) => setConfig({ ...config, minChunkSize: Number(e.target.value) })} />
                          </div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg text-sm">
                          <p className="font-medium text-blue-800 mb-2">Ajan Rolleri:</p>
                          <ul className="text-blue-700 space-y-1">
                            <li>• <strong>Structural:</strong> Kod, tablo, liste gibi atomik birimleri korur</li>
                            <li>• <strong>Semantic:</strong> Konu sınırlarını ve anlamsal tutarlılığı analiz eder</li>
                            <li>• <strong>Size:</strong> Chunk boyutlarını optimize eder</li>
                            <li>• <strong>Quality:</strong> Chunk kalitesini doğrular ve iyileştirir</li>
                            <li>• <strong>Coordinator:</strong> Tüm ajanları orkestre eder</li>
                          </ul>
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
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Hızlı Test - Metin Yapıştır
                  </CardTitle>
                  <CardDescription>
                    Metninizi buraya yapıştırın ve hemen chunking testi yapın
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quickTestName">Test Adı</Label>
                    <Input
                      id="quickTestName"
                      placeholder="Örn: Akademik Makale Testi"
                      value={config.testName}
                      onChange={(e) => setConfig(prev => ({ ...prev, testName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quickTestText">Metin İçeriği</Label>
                    <Textarea
                      id="quickTestText"
                      placeholder="Test etmek istediğiniz metni buraya yapıştırın..."
                      className="min-h-[200px] font-mono text-sm"
                      onChange={(e) => {
                        const text = e.target.value;
                        if (text.trim()) {
                          const file = createTextFile(config.testName || "quick-test", text);
                          setConfig(prev => ({ ...prev, file }));
                        } else {
                          setConfig(prev => ({ ...prev, file: null }));
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      Yapıştırdığınız metin otomatik olarak dosyaya dönüştürülür
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        if (!config.testName.trim()) {
                          toast.error("Lütfen bir test adı girin");
                          return;
                        }
                        if (!config.file) {
                          toast.error("Lütfen test edilecek metin girin");
                          return;
                        }
                        startChunkingTest();
                      }}
                      disabled={isRunning || !config.file || !config.testName.trim()}
                      className="flex-1"
                    >
                      {isRunning ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Çalışıyor...</>
                      ) : (
                        <><Zap className="mr-2 h-4 w-4" /> Hızlı Test Başlat</>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("configuration")}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Detaylı Ayarlar
                    </Button>
                  </div>
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
                {currentTest.status !== "completed" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        İşlem Durumu
                        <Badge variant="outline">{String(currentTest.status || "unknown")}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Test çalışıyorsa otomatik yenilenir. Bitince sonuçlar otomatik yüklenecek.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">İlerleme</div>
                          <div className="text-sm font-medium">{Number(currentTest.progress ?? 0).toFixed(1)}%</div>
                        </div>
                        <Progress value={Number(currentTest.progress ?? 0)} />
                        
                        {/* Progress Message */}
                        {currentTest.progressMessage && (
                          <div className="text-sm text-blue-600 font-medium mt-2">
                            {currentTest.progressMessage}
                          </div>
                        )}
                        
                        {/* Sub-Progress Details */}
                        {currentTest.subProgress && currentTest.subProgress.total_steps > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs text-gray-500">
                                Adım {currentTest.subProgress.current_step} / {currentTest.subProgress.total_steps}
                              </div>
                              <div className="text-xs font-medium text-gray-700">
                                {currentTest.subProgress.step_percentage?.toFixed(0) ?? 0}%
                              </div>
                            </div>
                            <Progress 
                              value={currentTest.subProgress.step_percentage ?? 0} 
                              className="h-2"
                            />
                            {currentTest.subProgress.step_message && (
                              <div className="text-xs text-gray-600 mt-2">
                                {currentTest.subProgress.step_message}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Başlangıç</div>
                          <div className="text-sm font-medium">
                            {currentTest.startTime ? new Date(currentTest.startTime).toLocaleString() : "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Seçili Test</div>
                          <div className="text-sm font-medium">{currentTest.testId.substring(0, 8)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Otomatik Yenileme</div>
                          <div className="text-sm font-medium">{isRunning ? "Aktif" : "Pasif"}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => loadTestDetails(currentTest.testId)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Yenile
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => pollStatus(currentTest.testId)}
                          disabled={isRunning}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Takibi Başlat
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={stopTest}
                          disabled={!isRunning}
                        >
                          <Square className="h-4 w-4 mr-2" />
                          Durdur
                        </Button>
                      </div>

                      <div className="text-sm text-gray-600">
                        Sonuçlar henüz hazır değil. Test tamamlandığında “Oluşturulan Chunk'lar” ve detay rapor
                        bölümleri otomatik dolacak.
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Test Sonuçları: {currentTest.testName}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentTest(null);
                            setSelectedTestId(null);
                          }}
                        >
                          <List className="h-4 w-4 mr-2" />
                          Liste
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => exportTest(currentTest.testId)}><Download className="h-4 w-4 mr-2" /> JSON</Button>
                        <Button variant="outline" size="sm" onClick={() => exportAcademicReport(currentTest.testId)}><FileText className="h-4 w-4 mr-2" /> Markdown</Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (currentTest.status !== "completed") {
                              toast.error("PDF raporu için testin tamamlanması gerekiyor.");
                              return;
                            }
                            exportComprehensivePdfReport(currentTest.testId);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" /> PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditTest(currentTest.testId, currentTest.testName)}><Edit className="h-4 w-4 mr-2" /> Düzenle</Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteTest(currentTest.testId)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4 mr-2" /> Sil</Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col md:flex-row gap-3">
                      <div className="md:w-96">
                        <Label htmlFor="results-test-picker">Kaydedilmiş Test Seç</Label>
                        <select
                          id="results-test-picker"
                          className="w-full border rounded-md px-3 py-2 text-sm"
                          value={selectedTestId ?? currentTest.testId}
                          onChange={(e) => {
                            const nextId = e.target.value;
                            if (nextId) loadTestDetails(nextId);
                          }}
                        >
                          {testList.map((t: any) => (
                            <option key={t.testId} value={t.testId}>
                              {(t.testName || `Test ${String(t.testId).substring(0, 8)}`) + ` (${String(t.testId).substring(0, 8)})`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end gap-2">
                        <Button type="button" variant="outline" onClick={loadTestList}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Listeyi Yenile
                        </Button>
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
                        <div className="text-lg font-semibold">{Math.round(Number(currentTest.metrics.averageChunkSize))} karakter</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Semantik Uyum</div>
                        <div className="text-lg font-semibold">
                          {(() => {
                            const raw = Number(currentTest.metrics.semanticCoherence ?? 0);
                            const asPercent = raw <= 1 ? raw * 100 : raw;
                            return `${asPercent.toFixed(1)}%`;
                          })()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">İşlem Süresi</div>
                        <div className="text-lg font-semibold">{typeof currentTest.processingTime === 'number' ? currentTest.processingTime.toFixed(1) : '0.0'}s</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {currentTest.status === "completed" && (
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
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-xs text-gray-500">ID: {chunk.id}</div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setExpandedChunkIds((prev) => ({
                                      ...prev,
                                      [chunk.id]: !prev[chunk.id],
                                    }))
                                  }
                                >
                                  {expandedChunkIds[chunk.id] ? "Kısalt" : "Tam Göster"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(chunk.content || "");
                                      toast.success("Chunk kopyalandı");
                                    } catch {
                                      toast.error("Kopyalama başarısız");
                                    }
                                  }}
                                >
                                  Kopyala
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap break-words">
                              {expandedChunkIds[chunk.id]
                                ? chunk.content
                                : (chunk.content || "").substring(0, 400) +
                                  ((chunk.content || "").length > 400 ? "..." : "")}
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
                )}

                {currentTest.status === "completed" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Chunk Görselleştirme (Renkli)</CardTitle>
                      <CardDescription>
                        Önceki renklendirme/boundary görünümünü burada görebilirsin.
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
                )}

                {/* Strategy Comparison Section */}
                {currentTest.status === "completed" && currentTest.detailedResults && currentTest.detailedResults.length >= 2 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Strateji Karşılaştırması
                      </CardTitle>
                      <CardDescription>
                        Traditional ve Agentic stratejilerin karşılaştırmalı analizi
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const traditionalResult = currentTest.detailedResults?.find((r: any) => r?.strategy === "traditional");
                        const agenticResult = currentTest.detailedResults?.find((r: any) => 
                          r?.strategy === "agentic" || r?.strategy === "agentic_reasoning" || r?.strategy === "multi_agent"
                        );
                        
                        if (!traditionalResult || !agenticResult) {
                          return <div className="text-gray-500">Karşılaştırma için yeterli veri yok.</div>;
                        }
                        
                        const tradChunks = traditionalResult.chunk_count || 0;
                        const agentChunks = agenticResult.chunk_count || 0;
                        const chunkDiff = agentChunks - tradChunks;
                        
                        const tradSemantic = traditionalResult.semantic_coherence_score || 0;
                        const agentSemantic = agenticResult.semantic_coherence_score || 0;
                        const semanticDiff = agentSemantic - tradSemantic;
                        const semanticImprovement = tradSemantic > 0 ? ((agentSemantic - tradSemantic) / tradSemantic * 100) : 0;
                        
                        const tradBoundary = traditionalResult.boundary_quality_score || 0;
                        const agentBoundary = agenticResult.boundary_quality_score || 0;
                        const boundaryDiff = agentBoundary - tradBoundary;
                        const boundaryImprovement = tradBoundary > 0 ? ((agentBoundary - tradBoundary) / tradBoundary * 100) : 0;
                        
                        const tradTime = traditionalResult.processing_time_ms || 0;
                        const agentTime = agenticResult.processing_time_ms || 0;
                        
                        const tradAvgSize = traditionalResult.avg_chunk_size || 0;
                        const agentAvgSize = agenticResult.avg_chunk_size || 0;
                        
                        // Determine winner
                        let semanticWinner = semanticDiff > 0.01 ? "Agentic" : (semanticDiff < -0.01 ? "Traditional" : "Eşit");
                        let boundaryWinner = boundaryDiff > 0.01 ? "Agentic" : (boundaryDiff < -0.01 ? "Traditional" : "Eşit");
                        let timeWinner = tradTime < agentTime ? "Traditional" : "Agentic";
                        
                        return (
                          <div className="space-y-6">
                            {/* Comparison Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-emerald-600 text-white">
                                    <th className="px-4 py-3 text-left">Metrik</th>
                                    <th className="px-4 py-3 text-center">Traditional</th>
                                    <th className="px-4 py-3 text-center">Agentic</th>
                                    <th className="px-4 py-3 text-center">Fark</th>
                                    <th className="px-4 py-3 text-center">Kazanan</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-emerald-50">
                                  <tr className="border-b border-emerald-200">
                                    <td className="px-4 py-3 font-medium">Chunk Sayısı</td>
                                    <td className="px-4 py-3 text-center">{tradChunks}</td>
                                    <td className="px-4 py-3 text-center">{agentChunks}</td>
                                    <td className="px-4 py-3 text-center">{chunkDiff > 0 ? `+${chunkDiff}` : chunkDiff}</td>
                                    <td className="px-4 py-3 text-center">-</td>
                                  </tr>
                                  <tr className="border-b border-emerald-200">
                                    <td className="px-4 py-3 font-medium">Ort. Chunk Boyutu</td>
                                    <td className="px-4 py-3 text-center">{Math.round(tradAvgSize)}</td>
                                    <td className="px-4 py-3 text-center">{Math.round(agentAvgSize)}</td>
                                    <td className="px-4 py-3 text-center">{Math.round(agentAvgSize - tradAvgSize)}</td>
                                    <td className="px-4 py-3 text-center">-</td>
                                  </tr>
                                  <tr className="border-b border-emerald-200">
                                    <td className="px-4 py-3 font-medium">Semantic Coherence</td>
                                    <td className="px-4 py-3 text-center">{tradSemantic.toFixed(4)}</td>
                                    <td className="px-4 py-3 text-center">{agentSemantic.toFixed(4)}</td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={semanticDiff > 0 ? "text-green-600" : semanticDiff < 0 ? "text-red-600" : ""}>
                                        {semanticDiff > 0 ? "+" : ""}{semanticDiff.toFixed(4)} ({semanticImprovement > 0 ? "+" : ""}{semanticImprovement.toFixed(1)}%)
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <Badge variant={semanticWinner === "Agentic" ? "default" : semanticWinner === "Traditional" ? "secondary" : "outline"}>
                                        {semanticWinner}
                                      </Badge>
                                    </td>
                                  </tr>
                                  <tr className="border-b border-emerald-200">
                                    <td className="px-4 py-3 font-medium">Boundary Quality</td>
                                    <td className="px-4 py-3 text-center">{tradBoundary.toFixed(4)}</td>
                                    <td className="px-4 py-3 text-center">{agentBoundary.toFixed(4)}</td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={boundaryDiff > 0 ? "text-green-600" : boundaryDiff < 0 ? "text-red-600" : ""}>
                                        {boundaryDiff > 0 ? "+" : ""}{boundaryDiff.toFixed(4)} ({boundaryImprovement > 0 ? "+" : ""}{boundaryImprovement.toFixed(1)}%)
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <Badge variant={boundaryWinner === "Agentic" ? "default" : boundaryWinner === "Traditional" ? "secondary" : "outline"}>
                                        {boundaryWinner}
                                      </Badge>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-4 py-3 font-medium">İşlem Süresi</td>
                                    <td className="px-4 py-3 text-center">{tradTime.toFixed(0)}ms</td>
                                    <td className="px-4 py-3 text-center">{agentTime.toFixed(0)}ms</td>
                                    <td className="px-4 py-3 text-center">{(agentTime - tradTime).toFixed(0)}ms</td>
                                    <td className="px-4 py-3 text-center">
                                      <Badge variant={timeWinner === "Traditional" ? "secondary" : "default"}>
                                        {timeWinner}
                                      </Badge>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            
                            {/* Summary */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h4 className="font-semibold text-blue-800 mb-2">Genel Değerlendirme</h4>
                              <div className="text-sm text-blue-700 space-y-1">
                                {semanticImprovement > 5 && (
                                  <p>✅ Agentic strateji semantik tutarlılıkta %{semanticImprovement.toFixed(1)} iyileşme sağladı.</p>
                                )}
                                {semanticImprovement < -5 && (
                                  <p>⚠️ Traditional strateji semantik tutarlılıkta %{Math.abs(semanticImprovement).toFixed(1)} daha iyi.</p>
                                )}
                                {boundaryImprovement > 5 && (
                                  <p>✅ Agentic strateji sınır kalitesinde %{boundaryImprovement.toFixed(1)} iyileşme sağladı.</p>
                                )}
                                {agentTime > tradTime + 1000 && (
                                  <p>⏱️ Agentic strateji {((agentTime - tradTime) / 1000).toFixed(1)} saniye daha uzun sürdü (LLM çağrıları nedeniyle).</p>
                                )}
                                {Math.abs(chunkDiff) > 5 && (
                                  <p>📊 Agentic strateji {chunkDiff > 0 ? `${chunkDiff} adet daha fazla` : `${Math.abs(chunkDiff)} adet daha az`} chunk üretti.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}

                {currentTest.status === "completed" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Detaylı Rapor / Parametreler</CardTitle>
                      <CardDescription>
                        Test konfigürasyonu, strateji metrikleri ve ham detay payload.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Configuration</div>
                          <pre className="text-xs bg-gray-50 p-3 rounded max-h-64 overflow-auto whitespace-pre-wrap break-words">
                            {JSON.stringify(currentTest.configuration ?? null, null, 2)}
                          </pre>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Strategy Metrics</div>
                          <pre className="text-xs bg-gray-50 p-3 rounded max-h-64 overflow-auto whitespace-pre-wrap break-words">
                            {JSON.stringify(currentTest.strategyMetrics ?? null, null, 2)}
                          </pre>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Detailed Chunks / Reasoning</div>
                        <pre className="text-xs bg-gray-50 p-3 rounded max-h-80 overflow-auto whitespace-pre-wrap break-words">
                          {JSON.stringify(currentTest.detailedChunks ?? null, null, 2)}
                        </pre>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Raw Results (detailed_results)</div>
                        <pre className="text-xs bg-gray-50 p-3 rounded max-h-80 overflow-auto whitespace-pre-wrap break-words">
                          {JSON.stringify(currentTest.detailedResults ?? null, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(currentTest.strategy === "agentic" || currentTest.reasoningDecisions) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Agentic Reasoning Kararları (Adım Adım)
                      </CardTitle>
                      {currentTest.similarityAnalysis && (
                        <CardDescription>
                          {(() => {
                            const sa = currentTest.similarityAnalysis as AgenticSimilarityAnalysis;
                            const total = sa?.total_boundary_decisions ?? 0;
                            const splitRatio = sa?.split_ratio ?? 0;
                            const avgConf = sa?.avg_confidence ?? 0;
                            return `Toplam karar: ${total} | Split ratio: ${(splitRatio * 100).toFixed(
                              1
                            )}% | Avg confidence: ${(avgConf * 100).toFixed(1)}%`;
                          })()}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {(!currentTest.reasoningDecisions || currentTest.reasoningDecisions.length === 0) && (
                        <div className="text-sm text-gray-600">
                          Bu test için henüz reasoning kararları bulunamadı. (Agentic sonuç payload’ında
                          `reasoning_decisions` boş geliyor olabilir.)
                        </div>
                      )}
                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1">
                            <Label htmlFor="agentic-decision-search">Ara</Label>
                            <Input
                              id="agentic-decision-search"
                              placeholder="Reasoning içinde ara..."
                              value={agenticDecisionSearch}
                              onChange={(e) => setAgenticDecisionSearch(e.target.value)}
                            />
                          </div>
                          <div className="md:w-48">
                            <Label htmlFor="agentic-decision-filter">Filtre</Label>
                            <select
                              id="agentic-decision-filter"
                              value={agenticDecisionFilter}
                              onChange={(e) =>
                                setAgenticDecisionFilter(e.target.value as any)
                              }
                              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="all">Tümü</option>
                              <option value="SPLIT">SPLIT</option>
                              <option value="MERGE">MERGE</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {(() => {
                            const decisions: AgenticReasoningDecision[] =
                              currentTest.reasoningDecisions || [];

                            const filtered = decisions
                              .map((d: AgenticReasoningDecision, idx: number) => ({ d, idx }))
                              .filter(({ d }) => {
                                if (agenticDecisionFilter === "all") return true;
                                return d.decision === agenticDecisionFilter;
                              })
                              .filter(({ d }) => {
                                if (!agenticDecisionSearch.trim()) return true;
                                const q = agenticDecisionSearch.toLowerCase();
                                return (
                                  (d.reasoning || "").toLowerCase().includes(q) ||
                                  JSON.stringify(d.metadata || {})
                                    .toLowerCase()
                                    .includes(q)
                                );
                              });

                            return filtered.map(({ d, idx }) => {
                              const isExpanded = Boolean(expandedDecisionIndexes[idx]);
                              const conf =
                                typeof d.confidence === "number" ? d.confidence : 0;
                              const method = d.metadata?.decision_method;
                              const finalScore = d.metadata?.final_weighted_score;
                              const threshold = d.metadata?.confidence_threshold;

                              return (
                                <div
                                  key={idx}
                                  className="border rounded-lg p-4 space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="outline">
                                        Transition #{idx + 1}
                                      </Badge>
                                      <Badge
                                        className={
                                          d.decision === "SPLIT"
                                            ? "bg-green-100 text-green-800 border border-green-200"
                                            : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                        }
                                      >
                                        {d.decision}
                                      </Badge>
                                      <Badge variant="outline">
                                        Confidence: {(conf * 100).toFixed(1)}%
                                      </Badge>
                                      {typeof finalScore === "number" && (
                                        <Badge variant="outline">
                                          Score: {finalScore.toFixed(3)}
                                        </Badge>
                                      )}
                                      {typeof threshold === "number" && (
                                        <Badge variant="outline">
                                          Threshold: {threshold.toFixed(3)}
                                        </Badge>
                                      )}
                                      {method && (
                                        <Badge variant="outline">
                                          {String(method)}
                                        </Badge>
                                      )}
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setExpandedDecisionIndexes(
                                          (prev: Record<number, boolean>) => ({
                                            ...prev,
                                            [idx]: !prev[idx],
                                          })
                                        )
                                      }
                                    >
                                      {isExpanded ? "Gizle" : "Göster"}
                                    </Button>
                                  </div>

                                  <div className="text-sm text-gray-700">
                                    {isExpanded
                                      ? d.reasoning
                                      : (d.reasoning || "").substring(0, 220) +
                                        ((d.reasoning || "").length > 220
                                          ? "..."
                                          : "")}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle>Kaydedilmiş Testler</CardTitle>
                        <CardDescription>
                          Daha önce çalıştırdığın testleri buradan açabilirsin. Sayfa yenilense bile backend’de kayıtlı kalır.
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={loadTestList}
                        disabled={isLoadingTests}
                      >
                        Yenile
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTests ? (
                      <div className="text-sm text-gray-600">Yükleniyor...</div>
                    ) : testList.length === 0 ? (
                      <div className="text-sm text-gray-600">Kayıtlı test bulunamadı. Yeni bir test çalıştır.</div>
                    ) : (
                      <div className="space-y-2">
                        {testList.map((test: any) => (
                          <div
                            key={test.testId}
                            className="flex items-center justify-between gap-3 border rounded-md p-3"
                          >
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {test.testName || `Test ${String(test.testId).substring(0, 8)}`}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {String(test.testId).substring(0, 12)} • {test.status}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => loadTestDetails(test.testId)}
                              >
                                Aç
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTest(test.testId)}
                              >
                                Sil
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sonuçlar</CardTitle>
                    <CardDescription>Görüntülenecek bir test sonucu yok.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Yukarıdan bir test seçebilir veya "Configuration" sekmesinden yeni bir test başlatabilirsin.
                    </p>
                  </CardContent>
                </Card>
              </div>
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
            ) : currentTest.status !== "completed" || !Array.isArray(currentTest.chunks) || currentTest.chunks.length === 0 || typeof (currentTest.chunks as any)[0]?.content !== "string" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Analiz</CardTitle>
                  <CardDescription>
                    Bu test henüz tamamlanmadı ya da analiz için yeterli chunk verisi yok.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600">
                    Durum: <strong>{String(currentTest.status || "unknown")}</strong>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setActiveTab("results")}>
                      Sonuçlara Git
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" onClick={() => loadTestDetails(currentTest.testId)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Yenile
                    </Button>
                  </div>
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
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="engine">Motor</TabsTrigger>
                  <TabsTrigger value="assessment">Değerlendirme</TabsTrigger>
                  <TabsTrigger value="agents">Agent Analizi</TabsTrigger>
                  <TabsTrigger value="metrics">Metrikler</TabsTrigger>
                  <TabsTrigger value="monitoring">İzleme</TabsTrigger>
                  <TabsTrigger value="reports">Raporlar</TabsTrigger>
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

                <TabsContent value="agents" className="space-y-4">
                  {/* Agent Performance Radar Chart */}
                  {currentTest?.testId && (
                    <AgentPerformanceRadar
                      testId={currentTest.testId}
                      token={tokenManager.getAccessToken() || undefined}
                      onError={(error) => toast.error(error)}
                    />
                  )}
                  
                  {/* Export Panel */}
                  {currentTest?.testId && (
                    <EvaluationExportPanel
                      testId={currentTest.testId}
                      testName={currentTest.testName}
                      token={tokenManager.getAccessToken() || undefined}
                      onExportComplete={() => toast.success("Export tamamlandı")}
                      onError={(error) => toast.error(error)}
                    />
                  )}
                  
                  {!currentTest?.testId && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center text-gray-500">
                          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Agent analizi için önce bir test seçin veya çalıştırın.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
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
