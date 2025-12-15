# EBARS Simulation Page - Performance Optimization Plan

## Current Performance Issues (Minor)

### 1. setInterval Cleanup (Line 150-235)

**Issue**: Manual cleanup with `window.__ebars_monitoring_interval`
**Risk**: Medium - potential memory leaks if page unmounts during monitoring

### 2. Table Rendering (Lines 1396-1441)

**Issue**: No virtualization for large datasets
**Risk**: Low - could be slow with 1000+ records

### 3. Export Functions Memory Usage (Lines 940-1173)

**Issue**: Large datasets create memory spikes during export
**Risk**: Low - only during export operations

## Recommended Optimizations

### Priority 1: Interval Cleanup

```typescript
// Replace manual cleanup with useEffect cleanup
useEffect(() => {
  let intervalId: NodeJS.Timeout;

  if (isMonitoring && simulationId) {
    intervalId = setInterval(async () => {
      // monitoring logic
    }, 2000);
  }

  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}, [isMonitoring, simulationId]);
```

### Priority 2: Table Virtualization (Optional)

```typescript
// For large result sets, consider react-window or react-virtualized
import { FixedSizeList as List } from "react-window";

const VirtualizedTable = ({ items }) => (
  <List height={400} itemCount={items.length} itemSize={50}>
    {({ index, style }) => <div style={style}>{/* Row content */}</div>}
  </List>
);
```

### Priority 3: Export Optimization

```typescript
// Use Web Workers for large exports to prevent UI blocking
const exportInWorker = async (data) => {
  const worker = new Worker("/export-worker.js");
  return new Promise((resolve) => {
    worker.postMessage({ data, type: "excel" });
    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
    };
  });
};
```

## Performance Impact Assessment

- **Current**: Good performance for normal usage (0-500 records)
- **With improvements**: Better memory management, supports 1000+ records
- **Risk**: Very low - these are enhancements, not critical fixes
