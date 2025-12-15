"use client";

import React, { useState, useEffect } from "react";
import TeacherLayout from "../components/TeacherLayout";
import { getSession, SessionMeta, listSessions } from "@/lib/api";
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
  Plus,
  Minus,
  ArrowRight,
  Zap,
  BookOpen,
  Users,
  Award,
  Database,
} from "lucide-react";
import { toast } from "@/lib/toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import type { Formatter } from "recharts/types/component/DefaultTooltipContent";
import ChartExportControls from "../../components/ChartExportControls";
import DataExportControls from "../../components/DataExportControls";

// Test Configuration Interface
interface TestConfig {
  testName: string;
  numQuestions: number;
  testMethods: string[];
  includeManualQuestions: boolean;
  customQuestions: string[];
  customExpectedAnswers: Record<number, string>; // Map of question index to expected answer
  enableBenchmark: boolean;
  exportFormat: string[];
}

// Question Detail Interface
interface SimilarityMetrics {
  semanticSimilarity?: number;
  bleuScore?: number;
  rougeL?: number;
  rouge1?: number;
  rouge2?: number;
  f1Score?: number;
  exactMatchRate?: number;
}

interface QuestionDetail {
  question_id: number;
  question: string;
  expected_answer?: string; // Ground truth answer
  methodologies: {
    [key: string]: {
      response: string;
      response_time_ms: number;
      cosine_similarity: number;
      max_similarity: number;
      precision_at_5: number;
      precision_at_10: number;
      retrieval_count: number;
      accuracy: number;
      similarity?: SimilarityMetrics; // New similarity metrics (LLM vs reference)
      answer_quality_similarity?: number | null; // Legacy field (backward compatibility)
    };
  };
}

// Test Results Interface
interface TestResult {
  testId: string;
  testName: string;
  status: "running" | "completed" | "failed" | "stopped";
  progress: number;
  startTime: string;
  endTime?: string;
  executionTime?: {
    total_seconds?: number;
    total_minutes?: number;
    formatted?: string;
    elapsed_seconds?: number;
    elapsed_minutes?: number;
    status?: string;
  };
  metrics: {
    cosineSimilarity: number;
    precisionAt5: number;
    precisionAt10: number;
    avgResponseTime: number;
    totalQuestions: number;
    correctAnswers: number;
    similarity?: SimilarityMetrics; // Aggregated similarity metrics
    answerQualitySimilarity?: number | null; // Legacy field (backward compatibility)
    answerQualityAvailable?: number; // Number of questions with ground truth
  };
  methodComparison: {
    eduBars: MethodResults;
    basicRag: MethodResults;
    llmOnly: MethodResults;
  };
  benchmarkComparison: {
    ekoBot: BenchmarkResults;
    current: BenchmarkResults;
  };
  questions?: QuestionDetail[]; // Detailed per-question results
  detailedResultsUrl?: string;
  detailedResultsAvailable?: boolean;
}

interface MethodResults {
  cosineSimilarity: number;
  precisionAt5: number;
  precisionAt10: number;
  avgResponseTime: number;
  accuracy: number;
  similarity?: SimilarityMetrics; // New similarity metrics
  answerQualitySimilarity?: number | null; // Legacy field (backward compatibility)
  answerQualityAvailable?: number; // Number of questions with ground truth
}

interface BenchmarkResults {
  cosineSimilarity: number;
  precisionAt5: number;
  label: string;
}

export default function TestSimulationPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("configuration");

  // Session State
  const [availableSessions, setAvailableSessions] = useState<SessionMeta[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<SessionMeta | null>(
    null
  );
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Test Configuration State
  const [config, setConfig] = useState<TestConfig>({
    testName: "",
    numQuestions: 30,
    testMethods: ["eduBars", "basicRag"],
    includeManualQuestions: false,
    customQuestions: [],
    customExpectedAnswers: {},
    enableBenchmark: true,
    exportFormat: ["json", "csv"],
  });

  // Test Execution State
  const [currentTest, setCurrentTest] = useState<TestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [questionText, setQuestionText] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Enhanced helper to read similarity metrics with fallback to legacy fields
  const getSimilarityValue = (
    results: MethodResults | TestResult["metrics"],
    key: keyof SimilarityMetrics
  ): number | null => {
    // First, try to get from nested similarity object
    const sim = results?.similarity;
    if (sim && typeof sim[key] === "number") {
      console.log(`✅ Found ${key} in nested similarity:`, sim[key]);
      return sim[key] as number;
    }

    // Fallback to legacy field for semantic similarity
    if (
      key === "semanticSimilarity" &&
      results &&
      "answerQualitySimilarity" in results
    ) {
      const legacy = (results as any).answerQualitySimilarity;
      if (typeof legacy === "number") {
        console.log(
          `⚠️ Using legacy answerQualitySimilarity for ${key}:`,
          legacy
        );
        return legacy;
      }
    }

    // Additional debugging
    console.log(`❌ No value found for ${key} in:`, {
      similarity: sim,
      answerQualitySimilarity: (results as any)?.answerQualitySimilarity,
      allKeys: Object.keys(results || {}),
    });

    return null;
  };

  // Helper function to get similarity value for individual question results
  const getQuestionSimilarityValue = (
    questionResults: any,
    key: keyof SimilarityMetrics
  ): number | null => {
    // First, try nested similarity object
    const sim = questionResults?.similarity;
    if (sim && typeof sim[key] === "number") {
      return sim[key];
    }

    // Fallback to legacy field for semantic similarity
    if (
      key === "semanticSimilarity" &&
      typeof questionResults?.answer_quality_similarity === "number"
    ) {
      return questionResults.answer_quality_similarity;
    }

    return null;
  };

  // Tooltip formatters (typed once to avoid repeating unions)
  const tooltipFormatterCosine: Formatter<string | number, string> = (
    value,
    name,
    props,
    payload,
    index
  ) => {
    if (Array.isArray(value)) return ["", ""];
    let numericValue: number | null = null;
    if (typeof value === "number") numericValue = value;
    else if (typeof value === "string") {
      const parsed = parseFloat(value);
      numericValue = Number.isFinite(parsed) ? parsed : null;
    }
    if (numericValue === null) return ["", ""];
    const formatted =
      name === "cosine"
        ? numericValue.toFixed(3)
        : `${numericValue.toFixed(1)}%`;
    const label =
      name === "cosine"
        ? "Cosine Similarity"
        : name === "precision5"
        ? "Precision@5"
        : "Accuracy";
    return [formatted, label];
  };

  const tooltipFormatterResponseTime: Formatter<string | number, string> = (
    value,
    name,
    props,
    payload,
    index
  ) => {
    if (Array.isArray(value)) return ["", ""];
    let numericValue: number | null = null;
    if (typeof value === "number") numericValue = value;
    else if (typeof value === "string") {
      const parsed = parseFloat(value);
      numericValue = Number.isFinite(parsed) ? parsed : null;
    }
    if (numericValue === null) return ["", ""];
    return [`${Math.round(numericValue)}ms`, "Yanıt Süresi"];
  };

  const tooltipFormatterPrecision: Formatter<string | number, string> = (
    value,
    name,
    props,
    payload,
    index
  ) => {
    if (Array.isArray(value) || typeof name !== "string") return ["", ""];
    let numericValue: number | null = null;
    if (typeof value === "number") numericValue = value;
    else if (typeof value === "string") {
      const parsed = parseFloat(value);
      numericValue = Number.isFinite(parsed) ? parsed : null;
    }
    if (numericValue === null) return ["", ""];
    const label = name === "precision5" ? "Precision@5" : "Precision@10";
    return [`${numericValue.toFixed(1)}%`, label];
  };

  const tooltipFormatterPercent: Formatter<string | number, string> = (
    value,
    name,
    props,
    payload,
    index
  ) => {
    if (Array.isArray(value)) return ["", ""];
    let numericValue: number | null = null;
    if (typeof value === "number") numericValue = value;
    else if (typeof value === "string") {
      const parsed = parseFloat(value);
      numericValue = Number.isFinite(parsed) ? parsed : null;
    }
    if (numericValue === null) return ["", ""];
    return [`${numericValue.toFixed(1)}%`, name || ""];
  };

  useEffect(() => {
    setMounted(true);
    fetchAvailableSessions();
  }, []);

  // Fetch available sessions for selection
  const fetchAvailableSessions = async () => {
    try {
      setLoadingSessions(true);
      const data = await listSessions();
      setAvailableSessions(data || []);

      // Auto-select first session if available
      if (data && data.length > 0) {
        setSelectedSessionId(data[0].session_id);
        await fetchSessionDetails(data[0].session_id);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setError("Ders oturumları yüklenemedi");
    } finally {
      setLoadingSessions(false);
    }
  };

  // Fetch specific session details
  const fetchSessionDetails = async (sessionId: string) => {
    try {
      if (!sessionId) return;
      const sessionData = await getSession(sessionId);
      setSelectedSession(sessionData);
    } catch (error) {
      console.error("Error fetching session details:", error);
      setError("Ders oturumu bilgileri alınamadı");
    }
  };

  // Handle session selection change
  const handleSessionChange = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    await fetchSessionDetails(sessionId);
  };

  const importQuestionsFromText = () => {
    const questions = questionText
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
      .slice(0, 100); // Limit to 100 questions max

    setConfig({
      ...config,
      customQuestions: questions,
      numQuestions: Math.min(questions.length, 100),
    });
  };

  // Auto-import questions when text changes
  React.useEffect(() => {
    if (questionText.trim()) {
      const questions = questionText
        .split("\n")
        .map((q) => q.trim())
        .filter((q) => q.length > 0)
        .slice(0, 100);

      setConfig((prev) => ({
        ...prev,
        customQuestions: questions,
        numQuestions: Math.min(questions.length, 100),
      }));
    }
  }, [questionText]);

  const startTest = async () => {
    if (!config.testName.trim()) {
      toast.error("Lütfen test adı girin");
      return;
    }

    try {
      setIsRunning(true);
      setError(null);

      if (config.customQuestions.length === 0) {
        toast.error("Lütfen test sorularını girin");
        return;
      }

      const testQuestions = config.customQuestions.slice(
        0,
        config.numQuestions
      );

      // Prepare expected answers map (convert to 0-based index for backend)
      const expectedAnswers: Record<number, string> = {};
      testQuestions.forEach((question, index) => {
        // Find the original index in customQuestions
        const originalIndex = config.customQuestions.indexOf(question);
        if (
          originalIndex !== -1 &&
          config.customExpectedAnswers[originalIndex]
        ) {
          expectedAnswers[index] = config.customExpectedAnswers[originalIndex];
        }
      });

      // Real API call to start test with session info
      const response = await fetch("/api/test-simulation/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testName: config.testName,
          questions: testQuestions,
          methods: config.testMethods,
          enableBenchmark: config.enableBenchmark,
          exportFormats: config.exportFormat,
          sessionId: selectedSessionId,
          sessionSettings: selectedSession?.rag_settings || null,
          expectedAnswers:
            Object.keys(expectedAnswers).length > 0
              ? expectedAnswers
              : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Test başlatılamadı" }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      // Initialize test result with API response
      const initialResult: TestResult = {
        testId: result.testId,
        testName: config.testName,
        status: "running",
        progress: 0,
        startTime: new Date().toISOString(),
        metrics: {
          cosineSimilarity: 0,
          precisionAt5: 0,
          precisionAt10: 0,
          avgResponseTime: 0,
          totalQuestions: testQuestions.length,
          correctAnswers: 0,
        },
        methodComparison: {
          eduBars: {
            cosineSimilarity: 0,
            precisionAt5: 0,
            precisionAt10: 0,
            avgResponseTime: 0,
            accuracy: 0,
          },
          basicRag: {
            cosineSimilarity: 0,
            precisionAt5: 0,
            precisionAt10: 0,
            avgResponseTime: 0,
            accuracy: 0,
          },
          llmOnly: {
            cosineSimilarity: 0,
            precisionAt5: 0,
            precisionAt10: 0,
            avgResponseTime: 0,
            accuracy: 0,
          },
        },
        benchmarkComparison: {
          ekoBot: {
            cosineSimilarity: 0.82,
            precisionAt5: 100,
            label: "EkoBot Referans",
          },
          current: {
            cosineSimilarity: 0,
            precisionAt5: 0,
            label: "Mevcut Test",
          },
        },
      };

      setCurrentTest(initialResult);
      setActiveTab("monitoring");
      toast.success("Test başlatıldı!");

      // Start polling for test progress
      pollTestStatus(result.testId);
    } catch (error) {
      console.error("Test başlatma hatası:", error);
      setError(error instanceof Error ? error.message : "Test başlatılamadı");
      toast.error("Test başlatılamadı");
      setIsRunning(false);
    }
  };

  // Poll test status from API
  const pollTestStatus = (testId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/test-simulation/status/${testId}`);
        if (!response.ok) {
          console.error("Failed to fetch test status");
          return;
        }

        const status = await response.json();

        // Debug logging to see what data structure is received
        console.log("📊 Test Status Update Received:", {
          status: status.status,
          progress: status.progress,
          metrics: status.metrics,
          methodComparison: status.methodComparison,
          sampleQuestions: status.questions?.slice(0, 2), // Log first 2 questions for debugging
        });

        // Update current test with API data
        setCurrentTest((prevTest) => {
          if (!prevTest) return null;

          const updatedTest = {
            ...prevTest,
            progress: status.progress,
            status: status.status,
            endTime: status.endTime,
            executionTime: status.executionTime || prevTest.executionTime,
            metrics: status.metrics || prevTest.metrics,
            methodComparison:
              status.methodComparison || prevTest.methodComparison,
            benchmarkComparison:
              status.benchmarkComparison || prevTest.benchmarkComparison,
            questions: status.questions || prevTest.questions,
            detailedResultsUrl: status.detailedResultsUrl,
            detailedResultsAvailable: status.detailedResultsAvailable,
          };

          // Debug similarity data structure
          if (status.methodComparison) {
            console.log("🔍 Method Comparison Similarity Data:", {
              eduBars: {
                similarity: status.methodComparison.eduBars?.similarity,
                answerQualitySimilarity:
                  status.methodComparison.eduBars?.answerQualitySimilarity,
              },
              basicRag: {
                similarity: status.methodComparison.basicRag?.similarity,
                answerQualitySimilarity:
                  status.methodComparison.basicRag?.answerQualitySimilarity,
              },
            });
          }

          return updatedTest;
        });

        // If test is completed or failed, stop polling
        if (
          status.status === "completed" ||
          status.status === "failed" ||
          status.status === "stopped"
        ) {
          clearInterval(interval);
          setIsRunning(false);

          if (status.status === "completed") {
            toast.success("Test tamamlandı!");
            setActiveTab("results");
          } else if (status.status === "failed") {
            toast.error("Test başarısız!");
            setError("Test execution failed");
          } else if (status.status === "stopped") {
            toast.info("Test durduruldu");
          }
        }
      } catch (error) {
        console.error("Error polling test status:", error);
        // Don't stop polling on error, just log it
      }
    }, 2000); // Poll every 2 seconds
  };

  const stopTest = async () => {
    if (currentTest) {
      try {
        const response = await fetch(
          `/api/test-simulation/stop/${currentTest.testId}`,
          {
            method: "POST",
          }
        );

        if (!response.ok) {
          throw new Error("Test durdurulamadı");
        }

        const result = await response.json();

        setCurrentTest({
          ...currentTest,
          status: "stopped",
          endTime: result.endTime || new Date().toISOString(),
        });
        setIsRunning(false);
        toast.info("Test durduruldu");
      } catch (error) {
        console.error("Stop test error:", error);
        toast.error("Test durdurulurken hata oluştu");
      }
    }
  };

  const resetTest = () => {
    setCurrentTest(null);
    setIsRunning(false);
    setError(null);
    setActiveTab("configuration");
  };

  const exportResults = async (format: "json" | "csv") => {
    if (!currentTest) return;

    try {
      const response = await fetch(
        `/api/test-simulation/export/${currentTest.testId}?format=${format}`
      );

      if (!response.ok) {
        throw new Error("Export başarısız");
      }

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `test_simulation_${currentTest.testId}_${timestamp}.${format}`;

      if (format === "json") {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === "csv") {
        const csvContent = await response.text();
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }

      toast.success(`${format.toUpperCase()} dosyası indirildi!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export başarısız oldu");

      // Fallback to client-side export
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `test_simulation_${currentTest.testId}_${timestamp}.${format}`;

      if (format === "json") {
        const blob = new Blob([JSON.stringify(currentTest, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(`${format.toUpperCase()} dosyası indirildi (fallback)!`);
      } else if (format === "csv") {
        const csvData = [
          ["Metric", "AkıllıRehber", "Basic RAG", "LLM Only", "Benchmark"],
          [
            "Cosine Similarity",
            currentTest.methodComparison.eduBars.cosineSimilarity.toFixed(3),
            currentTest.methodComparison.basicRag.cosineSimilarity.toFixed(3),
            currentTest.methodComparison.llmOnly.cosineSimilarity.toFixed(3),
            currentTest.benchmarkComparison.ekoBot.cosineSimilarity.toFixed(3),
          ],
          [
            "Semantic Similarity",
            (
              getSimilarityValue(
                currentTest.methodComparison.eduBars,
                "semanticSimilarity"
              ) ?? 0
            ).toFixed(3),
            (
              getSimilarityValue(
                currentTest.methodComparison.basicRag,
                "semanticSimilarity"
              ) ?? 0
            ).toFixed(3),
            (
              getSimilarityValue(
                currentTest.methodComparison.llmOnly,
                "semanticSimilarity"
              ) ?? 0
            ).toFixed(3),
            "N/A",
          ],
          [
            "BLEU",
            (
              getSimilarityValue(
                currentTest.methodComparison.eduBars,
                "bleuScore"
              ) ?? 0
            ).toFixed(3),
            (
              getSimilarityValue(
                currentTest.methodComparison.basicRag,
                "bleuScore"
              ) ?? 0
            ).toFixed(3),
            (
              getSimilarityValue(
                currentTest.methodComparison.llmOnly,
                "bleuScore"
              ) ?? 0
            ).toFixed(3),
            "N/A",
          ],
          [
            "ROUGE-L",
            (
              getSimilarityValue(
                currentTest.methodComparison.eduBars,
                "rougeL"
              ) ?? 0
            ).toFixed(3),
            (
              getSimilarityValue(
                currentTest.methodComparison.basicRag,
                "rougeL"
              ) ?? 0
            ).toFixed(3),
            (
              getSimilarityValue(
                currentTest.methodComparison.llmOnly,
                "rougeL"
              ) ?? 0
            ).toFixed(3),
            "N/A",
          ],
          [
            "F1 (Token)",
            (
              getSimilarityValue(
                currentTest.methodComparison.eduBars,
                "f1Score"
              ) ?? 0
            ).toFixed(3),
            (
              getSimilarityValue(
                currentTest.methodComparison.basicRag,
                "f1Score"
              ) ?? 0
            ).toFixed(3),
            (
              getSimilarityValue(
                currentTest.methodComparison.llmOnly,
                "f1Score"
              ) ?? 0
            ).toFixed(3),
            "N/A",
          ],
          [
            "Precision@5 (%)",
            currentTest.methodComparison.eduBars.precisionAt5.toFixed(1),
            currentTest.methodComparison.basicRag.precisionAt5.toFixed(1),
            currentTest.methodComparison.llmOnly.precisionAt5.toFixed(1),
            currentTest.benchmarkComparison.ekoBot.precisionAt5.toFixed(1),
          ],
          [
            "Precision@10 (%)",
            currentTest.methodComparison.eduBars.precisionAt10.toFixed(1),
            currentTest.methodComparison.basicRag.precisionAt10.toFixed(1),
            currentTest.methodComparison.llmOnly.precisionAt10.toFixed(1),
            "N/A",
          ],
          [
            "Avg Response Time (ms)",
            currentTest.methodComparison.eduBars.avgResponseTime.toFixed(0),
            currentTest.methodComparison.basicRag.avgResponseTime.toFixed(0),
            currentTest.methodComparison.llmOnly.avgResponseTime.toFixed(0),
            "N/A",
          ],
          [
            "Accuracy (%)",
            currentTest.methodComparison.eduBars.accuracy.toFixed(1),
            currentTest.methodComparison.basicRag.accuracy.toFixed(1),
            currentTest.methodComparison.llmOnly.accuracy.toFixed(1),
            "N/A",
          ],
        ];

        const csvContent = csvData
          .map((row) => row.map((cell) => `"${cell}"`).join(","))
          .join("\n");

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(`${format.toUpperCase()} dosyası indirildi (fallback)!`);
      }
    }
  };

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
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <Brain className="h-8 w-8 text-white" />
              </div>
              Metodoloji Test Simülasyonu
            </h1>
            <p className="text-gray-600 mt-1">
              AkıllıRehber Performans Analizi ve Karşılaştırma Testleri
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
            <TabsTrigger
              value="configuration"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Konfigürasyon
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Sonuçlar
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Detaylı Rapor
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
                      placeholder="Örn: RAG Performans Testi #1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numQuestions">Soru Sayısı</Label>
                    <Input
                      id="numQuestions"
                      type="number"
                      min="1"
                      max={Math.max(1, config.customQuestions.length)}
                      value={config.numQuestions}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          numQuestions: Math.min(
                            parseInt(e.target.value) || 1,
                            config.customQuestions.length
                          ),
                        })
                      }
                      disabled={config.customQuestions.length === 0}
                    />
                    <p className="text-sm text-gray-500">
                      Test edilecek soru sayısı (maksimum:{" "}
                      {config.customQuestions.length || 0})
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Test Metodları</Label>
                    <div className="space-y-2">
                      {[
                        {
                          id: "eduBars",
                          label:
                            "AkıllıRehber Tam Sistem (APRAG Kişiselleştirme KAPALI)",
                        },
                        {
                          id: "basicRag",
                          label: "Basit RAG (CRAG ve Reranker yok)",
                        },
                        { id: "llmOnly", label: "Sadece LLM (Retrieval yok)" },
                      ].map((method) => (
                        <label
                          key={method.id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={config.testMethods.includes(method.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setConfig({
                                  ...config,
                                  testMethods: [
                                    ...config.testMethods,
                                    method.id,
                                  ],
                                });
                              } else {
                                setConfig({
                                  ...config,
                                  testMethods: config.testMethods.filter(
                                    (m) => m !== method.id
                                  ),
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm">{method.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Session Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-indigo-500" />
                    Ders Oturumu Seçimi
                  </CardTitle>
                  <CardDescription>
                    Test için kullanılacak ders oturumunu seçin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionSelect">Ders Oturumu</Label>
                    <select
                      id="sessionSelect"
                      value={selectedSessionId}
                      onChange={(e) => handleSessionChange(e.target.value)}
                      disabled={loadingSessions}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm"
                    >
                      {loadingSessions ? (
                        <option value="">Oturumlar yükleniyor...</option>
                      ) : availableSessions.length === 0 ? (
                        <option value="">Ders oturumu bulunamadı</option>
                      ) : (
                        <>
                          <option value="">Oturum seçin...</option>
                          {availableSessions.map((session) => (
                            <option
                              key={session.session_id}
                              value={session.session_id}
                            >
                              {session.name} (
                              {session.description || "Açıklama yok"})
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  {selectedSession && selectedSession.rag_settings && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Mevcut Model Ayarları
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-blue-600 font-medium">
                            AI Provider:
                          </span>
                          <span className="ml-2 text-gray-700">
                            {selectedSession.rag_settings.provider ||
                              "Belirtilmemiş"}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-600 font-medium">
                            AI Model:
                          </span>
                          <span className="ml-2 text-gray-700">
                            {selectedSession.rag_settings.model ||
                              "Belirtilmemiş"}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-600 font-medium">
                            Embedding Provider:
                          </span>
                          <span className="ml-2 text-gray-700">
                            {selectedSession.rag_settings.embedding_provider ||
                              "Belirtilmemiş"}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-600 font-medium">
                            Embedding Model:
                          </span>
                          <span className="ml-2 text-gray-700">
                            {selectedSession.rag_settings.embedding_model ||
                              "Belirtilmemiş"}
                          </span>
                        </div>
                        {selectedSession.rag_settings.use_reranker_service && (
                          <div className="md:col-span-2">
                            <span className="text-blue-600 font-medium">
                              Reranker:
                            </span>
                            <span className="ml-2 text-gray-700">
                              {selectedSession.rag_settings.reranker_type ||
                                "Etkin"}{" "}
                              (Harici servis)
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
                        💡 Bu ayarlar test sırasında tüm metodlar için
                        kullanılacak
                      </div>
                    </div>
                  )}

                  {!selectedSession && selectedSessionId && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-sm text-yellow-800">
                        Seçilen oturum yükleniyor...
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Advanced Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-orange-500" />
                      Gelişmiş Ayarlar
                    </div>
                    <input
                      type="checkbox"
                      checked={showAdvanced}
                      onChange={(e) => setShowAdvanced(e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                    />
                  </CardTitle>
                  <CardDescription>
                    Benchmark ve export seçenekleri
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showAdvanced && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Benchmark Karşılaştırması</Label>
                          <p className="text-sm text-gray-500">
                            EkoBot referans değerleri ile karşılaştır
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.enableBenchmark}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              enableBenchmark: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Export Formatları</Label>
                        <div className="space-y-2">
                          {[
                            { id: "json", label: "JSON" },
                            { id: "csv", label: "CSV" },
                            { id: "excel", label: "Excel" },
                          ].map((format) => (
                            <label
                              key={format.id}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="checkbox"
                                checked={config.exportFormat.includes(
                                  format.id
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setConfig({
                                      ...config,
                                      exportFormat: [
                                        ...config.exportFormat,
                                        format.id,
                                      ],
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
                    </>
                  )}

                  <div className="pt-4 border-t">
                    <Button
                      onClick={startTest}
                      disabled={
                        isRunning ||
                        !config.testName.trim() ||
                        config.testMethods.length === 0 ||
                        config.customQuestions.length === 0 ||
                        !selectedSessionId ||
                        !selectedSession
                      }
                      className="w-full"
                      size="lg"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Test Başlatılıyor...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-5 w-5" />
                          Testi Başlat
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Question Input */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-500" />
                    Test Soruları
                  </CardTitle>
                  <CardDescription>
                    Tarih dersi chunk'larını test etmek için sorularınızı buraya
                    yapıştırın. Her satırda bir soru olacak şekilde düzenleyin.
                    <br />
                    <strong>Opsiyonel:</strong> Ground truth (beklenen cevap)
                    eklemek için her satırda{" "}
                    <code className="bg-gray-100 px-1 rounded">Soru|Cevap</code>{" "}
                    formatını kullanın.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionText">Test Soruları</Label>
                    <Textarea
                      id="questionText"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Test sorularını buraya kopyalayın (her satırda bir soru)&#10;&#10;Örnek (sadece sorular):&#10;Osmanlı İmparatorluğu hangi yüzyılda kuruldu?&#10;Fatih Sultan Mehmet hangi şehri fethetti?&#10;&#10;Örnek (sorular + beklenen cevaplar):&#10;Osmanlı İmparatorluğu hangi yüzyılda kuruldu?|13. yüzyıl&#10;Fatih Sultan Mehmet hangi şehri fethetti?|İstanbul&#10;Tanzimat Fermanı ne zaman ilan edildi?|1839&#10;&#10;Not: | işareti ile soru ve cevabı ayırın. Cevap opsiyoneldir."
                      className="min-h-[200px] resize-y"
                      rows={12}
                    />
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {config.customQuestions.length} soru tespit edildi
                        {Object.keys(config.customExpectedAnswers || {})
                          .length > 0 && (
                          <span className="ml-2 text-blue-600">
                            (
                            {
                              Object.keys(config.customExpectedAnswers || {})
                                .length
                            }{" "}
                            soru için beklenen cevap var)
                          </span>
                        )}
                      </span>
                      <span>Maksimum 100 soru</span>
                    </div>
                  </div>

                  {config.customQuestions.length > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {config.customQuestions.length} soru başarıyla
                          yüklendi
                        </span>
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Test{" "}
                        {Math.min(
                          config.customQuestions.length,
                          config.numQuestions
                        )}{" "}
                        soru ile çalışacak
                        {Object.keys(config.customExpectedAnswers || {})
                          .length > 0 && (
                          <span className="block mt-1 text-blue-600">
                            💡{" "}
                            {
                              Object.keys(config.customExpectedAnswers || {})
                                .length
                            }{" "}
                            soru için semantik / BLEU / ROUGE / F1 metrikleri
                            hesaplanacak (fallback yok; ground truth şart).
                          </span>
                        )}
                      </div>
                    </div>
                  )}
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
                            {currentTest.metrics.totalQuestions}
                          </div>
                          <div className="text-sm text-gray-500">
                            Toplam Soru
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {config.testMethods.length}
                          </div>
                          <div className="text-sm text-gray-500">
                            Test Metodu
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {currentTest.status === "completed"
                              ? "100"
                              : Math.round(currentTest.progress)}
                            %
                          </div>
                          <div className="text-sm text-gray-500">
                            Tamamlanma
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {currentTest.endTime
                              ? Math.round(
                                  (new Date(currentTest.endTime).getTime() -
                                    new Date(currentTest.startTime).getTime()) /
                                    1000
                                )
                              : Math.round(
                                  (Date.now() -
                                    new Date(currentTest.startTime).getTime()) /
                                    1000
                                )}
                            s
                          </div>
                          <div className="text-sm text-gray-500">
                            Geçen Süre
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

                {/* Real-time Metrics Preview */}
                {currentTest.progress > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Gerçek Zamanlı Metrikler
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            {(
                              currentTest.metrics.cosineSimilarity || 0
                            ).toFixed(3)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Cosine Similarity
                          </div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-lg font-bold text-green-600">
                            {(currentTest.metrics.precisionAt5 || 0).toFixed(1)}
                            %
                          </div>
                          <div className="text-sm text-gray-600">
                            Precision@5
                          </div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-lg font-bold text-purple-600">
                            {(currentTest.metrics.precisionAt10 || 0).toFixed(
                              1
                            )}
                            %
                          </div>
                          <div className="text-sm text-gray-600">
                            Precision@10
                          </div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-lg font-bold text-orange-600">
                            {Math.round(
                              currentTest.metrics.avgResponseTime || 0
                            )}
                            ms
                          </div>
                          <div className="text-sm text-gray-600">
                            Avg Response Time
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
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
                {/* Summary Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Test Özeti: {currentTest.testName}
                      </CardTitle>
                      <DataExportControls
                        testResult={currentTest}
                        chartIds={[
                          "method-performance-chart",
                          "response-time-chart",
                          "performance-radar-chart",
                          "cosine-similarity-chart",
                          "precision-comparison-chart",
                          "response-time-detailed-chart",
                          "accuracy-comparison-chart",
                          "question-performance-chart",
                          "similarity-distribution-chart",
                          "success-rate-chart",
                        ]}
                        variant="compact"
                        className="flex gap-2"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Test Süresi</div>
                        <div className="text-lg font-semibold">
                          {currentTest.executionTime?.formatted ||
                            (currentTest.executionTime?.total_seconds
                              ? `${Math.round(
                                  Math.max(
                                    0,
                                    currentTest.executionTime.total_seconds
                                  )
                                )}s`
                              : currentTest.endTime
                              ? Math.round(
                                  (new Date(currentTest.endTime).getTime() -
                                    new Date(currentTest.startTime).getTime()) /
                                    1000
                                ) + "s"
                              : "0s")}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Toplam Soru</div>
                        <div className="text-lg font-semibold">
                          {currentTest.metrics.totalQuestions}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Doğru Cevap</div>
                        <div className="text-lg font-semibold">
                          {currentTest.metrics.correctAnswers}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Başarı Oranı
                        </div>
                        <div className="text-lg font-semibold">
                          {(
                            (currentTest.metrics.correctAnswers /
                              currentTest.metrics.totalQuestions) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Method Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Metod Karşılaştırması
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Metod</th>
                            <th className="text-center p-2">
                              Cosine Similarity
                            </th>
                            <th className="text-center p-2">Precision@5 (%)</th>
                            <th className="text-center p-2">
                              Precision@10 (%)
                            </th>
                            <th className="text-center p-2">
                              Avg Response (ms)
                            </th>
                            <th className="text-center p-2">Accuracy (%)</th>
                            <th className="text-center p-2">
                              Cevap Kalitesi (Semantic / BLEU / ROUGE-L / F1)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(currentTest.methodComparison).map(
                            ([method, results]) => {
                              const methodNames: Record<string, string> = {
                                eduBars: "AkıllıRehber Tam Sistem",
                                basicRag: "Basit RAG",
                                llmOnly: "Sadece LLM",
                              };

                              return (
                                <tr
                                  key={method}
                                  className="border-b hover:bg-gray-50"
                                >
                                  <td className="p-2 font-medium">
                                    {methodNames[method]}
                                  </td>
                                  <td className="p-2 text-center">
                                    <span
                                      className={`font-medium ${
                                        results.cosineSimilarity >= 0.85
                                          ? "text-green-600"
                                          : results.cosineSimilarity >= 0.75
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {results.cosineSimilarity.toFixed(3)}
                                    </span>
                                  </td>
                                  <td className="p-2 text-center">
                                    <span
                                      className={`font-medium ${
                                        results.precisionAt5 >= 90
                                          ? "text-green-600"
                                          : results.precisionAt5 >= 80
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {results.precisionAt5.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="p-2 text-center">
                                    <span
                                      className={`font-medium ${
                                        results.precisionAt10 >= 85
                                          ? "text-green-600"
                                          : results.precisionAt10 >= 75
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {results.precisionAt10.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="p-2 text-center">
                                    <span
                                      className={`font-medium ${
                                        results.avgResponseTime <= 1000
                                          ? "text-green-600"
                                          : results.avgResponseTime <= 1500
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {Math.round(results.avgResponseTime)}
                                    </span>
                                  </td>
                                  <td className="p-2 text-center">
                                    <span
                                      className={`font-medium ${
                                        results.accuracy >= 85
                                          ? "text-green-600"
                                          : results.accuracy >= 75
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {results.accuracy.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="p-2 text-center">
                                    <div className="text-xs text-gray-700 space-y-1">
                                      <div>
                                        <span className="font-semibold">
                                          Semantic:
                                        </span>{" "}
                                        {getSimilarityValue(
                                          results,
                                          "semanticSimilarity"
                                        ) !== null
                                          ? (
                                              getSimilarityValue(
                                                results,
                                                "semanticSimilarity"
                                              ) as number
                                            ).toFixed(3)
                                          : "N/A"}
                                      </div>
                                      <div>
                                        <span className="font-semibold">
                                          BLEU:
                                        </span>{" "}
                                        {getSimilarityValue(
                                          results,
                                          "bleuScore"
                                        ) !== null
                                          ? (
                                              getSimilarityValue(
                                                results,
                                                "bleuScore"
                                              ) as number
                                            ).toFixed(3)
                                          : "N/A"}
                                      </div>
                                      <div>
                                        <span className="font-semibold">
                                          ROUGE-L:
                                        </span>{" "}
                                        {getSimilarityValue(
                                          results,
                                          "rougeL"
                                        ) !== null
                                          ? (
                                              getSimilarityValue(
                                                results,
                                                "rougeL"
                                              ) as number
                                            ).toFixed(3)
                                          : "N/A"}
                                      </div>
                                      <div>
                                        <span className="font-semibold">
                                          F1:
                                        </span>{" "}
                                        {getSimilarityValue(
                                          results,
                                          "f1Score"
                                        ) !== null
                                          ? (
                                              getSimilarityValue(
                                                results,
                                                "f1Score"
                                              ) as number
                                            ).toFixed(3)
                                          : "N/A"}
                                      </div>
                                      {results.answerQualityAvailable !==
                                        undefined &&
                                        results.answerQualityAvailable > 0 && (
                                          <div className="text-[11px] text-gray-500 mt-1">
                                            ({results.answerQualityAvailable}{" "}
                                            soru)
                                          </div>
                                        )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Method Performance Bar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Performans Karşılaştırması
                        </div>
                        <ChartExportControls
                          chartId="method-performance-chart"
                          chartTitle="Performans Karşılaştırması"
                          variant="compact"
                          showLabels={false}
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div id="method-performance-chart">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={Object.entries(currentTest.methodComparison)
                              .filter(([method]) =>
                                config.testMethods.includes(method)
                              )
                              .filter(
                                ([, results]) => results.cosineSimilarity > 0
                              ) // Filter out zero similarity results
                              .map(([method, results]) => ({
                                name:
                                  {
                                    eduBars: "AkıllıRehber",
                                    basicRag: "Basit RAG",
                                    llmOnly: "Sadece LLM",
                                  }[method] || method,
                                cosine: results.cosineSimilarity, // Backend already uses max_similarity
                                precision5: results.precisionAt5,
                                accuracy: results.accuracy,
                              }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 12 }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis />
                            <Tooltip formatter={tooltipFormatterCosine} />
                            <Legend />
                            <Bar
                              dataKey="cosine"
                              fill="#3b82f6"
                              name="Cosine Similarity"
                              radius={[2, 2, 0, 0]}
                            />
                            <Bar
                              dataKey="precision5"
                              fill="#10b981"
                              name="Precision@5 (%)"
                              radius={[2, 2, 0, 0]}
                            />
                            <Bar
                              dataKey="accuracy"
                              fill="#f59e0b"
                              name="Accuracy (%)"
                              radius={[2, 2, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Response Time Comparison */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Yanıt Süreleri
                        </div>
                        <ChartExportControls
                          chartId="response-time-chart"
                          chartTitle="Yanıt Süreleri"
                          variant="compact"
                          showLabels={false}
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div id="response-time-chart">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={Object.entries(currentTest.methodComparison)
                              .filter(([method]) =>
                                config.testMethods.includes(method)
                              )
                              .filter(
                                ([, results]) => results.cosineSimilarity > 0
                              ) // Filter out zero similarity results
                              .map(([method, results]) => ({
                                name:
                                  {
                                    eduBars: "AkıllıRehber",
                                    basicRag: "Basit RAG",
                                    llmOnly: "Sadece LLM",
                                  }[method] || method,
                                responseTime: results.avgResponseTime,
                              }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 12 }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis />
                            <Tooltip formatter={tooltipFormatterResponseTime} />
                            <Legend />
                            <Bar
                              dataKey="responseTime"
                              fill="#ef4444"
                              name="Yanıt Süresi (ms)"
                              radius={[2, 2, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Radar Chart for Overall Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Genel Performans Analizi
                      </div>
                      <ChartExportControls
                        chartId="performance-radar-chart"
                        chartTitle="Genel Performans Analizi"
                        variant="compact"
                        showLabels={false}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div id="performance-radar-chart">
                      <ResponsiveContainer width="100%" height={400}>
                        <RadarChart
                          data={[
                            "cosine",
                            "precision5",
                            "precision10",
                            "accuracy",
                            "speed",
                          ].map((metric) => ({
                            metric: {
                              cosine: "Cosine Similarity",
                              precision5: "Precision@5",
                              precision10: "Precision@10",
                              accuracy: "Accuracy",
                              speed: "Speed (Inverted)",
                            }[metric],
                            ...Object.entries(currentTest.methodComparison)
                              .filter(([method]) =>
                                config.testMethods.includes(method)
                              )
                              .reduce((acc, [method, results]) => {
                                let value = 0;
                                if (metric === "cosine")
                                  value = results.cosineSimilarity * 100;
                                else if (metric === "precision5")
                                  value = results.precisionAt5;
                                else if (metric === "precision10")
                                  value = results.precisionAt10;
                                else if (metric === "accuracy")
                                  value = results.accuracy;
                                else if (metric === "speed")
                                  value = Math.max(
                                    0,
                                    100 - results.avgResponseTime / 20
                                  ); // Inverted and scaled

                                const methodName =
                                  {
                                    eduBars: "AkıllıRehber",
                                    singleModel: "TekModel",
                                    twoStageRetrieval: "IkiAsama",
                                    singleStageRetrieval: "TekAsama",
                                  }[method] || method;

                                acc[methodName] = value;
                                return acc;
                              }, {} as Record<string, number>),
                          }))}
                          margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
                        >
                          <PolarGrid />
                          <PolarAngleAxis
                            dataKey="metric"
                            tick={{ fontSize: 12 }}
                          />
                          <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{ fontSize: 10 }}
                            tickCount={6}
                          />
                          {config.testMethods.map((method, index) => {
                            const methodName =
                              {
                                eduBars: "AkıllıRehber",
                                basicRag: "BasitRAG",
                                llmOnly: "SadeceLLM",
                              }[method] || method;

                            const colors = [
                              "#3b82f6",
                              "#10b981",
                              "#f59e0b",
                              "#ef4444",
                            ];
                            return (
                              <Radar
                                key={method}
                                name={
                                  {
                                    AkıllıRehber: "AkıllıRehber",
                                    TekModel: "Tek Model",
                                    IkiAsama: "İki Aşama",
                                    TekAsama: "Tek Aşama",
                                  }[methodName] || methodName
                                }
                                dataKey={methodName}
                                stroke={colors[index]}
                                fill={colors[index]}
                                fillOpacity={0.1}
                                strokeWidth={2}
                              />
                            );
                          })}
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Benchmark Comparison */}
                {config.enableBenchmark && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Benchmark Karşılaştırması
                        </div>
                        <ChartExportControls
                          chartId="benchmark-comparison-chart"
                          chartTitle="Benchmark Karşılaştırması"
                          variant="compact"
                          showLabels={false}
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div id="benchmark-comparison-chart">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="text-center p-6 bg-blue-50 rounded-lg">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                              {currentTest.benchmarkComparison.ekoBot.cosineSimilarity.toFixed(
                                3
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              EkoBot Referans
                            </div>
                            <div className="text-lg font-semibold text-blue-600">
                              Precision@5:{" "}
                              {
                                currentTest.benchmarkComparison.ekoBot
                                  .precisionAt5
                              }
                              %
                            </div>
                          </div>
                          <div className="text-center p-6 bg-green-50 rounded-lg">
                            <div className="text-3xl font-bold text-green-600 mb-2">
                              {currentTest.benchmarkComparison.current.cosineSimilarity.toFixed(
                                3
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              Mevcut Test
                            </div>
                            <div className="text-lg font-semibold text-green-600">
                              Precision@5:{" "}
                              {currentTest.benchmarkComparison.current.precisionAt5.toFixed(
                                1
                              )}
                              %
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-center">
                            {currentTest.benchmarkComparison.current
                              .cosineSimilarity >=
                            currentTest.benchmarkComparison.ekoBot
                              .cosineSimilarity ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium">
                                  Benchmark'ı{" "}
                                  {(
                                    ((currentTest.benchmarkComparison.current
                                      .cosineSimilarity -
                                      currentTest.benchmarkComparison.ekoBot
                                        .cosineSimilarity) /
                                      currentTest.benchmarkComparison.ekoBot
                                        .cosineSimilarity) *
                                    100
                                  ).toFixed(1)}
                                  % geçti
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-orange-600">
                                <AlertTriangle className="h-5 w-5" />
                                <span className="font-medium">
                                  Benchmark'ın{" "}
                                  {(
                                    ((currentTest.benchmarkComparison.ekoBot
                                      .cosineSimilarity -
                                      currentTest.benchmarkComparison.current
                                        .cosineSimilarity) /
                                      currentTest.benchmarkComparison.ekoBot
                                        .cosineSimilarity) *
                                    100
                                  ).toFixed(1)}
                                  % altında
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : currentTest && currentTest.status === "running" ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Test Devam Ediyor
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Sonuçları görmek için testin tamamlanmasını bekleyin.
                  </p>
                  <div className="text-sm text-gray-400">
                    İlerleme: {Math.round(currentTest.progress)}%
                  </div>
                </CardContent>
              </Card>
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

          {/* Detailed Results Tab */}
          <TabsContent value="detailed" className="space-y-6">
            {currentTest && currentTest.status === "completed" ? (
              currentTest.questions && currentTest.questions.length > 0 ? (
                <div className="space-y-6">
                  {/* Performance Analysis Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cosine Similarity Distribution by Methodology */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-5 w-5" />
                              Cosine Similarity Dağılımı (Metodoloji Bazında)
                            </div>
                            <CardDescription>
                              Her metodoloji için cosine similarity değerlerinin
                              ortalaması (max similarity bazlı)
                            </CardDescription>
                          </div>
                          <ChartExportControls
                            chartId="cosine-similarity-chart"
                            chartTitle="Cosine Similarity Dağılımı"
                            variant="compact"
                            showLabels={false}
                          />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div id="cosine-similarity-chart">
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                              data={Object.entries(currentTest.methodComparison)
                                .filter(([method]) =>
                                  config.testMethods.includes(method)
                                )
                                .filter(
                                  ([, results]) => results.cosineSimilarity > 0
                                )
                                .map(([method, results]) => ({
                                  name:
                                    {
                                      eduBars: "AkıllıRehber",
                                      basicRag: "Basit RAG",
                                      llmOnly: "Sadece LLM",
                                    }[method] || method,
                                  similarity: results.cosineSimilarity,
                                  avg: results.cosineSimilarity,
                                }))}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                              <Tooltip formatter={tooltipFormatterCosine} />
                              <Legend />
                              <Bar
                                dataKey="similarity"
                                fill="#3b82f6"
                                name="Ortalama Cosine Similarity"
                                radius={[2, 2, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Precision@5 and Precision@10 Comparison */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Target className="h-5 w-5" />
                              Precision@k Karşılaştırması
                            </div>
                            <CardDescription>
                              Her metodoloji için Precision@5 ve Precision@10
                              değerlerinin karşılaştırması
                            </CardDescription>
                          </div>
                          <ChartExportControls
                            chartId="precision-comparison-chart"
                            chartTitle="Precision@k Karşılaştırması"
                            variant="compact"
                            showLabels={false}
                          />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div id="precision-comparison-chart">
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                              data={Object.entries(currentTest.methodComparison)
                                .filter(([method]) =>
                                  config.testMethods.includes(method)
                                )
                                .filter(
                                  ([, results]) => results.cosineSimilarity > 0
                                )
                                .map(([method, results]) => ({
                                  name:
                                    {
                                      eduBars: "AkıllıRehber",
                                      basicRag: "Basit RAG",
                                      llmOnly: "Sadece LLM",
                                    }[method] || method,
                                  precision5: results.precisionAt5,
                                  precision10: results.precisionAt10,
                                }))}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis
                                domain={[0, 100]}
                                tick={{ fontSize: 12 }}
                              />
                              <Tooltip formatter={tooltipFormatterPrecision} />
                              <Legend />
                              <Bar
                                dataKey="precision5"
                                fill="#10b981"
                                name="Precision@5 (%)"
                                radius={[2, 2, 0, 0]}
                              />
                              <Bar
                                dataKey="precision10"
                                fill="#059669"
                                name="Precision@10 (%)"
                                radius={[2, 2, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Response Time Comparison */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Yanıt Süresi Karşılaştırması
                          </div>
                          <ChartExportControls
                            chartId="response-time-detailed-chart"
                            chartTitle="Yanıt Süresi Karşılaştırması"
                            variant="compact"
                            showLabels={false}
                          />
                        </CardTitle>
                        <CardDescription>
                          Her metodoloji için ortalama yanıt süresi (milisaniye
                          cinsinden)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div id="response-time-detailed-chart">
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                              data={Object.entries(currentTest.methodComparison)
                                .filter(([method]) =>
                                  config.testMethods.includes(method)
                                )
                                .filter(
                                  ([, results]) => results.cosineSimilarity > 0
                                )
                                .map(([method, results]) => ({
                                  name:
                                    {
                                      eduBars: "AkıllıRehber",
                                      basicRag: "Basit RAG",
                                      llmOnly: "Sadece LLM",
                                    }[method] || method,
                                  responseTime: results.avgResponseTime,
                                }))}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip
                                formatter={tooltipFormatterResponseTime}
                              />
                              <Legend />
                              <Bar
                                dataKey="responseTime"
                                fill="#ef4444"
                                name="Yanıt Süresi (ms)"
                                radius={[2, 2, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Accuracy Comparison */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Doğruluk Oranı Karşılaştırması
                          </div>
                          <ChartExportControls
                            chartId="accuracy-comparison-chart"
                            chartTitle="Doğruluk Oranı Karşılaştırması"
                            variant="compact"
                            showLabels={false}
                          />
                        </CardTitle>
                        <CardDescription>
                          Her metodoloji için doğruluk oranı (accuracy)
                          karşılaştırması
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div id="accuracy-comparison-chart">
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                              data={Object.entries(currentTest.methodComparison)
                                .filter(([method]) =>
                                  config.testMethods.includes(method)
                                )
                                .filter(
                                  ([, results]) => results.cosineSimilarity > 0
                                )
                                .map(([method, results]) => ({
                                  name:
                                    {
                                      eduBars: "AkıllıRehber",
                                      basicRag: "Basit RAG",
                                      llmOnly: "Sadece LLM",
                                    }[method] || method,
                                  accuracy: results.accuracy,
                                }))}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis
                                domain={[0, 100]}
                                tick={{ fontSize: 12 }}
                              />
                              <Tooltip formatter={tooltipFormatterPercent} />
                              <Legend />
                              <Bar
                                dataKey="accuracy"
                                fill="#f59e0b"
                                name="Doğruluk Oranı (%)"
                                radius={[2, 2, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Question-by-Question Performance Heatmap */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Soru Bazında Performans Analizi (Heatmap)
                        </div>
                        <ChartExportControls
                          chartId="question-performance-chart"
                          chartTitle="Soru Bazında Performans Analizi"
                          variant="compact"
                          showLabels={false}
                        />
                      </CardTitle>
                      <CardDescription>
                        Her soru için metodoloji bazında cosine similarity
                        değerlerinin görselleştirilmesi
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div id="question-performance-chart">
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart
                            data={
                              currentTest.questions &&
                              currentTest.questions.length > 0
                                ? currentTest.questions
                                    .filter((q) =>
                                      Object.values(q.methodologies).some(
                                        (m: any) => m.max_similarity > 0
                                      )
                                    )
                                    .map((q) => {
                                      const data: any = {
                                        question: `Soru ${q.question_id}`,
                                      };
                                      Object.entries(q.methodologies).forEach(
                                        ([method, results]: [string, any]) => {
                                          const methodName =
                                            {
                                              eduBars: "AkıllıRehber",
                                              basicRag: "Basit RAG",
                                              llmOnly: "Sadece LLM",
                                            }[method] || method;
                                          data[methodName] =
                                            results.max_similarity || 0;
                                        }
                                      );
                                      return data;
                                    })
                                : []
                            }
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 100,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="question"
                              angle={-45}
                              textAnchor="end"
                              height={100}
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                            <Tooltip formatter={tooltipFormatterCosine} />
                            <Legend />
                            {config.testMethods.map((method) => {
                              const methodName =
                                {
                                  eduBars: "AkıllıRehber",
                                  basicRag: "Basit RAG",
                                  llmOnly: "Sadece LLM",
                                }[method] || method;
                              const colors: Record<string, string> = {
                                AkıllıRehber: "#3b82f6",
                                "Basit RAG": "#10b981",
                                "Sadece LLM": "#f59e0b",
                              };
                              return (
                                <Bar
                                  key={method}
                                  dataKey={methodName}
                                  fill={colors[methodName] || "#6b7280"}
                                  name={methodName}
                                  radius={[2, 2, 0, 0]}
                                />
                              );
                            })}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comprehensive Performance Radar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Kapsamlı Performans Analizi (Radar Chart)
                      </CardTitle>
                      <CardDescription>
                        Tüm metriklerin bir arada görselleştirilmesi: Cosine
                        Similarity, Precision@5, Precision@10, Accuracy ve Hız
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={450}>
                        <RadarChart
                          data={[
                            "cosine",
                            "precision5",
                            "precision10",
                            "accuracy",
                            "speed",
                          ].map((metric) => ({
                            metric: {
                              cosine: "Cosine Similarity",
                              precision5: "Precision@5",
                              precision10: "Precision@10",
                              accuracy: "Accuracy",
                              speed: "Hız (Ters)",
                            }[metric],
                            ...Object.entries(currentTest.methodComparison)
                              .filter(([method]) =>
                                config.testMethods.includes(method)
                              )
                              .filter(
                                ([, results]) => results.cosineSimilarity > 0
                              )
                              .reduce((acc, [method, results]) => {
                                let value = 0;
                                if (metric === "cosine")
                                  value = results.cosineSimilarity * 100;
                                else if (metric === "precision5")
                                  value = results.precisionAt5;
                                else if (metric === "precision10")
                                  value = results.precisionAt10;
                                else if (metric === "accuracy")
                                  value = results.accuracy;
                                else if (metric === "speed")
                                  value = Math.max(
                                    0,
                                    100 - results.avgResponseTime / 20
                                  ); // Inverted and scaled

                                const methodName =
                                  {
                                    eduBars: "AkıllıRehber",
                                    basicRag: "BasitRAG",
                                    llmOnly: "SadeceLLM",
                                  }[method] || method;

                                acc[methodName] = value;
                                return acc;
                              }, {} as Record<string, number>),
                          }))}
                          margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
                        >
                          <PolarGrid />
                          <PolarAngleAxis
                            dataKey="metric"
                            tick={{ fontSize: 12 }}
                          />
                          <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{ fontSize: 10 }}
                            tickCount={6}
                          />
                          {config.testMethods
                            .filter((method) => {
                              const results =
                                currentTest.methodComparison[
                                  method as keyof typeof currentTest.methodComparison
                                ];
                              return results && results.cosineSimilarity > 0;
                            })
                            .map((method, index) => {
                              const methodName =
                                {
                                  eduBars: "AkıllıRehber",
                                  basicRag: "BasitRAG",
                                  llmOnly: "SadeceLLM",
                                }[method] || method;

                              const colors = [
                                "#3b82f6",
                                "#10b981",
                                "#f59e0b",
                                "#ef4444",
                              ];
                              return (
                                <Radar
                                  key={method}
                                  name={
                                    {
                                      AkıllıRehber: "AkıllıRehber",
                                      BasitRAG: "Basit RAG",
                                      SadeceLLM: "Sadece LLM",
                                    }[methodName] || methodName
                                  }
                                  dataKey={methodName}
                                  stroke={colors[index % colors.length]}
                                  fill={colors[index % colors.length]}
                                  fillOpacity={0.1}
                                  strokeWidth={2}
                                />
                              );
                            })}
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Cosine Similarity Distribution Histogram */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Cosine Similarity Değer Dağılımı
                        </div>
                        <ChartExportControls
                          chartId="similarity-distribution-chart"
                          chartTitle="Cosine Similarity Değer Dağılımı"
                          variant="compact"
                          showLabels={false}
                        />
                      </CardTitle>
                      <CardDescription>
                        Her metodoloji için cosine similarity değerlerinin
                        histogram dağılımı (soru bazında, max similarity bazlı)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div id="similarity-distribution-chart">
                        <ResponsiveContainer width="100%" height={350}>
                          <BarChart
                            data={(() => {
                              // Group questions by similarity ranges for each methodology
                              if (
                                !currentTest.questions ||
                                currentTest.questions.length === 0
                              ) {
                                return [];
                              }

                              const ranges = [
                                { min: 0, max: 0.2, label: "0.0-0.2" },
                                { min: 0.2, max: 0.4, label: "0.2-0.4" },
                                { min: 0.4, max: 0.6, label: "0.4-0.6" },
                                { min: 0.6, max: 0.8, label: "0.6-0.8" },
                                { min: 0.8, max: 1.0, label: "0.8-1.0" },
                              ];

                              return ranges.map((range) => {
                                const data: any = { range: range.label };
                                config.testMethods.forEach((method) => {
                                  const count = currentTest.questions!.filter(
                                    (q) => {
                                      const methodResult =
                                        q.methodologies[method];
                                      if (!methodResult) return false;
                                      const sim =
                                        methodResult.max_similarity || 0;
                                      return (
                                        sim >= range.min && sim < range.max
                                      );
                                    }
                                  ).length;
                                  const methodName =
                                    {
                                      eduBars: "AkıllıRehber",
                                      basicRag: "Basit RAG",
                                      llmOnly: "Sadece LLM",
                                    }[method] || method;
                                  data[methodName] = count;
                                });
                                return data;
                              });
                            })()}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                              formatter={(
                                value,
                                name,
                                props,
                                payload,
                                index
                              ) => [`${value || 0} soru`, name]}
                            />
                            <Legend />
                            {config.testMethods.map((method) => {
                              const methodName =
                                {
                                  eduBars: "AkıllıRehber",
                                  basicRag: "Basit RAG",
                                  llmOnly: "Sadece LLM",
                                }[method] || method;
                              const colors: Record<string, string> = {
                                AkıllıRehber: "#3b82f6",
                                "Basit RAG": "#10b981",
                                "Sadece LLM": "#f59e0b",
                              };
                              return (
                                <Bar
                                  key={method}
                                  dataKey={methodName}
                                  fill={colors[methodName] || "#6b7280"}
                                  name={methodName}
                                  radius={[2, 2, 0, 0]}
                                />
                              );
                            })}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Success Rate by Question */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Soru Bazında Başarı Oranı
                        </div>
                        <ChartExportControls
                          chartId="success-rate-chart"
                          chartTitle="Soru Bazında Başarı Oranı"
                          variant="compact"
                          showLabels={false}
                        />
                      </CardTitle>
                      <CardDescription>
                        Her soru için metodoloji bazında başarılı yanıt oranı
                        (cosine similarity {">"} 0.5 olan sorular, max
                        similarity bazlı)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div id="success-rate-chart">
                        <ResponsiveContainer width="100%" height={350}>
                          <LineChart
                            data={
                              currentTest.questions &&
                              currentTest.questions.length > 0
                                ? currentTest.questions
                                    .filter((q) =>
                                      Object.values(q.methodologies).some(
                                        (m: any) => m.max_similarity > 0
                                      )
                                    )
                                    .map((q) => {
                                      const data: any = {
                                        question: `S${q.question_id}`,
                                        questionId: q.question_id,
                                      };
                                      Object.entries(q.methodologies).forEach(
                                        ([method, results]: [string, any]) => {
                                          const methodName =
                                            {
                                              eduBars: "AkıllıRehber",
                                              basicRag: "Basit RAG",
                                              llmOnly: "Sadece LLM",
                                            }[method] || method;
                                          // Success = max similarity > 0.5
                                          data[methodName] =
                                            (results.max_similarity || 0) > 0.5
                                              ? 100
                                              : 0;
                                        }
                                      );
                                      return data;
                                    })
                                : []
                            }
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="question"
                              tick={{ fontSize: 10 }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                            <Tooltip
                              formatter={(
                                value,
                                name,
                                props,
                                payload,
                                index
                              ) => [
                                value === 100 ? "Başarılı" : "Başarısız",
                                name,
                              ]}
                            />
                            <Legend />
                            {config.testMethods.map((method) => {
                              const methodName =
                                {
                                  eduBars: "AkıllıRehber",
                                  basicRag: "Basit RAG",
                                  llmOnly: "Sadece LLM",
                                }[method] || method;
                              const colors: Record<string, string> = {
                                AkıllıRehber: "#3b82f6",
                                "Basit RAG": "#10b981",
                                "Sadece LLM": "#f59e0b",
                              };
                              return (
                                <Line
                                  key={method}
                                  type="monotone"
                                  dataKey={methodName}
                                  stroke={colors[methodName] || "#6b7280"}
                                  strokeWidth={2}
                                  name={methodName}
                                  dot={{ r: 4 }}
                                />
                              );
                            })}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detailed Question Results */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Detaylı Sorgu Sonuçları ve Metrikler
                      </CardTitle>
                      <CardDescription>
                        Her sorgu için metodoloji bazında detaylı sonuçlar, LLM
                        yanıtları ve kaynak doküman bilgileri
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {currentTest.questions.map((question) => (
                          <div
                            key={question.question_id}
                            className="border rounded-lg p-4 space-y-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">
                                    Soru #{question.question_id}
                                  </Badge>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-3">
                                  {question.question}
                                </h4>
                                {question.expected_answer && (
                                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="text-xs text-blue-700 font-medium mb-1">
                                      Beklenen Cevap (Ground Truth):
                                    </div>
                                    <div className="text-sm text-blue-900">
                                      {question.expected_answer}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {Object.entries(question.methodologies).map(
                                ([method, results]) => {
                                  const methodNames: Record<string, string> = {
                                    eduBars: "AkıllıRehber Tam Sistem",
                                    basicRag: "Basit RAG",
                                    llmOnly: "Sadece LLM",
                                  };

                                  return (
                                    <div
                                      key={method}
                                      className="border rounded-lg p-4 bg-gray-50"
                                    >
                                      <h5 className="font-medium text-sm mb-3 text-gray-700">
                                        {methodNames[method] || method}
                                      </h5>

                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Max Similarity:
                                          </span>
                                          <span
                                            className={`font-medium ${
                                              results.max_similarity >= 0.7
                                                ? "text-green-600"
                                                : results.max_similarity >= 0.5
                                                ? "text-yellow-600"
                                                : "text-red-600"
                                            }`}
                                          >
                                            {results.max_similarity.toFixed(3)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Cosine Similarity:
                                          </span>
                                          <span className="font-medium">
                                            {results.cosine_similarity?.toFixed(
                                              3
                                            ) || "N/A"}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Precision@5:
                                          </span>
                                          <span className="font-medium">
                                            {(
                                              results.precision_at_5 * 100
                                            ).toFixed(1)}
                                            %
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Retrieval Count:
                                          </span>
                                          <span className="font-medium">
                                            {results.retrieval_count}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Response Time:
                                          </span>
                                          <span className="font-medium">
                                            {Math.round(
                                              results.response_time_ms
                                            )}
                                            ms
                                          </span>
                                        </div>
                                        {(() => {
                                          // Use the new helper function to get similarity metrics
                                          const semantic =
                                            getQuestionSimilarityValue(
                                              results,
                                              "semanticSimilarity"
                                            );
                                          const bleu =
                                            getQuestionSimilarityValue(
                                              results,
                                              "bleuScore"
                                            );
                                          const rougeL =
                                            getQuestionSimilarityValue(
                                              results,
                                              "rougeL"
                                            );
                                          const rouge1 =
                                            getQuestionSimilarityValue(
                                              results,
                                              "rouge1"
                                            );
                                          const rouge2 =
                                            getQuestionSimilarityValue(
                                              results,
                                              "rouge2"
                                            );
                                          const f1 = getQuestionSimilarityValue(
                                            results,
                                            "f1Score"
                                          );
                                          const exactMatch =
                                            getQuestionSimilarityValue(
                                              results,
                                              "exactMatchRate"
                                            );

                                          // Check if any metrics are available
                                          const hasAnyMetric = [
                                            semantic,
                                            bleu,
                                            rougeL,
                                            rouge1,
                                            rouge2,
                                            f1,
                                            exactMatch,
                                          ].some((v) => v !== null);

                                          if (!hasAnyMetric) {
                                            // Show a message if no ground truth metrics are available
                                            return (
                                              <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                                                📝 Ground truth metrics require
                                                expected answers
                                              </div>
                                            );
                                          }

                                          const renderValue = (
                                            v: number | null
                                          ) =>
                                            v === null ? "N/A" : v.toFixed(3);

                                          const renderColoredValue = (
                                            v: number | null,
                                            label: string
                                          ) => (
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">
                                                {label}:
                                              </span>
                                              <span
                                                className={`font-medium ${
                                                  v !== null && v >= 0.7
                                                    ? "text-green-600"
                                                    : v !== null && v >= 0.5
                                                    ? "text-yellow-600"
                                                    : v !== null
                                                    ? "text-red-600"
                                                    : "text-gray-500"
                                                }`}
                                              >
                                                {renderValue(v)}
                                              </span>
                                            </div>
                                          );

                                          return (
                                            <div className="mt-2 space-y-1 text-sm border-t pt-2">
                                              <div className="text-xs font-medium text-gray-700 mb-1">
                                                🎯 Answer Quality Metrics:
                                              </div>
                                              {semantic !== null &&
                                                renderColoredValue(
                                                  semantic,
                                                  "Semantic"
                                                )}
                                              {bleu !== null &&
                                                renderColoredValue(
                                                  bleu,
                                                  "BLEU"
                                                )}
                                              {rougeL !== null &&
                                                renderColoredValue(
                                                  rougeL,
                                                  "ROUGE-L"
                                                )}
                                              {rouge1 !== null &&
                                                renderColoredValue(
                                                  rouge1,
                                                  "ROUGE-1"
                                                )}
                                              {rouge2 !== null &&
                                                renderColoredValue(
                                                  rouge2,
                                                  "ROUGE-2"
                                                )}
                                              {f1 !== null &&
                                                renderColoredValue(f1, "F1")}
                                              {exactMatch !== null &&
                                                renderColoredValue(
                                                  exactMatch,
                                                  "Exact Match"
                                                )}
                                            </div>
                                          );
                                        })()}
                                      </div>

                                      <div className="mt-4 pt-3 border-t">
                                        <div className="text-xs text-gray-500 mb-1">
                                          LLM Yanıtı:
                                        </div>
                                        <div className="text-sm text-gray-700 bg-white p-2 rounded border max-h-32 overflow-y-auto">
                                          {results.response ||
                                            "Yanıt alınamadı"}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
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
                      Detaylı Sonuçlar Henüz Hazır Değil
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Detaylı sorgu sonuçları yükleniyor...
                    </p>
                    {currentTest.detailedResultsUrl && (
                      <Button
                        onClick={() => {
                          window.open(currentTest.detailedResultsUrl, "_blank");
                        }}
                        variant="outline"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Detaylı Raporu Aç
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            ) : currentTest && currentTest.status === "running" ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Test Devam Ediyor
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Detaylı sonuçları görmek için testin tamamlanmasını
                    bekleyin.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Henüz Detaylı Sonuç Yok
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Detaylı sonuçları görmek için önce bir test başlatın ve
                    tamamlayın.
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
