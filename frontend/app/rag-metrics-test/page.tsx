"use client";

import React, { useState } from "react";
import TeacherLayout from "../components/TeacherLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Target,
  FileText,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/lib/toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface RAGASEvaluationResult {
  faithfulness: number;
  answer_relevancy: number;
  context_precision?: number;
  context_recall?: number;
  overall_score: number;
  metrics_available: string[];
}

interface EvaluationRequest {
  question: string;
  answer: string;
  contexts: string[];
  ground_truth?: string;
}

export default function RAGMetricsTestPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [contexts, setContexts] = useState<string[]>([""]);
  const [groundTruth, setGroundTruth] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<RAGASEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addContext = () => {
    setContexts([...contexts, ""]);
  };

  const removeContext = (index: number) => {
    setContexts(contexts.filter((_, i) => i !== index));
  };

  const updateContext = (index: number, value: string) => {
    const newContexts = [...contexts];
    newContexts[index] = value;
    setContexts(newContexts);
  };

  const handleEvaluate = async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error("Lütfen soru ve cevap alanlarını doldurun");
      return;
    }

    const validContexts = contexts.filter((c) => c.trim());
    if (validContexts.length === 0) {
      toast.error("En az bir context ekleyin");
      return;
    }

    setIsEvaluating(true);
    setError(null);
    setResult(null);

    try {
      const request: EvaluationRequest = {
        question: question.trim(),
        answer: answer.trim(),
        contexts: validContexts,
        ground_truth: groundTruth.trim() || undefined,
      };

      const response = await fetch("/api/rag-metrics/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Değerlendirme başarısız oldu");
      }

      const data = await response.json();
      setResult(data);
      toast.success("Değerlendirme tamamlandı!");
    } catch (err: any) {
      const errorMessage = err.message || "Bir hata oluştu";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setQuestion("");
    setAnswer("");
    setContexts([""]);
    setGroundTruth("");
    setResult(null);
    setError(null);
  };

  // Prepare chart data
  const chartData = result
    ? [
        {
          name: "Faithfulness",
          value: result.faithfulness,
          fullMark: 1,
        },
        {
          name: "Answer Relevancy",
          value: result.answer_relevancy,
          fullMark: 1,
        },
        ...(result.context_precision !== undefined
          ? [
              {
                name: "Context Precision",
                value: result.context_precision,
                fullMark: 1,
              },
            ]
          : []),
        ...(result.context_recall !== undefined
          ? [
              {
                name: "Context Recall",
                value: result.context_recall,
                fullMark: 1,
              },
            ]
          : []),
      ]
    : [];

  const barChartData = result
    ? [
        {
          metric: "Faithfulness",
          score: result.faithfulness,
        },
        {
          metric: "Answer Relevancy",
          score: result.answer_relevancy,
        },
        ...(result.context_precision !== undefined
          ? [
              {
                metric: "Context Precision",
                score: result.context_precision,
              },
            ]
          : []),
        ...(result.context_recall !== undefined
          ? [
              {
                metric: "Context Recall",
                score: result.context_recall,
              },
            ]
          : []),
      ]
    : [];

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 0.8) return "bg-green-100 text-green-800";
    if (score >= 0.6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <TeacherLayout activeTab="rag-metrics-test">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">RAG Metrikleri Testi (RAGAS)</h1>
            <p className="text-muted-foreground mt-2">
              RAG sisteminizin performansını RAGAS metrikleri ile değerlendirin
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Test Parametreleri
              </CardTitle>
              <CardDescription>
                Soru, cevap ve context bilgilerini girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Soru *</Label>
                <Textarea
                  id="question"
                  placeholder="Değerlendirilecek soruyu girin..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">Cevap *</Label>
                <Textarea
                  id="answer"
                  placeholder="RAG sisteminin ürettiği cevabı girin..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Context'ler *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addContext}
                  >
                    + Context Ekle
                  </Button>
                </div>
                {contexts.map((context, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      placeholder={`Context ${index + 1}...`}
                      value={context}
                      onChange={(e) => updateContext(index, e.target.value)}
                      rows={3}
                      className="flex-1"
                    />
                    {contexts.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContext(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ground-truth">
                  Ground Truth (Opsiyonel)
                </Label>
                <Textarea
                  id="ground-truth"
                  placeholder="Doğru cevap (context precision/recall için gerekli)..."
                  value={groundTruth}
                  onChange={(e) => setGroundTruth(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Ground truth sağlandığında Context Precision ve Context
                  Recall metrikleri de hesaplanır
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleEvaluate}
                  disabled={isEvaluating}
                  className="flex-1"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Değerlendiriliyor...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Değerlendir
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={isEvaluating}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Değerlendirme Sonuçları
              </CardTitle>
              <CardDescription>
                RAGAS metrikleri ile performans analizi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Değerlendirme sonuçları burada görüntülenecek</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Genel Skor
                    </p>
                    <p
                      className={`text-4xl font-bold ${getScoreColor(
                        result.overall_score
                      )}`}
                    >
                      {(result.overall_score * 100).toFixed(1)}%
                    </p>
                  </div>

                  {/* Individual Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">
                        Faithfulness
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={getScoreBadgeColor(result.faithfulness)}
                        >
                          {(result.faithfulness * 100).toFixed(1)}%
                        </Badge>
                        {result.faithfulness >= 0.8 ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">
                        Answer Relevancy
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={getScoreBadgeColor(
                            result.answer_relevancy
                          )}
                        >
                          {(result.answer_relevancy * 100).toFixed(1)}%
                        </Badge>
                        {result.answer_relevancy >= 0.8 ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>

                    {result.context_precision !== undefined && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">
                          Context Precision
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={getScoreBadgeColor(
                              result.context_precision
                            )}
                          >
                            {(result.context_precision * 100).toFixed(1)}%
                          </Badge>
                          {result.context_precision >= 0.8 ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    )}

                    {result.context_recall !== undefined && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">
                          Context Recall
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={getScoreBadgeColor(
                              result.context_recall
                            )}
                          >
                            {(result.context_recall * 100).toFixed(1)}%
                          </Badge>
                          {result.context_recall >= 0.8 ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Charts */}
                  {chartData.length > 0 && (
                    <>
                      <div>
                        <h3 className="text-sm font-semibold mb-3">
                          Radar Chart
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <RadarChart data={chartData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="name" />
                            <PolarRadiusAxis
                              angle={90}
                              domain={[0, 1]}
                              tickFormatter={(value) =>
                                (value * 100).toFixed(0) + "%"
                              }
                            />
                            <Radar
                              name="Score"
                              dataKey="value"
                              stroke="#8884d8"
                              fill="#8884d8"
                              fillOpacity={0.6}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold mb-3">
                          Bar Chart
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={barChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="metric" />
                            <YAxis
                              domain={[0, 1]}
                              tickFormatter={(value) =>
                                (value * 100).toFixed(0) + "%"
                              }
                            />
                            <Tooltip
                              formatter={(value: number | undefined) => [
                                value !== undefined ? (value * 100).toFixed(2) + "%" : "N/A",
                                "Score",
                              ]}
                            />
                            <Legend />
                            <Bar dataKey="score" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}

                  {/* Metrics Info */}
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="text-sm font-semibold">Metrik Açıklamaları:</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>
                        <strong>Faithfulness:</strong> Cevabın verilen context'e
                        ne kadar bağlı olduğunu ölçer
                      </li>
                      <li>
                        <strong>Answer Relevancy:</strong> Cevabın soruya ne
                        kadar uygun olduğunu ölçer
                      </li>
                      {result.context_precision !== undefined && (
                        <li>
                          <strong>Context Precision:</strong> Alınan context'lerin
                          ne kadarının ilgili olduğunu ölçer
                        </li>
                      )}
                      {result.context_recall !== undefined && (
                        <li>
                          <strong>Context Recall:</strong> İlgili context'lerin
                          ne kadarının alındığını ölçer
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TeacherLayout>
  );
}

