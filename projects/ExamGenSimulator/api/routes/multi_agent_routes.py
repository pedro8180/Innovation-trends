from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from services.supervisor_agent import SupervisorAgent
from services.question_generator_agent import QuestionGeneratorAgent
from services.advanced_quiz_service import get_quiz_generator
from services.question_parser import parse_questions_from_text
from models.query import Query
from utils.clients import Utils
from services.chat_memory import ChatMemory
import re
import os
import traceback
import json


# Simple persistent chat store (SQLite)
chat_store = ChatMemory()

router = APIRouter()

@router.post("/agents")
async def call_agent(request: Query):
    try:
        # If a chat_id is provided, persist the incoming user message
        if getattr(request, 'chat_id', None):
            try:
                chat_store.add_message(request.chat_id, 'user', request.query)
            except Exception:
                # don't fail the whole request if persistence fails
                print('Warning: failed to persist user message')
        # Check if the query is asking for practice questions
        query_lower = request.query.lower()
        question_keywords = ['question', 'practice', 'exam', 'quiz', 'module', 'ai-102', 'certification']
        
        is_quiz_request = any(keyword in query_lower for keyword in question_keywords)
        
        if is_quiz_request:
            try:
                # Extract topic and module number from query
                topic = "AI-102 Practice"
                module_number = 2  # Default
                
                # Try to extract module number
                module_match = re.search(r'module\s*(\d+)', query_lower)
                if module_match:
                    module_number = int(module_match.group(1))
                
                # Extract number of questions
                num_questions = 3  # Default
                num_match = re.search(r'(\d+)\s*question', query_lower)
                if num_match:
                    num_questions = int(num_match.group(1))
                
                # Get quiz generator (now using Azure OpenAI)
                quiz_generator = get_quiz_generator()
                
                # Generate questions using advanced service
                quiz_result = quiz_generator.generate_ultra_optimized_questions(
                    topic=f"Module {module_number} - {topic}",
                    num_questions=num_questions,
                    module_number=module_number
                )

                # Handle client-side limit exceeded responses
                if quiz_result.get('limit_exceeded'):
                    response_payload = {
                        "type": "limit_exceeded",
                        "message": quiz_result.get('message'),
                        "requested": quiz_result.get('requested'),
                        "max_allowed": quiz_result.get('max_allowed')
                    }

                    if getattr(request, 'chat_id', None):
                        try:
                            chat_store.add_message(request.chat_id, 'assistant', json.dumps(response_payload))
                        except Exception:
                            print('Warning: failed to persist assistant message')

                    return JSONResponse(content=response_payload)

                if quiz_result.get('success') and quiz_result.get('questions'):
                    # Debug log first question's explanation
                    if quiz_result['questions']:
                        first_q = quiz_result['questions'][0]
                        print("\nDEBUG - First Question Explanation:")
                        print(f"Structured: {first_q.get('explanationStructured', {})}")
                        print(f"Formatted: {first_q.get('explanation', '')}\n")

                    response_payload = {
                        "type": "quiz",
                        "questions": quiz_result['questions'],
                        "total_questions": len(quiz_result['questions']),
                        "module_number": module_number,
                        "module_name": f"AI-102 Module {module_number}",
                        "message": f"Here are {len(quiz_result['questions'])} practice questions for Module {module_number}"
                    }

                    # Persist assistant response into chat history if chat_id provided
                    if getattr(request, 'chat_id', None):
                        try:
                            chat_store.add_message(request.chat_id, 'assistant', json.dumps(response_payload))
                        except Exception:
                            print('Warning: failed to persist assistant message')

                    return JSONResponse(content=response_payload)
                else:
                    error_msg = quiz_result.get('error', 'Failed to generate questions')
                    print(f"Quiz generation failed: {error_msg}")
                    print(traceback.format_exc())
                    raise HTTPException(status_code=500, detail=error_msg)
            except Exception as e:
                error_msg = f"Error in quiz generation: {str(e)}"
                print(error_msg)
                print(traceback.format_exc())
                raise HTTPException(status_code=500, detail=error_msg)
        else:
            # Use supervisor agent for non-quiz requests
            return await use_supervisor_agent(request)
    except Exception as e:
        print(f"Error in call_agent: {str(e)}")
        print(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "detail": "An error occurred processing your request"}
        )

async def use_supervisor_agent(request: Query):
    """Fallback to use the supervisor agent"""
    try:
        agent = SupervisorAgent.create_supervisor_agent()
        messages = {"messages": [{"role": "user", "content": request.query}]}
        response = agent.invoke(messages)

        # Parse text response if it contains quiz questions
        content = response['messages'][-1].content
        print(f"Supervisor Agent Response: {content}")
        parsed_questions = parse_questions_from_text(content)

        if parsed_questions:
            return {
                "type": "quiz",
                "questions": parsed_questions,
                "total_questions": len(parsed_questions),
                "module_number": 2,
                "module_name": "AI-102 Practice Questions"
            }

        # Return as regular text response
        return content
    except Exception as e:
        # Fallback: use LLM directly to produce a simple text response
        try:
            llm = Utils.get_llm()
            llm_messages = {"messages": [{"role": "user", "content": request.query}]}
            llm_response = llm.invoke(llm_messages)
            # If invoke returns object with content, try to extract
            if isinstance(llm_response, dict) and llm_response.get('content'):
                content = llm_response.get('content')
            else:
                # Some clients return an object with .content
                content = getattr(llm_response, 'content', str(llm_response))
            parsed_questions = parse_questions_from_text(content)
            if parsed_questions:
                return {
                    "type": "quiz",
                    "questions": parsed_questions,
                    "total_questions": len(parsed_questions),
                    "module_number": 2,
                    "module_name": "AI-102 Practice Questions"
                }
            return content
        except Exception as inner_e:
            print(f"Supervisor fallback error: {inner_e}")
            raise


@router.post('/agents/chats')
async def create_chat(name: str = None):
    """Create a new chat and return the chat_id"""
    chat_id = chat_store.create_chat(name=name)
    return {"chat_id": chat_id}


@router.get('/agents/chats')
async def list_chats():
    return chat_store.list_chats()


@router.get('/agents/chats/{chat_id}')
async def get_chat(chat_id: str):
    messages = chat_store.get_messages(chat_id)
    if messages is None:
        raise HTTPException(status_code=404, detail='Chat not found')
    return {"chat_id": chat_id, "messages": messages}


@router.delete('/agents/chats/{chat_id}')
async def delete_chat(chat_id: str):
    chat_store.delete_chat(chat_id)
    return {"deleted": True, "chat_id": chat_id}