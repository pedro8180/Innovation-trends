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

    # Try to create the question generation agent, but tolerate failures
    # If the langchain API changed or the helper cannot be imported, we
    # will proceed without the sub-agent and fall back to the LLM.
    if question_gen_agent is None:
        try:
            question_gen_agent = create_question_generator_agent(llm=llm)
        except Exception as e:
            print(f"Warning: failed to create question generator agent: {e}")
            question_gen_agent = None

    agents = [question_gen_agent] if question_gen_agent else []

    prompt_text = (
        "You're a supervisor agent that handles other agents. "
        "Your job is to understand the user query and, when available, delegate to sub-agents. "
        "If no sub-agent is available, provide a helpful, concise response using your LLM knowledge."
    )

    workflow = create_supervisor(
        agents=agents,
        model=llm,
        output_mode='last_message',
        prompt=prompt_text
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
