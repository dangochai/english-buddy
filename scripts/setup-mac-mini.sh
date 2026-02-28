#!/bin/bash
# EnglishBuddy — Mac Mini setup script
# Run once from the project root after copying the project to Mac Mini.
#
# Prerequisites:
#   brew install node pnpm
#   npm install -g pm2

set -e

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🔨 Building production bundle..."
pnpm run build

echo "🚀 Starting with PM2..."
pm2 start ecosystem.config.js

echo "💾 Saving PM2 process list..."
pm2 save

echo ""
echo "✅ Done!"
echo ""
echo "   Access from any device on the same network:"
echo "   http://$(ipconfig getifaddr en0 2>/dev/null || echo '<mac-mini-ip>'):3000"
echo ""
echo "   To auto-start on boot, run the command printed by:"
echo "   pm2 startup"
echo ""
echo "   Useful PM2 commands:"
echo "   pm2 status              — check app status"
echo "   pm2 logs english-buddy  — view logs"
echo "   pm2 restart english-buddy"
echo "   pm2 stop english-buddy"
