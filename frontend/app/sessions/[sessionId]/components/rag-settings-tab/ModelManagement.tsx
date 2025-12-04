/**
 * ModelManagement Component - Model ekle/çıkar yönetimi
 * Öğretmenler kendi ders oturumlarında modelleri yönetebilir
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getSessionModelsConfig,
  addModelToSession,
  removeModelFromSession,
} from "@/lib/api";

interface ModelManagementProps {
  sessionId: string;
  selectedProvider: string;
  onModelListChange?: () => void;
}

const PROVIDER_OPTIONS = [
  { value: "groq", label: "Groq", icon: "🌐" },
  { value: "openrouter", label: "OpenRouter", icon: "🚀" },
  { value: "deepseek", label: "DeepSeek", icon: "🔮" },
  { value: "huggingface", label: "HuggingFace", icon: "🤗" },
  { value: "alibaba", label: "Alibaba", icon: "🛒" },
  { value: "ollama", label: "Ollama", icon: "🏠" },
  { value: "openai", label: "OpenAI", icon: "⚡" },
];

export const ModelManagement: React.FC<ModelManagementProps> = ({
  sessionId,
  selectedProvider,
  onModelListChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [models, setModels] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [addProvider, setAddProvider] = useState<string>(selectedProvider || "");
  const [newModelName, setNewModelName] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSessionModelsConfig(sessionId);
      setModels(response.models || {});
    } catch (err: any) {
      setError(err.message || "Modeller yüklenirken hata oluştu");
      console.error("Error fetching models:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchModels();
    }
  }, [isExpanded, sessionId]);

  useEffect(() => {
    if (selectedProvider && !addProvider) {
      setAddProvider(selectedProvider);
    }
  }, [selectedProvider, addProvider]);

  const handleAddModel = async () => {
    if (!addProvider || !newModelName.trim()) {
      setError("Provider ve model adı gereklidir");
      return;
    }

    try {
      setAdding(true);
      setError(null);
      setSuccess(null);
      await addModelToSession(sessionId, addProvider, newModelName.trim());
      setSuccess(`Model '${newModelName.trim()}' ${addProvider} provider'ına eklendi`);
      setNewModelName("");
      await fetchModels();
      if (onModelListChange) {
        onModelListChange();
      }
    } catch (err: any) {
      setError(err.message || "Model eklenirken hata oluştu");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveModel = async (provider: string, model: string) => {
    if (
      !confirm(
        `'${model}' modelini ${provider} provider'ından kaldırmak istediğinize emin misiniz?`
      )
    ) {
      return;
    }

    try {
      setRemoving(`${provider}:${model}`);
      setError(null);
      setSuccess(null);
      await removeModelFromSession(sessionId, provider, model);
      setSuccess(`Model '${model}' ${provider} provider'ından kaldırıldı`);
      await fetchModels();
      if (onModelListChange) {
        onModelListChange();
      }
    } catch (err: any) {
      setError(err.message || "Model kaldırılırken hata oluştu");
    } finally {
      setRemoving(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    const option = PROVIDER_OPTIONS.find((opt) => opt.value === provider);
    return option?.icon || "🔧";
  };

  const getProviderLabel = (provider: string) => {
    const option = PROVIDER_OPTIONS.find((opt) => opt.value === provider);
    return option?.label || provider;
  };

  const currentProviderModels = models[selectedProvider] || [];

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Model Yönetimi</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          Provider'lara model ekleyip çıkarabilirsiniz
        </CardDescription>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Success/Error Messages */}
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Add Model Section */}
          <div className="space-y-2">
            <Label>Yeni Model Ekle</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <select
                  value={addProvider}
                  onChange={(e) => setAddProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background"
                >
                  <option value="">Provider seçin...</option>
                  {PROVIDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Model adı (örn: gpt-4)"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddModel();
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleAddModel}
                disabled={adding || !addProvider || !newModelName.trim()}
                size="sm"
              >
                {adding ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                    Ekleniyor...
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 mr-2" />
                    Ekle
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Current Provider Models */}
          {selectedProvider && (
            <div className="space-y-2">
              <Label>
                {getProviderIcon(selectedProvider)} {getProviderLabel(selectedProvider)} Modelleri
                ({currentProviderModels.length})
              </Label>
              {currentProviderModels.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Bu provider için model bulunmuyor
                </p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {currentProviderModels.map((model) => (
                    <div
                      key={model}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <span className="text-sm font-mono truncate flex-1">
                        {model}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveModel(selectedProvider, model)}
                        disabled={removing === `${selectedProvider}:${model}`}
                        className="ml-2 h-7 w-7 p-0"
                      >
                        {removing === `${selectedProvider}:${model}` ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3 text-destructive" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Refresh Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchModels}
              disabled={loading}
            >
              <RefreshCw
                className={`w-3 h-3 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Yenile
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ModelManagement;

