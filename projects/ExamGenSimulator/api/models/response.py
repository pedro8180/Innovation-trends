from pydantic import BaseModel, Field
from typing import List

class QuestionAnswer(BaseModel):
    question: str
    answers: List[str]
    correct_answer: str
    explanation: str

class QuestionAgentResponse(BaseModel):
    response: List[QuestionAnswer]