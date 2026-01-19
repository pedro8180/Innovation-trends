"""
Advanced Quiz Generation Service
Migrated from agent_cert.ipynb with enhanced consistency validation
"""
import json
import re
import hashlib
from typing import Dict, List, Optional, Any
from langchain_openai import AzureChatOpenAI
from dotenv import load_dotenv
import os

load_dotenv()

azure_endpoint = os.getenv('AZURE_OPENAI_ENDPOINT')
azure_api_key = os.getenv('AZURE_OPENAI_API_KEY')
deployment_name = os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME')
api_version = os.getenv('AZURE_OPENAI_API_VERSION')

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
    
    def __init__(self, azure_openai_client: AzureChatOpenAI):
        self.client = azure_openai_client
        self.validator = ConsistencyValidator()
        self.consistency_keywords = [
            "Azure OpenAI Service", "Cognitive Services", "Computer Vision API",
            "Speech Services", "Language Understanding", "LUIS", "Custom Vision",
            "Form Recognizer", "Text Analytics", "Translator", "Bot Framework"
        ]
        
        # Initialize Azure OpenAI client with environment variables
        self.azure_client = AzureChatOpenAI(
            azure_endpoint=azure_endpoint,
            api_key=azure_api_key,
            api_version=api_version,
            deployment_name=deployment_name,
            model_name="gpt-4",
            temperature=0.7
        )
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
    
    def get_module_content(self, course_data: Dict, module_number: int) -> Optional[Dict]:
        """Get specific content for a module"""
        if not course_data or 'modules' not in course_data:
            return None
        
        modules = course_data['modules']
        if module_number <= len(modules):
            return modules[module_number - 1]  # Convert to 0-based index
        
        return None
    
    def generate_ultra_optimized_questions(self, topic: str, num_questions: int = 5, module_number: int = 1) -> Dict:
        """Generate ultra-optimized questions with advanced consistency"""
        course_data = self.load_course_data()
        
        # Get module-specific content
        module_content = self.get_module_content(course_data, module_number)
        
        # Build enhanced context with module-specific information
        context_parts = [
            f"TOPIC: {topic}",
            f"MODULE NUMBER: {module_number}",
            f"CERTIFICATION: Microsoft AI-102",
            f"🎯 TERMINOLOGÍA CONSISTENTE OBLIGATORIA:",
            ', '.join(self.consistency_keywords[:10])
        ]
        
        if module_content:
            context_parts.append(f"\n📚 MÓDULO {module_number} ESPECÍFICO:")
            context_parts.append(f"Nombre: {module_content['name']}")
            if 'units' in module_content:
                context_parts.append("Unidades principales:")
                for unit in module_content['units'][:3]:  # Show first 3 units
                    context_parts.append(f"  • {unit.get('name', 'Unit')}")
                    if 'topics' in unit and unit['topics']:
                        # Show first 2 topics of each unit
                        for topic_item in unit['topics'][:2]:
                            context_parts.append(f"    - {topic_item.get('name', 'Topic')}")
        
        context_parts.extend([
            f"\n🏆 ÁREAS DE MÁXIMO ENFOQUE PARA MÓDULO {module_number}:",
            '\n'.join([f"• {area}" for area in self.focus_areas[:3]]),
            f"\n💡 TIPS DE EXAMEN APLICABLES:",
            '\n'.join([f"• {tip}" for tip in self.exam_tips])
        ])
        
        full_context = "\n".join(context_parts)
        
        # Ultra-optimized prompt for English content with module-specific focus
        optimized_prompt = f"""You are an expert specialized in Microsoft AI-102 certifications with access to official documentation.

🚀 ENHANCED CONTEXT:
{full_context}

🎯 CRITICAL REQUIREMENT: Generate questions SPECIFICALLY for MODULE {module_number} content only.
Questions must focus EXCLUSIVELY on the topics, units, and concepts listed above for this specific module.
Do NOT generate generic questions - they must be directly related to Module {module_number} learning objectives.

📝 GENERATE EXACTLY {num_questions} QUESTIONS following this EXACT structure:

QUESTION [number]: [Real-world scenario question about MODULE {module_number} topics using official terminology]
A) [Option A - use consistent terminology]
B) [Option B - use consistent terminology]  
C) [Option C - use consistent terminology]
D) [Option D - use consistent terminology]

CORRECT ANSWER: [A/B/C/D]

EXPLANATION:
[2-3 sentences explaining the core technical concept and why the correct answer is right]
[2-3 sentences on how this concept applies in Module {module_number}]
[1-2 sentences explaining why each of the other options are incorrect]
[1-2 sentences on best practices or real-world application]
[Final sentence connecting to Azure architecture or certification exam requirements]

DOCUMENTATION LINK: [Specific Microsoft Learn URL directly related to this question]

⚠️ CRITICAL: Each EXPLANATION must be COMPREHENSIVE and EDUCATIONAL - minimum 5-7 sentences per question. Teach the concept thoroughly. Include technical details. Do NOT provide brief, generic, or one-liner explanations.

🔥 ULTRA-STRICT RULES:
1. Questions must be SPECIFICALLY about Module {module_number} content
2. USE ONLY terminology from the provided official list
3. ALL questions must be verifiable against Microsoft documentation
4. MAINTAIN absolute consistency in Azure service names
5. Explanations must reference Module {module_number} specific learning objectives
6. Each question must exactly simulate the real AI-102 exam for this module

⚡ MODULE-SPECIFIC DISTRIBUTION:
• 40% Technical implementation specific to Module {module_number}
• 35% Setup and configuration relevant to Module {module_number}
• 25% Concepts and best practices from Module {module_number}

🌟 ULTRA-PREMIUM QUALITY:
- Difficulty level: Intermediate-Advanced (like the real exam)
- Answers based ONLY on official Microsoft documentation for Module {module_number}
- Explanations that teach key exam concepts from this specific module
- Realistic scenarios that an Azure AI Engineer would face in Module {module_number}

🇺🇸 EVERYTHING IN ENGLISH - PROFESSIONAL QUALITY"""

        try:
            # Use invoke for chat completions
            messages = [{"role": "user", "content": optimized_prompt}]
            response = self.azure_client.invoke(messages)
            
            # Extract content from the AIMessage response
            content = response.content
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
        """Parse questions from AI response with enhanced accuracy and detailed explanations"""
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
            
            # Extract comprehensive explanation section
            explanation_text = ""
            explanation_pattern = r'EXPLANATION:\s*(.*?)(?=DOCUMENTATION LINK:|$)'
            explanation_match = re.search(explanation_pattern, question_content, re.DOTALL | re.IGNORECASE)
            if explanation_match:
                explanation_text = explanation_match.group(1).strip()
            
            # Extract documentation link
            doc_link = ""
            doc_pattern = r'DOCUMENTATION LINK:\s*(.*?)(?=QUESTION|$)'
            doc_match = re.search(doc_pattern, question_content, re.DOTALL | re.IGNORECASE)
            if doc_match:
                doc_link = doc_match.group(1).strip()
            
            if question_text and options and correct_answer:
                # Use the explanation from AI if it's substantial, otherwise generate detailed fallback
                if explanation_text and len(explanation_text) > 100:
                    formatted_explanation = explanation_text
                    if doc_link and 'learn.microsoft.com' in doc_link:
                        formatted_explanation = f"{explanation_text}\n\n📚 Further Learning:\n{doc_link}"
                else:
                    # Generate a detailed, educational explanation
                    formatted_explanation = self._create_detailed_explanation(
                        question_text, 
                        options, 
                        correct_answer,
                        doc_link
                    )
                
                question_obj = {
                    'id': f'q_{hash(question_text)}_{question_num}',
                    'question': question_text,
                    'options': options,
                    'correctAnswer': correct_answer,
                    'explanation': formatted_explanation,
                    'number': int(question_num)
                }
                
                questions.append(question_obj)
                
                # Store for consistency validation
                self.validator.store_question_answer(
                    question_text, 
                    correct_answer, 
                    formatted_explanation
                )
        
        return questions
    
    def create_fallback_questions(self, topic: str, num_questions: int) -> List[Dict]:
        """Create fallback questions if parsing fails"""
        try:
            # Try to generate simple questions using Azure OpenAI
            messages = [{"role": "system", "content": "You are an Azure certification expert."},
                       {"role": "user", "content": f"Generate {num_questions} simple questions about {topic} for Azure certification preparation."}]
            
            response = self.azure_client.invoke(messages)
            if response:
                # Parse the response and convert to questions format
                questions = self.parse_questions_from_response(response.content)
                if questions:
                    return questions
                    
        except Exception as e:
            print(f"Error generating fallback questions with Azure OpenAI: {str(e)}")
            
        # If Azure OpenAI fails, use static fallback questions
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
                'explanation': {
                    'result': 'Correct!',
                    'explanation': f'Azure Cognitive Services is the recommended solution for {topic.lower()}, providing pre-built AI models for quick deployment. These services offer ready-to-use capabilities with pay-as-you-go pricing and enterprise-grade security, significantly reducing development time.',
                    'source': 'https://learn.microsoft.com/en-us/azure/cognitive-services/'
                },
                'number': i + 1
            }
            fallback_questions.append(question)
        
        return fallback_questions
    
    def _create_detailed_explanation(self, question: str, options: Dict, correct_answer: str, doc_link: str = "") -> str:
        """
        Create a detailed, educational explanation with HTML formatting.
        Detailed for correct answer, brief for incorrect options.
        Includes styled button link for documentation.
        """
        correct_option_text = options.get(correct_answer, "")
        incorrect_options = {k: v for k, v in options.items() if k != correct_answer}
        
        explanation_parts = []
        
        # Part 1: Why the correct answer is right (detailed with formatting)
        explanation_parts.append(
            f"<div class='explanation-section'>"
            f"<strong>✓ {correct_answer.upper()}) {correct_option_text}</strong><br/><br/>"
            f"This is the best answer because it <strong>directly addresses the core technical requirement</strong> posed by the question. "
            f"In the context of Azure services and AI-102 certification, this option represents the <strong>most appropriate service</strong>, "
            f"configuration, or approach for the scenario described. It aligns with <strong>Microsoft's architectural best practices</strong> "
            f"and delivers <strong>optimal performance, scalability, and cost-effectiveness</strong> for the given use case."
            f"</div>"
        )
        
        # Part 2: Why other options are incorrect (brief)
        explanation_parts.append("<div class='explanation-section'><strong>✗ Incorrect Options:</strong>")
        for letter, text in sorted(incorrect_options.items()):
            explanation_parts.append(f"<br/>• <strong>{letter.upper()})</strong> {text} — Does not meet the requirements for this scenario.")
        explanation_parts.append("</div>")
        
        # Part 3: Best Practices
        explanation_parts.append(
            f"<div class='explanation-section'>"
            f"<strong>⭐ Best Practice:</strong><br/>"
            f"Always <strong>evaluate the specific requirements</strong> (performance, scale, security, compliance) before selecting a service. "
            f"Each Azure service is engineered for <strong>specific use cases</strong>. Choosing the correct service impacts "
            f"<strong>scalability, costs, security, and long-term maintainability</strong>."
            f"</div>"
        )
        
        # Part 4: Documentation link as styled button
        if doc_link and 'learn.microsoft.com' in doc_link:
            explanation_parts.append(
                f"<div class='explanation-button-container'>"
                f"<a href='{doc_link}' target='_blank' rel='noopener noreferrer' class='explanation-btn'>"
                f"📚 Learn More in Microsoft Docs</a>"
                f"</div>"
            )
        
        return "".join(explanation_parts)
    
        """Test consistency by generating multiple variations of same concept"""
        consistency_prompt = f"""Generate {num_variations} variations of questions on the same technical concept: {topic}

IMPORTANT: All questions must have the SAME conceptually correct answer, but formulated differently.

For each question, use this EXACT structure:

QUESTION [number]: [Variation of the question about {topic}]
A) [Option A]
B) [Option B] 
C) [Option C]

CORRECT ANSWER: [A/B/C] [Answer text]

EXPLANATION:
[Core Concept]: The central technical concept being tested
[Technical Details]: Technical implementation and configuration details
[Common Misconceptions]: Why other options are incorrect
[Real-world Application]: Practical use case example
[Key Learning Points]:
• Point 1 - Main technical principle
• Point 2 - Best practice consideration
• Point 3 - Integration with other services
[Documentation Reference]: Official Microsoft documentation link

CONSISTENCY RULES:
1. The central technical concept must be identical in all variations
2. The correct answer must be conceptually the same
3. Only change the question formulation, not the evaluated concept
4. Use official Microsoft Azure technical terminology"""

        try:
            response = self.client.chat.completions.create(
                model='gpt-4',
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

def get_quiz_generator() -> AdvancedQuizGenerator:
    """Get or create quiz generator instance"""
    global _quiz_generator_instance
    try:
        if _quiz_generator_instance is None:
            if not all([azure_endpoint, azure_api_key, api_version, deployment_name]):
                raise ValueError("Missing required Azure OpenAI configuration")
                
            client = AzureChatOpenAI(
                azure_endpoint=azure_endpoint,
                api_key=azure_api_key,
                api_version=api_version,
                azure_deployment=deployment_name,
                temperature=0.7
            )
            _quiz_generator_instance = AdvancedQuizGenerator(client)
        return _quiz_generator_instance
    except Exception as e:
        raise ValueError(f"Failed to initialize quiz generator: {str(e)}")