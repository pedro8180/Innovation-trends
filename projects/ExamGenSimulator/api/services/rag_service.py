from .rag_context import get_context as _get_context
from langchain_community.vectorstores.azuresearch import AzureSearch
from langchain_openai import AzureOpenAIEmbeddings
from dotenv import load_dotenv
import os

# create RAGService class
# one agent with tools... it searchs context in the index
# decides best context
# format context
# return s json object to next agent

class RAGService:
    #@staticmethod
    #def get_context():
    #    """Proxy to the centralized RAG/context provider."""
    #    return _get_context()
    def __init__(
        self,
        index_name = "exam-simulator-idx"
    ):
        self.index_name = index_name
        self.embeddings = AzureOpenAIEmbeddings(azure_deployment = "", 
                                                azure_endpoint= "",
                                                api_key = "",
                                                openai_api_version = ""
                                                )

    def get_context_from_index(self):
        "Searchs for info in the Azure AI Index"

