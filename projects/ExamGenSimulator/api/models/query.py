from pydantic import BaseModel
from typing import List, Optional

class Query(BaseModel):
    query: str
    # Optional chat identifier to load/save persistent chat history
    chat_id: Optional[str] = None
    