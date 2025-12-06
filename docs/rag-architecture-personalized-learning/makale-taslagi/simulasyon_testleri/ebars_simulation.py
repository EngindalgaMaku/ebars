"""
EBARS Sistem Simülasyon Testi
Sentetik öğrenci ajanları ile sistem adaptasyonunu test eder
"""

import requests
import json
import time
import csv
from datetime import datetime
from typing import Dict, List, Optional
import random
from dataclasses import dataclass, asdict


@dataclass
class TurnData:
    """Bir tur için toplanan veriler"""
    agent_id: str
    turn_number: int
    question: str
    answer: str
    answer_length: int
    emoji_feedback: str
    comprehension_score: float
    difficulty_level: str
    score_delta: float
    level_transition: str  # 'up', 'down', 'same'
    processing_time_ms: float
    timestamp: str


class EBARSAgent:
    """EBARS sistemini test eden sentetik öğrenci ajanı"""
    
    def __init__(
        self,
        agent_id: str,
        agent_name: str,
        user_id: str,
        session_id: str,
        api_base_url: str,
        feedback_strategy: str,  # 'negative', 'positive', 'variable'
        emoji_distribution: Dict[str, float]
    ):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.user_id = user_id
        self.session_id = session_id
        self.api_base_url = api_base_url
        self.feedback_strategy = feedback_strategy
        self.emoji_distribution = emoji_distribution
        self.turn_data: List[TurnData] = []
        self.previous_score: Optional[float] = None
        self.previous_level: Optional[str] = None
        self.turn_count = 0
        
    def get_emoji_feedback(self, turn_number: int) -> str:
        """Ajan stratejisine göre emoji geri bildirimi döndürür"""
        if self.feedback_strategy == 'variable':
            # İlk 10 tur negatif, son 10 tur pozitif
            if turn_number <= 10:
                # Negatif ağırlıklı
                return random.choices(
                    ['❌', '😐'],
                    weights=[0.8, 0.2]
                )[0]
            else:
                # Pozitif ağırlıklı
                return random.choices(
                    ['👍', '😊'],
                    weights=[0.8, 0.2]
                )[0]
        else:
            # Stratejiye göre emoji seç
            emojis = list(self.emoji_distribution.keys())
            weights = list(self.emoji_distribution.values())
            return random.choices(emojis, weights=weights)[0]
    
    def ask_question(self, question: str) -> Dict:
        """Sisteme soru sorar"""
        try:
            start_time = time.time()
            
            response = requests.post(
                f"{self.api_base_url}/aprag/ebars/query",
                json={
                    "user_id": self.user_id,
                    "session_id": self.session_id,
                    "query": question
                },
                timeout=60
            )
            
            processing_time = (time.time() - start_time) * 1000  # ms
            
            if response.status_code != 200:
                raise Exception(f"Query failed: {response.status_code} - {response.text}")
            
            return {
                "response_data": response.json(),
                "processing_time_ms": processing_time
            }
        except Exception as e:
            print(f"❌ Error asking question: {e}")
            raise
    
    def send_feedback(self, interaction_id: int, emoji: str) -> Dict:
        """Sisteme emoji geri bildirimi gönderir"""
        try:
            response = requests.post(
                f"{self.api_base_url}/aprag/ebars/feedback",
                json={
                    "user_id": self.user_id,
                    "session_id": self.session_id,
                    "emoji": emoji,
                    "interaction_id": interaction_id
                },
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"Feedback failed: {response.status_code} - {response.text}")
            
            return response.json()
        except Exception as e:
            print(f"❌ Error sending feedback: {e}")
            raise
    
    def get_current_state(self) -> Dict:
        """Öğrencinin mevcut durumunu alır"""
        try:
            response = requests.get(
                f"{self.api_base_url}/aprag/ebars/state/{self.user_id}/{self.session_id}",
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"State fetch failed: {response.status_code}")
            
            return response.json()
        except Exception as e:
            print(f"❌ Error getting state: {e}")
            raise
    
    def initialize_score(self, initial_score: float = 50.0, initial_level: str = 'normal'):
        """Başlangıç skorunu ayarlar"""
        try:
            response = requests.post(
                f"{self.api_base_url}/aprag/ebars/score/reset/{self.user_id}/{self.session_id}",
                json={
                    "comprehension_score": initial_score,
                    "difficulty_level": initial_level
                },
                timeout=30
            )
            
            if response.status_code != 200:
                print(f"⚠️ Warning: Could not reset score: {response.status_code}")
            else:
                self.previous_score = initial_score
                self.previous_level = initial_level
                print(f"✅ {self.agent_name}: Initialized with score={initial_score}, level={initial_level}")
        except Exception as e:
            print(f"⚠️ Warning: Could not initialize score: {e}")
    
    def run_turn(self, question: str) -> TurnData:
        """Bir tur çalıştırır: soru sor, cevap al, geri bildirim gönder"""
        self.turn_count += 1
        
        print(f"\n🔄 {self.agent_name} - Turn {self.turn_count}")
        print(f"   Question: {question[:50]}...")
        
        # Soruyu sor
        query_result = self.ask_question(question)
        response_data = query_result["response_data"]
        processing_time = query_result["processing_time_ms"]
        
        answer = response_data.get("answer", "")
        interaction_id = response_data.get("interaction_id")
        
        # Emoji geri bildirimi seç
        emoji = self.get_emoji_feedback(self.turn_count)
        
        # Geri bildirim gönder
        if interaction_id:
            feedback_result = self.send_feedback(interaction_id, emoji)
            print(f"   Feedback: {emoji}")
        else:
            print(f"   ⚠️ No interaction_id, skipping feedback")
            feedback_result = {}
        
        # Mevcut durumu al
        time.sleep(1)  # Sistemin güncellemesi için kısa bekleme
        state = self.get_current_state()
        
        current_score = state.get("comprehension_score", self.previous_score or 50.0)
        current_level = state.get("difficulty_level", self.previous_level or "normal")
        
        # Değişimleri hesapla
        score_delta = 0.0
        if self.previous_score is not None:
            score_delta = current_score - self.previous_score
        
        level_transition = "same"
        if self.previous_level and self.previous_level != current_level:
            level_order = ['very_struggling', 'struggling', 'normal', 'good', 'excellent']
            prev_idx = level_order.index(self.previous_level)
            curr_idx = level_order.index(current_level)
            if curr_idx > prev_idx:
                level_transition = "up"
            elif curr_idx < prev_idx:
                level_transition = "down"
        
        # Veriyi kaydet
        turn_data = TurnData(
            agent_id=self.agent_id,
            turn_number=self.turn_count,
            question=question,
            answer=answer,
            answer_length=len(answer),
            emoji_feedback=emoji,
            comprehension_score=current_score,
            difficulty_level=current_level,
            score_delta=score_delta,
            level_transition=level_transition,
            processing_time_ms=processing_time,
            timestamp=datetime.now().isoformat()
        )
        
        self.turn_data.append(turn_data)
        
        # Durumu güncelle
        self.previous_score = current_score
        self.previous_level = current_level
        
        print(f"   Score: {self.previous_score:.1f} → {current_score:.1f} ({score_delta:+.1f})")
        print(f"   Level: {self.previous_level} → {current_level} ({level_transition})")
        
        return turn_data


class EBARSSimulation:
    """EBARS sistem simülasyonu"""
    
    def __init__(self, api_base_url: str, session_id: str):
        self.api_base_url = api_base_url
        self.session_id = session_id
        self.agents: List[EBARSAgent] = []
        self.questions: List[str] = []
        
    def add_agent(
        self,
        agent_id: str,
        agent_name: str,
        user_id: str,
        feedback_strategy: str,
        emoji_distribution: Dict[str, float]
    ):
        """Ajan ekle"""
        agent = EBARSAgent(
            agent_id=agent_id,
            agent_name=agent_name,
            user_id=user_id,
            session_id=self.session_id,
            api_base_url=self.api_base_url,
            feedback_strategy=feedback_strategy,
            emoji_distribution=emoji_distribution
        )
        self.agents.append(agent)
        return agent
    
    def load_questions(self, questions: List[str]):
        """Test sorularını yükle"""
        self.questions = questions
    
    def initialize_agents(self, initial_score: float = 50.0, initial_level: str = 'normal'):
        """Tüm ajanları başlangıç durumuna getir"""
        print("\n📋 Initializing agents...")
        for agent in self.agents:
            agent.initialize_score(initial_score, initial_level)
        print("✅ All agents initialized\n")
    
    def run_simulation(self, num_turns: int = 20):
        """Simülasyonu çalıştır"""
        if len(self.questions) < num_turns:
            raise ValueError(f"Not enough questions. Need {num_turns}, have {len(self.questions)}")
        
        print(f"\n🚀 Starting simulation: {num_turns} turns")
        print(f"   Agents: {len(self.agents)}")
        print(f"   Session: {self.session_id}\n")
        
        for turn in range(1, num_turns + 1):
            question = self.questions[turn - 1]
            print(f"\n{'='*60}")
            print(f"TURN {turn}/{num_turns}")
            print(f"{'='*60}")
            
            # Her ajan için tur çalıştır
            for agent in self.agents:
                try:
                    agent.run_turn(question)
                    time.sleep(2)  # Ajanlar arası bekleme
                except Exception as e:
                    print(f"❌ Error in {agent.agent_name}: {e}")
                    continue
            
            # Tur arası bekleme
            if turn < num_turns:
                print(f"\n⏳ Waiting 5 seconds before next turn...")
                time.sleep(5)
        
        print(f"\n✅ Simulation completed!")
    
    def save_results(self, output_file: str):
        """Sonuçları CSV dosyasına kaydet"""
        print(f"\n💾 Saving results to {output_file}...")
        
        all_turns = []
        for agent in self.agents:
            all_turns.extend([asdict(turn) for turn in agent.turn_data])
        
        if not all_turns:
            print("⚠️ No data to save")
            return
        
        # CSV yaz
        fieldnames = [
            'agent_id', 'turn_number', 'question', 'answer', 'answer_length',
            'emoji_feedback', 'comprehension_score', 'difficulty_level',
            'score_delta', 'level_transition', 'processing_time_ms', 'timestamp'
        ]
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_turns)
        
        print(f"✅ Saved {len(all_turns)} turn records")
    
    def get_summary(self) -> Dict:
        """Simülasyon özeti"""
        summary = {
            "simulation_info": {
                "session_id": self.session_id,
                "total_turns": len(self.questions),
                "num_agents": len(self.agents)
            },
            "agents": []
        }
        
        for agent in self.agents:
            if not agent.turn_data:
                continue
            
            first_turn = agent.turn_data[0]
            last_turn = agent.turn_data[-1]
            
            agent_summary = {
                "agent_id": agent.agent_id,
                "agent_name": agent.agent_name,
                "strategy": agent.feedback_strategy,
                "initial_score": first_turn.comprehension_score,
                "final_score": last_turn.comprehension_score,
                "score_change": last_turn.comprehension_score - first_turn.comprehension_score,
                "initial_level": first_turn.difficulty_level,
                "final_level": last_turn.difficulty_level,
                "level_changes": sum(1 for t in agent.turn_data if t.level_transition != 'same'),
                "total_turns": len(agent.turn_data)
            }
            
            summary["agents"].append(agent_summary)
        
        return summary


def main():
    """Ana simülasyon fonksiyonu"""
    
    # Konfigürasyon
    API_BASE_URL = "http://localhost:8000"  # API Gateway URL
    SESSION_ID = "biyoloji_simulasyon_session"  # Test session ID
    
    # Test soruları
    questions = [
        "Hücre nedir?",
        "DNA'nın yapısı nasıldır?",
        "Fotosentez nasıl gerçekleşir?",
        "Mitoz ve mayoz bölünme arasındaki fark nedir?",
        "Enzimler nasıl çalışır?",
        "Genetik kalıtım nasıl olur?",
        "Protein sentezi nedir?",
        "Hücre zarının görevleri nelerdir?",
        "ATP nedir ve nasıl üretilir?",
        "Kromozom nedir?",
        "RNA çeşitleri nelerdir?",
        "Hücre döngüsü nedir?",
        "Mendel yasaları nedir?",
        "Mutasyon nedir?",
        "Doğal seçilim nasıl çalışır?",
        "Ekosistem nedir?",
        "Besin zinciri nedir?",
        "Fotosentez ve solunum arasındaki ilişki nedir?",
        "Hücre organelleri nelerdir?",
        "Gen nedir ve nasıl çalışır?"
    ]
    
    # Simülasyon oluştur
    simulation = EBARSSimulation(API_BASE_URL, SESSION_ID)
    simulation.load_questions(questions)
    
    # Ajanları ekle
    # Ajan A: İstikrarlı Başarısız
    simulation.add_agent(
        agent_id="agent_a",
        agent_name="Ajan A (Zorlanan)",
        user_id="sim_agent_a",  # Test user ID
        feedback_strategy="negative",
        emoji_distribution={"❌": 0.7, "😐": 0.3}
    )
    
    # Ajan B: İstikrarlı Başarılı
    simulation.add_agent(
        agent_id="agent_b",
        agent_name="Ajan B (Hızlı Öğrenen)",
        user_id="sim_agent_b",  # Test user ID
        feedback_strategy="positive",
        emoji_distribution={"👍": 0.7, "😊": 0.3}
    )
    
    # Ajan C: Değişken Profil
    simulation.add_agent(
        agent_id="agent_c",
        agent_name="Ajan C (Dalgalı)",
        user_id="sim_agent_c",  # Test user ID
        feedback_strategy="variable",
        emoji_distribution={}  # Variable strategy kendi içinde yönetir
    )
    
    # Ajanları başlat
    simulation.initialize_agents(initial_score=50.0, initial_level='normal')
    
    # Simülasyonu çalıştır
    simulation.run_simulation(num_turns=20)
    
    # Sonuçları kaydet
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"ebars_simulation_results_{timestamp}.csv"
    simulation.save_results(output_file)
    
    # Özeti yazdır
    summary = simulation.get_summary()
    print("\n" + "="*60)
    print("SIMULATION SUMMARY")
    print("="*60)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    
    # Özeti kaydet
    summary_file = f"ebars_simulation_summary_{timestamp}.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"\n✅ Summary saved to {summary_file}")


if __name__ == "__main__":
    main()

