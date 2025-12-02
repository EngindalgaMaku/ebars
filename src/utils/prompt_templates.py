"""
Bilingual prompt templates for the RAG system.
Provides context-aware prompts in both Turkish and English.
"""

from typing import Literal, Dict, Any
from dataclasses import dataclass

LanguageCode = Literal['tr', 'en']

@dataclass
class PromptTemplates:
    """
    Container for all prompt templates in both languages.
    """
    
    # System prompts for RAG-based responses
    SYSTEM_PROMPTS = {
        'tr': (
            "Sen bir eğitim asistanısın. ÇOK ÖNEMLİ KURAL: KESINLIKLE genel bilginle cevap verme!\n\n"
            "{session_context}\n"
            "{course_scope_instruction}\n\n"
            "SADECE verilen kaynak metinleri kullan. Kaynaklarda olmayan hiçbir bilgi ekleme.\n"
            "TÜRKÇE DİL KURALLARI:\n"
            "- Düzgün, akıcı ve doğal Türkçe kullan\n"
            "- Özne-nesne-yüklem sırası koru\n"
            "- Gereksiz kelime tekrarı yapma\n"
            "- Net, anlaşılır cümleler kur\n"
            "- Günlük konuşma dili kullan\n\n"
            "CEVAP FORMATI:\n"
            "- Basit ve net paragraflar\n"
            "- Öğrenci dostu açıklamalar\n"
            "- Kısa ve öz cevaplar\n\n"
            "Kaynaklarda bilgi yoksa: 'Bu konuya dair kaynaklarda yeterli bilgi bulamadım' de ve dur."
        ),
        'en': (
            "You are an educational assistant. IMPORTANT RULE: NEVER answer with your general knowledge! "
            "{session_context}\n"
            "{course_scope_instruction}\n\n"
            "Use ONLY and EXCLUSIVELY the context texts provided below. "
            "Do not add any information not in the context, don't make up any book/source names. "
            "If there's insufficient information in the context, say 'This information is not found in the provided sources' and stop. "
            "Your answer must be completely based on the texts given in the context. Use no external knowledge!"
        )
    }
    
    # User prompts for RAG-based responses
    USER_PROMPT_TEMPLATES = {
        'tr': """KAYNAK METİNLER:
{context}

ÖĞRENCİNİN SORUSU: {query}

SADECE yukarıdaki kaynak metinleri kullanarak cevap ver.

TÜRKÇE DİKKAT ET:
- Doğal, düzgün Türkçe kullan
- "Sizi", "size" yerine uygun durumda "seni", "sana" kullan
- Basit, anlaşılır cümleler kur
- Gereksiz süslü kelimeler kullanma

CEVAP ŞEKLİ:
• Önce ana konuyu açıkla
• Detayları sırayla ver
• Basit örnekler kullan
• Kısa paragraflar yaz

CEVAP:""",
        'en': """
Context:
{context}

Question: {query}

Please provide a detailed, comprehensive, and explanatory answer. Address the topic in depth,
provide examples, and explain the steps, reasons, and consequences when possible.
"""
    }
    
    # System prompts for direct (non-RAG) responses
    DIRECT_SYSTEM_PROMPTS = {
        'tr': (
            "Kullanıcının sorusunu genel bilginle yanıtla.\n\n"
            "TÜRKÇE DİL KURALLARI:\n"
            "- Düzgün, akıcı Türkçe kullan\n"
            "- Doğal konuşma dili tercih et\n"
            "- Karmaşık cümleler kurma\n"
            "- Net ve anlaşılır ol\n\n"
            "Emin olmadığın konularda belirsizliğini belirt."
        ),
        'en': "Answer the user's question with your general knowledge. Indicate your uncertainty on topics you're not sure about."
    }
    
    # Abstain messages when no relevant context is found
    ABSTAIN_MESSAGES = {
        'tr': "Bağlamda yeterli bilgi bulunamadı. Lütfen soruyu farklı ifade edin ya da daha ilgili bir belge yükleyin.",
        'en': "Insufficient information found in the context. Please rephrase the question or upload more relevant documents."
    }
    
    # Error messages for various scenarios
    ERROR_MESSAGES = {
        'tr': {
            'embedding_failed': "Soru için embedding üretilemedi.",
            'no_results': "İlgili içerik bulunamadı.",
            'generation_error': "Cevap oluşturulurken bir hata oluştu: {error}",
            'direct_answer_error': "Doğrudan cevap oluşturulurken bir hata oluştu: {error}"
        },
        'en': {
            'embedding_failed': "Could not generate embedding for the question.",
            'no_results': "No relevant content found.",
            'generation_error': "An error occurred while generating the answer: {error}",
            'direct_answer_error': "An error occurred while generating direct answer: {error}"
        }
    }
    
    # Reranking prompts for LLM-based reranking
    RERANK_PROMPTS = {
        'tr': """
Soru: {query}
Aşağıda getirilen parça adayları var. Görevin: soruya en iyi yanıt içeriğini barındıran en alakalı ilk {top_n} adayı seçip, önem sırasına göre numaralarını listelemek.
Sadece numaraları virgülle ayırarak döndür (ör: 2,1,3).

Adaylar:
{items}
""",
        'en': """
Question: {query}
Below are candidate text passages. Your task: select the most relevant top {top_n} candidates that contain the best answer content for the question, and list their numbers in order of importance.
Return only the numbers separated by commas (e.g.: 2,1,3).

Candidates:
{items}
"""
    }
    
    # Reranking system prompts
    RERANK_SYSTEM_PROMPTS = {
        'tr': "Adayları sadece numara sıralamasıyla döndür.",
        'en': "Return candidates with number ranking only."
    }
    
    # Follow-up question suggestions
    FOLLOWUP_SUGGESTIONS = {
        'tr': {
            'more_detail': "Bu konu hakkında daha detaylı bilgi verebilir misin?",
            'examples': "Örnekler verebilir misin?",
            'related_topics': "İlgili konular nelerdir?",
            'practical_application': "Pratikte nasıl uygulanır?"
        },
        'en': {
            'more_detail': "Can you provide more detailed information about this topic?",
            'examples': "Can you give examples?",
            'related_topics': "What are the related topics?",
            'practical_application': "How is it applied in practice?"
        }
    }

class BilingualPromptManager:
    """
    Manager class for handling bilingual prompts based on detected language.
    """
    
    def __init__(self):
        self.templates = PromptTemplates()
    
    def get_system_prompt(self, language: LanguageCode, prompt_type: str = 'rag', session_name: str = None) -> str:
        """
        Get system prompt for the specified language and type.
        
        Args:
            language: Language code ('tr' or 'en')
            prompt_type: Type of prompt ('rag' or 'direct')
            session_name: Optional session/lesson name for course scope validation
            
        Returns:
            str: System prompt in the specified language
        """
        if prompt_type == 'direct':
            return self.templates.DIRECT_SYSTEM_PROMPTS[language]
        else:
            base_prompt = self.templates.SYSTEM_PROMPTS[language]
            
            # Add session context if session name is provided
            if session_name and session_name.strip():
                if language == 'tr':
                    session_context = f"ŞU ANDA '{session_name.strip()}' DERSİ İÇİN CEVAP VERİYORSUN.\n\n"
                    course_scope_instruction = (
                        "DERS KAPSAMI KONTROLÜ (EK GÜVENLİK KATMANI):\n"
                        f"- Öğrencinin sorusu '{session_name.strip()}' dersi kapsamında olmalıdır.\n"
                        "- Eğer soru ders kapsamı dışındaysa (örneğin farklı bir ders konusu), şu şekilde cevap ver:\n"
                        f"  'Bu soru '{session_name.strip()}' dersi kapsamı dışındadır. Lütfen ders konularıyla ilgili sorular sorun.'\n"
                        "- Bu kontrol, RAG'ın bulduğu chunk'lara ek olarak yapılır. Chunk'lar olsa bile ders kapsamı dışındaysa bu cevabı ver.\n"
                        "- SADECE ders kapsamındaki sorulara normal cevap ver.\n"
                    )
                else:  # English
                    session_context = f"You are currently answering for the course: '{session_name.strip()}'.\n\n"
                    course_scope_instruction = (
                        "COURSE SCOPE VALIDATION (ADDITIONAL SECURITY LAYER):\n"
                        f"- The student's question must be within the scope of '{session_name.strip()}' course.\n"
                        "- If the question is outside the course scope (e.g., a different subject), respond as follows:\n"
                        f"  'This question is outside the scope of '{session_name.strip()}' course. Please ask questions related to the course topics.'\n"
                        "- This check is performed in addition to the chunks found by RAG. Even if chunks exist, respond with this message if outside course scope.\n"
                        "- ONLY answer normally to questions within the course scope.\n"
                    )
            else:
                session_context = ""
                course_scope_instruction = ""
            
            # Format the prompt with session context
            try:
                return base_prompt.format(
                    session_context=session_context,
                    course_scope_instruction=course_scope_instruction
                )
            except KeyError:
                # Fallback if format fails (backward compatibility)
                return base_prompt.replace("{session_context}\n", session_context).replace("{course_scope_instruction}\n\n", course_scope_instruction + "\n\n" if course_scope_instruction else "")
    
    def get_user_prompt(self, language: LanguageCode, query: str, context: str) -> str:
        """
        Get formatted user prompt for RAG responses.
        
        Args:
            language: Language code ('tr' or 'en')
            query: User's question
            context: Retrieved context
            
        Returns:
            str: Formatted user prompt
        """
        template = self.templates.USER_PROMPT_TEMPLATES[language]
        return template.format(context=context, query=query)
    
    def get_abstain_message(self, language: LanguageCode) -> str:
        """
        Get abstain message when no relevant context is found.
        
        Args:
            language: Language code ('tr' or 'en')
            
        Returns:
            str: Abstain message in the specified language
        """
        return self.templates.ABSTAIN_MESSAGES[language]
    
    def get_error_message(self, language: LanguageCode, error_type: str, error: str = "") -> str:
        """
        Get error message in the specified language.
        
        Args:
            language: Language code ('tr' or 'en')
            error_type: Type of error ('embedding_failed', 'no_results', etc.)
            error: Actual error message (for formatting)
            
        Returns:
            str: Error message in the specified language
        """
        template = self.templates.ERROR_MESSAGES[language].get(error_type, 
            self.templates.ERROR_MESSAGES[language]['generation_error'])
        
        if '{error}' in template:
            return template.format(error=error)
        return template
    
    def get_rerank_prompt(self, language: LanguageCode, query: str, items: str, top_n: int) -> str:
        """
        Get reranking prompt for LLM-based reranking.
        
        Args:
            language: Language code ('tr' or 'en')
            query: User's question
            items: Formatted candidate items
            top_n: Number of top candidates to select
            
        Returns:
            str: Reranking prompt
        """
        template = self.templates.RERANK_PROMPTS[language]
        return template.format(query=query, items=items, top_n=top_n)
    
    def get_rerank_system_prompt(self, language: LanguageCode) -> str:
        """
        Get system prompt for reranking.
        
        Args:
            language: Language code ('tr' or 'en')
            
        Returns:
            str: Reranking system prompt
        """
        return self.templates.RERANK_SYSTEM_PROMPTS[language]
    
    def get_followup_suggestions(self, language: LanguageCode) -> Dict[str, str]:
        """
        Get follow-up question suggestions.
        
        Args:
            language: Language code ('tr' or 'en')
            
        Returns:
            Dict[str, str]: Dictionary of follow-up suggestions
        """
        return self.templates.FOLLOWUP_SUGGESTIONS[language]
    
    def format_context_with_sources(self, language: LanguageCode, 
                                   retrieved_texts: list, metas: list) -> str:
        """
        Format retrieved context with source information.
        
        Args:
            language: Language code ('tr' or 'en')
            retrieved_texts: List of retrieved text chunks
            metas: List of metadata for each chunk
            
        Returns:
            str: Formatted context string with sources
        """
        if not retrieved_texts:
            return ""
        
        formatted_chunks = []
        source_label = "Kaynak" if language == 'tr' else "Source"
        
        for i, (text, meta) in enumerate(zip(retrieved_texts, metas), 1):
            # Extract source information from metadata
            source_info = ""
            if meta:
                if meta.get('source_file'):
                    source_info = meta['source_file']
                    if meta.get('page_number'):
                        page_label = "Sayfa" if language == 'tr' else "Page"
                        source_info += f" | {page_label} {meta['page_number']}"
                    elif meta.get('slide_number'):
                        slide_label = "Slayt" if language == 'tr' else "Slide"
                        source_info += f" | {slide_label} {meta['slide_number']}"
            
            source_header = f"[{source_label} {i}"
            if source_info:
                source_header += f": {source_info}"
            source_header += "]"
            
            formatted_chunks.append(f"{source_header}\n{text}")
        
        return "\n\n".join(formatted_chunks)


# Global instance for easy access
prompt_manager = BilingualPromptManager()


def get_prompts_for_language(language: LanguageCode) -> BilingualPromptManager:
    """
    Get prompt manager configured for specific language.
    
    Args:
        language: Language code ('tr' or 'en')
        
    Returns:
        BilingualPromptManager: Configured prompt manager
    """
    return prompt_manager


# Test the prompt templates
if __name__ == "__main__":
    manager = BilingualPromptManager()
    
    # Test prompts
    test_query = "What is machine learning?"
    test_context = "Machine learning is a subset of artificial intelligence..."
    
    print("=== Turkish Prompts ===")
    print("System:", manager.get_system_prompt('tr'))
    print("\nUser:", manager.get_user_prompt('tr', test_query, test_context))
    print("\nAbstain:", manager.get_abstain_message('tr'))
    
    print("\n=== English Prompts ===")
    print("System:", manager.get_system_prompt('en'))
    print("\nUser:", manager.get_user_prompt('en', test_query, test_context))
    print("\nAbstain:", manager.get_abstain_message('en'))