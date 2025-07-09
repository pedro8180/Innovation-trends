from langgraph.prebuilt import create_react_agent
from utils.custom_prompts import CustomPrompts
from utils.clients import Utils
from .tools import AgentTools
from models.response import QuestionAgentResponse


llm = Utils.llm
prompt = CustomPrompts.question_generator_prompt
tools = AgentTools.rag_tool

class QuestionGeneratorAgent:
    
    def create_questions_gen_agent():
        agent = create_react_agent(
            model = llm,
            response_format=QuestionAgentResponse,
            tools = [tools],
            name = "questions_generator_agent",
            prompt = prompt
        )
        return agent

    def get_question_generator_agent():
        return QuestionGeneratorAgent.create_questions_gen_agent()


