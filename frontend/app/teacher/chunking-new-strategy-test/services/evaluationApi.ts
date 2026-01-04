/**
 * Evaluation API Service
 * 
 * Provides functions to interact with the chunking evaluation endpoints:
 * - Full evaluation
 * - ZIP export
 * - Agent scores
 * - Similarity analysis
 * - Batch evaluation
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface EvaluationResult {
  success: boolean;
  test_id: string;
  evaluation: {
    similarity_analysis: {
      traditional: SimilarityMetrics;
      multi_agent: SimilarityMetrics;
    };
    scientific_metrics: {
      traditional: ScientificMetrics;
      multi_agent: ScientificMetrics;
    };
    agent_evaluation: AgentEvaluationResult;
    improvements: Record<string, number>;
  };
  summary: {
    traditional_quality: number;
    multi_agent_quality: number;
    overall_improvement_pct: number;
    winner: 'multi_agent' | 'traditional';
  };
}

export interface SimilarityMetrics {
  intra_chunk_similarity: number;
  inter_chunk_similarity: number;
  topic_separation_score: number;
  similarity_variance: number;
  min_similarity: number;
  max_similarity: number;
}

export interface ScientificMetrics {
  hope_score: number;
  topic_drift_score: number;
  context_preservation_score: number;
  semantic_coherence_score: number;
  boundary_quality_score: number;
  information_density_score: number;
  overall_quality_index: number;
}

export interface AgentScore {
  agent_name: string;
  score: number;
  metrics: Record<string, number>;
  details: string;
}

export interface AgentEvaluationResult {
  structural_score: AgentScore;
  semantic_score: AgentScore;
  size_score: AgentScore;
  quality_score: AgentScore;
  overall_score: number;
  weights: {
    structural: number;
    semantic: number;
    size: number;
    quality: number;
  };
}

export interface BatchResult {
  success: boolean;
  batch_result: {
    summary: {
      total_documents: number;
      successful_documents: number;
      failed_documents: number;
    };
    document_results: Array<{
      document_id: string;
      document_name: string;
      traditional_quality: number;
      multi_agent_quality: number;
      improvement_pct: number;
    }>;
    aggregate_metrics: Record<string, {
      mean: number;
      std: number;
      min: number;
      max: number;
      count: number;
    }>;
    statistical_tests: Record<string, number>;
    effect_sizes: Record<string, number>;
    outliers: string[];
  };
  summary: {
    timestamp: string;
    documents_evaluated: number;
    quality_comparison: {
      traditional_mean: number;
      multi_agent_mean: number;
      average_improvement_pct: number;
    };
    statistical_analysis: {
      p_value: number;
      p_value_interpretation: string;
      effect_size: number;
      effect_size_interpretation: string;
    };
    recommendation: string;
  };
}

/**
 * Get full evaluation for a chunking test
 */
export async function getFullEvaluation(testId: string, token?: string): Promise<EvaluationResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/chunking-test/evaluate/${testId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to get evaluation: ${response.status}`);
  }

  return response.json();
}

/**
 * Download ZIP export of chunking test
 */
export async function downloadZipExport(testId: string, token?: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/chunking-test/export-zip/${testId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to download ZIP: ${response.status}`);
  }

  return response.blob();
}

/**
 * Get agent performance scores
 */
export async function getAgentScores(testId: string, token?: string): Promise<{
  success: boolean;
  test_id: string;
  agent_scores: {
    structural: AgentScore;
    semantic: AgentScore;
    size: AgentScore;
    quality: AgentScore;
  };
  overall_score: number;
  weights: Record<string, number>;
}> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/chunking-test/agent-scores/${testId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to get agent scores: ${response.status}`);
  }

  return response.json();
}

/**
 * Get similarity analysis
 */
export async function getSimilarityAnalysis(testId: string, token?: string): Promise<{
  success: boolean;
  test_id: string;
  similarity_analysis: {
    traditional: SimilarityMetrics;
    multi_agent: SimilarityMetrics;
  };
  comparison: {
    intra_chunk_improvement: number;
    topic_separation_improvement: number;
  };
}> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/chunking-test/similarity-analysis/${testId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to get similarity analysis: ${response.status}`);
  }

  return response.json();
}

/**
 * Run batch evaluation on multiple tests
 */
export async function runBatchEvaluation(testIds: string[], token?: string): Promise<BatchResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/chunking-test/batch-evaluate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ test_ids: testIds }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to run batch evaluation: ${response.status}`);
  }

  return response.json();
}

/**
 * Helper function to trigger ZIP download
 */
export async function triggerZipDownload(testId: string, testName: string, token?: string): Promise<void> {
  const blob = await downloadZipExport(testId, token);
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chunking_test_${testName || testId}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Format improvement percentage for display
 */
export function formatImprovement(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Get color class based on improvement value
 */
export function getImprovementColor(value: number): string {
  if (value > 10) return 'text-green-600';
  if (value > 0) return 'text-green-500';
  if (value > -10) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Get badge variant based on score
 */
export function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 0.8) return 'default';
  if (score >= 0.6) return 'secondary';
  if (score >= 0.4) return 'outline';
  return 'destructive';
}
