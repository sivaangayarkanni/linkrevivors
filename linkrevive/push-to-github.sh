#!/bin/bash
# ================================================
# LinkRevivors - One-Command GitHub Push Script
# ================================================

echo "🚀 Pushing LinkRevivors to GitHub..."
echo ""

# Check if already a git repo
if [ -d .git ]; then
  echo "✅ Git repo already initialized"
else
  echo "📦 Initializing git repository..."
  git init
  git branch -M main
fi

# Add all files
git add .

# Commit
echo "📝 Committing changes..."
git commit -m "🚀 Initial commit - LinkRevivors v1.0.0 (Full Production App)

- Complete Next.js + Fastify monorepo
- AI-powered link revival (Wayback + Google + OpenAI)
- BullMQ bulk scanner
- Chrome Extension (MV3)
- Docker + Railway + Vercel ready
- Full deployment playbook included"

# Set remote
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/sivaangayarkanni/linkrevivors.git

echo ""
echo "📤 Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Successfully pushed to https://github.com/sivaangayarkanni/linkrevivors.git"
echo ""
echo "Next steps:"
echo "1. Go to Vercel → Import this repo (Root: apps/web)"
echo "2. Go to Railway → Deploy from GitHub (apps/api + Postgres + Redis)"
echo ""
echo "🎉 Your LinkRevivors is live!"
