#!/bin/bash

# Start the backend server

# Set the color for python logs to blue
export PYTHONLOG_COLORIZE=1
export PYTHONLOG_COLOR=32
cd type-faster-BE
echo "Starting backend server..."
source suggest-poc/bin/activate
python index.py &
BACKEND_PID=$!

echo "Waiting for backend server to start and accepting requests..."
while ! nc -z localhost 65432; do sleep 1; done

# Start the frontend app
cd ../type-faster-app
echo "Starting frontend app..."
npm run dev &
FRONTEND_PID=$!

# Function to stop both processes
function stop_processes {
  echo "Stopping frontend and backend..."
  kill $FRONTEND_PID
  kill $BACKEND_PID
  exit
}

# Trap SIGINT and SIGTERM to gracefully stop processes
trap stop_processes SIGINT SIGTERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

