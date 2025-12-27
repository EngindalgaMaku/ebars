#!/usr/bin/env python3
"""
Educational RAG System Technical Diagrams
Makale için yüksek kaliteli teknik diagramlar oluşturur
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle, Rectangle
import numpy as np
from pathlib import Path
import seaborn as sns

# Türkçe font desteği ve kaliteli görselleştirme ayarları
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 10
plt.rcParams['figure.dpi'] = 300  # Yüksek çözünürlük
plt.rcParams['axes.unicode_minus'] = False

def create_personalization_architecture():
    """Personalization Architecture Diagram - Kişiselleştirme Mimarisi"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 12))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 12)
    ax.axis('off')
    
    # Renk paleti
    colors = {
        'user': '#E3F2FD',      # Açık mavi - kullanıcı katmanı
        'adaptive': '#E8F5E9',   # Açık yeşil - adaptif sistem
        'learning': '#FFF3E0',   # Açık turuncu - öğrenme
        'feedback': '#FCE4EC',   # Açık pembe - geri bildirim
        'content': '#F3E5F5',    # Açık mor - içerik
        'analytics': '#E0F2F1',  # Açık turkuaz - analitik
    }
    
    # User Input Layer
    user_box = FancyBboxPatch((1, 10), 3, 1.2,
                              boxstyle="round,pad=0.1",
                              facecolor=colors['user'],
                              edgecolor='#1976D2', linewidth=2)
    ax.add_patch(user_box)
    ax.text(2.5, 10.6, 'User Input Layer\nQuery + Context + Profile', 
           ha='center', va='center', fontsize=11, fontweight='bold')
    
    # Adaptive Query Router
    router_box = FancyBboxPatch((6, 10), 3.5, 1.2,
                               boxstyle="round,pad=0.1",
                               facecolor=colors['adaptive'],
                               edgecolor='#388E3C', linewidth=2)
    ax.add_patch(router_box)
    ax.text(7.75, 10.6, 'Adaptive Query Router\nIntelligent Query Classification', 
           ha='center', va='center', fontsize=11, fontweight='bold')
    
    # Personalization Components
    components = [
        ('Learning Loop\nManager', 1.5, 8, colors['learning']),
        ('Feedback\nProcessor', 4.5, 8, colors['feedback']),
        ('RAG\nOptimizer', 7.5, 8, colors['learning']),
        ('Active Learning\nEngine', 10, 8, colors['adaptive']),
    ]
    
    for label, x, y, color in components:
        box = FancyBboxPatch((x-0.75, y-0.5), 1.5, 1,
                            boxstyle="round,pad=0.08",
                            facecolor=color,
                            edgecolor='black', linewidth=1.5)
        ax.add_patch(box)
        ax.text(x, y, label, ha='center', va='center', 
               fontsize=9, fontweight='bold')
    
    # Content Processing Layer
    content_box = FancyBboxPatch((2, 6), 8, 1.2,
                                boxstyle="round,pad=0.1",
                                facecolor=colors['content'],
                                edgecolor='#7B1FA2', linewidth=2)
    ax.add_patch(content_box)
    ax.text(6, 6.6, 'Personalized Content Processing\nSemantic Chunking + Turkish NLP + Context Adaptation', 
           ha='center', va='center', fontsize=11, fontweight='bold')
    
    # Knowledge Base Components
    kb_components = [
        ('Vector Store\n(Semantic)', 2, 4, colors['analytics']),
        ('BM25 Index\n(Lexical)', 5, 4, colors['analytics']),
        ('User Profile\nStore', 8, 4, colors['user']),
    ]
    
    for label, x, y, color in kb_components:
        box = FancyBboxPatch((x-0.8, y-0.5), 1.6, 1,
                            boxstyle="round,pad=0.08",
                            facecolor=color,
                            edgecolor='black', linewidth=1.5)
        ax.add_patch(box)
        ax.text(x, y, label, ha='center', va='center', 
               fontsize=9, fontweight='bold')
    
    # Performance Analytics
    analytics_box = FancyBboxPatch((1, 2), 4, 1.2,
                                  boxstyle="round,pad=0.1",
                                  facecolor=colors['analytics'],
                                  edgecolor='#00695C', linewidth=2)
    ax.add_patch(analytics_box)
    ax.text(3, 2.6, 'Performance Tracker\nRAGAS Evaluation + Educational Metrics', 
           ha='center', va='center', fontsize=11, fontweight='bold')
    
    # Recommendation Engine
    recommendation_box = FancyBboxPatch((7, 2), 4, 1.2,
                                       boxstyle="round,pad=0.1",
                                       facecolor=colors['feedback'],
                                       edgecolor='#C2185B', linewidth=2)
    ax.add_patch(recommendation_box)
    ax.text(9, 2.6, 'Content Recommender\nPersonalized Learning Path', 
           ha='center', va='center', fontsize=11, fontweight='bold')
    
    # Bağlantı okları
    arrows = [
        # User input to router
        ((4, 10.6), (6, 10.6)),
        # Router to components
        ((7.75, 10), (1.5, 8.5)),
        ((7.75, 10), (4.5, 8.5)),
        ((7.75, 10), (7.5, 8.5)),
        ((7.75, 10), (10, 8.5)),
        # Components to content processing
        ((4.5, 7.5), (6, 7.2)),
        # Content to knowledge bases
        ((6, 6), (2, 4.5)),
        ((6, 6), (5, 4.5)),
        ((6, 6), (8, 4.5)),
        # To analytics and recommendations
        ((3, 6), (3, 3.2)),
        ((9, 6), (9, 3.2)),
        # Feedback loops
        ((1.5, 7.5), (3, 3.2)),
        ((10, 7.5), (9, 3.2)),
    ]
    
    for start, end in arrows:
        arrow = FancyArrowPatch(start, end,
                               arrowstyle='->', 
                               mutation_scale=15,
                               linewidth=1.5,
                               color='#424242',
                               alpha=0.7)
        ax.add_patch(arrow)
    
    # Başlık
    ax.text(6, 11.5, 'Educational RAG System - Personalization Architecture', 
           ha='center', va='center', fontsize=16, fontweight='bold')
    
    plt.tight_layout()
    output_path = Path('Makale/diagrams')
    output_path.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path / 'personalization_architecture.png', 
               dpi=300, bbox_inches='tight', facecolor='white')
    plt.savefig(output_path / 'personalization_architecture.pdf', 
               bbox_inches='tight', facecolor='white')
    print("✅ Personalization Architecture diagram oluşturuldu!")
    plt.close()

def create_turkish_nlp_pipeline():
    """Turkish NLP Processing Pipeline Diagram"""
    fig, ax = plt.subplots(1, 1, figsize=(14, 10))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 10)
    ax.axis('off')
    
    colors = {
        'input': '#FFECB3',
        'morpho': '#C8E6C9',
        'semantic': '#BBDEFB',
        'chunking': '#F8BBD9',
        'output': '#D1C4E9'
    }
    
    # Turkish Text Input
    input_box = FancyBboxPatch((1, 8.5), 3, 1,
                              boxstyle="round,pad=0.1",
                              facecolor=colors['input'],
                              edgecolor='black', linewidth=2)
    ax.add_patch(input_box)
    ax.text(2.5, 9, 'Turkish Text Input\n"Osmanlı İmparatorluğu..."', 
           ha='center', va='center', fontsize=10, fontweight='bold')
    
    # Morphological Analysis
    morpho_box = FancyBboxPatch((6, 8.5), 4, 1,
                               boxstyle="round,pad=0.1",
                               facecolor=colors['morpho'],
                               edgecolor='black', linewidth=2)
    ax.add_patch(morpho_box)
    ax.text(8, 9, 'Morpho-Semantic Analysis\nRoot + Suffix + Context Recognition', 
           ha='center', va='center', fontsize=10, fontweight='bold')
    
    # Processing Steps
    steps = [
        ('Tokenization\n& Normalization', 1.5, 6.5, colors['morpho']),
        ('Stemming\n& Lemmatization', 4, 6.5, colors['morpho']),
        ('Stop Words\nFiltering', 6.5, 6.5, colors['morpho']),
        ('Context\nExtraction', 9, 6.5, colors['semantic']),
    ]
    
    for label, x, y, color in steps:
        box = FancyBboxPatch((x-0.6, y-0.4), 1.2, 0.8,
                            boxstyle="round,pad=0.05",
                            facecolor=color,
                            edgecolor='black', linewidth=1)
        ax.add_patch(box)
        ax.text(x, y, label, ha='center', va='center', 
               fontsize=8, fontweight='bold')
    
    # Semantic Chunking Engine
    chunking_box = FancyBboxPatch((2, 4.5), 6, 1.2,
                                 boxstyle="round,pad=0.1",
                                 facecolor=colors['chunking'],
                                 edgecolor='black', linewidth=2)
    ax.add_patch(chunking_box)
    ax.text(5, 5.1, 'Advanced Semantic Chunking\nAdaptive Chunk Refinement + Educational Context', 
           ha='center', va='center', fontsize=11, fontweight='bold')
    
    # Chunking Components
    chunk_components = [
        ('Sentence\nBoundary\nDetection', 1, 2.5, colors['semantic']),
        ('Semantic\nCohesion\nAnalysis', 3.5, 2.5, colors['semantic']),
        ('Educational\nContent\nStructuring', 6, 2.5, colors['chunking']),
        ('Chunk Size\nOptimization', 8.5, 2.5, colors['chunking']),
        ('Quality\nValidation', 11, 2.5, colors['output']),
    ]
    
    for label, x, y, color in chunk_components:
        box = FancyBboxPatch((x-0.5, y-0.4), 1, 0.8,
                            boxstyle="round,pad=0.05",
                            facecolor=color,
                            edgecolor='black', linewidth=1)
        ax.add_patch(box)
        ax.text(x, y, label, ha='center', va='center', 
               fontsize=7, fontweight='bold')
    
    # Output
    output_box = FancyBboxPatch((3, 0.5), 6, 1,
                               boxstyle="round,pad=0.1",
                               facecolor=colors['output'],
                               edgecolor='black', linewidth=2)
    ax.add_patch(output_box)
    ax.text(6, 1, 'Optimized Turkish Chunks\nReady for Retrieval & Generation', 
           ha='center', va='center', fontsize=11, fontweight='bold')
    
    # Bağlantı okları
    arrows = [
        ((4, 9), (6, 9)),  # Input to morpho
        ((2.5, 8.5), (2.5, 7)),  # Input to processing
        ((8, 8.5), (8, 7)),  # Morpho to processing
        ((5, 6), (5, 5.7)),  # Processing to chunking
        ((5, 4.5), (5, 3)),  # Chunking to components
        ((6, 2), (6, 1.5)),  # Components to output
    ]
    
    for start, end in arrows:
        arrow = FancyArrowPatch(start, end,
                               arrowstyle='->', 
                               mutation_scale=15,
                               linewidth=1.5,
                               color='#424242',
                               alpha=0.7)
        ax.add_patch(arrow)
    
    ax.text(6, 9.7, 'Turkish Language Processing Pipeline', 
           ha='center', va='center', fontsize=16, fontweight='bold')
    
    plt.tight_layout()
    output_path = Path('Makale/diagrams')
    output_path.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path / 'turkish_nlp_pipeline.png', 
               dpi=300, bbox_inches='tight', facecolor='white')
    plt.savefig(output_path / 'turkish_nlp_pipeline.pdf', 
               bbox_inches='tight', facecolor='white')
    print("✅ Turkish NLP Pipeline diagram oluşturuldu!")
    plt.close()

def create_educational_features_overview():
    """Educational Features Overview Diagram"""
    fig, ax = plt.subplots(1, 1, figsize=(16, 12))
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 12)
    ax.axis('off')
    
    colors = {
        'adaptive': '#E8F5E9',
        'evaluation': '#E3F2FD',
        'feedback': '#FFF3E0',
        'content': '#FCE4EC',
        'analytics': '#F3E5F5'
    }
    
    # Center: Educational RAG Core
    center_circle = Circle((8, 6), 1.5, facecolor='#4CAF50', 
                          edgecolor='black', linewidth=3)
    ax.add_patch(center_circle)
    ax.text(8, 6, 'Educational\nRAG\nCore', ha='center', va='center', 
           fontsize=12, fontweight='bold', color='white')
    
    # Educational Features around the center
    features = [
        # Feature name, x, y, color, detailed description
        ('Adaptive\nDifficulty\nAdjustment', 4, 9, colors['adaptive'], 
         'ZPD-based\nContent Leveling'),
        ('Real-time\nFeedback\nProcessing', 12, 9, colors['feedback'], 
         'Instant Learning\nAdjustments'),
        ('Educational\nEvaluator\n(RAGAS+)', 2, 6, colors['evaluation'], 
         'Custom Educational\nMetrics'),
        ('Learning Path\nRecommendation', 14, 6, colors['content'], 
         'Personalized\nContent Sequencing'),
        ('Performance\nAnalytics', 4, 3, colors['analytics'], 
         'Learning Progress\nTracking'),
        ('Active Learning\nOptimization', 12, 3, colors['adaptive'], 
         'Query Strategy\nSelection'),
    ]
    
    for name, x, y, color, description in features:
        # Main feature box
        box = FancyBboxPatch((x-1, y-0.8), 2, 1.6,
                            boxstyle="round,pad=0.1",
                            facecolor=color,
                            edgecolor='black', linewidth=2)
        ax.add_patch(box)
        ax.text(x, y+0.2, name, ha='center', va='center', 
               fontsize=9, fontweight='bold')
        ax.text(x, y-0.4, description, ha='center', va='center', 
               fontsize=7, style='italic')
        
        # Connection to center
        arrow = FancyArrowPatch((x, y), (8, 6),
                               arrowstyle='<->', 
                               mutation_scale=15,
                               linewidth=2,
                               color='#666666',
                               alpha=0.6)
        ax.add_patch(arrow)
    
    # Innovation Highlights
    innovation_boxes = [
        ('Turkish NLP\nInnovations', 2, 10, colors['content']),
        ('Morpho-Semantic\nChunking', 6, 10.5, colors['content']),
        ('Educational Context\nAwareness', 10, 10.5, colors['evaluation']),
        ('Hybrid Retrieval\nOptimization', 14, 10, colors['adaptive']),
    ]
    
    for label, x, y, color in innovation_boxes:
        box = FancyBboxPatch((x-0.8, y-0.4), 1.6, 0.8,
                            boxstyle="round,pad=0.05",
                            facecolor=color,
                            edgecolor='#FF5722', linewidth=2,
                            linestyle='--')
        ax.add_patch(box)
        ax.text(x, y, label, ha='center', va='center', 
               fontsize=7, fontweight='bold')
    
    # Key Differentiators
    diff_text = [
        "• Educational Context-Aware Processing",
        "• Turkish Language Specialization", 
        "• Personalized Learning Adaptation",
        "• Real-time Difficulty Adjustment",
        "• Comprehensive Educational Evaluation"
    ]
    
    diff_box = FancyBboxPatch((1, 1), 6, 1.5,
                             boxstyle="round,pad=0.1",
                             facecolor='#FFFDE7',
                             edgecolor='#F57F17', linewidth=2)
    ax.add_patch(diff_box)
    ax.text(4, 1.75, 'Key Differentiators from General RAG:', 
           ha='center', va='top', fontsize=10, fontweight='bold')
    for i, text in enumerate(diff_text):
        ax.text(1.2, 1.5 - i*0.2, text, ha='left', va='center', 
               fontsize=8)
    
    # Technical Innovation
    tech_text = [
        "• RAGAS+ Educational Metrics",
        "• Adaptive Query Routing",
        "• Multi-Modal Content Processing",
        "• Semantic Chunking Refinement",
        "• Performance-Based Optimization"
    ]
    
    tech_box = FancyBboxPatch((9, 1), 6, 1.5,
                             boxstyle="round,pad=0.1",
                             facecolor='#F3E5F5',
                             edgecolor='#7B1FA2', linewidth=2)
    ax.add_patch(tech_box)
    ax.text(12, 1.75, 'Technical Innovations:', 
           ha='center', va='top', fontsize=10, fontweight='bold')
    for i, text in enumerate(tech_text):
        ax.text(9.2, 1.5 - i*0.2, text, ha='left', va='center', 
               fontsize=8)
    
    ax.text(8, 11.5, 'Educational RAG System - Innovative Features Overview', 
           ha='center', va='center', fontsize=16, fontweight='bold')
    
    plt.tight_layout()
    output_path = Path('Makale/diagrams')
    output_path.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path / 'educational_features_overview.png', 
               dpi=300, bbox_inches='tight', facecolor='white')
    plt.savefig(output_path / 'educational_features_overview.pdf', 
               bbox_inches='tight', facecolor='white')
    print("✅ Educational Features Overview diagram oluşturuldu!")
    plt.close()

def create_microservices_architecture():
    """Microservices Architecture Diagram"""
    fig, ax = plt.subplots(1, 1, figsize=(18, 14))
    ax.set_xlim(0, 18)
    ax.set_ylim(0, 14)
    ax.axis('off')
    
    # Renkler - her microservice için farklı renk
    colors = {
        'frontend': '#E3F2FD',      # Mavi
        'gateway': '#FFF3E0',       # Turuncu
        'aprag': '#E8F5E9',         # Yeşil
        'doc_proc': '#F3E5F5',      # Mor
        'model': '#FCE4EC',         # Pembe
        'rerank': '#E0F2F1',        # Turkuaz
        'auth': '#FFF9C4',          # Sarı
        'chromadb': '#EFEBE9',      # Kahve
        'external': '#F5F5F5'       # Gri
    }
    
    # Frontend Layer (Top)
    frontend_box = FancyBboxPatch((7, 12), 4, 1.5,
                                  boxstyle="round,pad=0.1",
                                  facecolor=colors['frontend'],
                                  edgecolor='#1976D2', linewidth=2)
    ax.add_patch(frontend_box)
    ax.text(9, 12.75, 'Frontend Service\nNext.js + React\nPort: 3000',
           ha='center', va='center', fontsize=10, fontweight='bold')
    
    # API Gateway (Second Layer)
    gateway_box = FancyBboxPatch((7, 10), 4, 1.5,
                                 boxstyle="round,pad=0.1",
                                 facecolor=colors['gateway'],
                                 edgecolor='#F57C00', linewidth=2)
    ax.add_patch(gateway_box)
    ax.text(9, 10.75, 'API Gateway\nFastAPI + Nginx\nPort: 8000',
           ha='center', va='center', fontsize=10, fontweight='bold')
    
    # Core Microservices (Third Layer)
    core_services = [
        ('APRAG Service\nPersonalized RAG\nPort: 8007', 1.5, 8, colors['aprag']),
        ('Document Processing\nPDF + Chunking\nPort: 8080', 5, 8, colors['doc_proc']),
        ('Model Inference\nLLM Integration\nPort: 8002', 8.5, 8, colors['model']),
        ('Reranker Service\nResult Optimization\nPort: 8008', 12, 8, colors['rerank']),
        ('Auth Service\nAuthentication\nPort: 8006', 15.5, 8, colors['auth']),
    ]
    
    for label, x, y, color in core_services:
        box = FancyBboxPatch((x-1, y-0.75), 2, 1.5,
                            boxstyle="round,pad=0.08",
                            facecolor=color,
                            edgecolor='black', linewidth=1.5)
        ax.add_patch(box)
        ax.text(x, y, label, ha='center', va='center',
               fontsize=8, fontweight='bold')
    
    # Database & Storage Services (Fourth Layer)
    storage_services = [
        ('ChromaDB\nVector Database\nPort: 8004', 3, 5.5, colors['chromadb']),
        ('PostgreSQL\nUser Profiles\nPort: 5432', 7, 5.5, colors['chromadb']),
        ('Redis Cache\nSession Storage\nPort: 6379', 11, 5.5, colors['chromadb']),
    ]
    
    for label, x, y, color in storage_services:
        box = FancyBboxPatch((x-1, y-0.75), 2, 1.5,
                            boxstyle="round,pad=0.08",
                            facecolor=color,
                            edgecolor='#5D4037', linewidth=1.5)
        ax.add_patch(box)
        ax.text(x, y, label, ha='center', va='center',
               fontsize=8, fontweight='bold')
    
    # External Services (Bottom Layer)
    external_services = [
        ('OpenAI/Groq\nLLM APIs', 2, 3, colors['external']),
        ('Hugging Face\nEmbeddings', 6, 3, colors['external']),
        ('Google Cloud\nDocument AI', 10, 3, colors['external']),
        ('Alibaba\nReranker API', 14, 3, colors['external']),
    ]
    
    for label, x, y, color in external_services:
        box = FancyBboxPatch((x-1, y-0.5), 2, 1,
                            boxstyle="round,pad=0.05",
                            facecolor=color,
                            edgecolor='#757575', linewidth=1,
                            linestyle='--')
        ax.add_patch(box)
        ax.text(x, y, label, ha='center', va='center',
               fontsize=7, fontweight='bold')
    
    # Service Connections - Request Flow
    request_flow = [
        # Frontend -> Gateway
        ((9, 12), (9, 11.5)),
        # Gateway -> Core Services
        ((9, 10), (1.5, 8.5)),    # to APRAG
        ((9, 10), (5, 8.5)),      # to Doc Processing
        ((9, 10), (8.5, 8.5)),    # to Model
        ((9, 10), (12, 8.5)),     # to Reranker
        ((9, 10), (15.5, 8.5)),   # to Auth
        # Core Services -> Storage
        ((1.5, 7.5), (3, 6)),     # APRAG -> ChromaDB
        ((5, 7.5), (7, 6)),       # DocProc -> PostgreSQL
        ((15.5, 7.5), (11, 6)),   # Auth -> Redis
        # Core Services -> External
        ((8.5, 7.5), (6, 3.5)),   # Model -> HuggingFace
        ((8.5, 7.5), (2, 3.5)),   # Model -> OpenAI
        ((5, 7.5), (10, 3.5)),    # DocProc -> Google Cloud
        ((12, 7.5), (14, 3.5)),   # Reranker -> Alibaba
    ]
    
    for start, end in request_flow:
        arrow = FancyArrowPatch(start, end,
                               arrowstyle='->',
                               mutation_scale=12,
                               linewidth=1.5,
                               color='#424242',
                               alpha=0.6)
        ax.add_patch(arrow)
    
    # Inter-service Communication
    inter_service = [
        # APRAG <-> DocProcessing
        ((2.5, 8), (4, 8)),
        # DocProcessing <-> Model
        ((6, 8), (7.5, 8)),
        # Model <-> Reranker
        ((9.5, 8), (11, 8)),
    ]
    
    for start, end in inter_service:
        arrow = FancyArrowPatch(start, end,
                               arrowstyle='<->',
                               mutation_scale=12,
                               linewidth=2,
                               color='#2196F3',
                               alpha=0.8)
        ax.add_patch(arrow)
    
    # Load Balancer indicator
    lb_box = FancyBboxPatch((13, 12), 3, 1.5,
                           boxstyle="round,pad=0.1",
                           facecolor='#E8EAF6',
                           edgecolor='#3F51B5', linewidth=2,
                           linestyle=':')
    ax.add_patch(lb_box)
    ax.text(14.5, 12.75, 'Load Balancer\n& Health Checks\nDocker Compose',
           ha='center', va='center', fontsize=9, fontweight='bold')
    
    # Container Orchestration note
    container_box = FancyBboxPatch((1, 1), 4, 1,
                                  boxstyle="round,pad=0.05",
                                  facecolor='#E0F7FA',
                                  edgecolor='#00ACC1', linewidth=1.5)
    ax.add_patch(container_box)
    ax.text(3, 1.5, 'Container Orchestration:\nDocker + Docker Compose',
           ha='center', va='center', fontsize=8, fontweight='bold')
    
    # Scaling note
    scaling_box = FancyBboxPatch((13, 1), 4, 1,
                                boxstyle="round,pad=0.05",
                                facecolor='#FFF8E1',
                                edgecolor='#FFB300', linewidth=1.5)
    ax.add_patch(scaling_box)
    ax.text(15, 1.5, 'Scalability:\nHorizontal Scaling Ready\nKubernetes Compatible',
           ha='center', va='center', fontsize=8, fontweight='bold')
    
    # Başlık
    ax.text(9, 13.7, 'Educational RAG System - Microservices Architecture',
           ha='center', va='center', fontsize=16, fontweight='bold')
    
    plt.tight_layout()
    output_path = Path('Makale/diagrams')
    output_path.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path / 'microservices_architecture.png',
               dpi=300, bbox_inches='tight', facecolor='white')
    plt.savefig(output_path / 'microservices_architecture.pdf',
               bbox_inches='tight', facecolor='white')
    print("✅ Microservices Architecture diagram oluşturuldu!")
    plt.close()

def create_evaluation_framework():
    """Evaluation Framework Diagram - RAGAS+ Educational Metrics"""
    fig, ax = plt.subplots(1, 1, figsize=(14, 10))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 10)
    ax.axis('off')
    
    colors = {
        'ragas': '#E3F2FD',
        'educational': '#E8F5E9',
        'performance': '#FFF3E0',
        'output': '#FCE4EC'
    }
    
    # RAGAS Core Metrics
    ragas_box = FancyBboxPatch((1, 7), 5, 2,
                              boxstyle="round,pad=0.1",
                              facecolor=colors['ragas'],
                              edgecolor='#1976D2', linewidth=2)
    ax.add_patch(ragas_box)
    ax.text(3.5, 8.5, 'RAGAS Core Metrics', 
           ha='center', va='center', fontsize=12, fontweight='bold')
    
    ragas_metrics = [
        "• Context Precision", "• Context Recall", 
        "• Faithfulness", "• Answer Relevancy"
    ]
    for i, metric in enumerate(ragas_metrics):
        ax.text(1.2, 8.2 - i*0.3, metric, ha='left', va='center', fontsize=9)
    
    # Educational Enhancement
    edu_box = FancyBboxPatch((8, 7), 5, 2,
                            boxstyle="round,pad=0.1",
                            facecolor=colors['educational'],
                            edgecolor='#388E3C', linewidth=2)
    ax.add_patch(edu_box)
    ax.text(10.5, 8.5, 'Educational Enhancements', 
           ha='center', va='center', fontsize=12, fontweight='bold')
    
    edu_metrics = [
        "• Pedagogical Structure", "• Clarity Assessment",
        "• Explanation Quality", "• Completeness Analysis"
    ]
    for i, metric in enumerate(edu_metrics):
        ax.text(8.2, 8.2 - i*0.3, metric, ha='left', va='center', fontsize=9)
    
    # Combined Evaluation Engine
    eval_box = FancyBboxPatch((3, 4.5), 8, 1.5,
                             boxstyle="round,pad=0.1",
                             facecolor=colors['performance'],
                             edgecolor='#F57C00', linewidth=2)
    ax.add_patch(eval_box)
    ax.text(7, 5.6, 'RAGAS+ Educational Evaluator', 
           ha='center', va='center', fontsize=12, fontweight='bold')
    ax.text(7, 5, 'Weighted Scoring: RAGAS (60%) + Educational (40%)', 
           ha='center', va='center', fontsize=10, style='italic')
    
    # Performance Dimensions
    dimensions = [
        ('Technical\nAccuracy', 2, 2.5, colors['ragas']),
        ('Educational\nEffectiveness', 5, 2.5, colors['educational']),
        ('Learning\nImpact', 8, 2.5, colors['educational']),
        ('User\nExperience', 11, 2.5, colors['performance']),
    ]
    
    for label, x, y, color in dimensions:
        box = FancyBboxPatch((x-0.8, y-0.5), 1.6, 1,
                            boxstyle="round,pad=0.05",
                            facecolor=color,
                            edgecolor='black', linewidth=1.5)
        ax.add_patch(box)
        ax.text(x, y, label, ha='center', va='center', 
               fontsize=9, fontweight='bold')
    
    # Final Output
    output_box = FancyBboxPatch((4.5, 0.5), 5, 1,
                               boxstyle="round,pad=0.1",
                               facecolor=colors['output'],
                               edgecolor='#C2185B', linewidth=2)
    ax.add_patch(output_box)
    ax.text(7, 1, 'Comprehensive Educational Quality Score\n(0.0 - 1.0)', 
           ha='center', va='center', fontsize=11, fontweight='bold')
    
    # Bağlantı okları
    arrows = [
        ((3.5, 7), (6, 6)),  # RAGAS to evaluator
        ((10.5, 7), (8, 6)),  # Educational to evaluator
        ((7, 4.5), (7, 3.5)),  # Evaluator to dimensions
        ((6.5, 2), (7, 1.5)),  # Dimensions to output
    ]
    
    for start, end in arrows:
        arrow = FancyArrowPatch(start, end,
                               arrowstyle='->', 
                               mutation_scale=15,
                               linewidth=2,
                               color='#424242',
                               alpha=0.7)
        ax.add_patch(arrow)
    
    ax.text(7, 9.5, 'Educational RAG Evaluation Framework (RAGAS+)', 
           ha='center', va='center', fontsize=16, fontweight='bold')
    
    plt.tight_layout()
    output_path = Path('Makale/diagrams')
    output_path.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path / 'evaluation_framework.png', 
               dpi=300, bbox_inches='tight', facecolor='white')
    plt.savefig(output_path / 'evaluation_framework.pdf', 
               bbox_inches='tight', facecolor='white')
    print("✅ Evaluation Framework diagram oluşturuldu!")
    plt.close()

if __name__ == "__main__":
    print("🎨 Educational RAG System - Technical Diagrams Creating...\n")
    
    # Diagram klasörünü oluştur
    output_path = Path('Makale/diagrams')
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Tüm diagramları oluştur
    create_personalization_architecture()
    create_turkish_nlp_pipeline()
    create_educational_features_overview()
    create_microservices_architecture()
    create_evaluation_framework()
    
    print(f"\n✅ Tüm teknik diagramlar oluşturuldu!")
    print(f"📁 Konum: {output_path}")
    print("📄 Formatlar: PNG (300 DPI) ve PDF (vektör)")
    print("\n📊 Oluşturulan Diagramlar:")
    print("   1. personalization_architecture.png/pdf - Kişiselleştirme Mimarisi")
    print("   2. turkish_nlp_pipeline.png/pdf - Türkçe NLP İşlem Hattı")
    print("   3. educational_features_overview.png/pdf - Eğitsel Özellikler Özeti")
    print("   4. microservices_architecture.png/pdf - Microservices Mimarisi")
    print("   5. evaluation_framework.png/pdf - Değerlendirme Çerçevesi (RAGAS+)")