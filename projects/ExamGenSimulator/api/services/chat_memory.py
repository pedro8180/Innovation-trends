"""Simple SQLite-backed chat memory for persisting chats and messages.

This provides:
- create_chat(name) -> chat_id
- list_chats() -> [{id,name,created_at}]
- add_message(chat_id, role, content, timestamp)
- get_messages(chat_id) -> [{id,role,content,timestamp}]
- delete_chat(chat_id)

By default the DB file is created next to this module as `chat_memory.db`.
"""
import sqlite3
from pathlib import Path
from typing import List, Dict, Optional
import uuid
from datetime import datetime


class ChatMemory:
    def __init__(self, db_path: Optional[str] = None):
        base = Path(__file__).parent
        self.db_path = db_path or str(base / 'chat_memory.db')
        self._init_db()

    def _get_conn(self):
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        # Enable useful pragmas for better safety and concurrency
        try:
            conn.execute('PRAGMA foreign_keys = ON')
            conn.execute('PRAGMA journal_mode = WAL')
            conn.execute('PRAGMA synchronous = NORMAL')
        except Exception:
            # Some environments may not support all pragmas; ignore failures
            pass
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS chats (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    created_at TEXT
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id TEXT,
                    role TEXT,
                    content TEXT,
                    timestamp TEXT,
                    FOREIGN KEY(chat_id) REFERENCES chats(id)
                )
                """
            )
            # Add an index to speed up message lookups by chat_id
            cur.execute("CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)")
            conn.commit()

    def create_chat(self, name: Optional[str] = None) -> str:
        chat_id = str(uuid.uuid4())
        name = name or f"chat-{chat_id[:8]}"
        ts = datetime.utcnow().isoformat()
        with self._get_conn() as conn:
            cur = conn.cursor()
            cur.execute("INSERT INTO chats (id, name, created_at) VALUES (?, ?, ?)", (chat_id, name, ts))
            conn.commit()
        return chat_id

    def list_chats(self) -> List[Dict]:
        with self._get_conn() as conn:
            cur = conn.cursor()
            cur.execute("SELECT id, name, created_at FROM chats ORDER BY created_at DESC")
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def add_message(self, chat_id: str, role: str, content: str, timestamp: Optional[str] = None):
        timestamp = timestamp or datetime.utcnow().isoformat()
        with self._get_conn() as conn:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO messages (chat_id, role, content, timestamp) VALUES (?, ?, ?, ?)",
                (chat_id, role, content, timestamp)
            )
            conn.commit()

    def get_messages(self, chat_id: str) -> List[Dict]:
        with self._get_conn() as conn:
            cur = conn.cursor()
            cur.execute(
                "SELECT id, role, content, timestamp FROM messages WHERE chat_id = ? ORDER BY id ASC",
                (chat_id,)
            )
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def delete_chat(self, chat_id: str):
        with self._get_conn() as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM messages WHERE chat_id = ?", (chat_id,))
            cur.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
            conn.commit()
