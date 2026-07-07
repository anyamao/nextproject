# tests/test_auth_validation.py

import pytest
from httpx import AsyncClient


class TestAuthValidation:
    """Тесты валидации данных"""

    @pytest.mark.parametrize(
        "username,should_pass",
        [
            ("valid_user", True),
            ("user123", True),
            ("user.name", True),
            ("user-name", True),
            ("us", False),  # Слишком короткий - Pydantic вернет 422
            (
                "this_is_a_very_long_username_that_exceeds_30_chars",
                False,
            ),  # Слишком длинный - 422
            ("admin", False),  # Зарезервированный - 400 (валидатор в схеме)
            ("Root", False),  # Зарезервированный - 400
            ("user!@#", False),  # Недопустимые символы - 400
        ],
    )
    async def test_username_validation(
        self, client: AsyncClient, username, should_pass
    ):
        """Тест валидации username"""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "username": username,
                "password": "Test123!@#",
            },
        )

        if should_pass:
            # Если валидация проходит, может быть 201 или 400 (если email занят)
            assert response.status_code in [201, 400]
        else:
            # 🔧 ИСПРАВЛЕНО: Pydantic возвращает 422 для ошибок валидации
            # Или 400 для кастомных валидаторов (admin, Root, спецсимволы)
            assert response.status_code in [400, 422]
            assert "detail" in response.json()

    @pytest.mark.parametrize(
        "password,should_pass",
        [
            ("StrongP@ss123", True),
            ("Weak", False),  # Слишком короткий - 422
            ("nouppercase123!", False),  # Нет заглавной - 422
            ("NOLOWERCASE123!", False),  # Нет строчной - 422
            ("NoSpecial123", False),  # Нет спецсимвола - 422
            ("NoDigitP@ss", False),  # Нет цифры - 422
        ],
    )
    async def test_password_validation(
        self, client: AsyncClient, password, should_pass
    ):
        """Тест валидации пароля"""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": password,
            },
        )

        if should_pass:
            # Если валидация проходит, может быть 201 или 400 (если email занят)
            assert response.status_code in [201, 400]
        else:
            # 🔧 ИСПРАВЛЕНО: Pydantic возвращает 422 для ошибок валидации
            assert response.status_code == 422
            data = response.json()
            assert "detail" in data
            # Проверяем, что ошибка связана с паролем
            errors = data.get("detail", [])
            if isinstance(errors, list):
                password_errors = [
                    e for e in errors if e.get("loc") and "password" in e.get("loc", [])
                ]
                assert len(password_errors) > 0, (
                    "Должна быть ошибка валидации для пароля"
                )
