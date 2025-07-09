from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from dotenv import load_dotenv
import os
load_dotenv()

azure_openai_endpoint = os.getenv('AZURE_OPENAI_ENDPOINT')
azure_openai_key = os.getenv('AZURE_OPENAI_KEY')
deployment_name = os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME')
api_version = os.getenv('AZURE_OPENAI_VERSION')

class Utils:
    
    llm = AzureChatOpenAI(azure_endpoint=azure_openai_endpoint, 
                      api_key=azure_openai_key, 
                      api_version=api_version,
                      azure_deployment=deployment_name
                      )