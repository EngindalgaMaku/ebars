# EBARS Simulation Visualization Module

## Overview

The EBARS Simulation Visualization Module provides comprehensive academic-quality visualizations for analyzing dynamic adaptation patterns in the EBARS (Emoji-Based Adaptive Response System) simulation data.

## Features

### 📊 Visualization Types

1. **Comprehension Score Evolution** - Line graphs showing score progression over 20 turns
2. **Difficulty Level Transitions** - Step plots showing adaptive difficulty changes
3. **Performance Comparison** - Comparative bar charts for final metrics
4. **Score Delta Analysis** - Adaptation speed and effectiveness analysis
5. **Response Time Analysis** - Processing time trends and distributions

### 🎨 Academic Quality Features

- **High DPI Output** (300+ DPI) for publication quality
- **Professional Color Schemes** (not default matplotlib colors)
- **Bilingual Support** (English/Turkish labels)
- **Statistical Annotations** (trend lines, improvement percentages)
- **Multi-format Export** (PNG, SVG, PDF)
- **Academic Formatting** (proper titles, legends, grid lines)

### 🔧 Technical Features

- **Robust Data Validation** with error handling
- **Missing Data Handling** for incomplete simulation runs
- **Comprehensive Statistics** calculation and reporting
- **Batch Processing** for multiple simulation files
- **Flexible Configuration** options

## Installation

### Required Dependencies

```bash
pip install pandas matplotlib seaborn scipy numpy
```

### Files Structure

```
simulasyon_testleri/
├── visualization.py          # Main visualization module
├── test_visualization.py     # Test suite
├── ebars_simulation_working.py  # Simulation runner
└── README_VISUALIZATION.md   # This documentation
```

## Quick Start

### Basic Usage

```python
from visualization import EBARSVisualizer

# Initialize visualizer
visualizer = EBARSVisualizer(bilingual=True, output_dir="my_visualizations")

# Generate all visualizations
results = visualizer.generate_comprehensive_report(
    "ebars_simulation_results_20241206_120000.csv",
    save_formats=['png', 'svg', 'pdf']
)
```

### Individual Plots

```python
# Load data first
visualizer.load_data("simulation_data.csv")

# Create individual plots
visualizer.plot_comprehension_evolution(['png'])
visualizer.plot_difficulty_transitions(['png'])
visualizer.plot_performance_comparison(['png'])
visualizer.plot_score_delta_analysis(['png'])
visualizer.plot_response_time_analysis(['png'])
```

## Expected Data Format

The module expects CSV files with the following columns:

| Column                | Type   | Description                                  |
| --------------------- | ------ | -------------------------------------------- |
| `agent_id`            | string | Agent identifier (agent_a, agent_b, agent_c) |
| `turn_number`         | int    | Turn number (1-20)                           |
| `question`            | string | Question text                                |
| `answer`              | string | Generated answer                             |
| `emoji_feedback`      | string | Emoji feedback (👍, 😊, 😐, ❌)              |
| `comprehension_score` | float  | Current comprehension score (0-100)          |
| `difficulty_level`    | string | Current difficulty level                     |
| `score_delta`         | float  | Score change from previous turn              |
| `level_transition`    | string | Level transition type (up/down/same)         |
| `processing_time_ms`  | float  | Processing time in milliseconds              |
| `timestamp`           | string | ISO timestamp                                |

### Agent Profiles

The system expects three agent profiles:

- **agent_a**: Struggling Agent / Zorlanan Ajan (slow learner)
- **agent_b**: Fast Learner / Hızlı Öğrenen (rapid improvement)
- **agent_c**: Variable Agent / Dalgalı Ajan (inconsistent performance)

### Difficulty Levels

- `very_struggling` - Very Struggling / Çok Zor
- `struggling` - Struggling / Zor
- `normal` - Normal / Normal
- `good` - Good / İyi
- `excellent` - Excellent / Mükemmel

## Visualization Details

### 1. Comprehension Score Evolution

Shows how each agent's comprehension score changes over 20 turns:

- Line plots with trend lines
- Agent-specific colors
- Performance improvement annotations
- Grid lines for easy reading

### 2. Difficulty Level Transitions

Displays adaptive difficulty adjustments:

- Step plots showing level changes
- Transition markers (↑ for up, ↓ for down)
- Separate subplot for each agent
- Color-coded levels

### 3. Performance Comparison

Comparative bar charts showing:

- Score improvement (absolute and percentage)
- Average processing times
- Number of level changes
- Statistical annotations on bars

### 4. Score Delta Analysis

Two-part analysis:

- Score changes over time (adaptation speed)
- Cumulative score changes (adaptation effectiveness)
- Zero-reference lines
- Final value annotations

### 5. Response Time Analysis

Processing time analysis:

- Time trends over turns with trend lines
- Distribution comparison (box plots)
- Mean time annotations
- Agent-specific performance metrics

## Output Files

### Generated Files

For each visualization, the following files are created:

- `{visualization_type}_{timestamp}.png` - High-resolution PNG
- `{visualization_type}_{timestamp}.svg` - Vector graphics
- `{visualization_type}_{timestamp}.pdf` - PDF for LaTeX

### Summary Report

- `summary_statistics_{timestamp}.json` - Comprehensive statistics

## Configuration Options

### EBARSVisualizer Parameters

```python
visualizer = EBARSVisualizer(
    bilingual=True,        # Enable Turkish/English labels
    output_dir="output"    # Output directory for files
)
```

### Export Formats

```python
save_formats = ['png', 'svg', 'pdf']  # Available formats
```

## Testing

### Run Test Suite

```bash
python test_visualization.py
```

### Test Features

- Data loading validation
- Individual plot generation
- Comprehensive report creation
- Error handling verification
- Statistical calculation accuracy

## Error Handling

The module handles various error conditions:

- **Missing CSV files** - FileNotFoundError with clear message
- **Invalid data format** - ValueError with missing column details
- **Incomplete data** - Automatic filtering with warnings
- **Empty datasets** - Graceful error messages
- **Processing errors** - Detailed error reporting

## Advanced Usage

### Custom Agent Colors

```python
visualizer.agent_colors = {
    'agent_a': '#custom_red',
    'agent_b': '#custom_green',
    'agent_c': '#custom_blue'
}
```

### Custom Labels

```python
visualizer.agent_names = {
    'agent_a': 'Custom Struggling Agent',
    'agent_b': 'Custom Fast Learner',
    'agent_c': 'Custom Variable Agent'
}
```

### Batch Processing

```python
import glob

# Process multiple simulation files
csv_files = glob.glob("ebars_simulation_results_*.csv")
for csv_file in csv_files:
    timestamp = csv_file.split('_')[-1].replace('.csv', '')
    visualizer = EBARSVisualizer(output_dir=f"viz_{timestamp}")
    visualizer.generate_comprehensive_report(csv_file)
```

## Academic Publication Guidelines

### For LaTeX Integration

1. Use PDF outputs for best quality
2. Reference figures with descriptive captions
3. Include statistical significance where appropriate
4. Cite the EBARS system methodology

### Recommended Figure Captions

```latex
\begin{figure}[htbp]
\centering
\includegraphics[width=0.8\textwidth]{comprehension_evolution.pdf}
\caption{Comprehension score evolution over 20 interaction turns for three agent profiles in the EBARS system. The struggling agent (red) shows gradual improvement, the fast learner (green) demonstrates rapid adaptation, while the variable agent (blue) exhibits inconsistent performance patterns.}
\label{fig:comprehension_evolution}
\end{figure}
```

### Statistical Reporting

The module provides key metrics for academic reporting:

- Performance improvement percentages
- Adaptation effectiveness measures
- Processing efficiency comparisons
- Statistical significance indicators

## Troubleshooting

### Common Issues

1. **Import Errors**: Install required dependencies
2. **File Not Found**: Check CSV file path and format
3. **Empty Plots**: Verify data contains expected columns
4. **Memory Issues**: Process large files in chunks

### Debug Mode

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Contributing

To extend the visualization module:

1. Add new plot methods to `EBARSVisualizer` class
2. Follow existing naming conventions
3. Include bilingual support
4. Add appropriate error handling
5. Update tests and documentation

## License

This module is part of the EBARS simulation system.

## Contact

For issues or questions about the visualization module, please refer to the main EBARS documentation or contact the development team.

---

_Last updated: 2025-12-06_
