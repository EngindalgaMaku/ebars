/**
 * ModelSelector Component - AI model provider and model selection
 * Handles provider selection, model dropdown, specifications display, and performance indicators
 */

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Zap,
  Brain,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Cpu,
  Activity,
} from "lucide-react";
import { useRagSettings } from "../../hooks/useRagSettings";
import { ModelManagement } from "./ModelManagement";

interface ModelSelectorProps {
  sessionId: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ sessionId }) => {
  const {
    availableModels,
    selectedProvider,
    selectedQueryModel,
    modelsLoading,
    error,
    setSelectedProvider,
    setSelectedQueryModel,
    fetchModels,
    PROVIDER_OPTIONS,
  } = useRagSettings(sessionId);

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    setSelectedQueryModel(""); // Reset model when provider changes
  };

  const handleModelListChange = async () => {
    // Refresh models when model list changes
    if (selectedProvider) {
      await fetchModels();
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "groq":
        return "🌐";
      case "alibaba":
        return "🛒";
      case "deepseek":
        return "🔮";
      case "openrouter":
        return "🚀";
      case "huggingface":
        return "🤗";
      case "ollama":
        return "🏠";
      default:
        return "🔧";
    }
  };

  const getProviderStatus = (provider: string) => {
    switch (provider) {
      case "groq":
      case "alibaba":
      case "deepseek":
      case "openrouter":
        return {
          status: "online",
          label: "Cloud",
          color: "bg-green-100 text-green-700",
        };
      case "huggingface":
        return {
          status: "online",
          label: "Free",
          color: "bg-blue-100 text-blue-700",
        };
      case "ollama":
        return {
          status: "local",
          label: "Local",
          color: "bg-purple-100 text-purple-700",
        };
      default:
        return {
          status: "unknown",
          label: "Unknown",
          color: "bg-gray-100 text-gray-700",
        };
    }
  };

  const getModelPerformanceIndicator = (model: any) => {
    if (!model || typeof model === "string") return null;

    // Mock performance data - in real implementation, this would come from the model data
    const performance = {
      speed: Math.random() * 100,
      quality: Math.random() * 100,
      cost: Math.random() * 100,
    };

    return (
      <div className="flex items-center gap-2 mt-2">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-blue-500" />
          <div className="w-12 bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full"
              style={{ width: `${performance.speed}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">Hız</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-green-500" />
          <div className="w-12 bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full"
              style={{ width: `${performance.quality}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">Kalite</span>
        </div>
      </div>
    );
  };

  const providerStatus = getProviderStatus(selectedProvider);
  const selectedModel = availableModels.find(
    (m) => (typeof m === "string" ? m : m.id) === selectedQueryModel
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* AI Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            AI Provider
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider-select">Provider Seçin</Label>
            <select
              id="provider-select"
              value={selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              disabled={modelsLoading}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background shadow-sm"
            >
              <option value="">Provider seçin...</option>
              {PROVIDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Provider Status */}
          {selectedProvider && (
            <div className="flex items-center gap-2">
              <Badge className={providerStatus.color}>
                <CheckCircle className="w-3 h-3 mr-1" />
                {providerStatus.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {getProviderIcon(selectedProvider)}{" "}
                {selectedProvider.charAt(0).toUpperCase() +
                  selectedProvider.slice(1)}
              </span>
            </div>
          )}

          <div className="border-t border-border my-3" />

          {/* Provider Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>
                {selectedProvider === "ollama"
                  ? "Yerel işlemci kullanır"
                  : "Bulut tabanlı işlem"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              <span>
                {selectedProvider === "groq"
                  ? "Çok hızlı yanıt süresi"
                  : selectedProvider === "huggingface"
                  ? "Ücretsiz kullanım limiti"
                  : "Premium model erişimi"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            AI Modeli
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model-select">Model Seçin</Label>
            <select
              id="model-select"
              value={selectedQueryModel}
              onChange={(e) => setSelectedQueryModel(e.target.value)}
              disabled={modelsLoading || availableModels.length === 0}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background shadow-sm"
            >
              <option value="">
                {modelsLoading
                  ? "Modeller yükleniyor..."
                  : availableModels.length === 0
                  ? "Bu provider için model bulunamadı"
                  : "Model seçin..."}
              </option>
              {availableModels.map((model: any) => {
                const modelId = typeof model === "string" ? model : model.id;
                const modelName =
                  typeof model === "string" ? model : model.name || model.id;

                return (
                  <option key={modelId} value={modelId}>
                    {modelName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Model Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchModels}
              disabled={modelsLoading || !selectedProvider}
              className="gap-2"
            >
              <RefreshCw className={`w-3 h-3 ${modelsLoading ? "animate-spin" : ""}`} />
              {modelsLoading ? "Yükleniyor..." : "Modelleri Yenile"}
            </Button>
            {availableModels.length === 0 && !modelsLoading && selectedProvider && (
              <span className="text-sm text-muted-foreground">
                Bu provider için model bulunamadı. Model Yönetimi bölümünden model ekleyebilirsiniz.
              </span>
            )}
          </div>

          <div className="border-t border-border my-3" />

          {/* Selected Model Info */}
          {selectedModel && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">
                Model Özellikleri
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  <span className="font-medium">ID:</span>{" "}
                  {typeof selectedModel === "string"
                    ? selectedModel
                    : selectedModel.id}
                </div>
                {typeof selectedModel === "object" &&
                  selectedModel.description && (
                    <div>
                      <span className="font-medium">Açıklama:</span>{" "}
                      {selectedModel.description}
                    </div>
                  )}
              </div>
              {getModelPerformanceIndicator(selectedModel)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="md:col-span-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Model Management */}
      <div className="md:col-span-2">
        <ModelManagement
          sessionId={sessionId}
          selectedProvider={selectedProvider}
          onModelListChange={handleModelListChange}
        />
      </div>
    </div>
  );
};

export default ModelSelector;
