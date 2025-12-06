"""
EBARS Simülasyon Sonuçlarını Analiz Et ve Grafik Çiz
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import json
from pathlib import Path
import numpy as np

# Türkçe karakter desteği
plt.rcParams['font.family'] = 'DejaVu Sans'
sns.set_style("whitegrid")
sns.set_palette("husl")


class EBARSAnalyzer:
    """EBARS simülasyon sonuçlarını analiz eder"""
    
    def __init__(self, csv_file: str):
        """CSV dosyasından veriyi yükle"""
        self.df = pd.read_csv(csv_file)
        self.df['timestamp'] = pd.to_datetime(self.df['timestamp'])
        
        # Difficulty level sıralaması
        self.level_order = ['very_struggling', 'struggling', 'normal', 'good', 'excellent']
        self.level_labels = {
            'very_struggling': 'Çok Zorlanıyor',
            'struggling': 'Zorlanıyor',
            'normal': 'Normal',
            'good': 'İyi',
            'excellent': 'Mükemmel'
        }
        
    def plot_score_trends(self, output_file: str = "score_trends.png"):
        """Anlama skoru trendlerini çiz"""
        fig, ax = plt.subplots(figsize=(12, 6))
        
        for agent_id in self.df['agent_id'].unique():
            agent_data = self.df[self.df['agent_id'] == agent_id].sort_values('turn_number')
            agent_name = agent_data['agent_id'].iloc[0]
            
            ax.plot(
                agent_data['turn_number'],
                agent_data['comprehension_score'],
                marker='o',
                label=agent_name,
                linewidth=2,
                markersize=6
            )
        
        ax.set_xlabel('Tur Sayısı', fontsize=12)
        ax.set_ylabel('Anlama Skoru', fontsize=12)
        ax.set_title('Anlama Skoru Trendi - Ajan Karşılaştırması', fontsize=14, fontweight='bold')
        ax.legend(fontsize=10)
        ax.grid(True, alpha=0.3)
        ax.set_ylim(0, 100)
        
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"✅ Saved: {output_file}")
        plt.close()
    
    def plot_level_transitions(self, output_file: str = "level_transitions.png"):
        """Zorluk seviyesi geçişlerini çiz"""
        fig, axes = plt.subplots(3, 1, figsize=(12, 10))
        
        agents = self.df['agent_id'].unique()
        
        for idx, agent_id in enumerate(agents):
            ax = axes[idx]
            agent_data = self.df[self.df['agent_id'] == agent_id].sort_values('turn_number')
            
            # Seviyeleri sayısal değerlere çevir
            level_numeric = agent_data['difficulty_level'].map(
                {level: i for i, level in enumerate(self.level_order)}
            )
            
            ax.plot(
                agent_data['turn_number'],
                level_numeric,
                marker='o',
                linewidth=2,
                markersize=8,
                color=sns.color_palette()[idx]
            )
            
            # Y ekseni etiketlerini ayarla
            ax.set_yticks(range(len(self.level_order)))
            ax.set_yticklabels([self.level_labels[l] for l in self.level_order])
            ax.set_xlabel('Tur Sayısı', fontsize=10)
            ax.set_ylabel('Zorluk Seviyesi', fontsize=10)
            ax.set_title(f'{agent_id} - Zorluk Seviyesi Değişimi', fontsize=11, fontweight='bold')
            ax.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"✅ Saved: {output_file}")
        plt.close()
    
    def plot_answer_lengths(self, output_file: str = "answer_lengths.png"):
        """Cevap uzunluklarını karşılaştır"""
        fig, ax = plt.subplots(figsize=(12, 6))
        
        for agent_id in self.df['agent_id'].unique():
            agent_data = self.df[self.df['agent_id'] == agent_id].sort_values('turn_number')
            
            ax.plot(
                agent_data['turn_number'],
                agent_data['answer_length'],
                marker='s',
                label=agent_id,
                linewidth=2,
                markersize=6,
                alpha=0.7
            )
        
        ax.set_xlabel('Tur Sayısı', fontsize=12)
        ax.set_ylabel('Cevap Uzunluğu (Karakter)', fontsize=12)
        ax.set_title('Cevap Uzunluğu Trendi', fontsize=14, fontweight='bold')
        ax.legend(fontsize=10)
        ax.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"✅ Saved: {output_file}")
        plt.close()
    
    def plot_comparative_analysis(self, output_file: str = "comparative_analysis.png"):
        """Karşılaştırmalı analiz grafiği (3 subplot)"""
        fig, axes = plt.subplots(3, 1, figsize=(14, 12))
        
        agents = self.df['agent_id'].unique()
        colors = sns.color_palette("husl", len(agents))
        
        # 1. Skor Trendi
        ax1 = axes[0]
        for idx, agent_id in enumerate(agents):
            agent_data = self.df[self.df['agent_id'] == agent_id].sort_values('turn_number')
            ax1.plot(
                agent_data['turn_number'],
                agent_data['comprehension_score'],
                marker='o',
                label=agent_id,
                linewidth=2,
                color=colors[idx]
            )
        ax1.set_ylabel('Anlama Skoru', fontsize=11)
        ax1.set_title('Anlama Skoru Trendi', fontsize=12, fontweight='bold')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        ax1.set_ylim(0, 100)
        
        # 2. Seviye Geçişleri (sayısal)
        ax2 = axes[1]
        for idx, agent_id in enumerate(agents):
            agent_data = self.df[self.df['agent_id'] == agent_id].sort_values('turn_number')
            level_numeric = agent_data['difficulty_level'].map(
                {level: i for i, level in enumerate(self.level_order)}
            )
            ax2.plot(
                agent_data['turn_number'],
                level_numeric,
                marker='s',
                label=agent_id,
                linewidth=2,
                color=colors[idx]
            )
        ax2.set_yticks(range(len(self.level_order)))
        ax2.set_yticklabels([self.level_labels[l] for l in self.level_order], fontsize=8)
        ax2.set_ylabel('Zorluk Seviyesi', fontsize=11)
        ax2.set_title('Zorluk Seviyesi Değişimi', fontsize=12, fontweight='bold')
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        # 3. Cevap Uzunluğu
        ax3 = axes[2]
        for idx, agent_id in enumerate(agents):
            agent_data = self.df[self.df['agent_id'] == agent_id].sort_values('turn_number')
            ax3.plot(
                agent_data['turn_number'],
                agent_data['answer_length'],
                marker='^',
                label=agent_id,
                linewidth=2,
                color=colors[idx]
            )
        ax3.set_xlabel('Tur Sayısı', fontsize=11)
        ax3.set_ylabel('Cevap Uzunluğu', fontsize=11)
        ax3.set_title('Cevap Uzunluğu Trendi', fontsize=12, fontweight='bold')
        ax3.legend()
        ax3.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"✅ Saved: {output_file}")
        plt.close()
    
    def generate_statistics(self) -> dict:
        """İstatistiksel özet oluştur"""
        stats = {}
        
        for agent_id in self.df['agent_id'].unique():
            agent_data = self.df[self.df['agent_id'] == agent_id].sort_values('turn_number')
            
            agent_stats = {
                "agent_id": agent_id,
                "initial_score": float(agent_data['comprehension_score'].iloc[0]),
                "final_score": float(agent_data['comprehension_score'].iloc[-1]),
                "score_change": float(agent_data['comprehension_score'].iloc[-1] - agent_data['comprehension_score'].iloc[0]),
                "initial_level": agent_data['difficulty_level'].iloc[0],
                "final_level": agent_data['difficulty_level'].iloc[-1],
                "level_changes": int((agent_data['level_transition'] != 'same').sum()),
                "avg_answer_length": float(agent_data['answer_length'].mean()),
                "avg_processing_time": float(agent_data['processing_time_ms'].mean()),
                "total_turns": int(len(agent_data))
            }
            
            # İlk seviye değişimi
            level_changes = agent_data[agent_data['level_transition'] != 'same']
            if not level_changes.empty:
                agent_stats["first_level_change_turn"] = int(level_changes['turn_number'].iloc[0])
            else:
                agent_stats["first_level_change_turn"] = None
            
            stats[agent_id] = agent_stats
        
        return stats
    
    def save_all_plots(self, output_dir: str = "plots"):
        """Tüm grafikleri kaydet"""
        Path(output_dir).mkdir(exist_ok=True)
        
        self.plot_score_trends(f"{output_dir}/score_trends.png")
        self.plot_level_transitions(f"{output_dir}/level_transitions.png")
        self.plot_answer_lengths(f"{output_dir}/answer_lengths.png")
        self.plot_comparative_analysis(f"{output_dir}/comparative_analysis.png")
        
        print(f"\n✅ All plots saved to {output_dir}/")


def main():
    """Ana analiz fonksiyonu"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python analyze_results.py <simulation_results.csv>")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    
    print(f"📊 Analyzing results from {csv_file}...")
    
    analyzer = EBARSAnalyzer(csv_file)
    
    # İstatistikleri oluştur
    stats = analyzer.generate_statistics()
    print("\n" + "="*60)
    print("STATISTICAL SUMMARY")
    print("="*60)
    print(json.dumps(stats, indent=2, ensure_ascii=False))
    
    # İstatistikleri kaydet
    stats_file = csv_file.replace('.csv', '_stats.json')
    with open(stats_file, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)
    print(f"\n✅ Statistics saved to {stats_file}")
    
    # Grafikleri oluştur
    output_dir = "plots"
    analyzer.save_all_plots(output_dir)
    
    print("\n✅ Analysis complete!")


if __name__ == "__main__":
    main()

