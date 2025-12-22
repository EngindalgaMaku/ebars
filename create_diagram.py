from graphviz import Digraph

def create_experimental_design_diagram():
    # Şema oluşturuluyor (Soldan Sağa akış)
    dot = Digraph(comment='Deneysel Tasarım', format='png')
    dot.attr(rankdir='LR', splines='ortho')
    
    # Genel Font ve Stil Ayarları
    dot.attr('node', shape='box', style='rounded,filled', 
             fontname='Arial', fontsize='10', fillcolor='white', color='#333333')
    dot.attr('edge', fontname='Arial', fontsize='9', color='#555555')

    # --- 1. Veri Hazırlık Aşaması (Cluster) ---
    with dot.subgraph(name='cluster_data') as c:
        c.attr(label='1. Veri Seti Hazırlığı', style='dashed', color='#888888', fontcolor='#666666')
        c.node('PDF', 'Ders Materyali\n(120 Sayfa PDF)', fillcolor='#E3F2FD')
        c.node('QA', 'Soru Havuzu\n(50 Adet)', fillcolor='#E3F2FD')
        c.node('GT', 'Referans Yanıtlar\n(Ground Truth)', fillcolor='#E3F2FD')

    # --- 2. Sistem İşleyişi (Test Ortamı) ---
    with dot.subgraph(name='cluster_system') as c:
        c.attr(label='2. Test Ortamı (AkıllıRehber)', style='dashed', color='#888888', fontcolor='#666666')
        c.node('RAG', 'RAG Pipeline\n(Retrieval + Generation)', shape='component', fillcolor='#FFF3E0')
        c.node('Output', 'Sistem Yanıtı\n(Generated Answer)', fillcolor='#FFF8E1')

    # --- 3. Değerlendirme (Metrikler) ---
    with dot.subgraph(name='cluster_eval') as c:
        c.attr(label='3. Değerlendirme Metrikleri', style='dashed', color='#888888', fontcolor='#666666')
        
        # Erişim Metrikleri
        c.node('Retrieval_Metrics', 'Erişim Kalitesi\n- Cosine Similarity\n- Precision@5', shape='note', fillcolor='#E8F5E9')
        
        # Üretim Metrikleri
        c.node('Gen_Metrics', 'Üretim Kalitesi\n- Semantic Similarity\n(Embedding Cosine)', shape='note', fillcolor='#E8F5E9')
        
        # Latency
        c.node('Perf_Metrics', 'Performans\n- Latency (ms)', shape='note', fillcolor='#FCE4EC')

    # --- Bağlantılar (Edges) ---
    
    # Veriden Sisteme
    dot.edge('PDF', 'RAG', label='Indexing')
    dot.edge('QA', 'RAG', label='Sorgu')
    
    # Sistemden Çıktıya
    dot.edge('RAG', 'Output', label='Üretim')
    dot.edge('RAG', 'Perf_Metrics', style='dotted')

    # Karşılaştırma ve Metrikler
    dot.edge('Output', 'Gen_Metrics', label='Karşılaştırma')
    dot.edge('GT', 'Gen_Metrics') # Ground Truth ile karşılaştırma
    
    dot.edge('RAG', 'Retrieval_Metrics', label='Chunk Analizi')

    return dot

# Şemayı oluştur ve kaydet
diagram = create_experimental_design_diagram()
diagram.render('deneysel_tasarim_sema', view=False)
print("Şema 'deneysel_tasarim_sema.png' olarak kaydedildi.")
















