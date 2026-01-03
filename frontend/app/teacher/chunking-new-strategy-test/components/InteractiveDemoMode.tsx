"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play,
  Pause,
  Square,
  RotateCcw,
  Zap,
  Eye,
  Brain,
  Target,
  Clock,
  TrendingUp,
  BarChart3,
  Activity,
  Layers,
  FileText,
  Settings,
  Download,
  Copy,
  Share2,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Hash,
  Type,
  Globe,
  Users,
  Award,
  Star,
  Lightbulb,
  BookOpen,
  Code,
  Database,
  Cpu,
  Memory,
  HardDrive,
  Network,
  Shield,
  Lock,
  Unlock,
  Key,
  Fingerprint,
  Microscope,
  Calculator,
  Beaker
} from "lucide-react";

// Demo interfaces
interface DemoConfig {
  mode: "live" | "step-by-step" | "comparison";
  strategy: "traditional" | "agentic" | "both";
  speed: "slow" | "normal" | "fast";
  showExplanations: boolean;
  enableInteraction: boolean;
  highlightChanges: boolean;
  autoAdvance: boolean;
}

interface DemoStep {
  id: string;
  title: string;
  description: string;
  type: "input" | "processing" | "analysis" | "result";
  duration: number; // in milliseconds
  content: any;
  explanation?: string;
  tips?: string[];
  warnings?: string[];
}

interface DemoResult {
  stepId: string;
  timestamp: number;
  data: any;
  metrics: {
    processingTime: number;
    chunkCount: number;
    averageSize: number;
    qualityScore: number;
  };
  explanation: string;
}

interface InteractiveDemoModeProps {
  onDemoComplete?: (results: DemoResult[]) => void;
  onStepComplete?: (step: DemoStep, result: DemoResult) => void;
  onConfigChange?: (config: DemoConfig) => void;
  initialContent?: string;
  enableCustomContent?: boolean;
  showMetrics?: boolean;
  enableExport?: boolean;
}

const InteractiveDemoMode: React.FC<InteractiveDemoModeProps> = ({
  onDemoComplete,
  onStepComplete,
  onConfigChange,
  initialContent = "",
  enableCustomContent = true,
  showMetrics = true,
  enableExport = true
}) => {
  const [config, setConfig] = useState<DemoConfig>({
    mode: "step-by-step",
    strategy: "both",
    speed: "normal",
    showExplanations: true,
    enableInteraction: true,
    highlightChanges: true,
    autoAdvance: false
  });

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [demoResults, setDemoResults] = useState<DemoResult[]>([]);
  const [inputContent, setInputContent] = useState(initialContent);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedDemo, setSelectedDemo] = useState("e-coli-demo");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Predefined demo scenarios
  const demoScenarios = [
    {
      id: "e-coli-demo",
      title: "E. coli Bakterisi Analizi",
      description: "Biyoloji alanından E. coli bakterisi hakkında detaylı akademik metin",
      content: `# E. coli Bakterisi: Model Organizma Olarak Önemi

## Giriş

Escherichia coli (E. coli), enterobakteri familyasına ait gram-negatif, çubuk şeklinde bir bakteridir. Bu mikroorganizma, moleküler biyoloji ve genetik araştırmalarında en yaygın kullanılan model organizmalardan biridir.

## Morfolojik Özellikler

E. coli bakterileri tipik olarak 2-3 μm uzunluğunda ve 0.5 μm genişliğindedir. Şekil 1.1'de görüldüğü gibi, bu bakteriler çubuk şeklinde (basil) morfolojiye sahiptir ve genellikle tekil olarak bulunurlar.

![E. coli elektron mikroskop görüntüsü](ecoli-microscopy.jpg)

### Hücre Duvarı Yapısı

Gram-negatif bir bakteri olan E. coli'nin hücre duvarı karmaşık bir yapıya sahiptir:

- **İç membran**: Fosfolipid çift tabakası
- **Peptidoglikan tabakası**: İnce bir tabaka (2-7 nm)
- **Dış membran**: Lipopolisakkarit (LPS) içerir

Tablo 1.1'de E. coli hücre duvarının bileşenleri ve oranları gösterilmektedir.

| Bileşen | Yüzde (%) | Fonksiyon |
|---------|-----------|-----------|
| Peptidoglikan | 10-20 | Yapısal destek |
| Lipopolisakkarit | 30-40 | Koruma, toksisite |
| Protein | 40-50 | Enzim, transport |
| Lipid | 5-10 | Membran bütünlüğü |

## Fizyolojik Özellikler

### Metabolizma

E. coli fakültatif anaerob bir bakteridir, yani hem oksijen varlığında hem de yokluğunda yaşayabilir. Şekil 2.1'de gösterildiği gibi, glikoz metabolizması için çeşitli yolaklar kullanabilir:

1. **Aerobik solunum**: Oksijen varlığında
2. **Anaerobik solunum**: Alternatif elektron alıcıları ile
3. **Fermentasyon**: Oksijen yokluğunda

### Üreme Özellikleri

Optimal koşullarda E. coli'nin nesil süresi yaklaşık 20 dakikadır. Tablo 2.1'de farklı sıcaklıklarda üreme hızları gösterilmektedir.

| Sıcaklık (°C) | Nesil Süresi (dk) | Büyüme Hızı |
|---------------|-------------------|-------------|
| 25 | 60 | Yavaş |
| 30 | 40 | Orta |
| 37 | 20 | Hızlı |
| 42 | 30 | Orta |

## Genetik Özellikleri

E. coli'nin genomu yaklaşık 4.6 milyon baz çifti uzunluğundadır ve 4,300 civarında gen içerir. Şekil 3.1'de E. coli K-12 suşunun genetik haritası gösterilmektedir.

### Plazmidler

E. coli doğal olarak çeşitli plazmidler taşıyabilir:
- **F plazmidi**: Konjugasyon için
- **R plazmidleri**: Antibiyotik direnci
- **Col plazmidleri**: Kolicin üretimi

## Laboratuvar Kullanımı

E. coli'nin model organizma olarak tercih edilmesinin nedenleri:

1. **Hızlı üreme**: Kısa nesil süresi
2. **Basit beslenme**: Minimal medyumda büyüyebilir
3. **Genetik manipülasyon**: Kolay transformasyon
4. **İyi karakterize**: Genomu tamamen sekanslanmış

Şekil 4.1'de laboratuvar koşullarında E. coli kültürü gösterilmektedir.

## Biyoteknolojik Uygulamalar

### Rekombinant Protein Üretimi

E. coli, rekombinant protein üretiminde yaygın olarak kullanılır. Tablo 3.1'de E. coli'de üretilen bazı önemli proteinler listelenmiştir.

| Protein | Uygulama Alanı | Üretim Verimi |
|---------|----------------|---------------|
| İnsulin | Diyabet tedavisi | Yüksek |
| Büyüme hormonu | Büyüme bozuklukları | Orta |
| Interferon | Kanser tedavisi | Düşük |

### Metabolik Mühendislik

E. coli'nin metabolik yolakları değiştirilerek çeşitli biyoyakıtlar ve kimyasallar üretilebilir. Şekil 5.1'de metabolik mühendislik yaklaşımları gösterilmektedir.

## Sonuç

E. coli, basit yapısı ve hızlı üremesi sayesinde moleküler biyoloji araştırmalarının vazgeçilmez bir parçasıdır. Gelecekte de biyoteknoloji ve sentetik biyoloji alanlarında önemli rol oynamaya devam edecektir.

## Kaynaklar

1. Blattner, F. R., et al. (1997). The complete genome sequence of Escherichia coli K-12. Science, 277(5331), 1453-1462.
2. Neidhardt, F. C. (1996). Escherichia coli and Salmonella: cellular and molecular biology. ASM press.
3. Sambrook, J., & Russell, D. W. (2001). Molecular cloning: a laboratory manual. Cold spring harbor laboratory press.`,
      difficulty: "intermediate",
      expectedChunks: 12,
      estimatedTime: 45
    },
    {
      id: "physics-demo",
      title: "Newton Yasaları",
      description: "Fizik alanından Newton'un hareket yasaları ve uygulamaları",
      content: `# Newton'un Hareket Yasaları

## Birinci Yasa: Eylemsizlik Yasası

Newton'un birinci yasası, "Bir cisim üzerine etki eden net kuvvet sıfır ise, cisim durgun halde durgun kalır, hareket halinde ise düzgün doğrusal hareket yapmaya devam eder" şeklinde ifade edilir.

Matematiksel olarak:
$$\\sum F = 0 \\Rightarrow v = sabit$$

Şekil 1.1'de eylemsizlik yasasının günlük hayattan örnekleri gösterilmektedir.

## İkinci Yasa: Kuvvet Yasası

Newton'un ikinci yasası, kuvvet, kütle ve ivme arasındaki ilişkiyi tanımlar:

$$F = ma$$

Burada:
- F: Net kuvvet (Newton)
- m: Kütle (kg)  
- a: İvme (m/s²)

Tablo 1.1'de farklı kütleler için kuvvet-ivme ilişkisi gösterilmektedir.

| Kütle (kg) | Kuvvet (N) | İvme (m/s²) |
|------------|------------|-------------|
| 1 | 10 | 10 |
| 2 | 10 | 5 |
| 5 | 10 | 2 |

## Üçüncü Yasa: Etki-Tepki Yasası

"Her etkiye eşit ve zıt yönde bir tepki vardır."

$$F_{AB} = -F_{BA}$$

Şekil 2.1'de etki-tepki çiftleri örnekleri gösterilmektedir.`,
      difficulty: "beginner",
      expectedChunks: 6,
      estimatedTime: 25
    },
    {
      id: "chemistry-demo", 
      title: "Kimyasal Reaksiyonlar",
      description: "Kimya alanından reaksiyon türleri ve mekanizmaları",
      content: `# Kimyasal Reaksiyonlar ve Sınıflandırılması

## Giriş

Kimyasal reaksiyonlar, atomların yeniden düzenlenmesi sonucu yeni maddelerin oluştuğu süreçlerdir. Bu süreçlerde atomlar korunur ancak moleküler yapı değişir.

## Reaksiyon Türleri

### 1. Sentez Reaksiyonları

İki veya daha fazla basit maddenin birleşerek daha karmaşık bir madde oluşturması:

$$A + B \\rightarrow AB$$

Örnek: $2H_2 + O_2 \\rightarrow 2H_2O$

Şekil 1.1'de hidrojen ve oksijenin su oluşturması gösterilmektedir.

### 2. Ayrışma Reaksiyonları

Karmaşık bir maddenin daha basit maddelere ayrılması:

$$AB \\rightarrow A + B$$

Tablo 1.1'de yaygın ayrışma reaksiyonları listelenmiştir.

| Reaktan | Ürünler | Koşul |
|---------|---------|-------|
| $CaCO_3$ | $CaO + CO_2$ | Isı |
| $H_2O_2$ | $H_2O + O_2$ | Katalizör |
| $NaCl$ | $Na + Cl_2$ | Elektroliz |

## Reaksiyon Hızı

Reaksiyon hızı, birim zamanda reaktan konsantrasyonundaki değişim olarak tanımlanır:

$$v = -\\frac{d[A]}{dt} = k[A]^n$$

Şekil 2.1'de sıcaklığın reaksiyon hızına etkisi gösterilmektedir.`,
      difficulty: "intermediate",
      expectedChunks: 8,
      estimatedTime: 35
    }
  ];

  // Demo steps for processing
  const generateDemoSteps = (content: string, strategy: string): DemoStep[] => {
    const baseSteps: DemoStep[] = [
      {
        id: "input-analysis",
        title: "Metin Analizi",
        description: "Giriş metninin yapısal analizi yapılıyor",
        type: "input",
        duration: 2000,
        content: { text: content, length: content.length },
        explanation: "Metin uzunluğu, paragraf sayısı ve yapısal özellikler analiz ediliyor.",
        tips: [
          "Uzun metinler daha iyi chunking sonuçları verir",
          "Başlık hiyerarşisi chunking kalitesini artırır",
          "Şekil ve tablo referansları önemli sınır belirleyicileridir"
        ]
      },
      {
        id: "preprocessing",
        title: "Ön İşleme",
        description: "Metin temizleme ve normalizasyon",
        type: "processing",
        duration: 1500,
        content: { 
          originalLength: content.length,
          cleanedLength: Math.floor(content.length * 0.95),
          removedElements: ["extra spaces", "formatting artifacts"]
        },
        explanation: "Gereksiz boşluklar temizleniyor ve metin normalize ediliyor."
      }
    ];

    if (strategy === "traditional" || strategy === "both") {
      baseSteps.push({
        id: "traditional-chunking",
        title: "Geleneksel Chunking",
        description: "Sabit boyut tabanlı bölümleme",
        type: "processing",
        duration: 3000,
        content: {
          method: "Fixed Size",
          chunkSize: 1000,
          overlap: 200,
          estimatedChunks: Math.ceil(content.length / 800)
        },
        explanation: "Metin sabit boyutlarda parçalara bölünüyor.",
        warnings: ["Cümle ortalarında kesilme olabilir", "Anlam bütünlüğü korunamayabilir"]
      });
    }

    if (strategy === "agentic" || strategy === "both") {
      baseSteps.push({
        id: "semantic-analysis",
        title: "Semantik Analiz",
        description: "LLM tabanlı anlam analizi",
        type: "analysis",
        duration: 4000,
        content: {
          method: "LLM Reasoning",
          model: "Groq Llama 3.1 8B",
          analysisDepth: "Deep"
        },
        explanation: "Metin içeriği semantik olarak analiz ediliyor ve doğal sınırlar belirleniyor."
      });

      baseSteps.push({
        id: "agentic-chunking",
        title: "Agentic Chunking",
        description: "Akıllı sınır belirleme",
        type: "processing",
        duration: 5000,
        content: {
          method: "Semantic Boundaries",
          reasoning: true,
          contextPreservation: true
        },
        explanation: "LLM reasoning ile optimal chunk sınırları belirleniyor.",
        tips: [
          "Şekil referansları korunuyor",
          "Paragraf bütünlüğü sağlanıyor",
          "Bağlamsal ilişkiler dikkate alınıyor"
        ]
      });
    }

    baseSteps.push({
      id: "quality-analysis",
      title: "Kalite Analizi",
      description: "Chunk kalitesi değerlendirmesi",
      type: "analysis",
      duration: 2500,
      content: {
        metrics: ["semantic_coherence", "boundary_quality", "size_consistency"],
        scores: {
          traditional: strategy !== "agentic" ? 0.65 + Math.random() * 0.2 : undefined,
          agentic: strategy !== "traditional" ? 0.8 + Math.random() * 0.15 : undefined
        }
      },
      explanation: "Oluşturulan chunk'ların kalitesi çeşitli metriklerle değerlendiriliyor."
    });

    baseSteps.push({
      id: "results",
      title: "Sonuçlar",
      description: "Final sonuçların hazırlanması",
      type: "result",
      duration: 1000,
      content: {
        completed: true,
        totalTime: baseSteps.reduce((sum, step) => sum + step.duration, 0)
      },
      explanation: "Chunking işlemi tamamlandı ve sonuçlar hazırlandı."
    });

    return baseSteps;
  };

  const currentScenario = demoScenarios.find(s => s.id === selectedDemo) || demoScenarios[0];
  const demoSteps = generateDemoSteps(inputContent || currentScenario.content, config.strategy);
  const currentStep = demoSteps[currentStepIndex];

  // Speed multipliers
  const speedMultiplier = {
    slow: 2,
    normal: 1,
    fast: 0.5
  }[config.speed];

  const handleConfigChange = (newConfig: Partial<DemoConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    if (onConfigChange) {
      onConfigChange(updatedConfig);
    }
  };

  const startDemo = () => {
    setIsRunning(true);
    setIsPaused(false);
    setCurrentStepIndex(0);
    setDemoResults([]);
    
    if (config.mode === "live") {
      runLiveDemo();
    } else {
      runStepByStepDemo();
    }
  };

  const pauseDemo = () => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
    }
  };

  const resumeDemo = () => {
    setIsPaused(false);
    if (config.mode === "live") {
      runLiveDemo();
    } else {
      runStepByStepDemo();
    }
  };

  const stopDemo = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStepIndex(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
    }
  };

  const resetDemo = () => {
    stopDemo();
    setDemoResults([]);
    setCurrentStepIndex(0);
  };

  const runStepByStepDemo = () => {
    if (currentStepIndex >= demoSteps.length) {
      completeDemo();
      return;
    }

    const step = demoSteps[currentStepIndex];
    const duration = step.duration * speedMultiplier;

    // Simulate step processing
    stepTimeoutRef.current = setTimeout(() => {
      if (!isPaused) {
        const result: DemoResult = {
          stepId: step.id,
          timestamp: Date.now(),
          data: step.content,
          metrics: {
            processingTime: duration,
            chunkCount: Math.floor(Math.random() * 5) + 3,
            averageSize: Math.floor(Math.random() * 200) + 300,
            qualityScore: 0.7 + Math.random() * 0.25
          },
          explanation: step.explanation || ""
        };

        setDemoResults(prev => [...prev, result]);

        if (onStepComplete) {
          onStepComplete(step, result);
        }

        if (config.autoAdvance && currentStepIndex < demoSteps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
          setTimeout(() => runStepByStepDemo(), 500);
        } else if (currentStepIndex === demoSteps.length - 1) {
          completeDemo();
        } else {
          setCurrentStepIndex(prev => prev + 1);
        }
      }
    }, duration);
  };

  const runLiveDemo = () => {
    let stepIndex = 0;
    const processStep = () => {
      if (stepIndex >= demoSteps.length || isPaused) {
        if (stepIndex >= demoSteps.length) {
          completeDemo();
        }
        return;
      }

      const step = demoSteps[stepIndex];
      setCurrentStepIndex(stepIndex);

      const result: DemoResult = {
        stepId: step.id,
        timestamp: Date.now(),
        data: step.content,
        metrics: {
          processingTime: step.duration * speedMultiplier,
          chunkCount: Math.floor(Math.random() * 5) + 3,
          averageSize: Math.floor(Math.random() * 200) + 300,
          qualityScore: 0.7 + Math.random() * 0.25
        },
        explanation: step.explanation || ""
      };

      setDemoResults(prev => [...prev, result]);

      if (onStepComplete) {
        onStepComplete(step, result);
      }

      stepIndex++;
      stepTimeoutRef.current = setTimeout(processStep, step.duration * speedMultiplier);
    };

    processStep();
  };

  const completeDemo = () => {
    setIsRunning(false);
    setIsPaused(false);
    
    if (onDemoComplete) {
      onDemoComplete(demoResults);
    }
  };

  const nextStep = () => {
    if (currentStepIndex < demoSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      if (!config.autoAdvance) {
        runStepByStepDemo();
      }
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const exportResults = () => {
    const exportData = {
      config,
      scenario: currentScenario,
      steps: demoSteps,
      results: demoResults,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chunking-demo-${selectedDemo}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-4">
          <Play className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Etkileşimli Demo Modu
        </h1>
        <p className="text-gray-600">
          Chunking sürecini gerçek zamanlı olarak izleyin ve öğrenin
        </p>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Demo Konfigürasyonu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Demo Mode */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Demo Modu</label>
              <select
                value={config.mode}
                onChange={(e) => handleConfigChange({ mode: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                disabled={isRunning}
              >
                <option value="step-by-step">Adım Adım</option>
                <option value="live">Canlı</option>
                <option value="comparison">Karşılaştırmalı</option>
              </select>
            </div>

            {/* Strategy */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Strateji</label>
              <select
                value={config.strategy}
                onChange={(e) => handleConfigChange({ strategy: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                disabled={isRunning}
              >
                <option value="traditional">Geleneksel</option>
                <option value="agentic">Agentic</option>
                <option value="both">Her İkisi</option>
              </select>
            </div>

            {/* Speed */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Hız</label>
              <select
                value={config.speed}
                onChange={(e) => handleConfigChange({ speed: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                disabled={isRunning}
              >
                <option value="slow">Yavaş</option>
                <option value="normal">Normal</option>
                <option value="fast">Hızlı</option>
              </select>
            </div>

            {/* Demo Scenario */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Demo Senaryosu</label>
              <select
                value={selectedDemo}
                onChange={(e) => setSelectedDemo(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                disabled={isRunning}
              >
                {demoScenarios.map(scenario => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.showExplanations}
                onChange={(e) => handleConfigChange({ showExplanations: e.target.checked })}
                disabled={isRunning}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Açıklamaları Göster</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.enableInteraction}
                onChange={(e) => handleConfigChange({ enableInteraction: e.target.checked })}
                disabled={isRunning}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Etkileşim Aktif</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.highlightChanges}
                onChange={(e) => handleConfigChange({ highlightChanges: e.target.checked })}
                disabled={isRunning}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Değişiklikleri Vurgula</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.autoAdvance}
                onChange={(e) => handleConfigChange({ autoAdvance: e.target.checked })}
                disabled={isRunning || config.mode === "live"}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Otomatik İlerleme</span>
            </label>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t">
            {!isRunning ? (
              <Button onClick={startDemo} className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                Demo Başlat
              </Button>
            ) : (
              <>
                {!isPaused ? (
                  <Button onClick={pauseDemo} variant="outline">
                    <Pause className="h-4 w-4 mr-2" />
                    Duraklat
                  </Button>
                ) : (
                  <Button onClick={resumeDemo} className="bg-blue-600 hover:bg-blue-700">
                    <Play className="h-4 w-4 mr-2" />
                    Devam Et
                  </Button>
                )}
                <Button onClick={stopDemo} variant="destructive">
                  <Square className="h-4 w-4 mr-2" />
                  Durdur
                </Button>
              </>
            )}
            
            <Button onClick={resetDemo} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Sıfırla
            </Button>

            {config.mode === "step-by-step" && config.enableInteraction && !config.autoAdvance && (
              <>
                <Button 
                  onClick={previousStep} 
                  variant="outline" 
                  disabled={currentStepIndex === 0 || isRunning}
                >
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Önceki
                </Button>
                <Button 
                  onClick={nextStep} 
                  variant="outline" 
                  disabled={currentStepIndex >= demoSteps.length - 1 || isRunning}
                >
                  Sonraki
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}

            {enableExport && demoResults.length > 0 && (
              <Button onClick={exportResults} variant="outline" className="ml-auto">
                <Download className="h-4 w-4 mr-2" />
                Sonuçları İndir
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Demo Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Demo Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Step */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {currentStep?.type === "input" && <FileText className="h-5 w-5 text-blue-600" />}
                  {currentStep?.type === "processing" && <Cpu className="h-5 w-5 text-orange-600" />}
                  {currentStep?.type === "analysis" && <Brain className="h-5 w-5 text-purple-600" />}
                  {currentStep?.type === "result" && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {currentStep?.title || "Demo Hazır"}
                </CardTitle>
                <Badge variant="outline">
                  Adım {currentStepIndex + 1} / {demoSteps.length}
                </Badge>
              </div>
              {currentStep && (
                <p className="text-gray-600">{currentStep.description}</p>
              )}
            </CardHeader>
            <CardContent>
              {currentStep && (
                <div className="space-y-4">
                  {/* Progress Bar */}
                  {isRunning && !isPaused && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>İşleniyor...</span>
                        <span>{Math.round((currentStepIndex / demoSteps.length) * 100)}%</span>
                      </div>
                      <Progress value={(currentStepIndex / demoSteps.length) * 100} />
                    </div>
                  )}

                  {/* Step Content */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(currentStep.content, null, 2)}
                    </pre>
                  </div>

                  {/* Explanation */}
                  {config.showExplanations && currentStep.explanation && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <h4 className="font-medium text-blue-900">Açıklama</h4>
                      </div>
                      <p className="text-sm text-blue-800">{currentStep.explanation}</p>
                    </div>
                  )}

                  {/* Tips */}
                  {currentStep.tips && currentStep.tips.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-green-600" />
                        <h4 className="font-medium text-green-900">İpuçları</h4>
                      </div>
                      <ul className="space-y-1">
                        {currentStep.tips.map((tip, idx) => (
                          <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                            <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {currentStep.warnings && currentStep.warnings.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <h4 className="font-medium text-yellow-900">Dikkat</h4>
                      </div>
                      <ul className="space-y-1">
                        {currentStep.warnings.map((warning, idx) => (
                          <li key={idx} className="text-sm text-yellow-800 flex items-start gap-2">
                            <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Content Input */}
          {enableCustomContent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Özel İçerik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder="Kendi metninizi buraya yazın veya yukarıdaki senaryolardan birini seçin..."
                  rows={6}
                  disabled={isRunning}
                  className="w-full"
                />
                <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                  <span>{inputContent.length} karakter</span>
                  <span>Tahmini chunk sayısı: {Math.ceil(inputContent.length / 800)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Step Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                İlerleme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-2 rounded ${
                      index === currentStepIndex
                        ? "bg-blue-100 border border-blue-200"
                        : index < currentStepIndex
                        ? "bg-green-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      index === currentStepIndex
                        ? "bg-blue-600 text-white"
                        : index < currentStepIndex
                        ? "bg-green-600 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}>
                      {index < currentStepIndex ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{step.title}</div>
                      <div className="text-xs text-gray-500">{step.type}</div>
                    </div>
                    {index === currentStepIndex && isRunning && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          {showMetrics && demoResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Metrikler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {demoResults.slice(-1).map((result) => (
                    <div key={result.stepId} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>İşlem Süresi</span>
                        <span>{(result.metrics.processingTime / 1000).toFixed(1)}s</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Chunk Sayısı</span>
                        <span>{result.metrics.chunkCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Ortalama Boyut</span>
                        <span>{result.metrics.averageSize} karakter</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Kalite Skoru</span>
                        <span>{(result.metrics.qualityScore * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scenario Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Senaryo Bilgisi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium">{currentScenario.title}</div>
                  <div className="text-xs text-gray-500">{currentScenario.description}</div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Zorluk</span>
                  <Badge variant="outline" className={
                    currentScenario.difficulty === "beginner" ? "bg-green-50 text-green-700" :
                    currentScenario.difficulty === "intermediate" ? "bg-yellow-50 text-yellow-700" :
                    "bg-red-50 text-red-700"
                  }>
                    {currentScenario.difficulty}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Beklenen Chunk</span>
                  <span>{currentScenario.expectedChunks}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tahmini Süre</span>
                  <span>{currentScenario.estimatedTime}s</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InteractiveDemoMode;