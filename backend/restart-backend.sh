#!/bin/bash

# Script to restart backend server
echo "Checking for running backend server..."

# Check if backend is running on port 1337 or 1338
BACKEND_PID=$(lsof -ti:1337 -ti:1338 | head -1)

if [ ! -z "$BACKEND_PID" ]; then
  echo "Found backend process: $BACKEND_PID"
  echo "Killing process..."
  kill $BACKEND_PID
  sleep 2
  
  # Force kill if still running
  if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo "Force killing process..."
    kill -9 $BACKEND_PID
    sleep 1
  fi
  
  echo "✅ Backend stopped"
else
  echo "No backend server found running"
fi

echo ""
echo "Starting backend server..."
cd "$(dirname "$0")"
npm run dev

