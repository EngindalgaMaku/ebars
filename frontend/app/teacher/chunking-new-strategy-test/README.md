# Agentic Chunking Strategy Test Page

This page provides a comprehensive testing environment for the new agentic reasoning-based chunking strategy.

## Features

### 1. **File Upload & Configuration**
- Drag & drop Markdown file upload
- Strategy selection (Traditional, Agentic, or Comparison)
- Configurable parameters for both traditional and agentic chunking
- Advanced options for quality metrics and visualization

### 2. **Real-time Monitoring**
- Live progress tracking
- Processing status updates
- Performance metrics display
- Test control (start/stop/reset)

### 3. **Results Analysis**
- Detailed chunk analysis
- Quality metrics calculation
- Performance comparison
- Export functionality

### 4. **Advanced Visualization**
- Interactive chunk visualization
- Side-by-side strategy comparison
- Semantic boundary analysis
- Quality heatmaps

## Components

### Main Page (`page.tsx`)
- Main application logic
- State management
- API integration
- Tab navigation

### ChunkVisualization (`components/ChunkVisualization.tsx`)
- Interactive chunk display
- Multiple view modes (text, blocks, metrics)
- Semantic scoring visualization
- Boundary type indicators

### ChunkingComparison (`components/ChunkingComparison.tsx`)
- Side-by-side strategy comparison
- Performance metrics charts
- Winner analysis
- Detailed comparison views

## API Endpoints

- `POST /api/chunking-test/start` - Start a new chunking test
- `GET /api/chunking-test/status/[testId]` - Get test status
- `GET /api/chunking-test/list` - List all tests
- `POST /api/chunking-test/stop/[testId]` - Stop a running test
- `DELETE /api/chunking-test/delete/[testId]` - Delete a test
- `GET /api/chunking-test/export/[testId]` - Export test results

## Navigation

The page is accessible through the teacher panel navigation under "Simülasyonlar" > "Agentic Chunking Test".

## Usage

1. **Upload a Markdown file** using the drag & drop interface
2. **Configure chunking parameters** based on your testing needs
3. **Select a strategy** (Traditional, Agentic, or Comparison)
4. **Start the test** and monitor progress in real-time
5. **Analyze results** using the comprehensive visualization tools
6. **Export results** in multiple formats (JSON, CSV, TXT)

## Technical Details

- Built with Next.js 14 and TypeScript
- Uses Tailwind CSS for styling
- Integrates with existing TeacherLayout component
- Follows the project's API patterns
- Includes comprehensive error handling
- Supports real-time updates via polling

## Integration

The page is fully integrated with the existing teacher panel:
- Uses the same authentication system
- Follows the same UI/UX patterns
- Integrates with the existing navigation
- Uses the same toast notification system
- Follows the same API gateway pattern