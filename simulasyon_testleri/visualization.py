#!/usr/bin/env python3
"""
EBARS Simulation Visualization Module
=====================================

This module provides comprehensive visualization capabilities for EBARS simulation data,
generating academic-quality graphs showing dynamic adaptation patterns.

Features:
- Line graphs for comprehension score evolution
- Difficulty level transition analysis
- Comparative performance metrics
- Score delta analysis (adaptation speed)
- Response time analysis
- Academic-quality formatting with bilingual support
- Multi-format export (PNG, SVG, PDF)
- Statistical annotations and trend analysis

Author: EBARS Team
Date: 2025-12-06
"""

import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from scipy import stats
from scipy.optimize import curve_fit
import numpy as np
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
import warnings
from datetime import datetime
import json

# Suppress scientific notation in plots
plt.rcParams['axes.formatter.useoffset'] = False
plt.rcParams['axes.formatter.limits'] = [-3, 3]

# Configure matplotlib for high-quality output
plt.rcParams.update({
    'font.size': 12,
    'axes.titlesize': 14,
    'axes.labelsize': 12,
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'legend.fontsize': 11,
    'figure.titlesize': 16,
    'figure.dpi': 300,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight',
    'savefig.transparent': False,
    'axes.grid': True,
    'grid.alpha': 0.3,
    'font.family': ['DejaVu Sans', 'Arial', 'sans-serif']
})

class EBARSVisualizer:
    """
    Main visualization class for EBARS simulation data analysis.
    
    This class provides comprehensive visualization capabilities for analyzing
    the performance and adaptation patterns of different agent profiles in
    the EBARS system.
    """
    
    def __init__(self, bilingual: bool = True, output_dir: str = "visualization_output"):
        """
        Initialize the EBARS Visualizer.
        
        Args:
            bilingual (bool): Enable bilingual labels (English/Turkish)
            output_dir (str): Output directory for saved visualizations
        """
        self.bilingual = bilingual
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Professional color scheme for agents
        self.agent_colors = {
            'agent_a': '#e74c3c',  # Red - Struggling Agent
            'agent_b': '#27ae60',  # Green - Fast Learner
            'agent_c': '#3498db'   # Blue - Variable Agent
        }
        
        # Agent name mappings
        self.agent_names = {
            'agent_a': 'Struggling Agent / Zorlanan Ajan' if bilingual else 'Struggling Agent',
            'agent_b': 'Fast Learner / Hızlı Öğrenen' if bilingual else 'Fast Learner',
            'agent_c': 'Variable Agent / Dalgalı Ajan' if bilingual else 'Variable Agent'
        }
        
        # Difficulty level mappings
        self.difficulty_levels = ['very_struggling', 'struggling', 'normal', 'good', 'excellent']
        self.difficulty_labels = {
            'very_struggling': 'Very Struggling / Çok Zor' if bilingual else 'Very Struggling',
            'struggling': 'Struggling / Zor' if bilingual else 'Struggling', 
            'normal': 'Normal / Normal' if bilingual else 'Normal',
            'good': 'Good / İyi' if bilingual else 'Good',
            'excellent': 'Excellent / Mükemmel' if bilingual else 'Excellent'
        }
        
        self.data = None
        self.summary_stats = {}
    
    def load_data(self, csv_file: str) -> pd.DataFrame:
        """
        Load and validate simulation data from CSV file.
        
        Args:
            csv_file (str): Path to the CSV file containing simulation results
            
        Returns:
            pd.DataFrame: Loaded and validated data
            
        Raises:
            FileNotFoundError: If CSV file doesn't exist
            ValueError: If data validation fails
        """
        if not os.path.exists(csv_file):
            raise FileNotFoundError(f"CSV file not found: {csv_file}")
        
        try:
            # Load data
            data = pd.read_csv(csv_file, encoding='utf-8')
            print(f"✅ Loaded {len(data)} records from {csv_file}")
            
            # Validate required columns
            required_columns = [
                'agent_id', 'turn_number', 'question', 'answer', 'emoji_feedback',
                'comprehension_score', 'difficulty_level', 'score_delta', 
                'level_transition', 'processing_time_ms', 'timestamp'
            ]
            
            missing_columns = [col for col in required_columns if col not in data.columns]
            if missing_columns:
                raise ValueError(f"Missing required columns: {missing_columns}")
            
            # Data type conversions
            data['turn_number'] = pd.to_numeric(data['turn_number'], errors='coerce')
            data['comprehension_score'] = pd.to_numeric(data['comprehension_score'], errors='coerce')
            data['score_delta'] = pd.to_numeric(data['score_delta'], errors='coerce')
            data['processing_time_ms'] = pd.to_numeric(data['processing_time_ms'], errors='coerce')
            data['timestamp'] = pd.to_datetime(data['timestamp'], errors='coerce')
            
            # Remove rows with invalid data
            initial_rows = len(data)
            data = data.dropna(subset=['turn_number', 'comprehension_score'])
            removed_rows = initial_rows - len(data)
            
            if removed_rows > 0:
                warnings.warn(f"Removed {removed_rows} rows with invalid data")
            
            # Sort data
            data = data.sort_values(['agent_id', 'turn_number']).reset_index(drop=True)
            
            self.data = data
            self._calculate_summary_stats()
            
            print(f"✅ Data validation complete. {len(data)} valid records loaded.")
            return data
            
        except Exception as e:
            raise ValueError(f"Error loading data: {str(e)}")
    
    def _calculate_summary_stats(self):
        """Calculate summary statistics for the loaded data."""
        if self.data is None:
            return
        
        self.summary_stats = {}
        
        for agent_id in self.data['agent_id'].unique():
            agent_data = self.data[self.data['agent_id'] == agent_id]
            
            if len(agent_data) > 0:
                first_score = agent_data.iloc[0]['comprehension_score']
                last_score = agent_data.iloc[-1]['comprehension_score']
                
                self.summary_stats[agent_id] = {
                    'initial_score': first_score,
                    'final_score': last_score,
                    'score_improvement': last_score - first_score,
                    'improvement_percentage': ((last_score - first_score) / first_score) * 100,
                    'total_turns': len(agent_data),
                    'avg_processing_time': agent_data['processing_time_ms'].mean(),
                    'level_changes': len(agent_data[agent_data['level_transition'] != 'same']),
                    'positive_feedback_ratio': len(agent_data[agent_data['emoji_feedback'].isin(['👍', '😊'])]) / len(agent_data)
                }
    
    def plot_comprehension_evolution(self, save_formats: List[str] = ['png', 'svg', 'pdf']) -> str:
        """
        Create line graph showing comprehension score evolution over 20 turns.
        
        Args:
            save_formats (List[str]): Output formats for saving the plot
            
        Returns:
            str: Base filename of saved plots
        """
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        # Create figure with professional styling
        fig, ax = plt.subplots(figsize=(12, 8))
        
        # Plot lines for each agent
        for agent_id in sorted(self.data['agent_id'].unique()):
            agent_data = self.data[self.data['agent_id'] == agent_id]
            
            # Plot main line
            ax.plot(
                agent_data['turn_number'], 
                agent_data['comprehension_score'],
                color=self.agent_colors.get(agent_id, '#333333'),
                linewidth=2.5,
                marker='o',
                markersize=4,
                alpha=0.9,
                label=self.agent_names.get(agent_id, agent_id)
            )
            
            # Add trend line
            if len(agent_data) > 2:
                x = agent_data['turn_number'].values
                y = agent_data['comprehension_score'].values
                z = np.polyfit(x, y, 1)
                p = np.poly1d(z)
                ax.plot(x, p(x), 
                       color=self.agent_colors.get(agent_id, '#333333'),
                       linestyle='--', 
                       alpha=0.5,
                       linewidth=1.5)
        
        # Formatting
        ax.set_xlabel('Turn Number / Tur Numarası' if self.bilingual else 'Turn Number', 
                     fontsize=13, fontweight='bold')
        ax.set_ylabel('Comprehension Score / Anlama Skoru' if self.bilingual else 'Comprehension Score', 
                     fontsize=13, fontweight='bold')
        ax.set_title('Comprehension Score Evolution Over Time\nZaman İçinde Anlama Skoru Gelişimi' 
                    if self.bilingual else 'Comprehension Score Evolution Over Time', 
                    fontsize=16, fontweight='bold', pad=20)
        
        # Set axis limits and ticks
        ax.set_xlim(0.5, 20.5)
        ax.set_xticks(range(1, 21, 2))
        ax.set_ylim(0, 100)
        ax.set_yticks(range(0, 101, 10))
        
        # Add grid and legend
        ax.grid(True, alpha=0.3, linestyle='-')
        ax.legend(loc='best', frameon=True, fancybox=True, shadow=True)
        
        # Add statistical annotations
        self._add_score_annotations(ax)
        
        plt.tight_layout()
        
        # Save in multiple formats
        base_filename = "comprehension_evolution"
        self._save_plot(fig, base_filename, save_formats)
        
        plt.close()
        return base_filename
    
    def plot_difficulty_transitions(self, save_formats: List[str] = ['png', 'svg', 'pdf']) -> str:
        """
        Create visualization showing difficulty level transitions over time.
        
        Args:
            save_formats (List[str]): Output formats for saving the plot
            
        Returns:
            str: Base filename of saved plots
        """
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        # Create figure with subplots for each agent
        fig, axes = plt.subplots(3, 1, figsize=(14, 12), sharex=True)
        
        # Color mapping for difficulty levels
        level_colors = {
            'very_struggling': '#e74c3c',
            'struggling': '#f39c12', 
            'normal': '#f1c40f',
            'good': '#2ecc71',
            'excellent': '#27ae60'
        }
        
        for idx, agent_id in enumerate(sorted(self.data['agent_id'].unique())):
            agent_data = self.data[self.data['agent_id'] == agent_id]
            ax = axes[idx]
            
            # Create numeric mapping for difficulty levels
            level_numeric = {level: i for i, level in enumerate(self.difficulty_levels)}
            y_values = [level_numeric[level] for level in agent_data['difficulty_level']]
            
            # Plot as step plot
            ax.step(agent_data['turn_number'], y_values, 
                   where='mid',
                   linewidth=3,
                   color=self.agent_colors.get(agent_id, '#333333'),
                   alpha=0.8)
            
            # Fill between for better visibility
            ax.fill_between(agent_data['turn_number'], y_values, 
                           step='mid',
                           alpha=0.3,
                           color=self.agent_colors.get(agent_id, '#333333'))
            
            # Mark level transitions
            transitions = agent_data[agent_data['level_transition'] != 'same']
            for _, transition in transitions.iterrows():
                marker = '↑' if transition['level_transition'] == 'up' else '↓'
                color = '#27ae60' if transition['level_transition'] == 'up' else '#e74c3c'
                ax.annotate(marker, 
                           (transition['turn_number'], level_numeric[transition['difficulty_level']]),
                           xytext=(0, 10), textcoords='offset points',
                           fontsize=14, ha='center', color=color, fontweight='bold')
            
            # Formatting for each subplot
            ax.set_ylabel(self.agent_names.get(agent_id, agent_id), 
                         fontsize=12, fontweight='bold')
            ax.set_yticks(range(len(self.difficulty_levels)))
            ax.set_yticklabels([self.difficulty_labels[level] for level in self.difficulty_levels],
                              fontsize=10)
            ax.grid(True, alpha=0.3)
            ax.set_ylim(-0.5, len(self.difficulty_levels) - 0.5)
        
        # Common formatting
        axes[-1].set_xlabel('Turn Number / Tur Numarası' if self.bilingual else 'Turn Number', 
                           fontsize=13, fontweight='bold')
        axes[-1].set_xlim(0.5, 20.5)
        axes[-1].set_xticks(range(1, 21, 2))
        
        fig.suptitle('Difficulty Level Transitions Over Time\nZaman İçinde Zorluk Seviyesi Geçişleri' 
                    if self.bilingual else 'Difficulty Level Transitions Over Time', 
                    fontsize=16, fontweight='bold', y=0.98)
        
        plt.tight_layout()
        plt.subplots_adjust(top=0.92)
        
        # Save in multiple formats
        base_filename = "difficulty_transitions"
        self._save_plot(fig, base_filename, save_formats)
        
        plt.close()
        return base_filename
    
    def plot_performance_comparison(self, save_formats: List[str] = ['png', 'svg', 'pdf']) -> str:
        """
        Create comparative bar charts for final performance metrics.
        
        Args:
            save_formats (List[str]): Output formats for saving the plot
            
        Returns:
            str: Base filename of saved plots
        """
        if self.data is None or not self.summary_stats:
            raise ValueError("No data or summary statistics available.")
        
        # Create subplots for different metrics
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Performance Comparison Between Agents\nAjanlar Arası Performans Karşılaştırması' 
                    if self.bilingual else 'Performance Comparison Between Agents',
                    fontsize=18, fontweight='bold', y=0.98)
        
        agents = sorted(self.summary_stats.keys())
        colors = [self.agent_colors.get(agent, '#333333') for agent in agents]
        labels = [self.agent_names.get(agent, agent) for agent in agents]
        
        # 1. Score Improvement
        ax1 = axes[0, 0]
        improvements = [self.summary_stats[agent]['score_improvement'] for agent in agents]
        bars1 = ax1.bar(labels, improvements, color=colors, alpha=0.8, edgecolor='black', linewidth=1)
        ax1.set_title('Score Improvement / Skor Gelişimi' if self.bilingual else 'Score Improvement', 
                     fontweight='bold')
        ax1.set_ylabel('Score Change / Skor Değişimi' if self.bilingual else 'Score Change')
        ax1.grid(axis='y', alpha=0.3)
        
        # Add value labels on bars
        for bar, val in zip(bars1, improvements):
            height = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2., height + (0.5 if height >= 0 else -0.5),
                    f'{val:.1f}', ha='center', va='bottom' if height >= 0 else 'top', 
                    fontweight='bold')
        
        # 2. Improvement Percentage
        ax2 = axes[0, 1]
        percentages = [self.summary_stats[agent]['improvement_percentage'] for agent in agents]
        bars2 = ax2.bar(labels, percentages, color=colors, alpha=0.8, edgecolor='black', linewidth=1)
        ax2.set_title('Improvement Percentage / Gelişim Yüzdesi' if self.bilingual else 'Improvement Percentage', 
                     fontweight='bold')
        ax2.set_ylabel('Percentage / Yüzde (%)' if self.bilingual else 'Percentage (%)')
        ax2.grid(axis='y', alpha=0.3)
        
        for bar, val in zip(bars2, percentages):
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height + (0.5 if height >= 0 else -0.5),
                    f'{val:.1f}%', ha='center', va='bottom' if height >= 0 else 'top', 
                    fontweight='bold')
        
        # 3. Average Processing Time
        ax3 = axes[1, 0]
        proc_times = [self.summary_stats[agent]['avg_processing_time'] for agent in agents]
        bars3 = ax3.bar(labels, proc_times, color=colors, alpha=0.8, edgecolor='black', linewidth=1)
        ax3.set_title('Average Processing Time / Ortalama İşleme Süresi' if self.bilingual else 'Average Processing Time', 
                     fontweight='bold')
        ax3.set_ylabel('Time (ms) / Süre (ms)' if self.bilingual else 'Time (ms)')
        ax3.grid(axis='y', alpha=0.3)
        
        for bar, val in zip(bars3, proc_times):
            height = bar.get_height()
            ax3.text(bar.get_x() + bar.get_width()/2., height + 10,
                    f'{val:.0f}ms', ha='center', va='bottom', fontweight='bold')
        
        # 4. Level Changes
        ax4 = axes[1, 1]
        level_changes = [self.summary_stats[agent]['level_changes'] for agent in agents]
        bars4 = ax4.bar(labels, level_changes, color=colors, alpha=0.8, edgecolor='black', linewidth=1)
        ax4.set_title('Level Changes / Seviye Değişiklikleri' if self.bilingual else 'Level Changes', 
                     fontweight='bold')
        ax4.set_ylabel('Number of Changes / Değişiklik Sayısı' if self.bilingual else 'Number of Changes')
        ax4.grid(axis='y', alpha=0.3)
        
        for bar, val in zip(bars4, level_changes):
            height = bar.get_height()
            ax4.text(bar.get_x() + bar.get_width()/2., height + 0.05,
                    f'{val}', ha='center', va='bottom', fontweight='bold')
        
        # Format x-axis labels for better readability
        for ax in axes.flat:
            ax.tick_params(axis='x', rotation=15)
        
        plt.tight_layout()
        plt.subplots_adjust(top=0.92)
        
        # Save in multiple formats
        base_filename = "performance_comparison"
        self._save_plot(fig, base_filename, save_formats)
        
        plt.close()
        return base_filename
    
    def plot_score_delta_analysis(self, save_formats: List[str] = ['png', 'svg', 'pdf']) -> str:
        """
        Create score delta analysis showing adaptation speed.
        
        Args:
            save_formats (List[str]): Output formats for saving the plot
            
        Returns:
            str: Base filename of saved plots
        """
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        # Create figure
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 12))
        
        # Plot 1: Score delta over time
        for agent_id in sorted(self.data['agent_id'].unique()):
            agent_data = self.data[self.data['agent_id'] == agent_id]
            
            # Filter out first turn (delta = 0)
            agent_data_filtered = agent_data[agent_data['turn_number'] > 1]
            
            ax1.plot(
                agent_data_filtered['turn_number'], 
                agent_data_filtered['score_delta'],
                color=self.agent_colors.get(agent_id, '#333333'),
                linewidth=2,
                marker='o',
                markersize=4,
                alpha=0.8,
                label=self.agent_names.get(agent_id, agent_id)
            )
        
        ax1.set_xlabel('Turn Number / Tur Numarası' if self.bilingual else 'Turn Number')
        ax1.set_ylabel('Score Delta / Skor Değişimi' if self.bilingual else 'Score Delta')
        ax1.set_title('Score Changes Over Time (Adaptation Speed)\nZaman İçinde Skor Değişimleri (Adaptasyon Hızı)' 
                     if self.bilingual else 'Score Changes Over Time (Adaptation Speed)', 
                     fontweight='bold', fontsize=14)
        ax1.axhline(y=0, color='black', linestyle='-', alpha=0.3)
        ax1.grid(True, alpha=0.3)
        ax1.legend()
        ax1.set_xlim(1.5, 20.5)
        
        # Plot 2: Cumulative score delta (adaptation effectiveness)
        for agent_id in sorted(self.data['agent_id'].unique()):
            agent_data = self.data[self.data['agent_id'] == agent_id]
            
            # Calculate cumulative score delta
            cumulative_delta = agent_data['score_delta'].cumsum()
            
            ax2.plot(
                agent_data['turn_number'], 
                cumulative_delta,
                color=self.agent_colors.get(agent_id, '#333333'),
                linewidth=3,
                alpha=0.8,
                label=self.agent_names.get(agent_id, agent_id)
            )
            
            # Add final value annotation
            final_val = cumulative_delta.iloc[-1]
            ax2.annotate(f'{final_val:.1f}', 
                        xy=(20, final_val), 
                        xytext=(10, 0), textcoords='offset points',
                        fontsize=11, fontweight='bold',
                        color=self.agent_colors.get(agent_id, '#333333'))
        
        ax2.set_xlabel('Turn Number / Tur Numarası' if self.bilingual else 'Turn Number')
        ax2.set_ylabel('Cumulative Score Delta / Kümülatif Skor Değişimi' if self.bilingual else 'Cumulative Score Delta')
        ax2.set_title('Cumulative Adaptation Effectiveness\nKümülatif Adaptasyon Etkinliği' 
                     if self.bilingual else 'Cumulative Adaptation Effectiveness', 
                     fontweight='bold', fontsize=14)
        ax2.axhline(y=0, color='black', linestyle='-', alpha=0.3)
        ax2.grid(True, alpha=0.3)
        ax2.legend()
        ax2.set_xlim(0.5, 20.5)
        
        plt.tight_layout()
        
        # Save in multiple formats
        base_filename = "score_delta_analysis"
        self._save_plot(fig, base_filename, save_formats)
        
        plt.close()
        return base_filename
    
    def plot_response_time_analysis(self, save_formats: List[str] = ['png', 'svg', 'pdf']) -> str:
        """
        Create response time analysis visualization.
        
        Args:
            save_formats (List[str]): Output formats for saving the plot
            
        Returns:
            str: Base filename of saved plots
        """
        if self.data is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        # Create figure with subplots
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))
        
        # Plot 1: Processing time over turns
        for agent_id in sorted(self.data['agent_id'].unique()):
            agent_data = self.data[self.data['agent_id'] == agent_id]
            
            ax1.plot(
                agent_data['turn_number'], 
                agent_data['processing_time_ms'],
                color=self.agent_colors.get(agent_id, '#333333'),
                linewidth=2,
                marker='o',
                markersize=4,
                alpha=0.8,
                label=self.agent_names.get(agent_id, agent_id)
            )
            
            # Add trend line
            if len(agent_data) > 2:
                x = agent_data['turn_number'].values
                y = agent_data['processing_time_ms'].values
                # Remove any NaN or infinite values
                mask = np.isfinite(y)
                if np.sum(mask) > 2:
                    z = np.polyfit(x[mask], y[mask], 1)
                    p = np.poly1d(z)
                    ax1.plot(x, p(x), 
                           color=self.agent_colors.get(agent_id, '#333333'),
                           linestyle='--', 
                           alpha=0.5,
                           linewidth=1.5)
        
        ax1.set_xlabel('Turn Number / Tur Numarası' if self.bilingual else 'Turn Number')
        ax1.set_ylabel('Processing Time (ms) / İşleme Süresi (ms)' if self.bilingual else 'Processing Time (ms)')
        ax1.set_title('Processing Time Trends\nİşleme Süresi Eğilimleri' 
                     if self.bilingual else 'Processing Time Trends', 
                     fontweight='bold')
        ax1.grid(True, alpha=0.3)
        ax1.legend()
        ax1.set_xlim(0.5, 20.5)
        
        # Plot 2: Processing time distribution (box plots)
        agents = sorted(self.data['agent_id'].unique())
        proc_time_data = [self.data[self.data['agent_id'] == agent]['processing_time_ms'].dropna().values 
                         for agent in agents]
        labels = [self.agent_names.get(agent, agent) for agent in agents]
        
        box_plot = ax2.boxplot(proc_time_data, 
                              labels=labels,
                              patch_artist=True,
                              notch=True,
                              showfliers=True)
        
        # Color the boxes
        for patch, color in zip(box_plot['boxes'], [self.agent_colors.get(agent, '#333333') for agent in agents]):
            patch.set_facecolor(color)
            patch.set_alpha(0.7)
        
        ax2.set_ylabel('Processing Time (ms) / İşleme Süresi (ms)' if self.bilingual else 'Processing Time (ms)')
        ax2.set_title('Processing Time Distribution\nİşleme Süresi Dağılımı' 
                     if self.bilingual else 'Processing Time Distribution', 
                     fontweight='bold')
        ax2.grid(axis='y', alpha=0.3)
        ax2.tick_params(axis='x', rotation=15)
        
        # Add statistical annotations
        for i, agent in enumerate(agents):
            agent_times = self.data[self.data['agent_id'] == agent]['processing_time_ms'].dropna()
            mean_time = agent_times.mean()
            ax2.text(i + 1, mean_time, f'{mean_time:.0f}ms', 
                    ha='center', va='bottom', fontweight='bold', fontsize=10)
        
        plt.tight_layout()
        
        # Save in multiple formats
        base_filename = "response_time_analysis"
        self._save_plot(fig, base_filename, save_formats)
        
        plt.close()
        return base_filename
    
    def _add_score_annotations(self, ax):
        """Add statistical annotations to score evolution plot."""
        for agent_id in self.summary_stats:
            stats = self.summary_stats[agent_id]
            improvement = stats['improvement_percentage']
            
            # Add improvement percentage annotation
            ax.text(0.98, 0.02 + list(self.summary_stats.keys()).index(agent_id) * 0.06, 
                   f"{self.agent_names.get(agent_id, agent_id)}: {improvement:+.1f}%",
                   transform=ax.transAxes, ha='right', va='bottom',
                   bbox=dict(boxstyle='round,pad=0.3', 
                            facecolor=self.agent_colors.get(agent_id, '#333333'), 
                            alpha=0.2),
                   fontsize=10, fontweight='bold')
    
    def _save_plot(self, fig, base_filename: str, formats: List[str]):
        """
        Save plot in multiple formats.
        
        Args:
            fig: Matplotlib figure object
            base_filename (str): Base filename without extension
            formats (List[str]): List of formats to save ('png', 'svg', 'pdf')
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        for fmt in formats:
            filename = f"{base_filename}_{timestamp}.{fmt}"
            filepath = self.output_dir / filename
            
            try:
                if fmt == 'pdf':
                    fig.savefig(filepath, format='pdf', bbox_inches='tight', dpi=300)
                elif fmt == 'svg':
                    fig.savefig(filepath, format='svg', bbox_inches='tight')
                elif fmt == 'png':
                    fig.savefig(filepath, format='png', bbox_inches='tight', dpi=300)
                
                print(f"✅ Saved: {filepath}")
            except Exception as e:
                print(f"❌ Error saving {filepath}: {e}")
    
    def generate_comprehensive_report(self, csv_file: str, 
                                    save_formats: List[str] = ['png', 'svg', 'pdf']) -> Dict[str, str]:
        """
        Generate all visualizations and return a comprehensive report.
        
        Args:
            csv_file (str): Path to CSV file containing simulation data
            save_formats (List[str]): Output formats for saving plots
            
        Returns:
            Dict[str, str]: Dictionary mapping visualization types to base filenames
        """
        print("🎨 Starting comprehensive visualization generation...")
        
        # Load data
        self.load_data(csv_file)
        
        # Generate all visualizations
        results = {}
        
        print("\n📈 Generating comprehension evolution plot...")
        results['comprehension_evolution'] = self.plot_comprehension_evolution(save_formats)
        
        print("\n📊 Generating difficulty transitions plot...")
        results['difficulty_transitions'] = self.plot_difficulty_transitions(save_formats)
        
        print("\n📋 Generating performance comparison...")
        results['performance_comparison'] = self.plot_performance_comparison(save_formats)
        
        print("\n📉 Generating score delta analysis...")
        results['score_delta_analysis'] = self.plot_score_delta_analysis(save_formats)
        
        print("\n⏱️ Generating response time analysis...")
        results['response_time_analysis'] = self.plot_response_time_analysis(save_formats)
        
        # Generate summary statistics report
        self._generate_summary_report()
        
        print(f"\n✅ All visualizations completed! Check the '{self.output_dir}' directory.")
        return results
    
    def _generate_summary_report(self):
        """Generate a summary statistics report."""
        if not self.summary_stats:
            return
        
        report = {
            "generation_timestamp": datetime.now().isoformat(),
            "data_summary": {
                "total_records": len(self.data),
                "agents": len(self.data['agent_id'].unique()),
                "turns": self.data['turn_number'].max(),
                "date_range": {
                    "start": self.data['timestamp'].min().isoformat(),
                    "end": self.data['timestamp'].max().isoformat()
                }
            },
            "agent_statistics": self.summary_stats
        }
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = self.output_dir / f"summary_statistics_{timestamp}.json"
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"✅ Summary report saved: {report_file}")


def main():
    """
    Example usage of the EBARS Visualization Module.
    
    This function demonstrates how to use the visualizer with simulation data.
    """
    print("🎨 EBARS Simulation Visualization Module")
    print("=" * 50)
    
    # Example usage
    try:
        # Initialize visualizer
        visualizer = EBARSVisualizer(bilingual=True, output_dir="ebars_visualizations")
        
        # Look for the most recent simulation CSV file
        import glob
        csv_files = glob.glob("ebars_simulation_results_*.csv")
        
        if csv_files:
            # Use the most recent file
            latest_file = max(csv_files, key=os.path.getctime)
            print(f"📁 Using simulation data: {latest_file}")
            
            # Generate all visualizations
            results = visualizer.generate_comprehensive_report(
                latest_file, 
                save_formats=['png', 'svg', 'pdf']
            )
            
            print("\n🎉 Visualization generation completed successfully!")
            print(f"📂 Output directory: {visualizer.output_dir}")
            print("\nGenerated visualizations:")
            for viz_type, filename in results.items():
                print(f"  • {viz_type}: {filename}")
                
        else:
            print("❌ No simulation CSV files found!")
            print("   Run the simulation first using: python ebars_simulation_working.py")
            
            # Provide example with dummy data
            print("\n💡 Creating example visualization with sample data...")
            
            # Create sample data for demonstration
            sample_data = []
            for turn in range(1, 21):
                for agent_id in ['agent_a', 'agent_b', 'agent_c']:
                    if agent_id == 'agent_a':  # Struggling agent
                        base_score = 30 + turn * 1.5 + np.random.normal(0, 3)
                        difficulty = 'struggling' if turn < 10 else 'normal'
                    elif agent_id == 'agent_b':  # Fast learner
                        base_score = 50 + turn * 2.5 + np.random.normal(0, 2)
                        difficulty = 'normal' if turn < 8 else 'good'
                    else:  # Variable agent
                        base_score = 40 + turn * 1.8 + (turn-10)**2 * 0.1 if turn > 10 else 40 - turn * 0.5
                        difficulty = 'struggling' if turn < 12 else 'normal'
                    
                    sample_data.append({
                        'agent_id': agent_id,
                        'turn_number': turn,
                        'question': f'Sample question {turn}',
                        'answer': f'Sample answer for turn {turn}',
                        'emoji_feedback': '👍' if base_score > 60 else '😐' if base_score > 40 else '❌',
                        'comprehension_score': max(0, min(100, base_score)),
                        'difficulty_level': difficulty,
                        'score_delta': np.random.normal(2 if agent_id == 'agent_b' else 1, 2),
                        'level_transition': 'same',
                        'processing_time_ms': np.random.normal(1000, 200),
                        'timestamp': datetime.now().isoformat()
                    })
            
            # Save sample data
            sample_df = pd.DataFrame(sample_data)
            sample_file = "sample_ebars_data.csv"
            sample_df.to_csv(sample_file, index=False, encoding='utf-8')
            print(f"📄 Created sample data: {sample_file}")
            
            # Generate visualizations with sample data
            results = visualizer.generate_comprehensive_report(sample_file)
            print("✅ Example visualizations generated with sample data!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()