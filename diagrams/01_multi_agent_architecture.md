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
    
    subgraph AgentLayer["Multi-Agent Decision Layer"]
        direction TB
        
        subgraph Agents["Specialized Agents"]
            SA["Structural\nAgent\n(w=0.35)"]
            SEM["Semantic\nAgent\n(w=0.30)"]
            SIZE["Size\nAgent\n(w=0.20)"]
            QA["Quality\nAgent\n(w=0.15)"]
        end
        
        COORD["Coordinator Agent"]
        CONSENSUS["Weighted Consensus\nCalculator"]
        CONFLICT["Conflict\nResolver"]
    end
    
    subgraph Output["Output Layer"]
        CHUNKS[/"Final Chunks"/]
        META["Metadata\nEnricher"]
        QUALITY["Quality\nMetrics"]
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
    META --> QUALITY
    
    style SA fill:#e3f2fd,stroke:#1976d2
    style SEM fill:#f3e5f5,stroke:#7b1fa2
    style SIZE fill:#fff3e0,stroke:#f57c00
    style QA fill:#e8f5e9,stroke:#388e3c
    style COORD fill:#fce4ec,stroke:#c2185b
```

## Figure 1 Caption (TR)
**Şekil 1: Çok-Ajanlı Metin Parçalama Sistemi Mimarisi.** Sistem dört uzmanlaşmış ajandan oluşmaktadır: Yapısal Ajan (w=0.35) atomik birimleri korur, Semantik Ajan (w=0.30) konu tutarlılığını analiz eder, Boyut Ajanı (w=0.20) chunk boyutlarını yönetir ve Kalite Ajanı (w=0.15) çıktı kalitesini değerlendirir. Koordinatör Ajan, ağırlıklı konsensüs hesaplayarak nihai kararı verir.

## Figure 1 Caption (EN)
**Figure 1: Multi-Agent Text Chunking System Architecture.** The system comprises four specialized agents: Structural Agent (w=0.35) preserves atomic units, Semantic Agent (w=0.30) analyzes topic coherence, Size Agent (w=0.20) manages chunk sizes, and Quality Agent (w=0.15) evaluates output quality. The Coordinator Agent computes weighted consensus to determine final decisions.
