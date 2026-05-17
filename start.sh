#!/bin/bash
# Start script for Hazzle application
# Runs both backend and frontend servers
# sudo docker start neo-pgadmin neo-postgres
echo "Starting Hazzle application..."

# Function to cleanup on exit
cleanup() {
    echo "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend server..."
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Give backend a moment to start
sleep 3

# Start frontend
echo "Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Backend running on http://localhost:8000"
echo "Frontend running on http://localhost:5173"
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID