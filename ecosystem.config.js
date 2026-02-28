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
    {
      name: "english-buddy-https",
      script: "scripts/https-proxy.js",
      env: {
        NODE_ENV: "production",
        HTTPS_PORT: "3443",
        TARGET_PORT: "3000",
      },
      watch: false,
      autorestart: true,
    },
  ],
};
