# Consensus Mechanism
# Bilimsel Makale için Konsensüs Mekanizması Diyagramı

## Figure 3: Weighted Consensus Calculation

```mermaid
flowchart LR
    subgraph Inputs["Agent Decisions"]
        D1["Structural: PRESERVE\nconfidence: 0.95"]
        D2["Semantic: MERGE\nconfidence: 0.82"]
        D3["Size: ALLOW_SPLIT\nconfidence: 0.70"]
        D4["Quality: APPROVED\nconfidence: 0.88"]
    end
    
    subgraph Weights["Agent Weights"]
        W1["w₁ = 0.35"]
        W2["w₂ = 0.30"]
        W3["w₃ = 0.20"]
        W4["w₄ = 0.15"]
    end
    
    subgraph Calculation["Score Calculation"]
        SPLIT_SCORE["Split Score =\nΣ(wᵢ × cᵢ × split_vote)"]
        MERGE_SCORE["Merge Score =\nΣ(wᵢ × cᵢ × merge_vote)"]
    end
    
    subgraph Conflict["Conflict Resolution"]
        CR["Priority Rules:\n1. PRESERVE > SPLIT\n2. FORCE_SPLIT > MERGE\n3. FORCE_MERGE > SPLIT\n4. REJECTED → Improve"]
    end
    
    subgraph Output["Final Decision"]
        FINAL["Decision: PRESERVE\nConfidence: 0.95\nReasoning: Atomic unit"]
    end
    
    D1 --> W1 --> SPLIT_SCORE
    D2 --> W2 --> MERGE_SCORE
    D3 --> W3 --> SPLIT_SCORE
    D4 --> W4 --> MERGE_SCORE
    
    SPLIT_SCORE --> CR
    MERGE_SCORE --> CR
    CR --> FINAL
    
    style D1 fill:#e3f2fd
    style D2 fill:#f3e5f5
    style D3 fill:#fff3e0
    style D4 fill:#e8f5e9
    style FINAL fill:#fce4ec,stroke:#c2185b,stroke-width:2px
```

## Figure 3b: Decision Type Hierarchy

```mermaid
graph TD
    subgraph Priority["Decision Priority (High to Low)"]
        P1["1. PRESERVE\n(Atomic units must stay intact)"]
        P2["2. FORCE_SPLIT\n(Size limit exceeded)"]
        P3["3. FORCE_MERGE\n(Chunk too small)"]
        P4["4. REJECTED\n(Quality threshold not met)"]
        P5["5. SPLIT / MERGE\n(Consensus-based)"]
        P6["6. NEUTRAL\n(No strong signal)"]
    end
    
    P1 --> P2 --> P3 --> P4 --> P5 --> P6
    
    style P1 fill:#ffeb3b,stroke:#f57f17
    style P2 fill:#ff5722,stroke:#bf360c
    style P3 fill:#4caf50,stroke:#1b5e20
    style P4 fill:#f44336,stroke:#b71c1c
    style P5 fill:#2196f3,stroke:#0d47a1
    style P6 fill:#9e9e9e,stroke:#424242
```

## Figure 3 Caption (TR)
**Şekil 3: Ağırlıklı Konsensüs Hesaplama Mekanizması.** Her ajan kendi kararını (SPLIT, MERGE, PRESERVE, vb.) ve güven skorunu üretir. Koordinatör Ajan, ajan ağırlıklarını (Yapısal: 0.35, Semantik: 0.30, Boyut: 0.20, Kalite: 0.15) kullanarak ağırlıklı skor hesaplar. Çakışma durumunda öncelik kuralları uygulanır: PRESERVE en yüksek önceliğe sahiptir çünkü atomik birimler (kod blokları, tablolar) bölünemez.

## Figure 3 Caption (EN)
**Figure 3: Weighted Consensus Calculation Mechanism.** Each agent produces its decision (SPLIT, MERGE, PRESERVE, etc.) and confidence score. The Coordinator Agent calculates weighted scores using agent weights (Structural: 0.35, Semantic: 0.30, Size: 0.20, Quality: 0.15). In case of conflicts, priority rules apply: PRESERVE has highest priority as atomic units (code blocks, tables) cannot be split.

## Mathematical Formulation

### Consensus Score Calculation
```
Split_Score = Σᵢ (wᵢ × cᵢ × I[dᵢ ∈ {SPLIT, FORCE_SPLIT, ALLOW_SPLIT}])
Merge_Score = Σᵢ (wᵢ × cᵢ × I[dᵢ ∈ {MERGE, FORCE_MERGE}])

where:
  wᵢ = weight of agent i
  cᵢ = confidence of agent i
  dᵢ = decision of agent i
  I[·] = indicator function
```

### Final Decision
```
Decision = 
  PRESERVE,     if any agent returns PRESERVE with high confidence
  FORCE_SPLIT,  if Size Agent detects chunk > 1.3 × max_size
  FORCE_MERGE,  if Size Agent detects chunk < 0.5 × min_size
  SPLIT,        if Split_Score > Merge_Score AND Split_Score ≥ threshold
  MERGE,        if Merge_Score > Split_Score AND Merge_Score ≥ threshold
  NEUTRAL,      otherwise
```
