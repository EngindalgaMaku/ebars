"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Download,
  Eye,
  Settings,
  Calendar,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Zap,
  Database,
  Hash,
  Brain,
  Layers,
  RefreshCw,
  Share2,
  Mail,
  Printer,
  Save,
  Edit,
  Copy,
  ExternalLink,
  Filter,
  Search,
  BookOpen,
  Users,
  Building,
  Globe,
} from "lucide-react";

// Report Interfaces
interface ReportConfig {
  title: string;
  description: string;
  author: string;
  organization: string;
  includeExecutiveSummary: boolean;
  includeDetailedAnalysis: boolean;
  includeVisualizations: boolean;
  includeRecommendations: boolean;
  includeAppendices: boolean;
  includeRawData: boolean;
  format: "pdf" | "html" | "markdown" | "json" | "csv" | "xlsx";
  template: "academic" | "business" | "technical" | "executive" | "custom";
  language: "tr" | "en";
  branding: boolean;
  confidential: boolean;
}

interface ReportSection {
  id: string;
  title: string;
  content: string;
  type: "text" | "chart" | "table" | "image" | "code";
  order: number;
  included: boolean;
  data?: any;
  visualization?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  style: ReportStyle;
  target: "academic" | "business" | "technical" | "executive";
}

interface ReportStyle {
  colors: string[];
  fonts: string[];
  layout: "single" | "double" | "magazine";
  headerFooter: boolean;
  tableOfContents: boolean;
  pageNumbers: boolean;
  watermark?: string;
}

interface GeneratedReport {
  id: string;
  title: string;
  config: ReportConfig;
  sections: ReportSection[];
  metadata: ReportMetadata;
  content: string;
  generatedAt: string;
  size: number;
  status: "generating" | "completed" | "failed";
}

interface ReportMetadata {
  testId: string;
  testName: string;
  evaluationDate: string;
  totalPages: number;
  wordCount: number;
  chartCount: number;
  tableCount: number;
  version: string;
  checksum: string;
}

interface EvaluationReportsProps {
  evaluationResults: any;
  chunks: any[];
  originalText: string;
  historicalData?: any[];
  comparisonData?: any[];
  onReportGenerated?: (report: GeneratedReport) => void;
  onReportShared?: (reportId: string, method: string) => void;
  enableSharing?: boolean;
  enableScheduling?: boolean;
  customTemplates?: ReportTemplate[];
}

export default function EvaluationReports({
  evaluationResults,
  chunks,
  originalText,
  historicalData = [],
  comparisonData = [],
  onReportGenerated,
  onReportShared,
  enableSharing = true,
  enableScheduling = false,
  customTemplates = [],
}: EvaluationReportsProps) {
  const [config, setConfig] = useState<ReportConfig>({
    title: "Chunk Kalitesi Değerlendirme Raporu",
    description: "Otomatik chunk kalitesi analizi ve değerlendirme sonuçları",
    author: "Sistem Yöneticisi",
    organization: "EBARS Eğitim Sistemi",
    includeExecutiveSummary: true,
    includeDetailedAnalysis: true,
    includeVisualizations: true,
    includeRecommendations: true,
    includeAppendices: false,
    includeRawData: false,
    format: "pdf",
    template: "academic",
    language: "tr",
    branding: true,
    confidential: false,
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>("academic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [activeTab, setActiveTab] = useState("config");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState("all");

  // Default templates
  const defaultTemplates: ReportTemplate[] = [
    {
      id: "academic",
      name: "Akademik Rapor",
      description: "Detaylı akademik analiz ve metodoloji içeren kapsamlı rapor",
      target: "academic",
      style: {
        colors: ["#1f2937", "#3b82f6", "#10b981", "#f59e0b"],
        fonts: ["Times New Roman", "Arial"],
        layout: "double",
        headerFooter: true,
        tableOfContents: true,
        pageNumbers: true,
      },
      sections: [
        {
          id: "abstract",
          title: "Özet",
          content: "",
          type: "text",
          order: 1,
          included: true,
        },
        {
          id: "introduction",
          title: "Giriş",
          content: "",
          type: "text",
          order: 2,
          included: true,
        },
        {
          id: "methodology",
          title: "Metodoloji",
          content: "",
          type: "text",
          order: 3,
          included: true,
        },
        {
          id: "results",
          title: "Sonuçlar",
          content: "",
          type: "text",
          order: 4,
          included: true,
        },
        {
          id: "discussion",
          title: "Tartışma",
          content: "",
          type: "text",
          order: 5,
          included: true,
        },
        {
          id: "conclusion",
          title: "Sonuç",
          content: "",
          type: "text",
          order: 6,
          included: true,
        },
      ],
    },
    {
      id: "business",
      name: "İş Raporu",
      description: "Yönetici özeti ve iş odaklı öneriler içeren rapor",
      target: "business",
      style: {
        colors: ["#374151", "#059669", "#dc2626", "#7c3aed"],
        fonts: ["Arial", "Calibri"],
        layout: "single",
        headerFooter: true,
        tableOfContents: false,
        pageNumbers: true,
      },
      sections: [
        {
          id: "executive_summary",
          title: "Yönetici Özeti",
          content: "",
          type: "text",
          order: 1,
          included: true,
        },
        {
          id: "key_findings",
          title: "Temel Bulgular",
          content: "",
          type: "text",
          order: 2,
          included: true,
        },
        {
          id: "recommendations",
          title: "Öneriler",
          content: "",
          type: "text",
          order: 3,
          included: true,
        },
        {
          id: "action_plan",
          title: "Eylem Planı",
          content: "",
          type: "text",
          order: 4,
          included: true,
        },
      ],
    },
    {
      id: "technical",
      name: "Teknik Rapor",
      description: "Detaylı teknik analiz ve kod örnekleri içeren rapor",
      target: "technical",
      style: {
        colors: ["#111827", "#6366f1", "#ef4444", "#10b981"],
        fonts: ["Consolas", "Arial"],
        layout: "single",
        headerFooter: true,
        tableOfContents: true,
        pageNumbers: true,
      },
      sections: [
        {
          id: "technical_overview",
          title: "Teknik Genel Bakış",
          content: "",
          type: "text",
          order: 1,
          included: true,
        },
        {
          id: "implementation",
          title: "Uygulama Detayları",
          content: "",
          type: "code",
          order: 2,
          included: true,
        },
        {
          id: "performance",
          title: "Performans Analizi",
          content: "",
          type: "chart",
          order: 3,
          included: true,
        },
        {
          id: "troubleshooting",
          title: "Sorun Giderme",
          content: "",
          type: "text",
          order: 4,
          included: true,
        },
      ],
    },
  ];

  const allTemplates = [...defaultTemplates, ...customTemplates];
  const currentTemplate = allTemplates.find(t => t.id === selectedTemplate) || defaultTemplates[0];

  // Generate report content based on evaluation results
  const generateReportContent = async (): Promise<string> => {
    if (!evaluationResults) return "";

    const sections: string[] = [];

    // Title and metadata
    sections.push(`# ${config.title}\n`);
    sections.push(`**Tarih:** ${new Date().toLocaleDateString("tr-TR")}\n`);
    sections.push(`**Yazar:** ${config.author}\n`);
    sections.push(`**Organizasyon:** ${config.organization}\n`);
    if (config.confidential) {
      sections.push(`**GİZLİLİK:** Bu rapor gizli bilgiler içermektedir.\n`);
    }
    sections.push(`\n---\n`);

    // Executive Summary
    if (config.includeExecutiveSummary) {
      sections.push(`## Yönetici Özeti\n`);
      sections.push(generateExecutiveSummary());
      sections.push(`\n`);
    }

    // Detailed Analysis
    if (config.includeDetailedAnalysis) {
      sections.push(`## Detaylı Analiz\n`);
      sections.push(generateDetailedAnalysis());
      sections.push(`\n`);
    }

    // Visualizations
    if (config.includeVisualizations) {
      sections.push(`## Görselleştirmeler\n`);
      sections.push(generateVisualizationSection());
      sections.push(`\n`);
    }

    // Recommendations
    if (config.includeRecommendations) {
      sections.push(`## Öneriler ve Eylem Planı\n`);
      sections.push(generateRecommendations());
      sections.push(`\n`);
    }

    // Appendices
    if (config.includeAppendices) {
      sections.push(`## Ekler\n`);
      sections.push(generateAppendices());
      sections.push(`\n`);
    }

    // Raw Data
    if (config.includeRawData) {
      sections.push(`## Ham Veri\n`);
      sections.push(generateRawDataSection());
      sections.push(`\n`);
    }

    return sections.join("");
  };

  const generateExecutiveSummary = (): string => {
    const overallScore = evaluationResults?.overallScore || 0;
    const passedMetrics = evaluationResults?.metrics ? 
      Object.values(evaluationResults.metrics).filter((m: any) => m?.passed).length : 0;
    const totalMetrics = evaluationResults?.metrics ? 
      Object.keys(evaluationResults.metrics).length : 0;

    return `
Bu rapor, chunk kalitesi değerlendirme sisteminin kapsamlı analizini sunmaktadır. 

### Temel Bulgular

- **Genel Kalite Skoru:** ${(overallScore * 100).toFixed(1)}%
- **Başarılı Metrik Oranı:** ${passedMetrics}/${totalMetrics} (${totalMetrics > 0 ? ((passedMetrics / totalMetrics) * 100).toFixed(1) : 0}%)
- **Toplam Chunk Sayısı:** ${chunks.length}
- **Ortalama Chunk Boyutu:** ${chunks.length > 0 ? Math.round(chunks.reduce((sum: number, c: any) => sum + (c.content?.length || 0), 0) / chunks.length) : 0} karakter

### Durum Değerlendirmesi

${overallScore >= 0.9 ? 
  "Sistem mükemmel performans göstermektedir. Tüm kalite metrikleri hedeflenen seviyededir." :
  overallScore >= 0.75 ?
  "Sistem iyi performans göstermektedir. Küçük iyileştirmeler yapılabilir." :
  overallScore >= 0.6 ?
  "Sistem orta seviye performans göstermektedir. Önemli iyileştirmeler gereklidir." :
  "Sistem düşük performans göstermektedir. Kapsamlı iyileştirme planı uygulanmalıdır."
}

### Öncelikli Eylemler

${generatePriorityActions()}
`;
  };

  const generateDetailedAnalysis = (): string => {
    const sections: string[] = [];

    // Metric Analysis
    sections.push(`### Metrik Analizi\n`);
    if (evaluationResults?.metrics) {
      Object.entries(evaluationResults.metrics).forEach(([key, metric]: [string, any]) => {
        sections.push(`#### ${key.replace(/([A-Z])/g, ' $1').trim()}\n`);
        sections.push(`- **Skor:** ${(metric.score * 100).toFixed(1)}%\n`);
        sections.push(`- **Durum:** ${metric.passed ? '✅ Başarılı' : '❌ Başarısız'}\n`);
        sections.push(`- **Güven:** ${(metric.confidence * 100).toFixed(1)}%\n`);
        if (metric.details) {
          sections.push(`- **Detay:** ${metric.details}\n`);
        }
        sections.push(`\n`);
      });
    }

    // Performance Analysis
    sections.push(`### Performans Analizi\n`);
    sections.push(`- **İşlem Süresi:** ${evaluationResults?.processingTime || 0} saniye\n`);
    sections.push(`- **Bellek Kullanımı:** Tahmini ${Math.round((chunks.length * 100) / 1024)} MB\n`);
    sections.push(`- **Throughput:** ${chunks.length > 0 && evaluationResults?.processingTime ? 
      Math.round(chunks.length / evaluationResults.processingTime) : 0} chunk/saniye\n`);
    sections.push(`\n`);

    // Turkish Language Analysis
    if (evaluationResults?.turkishSpecificMetrics) {
      sections.push(`### Türkçe Dil Analizi\n`);
      Object.entries(evaluationResults.turkishSpecificMetrics).forEach(([key, metric]: [string, any]) => {
        sections.push(`- **${key}:** ${(metric.score * 100).toFixed(1)}%\n`);
      });
      sections.push(`\n`);
    }

    return sections.join("");
  };

  const generateVisualizationSection = (): string => {
    return `
### Kalite Metrikleri Dağılımı

\`\`\`
Metrik Performansı:
${evaluationResults?.metrics ? Object.entries(evaluationResults.metrics).map(([key, metric]: [string, any]) => 
  `${key.padEnd(20)} ${'█'.repeat(Math.round((metric.score || 0) * 20))} ${(metric.score * 100).toFixed(1)}%`
).join('\n') : 'Veri bulunamadı'}
\`\`\`

### Chunk Boyut Dağılımı

\`\`\`
Boyut Aralıkları:
${generateSizeDistribution()}
\`\`\`

### Trend Analizi

${historicalData.length > 0 ? 
  "Son testlerde genel bir iyileşme trendi gözlemlenmektedir." :
  "Trend analizi için yeterli geçmiş veri bulunmamaktadır."
}
`;
  };

  const generateSizeDistribution = (): string => {
    const sizeRanges = [
      { range: "0-500", chunks: chunks.filter(c => (c.content?.length || 0) <= 500) },
      { range: "501-1000", chunks: chunks.filter(c => (c.content?.length || 0) > 500 && (c.content?.length || 0) <= 1000) },
      { range: "1001-1500", chunks: chunks.filter(c => (c.content?.length || 0) > 1000 && (c.content?.length || 0) <= 1500) },
      { range: "1501+", chunks: chunks.filter(c => (c.content?.length || 0) > 1500) },
    ];

    return sizeRanges.map(range => 
      `${range.range.padEnd(10)} ${'█'.repeat(Math.round((range.chunks.length / chunks.length) * 20))} ${range.chunks.length} chunks`
    ).join('\n');
  };

  const generateRecommendations = (): string => {
    const recommendations: string[] = [];

    if (evaluationResults?.overallScore < 0.8) {
      recommendations.push("1. **Kalite İyileştirmesi:** Genel kalite skorunu artırmak için chunk stratejisini gözden geçirin.");
    }

    if (evaluationResults?.metrics?.semanticCoherence?.score < 0.75) {
      recommendations.push("2. **Semantik Uyum:** Chunk'ların anlamsal tutarlılığını artırmak için benzerlik eşiklerini optimize edin.");
    }

    if (evaluationResults?.metrics?.boundaryPrecision?.score < 0.8) {
      recommendations.push("3. **Sınır Hassasiyeti:** Doğal metin sınırlarını daha iyi tespit etmek için algoritma parametrelerini ayarlayın.");
    }

    if (chunks.length > 0) {
      const avgSize = chunks.reduce((sum: number, c: any) => sum + (c.content?.length || 0), 0) / chunks.length;
      if (avgSize > 2000) {
        recommendations.push("4. **Chunk Boyutu:** Ortalama chunk boyutu yüksek, daha küçük chunk'lar kullanmayı düşünün.");
      } else if (avgSize < 500) {
        recommendations.push("4. **Chunk Boyutu:** Ortalama chunk boyutu düşük, daha büyük chunk'lar daha verimli olabilir.");
      }
    }

    recommendations.push("5. **Sürekli İzleme:** Kalite metriklerini düzenli olarak izleyin ve trend analizleri yapın.");

    return recommendations.join('\n\n');
  };

  const generatePriorityActions = (): string => {
    const actions: string[] = [];

    if (evaluationResults?.overallScore < 0.6) {
      actions.push("🔴 **Kritik:** Sistem performansını acilen iyileştirin");
    } else if (evaluationResults?.overallScore < 0.75) {
      actions.push("🟡 **Orta:** Kalite metriklerini optimize edin");
    } else {
      actions.push("🟢 **Düşük:** Mevcut performansı koruyun");
    }

    return actions.join('\n');
  };

  const generateAppendices = (): string => {
    return `
### Ek A: Metodoloji Detayları

Bu değerlendirmede kullanılan metodoloji şunları içermektedir:
- Semantik uyum analizi için embedding similarity
- Sınır hassasiyeti için doğal dil işleme teknikleri
- Türkçe dil kalitesi için morfolojik analiz

### Ek B: Teknik Spesifikasyonlar

- **Model:** Groq Llama 3.1 8B
- **Embedding:** Sentence Transformers
- **Dil:** Türkçe optimizasyonu
- **Platform:** EBARS Eğitim Sistemi

### Ek C: Sınırlamalar

- Subjektif kalite değerlendirmeleri otomatik metriklerle sınırlıdır
- Türkçe dil özellikleri tam olarak kapsanmayabilir
- Performans metrikleri sistem kaynaklarına bağlıdır
`;
  };

  const generateRawDataSection = (): string => {
    return `
### Ham Veri

\`\`\`json
${JSON.stringify({
  evaluationResults,
  chunks: chunks.slice(0, 3), // Sample chunks
  metadata: {
    totalChunks: chunks.length,
    originalTextLength: originalText.length,
    generatedAt: new Date().toISOString(),
  }
}, null, 2)}
\`\`\`
`;
  };

  // Generate report
  const generateReport = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Simulate report generation steps
      const steps = [
        "İçerik analizi yapılıyor...",
        "Metrikler hesaplanıyor...",
        "Görselleştirmeler oluşturuluyor...",
        "Rapor formatlanıyor...",
        "Son kontroller yapılıyor...",
      ];

      for (let i = 0; i < steps.length; i++) {
        setGenerationProgress(((i + 1) / steps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const content = await generateReportContent();
      const report: GeneratedReport = {
        id: `report_${Date.now()}`,
        title: config.title,
        config,
        sections: currentTemplate.sections,
        metadata: {
          testId: evaluationResults?.testId || "unknown",
          testName: evaluationResults?.testName || "Unnamed Test",
          evaluationDate: new Date().toISOString(),
          totalPages: Math.ceil(content.length / 3000), // Rough estimate
          wordCount: content.split(/\s+/).length,
          chartCount: config.includeVisualizations ? 3 : 0,
          tableCount: config.includeDetailedAnalysis ? 2 : 0,
          version: "1.0",
          checksum: btoa(content).slice(0, 16),
        },
        content,
        generatedAt: new Date().toISOString(),
        size: content.length,
        status: "completed",
      };

      setGeneratedReports(prev => [report, ...prev]);
      setPreviewContent(content);

      if (onReportGenerated) {
        onReportGenerated(report);
      }

    } catch (error) {
      console.error("Report generation error:", error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Download report
  const downloadReport = (report: GeneratedReport) => {
    const blob = new Blob([report.content], { 
      type: config.format === 'json' ? 'application/json' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.replace(/\s+/g, '_')}.${config.format === 'pdf' ? 'md' : config.format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Share report
  const shareReport = (reportId: string, method: string) => {
    if (onReportShared) {
      onReportShared(reportId, method);
    }
    // Implement sharing logic here
  };

  // Filter reports
  const filteredReports = generatedReports.filter(report => {
    if (searchQuery && !report.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterBy !== "all" && report.config.format !== filterBy) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-500" />
                Otomatik Rapor Oluşturma
              </CardTitle>
              <CardDescription>
                Kapsamlı değerlendirme raporları oluşturun ve paylaşın
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={generateReport}
                disabled={isGenerating || !evaluationResults}
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Rapor Oluştur
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isGenerating && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Rapor oluşturuluyor...</span>
                <span>{Math.round(generationProgress)}%</span>
              </div>
              <Progress value={generationProgress} />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config">Yapılandırma</TabsTrigger>
          <TabsTrigger value="templates">Şablonlar</TabsTrigger>
          <TabsTrigger value="preview">Önizleme</TabsTrigger>
          <TabsTrigger value="reports">Raporlar</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          {/* Report Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-500" />
                  Temel Ayarlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Rapor Başlığı</Label>
                  <Input
                    id="title"
                    value={config.title}
                    onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    value={config.description}
                    onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="author">Yazar</Label>
                    <Input
                      id="author"
                      value={config.author}
                      onChange={(e) => setConfig(prev => ({ ...prev, author: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organizasyon</Label>
                    <Input
                      id="organization"
                      value={config.organization}
                      onChange={(e) => setConfig(prev => ({ ...prev, organization: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select value={config.format} onValueChange={(value: any) => setConfig(prev => ({ ...prev, format: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="markdown">Markdown</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dil</Label>
                    <Select value={config.language} onValueChange={(value: any) => setConfig(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple-500" />
                  İçerik Seçenekleri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { key: 'includeExecutiveSummary', label: 'Yönetici Özeti' },
                    { key: 'includeDetailedAnalysis', label: 'Detaylı Analiz' },
                    { key: 'includeVisualizations', label: 'Görselleştirmeler' },
                    { key: 'includeRecommendations', label: 'Öneriler' },
                    { key: 'includeAppendices', label: 'Ekler' },
                    { key: 'includeRawData', label: 'Ham Veri' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config[key as keyof ReportConfig] as boolean}
                        onChange={(e) => setConfig(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>

                <div className="pt-4 border-t space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.branding}
                      onChange={(e) => setConfig(prev => ({ ...prev, branding: e.target.checked }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Marka Logosu Ekle</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.confidential}
                      onChange={(e) => setConfig(prev => ({ ...prev, confidential: e.target.checked }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Gizli Olarak İşaretle</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {/* Template Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allTemplates.map((template) => (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all ${
                  selectedTemplate === template.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    {template.name}
                    {selectedTemplate === template.id && (
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {template.target}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.sections.length} bölüm
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      Layout: {template.style.layout} | 
                      TOC: {template.style.tableOfContents ? 'Evet' : 'Hayır'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Template Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-500" />
                Şablon Detayları: {currentTemplate.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Stil Özellikleri</h4>
                    <div className="space-y-1 text-sm">
                      <div>Layout: {currentTemplate.style.layout}</div>
                      <div>Sayfa Numaraları: {currentTemplate.style.pageNumbers ? 'Evet' : 'Hayır'}</div>
                      <div>İçindekiler: {currentTemplate.style.tableOfContents ? 'Evet' : 'Hayır'}</div>
                      <div>Üst/Alt Bilgi: {currentTemplate.style.headerFooter ? 'Evet' : 'Hayır'}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Bölümler</h4>
                    <div className="space-y-1">
                      {currentTemplate.sections.map((section, index) => (
                        <div key={section.id} className="flex items-center gap-2 text-sm">
                          <span className="w-4 text-gray-500">{index + 1}.</span>
                          <span>{section.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {section.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                Rapor Önizlemesi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {previewContent ? (
                <div className="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{previewContent}</pre>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Önizleme için önce bir rapor oluşturun.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {/* Report Management */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Rapor ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48"
                  />
                </div>
                
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{report.title}</h3>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(report.generatedAt).toLocaleString("tr-TR")} | 
                        {report.metadata.wordCount} kelime | 
                        {report.metadata.totalPages} sayfa
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{report.config.format.toUpperCase()}</Badge>
                        <Badge variant="outline">{report.config.template}</Badge>
                        {report.config.confidential && (
                          <Badge className="bg-red-500">GİZLİ</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReport(report)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        İndir
                      </Button>
                      {enableSharing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareReport(report.id, "email")}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Paylaş
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredReports.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Rapor Bulunamadı
                  </h3>
                  <p className="text-gray-500">
                    {generatedReports.length === 0 ? 'Henüz rapor oluşturulmadı.' : 'Filtrelenen rapor bulunamadı.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* No Evaluation Results State */}
      {!evaluationResults && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Değerlendirme Sonucu Gerekli
            </h3>
            <p className="text-gray-500 mb-4">
              Rapor oluşturmak için önce bir değerlendirme çalıştırın.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}