import os
import math
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends
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
    
    Prefers OpenAI over Groq due to better stability and compatibility with RAGAS.
    Groq has known issues with token usage tracking in langchain_groq.
    """
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if openai_api_key:
        logger.info("Using OpenAI LLM for evaluation (preferred for stability)")
        return ChatOpenAI(
            model="gpt-3.5-turbo-0125",
            temperature=0,
            openai_api_key=openai_api_key,
            timeout=120,  # 2 minute timeout
            max_retries=3,  # Retry on connection errors
            request_timeout=120  # Request timeout
        )
    
    # Fallback to Groq if OpenAI not available
    groq_api_key = os.getenv("GROQ_API_KEY")
    if groq_api_key:
        logger.warning("Using Groq LLM for evaluation (OpenAI preferred but not available)")
        logger.warning("Note: Groq may have token usage tracking issues")
        return ChatGroq(
            model_name="llama-3.1-8b-instant",
            temperature=0,
            groq_api_key=groq_api_key,
            timeout=120  # 2 minute timeout
        )
    
    raise ValueError(
        "OPENAI_API_KEY or GROQ_API_KEY must be set for RAGAS evaluation. "
        "OPENAI_API_KEY is preferred for better stability."
    )

def get_embeddings():
    """Configure Embeddings"""
    # RAGAS needs embeddings for some metrics. 
    # Check if OPENAI_API_KEY is available
    openai_api_key = os.getenv("OPENAI_API_KEY")
    
    # Debug: Log all environment variables (without exposing values)
    env_vars = ["OPENAI_API_KEY", "GROQ_API_KEY", "PORT", "HOST"]
    logger.info(f"Environment check - OPENAI_API_KEY present: {bool(openai_api_key)}")
    logger.info(f"Environment check - GROQ_API_KEY present: {bool(os.getenv('GROQ_API_KEY'))}")
    
    if not openai_api_key:
        # Try to get from alternative sources
        openai_api_key = os.environ.get("OPENAI_API_KEY")  # Try direct access
        
        if not openai_api_key:
            error_msg = (
                "OPENAI_API_KEY environment variable is required for RAGAS evaluation. "
                "Please ensure OPENAI_API_KEY is set in .env.production file and "
                "container is restarted with: docker-compose -f docker-compose.prod.yml up -d --build ragas-service"
            )
            logger.error(error_msg)
            raise ValueError(error_msg)
    
    logger.info("Using OpenAI embeddings for RAGAS evaluation")
    return OpenAIEmbeddings(openai_api_key=openai_api_key)

@app.get("/health")
async def health_check():
    """Health check endpoint with environment variable status"""
    openai_key_present = bool(os.getenv("OPENAI_API_KEY"))
    groq_key_present = bool(os.getenv("GROQ_API_KEY"))
    
    return {
        "status": "healthy",
        "service": "evaluation-service",
        "environment": {
            "OPENAI_API_KEY_set": openai_key_present,
            "GROQ_API_KEY_set": groq_key_present,
            "has_llm_key": openai_key_present or groq_key_present,
            "has_embedding_key": openai_key_present
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
            results = evaluate(
                dataset=dataset,
                metrics=metrics,
                llm=llm,
                embeddings=get_embeddings(),
                raise_exceptions=False  # Don't crash on individual metric failures
            )
        except Exception as eval_error:
            error_str = str(eval_error)
            error_type = type(eval_error).__name__
            
            # Handle connection errors specifically
            if "Connection" in error_str or "connection" in error_str.lower():
                logger.warning(f"OpenAI connection error during evaluation (may be transient): {error_str}")
                logger.info("RAGAS will return NaN for failed metrics due to connection issues")
                # Try to continue - RAGAS should handle this with raise_exceptions=False
                # But if it still raises, we need to handle it
                raise HTTPException(
                    status_code=503,  # Service Unavailable
                    detail=f"OpenAI API connection error during evaluation. This may be a temporary network issue. Error: {error_str}"
                )
            
            logger.error(f"RAGAS evaluation error ({error_type}): {error_str}")
            raise HTTPException(
                status_code=500,
                detail=f"RAGAS evaluation failed: {error_str}"
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
        
        overall = sum(valid_scores) / len(valid_scores) if valid_scores else 0.0
        
        # Handle NaN values in individual metrics
        def safe_float(value):
            """Convert value to float, return None if NaN"""
            if value is None:
                return None
            try:
                fval = float(value)
                # Check for NaN
                return None if math.isnan(fval) else fval
            except (ValueError, TypeError):
                return None
        
        return EvaluationResponse(
            faithfulness=safe_float(scores.get("faithfulness", 0.0)) or 0.0,
            answer_relevancy=safe_float(scores.get("answer_relevancy", 0.0)) or 0.0,
            context_precision=safe_float(scores.get("context_precision")),
            context_recall=safe_float(scores.get("context_recall")),
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

