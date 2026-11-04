#!/bin/bash
# Net GUI One-Click Fullstack Launch Script
# Starts Django 5.1 ASGI Backend (:8000/:8001) + Vite React UI (:5173)

echo "=========================================================="
echo "   ⚡ Net GUI Core Suite - Radar & Dev Orchestrator       "
echo "=========================================================="

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/backend" && pwd)"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Setup Backend Python Virtualenv if needed
if [ ! -d "$BACKEND_DIR/venv" ]; then
    echo "📦 Initializing Python virtual environment in backend/venv..."
    python3 -m venv "$BACKEND_DIR/venv"
    "$BACKEND_DIR/venv/bin/pip" install --upgrade pip
    "$BACKEND_DIR/venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt"
fi

# 2. Run Database Migrations
echo "🔄 Checking database migrations..."
"$BACKEND_DIR/venv/bin/python" "$BACKEND_DIR/manage.py" migrate --noinput

# 3. Detect free port for Django ASGI (Default 8000, fallback 8001)
BACKEND_PORT=8000
if lsof -iTCP:$BACKEND_PORT -sTCP:LISTEN -P -n >/dev/null 2>&1; then
    echo "⚠️  Port 8000 is occupied; falling back to 8001 for Net GUI Backend."
    BACKEND_PORT=8001
fi

# 4. Check Frontend Dependencies
if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm --prefix "$ROOT_DIR/frontend" install
fi

# 5. Trap signals to terminate both servers on Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Shutting down Net GUI services..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo "🚀 Starting Django ASGI Backend at http://127.0.0.1:$BACKEND_PORT..."
export PYTHONPATH="$BACKEND_DIR"
"$BACKEND_DIR/venv/bin/daphne" -b 0.0.0.0 -p $BACKEND_PORT config.asgi:application &
BACKEND_PID=$!

echo "🚀 Starting Vite UI at http://localhost:5173..."
npm --prefix "$ROOT_DIR/frontend" run dev &
FRONTEND_PID=$!

echo "=========================================================="
echo "  ✅ Net GUI is live!"
echo "     • Backend API:      http://127.0.0.1:$BACKEND_PORT/api/health/"
echo "     • OpenAPI Docs:     http://127.0.0.1:$BACKEND_PORT/api/docs/"
echo "     • Frontend UI:      http://localhost:5173/"
echo "=========================================================="

wait
