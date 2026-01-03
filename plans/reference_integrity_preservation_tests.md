# Reference Integrity Preservation Tests for Agentic Chunking
## Comprehensive Cross-Reference and Citation Validation Framework

**Version:** 1.0  
**Date:** 2026-01-02  
**Author:** AI Architect  
**Target System:** Agentic Chunking Reference Integrity Validation

---

## Executive Summary

This document presents a comprehensive reference integrity preservation testing framework designed to validate how well the Agentic Chunking system maintains cross-references, citations, figure/table references, and contextual relationships in Turkish educational content. The framework ensures that critical reference relationships are preserved during the chunking process.

### Key Testing Areas
- **Cross-Reference Preservation**: Internal document references and citations
- **Figure/Table Reference Integrity**: Visual content reference maintenance
- **Citation Chain Preservation**: Academic citation relationship maintenance
- **Contextual Reference Validation**: Implicit reference relationship preservation
- **Turkish Reference Pattern Recognition**: Language-specific reference structures

---

## 1. Reference Integrity Testing Architecture

### 1.1 Comprehensive Reference Testing Framework

```python
class ReferenceIntegrityTestFramework:
    def __init__(self, config: ReferenceTestConfig):
        self.config = config
        self.reference_extractor = ReferenceExtractor()
        self.integrity_validator = IntegrityValidator()
        self.turkish_reference_analyzer = TurkishReferenceAnalyzer()
        self.citation_tracker = CitationTracker()
        self.contextual_analyzer = ContextualReferenceAnalyzer()
        self.embedding_service = APIEmbeddingService()
    
    async def validate_reference_integrity(self, 
                                         original_text: str,
                                         chunks: List[AgenticChunk],
                                         metadata: Dict[str, Any] = None) -> ReferenceIntegrityReport:
        """
        Comprehensive reference integrity validation
        """
        # Extract all references from original text
        original_references = await self.reference_extractor.extract_all_references(
            original_text, metadata
        )
        
        # Map references to chunks
        chunk_reference_mapping = await self.map_references_to_chunks(
            original_references, chunks
        )
        
        # Validate cross-reference preservation
        cross_ref_validation = await self.validate_cross_references(
            original_references, chunk_reference_mapping, chunks
        )
        
        # Validate figure/table references
        figure_table_validation = await self.validate_figure_table_references(
            original_references, chunk_reference_mapping, chunks
        )
        
        # Validate citation integrity
        citation_validation = await self.validate_citation_integrity(
            original_references, chunk_reference_mapping, chunks
        )
        
        # Validate contextual references
        contextual_validation = await self.validate_contextual_references(
            original_text, chunks, original_references
        )
        
        # Turkish-specific reference validation
        turkish_validation = await self.validate_turkish_reference_patterns(
            chunks, original_references, metadata
        )
        
        return ReferenceIntegrityReport(
            original_references=original_references,
            chunk_reference_mapping=chunk_reference_mapping,
            cross_reference_validation=cross_ref_validation,
            figure_table_validation=figure_table_validation,
            citation_validation=citation_validation,
            contextual_validation=contextual_validation,
            turkish_validation=turkish_validation,
            overall_integrity_score=self.calculate_overall_integrity_score([
                cross_ref_validation, figure_table_validation, citation_validation,
                contextual_validation, turkish_validation
            ])
        )
```

### 1.2 Reference Extraction System

#### 1.2.1 Comprehensive Reference Extractor

```python
class ReferenceExtractor:
    def __init__(self):
        self.reference_patterns = {
            'figure_references': [
                r'Şekil\s+(\d+)',
                r'şekil\s+(\d+)',
                r'Figür\s+(\d+)',
                r'figür\s+(\d+)',
                r'Resim\s+(\d+)',
                r'resim\s+(\d+)'
            ],
            'table_references': [
                r'Tablo\s+(\d+)',
                r'tablo\s+(\d+)',
                r'Çizelge\s+(\d+)',
                r'çizelge\s+(\d+)'
            ],
            'section_references': [
                r'Bölüm\s+(\d+)',
                r'bölüm\s+(\d+)',
                r'Kısım\s+(\d+)',
                r'kısım\s+(\d+)',
                r'(\d+)\.\s*bölüm',
                r'(\d+)\.\s*kısım'
            ],
            'page_references': [
                r'sayfa\s+(\d+)',
                r'Sayfa\s+(\d+)',
                r's\.\s*(\d+)',
                r'S\.\s*(\d+)'
            ],
            'equation_references': [
                r'Denklem\s+(\d+)',
                r'denklem\s+(\d+)',
                r'Eşitlik\s+(\d+)',
                r'eşitlik\s+(\d+)',
                r'\((\d+)\)'  # Numbered equations
            ],
            'citation_references': [
                r'\[(\d+)\]',
                r'\(([^)]+),\s*(\d{4})\)',  # (Author, Year)
                r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü]+)\s+et\s+al\.\s*\((\d{4})\)',
                r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü]+)\s*\((\d{4})\)'
            ],
            'cross_references': [
                r'yukarıda\s+belirtilen',
                r'aşağıda\s+açıklanan',
                r'önceki\s+bölümde',
                r'sonraki\s+bölümde',
                r'bu\s+konuda',
                r'bahsedilen',
                r'değinilen',
                r'anlatılan'
            ]
        }
        self.turkish_reference_markers = TurkishReferenceMarkers()
    
    async def extract_all_references(self, 
                                   text: str, 
                                   metadata: Dict[str, Any] = None) -> List[Reference]:
        """
        Extract all types of references from text
        """
        references = []
        
        # Extract explicit references (figures, tables, sections, etc.)
        explicit_refs = self.extract_explicit_references(text)
        references.extend(explicit_refs)
        
        # Extract citations
        citation_refs = self.extract_citations(text)
        references.extend(citation_refs)
        
        # Extract contextual references
        contextual_refs = await self.extract_contextual_references(text)
        references.extend(contextual_refs)
        
        # Extract Turkish-specific references
        turkish_refs = self.extract_turkish_references(text)
        references.extend(turkish_refs)
        
        # Deduplicate and sort references
        unique_references = self.deduplicate_references(references)
        
        return sorted(unique_references, key=lambda x: x.position)
    
    def extract_explicit_references(self, text: str) -> List[Reference]:
        """
        Extract explicit references (figures, tables, sections, etc.)
        """
        references = []
        
        for ref_type, patterns in self.reference_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                
                for match in matches:
                    reference = Reference(
                        type=ref_type,
                        text=match.group(0),
                        target=match.group(1) if match.groups() else None,
                        position=match.start(),
                        end_position=match.end(),
                        context=self.extract_reference_context(text, match.start(), match.end()),
                        pattern=pattern,
                        confidence=1.0  # High confidence for explicit patterns
                    )
                    references.append(reference)
        
        return references
    
    def extract_citations(self, text: str) -> List[Reference]:
        """
        Extract academic citations
        """
        citations = []
        
        # Extract numbered citations [1], [2], etc.
        numbered_pattern = r'\[(\d+)\]'
        for match in re.finditer(numbered_pattern, text):
            citation = Reference(
                type='numbered_citation',
                text=match.group(0),
                target=match.group(1),
                position=match.start(),
                end_position=match.end(),
                context=self.extract_reference_context(text, match.start(), match.end()),
                confidence=1.0
            )
            citations.append(citation)
        
        # Extract author-year citations
        author_year_patterns = [
            r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü]+)\s*\((\d{4})\)',
            r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü]+)\s+et\s+al\.\s*\((\d{4})\)',
            r'\(([A-ZÇĞIİÖŞÜ][a-zçğıiöşü]+),\s*(\d{4})\)'
        ]
        
        for pattern in author_year_patterns:
            for match in re.finditer(pattern, text):
                citation = Reference(
                    type='author_year_citation',
                    text=match.group(0),
                    target=f"{match.group(1)}_{match.group(2)}",
                    position=match.start(),
                    end_position=match.end(),
                    context=self.extract_reference_context(text, match.start(), match.end()),
                    confidence=0.9
                )
                citations.append(citation)
        
        return citations
    
    async def extract_contextual_references(self, text: str) -> List[Reference]:
        """
        Extract contextual references using semantic analysis
        """
        contextual_refs = []
        
        # Split text into sentences for analysis
        sentences = self.split_into_sentences(text)
        
        # Get embeddings for all sentences
        embeddings, _ = await self.embedding_service.get_best_embedding(sentences)
        
        # Analyze each sentence for contextual references
        for i, (sentence, embedding) in enumerate(zip(sentences, embeddings)):
            # Check for contextual reference patterns
            contextual_patterns = self.reference_patterns['cross_references']
            
            for pattern in contextual_patterns:
                if re.search(pattern, sentence.lower()):
                    # Find sentence position in original text
                    sentence_start = text.lower().find(sentence.lower())
                    
                    if sentence_start != -1:
                        contextual_ref = Reference(
                            type='contextual_reference',
                            text=sentence,
                            target=pattern,
                            position=sentence_start,
                            end_position=sentence_start + len(sentence),
                            context=sentence,
                            confidence=0.7,
                            embedding=embedding
                        )
                        contextual_refs.append(contextual_ref)
        
        return contextual_refs
    
    def extract_reference_context(self, text: str, start: int, end: int, context_size: int = 100) -> str:
        """
        Extract context around a reference
        """
        context_start = max(0, start - context_size)
        context_end = min(len(text), end + context_size)
        
        return text[context_start:context_end]
    
    def split_into_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences (Turkish-aware)
        """
        # Simple sentence splitting for Turkish
        sentence_endings = r'[.!?]+\s+'
        sentences = re.split(sentence_endings, text)
        
        # Filter out empty sentences
        return [s.strip() for s in sentences if s.strip()]
```

#### 1.2.2 Turkish Reference Pattern Recognition

```python
class TurkishReferenceAnalyzer:
    def __init__(self):
        self.turkish_reference_patterns = {
            'demonstrative_references': [
                r'bu\s+konuda',
                r'bu\s+durumda',
                r'bu\s+açıdan',
                r'bu\s+bağlamda',
                r'şu\s+konuda',
                r'o\s+konuda'
            ],
            'temporal_references': [
                r'önceki\s+bölümde',
                r'sonraki\s+bölümde',
                r'yukarıda\s+belirtilen',
                r'aşağıda\s+açıklanan',
                r'daha\s+önce\s+bahsedilen',
                r'ilerleyen\s+bölümlerde'
            ],
            'comparative_references': [
                r'benzer\s+şekilde',
                r'aynı\s+şekilde',
                r'farklı\s+olarak',
                r'karşılaştırıldığında',
                r'buna\s+karşın',
                r'öte\s+yandan'
            ],
            'explanatory_references': [
                r'yani',
                r'başka\s+bir\s+deyişle',
                r'diğer\s+bir\s+ifadeyle',
                r'kısacası',
                r'özetle',
                r'sonuç\s+olarak'
            ]
        }
        self.embedding_service = APIEmbeddingService()
    
    async def validate_turkish_reference_patterns(self, 
                                                chunks: List[AgenticChunk],
                                                original_references: List[Reference],
                                                metadata: Dict[str, Any] = None) -> TurkishReferenceValidation:
        """
        Validate Turkish-specific reference patterns
        """
        # Analyze demonstrative reference preservation
        demonstrative_validation = await self.validate_demonstrative_references(chunks, original_references)
        
        # Analyze temporal reference preservation
        temporal_validation = await self.validate_temporal_references(chunks, original_references)
        
        # Analyze comparative reference preservation
        comparative_validation = await self.validate_comparative_references(chunks, original_references)
        
        # Analyze explanatory reference preservation
        explanatory_validation = await self.validate_explanatory_references(chunks, original_references)
        
        return TurkishReferenceValidation(
            demonstrative_references=demonstrative_validation,
            temporal_references=temporal_validation,
            comparative_references=comparative_validation,
            explanatory_references=explanatory_validation,
            overall_turkish_score=np.mean([
                demonstrative_validation.preservation_score,
                temporal_validation.preservation_score,
                comparative_validation.preservation_score,
                explanatory_validation.preservation_score
            ])
        )
    
    async def validate_demonstrative_references(self, 
                                              chunks: List[AgenticChunk],
                                              original_references: List[Reference]) -> ReferenceValidationResult:
        """
        Validate demonstrative reference preservation (bu, şu, o)
        """
        demonstrative_refs = [
            ref for ref in original_references 
            if any(pattern in ref.text.lower() for pattern in self.turkish_reference_patterns['demonstrative_references'])
        ]
        
        if not demonstrative_refs:
            return ReferenceValidationResult(
                reference_type='demonstrative',
                total_references=0,
                preserved_references=0,
                preservation_score=1.0,
                violations=[]
            )
        
        violations = []
        preserved_count = 0
        
        for ref in demonstrative_refs:
            # Find which chunk contains this reference
            containing_chunk = self.find_containing_chunk(ref, chunks)
            
            if containing_chunk is None:
                violations.append(ReferenceViolation(
                    reference=ref,
                    violation_type='reference_lost',
                    description='Demonstrative reference not found in any chunk'
                ))
                continue
            
            # Check if the referent is accessible from the same chunk
            referent_accessible = await self.check_referent_accessibility(ref, containing_chunk, chunks)
            
            if referent_accessible:
                preserved_count += 1
            else:
                violations.append(ReferenceViolation(
                    reference=ref,
                    violation_type='referent_inaccessible',
                    description='Demonstrative reference separated from its referent',
                    chunk_id=containing_chunk.id
                ))
        
        return ReferenceValidationResult(
            reference_type='demonstrative',
            total_references=len(demonstrative_refs),
            preserved_references=preserved_count,
            preservation_score=preserved_count / len(demonstrative_refs),
            violations=violations
        )
    
    async def check_referent_accessibility(self, 
                                         reference: Reference,
                                         containing_chunk: AgenticChunk,
                                         all_chunks: List[AgenticChunk]) -> bool:
        """
        Check if the referent of a reference is accessible from the containing chunk
        """
        # For demonstrative references, check if the referent is in the same chunk
        # or in immediately adjacent chunks
        
        # Get chunk index
        chunk_index = next((i for i, chunk in enumerate(all_chunks) if chunk.id == containing_chunk.id), -1)
        
        if chunk_index == -1:
            return False
        
        # Check current chunk and adjacent chunks for referent
        search_chunks = []
        
        # Add current chunk
        search_chunks.append(all_chunks[chunk_index])
        
        # Add previous chunk if exists
        if chunk_index > 0:
            search_chunks.append(all_chunks[chunk_index - 1])
        
        # Add next chunk if exists
        if chunk_index < len(all_chunks) - 1:
            search_chunks.append(all_chunks[chunk_index + 1])
        
        # Use semantic similarity to find potential referents
        reference_embedding = reference.embedding if hasattr(reference, 'embedding') else None
        
        if reference_embedding is None:
            # Get embedding for reference context
            embeddings, _ = await self.embedding_service.get_best_embedding([reference.context])
            reference_embedding = embeddings[0]
        
        # Check each search chunk for semantic similarity
        for chunk in search_chunks:
            chunk_embeddings, _ = await self.embedding_service.get_best_embedding([chunk.text])
            chunk_embedding = chunk_embeddings[0]
            
            similarity = self.cosine_similarity(
                np.array(reference_embedding),
                np.array(chunk_embedding)
            )
            
            # If similarity is high, consider referent accessible
            if similarity > 0.7:
                return True
        
        return False
    
    def find_containing_chunk(self, reference: Reference, chunks: List[AgenticChunk]) -> Optional[AgenticChunk]:
        """
        Find which chunk contains a reference
        """
        for chunk in chunks:
            if reference.text in chunk.text or reference.context in chunk.text:
                return chunk
        
        return None
    
    def cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors"""
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
```

### 1.3 Figure and Table Reference Validation

#### 1.3.1 Visual Content Reference Integrity

```python
class FigureTableReferenceValidator:
    def __init__(self):
        self.embedding_service = APIEmbeddingService()
        self.visual_content_detector = VisualContentDetector()
    
    async def validate_figure_table_references(self, 
                                             original_references: List[Reference],
                                             chunk_reference_mapping: Dict[str, List[Reference]],
                                             chunks: List[AgenticChunk]) -> FigureTableValidation:
        """
        Validate figure and table reference integrity
        """
        # Extract figure and table references
        figure_refs = [ref for ref in original_references if ref.type == 'figure_references']
        table_refs = [ref for ref in original_references if ref.type == 'table_references']
        
        # Validate figure references
        figure_validation = await self.validate_figure_references(figure_refs, chunks)
        
        # Validate table references
        table_validation = await self.validate_table_references(table_refs, chunks)
        
        # Check for orphaned visual content
        orphaned_content = await self.detect_orphaned_visual_content(chunks)
        
        return FigureTableValidation(
            figure_validation=figure_validation,
            table_validation=table_validation,
            orphaned_content=orphaned_content,
            overall_visual_integrity=self.calculate_visual_integrity_score([
                figure_validation, table_validation, orphaned_content
            ])
        )
    
    async def validate_figure_references(self, 
                                       figure_refs: List[Reference],
                                       chunks: List[AgenticChunk]) -> VisualReferenceValidation:
        """
        Validate figure reference integrity
        """
        if not figure_refs:
            return VisualReferenceValidation(
                reference_type='figure',
                total_references=0,
                preserved_references=0,
                preservation_score=1.0,
                violations=[]
            )
        
        violations = []
        preserved_count = 0
        
        for fig_ref in figure_refs:
            # Find chunk containing the reference
            ref_chunk = self.find_reference_chunk(fig_ref, chunks)
            
            if ref_chunk is None:
                violations.append(ReferenceViolation(
                    reference=fig_ref,
                    violation_type='reference_lost',
                    description=f'Figure reference {fig_ref.text} not found in any chunk'
                ))
                continue
            
            # Look for the actual figure in nearby chunks
            figure_found = await self.find_referenced_figure(fig_ref, chunks)
            
            if figure_found:
                preserved_count += 1
            else:
                violations.append(ReferenceViolation(
                    reference=fig_ref,
                    violation_type='figure_not_found',
                    description=f'Figure {fig_ref.target} referenced but not found in accessible chunks',
                    chunk_id=ref_chunk.id
                ))
        
        return VisualReferenceValidation(
            reference_type='figure',
            total_references=len(figure_refs),
            preserved_references=preserved_count,
            preservation_score=preserved_count / len(figure_refs),
            violations=violations
        )
    
    async def find_referenced_figure(self, 
                                   figure_ref: Reference,
                                   chunks: List[AgenticChunk]) -> bool:
        """
        Find if the referenced figure exists in accessible chunks
        """
        figure_number = figure_ref.target
        
        # Look for figure captions or descriptions
        figure_patterns = [
            f'Şekil {figure_number}:',
            f'şekil {figure_number}:',
            f'Figür {figure_number}:',
            f'figür {figure_number}:',
            f'Resim {figure_number}:',
            f'resim {figure_number}:'
        ]
        
        # Search in all chunks for figure caption
        for chunk in chunks:
            for pattern in figure_patterns:
                if pattern in chunk.text:
                    return True
        
        # Use semantic search for figure descriptions
        figure_context = figure_ref.context.lower()
        
        # Look for semantic indicators of figures
        figure_indicators = ['görsel', 'grafik', 'diyagram', 'çizim', 'illüstrasyon']
        
        for chunk in chunks:
            chunk_text = chunk.text.lower()
            
            # Check for figure indicators near the figure number
            for indicator in figure_indicators:
                if indicator in chunk_text and figure_number in chunk_text:
                    return True
        
        return False
    
    def find_reference_chunk(self, reference: Reference, chunks: List[AgenticChunk]) -> Optional[AgenticChunk]:
        """
        Find which chunk contains a reference
        """
        for chunk in chunks:
            if reference.text in chunk.text:
                return chunk
        
        # Fallback: check context
        for chunk in chunks:
            if reference.context in chunk.text:
                return chunk
        
        return None
```

### 1.4 Citation Chain Preservation

#### 1.4.1 Academic Citation Integrity

```python
class CitationTracker:
    def __init__(self):
        self.embedding_service = APIEmbeddingService()
        self.citation_analyzer = CitationAnalyzer()
    
    async def validate_citation_integrity(self, 
                                        original_references: List[Reference],
                                        chunk_reference_mapping: Dict[str, List[Reference]],
                                        chunks: List[AgenticChunk]) -> CitationValidation:
        """
        Validate academic citation integrity
        """
        # Extract citation references
        citations = [ref for ref in original_references if 'citation' in ref.type]
        
        if not citations:
            return CitationValidation(
                total_citations=0,
                preserved_citations=0,
                preservation_score=1.0,
                citation_chains=[],
                violations=[]
            )
        
        # Build citation chains
        citation_chains = await self.build_citation_chains(citations, chunks)
        
        # Validate citation accessibility
        citation_validation = await self.validate_citation_accessibility(citations, chunks)
        
        # Check for citation context preservation
        context_preservation = await self.validate_citation_context(citations, chunks)
        
        return CitationValidation(
            total_citations=len(citations),
            preserved_citations=citation_validation.preserved_count,
            preservation_score=citation_validation.preservation_score,
            citation_chains=citation_chains,
            context_preservation=context_preservation,
            violations=citation_validation.violations
        )
    
    async def build_citation_chains(self, 
                                  citations: List[Reference],
                                  chunks: List[AgenticChunk]) -> List[CitationChain]:
        """
        Build citation chains to track citation relationships
        """
        citation_chains = []
        
        # Group citations by target (same source)
        citation_groups = {}
        for citation in citations:
            target = citation.target
            if target not in citation_groups:
                citation_groups[target] = []
            citation_groups[target].append(citation)
        
        # Build chains for each citation group
        for target, citation_list in citation_groups.items():
            if len(citation_list) > 1:
                # Multiple references to same source - create chain
                chain = CitationChain(
                    source_id=target,
                    citations=citation_list,
                    chunks_involved=self.get_chunks_for_citations(citation_list, chunks),
                    chain_integrity=await self.calculate_chain_integrity(citation_list, chunks)
                )
                citation_chains.append(chain)
        
        return citation_chains
    
    async def validate_citation_accessibility(self, 
                                            citations: List[Reference],
                                            chunks: List[AgenticChunk]) -> CitationAccessibilityResult:
        """
        Validate that citations are accessible and properly contextualized
        """
        violations = []
        preserved_count = 0
        
        for citation in citations:
            # Find chunk containing citation
            citation_chunk = self.find_citation_chunk(citation, chunks)
            
            if citation_chunk is None:
                violations.append(ReferenceViolation(
                    reference=citation,
                    violation_type='citation_lost',
                    description=f'Citation {citation.text} not found in any chunk'
                ))
                continue
            
            # Check if citation has sufficient context
            has_context = await self.check_citation_context(citation, citation_chunk)
            
            if has_context:
                preserved_count += 1
            else:
                violations.append(ReferenceViolation(
                    reference=citation,
                    violation_type='insufficient_context',
                    description=f'Citation {citation.text} lacks sufficient context',
                    chunk_id=citation_chunk.id
                ))
        
        return CitationAccessibilityResult(
            preserved_count=preserved_count,
            preservation_score=preserved_count / len(citations) if citations else 1.0,
            violations=violations
        )
    
    async def check_citation_context(self, 
                                   citation: Reference,
                                   chunk: AgenticChunk) -> bool:
        """
        Check if citation has sufficient context in its chunk
        """
        # Find citation position in chunk
        citation_pos = chunk.text.find(citation.text)
        
        if citation_pos == -1:
            return False
        
        # Extract context around citation
        context_size = 200
        context_start = max(0, citation_pos - context_size)
        context_end = min(len(chunk.text), citation_pos + len(citation.text) + context_size)
        
        citation_context = chunk.text[context_start:context_end]
        
        # Check if context contains meaningful content
        # Context should have more than just the citation
        meaningful_words = len([word for word in citation_context.split() if len(word) > 3])
        
        return meaningful_words > 10  # At least 10 meaningful words for context
    
    def find_citation_chunk(self, citation: Reference, chunks: List[AgenticChunk]) -> Optional[AgenticChunk]:
        """
        Find which chunk contains a citation
        """
        for chunk in chunks:
            if citation.text in chunk.text:
                return chunk
        
        return None
    
    def get_chunks_for_citations(self, 
                               citations: List[Reference],
                               chunks: List[AgenticChunk]) -> List[AgenticChunk]:
        """
        Get all chunks that contain citations from a list
        """
        involved_chunks = []
        
        for citation in citations:
            chunk = self.find_citation_chunk(citation, chunks)
            if chunk and chunk not in involved_chunks:
                involved_chunks.append(chunk)
        
        return involved_chunks
```

### 1.5 Contextual Reference Validation

#### 1.5.1 Implicit Reference Relationship Analysis

```python
class ContextualReferenceAnalyzer:
    def __init__(self):
        self.embedding_service = APIEmbeddingService()
        self.semantic_analyzer = SemanticAnalyzer()
    
    async def validate_contextual_references(self, 
                                           original_text: str,
                                           chunks: List[AgenticChunk],
                                           original_references: List[Reference]) -> ContextualValidation:
        """
        Validate contextual and implicit reference relationships
        """
        # Extract contextual references
        contextual_refs = [ref for ref in original_references if ref.type == 'contextual_reference']
        
        # Analyze pronoun resolution
        pronoun_validation = await self.validate_pronoun_resolution(chunks)
        
        # Analyze discourse coherence
        discourse_validation = await self.validate_discourse_coherence(chunks)
        
        # Analyze semantic continuity
        semantic_validation = await self.validate_semantic_continuity(original_text, chunks)
        
        # Analyze topic continuity
        topic_validation = await self.validate_topic_continuity(chunks)
        
        return ContextualValidation(
            contextual_references=contextual_refs,
            pronoun_validation=pronoun_validation,
            discourse_validation=discourse_validation,
            semantic_validation=semantic_validation,
            topic_validation=topic_validation,
            overall_contextual_score=np.mean([
                pronoun_validation.coherence_score,
                discourse_validation.coherence_score,
                semantic_validation.coherence_score,
                topic_validation.coherence_score
            ])
        )
    
    async def validate_pronoun_resolution(self, chunks: List[AgenticChunk]) -> PronounValidation:
        """
        Validate pronoun resolution across chunk boundaries
        """
        turkish_pronouns = ['bu', 'şu', 'o', 'bunlar', 'şunlar', 'onlar', 'bunu', 'şunu', 'onu']
        
        pronoun_issues = []
        total_pronouns = 0
        resolved_pronouns = 0
        
        for i, chunk in enumerate(chunks):
            chunk_text = chunk.text.lower()
            
            # Find pronouns in chunk
            for pronoun in turkish_pronouns:
                pronoun_pattern = r'\b' + re.escape(pronoun) + r'\b'
                matches = list(re.finditer(pronoun_pattern, chunk_text))
                
                for match in matches:
                    total_pronouns += 1
                    
                    # Check if pronoun can be resolved within current chunk or adjacent chunks
                    resolved = await self.check_pronoun_resolution(
                        pronoun, match.start(), chunk, chunks, i
                    )
                    
                    if resolved:
                        resolved_pronouns += 1
                    else:
                        pronoun_issues.append(PronounIssue(
                            pronoun=pronoun,
                            position=match.start(),
                            chunk_id=chunk.id,
                            context=chunk_text[max(0, match.start()-50):match.end()+50]
                        ))
        
        return PronounValidation(
            total_pronouns=total_pronouns,
            resolved_pronouns=resolved_pronouns,
            coherence_score=resolved_pronouns / total_pronouns if total_pronouns > 0 else 1.0,
            pronoun_issues=pronoun_issues
        )
    
    async def check_pronoun_resolution(self, 
                                     pronoun: str,
                                     position: int,
                                     current_chunk: AgenticChunk,
                                     all_chunks: List[AgenticChunk],
                                     chunk_index: int) -> bool:
        """
        Check if a pronoun can be resolved to its antecedent
        """
        # Get context around pronoun
        chunk_text = current_chunk.text
        context_start = max(0, position - 100)
        context_end = min(len(chunk_text), position + 100)
        pronoun_context = chunk_text[context_start:context_end]
        
        # Look for potential antecedents in current chunk
        if self.has_potential_antecedent(pronoun_context, pronoun):
            return True
        
        # Look in previous chunk if exists
        if chunk_index > 0:
            prev_chunk = all_chunks[chunk_index - 1]
            prev_context = prev_chunk.text[-200:]  # Last 200 chars of previous chunk
            
            if self.has_potential_antecedent(prev_context, pronoun):
                return True
        
        return False
    
    def has_potential_antecedent(self, context: str, pronoun: str) -> bool:
        """
        Check if context has potential antecedent for pronoun
        """
        # Simple heuristic: look for nouns that could be antecedents
        # This is a simplified approach - in practice, would use more sophisticated NLP
        
        # Look for common noun patterns in Turkish
        noun_patterns = [
            r'[A-ZÇĞIİÖŞÜ][a-zçğıiöşü]+',  # Capitalized words (potential proper nouns)
            r'[a-zçğıiöşü]+lar\b',          # Plural nouns ending in -lar
            r'[a-zçğıiöşü]+ler\b',          # Plural nouns ending in -ler
        ]
        
        for pattern in noun_patterns:
            if re.search(pattern, context):
                return True
        
        return False
    
    async def validate_discourse_coherence(self, chunks: List[AgenticChunk]) -> DiscourseValidation:
        """
        Validate discourse coherence across chunks
        """
        if len(chunks) < 2:
            return DiscourseValidation(
                coherence_score=1.0,
                transition_quality=1.0,
                discourse_markers=[],
                coherence_issues=[]
            )
        
        coherence_scores = []
        transition_qualities = []
        discourse_markers = []
        coherence_issues = []
        
        for i in range(len(chunks) - 1):
            current_chunk = chunks[i]
            next_chunk = chunks[i + 1]
            
            # Analyze transition between chunks
            transition_analysis = await self.analyze_chunk_transition(current_chunk, next_chunk)
            
            coherence_scores.append(transition_analysis.coherence_score)
            transition_qualities.append(transition_analysis.transition_quality)
            discourse_markers.extend(transition_analysis.discourse_markers)
            
            if transition_analysis.coherence_score < 0.6:
                coherence_issues.append(CoherenceIssue(
                    chunk_pair=(current_chunk.id, next_chunk.id),
                    issue_type='low_coherence',
                    coherence_score=transition_analysis.coherence_score,
                    description='Low coherence between adjacent chunks'
                ))
        
        return DiscourseValidation(
            coherence_score=np.mean(coherence_scores),
            transition_quality=np.mean(transition_qualities),
            discourse_markers=discourse_markers,
            coherence_issues=coherence_issues
        )
    
    async def analyze_chunk_transition(self, 
                                     chunk1: AgenticChunk,
                                     chunk2: AgenticChunk) -> TransitionAnalysis:
        """
        Analyze transition between two chunks
        """
        # Get embeddings for chunk endings and beginnings
        chunk1_end = chunk1.text[-200:]  # Last 200 chars
        chunk2_start = chunk2.text[:200]  # First 200 chars
        
        embeddings, _ = await self.embedding_service.get_best_embedding([chunk1_end, chunk2_start])
        
        # Calculate semantic similarity
        similarity = self.cosine_similarity(np.array(embeddings[0]), np.array(embeddings[1]))
        
        # Look for discourse markers
        discourse_markers = self.find_discourse_markers(chunk2_start)
        
        # Calculate transition quality based on similarity and discourse markers
        transition_quality = similarity
        if discourse_markers:
            transition_quality += 0.1  # Bonus for explicit discourse markers
        
        return TransitionAnalysis(
            coherence_score=similarity,
            transition_quality=min(1.0, transition_quality),
            discourse_markers=discourse_markers
        )
    
    def find_discourse_markers(self, text: str) -> List[str]:
        """
        Find discourse markers in text
        """
        turkish_discourse_markers = [
            'ancak', 'fakat', 'ama', 'lakin',  # Contrast
            'ayrıca', 'dahası', 'üstelik',     # Addition
            'sonuç olarak', 'bu nedenle',      # Conclusion
            'örneğin', 'mesela',               # Example
            'öte yandan', 'diğer taraftan'     # Alternative
        ]
        
        found_markers = []
        text_lower = text.lower()
        
        for marker in turkish_discourse_markers:
            if marker in text_lower:
                found_markers.append(marker)
        
        return found_markers
    
    def cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors"""
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
```

### 1.6 Real-Time Reference Monitoring

#### 1.6.1 Reference Integrity Monitoring System

```python
class ReferenceIntegrityMonitor:
    def __init__(self):
        self.reference_extractor = ReferenceExtractor()
        self.integrity_validator = IntegrityValidator()
        self.alert_system = AlertSystem()
        self.reference_cache = ReferenceCache()
    
    async def monitor_reference_integrity_realtime(self, 
                                                 chunk: AgenticChunk,
                                                 context: ChunkingContext) -> ReferenceIntegrityAlert:
        """
        Monitor reference integrity in real-time during chunking
        """
        # Extract references from current chunk
        chunk_references = await self.reference_extractor.extract_all_references(chunk.text)
        
        # Check for broken references
        broken_references = await self.check_broken_references(chunk_references, context)
        
        # Check for orphaned references
        orphaned_references = await self.check_orphaned_references(chunk_references, context)
        
        # Calculate integrity score
        integrity_score = self.calculate_chunk_integrity_score(
            chunk_references, broken_references, orphaned_references
        )
        
        # Generate alert if integrity is compromised
        alert_triggered = integrity_score < 0.7
        
        if alert_triggered:
            await self.alert_system.send_reference_integrity_alert(
                chunk_id=chunk.id,
                integrity_score=integrity_score,
                broken_references=broken_references,
                orphaned_references=orphaned_references
            )
        
        return ReferenceIntegrityAlert(
            chunk_id=chunk.id,
            integrity_score=integrity_score,
            references_found=len(chunk_references),
            broken_references=broken_references,
            orphaned_references=orphaned_references,
            alert_triggered=alert_triggered,
            recommendations=self.generate_integrity_recommendations(
                broken_references, orphaned_references
            ) if alert_triggered else []
        )
    
    async def check_broken_references(self, 
                                    chunk_references: List[Reference],
                                    context: ChunkingContext) -> List[Reference]:
        """
        Check for references that are broken due to chunking
        """
        broken_refs = []
        
        for ref in chunk_references:
            if ref.type in ['figure_references', 'table_references', 'section_references']:
                # Check if the referenced item is accessible
                is_accessible = await self.check_reference_accessibility(ref, context)
                
                if not is_accessible:
                    broken_refs.append(ref)
        
        return broken_refs
    
    async def check_reference_accessibility(self, 
                                          reference: Reference,
                                          context: ChunkingContext) -> bool:
        """
        Check if a reference target is accessible from current context
        """
        # This would check if the referenced figure, table, or section
        # is available in the current chunk or nearby chunks
        
        # For now, implement a simple heuristic
        if hasattr(context, 'processed_chunks'):
            # Look for reference target in processed chunks
            for chunk in context.processed_chunks:
                if self.reference_target_in_chunk(reference, chunk):
                    return True
        
        return False
    
    def reference_target_in_chunk(self, reference: Reference, chunk: AgenticChunk) -> bool:
        """
        Check if reference target exists in chunk
        """
        if reference.type == 'figure_references':
            figure_patterns = [
                f'Şekil {reference.target}:',
                f'şekil {reference.target}:',
                f'Figür {reference.target}:',
                f'figür {reference.target}:'
            ]
            return any(pattern in chunk.text for pattern in figure_patterns)
        
        elif reference.type == 'table_references':
            table_patterns = [
                f'Tablo {reference.target}:',
                f'tablo {reference.target}:',
                f'Çizelge {reference.target}:',
                f'çizelge {reference.target}:'
            ]
            return any(pattern in chunk.text for pattern in table_patterns)
        
        return False
```

---

## 2. Test Case Specifications

### 2.1 Critical Reference Preservation Test Cases

#### 2.1.1 Figure Reference Test Cases

```python
FIGURE_REFERENCE_TEST_CASES = [
    {
        "test_id": "fig_ref_001",
        "title": "Sequential Figure References",
        "content": """
        # Hücre Yapısı

        Hücre organelleri karmaşık bir yapı gösterir. Şekil 1'de görüldüğü gibi, 
        çekirdek hücrenin merkezinde yer alır.

        ## Çekirdek Yapısı

        Şekil 1: Hücre çekirdeğinin detaylı görünümü
        [Çekirdek yapısını gösteren detaylı diyagram]

        Çekirdek zarı çift katlı bir membran yapısıdır. Şekil 2'de gösterildiği 
        üzere, çekirdek zarında porlar bulunur.

        Şekil 2: Çekirdek zarı ve por yapısı
        [Çekirdek zarı detaylarını gösteren mikroskop görüntüsü]

        Bu porlar, çekirdek ile sitoplazma arasındaki madde alışverişini sağlar.
        """,
        "expected_behavior": {
            "figure_1_reference_preserved": True,
            "figure_1_caption_accessible": True,
            "figure_2_reference_preserved": True,
            "figure_2_caption_accessible": True,
            "reference_context_maintained": True
        },
        "critical_violations": [
            "figure_reference_without_caption",
            "caption_without_reference",
            "reference_context_lost"
        ]
    },
    {
        "test_id": "fig_ref_002", 
        "title": "Cross-Chapter Figure References",
        "content": """
        # Bölüm 1: Hücre Yapısı

        Hücre organelleri hakkında genel bilgi bu bölümde verilmiştir.

        # Bölüm 2: Hücre Fonksiyonları

        Hücre fonksiyonları incelenirken, Bölüm 1'deki Şekil 1'e tekrar 
        başvurmak gerekir. Bu şekilde gösterilen yapılar, fonksiyonel 
        açıdan da önemlidir.

        Ayrıca, aşağıdaki Şekil 3'te fonksiyonel ilişkiler gösterilmiştir.

        Şekil 3: Hücre organelleri arasındaki fonksiyonel ilişkiler
        [Organeller arası etkileşimi gösteren şema]
        """,
        "expected_behavior": {
            "cross_chapter_reference_preserved": True,
            "backward_reference_accessible": True,
            "forward_reference_preserved": True,
            "chapter_context_maintained": True
        },
        "critical_violations": [
            "cross_chapter_reference_broken",
            "backward_reference_inaccessible"
        ]
    }
]
```

#### 2.1.2 Citation Chain Test Cases

```python
CITATION_CHAIN_TEST_CASES = [
    {
        "test_id": "cite_001",
        "title": "Multiple Citations Same Source",
        "content": """
        # Protein Sentezi

        Protein sentezi karmaşık bir süreçtir (Watson & Crick, 1953). 
        Bu süreç iki ana aşamada gerçekleşir: transkripsiyon ve translasyon.

        ## Transkripsiyon

        Transkripsiyon sürecinde DNA'dan RNA sentezlenir. Watson ve Crick'in 
        (1953) öncü çalışması bu sürecin temellerini atmıştır.

        ## Translasyon

        Translasyon sürecinde ise RNA'dan protein sentezlenir. Bu süreç 
        hakkında Watson & Crick (1953) tarafından yapılan gözlemler 
        hala geçerliliğini korumaktadır.

        ## Sonuç

        Protein sentezi konusunda Watson ve Crick'in 1953 yılındaki 
        çalışması temel kaynak olmaya devam etmektedir.
        """,
        "expected_behavior": {
            "citation_chain_preserved": True,
            "all_citations_accessible": True,
            "citation_context_maintained": True,
            "author_year_consistency": True
        },
        "critical_violations": [
            "citation_chain_broken",
            "citation_context_lost",
            "inconsistent_citation_format"
        ]
    }
]
```

### 2.2 Turkish Reference Pattern Test Cases

```python
TURKISH_REFERENCE_PATTERN_TEST_CASES = [
    {
        "test_id": "tr_ref_001",
        "title": "Demonstrative Reference Patterns",
        "content": """
        # Fotosentez Süreci

        Fotosentez, bitkilerin güneş enerjisini kimyasal enerjiye dönüştürdüğü 
        yaşamsal bir süreçtir. Bu süreç iki ana aşamada gerçekleşir.

        ## Işık Reaksiyonları

        Işık reaksiyonları kloroplastların tilakoid membranlarında gerçekleşir. 
        Bu reaksiyonlarda güneş enerjisi ATP ve NADPH üretiminde kullanılır.

        ## Karbon Fiksasyonu

        Bu aşamada, önceki aşamada üretilen ATP ve NADPH kullanılarak 
        karbondioksit glukoza dönüştürülür. Bu süreç Calvin döngüsü 
        olarak da bilinir.

        ## Sonuç

        Yukarıda açıklanan bu iki aşama birlikte fotosentez sürecini 
        oluşturur. Bu konuda daha detaylı bilgi sonraki bölümlerde 
        verilecektir.
        """,
        "expected_behavior": {
            "demonstrative_references_preserved": True,
            "temporal_references_maintained": True,
            "contextual_coherence_preserved": True,
            "turkish_discourse_markers_recognized": True
        },
        "critical_violations": [
            "demonstrative_reference_broken",
            "temporal_reference_lost",
            "contextual_coherence_disrupted"
        ]
    }
]
```

---

## 3. Implementation Roadmap

### 3.1 Phase 1: Core Reference Detection (Week 1-2)
- [ ] Implement comprehensive reference extractor
- [ ] Create Turkish reference pattern recognition
- [ ] Build figure/table reference detection
- [ ] Set up citation extraction system

### 3.2 Phase 2: Integrity Validation (Week 3-4)
- [ ] Implement reference integrity validator
- [ ] Create contextual reference analyzer
- [ ] Build citation chain tracker
- [ ] Develop real-time monitoring system

### 3.3 Phase 3: Advanced Analysis (Week 5-6)
- [ ] Implement semantic reference analysis
- [ ] Create discourse coherence validation
- [ ] Build pronoun resolution checker
- [ ] Develop performance optimization

### 3.4 Phase 4: Integration and Testing (Week 7-8)
- [ ] Integrate with evaluation pipeline
- [ ] Create comprehensive test suite
- [ ] Build reference integrity dashboard
- [ ] Create detailed documentation

---

## 4. Expected Performance Targets

### 4.1 Reference Detection Accuracy
```python
REFERENCE_DETECTION_TARGETS = {
    'figure_reference_detection': 0.95,      # 95% figure reference detection
    'table_reference_detection': 0.93,       # 93% table reference detection
    'citation_detection': 0.90,              # 90% citation detection
    'contextual_reference_detection': 0.85,  # 85% contextual reference detection
    'turkish_pattern_recognition': 0.88      # 88% Turkish pattern recognition
}
```

### 4.2 Integrity Preservation Targets
```python
INTEGRITY_PRESERVATION_TARGETS = {
    'figure_reference_preservation': 0.92,   # 92% figure reference preservation
    'citation_chain_preservation': 0.89,     # 89% citation chain preservation
    'contextual_coherence_preservation': 0.86, # 86% contextual coherence
    'turkish_reference_preservation': 0.90,  # 90% Turkish reference preservation
    'overall_reference_integrity': 0.88      # 88% overall integrity
}
```

---

## 5. Conclusion

This comprehensive reference integrity preservation testing framework ensures that the Agentic Chunking system maintains critical reference relationships during the chunking process. The framework provides specialized validation for Turkish educational content while maintaining high accuracy in reference detection and preservation.

### Key Benefits
1. **Comprehensive Coverage**: All reference types validated
2. **Turkish Optimization**: Specialized for Turkish reference patterns
3. **Real-time Monitoring**: Continuous integrity assessment
4. **Educational Focus**: Optimized for academic content structures
5. **High Accuracy**: Robust detection and validation algorithms

The implementation will provide detailed insights into reference integrity while ensuring that critical relationships are preserved in the chunked content.