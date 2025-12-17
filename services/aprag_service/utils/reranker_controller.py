"""
Unified Reranker Controller - Phase 1 Solution
Centralized reranker routing and conflict resolution
Prevents double reranking and provides unified configuration
"""
from typing import Dict, Any, Optional, List, Tuple
import logging
import os

logger = logging.getLogger(__name__)

class RerankerController:
    """
    Unified reranker control to prevent conflicts between multiple reranker implementations
    
    Manages:
    1. Reranker routing (APRAG vs Dedicated Service vs API Gateway)
    2. Configuration precedence (session settings vs request parameters)
    3. Double reranking prevention
    4. Backward compatibility
    """
    
    def __init__(self):
        self.logger = logger
        self.reranker_usage_tracking = {}  # Track reranker usage per request
        
    def determine_reranker_strategy(
        self, 
        session_id: str, 
        request_params: Dict[str, Any], 
        session_rag_settings: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Determine which reranker to use and how to configure it
        
        Priority order:
        1. Session-level reranker settings (persistent)
        2. Request-level parameters (temporary override)
        3. System defaults
        
        Returns:
        {
            "use_reranker": bool,
            "reranker_strategy": "none" | "aprag_internal" | "dedicated_service" | "api_gateway",
            "reranker_service_config": {...},
            "prevent_double_rerank": bool,
            "routing_decision": str
        }
        """
        request_id = request_id or f"{session_id}_{id(request_params)}"
        
        # Initialize tracking for this request
        if request_id not in self.reranker_usage_tracking:
            self.reranker_usage_tracking[request_id] = {
                "rerankers_used": [],
                "final_decision": None
            }
        
        session_settings = session_rag_settings or {}
        
        # Step 1: Determine if reranking should be used at all
        use_reranker = self._resolve_use_reranker(request_params, session_settings)
        
        if not use_reranker:
            decision = {
                "use_reranker": False,
                "reranker_strategy": "none",
                "reranker_service_config": {},
                "prevent_double_rerank": True,
                "routing_decision": "Reranking explicitly disabled"
            }
            self._track_decision(request_id, decision)
            return decision
        
        # Step 2: Determine which reranker service to use
        strategy = self._determine_reranker_service(request_params, session_settings)
        
        # Step 3: Build service configuration
        service_config = self._build_service_config(request_params, session_settings, strategy)
        
        # Step 4: Check for potential conflicts
        prevent_double_rerank = self._should_prevent_double_rerank(strategy, request_params, session_settings)
        
        decision = {
            "use_reranker": True,
            "reranker_strategy": strategy,
            "reranker_service_config": service_config,
            "prevent_double_rerank": prevent_double_rerank,
            "routing_decision": self._explain_routing_decision(strategy, request_params, session_settings)
        }
        
        self._track_decision(request_id, decision)
        return decision
    
    def _resolve_use_reranker(self, request_params: Dict[str, Any], session_settings: Dict[str, Any]) -> bool:
        """Resolve whether to use reranker based on priority order"""
        
        # Priority 1: Explicit request parameter
        if "use_rerank" in request_params and request_params["use_rerank"] is not None:
            return bool(request_params["use_rerank"])
            
        # Priority 2: Session-level use_reranker_service setting
        if "use_reranker_service" in session_settings and session_settings["use_reranker_service"] is not None:
            return bool(session_settings["use_reranker_service"])
            
        # Priority 3: Session-level use_rerank setting (backward compatibility)
        if "use_rerank" in session_settings and session_settings["use_rerank"] is not None:
            return bool(session_settings["use_rerank"])
            
        # Default: Enable reranking
        return True
    
    def _determine_reranker_service(self, request_params: Dict[str, Any], session_settings: Dict[str, Any]) -> str:
        """Determine which reranker service to use"""
        
        # Priority 1: Session-level reranker service preference
        if session_settings.get("use_reranker_service") is True:
            return "dedicated_service"
            
        # Priority 2: Request-level service override
        if request_params.get("use_reranker_service") is True:
            return "dedicated_service"
            
        # Priority 3: Check for APRAG disable flag
        if request_params.get("disable_aprag") is True:
            return "api_gateway"  # Use API Gateway reranking if APRAG is disabled
            
        # Priority 4: Check APRAG usage patterns
        use_crag = request_params.get("use_crag")
        use_ebars = request_params.get("use_ebars_personalization", True)
        
        if use_crag is False and use_ebars is False:
            # If both CRAG and eBars are disabled, use dedicated service for pure RAG
            return "dedicated_service"
        elif use_ebars is True:
            # If eBars personalization is enabled, use APRAG internal reranking
            return "aprag_internal"
        else:
            # Default to dedicated service for most reliable reranking
            return "dedicated_service"
    
    def _build_service_config(self, request_params: Dict[str, Any], session_settings: Dict[str, Any], strategy: str) -> Dict[str, Any]:
        """Build configuration for the chosen reranker service"""
        
        config = {}
        
        if strategy == "dedicated_service":
            # Configuration for dedicated reranker service
            config.update({
                "service_endpoint": "/rerank",
                "reranker_type": session_settings.get("reranker_type") or request_params.get("reranker_type") or "alibaba",
                "top_k": request_params.get("top_k") or session_settings.get("top_k") or 5,
                "timeout": 30
            })
            
        elif strategy == "aprag_internal":
            # Configuration for APRAG internal reranker
            config.update({
                "use_crag": request_params.get("use_crag", True),
                "use_ebars_personalization": request_params.get("use_ebars_personalization", True),
                "top_k": request_params.get("top_k") or session_settings.get("top_k") or 5
            })
            
        elif strategy == "api_gateway":
            # Configuration for API Gateway reranking
            config.update({
                "use_rerank": True,
                "min_score": request_params.get("min_score") or session_settings.get("min_score") or 0.1,
                "top_k": request_params.get("top_k") or session_settings.get("top_k") or 5
            })
        
        return config
    
    def _should_prevent_double_rerank(self, strategy: str, request_params: Dict[str, Any], session_settings: Dict[str, Any]) -> bool:
        """Determine if double reranking prevention is needed"""
        
        # Always prevent double reranking when using dedicated service
        if strategy == "dedicated_service":
            return True
            
        # Prevent if multiple reranker flags are set
        rerank_flags = [
            request_params.get("use_rerank"),
            request_params.get("use_reranker_service"),
            session_settings.get("use_rerank"),
            session_settings.get("use_reranker_service")
        ]
        
        active_flags = [flag for flag in rerank_flags if flag is True]
        return len(active_flags) > 1
    
    def _explain_routing_decision(self, strategy: str, request_params: Dict[str, Any], session_settings: Dict[str, Any]) -> str:
        """Generate human-readable explanation of routing decision"""
        
        explanations = {
            "none": "Reranking disabled by configuration",
            "dedicated_service": f"Using dedicated reranker service (type: {session_settings.get('reranker_type') or 'alibaba'})",
            "aprag_internal": "Using APRAG internal reranker with personalization",
            "api_gateway": "Using API Gateway reranker (APRAG disabled or fallback)"
        }
        
        base_explanation = explanations.get(strategy, f"Unknown strategy: {strategy}")
        
        # Add configuration details
        details = []
        if session_settings.get("use_reranker_service"):
            details.append("session prefers dedicated service")
        if request_params.get("disable_aprag"):
            details.append("APRAG disabled")
        if request_params.get("use_crag") is False:
            details.append("CRAG disabled")
            
        if details:
            return f"{base_explanation} ({', '.join(details)})"
        
        return base_explanation
    
    def _track_decision(self, request_id: str, decision: Dict[str, Any]):
        """Track reranker decision for debugging and conflict detection"""
        self.reranker_usage_tracking[request_id]["final_decision"] = decision
        self.reranker_usage_tracking[request_id]["rerankers_used"].append(decision["reranker_strategy"])
        
        self.logger.info(f"🎯 [RERANKER CONTROLLER] Request {request_id}: {decision['routing_decision']}")
        
        if decision["prevent_double_rerank"]:
            self.logger.info(f"🛡️ [RERANKER CONTROLLER] Double reranking prevention ACTIVE for request {request_id}")
    
    def get_usage_stats(self, request_id: Optional[str] = None) -> Dict[str, Any]:
        """Get reranker usage statistics"""
        if request_id:
            return self.reranker_usage_tracking.get(request_id, {})
        
        # Return overall stats
        all_strategies = []
        for tracking in self.reranker_usage_tracking.values():
            if tracking.get("final_decision"):
                all_strategies.append(tracking["final_decision"]["reranker_strategy"])
        
        from collections import Counter
        strategy_counts = Counter(all_strategies)
        
        return {
            "total_requests": len(self.reranker_usage_tracking),
            "strategy_distribution": dict(strategy_counts),
            "most_used_strategy": strategy_counts.most_common(1)[0][0] if strategy_counts else "none"
        }
    
    def cleanup_tracking(self, older_than_minutes: int = 60):
        """Clean up old tracking entries to prevent memory leaks"""
        import time
        current_time = time.time()
        cutoff_time = current_time - (older_than_minutes * 60)
        
        # Simple cleanup - in production, you'd track timestamps properly
        if len(self.reranker_usage_tracking) > 1000:
            # Keep only the most recent 500 entries
            keys_to_keep = list(self.reranker_usage_tracking.keys())[-500:]
            self.reranker_usage_tracking = {
                k: v for k, v in self.reranker_usage_tracking.items() 
                if k in keys_to_keep
            }
            self.logger.info(f"🧹 [RERANKER CONTROLLER] Cleaned up tracking, kept {len(keys_to_keep)} entries")

# Global reranker controller instance
reranker_controller = RerankerController()

# Utility functions for easy integration
def get_reranker_strategy(session_id: str, request_params: Dict[str, Any], session_rag_settings: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Convenience function to get reranker strategy"""
    return reranker_controller.determine_reranker_strategy(session_id, request_params, session_rag_settings)

def should_use_dedicated_reranker(session_id: str, request_params: Dict[str, Any], session_rag_settings: Optional[Dict[str, Any]] = None) -> bool:
    """Check if dedicated reranker service should be used"""
    strategy = get_reranker_strategy(session_id, request_params, session_rag_settings)
    return strategy["reranker_strategy"] == "dedicated_service"

def should_prevent_aprag_reranking(session_id: str, request_params: Dict[str, Any], session_rag_settings: Optional[Dict[str, Any]] = None) -> bool:
    """Check if APRAG internal reranking should be prevented"""
    strategy = get_reranker_strategy(session_id, request_params, session_rag_settings)
    return strategy["reranker_strategy"] != "aprag_internal"