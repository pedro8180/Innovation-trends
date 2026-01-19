import os
import sys
from pathlib import Path

# Ensure api package root is on sys.path so 'services' can be imported when running this script
ROOT = str(Path(__file__).resolve().parents[1])
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from services.chat_memory import ChatMemory


def main():
    tests_dir = os.path.dirname(__file__)
    tmp_db = os.path.join(tests_dir, 'tmp_test_chat_memory.db')
    if os.path.exists(tmp_db):
        try:
            os.remove(tmp_db)
        except Exception:
            pass

    exit_code = 2
    try:
        cm = ChatMemory(db_path=tmp_db)
        chat_id = cm.create_chat()
        if not chat_id:
            print('FAILED: create_chat returned empty id')
            return 2

        cm.add_message(chat_id, 'user', 'hello world')
        cm.add_message(chat_id, 'assistant', 'hi there')

        msgs = cm.get_messages(chat_id)
        if len(msgs) != 2:
            print('FAILED: expected 2 messages, got', len(msgs))
            return 2

        if msgs[0]['role'] != 'user' or 'hello' not in msgs[0]['content']:
            print('FAILED: message content mismatch', msgs)
            return 2

        cm.delete_chat(chat_id)
        chats_after = cm.list_chats()
        if any(c['id'] == chat_id for c in chats_after):
            print('FAILED: chat not deleted')
            return 2

        print('PASS')
        exit_code = 0
    except Exception as e:
        print('ERROR', e)
        exit_code = 2
    finally:
        # Try removing DB file; on Windows it can be briefly locked, retry a few times
        import time
        for _ in range(5):
            try:
                if os.path.exists(tmp_db):
                    os.remove(tmp_db)
                break
            except PermissionError:
                time.sleep(0.1)

    return exit_code


if __name__ == '__main__':
    main()
