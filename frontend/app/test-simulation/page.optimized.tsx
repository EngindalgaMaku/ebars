"use client";

import React, { useState, useEffect, useCallback } from "react";
import TeacherLayout from "../components/TeacherLayout";
import { getSession, SessionMeta, listSessions } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Brain,
  Settings,
  Activity,
  BarChart3,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/lib/toast";

// Import our new components
import ConfigurationTab from "./components/tabs/ConfigurationTab";
import MonitoringTab from "./components/tabs/MonitoringTab";
import ResultsTab from "./components/tabs/ResultsTab";

// Types (simplified for this main component)
interface TestConfig {
  testName: string;
  numQuestions: number;
  testMethods: string[];
  includeManualQuestions: boolean;
  customQuestions: string[];
  customExpectedAnswers: Record<number, string>;
  enableBenchmark: boolean;
  exportFormat: string[];
}

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
    similarity?: any;
    answerQualitySimilarity?: number | null;
    answerQualityAvailable?: number;
  };
  methodComparison: {
    eduBars: any;
    basicRag: any;
    llmOnly: any;
  };
  benchmarkComparison: {
    ekoBot: any;
    current: any;
  };
  questions?: any[];
  detailedResultsUrl?: string;
  detailedResultsAvailable?: boolean;
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

  useEffect(() => {
    setMounted(true);
    fetchAvailableSessions();
  }, []);

  // Auto-import questions when text changes (debounced approach)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (questionText.trim()) {
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
              const answer = parts.slice(1).join("|").trim();
              if (question && answer) {
                questions.push(question);
                expectedAnswers[index] = answer;
              }
            }
          } else {
            questions.push(line);
          }
        });

        setConfig((prev) => ({
          ...prev,
          customQuestions: questions,
          customExpectedAnswers: expectedAnswers,
          numQuestions: Math.min(questions.length, 100),
        }));
      } else {
        setConfig((prev) => ({
          ...prev,
          customQuestions: [],
          customExpectedAnswers: {},
          numQuestions: 0,
        }));
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [questionText]);

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

      // Prepare expected answers map for backend
      const expectedAnswers: Record<number, string> = {};
      testQuestions.forEach((question, index) => {
        const originalIndex = config.customQuestions.findIndex(
          (q) => q === question
        );
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

  // Poll test status from API (with proper cleanup)
  const pollTestStatus = useCallback((testId: string) => {
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

    // Return cleanup function
    return () => clearInterval(interval);
  }, []);

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
          <TabsContent value="configuration">
            <ConfigurationTab
              config={config}
              setConfig={setConfig}
              availableSessions={availableSessions}
              selectedSessionId={selectedSessionId}
              selectedSession={selectedSession}
              loadingSessions={loadingSessions}
              questionText={questionText}
              setQuestionText={setQuestionText}
              showAdvanced={true}
              setShowAdvanced={() => {}} // Simplified for now
              isRunning={isRunning}
              onSessionChange={handleSessionChange}
              onStartTest={startTest}
            />
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring">
            <MonitoringTab
              currentTest={currentTest}
              config={config}
              isRunning={isRunning}
              onStopTest={stopTest}
              onResetTest={resetTest}
              onSetActiveTab={setActiveTab}
            />
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <ResultsTab
              currentTest={currentTest}
              config={config}
              onSetActiveTab={setActiveTab}
            />
          </TabsContent>

          {/* Detailed Results Tab */}
          <TabsContent value="detailed">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Detaylı Rapor
              </h3>
              <p className="text-gray-500">
                Detaylı rapor özelliği yakında eklenecek.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TeacherLayout>
  );
}
