from langgraph_supervisor import create_supervisor
from typing import Optional
from langchain_openai import AzureChatOpenAI
from .question_generator_agent import create_question_generator_agent
from utils.clients import Utils


def create_supervisor_agent(
    question_gen_agent=None,
    llm: Optional[AzureChatOpenAI] = None
):
    """
    Create a supervisor agent with optional dependency injection.
    
    Args:
        question_gen_agent: Pre-built question generator agent (creates one if not provided)
        llm: Azure OpenAI LLM instance (defaults to Utils.get_llm())
    
    Returns:
        A compiled LangGraph supervisor agent
    """
    if llm is None:
        llm = Utils.get_llm()
    
    if question_gen_agent is None:
        question_gen_agent = create_question_generator_agent(llm=llm)

    workflow = create_supervisor(
        agents=[question_gen_agent],
        model=llm,
        output_mode='last_message',
        prompt=(
            "You're a supervisor agent that handles other agents. "
            "Your job is to understand user query and handoff to the right sub agent for doing the job. "
            "Here is the list of agents: question_gen_agent. "
            "For any query related to: "
            "- Generate practice exam "
            "- Generate practice questions "
            "Please handoff to the question_gen_agent. "
            "Before returning your final answer, use the output from your sub agents to construct your final response."
        )
    )

    app = workflow.compile(name="supervisor_agent")
    return app


def get_supervisor_agent():
    """Factory function for backwards compatibility."""
    return create_supervisor_agent()


class SupervisorAgent:
    """Deprecated: Use create_supervisor_agent() instead."""

    @staticmethod
    def create_supervisor_agent():
        return create_supervisor_agent()
