import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch
import numpy as np

# Create figure and axis with better sizing
fig, ax = plt.subplots(1, 1, figsize=(16, 12))
ax.set_xlim(0, 16)
ax.set_ylim(0, 12)
ax.axis('off')

# Define professional colors for different types of services
colors = {
    'gateway': '#1f4e79',      # Deep blue for gateway
    'frontend': '#7b68ee',     # Medium slate blue for frontend
    'auth': '#ff8c00',         # Dark orange for auth
    'processing': '#dc143c',   # Crimson for processing services
    'data': '#32cd32',         # Lime green for data services
    'ai': '#9932cc',           # Dark orchid for AI services
    'orchestration': '#ff4500', # Orange red for orchestration
    'pdf': '#4169e1',          # Royal blue for PDF service
}

# Service definitions with better spacing and sizing for text visibility
services = {
    'API Gateway': {
        'pos': (8, 10.5),
        'size': (3.5, 1.2),
        'color': colors['gateway'],
        'shape': 'diamond'
    },
    'Önyüz': {
        'pos': (3, 10.5),
        'size': (2.5, 1.2),
        'color': colors['frontend'],
        'shape': 'rounded'
    },
    'Kimlik Doğrulama': {
        'pos': (13, 10.5),
        'size': (3, 1.2),
        'color': colors['auth'],
        'shape': 'rounded'
    },
    'PDF Dönüştürme': {
        'pos': (2.5, 8.5),
        'size': (3.5, 1.2),
        'color': colors['pdf'],
        'shape': 'hexagon'
    },
    'Doküman İşleme': {
        'pos': (6.5, 8.5),
        'size': (3.5, 1.2),
        'color': colors['processing'],
        'shape': 'hexagon'
    },
    'Model Çıkarım': {
        'pos': (10.5, 8.5),
        'size': (3, 1.2),
        'color': colors['ai'],
        'shape': 'circle'
    },
    'Yeniden Sıralama': {
        'pos': (13.5, 8.5),
        'size': (2.8, 1.2),
        'color': colors['ai'],
        'shape': 'circle'
    },
    'Vektör Veritabanı': {
        'pos': (4.5, 6),
        'size': (3.5, 1.4),
        'color': colors['data'],
        'shape': 'cylinder'
    },
    'APRAG Yönetimi': {
        'pos': (11, 6),
        'size': (3.5, 1.4),
        'color': colors['orchestration'],
        'shape': 'star'
    }
}

# Function to create different professional shapes
def create_shape(ax, name, props):
    pos = props['pos']
    size = props['size']
    color = props['color']
    shape = props['shape']
    
    x, y = pos
    w, h = size
    
    if shape == 'rounded':
        box = FancyBboxPatch((x-w/2, y-h/2), w, h, boxstyle="round,pad=0.15", 
                           facecolor=color, edgecolor='#2c3e50', linewidth=2, alpha=0.9)
    elif shape == 'diamond':
        # Create diamond shape
        diamond_points = [(x, y+h/2), (x+w/2, y), (x, y-h/2), (x-w/2, y)]
        box = patches.Polygon(diamond_points, facecolor=color, edgecolor='#2c3e50', 
                            linewidth=2, alpha=0.9)
    elif shape == 'hexagon':
        # Create hexagon
        angles = np.linspace(0, 2*np.pi, 7)
        hex_x = x + (w/2.5) * np.cos(angles)
        hex_y = y + (h/2.5) * np.sin(angles)
        hex_points = list(zip(hex_x, hex_y))
        box = patches.Polygon(hex_points, facecolor=color, edgecolor='#2c3e50', 
                            linewidth=2, alpha=0.9)
    elif shape == 'circle':
        radius = min(w, h) / 2.2
        box = patches.Circle((x, y), radius, facecolor=color, edgecolor='#2c3e50', 
                    linewidth=2, alpha=0.9)
    elif shape == 'cylinder':
        # Create database cylinder with ellipse and rectangle
        ellipse_top = patches.Ellipse((x, y+h/4), w, h/4, facecolor=color, 
                                    edgecolor='#2c3e50', linewidth=2, alpha=0.9)
        rect = patches.Rectangle((x-w/2, y-h/2), w, h/2, facecolor=color, 
                               edgecolor='#2c3e50', linewidth=2, alpha=0.9)
        ellipse_bottom = patches.Ellipse((x, y-h/4), w, h/4, facecolor=color, 
                                       edgecolor='#2c3e50', linewidth=2, alpha=0.9)
        ax.add_patch(rect)
        ax.add_patch(ellipse_bottom)
        ax.add_patch(ellipse_top)
        box = None  # Already added patches
    elif shape == 'star':
        # Create star shape for orchestration
        n_points = 8
        angles = np.linspace(0, 2*np.pi, n_points*2, endpoint=False)
        radii = [w/2.5 if i%2==0 else w/4.5 for i in range(n_points*2)]
        star_x = x + np.array(radii) * np.cos(angles)
        star_y = y + np.array(radii) * np.sin(angles) * (h/w)
        star_points = list(zip(star_x, star_y))
        box = patches.Polygon(star_points, facecolor=color, edgecolor='#2c3e50',
                            linewidth=2, alpha=0.9)
    
    if box:
        ax.add_patch(box)
    
    # Add service name with professional styling and better text handling
    font_size = 11 if len(name) > 12 else 12
    ax.text(x, y, name, ha='center', va='center', fontsize=font_size,
            fontweight='bold', color='white', wrap=True)

# Draw all services
for name, props in services.items():
    create_shape(ax, name, props)

# Define connections with updated service names
connections = [
    # User interactions
    ('Önyüz', 'API Gateway'),
    ('Kimlik Doğrulama', 'API Gateway'),
    
    # Processing pipeline
    ('API Gateway', 'PDF Dönüştürme'),
    ('API Gateway', 'Doküman İşleme'),
    ('API Gateway', 'APRAG Yönetimi'),
    
    # Data flow
    ('PDF Dönüştürme', 'Doküman İşleme'),
    ('Doküman İşleme', 'Vektör Veritabanı'),
    
    # AI services connections
    ('APRAG Yönetimi', 'Model Çıkarım'),
    ('APRAG Yönetimi', 'Yeniden Sıralama'),
    ('APRAG Yönetimi', 'Vektör Veritabanı'),
]

# Function to draw professional arrows
def draw_connection(ax, start_name, end_name):
    start_pos = services[start_name]['pos']
    end_pos = services[end_name]['pos']
    
    # Calculate connection points based on service boundaries
    start_size = services[start_name]['size']
    end_size = services[end_name]['size']
    
    # Determine best connection points
    dx = end_pos[0] - start_pos[0]
    dy = end_pos[1] - start_pos[1]
    
    # Calculate offset based on shape sizes
    if abs(dx) > abs(dy):  # Horizontal dominant
        if dx > 0:  # Left to right
            start_point = (start_pos[0] + start_size[0]/2, start_pos[1])
            end_point = (end_pos[0] - end_size[0]/2, end_pos[1])
        else:  # Right to left
            start_point = (start_pos[0] - start_size[0]/2, start_pos[1])
            end_point = (end_pos[0] + end_size[0]/2, end_pos[1])
    else:  # Vertical dominant
        if dy > 0:  # Bottom to top
            start_point = (start_pos[0], start_pos[1] + start_size[1]/2)
            end_point = (end_pos[0], end_pos[1] - end_size[1]/2)
        else:  # Top to bottom
            start_point = (start_pos[0], start_pos[1] - start_size[1]/2)
            end_point = (end_pos[0], end_pos[1] + end_size[1]/2)
    
    # Draw arrows
    ax.annotate('', xy=end_point, xytext=start_point,
                arrowprops=dict(arrowstyle='->', lw=2, color='#34495e', alpha=0.8))

# Draw all connections
for start, end in connections:
    draw_connection(ax, start, end)

# Add professional title
title_box = FancyBboxPatch((2, 11.2), 12, 0.6, boxstyle="round,pad=0.1", 
                          facecolor='#2c3e50', edgecolor='#34495e', linewidth=2)
ax.add_patch(title_box)
ax.text(8, 11.5, 'Kişiselleştirilmiş Öğrenme Asistanı - Sistem Mimarisi', 
        ha='center', va='center', fontsize=15, fontweight='bold', color='white')

# Add professional legend
legend_y_start = 4.5
legend_items = [
    ('API Gateway & Yönlendirme', colors['gateway']),
    ('Kullanıcı Arayüzleri', colors['frontend']),
    ('Kimlik Doğrulama', colors['auth']),
    ('Doküman İşleme', colors['processing']),
    ('Yapay Zeka Servisleri', colors['ai']),
    ('Veri Depolama', colors['data']),
    ('RAG Yönetimi', colors['orchestration'])
]

for i, (label, color) in enumerate(legend_items):
    y_pos = legend_y_start - i * 0.35
    legend_box = patches.Rectangle((0.5, y_pos-0.08), 0.25, 0.16, 
                                 facecolor=color, edgecolor='black', alpha=0.9)
    ax.add_patch(legend_box)
    ax.text(0.9, y_pos, label, fontsize=10, va='center', fontweight='bold')

# Add data flow description
flow_box = FancyBboxPatch((0.3, 0.3), 7.5, 1.5, boxstyle="round,pad=0.1", 
                         facecolor='#ecf0f1', edgecolor='#95a5a6', linewidth=2, alpha=0.9)
ax.add_patch(flow_box)

ax.text(0.5, 1.5, 'Veri Akış Süreci:', fontsize=12, fontweight='bold', color='#2c3e50')
flow_steps = [
    '1. PDF → Markdown Dönüştürme',
    '2. Chunking → Embedding → Vektör DB',
    '3. Soru → Arama → Reranking → LLM → Yanıt',
    '4. Benzer Sorular + Kaynak Bilgisi'
]

for i, step in enumerate(flow_steps):
    ax.text(0.6, 1.2 - i*0.2, step, fontsize=9, color='#34495e')

# Add technology information
tech_box = FancyBboxPatch((9, 0.3), 6.5, 1.8, boxstyle="round,pad=0.1", 
                         facecolor='#f8f9fa', edgecolor='#6c757d', linewidth=2, alpha=0.9)
ax.add_patch(tech_box)

ax.text(9.2, 1.9, 'Teknoloji Detayları:', fontsize=12, fontweight='bold', color='#2c3e50')
tech_items = [
    '• Mikroservis Mimarisi',
    '• Docker Konteynerizasyon',
    '• API Tabanlı LLM Entegrasyonu',
    '• Türkçe NLP Optimizasyonları',
    '• Chromium Vektör Veritabanı',
    '• Alibaba Reranker Teknolojisi'
]

for i, tech in enumerate(tech_items):
    ax.text(9.4, 1.6 - i*0.18, tech, fontsize=9, color='#495057')

plt.tight_layout()

# Save with high quality
plt.savefig('Makale/sistem_mimarisi_diagram.png', dpi=300, bbox_inches='tight', 
            facecolor='white', edgecolor='none', format='png')
plt.savefig('Makale/sistem_mimarisi_diagram.pdf', dpi=300, bbox_inches='tight', 
            facecolor='white', edgecolor='none', format='pdf')

print("✅ Sistem mimarisi diagramı oluşturuldu!")
print("📁 Dosyalar: sistem_mimarisi_diagram.png & sistem_mimarisi_diagram.pdf")