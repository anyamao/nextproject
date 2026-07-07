# tests/test_rate_limit.py

import pytest
from httpx import AsyncClient
import asyncio


class TestRateLimit:
    """Тесты для rate limiting (с включенным rate limiting)"""

    @pytest.fixture(autouse=True)
    def reset_rate_limiter(self):
        """Сбрасываем rate limiting перед каждым тестом"""
        from core.rate_limit import limiter

        # 🔧 Сбрасываем состояние rate limiter
        if hasattr(limiter, "_storage"):
            # Очищаем in-memory storage
            limiter._storage.reset()
        # Включаем rate limiting
        limiter.enabled = True
        yield
        # После теста не выключаем

    async def test_register_rate_limit(self, client: AsyncClient):
        """Тест rate limiting для регистрации"""
        from core.rate_limit import limiter

        limiter.enabled = True

        # Делаем 6 запросов подряд (лимит 5 в минуту)
        responses = []
        for i in range(6):
            response = await client.post(
                "/api/v1/auth/register",
                json={
                    "email": f"test_reg_{i}@example.com",
                    "username": f"testuser_reg_{i}",
                    "password": "Test123!@#",
                },
            )
            responses.append(response)
            await asyncio.sleep(0.05)

        # Проверяем, что есть 429
        statuses = [r.status_code for r in responses]
        assert 429 in statuses, f"Rate limit не сработал. Статусы: {statuses}"
        assert responses[5].status_code == 429, "6-й запрос должен быть 429"

    async def test_login_rate_limit(self, client: AsyncClient, test_user_data):
        """Тест rate limiting для входа"""
        from core.rate_limit import limiter

        limiter.enabled = True

        # 🔧 ИСПРАВЛЕНО: Используем уникальные данные для этого теста
        unique_email = f"login_test_{id(self)}@example.com"
        unique_username = f"loginuser_{id(self)}"

        user_data = {
            "email": unique_email,
            "username": unique_username,
            "password": "Test123!@#",
        }

        # Сначала регистрируемся
        register_response = await client.post("/api/v1/auth/register", json=user_data)

        # Если регистрация не удалась из-за rate limit, ждем
        if register_response.status_code == 429:
            await asyncio.sleep(1.0)
            register_response = await client.post(
                "/api/v1/auth/register", json=user_data
            )

        # Если все еще 429, значит лимит действительно достигнут
        if register_response.status_code == 429:
            pytest.skip("Rate limit достигнут, пропускаем тест")

        assert register_response.status_code == 201, (
            f"Registration failed: {register_response.status_code}"
        )

        # Делаем 11 запросов (лимит 10 в минуту)
        responses = []
        for i in range(11):
            response = await client.post(
                "/api/v1/auth/login",
                json={
                    "email": unique_email,
                    "password": "WrongPassword123!@#",  # Всегда неправильный
                },
            )
            responses.append(response)
            await asyncio.sleep(0.05)

        # Должен быть 429
        statuses = [r.status_code for r in responses]
        assert 429 in statuses, (
            f"Rate limit для логина не сработал. Статусы: {statuses}"
        )
        # 11-й запрос должен быть 429
        assert responses[10].status_code == 429, "11-й запрос должен быть 429"
