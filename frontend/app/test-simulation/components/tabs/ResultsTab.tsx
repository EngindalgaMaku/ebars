"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Award,
  BarChart3,
  Clock,
  Target,
  TrendingUp,
  FileText,
  Loader2,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
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
import {
  getSimilarityValue,
  methodNames,
  tooltipFormatterCosine,
  tooltipFormatterResponseTime,
} from "../shared/helpers";
import DataExportControls from "@/components/DataExportControls";

// Simplified interfaces
interface TestResult {
  testId: string;
  testName: string;
  status: "running" | "completed" | "failed" | "stopped";
  progress: number;
  startTime: string;
  endTime?: string;
  executionTime?: {
    total_seconds?: number;
    formatted?: string;
  };
  metrics: {
    cosineSimilarity: number;
    precisionAt5: number;
    precisionAt10: number;
    avgResponseTime: number;
    totalQuestions: number;
    correctAnswers: number;
  };
  methodComparison: {
    eduBars: MethodResults;
    basicRag: MethodResults;
    llmOnly: MethodResults;
  };
  benchmarkComparison: {
    ekoBot: BenchmarkResults;
    current: BenchmarkResults;
  };
}

interface MethodResults {
  cosineSimilarity: number;
  precisionAt5: number;
  precisionAt10: number;
  avgResponseTime: number;
  accuracy: number;
  similarity?: any;
  answerQualitySimilarity?: number | null;
}

interface BenchmarkResults {
  cosineSimilarity: number;
  precisionAt5: number;
  label: string;
}

interface TestConfig {
  testMethods: string[];
  enableBenchmark: boolean;
}

interface ResultsTabProps {
  currentTest: TestResult | null;
  config: TestConfig;
  onSetActiveTab: (tab: string) => void;
}

export default function ResultsTab({
  currentTest,
  config,
  onSetActiveTab,
}: ResultsTabProps) {
  if (!currentTest) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Henüz Sonuç Yok
          </h3>
          <p className="text-gray-500 mb-4">
            Sonuçları görmek için önce bir test başlatın ve tamamlayın.
          </p>
          <Button
            onClick={() => onSetActiveTab("configuration")}
            variant="outline"
          >
            Test Başlat
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (currentTest.status === "running") {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Test Devam Ediyor
          </h3>
          <p className="text-gray-500 mb-4">
            Sonuçları görmek için testin tamamlanmasını bekleyin.
          </p>
          <div className="text-sm text-gray-400">
            İlerleme: {Math.round(currentTest.progress)}%
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentTest.status !== "completed") {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Test Tamamlanmadı
          </h3>
          <p className="text-gray-500 mb-4">
            Test başarısız oldu veya durduruldu.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Test Özeti: {currentTest.testName}
            </CardTitle>
            <DataExportControls
              testResult={currentTest}
              chartIds={[
                "method-performance-chart",
                "response-time-chart",
                "performance-radar-chart",
              ]}
              variant="compact"
              className="flex gap-2"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Test Süresi</div>
              <div className="text-lg font-semibold">
                {currentTest.executionTime?.formatted ||
                  (currentTest.executionTime?.total_seconds
                    ? `${Math.round(
                        Math.max(0, currentTest.executionTime.total_seconds)
                      )}s`
                    : currentTest.endTime
                    ? Math.round(
                        (new Date(currentTest.endTime).getTime() -
                          new Date(currentTest.startTime).getTime()) /
                          1000
                      ) + "s"
                    : "0s")}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Toplam Soru</div>
              <div className="text-lg font-semibold">
                {currentTest.metrics.totalQuestions}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Doğru Cevap</div>
              <div className="text-lg font-semibold">
                {currentTest.metrics.correctAnswers}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Başarı Oranı</div>
              <div className="text-lg font-semibold">
                {(
                  (currentTest.metrics.correctAnswers /
                    currentTest.metrics.totalQuestions) *
                  100
                ).toFixed(1)}
                %
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Method Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Metod Karşılaştırması
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Metod</th>
                  <th className="text-center p-2">Cosine Similarity</th>
                  <th className="text-center p-2">Precision@5 (%)</th>
                  <th className="text-center p-2">Precision@10 (%)</th>
                  <th className="text-center p-2">Avg Response (ms)</th>
                  <th className="text-center p-2">Accuracy (%)</th>
                  <th className="text-center p-2">Semantic Similarity</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(currentTest.methodComparison).map(
                  ([method, results]) => (
                    <tr key={method} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">
                        {methodNames[method] || method}
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`font-medium ${
                            results.cosineSimilarity >= 0.85
                              ? "text-green-600"
                              : results.cosineSimilarity >= 0.75
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {results.cosineSimilarity.toFixed(3)}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`font-medium ${
                            method === "llmOnly"
                              ? "text-gray-500"
                              : results.precisionAt5 >= 90
                              ? "text-green-600"
                              : results.precisionAt5 >= 80
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {method === "llmOnly"
                            ? "Ölçülmedi"
                            : `${results.precisionAt5.toFixed(1)}%`}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`font-medium ${
                            method === "llmOnly"
                              ? "text-gray-500"
                              : results.precisionAt10 >= 85
                              ? "text-green-600"
                              : results.precisionAt10 >= 75
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {method === "llmOnly"
                            ? "Ölçülmedi"
                            : `${results.precisionAt10.toFixed(1)}%`}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`font-medium ${
                            results.avgResponseTime <= 1000
                              ? "text-green-600"
                              : results.avgResponseTime <= 1500
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {Math.round(results.avgResponseTime)}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`font-medium ${
                            results.accuracy >= 85
                              ? "text-green-600"
                              : results.accuracy >= 75
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {results.accuracy.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        {(() => {
                          const semantic = getSimilarityValue(
                            results,
                            "semanticSimilarity"
                          );
                          if (semantic === null) {
                            return (
                              <span className="text-gray-500 italic text-xs">
                                Ground truth gerekli
                              </span>
                            );
                          }
                          return (
                            <span
                              className={`font-medium text-xs ${
                                semantic >= 0.7
                                  ? "text-green-600"
                                  : semantic >= 0.5
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {semantic.toFixed(3)}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performans Karşılaştırması
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div id="method-performance-chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(currentTest.methodComparison)
                    .filter(([method]) => config.testMethods.includes(method))
                    .filter(([, results]) => results.cosineSimilarity > 0)
                    .map(([method, results]) => ({
                      name: methodNames[method] || method,
                      cosine: results.cosineSimilarity,
                      precision5: results.precisionAt5,
                      accuracy: results.accuracy,
                    }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip formatter={tooltipFormatterCosine} />
                  <Legend />
                  <Bar
                    dataKey="cosine"
                    fill="#3b82f6"
                    name="Cosine Similarity"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="precision5"
                    fill="#10b981"
                    name="Precision@5 (%)"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="accuracy"
                    fill="#f59e0b"
                    name="Accuracy (%)"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Response Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Yanıt Süreleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div id="response-time-chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(currentTest.methodComparison)
                    .filter(([method]) => config.testMethods.includes(method))
                    .filter(([, results]) => results.cosineSimilarity > 0)
                    .map(([method, results]) => ({
                      name: methodNames[method] || method,
                      responseTime: results.avgResponseTime,
                    }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip formatter={tooltipFormatterResponseTime} />
                  <Legend />
                  <Bar
                    dataKey="responseTime"
                    fill="#ef4444"
                    name="Yanıt Süresi (ms)"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benchmark Comparison */}
      {config.enableBenchmark && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Benchmark Karşılaştırması
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {currentTest.benchmarkComparison.ekoBot.cosineSimilarity.toFixed(
                    3
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  EkoBot Referans
                </div>
                <div className="text-lg font-semibold text-blue-600">
                  Precision@5:{" "}
                  {currentTest.benchmarkComparison.ekoBot.precisionAt5}%
                </div>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {currentTest.benchmarkComparison.current.cosineSimilarity.toFixed(
                    3
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-1">Mevcut Test</div>
                <div className="text-lg font-semibold text-green-600">
                  Precision@5:{" "}
                  {currentTest.benchmarkComparison.current.precisionAt5.toFixed(
                    1
                  )}
                  %
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center">
                {currentTest.benchmarkComparison.current.cosineSimilarity >=
                currentTest.benchmarkComparison.ekoBot.cosineSimilarity ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">
                      Benchmark'ı{" "}
                      {(
                        ((currentTest.benchmarkComparison.current
                          .cosineSimilarity -
                          currentTest.benchmarkComparison.ekoBot
                            .cosineSimilarity) /
                          currentTest.benchmarkComparison.ekoBot
                            .cosineSimilarity) *
                        100
                      ).toFixed(1)}
                      % geçti
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">
                      Benchmark'ın{" "}
                      {(
                        ((currentTest.benchmarkComparison.ekoBot
                          .cosineSimilarity -
                          currentTest.benchmarkComparison.current
                            .cosineSimilarity) /
                          currentTest.benchmarkComparison.ekoBot
                            .cosineSimilarity) *
                        100
                      ).toFixed(1)}
                      % altında
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
