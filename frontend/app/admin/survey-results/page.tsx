"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, RefreshCw, Users, TrendingUp, PieChart, LineChart, BarChart, Eye, ChevronLeft, ChevronRight, X, Calculator } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
} from "recharts";

interface SurveyResult {
  id: number;
  user_id: number;
  username: string | null;
  email: string | null;
  age: string | null;
  education: string | null;
  profession: string | null;
  profession_other: string | null;
  q1_usability?: string | null;
  q2_navigation?: string | null;
  q3_learning?: string | null;
  q4_speed?: string | null;
  q5_learning_contribution?: string | null;
  q6_useful_answers?: string | null;
  q7_accurate_answers?: string | null;
  q8_clear_answers?: string | null;
  q9_emoji_easy?: string | null;
  q10_emoji_response?: string | null;
  q11_emoji_noticed?: string | null;
  q12_difficulty_appropriate?: string | null;
  q13_simplified?: string | null;
  q14_difficultied?: string | null;
  q15_adaptive_helpful?: string | null;
  q16_personalized?: string | null;
  q17_satisfied?: string | null;
  q18_expectations?: string | null;
  q19_enjoyable?: string | null;
  q20_recommend?: string | null;
  completed_at: string;
}

interface SurveyStats {
  total_surveys: number;
  average_age: number | null;
  education_distribution: Record<string, number>;
  profession_distribution: Record<string, number>;
  q1_usability_average?: number | null;
  q2_navigation_average?: number | null;
  q3_learning_average?: number | null;
  q4_speed_average?: number | null;
  q5_learning_contribution_average?: number | null;
  q6_useful_answers_average?: number | null;
  q7_accurate_answers_average?: number | null;
  q8_clear_answers_average?: number | null;
  q9_emoji_easy_average?: number | null;
  q10_emoji_response_average?: number | null;
  q11_emoji_noticed_average?: number | null;
  q12_difficulty_appropriate_average?: number | null;
  q13_simplified_average?: number | null;
  q14_difficultied_average?: number | null;
  q15_adaptive_helpful_average?: number | null;
  q16_personalized_average?: number | null;
  q17_satisfied_average?: number | null;
  q18_expectations_average?: number | null;
  q19_enjoyable_average?: number | null;
  q20_recommend_average?: number | null;
  usability_average?: number | null;
  effectiveness_average?: number | null;
  emoji_feedback_average?: number | null;
  adaptive_average?: number | null;
  satisfaction_average?: number | null;
  q1_usability_distribution?: Record<string, number>;
  q2_navigation_distribution?: Record<string, number>;
  q3_learning_distribution?: Record<string, number>;
  q4_speed_distribution?: Record<string, number>;
  q5_learning_contribution_distribution?: Record<string, number>;
  q6_useful_answers_distribution?: Record<string, number>;
  q7_accurate_answers_distribution?: Record<string, number>;
  q8_clear_answers_distribution?: Record<string, number>;
  q9_emoji_easy_distribution?: Record<string, number>;
  q10_emoji_response_distribution?: Record<string, number>;
  q11_emoji_noticed_distribution?: Record<string, number>;
  q12_difficulty_appropriate_distribution?: Record<string, number>;
  q13_simplified_distribution?: Record<string, number>;
  q14_difficultied_distribution?: Record<string, number>;
  q15_adaptive_helpful_distribution?: Record<string, number>;
  q16_personalized_distribution?: Record<string, number>;
  q17_satisfied_distribution?: Record<string, number>;
  q18_expectations_distribution?: Record<string, number>;
  q19_enjoyable_distribution?: Record<string, number>;
  q20_recommend_distribution?: Record<string, number>;
  completion_by_date: Array<{ date: string; count: number }>;
}

interface QuestionStats {
  mean: number;
  median: number;
  mode: number;
  stdDev: number;
  min: number;
  max: number;
  variance: number;
}

interface CategoryCorrelation {
  category1: string;
  category2: string;
  correlation: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const LIKERT_LABELS: Record<string, string> = {
  "1": "Kesinlikle Katılmıyorum",
  "2": "Katılmıyorum",
  "3": "Kararsızım",
  "4": "Katılıyorum",
  "5": "Kesinlikle Katılıyorum",
};

const LIKERT_QUESTIONS = [
  { id: "q1_usability", label: "Q1: Sistemin arayüzü kullanıcı dostu ve anlaşılır.", category: "Kullanılabilirlik" },
  { id: "q2_navigation", label: "Q2: Sistemde gezinmek kolay ve sezgisel.", category: "Kullanılabilirlik" },
  { id: "q3_learning", label: "Q3: Sistemi kullanmayı öğrenmek zordu. (Ters)", category: "Kullanılabilirlik", reverse: true },
  { id: "q4_speed", label: "Q4: Sistem hızlı yanıt veriyor.", category: "Kullanılabilirlik" },
  { id: "q5_learning_contribution", label: "Q5: Sistem öğrenmeme katkı sağladı.", category: "Etkinlik" },
  { id: "q6_useful_answers", label: "Q6: Sistemin verdiği cevaplar yararlı ve bilgilendirici.", category: "Etkinlik" },
  { id: "q7_accurate_answers", label: "Q7: Sistemin verdiği cevaplar yanlış veya güvenilir değil. (Ters)", category: "Etkinlik", reverse: true },
  { id: "q8_clear_answers", label: "Q8: Sistemin cevapları anlaşılır ve açıklayıcı.", category: "Etkinlik" },
  { id: "q9_emoji_easy", label: "Q9: Emoji geri bildirim vermek kolay ve hızlı.", category: "Emoji Geri Bildirim" },
  { id: "q10_emoji_response", label: "Q10: Sistem emoji geri bildirimlerime tepki vermedi. (Ters)", category: "Emoji Geri Bildirim", reverse: true },
  { id: "q11_emoji_noticed", label: "Q11: Sistemin zorluk seviyesini değiştirdiğini fark ettim.", category: "Emoji Geri Bildirim" },
  { id: "q12_difficulty_appropriate", label: "Q12: Sistem cevaplarının zorluk seviyesi anlama seviyeme uygun değildi. (Ters)", category: "Adaptif Özellikler", reverse: true },
  { id: "q13_simplified", label: "Q13: Sistem zorlandığımda cevapları basitleştirdi.", category: "Adaptif Özellikler" },
  { id: "q14_difficultied", label: "Q14: Sistem başarılı olduğumda cevapları zorlaştırdı.", category: "Adaptif Özellikler" },
  { id: "q15_adaptive_helpful", label: "Q15: Sistemin adaptif özelliği öğrenmeme yardımcı oldu.", category: "Adaptif Özellikler" },
  { id: "q16_personalized", label: "Q16: Sistem benim için kişiselleştirilmiş cevaplar üretti.", category: "Adaptif Özellikler" },
  { id: "q17_satisfied", label: "Q17: Sistemden genel olarak memnun kaldım.", category: "Memnuniyet" },
  { id: "q18_expectations", label: "Q18: Sistem beklentilerimi karşılamadı. (Ters)", category: "Memnuniyet", reverse: true },
  { id: "q19_enjoyable", label: "Q19: Sistem kullanımı keyifliydi.", category: "Memnuniyet" },
  { id: "q20_recommend", label: "Q20: Bu sistemi arkadaşlarıma öneririm.", category: "Memnuniyet" },
];

const translateKey = (key: string): string => {
  const translations: Record<string, string> = {
    lise: "Lise",
    universite: "Üniversite",
    yuksek_lisans: "Yüksek Lisans",
    doktora: "Doktora",
    ogretmen: "Öğretmen",
    ogrenci: "Öğrenci",
    diger: "Diğer",
  };
  return translations[key] || key;
};

// Statistical functions
const calculateMean = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

const calculateMedian = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const calculateMode = (values: number[]): number => {
  if (values.length === 0) return 0;
  const frequency: Record<number, number> = {};
  values.forEach((v) => {
    frequency[v] = (frequency[v] || 0) + 1;
  });
  let maxFreq = 0;
  let mode = 0;
  Object.entries(frequency).forEach(([val, freq]) => {
    if (freq > maxFreq) {
      maxFreq = freq;
      mode = parseFloat(val);
    }
  });
  return mode;
};

const calculateStdDev = (values: number[], mean: number): number => {
  if (values.length === 0) return 0;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
};

const calculateVariance = (values: number[], mean: number): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
};

const calculateCorrelation = (x: number[], y: number[]): number => {
  if (x.length !== y.length || x.length === 0) return 0;
  const meanX = calculateMean(x);
  const meanY = calculateMean(y);
  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;
  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }
  const denominator = Math.sqrt(sumSqX * sumSqY);
  return denominator === 0 ? 0 : numerator / denominator;
};

const calculateCronbachAlpha = (items: number[][]): number => {
  if (items.length === 0 || items[0].length === 0) return 0;
  const k = items.length;
  const n = items[0].length;
  
  // Calculate item variances
  const itemVariances = items.map((item) => {
    const mean = calculateMean(item);
    return calculateVariance(item, mean);
  });
  
  const sumItemVariances = itemVariances.reduce((a, b) => a + b, 0);
  
  // Calculate total score variance
  const totalScores = Array(n).fill(0).map((_, i) => 
    items.reduce((sum, item) => sum + item[i], 0)
  );
  const totalMean = calculateMean(totalScores);
  const totalVariance = calculateVariance(totalScores, totalMean);
  
  // Cronbach's Alpha formula
  const alpha = (k / (k - 1)) * (1 - sumItemVariances / totalVariance);
  return isNaN(alpha) ? 0 : alpha;
};

export default function SurveyResultsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<SurveyResult[]>([]);
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedResult, setSelectedResult] = useState<SurveyResult | null>(null);
  const [showStatistics, setShowStatistics] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    loadData();
  }, [user, router]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [resultsResponse, statsResponse] = await Promise.all([
        fetch(`${getApiUrl()}/aprag/survey/results`, { credentials: "include" }),
        fetch(`${getApiUrl()}/aprag/survey/stats`, { credentials: "include" }),
      ]);

      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        setResults(resultsData.results || []);
      } else {
        throw new Error("Anket sonuçları yüklenemedi");
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error("Error loading survey data:", err);
      setError("Veriler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return results.slice(start, end);
  }, [results, currentPage, itemsPerPage]);

  // Calculate detailed statistics
  const questionStats = useMemo((): Record<string, QuestionStats> => {
    const statsMap: Record<string, QuestionStats> = {};
    
    LIKERT_QUESTIONS.forEach((question) => {
      const values = results
        .map((r) => {
          const val = r[question.id as keyof SurveyResult] as string | null | undefined;
          if (!val || val === "") return null;
          const num = parseFloat(val);
          return isNaN(num) ? null : num;
        })
        .filter((v): v is number => v !== null);
      
      if (values.length > 0) {
        const mean = calculateMean(values);
        statsMap[question.id] = {
          mean,
          median: calculateMedian(values),
          mode: calculateMode(values),
          stdDev: calculateStdDev(values, mean),
          min: Math.min(...values),
          max: Math.max(...values),
          variance: calculateVariance(values, mean),
        };
      }
    });
    
    return statsMap;
  }, [results]);

  // Calculate category correlations
  const categoryCorrelations = useMemo((): CategoryCorrelation[] => {
    const categories = [
      { name: "Kullanılabilirlik", questions: ["q1_usability", "q2_navigation", "q3_learning", "q4_speed"] },
      { name: "Etkinlik", questions: ["q5_learning_contribution", "q6_useful_answers", "q7_accurate_answers", "q8_clear_answers"] },
      { name: "Emoji Geri Bildirim", questions: ["q9_emoji_easy", "q10_emoji_response", "q11_emoji_noticed"] },
      { name: "Adaptif Özellikler", questions: ["q12_difficulty_appropriate", "q13_simplified", "q14_difficultied", "q15_adaptive_helpful", "q16_personalized"] },
      { name: "Memnuniyet", questions: ["q17_satisfied", "q18_expectations", "q19_enjoyable", "q20_recommend"] },
    ];

    const categoryScores: Record<string, number[]> = {};
    categories.forEach((cat) => {
      categoryScores[cat.name] = results.map((r) => {
        const scores = cat.questions
          .map((qId) => {
            const val = r[qId as keyof SurveyResult] as string | null | undefined;
            if (!val || val === "") return null;
            const num = parseFloat(val);
            return isNaN(num) ? null : num;
          })
          .filter((v): v is number => v !== null);
        return scores.length > 0 ? calculateMean(scores) : 0;
      });
    });

    const correlations: CategoryCorrelation[] = [];
    const categoryNames = Object.keys(categoryScores);
    for (let i = 0; i < categoryNames.length; i++) {
      for (let j = i + 1; j < categoryNames.length; j++) {
        const corr = calculateCorrelation(categoryScores[categoryNames[i]], categoryScores[categoryNames[j]]);
        correlations.push({
          category1: categoryNames[i],
          category2: categoryNames[j],
          correlation: corr,
        });
      }
    }
    return correlations;
  }, [results]);

  // Calculate Cronbach's Alpha for each category
  const cronbachAlphas = useMemo((): Record<string, number> => {
    const categories = [
      { name: "Kullanılabilirlik", questions: ["q1_usability", "q2_navigation", "q3_learning", "q4_speed"] },
      { name: "Etkinlik", questions: ["q5_learning_contribution", "q6_useful_answers", "q7_accurate_answers", "q8_clear_answers"] },
      { name: "Emoji Geri Bildirim", questions: ["q9_emoji_easy", "q10_emoji_response", "q11_emoji_noticed"] },
      { name: "Adaptif Özellikler", questions: ["q12_difficulty_appropriate", "q13_simplified", "q14_difficultied", "q15_adaptive_helpful", "q16_personalized"] },
      { name: "Memnuniyet", questions: ["q17_satisfied", "q18_expectations", "q19_enjoyable", "q20_recommend"] },
    ];

    const alphas: Record<string, number> = {};
    categories.forEach((cat) => {
      const items: number[][] = cat.questions.map((qId) =>
        results
          .map((r) => {
            const val = r[qId as keyof SurveyResult] as string | null | undefined;
            if (!val || val === "") return null;
            const num = parseFloat(val);
            return isNaN(num) ? null : num;
          })
          .filter((v): v is number => v !== null)
      );
      
      // Filter out items with no valid responses
      const validItems = items.filter((item) => item.length > 0);
      if (validItems.length > 1) {
        alphas[cat.name] = calculateCronbachAlpha(validItems);
      }
    });
    return alphas;
  }, [results]);

  const exportToCSV = () => {
    if (results.length === 0) return;

    const headers = [
      "ID", "Kullanıcı ID", "Kullanıcı Adı", "E-posta", "Yaş", "Eğitim Durumu",
      "Meslek", "Meslek (Diğer)",
      ...LIKERT_QUESTIONS.map(q => q.label),
      "Tamamlanma Tarihi"
    ];

    const rows = results.map((r) => [
      r.id, r.user_id, r.username || "", r.email || "", r.age || "",
      r.education || "", r.profession || "", r.profession_other || "",
      r.q1_usability || "", r.q2_navigation || "", r.q3_learning || "", r.q4_speed || "",
      r.q5_learning_contribution || "", r.q6_useful_answers || "", r.q7_accurate_answers || "", r.q8_clear_answers || "",
      r.q9_emoji_easy || "", r.q10_emoji_response || "", r.q11_emoji_noticed || "",
      r.q12_difficulty_appropriate || "", r.q13_simplified || "", r.q14_difficultied || "",
      r.q15_adaptive_helpful || "", r.q16_personalized || "",
      r.q17_satisfied || "", r.q18_expectations || "", r.q19_enjoyable || "", r.q20_recommend || "",
      r.completed_at
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `anket-sonuclari-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const prepareChartData = (distribution: Record<string, number>) => {
    return Object.entries(distribution)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([key, value]) => ({
        name: LIKERT_LABELS[key] || key,
        value: value,
        count: value,
      }));
  };

  const prepareBarChartData = (distribution: Record<string, number>) => {
    return Object.entries(distribution)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([key, value]) => ({
        name: LIKERT_LABELS[key] || key,
        count: value,
      }));
  };

  const getQuestionValue = (result: SurveyResult, questionId: string): string => {
    const value = result[questionId as keyof SurveyResult] as string | null | undefined;
    if (!value || value === "") return "-";
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return LIKERT_LABELS[value] || value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button onClick={loadData} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Tekrar Dene
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Anket Sonuçları</h1>
          <p className="text-gray-600 mt-1">Likert Ölçeği - Detaylı anket analizi ve istatistikler</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowStatistics(!showStatistics)} variant="outline">
            <Calculator className="w-4 h-4 mr-2" />
            {showStatistics ? "Grafikleri Göster" : "İstatistikleri Göster"}
          </Button>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Yenile
          </Button>
          <Button onClick={exportToCSV} disabled={results.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            CSV İndir
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Anket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_surveys}</p>
                  <p className="text-xs text-gray-500">Tamamlanan anket</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Ortalama Yaş</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.average_age ? stats.average_age.toFixed(1) : "-"}
                  </p>
                  <p className="text-xs text-gray-500">Yaş ortalaması</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {stats.usability_average !== undefined && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Kullanılabilirlik</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <BarChart className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.usability_average ? stats.usability_average.toFixed(2) : "-"}
                    </p>
                    <p className="text-xs text-gray-500">Ortalama (1-5)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.effectiveness_average !== undefined && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Etkinlik</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <PieChart className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.effectiveness_average ? stats.effectiveness_average.toFixed(2) : "-"}
                    </p>
                    <p className="text-xs text-gray-500">Ortalama (1-5)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.satisfaction_average !== undefined && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Memnuniyet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.satisfaction_average ? stats.satisfaction_average.toFixed(2) : "-"}
                    </p>
                    <p className="text-xs text-gray-500">Ortalama (1-5)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Statistical Analysis Section */}
      {showStatistics && (
        <div className="space-y-6">
          {/* Cronbach's Alpha */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Güvenilirlik Analizi (Cronbach's Alpha)</CardTitle>
              <CardDescription>Her kategori için iç tutarlılık katsayısı</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left p-3 font-semibold text-gray-700">Kategori</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Cronbach's α</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Yorum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(cronbachAlphas).map(([category, alpha]) => (
                      <tr key={category} className="border-b border-gray-100">
                        <td className="p-3 text-gray-900">{category}</td>
                        <td className="p-3 text-right text-gray-700 font-mono">{alpha.toFixed(3)}</td>
                        <td className="p-3 text-gray-600">
                          {alpha >= 0.9
                            ? "Mükemmel"
                            : alpha >= 0.8
                            ? "İyi"
                            : alpha >= 0.7
                            ? "Kabul Edilebilir"
                            : alpha >= 0.6
                            ? "Düşük"
                            : "Yetersiz"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Question Statistics Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Soru Bazlı İstatistikler</CardTitle>
              <CardDescription>Her soru için tanımlayıcı istatistikler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left p-3 font-semibold text-gray-700">Soru</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Ortalama</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Medyan</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Mod</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Std. Sapma</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Varyans</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Min</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LIKERT_QUESTIONS.map((question) => {
                      const stat = questionStats[question.id];
                      if (!stat) return null;
                      return (
                        <tr key={question.id} className="border-b border-gray-100">
                          <td className="p-3 text-gray-900 text-xs">{question.label}</td>
                          <td className="p-3 text-right text-gray-700 font-mono">{stat.mean.toFixed(2)}</td>
                          <td className="p-3 text-right text-gray-700 font-mono">{stat.median.toFixed(2)}</td>
                          <td className="p-3 text-right text-gray-700 font-mono">{stat.mode.toFixed(2)}</td>
                          <td className="p-3 text-right text-gray-700 font-mono">{stat.stdDev.toFixed(2)}</td>
                          <td className="p-3 text-right text-gray-700 font-mono">{stat.variance.toFixed(2)}</td>
                          <td className="p-3 text-right text-gray-700 font-mono">{stat.min.toFixed(0)}</td>
                          <td className="p-3 text-right text-gray-700 font-mono">{stat.max.toFixed(0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Category Correlations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kategori Korelasyonları</CardTitle>
              <CardDescription>Kategoriler arası Pearson korelasyon katsayıları</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left p-3 font-semibold text-gray-700">Kategori 1</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Kategori 2</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Korelasyon</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Yorum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryCorrelations.map((corr, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="p-3 text-gray-900">{corr.category1}</td>
                        <td className="p-3 text-gray-900">{corr.category2}</td>
                        <td className="p-3 text-right text-gray-700 font-mono">{corr.correlation.toFixed(3)}</td>
                        <td className="p-3 text-gray-600">
                          {Math.abs(corr.correlation) >= 0.7
                            ? "Güçlü"
                            : Math.abs(corr.correlation) >= 0.4
                            ? "Orta"
                            : Math.abs(corr.correlation) >= 0.2
                            ? "Zayıf"
                            : "Çok Zayıf"}
                          {corr.correlation > 0 ? " Pozitif" : " Negatif"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Averages */}
      {!showStatistics && stats && (stats.usability_average !== undefined || stats.effectiveness_average !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kategori Ortalamaları</CardTitle>
            <CardDescription>Her kategori için ortalama Likert puanları (1-5 ölçeği)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart
                data={[
                  { name: "Kullanılabilirlik", ortalama: stats.usability_average || 0 },
                  { name: "Etkinlik", ortalama: stats.effectiveness_average || 0 },
                  { name: "Emoji Geri Bildirim", ortalama: stats.emoji_feedback_average || 0 },
                  { name: "Adaptif Özellikler", ortalama: stats.adaptive_average || 0 },
                  { name: "Memnuniyet", ortalama: stats.satisfaction_average || 0 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="ortalama" fill="#8884d8" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Individual Question Charts */}
      {!showStatistics && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {LIKERT_QUESTIONS.map((question) => {
            const distribution = stats[`${question.id}_distribution` as keyof SurveyStats] as Record<string, number> | undefined;
            const average = stats[`${question.id}_average` as keyof SurveyStats] as number | undefined;

            if (!distribution || Object.keys(distribution).length === 0) return null;

            return (
              <Card key={question.id}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">{question.label}</CardTitle>
                  {average !== undefined && average !== null && (
                    <CardDescription>Ortalama: {average.toFixed(2)} / 5.00</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsBarChart data={prepareBarChartData(distribution)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill={question.reverse ? "#FF8042" : "#8884d8"} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completion Trend */}
      {!showStatistics && stats && stats.completion_by_date && stats.completion_by_date.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Günlük Tamamlanma Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={stats.completion_by_date}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Demographics */}
      {!showStatistics && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stats.education_distribution && Object.keys(stats.education_distribution).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Eğitim Durumu Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={Object.entries(stats.education_distribution).map(([key, value]) => ({
                        name: translateKey(key),
                        value: value,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(stats.education_distribution).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {stats.profession_distribution && Object.keys(stats.profession_distribution).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Meslek Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart
                    data={Object.entries(stats.profession_distribution).map(([key, value]) => ({
                      name: translateKey(key),
                      count: value,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Results Table with Pagination */}
      <Card>
        <CardHeader>
          <CardTitle>Detaylı Anket Sonuçları</CardTitle>
          <CardDescription>
            Tüm öğrenci anket yanıtları ({results.length} kayıt) - Sayfa {currentPage} / {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Henüz anket sonucu bulunmuyor</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left p-3 font-semibold text-gray-700">ID</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Kullanıcı</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Yaş</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Eğitim</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Meslek</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Kullanılabilirlik</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Etkinlik</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Memnuniyet</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Tarih</th>
                      <th className="text-left p-3 font-semibold text-gray-700">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedResults.map((result) => {
                      const usabilityAvg = [
                        result.q1_usability,
                        result.q2_navigation,
                        result.q3_learning,
                        result.q4_speed,
                      ]
                        .filter((v) => v && v !== "")
                        .map((v) => parseFloat(v || "0"))
                        .reduce((a, b, _, arr) => a + b / arr.length, 0);

                      const effectivenessAvg = [
                        result.q5_learning_contribution,
                        result.q6_useful_answers,
                        result.q7_accurate_answers,
                        result.q8_clear_answers,
                      ]
                        .filter((v) => v && v !== "")
                        .map((v) => parseFloat(v || "0"))
                        .reduce((a, b, _, arr) => a + b / arr.length, 0);

                      const satisfactionAvg = [
                        result.q17_satisfied,
                        result.q18_expectations,
                        result.q19_enjoyable,
                        result.q20_recommend,
                      ]
                        .filter((v) => v && v !== "")
                        .map((v) => parseFloat(v || "0"))
                        .reduce((a, b, _, arr) => a + b / arr.length, 0);

                      return (
                        <tr key={result.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 text-gray-900">{result.id}</td>
                          <td className="p-3 text-gray-700">
                            {result.username || result.email || `Kullanıcı ${result.user_id}`}
                          </td>
                          <td className="p-3 text-gray-600">{result.age || "-"}</td>
                          <td className="p-3 text-gray-600">{translateKey(result.education || "-")}</td>
                          <td className="p-3 text-gray-600">
                            {result.profession ? translateKey(result.profession) : "-"}
                            {result.profession_other && ` (${result.profession_other})`}
                          </td>
                          <td className="p-3 text-gray-600">
                            {usabilityAvg > 0 ? usabilityAvg.toFixed(2) : "-"}
                          </td>
                          <td className="p-3 text-gray-600">
                            {effectivenessAvg > 0 ? effectivenessAvg.toFixed(2) : "-"}
                          </td>
                          <td className="p-3 text-gray-600">
                            {satisfactionAvg > 0 ? satisfactionAvg.toFixed(2) : "-"}
                          </td>
                          <td className="p-3 text-gray-600">
                            {new Date(result.completed_at).toLocaleDateString("tr-TR")}
                          </td>
                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedResult(result)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {((currentPage - 1) * itemsPerPage + 1)} - {Math.min(currentPage * itemsPerPage, results.length)} / {results.length} kayıt
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Önceki
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Sonraki
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Anket Detayları - {selectedResult.username || selectedResult.email || `Kullanıcı ${selectedResult.user_id}`}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedResult(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              {/* Demographics */}
              <Card>
                <CardHeader>
                  <CardTitle>Demografik Bilgiler</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Kullanıcı ID</p>
                    <p className="font-semibold">{selectedResult.user_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">E-posta</p>
                    <p className="font-semibold">{selectedResult.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Yaş</p>
                    <p className="font-semibold">{selectedResult.age || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Eğitim Durumu</p>
                    <p className="font-semibold">{translateKey(selectedResult.education || "-")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Meslek</p>
                    <p className="font-semibold">
                      {selectedResult.profession ? translateKey(selectedResult.profession) : "-"}
                      {selectedResult.profession_other && ` (${selectedResult.profession_other})`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tamamlanma Tarihi</p>
                    <p className="font-semibold">
                      {new Date(selectedResult.completed_at).toLocaleString("tr-TR")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Likert Questions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Likert Ölçeği Yanıtları</h3>
                {LIKERT_QUESTIONS.map((question) => {
                  const value = getQuestionValue(selectedResult, question.id);
                  return (
                    <Card key={question.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{question.label}</p>
                            <p className="text-sm text-gray-500 mt-1">{question.category}</p>
                          </div>
                          <div className="ml-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {value}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
