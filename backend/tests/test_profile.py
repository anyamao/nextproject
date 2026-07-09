# tests/test_profile.py

import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

from main import app
from core.redis import redis_client


class TestProfile:
    """Тесты для профиля"""

    @pytest.fixture(autouse=True)
    async def setup_redis(self):
        """Подготовка Redis для тестов"""
        await redis_client.connect()
        # Очищаем кеш перед каждым тестом
        await redis_client.delete_pattern("profile:*")
        yield
        await redis_client.delete_pattern("profile:*")

    async def test_get_public_profile_success(
        self, client: AsyncClient, test_user_data
    ):
        """Тест успешного получения публичного профиля"""
        # Регистрируем пользователя
        register = await client.post("/api/v1/auth/register", json=test_user_data)
        user_id = register.json()["user"]["id"]

        # Получаем профиль
        response = await client.get(f"/api/v1/profile/public/{user_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id
        assert data["username"] == test_user_data["username"]
        assert "completed_courses" in data

    async def test_get_public_profile_not_found(self, client: AsyncClient):
        """Тест получения несуществующего профиля"""
        response = await client.get("/api/v1/profile/public/99999")

        assert response.status_code == 404
        assert "User not found" in response.json()["detail"]

    async def test_get_achievements_success(self, client: AsyncClient, test_user_data):
        """Тест получения достижений"""
        # Регистрируем пользователя
        register = await client.post("/api/v1/auth/register", json=test_user_data)
        user_id = register.json()["user"]["id"]

        response = await client.get(f"/api/v1/profile/public/{user_id}/achievements")

        assert response.status_code == 200
        data = response.json()
        assert "tests_passed_75" in data
        assert "courses_completed_75" in data
        assert "items_purchased" in data
        assert "has_custom_avatar" in data

    async def test_get_courses_pagination(self, client: AsyncClient, test_user_data):
        """Тест пагинации курсов"""
        # Регистрируем пользователя
        register = await client.post("/api/v1/auth/register", json=test_user_data)
        user_id = register.json()["user"]["id"]

        response = await client.get(
            f"/api/v1/profile/public/{user_id}/courses", params={"page": 1, "limit": 5}
        )

        assert response.status_code == 200
        data = response.json()
        assert "courses" in data
        assert "total" in data
        assert "page" in data
        assert "total_pages" in data

    @patch("services.profile_service.redis_client.get")
    async def test_profile_cache(self, mock_get, client: AsyncClient, test_user_data):
        """Тест кеширования профиля"""
        # Настраиваем мок для кеша
        mock_get.return_value = None  # Кеш пуст

        # Регистрируем пользователя
        register = await client.post("/api/v1/auth/register", json=test_user_data)
        user_id = register.json()["user"]["id"]

        # Первый запрос - кеш пуст
        response1 = await client.get(f"/api/v1/profile/public/{user_id}")
        assert response1.status_code == 200

        # Второй запрос - должен быть из кеша
        mock_get.return_value = response1.json()
        response2 = await client.get(f"/api/v1/profile/public/{user_id}")
        assert response2.status_code == 200
        assert response2.json() == response1.json()


class TestProfileAuth:
    """Тесты для приватных эндпоинтов профиля"""

    async def test_get_my_achievements_unauthorized(self, client: AsyncClient):
        """Тест доступа без авторизации"""
        response = await client.get("/api/v1/profile/achievements")

        assert response.status_code == 401
        assert "Authentication required" in response.json()["detail"]

    async def test_get_my_achievements_authorized(
        self, client: AsyncClient, test_user_data
    ):
        """Тест доступа с авторизацией"""
        # Регистрируемся
        register = await client.post("/api/v1/auth/register", json=test_user_data)
        assert register.status_code == 201

        # Входим
        login = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user_data["email"],
                "password": test_user_data["password"],
            },
        )
        assert login.status_code == 200

        # Получаем достижения
        response = await client.get("/api/v1/profile/achievements")

        assert response.status_code == 200
        data = response.json()
        assert "tests_passed_75" in data
        assert "courses_completed_75" in data
