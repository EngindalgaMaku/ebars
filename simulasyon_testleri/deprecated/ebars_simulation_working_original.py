#!/usr/bin/env python3
"""
EBARS Simülasyon Testi - Çalışan Versiyon
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
    def __init__(self, agent_id, agent_name, user_id, session_id, api_base_url, feedback_strategy, emoji_distribution):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.user_id = user_id
        self.session_id = session_id
        self.api_base_url = api_base_url
        self.feedback_strategy = feedback_strategy
        self.emoji_distribution = emoji_distribution
        self.turn_data = []
        self.previous_score = None
        self.previous_level = None
        self.turn_count = 0
        
    def get_emoji_feedback(self, turn_number):
        if self.feedback_strategy == 'variable':
            return random.choices(['❌', '😐'], weights=[0.8, 0.2])[0] if turn_number <= 10 else random.choices(['👍', '😊'], weights=[0.8, 0.2])[0]
        emojis = list(self.emoji_distribution.keys())
        weights = list(self.emoji_distribution.values())
        return random.choices(emojis, weights=weights)[0]
    
    def ask_question(self, question):
        start_time = time.time()
        response = requests.post(
            f"{self.api_base_url}/aprag/hybrid-rag/query",
            json={"user_id": self.user_id, "session_id": self.session_id, "query": question},
            timeout=60
        )
        processing_time = (time.time() - start_time) * 1000
        if response.status_code != 200:
            raise Exception(f"Query failed: {response.status_code} - {response.text[:200]}")
        return {"response_data": response.json(), "processing_time_ms": processing_time}
    
    def get_latest_interaction_id(self):
        """En son interaction ID'sini al - 3 saniye bekle ve dene"""
        time.sleep(3)  # DB'ye yazılması için yeterli bekleme
        for attempt in range(3):
            try:
                response = requests.get(
                    f"{self.api_base_url}/aprag/interactions",
                    params={"user_id": self.user_id, "session_id": self.session_id, "limit": 5},
                    timeout=10
                )
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list) and len(data) > 0:
                        # En yeni interaction'ı al (ilk sırada olmalı)
                        return data[0].get("interaction_id")
                    elif isinstance(data, dict):
                        if "interactions" in data and len(data["interactions"]) > 0:
                            return data["interactions"][0].get("interaction_id")
                time.sleep(1)  # Tekrar dene
            except:
                time.sleep(1)
        return None
    
    def send_feedback(self, interaction_id, emoji):
        try:
            response = requests.post(
                f"{self.api_base_url}/aprag/ebars/feedback",
                json={"user_id": self.user_id, "session_id": self.session_id, "emoji": emoji, "interaction_id": interaction_id},
                timeout=30
            )
            return response.status_code == 200
        except:
            return False
    
    def get_current_state(self):
        try:
            response = requests.get(
                f"{self.api_base_url}/aprag/ebars/state/{self.user_id}/{self.session_id}",
                timeout=30
            )
            if response.status_code == 200:
                return response.json()
            return {"comprehension_score": self.previous_score or 50.0, "difficulty_level": self.previous_level or "normal"}
        except:
            return {"comprehension_score": self.previous_score or 50.0, "difficulty_level": self.previous_level or "normal"}
    
    def run_turn(self, question):
        self.turn_count += 1
        print(f"\n🔄 {self.agent_name} - Turn {self.turn_count}")
        print(f"   Q: {question[:60]}...")
        
        try:
            result = self.ask_question(question)
            answer = result["response_data"].get("answer", "")
            processing_time = result["processing_time_ms"]
        except Exception as e:
            print(f"   ❌ Query failed: {e}")
            answer, processing_time = "", 0
        
        # Interaction ID'yi al
        interaction_id = self.get_latest_interaction_id()
        
        # Feedback gönder
        emoji = self.get_emoji_feedback(self.turn_count)
        feedback_sent = False
        if interaction_id:
            feedback_sent = self.send_feedback(interaction_id, emoji)
            print(f"   {'✅' if feedback_sent else '⚠️'} Feedback: {emoji} (interaction_id: {interaction_id})")
        else:
            print(f"   ⚠️ No interaction_id found")
        
        # Durumu al
        time.sleep(2)
        state = self.get_current_state()
        current_score = state.get("comprehension_score", self.previous_score or 50.0)
        current_level = state.get("difficulty_level", self.previous_level or "normal")
        score_delta = (current_score - self.previous_score) if self.previous_score else 0.0
        
        level_transition = "same"
        if self.previous_level and self.previous_level != current_level:
            levels = ['very_struggling', 'struggling', 'normal', 'good', 'excellent']
            try:
                if levels.index(current_level) > levels.index(self.previous_level):
                    level_transition = "up"
                elif levels.index(current_level) < levels.index(self.previous_level):
                    level_transition = "down"
            except:
                pass
        
        turn_data = TurnData(
            self.agent_id, self.turn_count, question, answer, len(answer), emoji,
            current_score, current_level, score_delta, level_transition,
            processing_time, datetime.now().isoformat(), interaction_id, feedback_sent
        )
        self.turn_data.append(turn_data)
        self.previous_score = current_score
        self.previous_level = current_level
        
        print(f"   📊 Score: {self.previous_score:.1f} → {current_score:.1f} ({score_delta:+.1f})")
        print(f"   📊 Level: {self.previous_level} → {current_level} ({level_transition})")
        return turn_data

class EBARSSimulation:
    def __init__(self, api_base_url, session_id):
        self.api_base_url = api_base_url
        self.session_id = session_id
        self.agents = []
        self.questions = []
    
    def add_agent(self, agent_id, agent_name, user_id, feedback_strategy, emoji_distribution):
        self.agents.append(EBARSAgent(agent_id, agent_name, user_id, self.session_id, self.api_base_url, feedback_strategy, emoji_distribution))
    
    def load_questions(self, questions):
        self.questions = questions
    
    def run_simulation(self, num_turns=20):
        print(f"\n🚀 Starting: {num_turns} turns, {len(self.agents)} agents\n")
        for turn in range(1, num_turns + 1):
            question = self.questions[turn - 1]
            print(f"\n{'='*60}\nTURN {turn}/{num_turns}\n{'='*60}")
            for agent in self.agents:
                try:
                    agent.run_turn(question)
                    time.sleep(2)
                except Exception as e:
                    print(f"❌ Error: {e}")
            if turn < num_turns:
                time.sleep(4)
        print("\n✅ Simulation completed!")
    
    def save_results(self, output_file):
        all_turns = []
        for agent in self.agents:
            all_turns.extend([asdict(t) for t in agent.turn_data])
        if all_turns:
            with open(output_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=['agent_id', 'turn_number', 'question', 'answer', 'answer_length', 'emoji_feedback', 'comprehension_score', 'difficulty_level', 'score_delta', 'level_transition', 'processing_time_ms', 'timestamp', 'interaction_id', 'feedback_sent'])
                writer.writeheader()
                writer.writerows(all_turns)
            print(f"✅ Saved {len(all_turns)} records")
    
    def get_summary(self):
        summary = {"simulation_info": {"session_id": self.session_id, "total_turns": len(self.questions), "num_agents": len(self.agents)}, "agents": []}
        for agent in self.agents:
            if agent.turn_data:
                first, last = agent.turn_data[0], agent.turn_data[-1]
                summary["agents"].append({
                    "agent_id": agent.agent_id, "agent_name": agent.agent_name, "strategy": agent.feedback_strategy,
                    "initial_score": first.comprehension_score, "final_score": last.comprehension_score,
                    "score_change": last.comprehension_score - first.comprehension_score,
                    "initial_level": first.difficulty_level, "final_level": last.difficulty_level,
                    "level_changes": sum(1 for t in agent.turn_data if t.level_transition != 'same'),
                    "total_turns": len(agent.turn_data), "feedback_sent_count": sum(1 for t in agent.turn_data if t.feedback_sent)
                })
        return summary

def main():
    with open("simulation_config.json", "r") as f:
        config = json.load(f)
    API_BASE_URL = config.get("api_base_url", "http://localhost:8000")
    SESSION_ID = config.get("session_id")
    users = config.get("users", {})
    
    questions = [
        "Bilgisayar nedir?", "İşletim sistemi nedir?", "RAM ve ROM arasındaki fark nedir?",
        "CPU nedir ve nasıl çalışır?", "Ağ protokolleri nedir?", "Yazılım ve donanım arasındaki fark nedir?",
        "Veri tabanı nedir?", "Algoritma nedir?", "Programlama dili nedir?", "İnternet nasıl çalışır?",
        "Güvenlik yazılımları nelerdir?", "Cloud computing nedir?", "Veri yapıları nedir?",
        "Bilgisayar ağları nedir?", "Veritabanı yönetim sistemleri nedir?", "Yazılım geliştirme süreci nedir?",
        "Bilgisayar donanım bileşenleri nelerdir?", "İşletim sisteminin görevleri nelerdir?",
        "Veri güvenliği nedir?", "Bilgisayar ağ türleri nelerdir?"
    ]
    
    sim = EBARSSimulation(API_BASE_URL, SESSION_ID)
    sim.load_questions(questions)
    sim.add_agent("agent_a", "Ajan A (Zorlanan)", users.get("agent_a", {}).get("user_id", "sim_agent_a"), "negative", {"❌": 0.7, "😐": 0.3})
    sim.add_agent("agent_b", "Ajan B (Hızlı Öğrenen)", users.get("agent_b", {}).get("user_id", "sim_agent_b"), "positive", {"👍": 0.7, "😊": 0.3})
    sim.add_agent("agent_c", "Ajan C (Dalgalı)", users.get("agent_c", {}).get("user_id", "sim_agent_c"), "variable", {})
    
    sim.run_simulation(20)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    sim.save_results(f"ebars_simulation_results_{timestamp}.csv")
    summary = sim.get_summary()
    with open(f"ebars_simulation_summary_{timestamp}.json", 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(json.dumps(summary, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()

