"""
Centralized question parsing module.
Consolidates regex-based parsing of questions from text responses.
"""
import re
from typing import List, Dict, Optional


def parse_questions_from_text(content: str) -> List[Dict]:
    """
    Parse questions from text response containing numbered questions.
    
    Expects format like:
        1. Question text here?
        a) Option A
        b) Option B
        c) Option C
        d) Option D
        Correct answer: a
        Explanation: Why option A is correct...
        
    Args:
        content: Text content containing questions
        
    Returns:
        List of question dictionaries with fields:
        - id: unique question identifier
        - question: question text
        - options: dict of {letter: text}
        - correctAnswer: letter of correct answer
        - explanation: explanation text
        - number: question number in sequence
    """
    questions = []
    
    # Split by numbered questions (1. 2. 3. etc.)
    question_sections = re.split(r'\n\s*\d+\.\s*', content)
    
    for i, section in enumerate(question_sections[1:], 1):  # Skip first empty section
        lines = [line.strip() for line in section.split('\n') if line.strip()]
        
        if len(lines) < 5:  # Need question + at least 4 options minimum
            continue
            
        question_text = lines[0]
        options = {}
        correct_answer = None
        explanation = ""
        
        # Parse options (a, b, c, d with . or ) separator)
        for line in lines[1:]:
            option_match = re.match(r'^([a-d])[\.\)]\s*(.*)', line, re.IGNORECASE)
            if option_match:
                letter = option_match.group(1).lower()
                text = option_match.group(2)
                options[letter] = text
            elif 'correct answer:' in line.lower():
                answer_match = re.search(r'([a-d])[\.\)]', line, re.IGNORECASE)
                if answer_match:
                    correct_answer = answer_match.group(1).lower()
            elif 'explanation:' in line.lower():
                explanation = line.split(':', 1)[1].strip()
        
        # Only add if we have valid question with answers
        if question_text and len(options) >= 2 and correct_answer:
            questions.append({
                'id': f'q_{i}_{hash(question_text) % 10000}',
                'question': question_text,
                'options': options,
                'correctAnswer': correct_answer,
                'explanation': explanation or f"The correct answer is {correct_answer.upper()}.",
                'number': i
            })
    
    return questions


def format_question_for_response(question: Dict) -> Dict:
    """
    Format a parsed question dictionary for API response.
    Converts option dict to list format.
    
    Args:
        question: Question dict from parse_questions_from_text
        
    Returns:
        Question dict formatted for JSON response
    """
    # Convert options dict to list
    answers = [
        question['options'].get(letter, '')
        for letter in sorted(question['options'].keys())
    ]
    
    return {
        'id': question.get('id'),
        'question': question.get('question'),
        'answers': answers,
        'correct_answer': question.get('correctAnswer', 'unknown'),
        'explanation': question.get('explanation', ''),
        'number': question.get('number')
    }
