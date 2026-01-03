"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Bell,
  BellOff,
  Play,
  Pause,
  Square,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Gauge,
  Target,
  Database,
  Wifi,
  WifiOff,
  Signal,
  Loader2,
  AlertCircle,
  Info,
  CheckSquare,
  X,
  Filter,
  Search,
  Download,
  BarChart3,
  LineChart,
  PieChart,
} from "lucide-react";

// Monitoring Interfaces
interface MonitoringConfig {
  enabled: boolean;
  interval: number; // in milliseconds
  thresholds: MonitoringThresholds;
  alerts: AlertConfig;
  metrics: string[];
  autoRestart: boolean;
  maxRetries: number;
  timeout: number;
}

interface MonitoringThresholds {
  overallQuality: { min: number; max: number };
  semanticCoherence: { min: number; max: number };
  boundaryPrecision: { min: number; max: number };
  processingTime: { min: number; max: number };
  memoryUsage: { min: number; max: number };
  errorRate: { min: number; max: number };
}

interface AlertConfig {
  enabled: boolean;
  email: boolean;
  browser: boolean;
  sound: boolean;
  levels: ("info" | "warning" | "error" | "critical")[];
  cooldown: number; // in milliseconds
}

interface MonitoringData {
  timestamp: string;
  status: "healthy" | "warning" | "error" | "critical";
  metrics: { [key: string]: number };
  alerts: MonitoringAlert[];
  performance: PerformanceData;
  system: SystemData;
}

interface MonitoringAlert {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "critical";
  metric: string;
  message: string;
  value: number;
  threshold: number;
  acknowledged: boolean;
  resolved: boolean;
}

interface PerformanceData {
  processingTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  throughput: number;
  errorRate: number;
}

interface SystemData {
  uptime: number;
  lastUpdate: string;
  connectionStatus: "connected" | "disconnected" | "reconnecting";
  version: string;
  environment: string;
}

interface ContinuousMonitoringProps {
  chunks: any[];
  originalText: string;
  evaluationResults?: any;
  onAlert?: (alert: MonitoringAlert) => void;
  onStatusChange?: (status: string) => void;
  enableNotifications?: boolean;
  enableAutoRestart?: boolean;
  customThresholds?: Partial<MonitoringThresholds>;
}

export default function ContinuousMonitoring({
  chunks,
  originalText,
  evaluationResults,
  onAlert,
  onStatusChange,
  enableNotifications = true,
  enableAutoRestart = true,
  customThresholds = {},
}: ContinuousMonitoringProps) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [config, setConfig] = useState<MonitoringConfig>({
    enabled: false,
    interval: 30000, // 30 seconds
    thresholds: {
      overallQuality: { min: 0.7, max: 1.0 },
      semanticCoherence: { min: 0.75, max: 1.0 },
      boundaryPrecision: { min: 0.8, max: 1.0 },
      processingTime: { min: 0, max: 30000 },
      memoryUsage: { min: 0, max: 512 },
      errorRate: { min: 0, max: 0.05 },
      ...customThresholds,
    },
    alerts: {
      enabled: enableNotifications,
      email: false,
      browser: true,
      sound: false,
      levels: ["warning", "error", "critical"],
      cooldown: 60000, // 1 minute
    },
    metrics: [
      "overallQuality",
      "semanticCoherence",
      "boundaryPrecision",
      "processingTime",
      "memoryUsage",
      "errorRate",
    ],
    autoRestart: enableAutoRestart,
    maxRetries: 3,
    timeout: 10000,
  });

  const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([]);
  const [currentStatus, setCurrentStatus] = useState<"healthy" | "warning" | "error" | "critical">("healthy");
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [systemData, setSystemData] = useState<SystemData>({
    uptime: 0,
    lastUpdate: new Date().toISOString(),
    connectionStatus: "disconnected",
    version: "1.0.0",
    environment: "development",
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h");
  const [alertFilter, setAlertFilter] = useState("all");
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const retryCountRef = useRef<number>(0);
  const lastAlertTimeRef = useRef<{ [key: string]: number }>({});

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    setCurrentStatus("healthy");
    startTimeRef.current = Date.now();
    retryCountRef.current = 0;

    setSystemData(prev => ({
      ...prev,
      connectionStatus: "connected",
      lastUpdate: new Date().toISOString(),
    }));

    const monitor = async () => {
      try {
        const data = await collectMonitoringData();
        setMonitoringData(prev => [...prev.slice(-99), data]); // Keep last 100 entries
        
        const status = determineSystemStatus(data);
        setCurrentStatus(status);
        
        if (onStatusChange) {
          onStatusChange(status);
        }

        // Check for alerts
        const newAlerts = checkForAlerts(data);
        if (newAlerts.length > 0) {
          setAlerts(prev => [...prev, ...newAlerts]);
          newAlerts.forEach(alert => {
            if (onAlert) {
              onAlert(alert);
            }
            if (config.alerts.browser && shouldTriggerAlert(alert)) {
              showBrowserNotification(alert);
            }
          });
        }

        // Update system data
        setSystemData(prev => ({
          ...prev,
          uptime: Date.now() - startTimeRef.current,
          lastUpdate: new Date().toISOString(),
          connectionStatus: "connected",
        }));

        retryCountRef.current = 0;

      } catch (error) {
        console.error("Monitoring error:", error);
        retryCountRef.current++;
        
        if (retryCountRef.current >= config.maxRetries) {
          setCurrentStatus("error");
          setSystemData(prev => ({
            ...prev,
            connectionStatus: "disconnected",
          }));
          
          if (config.autoRestart) {
            setTimeout(() => {
              retryCountRef.current = 0;
            }, config.interval * 2);
          }
        } else {
          setSystemData(prev => ({
            ...prev,
            connectionStatus: "reconnecting",
          }));
        }
      }
    };

    // Initial monitoring
    monitor();

    // Set up interval
    monitoringIntervalRef.current = setInterval(monitor, config.interval);
  }, [isMonitoring, config, onAlert, onStatusChange]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }

    setSystemData(prev => ({
      ...prev,
      connectionStatus: "disconnected",
    }));
  }, []);

  // Collect monitoring data
  const collectMonitoringData = async (): Promise<MonitoringData> => {
    const startTime = Date.now();
    
    // Simulate data collection
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    const processingTime = Date.now() - startTime;
    const memoryUsage = 128 + Math.random() * 256; // MB
    const cpuUsage = 10 + Math.random() * 30; // %
    const networkLatency = 50 + Math.random() * 100; // ms
    const throughput = 100 + Math.random() * 500; // ops/sec
    const errorRate = Math.random() * 0.02; // 0-2%

    // Calculate quality metrics based on current evaluation results
    const overallQuality = evaluationResults?.overallScore || (0.7 + Math.random() * 0.25);
    const semanticCoherence = evaluationResults?.metrics?.semanticCoherence?.score || (0.75 + Math.random() * 0.2);
    const boundaryPrecision = evaluationResults?.metrics?.boundaryPrecision?.score || (0.8 + Math.random() * 0.15);

    return {
      timestamp: new Date().toISOString(),
      status: "healthy",
      metrics: {
        overallQuality,
        semanticCoherence,
        boundaryPrecision,
        processingTime,
        memoryUsage,
        errorRate,
      },
      alerts: [],
      performance: {
        processingTime,
        memoryUsage,
        cpuUsage,
        networkLatency,
        throughput,
        errorRate,
      },
      system: systemData,
    };
  };

  // Determine system status based on monitoring data
  const determineSystemStatus = (data: MonitoringData): "healthy" | "warning" | "error" | "critical" => {
    const { metrics, performance } = data;
    const { thresholds } = config;

    let criticalCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    // Check quality metrics
    if (metrics.overallQuality < thresholds.overallQuality.min * 0.8) criticalCount++;
    else if (metrics.overallQuality < thresholds.overallQuality.min) errorCount++;
    else if (metrics.overallQuality < thresholds.overallQuality.min * 1.1) warningCount++;

    // Check performance metrics
    if (performance.processingTime > thresholds.processingTime.max * 2) criticalCount++;
    else if (performance.processingTime > thresholds.processingTime.max) errorCount++;
    else if (performance.processingTime > thresholds.processingTime.max * 0.8) warningCount++;

    if (performance.memoryUsage > thresholds.memoryUsage.max * 1.5) criticalCount++;
    else if (performance.memoryUsage > thresholds.memoryUsage.max) errorCount++;
    else if (performance.memoryUsage > thresholds.memoryUsage.max * 0.8) warningCount++;

    if (performance.errorRate > thresholds.errorRate.max * 3) criticalCount++;
    else if (performance.errorRate > thresholds.errorRate.max) errorCount++;
    else if (performance.errorRate > thresholds.errorRate.max * 0.5) warningCount++;

    if (criticalCount > 0) return "critical";
    if (errorCount > 0) return "error";
    if (warningCount > 0) return "warning";
    return "healthy";
  };

  // Check for alerts
  const checkForAlerts = (data: MonitoringData): MonitoringAlert[] => {
    const newAlerts: MonitoringAlert[] = [];
    const { metrics, performance } = data;
    const { thresholds } = config;

    // Check each metric against thresholds
    Object.entries(metrics).forEach(([metric, value]) => {
      const threshold = thresholds[metric as keyof MonitoringThresholds];
      if (!threshold) return;

      let level: "info" | "warning" | "error" | "critical" | null = null;
      let message = "";

      if (value < threshold.min * 0.8) {
        level = "critical";
        message = `${metric} kritik seviyede düşük: ${(value * 100).toFixed(1)}%`;
      } else if (value < threshold.min) {
        level = "error";
        message = `${metric} eşik değerin altında: ${(value * 100).toFixed(1)}%`;
      } else if (value < threshold.min * 1.1) {
        level = "warning";
        message = `${metric} eşik değere yakın: ${(value * 100).toFixed(1)}%`;
      }

      if (level && config.alerts.levels.includes(level)) {
        newAlerts.push({
          id: `${metric}_${Date.now()}`,
          timestamp: new Date().toISOString(),
          level,
          metric,
          message,
          value,
          threshold: threshold.min,
          acknowledged: false,
          resolved: false,
        });
      }
    });

    // Check performance metrics
    if (performance.processingTime > thresholds.processingTime.max) {
      newAlerts.push({
        id: `processing_time_${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: performance.processingTime > thresholds.processingTime.max * 2 ? "critical" : "error",
        metric: "processingTime",
        message: `İşlem süresi çok yüksek: ${performance.processingTime}ms`,
        value: performance.processingTime,
        threshold: thresholds.processingTime.max,
        acknowledged: false,
        resolved: false,
      });
    }

    if (performance.memoryUsage > thresholds.memoryUsage.max) {
      newAlerts.push({
        id: `memory_usage_${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: performance.memoryUsage > thresholds.memoryUsage.max * 1.5 ? "critical" : "error",
        metric: "memoryUsage",
        message: `Bellek kullanımı yüksek: ${performance.memoryUsage.toFixed(1)}MB`,
        value: performance.memoryUsage,
        threshold: thresholds.memoryUsage.max,
        acknowledged: false,
        resolved: false,
      });
    }

    return newAlerts;
  };

  // Check if alert should be triggered (considering cooldown)
  const shouldTriggerAlert = (alert: MonitoringAlert): boolean => {
    const lastAlertTime = lastAlertTimeRef.current[alert.metric] || 0;
    const now = Date.now();
    
    if (now - lastAlertTime < config.alerts.cooldown) {
      return false;
    }
    
    lastAlertTimeRef.current[alert.metric] = now;
    return true;
  };

  // Show browser notification
  const showBrowserNotification = (alert: MonitoringAlert) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      new Notification(`Chunk Kalitesi Uyarısı - ${alert.level.toUpperCase()}`, {
        body: alert.message,
        icon: "/favicon.ico",
        tag: alert.metric,
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          showBrowserNotification(alert);
        }
      });
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  // Resolve alert
  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  // Clear all alerts
  const clearAllAlerts = () => {
    setAlerts([]);
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (alertFilter !== "all" && alert.level !== alertFilter) return false;
    if (!showAcknowledged && alert.acknowledged) return false;
    return true;
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-600";
      case "warning": return "text-yellow-600";
      case "error": return "text-red-600";
      case "critical": return "text-red-800";
      default: return "text-gray-600";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "error": return <XCircle className="h-5 w-5 text-red-500" />;
      case "critical": return <AlertCircle className="h-5 w-5 text-red-800" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get alert icon
  const getAlertIcon = (level: string) => {
    switch (level) {
      case "info": return <Info className="h-4 w-4 text-blue-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error": return <XCircle className="h-4 w-4 text-red-500" />;
      case "critical": return <AlertCircle className="h-4 w-4 text-red-800" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format uptime
  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}g ${hours % 24}s ${minutes % 60}d`;
    if (hours > 0) return `${hours}s ${minutes % 60}d ${seconds % 60}sn`;
    if (minutes > 0) return `${minutes}d ${seconds % 60}sn`;
    return `${seconds}sn`;
  };

  // Export monitoring data
  const exportMonitoringData = () => {
    const data = {
      config,
      monitoringData,
      alerts,
      systemData,
      timestamp: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monitoring_data_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-blue-500" />
                Sürekli İzleme Sistemi
                {getStatusIcon(currentStatus)}
              </CardTitle>
              <CardDescription>
                Gerçek zamanlı kalite izleme ve uyarı sistemi
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isMonitoring ? (
                <Button onClick={startMonitoring} size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  İzlemeyi Başlat
                </Button>
              ) : (
                <Button onClick={stopMonitoring} variant="destructive" size="sm">
                  <Square className="h-4 w-4 mr-2" />
                  İzlemeyi Durdur
                </Button>
              )}
              <Button onClick={exportMonitoringData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Verileri İndir
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getStatusColor(currentStatus)}`}>
                {currentStatus.toUpperCase()}
              </div>
              <div className="text-sm text-gray-500">Sistem Durumu</div>
              <div className="flex items-center justify-center mt-2">
                {systemData.connectionStatus === "connected" && (
                  <Wifi className="h-4 w-4 text-green-500" />
                )}
                {systemData.connectionStatus === "disconnected" && (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                {systemData.connectionStatus === "reconnecting" && (
                  <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {alerts.filter(a => !a.resolved).length}
              </div>
              <div className="text-sm text-gray-500">Aktif Uyarı</div>
              <div className="text-xs text-gray-400 mt-1">
                {alerts.filter(a => a.level === "critical").length} kritik
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatUptime(systemData.uptime)}
              </div>
              <div className="text-sm text-gray-500">Çalışma Süresi</div>
              <div className="text-xs text-gray-400 mt-1">
                Son güncelleme: {new Date(systemData.lastUpdate).toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {monitoringData.length}
              </div>
              <div className="text-sm text-gray-500">Veri Noktası</div>
              <div className="text-xs text-gray-400 mt-1">
                {config.interval / 1000}s aralıklarla
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="alerts">Uyarılar</TabsTrigger>
          <TabsTrigger value="metrics">Metrikler</TabsTrigger>
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {/* Real-time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monitoringData.length > 0 && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Genel Kalite</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-2xl font-bold">
                          {(monitoringData[monitoringData.length - 1]?.metrics.overallQuality * 100).toFixed(1)}%
                        </span>
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      </div>
                      <Progress value={monitoringData[monitoringData.length - 1]?.metrics.overallQuality * 100} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">İşlem Süresi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-2xl font-bold">
                          {monitoringData[monitoringData.length - 1]?.performance.processingTime.toFixed(0)}ms
                        </span>
                        <Clock className="h-5 w-5 text-blue-500" />
                      </div>
                      <Progress 
                        value={(monitoringData[monitoringData.length - 1]?.performance.processingTime / config.thresholds.processingTime.max) * 100} 
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Bellek Kullanımı</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-2xl font-bold">
                          {monitoringData[monitoringData.length - 1]?.performance.memoryUsage.toFixed(0)}MB
                        </span>
                        <Database className="h-5 w-5 text-purple-500" />
                      </div>
                      <Progress 
                        value={(monitoringData[monitoringData.length - 1]?.performance.memoryUsage / config.thresholds.memoryUsage.max) * 100} 
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Son Aktivite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monitoringData.slice(-5).reverse().map((data, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(data.status)}
                      <div>
                        <div className="text-sm font-medium">
                          Kalite Skoru: {(data.metrics.overallQuality * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(data.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        {data.performance.processingTime.toFixed(0)}ms
                      </div>
                      <div className="text-xs text-gray-500">
                        {data.performance.memoryUsage.toFixed(0)}MB
                      </div>
                    </div>
                  </div>
                ))}
                {monitoringData.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    Henüz izleme verisi yok. İzlemeyi başlatın.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {/* Alert Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <Select value={alertFilter} onValueChange={setAlertFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Seviye" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Seviyeler</SelectItem>
                    <SelectItem value="info">Bilgi</SelectItem>
                    <SelectItem value="warning">Uyarı</SelectItem>
                    <SelectItem value="error">Hata</SelectItem>
                    <SelectItem value="critical">Kritik</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAcknowledged(!showAcknowledged)}
                >
                  {showAcknowledged ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showAcknowledged ? 'Onaylanmışları Gizle' : 'Onaylanmışları Göster'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllAlerts}
                  disabled={alerts.length === 0}
                >
                  <X className="h-4 w-4 mr-2" />
                  Tümünü Temizle
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${
                alert.level === 'critical' ? 'border-red-800' :
                alert.level === 'error' ? 'border-red-500' :
                alert.level === 'warning' ? 'border-yellow-500' :
                'border-blue-500'
              }`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.level)}
                      <div>
                        <div className="font-medium">{alert.message}</div>
                        <div className="text-sm text-gray-500">
                          {alert.metric} | {new Date(alert.timestamp).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          Değer: {typeof alert.value === 'number' ? alert.value.toFixed(3) : alert.value} | 
                          Eşik: {alert.threshold}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.acknowledged && (
                        <Badge variant="outline" className="text-green-600">
                          Onaylandı
                        </Badge>
                      )}
                      {alert.resolved && (
                        <Badge variant="outline" className="text-blue-600">
                          Çözüldü
                        </Badge>
                      )}
                      {!alert.acknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          <CheckSquare className="h-4 w-4" />
                        </Button>
                      )}
                      {!alert.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredAlerts.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Uyarı Yok
                  </h3>
                  <p className="text-gray-500">
                    {alerts.length === 0 ? 'Henüz uyarı oluşmadı.' : 'Filtrelenen uyarı bulunamadı.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {/* Metrics Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-blue-500" />
                  Kalite Trendi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-end gap-1">
                  {monitoringData.slice(-20).map((data, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-blue-500 rounded-t opacity-70 hover:opacity-100 transition-opacity"
                      style={{ height: `${data.metrics.overallQuality * 100}%` }}
                      title={`${(data.metrics.overallQuality * 100).toFixed(1)}%`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  Performans Metrikleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monitoringData.length > 0 && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>İşlem Süresi</span>
                        <span>{monitoringData[monitoringData.length - 1]?.performance.processingTime.toFixed(0)}ms</span>
                      </div>
                      <Progress value={(monitoringData[monitoringData.length - 1]?.performance.processingTime / config.thresholds.processingTime.max) * 100} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Bellek</span>
                        <span>{monitoringData[monitoringData.length - 1]?.performance.memoryUsage.toFixed(0)}MB</span>
                      </div>
                      <Progress value={(monitoringData[monitoringData.length - 1]?.performance.memoryUsage / config.thresholds.memoryUsage.max) * 100} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Hata Oranı</span>
                        <span>{(monitoringData[monitoringData.length - 1]?.performance.errorRate * 100).toFixed(2)}%</span>
                      </div>
                      <Progress value={(monitoringData[monitoringData.length - 1]?.performance.errorRate / config.thresholds.errorRate.max) * 100} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Monitoring Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-500" />
                İzleme Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>İzleme Aralığı (saniye)</Label>
                    <Input
                      type="number"
                      value={config.interval / 1000}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        interval: parseInt(e.target.value) * 1000
                      }))}
                      min="5"
                      max="300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maksimum Yeniden Deneme</Label>
                    <Input
                      type="number"
                      value={config.maxRetries}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        maxRetries: parseInt(e.target.value)
                      }))}
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Uyarı Ayarları</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.alerts.enabled}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          alerts: { ...prev.alerts, enabled: e.target.checked }
                        }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">Uyarıları Etkinleştir</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.alerts.browser}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          alerts: { ...prev.alerts, browser: e.target.checked }
                        }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">Tarayıcı Bildirimleri</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.autoRestart}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          autoRestart: e.target.checked
                        }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">Otomatik Yeniden Başlatma</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Eşik Değerleri</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum Genel Kalite</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={config.thresholds.overallQuality.min}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          thresholds: {
                            ...prev.thresholds,
                            overallQuality: {
                              ...prev.thresholds.overallQuality,
                              min: parseFloat(e.target.value)
                            }
                          }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maksimum İşlem Süresi (ms)</Label>
                      <Input
                        type="number"
                        value={config.thresholds.processingTime.max}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          thresholds: {
                            ...prev.thresholds,
                            processingTime: {
                              ...prev.thresholds.processingTime,
                              max: parseInt(e.target.value)
                            }
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* No Monitoring State */}
      {!isMonitoring && monitoringData.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              İzleme Başlatılmadı
            </h3>
            <p className="text-gray-500 mb-4">
              Sürekli kalite izlemeyi başlatmak için yukarıdaki butona tıklayın.
            </p>
            <Button onClick={startMonitoring}>
              <Play className="mr-2 h-4 w-4" />
              İzlemeyi Başlat
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}