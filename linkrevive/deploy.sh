#!/bin/bash
# LinkRevive One-Command Deploy Script
# Usage: ./deploy.sh [vercel|railway|docker|all]

set -e

echo "🚀 LinkRevive Deployment Helper"
echo "================================"

MODE=${1:-docker}

if [ "$MODE" = "docker" ]; then
  echo "🐳 Building and running with Docker Compose..."
  docker compose up --build -d
  echo "✅ Deployed! Web: http://localhost:3000 | API: http://localhost:3001"
  echo "Run 'docker compose logs -f' to see logs"

elif [ "$MODE" = "vercel" ]; then
  echo "▲ Deploying Frontend to Vercel..."
  cd apps/web
  vercel --prod
  echo "✅ Frontend deployed!"

elif [ "$MODE" = "railway" ]; then
  echo "🚂 Deploying Backend to Railway..."
  railway up
  echo "✅ Backend deployed!"

elif [ "$MODE" = "all" ]; then
  echo "🌍 Full production deployment..."
  # Add your CI/CD commands here
  echo "Please configure Vercel + Railway tokens first."
else
  echo "Usage: ./deploy.sh [docker|vercel|railway|all]"
fi
