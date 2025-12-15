"use client";

import React from "react";
import { getSession, SessionMeta, listSessions } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Target,
  Database,
  Zap,
  BookOpen,
  Settings,
  Play,
  Loader2,
  CheckCircle,
} from "lucide-react";

// Configuration interfaces (simplified for this component)
interface TestConfig {
  testName: string;
  numQuestions: number;
  testMethods: string[];
  includeManualQuestions: boolean;
  customQuestions: string[];
  customExpectedAnswers: Record<number, string>;
  enableBenchmark: boolean;
  exportFormat: string[];
}

interface ConfigurationTabProps {
  config: TestConfig;
  setConfig: React.Dispatch<React.SetStateAction<TestConfig>>;
  availableSessions: SessionMeta[];
  selectedSessionId: string;
  selectedSession: SessionMeta | null;
  loadingSessions: boolean;
  questionText: string;
  setQuestionText: (text: string) => void;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  isRunning: boolean;
  onSessionChange: (sessionId: string) => void;
  onStartTest: () => void;
}

export default function ConfigurationTab({
  config,
  setConfig,
  availableSessions,
  selectedSessionId,
  selectedSession,
  loadingSessions,
  questionText,
  setQuestionText,
  showAdvanced,
  setShowAdvanced,
  isRunning,
  onSessionChange,
  onStartTest,
}: ConfigurationTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Temel Test Ayarları
            </CardTitle>
            <CardDescription>Test parametrelerini yapılandırın</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testName">Test Adı</Label>
              <Input
                id="testName"
                value={config.testName}
                onChange={(e) =>
                  setConfig({ ...config, testName: e.target.value })
                }
                placeholder="Örn: RAG Performans Testi #1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numQuestions">Soru Sayısı</Label>
              <Input
                id="numQuestions"
                type="number"
                min="1"
                max={Math.max(1, config.customQuestions.length)}
                value={config.numQuestions}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    numQuestions: Math.min(
                      parseInt(e.target.value) || 1,
                      config.customQuestions.length
                    ),
                  })
                }
                disabled={config.customQuestions.length === 0}
              />
              <p className="text-sm text-gray-500">
                Test edilecek soru sayısı (maksimum:{" "}
                {config.customQuestions.length || 0})
              </p>
            </div>

            <div className="space-y-2">
              <Label>Test Metodları</Label>
              <div className="space-y-2">
                {[
                  {
                    id: "eduBars",
                    label:
                      "AkıllıRehber(RAG +ReRanker Kombinasyonu) (APRAG Kişiselleştirme KAPALI)",
                  },
                  {
                    id: "basicRag",
                    label: "AkıllıRehber(Sadece RAG) (CRAG ve Reranker yok)",
                  },
                  { id: "llmOnly", label: "Sadece LLM (Retrieval yok)" },
                ].map((method) => (
                  <label
                    key={method.id}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={config.testMethods.includes(method.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setConfig({
                            ...config,
                            testMethods: [...config.testMethods, method.id],
                          });
                        } else {
                          setConfig({
                            ...config,
                            testMethods: config.testMethods.filter(
                              (m) => m !== method.id
                            ),
                          });
                        }
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-500" />
              Ders Oturumu Seçimi
            </CardTitle>
            <CardDescription>
              Test için kullanılacak ders oturumunu seçin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sessionSelect">Ders Oturumu</Label>
              <select
                id="sessionSelect"
                value={selectedSessionId}
                onChange={(e) => onSessionChange(e.target.value)}
                disabled={loadingSessions}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm"
              >
                {loadingSessions ? (
                  <option value="">Oturumlar yükleniyor...</option>
                ) : availableSessions.length === 0 ? (
                  <option value="">Ders oturumu bulunamadı</option>
                ) : (
                  <>
                    <option value="">Oturum seçin...</option>
                    {availableSessions.map((session) => (
                      <option
                        key={session.session_id}
                        value={session.session_id}
                      >
                        {session.name} ({session.description || "Açıklama yok"})
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {selectedSession && selectedSession.rag_settings && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Mevcut Model Ayarları
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">
                      AI Provider:
                    </span>
                    <span className="ml-2 text-gray-700">
                      {selectedSession.rag_settings.provider || "Belirtilmemiş"}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">AI Model:</span>
                    <span className="ml-2 text-gray-700">
                      {selectedSession.rag_settings.model || "Belirtilmemiş"}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">
                      Embedding Provider:
                    </span>
                    <span className="ml-2 text-gray-700">
                      {selectedSession.rag_settings.embedding_provider ||
                        "Belirtilmemiş"}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">
                      Embedding Model:
                    </span>
                    <span className="ml-2 text-gray-700">
                      {selectedSession.rag_settings.embedding_model ||
                        "Belirtilmemiş"}
                    </span>
                  </div>
                  {selectedSession.rag_settings.use_reranker_service && (
                    <div className="md:col-span-2">
                      <span className="text-blue-600 font-medium">
                        Reranker:
                      </span>
                      <span className="ml-2 text-gray-700">
                        {selectedSession.rag_settings.reranker_type || "Etkin"}{" "}
                        (Harici servis)
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
                  💡 Bu ayarlar test sırasında tüm metodlar için kullanılacak
                </div>
              </div>
            )}

            {!selectedSession && selectedSessionId && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-800">
                  Seçilen oturum yükleniyor...
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Advanced Settings */}
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
            <CardDescription>Benchmark ve export seçenekleri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAdvanced && (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Benchmark Karşılaştırması</Label>
                    <p className="text-sm text-gray-500">
                      EkoBot referans değerleri ile karşılaştır
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enableBenchmark}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        enableBenchmark: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Export Formatları</Label>
                  <div className="space-y-2">
                    {[
                      { id: "json", label: "JSON" },
                      { id: "csv", label: "CSV" },
                      { id: "excel", label: "Excel" },
                    ].map((format) => (
                      <label
                        key={format.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={config.exportFormat.includes(format.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setConfig({
                                ...config,
                                exportFormat: [
                                  ...config.exportFormat,
                                  format.id,
                                ],
                              });
                            } else {
                              setConfig({
                                ...config,
                                exportFormat: config.exportFormat.filter(
                                  (f) => f !== format.id
                                ),
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm">{format.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="pt-4 border-t">
              <Button
                onClick={onStartTest}
                disabled={
                  isRunning ||
                  !config.testName.trim() ||
                  config.testMethods.length === 0 ||
                  config.customQuestions.length === 0 ||
                  !selectedSessionId ||
                  !selectedSession
                }
                className="w-full"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Test Başlatılıyor...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Testi Başlat
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Question Input */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-500" />
              Test Soruları
            </CardTitle>
            <CardDescription>
              Tarih dersi chunk'larını test etmek için sorularınızı buraya
              yapıştırın. Her satırda bir soru olacak şekilde düzenleyin.
              <br />
              <strong>Opsiyonel:</strong> Ground truth (beklenen cevap) eklemek
              için her satırda{" "}
              <code className="bg-gray-100 px-1 rounded">Soru|Cevap</code>{" "}
              formatını kullanın.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionText">Test Soruları</Label>
              <Textarea
                id="questionText"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Test sorularını buraya kopyalayın (her satırda bir soru)&#10;&#10;Örnek (sadece sorular):&#10;Osmanlı İmparatorluğu hangi yüzyılda kuruldu?&#10;Fatih Sultan Mehmet hangi şehri fethetti?&#10;&#10;Örnek (sorular + beklenen cevaplar):&#10;Osmanlı İmparatorluğu hangi yüzyılda kuruldu?|13. yüzyıl&#10;Fatih Sultan Mehmet hangi şehri fethetti?|İstanbul&#10;Tanzimat Fermanı ne zaman ilan edildi?|1839&#10;&#10;Not: | işareti ile soru ve cevabı ayırın. Cevap opsiyoneldir."
                className="min-h-[200px] resize-y"
                rows={12}
              />
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {config.customQuestions.length} soru tespit edildi
                  {Object.keys(config.customExpectedAnswers || {}).length >
                    0 && (
                    <span className="ml-2 text-blue-600">
                      ({Object.keys(config.customExpectedAnswers || {}).length}{" "}
                      soru için beklenen cevap var)
                    </span>
                  )}
                </span>
                <span>Maksimum 100 soru</span>
              </div>
            </div>

            {config.customQuestions.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {config.customQuestions.length} soru başarıyla yüklendi
                  </span>
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Test{" "}
                  {Math.min(config.customQuestions.length, config.numQuestions)}{" "}
                  soru ile çalışacak
                  {Object.keys(config.customExpectedAnswers || {}).length >
                    0 && (
                    <span className="block mt-1 text-blue-600">
                      💡{" "}
                      {Object.keys(config.customExpectedAnswers || {}).length}{" "}
                      soru için semantik / BLEU / ROUGE / F1 metrikleri
                      hesaplanacak (fallback yok; ground truth şart).
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
