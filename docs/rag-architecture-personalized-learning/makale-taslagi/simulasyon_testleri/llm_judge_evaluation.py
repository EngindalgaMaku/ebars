"""
LLM-as-a-Judge: EBARS cevaplarının seviye uygunluğunu değerlendir
GPT-4 kullanarak kör hakem (blind review) yöntemiyle değerlendirme
"""

import json
import pandas as pd
from typing import Dict, List
import openai
from pathlib import Path
import time


class LLMJudge:
    """LLM kullanarak cevapları değerlendiren hakem"""
    
    def __init__(self, api_key: str, model: str = "gpt-4-turbo-preview"):
        self.api_key = api_key
        self.model = model
        openai.api_key = api_key
    
    def evaluate_answer(self, answer: str, question: str) -> Dict:
        """
        Bir cevabı Bloom Taksonomisi ve dil karmaşıklığına göre değerlendir
        
        Returns:
            {
                "level": 1-5 (Çok Basit - Çok İleri),
                "reasoning": "Değerlendirme gerekçesi",
                "bloom_level": "Hatırlama/Anlama/Uygulama/Analiz/Değerlendirme/Yaratma"
            }
        """
        prompt = f"""Sen bir eğitim değerlendirme uzmanısın. Aşağıdaki soru ve cevabı Bloom Taksonomisi ve dil karmaşıklığına göre değerlendir.

SORU: {question}

CEVAP:
{answer}

Görevin:
1. Bu cevabın pedagojik seviyesini 1 (Çok Basit) ile 5 (Çok İleri) arasında değerlendir
2. Bloom Taksonomisi seviyesini belirle (Hatırlama, Anlama, Uygulama, Analiz, Değerlendirme, Yaratma)
3. Dil karmaşıklığını değerlendir

Yanıtını JSON formatında ver:
{{
    "level": 1-5 arası sayı,
    "bloom_level": "Bloom seviyesi",
    "reasoning": "Kısa değerlendirme gerekçesi (max 100 kelime)"
}}

SADECE JSON yanıt ver, başka açıklama yapma."""

        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Sen bir eğitim değerlendirme uzmanısın. Sadece JSON formatında yanıt ver."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=300
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # JSON'u parse et
            # Eğer markdown code block içindeyse çıkar
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(result_text)
            
            return {
                "level": int(result.get("level", 3)),
                "bloom_level": result.get("bloom_level", "Anlama"),
                "reasoning": result.get("reasoning", "")
            }
            
        except Exception as e:
            print(f"❌ Error evaluating answer: {e}")
            return {
                "level": 3,  # Default orta seviye
                "bloom_level": "Anlama",
                "reasoning": f"Değerlendirme hatası: {str(e)}"
            }
    
    def evaluate_batch(self, answers: List[Dict], delay: float = 1.0) -> List[Dict]:
        """
        Birden fazla cevabı toplu değerlendir
        
        Args:
            answers: [{"answer": "...", "question": "...", "expected_level": "..."}, ...]
            delay: Her istek arası bekleme süresi (saniye)
        """
        results = []
        
        for idx, item in enumerate(answers, 1):
            print(f"📝 Evaluating {idx}/{len(answers)}...")
            
            evaluation = self.evaluate_answer(
                answer=item["answer"],
                question=item["question"]
            )
            
            evaluation["expected_level"] = item.get("expected_level")
            evaluation["answer_id"] = item.get("answer_id", idx)
            
            results.append(evaluation)
            
            # Rate limiting
            if idx < len(answers):
                time.sleep(delay)
        
        return results


class EBARSLevelMapper:
    """EBARS zorluk seviyelerini sayısal seviyelere çevir"""
    
    LEVEL_MAP = {
        "very_struggling": 1,
        "struggling": 2,
        "normal": 3,
        "good": 4,
        "excellent": 5
    }
    
    @classmethod
    def to_numeric(cls, level: str) -> int:
        """EBARS seviyesini 1-5 arası sayıya çevir"""
        return cls.LEVEL_MAP.get(level, 3)
    
    @classmethod
    def from_numeric(cls, level: int) -> str:
        """Sayısal seviyeyi EBARS seviyesine çevir"""
        reverse_map = {v: k for k, v in cls.LEVEL_MAP.items()}
        return reverse_map.get(level, "normal")


def evaluate_simulation_results(
    csv_file: str,
    api_key: str,
    output_file: str = "llm_judge_results.json"
):
    """
    Simülasyon sonuçlarından cevapları al ve LLM ile değerlendir
    
    Her zorluk seviyesi için örnek cevaplar seçilir ve değerlendirilir
    """
    print(f"📊 Loading simulation results from {csv_file}...")
    df = pd.read_csv(csv_file)
    
    # Her ajan ve seviye için örnek cevaplar seç
    evaluation_items = []
    
    for agent_id in df['agent_id'].unique():
        agent_data = df[df['agent_id'] == agent_id]
        
        # Her zorluk seviyesi için bir örnek seç
        for level in ["very_struggling", "struggling", "normal", "good", "excellent"]:
            level_data = agent_data[agent_data['difficulty_level'] == level]
            
            if not level_data.empty:
                # İlk örneği al
                sample = level_data.iloc[0]
                
                evaluation_items.append({
                    "answer_id": f"{agent_id}_{level}_{sample['turn_number']}",
                    "agent_id": agent_id,
                    "question": sample['question'],
                    "answer": sample['answer'],
                    "expected_level": EBARSLevelMapper.to_numeric(level),
                    "expected_level_name": level,
                    "turn_number": int(sample['turn_number'])
                })
    
    print(f"📝 Found {len(evaluation_items)} answers to evaluate")
    
    # LLM ile değerlendir
    judge = LLMJudge(api_key)
    results = judge.evaluate_batch(evaluation_items, delay=1.0)
    
    # Sonuçları analiz et
    analysis = analyze_judge_results(results)
    
    # Sonuçları kaydet
    output_data = {
        "evaluations": results,
        "analysis": analysis,
        "total_evaluated": len(results)
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Evaluation results saved to {output_file}")
    print(f"\n📊 Analysis:")
    print(f"   Total evaluated: {analysis['total']}")
    print(f"   Exact matches: {analysis['exact_matches']} ({analysis['exact_match_rate']:.1%})")
    print(f"   Within 1 level: {analysis['within_one']} ({analysis['within_one_rate']:.1%})")
    print(f"   Average difference: {analysis['avg_difference']:.2f}")
    
    return output_data


def analyze_judge_results(results: List[Dict]) -> Dict:
    """LLM hakem sonuçlarını analiz et"""
    total = len(results)
    exact_matches = 0
    within_one = 0
    differences = []
    
    for result in results:
        expected = result.get("expected_level", 3)
        actual = result.get("level", 3)
        
        diff = abs(expected - actual)
        differences.append(diff)
        
        if diff == 0:
            exact_matches += 1
        if diff <= 1:
            within_one += 1
    
    return {
        "total": total,
        "exact_matches": exact_matches,
        "exact_match_rate": exact_matches / total if total > 0 else 0,
        "within_one": within_one,
        "within_one_rate": within_one / total if total > 0 else 0,
        "avg_difference": sum(differences) / len(differences) if differences else 0,
        "max_difference": max(differences) if differences else 0
    }


def main():
    """Ana değerlendirme fonksiyonu"""
    import sys
    import os
    
    if len(sys.argv) < 2:
        print("Usage: python llm_judge_evaluation.py <simulation_results.csv> [openai_api_key]")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    api_key = sys.argv[2] if len(sys.argv) > 2 else os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("❌ Error: OpenAI API key required")
        print("   Set OPENAI_API_KEY environment variable or pass as argument")
        sys.exit(1)
    
    output_file = csv_file.replace('.csv', '_llm_judge_results.json')
    
    evaluate_simulation_results(csv_file, api_key, output_file)


if __name__ == "__main__":
    main()

