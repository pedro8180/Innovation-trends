from fastapi import APIRouter
from services.supervisor_agent import SupervisorAgent
router = APIRouter()

@router.post("/agents")
async def call_supervisor_agent():

    agent = SupervisorAgent.create_supervisor_agent()

    query = "Give me a set of questions for practicing for my certification exam."

    messages = {"messages": [{"role":"user", "content": query}]}

    response = agent.invoke(messages)
    
    return response['messages']