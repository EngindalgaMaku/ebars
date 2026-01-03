"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Play, 
  Pause,
  SkipForward,
  SkipBack,
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Target,
  Award,
  Clock,
  Users,
  Brain,
  Zap,
  Eye,
  Settings,
  HelpCircle,
  Star,
  TrendingUp,
  BarChart3,
  FileText,
  Image,
  Layers,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Info
} from "lucide-react";

// Tutorial step interfaces
interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: string;
  type: "introduction" | "concept" | "demo" | "practice" | "assessment" | "summary";
  duration: number; // in minutes
  interactive: boolean;
  hasDemo: boolean;
  hasQuiz: boolean;
  prerequisites?: string[];
  learningObjectives: string[];
  keyPoints: string[];
  tips?: string[];
  commonMistakes?: string[];
  resources?: {
    type: "video" | "document" | "example" | "tool";
    title: string;
    url?: string;
    description: string;
  }[];
}

interface TutorialModule {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: number;
  steps: TutorialStep[];
  category: "basics" | "advanced" | "optimization" | "troubleshooting";
  prerequisites?: string[];
  learningOutcomes: string[];
}

interface InteractiveTutorialProps {
  onStepComplete?: (stepId: string, moduleId: string) => void;
  onModuleComplete?: (moduleId: string) => void;
  userProgress?: Record<string, string[]>; // moduleId -> completed stepIds
  enableAutoProgress?: boolean;
  showProgress?: boolean;
}

const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  onStepComplete,
  onModuleComplete,
  userProgress = {},
  enableAutoProgress = false,
  showProgress = true
}) => {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [showHints, setShowHints] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Tutorial modules with comprehensive Turkish content
  const tutorialModules: TutorialModule[] = [
    {
      id: "chunking_basics",
      title: "Chunking Temelleri",
      description: "Metin chunking'in temel kavramları ve önemi",
      difficulty: "beginner",
      estimatedTime: 15,
      category: "basics",
      learningOutcomes: [
        "Chunking kavramını anlama",
        "Farklı chunking stratejilerini tanıma",
        "Chunk boyutunun önemini kavrama",
        "Türkçe metinler için özel durumları bilme"
      ],
      steps: [
        {
          id: "intro_chunking",
          title: "Chunking Nedir?",
          description: "Metin chunking'in temel tanımı ve amacı",
          content: `# Metin Chunking Nedir?

Metin chunking, büyük metinleri daha küçük, anlamlı parçalara bölme işlemidir. Bu süreç, özellikle RAG (Retrieval-Augmented Generation) sistemlerinde kritik öneme sahiptir.

## Neden Chunking Gerekli?

1. **Bellek Sınırlamaları**: LLM'ler sınırlı context window'a sahiptir
2. **Arama Verimliliği**: Küçük parçalar daha hızlı aranabilir
3. **Anlam Bütünlüğü**: İlgili bilgiler bir arada tutulur
4. **Performans Optimizasyonu**: Daha hızlı işleme sağlar

## Türkçe Metinler İçin Özel Durumlar

- **Ek yapısı**: Türkçe'nin agglütinative yapısı
- **Uzun cümleler**: Türkçe'de yaygın olan karmaşık cümle yapıları
- **Bağlaçlar**: "ve", "ile", "ancak" gibi bağlaçların chunk sınırlarındaki rolü`,
          type: "introduction",
          duration: 3,
          interactive: false,
          hasDemo: false,
          hasQuiz: false,
          learningObjectives: [
            "Chunking kavramını tanımlayabilme",
            "Chunking'in neden gerekli olduğunu açıklayabilme",
            "Türkçe metinler için özel durumları bilme"
          ],
          keyPoints: [
            "Chunking, büyük metinleri küçük parçalara bölme işlemidir",
            "RAG sistemlerinde kritik öneme sahiptir",
            "Türkçe metinler için özel yaklaşımlar gerekir"
          ],
          tips: [
            "Chunk boyutunu içeriğin türüne göre ayarlayın",
            "Türkçe metinlerde cümle sınırlarına dikkat edin"
          ]
        },
        {
          id: "chunking_strategies",
          title: "Chunking Stratejileri",
          description: "Farklı chunking yaklaşımları ve kullanım alanları",
          content: `# Chunking Stratejileri

## 1. Sabit Boyut Chunking
- **Avantajlar**: Basit, öngörülebilir
- **Dezavantajlar**: Anlam bütünlüğünü bozabilir
- **Kullanım**: Homojen içerikler için uygun

## 2. Cümle Bazlı Chunking
- **Avantajlar**: Anlam bütünlüğü korunur
- **Dezavantajlar**: Değişken boyutlar
- **Kullanım**: Genel metinler için ideal

## 3. Paragraf Bazlı Chunking
- **Avantajlar**: Konu bütünlüğü
- **Dezavantajlar**: Çok büyük parçalar olabilir
- **Kullanım**: Akademik metinler için uygun

## 4. Semantik Chunking
- **Avantajlar**: En iyi anlam korunması
- **Dezavantajlar**: Karmaşık, yavaş
- **Kullanım**: Yüksek kalite gereken durumlar

## Türkçe İçin Öneriler
- Cümle sınırlarını dikkate alın
- Bağlaçları chunk başında bırakmayın
- Uzun cümleleri alt parçalara bölün`,
          type: "concept",
          duration: 5,
          interactive: true,
          hasDemo: true,
          hasQuiz: true,
          learningObjectives: [
            "Farklı chunking stratejilerini karşılaştırabilme",
            "Her stratejinin avantaj/dezavantajlarını bilme",
            "Türkçe metinler için uygun strateji seçebilme"
          ],
          keyPoints: [
            "4 ana chunking stratejisi vardır",
            "Her stratejinin kendine özgü avantajları vardır",
            "Türkçe metinler için özel yaklaşımlar gerekir"
          ],
          resources: [
            {
              type: "example",
              title: "Chunking Stratejileri Karşılaştırması",
              description: "Aynı metin üzerinde farklı stratejilerin uygulanması"
            }
          ]
        },
        {
          id: "chunk_size_optimization",
          title: "Chunk Boyutu Optimizasyonu",
          description: "Optimal chunk boyutunu belirleme yöntemleri",
          content: `# Chunk Boyutu Optimizasyonu

## Boyut Belirleme Faktörleri

### 1. İçerik Türü
- **Akademik metinler**: 300-500 token
- **Haber metinleri**: 200-300 token  
- **Teknik dokümantasyon**: 400-600 token
- **Sohbet metinleri**: 100-200 token

### 2. Model Gereksinimleri
- **Embedding modeli**: Token limiti
- **LLM context window**: Maksimum boyut
- **Arama performansı**: Hız vs kalite dengesi

### 3. Türkçe Özel Durumlar
- **Ortalama kelime uzunluğu**: Türkçe kelimeleri daha uzun
- **Cümle yapısı**: Karmaşık cümle yapıları
- **Ek sistem**: Agglütinative yapı

## Optimizasyon Teknikleri

### A. Dinamik Boyutlandırma
\`\`\`python
def dynamic_chunk_size(content_type, complexity):
    base_size = 300
    if content_type == "academic":
        base_size *= 1.5
    if complexity == "high":
        base_size *= 1.2
    return int(base_size)
\`\`\`

### B. Overlap Stratejisi
- **Minimum overlap**: %10-15
- **Optimal overlap**: %20-25
- **Maksimum overlap**: %30

### C. Kalite Metrikleri
- **Semantic coherence**: Anlam bütünlüğü
- **Information density**: Bilgi yoğunluğu
- **Retrieval accuracy**: Arama doğruluğu`,
          type: "concept",
          duration: 7,
          interactive: true,
          hasDemo: true,
          hasQuiz: true,
          learningObjectives: [
            "Optimal chunk boyutunu hesaplayabilme",
            "İçerik türüne göre boyut ayarlayabilme",
            "Overlap stratejilerini uygulayabilme"
          ],
          keyPoints: [
            "Chunk boyutu içerik türüne göre değişir",
            "Türkçe metinler için özel hesaplamalar gerekir",
            "Overlap stratejisi kaliteyi artırır"
          ],
          commonMistakes: [
            "Çok küçük chunk'lar: Bağlam kaybı",
            "Çok büyük chunk'lar: Arama verimsizliği",
            "Overlap ihmal etme: Bilgi kaybı"
          ]
        }
      ]
    },
    {
      id: "advanced_techniques",
      title: "İleri Seviye Teknikler",
      description: "Gelişmiş chunking teknikleri ve optimizasyon yöntemleri",
      difficulty: "advanced",
      estimatedTime: 25,
      category: "advanced",
      prerequisites: ["chunking_basics"],
      learningOutcomes: [
        "Semantik chunking uygulayabilme",
        "Hierarchical chunking tasarlayabilme",
        "Adaptive chunking sistemleri geliştirebilme",
        "Performans optimizasyonu yapabilme"
      ],
      steps: [
        {
          id: "semantic_chunking",
          title: "Semantik Chunking",
          description: "Anlam tabanlı metin bölümleme teknikleri",
          content: `# Semantik Chunking

## Temel Prensipler

Semantik chunking, metni anlamsal benzerlik temelinde böler. Bu yaklaşım, geleneksel boyut tabanlı yöntemlerden daha kaliteli sonuçlar verir.

### Çalışma Prensibi
1. **Cümle Embedding**: Her cümle vektöre dönüştürülür
2. **Benzerlik Hesaplama**: Ardışık cümleler arası benzerlik
3. **Threshold Belirleme**: Bölünme noktaları tespit edilir
4. **Chunk Oluşturma**: Benzer cümleler gruplandırılır

## Algoritma Adımları

### 1. Preprocessing
\`\`\`python
def preprocess_turkish_text(text):
    # Türkçe özel karakterleri normalize et
    text = normalize_turkish_chars(text)
    # Cümle sınırlarını tespit et
    sentences = split_sentences_turkish(text)
    return sentences
\`\`\`

### 2. Embedding Generation
\`\`\`python
def generate_embeddings(sentences, model="multilingual-e5"):
    embeddings = []
    for sentence in sentences:
        embedding = model.encode(sentence)
        embeddings.append(embedding)
    return embeddings
\`\`\`

### 3. Similarity Calculation
\`\`\`python
def calculate_similarity_scores(embeddings):
    similarities = []
    for i in range(len(embeddings)-1):
        sim = cosine_similarity(embeddings[i], embeddings[i+1])
        similarities.append(sim)
    return similarities
\`\`\`

### 4. Chunk Boundary Detection
\`\`\`python
def detect_boundaries(similarities, threshold=0.7):
    boundaries = []
    for i, sim in enumerate(similarities):
        if sim < threshold:
            boundaries.append(i+1)
    return boundaries
\`\`\`

## Türkçe İçin Optimizasyonlar

### A. Dil Modeli Seçimi
- **Multilingual models**: mBERT, XLM-R
- **Turkish-specific**: BERTurk, Turkish-BERT
- **Sentence transformers**: Turkish sentence-transformers

### B. Threshold Ayarlama
- **Akademik metinler**: 0.65-0.75
- **Haber metinleri**: 0.70-0.80
- **Teknik dokümantasyon**: 0.60-0.70

### C. Post-processing
- Minimum chunk boyutu kontrolü
- Maksimum chunk boyutu sınırlaması
- Overlap ekleme stratejisi`,
          type: "concept",
          duration: 10,
          interactive: true,
          hasDemo: true,
          hasQuiz: true,
          learningObjectives: [
            "Semantik chunking algoritmasını anlayabilme",
            "Türkçe metinler için optimizasyon yapabilme",
            "Threshold değerlerini ayarlayabilme"
          ],
          keyPoints: [
            "Semantik chunking anlam tabanlı bölümleme yapar",
            "Embedding modeli seçimi kritiktir",
            "Threshold değeri içerik türüne göre ayarlanmalıdır"
          ],
          tips: [
            "Türkçe için özel embedding modelleri kullanın",
            "Threshold değerini test ederek optimize edin",
            "Post-processing adımlarını ihmal etmeyin"
          ]
        },
        {
          id: "hierarchical_chunking",
          title: "Hiyerarşik Chunking",
          description: "Çok seviyeli metin bölümleme sistemleri",
          content: `# Hiyerarşik Chunking

## Konsept ve Avantajlar

Hiyerarşik chunking, metni farklı granülarite seviyelerinde böler. Bu yaklaşım, hem detaylı hem de genel bilgi erişimi sağlar.

### Seviye Yapısı
1. **Level 0**: Tam doküman
2. **Level 1**: Bölümler/Başlıklar
3. **Level 2**: Paragraflar
4. **Level 3**: Cümleler
5. **Level 4**: Kelime grupları

## Implementasyon Stratejisi

### A. Yapısal Analiz
\`\`\`python
def analyze_document_structure(text):
    structure = {
        'title': extract_title(text),
        'sections': extract_sections(text),
        'paragraphs': extract_paragraphs(text),
        'sentences': extract_sentences(text)
    }
    return structure
\`\`\`

### B. Hiyerarşi Oluşturma
\`\`\`python
def create_hierarchy(structure):
    hierarchy = {}
    
    # Level 1: Sections
    for i, section in enumerate(structure['sections']):
        section_id = f"section_{i}"
        hierarchy[section_id] = {
            'level': 1,
            'content': section,
            'children': []
        }
        
        # Level 2: Paragraphs in section
        paragraphs = extract_paragraphs_from_section(section)
        for j, paragraph in enumerate(paragraphs):
            para_id = f"{section_id}_para_{j}"
            hierarchy[para_id] = {
                'level': 2,
                'content': paragraph,
                'parent': section_id,
                'children': []
            }
    
    return hierarchy
\`\`\`

### C. Çapraz Referans Sistemi
\`\`\`python
def create_cross_references(hierarchy):
    references = {}
    
    for chunk_id, chunk_data in hierarchy.items():
        # Parent referansları
        if 'parent' in chunk_data:
            references[chunk_id] = {
                'parent': chunk_data['parent'],
                'siblings': get_siblings(chunk_id, hierarchy),
                'children': chunk_data.get('children', [])
            }
    
    return references
\`\`\`

## Arama Stratejileri

### 1. Top-Down Arama
- Genel konudan spesifik detaya
- Büyük chunk'lardan başla
- Relevance score'a göre derinleş

### 2. Bottom-Up Arama
- Spesifik detaydan genel konuya
- Küçük chunk'lardan başla
- Parent chunk'lara genişle

### 3. Hybrid Arama
- Her iki yaklaşımı kombine et
- Context window'u optimize et
- Multi-level retrieval

## Türkçe Optimizasyonları

### A. Başlık Tespiti
- Türkçe başlık kalıpları
- Büyük harf kullanımı
- Noktalama işaretleri

### B. Paragraf Sınırları
- Türkçe paragraf yapısı
- Girinti ve boşluk analizi
- Konu geçişi tespiti

### C. Cümle Segmentasyonu
- Türkçe noktalama kuralları
- Kısaltmalar ve özel durumlar
- Soru ve ünlem cümleleri`,
          type: "concept",
          duration: 15,
          interactive: true,
          hasDemo: true,
          hasQuiz: true,
          learningObjectives: [
            "Hiyerarşik yapıları tasarlayabilme",
            "Çok seviyeli arama stratejileri geliştirebilme",
            "Türkçe metinler için yapısal analiz yapabilme"
          ],
          keyPoints: [
            "Hiyerarşik chunking çok seviyeli erişim sağlar",
            "Yapısal analiz kritik öneme sahiptir",
            "Arama stratejisi kullanım durumuna göre seçilmelidir"
          ],
          resources: [
            {
              type: "tool",
              title: "Hiyerarşik Chunking Visualizer",
              description: "Metin hiyerarşisini görselleştirme aracı"
            }
          ]
        }
      ]
    },
    {
      id: "optimization_techniques",
      title: "Optimizasyon Teknikleri",
      description: "Performans ve kalite optimizasyonu yöntemleri",
      difficulty: "advanced",
      estimatedTime: 20,
      category: "optimization",
      prerequisites: ["chunking_basics", "advanced_techniques"],
      learningOutcomes: [
        "Performans metriklerini ölçebilme",
        "Kalite optimizasyonu yapabilme",
        "A/B testing uygulayabilme",
        "Production sistemleri tasarlayabilme"
      ],
      steps: [
        {
          id: "performance_metrics",
          title: "Performans Metrikleri",
          description: "Chunking kalitesini ölçme yöntemleri",
          content: `# Performans Metrikleri

## Kalite Metrikleri

### 1. Semantic Coherence
Chunk içindeki cümlelerin anlamsal tutarlılığını ölçer.

\`\`\`python
def calculate_semantic_coherence(chunk_sentences, embedding_model):
    embeddings = [embedding_model.encode(s) for s in chunk_sentences]
    
    # Pairwise similarities
    similarities = []
    for i in range(len(embeddings)):
        for j in range(i+1, len(embeddings)):
            sim = cosine_similarity(embeddings[i], embeddings[j])
            similarities.append(sim)
    
    return np.mean(similarities)
\`\`\`

### 2. Information Density
Chunk başına bilgi yoğunluğunu hesaplar.

\`\`\`python
def calculate_information_density(chunk_text):
    # Named entities
    entities = extract_entities(chunk_text)
    
    # Key phrases
    key_phrases = extract_key_phrases(chunk_text)
    
    # Technical terms
    tech_terms = extract_technical_terms(chunk_text)
    
    total_tokens = len(chunk_text.split())
    info_units = len(entities) + len(key_phrases) + len(tech_terms)
    
    return info_units / total_tokens
\`\`\`

### 3. Boundary Quality
Chunk sınırlarının ne kadar doğal olduğunu değerlendirir.

\`\`\`python
def evaluate_boundary_quality(chunks):
    boundary_scores = []
    
    for i in range(len(chunks)-1):
        current_chunk = chunks[i]
        next_chunk = chunks[i+1]
        
        # Son cümle ile ilk cümle benzerliği
        last_sentence = get_last_sentence(current_chunk)
        first_sentence = get_first_sentence(next_chunk)
        
        similarity = calculate_sentence_similarity(last_sentence, first_sentence)
        
        # Düşük benzerlik = iyi sınır
        boundary_score = 1 - similarity
        boundary_scores.append(boundary_score)
    
    return np.mean(boundary_scores)
\`\`\`

## Performans Metrikleri

### 1. Processing Speed
\`\`\`python
import time

def measure_chunking_speed(text, chunking_function):
    start_time = time.time()
    chunks = chunking_function(text)
    end_time = time.time()
    
    processing_time = end_time - start_time
    chars_per_second = len(text) / processing_time
    
    return {
        'processing_time': processing_time,
        'chars_per_second': chars_per_second,
        'chunks_created': len(chunks)
    }
\`\`\`

### 2. Memory Usage
\`\`\`python
import psutil
import os

def measure_memory_usage(chunking_function, text):
    process = psutil.Process(os.getpid())
    
    # Başlangıç bellek kullanımı
    initial_memory = process.memory_info().rss
    
    # Chunking işlemi
    chunks = chunking_function(text)
    
    # Son bellek kullanımı
    final_memory = process.memory_info().rss
    
    memory_increase = final_memory - initial_memory
    
    return {
        'memory_increase_mb': memory_increase / (1024 * 1024),
        'memory_per_chunk': memory_increase / len(chunks)
    }
\`\`\`

### 3. Retrieval Accuracy
\`\`\`python
def evaluate_retrieval_accuracy(chunks, test_queries, ground_truth):
    accuracy_scores = []
    
    for query, expected_chunks in zip(test_queries, ground_truth):
        # Similarity search
        retrieved_chunks = similarity_search(query, chunks, top_k=5)
        
        # Calculate precision@k
        relevant_retrieved = len(set(retrieved_chunks) & set(expected_chunks))
        precision = relevant_retrieved / len(retrieved_chunks)
        
        accuracy_scores.append(precision)
    
    return np.mean(accuracy_scores)
\`\`\`

## Türkçe Özel Metrikleri

### 1. Turkish Language Quality
\`\`\`python
def evaluate_turkish_quality(chunk):
    score = 0
    
    # Cümle bütünlüğü
    if chunk.strip().endswith(('.', '!', '?')):
        score += 0.3
    
    # Bağlaç kontrolü
    if not chunk.strip().startswith(('ve', 'ancak', 'fakat', 'ama')):
        score += 0.2
    
    # Ek bütünlüğü
    if not has_broken_suffixes(chunk):
        score += 0.3
    
    # Kelime bütünlüğü
    if not has_broken_words(chunk):
        score += 0.2
    
    return score
\`\`\`

### 2. Context Preservation
\`\`\`python
def measure_context_preservation(original_text, chunks):
    # Referans korunumu
    references = extract_references(original_text)
    preserved_refs = 0
    
    for chunk in chunks:
        chunk_refs = extract_references(chunk)
        for ref in chunk_refs:
            if is_reference_complete(ref, chunk):
                preserved_refs += 1
    
    reference_preservation = preserved_refs / len(references)
    
    # Tablo/şekil bütünlüğü
    tables = extract_tables(original_text)
    figures = extract_figures(original_text)
    
    preserved_tables = count_preserved_tables(tables, chunks)
    preserved_figures = count_preserved_figures(figures, chunks)
    
    return {
        'reference_preservation': reference_preservation,
        'table_preservation': preserved_tables / len(tables) if tables else 1.0,
        'figure_preservation': preserved_figures / len(figures) if figures else 1.0
    }
\`\`\``,
          type: "concept",
          duration: 12,
          interactive: true,
          hasDemo: true,
          hasQuiz: true,
          learningObjectives: [
            "Kalite metriklerini hesaplayabilme",
            "Performans ölçümü yapabilme",
            "Türkçe özel metrikleri uygulayabilme"
          ],
          keyPoints: [
            "Kalite ve performans metrikleri farklı boyutları ölçer",
            "Türkçe metinler için özel metrikler gerekir",
            "Sürekli ölçüm ve optimizasyon kritiktir"
          ],
          commonMistakes: [
            "Sadece hız odaklı optimizasyon",
            "Türkçe özel durumları ihmal etme",
            "Test verisi yetersizliği"
          ]
        }
      ]
    }
  ];

  // Initialize progress from props
  useEffect(() => {
    const allCompleted = new Set<string>();
    Object.values(userProgress).forEach(stepIds => {
      stepIds.forEach(stepId => allCompleted.add(stepId));
    });
    setCompletedSteps(allCompleted);
  }, [userProgress]);

  // Auto-progress functionality
  useEffect(() => {
    if (isPlaying && enableAutoProgress) {
      const timer = setTimeout(() => {
        handleNextStep();
      }, 5000); // 5 seconds per step
      
      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStepIndex, activeModule, enableAutoProgress]);

  const getCurrentModule = () => {
    return tutorialModules.find(m => m.id === activeModule);
  };

  const getCurrentStep = () => {
    const module = getCurrentModule();
    return module?.steps[currentStepIndex];
  };

  const getModuleProgress = (moduleId: string) => {
    const module = tutorialModules.find(m => m.id === moduleId);
    if (!module) return 0;
    
    const completedInModule = module.steps.filter(step => 
      completedSteps.has(step.id)
    ).length;
    
    return (completedInModule / module.steps.length) * 100;
  };

  const handleStepComplete = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);
    
    if (onStepComplete && activeModule) {
      onStepComplete(stepId, activeModule);
    }
    
    // Check if module is complete
    const module = getCurrentModule();
    if (module) {
      const allStepsCompleted = module.steps.every(step => 
        newCompleted.has(step.id)
      );
      
      if (allStepsCompleted && onModuleComplete) {
        onModuleComplete(module.id);
      }
    }
  };

  const handleNextStep = () => {
    const module = getCurrentModule();
    if (!module) return;
    
    if (currentStepIndex < module.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Module completed
      setIsPlaying(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const startModule = (moduleId: string) => {
    setActiveModule(moduleId);
    setCurrentStepIndex(0);
    setIsPlaying(false);
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "basics": return <BookOpen className="h-4 w-4" />;
      case "advanced": return <Brain className="h-4 w-4" />;
      case "optimization": return <TrendingUp className="h-4 w-4" />;
      case "troubleshooting": return <Settings className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case "introduction": return <Info className="h-4 w-4" />;
      case "concept": return <Lightbulb className="h-4 w-4" />;
      case "demo": return <Play className="h-4 w-4" />;
      case "practice": return <Target className="h-4 w-4" />;
      case "assessment": return <CheckCircle className="h-4 w-4" />;
      case "summary": return <Award className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  if (activeModule) {
    const module = getCurrentModule();
    const currentStep = getCurrentStep();
    
    if (!module || !currentStep) return null;

    return (
      <div className="space-y-6">
        {/* Module Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveModule(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{module.title}</h2>
              <p className="text-gray-600">{module.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getDifficultyColor(module.difficulty)} border text-sm`}>
              {getDifficultyLabel(module.difficulty)}
            </Badge>
            <Badge variant="outline" className="text-sm">
              <Clock className="h-3 w-3 mr-1" />
              {module.estimatedTime} dk
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">İlerleme</span>
                <span className="text-sm text-gray-600">
                  {currentStepIndex + 1} / {module.steps.length}
                </span>
              </div>
              <Progress 
                value={((currentStepIndex + 1) / module.steps.length) * 100} 
                className="h-2"
              />
            </CardContent>
          </Card>
        )}

        {/* Current Step */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  {getStepTypeIcon(currentStep.type)}
                </div>
                <div>
                  <CardTitle className="text-xl">{currentStep.title}</CardTitle>
                  <p className="text-gray-600 mt-1">{currentStep.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {currentStep.duration} dk
                    </Badge>
                    {currentStep.interactive && (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                        <Zap className="h-3 w-3 mr-1" />
                        Etkileşimli
                      </Badge>
                    )}
                    {currentStep.hasDemo && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                        <Eye className="h-3 w-3 mr-1" />
                        Demo
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {completedSteps.has(currentStep.id) ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-400" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Learning Objectives */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-blue-900">Öğrenme Hedefleri</h4>
              </div>
              <ul className="space-y-1 text-sm text-blue-800">
                {currentStep.learningObjectives.map((objective, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {objective}
                  </li>
                ))}
              </ul>
            </div>

            {/* Content */}
            <div className="prose max-w-none">
              <div className="bg-white rounded-lg border p-6">
                <div 
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: currentStep.content.replace(/\n/g, '<br/>') 
                  }}
                />
              </div>
            </div>

            {/* Key Points */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-yellow-600" />
                <h4 className="font-medium text-yellow-900">Önemli Noktalar</h4>
              </div>
              <ul className="space-y-1 text-sm text-yellow-800">
                {currentStep.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips */}
            {currentStep.tips && currentStep.tips.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium text-green-900">İpuçları</h4>
                </div>
                <ul className="space-y-1 text-sm text-green-800">
                  {currentStep.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Common Mistakes */}
            {currentStep.commonMistakes && currentStep.commonMistakes.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <h4 className="font-medium text-red-900">Yaygın Hatalar</h4>
                </div>
                <ul className="space-y-1 text-sm text-red-800">
                  {currentStep.commonMistakes.map((mistake, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {mistake}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resources */}
            {currentStep.resources && currentStep.resources.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <h4 className="font-medium text-gray-900">Ek Kaynaklar</h4>
                </div>
                <div className="space-y-2">
                  {currentStep.resources.map((resource, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 bg-white rounded border">
                      <div className="p-1 bg-blue-50 rounded">
                        {resource.type === "video" && <Play className="h-3 w-3 text-blue-600" />}
                        {resource.type === "document" && <FileText className="h-3 w-3 text-blue-600" />}
                        {resource.type === "example" && <Eye className="h-3 w-3 text-blue-600" />}
                        {resource.type === "tool" && <Settings className="h-3 w-3 text-blue-600" />}
                      </div>
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
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Önceki
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={currentStepIndex === module.steps.length - 1}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Duraklat
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Otomatik
                    </>
                  )}
                </Button>
                
                {!completedSteps.has(currentStep.id) && (
                  <Button
                    onClick={() => handleStepComplete(currentStep.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Tamamlandı
                  </Button>
                )}
              </div>

              <Button
                onClick={handleNextStep}
                disabled={currentStepIndex === module.steps.length - 1}
              >
                Sonraki
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Module selection view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Etkileşimli Eğitim</h2>
            <p className="text-gray-600 mt-1">
              Adım adım rehberli öğrenme deneyimi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {tutorialModules.length} Modül
          </Badge>
          <Button variant="outline" size="sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Yardım
          </Button>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tutorialModules.map((module) => {
          const progress = getModuleProgress(module.id);
          const isCompleted = progress === 100;
          
          return (
            <Card key={module.id} className="transition-all hover:shadow-lg border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      {getCategoryIcon(module.category)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">
                        {module.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {module.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`${getDifficultyColor(module.difficulty)} border text-xs`}>
                          {getDifficultyLabel(module.difficulty)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {module.estimatedTime} dk
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Layers className="h-3 w-3 mr-1" />
                          {module.steps.length} Adım
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {isCompleted && (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                {showProgress && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">İlerleme</span>
                      <span className="text-sm text-gray-600">{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* Learning Outcomes */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection(`outcomes_${module.id}`)}
                  >
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Öğrenme Çıktıları</span>
                    </div>
                    {expandedSections.has(`outcomes_${module.id}`) ? (
                      <ChevronDown className="h-4 w-4 text-blue-600" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  {expandedSections.has(`outcomes_${module.id}`) && (
                    <ul className="mt-2 space-y-1 text-xs text-blue-800">
                      {module.learningOutcomes.map((outcome, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {outcome}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Prerequisites */}
                {module.prerequisites && module.prerequisites.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-900">Ön Koşullar</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {module.prerequisites.map((prereq) => (
                        <Badge key={prereq} variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                          {tutorialModules.find(m => m.id === prereq)?.title || prereq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  onClick={() => startModule(module.id)}
                  className="w-full"
                  variant={isCompleted ? "outline" : "default"}
                >
                  {isCompleted ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Tekrar Et
                    </>
                  ) : progress > 0 ? (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Devam Et
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Başla
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overall Progress */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {tutorialModules.length}
              </div>
              <div className="text-sm text-gray-600">Toplam Modül</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {tutorialModules.reduce((sum, m) => sum + m.steps.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Toplam Adım</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {completedSteps.size}
              </div>
              <div className="text-sm text-gray-600">Tamamlanan</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {tutorialModules.reduce((sum, m) => sum + m.estimatedTime, 0)}
              </div>
              <div className="text-sm text-gray-600">Toplam Süre (dk)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveTutorial;