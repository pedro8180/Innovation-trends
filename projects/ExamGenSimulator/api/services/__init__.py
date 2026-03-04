"""Services package for exam generator simulator.

This module provides lazy accessors to avoid importing heavy third-party
libraries (like langchain) at package import time. Importing agent
factories is deferred until the factory functions are actually called,
which prevents startup-time ImportErrors when optional dependencies
are missing or have API changes.
"""

from typing import Any, Callable


def _lazy_import(path: str, name: str) -> Any:
    module = __import__(path, fromlist=[name])
    return getattr(module, name)


def create_question_generator_agent(*args, **kwargs):
    fn = _lazy_import('.question_generator_agent', 'create_question_generator_agent')
    return fn(*args, **kwargs)


def get_question_generator_agent(*args, **kwargs):
    fn = _lazy_import('.question_generator_agent', 'get_question_generator_agent')
    return fn(*args, **kwargs)


def QuestionGeneratorAgent(*args, **kwargs):
    cls = _lazy_import('.question_generator_agent', 'QuestionGeneratorAgent')
    return cls(*args, **kwargs)


def create_supervisor_agent(*args, **kwargs):
    fn = _lazy_import('.supervisor_agent', 'create_supervisor_agent')
    return fn(*args, **kwargs)


def get_supervisor_agent(*args, **kwargs):
    fn = _lazy_import('.supervisor_agent', 'get_supervisor_agent')
    return fn(*args, **kwargs)


def SupervisorAgent(*args, **kwargs):
    cls = _lazy_import('.supervisor_agent', 'SupervisorAgent')
    return cls(*args, **kwargs)


# Lightweight imports that are safe at module import time
from .chat_memory import ChatMemory
from .question_parser import parse_questions_from_text

__all__ = [
    'create_question_generator_agent',
    'get_question_generator_agent',
    'QuestionGeneratorAgent',
    'create_supervisor_agent',
    'get_supervisor_agent',
    'SupervisorAgent',
    'ChatMemory',
    'parse_questions_from_text',
]
