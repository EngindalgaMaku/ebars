"use client";

import React, { useState, useEffect } from "react";
import TeacherLayout from "../components/TeacherLayout";
import { useEducationAssistant } from "../../hooks/useEducationAssistant";

// Import modular components
import QueryForm from "../../components/EducationAssistant/QueryForm";
import SessionSelection from "../../components/EducationAssistant/SessionSelection";
import ChatHistory from "../../components/EducationAssistant/ChatHistory";
import SourcesViewer from "../../components/EducationAssistant/SourcesViewer";
import {
  QueryLoadingIndicator,
  SuggestionsLoadingIndicator,
  RAGProcessingIndicator,
} from "../../components/EducationAssistant/ProgressIndicator";

export default function EducationAssistantPage() {
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues by ensuring client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <TeacherLayout activeTab="assistant">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 lg:p-8 min-h-full">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Yükleniyor...</span>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return <EducationAssistantContent />;
}

function EducationAssistantContent() {
  console.log("EducationAssistantPage: Component starting to render");

  // Sources viewer state
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);

  // Use the Education Assistant hook
  const {
    // Query states
    query,
    setQuery,
    isQuerying,
    error,
    chatHistory,
    clearChatHistory,

    // Model states
    selectedQueryModel,
    setSelectedQueryModel,
    selectedProvider,
    setSelectedProvider,
    availableModels,
    filteredModels,
    modelProviders,
    selectedEmbeddingModel,
    setSelectedEmbeddingModel,
    availableEmbeddingModels,
    selectedEmbeddingProvider,
    setSelectedEmbeddingProvider,
    chainType,
    setChainType,
    selectedRerankerType,
    setSelectedRerankerType,
    useDirectLLM,
    setUseDirectLLM,
    useRerankerService,
    setUseRerankerService,

    // Session states
    selectedSessionId,
    setSelectedSessionId,
    sessions,
    sessionRagSettings,

    // UI states
    answerLength,
    setAnswerLength,
    loading,
    modelsLoading,
    embeddingModelsLoading,

    // Functions
    handleQuery,
    handleSuggestionClick,
    refreshSessions,
    handleProviderChange,

    // User info
    isStudent,
  } = useEducationAssistant();

  console.log("EducationAssistantPage: Hook data loaded", {
    selectedSessionId,
    selectedQueryModel,
    isQuerying,
    error,
  });

  // Local states for features not in hook
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [ragProcessingStage, setRagProcessingStage] = useState<
    number | undefined
  >(undefined);

  const handleSourceClick = (source: any) => {
    setSelectedSource(source);
    setIsSourcesModalOpen(true);
  };

  const handleCloseSourcesModal = () => {
    setIsSourcesModalOpen(false);
    setSelectedSource(null);
  };

  return (
    <TeacherLayout activeTab="assistant">
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 lg:p-8 min-h-full">
        {/* Header Section */}
        <div className="mb-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Aktif Model</div>
                  <div className="text-lg font-bold text-gray-800">
                    {useDirectLLM
                      ? "Direkt LLM"
                      : selectedQueryModel
                      ? selectedQueryModel.split("/").pop() ||
                        selectedQueryModel
                      : "Seçilmedi"}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Embedding Model</div>
                  <div className="text-lg font-bold text-gray-800">
                    {selectedEmbeddingModel
                      ? selectedEmbeddingModel.split("/").pop() ||
                        selectedEmbeddingModel
                      : "Seçilmedi"}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg
                    className="w-5 h-5 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Rerank Modeli</div>
                  <div className="text-lg font-bold text-gray-800">
                    {useDirectLLM
                      ? "Direkt AI"
                      : useRerankerService
                      ? selectedRerankerType === "ms-marco"
                        ? "gte-rerank-v2 (Alibaba)"
                        : selectedRerankerType || "Reranker"
                      : "Standart RAG"}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <SessionSelection
                sessions={sessions}
                selectedSessionId={selectedSessionId}
                onSessionChange={setSelectedSessionId}
                sessionRagSettings={sessionRagSettings}
                loading={loading}
                useDirectLLM={useDirectLLM}
                isStudent={isStudent}
              />
            </div>
          </div>
        </div>

        {/* Main Content Area - Full Width */}
        <div className="space-y-6">
          {/* Query Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Soru Sor
              </h3>
            </div>
            <div className="p-6">
              <QueryForm
                query={query}
                setQuery={setQuery}
                onSubmit={handleQuery}
                isQuerying={isQuerying}
                selectedQueryModel={selectedQueryModel}
                sessionRagSettings={sessionRagSettings}
                answerLength={answerLength}
                setAnswerLength={setAnswerLength}
                isStudent={isStudent}
                chatHistoryLength={chatHistory?.length || 0}
                onSuggestionClick={handleSuggestionClick}
              />

              {/* Loading Indicators - Only show one at a time */}
              <div className="mt-4">
                {/* Priority 1: RAG Processing (if stage is available) */}
                {isQuerying && ragProcessingStage !== undefined ? (
                  <RAGProcessingIndicator
                    isLoading={true}
                    stage={ragProcessingStage}
                  />
                ) : (
                  <>
                    {/* Priority 2: Query Loading (if querying but no RAG stage) */}
                    {isQuerying && (
                      <QueryLoadingIndicator
                        isLoading={true}
                        message="Sorgunuz işleniyor..."
                      />
                    )}

                    {/* Priority 3: Suggestions Loading (only if not querying) */}
                    {!isQuerying && (
                      <SuggestionsLoadingIndicator
                        isLoading={isSuggestionsLoading}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Chat History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Sohbet Geçmişi
                <span className="ml-auto bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {chatHistory?.length || 0} soru
                </span>
              </h3>
            </div>
            <div className="max-h-[900px] overflow-y-auto">
              <ChatHistory
                chatHistory={chatHistory || []}
                isQuerying={isQuerying}
                studentMessages={[]}
                studentChatLoading={false}
                isStudent={isStudent || false}
                selectedSessionId={selectedSessionId}
                onSuggestionClick={handleSuggestionClick}
                onOpenSourceModal={handleSourceClick}
                clearChatHistory={clearChatHistory}
                formatTimestamp={(timestamp: string) => {
                  try {
                    return new Date(timestamp).toLocaleString("tr-TR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  } catch {
                    return timestamp;
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Sources Modal */}
        <SourcesViewer
          isOpen={isSourcesModalOpen}
          onClose={handleCloseSourcesModal}
          selectedSource={selectedSource}
        />

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md z-50">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <strong className="font-medium">Hata!</strong>
                <div className="text-sm mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
