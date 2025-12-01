"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle, ArrowRight, RefreshCw } from "lucide-react";

interface Question {
  index: number;
  question: string;
  correct_answer: string;
  options?: Record<string, string>;
  type?: string;
  difficulty?: string;
  student_answer?: string;
  correct?: boolean;
  score?: number;
}

interface Topic {
  question_index: number;
  question: string;
  question_object: Question;
}

interface LeveledAnswer {
  text: string;
  characteristics: string[];
}

interface LeveledAnswers {
  very_struggling: LeveledAnswer;
  struggling: LeveledAnswer;
  normal: LeveledAnswer;
  good: LeveledAnswer;
  excellent: LeveledAnswer;
}

type TestStage = "questions" | "answer_preference" | "completed";
type AnswerLevel = "very_struggling" | "struggling" | "normal" | "good" | "excellent";

export default function CognitiveTestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  // Stage 1: Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [needsRetry, setNeedsRetry] = useState(false);

  // Stage 2: Answer Preference
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicAnswers, setTopicAnswers] = useState<Record<number, LeveledAnswers>>({});
  const [selectedLevels, setSelectedLevels] = useState<Record<number, AnswerLevel>>({});
  const [loadingAnswers, setLoadingAnswers] = useState<Record<number, boolean>>({});

  // General state
  const [stage, setStage] = useState<TestStage>("questions");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState<{ score: number; level: string } | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    if (!user || !sessionId) {
      router.push("/student/chat");
      return;
    }

    // Check if EBARS is enabled for this session
    const checkEbarsStatus = async () => {
      try {
        const response = await fetch(`/api/aprag/session-settings/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          const ebarsEnabled = data?.settings?.enable_ebars || false;
          
          if (!ebarsEnabled) {
            // EBARS not enabled, redirect back
            router.push("/student/chat");
            return;
          }
          
          // EBARS enabled, show intro first
          setLoading(false);
          setShowIntro(true);
        } else {
          // Failed to check EBARS status, redirect back
          router.push("/student/chat");
        }
      } catch (err) {
        console.error("Failed to check EBARS status:", err);
        router.push("/student/chat");
      }
    };

    checkEbarsStatus();
  }, [user, sessionId, router, attempt]);

  const loadTest = async (testAttempt: number = 1, autoReset: boolean = false) => {
    if (!user || !sessionId) {
      router.push("/student/chat");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setNeedsRetry(false);

      const response = await fetch(
        `/api/aprag/ebars/generate-initial-test/${user.id}/${sessionId}?attempt=${testAttempt}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        // If test already completed and we haven't tried resetting yet, reset and retry
        if (errorData.detail && errorData.detail.includes("already been completed") && !autoReset) {
          if (!user || !sessionId) {
            router.push("/student/chat");
            return;
          }
          
          try {
            // Reset the test first
            const resetResponse = await fetch(
              `/api/aprag/ebars/reset-initial-test/${user.id}/${sessionId}`,
              { method: "POST" }
            );
            
            if (resetResponse.ok) {
              // Retry loading test after reset
              await loadTest(testAttempt, true);
              return;
            } else {
              throw new Error("Test sıfırlanamadı");
            }
          } catch (resetErr: any) {
            console.error("Error resetting test:", resetErr);
            throw new Error("Test sıfırlanırken bir hata oluştu: " + resetErr.message);
          }
        }
        
        throw new Error(errorData.detail || "Test yüklenemedi");
      }

      const data = await response.json();
      if (data.success && data.questions) {
        setQuestions(data.questions);
        setAnswers({});
        setCurrentQuestionIndex(0);
        setStage("questions");
      } else {
        throw new Error("Test soruları alınamadı");
      }
    } catch (err: any) {
      console.error("Error loading test:", err);
      setError(err.message || "Test yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleSubmitQuestions = async () => {
    if (!user || !sessionId) {
      router.push("/student/chat");
      return;
    }

    if (Object.keys(answers).length < questions.length) {
      if (
        !confirm(
          "Tüm soruları cevaplamadınız. Yine de testi tamamlamak istiyor musunuz?"
        )
      ) {
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const answerList = Object.entries(answers).map(([index, answer]) => ({
        question_index: parseInt(index),
        answer: answer || "",
      }));

      const response = await fetch(`/api/aprag/ebars/submit-initial-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id.toString(),
          session_id: sessionId,
          answers: answerList,
          attempt: attempt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Test gönderilemedi");
      }

      const data = await response.json();
      
      if (data.needs_retry) {
        // Retry with new questions
        setNeedsRetry(true);
        setAttempt(data.next_attempt);
        setTimeout(() => {
          loadTest(data.next_attempt);
        }, 2000);
        return;
      }

      if (data.needs_answer_preference) {
        // Move to answer preference stage
        await loadTopics(data.correct_question_indices || []);
        return;
      }

      // Old flow (shouldn't happen with new system)
      setFinalScore({
        score: data.initial_comprehension_score || 50,
        level: data.initial_difficulty_level || "normal",
      });
      setStage("completed");
    } catch (err: any) {
      console.error("Error submitting test:", err);
      setError(err.message || "Test gönderilirken bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const loadTopics = async (correctIndices: number[]) => {
    if (!user || !sessionId) {
      router.push("/student/chat");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/aprag/ebars/extract-topics-from-answers/${user.id}/${sessionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id.toString(),
            session_id: sessionId,
            correct_question_indices: correctIndices,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Konular yüklenemedi");
      }

      const data = await response.json();
      if (data.success && data.topics) {
        setTopics(data.topics);
        setStage("answer_preference");
        
        // Load answers for each topic
        for (const topic of data.topics) {
          await loadLeveledAnswers(topic);
        }
      } else {
        throw new Error("Konular alınamadı");
      }
    } catch (err: any) {
      console.error("Error loading topics:", err);
      setError(err.message || "Konular yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const loadLeveledAnswers = async (topic: Topic) => {
    if (!user || !sessionId) {
      return;
    }

    try {
      setLoadingAnswers((prev) => ({ ...prev, [topic.question_index]: true }));

      // Get chunk content for this topic from session chunks
      let topicContent = `Konu: ${topic.question}`;
      
      // Try to fetch relevant chunk content
      try {
        const chunksResponse = await fetch(
          `/api/document-processing/sessions/${sessionId}/chunks`
        );
        if (chunksResponse.ok) {
          const chunksData = await chunksResponse.json();
          const chunks = chunksData.chunks || [];
          
          // Find relevant chunk for this topic/question
          const relevantChunk = chunks.find((chunk: any) => {
            const chunkText = chunk.chunk_text || chunk.content || chunk.text || '';
            return chunkText.toLowerCase().includes(topic.question.toLowerCase().substring(0, 20));
          });
          
          if (relevantChunk) {
            const chunkText = relevantChunk.chunk_text || relevantChunk.content || relevantChunk.text || '';
            topicContent = chunkText.substring(0, 2000); // Limit to 2000 chars
          }
        }
      } catch (e) {
        // Fallback to question text if chunk fetch fails
        console.warn(`Could not fetch chunks for topic ${topic.question_index}:`, e);
      }

      const response = await fetch(`/api/aprag/ebars/generate-leveled-answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id.toString(),
          session_id: sessionId,
          topic_question: topic.question_object,
          topic_content: topicContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Cevaplar üretilemedi");
      }

      const data = await response.json();
      if (data.success && data.answers) {
        setTopicAnswers((prev) => ({
          ...prev,
          [topic.question_index]: data.answers,
        }));
      }
    } catch (err: any) {
      console.error(`Error loading answers for topic ${topic.question_index}:`, err);
      setError(err.message || "Cevaplar yüklenirken bir hata oluştu");
    } finally {
      setLoadingAnswers((prev) => ({ ...prev, [topic.question_index]: false }));
    }
  };

  const handleLevelSelect = (topicIndex: number, level: AnswerLevel) => {
    setSelectedLevels((prev) => ({
      ...prev,
      [topicIndex]: level,
    }));
  };

  const handleSubmitPreferences = async () => {
    if (!user || !sessionId) {
      router.push("/student/chat");
      return;
    }

    if (Object.keys(selectedLevels).length < topics.length) {
      alert("Lütfen tüm konular için size uygun cevabı seçin.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const topicPreferences = topics.map((topic) => ({
        topic_index: topic.question_index,
        question_index: topic.question_index,
        selected_level: selectedLevels[topic.question_index] || "normal",
      }));

      const response = await fetch(`/api/aprag/ebars/submit-answer-preference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id.toString(),
          session_id: sessionId,
          topic_preferences: topicPreferences,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Tercihler kaydedilemedi");
      }

      const data = await response.json();
      if (data.success) {
        setFinalScore({
          score: data.initial_comprehension_score,
          level: data.initial_difficulty_level,
        });
        setStage("completed");
      } else {
        throw new Error("Tercihler kaydedilemedi");
      }
    } catch (err: any) {
      console.error("Error submitting preferences:", err);
      setError(err.message || "Tercihler gönderilirken bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    router.push(`/student/chat?sessionId=${sessionId}`);
  };

  const getLevelLabel = (level: AnswerLevel) => {
    const labels: Record<AnswerLevel, { label: string; color: string; emoji: string }> = {
      very_struggling: { label: "Çok Zorlanıyor", color: "text-red-600 bg-red-50 border-red-200", emoji: "😰" },
      struggling: { label: "Zorlanıyor", color: "text-orange-600 bg-orange-50 border-orange-200", emoji: "😓" },
      normal: { label: "Normal", color: "text-blue-600 bg-blue-50 border-blue-200", emoji: "😐" },
      good: { label: "İyi", color: "text-green-600 bg-green-50 border-green-200", emoji: "😊" },
      excellent: { label: "Mükemmel", color: "text-purple-600 bg-purple-50 border-purple-200", emoji: "🎯" },
    };
    return labels[level];
  };

  const getDifficultyLabel = (level: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      very_struggling: { label: "Çok Zorlanıyor", color: "text-red-600" },
      struggling: { label: "Zorlanıyor", color: "text-orange-600" },
      normal: { label: "Normal", color: "text-blue-600" },
      good: { label: "İyi", color: "text-green-600" },
      excellent: { label: "Mükemmel", color: "text-purple-600" },
    };
    return labels[level] || { label: level, color: "text-gray-600" };
  };

  const handleStartTest = async () => {
    setShowIntro(false);
    setLoading(true);
    await loadTest(attempt);
  };

  // Intro Screen
  if (showIntro && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 text-center">
            {/* Icon */}
            <div className="mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <span className="text-5xl">🧠</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              EBARS Bilişsel Test
            </h1>

            {/* Description */}
            <div className="space-y-4 mb-8">
              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
                Size özel algı puanınızı belirlemek için <strong className="text-blue-600">2 aşamalı</strong> bir değerlendirme gerçekleştiriyoruz.
              </p>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 text-left mt-6">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <span>Test Süreci:</span>
                </h3>
                <ol className="space-y-2 text-gray-700 text-sm sm:text-base">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 mt-0.5">1.</span>
                    <span>İlk aşamada, konuyla ilgili soruları cevaplayacaksınız.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 mt-0.5">2.</span>
                    <span>İkinci aşamada, farklı zorluk seviyelerindeki cevaplardan size en uygun olanı seçeceksiniz.</span>
                  </li>
                </ol>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-indigo-800">
                  <strong>💡 Not:</strong> Bu test, sistemin size en uygun zorluk seviyesinde cevaplar üretmesi için gereklidir. 
                  Lütfen soruları dikkatlice okuyup, samimi cevaplar verin.
                </p>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartTest}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-3 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span>Teste Başla</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Back Button */}
            <button
              onClick={() => router.push(`/student/chat?sessionId=${sessionId}`)}
              className="mt-4 text-gray-600 hover:text-gray-800 text-sm transition-colors"
            >
              ← Chat sayfasına dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && stage === "questions") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Test hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  if (error && stage !== "completed") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Hata</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push(`/student/chat?sessionId=${sessionId}`)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Chat Sayfasına Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (needsRetry) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <RefreshCw className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Yeni Sorular Hazırlanıyor</h2>
            <p className="text-gray-600 mb-4">
              Hiçbir soruyu doğru cevaplayamadınız. Farklı konulardan yeni sorular üretiliyor...
            </p>
            <p className="text-sm text-gray-500">Deneme: {attempt} / 3</p>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "completed" && finalScore) {
    const difficulty = getDifficultyLabel(finalScore.level);
    const scoreColor =
      finalScore.score >= 80
        ? "text-green-600"
        : finalScore.score >= 60
        ? "text-blue-600"
        : finalScore.score >= 40
        ? "text-yellow-600"
        : "text-red-600";

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Test Tamamlandı!
              </h1>
              <p className="text-gray-600">
                EBARS başlangıç puanınız belirlendi
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
                <div className="text-sm text-gray-600 mb-1">EBARS Başlangıç Puanı</div>
                <div className={`text-4xl font-bold ${scoreColor} mb-2`}>
                  {finalScore.score.toFixed(1)}/100
                </div>
                <div className={`text-sm font-semibold ${difficulty.color}`}>
                  {difficulty.label}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border-2 border-indigo-200">
                <div className="text-sm text-gray-600 mb-1">Seviye</div>
                <div className="text-4xl font-bold text-indigo-600 mb-2">
                  {difficulty.label}
                </div>
                <div className="text-sm text-gray-600">
                  Sistem size bu seviyede cevaplar üretecek
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>💡 Bilgi:</strong> EBARS sistemi, bu başlangıç puanınıza
                göre size uygun zorluk seviyesinde cevaplar üretecek. Emoji
                geri bildirimlerinizle bu puan zamanla güncellenecek.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!user || !sessionId) {
                    router.push("/student/chat");
                    return;
                  }

                  if (confirm("Testi tekrar almak istediğinize emin misiniz? Mevcut puanınız sıfırlanacak.")) {
                    try {
                      setLoading(true);
                      const response = await fetch(
                        `/api/aprag/ebars/reset-initial-test/${user.id}/${sessionId}`,
                        { method: "POST" }
                      );
                      
                      if (response.ok) {
                        // Reload test
                        setStage("questions");
                        setAttempt(1);
                        setFinalScore(null);
                        await loadTest(1);
                      } else {
                        const errorData = await response.json();
                        alert(errorData.detail || "Test sıfırlanırken bir hata oluştu");
                      }
                    } catch (err) {
                      console.error("Error resetting test:", err);
                      alert("Test sıfırlanırken bir hata oluştu");
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Testi Tekrar Al</span>
              </button>
              <button
                onClick={handleContinue}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg"
              >
                <span>Chat Sayfasına Geç</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "answer_preference") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Size Uygun Cevabı Seçin
            </h1>
            <p className="text-gray-600">
              Her konu için 5 farklı zorluk seviyesinde cevap gösteriliyor. Size en uygun olanı seçin.
            </p>
          </div>

          <div className="space-y-6">
            {topics.map((topic, topicIdx) => {
              const answers = topicAnswers[topic.question_index];
              const selectedLevel = selectedLevels[topic.question_index];
              const isLoading = loadingAnswers[topic.question_index];

              return (
                <div key={topic.question_index} className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Konu {topicIdx + 1}: {topic.question}
                  </h2>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="ml-3 text-gray-600">Cevaplar hazırlanıyor...</span>
                    </div>
                  ) : answers ? (
                    <div className="space-y-4">
                      {Object.entries(answers).map(([level, answer]) => {
                        const levelKey = level as AnswerLevel;
                        const levelInfo = getLevelLabel(levelKey);
                        const isSelected = selectedLevel === levelKey;

                        return (
                          <label
                            key={level}
                            className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? `${levelInfo.color} border-current`
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name={`topic-${topic.question_index}`}
                                value={level}
                                checked={isSelected}
                                onChange={() => handleLevelSelect(topic.question_index, levelKey)}
                                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">{levelInfo.emoji}</span>
                                  <span className="font-semibold text-gray-900">
                                    {levelInfo.label}
                                  </span>
                                </div>
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  {answer.text}
                                </p>
                                {answer.characteristics && answer.characteristics.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {answer.characteristics.map((char: string, idx: number) => (
                                      <span
                                        key={idx}
                                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                                      >
                                        {char}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Cevaplar yüklenemedi
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {Object.keys(selectedLevels).length} / {topics.length} konu için seçim yapıldı
              </div>
              <button
                onClick={handleSubmitPreferences}
                disabled={submitting || Object.keys(selectedLevels).length < topics.length}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    Tercihleri Kaydet
                    <CheckCircle className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stage 1: Questions
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Bilişsel Test
            </h1>
            <div className="text-sm text-gray-600">
              Soru {currentQuestionIndex + 1} / {questions.length}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>İlerleme</span>
              <span>
                {answeredCount} / {questions.length} cevaplandı
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {currentQuestion && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-sm text-gray-500">
                  Soru {currentQuestionIndex + 1} / {questions.length}
                </div>
                {currentQuestion.difficulty && (
                  <div
                    className={`text-xs px-2 py-1 rounded ${
                      currentQuestion.difficulty === "easy"
                        ? "bg-green-100 text-green-700"
                        : currentQuestion.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {currentQuestion.difficulty === "easy"
                      ? "Basit"
                      : currentQuestion.difficulty === "medium"
                      ? "Orta"
                      : "Zor"}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="mb-6">
              {currentQuestion.options ? (
                <div className="space-y-3">
                  {Object.entries(currentQuestion.options).map(([key, value]) => (
                    <label
                      key={key}
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        answers[currentQuestion.index] === key
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.index}`}
                        value={key}
                        checked={answers[currentQuestion.index] === key}
                        onChange={(e) =>
                          handleAnswerChange(currentQuestion.index, e.target.value)
                        }
                        className="mt-1 w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900 mr-2">{key}.</span>
                        <span className="text-gray-700">{value as string}</span>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answers[currentQuestion.index] || ""}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.index, e.target.value)
                  }
                  placeholder="Cevabınızı buraya yazın..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={6}
                />
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() =>
                  setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
                }
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Önceki
              </button>

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={() =>
                    setCurrentQuestionIndex(
                      Math.min(questions.length - 1, currentQuestionIndex + 1)
                    )
                  }
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  Sonraki
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuestions}
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      Testi Tamamla
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="text-sm text-gray-600">
            <strong>💡 İpucu:</strong> Tüm soruları cevaplamaya çalışın. Test
            sonunda size farklı zorluk seviyelerinde cevaplar gösterilecek ve
            size uygun olanı seçeceksiniz.
          </div>
        </div>
      </div>
    </div>
  );
}
