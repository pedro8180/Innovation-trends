from langchain_core.tools import tool
from .rag_context import get_context


class AgentTools:

    @tool
    def rag_tool():
        """Return the centralized RAG/context text to agents."""

        return get_context()