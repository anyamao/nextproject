// frontend/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "nextproject-frontend",
      script: "pnpm",
      args: "start -p 3010",
      cwd: "/home/vika/nextproject/frontend", // ✅ Абсолютный путь!
      env: {
        NODE_ENV: "production",
        PORT: 3010,
        NEXT_PUBLIC_API_URL: "https://maoschool.ru/api",
        NEXT_PUBLIC_BASE_URL: "https://maoschool.ru",
        // Заглушки для Supabase (чтобы сборка не падала):
        NEXT_PUBLIC_SUPABASE_URL: "https://dummy.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "dummy_key_12345678901234567890123456789012",
      },
      error_file: "/home/vika/nextproject/logs/frontend-error.log",
      out_file: "/home/vika/nextproject/logs/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      restart_delay: 2000,
      max_restarts: 10,
    },
  ],
};
