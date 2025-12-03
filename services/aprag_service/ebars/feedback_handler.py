"""
Feedback Handler
Handles emoji feedback and triggers adaptive response updates
"""

import logging
from typing import Optional, Dict, Any
from database.database import DatabaseManager
from .score_calculator import ComprehensionScoreCalculator
from .prompt_adapter import PromptAdapter

logger = logging.getLogger(__name__)


class FeedbackHandler:
    """Handle emoji feedback and manage adaptive responses"""
    
    def __init__(self, db: DatabaseManager):
        self.db = db
        self.score_calculator = ComprehensionScoreCalculator(db)
        self.prompt_adapter = PromptAdapter(db)
    
    def process_feedback(
        self,
        user_id: str,
        session_id: str,
        emoji: str,
        interaction_id: Optional[int] = None,
        query_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process emoji feedback and update comprehension score.
        
        Args:
            user_id: User ID
            session_id: Session ID
            emoji: Emoji feedback ('👍', '😊', '😐', '❌')
            interaction_id: Optional interaction ID
            query_text: Optional query text for history
            
        Returns:
            Dict with updated state:
            {
                'success': bool,
                'previous_score': float,
                'new_score': float,
                'previous_difficulty': str,
                'new_difficulty': str,
                'difficulty_changed': bool,
                'adjustment_type': str,
                'prompt_parameters': dict
            }
        """
        try:
            # Validate emoji
            valid_emojis = ['👍', '😊', '😐', '❌']
            if emoji not in valid_emojis:
                logger.warning(f"Invalid emoji feedback: {emoji}")
                return {
                    'success': False,
                    'error': f'Invalid emoji. Must be one of: {valid_emojis}'
                }
            
            # Update comprehension score
            score_update = self.score_calculator.update_score(
                user_id=user_id,
                session_id=session_id,
                emoji=emoji,
                interaction_id=interaction_id
            )
            
            # Get updated prompt parameters
            prompt_params = self.prompt_adapter.get_prompt_parameters(
                user_id=user_id,
                session_id=session_id,
                difficulty_level=score_update['new_difficulty']
            )
            
            # Update interaction record if interaction_id provided
            if interaction_id:
                self._update_interaction_ebars_data(
                    interaction_id=interaction_id,
                    emoji=emoji,
                    score_update=score_update
                )
            
            logger.info(
                f"✅ Processed feedback: {user_id}/{session_id} "
                f"emoji={emoji} score={score_update['previous_score']:.1f}→{score_update['new_score']:.1f} "
                f"difficulty={score_update['previous_difficulty']}→{score_update['new_difficulty']}"
            )
            
            return {
                'success': True,
                'previous_score': score_update['previous_score'],
                'new_score': score_update['new_score'],
                'score_delta': score_update['score_delta'],
                'previous_difficulty': score_update['previous_difficulty'],
                'new_difficulty': score_update['new_difficulty'],
                'difficulty_changed': score_update['difficulty_changed'],
                'adjustment_type': score_update['adjustment_type'],
                'prompt_parameters': prompt_params,
                'consecutive_positive': score_update.get('consecutive_positive', 0),
                'consecutive_negative': score_update.get('consecutive_negative', 0),
            }
            
        except Exception as e:
            logger.error(f"Error processing feedback: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _update_interaction_ebars_data(
        self,
        interaction_id: int,
        emoji: str,
        score_update: Dict[str, Any]
    ):
        """Update interaction record with EBARS data"""
        try:
            with self.db.get_connection() as conn:
                # Check if emoji_feedback column exists and update it
                # Also update any EBARS-related metadata
                conn.execute("""
                    UPDATE student_interactions
                    SET emoji_feedback = ?,
                        feedback_score = ?
                    WHERE interaction_id = ?
                """, (
                    emoji,
                    score_update['new_score'] / 100.0,  # Normalize to 0-1
                    interaction_id
                ))
                conn.commit()
        except Exception as e:
            logger.warning(f"Could not update interaction EBARS data: {e}")
            # Non-critical, continue
    
    def get_current_state(
        self,
        user_id: str,
        session_id: str
    ) -> Dict[str, Any]:
        """
        Get current EBARS state for a student.
        
        Returns:
            Dict with current state:
            {
                'comprehension_score': float,
                'difficulty_level': str,
                'prompt_parameters': dict,
                'statistics': dict
            }
        """
        try:
            # Get current score
            score = self.score_calculator.get_score(user_id, session_id)
            difficulty = self.score_calculator.get_difficulty_level(user_id, session_id)
            
            # Get prompt parameters
            prompt_params = self.prompt_adapter.get_prompt_parameters(
                user_id=user_id,
                session_id=session_id,
                difficulty_level=difficulty
            )
            
            # Get statistics
            with self.db.get_connection() as conn:
                cursor = conn.execute("""
                    SELECT total_feedback_count, positive_feedback_count,
                           negative_feedback_count, consecutive_positive_count,
                           consecutive_negative_count, last_feedback_at
                    FROM student_comprehension_scores
                    WHERE user_id = ? AND session_id = ?
                """, (user_id, session_id))
                
                row = cursor.fetchone()
                
                if row:
                    stats = {
                        'total_feedback_count': row['total_feedback_count'] or 0,
                        'positive_feedback_count': row['positive_feedback_count'] or 0,
                        'negative_feedback_count': row['negative_feedback_count'] or 0,
                        'consecutive_positive': row['consecutive_positive_count'] or 0,
                        'consecutive_negative': row['consecutive_negative_count'] or 0,
                        'last_feedback_at': row['last_feedback_at'],
                    }
                else:
                    stats = {
                        'total_feedback_count': 0,
                        'positive_feedback_count': 0,
                        'negative_feedback_count': 0,
                        'consecutive_positive': 0,
                        'consecutive_negative': 0,
                        'last_feedback_at': None,
                    }
            
            # Generate sample prompt for display
            sample_prompt = self.generate_adaptive_prompt(
                user_id=user_id,
                session_id=session_id,
                base_prompt="Öğrencinin sorusunu yanıtla."
            )
            
            return {
                'comprehension_score': score,
                'difficulty_level': difficulty,
                'prompt_parameters': prompt_params,
                'statistics': stats,
                'adaptive_prompt': sample_prompt,  # Add generated prompt for display
            }
            
        except Exception as e:
            logger.error(f"Error getting current state: {e}")
            return {
                'comprehension_score': 50.0,
                'difficulty_level': 'normal',
                'prompt_parameters': {},
                'statistics': {},
            }
    
    def generate_adaptive_prompt(
        self,
        user_id: str,
        session_id: str,
        base_prompt: Optional[str] = None,
        query: Optional[str] = None,
        original_response: Optional[str] = None,
        difficulty_override: Optional[str] = None
    ) -> str:
        """
        Generate adaptive prompt for LLM based on current comprehension score.
        
        Args:
            user_id: User ID
            session_id: Session ID
            base_prompt: Optional base prompt
            query: Optional query text
            original_response: Optional original response to adapt
            difficulty_override: Optional difficulty level override (for preview)
            
        Returns:
            Full adaptive prompt string
        """
        try:
            # Get current score and difficulty directly (avoid recursion)
            score = self.score_calculator.get_score(user_id, session_id)
            difficulty = difficulty_override or self.score_calculator.get_difficulty_level(user_id, session_id)
            params = self.prompt_adapter.get_prompt_parameters(
                user_id=user_id,
                session_id=session_id,
                difficulty_level=difficulty
            )
            
            # If difficulty is overridden (preview mode), use a representative score for that level
            if difficulty_override:
                # Map difficulty to representative score for preview
                difficulty_to_score = {
                    'very_struggling': 25.0,
                    'struggling': 38.0,
                    'normal': 58.0,
                    'good': 75.0,
                    'excellent': 90.0
                }
                preview_score = difficulty_to_score.get(difficulty, score)
                logger.info(f"🔍 Preview mode: Overriding difficulty to {difficulty} (score: {preview_score:.1f})")
                
                # Preview mode için özel, daha güçlü prompt
                preview_warning = f"""
⚠️ ÖNEMLİ - ÖNİZLEME MODU:
Bu bir önizleme modudur. Cevabı MUTLAKA {difficulty} seviyesine göre adapte et.
Orijinal cevabı aynen kopyalama! Seviyeye göre değiştir:
- Daha basit seviye için: Daha açıklayıcı, daha detaylı, daha fazla örnek
- Daha ileri seviye için: Daha teknik, daha kısa, daha derinlemesine
"""
            else:
                preview_score = score
                preview_warning = ""
            
            # Build adaptive prompt
            if original_response:
                # Full adaptive prompt with original response
                prompt = f"""Sen bir eğitim asistanısın. Aşağıdaki cevabı öğrencinin anlama seviyesine göre kişiselleştir.

🎯 ÖĞRENCİ ALGILAMA PUANI: {preview_score:.1f}/100
📊 ZORLUK SEVİYESİ: {difficulty}
{preview_warning}

{self.prompt_adapter._build_instructions(params)}

📝 ORİJİNAL SORU:
{query or 'N/A'}

📄 ORİJİNAL CEVAP:
{original_response}

⚠️ ÇOK ÖNEMLİ - DOĞRULUK KURALLARI:
- SADECE orijinal cevapta ve ders materyallerinde bulunan bilgileri kullan
- Orijinal cevapta olmayan yeni bilgiler EKLEME
- Orijinal cevabın içeriğini koru, sadece sunumunu değiştir
- Emin olmadığın bilgileri uydurma veya tahmin etme

🚨 KRİTİK TALİMAT - MUTLAKA UYGULA:
- Orijinal cevabı AYNEN KOPYALAMA!
- Cevabı {difficulty} seviyesine göre MUTLAKA DEĞİŞTİR
- Daha basit seviye için: Daha uzun, daha açıklayıcı, daha fazla örnek, daha basit kelimeler
- Daha ileri seviye için: Daha kısa, daha teknik, daha derinlemesine, daha az örnek
- Cümle yapısını, kelime seçimini, detay seviyesini DEĞİŞTİR
- Sadece içeriği koru, ama sunumunu TAMAMEN DEĞİŞTİR

✅ ÖNEMLİ: Kişiselleştirilmiş cevabı SADECE TÜRKÇE olarak ver. Orijinal cevabın içeriğini koru, ancak sunumunu, detay seviyesini ve zorluk seviyesini öğrenci algılama puanına göre ayarla.

🚨 SON UYARI - MUTLAKA UYGULA:
- Orijinal cevabı AYNEN KOPYALAMA!
- Cevabı {difficulty} seviyesine göre MUTLAKA DEĞİŞTİR!
- Eğer aynı cevabı verirsen, bu görev başarısız olur!
- Cümle yapısını, kelime seçimini, detay seviyesini MUTLAKA DEĞİŞTİR!
"""
            else:
                # Simple adaptive prompt
                prompt = self.prompt_adapter.generate_adaptive_prompt(
                    user_id=user_id,
                    session_id=session_id,
                    base_prompt=base_prompt
                )
            
            return prompt
            
        except Exception as e:
            logger.error(f"Error generating adaptive prompt: {e}")
            return base_prompt or ""
    
    def generate_complete_prompt(
        self,
        user_id: str,
        session_id: str,
        query: str,
        context: str
    ) -> str:
        """
        Generate complete prompt with student question + EBARS personalization + RAG context.
        
        This is the full prompt that would be sent to LLM:
        1. Student's question
        2. RAG context/chunks
        3. EBARS personalized instructions
        
        Args:
            user_id: User ID
            session_id: Session ID
            query: Student's question
            context: RAG context/chunks
            
        Returns:
            Complete prompt string ready to send to LLM
        """
        try:
            # Get current score and difficulty directly (avoid recursion)
            score = self.score_calculator.get_score(user_id, session_id)
            difficulty = self.score_calculator.get_difficulty_level(user_id, session_id)
            params = self.prompt_adapter.get_prompt_parameters(
                user_id=user_id,
                session_id=session_id,
                difficulty_level=difficulty
            )
            
            # Get EBARS personalized instructions
            ebars_instructions = self.prompt_adapter._build_instructions(params)
            
            # Build complete prompt (similar to hybrid_rag_query.py format)
            complete_prompt = f"""Sen bir eğitim asistanısın. Aşağıdaki ders materyallerini kullanarak ÖĞRENCİ SORUSUNU yanıtla.

📚 DERS MATERYALLERİ VE BİLGİ TABANI:
{context}

👨‍🎓 ÖĞRENCİ SORUSU:
{query}

{ebars_instructions}

YANIT KURALLARI (ÇOK ÖNEMLİ):
1. Yanıt TAMAMEN TÜRKÇE olmalı.
2. Sadece sorulan soruya odaklan; konu dışına çıkma, gereksiz alt başlıklar açma.
3. Bilgiyi mutlaka yukarıdaki ders materyali ve bilgi tabanından al; emin olmadığın şeyleri yazma, uydurma.
4. Önemli kavramları gerektiğinde **kalın** yazarak vurgulayabilirsin ama liste/rapor formatına dönüştürme.

✍️ YANIT (sadece cevabı yaz, başlık veya madde listesi ekleme):"""
            
            return complete_prompt
            
        except Exception as e:
            logger.error(f"Error generating complete prompt: {e}")
            # Fallback to basic prompt
            return f"""Sen bir eğitim asistanısın. Aşağıdaki ders materyallerini kullanarak ÖĞRENCİ SORUSUNU yanıtla.

📚 DERS MATERYALLERİ:
{context}

👨‍🎓 ÖĞRENCİ SORUSU:
{query}

✍️ YANIT:"""

