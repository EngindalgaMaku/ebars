"use client";

import React, { useState } from "react";
import { submitEmojiFeedback, EmojiFeedbackCreate } from "@/lib/api";
import { useAPRAGSettings } from "@/hooks/useAPRAGSettings";
import DetailedFeedbackModal from "./DetailedFeedbackModal";

// EBARS helper functions
async function checkEBARSEnabled(sessionId: string): Promise<{ isEnabled: boolean }> {
  try {
    const response = await fetch(`/api/aprag/session-settings/${sessionId}`);
    if (!response.ok) return { isEnabled: false };
    const data = await response.json();
    return { isEnabled: data.settings?.enable_ebars ?? false };
  } catch {
    return { isEnabled: false };
  }
}

async function submitEBARSFeedback(data: {
  user_id: string;
  session_id: string;
  emoji: string;
  interaction_id?: number;
}): Promise<void> {
  const response = await fetch("/api/aprag/ebars/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("EBARS feedback failed");
  }
}

interface EmojiFeedbackProps {
  interactionId: number;
  userId: string;
  sessionId: string;
  onFeedbackSubmitted?: () => void;
  compact?: boolean;
}

const EMOJI_OPTIONS = [
  {
    emoji: "👍" as const,
    name: "Tam Anladım",
    description: "Bu cevap sorumu tam karşılıyor ve net",
    shortDescription: "Tam Anladım",
    color: "bg-green-500 hover:bg-green-600",
    hoverColor: "hover:bg-green-700",
  },
  {
    emoji: "😊" as const,
    name: "Genel Anladım",
    description: "Cevap yardımcı ama bazı kısımları daha açık olabilir",
    shortDescription: "Genel Anladım",
    color: "bg-blue-500 hover:bg-blue-600",
    hoverColor: "hover:bg-blue-700",
  },
  {
    emoji: "😐" as const,
    name: "Kısmen Anladım",
    description: "Cevap karmaşık, ek açıklama lazım",
    shortDescription: "Kısmen Anladım",
    color: "bg-yellow-500 hover:bg-yellow-600",
    hoverColor: "hover:bg-yellow-700",
  },
  {
    emoji: "❌" as const,
    name: "Anlamadım",
    description: "Cevap soruma uygun değil veya çok karmaşık",
    shortDescription: "Anlamadım",
    color: "bg-red-500 hover:bg-red-600",
    hoverColor: "hover:bg-red-700",
  },
];

export default function EmojiFeedback({
  interactionId,
  userId,
  sessionId,
  onFeedbackSubmitted,
  compact = false,
}: EmojiFeedbackProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [pendingEmoji, setPendingEmoji] = useState<
    "😊" | "👍" | "😐" | "❌" | null
  >(null);
  const [ebarsEnabled, setEbarsEnabled] = useState<boolean>(false);
  const { isEnabled, features, isLoading } = useAPRAGSettings(sessionId);

  // Check EBARS status
  React.useEffect(() => {
    async function checkEBARS() {
      try {
        const result = await checkEBARSEnabled(sessionId);
        setEbarsEnabled(result.isEnabled);
      } catch (error) {
        console.warn('[EmojiFeedback] Failed to check EBARS status:', error);
        setEbarsEnabled(false);
      }
    }
    if (sessionId) {
      checkEBARS();
    }
  }, [sessionId]);

  // Don't render if EBARS is disabled, APRAG is disabled, or emoji feedback is disabled
  const allowRender = ebarsEnabled && isEnabled && features.feedback_collection;
  
  // Early return if EBARS is disabled
  if (!isLoading && !ebarsEnabled) {
    return null; // Don't render emoji feedback if EBARS is disabled
  }

  if (!isLoading && !allowRender) {
    if (typeof window !== 'undefined') {
      console.warn('[EmojiFeedback] Not rendering:', {
        reason: !ebarsEnabled ? 'EBARS disabled' : !isEnabled ? 'APRAG disabled' : 'feedback_collection disabled',
        ebarsEnabled,
        isEnabled,
        feedback_collection: features.feedback_collection,
        isLoading
      });
    }
    return null; // Don't render if not allowed
  }

  const handleEmojiClick = async (
    emoji: "😊" | "👍" | "😐" | "❌",
    skipDetailed: boolean = false
  ) => {
    if (submitting || selectedEmoji) return;

    console.log('[EmojiFeedback] handleEmojiClick called:', {
      emoji,
      skipDetailed,
      compact,
      willShowModal: !skipDetailed && !compact
    });

    // If we want to show detailed feedback and it's not being skipped
    if (!skipDetailed && !compact) {
      console.log('[EmojiFeedback] Opening detailed feedback modal...');
      setPendingEmoji(emoji);
      setShowDetailedModal(true);
      console.log('[EmojiFeedback] showDetailedModal set to true');
      return;
    }

    // Direct emoji submission (for compact mode or when detailed is skipped)
    setSubmitting(true);
    setError(null);

    try {
      const feedback: EmojiFeedbackCreate = {
        interaction_id: interactionId,
        user_id: userId,
        session_id: sessionId,
        emoji,
      };

      await submitEmojiFeedback(feedback);
      
      // Send feedback to EBARS if enabled
      try {
        const { isEnabled: ebarsEnabled } = await checkEBARSEnabled(sessionId);
        if (ebarsEnabled) {
          await submitEBARSFeedback({
            user_id: userId,
            session_id: sessionId,
            emoji,
            interaction_id: interactionId,
          });
        }
      } catch (ebarsError) {
        // Non-critical: EBARS feedback failed, but emoji feedback succeeded
        console.warn("EBARS feedback failed (non-critical):", ebarsError);
      }
      
      setSelectedEmoji(emoji);
      setShowSuccess(true);

      // Auto-hide success message after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (err: any) {
      setError(err.message || "Geri bildirim gönderilemedi");
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetailedModalClose = () => {
    setShowDetailedModal(false);
    setPendingEmoji(null);
  };

  const handleDetailedFeedbackSubmitted = () => {
    // Mark as completed after detailed feedback
    setSelectedEmoji(pendingEmoji);
    setShowSuccess(true);
    setPendingEmoji(null);

    // Auto-hide success message after 2 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);

    if (onFeedbackSubmitted) {
      onFeedbackSubmitted();
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {!selectedEmoji ? (
          <>
            <span className="text-xs text-gray-500 mr-1">
              Bu cevap ne kadar yararlıydı?
            </span>
            {EMOJI_OPTIONS.map((option) => (
              <button
                key={option.emoji}
                onClick={() => handleEmojiClick(option.emoji)}
                disabled={submitting}
                title={`${option.name}: ${option.description}`}
                className={`
                  text-2xl p-2 rounded-lg transition-all transform hover:scale-110 hover:shadow-lg
                  ${
                    submitting
                      ? "opacity-50 cursor-not-allowed"
                      : `hover:bg-gray-100 ${option.hoverColor}`
                  }
                  relative group
                `}
              >
                {option.emoji}
                <div
                  className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2
                               bg-gray-800 text-white text-xs rounded-lg px-3 py-2
                               opacity-0 group-hover:opacity-100 transition-opacity duration-200
                               whitespace-nowrap z-50 pointer-events-none"
                >
                  <div className="text-center">
                    <div className="font-semibold">{option.name}</div>
                    <div className="text-xs opacity-90 mt-1">
                      {option.description}
                    </div>
                  </div>
                  <div
                    className="absolute top-full left-1/2 transform -translate-x-1/2
                                 border-4 border-transparent border-t-gray-800"
                  ></div>
                </div>
              </button>
            ))}
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium animate-fadeIn">
            <span className="text-2xl">{selectedEmoji}</span>
            <span>Teşekkürler!</span>
          </div>
        )}

        {/* Detailed Feedback Modal */}
        <DetailedFeedbackModal
          isOpen={showDetailedModal}
          onClose={handleDetailedModalClose}
          interactionId={interactionId}
          userId={userId}
          sessionId={sessionId}
          initialEmoji={pendingEmoji || undefined}
          onFeedbackSubmitted={handleDetailedFeedbackSubmitted}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-800 mb-2">
          Cevap Değerlendirmesi
        </h3>
        <p className="text-sm text-gray-600 mb-1">
          Bu cevap sorunu ne kadar iyi yanıtladı?
        </p>
        <p className="text-xs text-gray-500">
          Açıklama ne kadar net ve anlaşılır? Değerlendirmen öğrenme deneyimini
          iyileştirecek.
        </p>
      </div>

      {!selectedEmoji ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {EMOJI_OPTIONS.map((option) => (
            <button
              key={option.emoji}
              onClick={() => handleEmojiClick(option.emoji)}
              disabled={submitting}
              title={option.description}
              className={`
                ${option.color} ${option.hoverColor} text-white rounded-lg p-4
                transition-all transform hover:scale-105 hover:shadow-lg
                disabled:opacity-50 disabled:cursor-not-allowed
                flex flex-col items-center gap-3 relative group
                border-2 border-transparent hover:border-opacity-30
              `}
            >
              <span className="text-4xl">{option.emoji}</span>
              <div className="text-center">
                <div className="text-sm font-semibold mb-1">{option.name}</div>
                <div className="text-xs opacity-90 leading-tight">
                  {option.description}
                </div>
              </div>

              {/* Enhanced hover effect */}
              <div
                className="absolute inset-0 bg-white bg-opacity-10 rounded-lg
                             opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              ></div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 animate-fadeIn">
          <div className="text-6xl mb-3">{selectedEmoji}</div>
          <p className="text-green-600 font-semibold text-lg mb-2">
            Geri bildiriminiz kaydedildi. Teşekkürler!
          </p>
          <p className="text-sm text-gray-600 mb-1">
            Bu değerlendirme, cevapların kalitesini artırmamıza yardımcı olacak.
          </p>
          <p className="text-xs text-gray-500">
            Öğrenme deneyiminizi daha da iyileştirmek için çalışmaya devam
            ediyoruz.
          </p>

          {/* Option to provide detailed feedback after quick emoji */}
          {!showSuccess && (
            <button
              onClick={() => {
                setPendingEmoji(selectedEmoji as any);
                setShowDetailedModal(true);
              }}
              className="mt-3 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Daha detaylı değerlendirme yap
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Debug: Show modal state */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-400 p-2 bg-gray-50 rounded">
          Modal Debug: showDetailedModal={showDetailedModal ? '✅ true' : '❌ false'}, 
          pendingEmoji={pendingEmoji || 'none'}
        </div>
      )}

      {/* Debug logs - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <>
          {console.log('[EmojiFeedback] Rendering DetailedFeedbackModal:', {
            showDetailedModal,
            pendingEmoji,
            interactionId
          })}
        </>
      )}
      <DetailedFeedbackModal
        isOpen={showDetailedModal}
        onClose={handleDetailedModalClose}
        interactionId={interactionId}
        userId={userId}
        sessionId={sessionId}
        initialEmoji={pendingEmoji || undefined}
        onFeedbackSubmitted={handleDetailedFeedbackSubmitted}
      />
    </div>
  );
}

// Quick inline emoji feedback (for chat messages)
interface QuickEmojiFeedbackProps {
  interactionId: number;
  userId: string;
  sessionId: string;
  onFeedbackSubmitted?: () => void;
}

export function QuickEmojiFeedback({
  interactionId,
  userId,
  sessionId,
  onFeedbackSubmitted,
}: QuickEmojiFeedbackProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [pendingEmoji, setPendingEmoji] = useState<
    "😊" | "👍" | "😐" | "❌" | null
  >(null);
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  const handleEmojiClick = async (emoji: "😊" | "👍" | "😐" | "❌") => {
    if (submitting || selectedEmoji) return;

    setSubmitting(true);

    try {
      await submitEmojiFeedback({
        interaction_id: interactionId,
        user_id: userId,
        session_id: sessionId,
        emoji,
      });
      
      // Send feedback to EBARS if enabled
      try {
        const { isEnabled: ebarsEnabled } = await checkEBARSEnabled(sessionId);
        if (ebarsEnabled) {
          await submitEBARSFeedback({
            user_id: userId,
            session_id: sessionId,
            emoji,
            interaction_id: interactionId,
          });
        }
      } catch (ebarsError) {
        // Non-critical: EBARS feedback failed, but emoji feedback succeeded
        console.warn("EBARS feedback failed (non-critical):", ebarsError);
      }
      
      setSelectedEmoji(emoji);
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (err) {
      console.error("Failed to submit emoji feedback:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetailedModalClose = () => {
    setShowDetailedModal(false);
    setPendingEmoji(null);
  };

  const handleDetailedFeedbackSubmitted = () => {
    setSelectedEmoji(pendingEmoji);
    setPendingEmoji(null);
    if (onFeedbackSubmitted) {
      onFeedbackSubmitted();
    }
  };

  if (selectedEmoji) {
    return (
      <div className="inline-flex items-center gap-1 text-xs text-gray-500">
        <span className="text-base">{selectedEmoji}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      {EMOJI_OPTIONS.map((option) => (
        <button
          key={option.emoji}
          onClick={() => handleEmojiClick(option.emoji)}
          onMouseEnter={() => setHoveredEmoji(option.emoji)}
          onMouseLeave={() => setHoveredEmoji(null)}
          disabled={submitting}
          className="text-lg hover:scale-125 transition-all transform disabled:opacity-50
                   hover:shadow-md rounded-full p-1 hover:bg-gray-100 relative"
        >
          {option.emoji}
          {hoveredEmoji === option.emoji && (
            <div
              className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2
                           bg-gray-800 text-white text-xs rounded-lg px-2 py-1
                           whitespace-nowrap z-50 pointer-events-none"
            >
              <div className="text-center">
                <div className="font-semibold">{option.shortDescription}</div>
              </div>
              <div
                className="absolute top-full left-1/2 transform -translate-x-1/2
                             border-4 border-transparent border-t-gray-800"
              ></div>
            </div>
          )}
        </button>
      ))}
      {/* Detailed Feedback Modal */}
      <DetailedFeedbackModal
        isOpen={showDetailedModal}
        onClose={handleDetailedModalClose}
        interactionId={interactionId}
        userId={userId}
        sessionId={sessionId}
        initialEmoji={pendingEmoji || undefined}
        onFeedbackSubmitted={handleDetailedFeedbackSubmitted}
      />
    </div>
  );
}
