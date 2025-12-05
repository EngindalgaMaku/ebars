"use client";

import React, { useState, useEffect } from "react";
import {
  listQuestionPool,
  exportQuestionPool,
  getBatchJobStatus,
  deleteQuestion,
  bulkDeleteQuestions,
  QuestionPoolQuestion,
  Topic,
  getSessionTopics,
} from "@/lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Sparkles,
  RefreshCw,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import BatchQuestionGenerationModal from "./BatchQuestionGenerationModal";
import { Progress } from "@/components/ui/progress";

interface QuestionPoolPanelProps {
  sessionId: string;
}

export default function QuestionPoolPanel({ sessionId }: QuestionPoolPanelProps) {
  const [questions, setQuestions] = useState<QuestionPoolQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [batchJob, setBatchJob] = useState<number | null>(null);
  const [batchJobStatus, setBatchJobStatus] = useState<any>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [filters, setFilters] = useState({
    topic_id: null as number | null,
    difficulty_level: null as string | null,
    bloom_level: null as string | null,
    is_active: true,
  });
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    has_more: false,
  });
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // Load topics
  useEffect(() => {
    loadTopics();
  }, [sessionId]);

  // Load questions
  useEffect(() => {
    loadQuestions();
  }, [sessionId, filters, pagination.offset]);

  // Poll batch job status
  useEffect(() => {
    if (batchJob && batchJobStatus?.status === "running") {
      const interval = setInterval(async () => {
        try {
          const status = await getBatchJobStatus(batchJob);
          setBatchJobStatus(status);
          if (status.status === "completed" || status.status === "failed") {
            clearInterval(interval);
            loadQuestions(); // Refresh questions
          }
        } catch (error) {
          console.error("Error polling job status:", error);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [batchJob, batchJobStatus]);

  const loadTopics = async () => {
    try {
      const data = await getSessionTopics(sessionId);
      setTopics(data.topics || []);
    } catch (error) {
      console.error("Error loading topics:", error);
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await listQuestionPool(
        sessionId,
        filters.topic_id || undefined,
        filters.difficulty_level || undefined,
        filters.bloom_level || undefined,
        filters.is_active,
        pagination.limit,
        pagination.offset
      );
      setQuestions(data.questions);
      setPagination({
        ...pagination,
        total: data.total,
        has_more: data.pagination.has_more,
      });
    } catch (error) {
      console.error("Error loading questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchGenerate = (jobId: number) => {
    setBatchJob(jobId);
    setShowBatchModal(false);
    // Start polling
    getBatchJobStatus(jobId).then(setBatchJobStatus).catch(console.error);
  };

  const handleExport = async () => {
    try {
      const blob = await exportQuestionPool(
        sessionId,
        "json",
        filters.topic_id || undefined,
        filters.difficulty_level || undefined,
        filters.bloom_level || undefined
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `question-pool-${sessionId}-${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting questions:", error);
      alert("Export başarısız: " + (error as Error).message);
    }
  };

  const getBloomLevelColor = (level?: string) => {
    const colors: { [key: string]: string } = {
      remember: "bg-blue-100 text-blue-800",
      understand: "bg-green-100 text-green-800",
      apply: "bg-yellow-100 text-yellow-800",
      analyze: "bg-orange-100 text-orange-800",
      evaluate: "bg-purple-100 text-purple-800",
      create: "bg-red-100 text-red-800",
    };
    return colors[level || ""] || "bg-gray-100 text-gray-800";
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm("Bu soruyu silmek istediğinize emin misiniz?")) {
      return;
    }

    setDeleting(true);
    try {
      await deleteQuestion(questionId, sessionId);
      await loadQuestions();
      setSelectedQuestions(new Set());
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Soru silinirken hata oluştu: " + (error as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.size === 0) {
      alert("Lütfen silmek istediğiniz soruları seçin");
      return;
    }

    if (!confirm(`${selectedQuestions.size} soruyu silmek istediğinize emin misiniz?`)) {
      return;
    }

    setDeleting(true);
    try {
      await bulkDeleteQuestions(Array.from(selectedQuestions), sessionId);
      await loadQuestions();
      setSelectedQuestions(new Set());
    } catch (error) {
      console.error("Error bulk deleting questions:", error);
      alert("Sorular silinirken hata oluştu: " + (error as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const toggleQuestionSelection = (questionId: number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.size === questions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(questions.map((q) => q.question_id)));
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Soru Havuzu Yönetimi</CardTitle>
          <CardDescription>
            Belirli konularda soru üretin ve test için büyük bir soru havuzu oluşturun
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Action Buttons */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              onClick={() => setShowBatchModal(true)}
              disabled={loading || (batchJobStatus?.status === "running")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Toplu Soru Üret
            </Button>
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              JSON Export
            </Button>
            {selectedQuestions.size > 0 && (
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                disabled={deleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Seçilenleri Sil ({selectedQuestions.size})
              </Button>
            )}
            <Button onClick={loadQuestions} variant="outline" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Yenile
            </Button>
          </div>

          {/* Batch Job Status */}
          {batchJobStatus && (
            <Card className="mb-4">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Batch İş Durumu</span>
                    <span className={`text-sm ${
                      batchJobStatus.status === "completed" ? "text-green-600" :
                      batchJobStatus.status === "failed" ? "text-red-600" :
                      "text-blue-600"
                    }`}>
                      {batchJobStatus.status === "completed" && <CheckCircle2 className="inline mr-1" />}
                      {batchJobStatus.status === "failed" && <XCircle className="inline mr-1" />}
                      {batchJobStatus.status === "running" && <Clock className="inline mr-1 animate-spin" />}
                      {batchJobStatus.status}
                    </span>
                  </div>
                  {batchJobStatus.status === "running" && (
                    <>
                      <Progress
                        value={
                          batchJobStatus.progress_total > 0
                            ? (batchJobStatus.progress_current / batchJobStatus.progress_total) * 100
                            : 0
                        }
                        className="h-2"
                      />
                      <div className="text-sm text-gray-600">
                        {batchJobStatus.progress_current} / {batchJobStatus.progress_total} soru üretildi
                      </div>
                    </>
                  )}
                  {batchJobStatus.status === "completed" && (
                    <div className="text-sm space-y-1">
                      <div>✅ Onaylanan: {batchJobStatus.questions_approved}</div>
                      <div>❌ Kalite: {batchJobStatus.questions_rejected_by_quality}</div>
                      <div>🔄 Duplicate: {batchJobStatus.questions_rejected_by_duplicate}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <select
              className="px-3 py-2 border rounded-md"
              value={filters.topic_id || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  topic_id: e.target.value ? parseInt(e.target.value) : null,
                })
              }
            >
              <option value="">Tüm Konular</option>
              {topics.map((topic) => (
                <option key={topic.topic_id} value={topic.topic_id}>
                  {topic.topic_title}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 border rounded-md"
              value={filters.bloom_level || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  bloom_level: e.target.value || null,
                })
              }
            >
              <option value="">Tüm Bloom Seviyeleri</option>
              <option value="remember">Remember</option>
              <option value="understand">Understand</option>
              <option value="apply">Apply</option>
              <option value="analyze">Analyze</option>
              <option value="evaluate">Evaluate</option>
              <option value="create">Create</option>
            </select>
          </div>

          {/* Questions List */}
          {loading ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Henüz soru yok. "Toplu Soru Üret" butonuna tıklayarak başlayın.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Toplam {pagination.total} soru (Sayfa {Math.floor(pagination.offset / pagination.limit) + 1})
                </div>
                {questions.length > 0 && (
                  <Button
                    onClick={toggleSelectAll}
                    variant="outline"
                    size="sm"
                  >
                    {selectedQuestions.size === questions.length ? (
                      <>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        Tümünü Kaldır
                      </>
                    ) : (
                      <>
                        <Square className="mr-2 h-4 w-4" />
                        Tümünü Seç
                      </>
                    )}
                  </Button>
                )}
              </div>
              {questions.map((question) => (
                <Card key={question.question_id}>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <button
                            onClick={() => toggleQuestionSelection(question.question_id)}
                            className="mt-1"
                            type="button"
                          >
                            {selectedQuestions.has(question.question_id) ? (
                              <CheckSquare className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="font-medium">{question.question_text}</div>
                            {question.topic_title && (
                              <div className="text-sm text-gray-500 mt-1">
                                Konu: {question.topic_title}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 items-start">
                          {question.bloom_level && (
                            <span
                              className={`px-2 py-1 rounded text-xs ${getBloomLevelColor(
                                question.bloom_level
                              )}`}
                            >
                              {question.bloom_level}
                            </span>
                          )}
                          {question.is_approved_by_llm && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                          {question.is_duplicate && (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <Button
                            onClick={() => handleDeleteQuestion(question.question_id)}
                            variant="ghost"
                            size="sm"
                            disabled={deleting}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {question.options && (
                        <div className="text-sm space-y-1 mt-2">
                          {Object.entries(question.options).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <span
                                className={`font-medium ${
                                  key === question.correct_answer
                                    ? "text-green-600"
                                    : "text-gray-600"
                                }`}
                              >
                                {key}:
                              </span>
                              <span>{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {question.explanation && (
                        <div className="text-sm text-gray-600 mt-2">
                          <strong>Açıklama:</strong> {question.explanation}
                        </div>
                      )}
                      <div className="flex gap-4 text-xs text-gray-500 mt-2">
                        {question.quality_score !== undefined && (
                          <span>Kalite: {(question.quality_score * 100).toFixed(0)}%</span>
                        )}
                        {question.similarity_score !== undefined && (
                          <span>Benzerlik: {(question.similarity_score * 100).toFixed(0)}%</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {pagination.has_more && (
                <Button
                  onClick={() =>
                    setPagination({ ...pagination, offset: pagination.offset + pagination.limit })
                  }
                  variant="outline"
                  className="w-full"
                >
                  Daha Fazla Yükle
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Generation Modal */}
      {showBatchModal && (
        <BatchQuestionGenerationModal
          sessionId={sessionId}
          topics={topics}
          onClose={() => setShowBatchModal(false)}
          onGenerate={handleBatchGenerate}
        />
      )}
    </div>
  );
}


