# models/user.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, func
from sqlalchemy.dialects.postgresql import TIMESTAMP
from core.database import Base


class User(Base):
    """Модель пользователя"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Статусы
    is_active = Column(Boolean, default=True, server_default="true")
    is_verified = Column(Boolean, default=False, server_default="false")

    # Временные метки
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Профиль
    avatar_url = Column(String(500), nullable=True)
    status = Column(String(200), nullable=True)
    about_me = Column(Text, nullable=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)

    # Токены и баланс
    token_balance = Column(Integer, nullable=False, default=0, server_default="0")
    equipped_item_id = Column(Integer, nullable=True)

    # 🔥 ДОБАВЛЯЕМ НЕДОСТАЮЩИЕ ПОЛЯ
    registration_ip = Column(String(45), nullable=True)
    last_login = Column(TIMESTAMP(timezone=True), nullable=True)
    email_verified_at = Column(TIMESTAMP(timezone=True), nullable=True)
    verification_token = Column(String(255), nullable=True)

    def __repr__(self) -> str:
        return f"<User {self.username} ({self.email})>"

    def to_dict(self) -> dict:
        """Конвертация в словарь"""
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "avatar_url": self.avatar_url,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "token_balance": self.token_balance,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "status": self.status,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "registration_ip": self.registration_ip,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }
