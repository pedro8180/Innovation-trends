"""
Advanced Quiz Generation Service
Migrated from agent_cert.ipynb with enhanced consistency validation
"""
import json
import re
import hashlib
from typing import Dict, List, Optional, Any
from openai import OpenAI


class ConsistencyValidator:
    """Advanced consistency validation for quiz questions"""
    
    def __init__(self):
        self.question_patterns = {}
        self.concept_answers = {}
        
    def extract_core_concept(self, question_text: str) -> Optional[str]:
        """Extract core concept from question for consistency checking"""
        key_concepts = [
            'azure openai', 'gpt', 'completions', 'embeddings', 'cognitive services',
            'computer vision', 'speech services', 'language understanding', 'luis',
            'qna maker', 'bot framework', 'custom vision', 'form recognizer',
            'translator', 'content moderator', 'personalizer', 'anomaly detector'
        ]
        
        question_lower = question_text.lower()
        found_concepts = [concept for concept in key_concepts if concept in question_lower]
        
        if found_concepts:
            return "_".join(sorted(found_concepts))
        return None
    
    def normalize_question(self, question_text: str) -> str:
        """Normalize question to detect variations of same concept"""
        stopwords = ['el', 'la', 'de', 'en', 'para', 'con', 'por', 'a', 'es', 'son', 'está', 'están']
        
        normalized = question_text.lower()
        for word in stopwords:
            normalized = re.sub(r'\b' + word + r'\b', '', normalized)
        
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        normalized = re.sub(r'[^\w\s]', '', normalized)
        
        return normalized
    
    def store_question_answer(self, question: str, correct_answer: str, explanation: str):
        """Store question and answer for consistency validation"""
        concept = self.extract_core_concept(question)
        if concept:
            normalized_q = self.normalize_question(question)
            
            if concept not in self.concept_answers:
                self.concept_answers[concept] = []
            
            self.concept_answers[concept].append({
                'question': question,
                'normalized': normalized_q,
                'answer': correct_answer,
                'explanation': explanation
            })
    
    def validate_consistency(self) -> List[Dict]:
        """Validate consistency across questions"""
        inconsistencies = []
        
        for concept, qa_pairs in self.concept_answers.items():
            if len(qa_pairs) > 1:
                answers = [qa['answer'] for qa in qa_pairs]
                if len(set(answers)) > 1:
                    inconsistencies.append({
                        'concept': concept,
                        'conflicting_qa': qa_pairs
                    })
        
        return inconsistencies


class AdvancedQuizGenerator:
    """Enhanced quiz generator with consistency validation and course data integration"""
    
    def __init__(self, openai_client: OpenAI):
        self.client = openai_client
        self.validator = ConsistencyValidator()
        self.consistency_keywords = [
            "Azure OpenAI Service", "Cognitive Services", "Computer Vision API",
            "Speech Services", "Language Understanding", "LUIS", "Custom Vision",
            "Form Recognizer", "Text Analytics", "Translator", "Bot Framework"
        ]
        self.focus_areas = [
            "Azure OpenAI Service implementation and configuration",
            "Computer Vision API integration", 
            "Speech Services and Language Understanding",
            "Responsible AI principles and governance",
            "Performance optimization and monitoring"
        ]
        self.exam_tips = [
            "Look for Azure-native solutions first",
            "Consider cost optimization in answers",
            "Security and compliance are often key factors"
        ]
    
    def load_course_data(self) -> Optional[Dict]:
        """Load course data from JSON files"""
        import os
        from pathlib import Path
        
        possible_paths = [
            Path(__file__).parent.parent.parent / 'Notebooks' / 'ai-102.json',
            Path(__file__).parent.parent.parent / 'Notebooks' / 'AI102_Agent_Integration.json',
            Path(__file__).parent.parent.parent / 'Notebooks' / 'AI102_Official_Study_Guide.json'
        ]
        
        for path in possible_paths:
            try:
                if path.exists():
                    with open(path, 'r', encoding='utf-8') as f:
                        return json.load(f)
            except Exception as e:
                continue
        return None
    
    def generate_ultra_optimized_questions(self, topic: str, num_questions: int = 3) -> Dict:
        """Generate ultra-optimized questions with advanced consistency"""
        course_data = self.load_course_data()
        
        # Build enhanced context
        context_parts = [
            f"TOPIC: {topic}",
            f"CERTIFICATION: Microsoft AI-102",
            f"🎯 TERMINOLOGÍA CONSISTENTE OBLIGATORIA:",
            ', '.join(self.consistency_keywords[:10])
        ]
        
        if course_data and 'modules' in course_data:
            context_parts.append("\n📚 MÓDULOS DISPONIBLES:")
            for i, module in enumerate(course_data['modules'][:3], 1):
                module_name = module.get('name', f'Módulo {i}')
                context_parts.append(f"  • {module_name}")
        
        context_parts.extend([
            f"\n🏆 ÁREAS DE MÁXIMO ENFOQUE:",
            '\n'.join([f"• {area}" for area in self.focus_areas[:3]]),
            f"\n💡 TIPS DE EXAMEN APLICABLES:",
            '\n'.join([f"• {tip}" for tip in self.exam_tips])
        ])
        
        full_context = "\n".join(context_parts)
        
        # Ultra-optimized prompt for English content
        optimized_prompt = f"""You are an expert specialized in Microsoft AI-102 certifications with access to official documentation.

🚀 ENHANCED CONTEXT:
{full_context}

📝 GENERATE EXACTLY {num_questions} QUESTIONS following this EXACT structure:

QUESTION [number]: [Specific question about the topic using official terminology]
A) [Option A - use consistent terminology]
B) [Option B - use consistent terminology]  
C) [Option C - use consistent terminology]
D) [Option D - use consistent terminology]

CORRECT ANSWER: [A/B/C/D] [Complete text of the correct option]
EXPLANATION: [Detailed explanation of why it's correct and why the others are incorrect. Include specific technical concepts and references to official documentation when applicable.]

🔥 ULTRA-STRICT RULES:
1. USE ONLY terminology from the provided official list
2. ALL questions must be verifiable against Microsoft documentation
3. MAINTAIN absolute consistency in Azure service names
4. Explanations must be educational and technically accurate
5. Each question must exactly simulate the real AI-102 exam

⚡ OPTIMIZED DISTRIBUTION:
• 40% Technical implementation (configuration, APIs, integration)
• 35% Setup and configuration (endpoints, authentication, resources)
• 25% Concepts and best practices (security, optimization, monitoring)

🌟 ULTRA-PREMIUM QUALITY:
- Difficulty level: Intermediate-Advanced (like the real exam)
- Answers based ONLY on official Microsoft documentation
- Explanations that teach key exam concepts
- Realistic scenarios that an Azure AI Engineer would face

�🇸 EVERYTHING IN ENGLISH - PROFESSIONAL QUALITY"""

        try:
            response = self.client.chat.completions.create(
                model='gpt-3.5-turbo',
                messages=[{'role': 'user', 'content': optimized_prompt}],
                temperature=0.1,  # Ultra-low for consistency
                max_tokens=4000
            )
            
            content = response.choices[0].message.content
            parsed_questions = self.parse_questions_from_response(content)
            
            # If no questions were parsed, create fallback questions
            if not parsed_questions:
                parsed_questions = self.create_fallback_questions(topic, num_questions)
            
            return {
                'success': True,
                'questions': parsed_questions,
                'total_questions': len(parsed_questions),
                'topic': topic,
                'enhanced_mode': True
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Error generating optimized questions: {str(e)}",
                'questions': [],
                'topic': topic
            }
    
    def parse_questions_from_response(self, content: str) -> List[Dict]:
        """Parse questions from AI response with enhanced accuracy"""
        questions = []
        
        # Enhanced regex pattern to capture questions
        question_pattern = r'QUESTION\s*(\d+):\s*(.*?)(?=QUESTION\s*\d+:|$)'
        matches = re.findall(question_pattern, content, re.DOTALL | re.IGNORECASE)
        
        for match in matches:
            question_num, question_content = match
            
            # Extract question text (before options)
            lines = question_content.strip().split('\n')
            question_text = lines[0].strip()
            
            # Extract options
            options = {}
            option_pattern = r'([ABCD])\)\s*(.*)'
            
            for line in lines:
                option_match = re.match(option_pattern, line.strip())
                if option_match:
                    letter, text = option_match.groups()
                    options[letter.lower()] = text.strip()
            
            # Extract correct answer
            correct_answer = None
            answer_pattern = r'CORRECT\s*ANSWER:\s*([ABCD])'
            answer_match = re.search(answer_pattern, question_content, re.IGNORECASE)
            if answer_match:
                correct_answer = answer_match.group(1).lower()
            
            # Extract explanation
            explanation = ""
            explanation_pattern = r'EXPLANATION:\s*(.*?)(?=QUESTION\s*\d+:|$)'
            explanation_match = re.search(explanation_pattern, question_content, re.DOTALL | re.IGNORECASE)
            if explanation_match:
                explanation = explanation_match.group(1).strip()
            
            if question_text and options and correct_answer and explanation:
                question_obj = {
                    'id': f'q_{hash(question_text)}_{question_num}',
                    'question': question_text,
                    'options': options,
                    'correctAnswer': correct_answer,
                    'explanation': explanation,
                    'number': int(question_num)
                }
                
                questions.append(question_obj)
                
                # Store for consistency validation
                self.validator.store_question_answer(
                    question_text, 
                    correct_answer, 
                    explanation
                )
        
        return questions
    
    def create_fallback_questions(self, topic: str, num_questions: int) -> List[Dict]:
        """Create fallback questions if parsing fails"""
        fallback_questions = []
        
        for i in range(num_questions):
            question = {
                'id': f'fallback_q_{i+1}_{hash(topic)}',
                'question': f'Which Azure service is most suitable for implementing {topic.lower()} solutions?',
                'options': {
                    'a': 'Azure Cognitive Services',
                    'b': 'Azure OpenAI Service', 
                    'c': 'Azure Machine Learning',
                    'd': 'Azure Bot Framework'
                },
                'correctAnswer': 'a',
                'explanation': f'Azure Cognitive Services provides pre-built AI capabilities that are ideal for {topic.lower()} implementations, offering quick deployment and reliable performance.',
                'number': i + 1
            }
            fallback_questions.append(question)
        
        return fallback_questions
    
    def test_question_consistency(self, topic: str, num_variations: int = 3) -> Dict:
        """Test consistency by generating multiple variations of same concept"""
        consistency_prompt = f"""Generate {num_variations} variations of questions on the same technical concept: {topic}

IMPORTANT: All questions must have the SAME conceptually correct answer, but formulated differently.

For each question, use this EXACT structure:

QUESTION [number]: [Variation of the question about {topic}]
A) [Option A]
B) [Option B] 
C) [Option C]

CORRECT ANSWER: [A/B/C] [Answer text]
KEY CONCEPT: [The central technical concept being tested]

CONSISTENCY RULES:
1. The central technical concept must be identical in all variations
2. The correct answer must be conceptually the same
3. Only change the question formulation, not the evaluated concept
4. Use official Microsoft Azure technical terminology"""

        try:
            response = self.client.chat.completions.create(
                model='gpt-3.5-turbo',
                messages=[{'role': 'user', 'content': consistency_prompt}],
                temperature=0.2,
                max_tokens=2000
            )
            
            return {
                'success': True,
                'content': response.choices[0].message.content,
                'topic': topic,
                'variations': num_variations
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Error in consistency test: {str(e)}",
                'topic': topic
            }


# Global instance for the service
_quiz_generator_instance = None

def get_quiz_generator(openai_client: OpenAI) -> AdvancedQuizGenerator:
    """Get or create quiz generator instance"""
    global _quiz_generator_instance
    if _quiz_generator_instance is None:
        _quiz_generator_instance = AdvancedQuizGenerator(openai_client)
    return _quiz_generator_instance