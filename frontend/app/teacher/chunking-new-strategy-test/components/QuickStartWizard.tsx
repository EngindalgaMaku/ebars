"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Rocket, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Circle,
  Play,
  Target,
  Lightbulb,
  BookOpen,
  Settings,
  Zap,
  Award,
  Users,
  Brain,
  Eye,
  FileText,
  Upload,
  Download,
  Copy,
  RefreshCw,
  Clock,
  Star,
  TrendingUp,
  BarChart3,
  Layers,
  Globe,
  Sparkles,
  Info,
  AlertTriangle,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Wand2,
  Microscope,
  Calculator,
  Beaker,
  Hash
} from "lucide-react";

// Wizard step interfaces
interface WizardStep {
  id: string;
  title: string;
  description: string;
  type: "welcome" | "setup" | "demo" | "practice" | "completion";
  content: StepContent;
  validation?: StepValidation;
  estimatedTime: number; // in minutes
  isOptional?: boolean;
  prerequisites?: string[];
}

interface StepContent {
  explanation: string;
  instructions?: string[];
  tips?: string[];
  warnings?: string[];
  examples?: StepExample[];
  interactive?: InteractiveElement;
  resources?: StepResource[];
}

interface StepExample {
  title: string;
  description: string;
  code?: string;
  result?: string;
  visual?: string;
}

interface InteractiveElement {
  type: "text-input" | "file-upload" | "selection" | "demo" | "test";
  label: string;
  placeholder?: string;
  options?: string[];
  defaultValue?: any;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

interface StepValidation {
  required: boolean;
  validator?: (data: any) => { isValid: boolean; message?: string };
}

interface StepResource {
  type: "link" | "document" | "video" | "tool";
  title: string;
  description: string;
  url?: string;
  icon?: string;
}

interface WizardData {
  userProfile: {
    name?: string;
    experience?: "beginner" | "intermediate" | "advanced";
    goals?: string[];
    preferredLanguage?: string;
  };
  testContent?: string;
  selectedScenarios?: string[];
  preferences: {
    chunkSize?: number;
    strategy?: string;
    enableAdvanced?: boolean;
  };
  completedSteps: string[];
}

interface QuickStartWizardProps {
  onComplete?: (data: WizardData) => void;
  onStepComplete?: (stepId: string, data: any) => void;
  onSkip?: () => void;
  initialData?: Partial<WizardData>;
  enableSkip?: boolean;
  showProgress?: boolean;
}

const QuickStartWizard: React.FC<QuickStartWizardProps> = ({
  onComplete,
  onStepComplete,
  onSkip,
  initialData,
  enableSkip = true,
  showProgress = true
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    userProfile: {},
    preferences: {},
    completedSteps: [],
    ...initialData
  });
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Comprehensive wizard steps for Turkish chunking system
  const wizardSteps: WizardStep[] = [
    {
      id: "welcome",
      title: "Hoş Geldiniz!",
      description: "Chunking Test Sistemine hoş geldiniz. Bu rehber size sistemi tanıtacak.",
      type: "welcome",
      estimatedTime: 2,
      content: {
        explanation: `# Chunking Test Sistemine Hoş Geldiniz! 🎉

Bu sistem, Türkçe akademik metinler için geliştirilmiş gelişmiş bir chunking test platformudur. 

## Ne Yapabilirsiniz?

### 📚 Test Senaryoları
- **E. coli Biyoloji Analizi**: Detaylı biyoloji metinleri
- **Newton Yasaları**: Fizik formülleri ve açıklamalar  
- **Kimyasal Reaksiyonlar**: Karmaşık kimya içerikleri
- **Geometri Teoremleri**: Matematiksel ispatlar
- **Edebiyat Analizi**: Türk şiiri ve analizi

### 🧠 Gelişmiş Özellikler
- **Semantik Chunking**: Anlam tabanlı bölümleme
- **Referans Korunumu**: Şekil/tablo referanslarının korunması
- **Türkçe Optimizasyonu**: Dil özelliklerine uygun işleme
- **Görsel Entegrasyon**: Metin-görsel ilişkilerinin analizi

### 📊 Analiz Araçları
- **Token Analizi**: Detaylı token incelemesi
- **Performans Metrikleri**: Hız ve kalite ölçümleri
- **Karşılaştırmalı Analiz**: Farklı stratejilerin kıyaslanması
- **Görselleştirme**: Chunk yapısının görsel analizi`,
        tips: [
          "Bu rehber yaklaşık 10-15 dakika sürecektir",
          "İstediğiniz zaman geri dönüp adımları tekrarlayabilirsiniz",
          "Her adımda örnekler ve açıklamalar bulacaksınız"
        ],
        resources: [
          {
            type: "document",
            title: "Sistem Dokümantasyonu",
            description: "Detaylı kullanım kılavuzu",
            icon: "📖"
          },
          {
            type: "video",
            title: "Tanıtım Videosu",
            description: "5 dakikalık sistem tanıtımı",
            icon: "🎥"
          }
        ]
      }
    },
    {
      id: "user_profile",
      title: "Kullanıcı Profili",
      description: "Size özel bir deneyim sunabilmek için birkaç soru",
      type: "setup",
      estimatedTime: 3,
      content: {
        explanation: `# Profilinizi Oluşturalım 👤

Size en uygun deneyimi sunabilmek için sizi tanımak istiyoruz.

## Neden Bu Bilgiler?

### 🎯 Kişiselleştirme
- Deneyim seviyenize uygun örnekler
- İlgi alanınıza göre test senaryoları
- Uygun zorluk seviyesi ayarları

### 📈 Öneriler
- Size uygun chunking stratejileri
- Performans optimizasyon ipuçları
- İlerleme takibi ve hedefler`,
        interactive: {
          type: "selection",
          label: "Chunking konusundaki deneyiminiz?",
          options: [
            "Yeni başlıyorum (Beginner)",
            "Temel bilgim var (Intermediate)", 
            "Deneyimliyim (Advanced)"
          ]
        },
        tips: [
          "Dürüst yanıtlar daha iyi öneriler sağlar",
          "Profil bilgileriniz sadece size özel öneriler için kullanılır",
          "İstediğiniz zaman profil ayarlarınızı değiştirebilirsiniz"
        ]
      },
      validation: {
        required: true,
        validator: (data) => {
          if (!data.experience) {
            return { isValid: false, message: "Lütfen deneyim seviyenizi seçin" };
          }
          return { isValid: true };
        }
      }
    },
    {
      id: "goals_setup",
      title: "Hedefleriniz",
      description: "Bu sistemle neyi başarmak istiyorsunuz?",
      type: "setup",
      estimatedTime: 2,
      content: {
        explanation: `# Hedeflerinizi Belirleyin 🎯

Sistemi kullanma amacınız nedir? Bu bilgi size özel öneriler sunmamızı sağlar.

## Yaygın Kullanım Alanları

### 🔬 Araştırma
- Akademik metin analizi
- Chunking stratejilerini karşılaştırma
- Performans optimizasyonu

### 📚 Eğitim
- Öğrencilere chunking öğretme
- Pratik örneklerle deneyim kazanma
- Farklı metin türlerini anlama

### 🏭 Üretim
- RAG sistemleri için optimizasyon
- Türkçe metinler için en iyi strateji
- Kalite kontrol ve test`,
        interactive: {
          type: "selection",
          label: "Ana hedefiniz nedir?",
          options: [
            "Chunking öğrenmek",
            "Sistem performansını test etmek",
            "Türkçe metinler için optimizasyon",
            "Öğrencilere öğretmek",
            "Araştırma yapmak"
          ]
        }
      }
    },
    {
      id: "first_demo",
      title: "İlk Demo",
      description: "Basit bir örnekle sistemi deneyimleyin",
      type: "demo",
      estimatedTime: 5,
      content: {
        explanation: `# İlk Deneyiminiz 🚀

Şimdi sistemi basit bir örnekle deneyeceğiz. Bu demo size temel işleyişi gösterecek.

## Demo İçeriği

Aşağıdaki Türkçe akademik metin örneğini kullanacağız:

### 📝 Örnek Metin: E. coli Bakterisi
Bu metin biyoloji alanından seçilmiş ve şu özellikleri içeriyor:
- **Şekil referansları**: "Şekil 1.1'de görüldüğü gibi..."
- **Tablo verileri**: Ölçüm tabloları
- **Teknik terimler**: Bilimsel terminoloji
- **Karmaşık cümleler**: Türkçe'ye özgü uzun cümle yapıları

## Beklenen Sonuçlar

### ✅ Başarılı Chunking
- Şekil referansları korunacak
- Tablo verileri bütün kalacak
- Teknik terimler ayrılmayacak
- Anlam bütünlüğü sağlanacak

### 📊 Metrikler
- **Chunk sayısı**: ~8-12 parça
- **Ortalama boyut**: 250-350 token
- **Referans korunumu**: %85+ başarı
- **Anlam tutarlılığı**: %80+ skor`,
        interactive: {
          type: "demo",
          label: "Demo'yu başlatmak için hazır mısınız?"
        },
        examples: [
          {
            title: "Örnek Chunk",
            description: "Başarılı chunking örneği",
            code: `# E. coli Bakterisi: Model Organizma

E. coli (Escherichia coli) bakterisi, enterobakteri familyasına ait gram-negatif bir bakteridir.

<img src="ecoli-electron-microscopy.jpg" alt="E. coli bakterisi elektron mikroskop görüntüsü" />

Şekil 2.1'de E. coli bakterisinin elektron mikroskop görüntüsü gösterilmektedir.`,
            result: "✅ Şekil referansı korundu, anlam bütünlüğü sağlandı"
          }
        ]
      }
    },
    {
      id: "content_upload",
      title: "Kendi İçeriğiniz",
      description: "Test etmek istediğiniz bir metin yükleyin (opsiyonel)",
      type: "practice",
      estimatedTime: 3,
      isOptional: true,
      content: {
        explanation: `# Kendi Metninizi Test Edin 📄

Artık kendi metninizle deneme yapabilirsiniz. Bu adım opsiyoneldir.

## Uygun Metin Türleri

### ✅ İdeal İçerikler
- **Akademik makaleler**: Şekil/tablo referanslı
- **Ders notları**: Başlık hiyerarşisi olan
- **Teknik dokümantasyon**: Formül içeren
- **Araştırma raporları**: Karmaşık yapılı

### ⚠️ Dikkat Edilecekler
- **Minimum uzunluk**: 500 kelime
- **Maksimum uzunluk**: 5000 kelime
- **Türkçe içerik**: En iyi sonuçlar için
- **UTF-8 kodlama**: Karakter sorunları için

## Analiz Edilecek Özellikler

### 🔍 Yapısal Analiz
- Başlık hiyerarşisi
- Paragraf yapısı
- Liste ve numaralandırmalar
- Referans sistemleri

### 📊 İçerik Analizi
- Kelime dağılımı
- Cümle uzunlukları
- Teknik terim yoğunluğu
- Karmaşıklık seviyesi`,
        interactive: {
          type: "text-input",
          label: "Metninizi buraya yapıştırın",
          placeholder: "Türkçe akademik metninizi buraya yapıştırın...",
          validation: {
            minLength: 100,
            maxLength: 10000
          }
        },
        tips: [
          "Kısa metinler için chunking çok anlamlı olmayabilir",
          "Şekil/tablo referansları olan metinler daha iyi test sağlar",
          "Bu adımı atlayıp hazır örneklerle devam edebilirsiniz"
        ]
      }
    },
    {
      id: "strategy_selection",
      title: "Strateji Seçimi",
      description: "Chunking stratejinizi seçin ve ayarlayın",
      type: "setup",
      estimatedTime: 4,
      content: {
        explanation: `# Chunking Stratejinizi Seçin ⚙️

Farklı chunking stratejileri farklı sonuçlar verir. Size en uygun olanı seçelim.

## Mevcut Stratejiler

### 🔤 Sabit Boyut (Fixed Size)
**Ne zaman kullanılır**: Homojen içerikler için
- ✅ **Avantajlar**: Öngörülebilir boyutlar, hızlı işleme
- ❌ **Dezavantajlar**: Anlam sınırlarını göz ardı eder
- 🎯 **Uygun**: Basit metinler, hız öncelikli durumlar

### 📝 Cümle Bazlı (Sentence-based)
**Ne zaman kullanılır**: Genel amaçlı kullanım için
- ✅ **Avantajlar**: Anlam bütünlüğü, doğal sınırlar
- ❌ **Dezavantajlar**: Değişken boyutlar
- 🎯 **Uygun**: Çoğu Türkçe metin için ideal

### 🧠 Semantik (Semantic)
**Ne zaman kullanılır**: Yüksek kalite gerektiğinde
- ✅ **Avantajlar**: En iyi anlam korunumu
- ❌ **Dezavantajlar**: Yavaş, karmaşık
- 🎯 **Uygun**: Kritik uygulamalar, araştırma

### 📊 Hibrit (Hybrid)
**Ne zaman kullanılır**: Denge gerektiğinde
- ✅ **Avantajlar**: Hız ve kalite dengesi
- ❌ **Dezavantajlar**: Orta seviye performans
- 🎯 **Uygun**: Üretim sistemleri`,
        interactive: {
          type: "selection",
          label: "Hangi stratejiyi denemek istiyorsunuz?",
          options: [
            "Cümle Bazlı (Önerilen)",
            "Semantik (Yüksek Kalite)",
            "Sabit Boyut (Hızlı)",
            "Hibrit (Dengeli)"
          ]
        },
        examples: [
          {
            title: "Strateji Karşılaştırması",
            description: "Aynı metin, farklı stratejiler",
            code: `Metin: "E. coli bakterisi gram-negatiftir. Şekil 1.1'de yapısı görülür. Tablo 2.1'de ölçümler verilmiştir."

Sabit Boyut: ["E. coli bakterisi gram-neg"] ["atiftir. Şekil 1.1'de yapısı"]
Cümle Bazlı: ["E. coli bakterisi gram-negatiftir."] ["Şekil 1.1'de yapısı görülür."]
Semantik: ["E. coli bakterisi gram-negatiftir. Şekil 1.1'de yapısı görülür."]`,
            result: "Semantik strateji referansları daha iyi koruyor"
          }
        ]
      },
      validation: {
        required: true
      }
    },
    {
      id: "advanced_settings",
      title: "Gelişmiş Ayarlar",
      description: "İsteğe bağlı gelişmiş ayarları yapılandırın",
      type: "setup",
      estimatedTime: 3,
      isOptional: true,
      content: {
        explanation: `# Gelişmiş Ayarlar 🔧

Daha detaylı kontrol için gelişmiş ayarları yapılandırabilirsiniz.

## Chunk Boyutu Ayarları

### 📏 Boyut Parametreleri
- **Minimum boyut**: 50-200 token
- **Maksimum boyut**: 300-800 token
- **Hedef boyut**: 200-500 token
- **Overlap oranı**: %10-30

### 🎯 Türkçe Optimizasyonları
- **Ek analizi**: Türkçe eklerin tanınması
- **Bağlaç kontrolü**: Cümle başı bağlaçları
- **Uzun cümle bölme**: Karmaşık cümle yapıları
- **Referans korunumu**: Şekil/tablo referansları

## Performans Ayarları

### ⚡ Hız vs Kalite
- **Hızlı mod**: Temel chunking, hızlı sonuç
- **Dengeli mod**: Orta kalite, makul hız
- **Kalite modu**: En iyi sonuç, yavaş işleme
- **Özel mod**: Manuel parametre ayarları

### 🔍 Analiz Derinliği
- **Temel**: Sadece chunking
- **Orta**: + Referans analizi
- **Detaylı**: + Semantik analiz
- **Tam**: + Görsel entegrasyon`,
        interactive: {
          type: "selection",
          label: "Hangi mod size uygun?",
          options: [
            "Varsayılan ayarları kullan (Önerilen)",
            "Hızlı mod (Temel chunking)",
            "Kalite modu (Detaylı analiz)",
            "Manuel ayarlar (Gelişmiş)"
          ]
        },
        tips: [
          "İlk kullanımda varsayılan ayarlar önerilir",
          "Manuel ayarlar deneyimli kullanıcılar içindir",
          "Ayarları daha sonra değiştirebilirsiniz"
        ]
      }
    },
    {
      id: "final_test",
      title: "Final Test",
      description: "Ayarlarınızla kapsamlı bir test yapın",
      type: "practice",
      estimatedTime: 5,
      content: {
        explanation: `# Final Test 🎯

Şimdi tüm ayarlarınızla kapsamlı bir test yapalım.

## Test Senaryosu

Seçtiğiniz ayarlara göre aşağıdaki test senaryolarından biri çalıştırılacak:

### 🧪 Beginner Seviye
- **E. coli Temel Analizi**: Basit biyoloji metni
- **Chunk sayısı**: 6-8 parça
- **Beklenen süre**: 30 saniye
- **Analiz derinliği**: Temel

### 🔬 Intermediate Seviye  
- **Newton Yasaları**: Formüllü fizik metni
- **Chunk sayısı**: 10-15 parça
- **Beklenen süre**: 45 saniye
- **Analiz derinliği**: Orta

### 🚀 Advanced Seviye
- **Karmaşık Araştırma**: Çoklu referanslı metin
- **Chunk sayısı**: 15-25 parça
- **Beklenen süre**: 60 saniye
- **Analiz derinliği**: Tam

## Değerlendirilecek Metrikler

### ✅ Başarı Kriterleri
- **Referans korunumu**: %80+ başarı
- **Anlam tutarlılığı**: %75+ skor
- **Chunk kalitesi**: Dengeli boyutlar
- **İşleme hızı**: Beklenen süre içinde

### 📊 Detaylı Analiz
- Token dağılımı
- Referans haritası
- Semantik tutarlılık
- Performans metrikleri`,
        interactive: {
          type: "demo",
          label: "Final testi başlatmaya hazır mısınız?"
        },
        warnings: [
          "Test 1-2 dakika sürebilir",
          "Sayfayı kapatmayın, test devam ediyor",
          "Sonuçlar otomatik olarak kaydedilecek"
        ]
      }
    },
    {
      id: "completion",
      title: "Tebrikler! 🎉",
      description: "Kurulum tamamlandı, sistemi kullanmaya başlayabilirsiniz",
      type: "completion",
      estimatedTime: 2,
      content: {
        explanation: `# Tebrikler! Kurulum Tamamlandı! 🎉

Chunking Test Sistemini başarıyla yapılandırdınız. Artık tüm özellikleri kullanabilirsiniz.

## 🚀 Sırada Ne Var?

### 📚 Test Senaryoları Kütüphanesi
- 6 farklı akademik alan
- 15+ hazır test senaryosu
- Türkçe optimize edilmiş içerikler
- Tek tıkla test başlatma

### 🧠 Etkileşimli Eğitim
- Adım adım öğrenme modülleri
- Pratik örneklerle deneyim
- İlerleme takibi
- Başarı rozetleri

### 🛠️ Gelişmiş Araçlar
- **Token Analizi**: Detaylı token incelemesi
- **Görsel Analiz**: Chunk yapısının görselleştirilmesi
- **Performans Karşılaştırması**: Strateji kıyaslamaları
- **Referans Kontrolü**: Şekil/tablo referans analizi

## 📈 İpuçları

### 🎯 En İyi Sonuçlar İçin
1. **Doğru strateji seçin**: İçerik türüne uygun
2. **Ayarları optimize edin**: Test ederek iyileştirin
3. **Sonuçları analiz edin**: Metrikleri takip edin
4. **Deneyim kazanın**: Farklı içerikler deneyin

### 🔄 Sürekli İyileştirme
- Düzenli olarak yeni özellikler ekleniyor
- Geri bildirimleriniz değerli
- Topluluk deneyimlerinden yararlanın
- Güncellemeleri takip edin`,
        resources: [
          {
            type: "tool",
            title: "Test Senaryoları",
            description: "Hazır senaryolarla hemen başlayın",
            icon: "🧪"
          },
          {
            type: "tool", 
            title: "Etkileşimli Eğitim",
            description: "Adım adım öğrenme modülleri",
            icon: "🎓"
          },
          {
            type: "tool",
            title: "İçerik Üretici",
            description: "Kendi test içeriklerinizi oluşturun",
            icon: "✨"
          },
          {
            type: "document",
            title: "En İyi Uygulamalar",
            description: "Optimizasyon ipuçları ve stratejiler",
            icon: "📖"
          }
        ]
      }
    }
  ];

  const currentStep = wizardSteps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / wizardSteps.length) * 100;
  const totalTime = wizardSteps.reduce((sum, step) => sum + step.estimatedTime, 0);
  const completedTime = wizardSteps.slice(0, currentStepIndex + 1).reduce((sum, step) => sum + step.estimatedTime, 0);

  const handleNext = async () => {
    if (currentStep.validation?.required) {
      const validation = currentStep.validation.validator?.(stepData[currentStep.id]);
      if (validation && !validation.isValid) {
        alert(validation.message || "Lütfen gerekli alanları doldurun");
        return;
      }
    }

    // Save step data
    const newWizardData = {
      ...wizardData,
      completedSteps: [...wizardData.completedSteps, currentStep.id]
    };

    // Update specific data based on step
    if (currentStep.id === "user_profile") {
      newWizardData.userProfile = {
        ...newWizardData.userProfile,
        experience: stepData[currentStep.id]?.experience
      };
    } else if (currentStep.id === "goals_setup") {
      newWizardData.userProfile = {
        ...newWizardData.userProfile,
        goals: stepData[currentStep.id]?.goals ? [stepData[currentStep.id].goals] : []
      };
    } else if (currentStep.id === "content_upload") {
      newWizardData.testContent = stepData[currentStep.id]?.content;
    } else if (currentStep.id === "strategy_selection") {
      newWizardData.preferences = {
        ...newWizardData.preferences,
        strategy: stepData[currentStep.id]?.strategy
      };
    }

    setWizardData(newWizardData);

    if (onStepComplete) {
      onStepComplete(currentStep.id, stepData[currentStep.id]);
    }

    if (currentStepIndex < wizardSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Wizard completed
      if (onComplete) {
        onComplete(newWizardData);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  const handleStepDataChange = (key: string, value: any) => {
    setStepData(prev => ({
      ...prev,
      [currentStep.id]: {
        ...prev[currentStep.id],
        [key]: value
      }
    }));
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

  const getStepIcon = (type: string) => {
    switch (type) {
      case "welcome": return <Rocket className="h-5 w-5" />;
      case "setup": return <Settings className="h-5 w-5" />;
      case "demo": return <Play className="h-5 w-5" />;
      case "practice": return <Target className="h-5 w-5" />;
      case "completion": return <Award className="h-5 w-5" />;
      default: return <Circle className="h-5 w-5" />;
    }
  };

  const renderInteractiveElement = () => {
    const interactive = currentStep.content.interactive;
    if (!interactive) return null;

    switch (interactive.type) {
      case "text-input":
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {interactive.label}
            </label>
            <Textarea
              placeholder={interactive.placeholder}
              value={stepData[currentStep.id]?.content || ""}
              onChange={(e) => handleStepDataChange("content", e.target.value)}
              rows={6}
              className="w-full"
            />
          </div>
        );

      case "selection":
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {interactive.label}
            </label>
            <div className="space-y-2">
              {interactive.options?.map((option, idx) => (
                <label key={idx} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={`${currentStep.id}_selection`}
                    value={option}
                    checked={stepData[currentStep.id]?.experience === option || stepData[currentStep.id]?.goals === option || stepData[currentStep.id]?.strategy === option}
                    onChange={(e) => {
                      if (currentStep.id === "user_profile") {
                        handleStepDataChange("experience", e.target.value);
                      } else if (currentStep.id === "goals_setup") {
                        handleStepDataChange("goals", e.target.value);
                      } else if (currentStep.id === "strategy_selection") {
                        handleStepDataChange("strategy", e.target.value);
                      }
                    }}
                    className="text-blue-600"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case "demo":
        return (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Play className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {interactive.label}
            </p>
            <Button
              onClick={() => {
                setIsProcessing(true);
                // Simulate demo processing
                setTimeout(() => {
                  setIsProcessing(false);
                  handleStepDataChange("demoCompleted", true);
                }, 3000);
              }}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Demo Çalışıyor...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Demo'yu Başlat
                </>
              )}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
          <Rocket className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Hızlı Başlangıç Rehberi
        </h1>
        <p className="text-gray-600">
          Chunking Test Sistemini kullanmaya başlamak için adım adım rehber
        </p>
      </div>

      {/* Progress */}
      {showProgress && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">İlerleme</span>
              <span className="text-sm text-gray-600">
                {currentStepIndex + 1} / {wizardSteps.length}
              </span>
            </div>
            <Progress value={progress} className="h-2 mb-3" />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Geçen süre: ~{completedTime} dk</span>
              <span>Kalan süre: ~{totalTime - completedTime} dk</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Step */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                {getStepIcon(currentStep.type)}
              </div>
              <div>
                <CardTitle className="text-xl">{currentStep.title}</CardTitle>
                <p className="text-gray-600 mt-1">{currentStep.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    ~{currentStep.estimatedTime} dk
                  </Badge>
                  {currentStep.isOptional && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                      Opsiyonel
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content */}
          <div className="prose max-w-none">
            <div 
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: currentStep.content.explanation.replace(/\n/g, '<br/>') 
              }}
            />
          </div>

          {/* Interactive Element */}
          {currentStep.content.interactive && (
            <div className="bg-blue-50 rounded-lg p-4">
              {renderInteractiveElement()}
            </div>
          )}

          {/* Examples */}
          {currentStep.content.examples && currentStep.content.examples.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection(`examples_${currentStep.id}`)}
              >
                <h4 className="font-medium text-gray-900">Örnekler</h4>
                {expandedSections.has(`examples_${currentStep.id}`) ? (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                )}
              </div>
              {expandedSections.has(`examples_${currentStep.id}`) && (
                <div className="mt-3 space-y-3">
                  {currentStep.content.examples.map((example, idx) => (
                    <div key={idx} className="bg-white rounded border p-3">
                      <div className="font-medium text-sm mb-2">{example.title}</div>
                      <div className="text-xs text-gray-600 mb-2">{example.description}</div>
                      {example.code && (
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {example.code}
                        </pre>
                      )}
                      {example.result && (
                        <div className="text-xs text-green-700 mt-2 font-medium">
                          {example.result}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          {currentStep.content.tips && currentStep.content.tips.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-green-900">İpuçları</h4>
              </div>
              <ul className="space-y-1 text-sm text-green-800">
                {currentStep.content.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {currentStep.content.warnings && currentStep.content.warnings.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <h4 className="font-medium text-yellow-900">Dikkat</h4>
              </div>
              <ul className="space-y-1 text-sm text-yellow-800">
                {currentStep.content.warnings.map((warning, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resources */}
          {currentStep.content.resources && currentStep.content.resources.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium text-purple-900">Kaynaklar</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentStep.content.resources.map((resource, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded border">
                    <span className="text-lg">{resource.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{resource.title}</div>
                      <div className="text-xs text-gray-600">{resource.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Önceki
                </Button>
              )}
              {enableSkip && currentStep.isOptional && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStepIndex < wizardSteps.length - 1) {
                      setCurrentStepIndex(currentStepIndex + 1);
                    }
                  }}
                >
                  Atla
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {enableSkip && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                >
                  Rehberi Atla
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {currentStepIndex === wizardSteps.length - 1 ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Tamamla
                  </>
                ) : (
                  <>
                    {currentStep.type === "demo" ? "Demo'yu Başlat" : "Devam Et"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Overview */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Rehber Adımları</h4>
            <Badge variant="outline" className="text-xs">
              {wizardData.completedSteps.length} / {wizardSteps.length} tamamlandı
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {wizardSteps.map((step, idx) => (
              <div
                key={step.id}
                className={`p-2 rounded text-center text-xs ${
                  idx === currentStepIndex
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : wizardData.completedSteps.includes(step.id)
                    ? "bg-green-100 text-green-800"
                    : "bg-white text-gray-600"
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  {wizardData.completedSteps.includes(step.id) ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : idx === currentStepIndex ? (
                    <Circle className="h-3 w-3 fill-current" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </div>
                <div className="font-medium">{step.title}</div>
                <div className="text-xs opacity-75">{step.estimatedTime}dk</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickStartWizard;