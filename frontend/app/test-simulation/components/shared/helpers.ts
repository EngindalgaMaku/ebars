// Inline type definitions (will be moved to proper types file later)
interface SimilarityMetrics {
  semanticSimilarity?: number;
  bleuScore?: number;
  rougeL?: number;
  rouge1?: number;
  rouge2?: number;
  f1Score?: number;
  exactMatchRate?: number;
}

interface MethodResults {
  cosineSimilarity: number;
  precisionAt5: number;
  precisionAt10: number;
  avgResponseTime: number;
  accuracy: number;
  similarity?: SimilarityMetrics;
  answerQualitySimilarity?: number | null;
  answerQualityAvailable?: number;
}

interface TestMetrics {
  cosineSimilarity: number;
  precisionAt5: number;
  precisionAt10: number;
  avgResponseTime: number;
  totalQuestions: number;
  correctAnswers: number;
  similarity?: SimilarityMetrics;
  answerQualitySimilarity?: number | null;
  answerQualityAvailable?: number;
}

// Clean helper to read similarity metrics (removed all console.log statements)
export const getSimilarityValue = (
  results: MethodResults | TestMetrics,
  key: keyof SimilarityMetrics
): number | null => {
  if (!results) {
    return null;
  }

  // First, try to get from nested similarity object
  const sim = results?.similarity;
  if (sim && typeof sim[key] === "number") {
    return sim[key] as number;
  }

  // Fallback to legacy field for semantic similarity
  if (
    key === "semanticSimilarity" &&
    results &&
    "answerQualitySimilarity" in results
  ) {
    const legacy = (results as any).answerQualitySimilarity;
    if (typeof legacy === "number") {
      return legacy;
    }
  }

  return null;
};

// Helper function to get similarity value for individual question results
export const getQuestionSimilarityValue = (
  questionResults: any,
  key: keyof SimilarityMetrics
): number | null => {
  // First, try nested similarity object
  const sim = questionResults?.similarity;
  if (sim && typeof sim[key] === "number") {
    return sim[key];
  }

  // Fallback to legacy field for semantic similarity
  if (
    key === "semanticSimilarity" &&
    typeof questionResults?.answer_quality_similarity === "number"
  ) {
    return questionResults.answer_quality_similarity;
  }

  return null;
};

// Method name mapping
export const methodNames: Record<string, string> = {
  eduBars: "AkıllıRehber(RAG +ReRanker Kombinasyonu)",
  basicRag: "AkıllıRehber(Sadece RAG)",
  llmOnly: "Sadece LLM",
};

// Tooltip formatters for charts
export const tooltipFormatterCosine = (
  value: string | number,
  name?: string
): [string, string] => {
  if (Array.isArray(value)) return ["", ""];
  let numericValue: number | null = null;
  if (typeof value === "number") numericValue = value;
  else if (typeof value === "string") {
    const parsed = parseFloat(value);
    numericValue = Number.isFinite(parsed) ? parsed : null;
  }
  if (numericValue === null) return ["", ""];
  const formatted =
    name === "cosine" ? numericValue.toFixed(3) : `${numericValue.toFixed(1)}%`;
  const label =
    name === "cosine"
      ? "Cosine Similarity"
      : name === "precision5"
      ? "Precision@5"
      : "Accuracy";
  return [formatted, label];
};

export const tooltipFormatterResponseTime = (
  value: string | number,
  name?: string
): [string, string] => {
  if (Array.isArray(value)) return ["", ""];
  let numericValue: number | null = null;
  if (typeof value === "number") numericValue = value;
  else if (typeof value === "string") {
    const parsed = parseFloat(value);
    numericValue = Number.isFinite(parsed) ? parsed : null;
  }
  if (numericValue === null) return ["", ""];
  return [`${Math.round(numericValue)}ms`, "Yanıt Süresi"];
};

export const tooltipFormatterPrecision = (
  value: string | number,
  name?: string
): [string, string] => {
  if (Array.isArray(value) || typeof name !== "string") return ["", ""];
  let numericValue: number | null = null;
  if (typeof value === "number") numericValue = value;
  else if (typeof value === "string") {
    const parsed = parseFloat(value);
    numericValue = Number.isFinite(parsed) ? parsed : null;
  }
  if (numericValue === null) return ["", ""];
  const label = name === "precision5" ? "Precision@5" : "Precision@10";
  return [`${numericValue.toFixed(1)}%`, label];
};

export const tooltipFormatterPercent = (
  value: string | number,
  name?: string
): [string, string] => {
  if (Array.isArray(value)) return ["", ""];
  let numericValue: number | null = null;
  if (typeof value === "number") numericValue = value;
  else if (typeof value === "string") {
    const parsed = parseFloat(value);
    numericValue = Number.isFinite(parsed) ? parsed : null;
  }
  if (numericValue === null) return ["", ""];
  return [`${numericValue.toFixed(1)}%`, name || ""];
};
