"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  LineChart,
  PieChart,
  Radar,
  Zap,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  Download,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  GitBranch,
  Network,
  Layers,
  Target,
  Compass,
  Map,
  Navigation
  Volume2,
  VolumeX,
  Camera,
  Share2,
  Fullscreen,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCw,
  Grid,
  Layers3,
  Palette,
  Monitor,
  Smartphone,
  Tablet,
  AlertCircle,
  CheckCircle2,
  Info,
  Lightbulb,
  Filter,
  Search,
  BookOpen,
  FileText,
  Save,
  Upload
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  ComposedChart,
  ReferenceLine,
  Treemap,
  Sankey
} from "recharts";

// Interfaces
interface ChunkData {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  size: number;
  semanticScore?: number;
  boundaryType?: "natural" | "forced" | "semantic";
  reasoning?: string;
}

interface DriftPoint {
  chunkIndex: number;
  position: number;
  driftScore: number;
  driftType: "semantic" | "topic" | "linguistic" | "contextual";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  confidence: number;
  timestamp: number;
}

interface TopicFlow {
  chunkIndex: number;
  topics: string[];
  topicWeights: Record<string, number>;
  transitions: TopicTransition[];
  coherenceScore: number;
  stabilityScore: number;
}

interface TopicTransition {
  fromTopic: string;
  toTopic: string;
  strength: number;
  type: "smooth" | "abrupt" | "gradual";
  naturalness: number;
}

interface SemanticCluster {
  id: string;
  centroid: number[];
  chunks: number[];
  coherence: number;
  size: number;
  label: string;
  color: string;
}

interface DriftVisualizationData {
  timeline: DriftPoint[];
  topicFlow: TopicFlow[];
  semanticClusters: SemanticCluster[];
  coherenceMap: number[][];
  driftHeatmap: number[][];
  transitionMatrix: number[][];
  stabilityMetrics: StabilityMetric[];
}

interface StabilityMetric {
  chunkIndex: number;
  semanticStability: number;
  topicStability: number;
  linguisticStability: number;
  overallStability: number;
  volatility: number;
}

interface VisualizationConfig {
  showTimeline: boolean;
  showTopicFlow: boolean;
  showSemanticClusters: boolean;
  showCoherenceMap: boolean;
  showDriftHeatmap: boolean;
  showTransitionMatrix: boolean;
  animationSpeed: number;
  colorScheme: "default" | "colorblind" | "high_contrast";
  showConfidenceIntervals: boolean;
  highlightCriticalDrifts: boolean;
  smoothingFactor: number;
}

interface DriftVisualizationProps {
  chunks: ChunkData[];
  driftData?: DriftVisualizationData;
  onVisualizationUpdate?: (data: DriftVisualizationData) => void;
  enableRealTimeUpdate?: boolean;
  showInteractiveControls?: boolean;
  turkishOptimized?: boolean;
}

const DriftVisualization: React.FC<DriftVisualizationProps> = ({
  chunks,
  driftData,
  onVisualizationUpdate,
  enableRealTimeUpdate = true,
  showInteractiveControls = true,
  turkishOptimized = true
}) => {
  const [activeTab, setActiveTab] = useState<"timeline" | "flow" | "clusters" | "heatmap" | "analysis">("timeline");
  const [isGenerating, setIsGenerating] = useState(false);
  const [visualizationData, setVisualizationData] = useState<DriftVisualizationData | null>(driftData || null);
  const [selectedChunk, setSelectedChunk] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [config, setConfig] = useState<VisualizationConfig>({
    showTimeline: true,
    showTopicFlow: true,
    showSemanticClusters: true,
    showCoherenceMap: true,
    showDriftHeatmap: true,
    showTransitionMatrix: true,
    animationSpeed: 1000,
    colorScheme: "default",
    showConfidenceIntervals: true,
    highlightCriticalDrifts: true,
    smoothingFactor: 0.3
  });

  // Color schemes
  const colorSchemes = {
    default: {
      primary: "#3b82f6",
      secondary: "#10b981",
      warning: "#f59e0b",
      danger: "#ef4444",
      info: "#8b5cf6",
      success: "#22c55e"
    },
    colorblind: {
      primary: "#1f77b4",
      secondary: "#ff7f0e",
      warning: "#2ca02c",
      danger: "#d62728",
      info: "#9467bd",
      success: "#8c564b"
    },
    high_contrast: {
      primary: "#000000",
      secondary: "#ffffff",
      warning: "#ffff00",
      danger: "#ff0000",
      info: "#0000ff",
      success: "#00ff00"
    }
  };

  const currentColors = colorSchemes[config.colorScheme];

  // Generate visualization data
  const generateVisualizationData = async () => {
    if (chunks.length === 0) return;

    setIsGenerating(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate drift timeline
      const timeline = generateDriftTimeline();
      
      // Generate topic flow
      const topicFlow = generateTopicFlow();
      
      // Generate semantic clusters
      const semanticClusters = generateSemanticClusters();
      
      // Generate coherence map
      const coherenceMap = generateCoherenceMap();
      
      // Generate drift heatmap
      const driftHeatmap = generateDriftHeatmap();
      
      // Generate transition matrix
      const transitionMatrix = generateTransitionMatrix();
      
      // Generate stability metrics
      const stabilityMetrics = generateStabilityMetrics();

      const data: DriftVisualizationData = {
        timeline,
        topicFlow,
        semanticClusters,
        coherenceMap,
        driftHeatmap,
        transitionMatrix,
        stabilityMetrics
      };

      setVisualizationData(data);
      
      if (onVisualizationUpdate) {
        onVisualizationUpdate(data);
      }

    } catch (error) {
      console.error("Visualization generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate drift timeline data
  const generateDriftTimeline = (): DriftPoint[] => {
    const timeline: DriftPoint[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Simulate drift detection
      const driftScore = Math.random() * 0.8 + 0.1; // 0.1 to 0.9
      const driftTypes = ["semantic", "topic", "linguistic", "contextual"] as const;
      const driftType = driftTypes[Math.floor(Math.random() * driftTypes.length)];
      
      let severity: "low" | "medium" | "high" | "critical";
      if (driftScore > 0.8) severity = "critical";
      else if (driftScore > 0.6) severity = "high";
      else if (driftScore > 0.4) severity = "medium";
      else severity = "low";

      timeline.push({
        chunkIndex: i,
        position: chunk.startIndex,
        driftScore,
        driftType,
        severity,
        description: generateDriftDescription(driftType, severity),
        confidence: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
        timestamp: Date.now() + i * 1000
      });
    }
    
    return timeline;
  };

  // Generate topic flow data
  const generateTopicFlow = (): TopicFlow[] => {
    const topicFlow: TopicFlow[] = [];
    const availableTopics = [
      "biyoloji", "fizik", "kimya", "matematik", "tarih", "coğrafya",
      "edebiyat", "felsefe", "psikoloji", "sosyoloji", "ekonomi", "hukuk"
    ];
    
    for (let i = 0; i < chunks.length; i++) {
      const numTopics = Math.floor(Math.random() * 3) + 1; // 1-3 topics
      const topics = availableTopics
        .sort(() => Math.random() - 0.5)
        .slice(0, numTopics);
      
      const topicWeights: Record<string, number> = {};
      topics.forEach(topic => {
        topicWeights[topic] = Math.random();
      });
      
      // Normalize weights
      const totalWeight = Object.values(topicWeights).reduce((sum, w) => sum + w, 0);
      Object.keys(topicWeights).forEach(topic => {
        topicWeights[topic] /= totalWeight;
      });
      
      const transitions: TopicTransition[] = [];
      if (i > 0) {
        const prevTopics = topicFlow[i - 1].topics;
        topics.forEach(currentTopic => {
          prevTopics.forEach(prevTopic => {
            if (currentTopic !== prevTopic) {
              const strength = Math.random() * 0.8 + 0.2;
              const types = ["smooth", "abrupt", "gradual"] as const;
              const type = types[Math.floor(Math.random() * types.length)];
              
              transitions.push({
                fromTopic: prevTopic,
                toTopic: currentTopic,
                strength,
                type,
                naturalness: type === "smooth" ? 0.8 + Math.random() * 0.2 :
                           type === "gradual" ? 0.5 + Math.random() * 0.3 :
                           Math.random() * 0.5
              });
            }
          });
        });
      }
      
      topicFlow.push({
        chunkIndex: i,
        topics,
        topicWeights,
        transitions,
        coherenceScore: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
        stabilityScore: Math.random() * 0.5 + 0.5 // 0.5 to 1.0
      });
    }
    
    return topicFlow;
  };

  // Generate semantic clusters
  const generateSemanticClusters = (): SemanticCluster[] => {
    const clusters: SemanticCluster[] = [];
    const numClusters = Math.min(Math.floor(chunks.length / 3), 8);
    const colors = [
      "#3b82f6", "#10b981", "#f59e0b", "#ef4444", 
      "#8b5cf6", "#22c55e", "#f97316", "#06b6d4"
    ];
    
    for (let i = 0; i < numClusters; i++) {
      const clusterSize = Math.floor(Math.random() * 5) + 2; // 2-6 chunks
      const chunkIndices: number[] = [];
      
      // Randomly assign chunks to clusters
      while (chunkIndices.length < clusterSize && chunkIndices.length < chunks.length) {
        const randomIndex = Math.floor(Math.random() * chunks.length);
        if (!chunkIndices.includes(randomIndex)) {
          chunkIndices.push(randomIndex);
        }
      }
      
      clusters.push({
        id: `cluster_${i}`,
        centroid: [Math.random() * 100, Math.random() * 100], // 2D coordinates
        chunks: chunkIndices,
        coherence: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
        size: chunkIndices.length,
        label: `Küme ${i + 1}`,
        color: colors[i % colors.length]
      });
    }
    
    return clusters;
  };

  // Generate coherence map
  const generateCoherenceMap = (): number[][] => {
    const size = chunks.length;
    const map: number[][] = [];
    
    for (let i = 0; i < size; i++) {
      map[i] = [];
      for (let j = 0; j < size; j++) {
        if (i === j) {
          map[i][j] = 1.0; // Perfect self-coherence
        } else {
          const distance = Math.abs(i - j);
          const baseCoherence = Math.max(0, 1 - distance * 0.1); // Decay with distance
          map[i][j] = baseCoherence + (Math.random() - 0.5) * 0.2; // Add noise
          map[i][j] = Math.max(0, Math.min(1, map[i][j])); // Clamp to [0,1]
        }
      }
    }
    
    return map;
  };

  // Generate drift heatmap
  const generateDriftHeatmap = (): number[][] => {
    const size = chunks.length;
    const heatmap: number[][] = [];
    
    for (let i = 0; i < size; i++) {
      heatmap[i] = [];
      for (let j = 0; j < size; j++) {
        // Higher values indicate more drift
        const distance = Math.abs(i - j);
        const baseDrift = distance > 0 ? Math.random() * 0.6 + 0.1 : 0; // 0.1 to 0.7
        heatmap[i][j] = baseDrift;
      }
    }
    
    return heatmap;
  };

  // Generate transition matrix
  const generateTransitionMatrix = (): number[][] => {
    const topics = ["biyoloji", "fizik", "kimya", "matematik", "tarih", "coğrafya"];
    const size = topics.length;
    const matrix: number[][] = [];
    
    for (let i = 0; i < size; i++) {
      matrix[i] = [];
      for (let j = 0; j < size; j++) {
        if (i === j) {
          matrix[i][j] = 0.6 + Math.random() * 0.3; // High self-transition
        } else {
          matrix[i][j] = Math.random() * 0.4; // Lower cross-transitions
        }
      }
      
      // Normalize row to sum to 1
      const rowSum = matrix[i].reduce((sum, val) => sum + val, 0);
      matrix[i] = matrix[i].map(val => val / rowSum);
    }
    
    return matrix;
  };

  // Generate stability metrics
  const generateStabilityMetrics = (): StabilityMetric[] => {
    return chunks.map((_, index) => ({
      chunkIndex: index,
      semanticStability: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
      topicStability: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
      linguisticStability: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
      overallStability: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
      volatility: Math.random() * 0.5 // 0.0 to 0.5
    }));
  };

  // Helper functions
  const generateDriftDescription = (type: string, severity: string): string => {
    const descriptions = {
      semantic: {
        low: "Hafif semantik kayma",
        medium: "Orta düzeyde semantik değişim",
        high: "Yüksek semantik sapma",
        critical: "Kritik semantik kopukluk"
      },
      topic: {
        low: "Hafif konu değişimi",
        medium: "Orta düzeyde konu geçişi",
        high: "Ani konu değişimi",
        critical: "Kritik konu sapması"
      },
      linguistic: {
        low: "Hafif dilsel değişim",
        medium: "Orta düzeyde dilsel farklılık",
        high: "Yüksek dilsel tutarsızlık",
        critical: "Kritik dilsel kopukluk"
      },
      contextual: {
        low: "Hafif bağlamsal değişim",
        medium: "Orta düzeyde bağlam kayması",
        high: "Yüksek bağlamsal sapma",
        critical: "Kritik bağlam kopukluğu"
      }
    };
    
    return descriptions[type as keyof typeof descriptions]?.[severity as keyof typeof descriptions.semantic] || "Bilinmeyen sapma";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return currentColors.danger;
      case "high": return currentColors.warning;
      case "medium": return currentColors.info;
      case "low": return currentColors.success;
      default: return currentColors.primary;
    }
  };

  const getDriftTypeIcon = (type: string) => {
    switch (type) {
      case "semantic": return <Target className="h-4 w-4" />;
      case "topic": return <GitBranch className="h-4 w-4" />;
      case "linguistic": return <Network className="h-4 w-4" />;
      case "contextual": return <Layers className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  // Animation controls
  const playAnimation = () => {
    setIsPlaying(true);
    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        if (prev >= chunks.length - 1) {
          setIsPlaying(false);
          clearInterval(interval);
          return 0;
        }
        return prev + 1;
      });
    }, config.animationSpeed);
  };

  const pauseAnimation = () => {
    setIsPlaying(false);
  };

  const resetAnimation = () => {
    setIsPlaying(false);
    setCurrentFrame(0);
  };

  // Prepare chart data
  const timelineChartData = useMemo(() => {
    if (!visualizationData) return [];
    
    return visualizationData.timeline.map(point => ({
      chunkIndex: point.chunkIndex,
      driftScore: point.driftScore,
      confidence: point.confidence,
      severity: point.severity,
      type: point.driftType
    }));
  }, [visualizationData]);

  const stabilityChartData = useMemo(() => {
    if (!visualizationData) return [];
    
    return visualizationData.stabilityMetrics.map(metric => ({
      chunkIndex: metric.chunkIndex,
      semantic: metric.semanticStability,
      topic: metric.topicStability,
      linguistic: metric.linguisticStability,
      overall: metric.overallStability,
      volatility: metric.volatility
    }));
  }, [visualizationData]);

  const topicFlowChartData = useMemo(() => {
    if (!visualizationData) return [];
    
    return visualizationData.topicFlow.map(flow => ({
      chunkIndex: flow.chunkIndex,
      coherence: flow.coherenceScore,
      stability: flow.stabilityScore,
      topicCount: flow.topics.length,
      transitionCount: flow.transitions.length
    }));
  }, [visualizationData]);

  // Auto-generate when chunks change
  useEffect(() => {
    if (chunks.length > 0 && enableRealTimeUpdate) {
      generateVisualizationData();
    }
  }, [chunks]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Sapma Görselleştirme Sistemi</h2>
          {visualizationData && (
            <Badge variant="outline" className="ml-2">
              {chunks.length} Chunk Analizi
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isGenerating && (
            <Badge className="bg-purple-500 animate-pulse">
              <Activity className="h-3 w-3 mr-1" />
              Oluşturuluyor
            </Badge>
          )}
          <Button
            onClick={generateVisualizationData}
            disabled={isGenerating || chunks.length === 0}
            size="sm"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <BarChart3 className="mr-2 h-4 w-4" />
                Görselleştir
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Animation Controls */}
      {showInteractiveControls && visualizationData && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isPlaying ? pauseAnimation : playAnimation}
                  disabled={chunks.length === 0}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Duraklat
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Oynat
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAnimation}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Sıfırla
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentFrame(Math.max(0, currentFrame - 1))}
                  disabled={currentFrame === 0}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentFrame(Math.min(chunks.length - 1, currentFrame + 1))}
                  disabled={currentFrame >= chunks.length - 1}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Frame: {currentFrame + 1} / {chunks.length}
                </div>
                <input
                  type="range"
                  min="0"
                  max={chunks.length - 1}
                  value={currentFrame}
                  onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
                  className="w-32"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Zaman Çizelgesi
          </TabsTrigger>
          <TabsTrigger value="flow" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Konu Akışı
          </TabsTrigger>
          <TabsTrigger value="clusters" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Kümeler
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Isı Haritası
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Compass className="h-4 w-4" />
            Analiz
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          {visualizationData ? (
            <div className="space-y-6">
              {/* Drift Timeline Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Sapma Zaman Çizelgesi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={timelineChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="chunkIndex" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="driftScore" 
                        stroke={currentColors.primary}
                        strokeWidth={3}
                        name="Sapma Skoru"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="confidence" 
                        stroke={currentColors.secondary}
                        strokeWidth={2}
                        name="Güven Skoru"
                      />
                      {config.highlightCriticalDrifts && (
                        <ReferenceLine y={0.8} stroke={currentColors.danger} strokeDasharray="5 5" />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Drift Points List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Sapma Noktaları
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {visualizationData.timeline
                      .filter(point => config.highlightCriticalDrifts ? point.severity === "critical" || point.severity === "high" : true)
                      .map((point, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          {getDriftTypeIcon(point.driftType)}
                          <div>
                            <div className="font-medium">Chunk #{point.chunkIndex + 1}</div>
                            <div className="text-sm text-gray-600">{point.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className="text-white"
                            style={{ backgroundColor: getSeverityColor(point.severity) }}
                          >
                            {point.severity === "critical" ? "Kritik" :
                             point.severity === "high" ? "Yüksek" :
                             point.severity === "medium" ? "Orta" : "Düşük"}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            {(point.driftScore * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz Görselleştirme Mevcut Değil
                </h3>
                <p className="text-gray-500">
                  Sapma görselleştirmesini başlatmak için "Görselleştir" butonuna tıklayın.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Topic Flow Tab */}
        <TabsContent value="flow" className="space-y-6">
          {visualizationData ? (
            <div className="space-y-6">
              {/* Topic Flow Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Konu Akış Analizi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={topicFlowChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="chunkIndex" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="coherence" 
                        stackId="1"
                        stroke={currentColors.primary}
                        fill={currentColors.primary}
                        fillOpacity={0.6}
                        name="Tutarlılık"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="stability" 
                        stackId="2"
                        stroke={currentColors.secondary}
                        fill={currentColors.secondary}
                        fillOpacity={0.6}
                        name="Kararlılık"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Topic Transitions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    Konu Geçişleri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visualizationData.topicFlow.slice(0, 6).map((flow, index) => (
                      <div key={index} className="bg-blue-50 rounded p-4">
                        <div className="font-medium mb-2">Chunk #{flow.chunkIndex + 1}</div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-gray-600">Konular: </span>
                            {flow.topics.join(", ")}
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Tutarlılık: </span>
                            <span className="font-medium text-blue-600">
                              {(flow.coherenceScore * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Geçişler: </span>
                            <span className="font-medium text-purple-600">
                              {flow.transitions.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Konu Akışı Mevcut Değil
                </h3>
                <p className="text-gray-500">
                  Konu akış analizini görmek için önce görselleştirme yapın.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Semantic Clusters Tab */}
        <TabsContent value="clusters" className="space-y-6">
          {visualizationData ? (
            <div className="space-y-6">
              {/* Cluster Scatter Plot */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Semantik Kümeler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="x" name="X Koordinatı" />
                      <YAxis type="number" dataKey="y" name="Y Koordinatı" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      {visualizationData.semanticClusters.map((cluster, index) => (
                        <Scatter
                          key={cluster.id}
                          name={cluster.label}
                          data={[{ x: cluster.centroid[0], y: cluster.centroid[1], size: cluster.size * 10 }]}
                          fill={cluster.color}
                        />
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Cluster Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Küme Detayları
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visualizationData.semanticClusters.map((cluster, index) => (
                      <div key={cluster.id} className="border rounded p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: cluster.color }}
                          />
                          <div className="font-medium">{cluster.label}</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Chunk Sayısı:</span>
                            <span className="font-medium">{cluster.size}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tutarlılık:</span>
                            <span className="font-medium text-green-600">
                              {(cluster.coherence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Chunk'lar:</span>
                            <span className="font-medium text-blue-600">
                              {cluster.chunks.slice(0, 3).map(c => `#${c + 1}`).join(", ")}
                              {cluster.chunks.length > 3 && "..."}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Küme Analizi Mevcut Değil
                </h3>
                <p className="text-gray-500">
                  Semantik küme analizini görmek için önce görselleştirme yapın.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Heatmap Tab */}
        <TabsContent value="heatmap" className="space-y-6">
          {visualizationData ? (
            <div className="space-y-6">
              {/* Coherence Heatmap */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    Tutarlılık Isı Haritası
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-center text-gray-600 mb-4">
                      Chunk'lar Arası Tutarlılık Matrisi
                    </div>
                    <div className="grid gap-1" style={{ 
                      gridTemplateColumns: `repeat(${Math.min(chunks.length, 10)}, 1fr)` 
                    }}>
                      {visualizationData.coherenceMap.slice(0, 10).map((row, i) => 
                        row.slice(0, 10).map((value, j) => (
                          <div
                            key={`${i}-${j}`}
                            className="aspect-square flex items-center justify-center text-xs font-medium rounded"
                            style={{
                              backgroundColor: `rgba(59, 130, 246, ${value})`,
                              color: value > 0.5 ? 'white' : 'black'
                            }}
                            title={`Chunk ${i+1} → Chunk ${j+1}: ${(value * 100).toFixed(0)}%`}
                          >
                            {(value * 100).toFixed(0)}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Drift Heatmap */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Sapma Isı Haritası
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-center text-gray-600 mb-4">
                      Chunk'lar Arası Sapma Matrisi
                    </div>
                    <div className="grid gap-1" style={{ 
                      gridTemplateColumns: `repeat(${Math.min(chunks.length, 10)}, 1fr)` 
                    }}>
                      {visualizationData.driftHeatmap.slice(0, 10).map((row, i) => 
                        row.slice(0, 10).map((value, j) => (
                          <div
                            key={`${i}-${j}`}
                            className="aspect-square flex items-center justify-center text-xs font-medium rounded"
                            style={{
                              backgroundColor: `rgba(239, 68, 68, ${value})`,
                              color: value > 0.5 ? 'white' : 'black'
                            }}
                            title={`Chunk ${i+1} → Chunk ${j+1}: ${(value * 100).toFixed(0)}% sapma`}
                          >
                            {(value * 100).toFixed(0)}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Isı Haritası Mevcut Değil
                </h3>
                <p className="text-gray-500">
                  Isı haritası analizini görmek için önce görselleştirme yapın.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {visualizationData ? (
            <div className="space-y-6">
              {/* Stability Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Compass className="h-5 w-5" />
                    Kararlılık Analizi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={stabilityChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="chunkIndex" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="overall" 
                        stroke={currentColors.primary}
                        strokeWidth={3}
                        name="Genel Kararlılık"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="semantic" 
                        stroke={currentColors.secondary}
                        strokeWidth={2}
                        name="Semantik"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="topic" 
                        stroke={currentColors.warning}
                        strokeWidth={2}
                        name="Konu"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="linguistic" 
                        stroke={currentColors.info}
                        strokeWidth={2}
                        name="Dilsel"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Ortalama Sapma</p>
                        <p className="text-2xl font-bold text-red-600">
                          {visualizationData.timeline.length > 0 ? 
                            (visualizationData.timeline.reduce((sum, p) => sum + p.driftScore, 0) / visualizationData.timeline.length * 100).toFixed(0) : 0}%
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Kritik Sapma</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {visualizationData.timeline.filter(p => p.severity === "critical").length}
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Küme Sayısı</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {visualizationData.semanticClusters.length}
                        </p>
                      </div>
                      <Network className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Ortalama Kararlılık</p>
                        <p className="text-2xl font-bold text-green-600">
                          {visualizationData.stabilityMetrics.length > 0 ? 
                            (visualizationData.stabilityMetrics.reduce((sum, m) => sum + m.overallStability, 0) / visualizationData.stabilityMetrics.length * 100).toFixed(0) : 0}%
                        </p>
                      </div>
                      <Compass className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Dışa Aktarma
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Görselleştirmeyi İndir
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analiz Raporunu İndir
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Verileri Dışa Aktar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Compass className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Analiz Mevcut Değil
                </h3>
                <p className="text-gray-500">
                  Detaylı analizi görmek için önce görselleştirme yapın.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Visualization Settings */}
      {showInteractiveControls && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Görselleştirme Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Kritik Sapmaları Vurgula</Label>
                  <input
                    type="checkbox"
                    checked={config.highlightCriticalDrifts}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      highlightCriticalDrifts: e.target.checked
                    }))}
                    className="w-4 h-4 text-purple-600"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Güven Aralıklarını Göster</Label>
                  <input
                    type="checkbox"
                    checked={config.showConfidenceIntervals}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      showConfidenceIntervals: e.target.checked
                    }))}
                    className="w-4 h-4 text-purple-600"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="color-scheme">Renk Şeması</Label>
                  <select
                    id="color-scheme"
                    value={config.colorScheme}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      colorScheme: e.target.value as "default" | "colorblind" | "high_contrast"
                    }))}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="default">Varsayılan</option>
                    <option value="colorblind">Renk Körlüğü Dostu</option>
                    <option value="high_contrast">Yüksek Kontrast</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="animation-speed">
                    Animasyon Hızı ({config.animationSpeed}ms)
                  </Label>
                  <input
                    id="animation-speed"
                    type="range"
                    min="500"
                    max="3000"
                    step="250"
                    value={config.animationSpeed}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      animationSpeed: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriftVisualization;