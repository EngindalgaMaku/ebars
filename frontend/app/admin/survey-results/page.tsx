"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, RefreshCw, Users, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface SurveyResult {
  id: number;
  user_id: number;
  username: string | null;
  email: string | null;
  age: string | null;
  education: string | null;
  field: string | null;
  personalized_platform: string | null;
  platform_experience: string | null;
  ai_experience: string | null;
  expectations: string | null;
  concerns: string | null;
  completed_at: string;
}

interface SurveyStats {
  total_surveys: number;
  education_distribution: Record<string, number>;
  platform_experience_distribution: Record<string, number>;
  ai_experience_distribution: Record<string, number>;
  personalized_platform_usage: Record<string, number>;
}

export default function SurveyResultsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<SurveyResult[]>([]);
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/aprag/survey/results`,
          {
            credentials: "include",
          }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/aprag/survey/stats`,
          {
            credentials: "include",
          }
        ),
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

  const exportToCSV = () => {
    if (results.length === 0) return;

    const headers = [
      "ID",
      "Kullanıcı ID",
      "Kullanıcı Adı",
      "E-posta",
      "Yaş",
      "Eğitim Durumu",
      "Alan",
      "Kişiselleştirilmiş Platform",
      "Platform Deneyimi",
      "AI Deneyimi",
      "Beklentiler",
      "Endişeler",
      "Tamamlanma Tarihi",
    ];

    const rows = results.map((r) => [
      r.id,
      r.user_id,
      r.username || "",
      r.email || "",
      r.age || "",
      r.education || "",
      r.field || "",
      r.personalized_platform || "",
      r.platform_experience || "",
      r.ai_experience || "",
      r.expectations || "",
      r.concerns || "",
      r.completed_at,
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
          <p className="text-gray-600 mt-1">Öğrenci anket sonuçları ve istatistikler</p>
        </div>
        <div className="flex gap-3">
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

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Toplam Anket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_surveys}</p>
                  <p className="text-xs text-gray-500">Tamamlanan anket sayısı</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Eğitim Durumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.education_distribution).map(([edu, count]) => (
                  <div key={edu} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{edu}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Platform Deneyimi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.platform_experience_distribution).map(([exp, count]) => (
                  <div key={exp} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{exp}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                AI Deneyimi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.ai_experience_distribution).map(([exp, count]) => (
                  <div key={exp} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{exp}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Anket Sonuçları</CardTitle>
          <CardDescription>
            Tüm öğrenci anket yanıtları ({results.length} kayıt)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Henüz anket sonucu bulunmuyor</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">ID</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Kullanıcı</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Yaş</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Eğitim</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Alan</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Platform Deneyimi</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">AI Deneyimi</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-sm text-gray-900">{result.id}</td>
                      <td className="p-3 text-sm text-gray-700">
                        {result.username || result.email || `Kullanıcı ${result.user_id}`}
                      </td>
                      <td className="p-3 text-sm text-gray-600">{result.age || "-"}</td>
                      <td className="p-3 text-sm text-gray-600">{result.education || "-"}</td>
                      <td className="p-3 text-sm text-gray-600">{result.field || "-"}</td>
                      <td className="p-3 text-sm text-gray-600">
                        {result.platform_experience || "-"}
                      </td>
                      <td className="p-3 text-sm text-gray-600">{result.ai_experience || "-"}</td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(result.completed_at).toLocaleDateString("tr-TR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


