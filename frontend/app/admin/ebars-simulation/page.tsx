"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ModernAdminLayout from "../components/ModernAdminLayout";
import SimulationResultsAnalysis from "./components/SimulationResultsAnalysis";
import {
  ebarsSimulationApiClient,
  SimulationConfig,
  SimulationStatus,
  SimulationResult,
  SessionInfo,
} from "@/lib/ebars-simulation-api";

export default function EBARSSimulationPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"start" | "running" | "results">(
    "start"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session data
  const [sessions, setSessions] = useState<SessionInfo[]>([]);

  // Start simulation state
  const [simulationConfig, setSimulationConfig] = useState<SimulationConfig>({
    simulation_name: "",
    session_id: "",
    agent_count: 10,
    turn_count: 5,
    difficulty_levels: ["easy", "medium", "hard"],
    subject_areas: ["general"],
    interaction_delay_ms: 1000,
    enable_adaptation: true,
    enable_analytics: true,
  });

  // Running simulations state
  const [runningSimulations, setRunningSimulations] = useState<
    SimulationStatus[]
  >([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  // Results state
  const [simulationResults, setSimulationResults] = useState<
    SimulationResult[]
  >([]);
  const [selectedResult, setSelectedResult] = useState<SimulationResult | null>(
    null
  );

  // Load initial data
  useEffect(() => {
    loadSessions();
    if (activeTab === "running") {
      loadRunningSimulations();
      startAutoRefresh();
    } else if (activeTab === "results") {
      loadSimulationResults();
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [activeTab]);

  // Auto-refresh for running simulations
  const startAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    const interval = setInterval(() => {
      loadRunningSimulations();
    }, 3000); // Refresh every 3 seconds
    setRefreshInterval(interval);
  };

  const loadSessions = async () => {
    try {
      const data = await ebarsSimulationApiClient.getAvailableSessions();
      setSessions(data);
      if (data.length > 0 && !simulationConfig.session_id) {
        setSimulationConfig((prev) => ({
          ...prev,
          session_id: data[0].session_id,
        }));
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
      setError(
        `Oturumlar yüklenemedi: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`
      );
    }
  };

  const loadRunningSimulations = async () => {
    try {
      const data = await ebarsSimulationApiClient.getRunningSimulations();
      setRunningSimulations(data);
      setError(null);
    } catch (error) {
      console.error("Failed to load running simulations:", error);
      // Don't show error for running simulations - might be expected if none are running
    }
  };

  const loadSimulationResults = async () => {
    try {
      setLoading(true);
      const data = await ebarsSimulationApiClient.getAllSimulationResults();
      setSimulationResults(data);
      setError(null);
    } catch (error) {
      console.error("Failed to load simulation results:", error);
      setError(
        `Sonuçlar yüklenemedi: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulation = async () => {
    if (!simulationConfig.simulation_name.trim()) {
      setError("Simülasyon adı gereklidir");
      return;
    }
    if (!simulationConfig.session_id) {
      setError("Oturum seçimi gereklidir");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await ebarsSimulationApiClient.startSimulation(
        simulationConfig
      );

      // Switch to running tab to see the new simulation
      setActiveTab("running");
      loadRunningSimulations();

      // Reset form
      setSimulationConfig((prev) => ({
        ...prev,
        simulation_name: "",
      }));
    } catch (error) {
      console.error("Failed to start simulation:", error);
      setError(
        `Simülasyon başlatılamadı: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePauseSimulation = async (simulationId: string) => {
    try {
      await ebarsSimulationApiClient.pauseSimulation(simulationId);
      loadRunningSimulations();
    } catch (error) {
      console.error("Failed to pause simulation:", error);
      setError(
        `Simülasyon duraklatılamadı: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`
      );
    }
  };

  const handleResumeSimulation = async (simulationId: string) => {
    try {
      await ebarsSimulationApiClient.resumeSimulation(simulationId);
      loadRunningSimulations();
    } catch (error) {
      console.error("Failed to resume simulation:", error);
      setError(
        `Simülasyon devam ettirilemedi: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`
      );
    }
  };

  const handleStopSimulation = async (simulationId: string) => {
    if (!confirm("Bu simülasyonu durdurmak istediğinizden emin misiniz?"))
      return;

    try {
      await ebarsSimulationApiClient.stopSimulation(simulationId);
      loadRunningSimulations();
      // Also refresh results in case the stopped simulation completed
      if (activeTab === "results") {
        loadSimulationResults();
      }
    } catch (error) {
      console.error("Failed to stop simulation:", error);
      setError(
        `Simülasyon durdurulamadı: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`
      );
    }
  };

  const handleDeleteSimulation = async (simulationId: string) => {
    if (!confirm("Bu simülasyon sonucunu silmek istediğinizden emin misiniz?"))
      return;

    try {
      await ebarsSimulationApiClient.deleteSimulation(simulationId);
      loadSimulationResults();
    } catch (error) {
      console.error("Failed to delete simulation:", error);
      setError(
        `Simülasyon silinemedi: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`
      );
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}s ${minutes}d ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}d ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <ModernAdminLayout
      title="EBARS Simülasyon Yönetimi"
      description="Eğitsel Bilişsel Adaptif RAG Sisteminin performansını simüle edin ve analiz edin"
    >
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex rounded-md bg-red-50 dark:bg-red-900/20 p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("start")}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            activeTab === "start"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          🚀 Simülasyon Başlat
        </button>
        <button
          onClick={() => setActiveTab("running")}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            activeTab === "running"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          ⏳ Çalışan Simülasyonlar ({runningSimulations.length})
        </button>
        <button
          onClick={() => setActiveTab("results")}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            activeTab === "results"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          📊 Sonuçlar ({simulationResults.length})
        </button>
      </div>

      {/* Start Simulation Tab */}
      {activeTab === "start" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Yeni EBARS Simülasyonu Başlat
          </h2>

          <div className="space-y-6">
            {/* Simulation Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Simülasyon Adı *
              </label>
              <input
                type="text"
                value={simulationConfig.simulation_name}
                onChange={(e) =>
                  setSimulationConfig((prev) => ({
                    ...prev,
                    simulation_name: e.target.value,
                  }))
                }
                placeholder="Örn: 9. Sınıf Coğrafya Adaptif Öğrenme Testi"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Session Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ders Oturumu *
              </label>
              <select
                value={simulationConfig.session_id}
                onChange={(e) =>
                  setSimulationConfig((prev) => ({
                    ...prev,
                    session_id: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                required
              >
                {sessions.length === 0 && (
                  <option value="">Yükleniyor...</option>
                )}
                {sessions.map((session) => (
                  <option key={session.session_id} value={session.session_id}>
                    {session.name} ({session.category}) -{" "}
                    {session.document_count} doküman, {session.chunk_count}{" "}
                    chunk
                  </option>
                ))}
              </select>
            </div>

            {/* Configuration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Agent Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sanal Öğrenci Sayısı: {simulationConfig.agent_count}
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={simulationConfig.agent_count}
                  onChange={(e) =>
                    setSimulationConfig((prev) => ({
                      ...prev,
                      agent_count: parseInt(e.target.value),
                    }))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>5</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              {/* Turn Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tur Sayısı: {simulationConfig.turn_count}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={simulationConfig.turn_count}
                  onChange={(e) =>
                    setSimulationConfig((prev) => ({
                      ...prev,
                      turn_count: parseInt(e.target.value),
                    }))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>1</span>
                  <span>10</span>
                  <span>20</span>
                </div>
              </div>

              {/* Interaction Delay */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Etkileşim Gecikmesi (ms):{" "}
                  {simulationConfig.interaction_delay_ms}
                </label>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={simulationConfig.interaction_delay_ms || 1000}
                  onChange={(e) =>
                    setSimulationConfig((prev) => ({
                      ...prev,
                      interaction_delay_ms: parseInt(e.target.value),
                    }))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>100ms</span>
                  <span>2.5s</span>
                  <span>5s</span>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulationConfig.enable_adaptation}
                  onChange={(e) =>
                    setSimulationConfig((prev) => ({
                      ...prev,
                      enable_adaptation: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Adaptif Öğrenme Etkin (zorluk seviyesi otomatik ayarlanacak)
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulationConfig.enable_analytics}
                  onChange={(e) =>
                    setSimulationConfig((prev) => ({
                      ...prev,
                      enable_analytics: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Detaylı Analitik Toplama (performans metrikleri kaydedilecek)
                </span>
              </label>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartSimulation}
              disabled={
                loading ||
                !simulationConfig.simulation_name.trim() ||
                !simulationConfig.session_id
              }
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-semibold disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? "🔄 Simülasyon Başlatılıyor..."
                : "🚀 Simülasyonu Başlat"}
            </button>
          </div>
        </div>
      )}

      {/* Running Simulations Tab */}
      {activeTab === "running" && (
        <div className="space-y-6">
          {runningSimulations.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">⏸️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Çalışan Simülasyon Yok
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Şu anda çalışan herhangi bir simülasyon bulunmuyor. "Simülasyon
                Başlat" sekmesinden yeni bir simülasyon başlatabilirsiniz.
              </p>
            </div>
          ) : (
            runningSimulations.map((sim) => (
              <div
                key={sim.simulation_id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {sim.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {sim.simulation_id}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        sim.status === "running"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : sim.status === "paused"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : sim.status === "preparing"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {sim.status === "running"
                        ? "🏃 Çalışıyor"
                        : sim.status === "paused"
                        ? "⏸️ Duraklatıldı"
                        : sim.status === "preparing"
                        ? "⚙️ Hazırlanıyor"
                        : "❌ Hatalı"}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>İlerleme: {sim.progress_percentage.toFixed(1)}%</span>
                    <span>
                      {sim.current_turn}/{sim.total_turns} tur
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${sim.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                      {sim.active_agents}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Aktif Öğrenci
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {sim.completed_interactions}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Tamamlanan
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                      {sim.total_interactions}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Toplam Etkileşim
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                      {sim.current_phase}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Mevcut Faz
                    </div>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex space-x-2">
                  {sim.status === "running" && (
                    <button
                      onClick={() => handlePauseSimulation(sim.simulation_id)}
                      className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      ⏸️ Duraklat
                    </button>
                  )}
                  {sim.status === "paused" && (
                    <button
                      onClick={() => handleResumeSimulation(sim.simulation_id)}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      ▶️ Devam Et
                    </button>
                  )}
                  <button
                    onClick={() => handleStopSimulation(sim.simulation_id)}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    🛑 Durdur
                  </button>
                </div>

                {/* Error Message */}
                {sim.error_message && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <strong>Hata:</strong> {sim.error_message}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === "results" && (
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Sonuçlar yükleniyor...
              </p>
            </div>
          ) : simulationResults.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Henüz Sonuç Yok
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tamamlanan simülasyon bulunmuyor. İlk simülasyonunuzu
                başlattıktan sonra sonuçlar burada görünecek.
              </p>
            </div>
          ) : (
            simulationResults.map((result) => (
              <div
                key={result.simulation_id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {result.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(result.start_time).toLocaleString("tr-TR")} -
                      Süre: {formatDuration(result.duration_seconds)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        result.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      }`}
                    >
                      {result.status === "completed"
                        ? "✅ Tamamlandı"
                        : result.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                      {result.agent_count}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Öğrenci
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {result.total_interactions}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Etkileşim
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                      {result.metrics.avg_accuracy_score.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Ort. Başarı
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {result.metrics.avg_response_time_ms.toFixed(0)}ms
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Ort. Süre
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                      {result.total_turns}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Tur
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedResult(result)}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    📊 Detaylı Analiz
                  </button>
                  <button
                    onClick={() => handleDeleteSimulation(result.simulation_id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    🗑️ Sil
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detailed Results Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedResult.name} - Detaylı Analiz
                </h2>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Detailed metrics and charts would go here */}
              <div className="space-y-6">
                <div className="text-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-6xl mb-4">🚧</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Detaylı Analiz Geliştiriliyor
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Grafik ve detaylı analiz component'leri yakında eklenecek.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModernAdminLayout>
  );
}
