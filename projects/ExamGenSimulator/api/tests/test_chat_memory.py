import os
import sys
import tempfile
from pathlib import Path

# Ensure api package root is on sys.path so 'services' can be imported
ROOT = str(Path(__file__).resolve().parent.parent)
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from services.chat_memory import ChatMemory


def test_create_list_get_delete_chat():
    # use a temp DB file so tests are isolated
    fd, dbpath = tempfile.mkstemp(suffix='.db')
    os.close(fd)

    try:
        store = ChatMemory(db_path=dbpath)

        # Create chat
        chat_id = store.create_chat(name='test-chat')
        assert isinstance(chat_id, str) and len(chat_id) > 0

        # List chats should include our chat
        chats = store.list_chats()
        ids = [c['id'] for c in chats]
        assert chat_id in ids

        # Add a message and fetch
        store.add_message(chat_id, 'user', 'hello')
        store.add_message(chat_id, 'assistant', 'hi')

        messages = store.get_messages(chat_id)
        assert len(messages) == 2
        assert messages[0]['role'] == 'user'
        assert messages[0]['content'] == 'hello'

        # Delete chat
        store.delete_chat(chat_id)
        chats_after = store.list_chats()
        ids_after = [c['id'] for c in chats_after]
        assert chat_id not in ids_after

    finally:
        try:
            os.remove(dbpath)
        except Exception:
            pass
import os
from services.chat_memory import ChatMemory


def test_create_add_get_delete():
    # Create a local test DB inside the tests folder
    tests_dir = os.path.dirname(__file__)
    tmp_db = os.path.join(tests_dir, 'test_chat_memory.db')
    # Ensure clean state
    if os.path.exists(tmp_db):
        os.remove(tmp_db)

    cm = ChatMemory(db_path=tmp_db)

    # Create chat
    chat_id = cm.create_chat()
    assert chat_id

    # Add messages
    cm.add_message(chat_id, 'user', 'hello world')
    cm.add_message(chat_id, 'assistant', 'hi there')

    # Retrieve messages
    msgs = cm.get_messages(chat_id)
    assert len(msgs) == 2
    assert msgs[0]['role'] == 'user'
    assert 'hello' in msgs[0]['content']

    # List chats and ensure the chat exists
    chats = cm.list_chats()
    assert any(c['id'] == chat_id for c in chats)

    # Delete chat and ensure it's removed
    cm.delete_chat(chat_id)
    chats_after = cm.list_chats()
    assert all(c['id'] != chat_id for c in chats_after)

    # Cleanup
    if os.path.exists(tmp_db):
        os.remove(tmp_db)
