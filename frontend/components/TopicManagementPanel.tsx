"use client";

import React, { useState, useEffect } from "react";
import {
  extractTopics,
  getSessionTopics,
  updateTopic,
  deleteTopic,
  reorderTopics,
  Topic,
  TopicExtractionRequest,
} from "@/lib/api";
import { URLS } from "../config/ports";

interface TopicManagementPanelProps {
  sessionId: string;
  apragEnabled: boolean;
}

const TopicManagementPanel: React.FC<TopicManagementPanelProps> = ({
  sessionId,
  apragEnabled,
}) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicPage, setTopicPage] = useState(1);
  // KB batch extraction job tracking
  const [kbBatchJobId, setKbBatchJobId] = useState<string | null>(null);
  const [kbBatchStatus, setKbBatchStatus] = useState<any | null>(null);
  // KB detail modal
  const [kbModalTopicId, setKbModalTopicId] = useState<number | null>(null);
  const [kbModalData, setKbModalData] = useState<any | null>(null);
  const [kbModalQaPage, setKbModalQaPage] = useState(1);
  const [regeneratingKBTopicId, setRegeneratingKBTopicId] = useState<
    number | null
  >(null);
  // Selective refresh states
  const [refreshingComponent, setRefreshingComponent] = useState<{
    topicId: number;
    component: string;
  } | null>(null);
  const TOPICS_PER_PAGE = 20; // Increased from 10 to 20 to show more topics

  // KB-Enhanced states
  const [extractingKBBatch, setExtractingKBBatch] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());
  const [topicKBData, setTopicKBData] = useState<{ [key: number]: any }>({});
  // Topic reordering states
  const [reorderingTopics, setReorderingTopics] = useState(false);
  const [reorderCriteria, setReorderCriteria] = useState<"cognitive" | "proximity" | "hybrid">("cognitive");
  
  // Topic extraction modal states
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  
  // KB extraction modal states
  const [showKBExtractModal, setShowKBExtractModal] = useState(false);
  const [kbSystemPrompt, setKbSystemPrompt] = useState("");
  const [kbExtractType, setKbExtractType] = useState<"all" | "missing">("all");
  
  // QA Embedding calculation states
  const [calculatingEmbeddings, setCalculatingEmbeddings] = useState(false);
  const [embeddingJobId, setEmbeddingJobId] = useState<string | null>(null);
  const [embeddingProgress, setEmbeddingProgress] = useState<{
    processed: number;
    total: number;
    current_batch?: number;
    total_batches?: number;
  } | null>(null);

  // Fetch topics
  const fetchTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSessionTopics(sessionId);
      if (response.success) {
        console.log(
          `[TopicManagement] Fetched ${response.topics.length} topics for session ${sessionId}`
        );
        setTopics(response.topics);
      }
    } catch (e: any) {
      setError(e.message || "Konular yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  // Open extract topics modal
  const handleOpenExtractModal = () => {
    setShowExtractModal(true);
  };

  // Extract topics - ASYNC with polling!
  const handleExtractTopics = async () => {
    try {
      setExtracting(true);
      setError(null);
      setShowExtractModal(false); // Close modal

      // Start extraction job (returns immediately)
      const response = await fetch(
        `/api/aprag/topics/re-extract/${sessionId}?method=full`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_prompt: systemPrompt.trim() || null
          }),
        }
      );

      // Try to parse response even if status is not ok - backend might have started the job
      let data;
      try {
        const responseText = await response.text();
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          // If JSON parsing fails, use text as error message
          throw new Error(responseText || "Konu çıkarımı başlatılamadı");
        }
      } catch (e: any) {
        // If reading response fails, throw the error
        throw new Error(e.message || "Konu çıkarımı başlatılamadı");
      }

      // If we got a job_id, start polling even if response.ok is false
      // (backend might have started the job but returned an error status)
      if (data.job_id) {
        setSuccess(`🔄 ${data.message || "Konu çıkarımı arka planda başlatıldı. Lütfen bekleyin..."}`);
        // Don't set error - let polling handle the status
        pollExtractionStatus(data.job_id);
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || "Konu çıkarımı başlatılamadı");
      }

      if (data.success && data.job_id) {
        setSuccess(`🔄 ${data.message || "Konu çıkarımı arka planda başlatıldı. Lütfen bekleyin..."}`);
        pollExtractionStatus(data.job_id);
      } else {
        throw new Error("Konu çıkarımı başlatılamadı");
      }
    } catch (e: any) {
      // Only show error if we don't have a job_id to poll
      // Note: If job_id exists, polling will handle the status
      setError(e.message || "Konu çıkarımı başarısız oldu");
      setExtracting(false);
    }
  };

  // Poll extraction status
  const pollExtractionStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/aprag/topics/re-extract/status/${jobId}`
        );

        if (response.ok) {
          const status = await response.json();

          // Update progress message
          if (status.status === "processing") {
            setSuccess(
              `🔄 ${status.message} (${status.current_batch}/${status.total_batches} batch)`
            );
          } else if (status.status === "completed") {
            clearInterval(pollInterval);
            setExtracting(false);
            const result = status.result;
            setSuccess(
              `✅ ${result.merged_topics_count} konu çıkarıldı! ` +
                `(${result.chunks_analyzed} chunk - ${result.batches_processed} batch)`
            );
            await fetchTopics();
          } else if (status.status === "failed") {
            clearInterval(pollInterval);
            setExtracting(false);
            setError(`❌ ${status.error || "İşlem başarısız"}`);
          }
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 3000); // Poll every 3 seconds

    // Timeout after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setExtracting(false);
      setError("⏰ İşlem çok uzun sürdü, lütfen sayfayı yenileyin");
    }, 600000);
  };

  // Update topic
  const handleUpdateTopic = async (topicId: number, updates: any) => {
    try {
      setError(null);
      await updateTopic(topicId, updates);
      setSuccess("Konu başarıyla güncellendi");
      await fetchTopics();
      setEditingTopic(null);
    } catch (e: any) {
      setError(e.message || "Konu güncellenemedi");
    }
  };

  // Delete topic
  const handleDeleteTopic = async (topicId: number, topicTitle: string) => {
    if (
      !confirm(
        `"${topicTitle}" konusunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve konuyla ilişkili tüm veriler (bilgi tabanı, soru-cevaplar vb.) silinecektir.`
      )
    ) {
      return;
    }

    try {
      setError(null);
      await deleteTopic(topicId);
      setSuccess(`"${topicTitle}" konusu başarıyla silindi`);
      await fetchTopics();
    } catch (e: any) {
      setError(e.message || "Konu silinemedi");
    }
  };

  // Open KB extraction modal
  const handleOpenKBExtractModal = (type: "all" | "missing") => {
    setKbExtractType(type);
    setShowKBExtractModal(true);
  };

  // KB: Extract knowledge base batch
  const handleExtractKBBatch = async () => {
    try {
      setExtractingKBBatch(true);
      setKbBatchJobId(null);
      setKbBatchStatus(null);
      setError(null);
      setShowKBExtractModal(false); // Close modal
      
      const response = await fetch(
        `/api/aprag/knowledge/extract-batch/${sessionId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            force_refresh: false,
            system_prompt: kbSystemPrompt.trim() || null,
            extraction_config: {
              generate_qa_pairs: true,
              qa_pairs_per_topic: 15,
            },
          }),
        }
      );

      // Try to parse response even if status is not ok - backend might have started the job
      let data;
      try {
        const responseText = await response.text();
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          // If JSON parsing fails, use text as error message
          throw new Error(responseText || "KB oluşturulamadı");
        }
      } catch (e: any) {
        // If reading response fails, throw the error
        throw new Error(e.message || "KB oluşturulamadı");
      }

      // If we got a job_id, start polling even if response.ok is false
      // (backend might have started the job but returned an error status)
      if (data.job_id) {
        setKbBatchJobId(data.job_id);
        setSuccess(
          "Bilgi tabanı oluşturma arka planda başlatıldı. Lütfen bekleyin..."
        );
        // Don't set error - let polling handle the status
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || "KB oluşturulamadı");
      }

      if (data.success && data.job_id) {
        setKbBatchJobId(data.job_id);
        setSuccess(
          "Bilgi tabanı oluşturma arka planda başlatıldı. Lütfen bekleyin..."
        );
      } else {
        throw new Error("KB oluşturma işi başlatılamadı");
      }
    } catch (e: any) {
      // Only show error if we don't have a job_id to poll
      if (!kbBatchJobId) {
        setError(e.message || "Bilgi tabanı oluşturma başarısız");
        setKbBatchJobId(null);
        setKbBatchStatus(null);
        setExtractingKBBatch(false);
      } else {
        // If we have a job_id, just log the error but continue polling
        console.warn(
          "KB batch start had an error but job_id exists, continuing to poll:",
          e.message
        );
      }
    } finally {
      // Durumu polling tamamlayacak, burada extractingKBBatch'i hemen kapatmıyoruz
    }
  };

  // KB: Extract knowledge base batch for missing topics only
  const handleExtractKBBatchMissing = async () => {
    try {
      setExtractingKBBatch(true);
      setKbBatchJobId(null);
      setKbBatchStatus(null);
      setError(null);
      setShowKBExtractModal(false); // Close modal
      
      const response = await fetch(
        `/api/aprag/knowledge/extract-batch-missing/${sessionId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            force_refresh: false,
            system_prompt: kbSystemPrompt.trim() || null,
            extraction_config: {
              generate_qa_pairs: true,
              qa_pairs_per_topic: 15,
            },
          }),
        }
      );

      // Try to parse response even if status is not ok - backend might have started the job
      let data;
      try {
        const responseText = await response.text();
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          // If JSON parsing fails, use text as error message
          throw new Error(responseText || "KB oluşturulamadı");
        }
      } catch (e: any) {
        // If reading response fails, throw the error
        throw new Error(e.message || "KB oluşturulamadı");
      }

      // Check if all topics already have KB
      if (data.missing_count === 0) {
        setExtractingKBBatch(false);
        setSuccess("Tüm konular için bilgi tabanı zaten mevcut!");
        return;
      }

      // If we got a job_id, start polling even if response.ok is false
      if (data.job_id) {
        setKbBatchJobId(data.job_id);
        setSuccess(
          `${data.missing_count} eksik konu için bilgi tabanı oluşturma arka planda başlatıldı. Lütfen bekleyin...`
        );
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || "KB oluşturulamadı");
      }

      if (data.success && data.job_id) {
        setKbBatchJobId(data.job_id);
        setSuccess(
          `${data.missing_count} eksik konu için bilgi tabanı oluşturma arka planda başlatıldı. Lütfen bekleyin...`
        );
      } else {
        throw new Error("KB oluşturma işi başlatılamadı");
      }
    } catch (e: any) {
      // Only show error if we don't have a job_id to poll
      if (!kbBatchJobId) {
        setError(e.message || "Bilgi tabanı oluşturma başarısız");
        setKbBatchJobId(null);
        setKbBatchStatus(null);
        setExtractingKBBatch(false);
      } else {
        // If we have a job_id, just log the error but continue polling
        console.warn(
          "KB batch start had an error but job_id exists, continuing to poll:",
          e.message
        );
      }
    } finally {
      // Durumu polling tamamlayacak, burada extractingKBBatch'i hemen kapatmıyoruz
    }
  };

  // KB batch job status polling
  useEffect(() => {
    if (!kbBatchJobId) return;

    let interval: NodeJS.Timeout;
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 5; // Allow 5 consecutive errors before giving up

    const pollStatus = async () => {
      try {
        const res = await fetch(
          `/api/aprag/knowledge/extract-batch/status/${kbBatchJobId}`
        );
        if (!res.ok) {
          consecutiveErrors++;
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            console.error(
              "KB batch status polling failed too many times, stopping"
            );
            clearInterval(interval);
            setKbBatchJobId(null);
            setExtractingKBBatch(false);
            setError(
              "Bilgi tabanı oluşturma durumu alınamadı. İşlem arka planda devam ediyor olabilir."
            );
            return;
          }
          // Don't throw - just log and continue polling
          console.warn(
            `KB batch status polling failed (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
            res.status
          );
          return;
        }

        consecutiveErrors = 0; // Reset error counter on success
        const data = await res.json();
        setKbBatchStatus(data);

        if (data.status === "completed" || data.status === "failed") {
          clearInterval(interval);
          setKbBatchJobId(null);
          setExtractingKBBatch(false);

          if (data.status === "completed") {
            setSuccess(
              `Bilgi tabanı başarıyla oluşturuldu! (${data.processed_successfully}/${data.total_topics} konu işlendi)`
            );
            // Konu listesinde KB rozetleri güncellensin
            fetchTopics();
          } else {
            setError(
              `Bilgi tabanı oluşturma başarısız oldu: ${
                data.error || "Bilinmeyen hata"
              }`
            );
          }
        } else if (data.status === "running" || data.status === "processing") {
          // Show progress message
          setSuccess(
            `Bilgi tabanı oluşturuluyor... (${
              data.processed_successfully || 0
            }/${data.total_topics || 0} konu işlendi)`
          );
        }
      } catch (err: any) {
        consecutiveErrors++;
        console.error("KB batch status polling error:", err);

        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.error(
            "KB batch status polling failed too many times, stopping"
          );
          clearInterval(interval);
          setKbBatchJobId(null);
          setExtractingKBBatch(false);
          setError(
            "Bilgi tabanı oluşturma durumu alınamadı. İşlem arka planda devam ediyor olabilir."
          );
        }
        // Don't stop polling on first error - backend might still be processing
      }
    };

    interval = setInterval(pollStatus, 3000);

    // Poll immediately on mount
    pollStatus();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [kbBatchJobId, sessionId]);

  // KB: Load topic KB
  const loadTopicKB = async (topicId: number) => {
    try {
      const response = await fetch(`/api/aprag/knowledge/kb/${topicId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTopicKBData((prev) => ({
            ...prev,
            [topicId]: data.knowledge_base,
          }));
        }
      }
    } catch (e) {
      console.error("KB load failed:", e);
    }
  };

  // KB: Toggle topic expansion
  const toggleTopic = (topicId: number) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
      if (!topicKBData[topicId]) loadTopicKB(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  // Open KB detail modal (loads KB if needed)
  const openKBModal = async (topicId: number) => {
    try {
      setError(null);
      setKbModalQaPage(1);

      // Use cached data if available
      const existing = topicKBData[topicId];
      if (existing) {
        setKbModalTopicId(topicId);
        setKbModalData(existing);
        return;
      }

      const response = await fetch(`/api/aprag/knowledge/kb/${topicId}`);
      if (!response.ok) {
        throw new Error("Bu konu için bilgi tabanı bulunamadı");
      }
      const data = await response.json();
      if (data.success) {
        const kb = data.knowledge_base;
        setTopicKBData((prev) => ({ ...prev, [topicId]: kb }));
        setKbModalTopicId(topicId);
        setKbModalData(kb);
      } else {
        throw new Error("Bu konu için bilgi tabanı bulunamadı");
      }
    } catch (e: any) {
      console.error("KB modal load failed:", e);
      setError(e.message || "Bilgi tabanı yüklenemedi");
      setKbModalTopicId(null);
      setKbModalData(null);
    }
  };

  // Selective KB refresh function
  const refreshKBComponent = async (topicId: number, component: string) => {
    try {
      setRefreshingComponent({ topicId, component });
      setError(null);
      setSuccess(null);

      console.log(
        `🔄 [SELECTIVE REFRESH] Starting ${component} refresh for topic ${topicId}`
      );

      let endpoint = "";
      let successMessage = "";
      let componentDisplayName = "";

      switch (component) {
        case "summary":
          endpoint = `/api/aprag/knowledge/refresh-summary/${topicId}`;
          successMessage = "Özet başarıyla yenilendi ve modal güncellendi";
          componentDisplayName = "Özet";
          break;
        case "concepts":
          endpoint = `/api/aprag/knowledge/refresh-concepts/${topicId}`;
          successMessage =
            "Temel kavramlar başarıyla yenilendi ve modal güncellendi";
          componentDisplayName = "Kavramlar";
          break;
        case "objectives":
          endpoint = `/api/aprag/knowledge/refresh-objectives/${topicId}`;
          successMessage =
            "Öğrenme hedefleri başarıyla yenilendi ve modal güncellendi";
          componentDisplayName = "Öğrenme Hedefleri";
          break;
        case "qa":
          endpoint = `/api/aprag/knowledge/refresh-qa/${topicId}`;
          successMessage =
            "Soru-cevaplar başarıyla yenilendi ve modal güncellendi";
          componentDisplayName = "Soru-Cevap";
          break;
        case "all":
          endpoint = `/api/aprag/knowledge/refresh-all/${topicId}`;
          successMessage =
            "Tüm bilgi tabanı bileşenleri başarıyla yenilendi ve modal güncellendi";
          componentDisplayName = "Tüm Bileşenler";
          break;
        default:
          throw new Error("Geçersiz bileşen türü");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic_id: topicId,
          force_refresh: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText };
        }
        throw new Error(errorData.detail || "Yenileme başarısız oldu");
      }

      const data = await response.json();
      console.log(
        `📋 [SELECTIVE REFRESH] ${component} refresh response:`,
        data
      );

      if (!data.success) {
        throw new Error("Yenileme başarısız oldu");
      }

      // Auto-refresh KB data in UI and modal
      const kbRes = await fetch(`/api/aprag/knowledge/kb/${topicId}`);
      if (kbRes.ok) {
        const kbData = await kbRes.json();
        if (kbData.success) {
          const kb = kbData.knowledge_base;
          setTopicKBData((prev) => ({ ...prev, [topicId]: kb }));
          // If modal is open for this topic, update it immediately
          if (kbModalTopicId === topicId) {
            setKbModalData(kb);
            console.log(
              `✅ [MODAL AUTO-UPDATE] Modal data refreshed for topic ${topicId}, component: ${componentDisplayName}`
            );
          }
        }
      }

      setSuccess(`✅ ${successMessage}`);

      // Clear success message after 4 seconds for better UX
      setTimeout(() => {
        setSuccess(null);
      }, 4000);
    } catch (e: any) {
      console.error(`${component} refresh failed:`, e);
      setError(e.message || "Yenileme başarısız oldu");

      // Clear error message after 6 seconds
      setTimeout(() => {
        setError(null);
      }, 6000);
    } finally {
      setRefreshingComponent(null);
    }
  };

  // Legacy function for backward compatibility (now uses refresh-all)
  const regenerateKBForTopic = async (topicId: number) => {
    await refreshKBComponent(topicId, "all");
  };

  // Reorder topics using LLM
  const handleReorderTopics = async (criteria: "cognitive" | "proximity" | "hybrid" = "cognitive") => {
    try {
      setReorderingTopics(true);
      setError(null);
      setSuccess(null);
      
      const result = await reorderTopics(sessionId, criteria);
      
      if (result.success) {
        const criteriaText = criteria === "cognitive" ? "bilişsel sıraya" : criteria === "proximity" ? "yakınlığa" : "hibrit kriterlere";
        setSuccess(`Konular ${criteriaText} göre sıralandı!`);
        // Reload topics
        await fetchTopics();
      }
    } catch (err: any) {
      setError(err.message || "Konu sıralama başarısız oldu");
      console.error("Error reordering topics:", err);
    } finally {
      setReorderingTopics(false);
    }
  };

  // Calculate QA embeddings batch - ASYNC with polling!
  const handleCalculateQAEmbeddings = async () => {
    try {
      setCalculatingEmbeddings(true);
      setEmbeddingJobId(null);
      setEmbeddingProgress(null);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `/api/aprag/knowledge/qa-embeddings/calculate-batch/${sessionId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      // Try to parse response even if status is not ok - backend might have started the job
      let data;
      try {
        const responseText = await response.text();
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          // If JSON parsing fails, use text as error message
          throw new Error(responseText || "Embedding hesaplama başlatılamadı");
        }
      } catch (e: any) {
        // If reading response fails, throw the error
        throw new Error(e.message || "Embedding hesaplama başlatılamadı");
      }

      // If we got a job_id, start polling even if response.ok is false
      // (backend might have started the job but returned an error status)
      if (data.job_id) {
        setEmbeddingJobId(data.job_id);
        setSuccess(
          "🔄 QA embedding hesaplama arka planda başlatıldı. Lütfen bekleyin..."
        );
        // Don't set error - let polling handle the status
        pollEmbeddingStatus(data.job_id);
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || "Embedding hesaplama başlatılamadı");
      }

      if (data.success && data.job_id) {
        setEmbeddingJobId(data.job_id);
        setSuccess(
          "🔄 QA embedding hesaplama arka planda başlatıldı. Lütfen bekleyin..."
        );
        pollEmbeddingStatus(data.job_id);
      } else if (data.success && !data.job_id) {
        // No job_id means it completed immediately (no QA pairs to process)
        setSuccess(
          `✅ ${data.message || "Embedding hesaplama tamamlandı"}`
        );
        setCalculatingEmbeddings(false);
      } else {
        throw new Error(data.message || "Embedding hesaplama başlatılamadı");
      }
    } catch (e: any) {
      // Only show error if we don't have a job_id to poll
      if (!embeddingJobId) {
        setError(e.message || "QA embedding'leri hesaplanamadı");
        setCalculatingEmbeddings(false);
      } else {
        // If we have a job_id, just log the error but continue polling
        console.warn(
          "QA embedding start had an error but job_id exists, continuing to poll:",
          e.message
        );
      }
    }
  };

  // Poll embedding calculation status
  const pollEmbeddingStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/aprag/knowledge/qa-embeddings/calculate-batch/status/${jobId}`
        );

        if (response.ok) {
          const status = await response.json();

          // Update progress
          if (status.status === "running" || status.status === "processing") {
            setEmbeddingProgress({
              processed: status.processed || 0,
              total: status.total_qa_pairs || 0,
              current_batch: status.current_batch || 0,
              total_batches: status.total_batches || 0,
            });
            if (status.current_batch && status.total_batches) {
              setSuccess(
                `🔄 QA embedding hesaplanıyor... (Batch ${status.current_batch}/${status.total_batches} - ${status.processed}/${status.total_qa_pairs} QA pair)`
              );
            } else {
              setSuccess(
                `🔄 QA embedding hesaplanıyor... (${status.processed}/${status.total_qa_pairs} QA pair)`
              );
            }
          } else if (status.status === "completed") {
            clearInterval(pollInterval);
            setCalculatingEmbeddings(false);
            setSuccess(
              `✅ QA embedding hesaplama tamamlandı: ${status.processed}/${status.total_qa_pairs} QA pair`
            );
            setEmbeddingProgress({
              processed: status.processed || 0,
              total: status.total_qa_pairs || 0,
            });
            // Clear success message after 5 seconds
            setTimeout(() => {
              setSuccess(null);
              setEmbeddingProgress(null);
            }, 5000);
          } else if (status.status === "failed") {
            clearInterval(pollInterval);
            setCalculatingEmbeddings(false);
            setError(`❌ ${status.error || "QA embedding hesaplama başarısız"}`);
            setEmbeddingProgress(null);
          }
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 3000); // Poll every 3 seconds

    // Timeout after 30 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (calculatingEmbeddings) {
        setCalculatingEmbeddings(false);
        setError("⏰ İşlem çok uzun sürdü, lütfen sayfayı yenileyin");
      }
    }, 1800000);
  };

  // DEPRECATED: Old regenerate function - keeping for reference
  const _oldRegenerateKBForTopic = async (topicId: number) => {
    try {
      setRegeneratingKBTopicId(topicId);
      setError(null);
      setSuccess(null);

      console.log(`🔄 [DEBUG] Starting KB regeneration for topic ${topicId}`);

      // Mevcut KB'de soru-cevap var mı kontrol et (varsa tekrar üretmeyelim)
      let hadQaPairs = false;
      try {
        console.log(`🔍 [DEBUG] Checking existing KB for topic ${topicId}`);
        const existingRes = await fetch(`/api/aprag/knowledge/kb/${topicId}`);
        console.log(
          `📡 [DEBUG] Existing KB check response status: ${existingRes.status}`
        );
        if (existingRes.ok) {
          const existingData = await existingRes.json();
          if (
            existingData.success &&
            existingData.knowledge_base &&
            Array.isArray(existingData.knowledge_base.qa_pairs) &&
            existingData.knowledge_base.qa_pairs.length > 0
          ) {
            hadQaPairs = true;
          }
        }
      } catch (e) {
        console.warn("Existing KB check failed for topic", topicId, e);
      }

      console.log(
        `🚀 [DEBUG] Making KB extraction API call for topic ${topicId}`
      );
      const response = await fetch(`/api/aprag/knowledge/extract/${topicId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic_id: topicId,
          force_refresh: true,
        }),
      });

      console.log(
        `📡 [DEBUG] KB extraction response status: ${response.status}`
      );

      if (!response.ok) {
        console.error(
          `❌ [DEBUG] KB extraction failed with status ${response.status}`
        );
        const errorText = await response.text();
        console.error(`❌ [DEBUG] Response body: ${errorText}`);
        const errorData = JSON.parse(errorText).catch(() => ({
          detail: errorText,
        }));
        throw new Error(
          errorData.detail || "Özet / bilgi tabanı yeniden üretilemedi"
        );
      }

      const data = await response.json();
      console.log(`📋 [DEBUG] KB extraction response data:`, data);

      if (!data.success) {
        console.error(`❌ [DEBUG] KB extraction returned success=false:`, data);
        throw new Error("Özet / bilgi tabanı yeniden üretilemedi");
      }

      // Eğer bu konu için daha önce hiç soru yoksa, şimdi üret
      if (!hadQaPairs) {
        try {
          const qaRes = await fetch(
            `/api/aprag/knowledge/generate-qa/${topicId}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                topic_id: topicId,
                count: 15,
              }),
            }
          );
          if (!qaRes.ok) {
            console.warn("QA generation failed for topic", topicId);
          }
        } catch (qaErr) {
          console.warn("QA generation error for topic", topicId, qaErr);
        }
      }

      // KB kaydını taze çek
      const kbRes = await fetch(`/api/aprag/knowledge/kb/${topicId}`);
      if (kbRes.ok) {
        const kbData = await kbRes.json();
        if (kbData.success) {
          const kb = kbData.knowledge_base;
          setTopicKBData((prev) => ({ ...prev, [topicId]: kb }));
          if (kbModalTopicId === topicId) {
            setKbModalData(kb);
          }
        }
      }

      setSuccess(
        hadQaPairs
          ? "Seçili konu için özet ve kavramlar başarıyla yeniden üretildi (mevcut sorular korundu)."
          : "Seçili konu için özet, kavramlar ve soru-cevaplar başarıyla üretildi (Türkçe)."
      );
    } catch (e: any) {
      console.error("KB regenerate failed:", e);
      setError(e.message || "Özet / bilgi tabanı yeniden üretilemedi");
    } finally {
      setRegeneratingKBTopicId(null);
    }
  };

  // Load topics on mount
  useEffect(() => {
    if (sessionId && apragEnabled) {
      fetchTopics();
    }
  }, [sessionId, apragEnabled]);

  if (!apragEnabled) {
    return null;
  }

  // Get main topics (without parents) for pagination and stats
  const mainTopics = topics
    .filter((t) => !t.parent_topic_id)
    .sort((a, b) => a.topic_order - b.topic_order);
  const totalPages = Math.ceil(mainTopics.length / TOPICS_PER_PAGE);
  const paginatedTopics = mainTopics.slice(
    (topicPage - 1) * TOPICS_PER_PAGE,
    topicPage * TOPICS_PER_PAGE
  );

  // Debug logging
  console.log(
    `[TopicManagement DEBUG] Total topics from API: ${topics.length}`
  );
  console.log(
    `[TopicManagement DEBUG] Main topics (no parent): ${mainTopics.length}`
  );
  console.log(
    `[TopicManagement DEBUG] Paginated topics showing: ${paginatedTopics.length}`
  );
  console.log(
    `[TopicManagement DEBUG] Current page: ${topicPage}/${totalPages}`
  );
  console.log(`[TopicManagement DEBUG] Topics per page: ${TOPICS_PER_PAGE}`);
  console.log(
    "[TopicManagement DEBUG] All topics:",
    topics.map((t) => ({
      id: t.topic_id,
      title: t.topic_title,
      parent: t.parent_topic_id,
    }))
  );
  console.log(
    "[TopicManagement DEBUG] Main topics:",
    mainTopics.map((t) => ({ id: t.topic_id, title: t.topic_title }))
  );
  console.log(
    "[TopicManagement DEBUG] Paginated topics:",
    paginatedTopics.map((t) => ({ id: t.topic_id, title: t.topic_title }))
  );

  return (
    <div>
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Aggressive option styling - highest priority */
          select.topic-action-select option,
          .topic-action-select option,
          select option,
          option {
            color: #1f2937 !important;
            background-color: #ffffff !important;
            background: #ffffff !important;
          }
          select.topic-action-select option:disabled,
          .topic-action-select option:disabled,
          select option:disabled,
          option:disabled {
            color: #9ca3af !important;
            background-color: #ffffff !important;
            background: #ffffff !important;
          }
          /* Force all options in this select */
          select.topic-action-select > option {
            color: #1f2937 !important;
            background: #ffffff !important;
          }
        `
      }} />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            🧠 Konu & Bilgi Tabanı Yönetimi
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {mainTopics.length} ana konu
            {totalPages > 1 && ` • Sayfa ${topicPage}/${totalPages}`}
            {" • Tüm Döküman Analizi (%100)"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleOpenExtractModal}
            disabled={extracting || topics.length === 0}
            className="py-2 px-3 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            title="Belgelerden konuları çıkar"
          >
            {extracting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Çıkarılıyor...</span>
              </>
            ) : (
              <span>📋 Konuları Çıkar (Gelişmiş)</span>
            )}
          </button>
          <button
            onClick={() => handleOpenKBExtractModal("all")}
            disabled={extractingKBBatch || topics.length === 0}
            className="py-2 px-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md text-sm font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            title="Tüm konular için bilgi tabanı ve soru-cevaplar oluştur"
          >
            {extractingKBBatch ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Oluşturuluyor...</span>
              </>
            ) : (
              <span>🧠 Bilgi Tabanı Oluştur</span>
            )}
          </button>
          <button
            onClick={handleCalculateQAEmbeddings}
            disabled={calculatingEmbeddings || topics.length === 0}
            className="py-2 px-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-md text-sm font-medium hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            title="QA embedding'leri hesapla"
          >
            {calculatingEmbeddings ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Hesaplanıyor...</span>
              </>
            ) : (
              <span>🔢 QA Embedding Hesapla</span>
            )}
          </button>
          <button
            onClick={() => handleReorderTopics("cognitive")}
            disabled={reorderingTopics || topics.length < 2}
            className="py-2 px-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-md text-sm font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            title="Konuları bilişsel sıraya göre sırala"
          >
            {reorderingTopics ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Sıralanıyor...</span>
              </>
            ) : (
              <span>🔄 Bilişsel Sıraya Göre Sırala</span>
            )}
          </button>
          <button
            onClick={() => handleReorderTopics("proximity")}
            disabled={reorderingTopics || topics.length < 2}
            className="py-2 px-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-md text-sm font-medium hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            title="Konuları yakınlığa göre sırala"
          >
            {reorderingTopics ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Sıralanıyor...</span>
              </>
            ) : (
              <span>🔗 Yakınlığa Göre Sırala</span>
            )}
          </button>
          <button
            onClick={() => handleReorderTopics("hybrid")}
            disabled={reorderingTopics || topics.length < 2}
            className="py-2 px-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-md text-sm font-medium hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            title="Konuları hibrit yöntemle sırala"
          >
            {reorderingTopics ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Sıralanıyor...</span>
              </>
            ) : (
              <span>🎯 Hibrit Sıralama</span>
            )}
          </button>
        </div>
      </div>

      <div>
        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
            <p className="text-sm text-green-800 dark:text-green-200">
              {success}
            </p>
            {extractingKBBatch && kbBatchStatus && (
              <p className="mt-1 text-xs text-muted-foreground">
                KB oluşturma ilerliyor: {kbBatchStatus.processed_successfully}/
                {kbBatchStatus.total_topics} konu işlendi
                {kbBatchStatus.current_topic_title
                  ? ` • Şu an: ${kbBatchStatus.current_topic_title}`
                  : ""}
              </p>
            )}
            {embeddingProgress && (
              <p className="mt-1 text-xs text-muted-foreground">
                Embedding hesaplama: {embeddingProgress.processed}/
                {embeddingProgress.total} QA pair işlendi
              </p>
            )}
          </div>
        )}

        {/* Topics List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mb-3"></div>
            <p className="text-sm text-muted-foreground">Yükleniyor...</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground mb-1">
              Henüz konu çıkarılmamış
            </p>
            <p className="text-xs text-muted-foreground">
              "Konuları Çıkar" butonuna tıklayarak başlayın
            </p>
          </div>
        ) : (
          <>
            {/* Top Pagination (so it's always visible) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end mb-3 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTopicPage((p) => Math.max(1, p - 1))}
                    disabled={topicPage === 1}
                    className="py-1 px-2 sm:px-3 rounded border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Önceki
                  </button>
                  <button
                    onClick={() =>
                      setTopicPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={topicPage >= totalPages}
                    className="py-1 px-2 sm:px-3 rounded border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {paginatedTopics.map((topic) => {
                const subtopics = topics.filter(
                  (t) => t.parent_topic_id === topic.topic_id
                );
                const isExpanded = expandedTopics.has(topic.topic_id);
                const kb = topicKBData[topic.topic_id];
                return (
                  <div
                    key={topic.topic_id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            #{topic.topic_order}
                          </span>
                          <h3 className="text-base font-semibold text-foreground">
                            {topic.topic_title}
                          </h3>
                          {kb && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              ✨ KB
                            </span>
                          )}
                          {topic.estimated_difficulty && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                topic.estimated_difficulty === "beginner"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                  : topic.estimated_difficulty ===
                                    "intermediate"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                              }`}
                            >
                              {topic.estimated_difficulty === "beginner"
                                ? "Başlangıç"
                                : topic.estimated_difficulty === "intermediate"
                                ? "Orta"
                                : "İleri"}
                            </span>
                          )}
                        </div>
                        {topic.description && (
                          <p className="text-sm text-muted-foreground mt-1.5">
                            {topic.description}
                          </p>
                        )}
                        {topic.keywords && topic.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {topic.keywords.map((keyword, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}
                        {isExpanded && subtopics.length > 0 && (
                          <div className="mt-4 p-3 bg-muted/30 rounded-lg border">
                            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                              📋 Alt Konular ({subtopics.length})
                            </p>
                            <div className="space-y-2">
                              {subtopics
                                .sort((a, b) => a.topic_order - b.topic_order)
                                .map((subtopic) => (
                                  <div
                                    key={subtopic.topic_id}
                                    className="flex items-start gap-3 p-2 bg-background rounded border hover:bg-muted/50 transition-colors"
                                  >
                                    <span className="text-xs font-medium text-muted-foreground bg-primary/10 px-2 py-1 rounded min-w-0 shrink-0">
                                      #{subtopic.topic_order}
                                    </span>
                                    <span className="text-sm font-medium text-foreground flex-1">
                                      {subtopic.topic_title}
                                    </span>
                                    {subtopic.keywords &&
                                      subtopic.keywords.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {subtopic.keywords
                                            .slice(0, 2)
                                            .map((keyword, idx) => (
                                              <span
                                                key={idx}
                                                className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded"
                                              >
                                                {keyword}
                                              </span>
                                            ))}
                                        </div>
                                      )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleTopic(topic.topic_id)}
                          className="flex-shrink-0 px-2 py-1.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          title={isExpanded ? "Gizle" : "Detayları Gör"}
                        >
                          {isExpanded ? "▲ Gizle" : "▼ Detay"}
                        </button>
                        {/* SADECE KB varsa KB Detay butonu göster */}
                        {kb && (
                          <button
                            onClick={() => openKBModal(topic.topic_id)}
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors"
                            title="Bu konu için bilgi tabanı detayını gör ve seçici yenileme yap"
                          >
                            📋 KB Detay
                          </button>
                        )}
                        {/* KB yoksa KB Oluştur butonu göster */}
                        {!kb && (
                          <button
                            onClick={() =>
                              refreshKBComponent(topic.topic_id, "all")
                            }
                            disabled={
                              refreshingComponent?.topicId === topic.topic_id ||
                              regeneratingKBTopicId === topic.topic_id
                            }
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Bu konu için bilgi tabanı oluştur"
                          >
                            {refreshingComponent?.topicId === topic.topic_id ||
                            regeneratingKBTopicId === topic.topic_id
                              ? "KB İşleniyor..."
                              : "✨ KB Oluştur"}
                          </button>
                        )}
                        <button
                          onClick={() => setEditingTopic(topic)}
                          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                          title="Düzenle"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteTopic(topic.topic_id, topic.topic_title)
                          }
                          className="flex-shrink-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title="Sil"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {isExpanded && kb && (
                      <div className="mt-3 p-3 bg-background/50 rounded border-t space-y-2">
                        {kb.topic_summary && (
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                            <strong className="text-blue-900 dark:text-blue-100">
                              📝 Özet:
                            </strong>
                            <p className="text-blue-800 dark:text-blue-200 mt-1">
                              {String(kb.topic_summary).substring(0, 400)}
                              {String(kb.topic_summary).length > 400
                                ? "..."
                                : ""}
                            </p>
                          </div>
                        )}
                        {kb.key_concepts && kb.key_concepts.length > 0 && (
                          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-xs">
                            <strong className="text-purple-900 dark:text-purple-100">
                              💡 Kavramlar ({kb.key_concepts.length}):
                            </strong>
                            <div className="mt-1 space-y-1">
                              {kb.key_concepts
                                .slice(0, 5)
                                .map((c: any, i: number) => (
                                  <div key={i}>
                                    <strong>{String(c.term)}:</strong>{" "}
                                    {String(c.definition ?? "")}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                        {kb.qa_pairs && kb.qa_pairs.length > 0 && (
                          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                            <strong className="text-green-900 dark:text-green-100">
                              ❓ Soru-Cevaplar ({kb.qa_pairs.length}):
                            </strong>
                            <div className="mt-1 space-y-1">
                              {kb.qa_pairs
                                .slice(0, 3)
                                .map((qa: any, i: number) => {
                                  const questionText =
                                    typeof qa.question === "string"
                                      ? qa.question
                                      : JSON.stringify(qa.question);
                                  const answerText =
                                    typeof qa.answer === "string"
                                      ? qa.answer
                                      : qa.answer
                                      ? JSON.stringify(qa.answer)
                                      : "";
                                  return (
                                    <div key={i}>
                                      <div>
                                        <strong>S:</strong> {questionText}
                                      </div>
                                      {answerText && (
                                        <div>
                                          <strong>C:</strong> {answerText}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => setTopicPage((p) => Math.max(1, p - 1))}
                  disabled={topicPage === 1}
                  className="py-1.5 px-3 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Önceki
                </button>
                <span className="text-sm text-muted-foreground">
                  Sayfa {topicPage} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setTopicPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={topicPage >= totalPages}
                  className="py-1.5 px-3 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sonraki
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editingTopic && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Konu Düzenle
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdateTopic(editingTopic.topic_id, {
                  topic_title: formData.get("title") as string,
                  description: formData.get("description") as string,
                  topic_order: parseInt(formData.get("order") as string),
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Konu Başlığı
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingTopic.topic_title}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Açıklama
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingTopic.description || ""}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Sıra
                  </label>
                  <input
                    type="number"
                    name="order"
                    defaultValue={editingTopic.topic_order}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTopic(null)}
                  className="flex-1 py-2 px-4 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KB Extraction Modal */}
      {showKBExtractModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Bilgi Tabanı Oluşturma Ayarları
              </h3>
              <button
                onClick={() => setShowKBExtractModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  className="w-5 h-5"
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
            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sistem Prompt
                </label>
                <textarea
                  value={kbSystemPrompt}
                  onChange={(e) => setKbSystemPrompt(e.target.value)}
                  placeholder="Bilgi tabanı oluşturma için sistem prompt'u girin..."
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary min-h-[120px]"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Bu prompt, bilgi tabanı oluşturma sırasında LLM'e gönderilecek. Özet, kavramlar, öğrenme hedefleri ve soru-cevapların nasıl oluşturulacağını belirler.
                </p>
              </div>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-border">
              <button
                onClick={kbExtractType === "all" ? handleExtractKBBatch : handleExtractKBBatchMissing}
                disabled={extractingKBBatch}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md text-sm font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
              >
                {extractingKBBatch ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Oluşturuluyor...</span>
                  </>
                ) : (
                  <span>Bilgi Tabanı Oluştur</span>
                )}
              </button>
              <button
                onClick={() => setShowKBExtractModal(false)}
                disabled={extractingKBBatch}
                className="flex-1 py-2 px-4 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topic Extraction Modal */}
      {showExtractModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Konu Çıkarma Ayarları
              </h3>
              <button
                onClick={() => setShowExtractModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  className="w-5 h-5"
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
            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sistem Prompt
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Konu çıkarımı için sistem prompt'u girin..."
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary min-h-[120px]"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Bu prompt, konu çıkarımı sırasında LLM'e gönderilecek. Konuların nasıl çıkarılacağını belirler.
                </p>
              </div>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-border">
              <button
                onClick={handleExtractTopics}
                disabled={extracting}
                className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
              >
                {extracting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Çıkarılıyor...</span>
                  </>
                ) : (
                  <span>Konuları Çıkar</span>
                )}
              </button>
              <button
                onClick={() => setShowExtractModal(false)}
                disabled={extracting}
                className="flex-1 py-2 px-4 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KB Detail Modal */}
      {kbModalTopicId && kbModalData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  KB Detayı -{" "}
                  {
                    topics.find((t) => t.topic_id === kbModalTopicId)
                      ?.topic_title
                  }
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Özet, kavramlar, öğrenme hedefleri ve soru-cevaplar
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Selective Refresh Dropdown */}
                <div className="relative group">
                  <button
                    disabled={refreshingComponent?.topicId === kbModalTopicId}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                  >
                    {refreshingComponent?.topicId === kbModalTopicId
                      ? `${
                          refreshingComponent.component === "summary"
                            ? "Özet"
                            : refreshingComponent.component === "concepts"
                            ? "Kavramlar"
                            : refreshingComponent.component === "objectives"
                            ? "Hedefler"
                            : refreshingComponent.component === "qa"
                            ? "Soru-Cevap"
                            : "KB"
                        } Yenileniyor...`
                      : "Yenile"}
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-1">
                      <button
                        onClick={() =>
                          refreshKBComponent(
                            kbModalTopicId as number,
                            "summary"
                          )
                        }
                        disabled={
                          refreshingComponent?.topicId === kbModalTopicId
                        }
                        className="w-full text-left px-3 py-2 text-xs rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                      >
                        📝 Özet Yenile
                      </button>
                      <button
                        onClick={() =>
                          refreshKBComponent(
                            kbModalTopicId as number,
                            "concepts"
                          )
                        }
                        disabled={
                          refreshingComponent?.topicId === kbModalTopicId
                        }
                        className="w-full text-left px-3 py-2 text-xs rounded hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50"
                      >
                        💡 Temel Kavramlar Yenile
                      </button>
                      <button
                        onClick={() =>
                          refreshKBComponent(
                            kbModalTopicId as number,
                            "objectives"
                          )
                        }
                        disabled={
                          refreshingComponent?.topicId === kbModalTopicId
                        }
                        className="w-full text-left px-3 py-2 text-xs rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
                      >
                        🎯 Öğrenme Hedefleri Yenile
                      </button>
                      <button
                        onClick={() =>
                          refreshKBComponent(kbModalTopicId as number, "qa")
                        }
                        disabled={
                          refreshingComponent?.topicId === kbModalTopicId
                        }
                        className="w-full text-left px-3 py-2 text-xs rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                      >
                        ❓ Soru-Cevap Yenile
                      </button>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={() =>
                          refreshKBComponent(kbModalTopicId as number, "all")
                        }
                        disabled={
                          refreshingComponent?.topicId === kbModalTopicId
                        }
                        className="w-full text-left px-3 py-2 text-xs rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 font-medium"
                      >
                        🔄 Tümünü Yenile
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setKbModalTopicId(null);
                    setKbModalData(null);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  ✕ Kapat
                </button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4 overflow-y-auto">
              {/* Summary */}
              {kbModalData.topic_summary && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    📝 Özet
                  </h4>
                  <p className="text-blue-800 dark:text-blue-200 whitespace-pre-line">
                    {String(kbModalData.topic_summary)}
                  </p>
                </div>
              )}

              {/* Concepts */}
              {kbModalData.key_concepts &&
                kbModalData.key_concepts.length > 0 && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md text-sm">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                      💡 Temel Kavramlar ({kbModalData.key_concepts.length})
                    </h4>
                    <div className="space-y-1.5">
                      {kbModalData.key_concepts.map((c: any, idx: number) => (
                        <div key={idx}>
                          <span className="font-semibold">
                            {String(c.term)}:
                          </span>{" "}
                          <span>{String(c.definition ?? "")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Learning Objectives */}
              {kbModalData.learning_objectives &&
                kbModalData.learning_objectives.length > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md text-sm">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                      🎯 Öğrenme Hedefleri (
                      {kbModalData.learning_objectives.length})
                    </h4>
                    <div className="space-y-1.5">
                      {kbModalData.learning_objectives.map(
                        (obj: any, idx: number) => (
                          <div key={idx}>
                            <span className="font-semibold">
                              [{obj.level}]{" "}
                            </span>
                            <span>{String(obj.objective ?? "")}</span>
                            {obj.assessment_method && (
                              <span className="text-xs text-muted-foreground">
                                {" "}
                                • Ölçme: {obj.assessment_method}
                              </span>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* QA Pairs with pagination */}
              {kbModalData.qa_pairs && kbModalData.qa_pairs.length > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-900 dark:text-green-100">
                      ❓ Soru-Cevaplar ({kbModalData.qa_pairs.length})
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      Sayfa {kbModalQaPage} /{" "}
                      {Math.max(1, Math.ceil(kbModalData.qa_pairs.length / 5))}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {kbModalData.qa_pairs
                      .slice((kbModalQaPage - 1) * 5, kbModalQaPage * 5)
                      .map((qa: any, idx: number) => {
                        const difficultyRaw = (
                          qa.difficulty_level ||
                          qa.difficulty ||
                          ""
                        ).toString();
                        const difficultyTr =
                          difficultyRaw.toLowerCase() === "beginner"
                            ? "Başlangıç"
                            : difficultyRaw.toLowerCase() === "intermediate"
                            ? "Orta"
                            : difficultyRaw.toLowerCase() === "advanced"
                            ? "İleri"
                            : difficultyRaw;
                        const questionText =
                          typeof qa.question === "string"
                            ? qa.question
                            : JSON.stringify(qa.question);
                        const answerText =
                          typeof qa.answer === "string"
                            ? qa.answer
                            : qa.answer
                            ? JSON.stringify(qa.answer)
                            : "";
                        return (
                          <div
                            key={idx}
                            className="border border-green-200 dark:border-green-800 rounded px-3 py-2 bg-white/60 dark:bg-green-950/40"
                          >
                            <div className="text-xs text-muted-foreground mb-1">
                              {qa.difficulty_level && (
                                <span className="mr-2 font-semibold">
                                  Zorluk:{" "}
                                  <span className="underline">
                                    {difficultyTr}
                                  </span>
                                </span>
                              )}
                              {qa.bloom_taxonomy_level && (
                                <span>Bloom: {qa.bloom_taxonomy_level}</span>
                              )}
                            </div>
                            <div>
                              <strong>S:</strong> {questionText}
                            </div>
                            {answerText && (
                              <div className="mt-1">
                                <strong>C:</strong> {answerText}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() =>
                        setKbModalQaPage((p) => Math.max(1, p - 1))
                      }
                      disabled={kbModalQaPage === 1}
                      className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Önceki
                    </button>
                    <button
                      onClick={() =>
                        setKbModalQaPage((p) =>
                          Math.min(
                            Math.ceil(kbModalData.qa_pairs.length / 5),
                            p + 1
                          )
                        )
                      }
                      disabled={
                        kbModalQaPage >=
                        Math.ceil(kbModalData.qa_pairs.length / 5)
                      }
                      className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicManagementPanel;
