import os
import sys
import tempfile
from pathlib import Path

# Ensure api package root is on sys.path so 'services' can be imported when running this script
ROOT = str(Path(__file__).resolve().parents[1])
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from services.chat_memory import ChatMemory


def run():
    fd, dbpath = tempfile.mkstemp(suffix='.db')
    os.close(fd)
    passed = False
    try:
        store = ChatMemory(db_path=dbpath)

        chat_id = store.create_chat(name='test-chat')
        assert isinstance(chat_id, str) and len(chat_id) > 0

        chats = store.list_chats()
        ids = [c['id'] for c in chats]
        assert chat_id in ids

        store.add_message(chat_id, 'user', 'hello')
        store.add_message(chat_id, 'assistant', 'hi')

        messages = store.get_messages(chat_id)
        assert len(messages) == 2
        assert messages[0]['role'] == 'user'
        assert messages[0]['content'] == 'hello'

        store.delete_chat(chat_id)
        chats_after = store.list_chats()
        ids_after = [c['id'] for c in chats_after]
        assert chat_id not in ids_after

        passed = True
        print('TEST PASSED')
    except AssertionError as e:
        print('TEST FAILED', e)
        passed = False
    except Exception as e:
        print('TEST ERROR', e)
        passed = False
    finally:
        try:
            os.remove(dbpath)
        except Exception:
            pass

    return 0 if passed else 2


if __name__ == '__main__':
    sys.exit(run())
