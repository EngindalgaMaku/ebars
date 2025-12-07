"use client";

import React, { useState, useEffect } from "react";
import TeacherLayout from "../components/TeacherLayout";
import { listSessions, SessionMeta } from "@/lib/api";
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
import {
  Play,
  Square,
  RotateCcw,
  Brain,
  Users,
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
  Target,
  Zap,
  BarChart3,
  FileText,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/lib/toast";

// EBARS API İstemcisi - Öğretmen paneli uyumlu routing
const EBARS_API_BASE = "/api/aprag/ebars";

interface EBARSSimulationConfig {
  session_id: string;
  num_agents: number;
  num_turns: number;
  initial_difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  adaptive_threshold: number;
  feedback_mode: "AUTO" | "MANUAL";
  save_results: boolean;
}

interface Agent {
  id: string;
  name: string;
  current_level: string;
  score: number;
  comprehension_rate: number;
  response_time: number;
  interaction_count: number;
  emoji_feedback: string[];
  last_activity: string;
}

interface SimulationStatus {
  simulation_id: string; // Fixed: API returns simulation_id, not id
  status: "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED" | "completed" | "failed" | "stopped" | "running" | "paused";
  current_turn: number;
  total_turns: number;
  agents: Agent[];
  start_time: string;
  elapsed_time: number;
  completion_percentage: number;
  performance_metrics: {
    avg_comprehension: number;
    avg_response_time: number;
    difficulty_transitions: number;
    total_interactions: number;
  };
}

export default function EBARSSimulationPage() {
  const [mounted, setMounted] = useState(false);

  // Ana state'ler
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [currentSimulation, setCurrentSimulation] =
    useState<SimulationStatus | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Konfigürasyon state'leri
  const [config, setConfig] = useState<EBARSSimulationConfig>({
    session_id: "",
    num_agents: 3,
    num_turns: 10,  // Increased default turns for better results
    initial_difficulty: "INTERMEDIATE",
    adaptive_threshold: 0.7,
    feedback_mode: "AUTO",
    save_results: true,
  });

  // UI state'leri
  const [activeTab, setActiveTab] = useState("configuration");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Function definitions moved before useEffect to avoid temporal dead zone
  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      setError(null);
      const data = await listSessions();
      setSessions(data || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Oturumlar yüklenirken hata oluştu"
      );
    } finally {
      setLoadingSessions(false);
    }
  };

  const monitorSimulation = async (simulationId: string) => {
    // CRITICAL FIX: Validate simulationId to prevent "undefined" requests
    if (
      !simulationId ||
      simulationId === "undefined" ||
      simulationId === "null"
    ) {
      console.error(
        "❌ CRITICAL: Cannot monitor simulation with invalid ID:",
        simulationId
      );
      toast.error("Simülasyon ID'si geçersiz! Monitoring başlatılamadı.");
      setIsRunning(false);
      return;
    }

    console.log("🔍 Starting monitoring for simulation:", simulationId);

    const intervalId = setInterval(async () => {
      try {
        // Double-check simulationId before making request
        if (!simulationId || simulationId === "undefined") {
          console.error(
            "❌ CRITICAL: simulationId became undefined during monitoring!"
          );
          clearInterval(intervalId);
          setIsRunning(false);
          return;
        }

        const response = await fetch(
          `${EBARS_API_BASE}/simulation/status/${simulationId}`
        );

        if (response.ok) {
          const status = await response.json();
          console.log("📊 Simulation status update:", status);
          
          // Calculate completion percentage if not provided by backend
          if (status.completion_percentage === undefined || status.completion_percentage === null) {
            const currentTurn = status.current_turn || 0;
            const totalTurns = status.num_turns || status.total_turns || 1;
            if (status.status?.toLowerCase() === 'completed' || 
                status.status?.toLowerCase() === 'failed' || 
                status.status?.toLowerCase() === 'stopped') {
              status.completion_percentage = 100.0;
            } else if (currentTurn > 0 && totalTurns > 0) {
              status.completion_percentage = Math.min(100.0, (currentTurn / totalTurns) * 100.0);
            } else {
              status.completion_percentage = 0.0;
            }
          }
          
          // Ensure total_turns is set
          if (!status.total_turns && status.num_turns) {
            status.total_turns = status.num_turns;
          }
          
          setCurrentSimulation(status);

          const statusLower = status.status?.toLowerCase();
          if (statusLower === "completed" || statusLower === "failed" || statusLower === "stopped") {
            clearInterval(intervalId);
            setIsRunning(false);
            
            // Update currentSimulation state with latest status
            setCurrentSimulation(prev => prev ? {
              ...prev,
              status: status.status,
              current_turn: status.current_turn,
              total_turns: status.total_turns || status.num_turns,
              completion_percentage: 100.0  // Always 100% when finished
            } : null);
            
            if (statusLower === "completed") {
              toast.success("Simülasyon tamamlandı!");
            } else if (statusLower === "failed") {
              toast.error("Simülasyon başarısız oldu");
            } else {
              toast.warning("Simülasyon durduruldu");
            }
          }
        } else {
          const errorText = await response.text();
          console.error(
            "❌ Monitoring request failed:",
            response.status,
            response.statusText,
            errorText
          );
          // Don't stop monitoring on single error, just log it
        }
      } catch (error) {
        console.error("Error monitoring simulation:", error);
        // Don't stop monitoring on network errors, just log them
      }
    }, 2000);

    // Store interval ID to allow manual cleanup
    (window as any).__ebars_monitoring_interval = intervalId;

    // Don't auto-stop monitoring - let it run until simulation completes
    // User can manually stop via stop button
  };

  const startSimulation = async () => {
    if (!config.session_id) {
      toast.error("Lütfen bir oturum seçin");
      return;
    }

    try {
      setIsRunning(true);
      setError(null);

      console.log("🚀 [FRONTEND] Starting simulation with config:", config);
      console.log("🚀 [FRONTEND] API endpoint:", `${EBARS_API_BASE}/simulation/start`);

      const response = await fetch(`${EBARS_API_BASE}/simulation/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      console.log("🚀 [FRONTEND] Response status:", response.status);
      console.log("🚀 [FRONTEND] Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [FRONTEND] Response not OK:", response.status, errorText);
        throw new Error(`Simülasyon başlatılamadı: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ [FRONTEND] Response data:", data);

      // CRITICAL FIX: Check if simulation_id exists to prevent "undefined" requests
      if (!data.simulation_id) {
        console.error("❌ [FRONTEND] API Response missing simulation_id:", data);
        throw new Error(
          "API yanıtında simulation_id bulunamadı. Backend loglarını kontrol edin."
        );
      }

      console.log("✅ [FRONTEND] Simulation started successfully:", data.simulation_id);
      setCurrentSimulation(data);
      
      // Store simulation_id in localStorage for results tab
      if (typeof window !== 'undefined') {
        localStorage.setItem('last_simulation_id', data.simulation_id);
      }
      
      setActiveTab("monitoring");
      toast.success("Simülasyon başlatıldı!");

      // Status monitoring başlat with validation
      console.log("✅ [FRONTEND] Starting monitoring for simulation:", data.simulation_id);
      monitorSimulation(data.simulation_id);
    } catch (error) {
      console.error("❌ [FRONTEND] Error starting simulation:", error);
      setError(
        error instanceof Error ? error.message : "Simülasyon başlatılamadı"
      );
      toast.error("Simülasyon başlatılamadı");
      setIsRunning(false);
    }
  };

  const stopSimulation = async () => {
    if (!currentSimulation?.simulation_id) return;

    try {
      const response = await fetch(`${EBARS_API_BASE}/simulation/stop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          simulation_id: currentSimulation.simulation_id,
        }),
      });

      if (response.ok) {
        setIsRunning(false);
        setCurrentSimulation(null);
        toast.success("Simülasyon durduruldu");
      }
    } catch (error) {
      console.error("Error stopping simulation:", error);
      toast.error("Simülasyon durdurulamadı");
    }
  };

  const resetSimulation = () => {
    setCurrentSimulation(null);
    setIsRunning(false);
    setError(null);
    setActiveTab("configuration");
  };

  useEffect(() => {
    setMounted(true);
    loadSessions();
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

  const selectedSession = sessions.find(
    (s) => s.session_id === config.session_id
  );

  return (
    <TeacherLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Brain className="h-8 w-8 text-white" />
              </div>
              EBARS Simülasyon
            </h1>
            <p className="text-gray-600 mt-1">
              Emoji Tabanlı Adaptif Yanıt Sistemi - Eğitim Simülasyonu
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadSessions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
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
              {/* Temel Ayarlar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Temel Simülasyon Ayarları
                  </CardTitle>
                  <CardDescription>
                    Simülasyon parametrelerini yapılandırın
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Session Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="session">Oturum Seçimi</Label>
                    <select
                      value={config.session_id}
                      onChange={(e) =>
                        setConfig({ ...config, session_id: e.target.value })
                      }
                      className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">
                        {loadingSessions
                          ? "Oturumlar yükleniyor..."
                          : "Oturum seçin"}
                      </option>
                      {sessions.map((session) => (
                        <option
                          key={session.session_id}
                          value={session.session_id}
                        >
                          {session.name} (ID: {session.session_id})
                          {session.total_chunks &&
                            ` • ${session.total_chunks} chunk`}
                        </option>
                      ))}
                    </select>
                    {selectedSession && (
                      <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded-lg">
                        <strong>Seçili:</strong> {selectedSession.name}
                        <br />
                        <strong>Durum:</strong> {selectedSession.status}
                        <br />
                        <strong>Oluşturulma:</strong>{" "}
                        {new Date(selectedSession.created_at).toLocaleString(
                          "tr-TR"
                        )}
                      </div>
                    )}
                  </div>

                  {/* Agent Count */}
                  <div className="space-y-2">
                    <Label htmlFor="agents">Agent Sayısı</Label>
                    <Input
                      id="agents"
                      type="number"
                      min="1"
                      max="10"
                      value={config.num_agents}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          num_agents: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                    <p className="text-sm text-gray-500">
                      Simülasyonda katılacak sanal öğrenci sayısı (1-10)
                    </p>
                  </div>

                  {/* Turn Count */}
                  <div className="space-y-2">
                    <Label htmlFor="turns">Tur Sayısı</Label>
                    <Input
                      id="turns"
                      type="number"
                      min="1"
                      max="20"
                      value={config.num_turns}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          num_turns: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                    <p className="text-sm text-gray-500">
                      Her agent için soru-cevap tur sayısı (1-20)
                    </p>
                  </div>

                  {/* Initial Difficulty */}
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">
                      Başlangıç Zorluk Seviyesi
                    </Label>
                    <select
                      value={config.initial_difficulty}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          initial_difficulty: e.target.value as any,
                        })
                      }
                      className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="BEGINNER">
                        🟢 Başlangıç - Kolay sorular
                      </option>
                      <option value="INTERMEDIATE">
                        🟡 Orta - Orta zorluk
                      </option>
                      <option value="ADVANCED">🔴 İleri - Zor sorular</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Gelişmiş Ayarlar */}
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
                    Adaptasyon ve geri bildirim parametreleri
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showAdvanced && (
                    <>
                      {/* Adaptive Threshold */}
                      <div className="space-y-2">
                        <Label htmlFor="threshold">
                          Adaptasyon Eşiği ({config.adaptive_threshold})
                        </Label>
                        <input
                          id="threshold"
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.1"
                          value={config.adaptive_threshold}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              adaptive_threshold: parseFloat(e.target.value),
                            })
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-sm text-gray-500">
                          Zorluk seviyesi değişimi için başarı oranı eşiği
                        </p>
                      </div>

                      {/* Feedback Mode */}
                      <div className="space-y-2">
                        <Label htmlFor="feedback">Geri Bildirim Modu</Label>
                        <select
                          value={config.feedback_mode}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              feedback_mode: e.target.value as any,
                            })
                          }
                          className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="AUTO">Otomatik</option>
                          <option value="MANUAL">Manuel</option>
                        </select>
                      </div>

                      {/* Save Results */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Sonuçları Kaydet</Label>
                          <p className="text-sm text-gray-500">
                            Simülasyon sonuçlarını veritabanına kaydet
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.save_results}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              save_results: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600"
                        />
                      </div>
                    </>
                  )}

                  {/* Start Button */}
                  <div className="pt-4 border-t">
                    <Button
                      onClick={startSimulation}
                      disabled={isRunning || !config.session_id}
                      className="w-full"
                      size="lg"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Simülasyon Başlatılıyor...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-5 w-5" />
                          Simülasyonu Başlat
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
            {currentSimulation ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Overview */}
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Simülasyon Durumu
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {currentSimulation.status === "RUNNING" && (
                          <Badge className="bg-green-500 animate-pulse">
                            Çalışıyor
                          </Badge>
                        )}
                        {currentSimulation.status === "COMPLETED" && (
                          <Badge className="bg-blue-500">Tamamlandı</Badge>
                        )}
                        {currentSimulation.status === "FAILED" && (
                          <Badge className="bg-red-500">Başarısız</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {currentSimulation.current_turn}
                        </div>
                        <div className="text-sm text-gray-500">Mevcut Tur</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {currentSimulation.total_turns}
                        </div>
                        <div className="text-sm text-gray-500">Toplam Tur</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {currentSimulation.agents?.length || 0}
                        </div>
                        <div className="text-sm text-gray-500">Aktif Agent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {currentSimulation.status?.toLowerCase() === 'completed' 
                            ? 100 
                            : Math.round(currentSimulation.completion_percentage || 0)}
                          %
                        </div>
                        <div className="text-sm text-gray-500">
                          {currentSimulation.status?.toLowerCase() === 'completed' 
                            ? 'Tamamlandı' 
                            : currentSimulation.status?.toLowerCase() === 'failed'
                            ? 'Başarısız'
                            : currentSimulation.status?.toLowerCase() === 'stopped'
                            ? 'Durduruldu'
                            : 'Tamamlanma'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>İlerleme</span>
                        <span>
                          {Math.round(
                            currentSimulation.completion_percentage || 0
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={currentSimulation.completion_percentage || 0}
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      {isRunning && (
                        <Button
                          onClick={stopSimulation}
                          variant="destructive"
                          size="sm"
                        >
                          <Square className="mr-2 h-4 w-4" />
                          Durdur
                        </Button>
                      )}
                      <Button
                        onClick={resetSimulation}
                        variant="outline"
                        size="sm"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Sıfırla
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Agents Performance */}
                {currentSimulation.agents &&
                  currentSimulation.agents.length > 0 && (
                    <Card className="lg:col-span-3">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Agent Performansı
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {currentSimulation.agents.map((agent) => (
                            <div
                              key={agent.id}
                              className="p-4 border rounded-lg space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{agent.name}</h4>
                                <Badge variant="outline">
                                  {agent.current_level}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Skor:</span>
                                  <span className="font-medium">
                                    {agent.score}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Anlama Oranı:</span>
                                  <span className="font-medium">
                                    {Math.round(agent.comprehension_rate * 100)}
                                    %
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Yanıt Süresi:</span>
                                  <span className="font-medium">
                                    {agent.response_time}s
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Etkileşim:</span>
                                  <span className="font-medium">
                                    {agent.interaction_count}
                                  </span>
                                </div>
                              </div>
                              {agent.emoji_feedback &&
                                agent.emoji_feedback.length > 0 && (
                                  <div className="flex gap-1 mt-2">
                                    {agent.emoji_feedback
                                      .slice(-3)
                                      .map((emoji, idx) => (
                                        <span key={idx} className="text-lg">
                                          {emoji}
                                        </span>
                                      ))}
                                  </div>
                                )}
                            </div>
                          ))}
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
                    Henüz Aktif Simülasyon Yok
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Monitoring verilerini görmek için önce bir simülasyon
                    başlatın.
                  </p>
                  <Button
                    onClick={() => setActiveTab("configuration")}
                    variant="outline"
                  >
                    Simülasyon Başlat
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {(() => {
              // Try to get simulation_id from multiple sources
              const simulationIdFromState = currentSimulation?.simulation_id;
              const simulationIdFromStorage = typeof window !== 'undefined' 
                ? localStorage.getItem('last_simulation_id') 
                : null;
              const simulationId = simulationIdFromState || simulationIdFromStorage;
              
              const status = currentSimulation?.status?.toLowerCase() || "";
              const isCompleted = status === "completed";
              const isFailed = status === "failed";
              const isStopped = status === "stopped";
              
              console.log("🔍 [RESULTS TAB] Status check:", {
                currentSimulation,
                status: currentSimulation?.status,
                statusLower: status,
                isCompleted,
                isFailed,
                isStopped,
                simulationIdFromState,
                simulationIdFromStorage,
                simulationId,
                hasCurrentSimulation: !!currentSimulation
              });
              
              // If we have a simulation_id, try to load results
              // Results endpoint will handle the case if simulation is not completed
              if (simulationId) {
                console.log("✅ [RESULTS TAB] Loading results for simulation:", simulationId);
                return <SimulationResultsView simulationId={simulationId} />;
              }
              
              return (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {currentSimulation?.status?.toLowerCase() === "running"
                        ? "Simülasyon Devam Ediyor"
                        : "Henüz Sonuç Yok"}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {currentSimulation?.status?.toLowerCase() === "running"
                        ? "Sonuçları görmek için simülasyonun tamamlanmasını bekleyin."
                        : `Sonuçları görmek için önce bir simülasyon başlatın ve tamamlayın. (Mevcut durum: ${currentSimulation?.status || "bilinmiyor"})`}
                    </p>
                    {currentSimulation?.simulation_id && (
                      <p className="text-xs text-gray-400 mt-2">
                        Simulation ID: {currentSimulation.simulation_id}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </TeacherLayout>
  );
}

// Simulation Results Component
function SimulationResultsView({ simulationId }: { simulationId: string }) {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadResults();
  }, [simulationId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${EBARS_API_BASE}/simulation/results/${simulationId}`
      );
      if (!response.ok) {
        throw new Error(`Failed to load results: ${response.status}`);
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error("Error loading results:", err);
      setError(
        err instanceof Error ? err.message : "Sonuçlar yüklenemedi"
      );
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!results || !results.turns) return;

    setExporting(true);
    try {
      // CSV Header
      const headers = [
        "Turn",
        "Agent",
        "Agent Type",
        "Question",
        "Answer",
        "Answer Length",
        "Emoji",
        "Score",
        "Score Change",
        "Difficulty Level",
        "Level Transition",
        "Processing Time (ms)",
        "Feedback Sent",
        "Timestamp",
      ];

      // CSV Rows
      const rows = results.turns.map((turn: any) => [
        turn.turn_number || "",
        turn.agent_name || turn.agent_id || "",
        turn.agent_type || "",
        turn.question || "",
        turn.answer || "", // Cevabın kendisi
        turn.answer_length || 0,
        turn.emoji_feedback || "",
        turn.comprehension_score?.toFixed(2) || "0.00",
        turn.score_delta?.toFixed(2) || "0.00",
        turn.difficulty_level || "",
        turn.level_transition || "",
        turn.processing_time_ms || 0,
        turn.feedback_sent ? "Yes" : "No",
        turn.timestamp || "",
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(","),
        ...rows.map((row: any[]) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `ebars_simulation_${simulationId.substring(0, 8)}_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV dosyası indirildi!");
    } catch (err) {
      console.error("Error exporting CSV:", err);
      toast.error("CSV export başarısız oldu");
    } finally {
      setExporting(false);
    }
  };

  const exportToJSON = () => {
    if (!results) return;

    setExporting(true);
    try {
      const jsonContent = JSON.stringify(results, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `ebars_simulation_${simulationId.substring(0, 8)}_${new Date().toISOString().split("T")[0]}.json`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("JSON dosyası indirildi!");
    } catch (err) {
      console.error("Error exporting JSON:", err);
      toast.error("JSON export başarısız oldu");
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async () => {
    if (!results || !results.turns) return;

    setExporting(true);
    try {
      // Dynamic import for xlsx library
      const XLSX = await import("xlsx");

      // Prepare data for Excel
      const worksheetData = [
        // Header row
        [
          "Tur",
          "Agent",
          "Agent Tipi",
          "Soru",
          "Cevap",
          "Cevap Uzunluğu",
          "Emoji",
          "Skor",
          "Skor Değişimi",
          "Zorluk Seviyesi",
          "Seviye Geçişi",
          "İşlem Süresi (ms)",
          "Geri Bildirim Gönderildi",
          "Zaman Damgası",
        ],
        // Data rows
        ...results.turns.map((turn: any) => [
          turn.turn_number || "",
          turn.agent_name || turn.agent_id || "",
          turn.agent_type || "",
          turn.question || "",
          turn.answer || "", // Cevabın kendisi
          turn.answer_length || 0,
          turn.emoji_feedback || "",
          turn.comprehension_score?.toFixed(2) || "0.00",
          turn.score_delta?.toFixed(2) || "0.00",
          turn.difficulty_level || "",
          turn.level_transition || "",
          turn.processing_time_ms || 0,
          turn.feedback_sent ? "Evet" : "Hayır",
          turn.timestamp ? new Date(turn.timestamp).toLocaleString("tr-TR") : "",
        ]),
      ];

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      worksheet["!cols"] = [
        { wch: 6 },  // Turn
        { wch: 15 }, // Agent
        { wch: 12 }, // Agent Type
        { wch: 50 }, // Question
        { wch: 80 }, // Answer (cevabın kendisi - daha geniş)
        { wch: 12 }, // Answer Length
        { wch: 8 },  // Emoji
        { wch: 8 },  // Score
        { wch: 12 }, // Score Change
        { wch: 15 }, // Difficulty Level
        { wch: 15 }, // Level Transition
        { wch: 15 }, // Processing Time
        { wch: 18 }, // Feedback Sent
        { wch: 20 }, // Timestamp
      ];

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Simülasyon Sonuçları");

      // Add summary sheet if available
      if (results.simulation_info && results.agents) {
        const summaryData = [
          ["Simülasyon Özeti", ""],
          ["Simülasyon ID", simulationId],
          ["Durum", results.simulation_info.status || ""],
          ["Toplam Tur", results.simulation_info.total_turns || 0],
          ["Agent Sayısı", results.simulation_info.num_agents || 0],
          ["Süre (saniye)", results.simulation_info.duration_seconds?.toFixed(2) || "N/A"],
          ["Başlangıç", results.simulation_info.started_at ? new Date(results.simulation_info.started_at).toLocaleString("tr-TR") : "N/A"],
          ["Bitiş", results.simulation_info.completed_at ? new Date(results.simulation_info.completed_at).toLocaleString("tr-TR") : "N/A"],
          ["", ""],
          ["Agent Performansı", ""],
          ["Agent", "Agent Tipi", "Başlangıç Skoru", "Bitiş Skoru"],
          ...results.agents.map((agent: any) => [
            agent.agent_name || agent.agent_id || "",
            agent.agent_type || "",
            agent.initial_score?.toFixed(2) || "0.00",
            agent.final_score?.toFixed(2) || "0.00",
          ]),
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        summarySheet["!cols"] = [
          { wch: 20 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
        ];
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Özet");
      }

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });

      // Create blob and download
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `ebars_simulation_${simulationId.substring(0, 8)}_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Excel dosyası indirildi!");
    } catch (err) {
      console.error("Error exporting Excel:", err);
      toast.error("Excel export başarısız oldu");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Sonuçlar yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Hata</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={loadResults} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tekrar Dene
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!results || !results.success) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sonuç Bulunamadı
          </h3>
          <p className="text-gray-500">
            Bu simülasyon için sonuç bulunamadı.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { simulation_info, agents, turns } = results;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Simülasyon Özeti
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={exportToExcel}
                disabled={exporting}
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Excel İndir
              </Button>
              <Button
                onClick={exportToCSV}
                disabled={exporting}
                variant="outline"
                size="sm"
              >
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                CSV İndir
              </Button>
              <Button
                onClick={exportToJSON}
                disabled={exporting}
                variant="outline"
                size="sm"
              >
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                JSON İndir
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Durum</div>
              <div className="text-lg font-semibold">
                {simulation_info.status === "completed" ? "✅ Tamamlandı" : simulation_info.status}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Toplam Tur</div>
              <div className="text-lg font-semibold">
                {simulation_info.total_turns}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Agent Sayısı</div>
              <div className="text-lg font-semibold">
                {simulation_info.num_agents}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Süre</div>
              <div className="text-lg font-semibold">
                {simulation_info.duration_seconds
                  ? `${Math.round(simulation_info.duration_seconds)}s`
                  : "N/A"}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-500">
              <strong>Başlangıç:</strong>{" "}
              {simulation_info.started_at
                ? new Date(simulation_info.started_at).toLocaleString("tr-TR")
                : "N/A"}
            </div>
            <div className="text-sm text-gray-500">
              <strong>Bitiş:</strong>{" "}
              {simulation_info.completed_at
                ? new Date(simulation_info.completed_at).toLocaleString("tr-TR")
                : "N/A"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Performance */}
      {agents && agents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Agent Performans Analizi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Agent</th>
                    <th className="text-left p-2">Tip</th>
                    <th className="text-center p-2">Başlangıç Skoru</th>
                    <th className="text-center p-2">Bitiş Skoru</th>
                    <th className="text-center p-2">Değişim</th>
                    <th className="text-center p-2">Seviye Değişimi</th>
                    <th className="text-center p-2">Toplam Tur</th>
                    <th className="text-center p-2">Ort. Süre (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{agent.agent_name}</td>
                      <td className="p-2 text-sm text-gray-600">
                        {agent.agent_type}
                      </td>
                      <td className="p-2 text-center">
                        {agent.initial_score?.toFixed(2) || "0.00"}
                      </td>
                      <td className="p-2 text-center">
                        {agent.final_score?.toFixed(2) || "0.00"}
                      </td>
                      <td className={`p-2 text-center ${
                        (agent.score_change || 0) > 0
                          ? "text-green-600"
                          : (agent.score_change || 0) < 0
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}>
                        {(agent.score_change || 0) > 0 ? "+" : ""}
                        {agent.score_change?.toFixed(2) || "0.00"}
                      </td>
                      <td className="p-2 text-center">
                        {agent.level_changes || 0}
                      </td>
                      <td className="p-2 text-center">
                        {agent.total_turns || 0}
                      </td>
                      <td className="p-2 text-center">
                        {Math.round(agent.avg_processing_time || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Turns */}
      {turns && turns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detaylı Turn Verileri ({turns.length} kayıt)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b">
                    <th className="text-left p-2">Turn</th>
                    <th className="text-left p-2">Agent</th>
                    <th className="text-left p-2">Soru</th>
                    <th className="text-center p-2">Cevap</th>
                    <th className="text-center p-2">Cevap Uzunluğu</th>
                    <th className="text-center p-2">Emoji</th>
                    <th className="text-center p-2">Skor</th>
                    <th className="text-center p-2">Seviye</th>
                    <th className="text-center p-2">Süre (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {turns.map((turn: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-2">{turn.turn_number || ""}</td>
                      <td className="p-2">{turn.agent_name || turn.agent_id || ""}</td>
                      <td className="p-2 max-w-xs truncate" title={turn.question}>
                        {(turn.question || "").substring(0, 50)}...
                      </td>
                      <td className="p-2 max-w-md truncate" title={turn.answer}>
                        {(turn.answer || "").substring(0, 100)}
                        {turn.answer && turn.answer.length > 100 ? "..." : ""}
                      </td>
                      <td className="p-2 text-center">{turn.answer_length || 0}</td>
                      <td className="p-2 text-center text-lg">
                        {turn.emoji_feedback || ""}
                      </td>
                      <td className="p-2 text-center">
                        {turn.comprehension_score?.toFixed(2) || "0.00"}
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant="outline">
                          {turn.difficulty_level || ""}
                        </Badge>
                      </td>
                      <td className="p-2 text-center">
                        {turn.processing_time_ms || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
