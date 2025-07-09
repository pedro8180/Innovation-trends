from langgraph.prebuilt import create_react_agent
from utils.clients import Utils

llm = Utils.llm

def hello():
    print('Hello world!')
    return "hello world"


