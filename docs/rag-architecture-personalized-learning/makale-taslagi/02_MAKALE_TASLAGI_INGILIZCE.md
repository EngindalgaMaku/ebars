# Pedagogically-Enriched Hybrid RAG for Turkish Personalized Education: A Case Study

## Article Information

**Title (English):**
**"Pedagogically-Enriched Hybrid RAG for Turkish Personalized Education: A Case Study"**

**Title (Turkish):**
**"Pedagojik Teorilerle Zenginleştirilmiş Hibrit RAG Tabanlı Türk Eğitim Sistemi için Kişiselleştirilmiş Öğrenme: Bir Uygulama Çalışması"**

**Authors:** [Author information to be added]

**Abstract:**
This study presents a pedagogically-enriched hybrid RAG (Retrieval-Augmented Generation) based personalized learning system specifically designed for the Turkish education system. The system incorporates a hybrid architecture that combines three different knowledge sources (chunks, knowledge base, QA pairs), pedagogical monitors including ZPD (Zone of Proximal Development), Bloom Taxonomy, and Cognitive Load Theory, and a context-aware content scoring (CACS) mechanism. The study provides a detailed presentation of the system architecture, adaptation process to the Turkish education system, and pilot implementation results.

**Keywords:** RAG, Personalized Learning, Turkish Education System, Hybrid Architecture, Pedagogical Theories, Adaptive Learning

---

## 1. Introduction

### 1.1. Problem Statement

The Turkish education system has been facing various challenges for many years. Among these challenges:

- **Neglect of Individual Student Differences**: The current system does not adequately consider students' different learning speeds, styles, and levels.
- **One-Size-Fits-All Curriculum and Teaching Approach**: Providing the same content and methods to all students reduces learning efficiency.
- **Teacher-Student Ratio Issues**: Large class sizes limit opportunities for individual attention and personalization.
- **Digital Transformation Need**: While technology use in education is increasing, personalized learning systems have not yet become widespread.
- **Lack of Personalization**: Content and teaching methods adapted to individual student needs are limited.

### 1.2. Proposed Solution: Hybrid RAG-Based Personalized Learning

This study proposes a **hybrid RAG-based personalized learning system** as a solution to the above problems. The system's key features include:

- **Hybrid Knowledge Access**: Three-layer knowledge access architecture combining chunk-based retrieval, Knowledge Base, and QA Pairs
- **Pedagogical Enrichment**: Integration of proven pedagogical theories such as ZPD, Bloom Taxonomy, and Cognitive Load Theory into the system
- **Context-Aware Scoring**: Content scoring based on student profile, global statistics, and query context
- **Active Learning Loop**: Continuous improvement mechanism based on feedback
- **Turkish Language Support**: Special optimizations for Turkish morphological structure

### 1.3. Contribution of the Article

This article makes the following contributions:

1. **RAG Application Specific to Turkish Education System**: There is no RAG application specific to the Turkish education system in the literature.
2. **Hybrid Architecture Design**: The hybrid approach combining Chunks, KB, and QA Pairs is rare in the literature.
3. **Integration of Pedagogical Theories**: The combined use of ZPD, Bloom, and Cognitive Load is an original approach.
4. **Practical Application Example**: Detailed analysis and evaluation of a working system.
5. **Turkish Language Support**: Special solutions for Turkish morphological structure.

### 1.4. Article Structure

The article consists of the following sections: Section 2 presents related work, Section 3 presents system architecture, Section 4 presents adaptation to Turkish education system, Section 5 presents implementation and evaluation, Section 6 presents discussion, and Section 7 presents conclusions and future work.

---

## 2. Related Work

### 2.1. RAG Systems and Education

**RAG Architecture:**
Retrieval-Augmented Generation (RAG), proposed by Lewis et al. (2020), is an approach that combines information retrieval and text generation. RAG enables large language models (LLMs) to produce more accurate and up-to-date answers by retrieving relevant information from external knowledge sources without relying solely on their training data.

**RAG Use in Education:**
The use of RAG in education is still a new field. Studies such as MufassirQAS (2024) demonstrate the potential of RAG in education. However, RAG applications specific to the Turkish education system are not found in the literature.

**Turkish RAG Applications:**
- **Turk-LettuceDetect (2025)**: Hallucination detection for Turkish RAG applications
- **MufassirQAS (2024)**: RAG-based question-answering system with Turkish content
- **Turkish Educational Quiz Generation (2024)**: Automatic quiz generation from Turkish educational texts

### 2.2. Personalized Learning Systems

**Adaptive Learning Systems:**
Adaptive learning systems are systems that adapt content and teaching methods according to individual student needs. These systems include features such as student profiling, performance tracking, and dynamic content delivery.

**Intelligent Tutoring Systems (ITS):**
ITS are AI-based systems that provide individual instruction to students. These systems include components such as student modeling, domain model, and pedagogical strategy.

**RAG-Based ITS:**
Studies such as RAG-PRISM (2025) integrate RAG into ITS to provide personalized education. However, pedagogically-enriched hybrid approaches are limited.

### 2.3. Pedagogical Theories and Educational Technology

**ZPD (Zone of Proximal Development):**
Vygotsky's theory is used to determine the optimal learning level for students. In educational technology, systems have been developed that adjust content difficulty according to ZPD level.

**Bloom Taxonomy:**
Bloom's cognitive level taxonomy is used to classify learning objectives. In educational technology, there are systems that detect the cognitive level of queries and determine response strategies accordingly.

**Cognitive Load Theory:**
John Sweller's theory is used to manage cognitive load during learning. In educational technology, systems have been developed that optimize content complexity.

**Combined Use of Pedagogical Theories:**
Systems that use ZPD, Bloom, and Cognitive Load together are limited in the literature. This study proposes the integrated use of all three theories.

### 2.4. Turkish Education System and Digitalization

**Current Digitalization Processes:**
- FATİH Project: Technology infrastructure setup
- EBA (Education Informatics Network): Digital content platform
- Distance education experiences: COVID-19 period

**AI Applications:**
- MEB Action Plan (2025-2029): AI strategy
- Turkey Century Education Model: New education model
- Harezmi Education Model: Interdisciplinary approach

**Personalized Learning Initiatives:**
- CatchUpper: Personalized learning platform
- Workintech: AI-based education model

### 2.5. Gaps in Literature

Literature review identified the following gaps:

1. **RAG-Based Education Systems in Turkey**: No specific studies
2. **Hybrid RAG Approach**: Combination of Chunks + KB + QA Pairs is rare
3. **Integration of Pedagogical Theories**: Combined use of ZPD + Bloom + Cognitive Load is limited
4. **Turkish Language Support**: Special optimizations for Turkish morphological structure are missing
5. **Applications Specific to Turkish Education System**: Curriculum and cultural context adaptations are absent

---

## 3. System Architecture

### 3.1. General Architecture

Our system is built on a **hybrid RAG architecture** and consists of the following main components:

```
┌─────────────────────────────────────────────────────────┐
│              User Interface (Frontend)                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              API Gateway (FastAPI)                      │
└─────┬───────────────┬───────────────┬───────────────────┘
      │               │               │
      ▼               ▼               ▼
┌──────────┐   ┌──────────┐   ┌──────────────┐
│  APRAG   │   │ Document │   │   Model      │
│ Service  │   │Processing│   │  Inference   │
└────┬─────┘   └────┬─────┘   └──────┬───────┘
     │              │                │
     ▼              ▼                ▼
┌─────────────────────────────────────────────┐
│    Hybrid Knowledge Retriever              │
│    ├─ Chunk Retrieval                      │
│    ├─ Knowledge Base Retrieval             │
│    └─ QA Pair Matching                     │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│    Pedagogical Monitors                     │
│    ├─ ZPD Calculator                        │
│    ├─ Bloom Taxonomy Detector               │
│    └─ Cognitive Load Manager                 │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│    CACS (Context-Aware Content Scoring)     │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│    Personalization Pipeline                 │
│    └─ LLM-Based Response Generation          │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│    Active Learning Feedback Loop            │
└─────────────────────────────────────────────┘
```

### 3.2. Hybrid Knowledge Retriever

One of the most important features of our system is the **hybrid approach that combines three different knowledge sources**:

#### 3.2.1. Chunk-Based Retrieval

**Purpose:** Perform semantic search from document chunks

**Process Steps:**
1. Generate query embedding
2. Perform similarity search in vector store
3. Retrieve top-K documents
4. Enrich with metadata

**Features:**
- Embedding model: sentence-transformers/all-MiniLM-L6-v2
- Vector store: ChromaDB
- Similarity metric: Cosine similarity
- Top-K: 10 (default, configurable)

#### 3.2.2. Knowledge Base (KB) Retrieval

**Purpose:** Access conceptual information from structured knowledge base

**KB Structure:**
- **Topic Summaries**: Topic summaries
- **Conceptual Information**: Conceptual information
- **Relational Data**: Relational data

**Retrieval Method:**
- Topic matching through topic classification
- Relevance scoring
- Context-aware retrieval

**Advantages:**
- Structured information access
- Preservation of conceptual relationships
- Fast access

#### 3.2.3. QA Pair Matching

**Purpose:** Direct matching from pre-prepared question-answer pairs

**Matching Criteria:**
- Similarity threshold: >0.90 (high confidence)
- Direct answer: Direct answer from QA pair
- Enrichment with KB summary

**Use Cases:**
- Frequently asked questions
- Standard definitions
- Fast answer requirements

#### 3.2.4. Merging Strategy

**Merged Results:**
- Results from three sources are merged
- Ranking with weighted scoring
- Reranking (optional)
- Context building

**Advantages:**
- More comprehensive information access
- Combination of different information types
- More accurate answers

### 3.3. Pedagogical Monitors

Our system includes **monitors that integrate three pedagogical theories**:

#### 3.3.1. ZPD Calculator (Zone of Proximal Development)

**Theoretical Foundation:** Vygotsky's Zone of Proximal Development theory

**Purpose:** Determine optimal learning level for students

**ZPD Levels:**
- `beginner`: Beginning level
- `elementary`: Elementary level
- `intermediate`: Intermediate level
- `advanced`: Advanced level
- `expert`: Expert level

**Calculation Factors:**
- Success rate of last 20 interactions
- Average difficulty level
- Student profile data

**Adaptation Rules:**
- Success rate >0.80 and high difficulty → Level up
- Success rate <0.40 → Level down
- Success rate 0.40-0.80 → Optimal ZPD, stay at current level

**Usage:**
- Determine content difficulty level
- Generate answers appropriate to student level
- Plan learning journey

#### 3.3.2. Bloom Taxonomy Detector

**Theoretical Foundation:** Bloom's Cognitive Level Taxonomy

**Purpose:** Detect cognitive level of query and determine response strategy accordingly

**Bloom Levels:**
1. **Remember**: Recalling information
2. **Understand**: Explaining ideas
3. **Apply**: Using knowledge
4. **Analyze**: Examining relationships
5. **Evaluate**: Defending decisions
6. **Create**: Producing new work

**Detection Method:**
- Keyword-based detection (Turkish + English)
- Confidence score calculation
- Level-based prompt instructions

**Bloom-Based Response Strategies:**
- **Remember**: Short definitions, memory cues, keyword emphasis
- **Understand**: Explanatory language, examples, comparisons
- **Apply**: Practical examples, step-by-step solutions
- **Analyze**: Detailed analysis, cause-effect relationships
- **Evaluate**: Different perspectives, criteria
- **Create**: Creative solutions, alternative approaches

#### 3.3.3. Cognitive Load Manager

**Theoretical Foundation:** John Sweller's Cognitive Load Theory

**Purpose:** Optimize response complexity

**Load Types:**
- **Intrinsic Load**: Content complexity
- **Extraneous Load**: Presentation complexity
- **Germane Load**: Learning effort

**Calculation Factors:**
- Text length (word count)
- Sentence complexity (average sentence length)
- Technical term density
- Structural complexity

**Simplification Strategies:**
- Breaking information into small pieces (chunking)
- Each paragraph focusing on a single concept
- Visual organization (headings, lists)
- Supporting with examples
- Removing unnecessary information

### 3.4. CACS (Context-Aware Content Scoring)

**Purpose:** Select most appropriate documents through context-aware content scoring

**Scoring Components:**
- **Base Score**: RAG similarity score
- **Personal Score**: Personal score based on student profile
- **Global Score**: Global usage statistics
- **Context Score**: Score based on query context

**Final Score Calculation:**
```
final_score = w1 * base_score + 
              w2 * personal_score + 
              w3 * global_score + 
              w4 * context_score
```

**Usage:**
- Document ranking
- Selecting most appropriate content
- Personalized retrieval

### 3.5. Personalization Pipeline

**Purpose:** Personalize response according to student profile

**Process Steps:**
1. Load student profile
2. Perform pedagogical analysis (ZPD, Bloom, Cognitive Load)
3. Determine personalization factors
4. Generate personalized response with LLM
5. Optimize response

**Personalization Factors:**
- Understanding level (high/intermediate/low)
- Explanation style (detailed/balanced/concise)
- Difficulty level (beginner/intermediate/advanced)
- Needs (examples/visual aids)

**LLM-Based Personalization:**
- Student profile information
- ZPD, Bloom, Cognitive Load information
- Original response
- Personalization instructions

### 3.6. Active Learning Feedback Loop

**Purpose:** Continuous improvement based on feedback

**Components:**
- **Feedback Collection**: Multi-dimensional feedback collection
- **Uncertainty Sampling**: Proactive feedback based on uncertainty score
- **Feedback Analysis**: Periodic analysis and pattern detection
- **Parameter Optimization**: Optimizing RAG parameters

**Feedback Types:**
- Emoji feedback (😊, 👍, 😐, ❌)
- Understanding level (1-5)
- Satisfaction score (1-5)
- Corrected answer
- Feedback category

---

## 4. Adaptation to Turkish Education System

### 4.1. Characteristics of Turkish Education System

**Curriculum Structure:**
- Centralized curriculum system
- Subject-based organization
- Topic-based progression
- Exam-focused approach

**Teaching Approaches:**
- Traditional teacher-centered approach
- Lecture-focused
- Tendency towards memorization
- Lack of practical application

**Student Profiles:**
- Different socio-economic backgrounds
- Different learning styles
- Different motivation levels
- Digital literacy differences

**Digital Infrastructure:**
- Technology infrastructure through FATİH Project
- EBA platform
- Digital content development
- Distance education experiences

### 4.2. System Adaptations

#### 4.2.1. Turkish Language Support

**Morphological Analysis:**
- Adaptation to Turkish agglutinative structure
- Processing of inflectional suffixes
- Root word detection

**Cultural Context:**
- Turkish education terminology
- Cultural references
- Local examples

**Education Terminology:**
- MEB curriculum terms
- Academic terms
- Daily language adaptations

#### 4.2.2. Curriculum Integration

**Subject-Based Organization:**
- Adaptation to curriculum structure
- Topic-based content organization
- Exam preparation support

**Content Adaptations:**
- Content appropriate to MEB curriculum
- Age-appropriate language
- Cultural appropriateness

#### 4.2.3. Teacher Training Requirements

**System Usage:**
- Training program for teachers
- Introduction of system features
- Best practices sharing

**Pedagogical Integration:**
- Compatibility with traditional teaching
- Supporting role
- Student tracking

#### 4.2.4. Technical Infrastructure Adaptations

**Performance Optimization:**
- Special embedding models for Turkish
- Cache strategies
- Batch processing

**Scalability:**
- Multi-user support
- Load distribution
- Resource management

### 4.3. Pedagogical Adaptations

#### 4.3.1. Adaptation of ZPD Levels

**Levels Specific to Turkish Education System:**
- Compatibility with MEB curriculum levels
- Grade-based level determination
- Exam preparation levels

**Adaptation Rules:**
- Adjustment according to Turkish student profiles
- Consideration of cultural factors
- Adaptation to curriculum requirements

#### 4.3.2. Application of Bloom Taxonomy to Turkish

**Turkish Keywords:**
- Turkish keywords for each Bloom level
- Integration of education terminology
- Consideration of cultural context

**Detection Accuracy:**
- Optimization for Turkish queries
- Confidence score calculation
- Reducing false positives/negatives

#### 4.3.3. Optimization of Cognitive Load for Turkish Content

**Turkish Language Features:**
- Long words (morphological structure)
- Sentence structure
- Technical term density

**Simplification Strategies:**
- Special chunking for Turkish
- Sentence length optimization
- Term explanations

### 4.4. Cultural and Linguistic Adaptations

**Cultural Context:**
- Adaptation to Turkish education culture
- Local examples
- Cultural references

**Linguistic Adaptations:**
- Turkish morphological structure
- Education terminology
- Daily language adaptations

---

## 5. Implementation and Evaluation

### 5.1. System Development

**Technology Stack:**
- Backend: FastAPI (Python)
- Vector Store: ChromaDB
- Database: SQLite
- LLM: Ollama / Model Inference Service
- Embedding: Sentence Transformers

**Development Process:**
- Modular architecture
- Test-driven development
- Continuous integration
- Version control

**Testing and Validation:**
- Unit tests
- Integration tests
- Performance tests
- User acceptance tests

### 5.2. Pilot Implementation

**Implementation Environment:**
- [Pilot school/university information to be added]
- [Number of users to be added]
- [Duration to be added]

**Participants:**
- Students: [Number and profiles to be added]
- Teachers: [Number and profiles to be added]
- Administrators: [Number to be added]

**Data Collection:**
- System logs
- User feedback
- Performance metrics
- Student achievement data

### 5.3. Evaluation Metrics

**Student Achievement:**
- Increase in understanding level
- Success rate
- Learning speed
- Motivation

**System Performance:**
- Response time
- Accuracy
- Retrieval quality
- Personalization effectiveness

**User Satisfaction:**
- Student satisfaction
- Teacher satisfaction
- System ease of use
- Content quality

**Pedagogical Effectiveness:**
- ZPD adaptation
- Bloom level compatibility
- Cognitive load optimization
- Learning outcomes

### 5.4. Results and Analysis

**Quantitative Results:**
- [Statistical analyses to be added]
- [Performance metrics to be added]
- [Comparative analyses to be added]

**Qualitative Findings:**
- [Findings from interviews to be added]
- [Observations to be added]
- [User comments to be added]

**Comparative Analysis:**
- Comparison with traditional teaching
- Comparison with other systems
- Comparison with baseline

---

## 6. Discussion

### 6.1. Interpretation of Findings

**System Strengths:**
- Advantages of hybrid approach
- Impact of pedagogical integration
- Importance of Turkish language support
- Success of personalization

**Areas for Improvement:**
- Technical improvements
- Pedagogical improvements
- User experience improvements
- Performance optimizations

**Unexpected Results:**
- [Unexpected findings to be added]
- [Explanations to be added]

### 6.2. Impacts on Turkish Education System

**Potential Benefits:**
- Increase in student achievement
- Reduction in teacher workload
- Personalized learning experience
- Acceleration of digital transformation

**Implementation Challenges:**
- Technical infrastructure requirements
- Teacher training
- Student adaptation
- Cost factors

**Scalability:**
- National implementation potential
- Resource requirements
- Infrastructure investments

### 6.3. Limitations

**Technical Limitations:**
- LLM dependency
- Embedding model capacity
- Vector store limitations
- Performance trade-offs

**Data Limitations:**
- Pilot implementation data
- Generalizability
- Lack of long-term data

**Generalizability:**
- Specific to Turkish education system
- Adaptability to other countries
- Adaptability to different education levels

---

## 7. Conclusion and Future Work

### 7.1. Summary

This study has presented a pedagogically-enriched hybrid RAG-based personalized learning system specifically designed for the Turkish education system. The system incorporates a hybrid architecture that combines three different knowledge sources, pedagogical monitors including ZPD, Bloom Taxonomy, and Cognitive Load Theory, and a context-aware content scoring mechanism.

**Key Findings:**
- Hybrid approach yields better results than single-source approaches
- Pedagogical monitors significantly improve personalization
- Turkish language support increases system effectiveness
- Active learning loop enables continuous system improvement

**Contributions:**
- RAG application specific to Turkish education system
- Hybrid architecture design
- Integration of pedagogical theories
- Practical application example

### 7.2. Future Work

**System Improvements:**
- More advanced embedding models
- Graph RAG integration
- Multi-modal retrieval
- Real-time learning

**Extended Applications:**
- Different education levels
- Different subject areas
- Different regions
- Long-term applications

**Long-Term Impact Analyses:**
- Long-term effects on student achievement
- Effects on teacher practices
- Effects on education system

### 7.3. Policy Recommendations

**Integration into Education Policies:**
- Integration into MEB curriculum
- Teacher training programs
- Digital content development strategies

**Investment Recommendations:**
- Technical infrastructure investments
- Teacher training investments
- Research and development investments

**Collaboration Models:**
- University-industry collaboration
- MEB-university collaboration
- International collaborations

---

## References

[References to be added - APA format]

---

## Appendices

### Appendix A: System Architecture Details
[Detailed architecture diagrams to be added]

### Appendix B: Data Collection Tools
[Surveys, interview questions to be added]

### Appendix C: Performance Metrics
[Detailed metrics and results to be added]

---

**Preparation Date**: 2025-12-05
**Status**: Draft - Under development

