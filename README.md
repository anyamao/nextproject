# ☆ MaoSchool — Платформа для обучения и подготовки к ЕГЭ

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **MaoSchool** — это современная образовательная платформа для изучения языков, программирования и подготовки к ЕГЭ. Проект объединяет интерактивные уроки, тесты с мгновенной проверкой, флеш-карточки для запоминания и систему отслеживания прогресса в единой экосистеме.

## ♡ Демонстрация работы
> 🎬 *Видео демонстрации будет добавлено скоро*
> 
> ![Demo Placeholder](https://via.placeholder.com/800x450/7c3aed/ffffff?text=MaoSchool+Demo+Video+Coming+Soon)

## 📌 Оглавление  	＼(٥⁀▽⁀ )／

- [О проекте](#-о-проекте)
- [Основные возможности](#-основные-возможности)
- [Архитектура и технологии](#️-архитектура-и-технологии)
- [Быстрый старт](#-быстрый-старт)
- [Вклад в проект](#-вклад-в-проект)
- [Лицензия](#-лицензия)

## О проекте

**MaoSchool** создан с целью сделать качественное образование доступным и увлекательным. В эпоху, когда знания устаревают быстро, важно иметь платформу, которая помогает учиться эффективно и с удовольствием.

MaoSchool объединяет всё необходимое для современного ученика:

- **Изучать новые предметы** через структурированные курсы с юнитами и уроками
- **Закреплять знания** с помощью тестов с мгновенной проверкой и развёрнутыми решениями
- **Запоминать надолго** благодаря флеш-карточкам с алгоритмом интервального повторения
- **Готовиться к ЕГЭ** с материалами, адаптированными под требования экзамена
- **Учиться в своём темпе** с возможностью возвращаться к сложным темам

## Основные возможности 	(ง ื▿ ื)ว

### 📚 Обучение (Learning)

| Модуль | Описание | Ключевые возможности |
|--------|----------|---------------------|
| **Курсы** | Структурированные учебные программы | Юниты с уроками, прогресс-бары, бейджи "Пройдено", навигация "Следующий урок" |
| **Уроки** | Интерактивный учебный контент | Текст с HTML-форматированием, оценка времени, счётчик просмотров, реакции |
| **Тесты** | Проверка знаний после каждого урока | Мгновенная проверка, подсказки, развёрнутые решения, проходной балл 75% |
| **Флеш-карточки** | Запоминание терминов и концепций | Переворот карточки, навигация ← →, интервальное повторение (в разработке) |


## Архитектура и технологии  	(⌒▽⌒)♡

### Frontend 
Next.js 14.x (App Router) + React 18 + TypeScript
- ├── UI: Tailwind CSS + Lucide Icons
- ├── State: React Hooks + localStorage (token, user)
- ├── HTTP: fetch API с интерцепторами для авторизации
- ├── Routing: файловая маршрутизация App Router
- └── Components: модульные клиентские компоненты

### Backend
FastAPI 0.115+ + SQLAlchemy 2.0 (async) + PostgreSQL
- ├── Auth: python-jose (JWT) + Passlib (bcrypt)
- ├── Security: httpOnly cookies + CORS middleware
- ├── Database: asyncpg + Alembic миграции
- ├── Validation: Pydantic V2 схемы
- └── API: RESTful эндпоинты с документацией OpenAPI

### Структура проекта

```
maoschool/
├── backend/                     # FastAPI бэкенд
│   ├── routers/             # API эндпоинты (auth, courses, tests, flashcards)
│   ├── models.py            # SQLAlchemy модели (User, EgeLesson, TestResult...)
│   ├── schemas.py           # Pydantic схемы для валидации
│   ├── crud.py              # CRUD операции с БД
│   ├── dependencies.py      # Зависимости (get_db, get_current_user)
│   ├── config.py            # Настройки окружения
│   ├── database.py          # Подключение к PostgreSQL
│   ├──  main.py              # Точка входа FastAPI
│   ├── alembic/                 # Миграции базы данных
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                    # Next.js фронтенд
│   ├── app/
│   │   ├── courses/             # Страницы курсов ([slug], [slug]/[lesson])
│   │   ├── articles/            # Страницы статей 
│   │   ├── tests/               # Интерфейс прохождения тестов
│   │   ├── layout.tsx           # Корневой layout с хедером
│   │   └── globals.css          # Глобальные стили Tailwind
│   ├── components/              # Переиспользуемые UI компоненты
│   │   ├── FlashcardSession.tsx # Модальное окно флеш-карточек
│   │   ├── LessonReactions.tsx  # Лайки и комментарии
│   │   └── ...
│   ├── lib/                     # Утилиты (apiFetch, format-date, test-return)
│   ├── store/                   # Управление состоянием (Zustand)
│   ├── public/                  # Статические файлы (изображения, иконки)
│   ├── package.json
│   └── next.config.js
│
└── README.md
```

## 🚀 Быстрый старт ☆ﾐ(o*･ω･) ﾉ

### Предварительные требования

```bash
Node.js 18+ и pnpm/npm
Python 3.12+ и PostgreSQL 15+
```

### Установка и запуск (локальная разработка)

#### 1. Клонирование репозитория
```bash
git clone https://github.com/anyamao/maoschool.git
cd maoschool
```

#### 2. Настройка бэкенда
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Создайте .env файл:
cp .env.example .env
# Заполните DATABASE_URL, SECRET_KEY и другие переменные

# Запуск сервера разработки
uvicorn app.main:app --reload --host 127.0.0.1 --port 8010
```
> 🎯 Бэкенд запустится на `http://localhost:8010`  
> 📚 Документация API: `http://localhost:8010/docs`

#### 3. Настройка фронтенда
```bash
cd ../frontend
pnpm install  # или npm install

# Создайте .env.local:
cp .env.example .env.local
# Укажите NEXT_PUBLIC_API_URL=http://localhost:8010

# Запуск дев-сервера
pnpm dev  # или npm run dev
```
> 🌐 Приложение будет доступно на `http://localhost:3010`

#### 4. Проверка установки
- ✅ Откройте `http://localhost:3010` в браузере
- ✅ Зарегистрируйте нового пользователя или войдите
- ✅ Перейдите в раздел "Курсы" → выберите урок → пройдите тест
- ✅ Убедитесь, что прогресс сохраняется и отображается

## 🤝 Вклад в проект (^_<)〜☆

Мы приветствуем любой вклад в развитие MaoSchool!

- 🐛 **Сообщайте об ошибках** через [Issues](https://github.com/anyamao/maoschool/issues)
- 💡 **Предлагайте новые функции** через обсуждение в Issues или напрямую через Pull Request
- ✏️ **Улучшайте документацию** — даже мелкие правки в README помогают новичкам
- 🎨 **Делитесь дизайном** — если у вас есть идеи по улучшению UI, создавайте макеты

### Процесс внесения изменений

1.  Форкните репозиторий
2.  Создайте ветку для вашей фичи: `git checkout -b feature/amazing-feature`
3.  Внесите изменения и закоммитьте: `git commit -m 'Add: amazing feature'`
4.  Отправьте в свой форк: `git push origin feature/amazing-feature`
5.  Откройте Pull Request с описанием изменений

### Планы по развитию (Roadmap)

- [ ] 📱 Мобильное приложение на React Native
- [ ] 🔔 Push-уведомления о новых уроках и повторении карточек
- [ ] 🌐 Мультиязычность (EN/RU/ES)
- [ ] 📊 Расширенная аналитика для преподавателей
- [ ] 🤝 Социальные функции: друзья, совместные курсы, лидерборды

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. Подробности в файле [LICENSE](LICENSE).

```
MIT License

Copyright (c) 2026 MaoSchool

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<div align="center">

### Сделано с ❤️ для тех, кто хочет учиться
<img height="300" alt="BLr1RhXSmQ_oDiy2TcDq_uMzRpMLevvY_KmQic8No-zIR8q7OmDjbOzxm--AUKX5Pjn1-A-wdg5bdXNqbQguDS4P" src="https://github.com/user-attachments/assets/906bcc3c-72ce-4dc9-9a6e-095d6ed838fd" />


</div>
