"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  startBatchQuestionGeneration,
  BatchQuestionGenerationRequest,
  Topic,
} from "@/lib/api";

interface BatchQuestionGenerationModalProps {
  sessionId: string;
  topics: Topic[];
  onClose: () => void;
  onGenerate: (jobId: number) => void;
}

export default function BatchQuestionGenerationModal({
  sessionId,
  topics,
  onClose,
  onGenerate,
}: BatchQuestionGenerationModalProps) {
  const [config, setConfig] = useState<BatchQuestionGenerationRequest>({
    session_id: sessionId,
    job_type: "topic_batch",
    topic_ids: [],
    custom_topic: "",
    total_questions_target: 100,
    questions_per_topic: undefined,
    bloom_levels: ["remember", "understand", "apply", "analyze", "evaluate", "create"],
    use_random_bloom_distribution: true,
    custom_prompt: "",
    prompt_instructions: "",
    use_default_prompts: true,
    enable_quality_check: true,
    quality_threshold: 0.7,
    enable_duplicate_check: true,
    similarity_threshold: 0.85,
    duplicate_check_method: "embedding",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate
      if (config.total_questions_target <= 0) {
        throw new Error("Toplam soru sayısı 0'dan büyük olmalıdır");
      }

      if (config.job_type === "custom" && !config.custom_topic) {
        throw new Error("Özel konu başlığı gerekli");
      }

      if (config.job_type === "topic_batch" && (!config.topic_ids || config.topic_ids.length === 0)) {
        throw new Error("En az bir konu seçmelisiniz");
      }

      if (!config.use_default_prompts && !config.custom_prompt) {
        throw new Error("Varsayılan promptlar kullanılmıyorsa özel prompt gerekli");
      }

      const response = await startBatchQuestionGeneration(config);
      onGenerate(response.job_id);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  const toggleBloomLevel = (level: string) => {
    const current = config.bloom_levels || [];
    if (current.includes(level)) {
      setConfig({
        ...config,
        bloom_levels: current.filter((l) => l !== level),
      });
    } else {
      setConfig({
        ...config,
        bloom_levels: [...current, level],
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Toplu Soru Üretimi</DialogTitle>
          <DialogDescription>
            Manuel olarak başlatılan toplu soru üretim işlemi. Ücretsiz modeller kullanılır ve soru kalitesi LLM ile otomatik değerlendirilir.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Soru Sayısı */}
          <div>
            <Label htmlFor="total_questions">Toplam Soru Sayısı *</Label>
            <Input
              id="total_questions"
              type="number"
              min="1"
              max="1000"
              value={config.total_questions_target}
              onChange={(e) =>
                setConfig({
                  ...config,
                  total_questions_target: parseInt(e.target.value) || 0,
                })
              }
              placeholder="Örn: 100"
            />
            <p className="text-sm text-gray-500 mt-1">
              Toplam üretilecek soru sayısı (zorunlu)
            </p>
          </div>

          {/* Konu Seçimi */}
          <div>
            <Label>Konu Seçimi</Label>
            <select
              className="w-full px-3 py-2 border rounded-md mt-1"
              value={config.job_type}
              onChange={(e) =>
                setConfig({
                  ...config,
                  job_type: e.target.value,
                  topic_ids: e.target.value === "topic_batch" ? [] : undefined,
                  custom_topic: e.target.value === "custom" ? "" : undefined,
                })
              }
            >
              <option value="topic_batch">Belirli Konular</option>
              <option value="full_session">Tüm Konular</option>
              <option value="custom">Özel Konu</option>
            </select>

            {config.job_type === "topic_batch" && (
              <div className="mt-2">
                <Label>Konular (Çoklu Seçim)</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 mt-1">
                  {topics.map((topic) => (
                    <label key={topic.topic_id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={config.topic_ids?.includes(topic.topic_id) || false}
                        onChange={(e) => {
                          const current = config.topic_ids || [];
                          if (e.target.checked) {
                            setConfig({
                              ...config,
                              topic_ids: [...current, topic.topic_id],
                            });
                          } else {
                            setConfig({
                              ...config,
                              topic_ids: current.filter((id) => id !== topic.topic_id),
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{topic.topic_title}</span>
                    </label>
                  ))}
                </div>
                {config.topic_ids && config.topic_ids.length > 0 && (
                  <div className="mt-2">
                    <Label>Konu Başına Soru Sayısı (Opsiyonel)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={config.questions_per_topic || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          questions_per_topic: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Boş bırakılırsa otomatik dağıtılır"
                    />
                  </div>
                )}
              </div>
            )}

            {config.job_type === "custom" && (
              <div className="mt-2">
                <Label>Özel Konu Başlığı</Label>
                <Input
                  value={config.custom_topic || ""}
                  onChange={(e) =>
                    setConfig({ ...config, custom_topic: e.target.value })
                  }
                  placeholder="Örn: Python Decorators, Veri Yapıları"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Bu konu için soru üretilecek. Session'daki chunk'lar kullanılacak.
                </p>
              </div>
            )}
          </div>

          {/* Bloom Taksonomisi Seviyeleri */}
          <div>
            <Label>Bloom Taksonomisi Seviyeleri</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { value: "remember", label: "Remember (Hatırlama)" },
                { value: "understand", label: "Understand (Anlama)" },
                { value: "apply", label: "Apply (Uygulama)" },
                { value: "analyze", label: "Analyze (Analiz)" },
                { value: "evaluate", label: "Evaluate (Değerlendirme)" },
                { value: "create", label: "Create (Yaratma)" },
              ].map((level) => (
                <label key={level.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.bloom_levels?.includes(level.value) || false}
                    onChange={() => toggleBloomLevel(level.value)}
                  />
                  <span className="text-sm">{level.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.use_random_bloom_distribution}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      use_random_bloom_distribution: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">Otomatik ağırlıklandırma kullan</span>
              </label>
            </div>
          </div>

          {/* Özel Prompt */}
          <div>
            <Label>Özel Prompt (Opsiyonel)</Label>
            <Textarea
              value={config.custom_prompt || ""}
              onChange={(e) =>
                setConfig({ ...config, custom_prompt: e.target.value })
              }
              placeholder="Örn: Sadece kod örnekleri içeren sorular üret. Her soruda mutlaka bir Python kodu parçası olsun."
              rows={4}
            />
            <p className="text-sm text-gray-500 mt-1">
              Özel talimatlar ekleyebilirsiniz. Boş bırakılırsa varsayılan promptlar kullanılır.
            </p>
            <div className="mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.use_default_prompts}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      use_default_prompts: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">Varsayılan Bloom promptlarını kullan</span>
              </label>
            </div>
          </div>

          {/* Ek Talimatlar */}
          <div>
            <Label>Ek Talimatlar (Opsiyonel)</Label>
            <Textarea
              value={config.prompt_instructions || ""}
              onChange={(e) =>
                setConfig({ ...config, prompt_instructions: e.target.value })
              }
              placeholder="Örn: Sorular pratik uygulamaya odaklı olsun, gerçek hayat örnekleri içersin"
              rows={2}
            />
          </div>

          {/* Kalite Kontrolü */}
          <div>
            <Label>Kalite Kontrolü</Label>
            <div className="mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.enable_quality_check}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      enable_quality_check: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">LLM ile kalite kontrolü aktif</span>
              </label>
              {config.enable_quality_check && (
                <div className="mt-2">
                  <Label>Minimum Kalite Skoru (0-1)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.quality_threshold}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        quality_threshold: parseFloat(e.target.value) || 0.7,
                      })
                    }
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Bu skorun altındaki sorular reddedilir (önerilen: 0.7)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Duplicate Kontrolü */}
          <div>
            <Label>Duplicate/Benzerlik Kontrolü</Label>
            <div className="mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.enable_duplicate_check}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      enable_duplicate_check: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">Duplicate ve benzerlik kontrolü aktif</span>
              </label>
              {config.enable_duplicate_check && (
                <div className="mt-2 space-y-2">
                  <div>
                    <Label>Benzerlik Eşik Değeri (0-1)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.similarity_threshold}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          similarity_threshold: parseFloat(e.target.value) || 0.85,
                        })
                      }
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Bu değerin üstündeki benzerlikte sorular duplicate sayılır (önerilen: 0.85)
                    </p>
                  </div>
                  <div>
                    <Label>Kontrol Yöntemi</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-md mt-1"
                      value={config.duplicate_check_method}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          duplicate_check_method: e.target.value,
                        })
                      }
                    >
                      <option value="embedding">Embedding (Hızlı, Önerilen)</option>
                      <option value="llm">LLM (Yavaş, Daha Doğru)</option>
                      <option value="both">Her İkisi (En Doğru, En Yavaş)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Başlatılıyor..." : "Üretimi Başlat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


