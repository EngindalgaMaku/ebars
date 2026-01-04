# Decision Pipeline Flow
# Bilimsel Makale için Karar Akış Diyagramı

## Figure 2: Boundary Decision Pipeline

```mermaid
flowchart TD
    START([Segment Boundary\nDetected]) --> CHECK{Boundary\nCheck Required?}
    
    CHECK -->|"chunk_size > target\nOR header detected"| ANALYZE
    CHECK -->|No| IMPLICIT["Implicit MERGE\n(No boundary added)"]
    
    subgraph ANALYZE["Parallel Agent Analysis Phase"]
        direction TB
        note1["⚡ All agents execute in parallel\nLatency: O(max(agent_time))"]
        A1["Structural Analysis\n• Code block detection\n• Table detection\n• List detection\n• Mermaid/diagram detection"]
        A2["Semantic Analysis\n• Embedding similarity\n• Topic drift detection\n• Cross-reference check\n• Q&A pair detection"]
        A3["Size Analysis\n• Min/Max check\n• Target size comparison\n• Overlap calculation"]
        A4["Quality Analysis\n• Content coherence\n• Word diversity\n• Sentence structure"]
    end
    
    ANALYZE --> WEIGHT["Weighted Score Calculation\nθ (threshold) = 0.5"]
    
    WEIGHT --> ATOMIC{"Structural Agent\ndetected atomic unit?"}
    
    ATOMIC -->|"Yes (code/table/list)"| PRESERVE["PRESERVE\n(Atomic unit - cannot split)"]
    ATOMIC -->|"No"| CONSENSUS{"Consensus\nDecision\nscore ≥ θ?"}
    
    CONSENSUS -->|"split_score ≥ 0.5"| SPLIT["SPLIT\n(Add boundary)"]
    CONSENSUS -->|"merge_score > split_score"| MERGE["MERGE\n(Keep together)"]
    
    subgraph FORCE["Force Conditions (Hard Constraints)"]
        F1["FORCE_SPLIT\nchunk > 130% max_size\n(θ_max = 1.3)"]
        F2["FORCE_MERGE\nchunk < 50% min_size\n(θ_min = 0.5)"]
    end
    
    SPLIT --> FORCE_CHECK{"Force\nCondition?"}
    MERGE --> FORCE_CHECK
    PRESERVE --> OUTPUT
    IMPLICIT --> OUTPUT
    
    FORCE_CHECK -->|"size > θ_max × max"| F1
    FORCE_CHECK -->|"size < θ_min × min"| F2
    FORCE_CHECK -->|"No force needed"| OUTPUT
    
    F1 --> OUTPUT
    F2 --> OUTPUT
    
    OUTPUT([Final Chunk\nBoundary])
    
    style SPLIT fill:#ffcdd2,stroke:#c62828
    style MERGE fill:#c8e6c9,stroke:#2e7d32
    style PRESERVE fill:#fff9c4,stroke:#f9a825
    style IMPLICIT fill:#e1f5fe,stroke:#0277bd
    style note1 fill:#f5f5f5,stroke:#9e9e9e,stroke-dasharray: 5 5
```

## Threshold Parameters (Eşik Değerleri)

| Parameter | Symbol | Default Value | Description |
|-----------|--------|---------------|-------------|
| Consensus Threshold | $\theta$ | 0.5 | Minimum score for SPLIT decision |
| Force Split Ratio | $\theta_{max}$ | 1.3 | Chunk size / max_size ratio triggering force split |
| Force Merge Ratio | $\theta_{min}$ | 0.5 | Chunk size / min_size ratio triggering force merge |
| Quality Threshold | $\theta_{quality}$ | 0.6 | Minimum quality score for approval |

## Computational Complexity

```
Time Complexity:
- Sequential Agent Execution: O(n × k) where n = segments, k = agents
- Parallel Agent Execution: O(n × max(agent_time)) ← Our approach

Space Complexity: O(n × d) where d = embedding dimension (768)

Latency Optimization:
- Agents run in parallel (asyncio/threading)
- Early exit on PRESERVE detection (structural agent)
- Cached embeddings for repeated segments
```

## Figure 2 Caption (TR)
**Şekil 2: Sınır Karar Akış Diyagramı.** Her segment sınırında, sistem dört ajanın analizini **paralel olarak** değerlendirir (gecikme optimizasyonu). Yapısal Ajan atomik birimleri (kod blokları, tablolar, diyagramlar) tespit ettiğinde, diğer ajanların kararlarından bağımsız olarak **PRESERVE** kararı önceliklidir. Konsensüs eşiği $\theta=0.5$ olup, bu değerin üzerindeki split skorları SPLIT kararına yol açar. Zorlama koşulları (FORCE_SPLIT: chunk > %130 max, FORCE_MERGE: chunk < %50 min) hard constraint olarak uygulanır.

## Figure 2 Caption (EN)
**Figure 2: Boundary Decision Flow Diagram.** At each segment boundary, the system evaluates analyses from four agents **in parallel** (latency optimization). When Structural Agent detects atomic units (code blocks, tables, diagrams), **PRESERVE** decision takes priority regardless of other agents' decisions. Consensus threshold is $\theta=0.5$; split scores above this trigger SPLIT decision. Force conditions (FORCE_SPLIT: chunk > 130% max, FORCE_MERGE: chunk < 50% min) are applied as hard constraints.
