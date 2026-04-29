#!/bin/bash
# ================================================
# LinkRevivors - One Command Commit & Push
# ================================================

echo "🚀 Committing and pushing changes to GitHub..."

# Check if this is a git repo
if [ ! -d .git ]; then
  echo "📦 Initializing new git repository..."
  git init
  git branch -M main
  git remote add origin https://github.com/sivaangayarkanni/linkrevivors.git
fi

# Add all changes
git add .

# Commit with timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
git commit -m "chore: Update LinkRevivors ($TIMESTAMP)

- Docker build fixes (--no-frozen-lockfile)
- Added fastify-plugin dependency
- Improved monorepo Dockerfiles
- Added pnpm-workspace.yaml"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main 2>/dev/null || git push

echo ""
echo "✅ Successfully pushed to https://github.com/sivaangayarkanni/linkrevivors.git"
echo ""
echo "Next: Go to Vercel and Railway → they will auto-deploy the new changes!"
