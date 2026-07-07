# tests/test_auth.py

import pytest
from httpx import AsyncClient
import asyncio

class TestAuth:
    """Тесты для эндпоинтов авторизации (без rate limiting)"""
    
    async def test_register_success(self, client_no_rate_limit: AsyncClient, test_user_data):
        """Тест успешной регистрации"""
        response = await client_no_rate_limit.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == test_user_data["email"]
        assert data["user"]["username"] == test_user_data["username"]
    
    async def test_register_duplicate_email(self, client_no_rate_limit: AsyncClient, test_user_data):
        """Тест регистрации с существующим email"""
        # Первая регистрация
        await client_no_rate_limit.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        
        # Вторая регистрация с тем же email
        response = await client_no_rate_limit.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        
        assert response.status_code == 400
        assert "Registration failed" in response.json()["detail"]
    
    async def test_register_duplicate_username(self, client_no_rate_limit: AsyncClient, test_user_data):
        """Тест регистрации с существующим username"""
        # Первая регистрация
        await client_no_rate_limit.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        
        # Вторая регистрация с тем же username но другим email
        response = await client_no_rate_limit.post(
            "/api/v1/auth/register",
            json={
                "email": "another@example.com",
                "username": test_user_data["username"],
                "password": "Another123!@#"
            }
        )
        
        assert response.status_code == 400
        assert "Registration failed" in response.json()["detail"]
    
    async def test_register_weak_password(self, client_no_rate_limit: AsyncClient):
        """Тест регистрации со слабым паролем"""
        response = await client_no_rate_limit.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "12345"
            }
        )
        
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
    
    async def test_register_invalid_email(self, client_no_rate_limit: AsyncClient):
        """Тест регистрации с невалидным email"""
        response = await client_no_rate_limit.post(
            "/api/v1/auth/register",
            json={
                "email": "invalid-email",
                "username": "testuser",
                "password": "Test123!@#"
            }
        )
        
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
    
    async def test_login_success(self, client_no_rate_limit: AsyncClient, test_user_data):
        """Тест успешного входа"""
        # Сначала регистрируемся
        register_response = await client_no_rate_limit.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        
        assert register_response.status_code == 201
        
        # Потом входим
        login_response = await client_no_rate_limit.post(
            "/api/v1/auth/login",
            json={
                "email": test_user_data["email"],
                "password": test_user_data["password"]
            }
        )
        
        assert login_response.status_code == 200
        data = login_response.json()
        assert "access_token" in data
        assert data["user"]["email"] == test_user_data["email"]
    
    async def test_login_wrong_password(self, client_no_rate_limit: AsyncClient, test_user_data):
        """Тест входа с неправильным паролем"""
        # Сначала регистрируемся
        register_response = await client_no_rate_limit.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        
        assert register_response.status_code == 201
        
        # Потом входим с неправильным паролем
        response = await client_no_rate_limit.post(
            "/api/v1/auth/login",
            json={
                "email": test_user_data["email"],
                "password": "WrongPassword123!@#"
            }
        )
        
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
    
    async def test_logout_success(self, client_no_rate_limit: AsyncClient, test_user_data):
        """Тест выхода из системы"""
        # Сначала регистрируемся
        register_response = await client_no_rate_limit.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        
        assert register_response.status_code == 201
        
        # Потом выходим
        response = await client_no_rate_limit.post(
            "/api/v1/auth/logout"
        )
        
        assert response.status_code == 200
        assert response.json()["message"] == "Logged out"
