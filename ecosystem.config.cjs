module.exports = {
  apps: [
    {
      name: 'batlokoa-api',
      cwd: '/var/www/batlokoa/backend',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3016
      }
    }
  ]
};
