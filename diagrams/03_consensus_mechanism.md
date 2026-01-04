# Consensus Mechanism
# Bilimsel Makale için Konsensüs Mekanizması Diyagramı

## Figure 3: Weighted Consensus Calculation

```mermaid
flowchart LR
    subgraph Inputs["Agent Decisions (dᵢ, cᵢ)"]
        D1["Structural: PRESERVE\nconfidence: 0.95"]
        D2["Semantic: MERGE\nconfidence: 0.82"]
        D3["Size: ALLOW_SPLIT\nconfidence: 0.70"]
        D4["Quality: APPROVED\nconfidence: 0.88"]
    end
    
    subgraph Weights["Agent Weights (wᵢ)"]
        W1["w₁ = 0.35\n(Structural)"]
        W2["w₂ = 0.30\n(Semantic)"]
        W3["w₃ = 0.20\n(Size)"]
        W4["w₄ = 0.15\n(Quality)"]
        WSUM["Σwᵢ = 1.0"]
    end
    
    subgraph Calculation["Score Calculation"]
        SPLIT_SCORE["Split Score =\nΣ(wᵢ × cᵢ × I[dᵢ ∈ Split_Set])"]
        MERGE_SCORE["Merge Score =\nΣ(wᵢ × cᵢ × I[dᵢ ∈ Merge_Set])"]
    end
    
    subgraph Conflict["Conflict Resolution (Priority Rules)"]
        CR["Hard Constraints (Cannot Override):\n1. PRESERVE → Atomic unit detected\n2. FORCE_SPLIT → size > 1.3×max\n3. FORCE_MERGE → size < 0.5×min\n\nSoft Constraints (Consensus-based):\n4. SPLIT if split_score ≥ θ\n5. MERGE if merge_score > split_score"]
    end
    
    subgraph Output["Final Decision"]
        FINAL["Decision: PRESERVE\nConfidence: 0.95\nReasoning: Atomic unit\n(Table detected by\nStructural Agent)"]
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
    style CR fill:#fff8e1,stroke:#ff8f00
```

## Figure 3b: Decision Type Hierarchy (Hard vs Soft Constraints)

```mermaid
graph TD
    subgraph HardConstraints["Hard Constraints (Baskın Kurallar)"]
        direction TB
        H1["🔒 PRESERVE\n(Atomic units: code, table, list)\nReason: Bölünürse anlam kaybı"]
        H2["⚠️ FORCE_SPLIT\n(chunk > 1.3 × max_size)\nReason: LLM context limit"]
        H3["⚠️ FORCE_MERGE\n(chunk < 0.5 × min_size)\nReason: Çok küçük = anlamsız"]
        H4["❌ REJECTED\n(quality_score < θ_quality)\nReason: Kalite yetersiz"]
    end
    
    subgraph SoftConstraints["Soft Constraints (Konsensüs Tabanlı)"]
        direction TB
        S1["✂️ SPLIT\n(split_score ≥ θ)\nConsensus-based decision"]
        S2["🔗 MERGE\n(merge_score > split_score)\nConsensus-based decision"]
        S3["⚖️ NEUTRAL\n(No strong signal)\nDefault: keep current state"]
    end
    
    H1 -->|"Overrides all"| S1
    H1 -->|"Overrides all"| S2
    H2 -->|"Overrides"| S2
    H3 -->|"Overrides"| S1
    H4 -->|"Triggers"| IMPROVE["Iterative\nImprovement"]
    
    style H1 fill:#ffeb3b,stroke:#f57f17,stroke-width:2px
    style H2 fill:#ff5722,stroke:#bf360c
    style H3 fill:#4caf50,stroke:#1b5e20
    style H4 fill:#f44336,stroke:#b71c1c
    style S1 fill:#2196f3,stroke:#0d47a1
    style S2 fill:#9c27b0,stroke:#4a148c
    style S3 fill:#9e9e9e,stroke:#424242
    style IMPROVE fill:#fff3e0,stroke:#ff9800
```

## Case Study: Conflict Resolution Example

```
Scenario: A code block is detected within a large chunk

Agent Decisions:
  - Structural Agent: PRESERVE (confidence: 0.95) ← Code block detected
  - Semantic Agent: SPLIT (confidence: 0.78) ← Topic change detected
  - Size Agent: FORCE_SPLIT (confidence: 0.85) ← Chunk exceeds max_size
  - Quality Agent: APPROVED (confidence: 0.72)

Conflict Analysis:
  1. Structural Agent says PRESERVE (atomic unit)
  2. Size Agent says FORCE_SPLIT (hard constraint)
  
Resolution:
  → PRESERVE wins because atomic units cannot be split
  → The chunk will exceed size limit but maintain semantic integrity
  → Quality Agent will flag for potential improvement in next iteration

Final Decision: PRESERVE
Reasoning: "Code block integrity takes precedence over size constraints"
```

## Figure 3 Caption (TR)
**Şekil 3: Ağırlıklı Konsensüs Hesaplama Mekanizması.** Her ajan kendi kararını ($d_i$) ve güven skorunu ($c_i$) üretir. Koordinatör Ajan, ajan ağırlıklarını ($w_1$=0.35, $w_2$=0.30, $w_3$=0.20, $w_4$=0.15, $\sum w_i = 1$) kullanarak ağırlıklı skor hesaplar. **Hard Constraints** (PRESERVE, FORCE_SPLIT, FORCE_MERGE) soft constraint'leri geçersiz kılar. PRESERVE en yüksek önceliğe sahiptir çünkü atomik birimler (kod blokları, tablolar) bölündüğünde anlam kaybı yaşanır. Case study örneğinde görüldüğü gibi, boyut limiti aşılsa bile kod bloğu bütünlüğü korunur.

## Figure 3 Caption (EN)
**Figure 3: Weighted Consensus Calculation Mechanism.** Each agent produces its decision ($d_i$) and confidence score ($c_i$). The Coordinator Agent calculates weighted scores using agent weights ($w_1$=0.35, $w_2$=0.30, $w_3$=0.20, $w_4$=0.15, $\sum w_i = 1$). **Hard Constraints** (PRESERVE, FORCE_SPLIT, FORCE_MERGE) override soft constraints. PRESERVE has highest priority as splitting atomic units (code blocks, tables) causes semantic loss. As shown in the case study, code block integrity is preserved even when size limits are exceeded.

## Mathematical Formulation

### Notation Table

| Symbol | Definition | Domain |
|--------|------------|--------|
| $w_i$ | Weight of agent $i$ | $[0, 1]$, $\sum_{i=1}^{4} w_i = 1$ |
| $c_i$ | Confidence score of agent $i$ | $[0, 1]$ |
| $d_i$ | Decision of agent $i$ | $\{SPLIT, MERGE, PRESERVE, FORCE\_SPLIT, FORCE\_MERGE, NEUTRAL\}$ |
| $\theta$ | Consensus threshold | Default: $0.5$ |
| $I[\cdot]$ | Indicator function | $\{0, 1\}$ |

### Consensus Score Calculation
```
Split_Score = Σᵢ (wᵢ × cᵢ × I[dᵢ ∈ {SPLIT, FORCE_SPLIT, ALLOW_SPLIT}])
Merge_Score = Σᵢ (wᵢ × cᵢ × I[dᵢ ∈ {MERGE, FORCE_MERGE}])

where:
  Split_Set = {SPLIT, FORCE_SPLIT, ALLOW_SPLIT}
  Merge_Set = {MERGE, FORCE_MERGE}
```

### Final Decision Algorithm
```
function decide(agent_decisions, agent_confidences, agent_weights):
    # Step 1: Check Hard Constraints (Priority Order)
    if any(d == PRESERVE for d in agent_decisions):
        return PRESERVE  # Atomic unit - cannot split
    
    if SIZE_AGENT.decision == FORCE_SPLIT:
        return FORCE_SPLIT  # Size limit exceeded
    
    if SIZE_AGENT.decision == FORCE_MERGE:
        return FORCE_MERGE  # Chunk too small
    
    if QUALITY_AGENT.decision == REJECTED:
        return REJECTED  # Quality threshold not met
    
    # Step 2: Calculate Consensus Scores
    split_score = Σ(wᵢ × cᵢ × I[dᵢ ∈ Split_Set])
    merge_score = Σ(wᵢ × cᵢ × I[dᵢ ∈ Merge_Set])
    
    # Step 3: Apply Soft Constraints
    if split_score ≥ θ and split_score > merge_score:
        return SPLIT
    elif merge_score > split_score:
        return MERGE
    else:
        return NEUTRAL
```
