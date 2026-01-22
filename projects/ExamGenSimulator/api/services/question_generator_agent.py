from typing import Optional, List, Any
from langchain_openai import AzureChatOpenAI
from langchain_core.tools import BaseTool
from utils.custom_prompts import CustomPrompts
from utils.clients import Utils
from .tools import AgentTools
from models.response import QuestionAgentResponse


def _import_agent_helpers():
    """Deferred imports for langchain-related helpers.

    This avoids import-time failures when the installed langchain API
    differs from the one expected at development time.
    """
    # Try the primary langchain import first, then fall back to langgraph
    try:
        from langchain.agents import create_agent
    except Exception:
        try:
            from langgraph.prebuilt import create_agent
        except Exception:
            create_agent = None

    try:
        from langchain_core.tools import BaseTool
    except Exception:
        BaseTool = object

    return create_agent, BaseTool


def create_question_generator_agent(
    llm: Optional[AzureChatOpenAI] = None,
    prompt: Optional[str] = None,
    tools: Optional[List[Any]] = None
):
    """
    Create a question generator agent with optional dependency injection.
    
    Args:
        llm: Azure OpenAI LLM instance (defaults to Utils.get_llm())
        prompt: Custom prompt string (defaults to CustomPrompts.question_generator_prompt)
        tools: List of tools for the agent (defaults to AgentTools.rag_tool)
    
    Returns:
        A LangGraph agent instance
    """
    # Deferred import of langchain helpers
    create_agent_func, BaseTool = _import_agent_helpers()

    if create_agent_func is None:
        raise ImportError(
            "No compatible `create_agent` factory found. Install a supported langchain/langgraph package or adapt the factory."
        )

    # Use provided or default dependencies
    if llm is None:
        llm = Utils.get_llm()
    if prompt is None:
        prompt = CustomPrompts.question_generator_prompt
    if tools is None:
        tools = [AgentTools.rag_tool]

    agent = create_agent_func(
        model=llm,
        response_format=QuestionAgentResponse,
        tools=tools,
        name="questions_generator_agent",
        system_prompt=prompt
    )
    return agent


def get_question_generator_agent():
    """Factory function for backwards compatibility."""
    return create_question_generator_agent()


class QuestionGeneratorAgent:
    """Deprecated: Use create_question_generator_agent() instead."""

    @staticmethod
    def create_questions_gen_agent():
        return create_question_generator_agent()

    @staticmethod
    def get_question_generator_agent():
        return get_question_generator_agent()



