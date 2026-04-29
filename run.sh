#!/usr/bin/env bash
# run.sh — Start both backend (FastAPI) and frontend (Vite) with one command
# Usage: ./run.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

# ── Detect the right Python (miniforge > conda > system) ─────────────────────
PYTHON=""
for candidate in \
    "$HOME/miniforge3/bin/python3" \
    "$HOME/miniconda3/bin/python3" \
    "$HOME/anaconda3/bin/python3" \
    "$(which python3 2>/dev/null)"; do
  if [ -x "$candidate" ]; then
    PYTHON="$candidate"
    break
  fi
done

if [ -z "$PYTHON" ]; then
  echo "❌  Could not find python3. Install miniforge or conda."
  exit 1
fi

UVICORN="$(dirname "$PYTHON")/uvicorn"
if [ ! -x "$UVICORN" ]; then
  echo "❌  uvicorn not found at $UVICORN"
  echo "   Run: $PYTHON -m pip install uvicorn fastapi transformers torch"
  exit 1
fi

echo ""
echo "🧠  Attention Visualizer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Python  : $PYTHON"
echo "   Uvicorn : $UVICORN"
echo ""

# ── Free ports if something is already using them ────────────────────────────
free_port() {
  local port=$1
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "⚠️  Freeing port $port (PIDs: $pids)"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 0.5
  fi
}
free_port 8000
free_port 5173

# ── Cleanup handler — kill both child processes on Ctrl+C ────────────────────
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "🛑  Shutting down…"
  [ -n "$BACKEND_PID"  ] && kill "$BACKEND_PID"  2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  echo "✅  All stopped. Bye!"
  exit 0
}
trap cleanup INT TERM

# ── Start FastAPI backend ─────────────────────────────────────────────────────
echo "🚀  Starting backend  →  http://localhost:8000"
(cd "$BACKEND" && "$UVICORN" main:app --host 0.0.0.0 --port 8000) &
BACKEND_PID=$!

# Give the backend a moment to start
sleep 2

# ── Install frontend deps if node_modules is missing ─────────────────────────
if [ ! -d "$FRONTEND/node_modules" ]; then
  echo "📦  Installing frontend npm packages…"
  (cd "$FRONTEND" && npm install --silent)
fi

# ── Start Vite dev server ─────────────────────────────────────────────────────
echo "🎨  Starting frontend  →  http://localhost:5173"
(cd "$FRONTEND" && npm run dev -- --port 5173) &
FRONTEND_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨  Both servers running!"
echo "   App      : http://localhost:5173"
echo "   API docs : http://localhost:8000/docs"
echo ""
echo "   Press Ctrl+C to stop everything."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Wait — exit if either server dies ────────────────────────────────────────
wait $BACKEND_PID $FRONTEND_PID
