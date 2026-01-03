# Test Scenarios Documentation

## Overview

This document describes the comprehensive test scenarios added to the TestScenarioLibrary component for testing topic drift detection and context noise analysis capabilities.

## Topic Drift Test Scenarios

### 1. Quantum Physics → Cooking Drift (`quantum_to_cooking_drift`)

**Purpose**: Tests gradual topic drift from quantum mechanics to cooking recipes.

**Characteristics**:
- **Drift Type**: Gradual semantic shift
- **Difficulty**: Advanced
- **Duration**: 12 minutes
- **Language**: Turkish optimized

**Content Structure**:
1. **Start**: Pure quantum mechanics (Schrödinger equation, wave-particle duality)
2. **Transition**: Conceptual bridges using analogies
3. **Middle**: Mixed concepts (quantum superposition → ingredient mixing)
4. **End**: Pure cooking content (techniques, temperatures, recipes)

**Expected Challenges**:
- Scientific terminology → culinary vocabulary
- Mathematical formulas → practical measurements
- Academic discourse → practical instructions
- Conceptual abstractions → concrete procedures

**Success Criteria**:
- Min. Preservation Rate: 60%
- Min. Context Coherence: 50%
- Max. Separation Distance: 800 tokens

### 2. Biology → Economics Abrupt Transition (`biology_to_economics_abrupt`)

**Purpose**: Tests abrupt topic change from cellular biology to macroeconomics.

**Characteristics**:
- **Drift Type**: Abrupt topic switch
- **Difficulty**: Advanced
- **Duration**: 10 minutes
- **Language**: Turkish optimized

**Content Structure**:
1. **Part 1**: Cellular respiration, glycolysis, Krebs cycle
2. **Abrupt Switch**: No transition - immediate jump
3. **Part 2**: Turkish economic indicators, inflation, monetary policy

**Expected Challenges**:
- Biological processes → economic processes
- Scientific measurements → economic metrics
- Laboratory terminology → financial jargon
- Cellular structures → market structures

**Success Criteria**:
- Min. Preservation Rate: 50%
- Min. Context Coherence: 40%
- Max. Separation Distance: 1000 tokens

### 3. Academic → Casual Language Register Shift (`academic_to_casual_register`)

**Purpose**: Tests language register drift from formal academic to casual conversational Turkish.

**Characteristics**:
- **Drift Type**: Register/style shift
- **Difficulty**: Intermediate
- **Duration**: 8 minutes
- **Language**: Turkish optimized

**Content Structure**:
1. **Academic Section**: Formal literary analysis of Turkish modernization
2. **Transition**: Gradual informalization
3. **Casual Section**: Conversational discussion of same topics

**Expected Challenges**:
- Formal → informal vocabulary
- Complex → simple sentence structures
- Academic citations → casual references
- Objective → subjective tone

**Success Criteria**:
- Min. Preservation Rate: 70%
- Min. Context Coherence: 60%
- Max. Separation Distance: 500 tokens

## Context Noise Test Scenarios

### 1. Turkish Character Encoding Noise (`encoding_noise_turkish`)

**Purpose**: Tests detection of Turkish character encoding corruption.

**Characteristics**:
- **Noise Type**: Character encoding corruption
- **Difficulty**: Intermediate
- **Duration**: 6 minutes
- **Language**: Turkish with encoding issues

**Noise Patterns**:
- `ç` → `Ã§`
- `ş` → `ÅŸ`
- `ğ` → `ÄŸ`
- `ü` → `Ã¼`
- `ö` → `Ã¶`
- `ı` → `Ä±`

**Content Areas Affected**:
- Morphological analysis terminology
- Linguistic examples
- Table headers and data
- Image alt text

**Expected Challenges**:
- Unreadable Turkish text
- Broken morphological patterns
- Corrupted linguistic examples
- Inconsistent character representation

**Success Criteria**:
- Min. Preservation Rate: 40%
- Min. Context Coherence: 30%
- Max. Separation Distance: 600 tokens

### 2. Mixed Script System Noise (`mixed_script_noise`)

**Purpose**: Tests handling of multiple writing systems mixed chaotically.

**Characteristics**:
- **Noise Type**: Script system mixing
- **Difficulty**: Advanced
- **Duration**: 7 minutes
- **Scripts**: Latin, Arabic, Greek, Chinese

**Script Mixing Patterns**:
- Turkish (Latin) + English
- Arabic script insertions
- Greek characters in technical terms
- Chinese characters in examples
- Mixed directionality (LTR/RTL)

**Content Structure**:
- Comparative linguistics discussion
- Multiple language examples
- Mixed terminology
- Chaotic script transitions

**Expected Challenges**:
- Reading direction conflicts
- Character encoding clashes
- Inconsistent font rendering
- Semantic confusion from script mixing

**Success Criteria**:
- Min. Preservation Rate: 30%
- Min. Context Coherence: 25%
- Max. Separation Distance: 800 tokens

### 3. Punctuation Chaos Noise (`punctuation_chaos_noise`)

**Purpose**: Tests handling of excessive and incorrect punctuation.

**Characteristics**:
- **Noise Type**: Punctuation corruption
- **Difficulty**: Intermediate
- **Duration**: 5 minutes
- **Language**: Turkish with punctuation chaos

**Punctuation Issues**:
- Excessive repetition: `!!!`, `???`, `...`, `:::`
- Wrong placement: commas between subject-predicate
- Mixed styles: `;;` instead of `;`
- Inconsistent spacing around punctuation
- Broken quotation mark pairing

**Content Focus**:
- Turkish punctuation rules
- Grammar instruction
- Examples with corrupted punctuation
- Tables with formatting issues

**Expected Challenges**:
- Meaning distortion from wrong punctuation
- Reading flow disruption
- Inconsistent formatting patterns
- Broken sentence boundaries

**Success Criteria**:
- Min. Preservation Rate: 50%
- Min. Context Coherence: 40%
- Max. Separation Distance: 400 tokens

## Testing Strategy

### Automated Detection

Each scenario is designed to trigger specific detection algorithms:

1. **Topic Drift Detection**:
   - Semantic similarity degradation
   - Vocabulary domain shifts
   - Coherence breakdown patterns
   - Turkish academic discourse markers

2. **Context Noise Analysis**:
   - Character encoding validation
   - Script consistency checking
   - Punctuation pattern analysis
   - Morphological integrity verification

### Evaluation Metrics

**Topic Drift Metrics**:
- Semantic coherence score
- Topic consistency index
- Vocabulary domain stability
- Discourse marker preservation

**Context Noise Metrics**:
- Character encoding accuracy
- Script consistency ratio
- Punctuation correctness score
- Readability index

### Turkish Language Optimization

All scenarios include Turkish-specific features:

1. **Morphological Patterns**:
   - Vowel harmony checking
   - Agglutination integrity
   - Case marking consistency

2. **Academic Discourse**:
   - Domain-specific terminology
   - Citation patterns
   - Formal register markers

3. **Cultural Context**:
   - Turkish academic conventions
   - Educational content standards
   - Linguistic authenticity

## Usage Guidelines

### Running Test Scenarios

1. **Select Scenario**: Choose from the library based on test objectives
2. **Configure Parameters**: Set detection thresholds and analysis depth
3. **Execute Test**: Run chunking algorithm on scenario content
4. **Analyze Results**: Review drift/noise detection outputs
5. **Validate Findings**: Compare with expected challenge patterns

### Interpreting Results

**Success Indicators**:
- Detection of expected drift/noise patterns
- Appropriate alert generation
- Accurate problem localization
- Meaningful remediation suggestions

**Failure Indicators**:
- Missed obvious drift/noise patterns
- False positive alerts
- Incorrect problem classification
- Poor remediation quality

### Customization Options

**Scenario Modification**:
- Adjust drift intensity levels
- Modify noise corruption rates
- Change content domains
- Alter language register shifts

**Detection Tuning**:
- Sensitivity threshold adjustment
- Algorithm parameter optimization
- Turkish-specific rule weighting
- Performance vs. accuracy trade-offs

## Integration with Main System

### Component Integration

The test scenarios integrate with:

1. **TopicDriftDetector**: Analyzes semantic shifts and coherence
2. **ContextNoiseAnalyzer**: Detects and classifies noise patterns
3. **CoherenceValidator**: Validates chunk consistency
4. **NoiseFilterEngine**: Applies automated corrections
5. **DriftVisualization**: Provides visual analysis tools

### Workflow Integration

1. **Scenario Selection** → TestScenarioLibrary
2. **Content Processing** → Chunking algorithms
3. **Drift Detection** → TopicDriftDetector
4. **Noise Analysis** → ContextNoiseAnalyzer
5. **Validation** → CoherenceValidator
6. **Filtering** → NoiseFilterEngine
7. **Visualization** → DriftVisualization

## Future Enhancements

### Additional Scenarios

Planned additions:
- Literature → Technology drift
- Turkish → English language mixing
- Historical → Contemporary context shifts
- Scientific → Popular discourse transitions

### Advanced Features

Development roadmap:
- Real-time drift detection
- Adaptive threshold learning
- Multi-language noise patterns
- Automated scenario generation

## Conclusion

These test scenarios provide comprehensive coverage for topic drift and context noise detection in Turkish academic content. They enable systematic evaluation of chunking algorithm robustness and help identify areas for improvement in content processing pipelines.

The scenarios are designed to be realistic, challenging, and representative of real-world content processing issues, particularly those encountered in Turkish educational and academic contexts.