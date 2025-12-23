# Örnek Veri Yapısı ve Test Senaryoları

## Kişiselleştirilmiş Ders Notu ve Kaynak Asistanı

### Genel Veri Stratejisi

**Veri Felsefesi:** Eğitim odaklı, sentetik ama gerçekçi veri  
**Kapsam:** Çok domanli eğitim içeriği  
**Dil Desteği:** Türkçe ağırlıklı, karma dil örnekleri  
**Toplam Veri Hacmi:** ~100 doküman, ~1M token

---

## **1. Örnek Doküman Koleksiyonu**

### **1.1 Bilgisayar Bilimleri Materyalleri (30 doküman)**

#### **Algoritma ve Veri Yapıları**

```
📁 data/raw/sample_documents/computer_science/

├── algoritmalar_giris.pdf (15 sayfa)
│   ├── İçerik: Temel algoritma kavramları
│   ├── Konular: Big O notation, recursion, iteration
│   └── Dil: Türkçe

├── veri_yapilari.docx (22 sayfa)
│   ├── İçerik: Array, linked list, stack, queue, tree
│   ├── Konular: Implementation examples, complexity analysis
│   └── Dil: Türkçe + kod örnekleri İngilizce

├── sorting_algorithms.pptx (18 slayt)
│   ├── İçerik: Bubble sort, quicksort, mergesort
│   ├── Format: Slayt başına 1-2 algoritma
│   └── Dil: Türkçe açıklama + pseudocode

├── graph_theory.pdf (28 sayfa)
│   ├── İçerik: Graph representations, DFS, BFS, shortest path
│   ├── Konular: Dijkstra, Floyd-Warshall
│   └── Dil: Mixed (Türkçe teori + İngilizce terminoloji)

├── dynamic_programming.docx (20 sayfa)
│   ├── İçerik: DP concepts, memoization, tabulation
│   ├── Örnekler: Fibonacci, knapsack, longest common subsequence
│   └── Dil: Türkçe
```

#### **Programlama Dilleri**

```
├── python_temelleri.pdf (35 sayfa)
│   ├── İçerik: Variables, functions, classes, modules
│   ├── Seviye: Beginner to intermediate
│   └── Kod örnekleri: Comprehensive Python examples

├── javascript_web_dev.docx (25 sayfa)
│   ├── İçerik: DOM manipulation, async/await, promises
│   ├── Framework: Vanilla JS + basic React
│   └── Dil: Türkçe açıklamalar + İngilizce kod

├── database_sql.pptx (22 slayt)
│   ├── İçerik: SQL basics, joins, indexes, transactions
│   ├── DBMS: MySQL, PostgreSQL examples
│   └── Dil: Türkçe + SQL queries
```

### **1.2 Matematik Materyalleri (25 doküman)**

#### **Calculus ve Analysis**

```
📁 data/raw/sample_documents/mathematics/

├── calculus_derivatives.pdf (30 sayfa)
│   ├── İçerik: Limit, türev, integral kavramları
│   ├── Örnekler: Step-by-step çözümler
│   └── Dil: Türkçe matematik terminolojisi

├── linear_algebra.docx (28 sayfa)
│   ├── İçerik: Matris işlemleri, determinant, eigenvalue
│   ├── Uygulamalar: Computer graphics, machine learning
│   └── Dil: Türkçe + mathematical notations

├── statistics_basics.pptx (20 slayt)
│   ├── İçerik: Descriptive statistics, probability, distributions
│   ├── Uygulamalar: Data science examples
│   └── Dil: Türkçe + formüller

├── discrete_mathematics.pdf (32 sayfa)
│   ├── İçerik: Set theory, logic, combinatorics
│   ├── CS bağlantısı: Algorithm analysis foundations
│   └── Dil: Türkçe teorik açıklamalar
```

### **1.3 Genel Eğitim Materyalleri (15 doküman)**

#### **Sosyal Bilimler**

```
├── turkiye_tarihi.pdf (40 sayfa)
│   ├── İçerik: Osmanlı-Cumhuriyet dönemi
│   ├── Format: Kronolojik anlatım
│   └── Dil: Türkçe

├── ekonomi_temel_kavramlar.docx (18 sayfa)
│   ├── İçerik: Arz-talep, piyasa yapıları, makroekonomi
│   ├── Örnekler: Türkiye ekonomisi case studies
│   └── Dil: Türkçe + ekonomik terimler

├── psychology_intro.pptx (25 slayt)
│   ├── İçerik: Temel psikoloji kavramları
│   ├── Konular: Learning, memory, cognition
│   └── Dil: Türkçe + bazı İngilizce terimler
```

#### **Fen Bilimleri**

```
├── physics_mechanics.pdf (35 sayfa)
│   ├── İçerik: Newton laws, energy, momentum
│   ├── Problem çözümleri: Step-by-step solutions
│   └── Dil: Türkçe + fizik formülleri

├── chemistry_basics.docx (22 sayfa)
│   ├── İçerik: Atomic structure, periodic table, bonds
│   ├── Lab örnekleri: Simple experiments
│   └── Dil: Türkçe kimya terminolojisi
```

---

## **2. Veri Yapısı ve Metadata**

### **2.1 Doküman Metadata Şeması**

```json
{
  "document_metadata": {
    "id": "doc_001",
    "filename": "algoritmalar_giris.pdf",
    "title": "Algoritmalara Giriş - Temel Kavramlar",
    "subject": "computer_science",
    "topic": "algorithms",
    "difficulty_level": "beginner",
    "language": "turkish",
    "page_count": 15,
    "file_size_kb": 2048,
    "upload_date": "2024-01-15T10:30:00Z",
    "last_modified": "2024-01-15T10:30:00Z",
    "content_tags": ["algorithm", "big_o", "recursion", "iteration"],
    "educational_level": "university_sophomore",
    "prerequisites": ["basic_programming", "mathematics_discrete"],
    "estimated_reading_time_minutes": 45
  }
}
```

### **2.2 Chunk Metadata Şeması**

```json
{
  "chunk_metadata": {
    "chunk_id": "chunk_001_003",
    "document_id": "doc_001",
    "sequence_number": 3,
    "content_preview": "Big O notasyonu algoritmaların zaman...",
    "content_full": "Big O notasyonu algoritmaların zaman ve alan karmaşıklığını...",
    "chunk_length_chars": 980,
    "chunk_length_tokens": 245,
    "start_position": 2048,
    "end_position": 3028,
    "page_number": 3,
    "section_title": "Algoritma Analizi",
    "content_type": "explanatory_text",
    "key_concepts": ["big_o_notation", "time_complexity", "space_complexity"],
    "difficulty_score": 0.6,
    "contains_code": false,
    "contains_math": true,
    "language_detected": "turkish",
    "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
    "embedding_generated_at": "2024-01-15T11:00:00Z"
  }
}
```

### **2.3 Query Metadata Şeması**

```json
{
  "query_metadata": {
    "query_id": "query_20240115_001",
    "original_query": "Big O notasyonu nedir?",
    "processed_query": "big o notasyonu nedir",
    "query_type": "definition",
    "language": "turkish",
    "key_terms": ["big_o", "notasyon", "algoritma"],
    "intent_classification": "definition_request",
    "complexity_level": "basic",
    "domain": "computer_science",
    "user_session": "session_123",
    "timestamp": "2024-01-15T12:30:00Z"
  }
}
```

---

## **3. Test Senaryoları ve Query Sets**

### **3.1 Temel Test Sorguları (50 sorgu)**

#### **Definition Queries (Tanım Soruları)**

```python
DEFINITION_QUERIES = [
    # Bilgisayar Bilimleri
    "Algoritma nedir?",
    "Big O notasyonu ne demek?",
    "Recursion kavramını açıkla",
    "Linked list nedir?",
    "Binary tree nasıl çalışır?",

    # Matematik
    "Türev nedir?",
    "Matris determinantı nasıl hesaplanır?",
    "Olasılık dağılımı ne demek?",
    "Integral kavramını açıkla",

    # Genel
    "Newton'un hareket yasaları nelerdir?",
    "Osmanlı İmparatorluğu ne zaman kuruldu?",
    "Psikolojide öğrenme teorileri neler?"
]
```

#### **How-to Queries (Nasıl Soruları)**

```python
HOW_TO_QUERIES = [
    # Programlama
    "Python'da for loop nasıl yazılır?",
    "SQL JOIN işlemi nasıl yapılır?",
    "JavaScript'te function nasıl tanımlanır?",
    "Quicksort algoritması nasıl implement edilir?",

    # Matematik Problem Solving
    "Türev nasıl alınır?",
    "Matris çarpımı nasıl yapılır?",
    "İstatistiksel ortalama nasıl hesaplanır?",

    # Genel Problem Solving
    "Fizik problemleri nasıl çözülür?",
    "Tarih olayları nasıl kronolojik sıralanır?"
]
```

#### **Explanation Queries (Açıklama Soruları)**

```python
EXPLANATION_QUERIES = [
    # Teorik Açıklamalar
    "Neden quicksort merge sort'tan daha hızlı?",
    "Recursion neden bazen inefficient oluyor?",
    "Türev alma kuralları neden böyle?",
    "Newton yasaları neden evrensel?",

    # Cause-Effect Relations
    "Big O notation neden önemli?",
    "Database indexing neden performansı artırır?",
    "İstatistik neden bilimsel araştırmada kullanılır?"
]
```

#### **Comparison Queries (Karşılaştırma Soruları)**

```python
COMPARISON_QUERIES = [
    # Technical Comparisons
    "Array ile linked list arasındaki fark nedir?",
    "Python ile JavaScript arasındaki farklar?",
    "SQL ile NoSQL veritabanları arasındaki fark?",
    "Breadth-first search ile depth-first search farkı?",

    # Mathematical Comparisons
    "Türev ile integral arasındaki ilişki nedir?",
    "Deterministic ile probabilistic algoritmalar farkı?",

    # General Academic Comparisons
    "Classical physics ile quantum physics farkı?",
    "Osmanlı ile Cumhuriyet dönemi arasındaki farklar?"
]
```

### **3.2 Complex Multi-Part Queries (25 sorgu)**

```python
COMPLEX_QUERIES = [
    # Multi-step problems
    "Quicksort algoritmasının time complexity'sini açıkla ve merge sort ile karşılaştır",
    "Python'da binary tree implement et ve traversal methodlarını göster",
    "Türev alma kurallarını açıkla ve örnek problemler çöz",
    "SQL JOIN türlerini açıkla ve performance implications'larını karşılaştır",

    # Cross-domain queries
    "Machine learning'de linear algebra nasıl kullanılır?",
    "Computer graphics'te calculus ve linear algebra uygulamaları",
    "Database design'da discrete mathematics kullanımı",

    # Turkish-specific academic queries
    "Türkiye'de bilişim sektörünün gelişimi ve algoritma kullanımı",
    "Türk matematikçilerinin calculus alanındaki katkıları"
]
```

### **3.3 Edge Case Test Queries (15 sorgu)**

```python
EDGE_CASE_QUERIES = [
    # Very short queries
    "Algoritma?",
    "Türev?",
    "SQL?",

    # Very long queries
    "Quicksort algoritmasının worst-case time complexity'sinin O(n²) olmasının sebebini detaylı bir şekilde açıklayabilir misin ve bu durumun ne zaman ortaya çıktığını örneklerle gösterebilir misin ayrıca bu problemi nasıl minimize edebileceğimizi de anlatabilir misin?",

    # Queries with typos
    "algortima neidr?",
    "türev alsma kuralları",
    "python'da for lop",

    # Mixed language queries
    "What is algoritma?",
    "Python'da function definition nasıl?",

    # Questions with no answer in corpus
    "Quantum computing algoritmaları",
    "Yapay zeka ethics",
    "Blockchain teknolojisi"
]
```

---

## **4. Değerlendirme Veri Setleri**

### **4.1 Ground Truth Answers**

```python
GROUND_TRUTH_ANSWERS = {
    "Algoritma nedir?": {
        "expected_answer": "Algoritma, bir problemi çözmeye yönelik adım adım takip edilen işlemler dizisidir...",
        "key_concepts": ["problem_solving", "step_by_step", "finite", "deterministic"],
        "source_documents": ["algoritmalar_giris.pdf", "veri_yapilari.docx"],
        "expected_sources": 2,
        "answer_quality_score": 5.0,
        "completeness_score": 5.0
    },

    "Big O notasyonu ne demek?": {
        "expected_answer": "Big O notasyonu, algoritmaların zaman ve alan karmaşıklığını ifade eden matematiksel notasyondur...",
        "key_concepts": ["time_complexity", "space_complexity", "upper_bound", "asymptotic_analysis"],
        "source_documents": ["algoritmalar_giris.pdf"],
        "expected_sources": 1,
        "answer_quality_score": 5.0,
        "completeness_score": 4.5
    }
}
```

### **4.2 Test Scenarios**

```python
TEST_SCENARIOS = [
    {
        "scenario_name": "basic_cs_student",
        "description": "Computer science student asking basic algorithm questions",
        "queries": [
            "Algoritma nedir?",
            "Big O notation nedir?",
            "Recursion nasıl çalışır?"
        ],
        "expected_performance": {
            "accuracy": 0.85,
            "response_time_max": 5.0,
            "source_attribution": True
        }
    },

    {
        "scenario_name": "math_student_calculus",
        "description": "Mathematics student learning calculus",
        "queries": [
            "Türev nedir?",
            "Türev alma kuralları nelerdir?",
            "Chain rule nasıl uygulanır?"
        ],
        "expected_performance": {
            "accuracy": 0.80,
            "response_time_max": 6.0,
            "mathematical_notation": True
        }
    },

    {
        "scenario_name": "cross_domain_queries",
        "description": "Questions spanning multiple academic domains",
        "queries": [
            "Machine learning'de matematik nasıl kullanılır?",
            "Computer graphics'te linear algebra uygulamaları",
            "Database design'da discrete math"
        ],
        "expected_performance": {
            "accuracy": 0.70,
            "response_time_max": 8.0,
            "multi_source": True
        }
    },

    {
        "scenario_name": "turkish_language_challenges",
        "description": "Turkish-specific language processing challenges",
        "queries": [
            "Yapay zeka nedir?",
            "Bilgisayar programcılığı nasıl öğrenilir?",
            "Matematik formülleri nasıl çözülür?"
        ],
        "expected_performance": {
            "accuracy": 0.75,
            "turkish_grammar": True,
            "cultural_context": True
        }
    }
]
```

---

## **5. Performance Benchmarking Data**

### **5.1 Retrieval Evaluation Dataset**

```python
RETRIEVAL_EVALUATION = {
    "query_document_relevance": {
        "Algoritma nedir?": {
            "highly_relevant": ["algoritmalar_giris.pdf"],
            "moderately_relevant": ["veri_yapilari.docx", "python_temelleri.pdf"],
            "not_relevant": ["turkiye_tarihi.pdf", "chemistry_basics.docx"]
        },

        "Türev nasıl alınır?": {
            "highly_relevant": ["calculus_derivatives.pdf"],
            "moderately_relevant": ["physics_mechanics.pdf"],
            "not_relevant": ["javascript_web_dev.docx", "psychology_intro.pptx"]
        }
    },

    "expected_retrieval_metrics": {
        "precision_at_5": 0.75,
        "recall_at_5": 0.65,
        "map_score": 0.70,
        "ndcg_at_5": 0.72
    }
}
```

### **5.2 Generation Quality Evaluation**

```python
GENERATION_QUALITY_METRICS = {
    "rouge_scores": {
        "target_rouge_l": 0.65,
        "target_rouge_1": 0.70,
        "target_rouge_2": 0.45
    },

    "bert_score": {
        "target_f1": 0.72,
        "target_precision": 0.70,
        "target_recall": 0.74
    },

    "human_evaluation_criteria": {
        "accuracy": "5-point scale",
        "completeness": "5-point scale",
        "clarity": "5-point scale",
        "turkish_quality": "5-point scale",
        "educational_value": "5-point scale"
    }
}
```

---

## **6. Synthetic Data Generation Scripts**

### **6.1 Document Generation**

```python
# scripts/generate_sample_documents.py
class SampleDocumentGenerator:
    """Sentetik eğitim dokümanları üretici"""

    def generate_cs_algorithm_doc(self, algorithm_name: str) -> dict:
        """Algoritma dokümantasyonu üret"""
        template = {
            "title": f"{algorithm_name} Algoritması",
            "sections": [
                "Giriş ve Tanım",
                "Algoritma Adımları",
                "Time Complexity Analizi",
                "Space Complexity Analizi",
                "Örnek Implementasyon",
                "Avantajlar ve Dezavantajlar",
                "Alternatif Yaklaşımlar"
            ],
            "code_examples": True,
            "mathematical_notation": True,
            "difficulty_level": "intermediate"
        }

        return self._generate_document_content(template)

    def generate_math_concept_doc(self, concept: str) -> dict:
        """Matematik kavramı dokümantasyonu"""
        template = {
            "title": f"{concept} - Matematik Kavramları",
            "sections": [
                "Temel Tanım",
                "Matematiksel Formülasyon",
                "Teoremler ve İspatlar",
                "Örnek Problemler",
                "Çözüm Yöntemleri",
                "Uygulamalar",
                "İlgili Konular"
            ],
            "mathematical_notation": True,
            "proof_examples": True,
            "difficulty_level": "advanced"
        }

        return self._generate_document_content(template)
```

### **6.2 Query Generation**

```python
# scripts/generate_test_queries.py
class TestQueryGenerator:
    """Test sorguları üretici"""

    def generate_definition_queries(self, concepts: List[str]) -> List[str]:
        """Tanım soruları üret"""
        patterns = [
            "{concept} nedir?",
            "{concept} ne demek?",
            "{concept} kavramını açıkla",
            "{concept} tanımını yap"
        ]

        queries = []
        for concept in concepts:
            for pattern in patterns:
                queries.append(pattern.format(concept=concept))

        return queries

    def generate_how_to_queries(self, tasks: List[str]) -> List[str]:
        """Nasıl yapılır soruları üret"""
        patterns = [
            "{task} nasıl yapılır?",
            "{task} nasıl implement edilir?",
            "{task} adımları nelerdir?",
            "{task} için hangi yöntem kullanılır?"
        ]

        queries = []
        for task in tasks:
            for pattern in patterns:
                queries.append(pattern.format(task=task))

        return queries
```

Bu kapsamlı veri yapısı ve test senaryoları, RAG sisteminin hem eğitim değerini hem de performans değerlendirmesini destekler.
