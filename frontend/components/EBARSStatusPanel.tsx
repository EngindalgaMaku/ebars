"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface EBARSStatusPanelProps {
  userId: string;
  sessionId: string;
  onFeedbackSubmitted?: () => void;
  refreshTrigger?: number; // When this changes, refresh the state
  lastQuery?: string; // Last student question (for complete prompt generation)
  lastContext?: string; // Last RAG context/chunks (for complete prompt generation)
}

interface EBARSState {
  comprehension_score: number;
  difficulty_level: string;
  prompt_parameters: any;
  adaptive_prompt?: string; // Generated prompt for display
  complete_prompt?: string; // Complete prompt (Question + EBARS + RAG)
  statistics: {
    total_feedback_count: number;
    positive_feedback_count: number;
    negative_feedback_count: number;
    consecutive_positive: number;
    consecutive_negative: number;
    last_feedback_at: string | null;
  };
}

const DIFFICULTY_LABELS: Record<
  string,
  { label: string; color: string; description: string; emoji: string }
> = {
  very_struggling: {
    label: "Yeni Konular Keşfediyor",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    description: "Sistem size temel seviyede, adım adım açıklamalar sunuyor",
    emoji: "🌱",
  },
  struggling: {
    label: "Öğrenme Sürecinde",
    color: "bg-indigo-100 text-indigo-800 border-indigo-300",
    description:
      "Sistem size uygun seviyede, örneklerle desteklenmiş açıklamalar sunuyor",
    emoji: "📚",
  },
  normal: {
    label: "İyi İlerliyor",
    color: "bg-green-100 text-green-800 border-green-300",
    description: "Sistem size dengeli seviyede, kapsamlı açıklamalar sunuyor",
    emoji: "😊",
  },
  good: {
    label: "Başarıyla İlerliyor",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
    description: "Sistem size ileri seviyede, detaylı açıklamalar sunuyor",
    emoji: "⭐",
  },
  excellent: {
    label: "Harika İlerliyor",
    color: "bg-purple-100 text-purple-800 border-purple-300",
    description:
      "Sistem size uzman seviyede, derinlemesine açıklamalar sunuyor",
    emoji: "🎯",
  },
};

export default function EBARSStatusPanel({
  userId,
  sessionId,
  onFeedbackSubmitted,
  refreshTrigger,
  lastQuery,
  lastContext,
}: EBARSStatusPanelProps) {
  const router = useRouter();
  const [ebarsState, setEbarsState] = useState<EBARSState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [previousDifficulty, setPreviousDifficulty] = useState<string | null>(
    null
  );
  const [showChangeAnimation, setShowChangeAnimation] = useState(false);
  const [scoreDelta, setScoreDelta] = useState<number | null>(null);
  const [difficultyChange, setDifficultyChange] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed
  const [showPrompt, setShowPrompt] = useState(false); // Show/hide prompt
  const [showInfoModal, setShowInfoModal] = useState(false); // Show/hide info modal

  // Track if we've successfully loaded EBARS state at least once
  const hasLoadedOnceRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const isFetchingRef = useRef(false); // Prevent concurrent fetches

  // Fetch EBARS state
  const fetchEBARSState = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }

    const isInitialLoad = isInitialLoadRef.current;
    isFetchingRef.current = true;

    try {
      // Only set loading to true on initial load
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);

      // Use POST for long query/context to avoid 414 URI Too Large error
      const url = `/api/aprag/ebars/state/${userId}/${sessionId}`;

      let response;
      if (lastQuery && lastContext) {
        // POST request with body for long data
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: lastQuery,
            context: lastContext,
          }),
        });
      } else {
        // GET request for simple state check
        response = await fetch(url);
      }

      if (!response.ok) {
        // EBARS might be disabled, that's okay
        if (response.status === 403) {
          // Only clear state on initial load, not during refresh
          if (isInitialLoad && !hasLoadedOnceRef.current) {
            setEbarsState(null);
            setLoading(false);
          }
          isInitialLoadRef.current = false;
          return;
        }
        // For other errors, only throw on initial load
        if (isInitialLoad && !hasLoadedOnceRef.current) {
          setEbarsState(null);
          setLoading(false);
          isInitialLoadRef.current = false;
          throw new Error("EBARS durumu alınamadı");
        } else {
          // During refresh, just log and keep existing state - DO NOT CLEAR STATE
          console.warn(
            "EBARS state fetch failed during refresh:",
            response.status
          );
          return;
        }
      }

      const data = await response.json();
      if (data.success && data.data) {
        const newState = data.data;

        // Mark that we've successfully loaded at least once
        hasLoadedOnceRef.current = true;
        isInitialLoadRef.current = false;

        // Check for changes and show animation
        const scoreChanged =
          previousScore !== null &&
          Math.abs(previousScore - newState.comprehension_score) > 0.1;
        const difficultyChanged =
          previousDifficulty !== null &&
          previousDifficulty !== newState.difficulty_level;

        if (scoreChanged) {
          const delta = newState.comprehension_score - (previousScore || 0);
          setScoreDelta(delta);
          setTimeout(() => setScoreDelta(null), 3000);
        }

        if (difficultyChanged) {
          setDifficultyChange(
            `${previousDifficulty} → ${newState.difficulty_level}`
          );
          setTimeout(() => setDifficultyChange(null), 3000);
        }

        if (scoreChanged || difficultyChanged) {
          setShowChangeAnimation(true);
          setTimeout(() => setShowChangeAnimation(false), 2000);

          // Log change for debugging
          if (scoreChanged) {
            console.log(
              `📊 EBARS Score changed: ${previousScore?.toFixed(
                1
              )} → ${newState.comprehension_score.toFixed(1)} (${
                scoreDelta
                  ? (scoreDelta > 0 ? "+" : "") + scoreDelta.toFixed(1)
                  : "N/A"
              })`
            );
          }
          if (difficultyChanged) {
            console.log(
              `📈 EBARS Difficulty changed: ${previousDifficulty} → ${newState.difficulty_level}`
            );
          }
        }

        setPreviousScore(newState.comprehension_score);
        setPreviousDifficulty(newState.difficulty_level);
        setEbarsState(newState); // Always update state if we got valid data
      } else {
        // Only clear state if this is initial load and we haven't loaded before
        if (isInitialLoad && !hasLoadedOnceRef.current) {
          setEbarsState(null);
        }
        isInitialLoadRef.current = false;
      }
    } catch (e: any) {
      // Non-critical error - NEVER clear state if we've loaded before
      if (isInitialLoad && !hasLoadedOnceRef.current) {
        setEbarsState(null);
        setError(null); // Don't show error, just hide panel
      } else {
        // During refresh, just log the error but KEEP showing the panel with existing state
        console.warn("EBARS state fetch error during refresh:", e);
        // DO NOT clear ebarsState - keep showing the last known good state
      }
      isInitialLoadRef.current = false;
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [userId, sessionId, lastQuery, lastContext]);

  // Initial load - Reset state when session changes
  useEffect(() => {
    if (userId && sessionId) {
      // Reset all state when session changes
      hasLoadedOnceRef.current = false;
      isInitialLoadRef.current = true;
      setEbarsState(null);
      setPreviousScore(null);
      setPreviousDifficulty(null);
      setScoreDelta(null);
      setDifficultyChange(null);
      setShowChangeAnimation(false);
      setLoading(true);
      setError(null);

      // Fetch new session's EBARS state
      fetchEBARSState();
    }
  }, [userId, sessionId]); // Removed fetchEBARSState from deps to avoid infinite loop

  // Refresh when refreshTrigger changes (parent updates this when query/feedback happens)
  useEffect(() => {
    if (
      refreshTrigger !== undefined &&
      refreshTrigger > 0 &&
      userId &&
      sessionId &&
      hasLoadedOnceRef.current
    ) {
      // Only refresh if we've loaded at least once
      isInitialLoadRef.current = false;
      fetchEBARSState();
    }
  }, [refreshTrigger, userId, sessionId, fetchEBARSState]);

  // Show loading state only on initial load
  if (loading && !ebarsState && isInitialLoadRef.current) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 p-4 mb-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm animate-pulse">
            EB
          </div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if EBARS state is not available and we've never loaded successfully
  if (!ebarsState && !hasLoadedOnceRef.current) {
    return null;
  }

  // If we have state, always show it (even if a refresh is in progress)
  if (!ebarsState && hasLoadedOnceRef.current) {
    // This shouldn't happen, but if it does, show a minimal placeholder
    return null;
  }

  // At this point, ebarsState is guaranteed to be non-null (we checked above)
  if (!ebarsState) {
    return null; // This should never happen, but TypeScript needs this
  }

  const difficulty =
    DIFFICULTY_LABELS[ebarsState.difficulty_level] ||
    DIFFICULTY_LABELS["normal"];
  const score = ebarsState.comprehension_score;
  const scoreColor =
    score >= 80
      ? "text-green-600"
      : score >= 60
      ? "text-blue-600"
      : score >= 40
      ? "text-yellow-600"
      : "text-red-600";
  const difficultyColorClass =
    difficulty.color.split(" ")[1] || "text-gray-800";

  return (
    <div
      className={`bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 mb-4 shadow-md transition-all duration-300 ${
        showChangeAnimation ? "ring-4 ring-indigo-300 animate-pulse" : ""
      }`}
    >
      {/* Header - Always visible */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer hover:bg-indigo-50/50 transition-colors rounded-t-xl"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            EB
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-800">
              🎯 Kişisel Öğrenme Asistanı
            </h3>
            <p className="text-xs text-gray-600">
              {isCollapsed ? (
                <>
                  <span className="text-gray-500">Seviye:</span>{" "}
                  <span className={`font-semibold ${difficultyColorClass}`}>
                    {difficulty.emoji} {difficulty.label}
                  </span>
                </>
              ) : (
                "Anlama seviyenize göre açıklamalar otomatik iyileştiriliyor"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowInfoModal(true);
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
            title="Bilgi"
          >
            ℹ️
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (
                confirm(
                  "Seviyenizi tekrar değerlendirmek istediğinize emin misiniz? Mevcut puanınız sıfırlanacak ve testi tekrar alacaksınız."
                )
              ) {
                try {
                  const response = await fetch(
                    `/api/aprag/ebars/reset-initial-test/${userId}/${sessionId}`,
                    { method: "POST" }
                  );

                  if (response.ok) {
                    // Redirect to test page
                    router.push(
                      `/student/cognitive-test?sessionId=${sessionId}`
                    );
                  } else {
                    const errorData = await response.json();
                    alert(
                      errorData.detail || "Test sıfırlanırken bir hata oluştu"
                    );
                  }
                } catch (err) {
                  console.error("Error resetting test:", err);
                  alert("Test sıfırlanırken bir hata oluştu");
                }
              }
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
            title="Seviyemi Tekrar Değerlendir"
          >
            🔄
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
            title={isCollapsed ? "Genişlet" : "Daralt"}
          >
            {isCollapsed ? "▼" : "▲"}
          </button>
        </div>
      </div>

      {/* Content - Collapsible */}
      {!isCollapsed && (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Learning Progress */}
            <div className="bg-white/80 rounded-lg p-3 border border-gray-200 relative">
              <div className="text-xs text-gray-600 mb-1">
                📈 Öğrenme İlerlemesi
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-lg font-bold text-blue-600 transition-colors duration-300">
                  {difficulty.emoji}
                </div>
                <div className="text-sm font-semibold text-gray-700">
                  {difficulty.label}
                </div>
                {scoreDelta !== null && (
                  <div
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      scoreDelta > 0
                        ? "bg-green-100 text-green-700 animate-pulse"
                        : "bg-blue-100 text-blue-700 animate-pulse"
                    }`}
                  >
                    {scoreDelta > 0 ? "📈 Yükseldi!" : "🔄 Ayarlandı"}
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {score >= 80
                  ? "🚀 Mükemmel performans!"
                  : score >= 60
                  ? "💪 Harika ilerleme gösteriyorsunuz!"
                  : score >= 40
                  ? "📚 Öğrenmeye devam ediyorsunız!"
                  : "🌱 Yeni konuları keşfediyorsunuz!"}
              </div>
            </div>

            {/* System Adaptation */}
            <div className="bg-white/80 rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">🎯 Sistem Uyumu</div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`text-sm font-semibold px-2 py-1 rounded border ${difficulty.color} transition-all duration-300`}
                >
                  {difficulty.emoji} {difficulty.label}
                </div>
                {difficultyChange && (
                  <div className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded animate-pulse">
                    ✨ Güncellendi
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {difficulty.description}
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white/60 rounded-lg p-2 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">İstatistikler</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Toplam:</span>
                <span className="font-semibold text-gray-800 ml-1">
                  {ebarsState.statistics.total_feedback_count}
                </span>
              </div>
              <div>
                <span className="text-green-600">Olumlu:</span>
                <span className="font-semibold text-gray-800 ml-1">
                  {ebarsState.statistics.positive_feedback_count}
                </span>
              </div>
              <div>
                <span className="text-red-600">Olumsuz:</span>
                <span className="font-semibold text-gray-800 ml-1">
                  {ebarsState.statistics.negative_feedback_count}
                </span>
              </div>
            </div>
          </div>

          {/* System Explanation */}
          <div className="p-2 bg-green-100/50 rounded-lg border border-green-200">
            <div className="text-xs text-gray-700 leading-relaxed">
              <span className="font-semibold">✨ Nasıl Çalışıyor?</span>
              <br />
              Emoji geri bildirimlerinize göre sistem, açıklamaları size en
              uygun seviyede hazırlıyor.
              {score >= 70 &&
                " 🎯 Harika! Sistem size daha detaylı ve kapsamlı açıklamalar sunuyor."}
              {score < 70 &&
                score >= 50 &&
                " 😊 Sistem size mükemmel dengede açıklamalar sunuyor."}
              {score < 50 &&
                " 🌱 Sistem size özenle hazırlanmış, adım adım açıklamalar sunuyor."}
            </div>
          </div>

          {/* Test Link */}
          <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-700">
                <span className="font-semibold">🎨 Kişisel Tercihler:</span>
                <br />
                <span className="text-gray-600">
                  İstediğiniz zaman tercihlerinizi yeniden belirleyebilirsiniz
                </span>
              </div>
              <button
                onClick={() => {
                  router.push(`/student/cognitive-test?sessionId=${sessionId}`);
                }}
                className="px-3 py-1.5 bg-purple-500 text-white text-xs font-semibold rounded-lg hover:bg-purple-600 transition-colors shadow-sm"
              >
                Güncelle
              </button>
            </div>
          </div>

          {/* Adaptive Prompt Display */}
          {(ebarsState.adaptive_prompt || ebarsState.complete_prompt) && (
            <div className="mt-3">
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="w-full text-left text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center justify-between p-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
              >
                <span>
                  📝{" "}
                  {ebarsState.complete_prompt
                    ? "Tam Prompt (Soru + EBARS + RAG)"
                    : "Kişiselleştirilmiş Prompt"}
                  {showPrompt ? " (Gizle)" : " (Göster)"}
                </span>
                <span>{showPrompt ? "▲" : "▼"}</span>
              </button>
              {showPrompt && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-300 max-h-96 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                    {ebarsState.complete_prompt || ebarsState.adaptive_prompt}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-t-xl flex items-center justify-between">
              <h2 className="text-lg font-bold">EBARS Puanlama Sistemi</h2>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-white hover:text-gray-200 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-2">
                  📊 Nasıl Çalışıyor?
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  EBARS (Emoji Geri Bildirimi Tabanlı Adaptif Cevap Sistemi),
                  emoji geri bildirimlerinize göre anlama puanınızı hesaplar ve
                  sistemin cevaplarının zorluk seviyesini otomatik olarak
                  ayarlar.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-2">
                  😊 Emoji Puanlama Sistemi
                </h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👍</span>
                    <span className="flex-1">
                      <strong>Tam Anladım:</strong> +5 puan (yüksek seviyede
                      +3.5, düşük seviyede +6.5)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">😊</span>
                    <span className="flex-1">
                      <strong>Genel Anladım:</strong> +2 puan (yüksek seviyede
                      +1.4, düşük seviyede +2.6)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">😐</span>
                    <span className="flex-1">
                      <strong>Kısmen Anladım:</strong> -3 puan (yüksek seviyede
                      -2.1, düşük seviyede -3.9)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">❌</span>
                    <span className="flex-1">
                      <strong>Anlamadım:</strong> -5 puan (yüksek seviyede -3.5,
                      düşük seviyede -6.5)
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>Dinamik Delta Sistemi:</strong> Puanınız yüksekse
                  (70+) değişimler daha yavaş, düşükse (30-) daha hızlı olur. Bu
                  sayede sistem daha dengeli çalışır.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-2">
                  📈 Zorluk Seviyeleri
                </h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                      🌱 Yeni Konular Keşfediyor
                    </span>
                    <span className="text-gray-600">0-30 puan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-semibold">
                      📚 Öğrenme Sürecinde
                    </span>
                    <span className="text-gray-600">31-45 puan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                      😊 İyi İlerliyor
                    </span>
                    <span className="text-gray-600">46-70 puan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold">
                      ⭐ Başarıyla İlerliyor
                    </span>
                    <span className="text-gray-600">71-80 puan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                      🎯 Harika İlerliyor
                    </span>
                    <span className="text-gray-600">81-100 puan</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>Histeresis Mekanizması:</strong> Zorluk seviyesi
                  değişimleri daha stabil olması için farklı giriş/çıkış
                  eşikleri kullanılır. Örneğin "Normal" seviyesine 50 puanla
                  girilir, ancak çıkmak için 75 puana çıkmak gerekir.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-2">
                  ⚡ Hızlı Uyarlama
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-2">
                  <div>
                    <strong>🎯 Hızlı Uyarlama:</strong> Ardışık geri
                    bildirimleriniz alındığında, sistem size daha uygun seviyeye
                    hızlıca geçer.
                  </div>
                  <div>
                    <strong>✨ Akıllı Geçiş:</strong> Başarılı geri
                    bildirimleriniz üzerine, sistem size daha gelişmiş
                    açıklamalar sunmaya başlar.
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-2">
                  💡 İpuçları
                </h3>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>
                    Dürüst geri bildirim verin - sistem size en uygun seviyeyi
                    bulacaktır
                  </li>
                  <li>Puanınız 50 ile başlar (Normal seviye)</li>
                  <li>Her emoji geri bildirimi puanınızı etkiler</li>
                  <li>
                    Sistem, cevapların zorluk seviyesini otomatik olarak ayarlar
                  </li>
                  <li>
                    Yüksek puanlarda daha zorlayıcı, düşük puanlarda daha
                    açıklayıcı cevaplar alırsınız
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Bu sistem, öğrenme deneyiminizi kişiselleştirmek için
                  tasarlanmıştır. Daha fazla bilgi için akademik makaleye
                  bakabilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
