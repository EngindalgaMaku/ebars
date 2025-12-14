#!/usr/bin/env python3
"""
Educational RAG System - Clean & Simple Diagrams
Daha temiz ve anlaşılır teknik diagramlar
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle
import numpy as np
from pathlib import Path

# Türkçe font desteği ve temiz görselleştirme ayarları
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 12
plt.rcParams['figure.dpi'] = 300
plt.rcParams['axes.unicode_minus'] = False

def create_simple_architecture():
    """Basit ve Temiz Sistem Mimarisi"""
    fig, ax = plt.subplots(1, 1, figsize=(14, 8))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 8)
    ax.axis('off')
    
    # Temiz renk paleti
    colors = {
        'user': '#3498DB',        # Mavi
        'frontend': '#2ECC71',    # Yeşil  
        'gateway': '#F39C12',     # Turuncu
        'services': '#9B59B6',    # Mor
        'storage': '#34495E'      # Koyu gri
    }
    
    # User Layer
    user_rect = Rectangle((1, 6.5), 2, 1, facecolor=colors['user'], 
                         edgecolor='black', linewidth=2)
    ax.add_patch(user_rect)
    ax.text(2, 7, 'User\nInterface', ha='center', va='center', 
           fontsize=10, fontweight='bold', color='white')
    
    # Frontend Layer  
    frontend_rect = Rectangle((5, 6.5), 4, 1, facecolor=colors['frontend'],
                            edgecolor='black', linewidth=2)
    ax.add_patch(frontend_rect)
    ax.text(7, 7, 'Frontend (Next.js)\nPort: 3000', ha='center', va='center',
           fontsize=10, fontweight='bold', color='white')
    
    # API Gateway
    gateway_rect = Rectangle((11, 6.5), 2, 1, facecolor=colors['gateway'],
                           edgecolor='black', linewidth=2)
    ax.add_patch(gateway_rect)
    ax.text(12, 7, 'API Gateway\nPort: 8000', ha='center', va='center',
           fontsize=10, fontweight='bold', color='white')
    
    # Core Services
    services = [
        ('APRAG\n:8007', 2, 4.5),
        ('Document\n:8080', 5, 4.5),
        ('Model\n:8002', 8, 4.5),
        ('Auth\n:8006', 11, 4.5)
    ]
    
    for label, x, y in services:
        service_rect = Rectangle((x-0.8, y-0.5), 1.6, 1, 
                               facecolor=colors['services'],
                               edgecolor='black', linewidth=1.5)
        ax.add_patch(service_rect)
        ax.text(x, y, label, ha='center', va='center',
               fontsize=9, fontweight='bold', color='white')
    
    # Storage Layer
    storage_services = [
        ('ChromaDB\n:8004', 3, 2.5),
        ('PostgreSQL\n:5432', 7, 2.5),
        ('Redis\n:6379', 10, 2.5)
    ]
    
    for label, x, y in storage_services:
        storage_rect = Rectangle((x-1, y-0.5), 2, 1,
                               facecolor=colors['storage'],
                               edgecolor='black', linewidth=1.5)
        ax.add_patch(storage_rect)
        ax.text(x, y, label, ha='center', va='center',
               fontsize=9, fontweight='bold', color='white')
    
    # Simple Arrows
    arrows = [
        # User -> Frontend -> Gateway
        ((2, 6.5), (5, 7)),
        ((9, 6.5), (11, 7)),
        # Gateway -> Services
        ((12, 6.5), (8, 5)),
        # Services -> Storage (select few)
        ((5, 4), (7, 3)),
        ((8, 4), (7, 3)),
    ]
    
    for start, end in arrows:
        arrow = FancyArrowPatch(start, end, arrowstyle='->', 
                               mutation_scale=20, linewidth=2,
                               color='#2C3E50', alpha=0.7)
        ax.add_patch(arrow)
    
    # Title
    ax.text(7, 7.8, 'Educational RAG System - System Architecture', 
           ha='center', va='center', fontsize=16, fontweight='bold')
    
    plt.tight_layout()
    output_path = Path('Makale/diagrams')
    output_path.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path / 'clean_architecture.png', 
               dpi=300, bbox_inches='tight', facecolor='white')
    plt.savefig(output_path / 'clean_architecture.pdf', 
               bbox_inches='tight', facecolor='white')
    print("✅ Clean Architecture diagram oluşturuldu!")
    plt.close()

def create_simple_rag_flow():
    """Basit RAG Akış Diagramı"""
    fig, ax = plt.subplots(1, 1, figsize=(12, 8))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8)
    ax.axis('off')
    
    # Flow colors
    colors = {
        'input': '#3498DB',
        'process': '#2ECC71', 
        'retrieve': '#F39C12',
        'generate': '#9B59B6',
        'output': '#E74C3C'
    }
    
    # Flow steps
    steps = [
        ('User Query', 2, 7, colors['input'], 'Kullanıcı Sorusu'),
        ('Query Processing', 6, 7, colors['process'], 'Soru İşleme'),
        ('Document Retrieval', 10, 7, colors['retrieve'], 'Belge Alımı'),
        ('Context Selection', 10, 5, colors['retrieve'], 'Bağlam Seçimi'),
        ('Answer Generation', 6, 5, colors['generate'], 'Yanıt Üretimi'),
        ('Response', 2, 5, colors['output'], 'Yanıt')
    ]
    
    for i, (label, x, y, color, turkish) in enumerate(steps):
        rect = Rectangle((x-0.8, y-0.4), 1.6, 0.8, 
                        facecolor=color, edgecolor='black', linewidth=2)
        ax.add_patch(rect)
        ax.text(x, y, f'{i+1}. {turkish}', ha='center', va='center',
               fontsize=9, fontweight='bold', color='white')
    
    # Flow arrows
    flow_arrows = [
        ((2.8, 7), (5.2, 7)),      # Query -> Processing
        ((6.8, 7), (9.2, 7)),      # Processing -> Retrieval
        ((10, 6.6), (10, 5.4)),    # Retrieval -> Context
        ((9.2, 5), (6.8, 5)),      # Context -> Generation
        ((5.2, 5), (2.8, 5))       # Generation -> Response
    ]
    
    for start, end in flow_arrows:
        arrow = FancyArrowPatch(start, end, arrowstyle='->', 
                               mutation_scale=20, linewidth=2,
                               color='#2C3E50')
        ax.add_patch(arrow)
    
    # Knowledge Base
    kb_rect = Rectangle((4, 2.5), 4, 1.5, facecolor='#95A5A6',
                       edgecolor='black', linewidth=2)
    ax.add_patch(kb_rect)
    ax.text(6, 3.25, 'Knowledge Base\n(Processed Documents)', 
           ha='center', va='center', fontsize=10, fontweight='bold')
    
    # KB connection
    kb_arrow = FancyArrowPatch((6, 4), (8.5, 6.5), arrowstyle='<->', 
                              mutation_scale=15, linewidth=1.5,
                              color='#7F8C8D', linestyle='--')
    ax.add_patch(kb_arrow)
    
    ax.text(6, 7.7, 'Educational RAG System - Query Processing Flow', 
           ha='center', va='center', fontsize=16, fontweight='bold')
    
    plt.tight_layout()
    output_path = Path('Makale/diagrams')
    output_path.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path / 'clean_rag_flow.png', 
               dpi=300, bbox_inches='tight', facecolor='white')
    plt.savefig(output_path / 'clean_rag_flow.pdf', 
               bbox_inches='tight', facecolor='white')
    print("✅ Clean RAG Flow diagram oluşturuldu!")
    plt.close()

def create_simple_personalization():
    """Basit Kişiselleştirme Diagramı"""
    fig, ax = plt.subplots(1, 1, figsize=(10, 8))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis('off')
    
    # Center: Student
    from matplotlib.patches import Circle
    student_circle = Circle((5, 4), 1, facecolor='#3498DB', 
                          edgecolor='black', linewidth=3)
    ax.add_patch(student_circle)
    ax.text(5, 4, 'Öğrenci\nProfili', ha='center', va='center',
           fontsize=12, fontweight='bold', color='white')
    
    # Personalization components around center
    components = [
        ('Zorluk\nAyarlama', 2, 6.5, '#2ECC71'),
        ('İçerik\nÖnerisi', 8, 6.5, '#F39C12'),
        ('Geri Bildirim\nAnalizi', 2, 1.5, '#9B59B6'),
        ('Performans\nTakibi', 8, 1.5, '#E74C3C')
    ]
    
    for label, x, y, color in components:
        rect = Rectangle((x-0.7, y-0.5), 1.4, 1, facecolor=color,
                        edgecolor='black', linewidth=2)
        ax.add_patch(rect)
        ax.text(x, y, label, ha='center', va='center',
               fontsize=9, fontweight='bold', color='white')
        
        # Connection to center
        arrow = FancyArrowPatch((x, y), (5, 4), arrowstyle='<->', 
                               mutation_scale=15, linewidth=2,
                               color='#7F8C8D', alpha=0.7)
        ax.add_patch(arrow)
    
    ax.text(5, 7.5, 'Personalized Learning System', 
           ha='center', va='center', fontsize=16, fontweight='bold')
    
    plt.tight_layout()
    output_path = Path('Makale/diagrams')
    output_path.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path / 'clean_personalization.png', 
               dpi=300, bbox_inches='tight', facecolor='white')
    plt.savefig(output_path / 'clean_personalization.pdf', 
               bbox_inches='tight', facecolor='white')
    print("✅ Clean Personalization diagram oluşturuldu!")
    plt.close()

def create_simple_turkish_nlp():
    """Basit Türkçe NLP Diagramı"""
    fig, ax = plt.subplots(1, 1, figsize=(12, 6))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 6)
    ax.axis('off')
    
    # Processing pipeline
    steps = [
        ('Turkish\nText', 1.5, 4, '#3498DB'),
        ('Morphological\nAnalysis', 4, 4, '#2ECC71'),
        ('Semantic\nChunking', 7, 4, '#F39C12'),
        ('Optimized\nChunks', 10, 4, '#9B59B6')
    ]
    
    for label, x, y, color in steps:
        rect = Rectangle((x-0.7, y-0.6), 1.4, 1.2, facecolor=color,
                        edgecolor='black', linewidth=2)
        ax.add_patch(rect)
        ax.text(x, y, label, ha='center', va='center',
               fontsize=9, fontweight='bold', color='white')
    
    # Pipeline arrows
    pipeline_arrows = [
        ((2.2, 4), (3.3, 4)),
        ((4.7, 4), (6.3, 4)),
        ((7.7, 4), (9.3, 4))
    ]
    
    for start, end in pipeline_arrows:
        arrow = FancyArrowPatch(start, end, arrowstyle='->', 
                               mutation_scale=20, linewidth=2,
                               color='#2C3E50')
        ax.add_patch(arrow)
    
    # Supporting processes
    support_rect = Rectangle((3, 1.5), 6, 1, facecolor='#95A5A6',
                           edgecolor='black', linewidth=1.5)
    ax.add_patch(support_rect)
    ax.text(6, 2, 'Turkish Language Processing Tools\nStemming • Stop Words • Context Analysis', 
           ha='center', va='center', fontsize=9, fontweight='bold')
    
    ax.text(6, 5.5, 'Turkish Language Processing Pipeline', 
           ha='center', va='center', fontsize=16, fontweight='bold')
    
    plt.tight_layout()
    output_path = Path('Makale/diagrams')
    output_path.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path / 'clean_turkish_nlp.png', 
               dpi=300, bbox_inches='tight', facecolor='white')
    plt.savefig(output_path / 'clean_turkish_nlp.pdf', 
               bbox_inches='tight', facecolor='white')
    print("✅ Clean Turkish NLP diagram oluşturuldu!")
    plt.close()

if __name__ == "__main__":
    print("🎨 Educational RAG System - Clean Diagrams Creating...\n")
    
    output_path = Path('Makale/diagrams')
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Temiz ve basit diagramları oluştur
    create_simple_architecture()
    create_simple_rag_flow()
    create_simple_personalization() 
    create_simple_turkish_nlp()
    
    print(f"\n✅ Tüm temiz diagramlar oluşturuldu!")
    print(f"📁 Konum: {output_path}")
    print("📄 Formatlar: PNG (300 DPI) ve PDF (vektör)")
    print("\n📊 Temiz Diagramlar:")
    print("   1. clean_architecture.png/pdf - Temiz Sistem Mimarisi")
    print("   2. clean_rag_flow.png/pdf - RAG Akış Diagramı")
    print("   3. clean_personalization.png/pdf - Kişiselleştirme Sistemi")
    print("   4. clean_turkish_nlp.png/pdf - Türkçe NLP Pipeline")