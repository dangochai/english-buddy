module.exports = {
  apps: [
    {
      name: "english-buddy",
      // Use the actual Next.js Node.js entry point (not the pnpm shell shim)
      script: "node_modules/next/dist/bin/next",
      args: "start",
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
