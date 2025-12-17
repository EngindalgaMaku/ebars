// Test Configuration Interface
export interface TestConfig {
  testName: string;
  numQuestions: number;
  testMethods: string[];
  includeManualQuestions: boolean;
  customQuestions: string[];
  customExpectedAnswers: Record<number, string>; // Map of question index to expected answer
  enableBenchmark: boolean;
  exportFormat: string[];
}

// Question Detail Interface
export interface SimilarityMetrics {
  semanticSimilarity?: number;
  rouge1?: number;
  rouge2?: number;
  f1Score?: number;
  exactMatchRate?: number;
}

export interface QuestionDetail {
  question_id: number;
  question: string;
  expected_answer?: string; // Ground truth answer
  methodologies: {
    [key: string]: {
      response: string;
      response_time_ms: number;
      cosine_similarity: number;
      max_similarity: number;
      retrieval_count: number;
      accuracy: number;
      similarity?: SimilarityMetrics; // New similarity metrics (LLM vs reference)
      answer_quality_similarity?: number | null; // Legacy field (backward compatibility)
    };
  };
}

// Test Results Interface
export interface TestResult {
  testId: string;
  testName: string;
  status: "running" | "completed" | "failed" | "stopped";
  progress: number;
  startTime: string;
  endTime?: string;
  executionTime?: {
    total_seconds?: number;
    total_minutes?: number;
    formatted?: string;
    elapsed_seconds?: number;
    elapsed_minutes?: number;
    status?: string;
  };
  metrics: {
    cosineSimilarity: number;
    avgResponseTime: number;
    totalQuestions: number;
    correctAnswers: number;
    similarity?: SimilarityMetrics; // Aggregated similarity metrics
    answerQualitySimilarity?: number | null; // Legacy field (backward compatibility)
    answerQualityAvailable?: number; // Number of questions with ground truth
  };
  methodComparison: {
    eduBars: MethodResults;
    basicRag: MethodResults;
    llmOnly: MethodResults;
  };
  benchmarkComparison: {
    ekoBot: BenchmarkResults;
    current: BenchmarkResults;
  };
  questions?: QuestionDetail[]; // Detailed per-question results
  detailedResultsUrl?: string;
  detailedResultsAvailable?: boolean;
}

export interface MethodResults {
  cosineSimilarity: number;
  precisionAt5: number;
  precisionAt10: number;
  avgResponseTime: number;
  accuracy: number;
  similarity?: SimilarityMetrics; // New similarity metrics
  answerQualitySimilarity?: number | null; // Legacy field (backward compatibility)
  answerQualityAvailable?: number; // Number of questions with ground truth
}

export interface BenchmarkResults {
  cosineSimilarity: number;
  precisionAt5: number;
  label: string;
}
