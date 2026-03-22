module.exports = {
  apps: [{
    name: 'tubeforge',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    instances: 4,
    exec_mode: 'cluster',
    max_memory_restart: '512M',
    exp_backoff_restart_delay: 1000,
    max_restarts: 15,
    min_uptime: 5000,
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
