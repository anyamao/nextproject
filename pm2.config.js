// ~/nextproject/pm2.config.js
module.exports = {
  apps: [
    {
      name: "nextproject-backend",
      script: "./venv/bin/uvicorn",
      args: "main:app --host 0.0.0.0 --port 8010 --workers 4",
      cwd: "./backend",
      interpreter: "python3",
      env: {
        NODE_ENV: "production",
        DEBUG: "false",
      },
    },
    {
      name: "nextproject-frontend",
      script: "pnpm",
      args: "start -p 3010",
      cwd: "./frontend",
      env: {
        NODE_ENV: "production",
        PORT: 3010,
      },
    },
  ],
};
