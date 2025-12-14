"use client";

import React, { useState, useEffect } from "react";
import TeacherLayout from "../components/TeacherLayout";
import { getSession, SessionMeta } from "@/lib/api";
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

// Test Configuration Interface
interface TestConfig {
  testName: string;
  numQuestions: number;
  testMethods: string[];
  includeManualQuestions: boolean;
  customQuestions: string[];
  enableBenchmark: boolean;
  exportFormat: string[];
}

// Test Results Interface
interface TestResult {
  testId: string;
  testName: string;
  status: "running" | "completed" | "failed" | "stopped";
  progress: number;
  startTime: string;
  endTime?: string;
  metrics: {
    cosineSimilarity: number;
    precisionAt5: number;
    precisionAt10: number;
    avgResponseTime: number;
    totalQuestions: number;
    correctAnswers: number;
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
}

interface MethodResults {
  cosineSimilarity: number;
  precisionAt5: number;
  precisionAt10: number;
  avgResponseTime: number;
  accuracy: number;
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

  useEffect(() => {
    setMounted(true);
    fetchAvailableSessions();
  }, []);

  // Fetch available sessions for selection
  const fetchAvailableSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await fetch("/api/sessions");
      if (!response.ok) {
        throw new Error("Sessions yüklenemedi");
      }
      const data = await response.json();
      setAvailableSessions(data.sessions || []);

      // Auto-select first session if available
      if (data.sessions && data.sessions.length > 0) {
        setSelectedSessionId(data.sessions[0].session_id);
        await fetchSessionDetails(data.sessions[0].session_id);
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

        // Update current test with API data
        setCurrentTest((prevTest) => {
          if (!prevTest) return null;

          return {
            ...prevTest,
            progress: status.progress,
            status: status.status,
            endTime: status.endTime,
            metrics: status.metrics || prevTest.metrics,
            methodComparison:
              status.methodComparison || prevTest.methodComparison,
            benchmarkComparison:
              status.benchmarkComparison || prevTest.benchmarkComparison,
          };
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
          ["Metric", "EduBars", "Basic RAG", "LLM Only", "Benchmark"],
          [
            "Cosine Similarity",
            currentTest.methodComparison.eduBars.cosineSimilarity.toFixed(3),
            currentTest.methodComparison.basicRag.cosineSimilarity.toFixed(3),
            currentTest.methodComparison.llmOnly.cosineSimilarity.toFixed(3),
            currentTest.benchmarkComparison.ekoBot.cosineSimilarity.toFixed(3),
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
              RAG Sistemi Performans Analizi ve Karşılaştırma Testleri
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
          <TabsList className="grid w-full grid-cols-3">
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
                            "EduBars Tam Sistem (APRAG Kişiselleştirme KAPALI)",
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
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionText">Test Soruları</Label>
                    <Textarea
                      id="questionText"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Test sorularını buraya kopyalayın (her satırda bir soru)&#10;&#10;Örnek:&#10;Osmanlı İmparatorluğu hangi yüzyılda kuruldu?&#10;Fatih Sultan Mehmet hangi şehri fethetti?&#10;Tanzimat Fermanı ne zaman ilan edildi?&#10;Kurtuluş Savaşı hangi yıllarda yapıldı?"
                      className="min-h-[200px] resize-y"
                      rows={12}
                    />
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {config.customQuestions.length} soru tespit edildi
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
                      <div className="flex gap-2">
                        <Button
                          onClick={() => exportResults("json")}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          JSON İndir
                        </Button>
                        <Button
                          onClick={() => exportResults("csv")}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          CSV İndir
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Test Süresi</div>
                        <div className="text-lg font-semibold">
                          {currentTest.endTime
                            ? Math.round(
                                (new Date(currentTest.endTime).getTime() -
                                  new Date(currentTest.startTime).getTime()) /
                                  1000
                              )
                            : 0}
                          s
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
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(currentTest.methodComparison).map(
                            ([method, results]) => {
                              const methodNames: Record<string, string> = {
                                eduBars: "EduBars Tam Sistem",
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
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Performans Karşılaştırması
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={Object.entries(currentTest.methodComparison)
                            .filter(([method]) =>
                              config.testMethods.includes(method)
                            )
                            .map(([method, results]) => ({
                              name:
                                {
                                  eduBars: "EduBars",
                                  singleModel: "Tek Model",
                                  twoStageRetrieval: "İki Aşama",
                                  singleStageRetrieval: "Tek Aşama",
                                }[method] || method,
                              cosine: results.cosineSimilarity,
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
                          <Tooltip
                            formatter={(value: number, name: string) => [
                              name === "cosine"
                                ? value.toFixed(3)
                                : name === "precision5"
                                ? `${value.toFixed(1)}%`
                                : `${value.toFixed(1)}%`,
                              name === "cosine"
                                ? "Cosine Similarity"
                                : name === "precision5"
                                ? "Precision@5"
                                : "Accuracy",
                            ]}
                          />
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
                    </CardContent>
                  </Card>

                  {/* Response Time Comparison */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Yanıt Süreleri
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={Object.entries(currentTest.methodComparison)
                            .filter(([method]) =>
                              config.testMethods.includes(method)
                            )
                            .map(([method, results]) => ({
                              name:
                                {
                                  eduBars: "EduBars",
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
                          <Tooltip
                            formatter={(value: number) => [
                              `${Math.round(value)}ms`,
                              "Yanıt Süresi",
                            ]}
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
                    </CardContent>
                  </Card>
                </div>

                {/* Radar Chart for Overall Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Genel Performans Analizi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                                  eduBars: "EduBars",
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
                              eduBars: "EduBars",
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
                                  EduBars: "EduBars",
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
                  </CardContent>
                </Card>

                {/* Benchmark Comparison */}
                {config.enableBenchmark && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Benchmark Karşılaştırması
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
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
        </Tabs>
      </div>
    </TeacherLayout>
  );
}
