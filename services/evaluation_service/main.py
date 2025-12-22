import os
import math
import logging
import re
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx

# LangChain & RAGAS
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
)

# Optional metric: not available in all ragas versions
try:
    from ragas.metrics import answer_correctness  # type: ignore
    ANSWER_CORRECTNESS_AVAILABLE = True
except Exception:
    answer_correctness = None  # type: ignore
    ANSWER_CORRECTNESS_AVAILABLE = False
from datasets import Dataset

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("evaluation-service")

load_dotenv()

app = FastAPI(
    title="RAG Evaluation Service (RAGAS)",
    description="Microservice for evaluating RAG performance using RAGAS metrics",
    version="1.0.0"
)

# CORS configuration
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:8000,http://localhost:8010"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=os.getenv("CORS_CREDENTIALS", "true").lower() == "true",
    allow_methods=["*"],
    allow_headers=["*"],
)

class EvaluationRequest(BaseModel):
    question: str
    answer: str
    contexts: List[str]
    ground_truth: Optional[str] = None
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None

class EvaluationResponse(BaseModel):
    faithfulness: float
    answer_relevancy: float
    answer_correctness: Optional[float] = None
    context_precision: Optional[float] = None
    context_recall: Optional[float] = None
    overall_score: float

def get_llm(llm_provider: Optional[str] = None, llm_model: Optional[str] = None):
    """Configure LLM based on environment variables
    
    Priority for RAGAS evaluation (Türkçe metinler için):
    1. OpenAI GPT-4 (EN İYİ - Türkçe için en iyi performans)
    2. OpenAI GPT-3.5-turbo (fallback - hızlı ve ucuz)
    3. Groq (fallback - Türkçe için daha az doğru)
    4. OpenRouter (fallback - authentication sorunları olabilir)
    
    NOT: Groq LLM (llama-3.1-8b-instant) Türkçe metinleri değerlendirirken
    yetersiz kalıyor. RAGAS'ın faithfulness ve answer_relevancy metrikleri
    Türkçe statement/question generation gerektiriyor, bu yüzden OpenAI tercih ediliyor.
    """
    requested_provider = (llm_provider or "").strip().lower() or None
    requested_model = (llm_model or "").strip() or None

    def _get_openai_llm(model_name: Optional[str] = None):
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            return None
        openai_model = model_name or os.getenv("RAGAS_OPENAI_MODEL", "gpt-4o-mini")
        logger.info(f"✅ Using OpenAI LLM for RAGAS evaluation (model: {openai_model})")
        return ChatOpenAI(
            model=openai_model,
            temperature=0,
            openai_api_key=openai_api_key,
            timeout=180,
            max_retries=5
        )

    def _get_groq_llm(model_name: Optional[str] = None):
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            return None
        groq_model = model_name or os.getenv("RAGAS_GROQ_MODEL", "llama-3.1-8b-instant")
        logger.info(f"⚠️ Using Groq LLM for evaluation (model: {groq_model})")
        return ChatGroq(
            model_name=groq_model,
            temperature=0,
            groq_api_key=groq_api_key,
            timeout=180,
            max_retries=5
        )

    def _get_openrouter_llm(model_name: Optional[str] = None):
        openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        if not openrouter_api_key:
            return None
        openrouter_model = model_name or os.getenv("RAGAS_OPENROUTER_MODEL", "openai/gpt-3.5-turbo")
        logger.info(f"⚠️ Using OpenRouter LLM for evaluation (model: {openrouter_model})")
        return ChatOpenAI(
            model=openrouter_model,
            temperature=0,
            openai_api_key=openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",
            timeout=180,
            max_retries=5,
            default_headers={
                "HTTP-Referer": "http://localhost:8010",
                "X-Title": "RAGAS Evaluation Service"
            }
        )

    # If a specific provider was requested (e.g., from session rag_settings), honor it first.
    if requested_provider:
        try:
            if requested_provider == "openai":
                llm = _get_openai_llm(requested_model)
                if llm is not None:
                    return llm
            elif requested_provider == "groq":
                llm = _get_groq_llm(requested_model)
                if llm is not None:
                    return llm
            elif requested_provider == "openrouter":
                llm = _get_openrouter_llm(requested_model)
                if llm is not None:
                    return llm
            else:
                logger.warning(f"Unknown requested llm_provider='{requested_provider}', falling back to default selection")
        except Exception as e:
            logger.error(f"❌ Failed to configure requested provider '{requested_provider}': {e}")

    # Default selection order (env-based)
    # Önce OpenAI'ı dene - Türkçe için en iyi performans
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if openai_api_key:
        try:
            return _get_openai_llm()
        except Exception as e:
            logger.error(f"❌ Failed to configure OpenAI: {e}")
            logger.warning("Falling back to Groq...")
    
    # Groq'u dene (fallback - Türkçe için daha az doğru)
    groq_api_key = os.getenv("GROQ_API_KEY")
    if groq_api_key:
        try:
            return _get_groq_llm()
        except Exception as e:
            logger.error(f"❌ Failed to configure Groq: {e}")
            logger.warning("Falling back to OpenRouter...")
    
    # OpenRouter'ı dene (fallback)
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
    if openrouter_api_key:
        logger.info(f"⚠️ Using OpenRouter LLM for evaluation (API key present: {bool(openrouter_api_key)})")
        # OpenRouter için model seçimi
        openrouter_model = os.getenv("RAGAS_OPENROUTER_MODEL", "openai/gpt-3.5-turbo")
        
        # ChatOpenAI ile OpenRouter kullanımı - authentication düzeltmesi
        # OpenRouter OpenAI-compatible API kullanıyor, ama özel header'lar gerekiyor
        try:
            # OpenRouter API key formatını kontrol et
            if not openrouter_api_key or not openrouter_api_key.strip():
                raise ValueError("OpenRouter API key is empty or invalid")
            
            llm = _get_openrouter_llm(openrouter_model)
            # ChatOpenAI, openai_api_key'den Authorization: Bearer <key> header'ını otomatik ekler
            logger.info(f"✅ ChatOpenAI configured for OpenRouter (model: {openrouter_model})")
            logger.debug(f"   API Key present: {bool(openrouter_api_key)}")
            logger.debug(f"   API Key prefix: {openrouter_api_key[:10] if openrouter_api_key else 'None'}...")
            return llm
        except Exception as e:
            logger.error(f"❌ Failed to configure ChatOpenAI for OpenRouter: {e}")
            import traceback
            logger.error(f"   Traceback: {traceback.format_exc()}")
            # Fallback to OpenAI
            logger.warning("Falling back to OpenAI...")
    
    # OpenAI direct (son çare)
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if openai_api_key:
        logger.info("Using OpenAI LLM for evaluation (direct)")
        return ChatOpenAI(
            model="gpt-3.5-turbo-0125",
            temperature=0,
            openai_api_key=openai_api_key,
            timeout=180,  # LangChain 1.x: timeout hem connection hem request timeout için kullanılır
            max_retries=5
        )
    
    raise ValueError(
        "OPENROUTER_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY must be set for RAGAS evaluation. "
        "OPENROUTER_API_KEY is preferred (sisteminizde çalışıyor)."
    )

def get_embeddings():
    """Configure Embeddings - OpenAI kullan (retry ve timeout ayarları ile)"""
    openai_api_key = os.getenv("OPENAI_API_KEY")
    
    logger.info(f"Environment check - OPENAI_API_KEY present: {bool(openai_api_key)}")
    
    if openai_api_key:
        logger.info("Using OpenAI embeddings for RAGAS evaluation")
        # OpenAI embeddings için retry ve timeout ayarları
        # LangChain 1.x: request_timeout parametresi kaldırıldı, sadece timeout kullanılmalı
        # Connection sorunları için agresif retry stratejisi
        try:
            embeddings = OpenAIEmbeddings(
                openai_api_key=openai_api_key,
                model="text-embedding-3-small",  # Daha hızlı ve ucuz
                timeout=180,  # Timeout artırıldı: 120 -> 180 saniye (connection sorunları için)
                max_retries=15,  # Retry sayısı artırıldı: 10 -> 15 (daha fazla deneme şansı)
                # Exponential backoff otomatik (LangChain default)
                # Connection pool ayarları (implicit - LangChain otomatik yönetir)
            )
            logger.info("✅ OpenAI embeddings configured successfully")
            return embeddings
        except Exception as e:
            logger.error(f"❌ Failed to configure OpenAI embeddings: {e}")
            # Fallback: Try with minimal settings
            logger.warning("⚠️ Attempting fallback configuration...")
            return OpenAIEmbeddings(
                openai_api_key=openai_api_key,
                model="text-embedding-3-small",
                timeout=300,  # Very long timeout for problematic connections
                max_retries=20  # Maximum retries
            )
    
    error_msg = (
        "OPENAI_API_KEY required for embeddings. "
        "RAGAS needs embeddings for some metrics (answer_relevancy, etc.). "
        "Please set OPENAI_API_KEY in .env.production"
    )
    logger.error(error_msg)
    raise ValueError(error_msg)

@app.get("/health")
async def health_check():
    """Health check endpoint with environment variable status"""
    groq_key_present = bool(os.getenv("GROQ_API_KEY"))
    openai_key_present = bool(os.getenv("OPENAI_API_KEY"))
    openrouter_key_present = bool(os.getenv("OPENROUTER_API_KEY"))
    
    return {
        "status": "healthy",
        "service": "evaluation-service",
        "environment": {
            "GROQ_API_KEY_set": groq_key_present,
            "OPENAI_API_KEY_set": openai_key_present,
            "OPENROUTER_API_KEY_set": openrouter_key_present,
            "has_llm_key": groq_key_present or openai_key_present or openrouter_key_present,
            "has_embedding_key": openai_key_present or openrouter_key_present,
            "preferred_provider": "Groq" if groq_key_present else ("OpenAI" if openai_key_present else "OpenRouter")
        }
    }

@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_rag(request: EvaluationRequest):
    try:
        logger.info(f"Evaluating request for question: {request.question[:100]}...")
        
        # Prepare data for RAGAS
        data = {
            "question": [request.question],
            "answer": [request.answer],
            "contexts": [request.contexts],
            "ground_truth": [request.ground_truth] if request.ground_truth else [""]
        }
        
        dataset = Dataset.from_dict(data)
        
        # Select metrics based on available data
        metrics = [faithfulness, answer_relevancy]
        if request.ground_truth:
            metrics.extend([context_precision, context_recall])
            if ANSWER_CORRECTNESS_AVAILABLE and answer_correctness is not None:
                metrics.append(answer_correctness)
            
        # Configure RAGAS with our LLM
        logger.info("🔧 Getting LLM configuration...")
        llm = get_llm(request.llm_provider, request.llm_model)
        logger.info(f"✅ LLM configured: {type(llm).__name__}")
        
        # Evaluate with exception handling disabled to prevent crashes
        # RAGAS will return NaN for failed metrics instead of raising exceptions
        try:
            # Get embeddings
            logger.info("🔧 Getting embeddings configuration...")
            embeddings = get_embeddings()
            logger.info(f"✅ Embeddings configured: {type(embeddings).__name__}")
            
            # Log configuration for debugging
            logger.info(f"🚀 Starting RAGAS evaluation with {len(metrics)} metrics")
            logger.info(f"📊 Dataset size: {len(dataset)}")
            logger.info(f"🤖 LLM type: {type(llm).__name__}")
            logger.info(f"🔤 Embeddings type: {type(embeddings).__name__}")
            
            # RAGAS evaluation with improved error handling
            # answer_relevancy metric requires embeddings, so we need to ensure embeddings work
            logger.info("🔄 Starting RAGAS evaluation...")
            # Log metric names (simplified - don't log full prompt examples)
            metric_names = []
            for m in metrics:
                if hasattr(m, '__name__'):
                    metric_names.append(m.__name__)
                elif hasattr(m, 'name'):
                    metric_names.append(m.name)
                else:
                    metric_names.append(str(type(m).__name__))
            logger.info(f"   Metrics to evaluate: {', '.join(metric_names)}")
            
            # Pre-warm embeddings connection to avoid first-request timeout
            # This helps prevent connection errors during evaluation
            try:
                logger.info("🔥 Pre-warming embeddings connection...")
                # Test embeddings with a small text to ensure connection works
                test_embedding = embeddings.embed_query("test connection")
                logger.info(f"✅ Embeddings connection pre-warmed successfully (dimension: {len(test_embedding)})")
            except Exception as warmup_error:
                logger.warning(f"⚠️ Embeddings pre-warm failed (will continue anyway): {warmup_error}")
                # Continue anyway - RAGAS will handle the error gracefully
                # But answer_relevancy may fail if embeddings don't work
            
            # Log input data for debugging
            logger.info("📥 RAGAS Input Data:")
            logger.info(f"   Question: {request.question[:200]}...")
            logger.info(f"   Answer: {request.answer[:200]}...")
            logger.info(f"   Contexts count: {len(request.contexts)}")
            if request.contexts:
                logger.info(f"   First context: {request.contexts[0][:200]}...")
            if request.ground_truth:
                logger.info(f"   Ground truth: {request.ground_truth[:200]}...")
            
            # RAGAS evaluate() function signature:
            # evaluate(dataset, metrics, llm, embeddings, raise_exceptions=False)
            # Note: num_workers and show_progress are NOT valid parameters in RAGAS 0.4.x
            logger.info("🔄 Starting RAGAS evaluation (this may take a while for Turkish text)...")
            results = evaluate(
                dataset=dataset,
                metrics=metrics,
                llm=llm,
                embeddings=embeddings,
                raise_exceptions=False  # Don't crash on individual metric failures
            )
            
            logger.info("✅ RAGAS evaluation completed successfully")
            
            # Log raw results for debugging
            try:
                scores_df = results.to_pandas()
                if not scores_df.empty:
                    raw_scores = scores_df.iloc[0].to_dict()
                    logger.info("📊 RAGAS Raw Scores:")
                    for key, value in raw_scores.items():
                        if key != "question":  # Skip question to avoid log spam
                            logger.info(f"   {key}: {value}")
            except Exception as log_error:
                logger.warning(f"Could not log raw scores: {log_error}")
        except Exception as eval_error:
            error_str = str(eval_error)
            error_type = type(eval_error).__name__
            
            # Handle connection errors specifically
            if "Connection" in error_str or "connection" in error_str.lower() or "APIConnectionError" in error_type:
                logger.error(f"OpenAI API connection error during evaluation: {error_str}")
                logger.error("This indicates a network issue or OpenAI API is unavailable")
                raise HTTPException(
                    status_code=503,  # Service Unavailable
                    detail=f"OpenAI API connection error. Please check network connectivity and OpenAI API status. Error: {error_str[:200]}"
                )
            
            logger.error(f"RAGAS evaluation error ({error_type}): {error_str}")
            raise HTTPException(
                status_code=500,
                detail=f"RAGAS evaluation failed: {error_str[:200]}"
            )
        
        # Extract scores (RAGAS returns a dict-like object)
        try:
            scores_df = results.to_pandas()
            if scores_df.empty:
                raise ValueError("RAGAS returned empty results")
            scores = scores_df.iloc[0].to_dict()
        except Exception as parse_error:
            logger.error(f"Failed to parse RAGAS results: {str(parse_error)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse evaluation results: {str(parse_error)}"
            )
        
        # Calculate overall score (simple average of available metrics)
        # Filter out NaN values
        valid_scores = [
            v for k, v in scores.items() 
            if isinstance(v, (int, float)) 
            and k != "question" 
            and not (isinstance(v, float) and math.isnan(v))  # Check for NaN
        ]
        
        # Check if we have any valid scores
        if not valid_scores:
            logger.error("All RAGAS metrics returned NaN - evaluation failed completely")
            raise HTTPException(
                status_code=503,
                detail="All evaluation metrics failed (returned NaN). This usually indicates an OpenAI API connection issue. Please check API connectivity and try again."
            )
        
        overall = sum(valid_scores) / len(valid_scores) if valid_scores else 0.0
        
        # Handle NaN values in individual metrics
        def safe_float(value, default=None):
            """Convert value to float, return default if NaN or None"""
            if value is None:
                return default
            try:
                fval = float(value)
                # Check for NaN
                if math.isnan(fval):
                    return default
                return fval
            except (ValueError, TypeError):
                return default
        
        # Get individual metric scores, but don't default to 0.0 if they're NaN
        # Instead, check if we have at least one valid metric
        faithfulness_score = safe_float(scores.get("faithfulness"))
        answer_relevancy_score = safe_float(scores.get("answer_relevancy"))
        context_precision_score = safe_float(scores.get("context_precision"))
        context_recall_score = safe_float(scores.get("context_recall"))
        answer_correctness_score = safe_float(scores.get("answer_correctness"))
        
        # Log which metrics succeeded/failed
        successful_metrics = []
        failed_metrics = []
        if faithfulness_score is not None:
            successful_metrics.append("faithfulness")
        else:
            failed_metrics.append("faithfulness")
        if answer_relevancy_score is not None:
            successful_metrics.append("answer_relevancy")
        else:
            failed_metrics.append("answer_relevancy")
        if context_precision_score is not None:
            successful_metrics.append("context_precision")
        else:
            failed_metrics.append("context_precision")
        if context_recall_score is not None:
            successful_metrics.append("context_recall")
        else:
            failed_metrics.append("context_recall")
        if ANSWER_CORRECTNESS_AVAILABLE and request.ground_truth:
            if answer_correctness_score is not None:
                successful_metrics.append("answer_correctness")
            else:
                failed_metrics.append("answer_correctness")
        
        if successful_metrics:
            logger.info(f"✅ Successful metrics: {', '.join(successful_metrics)}")
        if failed_metrics:
            logger.warning(f"⚠️ Failed metrics (returned NaN): {', '.join(failed_metrics)}")
        
        # If critical metrics are all NaN, return error
        if faithfulness_score is None and answer_relevancy_score is None:
            logger.error("Both faithfulness and answer_relevancy returned NaN")
            raise HTTPException(
                status_code=503,
                detail="Critical evaluation metrics failed. This usually indicates an OpenAI embeddings API connection issue. Please check OPENAI_API_KEY and network connectivity."
            )
        
        # Return results - use 0.0 for failed metrics (they'll be marked as unavailable)
        # IMPORTANT: Even if some metrics fail (NaN), we still return the successful ones
        # This ensures the frontend receives partial results instead of a complete failure
        response_data = EvaluationResponse(
            faithfulness=faithfulness_score if faithfulness_score is not None else 0.0,
            answer_relevancy=answer_relevancy_score if answer_relevancy_score is not None else 0.0,
            answer_correctness=answer_correctness_score if (ANSWER_CORRECTNESS_AVAILABLE and request.ground_truth) else None,
            context_precision=context_precision_score if context_precision_score is not None else None,
            context_recall=context_recall_score if context_recall_score is not None else None,
            overall_score=overall
        )
        
        # Log the response being returned
        logger.info(f"📤 Returning evaluation response:")
        logger.info(f"   Faithfulness: {response_data.faithfulness}")
        logger.info(f"   Answer Relevancy: {response_data.answer_relevancy}")
        logger.info(f"   Context Precision: {response_data.context_precision}")
        logger.info(f"   Context Recall: {response_data.context_recall}")
        logger.info(f"   Overall Score: {response_data.overall_score}")
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Evaluation failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", os.getenv("RAGAS_SERVICE_PORT", "8010")))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)

