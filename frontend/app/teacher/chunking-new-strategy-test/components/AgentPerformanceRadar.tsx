"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Layers,
  Maximize2,
  Target,
  Gauge,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { getAgentScores } from "../services/evaluationApi";

interface AgentPerformanceRadarProps {
  testId: string;
  token?: string;
  onError?: (error: string) => void;
}

interface AgentData {
  name: string;
  score: number;
  weight: number;
  metrics: Record<string, number>;
  details: string;
  icon: React.ReactNode;
  color: string;
}

export default function AgentPerformanceRadar(
  props: Readonly<AgentPerformanceRadarProps>
) {
  const { testId, token, onError } = props;
  const [loading, setLoading] = useState(false);
  const [agentData, setAgentData] = useState<AgentData[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [weights, setWeights] = useState<Record<string, number>>({});

  const fetchAgentScores = async () => {
    setLoading(true);
    try {
      const result = await getAgentScores(testId, token);
      
      const agents: AgentData[] = [
        {
          name: "Structural Agent",
          score: result.agent_scores.structural.score,
          weight: result.weights.structural,
          metrics: result.agent_scores.structural.metrics,
          details: result.agent_scores.structural.details,
          icon: <Layers className="h-5 w-5" />,
          color: "#3B82F6", // blue
        },
        {
          name: "Semantic Agent",
          score: result.agent_scores.semantic.score,
          weight: result.weights.semantic,
          metrics: result.agent_scores.semantic.metrics,
          details: result.agent_scores.semantic.details,
          icon: <Brain className="h-5 w-5" />,
          color: "#10B981", // green
        },
        {
          name: "Size Agent",
          score: result.agent_scores.size.score,
          weight: result.weights.size,
          metrics: result.agent_scores.size.metrics,
          details: result.agent_scores.size.details,
          icon: <Maximize2 className="h-5 w-5" />,
          color: "#F59E0B", // amber
        },
        {
          name: "Quality Agent",
          score: result.agent_scores.quality.score,
          weight: result.weights.quality,
          metrics: result.agent_scores.quality.metrics,
          details: result.agent_scores.quality.details,
          icon: <Target className="h-5 w-5" />,
          color: "#8B5CF6", // purple
        },
      ];

      setAgentData(agents);
      setOverallScore(result.overall_score);
      setWeights(result.weights);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch agent scores";
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (testId) {
      fetchAgentScores();
    }
  }, [testId]);

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    if (score >= 0.4) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-green-500">Mükemmel</Badge>;
    if (score >= 0.6) return <Badge className="bg-yellow-500">İyi</Badge>;
    if (score >= 0.4) return <Badge className="bg-orange-500">Orta</Badge>;
    return <Badge className="bg-red-500">Zayıf</Badge>;
  };

  // Simple radar chart using CSS
  const renderRadarChart = () => {
    const size = 200;
    const center = size / 2;
    const maxRadius = size / 2 - 20;
    const levels = [0.25, 0.5, 0.75, 1];

    return (
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circles */}
        {levels.map((level) => (
          <div
            key={`level-${level}`}
            className="absolute border border-gray-200 rounded-full"
            style={{
              width: maxRadius * 2 * level,
              height: maxRadius * 2 * level,
              left: center - maxRadius * level,
              top: center - maxRadius * level,
            }}
          />
        ))}

        {/* Agent points and lines */}
        {agentData.map((agent, index) => {
          const angle = (index * 360) / agentData.length - 90;
          const radian = (angle * Math.PI) / 180;
          const radius = maxRadius * agent.score;
          const x = center + radius * Math.cos(radian);
          const y = center + radius * Math.sin(radian);

          // Label position
          const labelRadius = maxRadius + 15;
          const labelX = center + labelRadius * Math.cos(radian);
          const labelY = center + labelRadius * Math.sin(radian);

          return (
            <React.Fragment key={agent.name}>
              {/* Line from center */}
              <svg
                className="absolute"
                style={{ width: size, height: size, left: 0, top: 0 }}
              >
                <line
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke={agent.color}
                  strokeWidth="2"
                  opacity="0.6"
                />
              </svg>

              {/* Point */}
              <div
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md"
                style={{
                  backgroundColor: agent.color,
                  left: x - 8,
                  top: y - 8,
                }}
              />

              {/* Label */}
              <div
                className="absolute text-xs font-medium text-gray-600 whitespace-nowrap"
                style={{
                  left: labelX,
                  top: labelY,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {agent.name.split(" ")[0]}
              </div>
            </React.Fragment>
          );
        })}

        {/* Center score */}
        <div
          className="absolute flex flex-col items-center justify-center"
          style={{
            left: center - 30,
            top: center - 20,
            width: 60,
            height: 40,
          }}
        >
          <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
            {(overallScore * 100).toFixed(0)}
          </span>
          <span className="text-xs text-gray-500">Genel</span>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-blue-500" />
              Agent Performans Analizi
            </CardTitle>
            <CardDescription>
              Multi-Agent sistemindeki her ajanın performans skorları
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAgentScores}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : agentData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p>Agent skorları yüklenemedi</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchAgentScores}>
              Tekrar Dene
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="flex items-center justify-center">
              {renderRadarChart()}
            </div>

            {/* Agent Details */}
            <div className="space-y-4">
              {agentData.map((agent) => (
                <div key={agent.name} className="space-y-2 p-3 rounded-lg border hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${agent.color}20` }}
                      >
                        {React.cloneElement(agent.icon as React.ReactElement, {
                          style: { color: agent.color },
                        })}
                      </div>
                      <div>
                        <span className="font-medium">{agent.name}</span>
                        <div className="text-xs text-gray-500">
                          Ağırlık: {(agent.weight * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${getScoreColor(agent.score)}`}>
                        {(agent.score * 100).toFixed(1)}%
                      </span>
                      <div>{getScoreBadge(agent.score)}</div>
                    </div>
                  </div>
                  <Progress
                    value={agent.score * 100}
                    className="h-2"
                    style={
                      {
                        "--progress-background": agent.color,
                      } as React.CSSProperties
                    }
                  />
                  {/* Agent Details - Expanded */}
                  <div className="text-xs text-gray-600 mt-2">
                    {agent.details}
                  </div>
                  {Object.entries(agent.metrics).length > 0 && (
                    <div className="text-xs space-y-1 pt-2 border-t mt-2">
                      {Object.entries(agent.metrics).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-500">{key}:</span>
                          <span className="font-medium">
                            {typeof value === "number" ? value.toFixed(2) : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overall Score Summary */}
        {agentData.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">Genel Değerlendirme</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                  {(overallScore * 100).toFixed(1)}%
                </span>
                {getScoreBadge(overallScore)}
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Ağırlıklı ortalama: Structural ({(weights.structural * 100).toFixed(0)}%) + 
              Semantic ({(weights.semantic * 100).toFixed(0)}%) + 
              Size ({(weights.size * 100).toFixed(0)}%) + 
              Quality ({(weights.quality * 100).toFixed(0)}%)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
