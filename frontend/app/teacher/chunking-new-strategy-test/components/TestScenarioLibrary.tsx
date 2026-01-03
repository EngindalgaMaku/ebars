"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Play, 
  Search, 
  Filter, 
  Star,
  Clock,
  Target,
  Zap,
  Award,
  Microscope,
  Calculator,
  Beaker,
  Globe,
  FileText,
  Image,
  BarChart3,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Info,
  Download,
  Eye,
  EyeOff,
  Sparkles,
  Brain,
  Layers,
  Hash,
  RefreshCw
} from "lucide-react";

// Test scenario interfaces
interface TestScenario {
  id: string;
  name: string;
  description: string;
  category: "biology" | "physics" | "chemistry" | "mathematics" | "literature" | "mixed";
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: number; // in minutes
  content: string;
  expectedChallenges: string[];
  successCriteria: {
    minPreservationRate: number;
    minContextCoherence: number;
    maxSeparationDistance: number;
  };
  tags: string[];
  turkishOptimized: boolean;
  hasVisuals: boolean;
  hasReferences: boolean;
  hasTables: boolean;
  popularity: number; // 1-5 stars
}

interface TestScenarioLibraryProps {
  onRunScenario?: (scenario: TestScenario) => Promise<void>;
  onPreviewScenario?: (scenario: TestScenario) => void;
  enableQuickStart?: boolean;
  showPopularFirst?: boolean;
}

const TestScenarioLibrary: React.FC<TestScenarioLibraryProps> = ({
  onRunScenario,
  onPreviewScenario,
  enableQuickStart = true,
  showPopularFirst = true
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<string | null>(null);

  // Comprehensive Turkish academic test scenarios
  const scenarios: TestScenario[] = [
    {
      id: "ecoli_biology_comprehensive",
      name: "E. coli Bakterisi - Kapsamlı Biyoloji Analizi",
      description: "E. coli bakterisinin yapısı, özellikleri ve biyoteknolojideki rolü hakkında görsel referansları içeren detaylı akademik metin",
      category: "biology",
      difficulty: "intermediate",
      estimatedTime: 8,
      content: `# Biyoloji Nedir ve E. coli Bakterisi

## Giriş: Biyolojinin Temel Kavramları

Biyoloji, canlı organizmaları ve yaşam süreçlerini inceleyen bilim dalıdır. Bu bilim dalı, mikroorganizmalardan karmaşık çok hücreli organizmalara kadar geniş bir yelpazede çalışır.

### Mikroorganizmalar ve Önemi

Mikroorganizmalar, çıplak gözle görülemeyen küçük canlılardır. Bunlar arasında bakteriler, virüsler, mantarlar ve protozoalar bulunur.

<img src="microorganisms-overview.jpg" alt="Mikroorganizma türleri genel görünümü" />

Şekil 1.1'de görüldüğü gibi, mikroorganizmalar çeşitli şekil ve boyutlarda bulunur.

## E. coli Bakterisi: Model Organizma

### Morfolojik Özellikler

E. coli (Escherichia coli) bakterisi, enterobakteri familyasına ait gram-negatif bir bakteridir.

<img src="ecoli-electron-microscopy.jpg" alt="E. coli bakterisi elektron mikroskop görüntüsü" />

Şekil 2.1'de E. coli bakterisinin elektron mikroskop görüntüsü gösterilmektedir.

### Boyut ve Şekil Özellikleri

Tablo 2.1'de E. coli bakterisinin temel ölçümleri verilmiştir:

| Özellik | Değer | Birim |
|---------|-------|-------|
| Uzunluk | 2-6 | μm |
| Genişlik | 1.1-1.5 | μm |
| Hacim | 0.6-0.7 | μm³ |
| Kuru ağırlık | 2.8 × 10⁻¹³ | g |

### Biyoteknolojideki Rolü

E. coli, modern biyoteknolojinin temel taşlarından biridir. Bu bakteri, protein üretimi ve genetik mühendislik uygulamalarında yaygın olarak kullanılmaktadır.

## Sonuç ve Değerlendirme

E. coli bakterisi, hem temel bilimsel araştırmalarda hem de endüstriyel uygulamalarda kritik öneme sahiptir.`,
      expectedChallenges: [
        "Şekil referansları ile görsel açıklamaları arasındaki bağlantı",
        "Tablo verileri ile metin açıklamaları arasındaki uyum",
        "Denklem ve formül referanslarının korunması",
        "Çoklu görsel referanslarının chunk'lar arası dağılımı"
      ],
      successCriteria: {
        minPreservationRate: 0.85,
        minContextCoherence: 0.8,
        maxSeparationDistance: 400
      },
      tags: ["bakteriyoloji", "mikroorganizma", "biyoteknoloji", "genetik", "görsel-referans"],
      turkishOptimized: true,
      hasVisuals: true,
      hasReferences: true,
      hasTables: true,
      popularity: 5
    },
    {
      id: "newton_laws_physics",
      name: "Newton'un Hareket Yasaları - Fizik Analizi",
      description: "Newton'un üç hareket yasası, matematiksel formüller ve pratik uygulamalar içeren kapsamlı fizik metni",
      category: "physics",
      difficulty: "intermediate",
      estimatedTime: 10,
      content: `# Newton'un Hareket Yasaları

## Giriş: Klasik Mekaniğin Temelleri

Sir Isaac Newton'un 1687'de yayınladığı "Principia Mathematica" eseri, modern fiziğin temellerini atmıştır.

## Birinci Yasa: Eylemsizlik Yasası

### Yasa İfadesi

Bir cisim üzerine net kuvvet etki etmediği sürece, durgun cisim durgun kalır, hareketli cisim düzgün doğrusal hareket yapar.

Matematiksel ifade:
Denklem 1.1: ΣF = 0 ⟹ v = sabit

<img src="inertia-examples.png" alt="Eylemsizlik örnekleri" />

## İkinci Yasa: Temel Dinamik Yasası

### Yasa İfadesi

Bir cisme etki eden net kuvvet, cismin kütlesi ile ivmesinin çarpımına eşittir.

Denklem 2.1: F = ma

<img src="force-acceleration-graph.png" alt="Kuvvet-ivme grafiği" />

## Üçüncü Yasa: Etki-Tepki Yasası

### Yasa İfadesi

Her etkiye eşit ve zıt yönde bir tepki vardır.

Denklem 3.1: F₁₂ = -F₂₁

<img src="action-reaction-examples.png" alt="Etki-tepki örnekleri" />

## Sonuç

Newton'un hareket yasaları, klasik mekaniğin temelini oluşturur.`,
      expectedChallenges: [
        "Matematiksel denklemler ile açıklayıcı metinler",
        "Grafik referansları ile veri yorumlamaları",
        "Örnek hesaplamalar ile teorik açıklamalar",
        "Çoklu şekil referanslarının sıralı korunması"
      ],
      successCriteria: {
        minPreservationRate: 0.88,
        minContextCoherence: 0.82,
        maxSeparationDistance: 350
      },
      tags: ["mekanik", "kuvvet", "hareket", "matematik", "formül"],
      turkishOptimized: true,
      hasVisuals: true,
      hasReferences: true,
      hasTables: true,
      popularity: 4
    },
    {
      id: "chemical_reactions_comprehensive",
      name: "Kimyasal Reaksiyonlar - Kapsamlı Analiz",
      description: "Asit-baz reaksiyonları, redoks reaksiyonları ve kimyasal denge konularını içeren detaylı kimya metni",
      category: "chemistry",
      difficulty: "advanced",
      estimatedTime: 12,
      content: `# Kimyasal Reaksiyonlar: Kapsamlı İnceleme

## Giriş: Kimyasal Değişimler

Kimyasal reaksiyonlar, maddenin yapısında meydana gelen değişimlerdir.

<img src="reaction-types-classification.png" alt="Kimyasal reaksiyon türleri sınıflandırması" />

## Asit-Baz Reaksiyonları

### Brønsted-Lowry Teorisi

Asit: Proton (H⁺) veren madde
Baz: Proton (H⁺) alan madde

Genel reaksiyon:
Denklem 2.1: HA + B ⇌ A⁻ + BH⁺

### Nötralizasyon Reaksiyonları

Güçlü asit-güçlü baz reaksiyonu:
Denklem 2.2: HCl + NaOH → NaCl + H₂O

<img src="neutralization-setup.png" alt="Nötralizasyon deneyi düzeneği" />

## Redoks Reaksiyonları

### Yükseltgenme-İndirgenme Kavramları

Yükseltgenme: Elektron kaybı
İndirgenme: Elektron kazanımı

Genel redoks reaksiyonu:
Denklem 3.1: Zn + Cu²⁺ → Zn²⁺ + Cu

<img src="daniell-cell-diagram.png" alt="Daniell hücresi şeması" />

## Kimyasal Denge

### Denge Sabiti

Genel reaksiyon için: aA + bB ⇌ cC + dD

Denge sabiti ifadesi:
Denklem 4.1: Kc = [C]ᶜ[D]ᵈ/[A]ᵃ[B]ᵇ

## Sonuç ve Değerlendirme

Kimyasal reaksiyonlar, modern kimya endüstrisinin temelini oluşturur.`,
      expectedChallenges: [
        "Kimyasal denklemler ile açıklayıcı metinler",
        "Grafik verileri ile teorik açıklamalar",
        "Tablo referansları ile hesaplama örnekleri",
        "Çoklu görsel referanslarının bağlamsal korunması"
      ],
      successCriteria: {
        minPreservationRate: 0.82,
        minContextCoherence: 0.78,
        maxSeparationDistance: 450
      },
      tags: ["kimya", "reaksiyon", "denge", "kinetik", "endüstriyel"],
      turkishOptimized: true,
      hasVisuals: true,
      hasReferences: true,
      hasTables: true,
      popularity: 4
    },
    {
      id: "geometry_theorems_proofs",
      name: "Geometri Teoremleri ve İspatları",
      description: "Pisagor teoremi, benzer üçgenler ve çember geometrisi konularında detaylı matematiksel ispatlar",
      category: "mathematics",
      difficulty: "advanced",
      estimatedTime: 15,
      content: `# Geometri Teoremleri ve İspatları

## Giriş: Geometrinin Temelleri

Geometri, şekillerin özelliklerini ve aralarındaki ilişkileri inceleyen matematik dalıdır.

<img src="euclidean-axioms-diagram.png" alt="Öklid geometrisi aksiyomları" />

## Pisagor Teoremi

### Teorem İfadesi

Dik üçgenlerde hipotenüsün karesi, dik kenarların karelerinin toplamına eşittir.

Teorem 2.1: a² + b² = c²

<img src="pythagorean-theorem-diagram.png" alt="Pisagor teoremi diyagramı" />

### İspat Yöntemleri

#### 1. Kare Yöntemi ile İspat

<img src="pythagorean-square-proof.png" alt="Pisagor teoremi kare ispatı" />

Matematiksel analiz:
Denklem 2.1: (a+b)² = c² + 2ab

## Benzer Üçgenler

### Benzerlik Kriterleri

#### AA (Açı-Açı) Benzerliği

Teorem 3.1: İki üçgenin iki açısı sırasıyla eşit ise, üçgenler benzerdir.

<img src="aa-similarity-triangles.png" alt="AA benzerlik kriteriyle benzer üçgenler" />

## Çember Geometrisi

### Merkez Açı ve Çevre Açı İlişkisi

Teorem 4.1: Aynı yayı gören merkez açı, çevre açının iki katıdır.

<img src="central-inscribed-angle.png" alt="Merkez açı ve çevre açı ilişkisi" />

## Sonuç ve Değerlendirme

Geometri teoremleri, mantıksal düşünce ve matematiksel akıl yürütmenin temelini oluşturur.`,
      expectedChallenges: [
        "Matematiksel ispatlar ile geometrik şekiller",
        "Teorem referansları ile açıklayıcı metinler",
        "Denklem numaraları ile formül açıklamaları",
        "Çoklu şekil referanslarının ispat adımları ile uyumu"
      ],
      successCriteria: {
        minPreservationRate: 0.9,
        minContextCoherence: 0.85,
        maxSeparationDistance: 300
      },
      tags: ["geometri", "ispat", "teorem", "matematik", "analitik"],
      turkishOptimized: true,
      hasVisuals: true,
      hasReferences: true,
      hasTables: true,
      popularity: 3
    },
    {
      id: "turkish_literature_analysis",
      name: "Türk Edebiyatı - Şiir Analizi",
      description: "Nazim Hikmet'in şiirlerinin analizi, edebi sanatlar ve dönem özellikleri içeren edebiyat metni",
      category: "literature",
      difficulty: "intermediate",
      estimatedTime: 9,
      content: `# Türk Edebiyatında Toplumsal Gerçekçilik: Nazım Hikmet Örneği

## Giriş: 20. Yüzyıl Türk Şiiri

20. yüzyıl Türk edebiyatı, toplumsal değişimlerin etkisiyle yeni arayışlara girmiştir.

<img src="social-realism-characteristics.png" alt="Toplumsal gerçekçilik özellikleri" />

## Nazım Hikmet: Yaşamı ve Sanatı

### Biyografik Bilgiler

Nazım Hikmet Ran (1902-1963), Türk şiirinin en önemli temsilcilerinden biridir.

| Yıl | Olay | Dönem |
|-----|------|-------|
| 1902 | Doğum (Selanik) | Çocukluk |
| 1921 | Moskova'ya gidiş | Gençlik |
| 1963 | Ölüm (Moskova) | Son |

### Şiir Anlayışı

<img src="nazim-hikmet-poetry-elements.png" alt="Nazım Hikmet'in şiir unsurları" />

## "Memleketimden İnsan Manzaraları" Analizi

### Tema Analizi

Şair, toplumsal adaletsizlikleri şu dizelerle eleştirir:

> "Açlık var memleketimde  
> ve açlık korkunç şey  
> açlık, insanı insan olmaktan çıkarır"

| Edebi Sanat | Örnek | Etkisi |
|-------------|-------|--------|
| Tekrar | "açlık" kelimesi | Vurgu |
| Kişileştirme | "açlık korkunç şey" | Somutlaştırma |

## "En Güzel Deniz" Şiiri İncelemesi

### Özgürlük Motifi

Şiirde deniz, özgürlük simgesi olarak kullanılır:

> "En güzel deniz  
> henüz gidilmemiş olandır"

<img src="symbolic-meaning-layers.png" alt="Simgesel anlam katmanları" />

## Sonuç ve Değerlendirme

Nazım Hikmet, Türk şiirinde çığır açan bir şairdir.`,
      expectedChallenges: [
        "Şiir alıntıları ile analiz metinleri",
        "Edebi terim açıklamaları ile örnekler",
        "Karşılaştırmalı tablolar ile değerlendirmeler",
        "Dönem özellikleri ile şair analizi bağlantıları"
      ],
      successCriteria: {
        minPreservationRate: 0.8,
        minContextCoherence: 0.75,
        maxSeparationDistance: 400
      },
      tags: ["edebiyat", "şiir", "analiz", "nazım-hikmet", "toplumsal-gerçekçilik"],
      turkishOptimized: true,
      hasVisuals: true,
      hasReferences: true,
      hasTables: true,
      popularity: 3
    },
    {
      id: "mixed_academic_research",
      name: "Karışık Akademik Araştırma Metni",
      description: "Farklı disiplinlerden referansları içeren karmaşık akademik metin - en zorlu test senaryosu",
      category: "mixed",
      difficulty: "advanced",
      estimatedTime: 18,
      content: `# Interdisipliner Araştırma: Biyoloji, Fizik ve Kimya Entegrasyonu

Bu çalışma, biyolojik sistemlerdeki fizikokimyasal süreçleri interdisipliner bir yaklaşımla incelemektedir.

## Giriş

Modern bilim, disiplinler arası yaklaşımları gerektirmektedir.

<img src="interdisciplinary-methodology.png" alt="İnterdisipliner araştırma metodolojisi" />

Şekil 1.1'de metodolojik çerçeve gösterilmektedir.

## Materyal ve Yöntem

E. coli BL21(DE3) suşu kullanılmıştır.

<img src="ecoli-growth-curve.png" alt="E. coli büyüme eğrisi" />

Bradford protein tayini:
Denklem 2.1: A₅₉₅ = ε × c × l

| Basamak | Protein (mg) | Aktivite (U) | Verim (%) |
|---------|--------------|--------------|-----------|
| Ham ekstrakt | 1250 | 5000 | 100 |
| İyon değişim | 85 | 3400 | 68 |

## Bulgular

Enzim aktivitesi Michaelis-Menten modeline uygun bulunmuştur:

Denklem 3.1: v = (V_max × [S])/(K_m + [S])

<img src="michaelis-menten-plot.png" alt="Michaelis-Menten grafiği" />

## Sonuç

Bu çalışmada elde edilen temel bulgular interdisipliner yaklaşımın önemini göstermektedir.`,
      expectedChallenges: [
        "Çoklu referans türleri (şekil, tablo, denklem)",
        "Karmaşık içerik yapısı",
        "Farklı bölümler arası referanslar",
        "Akademik terminoloji yoğunluğu"
      ],
      successCriteria: {
        minPreservationRate: 0.7,
        minContextCoherence: 0.65,
        maxSeparationDistance: 600
      },
      tags: ["interdisipliner", "araştırma", "karmaşık", "akademik", "çoklu-referans"],
      turkishOptimized: true,
      hasVisuals: true,
      hasReferences: true,
      hasTables: true,
      popularity: 5
    },
    // Topic Drift Detection Test Scenarios
    {
      id: "quantum_to_cooking_drift",
      name: "Kuantum Fiziği → Yemek Pişirme Sapması",
      description: "Kuantum mekaniği konusundan yemek pişirme konusuna kademeli geçiş - konu sapması testi",
      category: "mixed",
      difficulty: "advanced",
      estimatedTime: 12,
      content: `# Kuantum Mekaniği ve Dalga Fonksiyonları

## Giriş: Kuantum Dünyasının Temelleri

Kuantum mekaniği, atom altı parçacıkların davranışlarını açıklayan fizik dalıdır. Bu alanda, klasik fizik yasaları geçerliliğini yitirir.

### Schrödinger Denklemi

Kuantum sistemlerinin zaman evrimini tanımlayan temel denklem:

Denklem 1.1: iℏ ∂ψ/∂t = Ĥψ

<img src="schrodinger-equation.png" alt="Schrödinger denklemi gösterimi" />

### Dalga-Parçacık İkiliği

Elektron gibi parçacıklar hem dalga hem de parçacık özelliği gösterir.

## Kuantum Süperpozisyonu

Bir kuantum sistemi, aynı anda birden fazla durumda bulunabilir. Bu kavram, günlük yaşamımızda karşılaştığımız durumlarla benzerlik gösterir.

### Günlük Yaşamda Süperpozisyon

Aslında, yemek pişirirken de benzer bir durum yaşarız. Bir yemeğin lezzeti, içindeki malzemelerin karışımından oluşur.

## Yemek Pişirme Sanatı

Yemek pişirmek, malzemelerin doğru kombinasyonunu bulmakla ilgilidir. Tıpkı kuantum durumları gibi, tatlar da birbirleriyle etkileşim halindedir.

### Temel Pişirme Teknikleri

#### Haşlama Yöntemi

Su kaynatma sıcaklığı 100°C'dir. Bu sıcaklıkta sebzeler yumuşar ve besin değerleri korunur.

<img src="boiling-vegetables.jpg" alt="Sebze haşlama işlemi" />

#### Kızartma Teknikleri

Yağda kızartma işlemi 180-200°C arasında yapılır. Bu sıcaklık aralığında Maillard reaksiyonu gerçekleşir.

### Baharat Kullanımı

Baharatlar, yemeklere lezzet katar. Her baharatın kendine özgü aroması vardır:

| Baharat | Özellik | Kullanım Alanı |
|---------|---------|----------------|
| Karabiber | Acı | Et yemekleri |
| Kırmızıbiber | Yakıcı | Soslar |
| Kimyon | Aromatik | Köfte |

## Mutfak Ekipmanları

Modern mutfaklarda çeşitli araçlar kullanılır. Tencere, tava, bıçak gibi temel araçlar her mutfakta bulunur.

### Pişirme Süreleri

Farklı yiyecekler farklı pişirme süreleri gerektirir:

- Makarna: 8-12 dakika
- Pilav: 15-20 dakika
- Et: 45-60 dakika

## Sonuç

Yemek pişirmek hem sanat hem de bilimdir. Doğru tekniklerle lezzetli yemekler hazırlanabilir.`,
      expectedChallenges: [
        "Kuantum fiziği terimlerinden mutfak terimlerine geçiş",
        "Bilimsel formüllerden pratik tariflere değişim",
        "Akademik üsluptan günlük dile kayma",
        "Konu tutarlılığının kaybolması"
      ],
      successCriteria: {
        minPreservationRate: 0.6,
        minContextCoherence: 0.5,
        maxSeparationDistance: 800
      },
      tags: ["konu-sapması", "kuantum", "yemek", "drift-test", "geçiş"],
      turkishOptimized: true,
      hasVisuals: true,
      hasReferences: true,
      hasTables: true,
      popularity: 5
    },
    {
      id: "biology_to_economics_abrupt",
      name: "Biyoloji → Ekonomi Ani Geçiş",
      description: "Hücre biyolojisinden makroekonomiye ani konu değişimi - ani sapma testi",
      category: "mixed",
      difficulty: "advanced",
      estimatedTime: 10,
      content: `# Hücre Biyolojisi ve Metabolizma

## Hücresel Solunum Süreci

Hücreler, glikozdan ATP üretmek için oksijen kullanır. Bu süreç mitokondrilerde gerçekleşir.

### Glikoliz Aşaması

Glikoliz, sitoplazmada gerçekleşen ilk aşamadır:

Denklem 1: C₆H₁₂O₆ + 2 ADP + 2 Pi → 2 C₃H₄O₃ + 2 ATP

<img src="glycolysis-pathway.png" alt="Glikoliz metabolik yolu" />

### Krebs Döngüsü

Mitokondri matriksinde gerçekleşen döngüsel reaksiyonlar serisidir.

## Makroekonomik Göstergeler ve Analiz

Türkiye ekonomisinin 2024 yılı performansı, çeşitli makroekonomik göstergelerle değerlendirilmektedir.

### Enflasyon Oranları

TÜIK verilerine göre, 2024 yılı enflasyon oranları:

| Ay | TÜFE (%) | ÜFE (%) |
|----|----------|---------|
| Ocak | 64.9 | 48.7 |
| Şubat | 67.1 | 51.2 |
| Mart | 68.5 | 49.9 |

### Döviz Kurları

USD/TRY paritesi yıl boyunca volatilite göstermiştir:

<img src="usd-try-chart.png" alt="USD/TRY kur grafiği" />

### Merkez Bankası Politikaları

TCMB, enflasyonla mücadele kapsamında faiz artırımına gitmiştir. Politika faizi %45 seviyesine yükseltilmiştir.

#### Faiz Kararlarının Etkileri

Yüksek faiz oranları:
- Tasarruf artışı
- Yatırım azalması
- Tüketim düşüşü

### İşsizlik Oranları

TÜİK verilerine göre işsizlik oranı %10.2 seviyesindedir.

## Sonuç

Ekonomik göstergeler, ülkenin genel durumunu yansıtır.`,
      expectedChallenges: [
        "Biyolojik süreçlerden ekonomik kavramlara ani geçiş",
        "Bilimsel terminolojiden ekonomik jargona değişim",
        "Farklı veri türleri ve ölçü birimlerinin karışması",
        "Bağlamsal tutarsızlık"
      ],
      successCriteria: {
        minPreservationRate: 0.5,
        minContextCoherence: 0.4,
        maxSeparationDistance: 1000
      },
      tags: ["ani-sapma", "biyoloji", "ekonomi", "abrupt-drift", "tutarsızlık"],
      turkishOptimized: true,
      hasVisuals: true,
      hasReferences: true,
      hasTables: true,
      popularity: 4
    },
    {
      id: "academic_to_casual_register",
      name: "Akademik → Günlük Dil Geçişi",
      description: "Formal akademik dilden günlük konuşma diline geçiş - dil kaydı değişimi testi",
      category: "literature",
      difficulty: "intermediate",
      estimatedTime: 8,
      content: `# Türk Edebiyatında Modernleşme Süreci: Tanzimat'tan Cumhuriyet'e

## Giriş: Edebiyatta Paradigma Değişimi

Türk edebiyatının modernleşme süreci, Tanzimat Fermanı'nın ilanıyla başlayan toplumsal dönüşümün bir yansımasıdır. Bu dönemde, geleneksel edebiyat anlayışından modern edebiyat anlayışına geçiş yaşanmıştır.

### Tanzimat Dönemi Edebiyatının Karakteristik Özellikleri

Tanzimat dönemi edebiyatı, Batılılaşma hareketinin etkisiyle şekillenmiştir. Bu dönemin önde gelen temsilcileri arasında İbrahim Şinasi, Namık Kemal ve Ahmet Mithat Efendi yer almaktadır.

#### Şinasi'nin Edebiyat Anlayışı

İbrahim Şinasi, Türk edebiyatına yeni bir soluk getirmiştir. "Şair Evlenmesi" adlı eseriyle tiyatro türünü Türk edebiyatına kazandırmıştır.

### Servet-i Fünun Dönemi

Bu dönemde sanat için sanat anlayışı benimsenmiştir. Tevfik Fikret, Cenap Şahabettin gibi şairler bu akımın öncüleridir.

## Yani şimdi bu konuyu biraz daha basit anlatayım arkadaşlar

Aslında bu edebiyat işi o kadar da karmaşık değil. Düşünün, eskiden şairler hep aynı kalıplarla yazıyorlardı. Sonra Batı'dan yeni fikirler geldi, herkes "aa, biz de böyle yazalım" dedi.

### Mesela Namık Kemal'i ele alalım

Adam gerçekten çok iyiydi ya! "Vatan Yahut Silistre" diye bir oyun yazdı, millet çok sevdi. Hatta o kadar beğendiler ki, tiyatroda izleyenler ağladı, güldu, ne bileyim işte.

#### Şu Tevfik Fikret de var bir de

Bu adam da çok enteresan biri. Şiirlerinde hep güzel kelimeler kullanır, ama bazen o kadar süslü ki, ne dediğini anlamak zor oluyor. Sanki gösteriş yapıyor gibi.

### Cumhuriyet döneminde işler değişti tabii

Atatürk zamanında herkes "artık halk için yazalım" dedi. Nazım Hikmet falan çıktı, bambaşka şiirler yazmaya başladı. Çok güzel yazdı bu arada, ama siyasi görüşleri yüzünden hapise girdi zavallı.

## Sonuç olarak

Türk edebiyatı çok güzel bir gelişim gösterdi. Eskiden çok ağır, anlaşılmaz şeyler yazılıyordu. Sonra daha sade, anlaşılır hale geldi. Bu da güzel bir şey bence.`,
      expectedChallenges: [
        "Formal akademik dilden günlük konuşma diline geçiş",
        "Terminoloji değişimi (akademik → günlük)",
        "Cümle yapısı ve üslup değişimi",
        "Kaynak gösterme biçiminin değişmesi"
      ],
      successCriteria: {
        minPreservationRate: 0.7,
        minContextCoherence: 0.6,
        maxSeparationDistance: 500
      },
      tags: ["dil-kaydı", "akademik", "günlük", "register-shift", "üslup"],
      turkishOptimized: true,
      hasVisuals: false,
      hasReferences: true,
      hasTables: false,
      popularity: 4
    },
    // Context Noise Test Scenarios
    {
      id: "encoding_noise_turkish",
      name: "Türkçe Karakter Kodlama Gürültüsü",
      description: "Türkçe karakterlerin yanlış kodlanması ve karakter bozulmaları - kodlama gürültüsü testi",
      category: "mixed",
      difficulty: "intermediate",
      estimatedTime: 6,
      content: `# TÃ¼rkÃ§e Dil Ã–zellikleri ve Morfolojik YapÄ±

## GiriÅŸ: TÃ¼rkÃ§enin Temel Ã–zellikleri

TÃ¼rkÃ§e, Altay dil ailesine ait agglÃ¼tinatif bir dildir. Bu dilin en Ã¶nemli Ã¶zelliÄŸi, kÃ¶klere eklenen eklerle yeni anlamlar oluÅŸturmasÄ±dÄ±r.

### Sesli Uyumu (Vokal Harmony)

TÃ¼rkÃ§ede iki tÃ¼r sesli uyumu vardÄ±r:

1. BÃ¼yÃ¼k sesli uyumu: a-Ä±, e-i, o-u, Ã¶-Ã¼
2. KÃ¼Ã§Ã¼k sesli uyumu: e-i, a-Ä±

<img src="sesli-uyumu-Åžemasä±.png" alt="Sesli uyumu Åžemasä±" />

### Morfolojik EkleÅŸme

TÃ¼rkÃ§ede kelimeler, kÃ¶k + ek yapÄ±sÄ±yla oluÅŸur:

| KÃ¶k | Ek | Yeni Kelime |
|------|----|-----------|
| ev | -ler | evler |
| gÃ¶z | -lÃ¼k | gÃ¶zlÃ¼k |
| yaÅŸ | -lÄ± | yaÅŸlÄ± |

## Ã‡ekim Ekleri

### Ä°sim Ã‡ekimi

Ä°simler, hÃ¢l ekleriyle Ã§ekilir:

- Yalä±n hÃ¢l: ev
- Belirtme hÃ¢li: evi
- Yönelme hÃ¢li: eve
- Bulunma hÃ¢li: evde
- Ã‡Ä±kma hÃ¢li: evden
- Ä°lgi hÃ¢li: evin

### Fiil Ã‡ekimi

Fiiller, kiÅŸi ve zaman ekleriyle Ã§ekilir:

Denklem 1: Fiil kÃ¶kÃ¼ + Zaman eki + KiÅŸi eki

Ã–rnek: gel-di-m (geldim)

## SÃ¶z DizimÄ± (Syntax)

TÃ¼rkÃ§ede temel sÃ¶z dizimi: Ã–zne + Nesne + YÃ¼klem

Ã–rnek: Ali kitabÄ± okudu.

### Soru CÃ¼mleleri

Soru cÃ¼mleleri, soru ekleriyle oluÅŸturulur:
- -mÄ± eki: Geldi mi?
- -mÄ±ÅŸ eki: GelmiÅŸ mi?

## SonuÃ§

TÃ¼rkÃ§enin morfolojik yapÄ±sÄ± oldukÃ§a zengin ve sistematiktir. Bu Ã¶zellikler, dilin ifade gÃ¼cÃ¼nÃ¼ artÄ±rÄ±r.`,
      expectedChallenges: [
        "Türkçe karakterlerin yanlış kodlanması (ç→Ã§, ş→ÅŸ, ğ→ÄŸ)",
        "UTF-8 kodlama problemleri",
        "Karakter bozulmaları ve okunamaz metinler",
        "Tablo ve formül içindeki karakter hataları"
      ],
      successCriteria: {
        minPreservationRate: 0.4,
        minContextCoherence: 0.3,
        maxSeparationDistance: 600
      },
      tags: ["kodlama-gürültüsü", "türkçe-karakter", "encoding", "noise", "bozulma"],
      turkishOptimized: true,
      hasVisuals: true,
      hasReferences: true,
      hasTables: true,
      popularity: 5
    },
    {
      id: "mixed_script_noise",
      name: "Karışık Yazı Sistemi Gürültüsü",
      description: "Türkçe, İngilizce, Arapça ve Yunanca karakterlerin karışık kullanımı - yazı sistemi gürültüsü",
      category: "mixed",
      difficulty: "advanced",
      estimatedTime: 7,
      content: `# Dil Bilimi ve Comparative Linguistics Αρχές

## Introduction: Türkçe ve Other Languages

Bu çalışmada, Türkçe dilinin other languages ile comparison yapılacaktır. Özellikle morphological features ve syntactic structures incelenecektir.

### Phonological Systems مقارنة

Different languages have مختلف phonological systems:

| Language | Vowels | Consonants | Special Features |
|----------|--------|------------|------------------|
| Türkçe | 8 | 21 | Vowel harmony |
| English | 12-20 | 24 | Stress patterns |
| العربية | 3 | 28 | Root system |
| Ελληνικά | 5 | 17 | Pitch accent |

### Morphological Typology

Languages can be classified according to their morphological type:

1. **Isolating** (Chinese): 我 看 书 (I read book)
2. **Agglutinative** (Turkish): ev-ler-im-de (in my houses)
3. **Fusional** (Latin): am-ā-v-ī (I have loved)
4. **Polysynthetic** (Inuktitut): complex word formation

<img src="morphological-types-διάγραμμα.png" alt="Morphological types diagram" />

## Syntactic Structures المقارنة

### Word Order Patterns

Different languages show different word order preferences:

- **SOV**: Türkçe, Japanese, Korean
  - Ali kitab-ı oku-du (Ali book-ACC read-PAST)
  - 太郎が本を読んだ (Taro ga hon wo yonda)

- **SVO**: English, French, Chinese
  - Ali read the book
  - Ali a lu le livre

- **VSO**: Arabic, Irish, Welsh
  - قرأ علي الكتاب (qara'a Ali al-kitab)

### Case Systems

Some languages have extensive case systems:

#### Turkish Case System:
- Nominative: ev (house)
- Accusative: ev-i (house-ACC)
- Dative: ev-e (house-DAT)
- Locative: ev-de (house-LOC)
- Ablative: ev-den (house-ABL)
- Genitive: ev-in (house-GEN)

#### Greek Case System (Ελληνικά):
- Ονομαστική: ο άνθρωπος (the man-NOM)
- Γενική: του ανθρώπου (the man-GEN)
- Αιτιατική: τον άνθρωπο (the man-ACC)

## Conclusion والخلاصة

Comparative linguistics reveals fascinating patterns across languages. Each language has unique features that reflect cultural and historical influences.

The study of multiple writing systems (Latin, Arabic, Greek, Chinese) shows the diversity of human linguistic expression.`,
      expectedChallenges: [
        "Farklı yazı sistemlerinin karışık kullanımı",
        "Dil değişimleri ve kod karıştırma",
        "Farklı yönlerde yazılan metinler",
        "Karakter kodlama çakışmaları"
      ],
      successCriteria: {
        minPreservationRate: 0.3,
        minContextCoherence: 0.25,
        maxSeparationDistance: 800
      },
      tags: ["yazı-sistemi", "karışık-dil", "script-mixing", "multilingual", "chaos"],
      turkishOptimized: true,
      hasVisuals: true,
      hasReferences: true,
      hasTables: true,
      popularity: 4
    },
    {
      id: "punctuation_chaos_noise",
      name: "Noktalama İşareti Kaos Gürültüsü",
      description: "Düzensiz noktalama işaretleri ve yazım hataları - noktalama gürültüsü testi",
      category: "literature",
      difficulty: "intermediate",
      estimatedTime: 5,
      content: `# Türkçe Noktalama İşaretleri ve;; Yazım Kuralları???

## Giriş!!! Noktalama İşaretlerinin Önemi,,,

Noktalama işaretleri... metinlerin anlaşılmasında çok önemli rol oynar.. Doğru kullanılmadığında;; anlam karmaşası oluşur!!!

### Temel Noktalama İşaretleri:::::

1. Nokta (.) - Cümle sonu
2. Virgül (,) - Ara durma
3. Noktalı virgül (;) - Uzun ara
4. İki nokta (:) - Açıklama
5. Soru işareti (?) - Soru cümlesi
6. Ünlem işareti (!) - Ünlem cümlesi

<img src="noktalama-işaretleri--diagram.png" alt="Noktalama işaretleri şeması" />

## Virgül Kullanımı,,,, Kuralları

Virgül;; şu durumlarda kullanılır:::

- Sıralı kelimeler arasında: elma, armut, kiraz
- Uzun cümlelerde nefes almak için: Okula gittim,, derslere katıldım,, eve döndüm...
- Seslenme sözlerinden sonra: Ali,, gel buraya!
- Yer bildiren sözlerden sonra: İstanbul'da,, Ankara'da,, İzmir'de

### Yanlış Virgül Kullanımları!!!

Şu durumlarda virgül kullanılmaz::::
- Özne ile yüklem arasında: Ali, geldi. (YANLIŞ)
- Sıfat ile isim arasında: Güzel, kız (YANLIŞ)
- Edat ile kelime arasında: İçin, sen (YANLIŞ)

## Noktalı Virgül;; Kullanımı

Noktalı virgül;; şu durumlarda kullanılır:::
- Uzun cümleler arasında;; bağlantı kurmak için
- Maddeleme yaparken;; öğeler arasında
- Karşılaştırma yaparken;; zıt durumları belirtmek için

| İşaret | Kullanım | Örnek |
|--------|----------|-------|
| . | Cümle sonu | Ali geldi. |
| , | Ara durma | Ali, Ayşe, Mehmet |
| ; | Uzun ara | Çalıştı;; başardı |
| : | Açıklama | Şöyle: böyle |
| ? | Soru | Nasılsın? |
| ! | Ünlem | Ne güzel! |

## Tırnak İşaretleri "" ve '' Kullanımı

Tırnak işaretleri şu durumlarda kullanılır:
- Doğrudan alıntılarda: "Merhaba" dedi.
- Özel isimlerde: "Kırmızı Başlıklı Kız" masalı
- Vurgu yapmak için: Bu "çok" önemli

### Tek Tırnak '' Kullanımı

Tek tırnak;; şu durumlarda kullanılır:
- Tırnak içinde tırnak: "Ali 'merhaba' dedi" cümlesi
- Kısaltmalarda: 'Dr.' yerine 'Doktor'

## Sonuç... Ve Değerlendirme!!!

Noktalama işaretleri;; doğru kullanıldığında metinler daha anlaşılır olur... Yanlış kullanım;; anlam karmaşasına yol açar!!!

Bu kuralları;; öğrenmek ve uygulamak çok önemlidir...`,
      expectedChallenges: [
        "Aşırı ve yanlış noktalama işareti kullanımı",
        "Tutarsız noktalama desenleri",
        "Anlam bozucu noktalama hataları",
        "Görsel referanslarla noktalama uyumsuzluğu"
      ],
      successCriteria: {
        minPreservationRate: 0.5,
        minContextCoherence: 0.4,
        maxSeparationDistance: 400
      },
      tags: ["noktalama-gürültüsü", "yazım-hatası", "punctuation", "chaos", "düzensizlik"],
      turkishOptimized: true,
      hasVisuals: true,
      hasReferences: true,
      hasTables: true,
      popularity: 3
    }
  ];

  // Run scenario function
  const runScenario = async (scenario: TestScenario) => {
    if (!onRunScenario) return;
    
    setIsRunning(scenario.id);
    try {
      await onRunScenario(scenario);
    } catch (error) {
      console.error("Scenario run failed:", error);
    } finally {
      setIsRunning(null);
    }
  };

  // Filter scenarios based on search and filters
  const filteredScenarios = useMemo(() => {
    let filtered = scenarios;

    // Category filter
    if (activeCategory !== "all") {
      filtered = filtered.filter(s => s.category === activeCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(s => s.difficulty === selectedDifficulty);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort by popularity if enabled
    if (showPopularFirst) {
      filtered = filtered.sort((a, b) => b.popularity - a.popularity);
    }

    return filtered;
  }, [scenarios, activeCategory, selectedDifficulty, searchQuery, showPopularFirst]);

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

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "biology": return "Biyoloji";
      case "physics": return "Fizik";
      case "chemistry": return "Kimya";
      case "mathematics": return "Matematik";
      case "literature": return "Edebiyat";
      case "mixed": return "Karışık";
      default: return category;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Test Senaryoları Kütüphanesi</h2>
            <p className="text-gray-600 mt-1">
              Türkçe akademik içerik için hazır test senaryoları
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {filteredScenarios.length} Senaryo
          </Badge>
          {enableQuickStart && (
            <Button className="bg-green-600 hover:bg-green-700">
              <Zap className="h-4 w-4 mr-2" />
              Hızlı Başlat
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Senaryo ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="grid grid-cols-7">
                  <TabsTrigger value="all" className="text-xs">Tümü</TabsTrigger>
                  <TabsTrigger value="biology" className="text-xs">Biyoloji</TabsTrigger>
                  <TabsTrigger value="physics" className="text-xs">Fizik</TabsTrigger>
                  <TabsTrigger value="chemistry" className="text-xs">Kimya</TabsTrigger>
                  <TabsTrigger value="mathematics" className="text-xs">Matematik</TabsTrigger>
                  <TabsTrigger value="literature" className="text-xs">Edebiyat</TabsTrigger>
                  <TabsTrigger value="mixed" className="text-xs">Karışık</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Tüm Seviyeler</option>
                <option value="beginner">Başlangıç</option>
                <option value="intermediate">Orta</option>
                <option value="advanced">İleri</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredScenarios.map((scenario) => (
          <Card key={scenario.id} className="transition-all hover:shadow-lg border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    {getCategoryIcon(scenario.category)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight">
                      {scenario.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`${getDifficultyColor(scenario.difficulty)} border text-xs`}>
                        {getDifficultyLabel(scenario.difficulty)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(scenario.category)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {scenario.estimatedTime} dk
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < scenario.popularity
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                {scenario.description}
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {scenario.hasVisuals && (
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                    <Image className="h-3 w-3 mr-1" />
                    Görseller
                  </Badge>
                )}
                {scenario.hasReferences && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                    <FileText className="h-3 w-3 mr-1" />
                    Referanslar
                  </Badge>
                )}
                {scenario.hasTables && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Tablolar
                  </Badge>
                )}
                {scenario.turkishOptimized && (
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                    🇹🇷 TR Optimize
                  </Badge>
                )}
              </div>

              {/* Success Criteria */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-800 mb-2">Başarı Kriterleri:</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-green-600">
                      {(scenario.successCriteria.minPreservationRate * 100).toFixed(0)}%
                    </div>
                    <div className="text-gray-600">Min. Koruma</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">
                      {(scenario.successCriteria.minContextCoherence * 100).toFixed(0)}%
                    </div>
                    <div className="text-gray-600">Min. Uyum</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-orange-600">
                      {scenario.successCriteria.maxSeparationDistance}
                    </div>
                    <div className="text-gray-600">Max. Mesafe</div>
                  </div>
                </div>
              </div>

              {/* Expected Challenges */}
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-sm font-medium text-yellow-800 mb-2">Beklenen Zorluklar:</div>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {scenario.expectedChallenges.slice(0, 2).map((challenge, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {challenge}
                    </li>
                  ))}
                  {scenario.expectedChallenges.length > 2 && (
                    <li className="text-yellow-600">
                      +{scenario.expectedChallenges.length - 2} daha...
                    </li>
                  )}
                </ul>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {scenario.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs bg-gray-50">
                    #{tag}
                  </Badge>
                ))}
                {scenario.tags.length > 4 && (
                  <Badge variant="outline" className="text-xs bg-gray-50">
                    +{scenario.tags.length - 4}
                  </Badge>
                )}
              </div>

              {/* Content Preview */}
              {showPreview === scenario.id && (
                <div className="bg-blue-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="text-sm font-medium text-blue-800 mb-2">İçerik Önizleme:</div>
                  <pre className="text-xs whitespace-pre-wrap text-blue-700 leading-relaxed">
                    {scenario.content.substring(0, 800)}
                    {scenario.content.length > 800 && "..."}
                  </pre>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  onClick={() => runScenario(scenario)}
                  disabled={isRunning === scenario.id}
                  className="flex-1"
                  size="sm"
                >
                  {isRunning === scenario.id ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Çalışıyor...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Testi Başlat
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(
                    showPreview === scenario.id ? null : scenario.id
                  )}
                >
                  {showPreview === scenario.id ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Gizle
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Önizle
                    </>
                  )}
                </Button>
                {onPreviewScenario && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPreviewScenario(scenario)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredScenarios.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Senaryo Bulunamadı
            </h3>
            <p className="text-gray-500 mb-4">
              Arama kriterlerinize uygun senaryo bulunamadı. Filtreleri değiştirmeyi deneyin.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
                setSelectedDifficulty("all");
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Filtreleri Temizle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {scenarios.length}
              </div>
              <div className="text-sm text-gray-600">Toplam Senaryo</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {scenarios.filter(s => s.turkishOptimized).length}
              </div>
              <div className="text-sm text-gray-600">TR Optimize</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {scenarios.filter(s => s.hasVisuals).length}
              </div>
              <div className="text-sm text-gray-600">Görsel İçerikli</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(scenarios.reduce((sum, s) => sum + s.estimatedTime, 0) / scenarios.length)}
              </div>
              <div className="text-sm text-gray-600">Ort. Süre (dk)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestScenarioLibrary;