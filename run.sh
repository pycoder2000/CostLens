#!/bin/bash

# Start the backend
echo "Starting backend..."
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python scripts/init_db.py
uvicorn app.main:app --reload &
BACKEND_PID=$!

# Start the frontend
echo "Starting frontend..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit
}

# Register the cleanup function for when the script is terminated
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 