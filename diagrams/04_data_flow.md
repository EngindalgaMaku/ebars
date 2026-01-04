# Data Flow Diagram
# Bilimsel Makale için Veri Akış Diyagramı

## Figure 4: Agent Communication & Data Flow

```mermaid
flowchart TB
    subgraph InputData["Input Data Format"]
        DOC["Document\n{content: string,\nformat: 'pdf'|'md',\nmetadata: {...}}"]
    end
    
    subgraph Preprocessing["Preprocessing Stage"]
        NORM["Normalized Text\n{text: string,\nprotected_ranges: Range[],\nstructure_hints: {...}}"]
    end
    
    subgraph AgentComm["Agent Communication (Hub-and-Spoke)"]
        direction TB
        
        COORD_HUB["Coordinator\n(Central Hub)"]
        
        subgraph AgentNodes["Agent Nodes (Spokes)"]
            SA_NODE["Structural\nAgent"]
            SEM_NODE["Semantic\nAgent"]
            SIZE_NODE["Size\nAgent"]
            QA_NODE["Quality\nAgent"]
        end
        
        %% Hub-and-Spoke connections (no peer-to-peer)
        COORD_HUB <-->|"Request/Response"| SA_NODE
        COORD_HUB <-->|"Request/Response"| SEM_NODE
        COORD_HUB <-->|"Request/Response"| SIZE_NODE
        COORD_HUB <-->|"Request/Response"| QA_NODE
        
        %% No direct agent-to-agent communication
        note2["❌ No Peer-to-Peer\n✅ All via Coordinator"]
    end
    
    subgraph AgentOutput["Agent Output Format"]
        DECISION["AgentDecision {\n  agent_id: string,\n  decision: DecisionType,\n  confidence: float[0-1],\n  reasoning: string,\n  metadata: {...}\n}"]
    end
    
    subgraph FinalOutput["Final Output Format"]
        CHUNK["Chunk {\n  id: string,\n  content: string,\n  char_count: int,\n  word_count: int,\n  boundary_type: BoundaryType,\n  agent_decisions: AgentDecision[],\n  quality_score: float,\n  embedding: float[768],\n  metadata: ChunkMetadata\n}"]
    end
    
    DOC --> NORM
    NORM --> COORD_HUB
    AgentNodes --> DECISION
    DECISION --> COORD_HUB
    COORD_HUB --> CHUNK
    
    style COORD_HUB fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    style note2 fill:#fff3e0,stroke:#ff9800,stroke-dasharray: 5 5
```

## Figure 4b: Detailed Data Transformation Pipeline

```mermaid
flowchart LR
    subgraph Stage1["Stage 1: Input"]
        I1["Raw Document\n(PDF/Markdown)"]
    end
    
    subgraph Stage2["Stage 2: Extraction"]
        I2["Extracted Text\n+ Structure Metadata\n+ Protected Ranges"]
    end
    
    subgraph Stage3["Stage 3: Segmentation"]
        I3["Initial Segments\n(paragraph-level)"]
    end
    
    subgraph Stage4["Stage 4: Agent Analysis"]
        I4["Per-Segment:\n• Structural flags\n• Semantic embeddings\n• Size metrics\n• Quality scores"]
    end
    
    subgraph Stage5["Stage 5: Consensus"]
        I5["Boundary Decisions\n+ Confidence Scores\n+ Reasoning"]
    end
    
    subgraph Stage6["Stage 6: Output"]
        I6["Final Chunks\n+ Metadata\n+ Embeddings"]
    end
    
    I1 -->|"PDF Parser\nMarkdown AST"| I2
    I2 -->|"Segment\nExtractor"| I3
    I3 -->|"Parallel\nAgent Calls"| I4
    I4 -->|"Weighted\nConsensus"| I5
    I5 -->|"Chunk\nAssembly"| I6
    
    style I1 fill:#e3f2fd
    style I6 fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
```

## Communication Protocol

### Request Format (Coordinator → Agent)
```json
{
  "request_id": "uuid",
  "segment_id": "seg_001",
  "segment_text": "...",
  "context": {
    "previous_segment": "...",
    "next_segment": "...",
    "document_metadata": {...}
  },
  "config": {
    "target_chunk_size": 1500,
    "min_chunk_size": 500,
    "max_chunk_size": 3000
  }
}
```

### Response Format (Agent → Coordinator)
```json
{
  "request_id": "uuid",
  "agent_id": "structural_agent",
  "decision": "PRESERVE",
  "confidence": 0.95,
  "reasoning": "Code block detected (lines 5-25)",
  "metadata": {
    "detected_structures": ["code_block"],
    "protected_range": [120, 580],
    "analysis_time_ms": 45
  }
}
```

## Why Hub-and-Spoke Architecture?

| Aspect | Hub-and-Spoke (Our Choice) | Peer-to-Peer |
|--------|---------------------------|--------------|
| **Complexity** | O(n) connections | O(n²) connections |
| **Coordination** | Centralized, predictable | Distributed, complex |
| **Conflict Resolution** | Single point of decision | Consensus required |
| **Debugging** | Easy to trace | Difficult |
| **Scalability** | Add agents easily | Requires protocol changes |

**Rationale:** Hub-and-Spoke prevents chaos by ensuring all decisions flow through the Coordinator. This makes the system deterministic and easier to debug/audit.

## Figure 4 Caption (TR)
**Şekil 4: Ajan İletişimi ve Veri Akış Diyagramı.** Sistem, Hub-and-Spoke mimarisini kullanır: tüm ajanlar yalnızca Koordinatör üzerinden iletişim kurar (Peer-to-Peer yok). Bu tasarım, karar sürecini deterministik ve izlenebilir kılar. Her ajan, standart bir istek/yanıt protokolü kullanarak kararını ($d_i$), güven skorunu ($c_i$) ve gerekçesini iletir. Çıktı chunk'ları, ajan kararları, kalite skoru ve embedding ile zenginleştirilmiş metadata içerir.

## Figure 4 Caption (EN)
**Figure 4: Agent Communication and Data Flow Diagram.** The system uses Hub-and-Spoke architecture: all agents communicate only through the Coordinator (no Peer-to-Peer). This design makes the decision process deterministic and traceable. Each agent communicates its decision ($d_i$), confidence score ($c_i$), and reasoning using a standard request/response protocol. Output chunks contain enriched metadata including agent decisions, quality scores, and embeddings.
