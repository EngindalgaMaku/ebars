"""
Centralized Response Message Handler
Standardizes all system messages across the RAG system with bilingual support
"""

from typing import Literal, Optional
from dataclasses import dataclass

LanguageCode = Literal['tr', 'en']

@dataclass
class ResponseMessages:
    """
    Container for standardized response messages in both languages
    """
    
    # Course scope validation messages
    COURSE_SCOPE_MESSAGES = {
        'tr': {
            'out_of_scope': 'Bu soru \'{session_name}\' dersi kapsamı dışındadır. Lütfen ders konularıyla ilgili sorular sorun.',
            'validation_instruction': (
                "DERS KAPSAMI KONTROLÜ (EK GÜVENLİK KATMANI):\n"
                "- Öğrencinin sorusu '{session_name}' dersi kapsamında olmalıdır.\n"
                "- Eğer soru ders kapsamı dışındaysa (örneğin farklı bir ders konusu), şu şekilde cevap ver:\n"
                "  'Bu soru '{session_name}' dersi kapsamı dışındadır. Lütfen ders konularıyla ilgili sorular sorun.'\n"
                "- Bu kontrol, RAG'ın bulduğu chunk'lara ek olarak yapılır. Chunk'lar olsa bile ders kapsamı dışındaysa bu cevabı ver.\n"
                "- SADECE ders kapsamındaki sorulara normal cevap ver.\n"
            ),
            'validation_instruction_strict': (
                "DERS KAPSAMI KONTROLÜ (SIKI):\n"
                "- Öğrencinin sorusu '{session_name}' dersi kapsamında olmalıdır.\n"
                "- Eğer soru ders kapsamı dışındaysa (örneğin: tarih, matematik, coğrafya, farklı bir ders konusu), HEMEN şu cevabı ver:\n"
                "  'Bu soru '{session_name}' dersi kapsamı dışındadır. Lütfen ders konularıyla ilgili sorular sorun.'\n"
                "- Bu kontrol, ders materyallerine BAKMADAN ÖNCE yapılır.\n"
                "- Materyaller olsa bile, eğer soru ders kapsamı dışındaysa MUTLAKA yukarıdaki cevabı ver.\n"
                "- SADECE '{session_name}' dersi konularıyla ilgili sorulara normal cevap ver.\n"
            )
        },
        'en': {
            'out_of_scope': 'This question is outside the scope of \'{session_name}\' course. Please ask questions related to the course topics.',
            'validation_instruction': (
                "COURSE SCOPE VALIDATION (ADDITIONAL SECURITY LAYER):\n"
                "- The student's question must be within the scope of '{session_name}' course.\n"
                "- If the question is outside the course scope (e.g., a different subject), respond as follows:\n"
                "  'This question is outside the scope of '{session_name}' course. Please ask questions related to the course topics.'\n"
                "- This check is performed in addition to the chunks found by RAG. Even if chunks exist, respond with this message if outside course scope.\n"
                "- ONLY answer normally to questions within the course scope.\n"
            ),
            'validation_instruction_strict': (
                "COURSE SCOPE VALIDATION (STRICT):\n"
                "- The student's question must be within the scope of '{session_name}' course.\n"
                "- If the question is outside the course scope (e.g., different subject areas), IMMEDIATELY respond as follows:\n"
                "  'This question is outside the scope of '{session_name}' course. Please ask questions related to the course topics.'\n"
                "- This check is performed BEFORE looking at course materials.\n"
                "- Even if materials exist, if the question is outside course scope, ALWAYS give the above response.\n"
                "- ONLY answer normally to questions related to '{session_name}' course topics.\n"
            )
        }
    }
    
    # System error messages  
    SYSTEM_ERROR_MESSAGES = {
        'tr': {
            'no_context_found': '⚠️ **DERS KAPSAMINDA DEĞİL**\n\nSorduğunuz soru ders dökümanlarında bulunamamıştır. Eğer sorunuzun ders içeriğiyle ilgili olduğunu düşünüyorsanız öğretmeninize bildiriniz.\n\n📚 *Lütfen ders materyalleri kapsamında sorular sorunuz.*',
            'insufficient_context': 'Bu konuya dair kaynaklarda yeterli bilgi bulamadım.',
            'processing_error': 'Cevap oluşturulurken bir hata oluştu: {error}',
            'retrieval_failed': 'İlgili içerik bulunamadı.',
            'embedding_failed': 'Soru için embedding üretilemedi.'
        },
        'en': {
            'no_context_found': '⚠️ **NOT IN COURSE SCOPE**\n\nThe question you asked could not be found in the course documents. If you think your question is related to course content, please inform your instructor.\n\n📚 *Please ask questions within the scope of course materials.*',
            'insufficient_context': 'This information is not found in the provided sources.',
            'processing_error': 'An error occurred while generating the answer: {error}',
            'retrieval_failed': 'No relevant content found.',
            'embedding_failed': 'Could not generate embedding for the question.'
        }
    }
    
    # Reranker system messages
    RERANKER_MESSAGES = {
        'tr': {
            'reranking_disabled': 'Reranking devre dışı bırakıldı.',
            'reranker_failed': 'Reranking başarısız oldu, orijinal sıralama kullanılıyor.',
            'double_reranking_prevented': 'Çoklu reranking önlendi.',
            'reranker_service_unavailable': 'Reranker servisi kullanılamıyor.'
        },
        'en': {
            'reranking_disabled': 'Reranking has been disabled.',
            'reranker_failed': 'Reranking failed, using original ordering.',
            'double_reranking_prevented': 'Double reranking prevented.',
            'reranker_service_unavailable': 'Reranker service unavailable.'
        }
    }


class ResponseMessageHandler:
    """
    Centralized handler for all system response messages
    Provides standardized, bilingual message management
    """
    
    def __init__(self):
        self.messages = ResponseMessages()
    
    def get_course_scope_message(
        self, 
        language: LanguageCode, 
        session_name: str,
        message_type: str = 'out_of_scope'
    ) -> str:
        """
        Get course scope validation message
        
        Args:
            language: Language code ('tr' or 'en')
            session_name: Name of the session/course
            message_type: Type of message ('out_of_scope', 'validation_instruction', 'validation_instruction_strict')
            
        Returns:
            str: Formatted course scope message
        """
        try:
            template = self.messages.COURSE_SCOPE_MESSAGES[language][message_type]
            return template.format(session_name=session_name.strip() if session_name else 'Bilinmeyen Ders')
        except (KeyError, AttributeError):
            # Fallback to Turkish out_of_scope message
            fallback_template = self.messages.COURSE_SCOPE_MESSAGES['tr']['out_of_scope']
            return fallback_template.format(session_name=session_name.strip() if session_name else 'Bilinmeyen Ders')
    
    def get_system_error_message(
        self,
        language: LanguageCode,
        error_type: str,
        error_details: Optional[str] = None
    ) -> str:
        """
        Get system error message
        
        Args:
            language: Language code ('tr' or 'en')
            error_type: Type of error ('no_context_found', 'insufficient_context', etc.)
            error_details: Optional error details for formatting
            
        Returns:
            str: Formatted error message
        """
        try:
            template = self.messages.SYSTEM_ERROR_MESSAGES[language][error_type]
            if error_details and '{error}' in template:
                return template.format(error=error_details)
            return template
        except KeyError:
            # Fallback to Turkish message
            fallback_template = self.messages.SYSTEM_ERROR_MESSAGES['tr'].get(
                error_type, 
                self.messages.SYSTEM_ERROR_MESSAGES['tr']['processing_error']
            )
            if error_details and '{error}' in fallback_template:
                return fallback_template.format(error=error_details)
            return fallback_template
    
    def get_reranker_message(
        self,
        language: LanguageCode,
        message_type: str
    ) -> str:
        """
        Get reranker system message
        
        Args:
            language: Language code ('tr' or 'en')
            message_type: Type of message ('reranking_disabled', 'reranker_failed', etc.)
            
        Returns:
            str: Reranker message
        """
        try:
            return self.messages.RERANKER_MESSAGES[language][message_type]
        except KeyError:
            # Fallback to Turkish message
            return self.messages.RERANKER_MESSAGES['tr'].get(
                message_type, 
                'Reranker mesajı bulunamadı.'
            )
    
    def detect_out_of_scope_response(
        self,
        response: str,
        language: LanguageCode = 'tr'
    ) -> bool:
        """
        Detect if a response indicates the question is out of course scope
        
        Args:
            response: The response text to analyze
            language: Language to check against
            
        Returns:
            bool: True if response indicates out of scope
        """
        if not response:
            return False
            
        response_lower = response.lower()
        
        # Turkish patterns
        tr_patterns = [
            'ders kapsamı dışında',
            'konu kapsamında değil',
            'ders konularıyla ilgili',
            'kapsamında bulunamamıştır'
        ]
        
        # English patterns  
        en_patterns = [
            'outside the scope',
            'not in course scope',
            'outside course scope',
            'not found in the provided context',
            'cannot answer',
            'not mentioned in the context'
        ]
        
        patterns = tr_patterns if language == 'tr' else en_patterns
        return any(pattern in response_lower for pattern in patterns)
    
    def standardize_legacy_response(
        self,
        response: str,
        session_name: str,
        language: LanguageCode = 'tr'
    ) -> str:
        """
        Convert legacy out-of-scope responses to standardized format
        
        Args:
            response: Original response text
            session_name: Name of the session/course
            language: Language code
            
        Returns:
            str: Standardized response
        """
        if self.detect_out_of_scope_response(response, language):
            return self.get_course_scope_message(language, session_name, 'out_of_scope')
        return response


# Global instance for easy access
response_message_handler = ResponseMessageHandler()


def get_response_handler() -> ResponseMessageHandler:
    """
    Get the global response message handler instance
    
    Returns:
        ResponseMessageHandler: Global handler instance
    """
    return response_message_handler


# Utility functions for backward compatibility
def get_course_scope_message(session_name: str, language: LanguageCode = 'tr') -> str:
    """
    Utility function to get course scope message (backward compatibility)
    
    Args:
        session_name: Name of the session/course
        language: Language code
        
    Returns:
        str: Course scope message
    """
    return response_message_handler.get_course_scope_message(language, session_name)


def get_validation_instruction(session_name: str, language: LanguageCode = 'tr', strict: bool = False) -> str:
    """
    Utility function to get validation instruction (backward compatibility)
    
    Args:
        session_name: Name of the session/course
        language: Language code
        strict: Whether to use strict validation
        
    Returns:
        str: Validation instruction
    """
    message_type = 'validation_instruction_strict' if strict else 'validation_instruction'
    return response_message_handler.get_course_scope_message(language, session_name, message_type)


# Test the handler
if __name__ == "__main__":
    handler = ResponseMessageHandler()
    
    print("=== Test Course Scope Messages ===")
    print("Turkish out of scope:")
    print(handler.get_course_scope_message('tr', 'Biyoloji', 'out_of_scope'))
    print()
    
    print("English out of scope:")
    print(handler.get_course_scope_message('en', 'Biology', 'out_of_scope'))
    print()
    
    print("=== Test Error Messages ===")
    print("Turkish no context:")
    print(handler.get_system_error_message('tr', 'no_context_found'))
    print()
    
    print("English no context:")
    print(handler.get_system_error_message('en', 'no_context_found'))
    print()
    
    print("=== Test Detection ===")
    test_response = "Bu soru Biyoloji dersi kapsamı dışındadır."
    print(f"Out of scope detection: {handler.detect_out_of_scope_response(test_response, 'tr')}")