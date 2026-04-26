module.exports = {
  apps: [{
    name: 'nextproject-frontend',
    script: 'pnpm',
    args: 'start',
    cwd: '/home/vika/nextproject/frontend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 8010
    },
    error_file: '/var/log/nextproject/frontend-error.log',
    out_file: '/var/log/nextproject/frontend-out.log',
    merge_logs: true
  }]
}
