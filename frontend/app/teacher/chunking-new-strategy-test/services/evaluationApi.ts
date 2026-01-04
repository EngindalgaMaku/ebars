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

import { apiClient } from "@/lib/api-client";
import { tokenManager } from "@/lib/token-manager";

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
  warning?: {
    type: string;
    message: string;
    embedding_service_status: string;
    recommendation: string;
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
  return apiClient.get(`/chunking-test/evaluate/${testId}`);
}

/**
 * Download ZIP export of chunking test
 */
export async function downloadZipExport(testId: string, token?: string): Promise<Blob> {
  // For blob downloads, we need to use fetch directly with the correct URL
  const response = await fetch(`/api/chunking-test/export-zip/${testId}`, {
    method: 'GET',
    headers: {
      ...(tokenManager.getAccessToken()
        ? { Authorization: `Bearer ${tokenManager.getAccessToken()}` }
        : {}),
    },
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
  return apiClient.get(`/chunking-test/agent-scores/${testId}`);
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
  return apiClient.get(`/chunking-test/similarity-analysis/${testId}`);
}

/**
 * Run batch evaluation on multiple tests
 */
export async function runBatchEvaluation(testIds: string[], token?: string): Promise<BatchResult> {
  return apiClient.post(`/chunking-test/batch-evaluate`, { test_ids: testIds });
}

/**
 * Helper function to trigger ZIP download
 */
export async function triggerZipDownload(testId: string, testName: string, token?: string): Promise<void> {
  const blob = await downloadZipExport(testId, token);
  
  const url = globalThis.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chunking_test_${testName || testId}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL(url);
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
