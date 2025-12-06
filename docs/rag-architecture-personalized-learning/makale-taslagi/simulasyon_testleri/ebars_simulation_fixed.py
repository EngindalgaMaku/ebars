#!/usr/bin/env python3
"""
EBARS Sistem Simülasyon Testi - Düzeltilmiş Versiyon
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
import os


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
    level_transition: str
    processing_time_ms: float
    timestamp: str
    interaction_id: Optional[int] = None
    feedback_sent: bool = False


class EBARSAgent:
    """EBARS sistemini test eden sentetik öğrenci ajanı"""
    
    def __init__(
        self,
        agent_id: str,
        agent_name: str,
        user_id: str,
        session_id: str,
        api_base_url: str,
        feedback_strategy: str,
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
            if turn_number <= 10:
                return random.choices(['❌', '😐'], weights=[0.8, 0.2])[0]
            else:
                return random.choices(['👍', '😊'], weights=[0.8, 0.2])[0]
        else:
            emojis = list(self.emoji_distribution.keys())
            weights = list(self.emoji_distribution.values())
            return random.choices(emojis, weights=weights)[0]
    
    def ask_question(self, question: str) -> Dict:
        """Sisteme soru sorar ve interaction_id döndürür"""
        start_time = time.time()
        
        # Hybrid RAG query yap
        response = requests.post(
            f"{self.api_base_url}/aprag/hybrid-rag/query",
            json={
                "user_id": self.user_id,
                "session_id": self.session_id,
                "query": question
            },
            timeout=60
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        if response.status_code != 200:
            raise Exception(f"Query failed: {response.status_code} - {response.text[:500]}")
        
        response_data = response.json()
        
        # Interaction ID'yi bul - önce response'da ara
        interaction_id = response_data.get("interaction_id")
        
        # Yoksa en son interaction'ı al
        if not interaction_id:
            time.sleep(1)  # DB'ye yazılması için bekle
            interaction_id = self._get_latest_interaction_id()
        
        response_data["interaction_id"] = interaction_id
        
        return {
            "response_data": response_data,
            "processing_time_ms": processing_time,
            "interaction_id": interaction_id
        }
    
    def _get_latest_interaction_id(self) -> Optional[int]:
        """En son interaction ID'sini al - birden fazla yöntem dene"""
        methods = [
            # Yöntem 1: Session'a göre
            lambda: requests.get(
                f"{self.api_base_url}/aprag/interactions/session/{self.session_id}",
                params={"user_id": self.user_id, "limit": 1},
                timeout=10
            ),
            # Yöntem 2: User'a göre
            lambda: requests.get(
                f"{self.api_base_url}/aprag/interactions",
                params={"user_id": self.user_id, "session_id": self.session_id, "limit": 1},
                timeout=10
            ),
        ]
        
        for method in methods:
            try:
                response = method()
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list) and len(data) > 0:
                        return data[0].get("interaction_id")
                    elif isinstance(data, dict):
                        if "interactions" in data and len(data["interactions"]) > 0:
                            return data["interactions"][0].get("interaction_id")
                        elif "interaction_id" in data:
                            return data.get("interaction_id")
            except:
                continue
        
        return None
    
    def send_feedback(self, interaction_id: int, emoji: str) -> bool:
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
            
            if response.status_code == 200:
                return True
            else:
                print(f"   ⚠️ Feedback returned {response.status_code}: {response.text[:200]}")
                return False
        except Exception as e:
            print(f"   ⚠️ Feedback error: {e}")
            return False
    
    def get_current_state(self) -> Dict:
        """Öğrencinin mevcut durumunu alır"""
        try:
            response = requests.get(
                f"{self.api_base_url}/aprag/ebars/state/{self.user_id}/{self.session_id}",
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 403:
                # EBARS kapalı veya yetki yok - default değerler
                return {
                    "comprehension_score": self.previous_score or 50.0,
                    "difficulty_level": self.previous_level or "normal"
                }
            else:
                raise Exception(f"State failed: {response.status_code}")
        except Exception as e:
            # Hata durumunda önceki değerleri kullan
            return {
                "comprehension_score": self.previous_score or 50.0,
                "difficulty_level": self.previous_level or "normal"
            }
    
    def initialize_score(self, initial_score: float = 50.0, initial_level: str = 'normal'):
        """Başlangıç skorunu ayarlar - başarısız olursa devam et"""
        try:
            response = requests.post(
                f"{self.api_base_url}/aprag/ebars/score/reset/{self.user_id}/{self.session_id}",
                json={"comprehension_score": initial_score, "difficulty_level": initial_level},
                timeout=10
            )
            
            if response.status_code == 200:
                self.previous_score = initial_score
                self.previous_level = initial_level
                print(f"✅ {self.agent_name}: Initialized (score={initial_score}, level={initial_level})")
            else:
                # Başarısız olursa da devam et - ilk query'de otomatik oluşur
                print(f"⚠️ {self.agent_name}: Could not initialize (will use defaults)")
        except:
            print(f"⚠️ {self.agent_name}: Initialization failed (will use defaults)")
    
    def run_turn(self, question: str) -> TurnData:
        """Bir tur çalıştırır"""
        self.turn_count += 1
        
        print(f"\n🔄 {self.agent_name} - Turn {self.turn_count}")
        print(f"   Q: {question[:60]}...")
        
        # Soruyu sor
        try:
            query_result = self.ask_question(question)
            response_data = query_result["response_data"]
            processing_time = query_result["processing_time_ms"]
            interaction_id = query_result.get("interaction_id")
            
            answer = response_data.get("answer", "")
        except Exception as e:
            print(f"   ❌ Query failed: {e}")
            # Hata durumunda boş veri ile devam et
            answer = ""
            processing_time = 0
            interaction_id = None
        
        # Emoji seç
        emoji = self.get_emoji_feedback(self.turn_count)
        
        # Feedback gönder
        feedback_sent = False
        if interaction_id:
            feedback_sent = self.send_feedback(interaction_id, emoji)
            if feedback_sent:
                print(f"   ✅ Feedback: {emoji}")
            else:
                print(f"   ⚠️ Feedback failed")
        else:
            print(f"   ⚠️ No interaction_id")
        
        # Durumu al
        time.sleep(1.5)  # Sistemin güncellemesi için bekle
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
            try:
                prev_idx = level_order.index(self.previous_level)
                curr_idx = level_order.index(current_level)
                if curr_idx > prev_idx:
                    level_transition = "up"
                elif curr_idx < prev_idx:
                    level_transition = "down"
            except:
                pass
        
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
            timestamp=datetime.now().isoformat(),
            interaction_id=interaction_id,
            feedback_sent=feedback_sent
        )
        
        self.turn_data.append(turn_data)
        
        # Durumu güncelle
        self.previous_score = current_score
        self.previous_level = current_level
        
        print(f"   📊 Score: {self.previous_score:.1f} → {current_score:.1f} ({score_delta:+.1f})")
        print(f"   📊 Level: {self.previous_level} → {current_level} ({level_transition})")
        
        return turn_data


def main():
    """Ana simülasyon fonksiyonu"""
    # Config yükle
    config_file = "simulation_config.json"
    if not os.path.exists(config_file):
        print(f"❌ Config file not found: {config_file}")
        print("   Please create it first")
        return
    
    with open(config_file, "r", encoding="utf-8") as f:
        config = json.load(f)
    
    API_BASE_URL = config.get("api_base_url", "http://localhost:8000")
    SESSION_ID = config.get("session_id")
    users_config = config.get("users", {})
    
    if not SESSION_ID:
        print("❌ session_id not found in config")
        return
    
    print(f"✅ Config loaded: Session={SESSION_ID}")
    
    # Sorular - Bilişim Teknolojileri için
    questions = [
        "Bilgisayar nedir?",
        "İşletim sistemi nedir?",
        "RAM ve ROM arasındaki fark nedir?",
        "CPU nedir ve nasıl çalışır?",
        "Ağ protokolleri nedir?",
        "Yazılım ve donanım arasındaki fark nedir?",
        "Veri tabanı nedir?",
        "Algoritma nedir?",
        "Programlama dili nedir?",
        "İnternet nasıl çalışır?",
        "Güvenlik yazılımları nelerdir?",
        "Cloud computing nedir?",
        "Veri yapıları nedir?",
        "Bilgisayar ağları nedir?",
        "Veritabanı yönetim sistemleri nedir?",
        "Yazılım geliştirme süreci nedir?",
        "Bilgisayar donanım bileşenleri nelerdir?",
        "İşletim sisteminin görevleri nelerdir?",
        "Veri güvenliği nedir?",
        "Bilgisayar ağ türleri nelerdir?"
    ]
    
    # Simülasyon oluştur
    simulation = EBARSSimulation(API_BASE_URL, SESSION_ID)
    simulation.load_questions(questions)
    
    # Ajanları ekle
    agent_a_user = users_config.get("agent_a", {}).get("user_id", "sim_agent_a")
    agent_b_user = users_config.get("agent_b", {}).get("user_id", "sim_agent_b")
    agent_c_user = users_config.get("agent_c", {}).get("user_id", "sim_agent_c")
    
    simulation.add_agent("agent_a", "Ajan A (Zorlanan)", agent_a_user, "negative", {"❌": 0.7, "😐": 0.3})
    simulation.add_agent("agent_b", "Ajan B (Hızlı Öğrenen)", agent_b_user, "positive", {"👍": 0.7, "😊": 0.3})
    simulation.add_agent("agent_c", "Ajan C (Dalgalı)", agent_c_user, "variable", {})
    
    # Başlat
    simulation.initialize_agents(50.0, 'normal')
    
    # Çalıştır
    simulation.run_simulation(20)
    
    # Kaydet
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"ebars_simulation_results_{timestamp}.csv"
    simulation.save_results(output_file)
    
    # Özet
    summary = simulation.get_summary()
    print("\n" + "="*60)
    print("SIMULATION SUMMARY")
    print("="*60)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    
    summary_file = f"ebars_simulation_summary_{timestamp}.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"\n✅ Results saved: {output_file}")
    print(f"✅ Summary saved: {summary_file}")


class EBARSSimulation:
    """EBARS sistem simülasyonu"""
    
    def __init__(self, api_base_url: str, session_id: str):
        self.api_base_url = api_base_url
        self.session_id = session_id
        self.agents: List[EBARSAgent] = []
        self.questions: List[str] = []
        
    def add_agent(self, agent_id: str, agent_name: str, user_id: str, feedback_strategy: str, emoji_distribution: Dict[str, float]):
        agent = EBARSAgent(agent_id, agent_name, user_id, self.session_id, self.api_base_url, feedback_strategy, emoji_distribution)
        self.agents.append(agent)
        return agent
    
    def load_questions(self, questions: List[str]):
        self.questions = questions
    
    def initialize_agents(self, initial_score: float = 50.0, initial_level: str = 'normal'):
        print("\n📋 Initializing agents...")
        for agent in self.agents:
            agent.initialize_score(initial_score, initial_level)
        print("✅ All agents initialized\n")
    
    def run_simulation(self, num_turns: int = 20):
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
            
            for agent in self.agents:
                try:
                    agent.run_turn(question)
                    time.sleep(1.5)
                except Exception as e:
                    print(f"❌ Error in {agent.agent_name}: {e}")
                    continue
            
            if turn < num_turns:
                print(f"\n⏳ Waiting 3 seconds...")
                time.sleep(3)
        
        print(f"\n✅ Simulation completed!")
    
    def save_results(self, output_file: str):
        print(f"\n💾 Saving results to {output_file}...")
        
        all_turns = []
        for agent in self.agents:
            all_turns.extend([asdict(turn) for turn in agent.turn_data])
        
        if not all_turns:
            print("⚠️ No data to save")
            return
        
        fieldnames = [
            'agent_id', 'turn_number', 'question', 'answer', 'answer_length',
            'emoji_feedback', 'comprehension_score', 'difficulty_level',
            'score_delta', 'level_transition', 'processing_time_ms', 'timestamp',
            'interaction_id', 'feedback_sent'
        ]
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_turns)
        
        print(f"✅ Saved {len(all_turns)} turn records")
    
    def get_summary(self) -> Dict:
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
                "total_turns": len(agent.turn_data),
                "feedback_sent_count": sum(1 for t in agent.turn_data if t.feedback_sent)
            }
            
            summary["agents"].append(agent_summary)
        
        return summary


if __name__ == "__main__":
    main()

