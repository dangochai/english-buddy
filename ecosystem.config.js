module.exports = {
  apps: [
    {
      name: "english-buddy",
      script: "node_modules/.bin/next",
      args: "start",
      // PM2 inherits cwd from where you run `pm2 start` — make sure you're
      // in the project root (e.g. ~/english-buddy) when running this.
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
      },
      watch: false,
      max_memory_restart: "500M",
      autorestart: true,
    },
  ],
};
