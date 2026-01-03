"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TestTube, 
  Play, 
  Square, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Image,
  BookOpen,
  Beaker,
  Microscope,
  Calculator,
  Globe,
  Download,
  Upload,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
  Zap,
  Target,
  Activity,
  BarChart3,
  TrendingUp,
  Clock
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

// Test scenario interfaces
interface TestScenario {
  id: string;
  name: string;
  description: string;
  category: "academic" | "technical" | "educational" | "mixed";
  difficulty: "easy" | "medium" | "hard";
  content: string;
  expectedChallenges: string[];
  successCriteria: {
    minPreservationRate: number;
    minContextCoherence: number;
    maxSeparationDistance: number;
  };
  turkishOptimized: boolean;
}

interface TestResult {
  scenarioId: string;
  timestamp: string;
  strategy: string;
  preservationRate: number;
  contextCoherence: number;
  averageSeparationDistance: number;
  detectedReferences: number;
  preservedReferences: number;
  separatedReferences: number;
  lostReferences: number;
  passed: boolean;
  score: number;
  details: any;
}

interface ContextPreservationTesterProps {
  onRunTest?: (scenario: TestScenario, config: any) => Promise<TestResult>;
  enableCustomScenarios?: boolean;
  showDetailedResults?: boolean;
}

const ContextPreservationTester: React.FC<ContextPreservationTesterProps> = ({
  onRunTest,
  enableCustomScenarios = true,
  showDetailedResults = true
}) => {
  const [activeTab, setActiveTab] = useState<"scenarios" | "custom" | "results" | "library">("scenarios");
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [customContent, setCustomContent] = useState("");
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [showResultDetails, setShowResultDetails] = useState<string | null>(null);

  // Predefined test scenarios with Turkish academic content
  const predefinedScenarios: TestScenario[] = [
    {
      id: "ecoli_biology",
      name: "E. coli Biyoloji Örneği",
      description: "Biyoloji nedir sorusu ile E. coli görseli ve açıklaması içeren akademik metin",
      category: "academic",
      difficulty: "medium",
      content: `# Biyoloji Nedir?

Biyoloji, canlı organizmaları ve yaşam süreçlerini inceleyen bilim dalıdır. Bu bilim dalı, mikroorganizmalardan karmaşık çok hücreli organizmalara kadar geniş bir yelpazede çalışır.

## Mikroorganizmalar ve Önemi

Mikroorganizmalar, çıplak gözle görülemeyen küçük canlılardır. Bunlar arasında bakteriler, virüsler, mantarlar ve protozoalar bulunur.

<img src="ecoli-bacteria.jpg" alt="E. coli bakterisi elektron mikroskop görüntüsü" />

Şekil 1.1'de görüldüğü gibi, E. coli (Escherichia coli) bakterisi çubuk şeklinde bir prokaryotik organizmadır. Bu bakteri, insan bağırsağında doğal olarak bulunur ve genellikle zararsızdır.

### E. coli'nin Özellikleri

E. coli bakterisi aşağıdaki özelliklere sahiptir:

1. **Morfoloji**: Çubuk şeklinde (basil)
2. **Boyut**: 2-6 mikrometr uzunluğunda
3. **Hareket**: Flagella ile hareket eder
4. **Metabolizma**: Fakültatif anaerob

Yukarıdaki şekilde de belirtildiği üzere, E. coli bakterisinin yapısı oldukça basittir ancak etkilidir. Bu bakteriler, biyoteknoloji alanında model organizma olarak sıklıkla kullanılır.

## Biyolojinin Alt Dalları

Biyoloji birçok alt dala ayrılır:

- **Mikrobiyoloji**: Mikroorganizmaları inceler
- **Genetik**: Kalıtım ve gen yapısını araştırır  
- **Ekoloji**: Canlıların çevre ile ilişkilerini inceler

Tablo 1.1'de görüldüğü gibi, her alt dal kendine özgü araştırma yöntemleri kullanır.

Bu şekil ve açıklamalar, biyolojinin temel kavramlarını anlamak için kritik öneme sahiptir.`,
      expectedChallenges: [
        "Şekil referansı ile görsel açıklaması arasındaki bağlantı",
        "E. coli açıklaması ile görsel arasındaki ilişki",
        "Tablo referansı ile içerik arasındaki bağlam"
      ],
      successCriteria: {
        minPreservationRate: 0.8,
        minContextCoherence: 0.75,
        maxSeparationDistance: 500
      },
      turkishOptimized: true
    },
    {
      id: "physics_formulas",
      name: "Fizik Formülleri ve Diyagramlar",
      description: "Fizik denklemleri ve ilgili diyagramları içeren teknik metin",
      category: "academic",
      difficulty: "hard",
      content: `# Newton'un Hareket Yasaları

Fizik, doğadaki olayları matematiksel olarak açıklayan temel bilim dalıdır.

## Birinci Yasa (Eylemsizlik Yasası)

Bir cisim üzerine net kuvvet etki etmediği sürece, durgun cisim durgun kalır, hareketli cisim düzgün doğrusal hareket yapar.

Denklem 1.1: F_net = 0 ⟹ v = sabit

## İkinci Yasa (Temel Dinamik Yasası)

Bir cisme etki eden net kuvvet, cismin kütlesi ile ivmesinin çarpımına eşittir.

<img src="force-diagram.png" alt="Kuvvet diyagramı" />

Denklem 1.2: F = ma

Yukarıdaki diyagramda görüldüğü gibi, kuvvetlerin vektörel toplamı cismin ivmesini belirler.

Grafik 1.1'de farklı kütlelerdeki cisimlerin ivme-kuvvet ilişkisi gösterilmektedir.

### Uygulama Örneği

2 kg kütleli bir cisme 10 N kuvvet uygulandığında:

a = F/m = 10/2 = 5 m/s²

Bu hesaplama, Denklem 1.2'den doğrudan elde edilir.

## Üçüncü Yasa (Etki-Tepki Yasası)

Her etkiye eşit ve zıt yönde bir tepki vardır.

Şekil 1.2'de roket itişi örneği gösterilmektedir.

<img src="rocket-thrust.png" alt="Roket itişi diyagramı" />

Formül 1.3: F_etki = -F_tepki

Bu yasanın günlük yaşamdaki örnekleri:
- Yürürken yere uyguladığımız kuvvet
- Roket motorlarının çalışma prensibi
- Silah geri tepmesi

Yukarıda belirtilen diyagram ve formüller, Newton yasalarının anlaşılması için kritiktir.`,
      expectedChallenges: [
        "Denklem referansları ile formül açıklamaları",
        "Şekil ve grafik referanslarının korunması",
        "Matematiksel notasyon ile metin arasındaki bağlam"
      ],
      successCriteria: {
        minPreservationRate: 0.85,
        minContextCoherence: 0.8,
        maxSeparationDistance: 300
      },
      turkishOptimized: true
    },
    {
      id: "chemistry_reactions",
      name: "Kimyasal Reaksiyonlar",
      description: "Kimya deneyleri ve reaksiyon şemaları içeren eğitim materyali",
      category: "educational",
      difficulty: "medium",
      content: `# Kimyasal Reaksiyonlar

Kimya, maddenin yapısını ve dönüşümlerini inceleyen bilim dalıdır.

## Asit-Baz Reaksiyonları

Asit-baz reaksiyonları, kimyada en temel reaksiyon türlerinden biridir.

### Nötralizasyon Reaksiyonu

Güçlü bir asit ile güçlü bir bazın reaksiyonu:

Denklem 2.1: HCl + NaOH → NaCl + H₂O

<img src="neutralization-setup.jpg" alt="Nötralizasyon deneyi düzeneği" />

Şekil 2.1'de gösterilen deney düzeneğinde, asit-baz titrasyonu gerçekleştirilmektedir.

### pH Değişimi

Reaksiyon sırasında pH değişimi Grafik 2.1'de gösterilmektedir.

<img src="ph-curve.png" alt="pH titrasyon eğrisi" />

Bu eğri, aşağıdaki aşamaları gösterir:
1. Başlangıç pH'ı (asidik)
2. Tampon bölgesi
3. Eşdeğerlik noktası
4. Son pH (bazik)

### Indikatör Kullanımı

Tablo 2.1'de farklı indikatörlerin renk değişim aralıkları verilmiştir.

| İndikatör | pH Aralığı | Asidik Renk | Bazik Renk |
|-----------|------------|-------------|------------|
| Metil turuncu | 3.1-4.4 | Kırmızı | Sarı |
| Bromtimol mavisi | 6.0-7.6 | Sarı | Mavi |
| Fenolftalein | 8.2-10.0 | Renksiz | Pembe |

Yukarıdaki tabloda belirtilen indikatörler, Şekil 2.1'deki deneyde kullanılabilir.

## Redoks Reaksiyonları

Elektron transferi içeren reaksiyonlardır.

Denklem 2.2: Zn + Cu²⁺ → Zn²⁺ + Cu

<img src="galvanic-cell.png" alt="Galvanik hücre şeması" />

Şekil 2.2'de gösterilen galvanik hücrede, yukarıdaki reaksiyon gerçekleşir.

Bu reaksiyonda:
- Zn yükseltgenir (elektron verir)
- Cu²⁺ indirgenır (elektron alır)

Diyagram 2.1'de elektron akışı yönü gösterilmektedir.`,
      expectedChallenges: [
        "Kimyasal denklemler ile şekil referansları",
        "Tablo verileri ile metin açıklamaları",
        "Deney düzenekleri ile prosedür açıklamaları"
      ],
      successCriteria: {
        minPreservationRate: 0.75,
        minContextCoherence: 0.7,
        maxSeparationDistance: 400
      },
      turkishOptimized: true
    },
    {
      id: "math_geometry",
      name: "Geometri Teoremleri",
      description: "Matematiksel ispatlar ve geometrik şekiller içeren akademik metin",
      category: "academic",
      difficulty: "hard",
      content: `# Geometri Teoremleri

Geometri, şekillerin özelliklerini ve aralarındaki ilişkileri inceleyen matematik dalıdır.

## Pisagor Teoremi

Dik üçgenlerde hipotenüsün karesi, dik kenarların karelerinin toplamına eşittir.

Teorem 3.1: a² + b² = c²

<img src="pythagorean-triangle.png" alt="Pisagor teoremi dik üçgeni" />

Şekil 3.1'de gösterilen dik üçgende:
- a ve b dik kenarlar
- c hipotenüs
- ∠C = 90°

### İspat

Şekil 3.2'de gösterilen kare yöntemi ile ispat:

<img src="pythagorean-proof.png" alt="Pisagor teoremi ispatı" />

Büyük karenin alanı: (a+b)²
İç karenin alanı: c²
Dört üçgenin toplam alanı: 4 × (ab/2) = 2ab

Denklem 3.1: (a+b)² = c² + 2ab
Açılım: a² + 2ab + b² = c² + 2ab
Sadeleştirme: a² + b² = c²

Bu ispat, yukarıdaki şekilde görsel olarak da desteklenmektedir.

## Benzer Üçgenler

İki üçgen, karşılıklı açıları eşit ise benzerdir.

<img src="similar-triangles.png" alt="Benzer üçgenler" />

Şekil 3.3'te gösterilen benzer üçgenlerde:

Oran 3.1: AB/DE = BC/EF = AC/DF = k (benzerlik oranı)

### Uygulama

Grafik 3.1'de farklı benzerlik oranlarının etkileri gösterilmektedir.

Tablo 3.1'de benzer üçgenlerin özellikler karşılaştırması:

| Özellik | Üçgen 1 | Üçgen 2 | Oran |
|---------|---------|---------|------|
| Kenar uzunlukları | a, b, c | ka, kb, kc | k |
| Çevre | P | kP | k |
| Alan | A | k²A | k² |

Bu tablodaki değerler, Şekil 3.3'teki örnekle uyumludur.

## Çember Geometrisi

Çemberde merkez açı ile çevre açı arasındaki ilişki.

<img src="circle-angles.png" alt="Çember açıları" />

Teorem 3.2: Merkez açı = 2 × Çevre açı

Şekil 3.4'te bu ilişki görülmektedir.

Formül 3.2: α = 2β

Burada:
- α: merkez açısı
- β: çevre açısı

Yukarıdaki formül ve şekil, çember geometrisinin temelini oluşturur.`,
      expectedChallenges: [
        "Matematiksel formüller ile geometrik şekiller",
        "İspat adımları ile diyagramlar",
        "Teorem referansları ile açıklamalar"
      ],
      successCriteria: {
        minPreservationRate: 0.9,
        minContextCoherence: 0.85,
        maxSeparationDistance: 250
      },
      turkishOptimized: true
    },
    {
      id: "mixed_content",
      name: "Karışık İçerik Testi",
      description: "Farklı türde referansları içeren karmaşık akademik metin",
      category: "mixed",
      difficulty: "hard",
      content: `# Bilimsel Araştırma Metodolojisi

Bu çalışma, farklı bilim dallarından örneklerle araştırma metodolojisini açıklamaktadır.

## Giriş

Bilimsel araştırma, sistematik bir yaklaşım gerektirir (Smith et al., 2023).

### Araştırma Süreci

Şekil 1.1'de araştırma sürecinin aşamaları gösterilmektedir.

<img src="research-process.png" alt="Araştırma süreci akış şeması" />

Bu süreç aşağıdaki adımları içerir:

1. Problem tanımlama
2. Literatür taraması  
3. Hipotez oluşturma
4. Deney tasarımı
5. Veri toplama
6. Analiz ve yorumlama

## Veri Toplama Yöntemleri

Tablo 1.1'de farklı veri toplama yöntemleri karşılaştırılmaktadır.

| Yöntem | Avantajlar | Dezavantajlar | Kullanım Alanı |
|--------|------------|---------------|----------------|
| Anket | Geniş örneklem | Yüzeysel bilgi | Sosyal bilimler |
| Gözlem | Doğal ortam | Zaman alıcı | Davranış bilimleri |
| Deney | Kontrollü | Yapay ortam | Fen bilimleri |

### Örnekleme Teknikleri

Grafik 1.1'de farklı örnekleme yöntemlerinin etkinliği gösterilmektedir.

<img src="sampling-methods.png" alt="Örnekleme yöntemleri karşılaştırması" />

Yukarıdaki grafikte görüldüğü gibi, rastgele örnekleme en güvenilir sonuçları verir.

## İstatistiksel Analiz

Denklem 1.1: x̄ = Σxi/n (aritmetik ortalama)

Varyans hesabı için Formül 1.2 kullanılır:

s² = Σ(xi - x̄)²/(n-1)

### Hipotez Testi

Şekil 1.2'de hipotez testi süreci gösterilmektedir.

<img src="hypothesis-testing.png" alt="Hipotez testi akış şeması" />

Bu süreçte:
- H₀: Null hipotez
- H₁: Alternatif hipotez
- α: Anlamlılık düzeyi (genellikle 0.05)

Tablo 1.2'de farklı test türleri ve kullanım koşulları verilmiştir.

## Sonuçların Yorumlanması

Bulgular, Grafik 1.2'de özetlenmiştir.

<img src="results-summary.png" alt="Araştırma sonuçları özeti" />

Bu sonuçlar, aşağıdaki çıkarımları desteklemektedir:

1. Metodoloji seçimi kritik öneme sahiptir
2. Örneklem büyüklüğü güvenilirliği etkiler
3. İstatistiksel analiz doğru yorumlanmalıdır

Yukarıda belirtilen şekil ve tablolar, bu çıkarımların temelini oluşturmaktadır.

## Kaynaklar

1. Smith, J., Brown, A., & Wilson, K. (2023). Research Methodology in Sciences. Academic Press.
2. Johnson, M. (2022). Statistical Analysis for Researchers. Data Science Publications.
3. Lee, S. et al. (2021). Sampling Techniques in Social Research. Survey Methods Journal, 15(3), 45-62.

Bu kaynaklar, yukarıdaki şekil ve tablolarda sunulan bilgileri desteklemektedir.`,
      expectedChallenges: [
        "Çoklu referans türleri (şekil, tablo, denklem, kaynak)",
        "Karmaşık içerik yapısı",
        "Farklı bölümler arası referanslar",
        "Akademik atıf formatları"
      ],
      successCriteria: {
        minPreservationRate: 0.7,
        minContextCoherence: 0.65,
        maxSeparationDistance: 600
      },
      turkishOptimized: true
    }
  ];

  // Run test function
  const runTest = async (scenario: TestScenario) => {
    if (!onRunTest) {
      // Simulate test for demo purposes
      setIsRunning(true);
      
      setTimeout(() => {
        const mockResult: TestResult = {
          scenarioId: scenario.id,
          timestamp: new Date().toISOString(),
          strategy: "Agentic Chunking",
          preservationRate: 0.75 + Math.random() * 0.2,
          contextCoherence: 0.7 + Math.random() * 0.25,
          averageSeparationDistance: 200 + Math.random() * 300,
          detectedReferences: Math.floor(5 + Math.random() * 10),
          preservedReferences: Math.floor(3 + Math.random() * 8),
          separatedReferences: Math.floor(1 + Math.random() * 3),
          lostReferences: Math.floor(0 + Math.random() * 2),
          passed: Math.random() > 0.3,
          score: 65 + Math.random() * 30,
          details: {
            chunkCount: Math.floor(8 + Math.random() * 12),
            processingTime: 2.5 + Math.random() * 3
          }
        };
        
        setTestResults(prev => [mockResult, ...prev]);
        setIsRunning(false);
      }, 3000);
      
      return;
    }

    setIsRunning(true);
    try {
      const result = await onRunTest(scenario, {});
      setTestResults(prev => [result, ...prev]);
    } catch (error) {
      console.error("Test failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  // Run custom test
  const runCustomTest = async () => {
    if (!customContent.trim()) return;

    const customScenario: TestScenario = {
      id: `custom_${Date.now()}`,
      name: customName || "Özel Test",
      description: customDescription || "Kullanıcı tanımlı test senaryosu",
      category: "mixed",
      difficulty: "medium",
      content: customContent,
      expectedChallenges: ["Kullanıcı tanımlı içerik"],
      successCriteria: {
        minPreservationRate: 0.7,
        minContextCoherence: 0.65,
        maxSeparationDistance: 500
      },
      turkishOptimized: true
    };

    await runTest(customScenario);
  };

  // Calculate aggregate statistics
  const aggregateStats = useMemo(() => {
    if (testResults.length === 0) return null;

    const avgPreservation = testResults.reduce((sum, r) => sum + r.preservationRate, 0) / testResults.length;
    const avgCoherence = testResults.reduce((sum, r) => sum + r.contextCoherence, 0) / testResults.length;
    const avgDistance = testResults.reduce((sum, r) => sum + r.averageSeparationDistance, 0) / testResults.length;
    const passRate = testResults.filter(r => r.passed).length / testResults.length;
    const avgScore = testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length;

    return {
      totalTests: testResults.length,
      avgPreservation,
      avgCoherence,
      avgDistance,
      passRate,
      avgScore,
      bestScore: Math.max(...testResults.map(r => r.score)),
      worstScore: Math.min(...testResults.map(r => r.score))
    };
  }, [testResults]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "text-green-600 bg-green-50 border-green-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "hard": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "academic": return <BookOpen className="h-4 w-4" />;
      case "technical": return <Calculator className="h-4 w-4" />;
      case "educational": return <Microscope className="h-4 w-4" />;
      case "mixed": return <Globe className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TestTube className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Bağlam Koruma Test Merkezi</h2>
          <Badge variant="outline" className="ml-2">
            {testResults.length} Test Tamamlandı
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <Badge className="bg-green-500 animate-pulse">
              <Clock className="h-3 w-3 mr-1" />
              Test Çalışıyor
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scenarios" className="flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            Test Senaryoları
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Özel Test
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Sonuçlar
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            İçerik Kütüphanesi
          </TabsTrigger>
        </TabsList>

        {/* Test Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {predefinedScenarios.map((scenario) => (
              <Card key={scenario.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(scenario.category)}
                      <CardTitle className="text-lg">{scenario.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`${getDifficultyColor(scenario.difficulty)} border text-xs`}
                      >
                        {scenario.difficulty === "easy" ? "Kolay" :
                         scenario.difficulty === "medium" ? "Orta" : "Zor"}
                      </Badge>
                      {scenario.turkishOptimized && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          🇹🇷 TR
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {scenario.description}
                  </p>

                  {/* Success Criteria */}
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-sm font-medium text-gray-800 mb-2">Başarı Kriterleri:</div>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      <div className="flex justify-between">
                        <span>Min. Koruma Oranı:</span>
                        <span className="font-semibold">{(scenario.successCriteria.minPreservationRate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Min. Bağlam Uyumu:</span>
                        <span className="font-semibold">{(scenario.successCriteria.minContextCoherence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max. Ayrılma Mesafesi:</span>
                        <span className="font-semibold">{scenario.successCriteria.maxSeparationDistance} kar.</span>
                      </div>
                    </div>
                  </div>

                  {/* Expected Challenges */}
                  <div className="bg-yellow-50 rounded p-3">
                    <div className="text-sm font-medium text-yellow-800 mb-2">Beklenen Zorluklar:</div>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {scenario.expectedChallenges.map((challenge, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-yellow-600 mt-0.5">•</span>
                          {challenge}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Content Preview */}
                  <div className="bg-blue-50 rounded p-3">
                    <div className="text-sm font-medium text-blue-800 mb-2">İçerik Önizleme:</div>
                    <div className="text-xs text-blue-700 leading-relaxed max-h-20 overflow-hidden">
                      {scenario.content.substring(0, 200)}...
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800 p-0 h-auto mt-1"
                      onClick={() => setSelectedScenario(
                        selectedScenario === scenario.id ? null : scenario.id
                      )}
                    >
                      {selectedScenario === scenario.id ? (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Gizle
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Tam İçeriği Göster
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Full Content */}
                  {selectedScenario === scenario.id && (
                    <div className="bg-gray-100 rounded p-4 max-h-96 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap text-gray-700">
                        {scenario.content}
                      </pre>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => runTest(scenario)}
                    disabled={isRunning}
                    className="w-full"
                    size="sm"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Test Çalışıyor...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Testi Başlat
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Custom Test Tab */}
        <TabsContent value="custom" className="space-y-6">
          {enableCustomScenarios ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Özel Test Senaryosu Oluştur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="custom-name">Test Adı</Label>
                    <Input
                      id="custom-name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Örn: Özel Biyoloji Testi"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-description">Açıklama</Label>
                    <Input
                      id="custom-description"
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="Test senaryosunun kısa açıklaması"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="custom-content">Test İçeriği</Label>
                  <Textarea
                    id="custom-content"
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    placeholder="Görsel referansları, şekil/tablo referansları içeren metninizi buraya yapıştırın..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    İpucu: Şekil 1.1, Tablo 2.1, &lt;img&gt; etiketleri gibi referanslar içeren metinler test için idealdir.
                  </div>
                </div>

                <div className="bg-blue-50 rounded p-4">
                  <div className="text-sm font-medium text-blue-800 mb-2">Test İpuçları:</div>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Şekil ve tablo referansları ekleyin (Şekil 1.1, Tablo 2.1)</li>
                    <li>• HTML img etiketleri kullanın (&lt;img src="..." alt="..."&gt;)</li>
                    <li>• Referanslar ile açıklamalar arasında bağlam oluşturun</li>
                    <li>• Türkçe akademik terimler kullanın</li>
                    <li>• Farklı bölümler arası referanslar ekleyin</li>
                  </ul>
                </div>

                <Button
                  onClick={runCustomTest}
                  disabled={isRunning || !customContent.trim()}
                  className="w-full"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Özel Test Çalışıyor...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Özel Testi Başlat
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Özel Test Devre Dışı
                </h3>
                <p className="text-gray-500">
                  Özel test senaryoları şu anda kullanılamıyor.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {testResults.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz Test Sonucu Yok
                </h3>
                <p className="text-gray-500 mb-4">
                  Test sonuçlarını görmek için önce bir test çalıştırın.
                </p>
                <Button
                  onClick={() => setActiveTab("scenarios")}
                  variant="outline"
                >
                  Test Senaryolarına Git
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Aggregate Statistics */}
              {aggregateStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Toplam Test</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {aggregateStats.totalTests}
                          </p>
                          <p className="text-xs text-gray-500">
                            Başarı: %{(aggregateStats.passRate * 100).toFixed(0)}
                          </p>
                        </div>
                        <TestTube className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Ort. Koruma</p>
                          <p className="text-2xl font-bold text-green-600">
                            {(aggregateStats.avgPreservation * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">
                            Bağlam koruma oranı
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Ort. Uyum</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {(aggregateStats.avgCoherence * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">
                            Bağlam uyumu
                          </p>
                        </div>
                        <Target className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Ort. Skor</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {aggregateStats.avgScore.toFixed(0)}
                          </p>
                          <p className="text-xs text-gray-500">
                            En iyi: {aggregateStats.bestScore.toFixed(0)}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Test Results List */}
              <div className="space-y-4">
                {testResults.map((result, index) => {
                  const scenario = predefinedScenarios.find(s => s.id === result.scenarioId);
                  return (
                    <Card key={`${result.scenarioId}-${result.timestamp}`} className="transition-all hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">#{testResults.length - index}</Badge>
                            <div>
                              <div className="font-semibold">
                                {scenario?.name || `Test ${result.scenarioId}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(result.timestamp).toLocaleString("tr-TR")}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={`${result.passed ? 
                                "text-green-600 bg-green-50 border-green-200" : 
                                "text-red-600 bg-red-50 border-red-200"
                              } border`}
                            >
                              {result.passed ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Başarılı
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Başarısız
                                </>
                              )}
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                              Skor: {result.score.toFixed(0)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-green-50 rounded">
                            <div className="text-lg font-bold text-green-600">
                              {(result.preservationRate * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-green-700">Koruma Oranı</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded">
                            <div className="text-lg font-bold text-purple-600">
                              {(result.contextCoherence * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-purple-700">Bağlam Uyumu</div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded">
                            <div className="text-lg font-bold text-blue-600">
                              {result.detectedReferences}
                            </div>
                            <div className="text-xs text-blue-700">Tespit Edilen</div>
                          </div>
                          <div className="text-center p-3 bg-orange-50 rounded">
                            <div className="text-lg font-bold text-orange-600">
                              {Math.round(result.averageSeparationDistance)}
                            </div>
                            <div className="text-xs text-orange-700">Ort. Mesafe</div>
                          </div>
                        </div>

                        {/* Reference Breakdown */}
                        <div className="bg-gray-50 rounded p-3">
                          <div className="text-sm font-medium text-gray-800 mb-2">Referans Dağılımı:</div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-green-600">Korunan:</span>
                              <span className="font-semibold">{result.preservedReferences}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-yellow-600">Ayrılan:</span>
                              <span className="font-semibold">{result.separatedReferences}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-600">Kayıp:</span>
                              <span className="font-semibold">{result.lostReferences}</span>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Results */}
                        {showDetailedResults && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowResultDetails(
                                showResultDetails === result.scenarioId ? null : result.scenarioId
                              )}
                            >
                              {showResultDetails === result.scenarioId ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-1" />
                                  Detayları Gizle
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Detayları Göster
                                </>
                              )}
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Rapor İndir
                            </Button>
                          </div>
                        )}

                        {/* Detailed Results Content */}
                        {showResultDetails === result.scenarioId && (
                          <div className="bg-blue-50 rounded p-4 space-y-3">
                            <div className="text-sm font-medium text-blue-800">Detaylı Sonuçlar:</div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-blue-700 font-medium">Test Bilgileri:</div>
                                <div className="text-blue-600 text-xs space-y-1 mt-1">
                                  <div>Strateji: {result.strategy}</div>
                                  <div>Chunk Sayısı: {result.details?.chunkCount || "N/A"}</div>
                                  <div>İşlem Süresi: {result.details?.processingTime?.toFixed(1) || "N/A"}s</div>
                                </div>
                              </div>
                              <div>
                                <div className="text-blue-700 font-medium">Performans:</div>
                                <div className="text-blue-600 text-xs space-y-1 mt-1">
                                  <div>Başarı Durumu: {result.passed ? "✅ Başarılı" : "❌ Başarısız"}</div>
                                  <div>Genel Skor: {result.score.toFixed(0)}/100</div>
                                  <div>Kalite Seviyesi: {
                                    result.score >= 80 ? "Mükemmel" :
                                    result.score >= 60 ? "İyi" :
                                    result.score >= 40 ? "Orta" : "Zayıf"
                                  }</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* Content Library Tab */}
        <TabsContent value="library" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Test İçeriği Kütüphanesi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                Hazır test içerikleri ve örnekler. Bu içerikleri kopyalayarak özel testlerinizde kullanabilirsiniz.
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sample Contents */}
                <div className="bg-gray-50 rounded p-4">
                  <div className="font-medium text-gray-800 mb-2">🧬 Biyoloji Örneği</div>
                  <div className="text-xs text-gray-600 mb-2">
                    Hücre yapısı ve organeller konulu akademik metin
                  </div>
                  <div className="bg-white rounded p-2 text-xs font-mono max-h-32 overflow-y-auto">
                    {`# Hücre Yapısı

Hücre, tüm canlıların temel yapı birimidir.

<img src="cell-structure.png" alt="Hücre yapısı" />

Şekil 1.1'de görüldüğü gibi, hücre zarı hücreyi çevreler.

## Organeller

Tablo 1.1'de organellerin görevleri verilmiştir.

| Organel | Görev |
|---------|-------|
| Çekirdek | Genetik kontrol |
| Mitokondri | Enerji üretimi |`}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    <Download className="h-3 w-3 mr-1" />
                    Kopyala
                  </Button>
                </div>

                <div className="bg-gray-50 rounded p-4">
                  <div className="font-medium text-gray-800 mb-2">⚗️ Kimya Örneği</div>
                  <div className="text-xs text-gray-600 mb-2">
                    Kimyasal reaksiyonlar ve denklemler
                  </div>
                  <div className="bg-white rounded p-2 text-xs font-mono max-h-32 overflow-y-auto">
                    {`# Kimyasal Reaksiyonlar

Asit-baz reaksiyonları temel kimya konularındandır.

Denklem 1.1: HCl + NaOH → NaCl + H₂O

<img src="reaction.png" alt="Reaksiyon şeması" />

Yukarıdaki şekilde reaksiyon mekanizması gösterilmektedir.

Grafik 1.1'de pH değişimi görülmektedir.`}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    <Download className="h-3 w-3 mr-1" />
                    Kopyala
                  </Button>
                </div>

                <div className="bg-gray-50 rounded p-4">
                  <div className="font-medium text-gray-800 mb-2">📐 Matematik Örneği</div>
                  <div className="text-xs text-gray-600 mb-2">
                    Geometri teoremleri ve ispatlar
                  </div>
                  <div className="bg-white rounded p-2 text-xs font-mono max-h-32 overflow-y-auto">
                    {`# Pisagor Teoremi

Dik üçgenlerde hipotenüs ile dik kenarlar arasındaki ilişki.

Teorem 1.1: a² + b² = c²

<img src="triangle.png" alt="Dik üçgen" />

Şekil 1.1'deki üçgende bu ilişki görülmektedir.

İspat için Şekil 1.2'ye bakınız.`}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    <Download className="h-3 w-3 mr-1" />
                    Kopyala
                  </Button>
                </div>

                <div className="bg-gray-50 rounded p-4">
                  <div className="font-medium text-gray-800 mb-2">🌍 Coğrafya Örneği</div>
                  <div className="text-xs text-gray-600 mb-2">
                    Harita referansları ve coğrafi özellikler
                  </div>
                  <div className="bg-white rounded p-2 text-xs font-mono max-h-32 overflow-y-auto">
                    {`# Türkiye'nin Coğrafi Özellikleri

Türkiye, Anadolu ve Trakya olmak üzere iki kıtada yer alır.

<img src="turkey-map.png" alt="Türkiye haritası" />

Harita 1.1'de Türkiye'nin konumu gösterilmektedir.

## İklim Özellikleri

Tablo 1.1'de iklim türleri verilmiştir.`}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    <Download className="h-3 w-3 mr-1" />
                    Kopyala
                  </Button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded">
                <div className="text-sm font-medium text-blue-800 mb-2">💡 İçerik Oluşturma İpuçları:</div>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Şekil ve tablo referanslarını numaralandırın (Şekil 1.1, Tablo 2.1)</li>
                  <li>• HTML img etiketleri ile görselleri işaretleyin</li>
                  <li>• Referanslar ile açıklamalar arasında anlamlı bağlantılar kurun</li>
                  <li>• "Yukarıdaki şekil", "aşağıdaki tablo" gibi bağlam ifadeleri kullanın</li>
                  <li>• Farklı bölümler arası referanslar ekleyin</li>
                  <li>• Türkçe akademik terminolojiyi tercih edin</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContextPreservationTester;