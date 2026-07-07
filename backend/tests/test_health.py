# tests/test_health.py

from httpx import AsyncClient


class TestHealth:
    """Тесты для health check"""

    async def test_health_endpoint(self, client: AsyncClient):
        """Тест health check"""
        response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "environment" in data
        assert "cors_origins" in data

    async def test_root_endpoint(self, client: AsyncClient):
        """Тест корневого эндпоинта"""
        response = await client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert data["name"] is not None
        assert "version" in data
