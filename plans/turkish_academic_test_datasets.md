
# Turkish Academic Test Datasets for Agentic Chunking
## Comprehensive Test Data Collection and Specification

**Version:** 1.0  
**Date:** 2026-01-02  
**Author:** AI Architect  
**Target System:** Agentic Chunking with Groq Llama 3.1 8B

---

## Executive Summary

This document provides comprehensive specifications for Turkish academic test datasets designed to validate the semantic coherence and reasoning quality of the Agentic Chunking system. The datasets cover diverse educational domains with specific focus on Turkish language patterns, educational content structures, and semantic complexity variations.

### Dataset Categories
- **Natural Sciences**: Biology, Chemistry, Physics, Mathematics
- **Social Sciences**: History, Geography, Literature, Philosophy  
- **Technical Documentation**: Engineering, Computer Science, Medical
- **Mixed Content**: Multi-domain educational materials
- **Edge Cases**: Challenging scenarios for system validation

---

## 1. Dataset Architecture and Organization

### 1.1 Dataset Structure

```
turkish_academic_datasets/
├── natural_sciences/
│   ├── biology/
│   │   ├── cell_biology/
│   │   ├── genetics/
│   │   ├── ecology/
│   │   └── human_anatomy/
│   ├── chemistry/
│   │   ├── organic_chemistry/
│   │   ├── inorganic_chemistry/
│   │   └── biochemistry/
│   ├── physics/
│   │   ├── mechanics/
│   │   ├── thermodynamics/
│   │   └── electromagnetism/
│   └── mathematics/
│       ├── algebra/
│       ├── geometry/
│       └── calculus/
├── social_sciences/
│   ├── history/
│   │   ├── ottoman_history/
│   │   ├── republic_history/
│   │   └── world_history/
│   ├── geography/
│   │   ├── physical_geography/
│   │   ├── human_geography/
│   │   └── turkey_geography/
│   ├── literature/
│   │   ├── classical_literature/
│   │   ├── modern_literature/
│   │   └── poetry/
│   └── philosophy/
│       ├── ethics/
│       ├── logic/
│       └── metaphysics/
├── technical_documentation/
│   ├── engineering/
│   ├── computer_science/
│   └── medical/
├── mixed_content/
│   ├── interdisciplinary/
│   ├── comparative_studies/
│   └── case_studies/
└── edge_cases/
    ├── ambiguous_boundaries/
    ├── complex_references/
    └── challenging_transitions/
```

### 1.2 Dataset Metadata Schema

```python
class DatasetMetadata:
    def __init__(self):
        self.dataset_id: str = ""
        self.domain: str = ""  # biology, chemistry, physics, etc.
        self.subdomain: str = ""  # cell_biology, organic_chemistry, etc.
        self.content_type: str = ""  # textbook, lecture_notes, exam_questions
        self.difficulty_level: str = ""  # elementary, secondary, university
        self.language_complexity: str = ""  # simple, moderate, complex
        self.content_length: int = 0  # character count
        self.expected_chunks: int = 0  # expected number of chunks
        self.critical_structures: List[str] = []  # list, table, figure references
        self.turkish_patterns: List[str] = []  # specific Turkish language patterns
        self.educational_patterns: List[str] = []  # definition-example, cause-effect
        self.ground_truth_boundaries: List[int] = []  # character positions
        self.expert_annotations: Dict[str, Any] = {}
        self.creation_date: str = ""
        self.last_updated: str = ""
        self.validation_status: str = ""  # pending, validated, approved
```

---

## 2. Natural Sciences Test Datasets

### 2.1 Biology Test Datasets

#### 2.1.1 Cell Biology Dataset Collection

**Dataset: Cell Division Processes**
```python
cell_division_dataset = {
    "dataset_id": "bio_cell_001",
    "title": "Hücre Bölünmesi Süreçleri",
    "content": """
# Hücre Bölünmesi

## Mitoz Bölünmesi

### Mitoz Evreleri
Mitoz bölünmesi dört temel evreden oluşur ve somatik hücrelerin çoğalmasını sağlar:

a) **Profaz Evresi**
Bu evrede kromozomlar yoğunlaşır ve görünür hale gelir. Çekirdek zarı parçalanmaya başlar ve sentrozomlar hücrenin zıt kutuplarına hareket eder.

b) **Metafaz Evresi** 
Kromozomlar hücrenin ortasında, ekvator düzleminde dizilir. Her kromozom kinetokoru aracılığıyla iğ ipliklerine bağlanır.

c) **Anafaz Evresi**
Kardeş kromatidler ayrılır ve hücrenin zıt kutuplarına doğru hareket eder. Bu hareket iğ iplikleri tarafından sağlanır.

d) **Telofaz Evresi**
Kromozomlar gevşer ve yeni çekirdek zarları oluşur. İğ iplikleri dağılır ve sitoplazma bölünmesi başlar.

### Sitoplazma Bölünmesi (Sitokinez)
Mitoz tamamlandıktan sonra sitoplazma bölünmesi gerçekleşir:

- **Hayvan Hücrelerinde**: Aktin ve miyozin filamentlerinden oluşan kasılma halkası sitoplazmanın ortasından sıkışır
- **Bitki Hücrelerinde**: Hücre duvarı oluşumu ile sitoplazma bölünür

## Mayoz Bölünmesi

### Mayoz I (Redüksiyon Bölünmesi)
Mayoz I'de homolog kromozomlar ayrılır ve diploid hücreden haploid hücreler oluşur.

#### Mayoz I Evreleri:

1) **Profaz I**: En uzun evre olup beş alt evreden oluşur
   - Leptoten: Kromozomlar yoğunlaşmaya başlar
   - Zigoten: Homolog kromozomlar eşleşir (sinapsis)
   - Pakiten: Crossing-over gerçekleşir
   - Diploten: Homolog kromozomlar ayrılmaya başlar
   - Diakinez: Çekirdek zarı parçalanır

2) **Metafaz I**: Homolog kromozom çiftleri ekvator düzleminde dizilir

3) **Anafaz I**: Homolog kromozomlar ayrılır (kardeş kromatidler ayrılmaz)

4) **Telofaz I**: İki haploid hücre oluşur

### Mayoz II (Eşitlik Bölünmesi)
Mayoz II mitozla benzerdir ancak haploid hücreler üzerinde gerçekleşir.

## Hücre Bölünmesinin Düzenlenmesi

### Hücre Döngüsü Kontrol Noktaları
Hücre döngüsü üç önemli kontrol noktasında denetlenir:

a) **G1/S Kontrol Noktası**: DNA hasarı kontrolü
b) **İntraS Kontrol Noktası**: DNA replikasyon kontrolü  
c) **G2/M Kontrol Noktası**: Kromozom bütünlüğü kontrolü

### Hücre Döngüsü Proteinleri
Hücre döngüsünün düzenlenmesinde rol alan temel proteinler:

- **Siklinler**: Döngüsel olarak sentezlenen düzenleyici proteinler
- **Siklin Bağımlı Kinazlar (CDK)**: Siklinlerle kompleks oluşturan enzimler
- **CDK İnhibitörleri**: Hücre döngüsünü durduran proteinler

Bu proteinlerin dengesi hücre bölünmesinin doğru zamanlama ile gerçekleşmesini sağlar.
""",
    "metadata": {
        "domain": "biology",
        "subdomain": "cell_biology", 
        "difficulty_level": "university",
        "language_complexity": "complex",
        "content_length": 2847,
        "expected_chunks": 8,
        "critical_structures": [
            "alphabetical_list_mitoz_evreleri",
            "numerical_list_mayoz_evreleri", 
            "bullet_list_sitokinez",
            "nested_list_profaz_I"
        ],
        "turkish_patterns": [
            "definition_pattern: 'oluşur ve'",
            "sequence_pattern: 'evrede... başlar'",
            "contrast_pattern: 'benzerdir ancak'",
            "enumeration_pattern: 'temel evreden oluşur'"
        ],
        "educational_patterns": [
            "definition_explanation",
            "process_sequence", 
            "comparison_contrast",
            "hierarchical_classification"
        ],
        "ground_truth_boundaries": [
            156,   # After "Mitoz Evreleri" introduction
            892,   # After Telofaz description
            1156,  # After Sitokinez section
            1456,  # After "Mayoz I" introduction
            2234,  # After Telofaz I
            2456,  # After Mayoz II
            2678,  # After control points
            2847   # End of document
        ]
    }
}
```

**Dataset: Genetics and Heredity**
```python
genetics_dataset = {
    "dataset_id": "bio_gen_001", 
    "title": "Kalıtım ve Genetik",
    "content": """
# Kalıtım ve Genetik

## Mendel'in Kalıtım Yasaları

### Birinci Yasa: Ayrılma Yasası
Mendel'in birinci yasası, her karakterin iki faktör (alel) tarafından kontrol edildiğini ve bu faktörlerin gamet oluşumu sırasında ayrıldığını belirtir.

#### Temel Kavramlar:
- **Gen**: Belirli bir karakteri kontrol eden DNA bölümü
- **Alel**: Aynı genin farklı formları
- **Homozigot**: Aynı alellere sahip birey (AA veya aa)
- **Heterozigot**: Farklı alellere sahip birey (Aa)

### İkinci Yasa: Bağımsız Dağılım Yasası
Farklı karakterleri kontrol eden genler birbirinden bağımsız olarak dağılır.

Bu yasa şu koşullarda geçerlidir:
1) Genler farklı kromozomlarda bulunmalı
2) Genler arasında bağlantı olmamalı
3) Crossing-over etkisi minimal olmalı

## DNA Yapısı ve Replikasyonu

### DNA'nın Kimyasal Yapısı
DNA (Deoksiribonükleik Asit) dört temel bileşenden oluşur:

a) **Pürin Bazları**:
   - Adenin (A): Timin ile hidrojen bağı yapar
   - Guanin (G): Sitozin ile hidrojen bağı yapar

b) **Pirimidin Bazları**:
   - Timin (T): Adenin ile eşleşir
   - Sitozin (C): Guanin ile eşleşir

c) **Şeker**: Deoksiriboz şekeri

d) **Fosfat Grubu**: DNA omurgasını oluşturur

### DNA Replikasyonu
DNA replikasyonu yarı-koruyucu (semi-conservative) mekanizma ile gerçekleşir:

1) **Başlama**: Helikaz enzimi DNA sarmalını açar
2) **Uzama**: DNA polimeraz yeni zinciri sentezler
3) **Sonlanma**: Okazaki parçaları ligaz ile birleştirilir

#### Replikasyonda Görevli Enzimler:
- **Helikaz**: DNA sarmalını açar
- **Primaz**: RNA primer sentezler  
- **DNA Polimeraz III**: Ana sentez enzimi
- **DNA Polimeraz I**: Primerleri değiştirir
- **Ligaz**: DNA parçalarını birleştirir

## Protein Sentezi

### Transkripsiyon (DNA → RNA)
Transkripsiyon üç aşamada gerçekleşir:

a) **Başlama (Initiation)**
RNA polimeraz promoter bölgeye bağlanır ve transkripsiyon başlar.

b) **Uzama (Elongation)** 
RNA polimeraz DNA boyunca hareket ederek mRNA sentezler.

c) **Sonlanma (Termination)**
Sonlandırıcı diziye ulaşıldığında transkripsiyon durur.

### Translasyon (RNA → Protein)
Translasyon ribozomlarda gerçekleşir ve üç aşamadan oluşur:

1) **Başlama**: Ribozom mRNA'ya bağlanır
2) **Uzama**: Amino asitler peptit bağı ile birleşir
3) **Sonlanma**: Stop kodona ulaşıldığında sentez durur

#### Genetik Kod Özellikleri:
- **Üçlü (Triplet)**: Her kodon üç nükleotidden oluşur
- **Evrensel**: Tüm canlılarda aynı kod kullanılır
- **Dejeneratif**: Bir amino asit birden fazla kodonla kodlanabilir
- **Kesintisiz**: Kodonlar arasında boşluk yoktur

Bu özellikler genetik kodun evrimsel kökenini ve canlılar arası benzerliği gösterir.
""",
    "metadata": {
        "domain": "biology",
        "subdomain": "genetics",
        "difficulty_level": "university", 
        "language_complexity": "complex",
        "content_length": 2654,
        "expected_chunks": 7,
        "critical_structures": [
            "definition_list_temel_kavramlar",
            "numbered_list_koşullar",
            "alphabetical_list_dna_bileşenleri", 
            "process_steps_replikasyon",
            "enzyme_list_replikasyon"
        ],
        "turkish_patterns": [
            "definition_pattern: 'olarak tanımlanır'",
            "condition_pattern: 'koşullarda geçerlidir'", 
            "process_pattern: 'aşamada gerçekleşir'",
            "characteristic_pattern: 'özellikleri'"
        ],
        "educational_patterns": [
            "law_explanation",
            "concept_definition",
            "process_description", 
            "classification_system"
        ]
    }
}
```

#### 2.1.2 Ecology and Environmental Biology

**Dataset: Ecosystem Dynamics**
```python
ecology_dataset = {
    "dataset_id": "bio_eco_001",
    "title": "Ekosistem Dinamikleri",
    "content": """
# Ekosistem Dinamikleri ve Ekolojik İlişkiler

## Ekosistem Bileşenleri

### Abiyotik Faktörler
Ekosistemi etkileyen cansız çevre faktörleri şunlardır:

#### İklimsel Faktörler:
- **Sıcaklık**: Canlıların metabolik aktivitelerini etkiler
- **Nem**: Su dengesini ve yaşam alanlarını belirler  
- **Işık**: Fotosentez ve günlük ritimler için gereklidir
- **Rüzgar**: Tohum dağılımı ve iklim düzenlemesinde rol oynar

#### Edafik Faktörler (Toprak):
- **pH**: Besin elementlerinin alınabilirliğini etkiler
- **Organik Madde**: Toprak verimliliğini belirler
- **Mineral İçerik**: Bitki büyümesi için gerekli elementler
- **Toprak Yapısı**: Kök gelişimi ve su tutma kapasitesini etkiler

### Biyotik Faktörler
Ekosistemde yaşayan canlı organizmalar ve aralarındaki ilişkiler:

a) **Üreticiler (Ototrof Organizmalar)**
Kendi besinlerini sentezleyen canlılardır. İki ana grupta incelenir:
- Fotosentetik organizmalar (bitkiler, algler)
- Kemosentetik organizmalar (bazı bakteriler)

b) **Tüketiciler (Heterotrof Organizmalar)**
Besinlerini diğer canlılardan alan organizmalar:
- Birincil tüketiciler (otçullar)
- İkincil tüketiciler (etçiller)
- Üçüncül tüketiciler (üst düzey avcılar)

c) **Ayrıştırıcılar (Dekompozerler)**
Ölü organik maddeleri basit bileşiklere ayıran canlılar:
- Bakteriler
- Mantarlar
- Bazı böcekler

## Ekolojik İlişkiler

### Türler Arası İlişkiler

#### Yarışma (Kompetisyon)
İki veya daha fazla türün aynı kaynak için mücadele etmesi:

**Türler Arası Yarışma**: Farklı türler arasındaki rekabet
- Örnek: Aslanlar ve çitaların aynı av için yarışması
- Sonuç: Rekabet dışlanma ilkesi (competitive exclusion)

**Tür İçi Yarışma**: Aynı türün bireyleri arasındaki rekabet  
- Örnek: Aynı ağaç türünün bireylerinin ışık için yarışması
- Sonuç: Bölgesellik davranışı ve hiyerarşi oluşumu

#### Avcılık (Predation)
Bir türün (avcı) diğer türü (av) besin olarak tüketmesi:

**Avcı-Av Dinamikleri**:
1) Av popülasyonu artar → Avcı popülasyonu artar
2) Avcı popülasyonu artar → Av popülasyonu azalır  
3) Av popülasyonu azalır → Avcı popülasyonu azalır
4) Döngü tekrar başlar

#### Simbiyotik İlişkiler

**Mutualizm**: Her iki tür de fayda sağlar
- Örnek: Arı ve çiçek ilişkisi
- Arı nektar alır, çiçek tozlaşır

**Kommensalizm**: Bir tür fayda sağlar, diğeri etkilenmez
- Örnek: Köpekbalığı ve remora balığı
- Remora besin artıklarından faydalanır

**Parazitizm**: Bir tür fayda sağlar, diğeri zarar görür
- Örnek: Tenya ve insan ilişkisi
- Tenya besin alır, insan zarar görür

## Enerji Akışı ve Besin Zincirleri

### Enerji Piramidi
Ekosistemde enerji akışı tek yönlüdür ve her trofik düzeyde %90 enerji kaybı olur:

1. **Üreticiler**: %100 enerji (güneş enerjisi)
2. **Birincil Tüketiciler**: %10 enerji  
3. **İkincil Tüketiciler**: %1 enerji
4. **Üçüncül Tüketiciler**: %0.1 enerji

### Besin Ağları
Doğada besin zincirleri birbirine bağlı karmaşık ağlar oluşturur:

**Besin Zinciri Özellikleri**:
- Maksimum 4-5 trofik düzey bulunur
- Enerji kaybı nedeniyle üst düzeyler sınırlıdır
- Bir türün kaybı tüm ağı etkileyebilir

**Anahtar Türler (Keystone Species)**:
Ekosistem dengesinde kritik rol oynayan türlerdir. Bu türlerin kaybı:
- Besin ağının çökmesine neden olabilir
- Biyoçeşitlilikte dramatik azalmaya yol açar
- Ekosistemin yapısal değişimine sebep olur

Örneğin, deniz samurlarının kaybı kelp ormanlarının yok olmasına neden olmuştur.
""",
    "metadata": {
        "domain": "biology",
        "subdomain": "ecology",
        "difficulty_level": "university",
        "language_complexity": "complex", 
        "content_length": 3456,
        "expected_chunks": 9,
        "critical_structures": [
            "hierarchical_list_abiyotik_faktörler",
            "classification_list_biyotik_faktörler",
            "process_sequence_avcı_av_dinamikleri",
            "energy_pyramid_levels",
            "example_list_simbiyotik_ilişkiler"
        ],
        "turkish_patterns": [
            "classification_pattern: 'grupta incelenir'",
            "example_pattern: 'örneğin'", 
            "result_pattern: 'sonuç:'",
            "characteristic_pattern: 'özellikleri:'"
        ],
        "educational_patterns": [
            "component_classification",
            "relationship_explanation",
            "process_dynamics",
            "cause_effect_analysis"
        ]
    }
}
```

### 2.2 Chemistry Test Datasets

#### 2.2.1 Organic Chemistry Dataset

**Dataset: Organic Compound Classification**
```python
organic_chemistry_dataset = {
    "dataset_id": "chem_org_001",
    "title": "Organik Bileşik Sınıflandırması",
    "content": """
# Organik Bileşiklerin Sınıflandırılması

## Hidrokarbonlar

### Doymuş Hidrokarbonlar (Alkanlar)
Alkanlar sadece tekli bağ içeren hidrokarbonlardır ve CnH2n+2 genel formülüne sahiptir.

#### Alkan Serisi:
1) **Metan (CH₄)**: En basit alkan, doğal gazın ana bileşeni
2) **Etan (C₂H₆)**: İki karbonlu alkan, petrol gazında bulunur
3) **Propan (C₃H₈)**: Üç karbonlu alkan, tüp gazında kullanılır
4) **Bütan (C₄H₁₀)**: Dört karbonlu alkan, çakmak gazı olarak bilinir
5) **Pentan (C₅H₁₂)**: Beş karbonlu alkan, benzin bileşeni

#### Alkanların Özellikleri:
- **Fiziksel Özellikler**: Düşük kaynama noktası, suda çözünmez
- **Kimyasal Özellikler**: Düşük reaktivite, yanma reaksiyonu verir
- **Kullanım Alanları**: Yakıt, çözücü, hammadde

### Doymamış Hidrokarbonlar

#### Alkenler (CnH2n)
Bir çift bağ içeren hidrokarbonlardır:

a) **Eten (C₂H₄)**:
   - En basit alken
   - Plastik üretiminde kullanılır
   - Meyve olgunlaştırma hormonu

b) **Propen (C₃H₆)**:
   - Polipropilen üretiminde kullanılır
   - Petrokimya sanayisinde önemli

c) **Büten (C₄H₈)**:
   - İzomer çeşitleri vardır
   - Sentetik kauçuk üretiminde kullanılır

#### Alkinler (CnH2n-2)
Üçlü bağ içeren hidrokarbonlardır:

1) **Etkin (C₂H₂)**: Asetilen gazı, kaynak işlemlerinde kullanılır
2) **Propin (C₃H₄)**: Kimyasal sentezlerde ara ürün
3) **Bütin (C₄H₆)**: Organik sentezde kullanılır

## Fonksiyonel Grup İçeren Bileşikler

### Alkoller (R-OH)
Hidroksil grubu içeren organik bileşiklerdir:

#### Alkol Sınıflandırması:
**Birincil Alkoller**: -OH grubu birincil karbona bağlı
- Örnek: Etanol (C₂H₅OH)
- Özellik: Kolayca oksitlenir

**İkincil Alkoller**: -OH grubu ikincil karbona bağlı  
- Örnek: İzopropanol ((CH₃)₂CHOH)
- Özellik: Keton oluşturacak şekilde oksitlenir

**Üçüncül Alkoller**: -OH grubu üçüncül karbona bağlı
- Örnek: tert-Bütanol ((CH₃)₃COH)
- Özellik: Zor oksitlenir

### Karboksilik Asitler (R-COOH)
Karboksil grubu içeren asidik bileşiklerdir:

#### Önemli Karboksilik Asitler:

a) **Formik Asit (HCOOH)**:
   - En basit karboksilik asit
   - Karınca sokmasında bulunur
   - Deri sanayisinde kullanılır

b) **Asetik Asit (CH₃COOH)**:
   - Sirkenin ana bileşeni
   - Gıda koruyucusu olarak kullanılır
   - Selüloz asetat üretiminde hammadde

c) **Propiyonik Asit (C₂H₅COOH)**:
   - Gıda koruyucusu
   - Antifungal özellik gösterir

### Esterler (R-COO-R')
Karboksilik asit ve alkolün kondenzasyon ürünleridir:

#### Ester Oluşum Reaksiyonu:
R-COOH + R'-OH → R-COO-R' + H₂O

**Ester Özellikleri**:
- Genellikle hoş kokulu
- Meyve aromaları ester bileşikleridir
- Yağlar ve yağlı asitler ester yapısındadır

#### Önemli Esterler:
1) **Etil Asetat**: Çözücü olarak kullanılır
2) **Metil Salisilat**: Aspirin benzeri etki gösterir
3) **Gliserol Tristearat**: Katı yağların ana bileşeni

## Aromatik Bileşikler

### Benzen ve Türevleri
Benzen (C₆H₆) aromatik bileşiklerin temel yapısıdır:

#### Benzen Özellikleri:
- **Yapısal Özellik**: Düzlemsel, altıgen yapı
- **Elektronik Özellik**: Delokalize π elektron sistemi
- **Kararlılık**: Rezonans enerjisi nedeniyle kararlı
- **Reaktivite**: Elektrofilik sübstitüsyon reaksiyonları verir

#### Benzen Türevleri:

**Monosübstitüe Benzen Bileşikleri**:
- Toluol (C₆H₅CH₃): Çözücü, oktanı artırıcı
- Fenol (C₆H₅OH): Dezenfektan, plastik hammaddesi
- Anilin (C₆H₅NH₂): Boya sanayisinde kullanılır

**Disübstitüe Benzen Bileşikleri**:
- orto-Kresol: Dezenfektan özellik
- meta-Kresol: Antiseptik madde
- para-Kresol: Gıda koruyucusu

Bu bileşiklerin sübstitüent pozisyonları kimyasal özelliklerini önemli ölçüde etkiler.
""",
    "metadata": {
        "domain": "chemistry", 
        "subdomain": "organic_chemistry",
        "difficulty_level": "university",
        "language_complexity": "complex",
        "content_length": 3789,
        "expected_chunks": 10,
        "critical_structures": [
            "numbered_list_alkan_serisi",
            "classification_list_alkol_türleri", 
            "alphabetical_list_karboksilik_asitler",
            "chemical_formula_sequences",
            "property_classification_lists"
        ],
        "turkish_patterns": [
            "definition_pattern: 'olarak bilinir'",
            "classification_pattern: 'sınıflandırması:'",
            "property_pattern: 'özellikleri:'", 
            "example_pattern: 'örnek:'"
        ],
        "educational_patterns": [
            "systematic_classification",
            "property_description",
            "example_illustration",
            "structural_analysis"
        ]
    }
}
```

### 2.3 Physics Test Datasets

#### 2.3.1 Mechanics and Motion

**Dataset: Classical Mechanics**
```python
mechanics_dataset = {
    "dataset_id": "phys_mech_001",
    "title": "Klasik Mekanik ve Hareket Yasaları",
    "content": """
# Klasik Mekanik ve Hareket Yasaları

## Newton'un Hareket Yasaları

### Birinci Yasa: Eylemsizlik Yasası
Bir cisim üzerine net kuvvet etki etmediği sürece durgun halde kalır veya düzgün doğrusal hareket yapar.

#### Eylemsizlik Kavramı:
Eylemsizlik, cismin hareket durumunu değiştirmeye karşı gösterdiği dirençtir. Bu direnç cismin kütlesi ile doğru orantılıdır.

**Günlük Hayattan Örnekler**:
- Frenlenen araçta yolcuların öne doğru savrulması
- Hızlanan araçta yolcuların arkaya yaslanması  
- Masa örtüsünün hızla çekildiğinde tabakların yerinde kalması
- Durgun haldeki topun itilmediği sürece hareketsiz kalması

### İkinci Yasa: F = ma
Bir cisme etki eden net kuvvet, cismin kütlesi ile ivmesinin çarpımına eşittir.

#### Matematiksel İfade:
**Vektörel Form**: F⃗ = m·a⃗
**Skaler Form**: F = m·a (tek boyutlu hareket için)

#### Yasanın Sonuçları:
1) **Kuvvet ve İvme İlişkisi**: Kuvvet arttıkça ivme artar
2) **Kütle ve İvme İlişkisi**: Kütle arttıkça ivme azalır  
3) **Kuvvet Yönü**: İvme kuvvet yönünde oluşur
4) **Süperpozisyon İlkesi**: Net kuvvet, tüm kuvvetlerin vektörel toplamıdır

### Üçüncü Yasa: Etki-Tepki Yasası
Her etkiye eşit büyüklükte ve zıt yönde bir tepki vardır.

#### Yasa Örnekleri:

**Günlük Yaşam Örnekleri**:
- Yürürken ayağın yere uyguladığı kuvvet ve yerin ayağa uyguladığı tepki
- Roketin gazları geriye fırlatması ve roketin öne hareket etmesi
- Tabancadan çıkan merminin tepkisi ile tabancada oluşan geri tepme
- Yüzücünün suyu geriye itmesi ve suyun yüzücüyü öne itmesi

## Hareket Türleri ve Kinematik

### Düzgün Doğrusal Hareket
Sabit hızla gerçekleşen doğrusal harekettir.

#### Kinematik Denklemler:
- **Konum**: x = x₀ + v·t
- **Hız**: v = sabit
- **İvme**: a = 0

### Düzgün Değişen Doğrusal Hareket
Sabit ivme ile gerçekleşen doğrusal harekettir.

#### Kinematik Denklemler:

a) **Hız-Zaman İlişkisi**: v = v₀ + a·t

b) **Konum-Zaman İlişkisi**: x = x₀ + v₀·t + ½·a·t²

c) **Hız-Konum İlişkisi**: v² = v₀² + 2·a·(x - x₀)

d) **Ortalama Hız**: v̄ = (v₀ + v)/2

#### Serbest Düşme Hareketi:
Yerçekimi etkisinde gerçekleşen düzgün değişen harekettir:

**Serbest Düşme Özellikleri**:
- İvme: g = 9.8 m/s² (aşağı yönde)
- Başlangıç hızı: v₀ = 0 (serbest bırakılırsa)
- Hava direnci ihmal edilir
- Cismin kütlesi düşme süresini etkilemez

### Dairesel Hareket

#### Düzgün Dairesel Hareket
Sabit açısal hızla gerçekleşen dairesel harekettir.

**Kinematik Büyüklükler**:
- **Açısal Hız**: ω = 2π/T = 2πf
- **Doğrusal Hız**: v = ω·r  
- **Merkezcil İvme**: aₘ = v²/r = ω²·r
- **Merkezcil Kuvvet**: Fₘ = m·v²/r = m·ω²·r

#### Dairesel Hareket Örnekleri:
1) **Gezegen Hareketleri**: Güneş etrafındaki yörünge hareketi
2) **Santrifüj**: Merkezcil kuvvet uygulaması
3) **Viraj Alma**: Araçların dairesel yolda hareketi
4) **Çamaşır Makinesi**: Su atma işleminde dairesel hareket

## İş, Enerji ve Güç

### İş Kavramı
İş, bir kuvvetin cismi hareket ettirmesi sonucu yapılan fiziksel büyüklüktür.

#### İş Formülü:
**Genel Form**: W = F⃗ · s⃗ = F·s·cos(θ)
**Özel Durumlar**:
- θ = 0°: W = F·s (maksimum iş)
- θ = 90°: W = 0 (iş yapılmaz)
- θ = 180°: W = -F·s (negatif iş)

### Enerji Türleri

#### Kinetik Enerji
Hareket halindeki cismin sahip olduğu enerjidir:
**Formül**: Eₖ = ½·m·v²

#### Potansiyel Enerji
Cismin konumu nedeniyle sahip olduğu enerjidir:

**Yerçekimi Potansiyel Enerjisi**: Eₚ = m·g·h
**Elastik Potansiyel Enerji**: Eₚ = ½·k·x²

### Enerjinin Korunumu
İzole bir sistemde toplam mekanik enerji korunur:
**E_toplam = Eₖ + Eₚ = sabit**

Bu ilke birçok fiziksel olayın analizinde temel prensiptir.

### Güç
Birim zamanda yapılan iş miktarıdır:
**P = W/t = F·v**

Güç, makinelerin ve motorların performansını değerlendirmede kullanılır.
""",
    "metadata": {
        "domain": "physics",
        "subdomain": "mechanics", 
        "difficulty_level": "university",
        "language_complexity": "complex",
        "content_length": 4123,
        "expected_chunks": 11,
        "critical_structures": [
            "law_enumeration_newton_laws",
            "mathematical_formula_sequences",
            "example_lists_daily_life",
            "kinematic_equation_sets",
            "property_classification_motion_types"
        ],
        "turkish_patterns": [
            "law_pattern: 'yasası:'",
            "definition_pattern: 'olarak tanımlanır'",
            "example_pattern: 'örnekler:'",
            "formula_pattern: 'formül:'"
        ],
        "educational_patterns": [
            "law_statement_explanation",
            "mathematical_derivation", 
            "example_application",
            "concept_relationship"
        ]
    }
}
```

### 2.4 Mathematics Test Datasets

#### 2.4.1 Calculus and Analysis

**Dataset: Differential Calculus**
```python
calculus_dataset = {
    "dataset_id": "math_calc_001",
    "title": "Diferansiyel Kalkülüs",
    "content": """
# Diferansiyel Kalkülüs

## Limit Kavramı

### Limit Tanımı
Bir f(x) fonksiyonunun x = a noktasındaki limiti, x değeri a'ya yaklaşırken f(x) değerinin yaklaştığı sayıdır.

#### Matematiksel Tanım:
lim[x→a] f(x) = L ⟺ ∀ε > 0, ∃δ > 0 öyle ki |x - a| < δ ⟹ |f(x) - L| < ε

### Limit Türleri

#### Tek Taraflı Limitler:
a) **Soldan Limit**: lim[x→a⁻] f(x) = L₁
b) **Sağdan Limit**: lim[x→a⁺] f(x) = L₂

**Limit Varlık Koşulu**: lim[x→a] f(x) var ⟺ L₁ = L₂

#### Sonsuzda Limit:
- **Pozitif Sonsuzda**: lim[x→+∞] f(x)
- **Negatif Sonsuzda**: lim[x→-∞] f(x)

### Limit Hesaplama Yöntemleri

#### Temel Limit Kuralları:
1) **Toplam Kuralı**: lim[x→a] [f(x) + g(x)] = lim[x→a] f(x) + lim[x→a] g(x)
2) **Çarpım Kuralı**: lim[x→a] [f(x) · g(x)] = lim[x→a] f(x) · lim[x→a] g(x)
3) **Bölüm Kuralı**: lim[x→a] [f(x)/g(x)] = lim[x→a] f(x) / lim[x→a] g(x) (g(x) ≠ 0)

#### Belirsizlik Durumları:
Aşağıdaki durumlar belirsizlik oluşturur ve özel yöntemler gerektirir:

a) **0/0 Belirsizliği**:
   - L'Hôpital Kuralı uygulanır
   - Faktörleme yöntemi kullanılır
   - Rasyonelleştirme yapılır

b) **∞/∞ Belirsizliği**:
   - L'Hôpital Kuralı uygulanır
   - En yüksek dereceli terimler karşılaştırılır

c) **Diğer Belirsizlikler**: 0·∞, ∞-∞, 1^∞, 0^0, ∞^0

## Türev Kavramı

### Türev Tanımı
Bir f(x) fonksiyonunun x = a noktasındaki türevi, o noktadaki anlık değişim hızıdır.

#### Türev Tanımları:

**Limit Tanımı**: f'(a) = lim[h→0] [f(a+h) - f(a)]/h

**Geometrik Anlam**: Eğrinin x = a noktasındaki teğet doğrusunun eğimi

**Fiziksel Anlam**: Anlık hız (konum fonksiyonunun türevi)

### Türev Alma Kuralları

#### Temel Türev Formülleri:
1) **Sabit Fonksiyon**: (c)' = 0
2) **Güç Fonksiyonu**: (x^n)' = n·x^(n-1)
3) **Üstel Fonksiyon**: (e^x)' = e^x, (a^x)' = a^x·ln(a)
4) **Logaritma Fonksiyonu**: (ln x)' = 1/x, (log_a x)' = 1/(x·ln a)

#### Trigonometrik Fonksiyonların Türevleri:
- (sin x)' = cos x
- (cos x)' = -sin x  
- (tan x)' = sec²x = 1/cos²x
- (cot x)' = -csc²x = -1/sin²x

#### Türev Alma Kuralları:

a) **Toplam Kuralı**: [f(x) + g(x)]' = f'(x) + g'(x)

b) **Çarpım Kuralı**: [f(x)·g(x)]' = f'(x)·g(x) + f(x)·g'(x)

c) **Bölüm Kuralı**: [f(x)/g(x)]' = [f'(x)·g(x) - f(x)·g'(x)]/[g(x)]²

d) **Zincir Kuralı**: [f(g(x))]' = f'(g(x))·g'(x)

### Türevin Uygulamaları

#### Fonksiyon Analizi

**Artan-Azalan Fonksiyonlar**:
- f'(x) > 0 ⟹ f(x) artan
- f'(x) < 0 ⟹ f(x) azalan
- f'(x) = 0 ⟹ kritik nokta

**Yerel Ekstremum Noktaları**:
1) **Birinci Türev Testi**: 
   - f'(x) = 0 ve f'(x) işaret değiştiriyorsa ekstremum
   - Pozitiften negatife: yerel maksimum
   - Negatiften pozitife: yerel minimum

2) **İkinci Türev Testi**:
   - f'(a) = 0 ve f''(a) > 0 ⟹ yerel minimum
   - f'(a) = 0 ve f''(a) < 0 ⟹ yerel maksimum

#### Eğrilik ve Büküm Noktaları

**Konkavlık**:
- f''(x) > 0 ⟹ konkav yukarı (çukur)
- f''(x) < 0 ⟹ konkav aşağı (tümsek)

**Büküm Noktası**: f''(x) = 0 ve f''(x) işaret değiştiren nokta

#### Optimizasyon Problemleri
Türev kullanarak maksimum ve minimum değer problemleri çözülür:

**Çözüm Adımları**:
1) Problem durumunu matematiksel fonksiyon olarak ifade et
2) Fonksiyonun türevini al
3) f'(x) = 0 denklemini çöz (kritik noktalar)
4) İkinci türev testi veya işaret analizi yap
5) Sınır değerlerini kontrol et
6) Optimum değeri belirle

Bu yöntem mühendislik, ekonomi ve fizik problemlerinde yaygın olarak kullanılır.

## L'Hôpital Kuralı

### Kural İfadesi
0/0 veya ∞/∞ belirsizlik durumlarında:

lim[x→a] f(x)/g(x) = lim[x→a] f'(x)/g'(x)

(Sağ taraftaki limit varsa)

### Uygulama Koşulları:
1) f(a) = g(a) = 0 veya f(a) = g(a) = ±∞
2) f'(x) ve g'(x) a yakınında tanımlı
3) g'(x) ≠ 0 (a yakınında)
4) lim[x→a] f'(x)/g'(x) var

Kural gerektiğinde tekrar uygulanabilir ve karmaşık limit hesaplamalarında güçlü bir araçtır.
""",
    "metadata": {
        "domain": "mathematics",
        "subdomain": "calculus",
        "difficulty_level": "university",
        "language_complexity": "complex",
        "content_length": 4567,
        "expected_chunks": 12,
        "critical_structures": [
            "mathematical_definition_sequences",
            "formula_enumeration_lists",
            "rule_classification_systems", 
            "step_by_step_procedures",
            "condition_requirement_lists"
        ],
        "turkish_patterns": [
            "definition_pattern: 'olarak tanımlanır'",
            "condition_pattern: 'koşulu:'",
            "rule_pattern: 'kuralı:'",
            "application_pattern: 'uygulamaları'"
        ],
        "educational_patterns": [
            "mathematical_definition",
            "theorem_statement",
            "procedure_explanation",
            "application_demonstration"
        ]
    }
}
```

---

## 3. Social Sciences Test Datasets

### 3.1 History Test Datasets

#### 3.1.1 Ottoman History

**Dataset: Ottoman Empire Structure**
```python
ottoman_history_dataset = {
    "dataset_id": "hist_otto_001",
    "title": "Osmanlı İmparatorluğu Devlet Yapısı",
    "content": """
# Osmanlı İmparatorluğu Devlet Yapısı

## Yönetim Sistemi

### Merkezi Yönetim
Osmanlı İmparatorluğu güçlü bir merkezi yönetim sistemine sahipti ve tüm yetki padişahta toplanmıştı.

#### Padişah ve Yetkileri:
Padişah devletin başı olarak şu yetkilere sahipti:

a) **Yasama Yetkisi**: Kanunname çıkarma ve değiştirme
b) **Yürütme Yetkisi**: Devlet işlerini yönetme ve denetleme  
c) **Yargı Yetkisi**: Adalet dağıtma ve ceza verme
d) **Askeri Yetki**: Orduya komutanlık etme
e) **Dini Yetki**: İslam dininin koruyucusu olma

#### Divan-ı Hümayun:
Padişahın başkanlığında toplanan en yüksek devlet meclisiydi.

**Divan Üyeleri**:
- **Sadrazam**: Başvezir, padişahın vekili
- **Vezirler**: Devlet işlerinde padişaha yardımcı
- **Defterdar**: Maliye işlerinden sorumlu
- **Nişancı**: Fermanları mühürleyen
- **Kazaskerler**: Askeri ve ilmiye sınıfından sorumlu

### Taşra Yönetimi

#### İdari Bölünüş:
Osmanlı toprakları hiyerarşik olarak bölünmüştü:

1) **Eyalet**: En büyük idari birim
   - Beylerbeyi tarafından yönetilir
   - Birkaç sancaktan oluşur
   - Askeri ve idari merkez

2) **Sancak**: Eyaletin alt birimi
   - Sancakbeyi tarafından yönetilir
   - Birkaç kazadan oluşur
   - Bölgesel yönetim merkezi

3) **Kaza**: Sancağın alt birimi
   - Kadı tarafından yönetilir
   - Birkaç nahiyeden oluşur
   - Yerel yönetim birimi

4) **Nahiye**: En küçük idari birim
   - Müdür tarafından yönetilir
   - Köy ve kasabaları kapsar

## Sosyal Yapı

### Sınıf Sistemi
Osmanlı toplumu iki ana sınıfa ayrılıyordu:

#### Askeri Sınıf:
Devlete hizmet eden ve vergi vermeyen sınıftı.

**Alt Grupları**:
- **Seyfiye**: Kılıç erbabı (askerler, yöneticiler)
- **İlmiye**: Kalem erbabı (ulema, kadılar, müderrisler)
- **Kalemiye**: Bürokrasi erbabı (katip, defterdar)

#### Reaya Sınıfı:
Vergi veren ve devlete hizmet etmeyen halk sınıfıydı.

**Özellikleri**:
- Tarım, ticaret ve zanaat ile uğraşır
- Devlete vergi öder
- Askeri sınıfa geçiş mümkün
- Nüfusun büyük çoğunluğunu oluşturur

### Millet Sistemi
Osmanlı İmparatorluğu'nda farklı dinlere mensup topluluklar millet sistemi ile yönetilirdi.

#### Millet Özellikleri:

**Müslüman Milleti**:
- En geniş ve ayrıcalıklı millet
- Devlet yönetiminde söz sahibi
- Askeri sınıfa dahil olabilir

**Gayrimüslim Milletler**:
a) **Rum Milleti**: Ortodoks Hristiyanlar
   - Fener Rum Patriği başkanlığında
   - Ticaret ve zanaat ağırlıklı

b) **Ermeni Milleti**: Gregoryen Hristiyanlar  
   - Ermeni Patriği başkanlığında
   - Zanaat ve ticaret erbabı

c) **Yahudi Milleti**: Musevi toplum
   - Haham Başı liderliğinde
   - Ticaret ve bankacılık alanında aktif

## Ekonomik Yapı

### Toprak Sistemi

#### Timar Sistemi:
Osmanlı ekonomisinin temelini oluşturan toprak düzeniydi.

**Timar Türleri**:

1) **Timar**: 20.000 akçeye kadar geliri olan
   - Sipahi tarafından işletilir
   - Askeri hizmet karşılığı verilir
   - Miras yoluyla geçmez

2) **Zeamet**: 20.000-100.000 akçe geliri olan
   - Daha büyük askeri sorumluluk
   - Sancakbeyi düzeyinde yöneticiler
   - Daha fazla asker çıkarma yükümlülüğü

3) **Has**: 100.000 akçeden fazla geliri olan
   - Beylerbeyi ve üst düzey yöneticiler
   - En büyük askeri sorumluluk
   - Stratejik öneme sahip topraklar

#### Toprak Mülkiyeti:
- **Miri Arazi**: Devlete ait topraklar (%87)
- **Mülk Arazi**: Özel mülkiyet toprakları (%8)
- **Vakıf Arazi**: Dini vakıflara ait topraklar (%5)

### Ticaret ve Zanaat

#### Lonca Sistemi:
Zanaat ve ticaret lonca sistemi ile düzenlenmişti.

**Lonca Özellikleri**:
- Aynı meslek erbabını bir araya getirir
- Kalite kontrolü sağlar
- Fiyat istikrarını korur
- Üretim miktarını düzenler
- Sosyal dayanışma sağlar

**Lonca Hiyerarşisi**:
1) **Çırak**: Meslek öğrenen
2) **Kalfa**: Mesleği öğrenmiş yardımcı
3) **Usta**: Meslek sahibi, dükkân sahibi

#### Ticaret Yolları:
Osmanlı İmparatorluğu önemli ticaret yollarını kontrol ediyordu:

**Kara Yolları**:
- İpek Yolu: Asya-Avrupa ticareti
- Baharat Yolu: Hindistan-Avrupa ticareti
- Hac Yolu: Dini ve ticari amaçlı

**Deniz Yolları**:
- Karadeniz ticareti
- Akdeniz ticareti  
- Kızıldeniz-Hint Okyanusu bağlantısı

Bu ticaret yolları devlete büyük gelir sağlar ve ekonomik gücün temelini oluştururdu.
""",
    "metadata": {
        "domain": "history",
        "subdomain": "ottoman_history",
        "difficulty_level": "secondary",
        "language_complexity": "moderate",
        "content_length": 4234,
        "expected_chunks": 10,
        "critical_structures": [
            "hierarchical_list_administrative_divisions",
            "classification_list_social_classes",
            "enumeration_list_timar_types",
            "organizational_structure_divan",
            "categorical_list_trade_routes"
        ],
        "turkish_patterns": [
            "historical_pattern: 'tarafından yönetilir'",
            "classification_pattern: 'ayrılıyordu'",
            "characteristic_pattern: 'özellikleri:'",
            "system_pattern: 'sistemi'"
        ],
        "educational_patterns": [
            "institutional_description",
            "hierarchical_organization",
            "system_explanation",
            "historical_analysis"
        ]
    }
}
```

### 3.2 Geography Test Datasets

#### 3.2.1 Physical Geography

**Dataset: Climate and Weather Systems**
```python
geography_dataset = {
    "dataset_id": "geo_phys_001",
    "title": "İklim ve Hava Olayları",
    "content": """
# İklim ve Hava Olayları

## İklim Kavramı ve Faktörleri

### İklim Tanımı
İklim, bir yerin uzun yıllar boyunca (en az 30 yıl) gözlenen ortalama hava koşullarıdır.

#### İklim ve Hava Arasındaki Fark:
- **Hava**: Kısa süreli atmosfer koşulları (günlük, haftalık)
- **İklim**: Uzun süreli ortalama atmosfer koşulları (30+ yıl)

### İklim Faktörleri

#### Astronomik Faktörler:

a) **Enlem**: 
   - Güneş ışınlarının geliş açısını belirler
   - Ekvatordan kutuplara doğru sıcaklık azalır
   - Mevsimsel değişimleri etkiler

b) **Güneş Işınlarının Geliş Açısı**:
   - Dik gelen ışınlar daha fazla ısıtır
   - Eğik gelen ışınlar daha az ısıtır
   - Mevsimsel sıcaklık değişimlerinin nedeni

#### Coğrafi Faktörler:

**Yükselti**:
- Her 100 m yükselmede 0.6°C soğuma
- Dağlık alanlar daha soğuk
- Yer şekilleri yerel iklim oluşturur

**Denizlere Uzaklık**:
- Kıyı alanları: ılıman iklim
- İç kesimler: karasal iklim
- Denizler ısı düzenleyicisi görevi yapar

**Bitki Örtüsü**:
- Ormanlar nem oranını artırır
- Çöller kurak koşullar oluşturur
- Evapotranspirasyon ile iklimi etkiler

#### Dinamik Faktörler:

**Hava Kütleleri**:
- Soğuk hava kütleleri: sıcaklık düşürür
- Sıcak hava kütleleri: sıcaklık artırır
- Nemli/kuru hava kütleleri: yağış etkiler

**Basınç Merkezleri**:
- Alçak basınç: yağışlı, bulutlu hava
- Yüksek basınç: açık, güneşli hava
- Basınç gradyanı rüzgar oluşturur

## İklim Tipleri

### Dünya İklim Sınıflandırması

#### Köppen İklim Sınıflandırması:
Sıcaklık ve yağış verilerine dayalı sistematik sınıflandırma:

**A Grubu: Tropikal İklimler**
- **Af**: Tropikal yağmur ormanı iklimi
- **Am**: Tropikal muson iklimi  
- **Aw**: Tropikal savan iklimi

**B Grubu: Kurak İklimler**
- **BWh**: Sıcak çöl iklimi
- **BWk**: Soğuk çöl iklimi
- **BSh**: Sıcak step iklimi
- **BSk**: Soğuk step iklimi

**C Grubu: Ilıman İklimler**
- **Cfa**: Nemli subtropikal iklim
- **Cfb**: Okyanus iklimi
- **Csa**: Akdeniz iklimi
- **Csb**: Serin Akdeniz iklimi

**D Grubu: Soğuk İklimler**
- **Dfa**: Nemli kıtasal iklim
- **Dfb**: Serin nemli kıtasal iklim
- **Dfc**: Subarktik iklim

**E Grubu: Kutup İklimler**
- **ET**: Tundra iklimi
- **EF**: Buzul iklimi

### Türkiye'nin İklim Özellikleri

#### İklim Bölgeleri:

**Karadeniz İklimi**:
- **Konum**: Karadeniz kıyı şeridi
- **Özellikler**: Yıl boyunca yağışlı, ılıman
- **Sıcaklık**: Yazın 20-25°C, kışın 5-10°C
- **Yağış**: 1000-2500 mm/yıl
- **Bitki Örtüsü**: Yaprak döken ormanlar

**Akdeniz İklimi**:
- **Konum**: Güney kıyı şeridi
- **Özellikler**: Yazı sıcak-kurak, kışı ılık-yağışlı
- **Sıcaklık**: Yazın 25-30°C, kışın 10-15°C
- **Yağış**: 500-1200 mm/yıl (kış ağırlıklı)
- **Bitki Örtüsü**: Maki, garig, orman

**İç Anadolu İklimi**:
- **Konum**: Orta Anadolu platosunda
- **Özellikler**: Karasal iklim, sıcaklık farkları büyük
- **Sıcaklık**: Yazın 20-25°C, kışın -5 ile +5°C
- **Yağış**: 300-600 mm/yıl
- **Bitki Örtüsü**: Step, bozkır

**Doğu Anadolu İklimi**:
- **Konum**: Doğu Anadolu bölgesi
- **Özellikler**: Sert karasal iklim, uzun kışlar
- **Sıcaklık**: Yazın 15-20°C, kışın -10 ile -20°C
- **Yağış**: 400-800 mm/yıl
- **Bitki Örtüsü**: Step, alpin çayırlar

## Hava Olayları

### Yağış Türleri

#### Oluşum Mekanizmasına Göre:

a) **Konveksiyonel Yağış**:
   - Güneş ısıtması ile hava yükselir
   - Kümülonimbus bulutları oluşur
   - Sağanak şeklinde yağış
   - Tropikal bölgelerde yaygın

b) **Orografik Yağış**:
   - Hava kütlesi dağa çarparak yükselir
   - Rüzgar yönündeki yamaçta yağış
   - Dağ arkası gölge etkisi
   - Dağlık alanlarda görülür

c) **Frontal Yağış**:
   - Farklı hava kütlelerinin karşılaşması
   - Soğuk front: şiddetli, kısa süreli
   - Sıcak front: hafif, uzun süreli
   - Orta enlemlerde yaygın

#### Yağış Şekillerine Göre:

**Yağmur**: Sıvı halde yağış
- **Çisenti**: 0.5 mm/saat'ten az
- **Hafif Yağmur**: 0.5-4 mm/saat
- **Orta Şiddette**: 4-16 mm/saat
- **Şiddetli Yağmur**: 16+ mm/saat

**Kar**: Katı halde yağış
- Sıcaklık 0°C'nin altında
- Altıgen kristal yapısı
- Yoğunluk suya göre 1/10

**Dolu**: Buzlu yağış
- Kümülonimbus bulutlarında oluşur
- Çapı 5 mm'den büyük
- Tarımsal zararlara neden olur

### Rüzgar Sistemleri

#### Küresel Rüzgar Sistemleri:

**Ticaret Rüzgarları**:
- 30° kuzey ve güney enlemleri arasında
- Kuzeydoğu ve güneydoğu yönlü
- Düzenli ve sürekli esen rüzgarlar

**Batı Rüzgarları**:
- 30-60° enlemleri arasında
- Batıdan doğuya doğru esen
- Orta enlem iklimini etkiler

**Kutup Rüzgarları**:
- 60° enlemlerinden kutuplara
- Doğudan batıya doğru esen
- Soğuk ve kuru hava kütleleri taşır

#### Yerel Rüzgarlar:

**Kara-Deniz Meltemleri**:
- Gündüz: denizden karaya
- Gece: karadan denize
- Günlük sıcaklık farkından kaynaklanır

**Dağ-Vadi Rüzgarları**:
- Gündüz: vadiden dağa
- Gece: dağdan vadiye
- Yerel topografya etkisi

Bu rüzgar sistemleri bölgesel iklim koşullarını önemli ölçüde etkiler ve yerel hava durumu tahminlerinde dikkate alınır.
""",
    "metadata": {
        "domain": "geography",
        "subdomain": "physical_geography",
        "difficulty_level": "secondary",
        "language_complexity": "moderate",
        "content_length": 4567,
        "expected_chunks": 11,
        "critical_structures": [
            "classification_system_koppen",
            "regional_description_turkey_climate",
            "process_explanation_precipitation_types",
            "systematic_enumeration_wind_systems",
            "comparative_analysis_climate_factors"
        ],
        "turkish_patterns": [
            "definition_pattern: 'olarak tanımlanır'",
            "classification_pattern: 'göre:'",
            "regional_pattern: 'bölgesi'",
            "characteristic_pattern: 'özellikleri:'"
        ],
        "educational_patterns": [
            "systematic_classification",
            "regional_analysis",
            "process_explanation",
            "comparative_description"
        ]
    }
}
```

---

## 4. Technical Documentation Test Datasets

### 4.1 Computer Science Documentation

#### 4.1.1 Algorithm and Data Structures

**Dataset: Algorithm Analysis**
```python
computer_science_dataset = {
    "dataset_id": "cs_algo_001",
    "title": "Algoritma Analizi ve Veri Yapıları",
    "content": """
# Algoritma Analizi ve Veri Yapıları

## Algoritma Karmaşıklığı

### Zaman Karmaşıklığı (Time Complexity)
Bir algoritmanın çalışma süresinin girdi boyutuna göre nasıl değiştiğini gösteren ölçüttür.

#### Big O Notasyonu:
Algoritmanın en kötü durum performansını ifade eder:

a) **O(1) - Sabit Zaman**:
   - Girdi boyutundan bağımsız
   - Örnek: Dizi elemanına indeks ile erişim
   - En verimli zaman karmaşıklığı

b) **O(log n) - Logaritmik Zaman**:
   - Girdi boyutu ikiye katlandığında bir adım artar
   - Örnek: İkili arama algoritması
   - Çok verimli algoritmalarda görülür

c) **O(n) - Doğrusal Zaman**:
   - Girdi boyutu ile doğru orantılı
   - Örnek: Dizide doğrusal arama
   - Kabul edilebilir performans

d) **O(n log n) - Doğrusal-Logaritmik Zaman**:
   - Verimli sıralama algoritmalarının karmaşıklığı
   - Örnek: Merge Sort, Quick Sort (ortalama)
   - İyi performans kategorisi

e) **O(n²) - Karesel Zaman**:
   - Girdi boyutunun karesi ile orantılı
   - Örnek: Bubble Sort, Selection Sort
   - Büyük veriler için verimsiz

f) **O(2ⁿ) - Üstel Zaman**:
   - Girdi boyutu arttıkça exponansiyel artış
   - Örnek: Fibonacci (naive), Subset generation
   - Çok verimsiz, küçük girdiler için bile yavaş

### Uzay Karmaşıklığı (Space Complexity)
Algoritmanın kullandığı bellek miktarının girdi boyutuna göre değişimi:

#### Bellek Kullanım Türleri:
- **Sabit Uzay**: O(1) - Girdi boyutundan bağımsız
- **Doğrusal Uzay**: O(n) - Girdi boyutu ile orantılı
- **Karesel Uzay**: O(n²) - İki boyutlu yapılar için

## Temel Veri Yapıları

### Doğrusal Veri Yapıları

#### Dizi (Array):
Aynı türden elemanların ardışık bellek konumlarında saklandığı yapı.

**Özellikler**:
- **Erişim Zamanı**: O(1) - İndeks ile doğrudan erişim
- **Arama Zamanı**: O(n) - Doğrusal arama
- **Ekleme/Silme**: O(n) - Kaydırma işlemi gerekir
- **Bellek Kullanımı**: Verimli, ardışık konumlar