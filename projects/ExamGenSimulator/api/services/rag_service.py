from .rag_context import get_context as _get_context


class RAGService:
    @staticmethod
    def get_context():
        """Proxy to the centralized RAG/context provider."""
        return _get_context()