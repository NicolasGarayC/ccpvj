module.exports = {
  apps: [
    {
      name: 'centro-cultural-backend',
      cwd: '/home/user/ccpvj/Back',
      script: '/usr/bin/bash',
      args: '-c "dotnet bin/Release/net8.0/Back.dll"',
      interpreter: 'none',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        ASPNETCORE_ENVIRONMENT: 'Production',
        ASPNETCORE_URLS: 'http://0.0.0.0:5251'
      },
      error_file: '/home/user/.pm2/logs/centro-cultural-backend-error.log',
      out_file: '/home/user/.pm2/logs/centro-cultural-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'centro-cultural-frontend',
      cwd: '/home/user/ccpvj/Front',
      script: './build/server/index.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      error_file: '/home/user/.pm2/logs/centro-cultural-frontend-error.log',
      out_file: '/home/user/.pm2/logs/centro-cultural-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
