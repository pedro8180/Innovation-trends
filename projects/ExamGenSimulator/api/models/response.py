from pydantic import BaseModel
from typing import List

class QuestionAgentResponse(BaseModel):
    questions: List[str]
    answers: List[str]