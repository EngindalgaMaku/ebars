"use client";

import React, { useState, useEffect } from "react";
import TeacherLayout from "../components/TeacherLayout";
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
  id: string;
  status: "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED";
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

interface SessionInfo {
  id: string;
  name: string;
  created_at: string;
  status: string;
  chunk_count?: number;
}

export default function EBARSSimulationPage() {
  const [mounted, setMounted] = useState(false);

  // Ana state'ler
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [currentSimulation, setCurrentSimulation] =
    useState<SimulationStatus | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Konfigürasyon state'leri
  const [config, setConfig] = useState<EBARSSimulationConfig>({
    session_id: "",
    num_agents: 3,
    num_turns: 5,
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
      const response = await fetch("/api/sessions");
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      } else {
        throw new Error("Oturumlar yüklenemedi");
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      setError("Oturumlar yüklenirken hata oluştu");
    } finally {
      setLoadingSessions(false);
    }
  };

  const monitorSimulation = async (simulationId: string) => {
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(
          `${EBARS_API_BASE}/simulation/status/${simulationId}`
        );
        if (response.ok) {
          const status = await response.json();
          setCurrentSimulation(status);

          if (status.status === "COMPLETED" || status.status === "FAILED") {
            clearInterval(intervalId);
            setIsRunning(false);
            if (status.status === "COMPLETED") {
              toast.success("Simülasyon tamamlandı!");
            } else {
              toast.error("Simülasyon başarısız oldu");
            }
          }
        }
      } catch (error) {
        console.error("Error monitoring simulation:", error);
      }
    }, 2000);

    // 30 saniye sonra monitoring'i durdur
    setTimeout(() => {
      clearInterval(intervalId);
      if (isRunning) {
        setIsRunning(false);
      }
    }, 30000);
  };

  const startSimulation = async () => {
    if (!config.session_id) {
      toast.error("Lütfen bir oturum seçin");
      return;
    }

    try {
      setIsRunning(true);
      setError(null);

      const response = await fetch(`${EBARS_API_BASE}/simulation/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Simülasyon başlatılamadı: ${response.status}`);
      }

      const data = await response.json();
      setCurrentSimulation(data);
      setActiveTab("monitoring");
      toast.success("Simülasyon başlatıldı!");

      // Status monitoring başlat
      monitorSimulation(data.id);
    } catch (error) {
      console.error("Error starting simulation:", error);
      setError(
        error instanceof Error ? error.message : "Simülasyon başlatılamadı"
      );
      toast.error("Simülasyon başlatılamadı");
      setIsRunning(false);
    }
  };

  const stopSimulation = async () => {
    if (!currentSimulation?.id) return;

    try {
      const response = await fetch(`${EBARS_API_BASE}/simulation/stop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ simulation_id: currentSimulation.id }),
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

  const selectedSession = sessions.find((s) => s.id === config.session_id);

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
                        <option key={session.id} value={session.id}>
                          {session.name} (ID: {session.id})
                          {session.chunk_count &&
                            ` • ${session.chunk_count} chunk`}
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
                          {Math.round(
                            currentSimulation.completion_percentage || 0
                          )}
                          %
                        </div>
                        <div className="text-sm text-gray-500">Tamamlanma</div>
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
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sonuçlar Yakında Gelecek
                </h3>
                <p className="text-gray-500 mb-4">
                  Detaylı analiz ve raporlama özellikleri geliştiriliyor.
                </p>
                <Button variant="outline" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Rapor İndir
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TeacherLayout>
  );
}
