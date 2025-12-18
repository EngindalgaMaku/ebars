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
  Loader2,
  CheckCircle,
  XCircle,
  BarChart3,
  Target,
  FileText,
  AlertTriangle,
  RefreshCw,
  Clock,
  TrendingUp,
  Activity,
  List,
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
} from "recharts";

// RAGAS Test Configuration Interface
interface RAGASTestConfig {
  testName: string;
  numQuestions: number;
  includeManualQuestions: boolean;
  customQuestions: string[];
  customExpectedAnswers: Record<number, string>;
  useProductionData: boolean;
  maxQuestions?: number;
}

// RAGAS Test Result Interface
interface RAGASTestResult {
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
  aggregate_metrics?: {
    average_faithfulness: number;
    average_answer_relevancy: number;
    average_context_precision?: number;
    average_context_recall?: number;
    average_overall_score: number;
  };
  results?: Array<{
    question_id: number;
    question: string;
    answer: string;
    contexts: string[];
    ground_truth?: string;
    ragas_metrics: {
      faithfulness: number;
      answer_relevancy: number;
      context_precision?: number;
      context_recall?: number;
      overall_score: number;
    };
    response_time_ms: number;
    retrieval_count: number;
    success: boolean;
    error?: string;
  }>;
  total_questions?: number;
  successful_questions?: number;
  failed_questions?: number;
}

export default function RAGMetricsTestPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("configuration");

  // Session State
  const [availableSessions, setAvailableSessions] = useState<SessionMeta[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<SessionMeta | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Test Configuration State
  const [config, setConfig] = useState<RAGASTestConfig>({
    testName: "",
    numQuestions: 30,
    includeManualQuestions: true,
    customQuestions: [],
    customExpectedAnswers: {},
    useProductionData: false,
    maxQuestions: 100,
  });

  // Test Execution State
  const [currentTest, setCurrentTest] = useState<RAGASTestResult | null>(null);
  const [testList, setTestList] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  // UI State
  const [questionText, setQuestionText] = useState("");

  useEffect(() => {
    setMounted(true);
    fetchAvailableSessions();
    loadTestList();
  }, []);

  // Fetch available sessions
  const fetchAvailableSessions = async () => {
    try {
      setLoadingSessions(true);
      const data = await listSessions();
      setAvailableSessions(data || []);

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
    }
  };

  // Handle session selection change
  const handleSessionChange = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    await fetchSessionDetails(sessionId);
  };

  // Import questions from text (supports "Question|Answer" format)
  const importQuestionsFromText = () => {
    if (!questionText.trim()) {
      toast.error("Lütfen soru girin");
      return;
    }

    const lines = questionText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 100);

    const questions: string[] = [];
    const expectedAnswers: Record<number, string> = {};

    lines.forEach((line, index) => {
      if (line.includes("|")) {
        // Parse "Question|Answer" format
        const parts = line.split("|");
        if (parts.length >= 2) {
          const question = parts[0].trim();
          const answer = parts.slice(1).join("|").trim(); // Handle multiple | in answer
          if (question && answer) {
            questions.push(question);
            expectedAnswers[index] = answer;
          }
        }
      } else {
        // Just a question without expected answer
        questions.push(line);
      }
    });

    setConfig({
      ...config,
      customQuestions: questions,
      customExpectedAnswers: expectedAnswers,
      numQuestions: Math.min(questions.length, 100),
    });
    
    const answerCount = Object.keys(expectedAnswers).length;
    if (answerCount > 0) {
      toast.success(`${questions.length} soru eklendi (${answerCount} tanesi ground truth ile)`);
    } else {
      toast.success(`${questions.length} soru eklendi`);
    }
  };

  // Load test list
  const loadTestList = async () => {
    setIsLoadingTests(true);
    try {
      const response = await fetch("/api/rag-metrics/list");
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
    } finally {
      setIsLoadingTests(false);
    }
  };

  // Load specific test details
  const loadTestDetails = async (testId: string) => {
    try {
      const response = await fetch(`/api/rag-metrics/status/${testId}`);
      if (!response.ok) {
        console.error("Failed to load test details");
        return;
      }
      const status = await response.json();

      const testResult: RAGASTestResult = {
        testId: status.testId || testId,
        testName: status.testName || `Test ${testId.substring(0, 8)}`,
        status: status.status || "completed",
        progress: status.progress || 100,
        startTime: status.startTime || "",
        endTime: status.endTime,
        executionTime: status.executionTime,
        aggregate_metrics: status.aggregate_metrics,
        results: status.results || [],
        total_questions: status.total_questions,
        successful_questions: status.successful_questions,
        failed_questions: status.failed_questions,
      };

      setCurrentTest(testResult);
      setSelectedTestId(testId);
      setActiveTab("results");
    } catch (error) {
      console.error("Error loading test details:", error);
    }
  };

  // Start RAGAS batch evaluation
  const startTest = async () => {
    if (!config.testName.trim()) {
      toast.error("Lütfen test adı girin");
      return;
    }

    if (!selectedSessionId) {
      toast.error("Lütfen bir session seçin");
      return;
    }

    try {
      setIsRunning(true);
      setError(null);

      const testQuestions = config.customQuestions.slice(0, config.numQuestions);
      if (testQuestions.length === 0) {
        toast.error("Lütfen test sorularını girin");
        return;
      }

      // Prepare expected answers map (use final test question indices)
      const expectedAnswers: Record<number, string> = {};
      testQuestions.forEach((question, index) => {
        // Find the original index in customQuestions to get the expected answer
        const originalIndex = config.customQuestions.findIndex((q) => q === question);
        if (originalIndex !== -1 && config.customExpectedAnswers[originalIndex]) {
          expectedAnswers[index] = config.customExpectedAnswers[originalIndex];
        }
      });

      // Debug log to verify expected answers mapping
      if (Object.keys(expectedAnswers).length > 0) {
        console.log("✅ Expected answers mapping:", expectedAnswers);
        console.log(
          "💡 Questions with ground truth:",
          Object.keys(expectedAnswers).length
        );
      } else {
        console.log("⚠️ No expected answers found for any test questions");
      }

      const response = await fetch("/api/rag-metrics/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testName: config.testName,
          questions: testQuestions,
          sessionId: selectedSessionId,
          sessionSettings: selectedSession?.rag_settings || null,
          expectedAnswers: Object.keys(expectedAnswers).length > 0 ? expectedAnswers : undefined,
          useProductionData: config.useProductionData,
          maxQuestions: config.maxQuestions,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Test başlatılamadı" }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      const initialResult: RAGASTestResult = {
        testId: result.testId,
        testName: config.testName,
        status: "running",
        progress: 0,
        startTime: new Date().toISOString(),
        total_questions: testQuestions.length,
      };

      setCurrentTest(initialResult);
      setActiveTab("monitoring");
      toast.success("RAGAS test başlatıldı!");

      // Start polling for test progress
      pollTestStatus(result.testId);
      setTimeout(() => loadTestList(), 1000);
    } catch (error: any) {
      console.error("Test başlatma hatası:", error);
      setError(error.message || "Test başlatılamadı");
      toast.error("Test başlatılamadı");
      setIsRunning(false);
    }
  };

  // Poll test status
  const pollTestStatus = (testId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/rag-metrics/status/${testId}`);
        if (!response.ok) {
          console.error("Failed to fetch test status");
          return;
        }

        const status = await response.json();

        const updatedTest: RAGASTestResult = {
          testId: status.testId || testId,
          testName: status.testName || config.testName,
          status: status.status || "running",
          progress: status.progress || 0,
          startTime: status.startTime || new Date().toISOString(),
          endTime: status.endTime,
          executionTime: status.executionTime,
          aggregate_metrics: status.aggregate_metrics,
          results: status.results || [],
          total_questions: status.total_questions,
          successful_questions: status.successful_questions,
          failed_questions: status.failed_questions,
        };

        setCurrentTest(updatedTest);

        // Stop polling if test is completed or failed
        if (status.status === "completed" || status.status === "failed") {
          clearInterval(interval);
          setIsRunning(false);
          if (status.status === "completed") {
            toast.success("Test tamamlandı!");
            setActiveTab("results");
          }
        }
      } catch (error) {
        console.error("Error polling test status:", error);
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  };

  // Stop test
  const stopTest = async () => {
    if (!currentTest) return;

    try {
      // Note: RAGAS doesn't have a stop endpoint yet, but we can mark it as stopped
      setCurrentTest({
        ...currentTest,
        status: "stopped",
      });
      setIsRunning(false);
      toast.info("Test durduruldu");
    } catch (error) {
      console.error("Error stopping test:", error);
    }
  };

  const getScoreColor = (score: number | undefined | null) => {
    if (score === undefined || score === null || isNaN(score)) return "text-muted-foreground";
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (score: number | undefined | null) => {
    if (score === undefined || score === null || isNaN(score)) return "bg-gray-100 text-gray-800";
    if (score >= 0.8) return "bg-green-100 text-green-800";
    if (score >= 0.6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (!mounted) {
    return null;
  }

  return (
    <TeacherLayout activeTab="rag-metrics-test">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">RAG Metrikleri Testi (RAGAS)</h1>
            <p className="text-muted-foreground mt-2">
              RAG sisteminizin performansını RAGAS metrikleri ile batch evaluation yapın
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
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
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="configuration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Session Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Session Seçimi</CardTitle>
                  <CardDescription>Test için kullanılacak session'ı seçin</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="session">Session *</Label>
                    <select
                      id="session"
                      value={selectedSessionId}
                      onChange={(e) => handleSessionChange(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      disabled={loadingSessions || isRunning}
                    >
                      <option value="">Session seçin...</option>
                      {availableSessions.map((session) => (
                        <option key={session.session_id} value={session.session_id}>
                          {session.name || session.session_id}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedSession && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-semibold">Session Bilgileri</p>
                      <p className="text-xs text-muted-foreground">
                        Doküman: {selectedSession.document_count || 0} | Chunk: {selectedSession.total_chunks || 0}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Test Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Test Konfigürasyonu</CardTitle>
                  <CardDescription>Test parametrelerini ayarlayın</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="testName">Test Adı *</Label>
                    <Input
                      id="testName"
                      value={config.testName}
                      onChange={(e) => setConfig({ ...config, testName: e.target.value })}
                      placeholder="Örn: RAGAS Test 1"
                      disabled={isRunning}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numQuestions">Soru Sayısı</Label>
                    <Input
                      id="numQuestions"
                      type="number"
                      min="1"
                      max="100"
                      value={config.numQuestions}
                      onChange={(e) => setConfig({ ...config, numQuestions: parseInt(e.target.value) || 30 })}
                      disabled={isRunning}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useProductionData"
                      checked={config.useProductionData}
                      onChange={(e) => setConfig({ ...config, useProductionData: e.target.checked })}
                      disabled={isRunning}
                    />
                    <Label htmlFor="useProductionData" className="text-sm">
                      Production verilerini kullan (session'dan gerçek sorgular)
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Questions Input */}
            <Card>
              <CardHeader>
                <CardTitle>Sorular</CardTitle>
                <CardDescription>
                  Test için soruları girin (her satıra bir soru). 
                  Ground truth (beklenen cevap) eklemek için: <strong>Soru|Cevap</strong> formatını kullanın.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Toplu Soru Girişi</Label>
                  <Textarea
                    placeholder="Her satıra bir soru yazın...&#10;Örnek:&#10;Anadolu'ya ilk Türk akınlarını başlatan topluluk kimdir?|İskitler&#10;Malazgirt Savaşı hangi yılda yapıldı?|1071"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={10}
                    disabled={isRunning || config.useProductionData}
                  />
                  <Button
                    onClick={importQuestionsFromText}
                    variant="outline"
                    disabled={isRunning || config.useProductionData}
                  >
                    Soruları İçe Aktar
                  </Button>
                </div>

                {config.customQuestions.length > 0 && (
                  <div className="space-y-2">
                    <Label>
                      Yüklenen Sorular ({config.customQuestions.length})
                      {Object.keys(config.customExpectedAnswers).length > 0 && (
                        <span className="text-green-600 ml-2">
                          ({Object.keys(config.customExpectedAnswers).length} tanesi ground truth ile)
                        </span>
                      )}
                    </Label>
                    <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-1">
                      {config.customQuestions.slice(0, config.numQuestions).map((q, idx) => {
                        const hasGroundTruth = config.customExpectedAnswers[idx] !== undefined;
                        return (
                          <div key={idx} className={`text-sm p-2 rounded ${hasGroundTruth ? 'bg-green-50 border border-green-200' : 'bg-muted'}`}>
                            <div className="flex items-start justify-between">
                              <span>
                                {idx + 1}. {q}
                              </span>
                              {hasGroundTruth && (
                                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-300">
                                  ✓ GT
                                </Badge>
                              )}
                            </div>
                            {hasGroundTruth && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Beklenen: {config.customExpectedAnswers[idx]}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={startTest}
                    disabled={isRunning || !selectedSessionId || config.customQuestions.length === 0}
                    className="flex-1"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Test Çalışıyor...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Test Başlat
                      </>
                    )}
                  </Button>
                  {isRunning && (
                    <Button onClick={stopTest} variant="destructive">
                      <Square className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            {!currentTest ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Henüz test başlatılmadı</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Test Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Test İlerlemesi</span>
                      <Badge
                        variant={
                          currentTest.status === "completed"
                            ? "default"
                            : currentTest.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {currentTest.status === "running" && "Çalışıyor"}
                        {currentTest.status === "completed" && "Tamamlandı"}
                        {currentTest.status === "failed" && "Başarısız"}
                        {currentTest.status === "stopped" && "Durduruldu"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>İlerleme</span>
                        <span>{currentTest.progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={currentTest.progress} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Toplam Soru</p>
                        <p className="text-2xl font-bold">{currentTest.total_questions || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Başarılı</p>
                        <p className="text-2xl font-bold text-green-600">
                          {currentTest.successful_questions || 0}
                        </p>
                      </div>
                    </div>

                    {currentTest.executionTime && (
                      <div className="text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 inline mr-2" />
                        {currentTest.executionTime.formatted ||
                          `${currentTest.executionTime.elapsed_minutes?.toFixed(1) || 0} dakika`}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Aggregate Metrics */}
                {currentTest.aggregate_metrics && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Ortalama Metrikler</CardTitle>
                      <CardDescription>
                        RAGAS değerlendirme metrikleri (4 metrik)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 border rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Faithfulness</p>
                          <p className={`text-2xl font-bold ${getScoreColor(currentTest.aggregate_metrics.average_faithfulness)}`}>
                            {isNaN(currentTest.aggregate_metrics.average_faithfulness) 
                              ? "N/A" 
                              : (currentTest.aggregate_metrics.average_faithfulness * 100).toFixed(1) + "%"}
                          </p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Answer Relevancy</p>
                          <p className={`text-2xl font-bold ${getScoreColor(currentTest.aggregate_metrics.average_answer_relevancy)}`}>
                            {isNaN(currentTest.aggregate_metrics.average_answer_relevancy) 
                              ? "N/A" 
                              : (currentTest.aggregate_metrics.average_answer_relevancy * 100).toFixed(1) + "%"}
                          </p>
                        </div>
                        {currentTest.aggregate_metrics.average_context_precision !== undefined ? (
                          <div className="p-3 border rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Context Precision</p>
                            <p className={`text-2xl font-bold ${getScoreColor(currentTest.aggregate_metrics.average_context_precision)}`}>
                              {isNaN(currentTest.aggregate_metrics.average_context_precision) 
                                ? "N/A" 
                                : (currentTest.aggregate_metrics.average_context_precision * 100).toFixed(1) + "%"}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 border rounded-lg border-dashed opacity-50">
                            <p className="text-sm text-muted-foreground mb-1">Context Precision</p>
                            <p className="text-2xl font-bold text-muted-foreground">N/A</p>
                            <p className="text-xs text-muted-foreground mt-1">Ground truth gerekli</p>
                          </div>
                        )}
                        {currentTest.aggregate_metrics.average_context_recall !== undefined ? (
                          <div className="p-3 border rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Context Recall</p>
                            <p className={`text-2xl font-bold ${getScoreColor(currentTest.aggregate_metrics.average_context_recall)}`}>
                              {isNaN(currentTest.aggregate_metrics.average_context_recall) 
                                ? "N/A" 
                                : (currentTest.aggregate_metrics.average_context_recall * 100).toFixed(1) + "%"}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 border rounded-lg border-dashed opacity-50">
                            <p className="text-sm text-muted-foreground mb-1">Context Recall</p>
                            <p className="text-2xl font-bold text-muted-foreground">N/A</p>
                            <p className="text-xs text-muted-foreground mt-1">Ground truth gerekli</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 p-3 border rounded-lg bg-muted">
                        <p className="text-sm text-muted-foreground mb-1">Genel Skor (Ortalama)</p>
                        <p className={`text-3xl font-bold ${getScoreColor(currentTest.aggregate_metrics.average_overall_score)}`}>
                          {isNaN(currentTest.aggregate_metrics.average_overall_score) 
                            ? "N/A" 
                            : (currentTest.aggregate_metrics.average_overall_score * 100).toFixed(1) + "%"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {!currentTest ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sonuçlar görüntülenecek</p>
                  <p className="text-sm mt-2">
                    Önceki testleri görmek için test listesinden seçin
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Test Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Test Özeti</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Test Adı</p>
                        <p className="font-semibold">{currentTest.testName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Durum</p>
                        <Badge
                          variant={
                            currentTest.status === "completed"
                              ? "default"
                              : currentTest.status === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {currentTest.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Başarılı Sorular</p>
                        <p className="font-semibold text-green-600">
                          {currentTest.successful_questions || 0} / {currentTest.total_questions || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Genel Skor</p>
                        <p className={`font-semibold text-2xl ${getScoreColor(currentTest.aggregate_metrics?.average_overall_score || 0)}`}>
                          {currentTest.aggregate_metrics
                            ? (currentTest.aggregate_metrics.average_overall_score * 100).toFixed(1)
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Aggregate Metrics Chart */}
                {currentTest.aggregate_metrics && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Ortalama Metrikler Grafiği</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[
                            {
                              metric: "Faithfulness",
                              score: currentTest.aggregate_metrics.average_faithfulness,
                            },
                            {
                              metric: "Answer Relevancy",
                              score: currentTest.aggregate_metrics.average_answer_relevancy,
                            },
                            ...(currentTest.aggregate_metrics.average_context_precision !== undefined
                              ? [
                                  {
                                    metric: "Context Precision",
                                    score: currentTest.aggregate_metrics.average_context_precision,
                                  },
                                ]
                              : []),
                            ...(currentTest.aggregate_metrics.average_context_recall !== undefined
                              ? [
                                  {
                                    metric: "Context Recall",
                                    score: currentTest.aggregate_metrics.average_context_recall,
                                  },
                                ]
                              : []),
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="metric" />
                          <YAxis domain={[0, 1]} tickFormatter={(value) => (value * 100).toFixed(0) + "%"} />
                          <Tooltip
                            formatter={(value: number | undefined) => [
                              value !== undefined ? (value * 100).toFixed(2) + "%" : "N/A",
                              "Score",
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="score" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Detailed Results */}
                {currentTest.results && currentTest.results.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Detaylı Sonuçlar</CardTitle>
                      <CardDescription>
                        Her soru için RAGAS metrikleri
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {currentTest.results.map((result, idx) => (
                          <Card key={idx} className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="font-semibold">
                                  {result.question_id}. {result.question}
                                </p>
                                {result.success ? (
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Faithfulness</p>
                                      <Badge className={getScoreBadgeColor(result.ragas_metrics.faithfulness)}>
                                        {(result.ragas_metrics.faithfulness * 100).toFixed(1)}%
                                      </Badge>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Answer Relevancy</p>
                                      <Badge className={getScoreBadgeColor(result.ragas_metrics.answer_relevancy)}>
                                        {(result.ragas_metrics.answer_relevancy * 100).toFixed(1)}%
                                      </Badge>
                                    </div>
                                    {result.ragas_metrics.context_precision !== undefined && (
                                      <div>
                                        <p className="text-xs text-muted-foreground">Context Precision</p>
                                        <Badge className={getScoreBadgeColor(result.ragas_metrics.context_precision)}>
                                          {(result.ragas_metrics.context_precision * 100).toFixed(1)}%
                                        </Badge>
                                      </div>
                                    )}
                                    {result.ragas_metrics.context_recall !== undefined && (
                                      <div>
                                        <p className="text-xs text-muted-foreground">Context Recall</p>
                                        <Badge className={getScoreBadgeColor(result.ragas_metrics.context_recall)}>
                                          {(result.ragas_metrics.context_recall * 100).toFixed(1)}%
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <Alert variant="destructive" className="mt-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>{result.error || "Değerlendirme başarısız"}</AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Test List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Önceki Testler</span>
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
                        className="p-3 border rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => loadTestDetails(test.testId)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{test.testName}</p>
                            <p className="text-sm text-muted-foreground">
                              {test.totalQuestions} soru | {test.progress}% tamamlandı
                            </p>
                          </div>
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TeacherLayout>
  );
}
