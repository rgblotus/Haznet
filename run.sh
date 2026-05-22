#!/bin/bash
# Simple run script for Haznet application
#
# Usage:
#   ./run.sh          # start backend with hot-reload (requires .env with SECRET_KEY)
#   ./run.sh frontend # start frontend dev server
#
# Setup (first time):
#   1. cd backend && cp .env.example .env && edit .env with credentials
#   2. source .venv/bin/activate && uv sync
#   3. cd ../frontend && npm install
#
# Backend hot-reload:
#   The --reload flag on uvicorn enables hot-reload on Python file changes.
#
# Frontend dev server (run separately in another terminal):
#   cd frontend && npm run dev

if [ "$1" = "frontend" ]; then
  echo "Starting Hazzle frontend..."
  cd frontend || exit 1
  npm run dev
  exit 0
fi

echo "Starting Hazzle backend..."
cd backend || exit 1
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000