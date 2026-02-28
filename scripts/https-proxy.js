#!/usr/bin/env node
/**
 * HTTPS reverse proxy for English Buddy.
 * Listens on HTTPS_PORT (default 3443), proxies to localhost:TARGET_PORT (default 3000).
 * Uses mkcert-generated certs from the certs/ directory.
 *
 * Run via PM2:
 *   pm2 start scripts/https-proxy.js --name english-buddy-https
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const HTTPS_PORT = parseInt(process.env.HTTPS_PORT ?? "3443", 10);
const TARGET_PORT = parseInt(process.env.TARGET_PORT ?? "3000", 10);
const TARGET_HOST = "127.0.0.1";

const certsDir = path.join(__dirname, "..", "certs");
const key = fs.readFileSync(path.join(certsDir, "key.pem"));
const cert = fs.readFileSync(path.join(certsDir, "cert.pem"));

const server = https.createServer({ key, cert }, (req, res) => {
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${TARGET_HOST}:${TARGET_PORT}`,
      "x-forwarded-proto": "https",
      "x-forwarded-for": req.socket.remoteAddress ?? "",
    },
  };

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxy.on("error", (err) => {
    console.error("[https-proxy] upstream error:", err.message);
    if (!res.headersSent) {
      res.writeHead(502);
    }
    res.end("Bad Gateway");
  });

  req.pipe(proxy, { end: true });
});

server.listen(HTTPS_PORT, "0.0.0.0", () => {
  console.log(
    `[https-proxy] Listening on https://0.0.0.0:${HTTPS_PORT} → http://${TARGET_HOST}:${TARGET_PORT}`
  );
});

server.on("error", (err) => {
  console.error("[https-proxy] server error:", err.message);
  process.exit(1);
});
