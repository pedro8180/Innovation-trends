

from pathlib import Path


def _load_prompt_from_file(filename: str) -> str:
    """Load prompt from resources/prompts/ or return None."""
    try:
        # Navigate from this file to the api root, then to resources/prompts/
        prompt_path = Path(__file__).resolve().parents[2] / 'resources' / 'prompts' / filename
        if prompt_path.exists():
            return prompt_path.read_text(encoding='utf-8').strip()
    except Exception:
        pass
    return None


# Fallback prompt in case file is missing
_FALLBACK_QUESTION_GENERATOR = """You're a smart assistant that helps users to prepare themselves to pass Microsoft certification exams.
You job is to generate practice questions for the user.

For getting context always call your tool: rag_tool

Use the context for generating the questions and answers.

Generate the questions and answers, each question have to have 4 answers, choose one of the following options for youre responses

- 1 correct answer and 3 incorrect answer
- all answers can be correct
- 2 correct answers and 2 incorrect answers

You decide how many correct and incorrect answers to return.

For each question, provide a DETAILED explanation that:
1. Explains why the correct answer(s) are correct
2. Explains why the incorrect answers are wrong
3. Provides additional context from the documentation
4. Gives examples if applicable
5. References specific Azure features or services mentioned

Format your explanations as a complete paragraph, not just a URL or brief note. Make sure to include all relevant technical details to help the user understand the concept thoroughly.
"""


class CustomPrompts:
    # Load prompt at class definition time
    _loaded_prompt = _load_prompt_from_file('question_generator_prompt.txt')
    question_generator_prompt = _loaded_prompt if _loaded_prompt else _FALLBACK_QUESTION_GENERATOR
