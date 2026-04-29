#!/usr/bin/env bash
# start.sh — One-shot launcher for Attention Visualizer
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

echo ""
echo "🧠  Attention Visualizer — Setup & Launch"
echo "════════════════════════════════════════"

# ── Backend ────────────────────────────────────────────────────────────────
echo ""
echo "📦  Installing backend dependencies…"
pip install -q -r "$BACKEND/requirements.txt"
echo "✅  Backend deps installed."

# ── Frontend ───────────────────────────────────────────────────────────────
echo ""
echo "📦  Installing frontend dependencies…"
cd "$FRONTEND"
npm install --silent
echo "✅  Frontend deps installed."

# ── Start FastAPI backend ──────────────────────────────────────────────────
echo ""
echo "🚀  Starting FastAPI backend on http://localhost:8000 …"
cd "$BACKEND"
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# ── Start Vite dev server ──────────────────────────────────────────────────
echo ""
echo "🎨  Starting Vite dev server on http://localhost:5173 …"
cd "$FRONTEND"
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "════════════════════════════════════════"
echo "✨  App running!"
echo "   Frontend: http://localhost:5173"
echo "   API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."
echo "════════════════════════════════════════"

# Wait for either process to exit
wait $BACKEND_PID $FRONTEND_PID
