from fastapi import APIRouter
from services.supervisor_agent import SupervisorAgent
from services.question_generator_agent import QuestionGeneratorAgent
from models.query import Query
router = APIRouter()

@router.post("/agents")
async def call_supervisor_agent(request: Query):

    agent = QuestionGeneratorAgent.get_question_generator_agent() #SupervisorAgent.create_supervisor_agent()

    #query = "Give me a set of questions for practicing for my certification exam."

    messages = {"messages": [{"role":"user", "content": request.query}]}

    response = agent.invoke(messages)

    formatted_response = response['structured_response']
    
    return formatted_response