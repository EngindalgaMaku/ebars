import React from "react";
import {
  SimulationResult,
  SimulationMetrics,
} from "@/lib/ebars-simulation-api";

interface SimulationResultsAnalysisProps {
  result: SimulationResult;
  onClose: () => void;
}

export default function SimulationResultsAnalysis({
  result,
  onClose,
}: SimulationResultsAnalysisProps) {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}s ${minutes}d ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}d ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getTopPerformingAgents = () => {
    return result.agents.sort((a, b) => b.avg_score - a.avg_score).slice(0, 5);
  };

  const getDifficultyDistribution = () => {
    return Object.entries(result.metrics.difficulty_distribution).map(
      ([level, count]) => ({
        level,
        count,
        percentage: ((count / result.total_interactions) * 100).toFixed(1),
      })
    );
  };

  const getComprehensionTrend = () => {
    return result.metrics.comprehension_progression.map((point, index) => ({
      ...point,
      improvement:
        index > 0
          ? (
              (point.avg_comprehension -
                result.metrics.comprehension_progression[index - 1]
                  .avg_comprehension) *
              100
            ).toFixed(1)
          : "0",
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Detaylı Simülasyon Analizi
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Summary Statistics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 Özet İstatistikler
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                  {result.agent_count}
                </div>
                <div className="text-sm text-indigo-600 dark:text-indigo-400">
                  Sanal Öğrenci
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {result.total_interactions}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  Toplam Etkileşim
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {result.metrics.avg_accuracy_score.toFixed(1)}%
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  Ortalama Başarı
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatDuration(result.duration_seconds)}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Toplam Süre
                </div>
              </div>
            </div>
          </div>

          {/* Comprehension Progression Chart */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📈 Kavrama Seviyesi Gelişimi
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
              <div className="space-y-4">
                {getComprehensionTrend().map((point) => (
                  <div key={point.turn} className="flex items-center space-x-4">
                    <div className="w-16 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Tur {point.turn}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Ortalama: {point.avg_comprehension.toFixed(1)}%
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            parseFloat(point.improvement) > 0
                              ? "text-green-600 dark:text-green-400"
                              : parseFloat(point.improvement) < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {parseFloat(point.improvement) > 0 ? "+" : ""}
                          {point.improvement}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${point.avg_comprehension}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-20 text-sm text-gray-500 dark:text-gray-400 text-right">
                      {point.agent_count} öğrenci
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Difficulty Distribution */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              ⚖️ Zorluk Seviyesi Dağılımı
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getDifficultyDistribution().map((item) => (
                  <div key={item.level} className="text-center">
                    <div
                      className={`p-4 rounded-lg ${
                        item.level === "easy"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : item.level === "medium"
                          ? "bg-yellow-100 dark:bg-yellow-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}
                    >
                      <div
                        className={`text-2xl font-bold ${
                          item.level === "easy"
                            ? "text-green-800 dark:text-green-200"
                            : item.level === "medium"
                            ? "text-yellow-800 dark:text-yellow-200"
                            : "text-red-800 dark:text-red-200"
                        }`}
                      >
                        {item.count}
                      </div>
                      <div
                        className={`text-sm ${
                          item.level === "easy"
                            ? "text-green-600 dark:text-green-400"
                            : item.level === "medium"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {item.level.charAt(0).toUpperCase() +
                          item.level.slice(1)}{" "}
                        ({item.percentage}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Subject Performance */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📚 Konu Alanı Performansı
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
              <div className="space-y-4">
                {Object.entries(result.metrics.performance_by_subject).map(
                  ([subject, metrics]) => (
                    <div
                      key={subject}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {subject.charAt(0).toUpperCase() + subject.slice(1)}
                        </h4>
                        <div className="flex space-x-4 text-sm">
                          <span className="text-blue-600 dark:text-blue-400">
                            {metrics.interaction_count} etkileşim
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            %{metrics.avg_score.toFixed(1)} başarı
                          </span>
                          <span
                            className={`font-semibold ${
                              metrics.improvement_rate > 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {metrics.improvement_rate > 0 ? "+" : ""}
                            {(metrics.improvement_rate * 100).toFixed(1)}%
                            gelişim
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                          style={{ width: `${metrics.avg_score}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Top Performing Agents */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🏆 En Başarılı Sanal Öğrenciler
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
              <div className="space-y-3">
                {getTopPerformingAgents().map((agent, index) => (
                  <div
                    key={agent.agent_id}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                            : index === 1
                            ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                            : index === 2
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {agent.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {agent.grade_level} • {agent.learning_style}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                        {agent.avg_score.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {agent.interaction_count} etkileşim
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              ⚡ Performans Özeti
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  Yanıt Süreleri
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">
                      Ortalama:
                    </span>
                    <span className="font-semibold">
                      {result.metrics.avg_response_time_ms.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">
                      Toplam Etkileşim:
                    </span>
                    <span className="font-semibold">
                      {result.total_interactions}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">
                  Öğrenci Profilleri
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-purple-700 dark:text-purple-300">
                      Aktif Öğrenci:
                    </span>
                    <span className="font-semibold">
                      {
                        result.agents.filter((a) => a.status === "active")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700 dark:text-purple-300">
                      Tamamlanan:
                    </span>
                    <span className="font-semibold">
                      {
                        result.agents.filter((a) => a.status === "completed")
                          .length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
