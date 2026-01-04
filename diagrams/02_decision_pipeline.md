# Decision Pipeline Flow
# Bilimsel Makale için Karar Akış Diyagramı

## Figure 2: Boundary Decision Pipeline

```mermaid
flowchart TD
    START([Segment Boundary\nDetected]) --> CHECK{Boundary\nCheck Required?}
    
    CHECK -->|"chunk_size > target\nOR header detected"| ANALYZE
    CHECK -->|No| IMPLICIT["Implicit MERGE\n(No boundary added)"]
    
    subgraph ANALYZE["Agent Analysis Phase"]
        direction TB
        A1["Structural Analysis\n• Code block detection\n• Table detection\n• List detection\n• Mermaid/diagram detection"]
        A2["Semantic Analysis\n• Embedding similarity\n• Topic drift detection\n• Cross-reference check\n• Q&A pair detection"]
        A3["Size Analysis\n• Min/Max check\n• Target size comparison\n• Overlap calculation"]
        A4["Quality Analysis\n• Content coherence\n• Word diversity\n• Sentence structure"]
    end
    
    ANALYZE --> WEIGHT["Weighted Score\nCalculation"]
    
    WEIGHT --> CONSENSUS{"Consensus\nDecision"}
    
    CONSENSUS -->|"score ≥ threshold"| SPLIT["SPLIT\n(Add boundary)"]
    CONSENSUS -->|"score < threshold"| MERGE["MERGE\n(Keep together)"]
    CONSENSUS -->|"structural preserve"| PRESERVE["PRESERVE\n(Atomic unit)"]
    
    subgraph FORCE["Force Conditions"]
        F1["FORCE_SPLIT\nchunk > 130% max_size"]
        F2["FORCE_MERGE\nchunk < 50% min_size"]
    end
    
    SPLIT --> OUTPUT
    MERGE --> OUTPUT
    PRESERVE --> OUTPUT
    IMPLICIT --> OUTPUT
    
    OUTPUT([Final Chunk\nBoundary])
    
    style SPLIT fill:#ffcdd2,stroke:#c62828
    style MERGE fill:#c8e6c9,stroke:#2e7d32
    style PRESERVE fill:#fff9c4,stroke:#f9a825
    style IMPLICIT fill:#e1f5fe,stroke:#0277bd
```

## Figure 2 Caption (TR)
**Şekil 2: Sınır Karar Akış Diyagramı.** Her segment sınırında, sistem dört ajanın analizini değerlendirir. Yapısal Ajan atomik birimleri (kod blokları, tablolar, diyagramlar) tespit eder. Semantik Ajan embedding benzerliği ve konu sürekliliğini analiz eder. Boyut Ajanı chunk boyut kısıtlamalarını kontrol eder. Ağırlıklı konsensüs sonucuna göre SPLIT, MERGE veya PRESERVE kararı verilir.

## Figure 2 Caption (EN)
**Figure 2: Boundary Decision Flow Diagram.** At each segment boundary, the system evaluates analyses from four agents. Structural Agent detects atomic units (code blocks, tables, diagrams). Semantic Agent analyzes embedding similarity and topic continuity. Size Agent checks chunk size constraints. Based on weighted consensus, a SPLIT, MERGE, or PRESERVE decision is made.
