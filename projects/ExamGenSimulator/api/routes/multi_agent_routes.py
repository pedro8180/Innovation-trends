from fastapi import APIRouter
from services.question_generator_agent import hello
router = APIRouter()

@router.post("/generate")
async def call_dummy():

    return hello()