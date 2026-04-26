// backend/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "nextproject-api",
      script: "venv/bin/uvicorn",
      args: "main:app --host 127.0.0.1 --port 8010 --workers 2",
      cwd: "/home/vika/nextproject/backend",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        DEBUG: "false",
	DATABASE_URL: "sqlite:///./dementia.db",  // ✅ Проверь путь к БД
        ALLOWED_ORIGINS: "https://maoschool.ru,http://localhost:3010",
      },
      error_file: "/home/vika/nextproject/logs/api-error.log",
      out_file: "/home/vika/nextproject/logs/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      restart_delay: 2000,
      max_restarts: 10,
    },
  ],
};
