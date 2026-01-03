"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen,
  Target,
  Lightbulb,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Star,
  Zap,
  Brain,
  Eye,
  Settings,
  BarChart3,
  Clock,
  Users,
  Globe,
  Layers,
  RefreshCw,
  Download,
  Copy,
  Play,
  Pause,
  SkipForward,
  ChevronRight,
  ChevronDown,
  Info,
  HelpCircle,
  Bookmark,
  Share2,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Maximize2,
  Minimize2,
  ExternalLink,
  FileText,
  Video,
  Link,
  Code,
  Database,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Shield,
  Lock,
  Unlock,
  Key,
  Fingerprint,
  Microscope,
  Calculator,
  Beaker,
  Hash,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
} from "lucide-react";

// Best practices data structures
interface BestPractice {
  id: string;
  title: string;
  category: "strategy" | "performance" | "quality" | "troubleshooting" | "advanced";
  difficulty: "beginner" | "intermediate" | "advanced";
  description: string;
  problem: string;
  solution: string;
  example?: PracticeExample;
  metrics?: PracticeMetrics;
  tips: string[];
  warnings?: string[];
  relatedPractices?: string[];
  tags: string[];
  popularity: number; // 1-5 stars
  effectiveness: number; // 1-5 stars
  lastUpdated: string;
}

interface PracticeExample {
  title: string;
  before: {
    description: string;
    code?: string;
    metrics?: Record<string, number>;
  };
  after: {
    description: string;
    code?: string;
    metrics?: Record<string, number>;
  };
  improvement: string;
}

interface PracticeMetrics {
  performanceGain?: string;
  qualityImprovement?: string;
  timeReduction?: string;
  errorReduction?: string;
}

interface UseCase {
  id: string;
  title: string;
  description: string;
  scenario: string;
  challenges: string[];
  solutions: string[];
  bestPractices: string[];
  results: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  domain: "biology" | "physics" | "chemistry" | "mathematics" | "literature" | "general";
}

interface OptimizationTip {
  id: string;
  category: "speed" | "quality" | "memory" | "accuracy";
  title: string;
  description: string;
  implementation: string;
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
  prerequisites?: string[];
}

interface BestPracticesGuideProps {
  onPracticeSelect?: (practiceId: string) => void;
  onApplyPractice?: (practiceId: string, settings: any) => void;
  selectedCategory?: string;
  showFilters?: boolean;
  enableBookmarks?: boolean;
}

const BestPracticesGuide: React.FC<BestPracticesGuideProps> = ({
  onPracticeSelect,
  onApplyPractice,
  selectedCategory = "all",
  showFilters = true,
  enableBookmarks = true
}) => {
  const [activeTab, setActiveTab] = useState("practices");
  const [selectedPractice, setSelectedPractice] = useState<BestPractice | null>(null);
  const [filterCategory, setFilterCategory] = useState(selectedCategory);
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [bookmarkedPractices, setBookmarkedPractices] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Comprehensive best practices for Turkish chunking
  const bestPractices: BestPractice[] = [
    {
      id: "turkish_sentence_boundaries",
      title: "Türkçe Cümle Sınırlarını Doğru Belirleme",
      category: "strategy",
      difficulty: "beginner",
      description: "Türkçe'nin karmaşık cümle yapıları için doğru sınır belirleme teknikleri",
      problem: "Türkçe metinlerde uzun ve karmaşık cümle yapıları nedeniyle chunk sınırları yanlış belirleniyor",
      solution: "Türkçe'ye özgü noktalama kuralları ve bağlaç yapılarını dikkate alan gelişmiş sınır belirleme",
      example: {
        title: "Karmaşık Türkçe Cümle Chunking",
        before: {
          description: "Yanlış chunking - cümle ortasında kesilme",
          code: `Chunk 1: "E. coli bakterisi, enterobakteri familyasına ait gram-negatif bir"
Chunk 2: "bakteridir ve Şekil 2.1'de görüldüğü gibi çubuk şeklindedir."`,
          metrics: { coherence: 0.3, reference_preservation: 0.2 }
        },
        after: {
          description: "Doğru chunking - anlam bütünlüğü korunmuş",
          code: `Chunk 1: "E. coli bakterisi, enterobakteri familyasına ait gram-negatif bir bakteridir."
Chunk 2: "Şekil 2.1'de görüldüğü gibi çubuk şeklindedir ve hızla çoğalabilir."`,
          metrics: { coherence: 0.9, reference_preservation: 0.95 }
        },
        improvement: "Anlam tutarlılığı %200 artış, referans korunumu %375 artış"
      },
      metrics: {
        performanceGain: "15-25%",
        qualityImprovement: "40-60%",
        errorReduction: "70%"
      },
      tips: [
        "Türkçe bağlaçları (ve, ama, fakat, ancak) chunk sınırı belirleyicisi olarak kullanın",
        "Uzun cümlelerde yan cümle yapılarını tespit edin",
        "Noktalama işaretlerini (virgül, noktalı virgül) dikkate alın",
        "Şekil/tablo referanslarını aynı chunk'ta tutun"
      ],
      warnings: [
        "Çok kısa chunk'lar anlam kaybına neden olabilir",
        "Referans cümleleri asla bölmeyin"
      ],
      relatedPractices: ["reference_preservation", "semantic_coherence"],
      tags: ["türkçe", "cümle", "sınır", "bağlaç", "noktalama"],
      popularity: 5,
      effectiveness: 4,
      lastUpdated: "2024-01-15"
    },
    {
      id: "reference_preservation",
      title: "Şekil ve Tablo Referanslarını Koruma",
      category: "quality",
      difficulty: "intermediate",
      description: "Akademik metinlerdeki şekil ve tablo referanslarının chunk'lar arası korunması",
      problem: "Şekil 2.1, Tablo 3.2 gibi referanslar chunk'lar arasında kaybolarak anlam bütünlüğü bozuluyor",
      solution: "Referans tespit algoritması ile referans-açıklama çiftlerinin aynı chunk'ta tutulması",
      example: {
        title: "Referans Korunumu Örneği",
        before: {
          description: "Referans ve açıklama farklı chunk'larda",
          code: `Chunk 1: "Bakterinin yapısı karmaşıktır. Şekil 2.1'de"
Chunk 2: "görüldüğü gibi hücre duvarı kalındır."`,
          metrics: { reference_integrity: 0.1, user_comprehension: 0.4 }
        },
        after: {
          description: "Referans ve açıklama aynı chunk'ta",
          code: `Chunk 1: "Bakterinin yapısı karmaşıktır."
Chunk 2: "Şekil 2.1'de görüldüğü gibi hücre duvarı kalındır ve koruma sağlar."`,
          metrics: { reference_integrity: 0.95, user_comprehension: 0.9 }
        },
        improvement: "Referans bütünlüğü %850 artış, kullanıcı anlayışı %125 artış"
      },
      tips: [
        "Şekil/Tablo referanslarını regex ile tespit edin",
        "Referans cümlesini bir sonraki cümle ile birleştirin",
        "Çok uzun açıklamalar için referansı chunk başına alın",
        "Referans numaralarını chunk metadata'sında saklayın"
      ],
      warnings: [
        "Çok uzun referans açıklamaları chunk boyutunu aşabilir",
        "Birden fazla referans içeren cümleler dikkatli işlenmeli"
      ],
      tags: ["referans", "şekil", "tablo", "akademik", "bütünlük"],
      popularity: 5,
      effectiveness: 5,
      lastUpdated: "2024-01-20"
    },
    {
      id: "semantic_coherence",
      title: "Semantik Tutarlılık Optimizasyonu",
      category: "quality",
      difficulty: "advanced",
      description: "Chunk'lar arası anlam tutarlılığını maksimize etme teknikleri",
      problem: "Chunk'lar arasında anlam kopuklukları oluşuyor, bağlam kaybı yaşanıyor",
      solution: "Semantik benzerlik analizi ile chunk sınırlarının optimize edilmesi",
      example: {
        title: "Semantik Tutarlılık Örneği",
        before: {
          description: "Anlam kopukluğu olan chunking",
          code: `Chunk 1: "E. coli gram-negatif bakteridir. Hızla çoğalır."
Chunk 2: "Fotosentez yapamaz. Oksijen gerektirir. Şeker metabolizması vardır."`,
          metrics: { semantic_coherence: 0.4, topic_consistency: 0.3 }
        },
        after: {
          description: "Semantik olarak tutarlı chunking",
          code: `Chunk 1: "E. coli gram-negatif bakteridir ve hızla çoğalır."
Chunk 2: "Fotosentez yapamayan bu bakteri, oksijen gerektirir ve şeker metabolizması vardır."`,
          metrics: { semantic_coherence: 0.85, topic_consistency: 0.9 }
        },
        improvement: "Semantik tutarlılık %112 artış, konu tutarlılığı %200 artış"
      },
      tips: [
        "Cümle embeddings'lerini karşılaştırın",
        "Konu geçişlerini tespit edin",
        "Benzer kavramları aynı chunk'ta tutun",
        "Bağlam kelimelerini analiz edin"
      ],
      tags: ["semantik", "tutarlılık", "embedding", "bağlam", "konu"],
      popularity: 4,
      effectiveness: 5,
      lastUpdated: "2024-01-18"
    },
    {
      id: "performance_optimization",
      title: "Performans Optimizasyonu",
      category: "performance",
      difficulty: "intermediate",
      description: "Chunking işleminin hız ve kaynak kullanımını optimize etme",
      problem: "Büyük metinlerde chunking işlemi çok yavaş, bellek kullanımı yüksek",
      solution: "Paralel işleme, önbellekleme ve akıllı algoritma seçimi",
      example: {
        title: "Performans İyileştirmesi",
        before: {
          description: "Sıralı işleme, önbellek yok",
          code: `İşleme süresi: 45 saniye
Bellek kullanımı: 2.1 GB
CPU kullanımı: %25`,
          metrics: { processing_time: 45, memory_usage: 2.1, cpu_usage: 25 }
        },
        after: {
          description: "Paralel işleme, önbellekli",
          code: `İşleme süresi: 12 saniye
Bellek kullanımı: 0.8 GB
CPU kullanımı: %65`,
          metrics: { processing_time: 12, memory_usage: 0.8, cpu_usage: 65 }
        },
        improvement: "Hız %275 artış, bellek %62 azalış, CPU verimli kullanım"
      },
      tips: [
        "Büyük metinleri parçalara bölün",
        "Sık kullanılan sonuçları önbellekleyin",
        "Paralel işleme kullanın",
        "Gereksiz hesaplamaları önleyin"
      ],
      tags: ["performans", "hız", "bellek", "paralel", "önbellek"],
      popularity: 4,
      effectiveness: 4,
      lastUpdated: "2024-01-22"
    },
    {
      id: "error_handling",
      title: "Hata Yönetimi ve Kurtarma",
      category: "troubleshooting",
      difficulty: "intermediate",
      description: "Chunking hatalarını tespit etme ve otomatik düzeltme",
      problem: "Chunking hataları tespit edilemiyor, sistem çöküyor",
      solution: "Kapsamlı hata tespit ve otomatik kurtarma mekanizmaları",
      tips: [
        "Chunk boyutlarını sürekli kontrol edin",
        "Boş chunk'ları tespit edin",
        "Encoding hatalarını yakalayın",
        "Fallback stratejileri hazırlayın"
      ],
      tags: ["hata", "kurtarma", "tespit", "fallback", "güvenlik"],
      popularity: 3,
      effectiveness: 4,
      lastUpdated: "2024-01-19"
    },
    {
      id: "multilingual_support",
      title: "Çok Dilli Destek",
      category: "advanced",
      difficulty: "advanced",
      description: "Türkçe-İngilizce karışık metinler için chunking",
      problem: "Karışık dilli metinlerde chunking kalitesi düşük",
      solution: "Dil tespit ve dile özgü chunking stratejileri",
      tips: [
        "Dil geçişlerini tespit edin",
        "Her dil için farklı strateji kullanın",
        "Teknik terimleri koruyun",
        "Çeviri referanslarını takip edin"
      ],
      tags: ["çokdilli", "türkçe", "ingilizce", "karışık", "dil"],
      popularity: 3,
      effectiveness: 4,
      lastUpdated: "2024-01-21"
    }
  ];

  // Use cases for different domains
  const useCases: UseCase[] = [
    {
      id: "biology_textbook",
      title: "Biyoloji Ders Kitabı Chunking",
      description: "Şekil ve tablo yoğun biyoloji ders kitaplarının chunking'i",
      scenario: "9. sınıf biyoloji kitabında E. coli konusu işleniyor. Metin içinde 15 şekil, 8 tablo ve çok sayıda referans var.",
      challenges: [
        "Şekil referanslarının korunması",
        "Tablo verilerinin bütünlüğü",
        "Karmaşık biyoloji terimlerinin ayrılmaması",
        "Uzun açıklama paragraflarının bölünmesi"
      ],
      solutions: [
        "Referans korunumu algoritması kullanımı",
        "Tablo sınırlarının tespit edilmesi",
        "Terim sözlüğü ile korumalı kelime listesi",
        "Paragraf yapısına dayalı chunking"
      ],
      bestPractices: ["reference_preservation", "turkish_sentence_boundaries", "semantic_coherence"],
      results: [
        "Referans korunumu %95 başarı",
        "Öğrenci anlayışı %40 artış",
        "Chunk kalitesi 4.2/5 puan"
      ],
      difficulty: "intermediate",
      domain: "biology"
    },
    {
      id: "physics_research",
      title: "Fizik Araştırma Makalesi",
      description: "Formül yoğun fizik araştırma makalelerinin chunking'i",
      scenario: "Newton yasaları üzerine araştırma makalesi. Çok sayıda matematiksel formül, grafik ve deneysel veri içeriyor.",
      challenges: [
        "Matematiksel formüllerin korunması",
        "Grafik açıklamalarının bütünlüğü",
        "Deneysel veri tablolarının chunking'i",
        "Referans listesinin yönetimi"
      ],
      solutions: [
        "LaTeX formül tespit algoritması",
        "Grafik-açıklama eşleştirmesi",
        "Veri tablosu sınır belirleme",
        "Akademik referans formatı tanıma"
      ],
      bestPractices: ["reference_preservation", "semantic_coherence", "performance_optimization"],
      results: [
        "Formül bütünlüğü %98 korundu",
        "Araştırmacı memnuniyeti %85",
        "İşleme hızı 3x artış"
      ],
      difficulty: "advanced",
      domain: "physics"
    },
    {
      id: "literature_analysis",
      title: "Edebiyat Analizi Metni",
      description: "Türk şiiri analiz metinlerinin chunking'i",
      scenario: "Nazim Hikmet şiirlerinin analizi. Şiir alıntıları, yorumlar ve eleştiri metinleri içeriyor.",
      challenges: [
        "Şiir alıntılarının korunması",
        "Yorum-alıntı ilişkisinin sağlanması",
        "Edebi terimlerin ayrılmaması",
        "Duygusal bağlamın korunması"
      ],
      solutions: [
        "Şiir formatı tanıma algoritması",
        "Alıntı-yorum eşleştirmesi",
        "Edebi terim sözlüğü",
        "Duygusal analiz entegrasyonu"
      ],
      bestPractices: ["turkish_sentence_boundaries", "semantic_coherence"],
      results: [
        "Şiir bütünlüğü %92 korundu",
        "Analiz kalitesi %35 artış",
        "Okuyucu memnuniyeti 4.1/5"
      ],
      difficulty: "intermediate",
      domain: "literature"
    }
  ];

  // Optimization tips
  const optimizationTips: OptimizationTip[] = [
    {
      id: "chunk_size_optimization",
      category: "quality",
      title: "Optimal Chunk Boyutu Belirleme",
      description: "İçerik türüne göre en uygun chunk boyutunu belirleme",
      implementation: "A/B test ile farklı boyutları karşılaştırın, domain-specific optimizasyon yapın",
      impact: "high",
      effort: "medium",
      prerequisites: ["Temel chunking bilgisi", "Test ortamı"]
    },
    {
      id: "caching_strategy",
      category: "speed",
      title: "Akıllı Önbellekleme",
      description: "Sık kullanılan chunk'ları önbellekleyerek hız artırma",
      implementation: "LRU cache kullanın, chunk fingerprint'leri oluşturun",
      impact: "high",
      effort: "low",
      prerequisites: ["Redis/Memcached bilgisi"]
    },
    {
      id: "parallel_processing",
      category: "speed",
      title: "Paralel İşleme",
      description: "Büyük metinleri paralel olarak işleyerek hız artırma",
      implementation: "Thread pool kullanın, chunk'ları bağımsız işleyin",
      impact: "high",
      effort: "high",
      prerequisites: ["Paralel programlama bilgisi", "Thread safety"]
    },
    {
      id: "memory_optimization",
      category: "memory",
      title: "Bellek Optimizasyonu",
      description: "Bellek kullanımını minimize etme teknikleri",
      implementation: "Streaming processing, garbage collection tuning",
      impact: "medium",
      effort: "medium"
    }
  ];

  // Filter and search functions
  const filteredPractices = bestPractices.filter(practice => {
    const matchesCategory = filterCategory === "all" || practice.category === filterCategory;
    const matchesDifficulty = filterDifficulty === "all" || practice.difficulty === filterDifficulty;
    const matchesSearch = searchQuery === "" || 
      practice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      practice.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      practice.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const sortedPractices = [...filteredPractices].sort((a, b) => {
    switch (sortBy) {
      case "popularity":
        return b.popularity - a.popularity;
      case "effectiveness":
        return b.effectiveness - a.effectiveness;
      case "title":
        return a.title.localeCompare(b.title);
      case "difficulty":
        const difficultyOrder = { "beginner": 1, "intermediate": 2, "advanced": 3 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      default:
        return 0;
    }
  });

  const handlePracticeClick = (practice: BestPractice) => {
    setSelectedPractice(practice);
    if (onPracticeSelect) {
      onPracticeSelect(practice.id);
    }
  };

  const handleBookmark = (practiceId: string) => {
    const newBookmarks = new Set(bookmarkedPractices);
    if (newBookmarks.has(practiceId)) {
      newBookmarks.delete(practiceId);
    } else {
      newBookmarks.add(practiceId);
    }
    setBookmarkedPractices(newBookmarks);
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "strategy": return <Target className="h-4 w-4" />;
      case "performance": return <Zap className="h-4 w-4" />;
      case "quality": return <MemoryStick className="h-4 w-4" />;
      case "troubleshooting": return <AlertTriangle className="h-4 w-4" />;
      case "advanced": return <Brain className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-3 w-3 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-4">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          En İyi Uygulamalar Rehberi
        </h1>
        <p className="text-gray-600">
          Chunking kalitesini artırmak için kanıtlanmış stratejiler ve optimizasyon teknikleri
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="practices" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            En İyi Uygulamalar
          </TabsTrigger>
          <TabsTrigger value="usecases" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Kullanım Senaryoları
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Optimizasyon İpuçları
          </TabsTrigger>
          <TabsTrigger value="troubleshooting" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Sorun Giderme
          </TabsTrigger>
        </TabsList>

        {/* Best Practices Tab */}
        <TabsContent value="practices" className="space-y-6">
          {/* Filters */}
          {showFilters && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Filtreler:</span>
                  </div>
                  
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="all">Tüm Kategoriler</option>
                    <option value="strategy">Strateji</option>
                    <option value="performance">Performans</option>
                    <option value="quality">Kalite</option>
                    <option value="troubleshooting">Sorun Giderme</option>
                    <option value="advanced">Gelişmiş</option>
                  </select>

                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="all">Tüm Seviyeler</option>
                    <option value="beginner">Başlangıç</option>
                    <option value="intermediate">Orta</option>
                    <option value="advanced">İleri</option>
                  </select>

                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-600" />
                    <Input
                      placeholder="Ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-48"
                    />
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="popularity">Popülerlik</option>
                    <option value="effectiveness">Etkililik</option>
                    <option value="title">Başlık</option>
                    <option value="difficulty">Zorluk</option>
                  </select>

                  <div className="flex items-center gap-1 ml-auto">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Practices Grid/List */}
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {sortedPractices.map((practice) => (
              <Card 
                key={practice.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedPractice?.id === practice.id ? "ring-2 ring-blue-500" : ""
                } ${viewMode === "list" ? "flex" : ""}`}
                onClick={() => handlePracticeClick(practice)}
              >
                <CardHeader className={viewMode === "list" ? "flex-shrink-0 w-1/3" : ""}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(practice.category)}
                      <Badge variant="outline" className={getDifficultyColor(practice.difficulty)}>
                        {practice.difficulty}
                      </Badge>
                    </div>
                    {enableBookmarks && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookmark(practice.id);
                        }}
                      >
                        <Bookmark 
                          className={`h-4 w-4 ${
                            bookmarkedPractices.has(practice.id) ? "fill-yellow-400 text-yellow-400" : ""
                          }`} 
                        />
                      </Button>
                    )}
                  </div>
                  <CardTitle className="text-lg">{practice.title}</CardTitle>
                  <p className="text-sm text-gray-600">{practice.description}</p>
                </CardHeader>
                <CardContent className={viewMode === "list" ? "flex-1" : ""}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-600">Popülerlik:</span>
                          {renderStarRating(practice.popularity)}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-600">Etkililik:</span>
                          {renderStarRating(practice.effectiveness)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {practice.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {practice.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{practice.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    {practice.metrics && (
                      <div className="text-xs text-green-600 font-medium">
                        {practice.metrics.performanceGain && `Performans: +${practice.metrics.performanceGain}`}
                        {practice.metrics.qualityImprovement && ` | Kalite: +${practice.metrics.qualityImprovement}`}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Practice Detail */}
          {selectedPractice && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedPractice.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getDifficultyColor(selectedPractice.difficulty)}>
                        {selectedPractice.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        {getCategoryIcon(selectedPractice.category)}
                        <span className="ml-1">{selectedPractice.category}</span>
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedPractice(null)}
                    variant="ghost"
                    size="sm"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Problem & Solution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <h4 className="font-medium text-red-900">Problem</h4>
                    </div>
                    <p className="text-sm text-red-800">{selectedPractice.problem}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium text-green-900">Çözüm</h4>
                    </div>
                    <p className="text-sm text-green-800">{selectedPractice.solution}</p>
                  </div>
                </div>

                {/* Example */}
                {selectedPractice.example && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Code className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium text-blue-900">{selectedPractice.example.title}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded border p-3">
                        <div className="font-medium text-sm text-red-700 mb-2">Önce</div>
                        <div className="text-xs text-gray-600 mb-2">{selectedPractice.example.before.description}</div>
                        {selectedPractice.example.before.code && (
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {selectedPractice.example.before.code}
                          </pre>
                        )}
                      </div>
                      <div className="bg-white rounded border p-3">
                        <div className="font-medium text-sm text-green-700 mb-2">Sonra</div>
                        <div className="text-xs text-gray-600 mb-2">{selectedPractice.example.after.description}</div>
                        {selectedPractice.example.after.code && (
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {selectedPractice.example.after.code}
                          </pre>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-yellow-100 rounded text-sm text-yellow-800 font-medium">
                      <TrendingUp className="h-4 w-4 inline mr-1" />
                      {selectedPractice.example.improvement}
                    </div>
                  </div>
                )}

                {/* Tips */}
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium text-green-900">İpuçları</h4>
                  </div>
                  <ul className="space-y-2">
                    {selectedPractice.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                        <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Warnings */}
                {selectedPractice.warnings && selectedPractice.warnings.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <h4 className="font-medium text-yellow-900">Dikkat Edilecekler</h4>
                    </div>
                    <ul className="space-y-2">
                      {selectedPractice.warnings.map((warning, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-yellow-800">
                          <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      if (onApplyPractice) {
                        onApplyPractice(selectedPractice.id, {});
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Uygula
                  </Button>
                  <Button variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Kopyala
                  </Button>
                  <Button variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Paylaş
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Use Cases Tab */}
        <TabsContent value="usecases" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {useCases.map((useCase) => (
              <Card key={useCase.id} className="h-fit">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{useCase.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{useCase.description}</p>
                    </div>
                    <Badge className={getDifficultyColor(useCase.difficulty)}>
                      {useCase.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="font-medium text-blue-900 mb-2">Senaryo</h4>
                    <p className="text-sm text-blue-800">{useCase.scenario}</p>
                  </div>

                  <div 
                    className="cursor-pointer"
                    onClick={() => toggleSection(`challenges_${useCase.id}`)}
                  >
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <h4 className="font-medium text-gray-900">Zorluklar</h4>
                      {expandedSections.has(`challenges_${useCase.id}`) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                    {expandedSections.has(`challenges_${useCase.id}`) && (
                      <ul className="mt-2 space-y-1">
                        {useCase.challenges.map((challenge, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <AlertTriangle className="h-3 w-3 mt-0.5 text-red-500 flex-shrink-0" />
                            {challenge}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div 
                    className="cursor-pointer"
                    onClick={() => toggleSection(`solutions_${useCase.id}`)}
                  >
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <h4 className="font-medium text-gray-900">Çözümler</h4>
                      {expandedSections.has(`solutions_${useCase.id}`) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                    {expandedSections.has(`solutions_${useCase.id}`) && (
                      <ul className="mt-2 space-y-1">
                        {useCase.solutions.map((solution, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                            {solution}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="font-medium text-green-900 mb-2">Sonuçlar</h4>
                    <ul className="space-y-1">
                      {useCase.results.map((result, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                          <TrendingUp className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {result}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Optimization Tips Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {optimizationTips.map((tip) => (
              <Card key={tip.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{tip.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                    </div>
                    <Badge variant="outline">
                      {tip.category === "speed" && <Zap className="h-3 w-3 mr-1" />}
                      {tip.category === "quality" && <Star className="h-3 w-3 mr-1" />}
                      {tip.category === "memory" && <MemoryStick className="h-3 w-3 mr-1" />}
                      {tip.category === "accuracy" && <Target className="h-3 w-3 mr-1" />}
                      {tip.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="font-medium text-blue-900 mb-2">Uygulama</h4>
                    <p className="text-sm text-blue-800">{tip.implementation}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-600">Etki</div>
                        <Badge 
                          className={
                            tip.impact === "high" ? "bg-green-100 text-green-800" :
                            tip.impact === "medium" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {tip.impact}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-600">Çaba</div>
                        <Badge 
                          className={
                            tip.effort === "low" ? "bg-green-100 text-green-800" :
                            tip.effort === "medium" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }
                        >
                          {tip.effort}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {tip.prerequisites && tip.prerequisites.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <h4 className="font-medium text-yellow-900 mb-2">Ön Koşullar</h4>
                      <ul className="space-y-1">
                        {tip.prerequisites.map((prereq, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-yellow-800">
                            <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {prereq}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Troubleshooting Tab */}
        <TabsContent value="troubleshooting" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Yaygın Sorunlar ve Çözümleri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    problem: "Chunk'lar çok küçük veya çok büyük",
                    symptoms: ["Anlam kaybı", "Performans sorunları", "Bellek aşımı"],
                    solutions: ["Chunk boyut parametrelerini ayarlayın", "İçerik türüne göre optimize edin", "A/B test yapın"],
                    prevention: "Dinamik boyut ayarlama kullanın"
                  },
                  {
                    problem: "Referanslar kayboldu",
                    symptoms: ["Şekil/tablo referansları kopuk", "Anlam bütünlüğü bozuk", "Kullanıcı şikayetleri"],
                    solutions: ["Referans korunumu algoritması aktifleştirin", "Chunk sınırlarını kontrol edin", "Manuel düzeltme yapın"],
                    prevention: "Referans tespit sistemini kullanın"
                  },
                  {
                    problem: "İşleme çok yavaş",
                    symptoms: ["Uzun bekleme süreleri", "Timeout hataları", "Sistem donması"],
                    solutions: ["Paralel işleme aktifleştirin", "Önbellekleme kullanın", "Algoritma optimize edin"],
                    prevention: "Performans izleme sistemi kurun"
                  }
                ].map((issue, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="font-medium text-red-900 mb-2">{issue.problem}</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Belirtiler:</div>
                        <ul className="space-y-1">
                          {issue.symptoms.map((symptom, sidx) => (
                            <li key={sidx} className="flex items-start gap-1">
                              <XCircle className="h-3 w-3 mt-0.5 text-red-500 flex-shrink-0" />
                              <span className="text-gray-600">{symptom}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Çözümler:</div>
                        <ul className="space-y-1">
                          {issue.solutions.map((solution, sidx) => (
                            <li key={sidx} className="flex items-start gap-1">
                              <CheckCircle className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                              <span className="text-gray-600">{solution}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Önleme:</div>
                        <div className="flex items-start gap-1">
                          <Shield className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                          <span className="text-gray-600">{issue.prevention}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BestPracticesGuide;