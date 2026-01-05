/**
 * ChunkingStrategySelector Component - Chunking strategy selection for RAG settings
 * Allows teachers to select between different chunking strategies with descriptions
 * Turkish language interface with recommended options highlighted
 */

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Scissors,
  Crown,
  Zap,
  Brain,
  Target,
  Info,
  CheckCircle,
} from "lucide-react";
import { useRagSettings } from "../../hooks/useRagSettings";
import type { ChunkingStrategy, ChunkingStrategyOption } from "../../hooks/useRagSettings";

interface ChunkingStrategySelectorProps {
  sessionId: string;
}

export const ChunkingStrategySelector: React.FC<ChunkingStrategySelectorProps> = ({
  sessionId,
}) => {
  const {
    selectedChunkStrategy,
    setSelectedChunkStrategy,
    CHUNKING_STRATEGY_OPTIONS,
  } = useRagSettings(sessionId);

  const getStrategyIcon = (strategy: ChunkingStrategy) => {
    switch (strategy) {
      case "multi_agent":
        return <Brain className="w-4 h-4 text-purple-500" />;
      case "lightweight":
        return <Zap className="w-4 h-4 text-green-500" />;
      case "traditional":
        return <Scissors className="w-4 h-4 text-blue-500" />;
      case "semantic":
        return <Target className="w-4 h-4 text-orange-500" />;
      default:
        return <Scissors className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStrategyBadgeColor = (option: ChunkingStrategyOption) => {
    if (option.recommended) {
      return "bg-purple-100 text-purple-700 border-purple-200";
    }
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Scissors className="w-4 h-4 text-primary" />
          Parçalama Stratejisi
        </CardTitle>
        <CardDescription>
          Dökümanların nasıl parçalanacağını belirleyin. Multi-Agent stratejisi en iyi sonuçları verir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strategy Selection */}
        <div className="space-y-3">
          {CHUNKING_STRATEGY_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                selectedChunkStrategy === option.value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setSelectedChunkStrategy(option.value)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">
                    {getStrategyIcon(option.value)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {option.label}
                      </span>
                      {option.recommended && (
                        <Badge className={getStrategyBadgeColor(option)}>
                          <Crown className="w-3 h-3 mr-1" />
                          {option.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
                <div className="mt-0.5">
                  {selectedChunkStrategy === option.value && (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Current Selection Info */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Seçili Strateji:
            </span>
            <div className="flex items-center gap-2">
              {getStrategyIcon(selectedChunkStrategy)}
              <span className="text-sm font-medium">
                {CHUNKING_STRATEGY_OPTIONS.find(opt => opt.value === selectedChunkStrategy)?.label}
              </span>
              {selectedChunkStrategy === "multi_agent" && (
                <Badge className="bg-purple-100 text-purple-700">
                  <Crown className="w-3 h-3 mr-1" />
                  Önerilen
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Strategy-specific information */}
        {selectedChunkStrategy === "multi_agent" && (
          <Alert>
            <Brain className="h-4 w-4 text-purple-500" />
            <AlertDescription>
              <span className="font-medium">Multi-Agent Parçalama:</span> Bu strateji,
              farklı uzmanlık alanlarına sahip AI ajanları kullanarak içeriği optimal
              şekilde parçalar. Türkçe içerik için en iyi performansı sağlar ve
              anlamsal bütünlüğü korur.
            </AlertDescription>
          </Alert>
        )}

        {selectedChunkStrategy === "lightweight" && (
          <Alert>
            <Zap className="h-4 w-4 text-green-500" />
            <AlertDescription>
              <span className="font-medium">Lightweight Parçalama:</span> Hızlı işleme
              için optimize edilmiş basit parçalama stratejisi. Büyük dökümanlar için
              hızlı sonuçlar verir ancak anlamsal kalite daha düşük olabilir.
            </AlertDescription>
          </Alert>
        )}

        {selectedChunkStrategy === "traditional" && (
          <Alert>
            <Scissors className="h-4 w-4 text-blue-500" />
            <AlertDescription>
              <span className="font-medium">Traditional Parçalama:</span> Sabit boyutlu
              segmentler kullanarak standart parçalama yapar. Basit ve öngörülebilir
              sonuçlar verir.
            </AlertDescription>
          </Alert>
        )}

        {selectedChunkStrategy === "semantic" && (
          <Alert>
            <Target className="h-4 w-4 text-orange-500" />
            <AlertDescription>
              <span className="font-medium">Semantic Parçalama:</span> İçeriğin anlamsal
              yapısını analiz ederek doğal sınırlarda parçalar. Bağlamsal bütünlüğü
              korur ancak işlem süresi daha uzun olabilir.
            </AlertDescription>
          </Alert>
        )}

        {/* Performance tip */}
        <Alert>
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription>
            <span className="font-medium">Performans İpucu:</span> Multi-Agent stratejisi
            özellikle Türkçe akademik içerik için optimize edilmiştir. Daha iyi sonuçlar
            için bu stratejiyi Alibaba embedding modeli ile birlikte kullanın.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ChunkingStrategySelector;