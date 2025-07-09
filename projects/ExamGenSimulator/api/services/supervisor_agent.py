from langgraph_supervisor import create_supervisor
from .question_generator_agent import QuestionGeneratorAgent
from utils.clients import Utils

llm = Utils.llm

class SupervisorAgent:

    def create_supervisor_agent():
        
        question_gen_agent = QuestionGeneratorAgent.get_question_generator_agent()

        workflow = create_supervisor(
            agents=[question_gen_agent],
            model = llm,
            output_mode='last_message',
            prompt = "You're a supervisor agent that handles other agents." \
            "Your job is to understand user query and handoff to the right sub agent for doing the job" \
            "Here is the list of agents: question_gen_agent" \
            "For any query related to " \
            "- Generate practice exam" \
            "- Generate practice questions" \
            "Please handoff to the question_gen_agent." \
            "Before returning your final answer, use the output form your sub agents to construct your final response."
        )

        app = workflow.compile(name="supervisor_agent")
        return app