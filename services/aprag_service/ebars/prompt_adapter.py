"""
Prompt Adapter
Generates adaptive prompts based on comprehension score and difficulty level
"""

import logging
import json
from typing import Dict, Any, Optional
from database.database import DatabaseManager

logger = logging.getLogger(__name__)

# Prompt parameters for each difficulty level
DIFFICULTY_PROMPT_PARAMS = {
    'very_struggling': {
        'difficulty': 'very_easy',
        'detail_level': 'very_detailed',
        'example_count': 'many',  # 3-5 örnek
        'explanation_style': 'step_by_step',
        'technical_terms': 'explained',  # Her terimi açıkla
        'sentence_length': 'short',  # 10-15 kelime
        'concept_density': 'low',  # Az kavram
        'step_by_step': True,
        'visual_aids': True,
        'analogy_usage': True,
        'chunking': True,  # Bilgiyi parçalara böl
        'progressive_disclosure': True,  # Kademeli açıklama
        'max_concepts_per_response': 2,  # Her cevapta max 2 kavram
    },
    'struggling': {
        'difficulty': 'easy',
        'detail_level': 'detailed',
        'example_count': 'moderate',  # 2-3 örnek
        'explanation_style': 'clear',
        'technical_terms': 'simplified',  # Basitleştirilmiş terimler
        'sentence_length': 'medium',  # 15-20 kelime
        'concept_density': 'medium_low',
        'step_by_step': True,
        'visual_aids': False,
        'analogy_usage': True,
    },
    'normal': {
        'difficulty': 'moderate',
        'detail_level': 'balanced',
        'example_count': 'moderate',  # 1-2 örnek
        'explanation_style': 'balanced',
        'technical_terms': 'normal',  # Normal kullanım
        'sentence_length': 'medium',  # 15-20 kelime
        'concept_density': 'medium',
        'step_by_step': False,
        'visual_aids': False,
        'analogy_usage': False,
    },
    'good': {
        'difficulty': 'challenging',
        'detail_level': 'concise',
        'example_count': 'moderate_advanced',  # "minimal" yerine - 1-2 ileri seviye örnek
        'explanation_style': 'direct_with_depth',  # "direct" yerine - direkt ama derinlemesine
        'technical_terms': 'normal',
        'sentence_length': 'medium_long',  # 20-25 kelime
        'concept_density': 'medium_high',
        'step_by_step': False,
        'visual_aids': False,
        'analogy_usage': False,
        'concept_relationships': True,  # Kavramlar arası ilişkileri göster
        'multiple_perspectives': True,  # Farklı perspektifler sun
    },
    'excellent': {
        'difficulty': 'advanced',
        'detail_level': 'concise',  # "brief" yerine "concise" - daha dengeli
        'example_count': 'strategic',  # "none" yerine "strategic" - ileri seviye örnekler
        'explanation_style': 'technical_with_context',  # "concise" yerine - teknik ama bağlamlı
        'technical_terms': 'technical',  # Teknik terimler kullan
        'sentence_length': 'medium_long',  # "long" yerine - 20-25 kelime (daha okunabilir)
        'concept_density': 'high',
        'step_by_step': False,
        'visual_aids': False,
        'analogy_usage': False,
    },
}


class PromptAdapter:
    """Generate adaptive prompts based on comprehension score"""
    
    def __init__(self, db: DatabaseManager):
        self.db = db
    
    def get_prompt_parameters(
        self,
        user_id: str,
        session_id: str,
        difficulty_level: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get prompt parameters for current difficulty level.
        
        Args:
            user_id: User ID
            session_id: Session ID
            difficulty_level: Optional difficulty level (if None, gets from score)
            
        Returns:
            Dict with prompt parameters
        """
        try:
            if not difficulty_level:
                # Get from score calculator
                from .score_calculator import ComprehensionScoreCalculator
                calculator = ComprehensionScoreCalculator(self.db)
                difficulty_level = calculator.get_difficulty_level(user_id, session_id)
            
            # Get parameters for this difficulty level
            params = DIFFICULTY_PROMPT_PARAMS.get(
                difficulty_level,
                DIFFICULTY_PROMPT_PARAMS['normal']  # Default fallback
            )
            
            # Add difficulty level to params
            params['difficulty_level'] = difficulty_level
            
            return params.copy()
            
        except Exception as e:
            logger.error(f"Error getting prompt parameters: {e}")
            return DIFFICULTY_PROMPT_PARAMS['normal'].copy()
    
    def generate_adaptive_prompt(
        self,
        user_id: str,
        session_id: str,
        base_prompt: Optional[str] = None
    ) -> str:
        """
        Generate adaptive prompt based on student's comprehension score.
        
        Args:
            user_id: User ID
            session_id: Session ID
            base_prompt: Optional base prompt to enhance
            
        Returns:
            Full adaptive prompt string
        """
        try:
            # Get prompt parameters
            params = self.get_prompt_parameters(user_id, session_id)
            
            # Build prompt instructions
            instructions = self._build_instructions(params)
            
            # Combine with base prompt if provided
            if base_prompt:
                full_prompt = f"{base_prompt}\n\n{instructions}"
            else:
                full_prompt = instructions
            
            return full_prompt
            
        except Exception as e:
            logger.error(f"Error generating adaptive prompt: {e}")
            return base_prompt or ""
    
    def _build_instructions(self, params: Dict[str, Any]) -> str:
        """Build instruction string from parameters"""
        difficulty = params.get('difficulty_level', 'normal')
        
        # Get difficulty-specific instructions
        difficulty_instructions = self._get_difficulty_instructions(difficulty)
        
        # Get detail instructions
        detail_instructions = self._get_detail_instructions(params.get('detail_level', 'balanced'))
        
        # Get example instructions
        example_instructions = self._get_example_instructions(params.get('example_count', 'moderate'))
        
        # Combine all instructions
        # IMPORTANT: These instructions are for the MODEL, NOT for the student response
        instructions = f"""
{difficulty_instructions}

{detail_instructions}

{example_instructions}

⚠️ ÖNEMLİ: Yukarıdaki talimatları MUTLAKA uygula. Öğrencinin anlama seviyesine göre cevabı adapte et.

🚫 ÇOK ÖNEMLİ: Bu talimatlar SENİN İÇİN (model). CEVABINA bu talimatları, başlıkları veya açıklamaları EKLEME!
- "ZORLUK SEVİYESİ", "EĞİTİM AÇIKLAMASI", "ÖRNEKLER", "GÖRSEL YARDIMLAR", "DESTEKLEYİCİ DİL" gibi başlıklar EKLEME
- Sadece cevabı ver, talimatları veya açıklamaları cevaba ekleme
"""
        
        return instructions.strip()
    
    def _get_difficulty_instructions(self, difficulty: str) -> str:
        """Get instructions for specific difficulty level"""
        instructions = {
            'very_struggling': """
⚠️ MUTLAKA UYGULA (SENİN İÇİN - CEVABA EKLEME):
1. **Basit Dil:**
   - Her kelimeyi açıkla
   - Teknik terimlerden kaçın veya her birini detaylı açıkla
   - Günlük hayattan örnekler kullan

2. **Kısa Cümleler:**
   - Her cümle 10-15 kelime
   - Basit cümle yapıları
   - Karmaşık fikirleri parçalara böl

3. **Adım Adım Açıklama (Chunking):**
   - Her adımı tek tek göster
   - Her adımı açıkla
   - Öğrencinin takip edebileceği şekilde ilerle
   - ⚠️ ÖNEMLİ: Her cevapta maksimum 2 kavram işle (cognitive load kontrolü)
   - Bilgiyi küçük parçalara böl (chunking)
   - Kademeli açıklama yap (progressive disclosure)

4. **Çok Örnek (Ama Kademeli):**
   - 3-5 somut örnek ver
   - Her örneği detaylı açıkla
   - Günlük hayattan örnekler kullan
   - Örnekleri kademeli sun (hepsini aynı anda değil)

5. **Benzetmeler ve Somut Örnekler:**
   - Benzetmeler kullan (görsel diyagram değil, sadece benzetme)
   - Somut, elle tutulur örnekler ver
   - Günlük hayattan örnekler kullan

6. **Destekleyici Ton:**
   - Cesaret verici bir ton kullan
   - Sabırlı ve anlayışlı ol
   - Ama "destekleyici dil" veya "eğitim açıklaması" gibi başlıklar EKLEME
""",
            'struggling': """
⚠️ MUTLAKA UYGULA (SENİN İÇİN - CEVABA EKLEME) - ÖĞRENCİ HENÜZ ÖĞRENİYOR:
1. **ÇOK Açıklayıcı Dil:**
   - Teknik terimleri MUTLAKA basitleştir
   - Her terimi MUTLAKA açıkla
   - Günlük hayattan somut örnekler kullan
   - "Bilgisayar" yerine "evdeki bilgisayar", "yazıcı" yerine "evdeki yazıcı" gibi

2. **Kısa-Orta Cümleler:**
   - Her cümle 12-18 kelime (15-20 değil, daha kısa!)
   - Basit cümle yapıları
   - Karmaşık fikirleri MUTLAKA basitleştir
   - Uzun cümleleri böl, parçalara ayır

3. **Çok Net Açıklama:**
   - Kavramları ADIM ADIM açıkla
   - Önemli noktaları vurgula
   - Her adımı tek tek göster
   - "Önce şunu yap, sonra bunu yap" gibi

4. **Çok Örnek (2-3 değil, 3-4):**
   - 3-4 somut örnek MUTLAKA ver
   - Her örneği detaylı açıkla
   - Günlük hayattan örnekler kullan
   - "Örneğin evdeki internet ağı gibi..." gibi

5. **Benzetmeler ve Somut Örnekler:**
   - Benzetmeler MUTLAKA kullan
   - Bilinen kavramlarla ilişkilendir
   - "İnternet ağı, evdeki elektrik kabloları gibidir" gibi
   - Somut, elle tutulur örnekler ver

6. **Destekleyici Ton:**
   - Cesaret verici bir ton kullan
   - Ama "destekleyici dil", "eğitim açıklaması" veya "görsel yardım" gibi başlıklar EKLEME
   - Sadece cevabı ver, meta bilgi ekleme
""",
            'normal': """
⚠️ MUTLAKA UYGULA (SENİN İÇİN - CEVABA EKLEME):
1. **Dengeli Dil:**
   - Teknik terimleri kullan ama açıkla
   - Normal akademik dil
   - Gerektiğinde örnek ver

2. **Orta Uzunlukta Cümleler:**
   - Her cümle 15-20 kelime
   - Dengeli cümle yapıları
   - Karmaşık fikirleri açıkla

3. **Dengeli Açıklama:**
   - Kavramları dengeli açıkla
   - Önemli noktaları vurgula
   - Gereksiz detaylardan kaçın

4. **Orta Örnek:**
   - 1-2 örnek yeterli
   - Örnekleri kısa tut
   - Gerektiğinde örnek ver
""",
            'good': """
⚠️ MUTLAKA UYGULA (SENİN İÇİN - CEVABA EKLEME):
1. **Teknik Dil:**
   - Teknik terimleri doğrudan kullan
   - Gerekirse kısa bağlam ver
   - Terimlerin doğru kullanımına odaklan

2. **Uzun ve Karmaşık Cümleler:**
   - Her cümle 20-25 kelime
   - Karmaşık cümle yapıları kullan
   - Bağlaçlar ve bağlayıcılar ile derinleştir

3. **Derinlemesine İçerik:**
   - Kavramlar arası ilişkileri göster
   - İleri seviye detaylar ekle
   - Farklı perspektifler sun
   - Disiplinler arası bağlantılar kur

4. **İleri Seviye Örnekler:**
   - 1-2 ileri seviye örnek ver
   - Örnekler karmaşık ve derinlemesine olsun
   - Örneklerle kavramsal derinliği artır
   - Basit örneklerden kaçın
""",
            'excellent': """
⚠️ MUTLAKA UYGULA (SENİN İÇİN - CEVABA EKLEME):
1. **İleri Seviye Teknik Dil:**
   - Tüm teknik terimleri kullan
   - Terimlerin doğru ve profesyonel kullanımı
   - Gerekirse kısa bağlam ver (ama uzun açıklama yapma)

2. **Uzun ve Karmaşık Cümleler (Ama Okunabilir):**
   - Her cümle 20-25 kelime (25+ yerine - daha okunabilir)
   - Karmaşık cümle yapıları kullan
   - Derinlemesine analiz ve sentez
   - Okunabilirliği koru

3. **Yüksek Kavram Yoğunluğu:**
   - Birden fazla kavramı birlikte işle
   - Kavramlar arası karmaşık ilişkiler
   - Disiplinler arası entegrasyon

4. **Stratejik Örnekler:**
   - İleri seviye, karmaşık örnekler ver (basit örnekler değil)
   - Örnekler kavramsal derinliği artırsın
   - Teorik ve pratik entegrasyonu göster
   - Örneklerle derinleştir, basitleştirme
""",
        }
        
        return instructions.get(difficulty, instructions['normal'])
    
    def _get_detail_instructions(self, detail_level: str) -> str:
        """Get detail level instructions"""
        instructions = {
            'very_detailed': """
📋 DETAY SEVİYESİ: ÇOK DETAYLI
- Her kavramı en ince ayrıntısına kadar açıkla
- Her adımı detaylandır
- Her terimi açıkla
- Her örneği genişlet
- Hiçbir detayı atlama
""",
            'detailed': """
📋 DETAY SEVİYESİ: DETAYLI
- Kavramları detaylı açıkla
- Önemli adımları detaylandır
- Önemli terimleri açıkla
- Örnekleri genişlet
- Gereksiz detayları atla
""",
            'balanced': """
📋 DETAY SEVİYESİ: DENGELİ
- Kavramları dengeli açıkla
- Önemli noktaları vurgula
- Gerektiğinde detay ver
- Örnekleri kısa tut
- Dengeli bir yaklaşım sürdür
""",
            'concise': """
📋 DETAY SEVİYESİ: ÖZ
- Kavramları öz açıkla
- Sadece önemli noktaları vurgula
- Gereksiz detayları atla
- Örnekleri minimal tut
- Kısa ve öz kal
""",
            'brief': """
📋 DETAY SEVİYESİ: KISA
- Kavramları kısa açıkla
- Sadece kritik noktaları belirt
- Detayları atla
- Örnek verme
- Mümkün olduğunca kısa ol
""",
            'technical_with_context': """
📋 DETAY SEVİYESİ: TEKNİK BAĞLAMLI
- Teknik terimleri kullan ama kısa bağlam ver
- Kritik noktaları vurgula
- Gereksiz detayları atla
- Kavramsal derinliği koru
""",
            'direct_with_depth': """
📋 DETAY SEVİYESİ: DERİNLEMESİNE DİREKT
- Direkt yaklaşım ama derinlemesine
- Kavramlar arası ilişkileri göster
- Farklı perspektifler sun
- İleri seviye detaylar ekle
""",
        }
        
        return instructions.get(detail_level, instructions['balanced'])
    
    def _get_example_instructions(self, example_count: str) -> str:
        """Get example count instructions"""
        instructions = {
            'many': """
📚 ÖRNEK KULLANIMI: ÇOK ÖRNEK
- 3-5 somut örnek ver
- Her örneği detaylı açıkla
- Günlük hayattan örnekler kullan
- Örnekleri genişlet
""",
            'moderate': """
📚 ÖRNEK KULLANIMI: ORTA ÖRNEK
- 1-2 örnek yeterli
- Örnekleri kısa tut
- Gerektiğinde örnek ver
""",
            'minimal': """
📚 ÖRNEK KULLANIMI: MİNİMAL
- 0-1 örnek yeterli
- Örnekler varsa ileri seviye olsun
- Örnekleri kısa tut
""",
            'none': """
📚 ÖRNEK KULLANIMI: ÖRNEK YOK
- Örnek verme
- Doğrudan kavramsal derinliğe gir
- Teorik ve soyut düzeyde kal
""",
            'strategic': """
📚 ÖRNEK KULLANIMI: STRATEJİK ÖRNEKLER
- İleri seviye, karmaşık örnekler ver
- Örnekler kavramsal derinliği artırsın
- Teorik ve pratik entegrasyonu göster
- Basit örneklerden kaçın
""",
            'moderate_advanced': """
📚 ÖRNEK KULLANIMI: İLERİ SEVİYE ORTA ÖRNEK
- 1-2 ileri seviye örnek ver
- Örnekler karmaşık ve derinlemesine olsun
- Kavramsal derinliği artırsın
""",
        }
        
        return instructions.get(example_count, instructions['moderate'])



