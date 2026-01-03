"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Wand2, 
  Download, 
  Copy,
  RefreshCw,
  Settings,
  Sliders,
  BookOpen,
  Microscope,
  Calculator,
  Beaker,
  Hash,
  Globe,
  Zap,
  Target,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  BarChart3,
  Image,
  Table,
  Link,
  Type,
  Layers,
  Brain,
  Sparkles,
  Clock,
  Users,
  Award,
  TrendingUp
} from "lucide-react";

// Content template interfaces
interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: "biology" | "physics" | "chemistry" | "mathematics" | "literature" | "mixed";
  difficulty: "beginner" | "intermediate" | "advanced";
  structure: ContentStructure;
  variables: TemplateVariable[];
  sampleOutput: string;
  features: ContentFeature[];
}

interface ContentStructure {
  sections: string[];
  hasIntroduction: boolean;
  hasConclusion: boolean;
  hasReferences: boolean;
  hasTables: boolean;
  hasFigures: boolean;
  hasFormulas: boolean;
  estimatedLength: number; // in words
}

interface TemplateVariable {
  id: string;
  name: string;
  type: "text" | "number" | "select" | "multiselect" | "boolean";
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface ContentFeature {
  type: "visual" | "table" | "formula" | "reference" | "structure";
  name: string;
  description: string;
  complexity: "low" | "medium" | "high";
}

interface GeneratedContent {
  id: string;
  title: string;
  content: string;
  metadata: {
    wordCount: number;
    estimatedChunks: number;
    complexity: number;
    features: string[];
    generatedAt: Date;
  };
  template: string;
  variables: Record<string, any>;
}

interface SampleContentGeneratorProps {
  onContentGenerated?: (content: GeneratedContent) => void;
  onContentTest?: (content: GeneratedContent) => void;
  enableDirectTesting?: boolean;
  showAdvancedOptions?: boolean;
}

const SampleContentGenerator: React.FC<SampleContentGeneratorProps> = ({
  onContentGenerated,
  onContentTest,
  enableDirectTesting = true,
  showAdvancedOptions = true
}) => {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templateVariables, setTemplateVariables] = useState<Record<string, any>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<GeneratedContent[]>([]);

  // Comprehensive Turkish academic content templates
  const contentTemplates: ContentTemplate[] = [
    {
      id: "biology_ecosystem",
      name: "Ekosistem Analizi",
      description: "Türkiye'deki ekosistemlerin detaylı analizi ve biyoçeşitlilik incelemesi",
      category: "biology",
      difficulty: "intermediate",
      structure: {
        sections: ["Giriş", "Ekosistem Türleri", "Biyoçeşitlilik", "Besin Zincirleri", "İnsan Etkisi", "Koruma Stratejileri", "Sonuç"],
        hasIntroduction: true,
        hasConclusion: true,
        hasReferences: true,
        hasTables: true,
        hasFigures: true,
        hasFormulas: false,
        estimatedLength: 1200
      },
      variables: [
        {
          id: "ecosystem_type",
          name: "Ekosistem Türü",
          type: "select",
          description: "İncelenecek ekosistem türünü seçin",
          required: true,
          options: ["Orman", "Göl", "Deniz", "Bozkır", "Dağ", "Sulak Alan"]
        },
        {
          id: "region",
          name: "Bölge",
          type: "select",
          description: "Türkiye'deki coğrafi bölge",
          required: true,
          options: ["Karadeniz", "Marmara", "Ege", "Akdeniz", "İç Anadolu", "Doğu Anadolu", "Güneydoğu Anadolu"]
        },
        {
          id: "species_count",
          name: "Tür Sayısı",
          type: "number",
          description: "İncelenecek tür sayısı",
          required: true,
          defaultValue: 15,
          validation: { min: 5, max: 50 }
        }
      ],
      sampleOutput: `# {region} Bölgesi {ecosystem_type} Ekosistemi Analizi

## Giriş

{region} bölgesindeki {ecosystem_type} ekosistemleri, Türkiye'nin biyoçeşitliliği açısından kritik öneme sahiptir. Bu çalışmada, bölgedeki {species_count} farklı türün ekolojik ilişkileri incelenmiştir.

<img src="{ecosystem_type}-{region}-overview.jpg" alt="{region} {ecosystem_type} ekosistemi genel görünümü" />

Şekil 1.1'de görüldüğü gibi, {ecosystem_type} ekosistemi karmaşık bir yapıya sahiptir.

## Ekosistem Türleri

### Abiyotik Faktörler

{ecosystem_type} ekosisteminin abiyotik faktörleri aşağıdaki tabloda özetlenmiştir:

| Faktör | Değer Aralığı | Etkisi |
|--------|---------------|--------|
| Sıcaklık | 15-25°C | Yüksek |
| Nem | %60-80 | Orta |
| pH | 6.5-7.5 | Düşük |

Tablo 1.1: {ecosystem_type} ekosistemi abiyotik faktörleri

### Biyotik Faktörler

Ekosistemde yaşayan canlılar üç ana gruba ayrılır:

1. **Üreticiler**: Fotosentez yapan bitkiler
2. **Birincil Tüketiciler**: Otçul hayvanlar  
3. **İkincil Tüketiciler**: Etçil hayvanlar

<img src="food-web-{ecosystem_type}.png" alt="{ecosystem_type} besin ağı" />

Şekil 2.1'de {ecosystem_type} ekosisteminin besin ağı gösterilmektedir.

## Sonuç

{region} bölgesindeki {ecosystem_type} ekosistemleri, {species_count} farklı türün yaşam alanı olarak kritik öneme sahiptir. Şekil 1.1 ve Şekil 2.1'de gösterilen ekolojik ilişkiler, bu ekosistemin karmaşıklığını ortaya koymaktadır.`,
      features: [
        { type: "visual", name: "Ekosistem Görselleri", description: "Habitat ve tür görselleri", complexity: "medium" },
        { type: "table", name: "Abiyotik Faktör Tabloları", description: "Çevresel faktör verileri", complexity: "low" },
        { type: "reference", name: "Şekil Referansları", description: "Görsel-metin entegrasyonu", complexity: "medium" }
      ]
    },
    {
      id: "physics_mechanics",
      name: "Mekanik Problemleri",
      description: "Klasik mekanik konularında problem çözümü ve teorik açıklamalar",
      category: "physics",
      difficulty: "advanced",
      structure: {
        sections: ["Teori", "Problem Analizi", "Çözüm Yöntemleri", "Örnek Problemler", "Uygulamalar"],
        hasIntroduction: true,
        hasConclusion: true,
        hasReferences: true,
        hasTables: false,
        hasFigures: true,
        hasFormulas: true,
        estimatedLength: 1500
      },
      variables: [
        {
          id: "topic",
          name: "Konu",
          type: "select",
          description: "Mekanik konusu seçin",
          required: true,
          options: ["Kinematik", "Dinamik", "Enerji", "Momentum", "Dönel Hareket", "Salınımlar"]
        },
        {
          id: "problem_count",
          name: "Problem Sayısı",
          type: "number",
          description: "Çözülecek problem sayısı",
          required: true,
          defaultValue: 5,
          validation: { min: 3, max: 10 }
        }
      ],
      sampleOutput: `# {topic} - Problem Çözümü ve Analiz

## Teori

{topic} konusu, klasik mekaniğin temel dallarından biridir. Bu bölümde {problem_count} farklı problem türü incelenecektir.

### Temel Denklemler

{topic} için temel denklemler:

Denklem 1.1: F = ma (Newton'un 2. Yasası)
Denklem 1.2: v = v₀ + at (Hız denklemi)

<img src="{topic}-diagram.png" alt="{topic} kavramsal diyagramı" />

Şekil 1.1'de {topic} konusunun temel kavramları gösterilmektedir.

## Problem Analizi

### Problem 1: Temel Seviye

Bir cisim {topic} hareketi yapmaktadır. Verilen koşullar altında hareket denklemlerini çözünüz.

**Verilen:**
- Başlangıç hızı: v₀ = 10 m/s
- İvme: a = 2 m/s²
- Zaman: t = 5 s

**Çözüm:**

Denklem 1.1'i kullanarak:
v = v₀ + at = 10 + 2×5 = 20 m/s

<img src="velocity-time-graph.png" alt="Hız-zaman grafiği" />

Şekil 2.1'de problemin hız-zaman grafiği gösterilmektedir.

## Sonuç

{topic} konusunda {problem_count} problem çözülerek, temel denklemlerin uygulamaları gösterilmiştir.`,
      features: [
        { type: "formula", name: "Matematiksel Denklemler", description: "Fizik formülleri ve hesaplamalar", complexity: "high" },
        { type: "visual", name: "Diyagram ve Grafikler", description: "Kavramsal görseller", complexity: "medium" },
        { type: "reference", name: "Denklem Referansları", description: "Formül-metin entegrasyonu", complexity: "high" }
      ]
    },
    {
      id: "chemistry_reactions",
      name: "Kimyasal Reaksiyon Analizi",
      description: "Organik ve inorganik kimyasal reaksiyonların mekanizma analizi",
      category: "chemistry",
      difficulty: "advanced",
      structure: {
        sections: ["Reaksiyon Türleri", "Mekanizma", "Kinetik", "Termodinamik", "Uygulamalar"],
        hasIntroduction: true,
        hasConclusion: true,
        hasReferences: true,
        hasTables: true,
        hasFigures: true,
        hasFormulas: true,
        estimatedLength: 1400
      },
      variables: [
        {
          id: "reaction_type",
          name: "Reaksiyon Türü",
          type: "select",
          description: "İncelenecek reaksiyon türü",
          required: true,
          options: ["Asit-Baz", "Redoks", "Organik Sentez", "Katalitik", "Polimerizasyon"]
        },
        {
          id: "complexity",
          name: "Karmaşıklık",
          type: "select",
          description: "Reaksiyon karmaşıklığı",
          required: true,
          options: ["Basit", "Orta", "Karmaşık", "Çok Karmaşık"]
        }
      ],
      sampleOutput: `# {reaction_type} Reaksiyonları - {complexity} Seviye Analiz

## Reaksiyon Türleri

{reaction_type} reaksiyonları, kimyada önemli bir yere sahiptir. Bu bölümde {complexity} seviyede analiz yapılacaktır.

### Genel Reaksiyon

{reaction_type} için genel reaksiyon denklemi:

Denklem 2.1: A + B → C + D

<img src="{reaction_type}-mechanism.png" alt="{reaction_type} reaksiyon mekanizması" />

Şekil 2.1'de reaksiyon mekanizması gösterilmektedir.

## Kinetik Analiz

Reaksiyon hızı aşağıdaki faktörlere bağlıdır:

| Faktör | Etkisi | Açıklama |
|--------|--------|----------|
| Sıcaklık | Yüksek | Arrhenius denklemi |
| Konsantrasyon | Orta | Hız yasası |
| Katalizör | Yüksek | Aktivasyon enerjisi |

Tablo 2.1: {reaction_type} reaksiyonu kinetik faktörleri

Hız yasası:
Denklem 2.2: v = k[A]ᵐ[B]ⁿ

<img src="reaction-rate-graph.png" alt="Reaksiyon hızı grafiği" />

Şekil 2.2'de konsantrasyon-hız ilişkisi gösterilmektedir.

## Sonuç

{reaction_type} reaksiyonlarının {complexity} seviyedeki analizi tamamlanmıştır.`,
      features: [
        { type: "formula", name: "Kimyasal Denklemler", description: "Reaksiyon denklemleri", complexity: "high" },
        { type: "table", name: "Faktör Tabloları", description: "Reaksiyon koşulları", complexity: "medium" },
        { type: "visual", name: "Mekanizma Diyagramları", description: "Reaksiyon yolakları", complexity: "high" }
      ]
    }
  ];

  const generateContent = useCallback(async (templateId: string, variables: Record<string, any>) => {
    setIsGenerating(true);
    
    try {
      // Simulate content generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const template = contentTemplates.find(t => t.id === templateId);
      if (!template) throw new Error("Template not found");
      
      // Replace variables in template
      let generatedText = template.sampleOutput;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{${key}}`, 'g');
        generatedText = generatedText.replace(regex, String(value));
      });
      
      // Calculate metadata
      const wordCount = generatedText.split(/\s+/).length;
      const estimatedChunks = Math.ceil(wordCount / 300);
      const complexity = calculateComplexity(template, variables);
      const features = template.features.map(f => f.name);
      
      const content: GeneratedContent = {
        id: `generated_${Date.now()}`,
        title: `${template.name} - ${new Date().toLocaleDateString('tr-TR')}`,
        content: generatedText,
        metadata: {
          wordCount,
          estimatedChunks,
          complexity,
          features,
          generatedAt: new Date()
        },
        template: templateId,
        variables
      };
      
      setGeneratedContent(content);
      setGenerationHistory(prev => [content, ...prev.slice(0, 9)]);
      
      if (onContentGenerated) {
        onContentGenerated(content);
      }
      
    } catch (error) {
      console.error("Content generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [contentTemplates, onContentGenerated]);

  const calculateComplexity = (template: ContentTemplate, variables: Record<string, any>): number => {
    let complexity = 0;
    
    // Base complexity from template
    complexity += template.difficulty === "beginner" ? 1 : template.difficulty === "intermediate" ? 2 : 3;
    
    // Feature complexity
    template.features.forEach(feature => {
      complexity += feature.complexity === "low" ? 1 : feature.complexity === "medium" ? 2 : 3;
    });
    
    return Math.min(complexity / 10, 1);
  };

  const handleVariableChange = (variableId: string, value: any) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variableId]: value
    }));
  };

  const handleGenerate = () => {
    if (!activeTemplate) return;
    
    const template = contentTemplates.find(t => t.id === activeTemplate);
    if (!template) return;
    
    // Validate required variables
    const missingRequired = template.variables
      .filter(v => v.required && !templateVariables[v.id])
      .map(v => v.name);
    
    if (missingRequired.length > 0) {
      alert(`Lütfen şu alanları doldurun: ${missingRequired.join(', ')}`);
      return;
    }
    
    // Set default values for missing optional variables
    const completeVariables = { ...templateVariables };
    template.variables.forEach(variable => {
      if (!completeVariables[variable.id] && variable.defaultValue !== undefined) {
        completeVariables[variable.id] = variable.defaultValue;
      }
    });
    
    generateContent(activeTemplate, completeVariables);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadContent = (content: GeneratedContent) => {
    const blob = new Blob([content.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "biology": return <Microscope className="h-4 w-4" />;
      case "physics": return <Calculator className="h-4 w-4" />;
      case "chemistry": return <Beaker className="h-4 w-4" />;
      case "mathematics": return <Hash className="h-4 w-4" />;
      case "literature": return <BookOpen className="h-4 w-4" />;
      case "mixed": return <Globe className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "text-green-600 bg-green-50 border-green-200";
      case "intermediate": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "advanced": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "Başlangıç";
      case "intermediate": return "Orta";
      case "advanced": return "İleri";
      default: return difficulty;
    }
  };

  const renderVariableInput = (variable: TemplateVariable) => {
    const value = templateVariables[variable.id] || variable.defaultValue || '';
    
    switch (variable.type) {
      case "text":
        return (
          <Input
            value={value}
            onChange={(e) => handleVariableChange(variable.id, e.target.value)}
            placeholder={variable.description}
            required={variable.required}
          />
        );
      
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleVariableChange(variable.id, parseInt(e.target.value))}
            placeholder={variable.description}
            min={variable.validation?.min}
            max={variable.validation?.max}
            required={variable.required}
          />
        );
      
      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleVariableChange(variable.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            required={variable.required}
          >
            <option value="">Seçin...</option>
            {variable.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case "boolean":
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleVariableChange(variable.id, e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">{variable.description}</span>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (activeTemplate) {
    const template = contentTemplates.find(t => t.id === activeTemplate);
    if (!template) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTemplate(null)}
            >
              ← Geri
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                {getCategoryIcon(template.category)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
                <p className="text-gray-600">{template.description}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getDifficultyColor(template.difficulty)} border text-sm`}>
              {getDifficultyLabel(template.difficulty)}
            </Badge>
            <Badge variant="outline" className="text-sm">
              <Type className="h-3 w-3 mr-1" />
              ~{template.structure.estimatedLength} kelime
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                İçerik Yapılandırması
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Structure */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">İçerik Yapısı</h4>
                <div className="space-y-2">
                  {template.structure.sections.map((section, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {idx + 1}
                      </div>
                      {section}
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-3">İçerik Özellikleri</h4>
                <div className="grid grid-cols-2 gap-2">
                  {template.structure.hasReferences && (
                    <Badge variant="outline" className="text-xs bg-white">
                      <Link className="h-3 w-3 mr-1" />
                      Referanslar
                    </Badge>
                  )}
                  {template.structure.hasTables && (
                    <Badge variant="outline" className="text-xs bg-white">
                      <Table className="h-3 w-3 mr-1" />
                      Tablolar
                    </Badge>
                  )}
                  {template.structure.hasFigures && (
                    <Badge variant="outline" className="text-xs bg-white">
                      <Image className="h-3 w-3 mr-1" />
                      Şekiller
                    </Badge>
                  )}
                  {template.structure.hasFormulas && (
                    <Badge variant="outline" className="text-xs bg-white">
                      <Calculator className="h-3 w-3 mr-1" />
                      Formüller
                    </Badge>
                  )}
                </div>
              </div>

              {/* Variables */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Parametreler</h4>
                {template.variables.map(variable => (
                  <div key={variable.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {variable.name}
                      {variable.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderVariableInput(variable)}
                    <p className="text-xs text-gray-500">{variable.description}</p>
                  </div>
                ))}
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    İçerik Oluştur
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview/Result Panel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {generatedContent ? "Oluşturulan İçerik" : "Önizleme"}
                </CardTitle>
                {generatedContent && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.content)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadContent(generatedContent)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {enableDirectTesting && onContentTest && (
                      <Button
                        size="sm"
                        onClick={() => onContentTest(generatedContent)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Target className="h-4 w-4 mr-1" />
                        Test Et
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <div className="space-y-4">
                  {/* Metadata */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">İçerik Bilgileri</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">Kelime Sayısı:</span>
                        <span className="ml-2 font-medium">{generatedContent.metadata.wordCount}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Tahmini Chunk:</span>
                        <span className="ml-2 font-medium">{generatedContent.metadata.estimatedChunks}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Karmaşıklık:</span>
                        <span className="ml-2 font-medium">{(generatedContent.metadata.complexity * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Özellikler:</span>
                        <span className="ml-2 font-medium">{generatedContent.metadata.features.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap leading-relaxed">
                      {generatedContent.content}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wand2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    İçerik Oluşturmaya Hazır
                  </h3>
                  <p className="text-gray-500">
                    Parametreleri doldurun ve "İçerik Oluştur" butonuna tıklayın
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Template selection view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl">
            <Wand2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Örnek İçerik Üretici</h2>
            <p className="text-gray-600 mt-1">
              Türkçe akademik içerik için özelleştirilmiş şablonlar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {contentTemplates.length} Şablon
          </Badge>
          {generationHistory.length > 0 && (
            <Badge variant="outline" className="text-sm">
              <Clock className="h-3 w-3 mr-1" />
              {generationHistory.length} Geçmiş
            </Badge>
          )}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {contentTemplates.map((template) => (
          <Card key={template.id} className="transition-all hover:shadow-lg border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    {getCategoryIcon(template.category)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight">
                      {template.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`${getDifficultyColor(template.difficulty)} border text-xs`}>
                        {getDifficultyLabel(template.difficulty)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Type className="h-3 w-3 mr-1" />
                        ~{template.structure.estimatedLength}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Structure Preview */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-800 mb-2">İçerik Yapısı:</div>
                <div className="text-xs text-gray-600">
                  {template.structure.sections.slice(0, 3).join(" → ")}
                  {template.structure.sections.length > 3 && " ..."}
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-1">
                {template.features.slice(0, 3).map((feature) => (
                  <Badge key={feature.name} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                    {feature.name}
                  </Badge>
                ))}
                {template.features.length > 3 && (
                  <Badge variant="outline" className="text-xs bg-gray-50">
                    +{template.features.length - 3}
                  </Badge>
                )}
              </div>

              {/* Variables Count */}
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-sm font-medium text-yellow-800 mb-1">Parametreler:</div>
                <div className="text-xs text-yellow-700">
                  {template.variables.length} özelleştirilebilir parametre
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => setActiveTemplate(template.id)}
                className="w-full"
                size="sm"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Şablonu Kullan
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generation History */}
      {generationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Son Oluşturulan İçerikler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generationHistory.slice(0, 5).map((content) => (
                <div key={content.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{content.title}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {content.metadata.wordCount} kelime • {content.metadata.estimatedChunks} chunk • 
                      {content.metadata.generatedAt.toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(content.content)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadContent(content)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    {enableDirectTesting && onContentTest && (
                      <Button
                        size="sm"
                        onClick={() => onContentTest(content)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Target className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {contentTemplates.length}
              </div>
              <div className="text-sm text-gray-600">Şablon</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {contentTemplates.reduce((sum, t) => sum + t.variables.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Parametre</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {contentTemplates.reduce((sum, t) => sum + t.features.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Özellik</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {generationHistory.length}
              </div>
              <div className="text-sm text-gray-600">Oluşturulan</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SampleContentGenerator;
