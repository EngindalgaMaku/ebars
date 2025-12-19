import os
import math
import logging
import re
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

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

class EvaluationResponse(BaseModel):
    faithfulness: float
    answer_relevancy: float
    context_precision: Optional[float] = None
    context_recall: Optional[float] = None
    overall_score: float

def get_llm():
    """Configure LLM based on environment variables
    
    Priority:
    1. OpenRouter (if available) - OpenAI uyumlu, çalışıyor
    2. OpenAI (direct)
    3. Groq (fallback)
    """
    # Önce OpenRouter'ı dene - çalışıyor ve OpenAI uyumlu
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
    if openrouter_api_key:
        logger.info("Using OpenRouter LLM for evaluation (OpenAI uyumlu, çalışıyor)")
        # OpenRouter OpenAI uyumlu endpoint kullanıyor
        return ChatOpenAI(
            model="openai/gpt-3.5-turbo",  # OpenRouter model formatı: provider/model
            temperature=0,
            openai_api_key=openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",  # OpenRouter endpoint
            timeout=180,
            max_retries=5,
            request_timeout=180,
            default_headers={
                "HTTP-Referer": "http://localhost:8010",  # OpenRouter için opsiyonel
                "X-Title": "RAGAS Evaluation Service"
            }
        )
    
    # OpenAI direct (fallback)
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if openai_api_key:
        logger.info("Using OpenAI LLM for evaluation (direct)")
        return ChatOpenAI(
            model="gpt-3.5-turbo-0125",
            temperature=0,
            openai_api_key=openai_api_key,
            timeout=180,
            max_retries=5,
            request_timeout=180
        )
    
    # Groq (son çare)
    groq_api_key = os.getenv("GROQ_API_KEY")
    if groq_api_key:
        logger.warning("Using Groq LLM for evaluation (last resort)")
        return ChatGroq(
            model_name="llama-3.1-8b-instant",
            temperature=0,
            groq_api_key=groq_api_key,
            timeout=120
        )
    
    raise ValueError(
        "OPENROUTER_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY must be set for RAGAS evaluation. "
        "OPENROUTER_API_KEY is preferred (çalışıyor)."
    )

def get_embeddings():
    """Configure Embeddings - OpenRouter veya OpenAI kullan"""
    # OpenRouter embeddings için OpenAI embeddings kullanabiliriz
    # OpenRouter'ın embeddings endpoint'i yok, OpenAI embeddings kullanıyoruz
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
    openai_api_key = os.getenv("OPENAI_API_KEY")
    
    logger.info(f"Environment check - OPENROUTER_API_KEY present: {bool(openrouter_api_key)}")
    logger.info(f"Environment check - OPENAI_API_KEY present: {bool(openai_api_key)}")
    
    # OpenRouter varsa onu kullan (ama embeddings için OpenAI gerekli)
    # OpenRouter embeddings desteklemiyor, OpenAI embeddings kullanıyoruz
    if openai_api_key:
        logger.info("Using OpenAI embeddings for RAGAS evaluation")
        return OpenAIEmbeddings(openai_api_key=openai_api_key)
    
    # OpenRouter varsa ama OpenAI yoksa, OpenRouter API key'i OpenAI gibi kullanmayı dene
    # (OpenRouter embeddings desteklemiyor ama deneyelim)
    if openrouter_api_key:
        logger.warning("OpenRouter embeddings desteklemiyor, OpenAI embeddings gerekli")
        logger.warning("OPENAI_API_KEY set edilmedi - embeddings çalışmayabilir")
        # Yine de deneyelim
        return OpenAIEmbeddings(openai_api_key=openrouter_api_key)
    
    error_msg = (
        "OPENAI_API_KEY or OPENROUTER_API_KEY required for embeddings. "
        "RAGAS needs embeddings for some metrics. "
        "Please set OPENAI_API_KEY in .env.production"
    )
    logger.error(error_msg)
    raise ValueError(error_msg)

@app.get("/health")
async def health_check():
    """Health check endpoint with environment variable status"""
    openrouter_key_present = bool(os.getenv("OPENROUTER_API_KEY"))
    openai_key_present = bool(os.getenv("OPENAI_API_KEY"))
    groq_key_present = bool(os.getenv("GROQ_API_KEY"))
    
    return {
        "status": "healthy",
        "service": "evaluation-service",
        "environment": {
            "OPENROUTER_API_KEY_set": openrouter_key_present,
            "OPENAI_API_KEY_set": openai_key_present,
            "GROQ_API_KEY_set": groq_key_present,
            "has_llm_key": openrouter_key_present or openai_key_present or groq_key_present,
            "has_embedding_key": openai_key_present or openrouter_key_present,
            "preferred_provider": "OpenRouter" if openrouter_key_present else ("OpenAI" if openai_key_present else "Groq")
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
            
        # Configure RAGAS with our LLM
        llm = get_llm()
        
        # Evaluate with exception handling disabled to prevent crashes
        # RAGAS will return NaN for failed metrics instead of raising exceptions
        try:
            # Get embeddings
            embeddings = get_embeddings()
            
            # Log configuration for debugging
            logger.info(f"Starting RAGAS evaluation with {len(metrics)} metrics")
            logger.info(f"Dataset size: {len(dataset)}")
            logger.info(f"LLM type: {type(llm).__name__}")
            logger.info(f"Embeddings type: {type(embeddings).__name__}")
            
            results = evaluate(
                dataset=dataset,
                metrics=metrics,
                llm=llm,
                embeddings=embeddings,
                raise_exceptions=False  # Don't crash on individual metric failures
            )
            
            logger.info("RAGAS evaluation completed successfully")
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
        
        # If critical metrics are all NaN, return error
        if faithfulness_score is None and answer_relevancy_score is None:
            logger.error("Both faithfulness and answer_relevancy returned NaN")
            raise HTTPException(
                status_code=503,
                detail="Critical evaluation metrics failed. OpenAI API connection issue detected."
            )
        
        return EvaluationResponse(
            faithfulness=faithfulness_score if faithfulness_score is not None else 0.0,
            answer_relevancy=answer_relevancy_score if answer_relevancy_score is not None else 0.0,
            context_precision=context_precision_score,
            context_recall=context_recall_score,
            overall_score=overall
        )
        
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

