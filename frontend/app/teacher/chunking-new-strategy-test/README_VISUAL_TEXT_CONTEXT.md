# Visual-Text Context Preservation Testing Framework

## Overview

The Visual-Text Context Preservation Testing Framework is a comprehensive system designed to evaluate how well Agentic Chunking preserves the relationship between visual elements (images, figures, tables) and their associated textual descriptions during the chunking process.

## Problem Statement

Traditional chunking methods often separate visual content from their textual descriptions, breaking important contextual relationships. For example, when processing academic content like "Biyoloji nedir?" with an E. coli image and its explanation, traditional chunking might place the image reference in one chunk and the detailed explanation in another, losing the semantic connection.

## Components

### 1. VisualTextContextAnalyzer

**Purpose**: Detects and analyzes visual-text relationships in documents.

**Key Features**:
- **Image Reference Detection**: Identifies HTML `<img>` tags, Turkish figure references (`Şekil X.Y`, `Tablo X.Y`, `Grafik X.Y`)
- **Context Relationship Analysis**: Evaluates the strength of connections between visual elements and surrounding text
- **Turkish Academic Support**: Specialized patterns for Turkish academic terminology
- **Multiple View Modes**: Overview, references, analysis, and heatmap visualizations

**Usage**:
```tsx
<VisualTextContextAnalyzer
  chunks={chunkData}
  originalText={documentText}
  strategy="agentic"
  enableHeatmap={true}
  turkishOptimized={true}
/>
```

**Metrics Provided**:
- Context preservation rate (0-1)
- Reference integrity score
- Visual-text coherence rating
- Boundary accuracy assessment

### 2. ReferenceIntegrityChecker

**Purpose**: Validates cross-reference integrity across chunk boundaries.

**Key Features**:
- **Cross-Reference Detection**: Finds references that span multiple chunks
- **Integrity Validation**: Checks if referenced content remains accessible
- **Turkish Pattern Support**: Handles Turkish academic reference patterns
- **Confidence Scoring**: Provides reliability metrics for detected references

**Usage**:
```tsx
<ReferenceIntegrityChecker
  chunks={chunkData}
  originalText={documentText}
  strategy="agentic"
  showConfidenceThreshold={0.7}
/>
```

**Analysis Types**:
- **Intact References**: References with complete context preservation
- **Weakened References**: References with partial context loss
- **Broken References**: References with complete context separation

### 3. ContextPreservationTester

**Purpose**: Provides interactive testing scenarios for visual-text context preservation.

**Key Features**:
- **Predefined Test Scenarios**: Ready-to-use academic test cases
- **Custom Test Creation**: User-defined test scenarios
- **Real-time Analysis**: Live context preservation evaluation
- **Comprehensive Reporting**: Detailed test results and metrics

**Test Scenarios Included**:

#### E. coli Biology Example
- **Content**: Biology introduction with E. coli image and detailed explanation
- **Challenges**: Figure reference preservation, image-text relationship
- **Success Criteria**: 80% preservation rate, 75% context coherence

#### Physics Formulas and Diagrams
- **Content**: Newton's laws with force diagrams and equations
- **Challenges**: Formula references, diagram-equation relationships
- **Success Criteria**: 85% preservation rate, 80% context coherence

#### Chemistry Reactions
- **Content**: Chemical reactions with experimental setups and pH curves
- **Challenges**: Reaction diagrams, experimental procedure relationships
- **Success Criteria**: 75% preservation rate, 70% context coherence

#### Geometry Theorems
- **Content**: Mathematical proofs with geometric figures
- **Challenges**: Theorem-diagram relationships, proof step preservation
- **Success Criteria**: 90% preservation rate, 85% context coherence

#### Mixed Content Test
- **Content**: Multi-disciplinary academic content with various reference types
- **Challenges**: Complex cross-references, multiple content types
- **Success Criteria**: 70% preservation rate, 65% context coherence

## Turkish Language Optimization

### Academic Terminology Support
- **Figure References**: `Şekil 1.1`, `Şekil 1.2`, etc.
- **Table References**: `Tablo 2.1`, `Tablo 2.2`, etc.
- **Graph References**: `Grafik 3.1`, `Grafik 3.2`, etc.
- **Diagram References**: `Diyagram 4.1`, `Şema 4.2`, etc.

### Contextual Patterns
- **Reference Indicators**: "yukarıdaki şekil", "aşağıdaki tablo", "bu grafik"
- **Explanation Connectors**: "gösterildiği gibi", "belirtildiği üzere"
- **Academic Discourse**: Turkish academic writing patterns and structures

### Citation Formats
- **In-text Citations**: Turkish academic citation patterns
- **Reference Lists**: Bibliography and reference formatting
- **Cross-references**: Inter-section and inter-chapter references

## Testing Workflow

### 1. Scenario Selection
```typescript
// Select from predefined scenarios
const scenario = predefinedScenarios.find(s => s.id === "ecoli_biology");

// Or create custom scenario
const customScenario = {
  id: "custom_test",
  name: "Custom Biology Test",
  content: "Your test content here...",
  expectedChallenges: ["Figure references", "Context preservation"],
  successCriteria: {
    minPreservationRate: 0.8,
    minContextCoherence: 0.75,
    maxSeparationDistance: 500
  }
};
```

### 2. Test Execution
```typescript
const testResult = await runContextPreservationTest(scenario, {
  strategy: "agentic",
  chunkSize: 1000,
  enableSemanticBoundaries: true
});
```

### 3. Results Analysis
```typescript
// Analyze test results
const analysis = {
  preservationRate: testResult.preservationRate,
  contextCoherence: testResult.contextCoherence,
  referenceIntegrity: testResult.referenceIntegrity,
  passed: testResult.passed,
  recommendations: generateRecommendations(testResult)
};
```

## Metrics and Evaluation

### Context Preservation Metrics
- **Preservation Rate**: Percentage of visual-text relationships maintained
- **Context Coherence**: Semantic coherence between visual and textual elements
- **Reference Integrity**: Completeness of cross-references
- **Boundary Accuracy**: Precision of chunk boundary placement

### Quality Indicators
- **Excellent (90-100%)**: Perfect context preservation
- **Good (75-89%)**: Minor context loss, acceptable quality
- **Average (60-74%)**: Moderate context loss, needs improvement
- **Poor (<60%)**: Significant context loss, requires attention

### Performance Metrics
- **Processing Time**: Time taken for context analysis
- **Memory Usage**: Resource consumption during analysis
- **Accuracy Rate**: Correctness of context detection
- **False Positive Rate**: Incorrect context relationship detection

## Integration with Main System

### Tab Integration
The visual-text context testing is integrated as a new tab in the main chunking test interface:

```tsx
<TabsTrigger value="visual-context" className="flex items-center gap-2">
  <FileText className="h-4 w-4" />
  Görsel-Metin
</TabsTrigger>
```

### Component Integration
```tsx
<TabsContent value="visual-context" className="space-y-6">
  <ContextPreservationTester
    onRunTest={handleContextTest}
    enableCustomScenarios={true}
    showDetailedResults={true}
  />
</TabsContent>
```

## API Integration

### Test Execution Endpoint
```typescript
POST /api/chunking-test/visual-context
{
  "scenario": {
    "id": "ecoli_biology",
    "content": "...",
    "expectedChallenges": [...]
  },
  "config": {
    "strategy": "agentic",
    "preservationThreshold": 0.8
  }
}
```

### Response Format
```typescript
{
  "testId": "test_123",
  "results": {
    "preservationRate": 0.85,
    "contextCoherence": 0.78,
    "referenceIntegrity": 0.92,
    "detectedReferences": 12,
    "preservedReferences": 10,
    "separatedReferences": 2,
    "passed": true,
    "score": 82
  },
  "analysis": {
    "strengths": ["Good figure preservation", "Strong context coherence"],
    "weaknesses": ["Some table references separated"],
    "recommendations": ["Adjust chunk boundaries near tables"]
  }
}
```

## Best Practices

### Content Preparation
1. **Clear Reference Patterns**: Use consistent figure/table numbering
2. **Contextual Indicators**: Include clear reference indicators in text
3. **Logical Structure**: Organize content with clear visual-text relationships
4. **Turkish Optimization**: Use Turkish academic terminology consistently

### Test Configuration
1. **Appropriate Thresholds**: Set realistic preservation rate expectations
2. **Scenario Selection**: Choose scenarios matching your content type
3. **Multiple Tests**: Run various scenarios for comprehensive evaluation
4. **Iterative Improvement**: Use results to refine chunking parameters

### Result Interpretation
1. **Holistic Analysis**: Consider all metrics together, not individually
2. **Context Sensitivity**: Account for content complexity and type
3. **Trend Analysis**: Track improvements over multiple test runs
4. **Actionable Insights**: Focus on specific, implementable recommendations

## Future Enhancements

### Planned Features
- **Advanced Visualization**: 3D context flow diagrams
- **Machine Learning**: Automated pattern recognition for context relationships
- **Multi-language Support**: Extended language support beyond Turkish
- **Real-time Feedback**: Live context preservation monitoring during chunking

### Research Directions
- **Semantic Embedding**: Deep learning approaches for context understanding
- **Cross-modal Analysis**: Integration of visual content analysis
- **Adaptive Thresholds**: Dynamic threshold adjustment based on content type
- **Collaborative Filtering**: Community-driven test scenario development

## Troubleshooting

### Common Issues
1. **Low Preservation Rates**: Check chunk size settings and boundary detection
2. **False Positives**: Verify reference pattern accuracy and context indicators
3. **Performance Issues**: Optimize content size and complexity for testing
4. **Turkish Pattern Errors**: Ensure correct Turkish academic terminology usage

### Debug Mode
Enable detailed logging for troubleshooting:
```typescript
<ContextPreservationTester
  debugMode={true}
  logLevel="verbose"
  showInternalMetrics={true}
/>
```

## Conclusion

The Visual-Text Context Preservation Testing Framework provides a comprehensive solution for evaluating and improving the quality of chunking strategies, particularly for academic and educational content with rich visual-textual relationships. By focusing on Turkish academic content and providing detailed metrics and analysis tools, it enables users to optimize their chunking approaches for maximum context preservation and semantic coherence.