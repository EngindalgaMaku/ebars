#!/usr/bin/env python3
"""
EBARS Simülasyon Grafikleri Oluştur
Makale için metodoloji grafiklerini oluşturur
"""

import sqlite3
import os
import sys
from typing import Dict, List, Any, Optional
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # GUI olmadan çalışması için

# Türkçe karakter desteği
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['axes.unicode_minus'] = False

def get_db_path():
    """Database path'i bul - Docker ve local için"""
    # Önce environment variable'dan kontrol et
    db_path = os.getenv("APRAG_DB_PATH") or os.getenv("DB_PATH") or os.getenv("DATABASE_PATH")
    if db_path and os.path.exists(db_path):
        return db_path
    
    # Sonra olası path'leri kontrol et
    possible_paths = [
        "/app/data/rag_assistant.db",  # Docker container path (production)
        "data/rag_assistant.db",  # Local path
        "../data/rag_assistant.db",
        "../../data/rag_assistant.db",
        "/data/rag_assistant.db",  # Alternative Docker path
    ]
    for path in possible_paths:
        if os.path.exists(path):
            return path
    raise FileNotFoundError(f"Database file not found. Checked paths: {possible_paths}")

def check_table_exists(conn: sqlite3.Connection, table_name: str) -> bool:
    """Tablo var mı kontrol et"""
    cursor = conn.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
    """, (table_name,))
    return cursor.fetchone() is not None

def get_simulation_data(db_path: str, simulation_id: Optional[str] = None) -> Dict[str, Any]:
    """Simülasyon verilerini getir"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    # Tabloları kontrol et
    if not check_table_exists(conn, 'ebars_simulations'):
        conn.close()
        return {'success': False, 'error': 'Simülasyon tabloları bulunamadı'}
    
    # En son tamamlanan simülasyonu bul
    if not simulation_id:
        cursor = conn.execute("""
            SELECT simulation_id FROM ebars_simulations
            WHERE status IN ('completed', 'failed', 'stopped')
            ORDER BY completed_at DESC
            LIMIT 1
        """)
        result = cursor.fetchone()
        if not result:
            conn.close()
            return {'success': False, 'error': 'Tamamlanmış simülasyon bulunamadı'}
        simulation_id = result['simulation_id']
    
    # Agent verilerini getir
    agents_cursor = conn.execute("""
        SELECT agent_id, agent_name, agent_type, initial_score, final_score
        FROM ebars_simulation_agents
        WHERE simulation_id = ?
        ORDER BY agent_type, agent_name
    """, (simulation_id,))
    
    agents = [dict(row) for row in agents_cursor.fetchall()]
    
    # Turn verilerini getir
    turns_cursor = conn.execute("""
        SELECT 
            t.turn_number,
            a.agent_id,
            a.agent_name,
            a.agent_type,
            t.comprehension_score,
            t.difficulty_level,
            t.level_transition,
            t.score_delta
        FROM ebars_simulation_turns t
        JOIN ebars_simulation_agents a ON t.agent_id = a.agent_id
        WHERE t.simulation_id = ?
        ORDER BY a.agent_type, t.turn_number
    """, (simulation_id,))
    
    turns = [dict(row) for row in turns_cursor.fetchall()]
    conn.close()
    
    return {
        'success': True,
        'simulation_id': simulation_id,
        'agents': agents,
        'turns': turns
    }

def prepare_chart_data(turns: List[Dict[str, Any]], agents: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Grafik için veriyi hazırla"""
    chart_data = {}
    
    for agent in agents:
        agent_id = agent['agent_id']
        agent_type = agent['agent_type']
        agent_name = agent.get('agent_name', agent_id)
        
        # Bu agent'a ait turn'leri filtrele
        agent_turns = [t for t in turns if t['agent_id'] == agent_id]
        agent_turns.sort(key=lambda x: x['turn_number'])
        
        if agent_turns:
            turn_numbers = [t['turn_number'] for t in agent_turns]
            scores = [t['comprehension_score'] * 20 if t['comprehension_score'] else 0 for t in agent_turns]  # 0-5'ten 0-100'e çevir
            
            chart_data[agent_id] = {
                'agent_name': agent_name,
                'agent_type': agent_type,
                'turns': turn_numbers,
                'scores': scores,
                'difficulty_levels': [t['difficulty_level'] for t in agent_turns],
                'level_transitions': [t['level_transition'] for t in agent_turns]
            }
    
    return chart_data

def create_adaptation_chart(chart_data: Dict[str, Any], output_dir: str = "docs/charts"):
    """Şekil 4.1: Adaptasyon Başarısı Grafiği"""
    os.makedirs(output_dir, exist_ok=True)
    
    plt.figure(figsize=(12, 7))
    
    # Agent tiplerine göre renk ve stil
    agent_styles = {
        'struggling': {'color': 'red', 'marker': 'o', 'label_prefix': 'Ajan A (Zorlanan) - Scaffolding'},
        'fast_learner': {'color': 'green', 'marker': 's', 'label_prefix': 'Ajan B (Hızlı) - Promotion'},
        'variable': {'color': 'orange', 'marker': 'd', 'label_prefix': 'Ajan C (Dalgalı)'}
    }
    
    plotted_agents = {'struggling': False, 'fast_learner': False, 'variable': False}
    
    for agent_id, data in chart_data.items():
        agent_type = data['agent_type']
        if agent_type in agent_styles and not plotted_agents.get(agent_type, False):
            style = agent_styles[agent_type]
            plt.plot(
                data['turns'],
                data['scores'],
                marker=style['marker'],
                label=style['label_prefix'],
                color=style['color'],
                linewidth=2.5,
                markersize=8
            )
            plotted_agents[agent_type] = True
    
    plt.title('Şekil 4.1: Öğrenci Profillerine Göre EBARS Anlama Puanı Adaptasyonu', 
              fontsize=14, fontweight='bold', pad=20)
    plt.xlabel('Etkileşim Turu (Turn)', fontsize=12, fontweight='bold')
    plt.ylabel('Anlama Puanı (0-100)', fontsize=12, fontweight='bold')
    plt.grid(True, linestyle='--', alpha=0.7, linewidth=0.8)
    plt.legend(loc='best', fontsize=11, framealpha=0.9)
    
    # X ekseni ayarları
    if chart_data:
        max_turns = max(max(data['turns']) for data in chart_data.values())
        plt.xticks(range(1, max_turns + 1))
        plt.xlim(0.5, max_turns + 0.5)
    
    plt.ylim(0, 100)
    plt.tight_layout()
    
    output_path = os.path.join(output_dir, 'Sekil_4_1_Adaptasyon.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    print(f"✅ Grafik kaydedildi: {output_path}")
    plt.close()

def create_stability_chart(chart_data: Dict[str, Any], output_dir: str = "docs/charts"):
    """Şekil 4.2: Ajan C Kararlılık Analizi"""
    os.makedirs(output_dir, exist_ok=True)
    
    # Ajan C (variable) verilerini bul
    variable_agent_data = None
    for agent_id, data in chart_data.items():
        if data['agent_type'] == 'variable':
            variable_agent_data = data
            break
    
    if not variable_agent_data:
        print("⚠️ Ajan C (variable) verisi bulunamadı, grafik oluşturulamadı")
        return
    
    plt.figure(figsize=(12, 7))
    
    # Puan çizgisi
    plt.plot(
        variable_agent_data['turns'],
        variable_agent_data['scores'],
        marker='d',
        label='Ajan C (Dalgalı) Puanı',
        color='orange',
        linewidth=2.5,
        markersize=8,
        linestyle='-'
    )
    
    # Kritik Eşik Çizgileri (Histerezis Bölgeleri)
    # Zorluk seviyesi geçiş eşikleri (örnek değerler - gerçek değerler sistemden alınabilir)
    plt.axhline(y=30, color='gray', linestyle=':', alpha=0.6, linewidth=1.5, 
                label='Seviye Geçiş Eşiği (30)')
    plt.axhline(y=45, color='gray', linestyle=':', alpha=0.6, linewidth=1.5, 
                label='Seviye Geçiş Eşiği (45)')
    plt.axhline(y=60, color='gray', linestyle=':', alpha=0.6, linewidth=1.5, 
                label='Seviye Geçiş Eşiği (60)')
    
    # Zorluk seviyesi bölgelerini renklendir
    plt.axhspan(0, 30, alpha=0.1, color='red', label='Çok Zorlanan Bölgesi')
    plt.axhspan(30, 60, alpha=0.1, color='yellow', label='Normal Bölgesi')
    plt.axhspan(60, 100, alpha=0.1, color='green', label='İyi Performans Bölgesi')
    
    plt.title('Şekil 4.2: Ajan C (Dalgalı Profil) Puan Değişimi ve Kararlılık Analizi', 
              fontsize=14, fontweight='bold', pad=20)
    plt.xlabel('Etkileşim Turu (Turn)', fontsize=12, fontweight='bold')
    plt.ylabel('Anlama Puanı', fontsize=12, fontweight='bold')
    plt.legend(loc='best', fontsize=10, framealpha=0.9, ncol=2)
    plt.grid(True, alpha=0.3, linewidth=0.8)
    
    max_turns = max(variable_agent_data['turns'])
    plt.xticks(range(1, max_turns + 1))
    plt.xlim(0.5, max_turns + 0.5)
    plt.ylim(0, 100)
    
    plt.tight_layout()
    
    output_path = os.path.join(output_dir, 'Sekil_4_2_Kararlilik.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    print(f"✅ Grafik kaydedildi: {output_path}")
    plt.close()

def create_level_transition_chart(chart_data: Dict[str, Any], output_dir: str = "docs/charts"):
    """Şekil 4.3: Zorluk Seviyesi Geçişleri"""
    os.makedirs(output_dir, exist_ok=True)
    
    plt.figure(figsize=(12, 7))
    
    # Seviye mapping
    level_map = {
        'very_struggling': 1,
        'struggling': 2,
        'normal': 3,
        'good': 4,
        'excellent': 5
    }
    
    agent_styles = {
        'struggling': {'color': 'red', 'marker': 'o', 'label': 'Ajan A (Zorlanan)'},
        'fast_learner': {'color': 'green', 'marker': 's', 'label': 'Ajan B (Hızlı)'},
        'variable': {'color': 'orange', 'marker': 'd', 'label': 'Ajan C (Dalgalı)'}
    }
    
    for agent_id, data in chart_data.items():
        agent_type = data['agent_type']
        if agent_type in agent_styles:
            style = agent_styles[agent_type]
            levels = [level_map.get(level, 3) for level in data['difficulty_levels']]
            
            plt.plot(
                data['turns'],
                levels,
                marker=style['marker'],
                label=style['label'],
                color=style['color'],
                linewidth=2,
                markersize=8
            )
    
    # Y ekseni etiketleri
    plt.yticks([1, 2, 3, 4, 5], 
               ['Çok Zorlanan', 'Zorlanan', 'Normal', 'İyi', 'Mükemmel'])
    
    plt.title('Şekil 4.3: Zorluk Seviyesi Adaptasyonu - Agent Bazlı Karşılaştırma', 
              fontsize=14, fontweight='bold', pad=20)
    plt.xlabel('Etkileşim Turu (Turn)', fontsize=12, fontweight='bold')
    plt.ylabel('Zorluk Seviyesi', fontsize=12, fontweight='bold')
    plt.grid(True, linestyle='--', alpha=0.5, linewidth=0.8)
    plt.legend(loc='best', fontsize=11, framealpha=0.9)
    
    if chart_data:
        max_turns = max(max(data['turns']) for data in chart_data.values())
        plt.xticks(range(1, max_turns + 1))
        plt.xlim(0.5, max_turns + 0.5)
    
    plt.ylim(0.5, 5.5)
    plt.tight_layout()
    
    output_path = os.path.join(output_dir, 'Sekil_4_3_Seviye_Gecisleri.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    print(f"✅ Grafik kaydedildi: {output_path}")
    plt.close()

def generate_all_charts(simulation_id: Optional[str] = None, output_dir: str = "docs/charts"):
    """Tüm grafikleri oluştur"""
    print("📊 Simülasyon grafiklerini oluşturuyorum...")
    
    try:
        db_path = get_db_path()
        print(f"📁 Database: {db_path}")
        
        # Verileri getir
        data = get_simulation_data(db_path, simulation_id)
        
        if not data.get('success'):
            print(f"❌ Hata: {data.get('error', 'Bilinmeyen hata')}")
            return
        
        print(f"✅ Simülasyon ID: {data['simulation_id']}")
        print(f"✅ {len(data['agents'])} agent bulundu")
        print(f"✅ {len(data['turns'])} turn verisi bulundu")
        
        # Grafik verilerini hazırla
        chart_data = prepare_chart_data(data['turns'], data['agents'])
        
        if not chart_data:
            print("⚠️ Grafik için yeterli veri bulunamadı")
            return
        
        print(f"✅ {len(chart_data)} agent için grafik verisi hazırlandı")
        
        # Grafikleri oluştur
        print("\n📈 Grafikleri oluşturuyorum...")
        create_adaptation_chart(chart_data, output_dir)
        create_stability_chart(chart_data, output_dir)
        create_level_transition_chart(chart_data, output_dir)
        
        print(f"\n✅ Tüm grafikler oluşturuldu: {output_dir}")
        
        # Özet bilgi
        print("\n📊 Özet:")
        for agent_id, data in chart_data.items():
            print(f"   - {data['agent_name']} ({data['agent_type']}): {len(data['turns'])} turn")
        
    except FileNotFoundError as e:
        print(f"❌ Database bulunamadı: {e}")
        print("\n💡 Öneriler:")
        print("   1. Docker container içinde çalıştırıyorsanız:")
        print("      docker exec aprag-service-prod python /app/scripts/generate_simulation_charts.py")
        print("   2. Local'de çalıştırıyorsanız:")
        print("      python scripts/generate_simulation_charts.py")
    except Exception as e:
        print(f"❌ Hata: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import sys
    
    # Parametreler
    simulation_id = sys.argv[1] if len(sys.argv) > 1 else None
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "docs/charts"
    
    generate_all_charts(simulation_id, output_dir)

