#!/bin/bash

# Exit on error
set -e

# Check if we're in the correct directory
if [ ! -f "requirements.txt" ]; then
    echo "Error: Please run this script from the backend directory"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt
pip install -r requirements.dev.txt

# Load environment variables if .env file exists
if [ -f ".env" ]; then
    echo "Loading environment variables from .env file..."
    export $(cat .env | xargs)
fi

# Start the local server
echo "Starting local server..."
python local_server.py

# Cleanup function
cleanup() {
    echo "Cleaning up..."
    deactivate
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM