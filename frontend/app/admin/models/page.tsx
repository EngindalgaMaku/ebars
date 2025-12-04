"use client";

import React, { useState, useEffect } from "react";
import ModernAdminLayout from "../components/ModernAdminLayout";
import { getModelsConfig, addModel, removeModel } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, RefreshCw, CheckCircle, XCircle } from "lucide-react";

const PROVIDER_OPTIONS = [
  { value: "groq", label: "Groq" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "huggingface", label: "HuggingFace" },
  { value: "alibaba", label: "Alibaba" },
  { value: "ollama", label: "Ollama" },
  { value: "openai", label: "OpenAI" },
];

export default function ModelManagementPage() {
  const [models, setModels] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [newModelName, setNewModelName] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getModelsConfig();
      setModels(response.models || {});
    } catch (err: any) {
      setError(err.message || "Modeller yüklenirken hata oluştu");
      console.error("Error fetching models:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleAddModel = async () => {
    if (!selectedProvider || !newModelName.trim()) {
      setError("Provider ve model adı gereklidir");
      return;
    }

    try {
      setAdding(true);
      setError(null);
      setSuccess(null);
      await addModel(selectedProvider, newModelName.trim());
      setSuccess(`Model '${newModelName.trim()}' ${selectedProvider} provider'ına eklendi`);
      setNewModelName("");
      await fetchModels();
    } catch (err: any) {
      setError(err.message || "Model eklenirken hata oluştu");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveModel = async (provider: string, model: string) => {
    if (!confirm(`'${model}' modelini ${provider} provider'ından kaldırmak istediğinize emin misiniz?`)) {
      return;
    }

    try {
      setRemoving(`${provider}:${model}`);
      setError(null);
      setSuccess(null);
      await removeModel(provider, model);
      setSuccess(`Model '${model}' ${provider} provider'ından kaldırıldı`);
      await fetchModels();
    } catch (err: any) {
      setError(err.message || "Model kaldırılırken hata oluştu");
    } finally {
      setRemoving(null);
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
      case "openai":
        return "⚡";
      default:
        return "🔧";
    }
  };

  if (loading) {
    return (
      <ModernAdminLayout
        title="Model Yönetimi"
        description="AI model provider'larına model ekleyip çıkarabilirsiniz"
      >
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ModernAdminLayout>
    );
  }

  return (
    <ModernAdminLayout
      title="Model Yönetimi"
      description="AI model provider'larına model ekleyip çıkarabilirsiniz"
    >
      <div className="space-y-6">
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
        <Card>
          <CardHeader>
            <CardTitle>Yeni Model Ekle</CardTitle>
            <CardDescription>
              Bir provider'a yeni model ekleyin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="provider-select">Provider</Label>
                <Select
                  value={selectedProvider}
                  onValueChange={setSelectedProvider}
                >
                  <SelectTrigger id="provider-select">
                    <SelectValue placeholder="Provider seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {getProviderIcon(option.value)} {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="model-name">Model Adı</Label>
                <Input
                  id="model-name"
                  placeholder="örn: gpt-4, llama-3.1-8b-instant"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddModel();
                    }
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddModel}
                  disabled={adding || !selectedProvider || !newModelName.trim()}
                >
                  {adding ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Ekleniyor...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Ekle
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Models List by Provider */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PROVIDER_OPTIONS.map((providerOption) => {
            const provider = providerOption.value;
            const providerModels = models[provider] || [];

            return (
              <Card key={provider}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{getProviderIcon(provider)}</span>
                    <span>{providerOption.label}</span>
                    <span className="ml-auto text-sm font-normal text-muted-foreground">
                      ({providerModels.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {providerModels.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Bu provider için model bulunmuyor
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {providerModels.map((model) => (
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
                            onClick={() => handleRemoveModel(provider, model)}
                            disabled={removing === `${provider}:${model}`}
                            className="ml-2 h-8 w-8 p-0"
                          >
                            {removing === `${provider}:${model}` ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={fetchModels} disabled={loading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Yenile
          </Button>
        </div>
      </div>
    </ModernAdminLayout>
  );
}

