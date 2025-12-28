"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Brain,
  Square,
  RotateCcw,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

// Simplified interfaces for this component
interface TestResult {
  testId: string;
  testName: string;
  status: "running" | "completed" | "failed" | "stopped";
  progress: number;
  startTime: string;
  endTime?: string;
  executionTime?: {
    total_seconds?: number;
    total_minutes?: number;
    formatted?: string;
    elapsed_seconds?: number;
    elapsed_minutes?: number;
    status?: string;
  };
  metrics: {
    cosineSimilarity: number;
    avgResponseTime: number;
    totalQuestions: number;
    correctAnswers: number;
  };
}

interface TestConfig {
  testMethods: string[];
}

interface MonitoringTabProps {
  currentTest: TestResult | null;
  config: TestConfig;
  isRunning: boolean;
  onStopTest: () => void;
  onResetTest: () => void;
  onSetActiveTab: (tab: string) => void;
}

export default function MonitoringTab({
  currentTest,
  config,
  isRunning,
  onStopTest,
  onResetTest,
  onSetActiveTab,
}: MonitoringTabProps) {
  if (!currentTest) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Henüz Aktif Test Yok
          </h3>
          <p className="text-gray-500 mb-4">
            Monitoring verilerini görmek için önce bir test başlatın.
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

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Test Durumu: {currentTest.testName}
            </CardTitle>
            <div className="flex items-center gap-2">
              {currentTest.status === "running" && (
                <Badge className="bg-green-500 animate-pulse">Çalışıyor</Badge>
              )}
              {currentTest.status === "completed" && (
                <Badge className="bg-blue-500">Tamamlandı</Badge>
              )}
              {currentTest.status === "failed" && (
                <Badge className="bg-red-500">Başarısız</Badge>
              )}
              {currentTest.status === "stopped" && (
                <Badge className="bg-gray-500">Durduruldu</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>İlerleme</span>
              <span>{Math.round(currentTest.progress)}%</span>
            </div>
            <Progress value={currentTest.progress} />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentTest.metrics.totalQuestions}
                </div>
                <div className="text-sm text-gray-500">Toplam Soru</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {config.testMethods.length}
                </div>
                <div className="text-sm text-gray-500">Test Metodu</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {currentTest.status === "completed"
                    ? "100"
                    : Math.round(currentTest.progress)}
                  %
                </div>
                <div className="text-sm text-gray-500">Tamamlanma</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {currentTest.executionTime?.formatted
                    ? currentTest.executionTime.formatted
                    : currentTest.executionTime?.elapsed_seconds !== undefined
                      ? `${Math.round(currentTest.executionTime.elapsed_seconds)}s`
                      : currentTest.endTime
                        ? `${Math.round(
                            (new Date(currentTest.endTime).getTime() -
                              new Date(currentTest.startTime).getTime()) /
                              1000
                          )}s`
                        : `${Math.round(
                            (Date.now() -
                              new Date(currentTest.startTime).getTime()) /
                              1000
                          )}s`}
                </div>
                <div className="text-sm text-gray-500">Geçen Süre</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t">
              {isRunning && (
                <Button onClick={onStopTest} variant="destructive" size="sm">
                  <Square className="mr-2 h-4 w-4" />
                  Durdur
                </Button>
              )}
              <Button onClick={onResetTest} variant="outline" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" />
                Sıfırla
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Metrics Preview */}
      {currentTest.progress > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Gerçek Zamanlı Metrikler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {(currentTest.metrics.cosineSimilarity || 0).toFixed(3)}
                </div>
                <div className="text-sm text-gray-600">Cosine Similarity</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">
                  {Math.round(currentTest.metrics.avgResponseTime || 0)}ms
                </div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
