#!/usr/bin/env python3
"""
Tek Sorguluk Reranker Karşılaştırma Testi
==========================================

Bu test, rerankersız ve rerankerlı sistemlerin aynı sorguya nasıl cevap verdiğini karşılaştırır.
Özellikle rerankerlı sistemin neden "ders kapsamı dışında" dediğini tespit etmek için hazırlanmıştır.

Kullanım:
    python test_single_query_reranker_comparison.py
"""

import os
import sys
import json
import time
import asyncio
import httpx
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path

# API Gateway URL
# Docker container içinde çalışıyorsa, container network'ünde API Gateway'e erişim
# Host'ta çalışıyorsa localhost kullan
if os.path.exists("/.dockerenv"):
    # Docker container içindeyiz - aynı container içinde çalışıyoruz, localhost kullan
    API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://localhost:8000")
else:
    # Host'ta çalışıyoruz
    API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://localhost:8000")

# Test sorgusu
TEST_QUESTION = "Selçuklularda meliklerin (şehzadelerin) eğitiminden sorumlu olan tecrübeli devlet adamına ne ad verilir?"


async def execute_basic_rag(session_id: str, question: str, session_settings: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Execute Basic RAG (no CRAG, no reranker)"""
    start_time = time.time()
    
    try:
        print(f"\n🔄 [BASIC RAG] Sorgu gönderiliyor...")
        print(f"   Session ID: {session_id}")
        print(f"   Sorgu: {question}")
        
        async with httpx.AsyncClient(timeout=120.0, verify=False) as client:
            response = await client.post(
                f"{API_GATEWAY_URL}/rag/query",
                json={
                    "session_id": session_id,
                    "query": question,
                    "top_k": 5,
                    "use_rerank": False,  # No external reranker
                    "min_score": 0.1,
                    "max_context_chars": 6000,
                    "use_direct_llm": False,
                    "disable_aprag": True,  # No personalization
                    "use_crag": False,  # No CRAG evaluation
                    "session_settings": session_settings
                }
            )
        
            execution_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Başarılı! Süre: {execution_time:.0f}ms")
                return {
                    "method": "basicRag",
                    "response": result.get("answer", ""),
                    "sources": result.get("sources", []),
                    "execution_time_ms": execution_time,
                    "success": True,
                    "config": "Basic RAG (no CRAG, no Reranker)",
                    "full_response": result  # Store full response for debugging
                }
            else:
                print(f"   ❌ Hata! Status: {response.status_code}")
                error_text = response.text[:500] if hasattr(response, 'text') else "Unknown error"
                return {
                    "method": "basicRag",
                    "response": "",
                    "sources": [],
                    "execution_time_ms": execution_time,
                    "success": False,
                    "error": f"API Error: {response.status_code}",
                    "error_details": error_text
                }
            
    except Exception as e:
        execution_time = (time.time() - start_time) * 1000
        print(f"   ❌ Exception: {str(e)}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        return {
            "method": "basicRag",
            "response": "",
            "sources": [],
            "execution_time_ms": execution_time,
            "success": False,
            "error": str(e)
        }


async def execute_edubars_full_system(session_id: str, question: str, session_settings: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Execute EduBars Full System (APRAG Personalization DISABLED, Reranker ENABLED)"""
    start_time = time.time()
    
    try:
        print(f"\n🔄 [EDUBARS FULL SYSTEM] Sorgu gönderiliyor...")
        print(f"   Session ID: {session_id}")
        print(f"   Sorgu: {question}")
        print(f"   Reranker: ENABLED")
        print(f"   CRAG: ENABLED")
        
        async with httpx.AsyncClient(timeout=120.0, verify=False) as client:
            response = await client.post(
                f"{API_GATEWAY_URL}/rag/query",
                json={
                    "session_id": session_id,
                    "query": question,
                    "top_k": 5,
                    "use_rerank": True,  # External reranker service enabled
                    "min_score": 0.1,
                    "max_context_chars": 8000,
                    "use_direct_llm": False,
                    "disable_aprag": True,  # CRITICAL: Disable APRAG personalization for academic study
                    "use_crag": True,  # Enable CRAG evaluation for quality control
                    "session_settings": session_settings  # Use dynamic session settings
                }
            )
        
            execution_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Başarılı! Süre: {execution_time:.0f}ms")
                return {
                    "method": "eduBars",
                    "response": result.get("answer", ""),
                    "sources": result.get("sources", []),
                    "execution_time_ms": execution_time,
                    "success": True,
                    "config": "Full System (APRAG OFF, CRAG ON, Reranker ON)",
                    "full_response": result  # Store full response for debugging
                }
            else:
                print(f"   ❌ Hata! Status: {response.status_code}")
                error_text = response.text[:500] if hasattr(response, 'text') else "Unknown error"
                return {
                    "method": "eduBars",
                    "response": "",
                    "sources": [],
                    "execution_time_ms": execution_time,
                    "success": False,
                    "error": f"API Error: {response.status_code}",
                    "error_details": error_text
                }
            
    except Exception as e:
        execution_time = (time.time() - start_time) * 1000
        print(f"   ❌ Exception: {str(e)}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        return {
            "method": "eduBars",
            "response": "",
            "sources": [],
            "execution_time_ms": execution_time,
            "success": False,
            "error": str(e)
        }


def print_detailed_comparison(basic_rag_result: Dict[str, Any], edubars_result: Dict[str, Any]):
    """Detaylı karşılaştırma sonuçlarını yazdır"""
    
    print("\n" + "=" * 80)
    print("📊 DETAYLI KARŞILAŞTIRMA SONUÇLARI")
    print("=" * 80)
    
    # Basic RAG Sonuçları
    print("\n🔵 BASIC RAG (Rerankersız) Sonuçları:")
    print("-" * 80)
    if basic_rag_result["success"]:
        print(f"✅ Durum: Başarılı")
        print(f"⏱️  Süre: {basic_rag_result['execution_time_ms']:.0f}ms")
        print(f"\n📝 Cevap:")
        print(f"   {basic_rag_result['response']}")
        print(f"\n📚 Kaynaklar ({len(basic_rag_result['sources'])} adet):")
        for i, source in enumerate(basic_rag_result['sources'][:5], 1):
            score = source.get('score', 0.0)
            title = source.get('title', 'Başlıksız')[:60]
            print(f"   {i}. [{score:.4f}] {title}")
            if source.get('content'):
                content_preview = source.get('content', '')[:100].replace('\n', ' ')
                print(f"      {content_preview}...")
    else:
        print(f"❌ Durum: Başarısız")
        print(f"   Hata: {basic_rag_result.get('error', 'Bilinmeyen hata')}")
        if 'error_details' in basic_rag_result:
            print(f"   Detaylar: {basic_rag_result['error_details']}")
    
    # EduBars Sonuçları
    print("\n🟢 EDUBARS FULL SYSTEM (Rerankerlı) Sonuçları:")
    print("-" * 80)
    if edubars_result["success"]:
        print(f"✅ Durum: Başarılı")
        print(f"⏱️  Süre: {edubars_result['execution_time_ms']:.0f}ms")
        print(f"\n📝 Cevap:")
        print(f"   {edubars_result['response']}")
        print(f"\n📚 Kaynaklar ({len(edubars_result['sources'])} adet):")
        for i, source in enumerate(edubars_result['sources'][:5], 1):
            score = source.get('score', 0.0)
            rerank_score = source.get('rerank_score', None)
            title = source.get('title', 'Başlıksız')[:60]
            score_str = f"[{score:.4f}]"
            if rerank_score is not None:
                score_str += f" rerank:[{rerank_score:.4f}]"
            print(f"   {i}. {score_str} {title}")
            if source.get('content'):
                content_preview = source.get('content', '')[:100].replace('\n', ' ')
                print(f"      {content_preview}...")
    else:
        print(f"❌ Durum: Başarısız")
        print(f"   Hata: {edubars_result.get('error', 'Bilinmeyen hata')}")
        if 'error_details' in edubars_result:
            print(f"   Detaylar: {edubars_result['error_details']}")
    
    # Karşılaştırma Analizi
    print("\n🔍 KARŞILAŞTIRMA ANALİZİ:")
    print("-" * 80)
    
    if basic_rag_result["success"] and edubars_result["success"]:
        basic_response = basic_rag_result["response"].lower()
        edubars_response = edubars_result["response"].lower()
        
        # "ders kapsamı dışında" kontrolü
        if "ders kapsamı dışında" in edubars_response or "kapsam dışı" in edubars_response:
            print("⚠️  RERANKERLI SİSTEM 'ders kapsamı dışında' diyor!")
        else:
            print("✅ Rerankerlı sistem cevap veriyor")
        
        if "ders kapsamı dışında" in basic_response or "kapsam dışı" in basic_response:
            print("⚠️  RERANKERSIZ SİSTEM de 'ders kapsamı dışında' diyor!")
        else:
            print("✅ Rerankersız sistem cevap veriyor")
        
        # Cevap uzunlukları
        print(f"\n📏 Cevap Uzunlukları:")
        print(f"   Basic RAG: {len(basic_rag_result['response'])} karakter")
        print(f"   EduBars: {len(edubars_result['response'])} karakter")
        
        # Kaynak sayıları
        print(f"\n📚 Kaynak Sayıları:")
        print(f"   Basic RAG: {len(basic_rag_result['sources'])} kaynak")
        print(f"   EduBars: {len(edubars_result['sources'])} kaynak")
        
        # Kaynak skorları karşılaştırması
        if basic_rag_result['sources'] and edubars_result['sources']:
            print(f"\n📊 Kaynak Skorları:")
            basic_scores = [s.get('score', 0.0) for s in basic_rag_result['sources']]
            edubars_scores = [s.get('score', 0.0) for s in edubars_result['sources']]
            edubars_rerank_scores = [s.get('rerank_score', None) for s in edubars_result['sources']]
            
            print(f"   Basic RAG (cosine similarity):")
            print(f"      Ortalama: {sum(basic_scores)/len(basic_scores):.4f}")
            print(f"      En yüksek: {max(basic_scores):.4f}")
            print(f"      En düşük: {min(basic_scores):.4f}")
            
            print(f"   EduBars (cosine similarity):")
            print(f"      Ortalama: {sum(edubars_scores)/len(edubars_scores):.4f}")
            print(f"      En yüksek: {max(edubars_scores):.4f}")
            print(f"      En düşük: {min(edubars_scores):.4f}")
            
            if any(s is not None for s in edubars_rerank_scores):
                valid_rerank_scores = [s for s in edubars_rerank_scores if s is not None]
                if valid_rerank_scores:
                    print(f"   EduBars (rerank scores):")
                    print(f"      Ortalama: {sum(valid_rerank_scores)/len(valid_rerank_scores):.4f}")
                    print(f"      En yüksek: {max(valid_rerank_scores):.4f}")
                    print(f"      En düşük: {min(valid_rerank_scores):.4f}")
        
        # Full response detayları (debug için)
        if 'full_response' in basic_rag_result:
            print(f"\n🔍 Basic RAG Full Response Keys:")
            print(f"   {list(basic_rag_result['full_response'].keys())}")
        
        if 'full_response' in edubars_result:
            print(f"\n🔍 EduBars Full Response Keys:")
            print(f"   {list(edubars_result['full_response'].keys())}")
            if 'crag_evaluation' in edubars_result['full_response']:
                crag = edubars_result['full_response']['crag_evaluation']
                print(f"\n   CRAG Değerlendirmesi:")
                print(f"      {json.dumps(crag, indent=6, ensure_ascii=False)}")
    
    print("\n" + "=" * 80)


async def main():
    """Ana test fonksiyonu"""
    
    print("=" * 80)
    print("🧪 TEK SORGULUK RERANKER KARŞILAŞTIRMA TESTİ")
    print("=" * 80)
    print(f"\n📝 Test Sorgusu:")
    print(f"   {TEST_QUESTION}")
    print(f"\n🔗 API Gateway URL: {API_GATEWAY_URL}")
    
    # Session ID - test için varsayılan bir ID kullan
    # Gerçek bir session ID kullanmak isterseniz, bunu parametre olarak alabilirsiniz
    session_id = os.getenv("SESSION_ID", "test_reranker_comparison")
    
    print(f"\n📋 Session ID: {session_id}")
    print(f"\n⏳ Test başlatılıyor...\n")
    
    # Her iki sistemi de test et
    basic_rag_result = await execute_basic_rag(session_id, TEST_QUESTION)
    edubars_result = await execute_edubars_full_system(session_id, TEST_QUESTION)
    
    # Detaylı karşılaştırma
    print_detailed_comparison(basic_rag_result, edubars_result)
    
    # Sonuçları JSON olarak kaydet
    results = {
        "test_question": TEST_QUESTION,
        "session_id": session_id,
        "timestamp": datetime.now().isoformat(),
        "basic_rag": basic_rag_result,
        "edubars_full_system": edubars_result
    }
    
    output_file = Path("test_reranker_comparison_results.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Sonuçlar kaydedildi: {output_file}")
    print("\n✅ Test tamamlandı!")


if __name__ == "__main__":
    asyncio.run(main())

