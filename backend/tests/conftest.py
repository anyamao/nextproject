# tests/conftest.py

import sys
from pathlib import Path

# Добавляем корневую папку в PYTHONPATH
root_dir = Path(__file__).parent.parent
sys.path.insert(0, str(root_dir))

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from typing import AsyncGenerator
import asyncio

# Импортируем приложение
from main import app
from api.v1.endpoints.auth import fake_users_db
from core.rate_limit import limiter

# 🔧 НЕ ОТКЛЮЧАЕМ rate limiting глобально!
# Будем управлять через фикстуры

@pytest.fixture(scope="session")
def event_loop():
    """Создает event loop для тестов"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="function")
async def client():
    """Тестовый клиент для API (с включенным rate limiting)"""
    # Убеждаемся, что rate limiting включен
    limiter.enabled = True
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    # После теста не выключаем, чтобы другие тесты тоже работали с rate limiting

@pytest_asyncio.fixture(scope="function")
async def client_no_rate_limit():
    """Тестовый клиент БЕЗ rate limiting (для быстрых тестов)"""
    # 🔧 Временно отключаем rate limiting
    limiter.enabled = False
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    # Включаем обратно для других тестов
    limiter.enabled = True

@pytest.fixture(autouse=True)
def clear_db():
    """Очистка fake БД перед каждым тестом"""
    fake_users_db.clear()
    yield
    fake_users_db.clear()
    # 🔧 Важно: всегда включаем rate limiting обратно
    limiter.enabled = True

@pytest.fixture
def test_user_data():
    return {
        "email": "test@example.com",
        "username": "testuser",
        "password": "Test123!@#",
    }

@pytest.fixture
def test_user_data2():
    return {
        "email": "test2@example.com",
        "username": "testuser2",
        "password": "Test123!@#456",
    }
