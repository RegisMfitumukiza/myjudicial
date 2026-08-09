"""LLM service for text generation, translation, and analysis using Ollama or Groq"""
import httpx
import json
import logging
import time
from typing import Dict, Any, Optional, List

from app.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    """Service for LLM operations supporting both Ollama and Groq"""
    
    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        
        # Ollama settings
        self.ollama_base_url = settings.OLLAMA_BASE_URL
        self.ollama_model = settings.OLLAMA_MODEL
        self.ollama_timeout = settings.OLLAMA_TIMEOUT
        
        # Groq settings
        self.groq_api_key = settings.GROQ_API_KEY
        self.groq_model = settings.GROQ_MODEL
        
        if self.provider == "groq":
            if not self.groq_api_key:
                logger.warning("GROQ_API_KEY not set, falling back to Ollama")
                self.provider = "ollama"
            else:
                try:
                    from groq import AsyncGroq
                    self.groq_client = AsyncGroq(api_key=self.groq_api_key)
                    logger.info(f"LLM Service initialized with Groq: {self.groq_model}")
                except ImportError:
                    logger.error("groq package not installed, falling back to Ollama")
                    self.provider = "ollama"
        
        if self.provider == "ollama":
            logger.info(f"LLM Service initialized with Ollama: {self.ollama_model}")
    
    async def _generate_ollama(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """Generate text using Ollama API"""
        start_time = time.time()
        
        try:
            payload = {
                "model": self.ollama_model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                }
            }
            
            if max_tokens:
                payload["options"]["num_predict"] = max_tokens
            
            if system_prompt:
                payload["system"] = system_prompt
            
            async with httpx.AsyncClient(timeout=self.ollama_timeout) as client:
                response = await client.post(
                    f"{self.ollama_base_url}/api/generate",
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
            
            processing_time = time.time() - start_time
            
            return {
                "text": result.get("response", ""),
                "model": result.get("model", self.ollama_model),
                "processing_time": processing_time,
                "provider": "ollama"
            }
        
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise Exception(f"Ollama generation failed: {str(e)}")
    
    async def _generate_groq(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """Generate text using Groq API"""
        start_time = time.time()
        
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            chat_completion = await self.groq_client.chat.completions.create(
                messages=messages,
                model=self.groq_model,
                temperature=temperature,
                max_tokens=max_tokens or 1024
            )
            
            processing_time = time.time() - start_time
            
            return {
                "text": chat_completion.choices[0].message.content,
                "model": chat_completion.model,
                "processing_time": processing_time,
                "provider": "groq",
                "usage": {
                    "prompt_tokens": chat_completion.usage.prompt_tokens,
                    "completion_tokens": chat_completion.usage.completion_tokens,
                    "total_tokens": chat_completion.usage.total_tokens
                }
            }
        
        except Exception as e:
            logger.error(f"Groq generation failed: {e}")
            raise Exception(f"Groq generation failed: {str(e)}")
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate text using configured LLM provider
        
        Args:
            prompt: The user prompt
            system_prompt: Optional system instructions
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
        
        Returns:
            Dictionary with response and metadata
        """
        if self.provider == "groq":
            return await self._generate_groq(prompt, system_prompt, temperature, max_tokens)
        else:
            return await self._generate_ollama(prompt, system_prompt, temperature, max_tokens)
    
    async def translate(
        self,
        text: str,
        source_language: str,
        target_language: str
    ) -> Dict[str, Any]:
        """
        Translate text between languages
        
        Args:
            text: Text to translate
            source_language: Source language code (en, fr, rw)
            target_language: Target language code (en, fr, rw)
        
        Returns:
            Dictionary with translated text and metadata
        """
        start_time = time.time()
        
        # Language mapping
        language_names = {
            "en": "English",
            "fr": "French",
            "rw": "Kinyarwanda"
        }
        
        source_lang = language_names.get(source_language, source_language)
        target_lang = language_names.get(target_language, target_language)
        
        # Construct translation prompt
        system_prompt = """You are a professional translator. Translate the given text accurately while maintaining the original meaning, tone, and context. For legal terminology, use appropriate legal terms in the target language. Return ONLY the translated text without any explanations or notes."""
        
        prompt = f"""Translate the following text from {source_lang} to {target_lang}.

Text to translate:
{text}

Translation:"""
        
        try:
            result = await self.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.3  # Lower temperature for more consistent translations
            )
            
            translated_text = result["text"].strip()
            processing_time = time.time() - start_time
            
            logger.info(
                f"Translated text from {source_language} to {target_language} "
                f"in {processing_time:.2f}s using {result.get('provider', 'unknown')}"
            )
            
            return {
                "success": True,
                "original_text": text,
                "translated_text": translated_text,
                "source_language": source_language,
                "target_language": target_language,
                "llm_model": result.get("model"),
                "llm_provider": result.get("provider"),
                "processing_time": processing_time
            }
        
        except Exception as e:
            logger.error(f"Translation failed: {e}", exc_info=True)
            raise Exception(f"Translation failed: {str(e)}")
    
    # Keyword-based pre-classification rules for fast, reliable matching
    KEYWORD_CLASSIFICATION = {
        "CRIMINAL_LAW": [
            "beat", "assault", "battery", "attack", "violence", "theft", "robbery", "fraud",
            "murder", "threat", "stab", "shoot", "fight", "physical harm", "police", "arrest",
            "crime", "stolen", "break in", "trespass", "weapon", "rape", "kill", "injure",
            "domestic violence", "harassment", "extortion", "kidnapping", "bribery"
        ],
        "FAMILY_LAW": [
            "divorce", "custody", "child", "marriage", "spouse", "domestic", "alimony",
            "adoption", "inheritance", "will", "death", "family", "separation", "guardian",
            "parental", "maintenance", "polygamy", "bride price"
        ],
        "COMMERCIAL_LAW": [
            "company", "business", "partnership", "trademark", "merger", "acquisition",
            "incorporate", "shareholder", "board", "profit"
        ],
        "EMPLOYMENT_LAW": [
            "employer", "employee", "fired", "terminated", "salary", "wages", "workplace",
            "labor", "labour", "overtime", "leave", "dismissal", "work",
            "occupational", "injury at work"
        ],
        "LAND_LAW": [
            "land", "property", "boundary", "fence", "tenant", "rent", "lease", "mortgage",
            "eviction", "house", "building", "plot", "title deed", "certificate foncier",
            "neighboring", "construction", "landlord"
        ],
        "CRIMINAL_LAW": [
            "crime", "theft", "assault", "murder", "robbery", "fraud", "battery",
            "violence", "stab", "shoot", "weapon", "physical harm"
        ],
        "TAX_LAW": [
            "tax", "taxman", "revenue", "filing", "audit", "evasion", "RRA", "tax return",
            "withholding", "vat", "income tax"
        ],
        "IMMIGRATION_LAW": [
            "visa", "passport", "immigration", "refugee", "asylum", "permit", "citizenship",
            "deportation", "work permit", "resident permit", "expatriate"
        ],
        "CORPORATE_LAW": [
            "corporate", "board", "shareholder", "incorporation", "bylaws"
        ],
        "CONTRACT_LAW": [
            "contract", "agreement", "terms", "breach", "warranty"
        ],
        "INTELLECTUAL_PROPERTY": [
            "intellectual property", "patent", "trademark", "copyright", "trade secret"
        ],
    }

    def _keyword_pre_classify(self, text: str) -> Optional[str]:
        """Pre-classify based on keywords before calling LLM"""
        text_lower = text.lower()
        scores = {}
        for specialty, keywords in self.KEYWORD_CLASSIFICATION.items():
            count = sum(1 for kw in keywords if kw in text_lower)
            if count > 0:
                scores[specialty] = count
        if scores:
            best = max(scores, key=scores.get)
            if scores[best] >= 1:
                return best
        return None

    def _keyword_override(self, text: str, llm_specialty: str) -> str:
        """Override LLM classification if strong keyword signals disagree"""
        text_lower = text.lower()
        # Strong signals that always override (must match Prisma schema)
        STRONG_OVERRIDE = {
            "CRIMINAL_LAW": ["beat", "assault", "attack", "violence", "stab", "shoot", "murder", "rape", "robbery", "weapon", "physical harm"],
            "FAMILY_LAW": ["divorce", "custody", "separation", "alimony"],
            "IMMIGRATION_LAW": ["visa", "passport", "immigration", "asylum", "deportation"],
        }
        for specialty, keywords in STRONG_OVERRIDE.items():
            if any(kw in text_lower for kw in keywords):
                if llm_specialty != specialty:
                    logger.warning(f"Keyword override: LLM said {llm_specialty} but keywords strongly indicate {specialty}")
                    return specialty
        return llm_specialty

    async def analyze_case(
        self,
        text: str,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Analyze legal case from user description
        
        Args:
            text: User's description of their legal issue
            language: Language of the input text
        
        Returns:
            Structured case analysis with specialty, urgency, budget, etc.
        """
        start_time = time.time()
        
        # Step 1: Keyword pre-classification
        keyword_specialty = self._keyword_pre_classify(text)
        keyword_hint = ""
        if keyword_specialty:
            keyword_hint = f"\nHint: Based on keywords, this appears to be {keyword_specialty}. Verify and correct if needed."
        
        system_prompt = """You are a legal intake specialist for Rwanda. Classify the user's legal issue accurately.

CRITICAL CLASSIFICATION RULES:
- Physical violence, assault, battery, fights, threats → CRIMINAL_LAW
- Land disputes, property boundaries, tenant issues → LAND_LAW
- Divorce, custody, family disputes → FAMILY_LAW
- Workplace issues, wrongful termination → EMPLOYMENT_LAW
- Business contracts, company disputes → COMMERCIAL_LAW
- Visa, immigration, citizenship → IMMIGRATION_LAW
- Tax disputes, revenue issues → TAX_LAW
- Corporate governance, shareholder disputes → CORPORATE_LAW
- Contract disputes, agreement breaches → CONTRACT_LAW
- Patent, trademark, copyright issues → INTELLECTUAL_PROPERTY

If the case involves physical harm or violence, ALWAYS classify as CRIMINAL_LAW.
If the case involves both criminal and civil aspects (e.g., assault + medical bills), classify as the PRIMARY issue (CRIMINAL_LAW) and note related areas.

RULES:
- Determine urgency: LOW (weeks), MEDIUM (days), HIGH (urgent), CRITICAL (emergency)
- DO NOT estimate budget - set budget_range to {{"min": 0, "max": 0, "currency": "RWF"}}
- Return suggested_documents as objects with "document" and "reason" fields
- Include reasoning explaining WHY this specialty was chosen
- Include possible_legal_issues as specific legal terms
- DO NOT give legal advice or predict outcomes
- Return ONLY valid JSON"""

        prompt = f"""Analyze this legal issue and return a JSON response.

User's issue:
"{text}"
{keyword_hint}

Return JSON in this exact format:
{{
  "specialty": "CRIMINAL_LAW",
  "urgency_level": "HIGH",
  "jurisdiction": "RWANDA",
  "budget_range": {{"min": 0, "max": 0, "currency": "RWF"}},
  "key_entities": ["entity1", "entity2"],
  "suggested_documents": [
    {{"document": "Document Name", "reason": "Why this document is needed"}}
  ],
  "confidence_score": 0.92,
  "reasoning": "Brief explanation of why this specialty was chosen",
  "possible_legal_issues": ["Specific legal issue 1", "Specific legal issue 2"]
}}

JSON Response:"""
        
        try:
            result = await self.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.3
            )
            
            response_text = result["text"].strip()
            
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            
            analysis = json.loads(response_text)
            
            # Step 2: Keyword override if LLM classification disagrees with strong keywords
            if keyword_specialty:
                analysis["specialty"] = self._keyword_override(text, analysis.get("specialty", keyword_specialty))
            
            # Step 3: Normalize suggested_documents to objects
            if "suggested_documents" in analysis:
                normalized_docs = []
                for doc in analysis["suggested_documents"]:
                    if isinstance(doc, str):
                        normalized_docs.append({"document": doc, "reason": "Required for your case"})
                    elif isinstance(doc, dict):
                        normalized_docs.append({
                            "document": doc.get("document", doc.get("name", str(doc))),
                            "reason": doc.get("reason", doc.get("explanation", "Required for your case"))
                        })
                analysis["suggested_documents"] = normalized_docs
            
            processing_time = time.time() - start_time
            
            logger.info(
                f"Case analysis completed: specialty={analysis.get('specialty')}, "
                f"urgency={analysis.get('urgency_level')}, keyword_hint={keyword_specialty}, "
                f"in {processing_time:.2f}s using {result.get('provider', 'unknown')}"
            )
            
            return {
                "success": True,
                "analysis": analysis,
                "llm_model": result.get("model"),
                "llm_provider": result.get("provider"),
                "processing_time": processing_time
            }
        
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {e}")
            logger.error(f"Raw response: {result.get('text', '')}")
            raise Exception(f"Failed to parse case analysis: Invalid JSON response")
        except Exception as e:
            logger.error(f"Case analysis failed: {e}", exc_info=True)
            raise Exception(f"Case analysis failed: {str(e)}")
    
    async def extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """
        Extract key legal terms and entities from text
        
        Args:
            text: Text to analyze
            max_keywords: Maximum number of keywords to extract
        
        Returns:
            List of keywords
        """
        system_prompt = "You are an expert at extracting key legal terms and entities from text. Return only the keywords as a comma-separated list."
        
        prompt = f"""Extract the {max_keywords} most important legal keywords and entities from this text:

{text}

Keywords (comma-separated):"""
        
        try:
            result = await self.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.3
            )
            
            keywords_text = result["text"].strip()
            keywords = [k.strip() for k in keywords_text.split(",")]
            keywords = keywords[:max_keywords]  # Limit to max_keywords
            
            logger.info(f"Extracted {len(keywords)} keywords from text")
            return keywords
        
        except Exception as e:
            logger.error(f"Keyword extraction failed: {e}")
            return []
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check if LLM service is accessible
        
        Returns:
            Health status information
        """
        try:
            if self.provider == "groq":
                # Test Groq API
                test_completion = await self.groq_client.chat.completions.create(
                    messages=[{"role": "user", "content": "Hi"}],
                    model=self.groq_model,
                    max_tokens=10
                )
                return {
                    "status": "healthy",
                    "service": "llm",
                    "provider": "groq",
                    "model": self.groq_model
                }
            else:
                # Test Ollama API
                async with httpx.AsyncClient(timeout=5) as client:
                    response = await client.get(f"{self.ollama_base_url}/api/tags")
                    response.raise_for_status()
                    
                    models = response.json().get("models", [])
                    model_available = any(
                        m.get("name") == self.ollama_model or m.get("model") == self.ollama_model
                        for m in models
                    )
                    
                    return {
                        "status": "healthy" if model_available else "degraded",
                        "service": "llm",
                        "provider": "ollama",
                        "base_url": self.ollama_base_url,
                        "model": self.ollama_model,
                        "model_available": model_available
                    }
        
        except Exception as e:
            logger.error(f"LLM health check failed: {e}")
            return {
                "status": "unhealthy",
                "service": "llm",
                "provider": self.provider,
                "error": str(e)
            }


# Global instance
llm_service = LLMService()
