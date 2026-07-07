# core/logger.py

import logging
import sys
import json
from datetime import datetime
from typing import Optional, Dict, Any
from pathlib import Path
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler

from core.config import settings

# ====== КАСТОМНЫЙ ФОРМАТЕР ДЛЯ JSON ЛОГОВ ======


class JSONFormatter(logging.Formatter):
    """Форматирование логов в JSON для продакшена"""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Добавляем экстра поля если есть
        if hasattr(record, "extra"):
            log_data.update(record.extra)

        # Добавляем исключение если есть
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data, ensure_ascii=False)


# ====== НАСТРОЙКА ЛОГГЕРОВ ======


def setup_logging():
    """Настройка логирования для всего приложения"""

    # Создаем папку для логов если её нет
    if settings.LOG_FILE:
        log_dir = Path(settings.LOG_FILE).parent
        log_dir.mkdir(exist_ok=True)

    # Базовый формат для консоли (читаемый)
    console_format = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Формат для файлов (JSON в продакшене)
    if settings.ENVIRONMENT == "production":
        file_format = JSONFormatter()
    else:
        file_format = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s - %(filename)s:%(lineno)d",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    # Корневой логгер
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))

    # Очищаем существующие хендлеры
    root_logger.handlers.clear()

    # Консольный хендлер (всегда)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)
    console_handler.setFormatter(console_format)
    root_logger.addHandler(console_handler)

    # Файловый хендлер (если указан)
    if settings.LOG_FILE:
        # Ротация по размеру (10MB, 5 файлов)
        file_handler = RotatingFileHandler(
            settings.LOG_FILE,
            maxBytes=10_485_760,  # 10MB
            backupCount=5,
            encoding="utf-8",
        )
        file_handler.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)
        file_handler.setFormatter(file_format)
        root_logger.addHandler(file_handler)

    # Отдельный файл для security логов
    if settings.LOG_FILE:
        security_log_path = str(Path(settings.LOG_FILE).parent / "security.log")
        security_handler = RotatingFileHandler(
            security_log_path, maxBytes=10_485_760, backupCount=5, encoding="utf-8"
        )
        security_handler.setLevel(logging.INFO)
        security_handler.setFormatter(file_format)

        # Создаем отдельный логгер для безопасности
        security_logger = logging.getLogger("security")
        security_logger.setLevel(logging.INFO)
        security_logger.addHandler(security_handler)
        security_logger.propagate = False  # Не дублируем в корневой


# ====== ФУНКЦИИ ДЛЯ ЛОГИРОВАНИЯ ======


def get_logger(name: str) -> logging.Logger:
    """Получение логгера по имени"""
    return logging.getLogger(name)


def log_security_event(
    event_type: str,
    user_id: Optional[int] = None,
    email: Optional[str] = None,
    ip: Optional[str] = None,
    status: str = "success",
    details: Optional[Dict[str, Any]] = None,
):
    """Логирование событий безопасности"""
    security_logger = logging.getLogger("security")

    extra = {
        "event_type": event_type,
        "user_id": user_id,
        "email": email,
        "ip": ip,
        "status": status,
        "details": details or {},
        "timestamp": datetime.utcnow().isoformat(),
    }

    security_logger.info(
        f"Security event: {event_type} - {status}",
        extra={"extra": extra} if hasattr(security_logger, "extra") else {},
    )


# ====== ИНИЦИАЛИЗАЦИЯ ======

# Настраиваем логирование при импорте
setup_logging()

# Создаем основные логгеры
app_logger = get_logger("app")
db_logger = get_logger("database")
auth_logger = get_logger("auth")
api_logger = get_logger("api")

# ====== ДЕКОРАТОР ДЛЯ ЛОГИРОВАНИЯ ФУНКЦИЙ ======


def log_function_call(func):
    """Декоратор для логирования вызовов функций"""
    import functools

    @functools.wraps(func)
    async def async_wrapper(*args, **kwargs):
        logger = get_logger(func.__module__)
        logger.debug(f"Calling {func.__name__} with args={args}, kwargs={kwargs}")
        try:
            result = await func(*args, **kwargs)
            logger.debug(f"{func.__name__} completed successfully")
            return result
        except Exception as e:
            logger.error(f"{func.__name__} failed: {str(e)}", exc_info=True)
            raise

    @functools.wraps(func)
    def sync_wrapper(*args, **kwargs):
        logger = get_logger(func.__module__)
        logger.debug(f"Calling {func.__name__} with args={args}, kwargs={kwargs}")
        try:
            result = func(*args, **kwargs)
            logger.debug(f"{func.__name__} completed successfully")
            return result
        except Exception as e:
            logger.error(f"{func.__name__} failed: {str(e)}", exc_info=True)
            raise

    return async_wrapper if hasattr(func, "__call__") else sync_wrapper
