"use client";

import React, { useState } from "react";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { previewLevelResponse, LevelPreviewRequest, LevelPreviewResponse } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface LevelComparisonButtonsProps {
  userId: string;
  sessionId: string;
  query: string;
  ragResponse: string;
  ragDocuments: Array<{
    doc_id: string;
    content: string;
    score: number;
    metadata?: any;
  }>;
  currentDifficulty?: string;
}

export default function LevelComparisonButtons({
  userId,
  sessionId,
  query,
  ragResponse,
  ragDocuments,
  currentDifficulty,
}: LevelComparisonButtonsProps) {
  const [loading, setLoading] = useState<"lower" | "higher" | null>(null);
  const [preview, setPreview] = useState<LevelPreviewResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async (direction: "lower" | "higher") => {
    setError(null);
    setLoading(direction);
    setShowModal(false); // Önce modal'ı kapat

    try {
      const request: LevelPreviewRequest = {
        user_id: userId,
        session_id: sessionId,
        query,
        rag_response: ragResponse,
        rag_documents: ragDocuments,
        direction,
      };

      const response = await previewLevelResponse(request);
      
      // Debug: Log response details
      console.log("🔍 Level Preview Response:", {
        direction,
        current: response.current_difficulty_label,
        target: response.target_difficulty_label,
        responseLength: response.preview_response.length,
        previewStart: response.preview_response.substring(0, 100),
        originalLength: ragResponse.length,
        isIdentical: response.preview_response.trim() === ragResponse.trim(),
      });
      
      // Check if response is identical to original
      if (response.preview_response.trim() === ragResponse.trim()) {
        console.warn("⚠️ WARNING: Preview response is identical to original!");
        setError("Önizleme cevabı orijinal cevapla aynı. Lütfen tekrar deneyin.");
        return;
      }
      
      setPreview(response);
      setShowModal(true);
    } catch (err: any) {
      console.error("Error previewing level:", err);
      setError(
        err.message || "Önizleme oluşturulurken bir hata oluştu. Lütfen tekrar deneyin."
      );
    } finally {
      setLoading(null);
    }
  };

  // Don't show if EBARS is not enabled or no difficulty info
  if (!currentDifficulty) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={() => handlePreview("lower")}
          disabled={loading !== null}
          className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Daha açıklayıcı bir cevap görmek için tıklayın"
        >
          {loading === "lower" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowDown className="w-5 h-5" />
          )}
          <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-white px-2 py-1 rounded shadow-md border border-gray-200">
            Daha açıklayıcı
          </span>
        </button>

        <div className="text-xs text-gray-500 px-2">Seviye karşılaştırması</div>

        <button
          onClick={() => handlePreview("higher")}
          disabled={loading !== null}
          className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-600 hover:text-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Daha derinlemesine bir cevap görmek için tıklayın"
        >
          {loading === "higher" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowUp className="w-5 h-5" />
          )}
          <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-white px-2 py-1 rounded shadow-md border border-gray-200">
            Daha derinlemesine
          </span>
        </button>
      </div>

      {/* Preview Modal */}
      {showModal && preview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowModal(false);
            setPreview(null);
          }}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  {preview.direction === "lower"
                    ? "📖 Daha Açıklayıcı Seviye"
                    : "🚀 Daha Derinlemesine Seviye"}
                </h2>
                <p className="text-sm text-indigo-100 mt-1">
                  {preview.target_difficulty_label} seviyesinde önizleme
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setPreview(null);
                }}
                className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Bilgi:</strong> {preview.note}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Mevcut seviyeniz: <strong>{preview.current_difficulty_label}</strong> → Önizleme seviyesi:{" "}
                  <strong>{preview.target_difficulty_label}</strong>
                </p>
                {preview.debug_info && (
                  <div className="mt-2 pt-2 border-t border-blue-300">
                    <p className="text-xs text-blue-700">
                      <strong>🔍 Debug:</strong> Orijinal: {preview.debug_info.original_length} karakter, 
                      Önizleme: {preview.debug_info.preview_length} karakter 
                      ({preview.debug_info.length_difference > 0 ? "+" : ""}{preview.debug_info.length_difference})
                      {preview.debug_info.is_identical && (
                        <span className="text-red-600 font-semibold ml-2">⚠️ Aynı cevap üretildi!</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Preview Response */}
              <div className="prose prose-sm max-w-none">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <ReactMarkdown>{preview.preview_response}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setPreview(null);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 shadow-lg z-50 max-w-sm">
          <p className="text-sm font-semibold">Hata</p>
          <p className="text-xs mt-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Kapat
          </button>
        </div>
      )}
    </>
  );
}

