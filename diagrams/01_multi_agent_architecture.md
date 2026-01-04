# Multi-Agent Chunking System Architecture
# Bilimsel Makale için Sistem Mimarisi Diyagramı

## Figure 1: Multi-Agent System Architecture

```mermaid
flowchart TB
    subgraph Input["Input Layer"]
        DOC[/"Document\n(PDF/Markdown)"/]
        PREPROC["Preprocessing\n& Normalization"]
    end
    
    subgraph Segmentation["Initial Segmentation"]
        SEG["Segment Extractor"]
        PROTECT["Protected Range\nDetector"]
    end
    
    subgraph AgentLayer["Multi-Agent Decision Layer (Hub-and-Spoke)"]
        direction TB
        
        subgraph Agents["Specialized Agents (Parallel Execution)"]
            SA["Structural\nAgent\n(w₁=0.35)"]
            SEM["Semantic\nAgent\n(w₂=0.30)"]
            SIZE["Size\nAgent\n(w₃=0.20)"]
            QA["Quality\nAgent\n(w₄=0.15)"]
        end
        
        COORD["Coordinator Agent\n(Orchestrator)"]
        CONSENSUS["Weighted Consensus\nCalculator"]
        CONFLICT["Conflict\nResolver"]
    end
    
    subgraph Output["Output Layer"]
        CHUNKS[/"Final Chunks"/]
        META["Metadata Enricher\n(boundaries, scores,\nagent decisions)"]
        EMB["Embedding\nGenerator"]
        QUALITY["Quality\nMetrics"]
    end
    
    subgraph Feedback["Iterative Improvement Loop"]
        EVAL["Quality\nEvaluation"]
        REFINE["Chunk\nRefinement"]
    end
    
    DOC --> PREPROC
    PREPROC --> SEG
    SEG --> PROTECT
    PROTECT --> SA & SEM & SIZE & QA
    
    SA --> COORD
    SEM --> COORD
    SIZE --> COORD
    QA --> COORD
    
    COORD --> CONSENSUS
    CONSENSUS --> CONFLICT
    CONFLICT --> CHUNKS
    CHUNKS --> META
    META --> EMB
    EMB --> QUALITY
    
    %% Feedback Loop (Iterative Improvement)
    QUALITY --> EVAL
    EVAL -->|"score < θ_quality"| REFINE
    REFINE -->|"Re-analyze"| QA
    EVAL -->|"score ≥ θ_quality"| FINAL[/"Approved\nChunks"/]
    
    style SA fill:#e3f2fd,stroke:#1976d2
    style SEM fill:#f3e5f5,stroke:#7b1fa2
    style SIZE fill:#fff3e0,stroke:#f57c00
    style QA fill:#e8f5e9,stroke:#388e3c
    style COORD fill:#fce4ec,stroke:#c2185b
    style EVAL fill:#fff3e0,stroke:#ff9800
    style REFINE fill:#ffcdd2,stroke:#c62828
    style FINAL fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
```

## Notation Table (Notasyon Tablosu)

| Symbol | Description (EN) | Açıklama (TR) | Range/Values |
|--------|------------------|---------------|--------------|
| $w_i$ | Weight of agent $i$ | Ajan $i$'nin ağırlığı | $[0, 1]$, $\sum w_i = 1$ |
| $c_i$ | Confidence score of agent $i$ | Ajan $i$'nin güven skoru | $[0, 1]$ |
| $d_i$ | Decision of agent $i$ | Ajan $i$'nin kararı | $\{SPLIT, MERGE, PRESERVE, ...\}$ |
| $\theta_{quality}$ | Quality threshold | Kalite eşik değeri | Default: $0.6$ |
| $I[\cdot]$ | Indicator function | İndikatör fonksiyonu | $\{0, 1\}$ |

## Data Flow Specification

```
Input Document → [Text + Structure Metadata]
     ↓
Preprocessing → [Normalized Text + Protected Ranges]
     ↓
Agent Analysis → [Decision + Confidence + Reasoning] per agent
     ↓
Coordinator → [Aggregated Score + Final Decision]
     ↓
Output Chunk → {
    content: string,
    metadata: {
        chunk_id: string,
        boundary_type: "natural" | "semantic" | "forced",
        agent_decisions: AgentDecision[],
        quality_score: float,
        embedding: float[768]
    }
}
```

## Figure 1 Caption (TR)
**Şekil 1: Çok-Ajanlı Metin Parçalama Sistemi Mimarisi.** Sistem dört uzmanlaşmış ajandan oluşmaktadır: Yapısal Ajan ($w_1$=0.35) atomik birimleri korur, Semantik Ajan ($w_2$=0.30) konu tutarlılığını analiz eder, Boyut Ajanı ($w_3$=0.20) chunk boyutlarını yönetir ve Kalite Ajanı ($w_4$=0.15) çıktı kalitesini değerlendirir. Koordinatör Ajan, Hub-and-Spoke mimarisinde orkestrasyon yaparak ağırlıklı konsensüs hesaplar. **İteratif İyileştirme Döngüsü** kalite eşiğini ($\theta_{quality}$) karşılamayan chunk'ları yeniden değerlendirir. Çıktı, metadata ve embedding ile zenginleştirilmiş chunk'lardır.

## Figure 1 Caption (EN)
**Figure 1: Multi-Agent Text Chunking System Architecture.** The system comprises four specialized agents: Structural Agent ($w_1$=0.35) preserves atomic units, Semantic Agent ($w_2$=0.30) analyzes topic coherence, Size Agent ($w_3$=0.20) manages chunk sizes, and Quality Agent ($w_4$=0.15) evaluates output quality. The Coordinator Agent orchestrates via Hub-and-Spoke architecture, computing weighted consensus. The **Iterative Improvement Loop** re-evaluates chunks failing the quality threshold ($\theta_{quality}$). Output chunks are enriched with metadata and embeddings.
