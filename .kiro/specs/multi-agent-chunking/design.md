# Multi-Agent Chunking System - Design Document

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    COORDINATOR AGENT                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Orchestration & Consensus                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│         │              │              │              │           │
│         ▼              ▼              ▼              ▼           │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │STRUCTURAL│   │ SEMANTIC │   │   SIZE   │   │ QUALITY  │     │
│  │  AGENT   │   │  AGENT   │   │  AGENT   │   │  AGENT   │     │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘     │
│         │              │              │              │           │
│         └──────────────┴──────────────┴──────────────┘           │
│                              │                                   │
│                    ┌─────────▼─────────┐                        │
│                    │  CONSENSUS ENGINE │                        │
│                    └───────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## Agent Responsibilities

### 1. Structural Agent
- **Purpose**: Detect and preserve atomic document units
- **Input**: Raw text segment + boundary position
- **Output**: StructuralDecision (PRESERVE/ALLOW_SPLIT)
- **Logic**: Pattern matching for code, tables, lists, headers

### 2. Semantic Agent  
- **Purpose**: Analyze topic coherence and semantic boundaries
- **Input**: Text segments + embeddings
- **Output**: SemanticDecision (SPLIT/MERGE/NEUTRAL)
- **Logic**: Embedding similarity + LLM reasoning

### 3. Size Agent
- **Purpose**: Enforce size constraints
- **Input**: Current chunk size + config limits
- **Output**: SizeDecision (OK/FORCE_SPLIT/FORCE_MERGE)
- **Logic**: Rule-based size calculations

### 4. Quality Agent
- **Purpose**: Validate chunk quality
- **Input**: Final chunk candidate
- **Output**: QualityDecision (APPROVED/REJECTED + score)
- **Logic**: LLM-based quality assessment

### 5. Coordinator Agent
- **Purpose**: Orchestrate agents and resolve conflicts
- **Input**: All agent decisions
- **Output**: Final boundary decision
- **Logic**: Priority rules + weighted consensus

## Data Flow

```
Input Text
    │
    ▼
┌───────────────────┐
│ Text Segmentation │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ For each boundary │◄────────────────────────┐
└─────────┬─────────┘                         │
          │                                   │
    ┌─────┴─────┐                            │
    │           │                            │
    ▼           ▼                            │
┌────────┐ ┌────────┐                        │
│Struct. │ │Semantic│  (parallel)            │
│ Agent  │ │ Agent  │                        │
└───┬────┘ └───┬────┘                        │
    │          │                             │
    └────┬─────┘                             │
         ▼                                   │
    ┌─────────┐                              │
    │  Size   │                              │
    │  Agent  │                              │
    └────┬────┘                              │
         │                                   │
         ▼                                   │
┌─────────────────┐                          │
│   Coordinator   │                          │
│   (Consensus)   │                          │
└────────┬────────┘                          │
         │                                   │
         ▼                                   │
┌─────────────────┐                          │
│ Quality Agent   │                          │
└────────┬────────┘                          │
         │                                   │
    ┌────┴────┐                              │
    │         │                              │
    ▼         ▼                              │
APPROVED   REJECTED ──► Improvement Loop ────┘
    │
    ▼
Final Chunks
```

## Protocol Messages

### AgentMessage
```python
@dataclass
class AgentMessage:
    id: str                    # Unique message ID
    correlation_id: str        # Links related messages
    sender: str                # Agent name
    receiver: str              # Target agent name
    message_type: MessageType  # REQUEST/RESPONSE/DECISION/FEEDBACK
    payload: Dict[str, Any]    # Message content
    timestamp: datetime
    metadata: Dict[str, Any]
```

### AgentDecision
```python
@dataclass
class AgentDecision:
    agent_name: str
    decision_type: str         # SPLIT/MERGE/PRESERVE/APPROVED/REJECTED
    confidence: float          # 0.0 - 1.0
    reasoning: str             # Human-readable explanation
    metrics: Dict[str, float]  # Agent-specific metrics
    suggestions: List[str]     # Improvement suggestions
```

## Conflict Resolution Matrix

| Structural | Semantic | Size | Result |
|------------|----------|------|--------|
| PRESERVE | SPLIT | OK | PRESERVE (atomic unit) |
| PRESERVE | SPLIT | FORCE_SPLIT | SMART_SPLIT (find safe point) |
| ALLOW | SPLIT | OK | SPLIT |
| ALLOW | MERGE | OK | MERGE |
| ALLOW | MERGE | FORCE_SPLIT | SPLIT (size priority) |
| ALLOW | SPLIT | FORCE_MERGE | MERGE (size priority) |

## LLM Prompts

### Semantic Agent Prompt
```
You are a semantic analysis agent for RAG text chunking.

Analyze the boundary between these two text segments:

SEGMENT A (ending):
{segment_a}

SEGMENT B (starting):
{segment_b}

Evaluate:
1. Topic continuity (0-1): Are they discussing the same topic?
2. Referential links: Does B reference content in A?
3. Logical flow: Is there a natural break point?

Respond in JSON:
{
  "decision": "SPLIT" | "MERGE",
  "confidence": 0.0-1.0,
  "topic_continuity": 0.0-1.0,
  "has_references": true/false,
  "reasoning": "explanation"
}
```

### Quality Agent Prompt
```
You are a quality validation agent for RAG chunks.

Evaluate this chunk for retrieval quality:

CHUNK:
{chunk_text}

CONTEXT (previous chunk ending):
{context}

Score these aspects (0-1):
1. Standalone comprehensibility: Can this be understood alone?
2. Context preservation: Is necessary context included?
3. Boundary quality: Are start/end points natural?
4. Information density: Is content meaningful?

Respond in JSON:
{
  "approved": true/false,
  "overall_score": 0.0-1.0,
  "comprehensibility": 0.0-1.0,
  "context_preservation": 0.0-1.0,
  "boundary_quality": 0.0-1.0,
  "information_density": 0.0-1.0,
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1"]
}
```

## Configuration

```python
@dataclass
class MultiAgentConfig:
    # Agent weights for consensus
    structural_weight: float = 0.35
    semantic_weight: float = 0.30
    size_weight: float = 0.20
    quality_weight: float = 0.15
    
    # Size limits
    min_chunk_size: int = 100
    max_chunk_size: int = 2000
    target_chunk_size: int = 1000
    
    # Quality thresholds
    quality_threshold: float = 0.75
    max_improvement_iterations: int = 3
    
    # LLM settings
    llm_model: str = "llama-3.1-8b-instant"
    llm_timeout: int = 30
    use_llm_for_semantic: bool = True
    use_llm_for_quality: bool = True
    
    # Performance
    enable_parallel_agents: bool = True
    enable_caching: bool = True
```

## Implementation Notes

1. **Parallel Execution**: Structural and Semantic agents can run in parallel
2. **Caching**: Cache embedding calculations and LLM responses
3. **Fallback**: Rule-based fallback when LLM unavailable
4. **Logging**: Detailed decision trace for debugging
5. **Metrics**: Track agent agreement rates and quality scores
