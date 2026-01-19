# Chat memory (SQLite) — quick notes

This module implements a simple SQLite-backed chat store used for testing and local development.

Location
- `api/services/chat_memory.py` — ChatMemory class.

Basic endpoints (in `api/routes/multi_agent_routes.py`)
- POST `/agents/chats` — create a new chat (returns `{"chat_id": "..."}`)
- GET `/agents/chats` — list chats
- GET `/agents/chats/{chat_id}` — get messages for a chat
- DELETE `/agents/chats/{chat_id}` — delete a chat and its messages

Notes
- Messages are stored verbatim. For production you may want to:
  - enforce size limits, truncate or summarize long messages,
  - encrypt or otherwise protect stored content,
  - add a user identifier to scope chats to users.

Testing
- A pytest is provided at `api/tests/test_chat_memory.py`.
